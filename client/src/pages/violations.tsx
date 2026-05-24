import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Building, 
  Receipt, 
  Shield, 
  Briefcase, 
  Filter, 
  Edit, 
  Trash2, 
  Upload, 
  FileText, 
  Download, 
  Eye,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle2
} from "lucide-react";
import type { Violation, ViolationStats, Branch, ViolationReference } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const authorityIcons = {
  municipality: Building,
  zatca: Receipt,
  police: Shield,
  ministry_of_commerce: Briefcase,
};

const authorityColors = {
  municipality: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  zatca: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  police: "bg-red-500/10 text-red-700 dark:text-red-400",
  ministry_of_commerce: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const authorityLabels: Record<string, string> = {
  municipality: "Municipality",
  zatca: "ZATCA",
  police: "Police",
  ministry_of_commerce: "Ministry of Commerce",
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  disputed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  disputed: "Disputed",
};

const violationFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  authority: z.enum(["municipality", "zatca", "police", "ministry_of_commerce"]),
  feeAmount: z.string().min(1, "Fee amount is required"),
  status: z.enum(["pending", "paid", "disputed"]),
  violationDate: z.string().min(1, "Violation date is required"),
  resolvedDate: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
});

type ViolationFormData = z.infer<typeof violationFormSchema>;

export default function ViolationsPage() {
  const { t: translations, isRTL } = useLanguage();
  const t = translations as unknown as Record<string, string | undefined>;
  const { toast } = useToast();
  const [authorityFilter, setAuthorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Violation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [selectedRefAuthority, setSelectedRefAuthority] = useState<string>("municipality");
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refTitle, setRefTitle] = useState("");
  const [refDescription, setRefDescription] = useState("");
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  const { data: violations = [], isLoading } = useQuery<Violation[]>({
    queryKey: ["/api/violations", { authority: authorityFilter, status: statusFilter }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (authorityFilter !== "all") queryParams.set("authority", authorityFilter);
      if (statusFilter !== "all") queryParams.set("status", statusFilter);
      const queryString = queryParams.toString();
      const apiUrl = `/api/violations${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch violations");
      return response.json();
    },
  });

  const { data: stats } = useQuery<ViolationStats>({
    queryKey: ["/api/violations/stats"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: references = [], isLoading: referencesLoading } = useQuery<ViolationReference[]>({
    queryKey: ["/api/violation-references"],
  });

  const form = useForm<ViolationFormData>({
    resolver: zodResolver(violationFormSchema),
    defaultValues: {
      title: "",
      description: "",
      authority: "municipality",
      feeAmount: "",
      status: "pending",
      violationDate: format(new Date(), "yyyy-MM-dd"),
      resolvedDate: "",
      branchId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ViolationFormData) => {
      const processedData = {
        ...data,
        feeAmount: data.feeAmount,
        branchId: data.branchId || null,
        resolvedDate: data.resolvedDate || null,
      };
      await apiRequest("POST", "/api/violations", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/violations/stats"] });
      toast({ title: t.success || "Success", description: "Violation created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: t.error || "Error", description: error.message || "Failed to create violation", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ViolationFormData> }) => {
      const processedData = {
        ...data,
        branchId: data.branchId || null,
        resolvedDate: data.resolvedDate || null,
      };
      await apiRequest("PATCH", `/api/violations/${id}`, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/violations/stats"] });
      toast({ title: t.success || "Success", description: "Violation updated successfully" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: t.error || "Error", description: error.message || "Failed to update violation", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/violations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/violations/stats"] });
      toast({ title: t.success || "Success", description: "Violation deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: t.error || "Error", description: error.message || "Failed to delete violation", variant: "destructive" });
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/violations/${id}/create-bill`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.success || "Success", description: "Bill created from violation" });
    },
    onError: (error: Error) => {
      toast({ title: t.error || "Error", description: error.message || "Failed to create bill", variant: "destructive" });
    },
  });

  const uploadReferenceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/violation-references', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload reference');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violation-references"] });
      toast({ title: t.referenceUploaded || "Reference document uploaded successfully" });
      setRefDialogOpen(false);
      setRefFile(null);
      setRefTitle("");
      setRefDescription("");
      setIsUploadingRef(false);
    },
    onError: () => {
      toast({ title: t.violationError || "Error uploading reference", variant: "destructive" });
      setIsUploadingRef(false);
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/violation-references/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/violation-references"] });
      toast({ title: t.referenceDeleted || "Reference document deleted successfully" });
    },
    onError: () => {
      toast({ title: t.violationError || "Error deleting reference", variant: "destructive" });
    },
  });

  const handleSubmit = (data: ViolationFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: Violation) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || "",
      authority: item.authority as any,
      feeAmount: item.feeAmount,
      status: item.status as any,
      violationDate: item.violationDate ? format(new Date(item.violationDate), "yyyy-MM-dd") : "",
      resolvedDate: item.resolvedDate ? format(new Date(item.resolvedDate), "yyyy-MM-dd") : "",
      branchId: item.branchId || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.reset({
      title: "",
      description: "",
      authority: "municipality",
      feeAmount: "",
      status: "pending",
      violationDate: format(new Date(), "yyyy-MM-dd"),
      resolvedDate: "",
      branchId: "",
    });
    setIsDialogOpen(true);
  };

  const handleDocumentUpload = async (violationId: string, file: File) => {
    const formData = new FormData();
    formData.append("document", file);
    
    setIsUploading(true);
    try {
      const response = await fetch(`/api/violations/${violationId}/document`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload document");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/violations"] });
      toast({ title: t.success || "Success", description: "Document uploaded successfully" });
    } catch (error) {
      toast({ title: t.error || "Error", description: "Failed to upload document", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentDownload = (documentPath: string) => {
    window.open(documentPath, "_blank");
  };

  const handleUploadReference = () => {
    if (!refFile || !refTitle.trim()) {
      toast({ title: "Please provide a title and select a PDF file", variant: "destructive" });
      return;
    }
    
    setIsUploadingRef(true);
    const formData = new FormData();
    formData.append('file', refFile);
    formData.append('authority', selectedRefAuthority);
    formData.append('title', refTitle.trim());
    if (refDescription.trim()) {
      formData.append('description', refDescription.trim());
    }
    
    uploadReferenceMutation.mutate(formData);
  };

  const totalViolations = stats?.totalViolations ?? violations.length;
  const totalFees = stats?.totalFees ?? violations.reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const pendingFees = stats?.pendingFees ?? violations.filter(v => v.status === "pending").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const paidFees = stats?.paidFees ?? violations.filter(v => v.status === "paid").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const disputedFees = stats?.disputedFees ?? violations.filter(v => v.status === "disputed").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const pendingCount = stats?.pendingCount ?? violations.filter(v => v.status === "pending").length;
  const paidCount = stats?.paidCount ?? violations.filter(v => v.status === "paid").length;
  const disputedCount = stats?.disputedCount ?? violations.filter(v => v.status === "disputed").length;

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t.violations || "Violations"}</h1>
          <p className="text-muted-foreground mt-1">
            {t.manageViolations || "Manage store violations from government authorities"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} data-testid="button-add-violation">
              <Plus className="w-4 h-4 mr-2" />
              {t.addViolation || "Add Violation"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? (t.editViolation || "Edit Violation") : (t.addViolation || "Add Violation")}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update violation details" : "Record a new violation from an authority"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.title || "Title"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter violation title" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description || "Description"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter violation description" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.authority || "Authority"}
                          <InfoTip>{isRTL ? "الجهة الحكومية التي أصدرت المخالفة." : "Government authority that issued the violation."}</InfoTip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-authority">
                              <SelectValue placeholder="Select authority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="municipality">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-yellow-600" />
                                Municipality
                              </div>
                            </SelectItem>
                            <SelectItem value="zatca">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-blue-600" />
                                ZATCA
                              </div>
                            </SelectItem>
                            <SelectItem value="police">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-red-600" />
                                Police
                              </div>
                            </SelectItem>
                            <SelectItem value="ministry_of_commerce">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-purple-600" />
                                Ministry of Commerce
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.feeAmount || "Fee Amount"} (SAR)
                          <InfoTip>{isRTL ? "قيمة الغرامة بالريال السعودي." : "Fine amount in Saudi Riyal."}</InfoTip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field} 
                            data-testid="input-fee-amount" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.status || "Status"}
                          <InfoTip>{isRTL ? "حالة سداد المخالفة أو الاعتراض عليها." : "Payment status or dispute state."}</InfoTip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                            <SelectItem value="paid">{t.paid || "Paid"}</SelectItem>
                            <SelectItem value="disputed">{t.disputed || "Disputed"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.branch || "Branch"} ({t.optional || "Optional"})
                          <InfoTip>{isRTL ? "الفرع الذي ارتُكبت فيه المخالفة." : "Branch where the violation occurred."}</InfoTip>
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-branch">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.none || "None"}</SelectItem>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="violationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.violationDate || "Violation Date"}
                          <InfoTip>{isRTL ? "تاريخ ارتكاب المخالفة." : "Date the violation occurred."}</InfoTip>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-violation-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resolvedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.resolvedDate || "Resolved Date"} ({t.optional || "Optional"})
                          <InfoTip>{isRTL ? "تاريخ تسوية أو إغلاق المخالفة." : "Date the violation was settled or closed."}</InfoTip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                            data-testid="input-resolved-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.cancel || "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-violation"
                  >
                    {(createMutation.isPending || updateMutation.isPending) 
                      ? (t.saving || "Saving...") 
                      : editingItem 
                        ? (t.update || "Update") 
                        : (t.create || "Create")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.totalViolations || "Total Violations"}
              <InfoTip>{isRTL ? "إجمالي عدد المخالفات المسجلة." : "Total number of recorded violations."}</InfoTip>
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-violations">{totalViolations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalFees.toFixed(2)} {t.sar || "SAR"} {t.total || "total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.pendingViolations || "Pending"}
              <InfoTip>{isRTL ? "المخالفات التي لم تُسدد رسومها بعد." : "Violations awaiting payment."}</InfoTip>
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingFees.toFixed(2)} {t.sar || "SAR"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.paidViolations || "Paid"}
              <InfoTip>{isRTL ? "المخالفات التي تم سداد رسومها." : "Violations that have been paid."}</InfoTip>
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-count">{paidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidFees.toFixed(2)} {t.sar || "SAR"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.disputedViolations || "Disputed"}
              <InfoTip>{isRTL ? "المخالفات قيد الاعتراض أو التظلم." : "Violations under dispute."}</InfoTip>
            </CardTitle>
            <Shield className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-disputed-count">{disputedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {disputedFees.toFixed(2)} {t.sar || "SAR"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t.filters || "Filters"}
          </CardTitle>
          <CardDescription>{t.filterViolations || "Filter violations by authority and status"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
              <SelectTrigger data-testid="select-authority-filter">
                <SelectValue placeholder={t.authority || "Authority"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all || "All Authorities"}</SelectItem>
                <SelectItem value="municipality">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-yellow-600" />
                    Municipality
                  </div>
                </SelectItem>
                <SelectItem value="zatca">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    ZATCA
                  </div>
                </SelectItem>
                <SelectItem value="police">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    Police
                  </div>
                </SelectItem>
                <SelectItem value="ministry_of_commerce">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Ministry of Commerce
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t.status || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all || "All Statuses"}</SelectItem>
                <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                <SelectItem value="paid">{t.paid || "Paid"}</SelectItem>
                <SelectItem value="disputed">{t.disputed || "Disputed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.violationsList || "Violations List"}</CardTitle>
          <CardDescription>
            {violations.length} {t.violationsFound || "violations found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t.loading || "Loading..."}</div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noViolationsFound || "No violations found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.title || "Title"}</TableHead>
                    <TableHead>{t.authority || "Authority"}</TableHead>
                    <TableHead>{t.feeAmount || "Fee Amount"}</TableHead>
                    <TableHead>{t.status || "Status"}</TableHead>
                    <TableHead>{t.date || "Date"}</TableHead>
                    <TableHead>{t.document || "Document"}</TableHead>
                    <TableHead className="text-right">{t.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => {
                    const AuthorityIcon = authorityIcons[violation.authority as keyof typeof authorityIcons] || AlertTriangle;
                    return (
                      <TableRow key={violation.id} data-testid={`row-violation-${violation.id}`}>
                        <TableCell className="font-medium">{violation.title}</TableCell>
                        <TableCell>
                          <Badge className={authorityColors[violation.authority as keyof typeof authorityColors] || ""}>
                            <AuthorityIcon className="w-3 h-3 mr-1" />
                            {authorityLabels[violation.authority] || violation.authority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(violation.feeAmount).toFixed(2)} {t.sar || "SAR"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[violation.status as keyof typeof statusColors] || ""}>
                            {statusLabels[violation.status] || violation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {violation.violationDate 
                            ? format(new Date(violation.violationDate), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {violation.documentPath ? (
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewDocumentUrl(violation.documentPath)}
                                    data-testid={`button-view-document-${violation.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isRTL ? "عرض المستند" : "View document"}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDocumentDownload(violation.documentPath!)}
                                    data-testid={`button-download-document-${violation.id}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isRTL ? "تنزيل المستند" : "Download document"}</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocumentUpload(violation.id, file);
                                }}
                                disabled={isUploading}
                                data-testid={`input-upload-document-${violation.id}`}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" asChild disabled={isUploading}>
                                    <span>
                                      <Upload className="w-4 h-4" />
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isRTL ? "رفع مستند المخالفة" : "Upload violation document"}</TooltipContent>
                              </Tooltip>
                            </label>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!violation.linkedBillId && violation.status !== "paid" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => createBillMutation.mutate(violation.id)}
                                    disabled={createBillMutation.isPending}
                                    data-testid={`button-create-bill-${violation.id}`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isRTL ? "إنشاء فاتورة من هذه المخالفة" : "Create a bill from this violation"}</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(violation)}
                                  data-testid={`button-edit-${violation.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isRTL ? "تعديل المخالفة" : "Edit violation"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(t.confirmDelete || "Are you sure you want to delete this violation?")) {
                                      deleteMutation.mutate(violation.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${violation.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isRTL ? "حذف المخالفة نهائياً" : "Permanently delete this violation"}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation References Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.violationReferences || "Reference Documents"}
          </CardTitle>
          <CardDescription>
            {t.referenceDocuments || "Upload PDF reference documents for each authority type"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="municipality" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="municipality" className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">{t.municipality || "Municipality"}</span>
              </TabsTrigger>
              <TabsTrigger value="zatca" className="flex items-center gap-1">
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">{t.zatca || "ZATCA"}</span>
              </TabsTrigger>
              <TabsTrigger value="police" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{t.police || "Police"}</span>
              </TabsTrigger>
              <TabsTrigger value="ministry_of_commerce" className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">{t.ministryOfCommerce || "Ministry"}</span>
              </TabsTrigger>
            </TabsList>
            
            {["municipality", "zatca", "police", "ministry_of_commerce"].map((authority) => {
              const AuthorityIcon = authorityIcons[authority as keyof typeof authorityIcons];
              const authorityRefs = references.filter(ref => ref.authority === authority);
              
              return (
                <TabsContent key={authority} value={authority} className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <AuthorityIcon className="w-5 h-5" />
                      {authorityLabels[authority]} {t.referenceDocuments || "Reference Documents"}
                    </h3>
                    <Button
                      onClick={() => {
                        setSelectedRefAuthority(authority);
                        setRefDialogOpen(true);
                      }}
                      data-testid={`button-add-ref-${authority}`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addReferenceDocument || "Add Reference"}
                    </Button>
                  </div>
                  
                  {authorityRefs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t.noReferences || "No reference documents found"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {authorityRefs.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                          data-testid={`ref-item-${ref.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="font-medium">{ref.title}</p>
                              {ref.description && (
                                <p className="text-sm text-muted-foreground">{ref.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(ref.uploadedAt), 'PP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`/api/violation-references/${ref.id}/file`, '_blank')}
                                  data-testid={`button-view-ref-${ref.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isRTL ? "عرض المستند المرجعي" : "View reference document"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `/api/violation-references/${ref.id}/file`;
                                    link.download = ref.title + '.pdf';
                                    link.click();
                                  }}
                                  data-testid={`button-download-ref-${ref.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isRTL ? "تنزيل المستند المرجعي" : "Download reference document"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(t.referenceDeleteConfirm || "Are you sure you want to delete this reference document?")) {
                                      deleteReferenceMutation.mutate(ref.id);
                                    }
                                  }}
                                  disabled={deleteReferenceMutation.isPending}
                                  data-testid={`button-delete-ref-${ref.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isRTL ? "حذف المستند المرجعي نهائياً" : "Permanently delete this reference document"}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Reference Dialog */}
      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addReferenceDocument || "Add Reference Document"}</DialogTitle>
            <DialogDescription>
              {t.pdfOnly || "PDF files only (max 10MB)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.referenceTitle || "Document Title"}</label>
              <Input
                value={refTitle}
                onChange={(e) => setRefTitle(e.target.value)}
                placeholder={t.referenceTitle || "Enter document title"}
                data-testid="input-ref-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.referenceDescription || "Description (Optional)"}</label>
              <Textarea
                value={refDescription}
                onChange={(e) => setRefDescription(e.target.value)}
                placeholder={t.referenceDescription || "Enter description (optional)"}
                data-testid="input-ref-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.uploadPdf || "Upload PDF"}</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setRefFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="ref-file-input"
                  data-testid="input-ref-file"
                />
                <label htmlFor="ref-file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  {refFile ? (
                    <p className="text-sm font-medium">{refFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.pdfOnly || "Click to select a PDF file"}</p>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefDialogOpen(false)}>
              {t.cancel || "Cancel"}
            </Button>
            <Button 
              onClick={handleUploadReference} 
              disabled={isUploadingRef || !refFile || !refTitle.trim()}
              data-testid="button-submit-ref"
            >
              {isUploadingRef ? (t.uploading || "Uploading...") : (t.upload || "Upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDocumentUrl} onOpenChange={() => setViewDocumentUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t.viewDocument || "View Document"}</DialogTitle>
          </DialogHeader>
          {viewDocumentUrl && (
            <div className="w-full h-[70vh]">
              {viewDocumentUrl.endsWith('.pdf') ? (
                <iframe src={viewDocumentUrl} className="w-full h-full" title="Document" />
              ) : (
                <img src={viewDocumentUrl} alt="Document" className="max-w-full max-h-full object-contain mx-auto" />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDocumentUrl(null)}>
              {t.close || "Close"}
            </Button>
            {viewDocumentUrl && (
              <Button onClick={() => handleDocumentDownload(viewDocumentUrl)}>
                <Download className="w-4 h-4 mr-2" />
                {t.download || "Download"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
