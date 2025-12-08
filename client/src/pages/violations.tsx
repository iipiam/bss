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
import type { Violation, ViolationStats, Branch } from "@shared/schema";
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
  const { t: translations } = useLanguage();
  const t = translations as unknown as Record<string, string | undefined>;
  const { toast } = useToast();
  const [authorityFilter, setAuthorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Violation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);

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

  const totalViolations = stats?.totalViolations ?? violations.length;
  const totalFees = stats?.totalFees ?? violations.reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const pendingFees = stats?.pendingFees ?? violations.filter(v => v.status === "pending").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const paidFees = stats?.paidFees ?? violations.filter(v => v.status === "paid").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const disputedFees = stats?.disputedFees ?? violations.filter(v => v.status === "disputed").reduce((sum, v) => sum + parseFloat(v.feeAmount || "0"), 0);
  const pendingCount = stats?.pendingCount ?? violations.filter(v => v.status === "pending").length;
  const paidCount = stats?.paidCount ?? violations.filter(v => v.status === "paid").length;
  const disputedCount = stats?.disputedCount ?? violations.filter(v => v.status === "disputed").length;

  return (
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
                        <FormLabel>{t.authority || "Authority"}</FormLabel>
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
                        <FormLabel>{t.feeAmount || "Fee Amount"} (SAR)</FormLabel>
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
                        <FormLabel>{t.status || "Status"}</FormLabel>
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
                        <FormLabel>{t.branch || "Branch"} ({t.optional || "Optional"})</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-branch">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
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
                        <FormLabel>{t.violationDate || "Violation Date"}</FormLabel>
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
                        <FormLabel>{t.resolvedDate || "Resolved Date"} ({t.optional || "Optional"})</FormLabel>
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
            <CardTitle className="text-sm font-medium">{t.totalViolations || "Total Violations"}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t.pendingViolations || "Pending"}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t.paidViolations || "Paid"}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t.disputedViolations || "Disputed"}</CardTitle>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewDocumentUrl(violation.documentPath)}
                                data-testid={`button-view-document-${violation.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentDownload(violation.documentPath!)}
                                data-testid={`button-download-document-${violation.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
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
                              <Button variant="ghost" size="sm" asChild disabled={isUploading}>
                                <span>
                                  <Upload className="w-4 h-4" />
                                </span>
                              </Button>
                            </label>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!violation.linkedBillId && violation.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => createBillMutation.mutate(violation.id)}
                                disabled={createBillMutation.isPending}
                                data-testid={`button-create-bill-${violation.id}`}
                                title="Create Bill"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(violation)}
                              data-testid={`button-edit-${violation.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
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
  );
}
