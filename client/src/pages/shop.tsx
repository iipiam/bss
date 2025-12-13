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
import { Plus, Pencil, Trash2, DollarSign, FileText, Search, Sparkles, Upload, Download, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  const { t } = useLanguage();
  const { labels } = useBusinessType();
  const { toast } = useToast();
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editingBill, setEditingBill] = useState<ShopBill | null>(null);
  const [salarySearch, setSalarySearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [generateSalariesDialogOpen, setGenerateSalariesDialogOpen] = useState(false);
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
    return (
      bill.billType.toLowerCase().includes(searchLower) ||
      (bill.description && bill.description.toLowerCase().includes(searchLower))
    );
  });

  const totalSalaries = salaries?.reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;
  const paidSalaries = salaries?.filter((s) => s.status === "paid").reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;
  const pendingSalaries = totalSalaries - paidSalaries;

  const totalBills = bills?.reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0;
  const paidBills = bills?.filter((b) => b.status === "paid").reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0;
  const pendingBills = totalBills - paidBills;

  return (
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
                <CardTitle className="text-sm font-medium">{t.totalSalaries}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-salaries">{totalSalaries.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidSalaries}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-paid-salaries">{paidSalaries.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingSalaries}</CardTitle>
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
                <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                  <DialogTrigger asChild>
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
                              <FormLabel>{t.position}</FormLabel>
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
                              <FormLabel>{t.monthlySalary}</FormLabel>
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
                              <FormLabel>{t.paymentDate}</FormLabel>
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
                              <FormLabel>{t.status}</FormLabel>
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
                              <FormLabel>{t.notes}</FormLabel>
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
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEditSalary(salary)} data-testid={`button-edit-salary-${salary.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteSalaryMutation.mutate(salary.id)}
                          disabled={deleteSalaryMutation.isPending}
                          data-testid={`button-delete-salary-${salary.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-salaries">{t.noSalaries}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalBills}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-bills">{totalBills.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidBills}</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-paid-bills">{paidBills.toFixed(2)} {t.currency}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingBills}</CardTitle>
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
                          <label className="text-sm font-medium">{t.paymentMonth}</label>
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
                              <FormLabel>{t.billType}</FormLabel>
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
                              <FormLabel>{t.amount}</FormLabel>
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
                              <FormLabel>{t.paymentDate}</FormLabel>
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
                              <FormLabel>{t.paymentPeriod}</FormLabel>
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
                              <FormLabel>{t.status}</FormLabel>
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
                              <FormLabel>{t.description}</FormLabel>
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
              <div className="mb-4">
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
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEditBill(bill)} data-testid={`button-edit-bill-${bill.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteBillMutation.mutate(bill.id)}
                            disabled={deleteBillMutation.isPending}
                            data-testid={`button-delete-bill-${bill.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
  );
}
