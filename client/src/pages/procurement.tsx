import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Procurement, InsertProcurement } from "@shared/schema";
import { insertProcurementSchema } from "@shared/schema";
import { Plus, Package, Wrench, HardHat, Computer, Calendar, User, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, Upload, Image, X, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

const typeIcons = {
  inventory: Package,
  maintenance: Wrench,
  installation: HardHat,
  equipment: Computer,
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  ordered: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  received: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const priorityColors = {
  low: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  ordered: Package,
  received: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function ProcurementPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all-statuses");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Procurement | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  const { data: procurements = [], isLoading } = useQuery<Procurement[]>({
    queryKey: [
      "/api/procurement",
      {
        type: selectedType !== "all" ? selectedType : undefined,
        status: selectedStatus !== "all-statuses" ? selectedStatus : undefined,
      },
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (selectedType !== "all") queryParams.set("type", selectedType);
      if (selectedStatus !== "all-statuses") queryParams.set("status", selectedStatus);
      const queryString = queryParams.toString();
      const apiUrl = `/api/procurement${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch procurement data");
      return response.json();
    },
  });

  const procurementFormSchema = z.object({
    type: z.string().min(1, "Type is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    supplier: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    quantity: z.coerce.number().optional().nullable(),
    unitPrice: z.string().optional().nullable(),
    totalCost: z.string().min(1, t.priceRequired || "Total cost is required"),
    status: z.string().min(1, "Status is required"),
    priority: z.string().min(1, "Priority is required"),
    requestedBy: z.string().optional().nullable(),
    approvedBy: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    orderDate: z.date().optional().nullable(),
    expectedDelivery: z.date().optional().nullable(),
    actualDelivery: z.date().optional().nullable(),
    notes: z.string().optional().nullable(),
  });

  const form = useForm({
    resolver: zodResolver(procurementFormSchema),
    defaultValues: {
      type: "inventory",
      title: "",
      description: "",
      supplier: "",
      category: "",
      quantity: undefined,
      unitPrice: "",
      totalCost: "",
      status: "pending",
      priority: "medium",
      requestedBy: "",
      approvedBy: "",
      branchId: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProcurement) => {
      await apiRequest("POST", "/api/procurement", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementCreated });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Create procurement error:", error);
      toast({ title: t.error, description: error.message || "Failed to create procurement request", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcurement> }) => {
      await apiRequest("PATCH", `/api/procurement/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementUpdated });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Update procurement error:", error);
      toast({ title: t.error, description: error.message || "Failed to update procurement request", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/procurement/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ title: t.success, description: t.procurementDeleted });
    },
    onError: (error: Error) => {
      console.error("Delete procurement error:", error);
      toast({ title: t.error, description: error.message || "Failed to delete procurement request", variant: "destructive" });
    },
  });

  const handleSubmit = (data: z.infer<typeof procurementFormSchema>) => {
    console.log("[Procurement] Form submitted with data:", data);
    const trimmedUnitPrice = typeof data.unitPrice === 'string' ? data.unitPrice.trim() : null;
    const trimmedBranchId = typeof data.branchId === 'string' ? data.branchId.trim() : null;
    const trimmedTotalCost = data.totalCost.trim();
    const processedData = {
      type: data.type,
      title: data.title,
      description: data.description || null,
      supplier: data.supplier || null,
      category: data.category || null,
      quantity: typeof data.quantity === "number" && Number.isFinite(data.quantity) ? data.quantity : null,
      unitPrice: trimmedUnitPrice || null,
      totalCost: trimmedTotalCost,
      status: data.status,
      priority: data.priority,
      requestedBy: data.requestedBy || null,
      approvedBy: data.approvedBy || null,
      branchId: trimmedBranchId || null,
      notes: data.notes || null,
      invoiceImage: invoiceImage,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: processedData });
    } else {
      createMutation.mutate(processedData as InsertProcurement);
    }
  };

  const handleEdit = (item: Procurement) => {
    setEditingItem(item);
    setInvoiceImage(item.invoiceImage || null);
    form.reset({
      type: item.type,
      title: item.title,
      description: item.description || "",
      supplier: item.supplier || "",
      category: item.category || "",
      quantity: item.quantity || undefined,
      unitPrice: item.unitPrice || "",
      totalCost: item.totalCost,
      status: item.status,
      priority: item.priority,
      requestedBy: item.requestedBy || "",
      approvedBy: item.approvedBy || "",
      branchId: item.branchId || "",
      notes: item.notes || "",
    } as any);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  // Handle invoice image upload
  const handleInvoiceUpload = async (file: File) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("invoiceImage", file);
    
    setIsUploading(true);
    try {
      const response = await fetch("/api/procurement/upload-invoice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload invoice image");
      }
      
      const data = await response.json();
      setInvoiceImage(data.imageUrl);
      toast({ title: t.success, description: "Invoice image uploaded successfully" });
    } catch (error) {
      console.error("Invoice upload error:", error);
      toast({ title: t.error, description: "Failed to upload invoice image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Sync inventory items to procurement
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/procurement/sync-inventory");
      return response.json();
    },
    onSuccess: (data: { created: number; skipped: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      toast({ 
        title: t.success, 
        description: `Synced ${data.created} inventory items to procurement (${data.skipped} already existed)` 
      });
    },
    onError: (error: Error) => {
      console.error("Sync inventory error:", error);
      toast({ title: t.error, description: error.message || "Failed to sync inventory", variant: "destructive" });
    },
  });

  const stats = {
    total: procurements.length,
    pending: procurements.filter(p => p.status === "pending").length,
    approved: procurements.filter(p => p.status === "approved").length,
    inProgress: procurements.filter(p => ["ordered", "received"].includes(p.status)).length,
    completed: procurements.filter(p => p.status === "completed").length,
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Procurement Management</h1>
          <p className="text-muted-foreground">Manage inventory, maintenance, installations, and equipment procurement</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-inventory"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Inventory'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); form.reset(); setInvoiceImage(null); }} data-testid="button-add-procurement">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Procurement" : "New Procurement Request"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log("[Procurement] Form validation errors:", errors))} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="installation">Installation</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title" {...field} data-testid="input-title" />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} value={field.value || ""} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Supplier name" {...field} value={field.value || ""} data-testid="input-supplier" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Category" {...field} value={field.value || ""} data-testid="input-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-quantity" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price (SAR)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} value={field.value || ""} data-testid="input-unit-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost (SAR)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} data-testid="input-total-cost" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested By</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} value={field.value || ""} data-testid="input-requested-by" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                                {/* Invoice Image Upload */}
                <div className="space-y-2">
                  <Label>Invoice Image</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      isUploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) handleInvoiceUpload(file);
                    }}
                  >
                    {invoiceImage ? (
                      <div className="flex items-center gap-3">
                        {invoiceImage.endsWith('.pdf') ? (
                          <FileText className="h-10 w-10 text-red-500" />
                        ) : (
                          <img 
                            src={invoiceImage} 
                            alt="Invoice" 
                            className="h-16 w-16 object-cover rounded border"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">Invoice uploaded</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {invoiceImage.split('/').pop()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (invoiceImage?.endsWith('.pdf')) {
                                window.open(invoiceImage, '_blank');
                              } else {
                                setViewImageUrl(invoiceImage);
                              }
                            }}
                            data-testid="button-view-invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setInvoiceImage(null)}
                            data-testid="button-remove-invoice"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer gap-2">
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Drag & drop or click to upload invoice
                            </span>
                            <span className="text-xs text-muted-foreground">
                              JPEG, PNG, GIF, WebP, PDF (max 10MB)
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInvoiceUpload(file);
                          }}
                          disabled={isUploading}
                          data-testid="input-invoice-image"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes" {...field} value={field.value || ""} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingItem ? "Update" : "Create"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingItem(null); form.reset(); setInvoiceImage(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Procurement Requests</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40" data-testid="filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="installation" data-testid="tab-installation">Installation</TabsTrigger>
              <TabsTrigger value="equipment" data-testid="tab-equipment">Equipment</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : procurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No procurement requests found</div>
            ) : (
              <div className="space-y-4">
                {procurements.map((item) => {
                  const Icon = typeIcons[item.type as keyof typeof typeIcons];
                  const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];
                  
                  return (
                    <Card key={item.id} data-testid={`procurement-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-muted">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{item.title}</h3>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold">SAR {item.totalCost}</div>
                                  {item.quantity && item.unitPrice && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity} × SAR {item.unitPrice}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {item.status}
                                </Badge>
                                <Badge className={priorityColors[item.priority as keyof typeof priorityColors]}>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                                {item.category && (
                                  <Badge variant="secondary">{item.category}</Badge>
                                )}
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                {item.supplier && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Package className="h-4 w-4" />
                                    <span>{item.supplier}</span>
                                  </div>
                                )}
                                {item.requestedBy && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{item.requestedBy}</span>
                                  </div>
                                )}
                                {item.expectedDelivery && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Expected: {format(new Date(item.expectedDelivery), "MMM dd, yyyy")}</span>
                                  </div>
                                )}
                              </div>

                              {item.notes && (
                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  {item.notes}
                                </div>
                              )}

                              {item.invoiceImage && (
                                <div className="flex items-center gap-2 mt-2">
                                  {item.invoiceImage.endsWith('.pdf') ? (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                      <FileText className="h-5 w-5 text-red-500" />
                                      <span className="text-sm">Invoice PDF</span>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => window.open(item.invoiceImage!, '_blank')}
                                        data-testid={`button-view-invoice-${item.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 p-2 bg-muted rounded">
                                      <img 
                                        src={item.invoiceImage} 
                                        alt="Invoice" 
                                        className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80"
                                        onClick={() => setViewImageUrl(item.invoiceImage)}
                                      />
                                      <span className="text-sm text-muted-foreground">Invoice Image</span>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => setViewImageUrl(item.invoiceImage)}
                                        data-testid={`button-view-invoice-${item.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
                                  Edit
                                </Button>
                                {item.status === "pending" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "approved")}>
                                    Approve
                                  </Button>
                                )}
                                {item.status === "approved" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "ordered")}>
                                    Mark as Ordered
                                  </Button>
                                )}
                                {item.status === "ordered" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "received")}>
                                    Mark as Received
                                  </Button>
                                )}
                                {item.status === "received" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "completed")}>
                                    Mark as Completed
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this procurement request?")) {
                                      deleteMutation.mutate(item.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${item.id}`}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewImageUrl} onOpenChange={() => setViewImageUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice Image</DialogTitle>
          </DialogHeader>
          {viewImageUrl && (
            <div className="flex justify-center">
              <img 
                src={viewImageUrl} 
                alt="Invoice" 
                className="max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
