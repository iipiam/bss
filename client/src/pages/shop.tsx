import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBusinessType } from "@/hooks/useBusinessType";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSalarySchema, insertShopBillSchema, type Salary, type ShopBill } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, DollarSign, FileText, Search, Sparkles, Upload, Download, FolderOpen, Eye, X, RefreshCw, CheckCircle2, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";

const createSalaryFormSchema = (t: any) => z.object({
  employeeName: z.string().min(1, t.employeeNameRequired),
  position: z.string().min(1, t.positionRequired),
  amount: z.coerce.number().min(0.01, t.amountMustBeGreaterThanZero),
  paymentDate: z.string().min(1, t.paymentDateRequired),
  status: z.enum(["pending", "paid"]).default("pending"),
  notes: z.string().optional(),
  branchId: z.string().optional(),
});

const createBillFormSchema = (t: any) => z.object({
  billType: z.string().min(1, t.billTypeRequired),
  amount: z.coerce.number().min(0.01, t.amountMustBeGreaterThanZero),
  paymentDate: z.string().min(1, t.paymentDateRequired),
  paymentPeriod: z.enum(["oneTime", "weekly", "monthly", "quarterly", "semi-annually", "yearly"]).default("monthly"),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
  description: z.string().optional(),
  branchId: z.string().optional(),
});

export default function Shop() {
  const { t, isRTL } = useLanguage();
  const { labels } = useBusinessType();
  const { toast } = useToast();
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editingBill, setEditingBill] = useState<ShopBill | null>(null);
  const [salarySearch, setSalarySearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("all");
  const [billSortOrder, setBillSortOrder] = useState("newest");
  const [generateSalariesDialogOpen, setGenerateSalariesDialogOpen] = useState(false);
  const [settleSalaryTarget, setSettleSalaryTarget] = useState<Salary | null>(null);
  const [settleInvoiceFile, setSettleInvoiceFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: salaries, isLoading: salariesLoading } = useQuery<Salary[]>({
    queryKey: ["/api/shop/salaries"],
  });

  const { data: bills, isLoading: billsLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
  });

  interface ShopFile {
    id: string;
    fileType: string;
    fileName: string;
    fileSize: number;
    createdAt: string;
  }

  const { data: shopFiles, isLoading: filesLoading } = useQuery<ShopFile[]>({
    queryKey: ["/api/shop/files"],
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);
      const response = await fetch("/api/shop/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/files"] });
      toast({ title: t.fileUploaded });
    },
    onError: () => {
      toast({ title: t.fileUploadError, variant: "destructive" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/shop/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/files"] });
      toast({ title: t.fileDeleted });
    },
    onError: () => {
      toast({ title: t.fileDeleteError, variant: "destructive" });
    },
  });

  const handleFileUpload = (fileType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: t.pdfFilesOnly, variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t.pdfFilesOnly, variant: "destructive" });
        return;
      }
      uploadFileMutation.mutate({ file, fileType });
    }
    event.target.value = "";
  };

  const handleFileDrop = (fileType: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: t.pdfFilesOnly, variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t.pdfFilesOnly, variant: "destructive" });
        return;
      }
      uploadFileMutation.mutate({ file, fileType });
    }
  };

  const handleDownloadFile = (id: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = `/api/shop/files/${id}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileTypes = [
    { type: "cr_certificate", label: t.crCertificate },
    { type: "vat_certificate", label: t.vatCertificate },
    { type: "iban_certificate", label: t.ibanCertificate },
    { type: "national_address", label: t.nationalAddress },
  ];

  const getFileByType = (fileType: string) => {
    return shopFiles?.find((f) => f.fileType === fileType);
  };

  const salaryFormSchema = createSalaryFormSchema(t);
  const billFormSchema = createBillFormSchema(t);

  const salaryForm = useForm<z.infer<typeof salaryFormSchema>>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      employeeName: "",
      position: "",
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      status: "pending",
      notes: "",
    },
  });

  const billForm = useForm<z.infer<typeof billFormSchema>>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      billType: "rent",
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentPeriod: "monthly",
      status: "pending",
      description: "",
    },
  });

  const createSalaryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof salaryFormSchema>) => {
      const payload: any = {
        employeeName: data.employeeName,
        position: data.position,
        amount: typeof data.amount === 'number' ? data.amount.toFixed(2) : parseFloat(data.amount).toFixed(2),
        paymentDate: new Date(data.paymentDate).toISOString(),
        status: data.status,
      };
      if (data.notes && data.notes.trim()) {
        payload.notes = data.notes;
      }
      if (data.branchId && data.branchId.trim() !== "") {
        payload.branchId = data.branchId;
      }
      return await apiRequest("POST", "/api/shop/salaries", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/salaries"] });
      setSalaryDialogOpen(false);
      salaryForm.reset();
      toast({ title: t.salaryAdded });
    },
    onError: () => {
      toast({ title: t.salaryError, variant: "destructive" });
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof salaryFormSchema>> }) => {
      const payload = data.paymentDate
        ? { ...data, paymentDate: new Date(data.paymentDate).toISOString() }
        : data;
      return await apiRequest("PATCH", `/api/shop/salaries/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/salaries"] });
      setSalaryDialogOpen(false);
      setEditingSalary(null);
      salaryForm.reset();
      toast({ title: t.salaryUpdated });
    },
    onError: () => {
      toast({ title: t.salaryError, variant: "destructive" });
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/shop/salaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/salaries"] });
      toast({ title: t.salaryDeleted });
    },
    onError: () => {
      toast({ title: t.salaryError, variant: "destructive" });
    },
  });

  const settleSalaryMutation = useMutation({
    mutationFn: async ({ salaryId, file }: { salaryId: string; file: File | null }) => {
      const formData = new FormData();
      if (file) {
        formData.append("invoice", file);
      }
      const response = await fetch(`/api/shop/salaries/${salaryId}/settle`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Settlement failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/salaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      setSettleSalaryTarget(null);
      setSettleInvoiceFile(null);
      toast({
        title: isRTL ? "تمت تسوية الراتب" : "Salary settled",
        description: isRTL ? "تم وضع الراتب كمدفوع وإضافته إلى الفواتير المدفوعة." : "Salary marked as paid and added to paid bills.",
      });
    },
    onError: () => {
      toast({ title: isRTL ? "فشلت تسوية الراتب" : "Failed to settle salary", variant: "destructive" });
    },
  });

  const syncSalariesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/shop/salaries/sync", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/salaries"] });
      toast({ 
        title: t.salariesSynced || "Salaries synced",
        description: `${data.created} created, ${data.updated} updated`
      });
    },
    onError: () => {
      toast({ title: t.salaryError, variant: "destructive" });
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: z.infer<typeof billFormSchema>) => {
      const payload: any = {
        billType: data.billType,
        amount: typeof data.amount === 'number' ? data.amount.toFixed(2) : parseFloat(data.amount).toFixed(2),
        paymentDate: new Date(data.paymentDate).toISOString(),
        paymentPeriod: data.paymentPeriod,
        status: data.status,
      };
      if (data.description && data.description.trim()) {
        payload.description = data.description;
      }
      if (data.branchId && data.branchId.trim() !== "") {
        payload.branchId = data.branchId;
      }
      return await apiRequest("POST", "/api/shop/bills", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      setBillDialogOpen(false);
      billForm.reset();
      toast({ title: t.billAdded });
    },
    onError: () => {
      toast({ title: t.billError, variant: "destructive" });
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof billFormSchema>> }) => {
      const payload = data.paymentDate
        ? { ...data, paymentDate: new Date(data.paymentDate).toISOString() }
        : data;
      return await apiRequest("PATCH", `/api/shop/bills/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      setBillDialogOpen(false);
      setEditingBill(null);
      billForm.reset();
      toast({ title: t.billUpdated });
    },
    onError: () => {
      toast({ title: t.billError, variant: "destructive" });
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/shop/bills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.billDeleted });
    },
    onError: () => {
      toast({ title: t.billError, variant: "destructive" });
    },
  });

  const generateSalariesMutation = useMutation<{ created: number; skipped: number }, Error, string>({
    mutationFn: async (paymentMonth: string) => {
      const response = await apiRequest("POST", "/api/shop/bills/generate-salaries", { paymentMonth });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      setGenerateSalariesDialogOpen(false);
      toast({ 
        title: t.salaryBillsGenerated,
        description: data.skipped > 0 ? `${data.skipped} ${t.employeesSkipped}` : undefined,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: t.failedToGenerateSalaryBills,
        description: error.message || t.anErrorOccurred,
        variant: "destructive" 
      });
    },
  });

  const uploadBillInvoiceMutation = useMutation({
    mutationFn: async ({ billId, file }: { billId: string; file: File }) => {
      const formData = new FormData();
      formData.append("invoice", file);
      const response = await fetch(`/api/shop/bills/${billId}/invoice`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.invoiceUploaded || "Invoice uploaded" });
    },
    onError: () => {
      toast({ title: t.invoiceUploadError || "Failed to upload invoice", variant: "destructive" });
    },
  });

  const deleteBillInvoiceMutation = useMutation({
    mutationFn: async (billId: string) => {
      return await apiRequest("DELETE", `/api/shop/bills/${billId}/invoice`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.invoiceDeleted || "Invoice deleted" });
    },
    onError: () => {
      toast({ title: t.invoiceDeleteError || "Failed to delete invoice", variant: "destructive" });
    },
  });

  const handleSalarySubmit = (data: z.infer<typeof salaryFormSchema>) => {
    if (editingSalary) {
      updateSalaryMutation.mutate({ id: editingSalary.id, data });
    } else {
      createSalaryMutation.mutate(data);
    }
  };

  const handleBillSubmit = (data: z.infer<typeof billFormSchema>) => {
    if (editingBill) {
      updateBillMutation.mutate({ id: editingBill.id, data });
    } else {
      createBillMutation.mutate(data);
    }
  };

  const handleEditSalary = (salary: Salary) => {
    setEditingSalary(salary);
    salaryForm.reset({
      employeeName: salary.employeeName,
      position: salary.position,
      amount: parseFloat(salary.amount),
      paymentDate: salary.paymentDate ? new Date(salary.paymentDate).toISOString().split("T")[0] : "",
      status: salary.status as "pending" | "paid",
      notes: salary.notes || "",
    });
    setSalaryDialogOpen(true);
  };

  const handleEditBill = (bill: ShopBill) => {
    setEditingBill(bill);
    billForm.reset({
      billType: bill.billType,
      amount: parseFloat(bill.amount),
      paymentDate: bill.paymentDate ? new Date(bill.paymentDate).toISOString().split("T")[0] : "",
      paymentPeriod: bill.paymentPeriod as "weekly" | "monthly" | "quarterly" | "semi-annually" | "yearly",
      status: bill.status as "pending" | "paid" | "overdue",
      description: bill.description || "",
    });
    setBillDialogOpen(true);
  };

  const handleCloseSalaryDialog = () => {
    setSalaryDialogOpen(false);
    setEditingSalary(null);
    salaryForm.reset();
  };

  const handleCloseBillDialog = () => {
    setBillDialogOpen(false);
    setEditingBill(null);
    billForm.reset();
  };

  const filteredSalaries = salaries?.filter((salary) => {
    const searchLower = salarySearch.toLowerCase();
    return (
      salary.employeeName.toLowerCase().includes(searchLower) ||
      salary.position.toLowerCase().includes(searchLower)
    );
  });

  const filteredBills = bills?.filter((bill) => {
    const searchLower = billSearch.toLowerCase();
    const matchesSearch = (
      bill.billType.toLowerCase().includes(searchLower) ||
      (bill.description && bill.description.toLowerCase().includes(searchLower))
    );
    const matchesStatus = billStatusFilter === "all" ||
      (billStatusFilter === "unpaid" ? bill.status !== "paid" : bill.status === billStatusFilter);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.paymentDate || b.createdAt || 0).getTime();
    switch (billSortOrder) {
      case "oldest":
        return dateA - dateB;
      case "paidFirst":
        return (a.status === "paid" ? 0 : 1) - (b.status === "paid" ? 0 : 1) || dateB - dateA;
      case "unpaidFirst":
        return (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0) || dateB - dateA;
      default:
        return dateB - dateA;
    }
  });

  const totalSalaries = salaries?.reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;
  const paidSalaries = salaries?.filter((s) => s.status === "paid").reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;
  const pendingSalaries = totalSalaries - paidSalaries;

  const totalBills = bills?.reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0;
  const paidBills = bills?.filter((b) => b.status === "paid").reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0;
  const pendingBills = totalBills - paidBills;

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-shop">{labels.shop}</h1>
          <p className="text-muted-foreground" data-testid="text-shop-description">{t.shopDescription}</p>
        </div>
      </div>

      <Tabs defaultValue="salaries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="salaries" data-testid="tab-salaries">
            <DollarSign className="w-4 h-4 mr-2" />
            {t.salaries}
          </TabsTrigger>
          <TabsTrigger value="bills" data-testid="tab-bills">
            <FileText className="w-4 h-4 mr-2" />
            {t.shopBills}
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">
            <FolderOpen className="w-4 h-4 mr-2" />
            {t.shopFiles}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salaries" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalSalaries}<InfoTip>{isRTL ? "إجمالي جميع رواتب الموظفين." : "Sum of all employee salaries."}</InfoTip></CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-salaries">{totalSalaries.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidSalaries}<InfoTip>{isRTL ? "إجمالي الرواتب المدفوعة بالفعل." : "Salaries already paid out."}</InfoTip></CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-paid-salaries">{paidSalaries.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingSalaries}<InfoTip>{isRTL ? "الرواتب التي لم تُدفع بعد." : "Salaries not yet paid."}</InfoTip></CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-salaries">{pendingSalaries.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>{t.employeeSalaries}</CardTitle>
                  <CardDescription>{t.manageSalaries}</CardDescription>
                </div>
                <Button 
                  onClick={() => syncSalariesMutation.mutate()} 
                  disabled={syncSalariesMutation.isPending}
                  data-testid="button-sync-salaries"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncSalariesMutation.isPending ? 'animate-spin' : ''}`} />
                  {t.syncSalaries || "Sync Salaries"}
                </Button>
                <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                  <DialogTrigger asChild className="hidden">
                    <Button onClick={() => setEditingSalary(null)} data-testid="button-add-salary">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addSalary}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSalary ? t.editSalary : t.addSalary}</DialogTitle>
                      <DialogDescription>{t.salaryFormDescription}</DialogDescription>
                    </DialogHeader>
                    <Form {...salaryForm}>
                      <form onSubmit={salaryForm.handleSubmit(handleSalarySubmit)} className="space-y-4">
                        <FormField
                          control={salaryForm.control}
                          name="employeeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.employeeName}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-employee-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salaryForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.position}<InfoTip>{isRTL ? "المسمى الوظيفي للموظف." : "Employee's job title."}</InfoTip></FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-position" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salaryForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.monthlySalary}<InfoTip>{isRTL ? "مبلغ الراتب الشهري بالعملة الافتراضية." : "Monthly salary amount in default currency."}</InfoTip></FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} data-testid="input-monthly-salary" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salaryForm.control}
                          name="paymentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.paymentDate}<InfoTip>{isRTL ? "التاريخ المستحق لدفع الراتب." : "Date the salary is due to be paid."}</InfoTip></FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-payment-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salaryForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.status}<InfoTip>{isRTL ? "حالة الدفع الحالية لهذا الراتب." : "Current payment status of this salary."}</InfoTip></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-salary-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">{t.pending}</SelectItem>
                                  <SelectItem value="paid">{t.paid}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salaryForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.notes}<InfoTip>{isRTL ? "ملاحظات داخلية اختيارية." : "Optional internal notes."}</InfoTip></FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="input-salary-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={handleCloseSalaryDialog} data-testid="button-cancel-salary">
                            {t.cancel}
                          </Button>
                          <Button type="submit" disabled={createSalaryMutation.isPending || updateSalaryMutation.isPending} data-testid="button-save-salary">
                            {createSalaryMutation.isPending || updateSalaryMutation.isPending ? t.saving : t.save}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchSalaries}
                    value={salarySearch}
                    onChange={(e) => setSalarySearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-salaries"
                  />
                </div>
              </div>
              {salariesLoading ? (
                <div className="text-center py-8" data-testid="loading-salaries">{t.loading}</div>
              ) : filteredSalaries && filteredSalaries.length > 0 ? (
                <div className="space-y-2">
                  {filteredSalaries.map((salary) => (
                    <div key={salary.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate" data-testid={`salary-item-${salary.id}`}>
                      <div className="flex-1">
                        <div className="font-medium" data-testid={`text-salary-name-${salary.id}`}>{salary.employeeName}</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-salary-position-${salary.id}`}>{salary.position}</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-salary-date-${salary.id}`}>
                          {salary.paymentDate && format(new Date(salary.paymentDate), "dd MMM yyyy")}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-bold" data-testid={`text-salary-amount-${salary.id}`}>{parseFloat(salary.amount).toFixed(2)} {t.currency}</div>
                        <div className={`text-sm ${salary.status === "paid" ? "text-green-600" : "text-orange-600"}`} data-testid={`text-salary-status-${salary.id}`}>
                          {salary.status === "paid" ? t.paid : t.pending}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {salary.status !== "paid" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={isRTL ? "تسوية الراتب" : "Settle salary"}
                                onClick={() => { setSettleInvoiceFile(null); setSettleSalaryTarget(salary); }}
                                data-testid={`button-settle-salary-${salary.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isRTL ? "تسوية الراتب وإرفاق فاتورة المعاملة" : "Settle salary and attach transaction invoice"}</TooltipContent>
                          </Tooltip>
                        )}
                        {salary.invoiceImage && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={isRTL ? "عرض فاتورة المعاملة" : "View transaction invoice"}
                                onClick={() => window.open(`/api/shop/salaries/${salary.id}/invoice`, "_blank")}
                                data-testid={`button-view-salary-invoice-${salary.id}`}
                              >
                                <Paperclip className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isRTL ? "عرض فاتورة المعاملة" : "View transaction invoice"}</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label={t.edit} onClick={() => handleEditSalary(salary)} data-testid={`button-edit-salary-${salary.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.edit}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t.delete}
                              onClick={() => deleteSalaryMutation.mutate(salary.id)}
                              disabled={deleteSalaryMutation.isPending}
                              data-testid={`button-delete-salary-${salary.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isRTL ? "حذف سجل الراتب نهائيًا." : "Permanently delete this salary record."}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-salaries">{t.noSalaries}</div>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!settleSalaryTarget} onOpenChange={(open) => { if (!open) { setSettleSalaryTarget(null); setSettleInvoiceFile(null); } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRTL ? "تسوية الراتب" : "Settle Salary"}</DialogTitle>
                <DialogDescription>
                  {isRTL
                    ? "سيتم وضع الراتب كمدفوع وإضافته إلى الفواتير المدفوعة. يمكنك إرفاق فاتورة المعاملة (اختياري)."
                    : "The salary will be marked as paid and added to paid bills. You can attach the transaction invoice (optional)."}
                </DialogDescription>
              </DialogHeader>
              {settleSalaryTarget && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-md space-y-1">
                    <div className="font-medium" data-testid="text-settle-employee-name">{settleSalaryTarget.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{settleSalaryTarget.position}</div>
                    <div className="font-bold" data-testid="text-settle-amount">{parseFloat(settleSalaryTarget.amount).toFixed(2)} {t.currency}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isRTL ? "فاتورة المعاملة (PDF أو صورة)" : "Transaction invoice (PDF or image)"}</label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
                      onChange={(e) => setSettleInvoiceFile(e.target.files?.[0] || null)}
                      data-testid="input-settle-invoice-file"
                    />
                    {settleInvoiceFile && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2" data-testid="text-settle-invoice-filename">
                        <Paperclip className="w-4 h-4" />
                        {settleInvoiceFile.name}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setSettleSalaryTarget(null); setSettleInvoiceFile(null); }}
                      data-testid="button-cancel-settle"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => settleSalaryMutation.mutate({ salaryId: settleSalaryTarget.id, file: settleInvoiceFile })}
                      disabled={settleSalaryMutation.isPending}
                      data-testid="button-confirm-settle"
                    >
                      {settleSalaryMutation.isPending
                        ? (isRTL ? "جارٍ التسوية..." : "Settling...")
                        : (isRTL ? "تأكيد التسوية" : "Confirm Settlement")}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalBills}<InfoTip>{isRTL ? "إجمالي جميع فواتير المتجر." : "Sum of all shop bills."}</InfoTip></CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-bills">{totalBills.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidBills}<InfoTip>{isRTL ? "الفواتير المسددة بالكامل." : "Bills already paid."}</InfoTip></CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-paid-bills">{paidBills.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingBills}<InfoTip>{isRTL ? "الفواتير غير المسددة أو المتأخرة." : "Bills unpaid or overdue."}</InfoTip></CardTitle>
                <FileText className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-bills">{pendingBills.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>{t.shopBills}</CardTitle>
                  <CardDescription>{t.manageBills}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={generateSalariesDialogOpen} onOpenChange={setGenerateSalariesDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-generate-salaries">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t.generateSalaries}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.generateMonthlySalaryBills}</DialogTitle>
                        <DialogDescription>
                          {t.generateSalariesDescription}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t.paymentMonth}<InfoTip>{isRTL ? "الشهر الذي سيتم إنشاء فواتير الرواتب له." : "Month to generate salary bills for."}</InfoTip></label>
                          <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            data-testid="input-salary-month"
                          />
                          <p className="text-sm text-muted-foreground">
                            {t.selectMonthForSalaryBills}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setGenerateSalariesDialogOpen(false)}
                            data-testid="button-cancel-generate"
                          >
                            {t.cancel}
                          </Button>
                          <Button
                            onClick={() => generateSalariesMutation.mutate(selectedMonth)}
                            disabled={generateSalariesMutation.isPending}
                            data-testid="button-confirm-generate"
                          >
                            {generateSalariesMutation.isPending ? t.generating : t.generateBills}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingBill(null)} data-testid="button-add-bill">
                        <Plus className="w-4 h-4 mr-2" />
                        {t.addBill}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingBill ? t.editBill : t.addBill}</DialogTitle>
                      <DialogDescription>{t.billFormDescription}</DialogDescription>
                    </DialogHeader>
                    <Form {...billForm}>
                      <form onSubmit={billForm.handleSubmit(handleBillSubmit)} className="space-y-4">
                        <FormField
                          control={billForm.control}
                          name="billType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.billType}<InfoTip>{isRTL ? "فئة هذه الفاتورة (إيجار، كهرباء، إلخ)." : "Category of this bill (rent, electricity, etc.)."}</InfoTip></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-bill-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="rent">{t.rent}</SelectItem>
                                  <SelectItem value="electricity">{t.electricity}</SelectItem>
                                  <SelectItem value="water">{t.water}</SelectItem>
                                  <SelectItem value="gas">{t.gas}</SelectItem>
                                  <SelectItem value="internet">{t.internet}</SelectItem>
                                  <SelectItem value="maintenance">{t.maintenance}</SelectItem>
                                  <SelectItem value="foundational">{t.foundational}</SelectItem>
                                  <SelectItem value="other">{t.other}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={billForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.amount}<InfoTip>{isRTL ? "إجمالي مبلغ الفاتورة بالعملة الافتراضية." : "Total bill amount in default currency."}</InfoTip></FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} data-testid="input-bill-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={billForm.control}
                          name="paymentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.paymentDate}<InfoTip>{isRTL ? "التاريخ المستحق لسداد الفاتورة." : "Date the bill is due to be paid."}</InfoTip></FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-bill-payment-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={billForm.control}
                          name="paymentPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.paymentPeriod}<InfoTip>{isRTL ? "تكرار تكرار هذه الفاتورة." : "How often this bill recurs."}</InfoTip></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-payment-period">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="oneTime">{t.oneTime}</SelectItem>
                                  <SelectItem value="weekly">{t.weekly}</SelectItem>
                                  <SelectItem value="monthly">{t.monthly}</SelectItem>
                                  <SelectItem value="quarterly">{t.quarterly}</SelectItem>
                                  <SelectItem value="semi-annually">{t.semiAnnually}</SelectItem>
                                  <SelectItem value="yearly">{t.yearly}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={billForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.status}<InfoTip>{isRTL ? "حالة الدفع الحالية لهذه الفاتورة." : "Current payment status of this bill."}</InfoTip></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-bill-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">{t.pending}</SelectItem>
                                  <SelectItem value="paid">{t.paid}</SelectItem>
                                  <SelectItem value="overdue">{t.overdue}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={billForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.description}<InfoTip>{isRTL ? "تفاصيل إضافية اختيارية حول الفاتورة." : "Optional extra details about the bill."}</InfoTip></FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="input-bill-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={handleCloseBillDialog} data-testid="button-cancel-bill">
                            {t.cancel}
                          </Button>
                          <Button type="submit" disabled={createBillMutation.isPending || updateBillMutation.isPending} data-testid="button-save-bill">
                            {createBillMutation.isPending || updateBillMutation.isPending ? t.saving : t.save}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchBills}
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-bills"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    size="sm"
                    variant={billStatusFilter === "paid" ? "default" : "outline"}
                    onClick={() => setBillStatusFilter(billStatusFilter === "paid" ? "all" : "paid")}
                    data-testid="button-shop-filter-paid"
                  >
                    {t.paid}
                  </Button>
                  <Button
                    size="sm"
                    variant={billStatusFilter === "unpaid" ? "default" : "outline"}
                    onClick={() => setBillStatusFilter(billStatusFilter === "unpaid" ? "all" : "unpaid")}
                    data-testid="button-shop-filter-unpaid"
                  >
                    {isRTL ? "غير المدفوعة" : "Unpaid"}
                  </Button>
                  <Select value={billSortOrder} onValueChange={setBillSortOrder}>
                    <SelectTrigger className="w-44" data-testid="select-shop-bill-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{isRTL ? "الأحدث أولاً" : "Newest first"}</SelectItem>
                      <SelectItem value="oldest">{isRTL ? "الأقدم أولاً" : "Oldest first"}</SelectItem>
                      <SelectItem value="paidFirst">{isRTL ? "المدفوعة أولاً" : "Paid first"}</SelectItem>
                      <SelectItem value="unpaidFirst">{isRTL ? "غير المدفوعة أولاً" : "Unpaid first"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {billsLoading ? (
                <div className="text-center py-8" data-testid="loading-bills">{t.loading}</div>
              ) : filteredBills && filteredBills.length > 0 ? (
                <div className="space-y-2">
                  {filteredBills.map((bill) => {
                    const billTypeKey = bill.billType as keyof typeof t;
                    const billTypeLabel = typeof t[billTypeKey] === 'string' ? t[billTypeKey] as string : bill.billType;
                    
                    return (
                      <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate" data-testid={`bill-item-${bill.id}`}>
                        <div className="flex-1">
                          <div className="font-medium" data-testid={`text-bill-type-${bill.id}`}>{billTypeLabel}</div>
                          {bill.description && (
                            <div className="text-sm text-muted-foreground" data-testid={`text-bill-description-${bill.id}`}>{bill.description}</div>
                          )}
                          <div className="text-sm text-muted-foreground" data-testid={`text-bill-date-${bill.id}`}>
                            {bill.paymentDate && format(new Date(bill.paymentDate), "dd MMM yyyy")}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-bold" data-testid={`text-bill-amount-${bill.id}`}>{parseFloat(bill.amount).toFixed(2)} {t.currency}</div>
                          <div className={`text-sm ${bill.status === "paid" ? "text-green-600" : bill.status === "overdue" ? "text-red-600" : "text-orange-600"}`} data-testid={`text-bill-status-${bill.id}`}>
                            {bill.status === "paid" ? t.paid : bill.status === "overdue" ? t.overdue : t.pending}
                          </div>
                          {bill.invoiceImage && (
                            <Badge variant="outline" className="mt-1" data-testid={`badge-invoice-${bill.id}`}>
                              <FileText className="w-3 h-3 mr-1" />
                              {t.invoiceAttached || "Invoice"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {bill.invoiceImage ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={t.viewInvoice || "View Invoice"}
                                    onClick={() => window.open(`/api/shop/bills/${bill.id}/invoice`, '_blank')}
                                    title={t.viewInvoice || "View Invoice"}
                                    data-testid={`button-view-invoice-${bill.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t.viewInvoice || "View Invoice"}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={t.deleteInvoice || "Delete Invoice"}
                                    onClick={() => deleteBillInvoiceMutation.mutate(bill.id)}
                                    disabled={deleteBillInvoiceMutation.isPending}
                                    title={t.deleteInvoice || "Delete Invoice"}
                                    data-testid={`button-delete-invoice-${bill.id}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isRTL ? "إزالة الفاتورة المرفقة نهائيًا." : "Permanently remove the attached invoice."}</TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 10 * 1024 * 1024) {
                                      toast({ title: t.fileTooLarge || "File too large (max 10MB)", variant: "destructive" });
                                      return;
                                    }
                                    uploadBillInvoiceMutation.mutate({ billId: bill.id, file });
                                  }
                                  e.target.value = "";
                                }}
                                data-testid={`input-upload-invoice-${bill.id}`}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    asChild
                                    aria-label={t.uploadInvoice || "Upload Invoice"}
                                    disabled={uploadBillInvoiceMutation.isPending}
                                    title={t.uploadInvoice || "Upload Invoice"}
                                  >
                                    <span data-testid={`button-upload-invoice-${bill.id}`}>
                                      <Upload className="w-4 h-4" />
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t.uploadInvoice || "Upload Invoice"}</TooltipContent>
                              </Tooltip>
                            </label>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" aria-label={t.edit} onClick={() => handleEditBill(bill)} data-testid={`button-edit-bill-${bill.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t.edit}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={t.delete}
                                onClick={() => deleteBillMutation.mutate(bill.id)}
                                disabled={deleteBillMutation.isPending}
                                data-testid={`button-delete-bill-${bill.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isRTL ? "حذف هذه الفاتورة نهائيًا." : "Permanently delete this bill."}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-bills">{t.noBills}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.businessDocuments}</CardTitle>
              <CardDescription>{t.manageBusinessDocuments}</CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="text-center py-8" data-testid="loading-files">{t.loading}</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {fileTypes.map(({ type, label }) => {
                    const file = getFileByType(type);
                    return (
                      <Card key={type} className="relative" data-testid={`file-card-${type}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-medium">{label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {file ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate" data-testid={`file-name-${type}`}>{file.fileName}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span data-testid={`file-size-${type}`}>{t.fileSize}: {formatFileSize(file.fileSize)}</span>
                                    <span data-testid={`file-date-${type}`}>{t.uploadedOn}: {format(new Date(file.createdAt), "dd MMM yyyy")}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDownloadFile(file.id, file.fileName)}
                                  data-testid={`button-download-${type}`}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {t.downloadFile}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    if (window.confirm(t.confirmDeleteFile)) {
                                      deleteFileMutation.mutate(file.id);
                                    }
                                  }}
                                  disabled={deleteFileMutation.isPending}
                                  data-testid={`button-delete-file-${type}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t.deleteFile}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-muted/50"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={handleFileDrop(type)}
                              onClick={() => document.getElementById(`file-input-${type}`)?.click()}
                              data-testid={`upload-area-${type}`}
                            >
                              <input
                                type="file"
                                id={`file-input-${type}`}
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={handleFileUpload(type)}
                                data-testid={`input-file-${type}`}
                              />
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm font-medium">{t.dragAndDropOrClick}</p>
                              <p className="text-xs text-muted-foreground mt-1">{t.pdfFilesOnly}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
