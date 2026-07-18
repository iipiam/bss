import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
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
import type { Procurement, InsertProcurement, Invoice, InventoryItem } from "@shared/schema";
import { insertProcurementSchema } from "@shared/schema";

interface ProcurementInvoice extends Invoice {
  procurement?: Procurement | null;
}
import { Plus, Package, Wrench, HardHat, Computer, Calendar, User, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, Upload, Image, X, FileText, Eye, Download, Search, Repeat, ImageOff } from "lucide-react";
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
  const { t, language } = useLanguage();
  const tipText = (en: string, ar: string) => (language === 'Arabic' ? ar : en);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all-statuses");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Procurement | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [viewingProcurementId, setViewingProcurementId] = useState<string | null>(null);
  const [viewImageError, setViewImageError] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [reorderItem, setReorderItem] = useState<Procurement | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState<string>("");
  const [reorderUnitPrice, setReorderUnitPrice] = useState<string>("");
  const [reorderUnit, setReorderUnit] = useState<string>("");
  const [reorderCategory, setReorderCategory] = useState<string>("");
  const [reorderExpirationDays, setReorderExpirationDays] = useState<string>("");
  const [reorderSupplier, setReorderSupplier] = useState<string>("");
  const [reorderStatus, setReorderStatus] = useState<string>("pending");
  const [reorderTotalPrice, setReorderTotalPrice] = useState<string>("");
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>("");

  // Fetch inventory items for linking procurement to existing inventory
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    refetchInterval: 5000, // Refresh every 5 seconds to keep stock levels updated
  });

  const { data: procurements = [], isLoading } = useQuery<Procurement[]>({
    queryKey: [
      "/api/procurement",
      {
        type: selectedType !== "all" && selectedType !== "invoices" ? selectedType : undefined,
        status: selectedStatus !== "all-statuses" ? selectedStatus : undefined,
      },
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (selectedType !== "all" && selectedType !== "invoices") queryParams.set("type", selectedType);
      if (selectedStatus !== "all-statuses") queryParams.set("status", selectedStatus);
      const queryString = queryParams.toString();
      const apiUrl = `/api/procurement${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch procurement data");
      return response.json();
    },
    enabled: selectedType !== "invoices",
  });

  const { data: procurementInvoices = [], isLoading: isLoadingInvoices } = useQuery<ProcurementInvoice[]>({
    queryKey: ["/api/procurement/invoices"],
    enabled: selectedType === "invoices",
  });

  const procurementFormSchema = z.object({
    type: z.string().min(1, t.typeRequired),
    title: z.string().min(1, t.titleRequired),
    description: z.string().optional().nullable(),
    supplier: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    quantity: z.coerce.number().optional().nullable(),
    unitPrice: z.string().optional().nullable(),
    totalCost: z.string().min(1, t.priceRequired),
    status: z.string().min(1, t.statusRequired),
    priority: z.string().min(1, t.priorityRequired),
    requestedBy: z.string().optional().nullable(),
    approvedBy: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    orderDate: z.date().optional().nullable(),
    expectedDelivery: z.date().optional().nullable(),
    actualDelivery: z.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    inventoryItemId: z.string().optional().nullable(),
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
      inventoryItemId: "",
    },
  });

  // Watch the type field to show/hide inventory selector
  const watchedType = form.watch("type");

  // Clear inventoryItemId when type changes away from "inventory"
  useEffect(() => {
    if (watchedType !== "inventory") {
      form.setValue("inventoryItemId", "");
    }
  }, [watchedType, form]);

  // Watch quantity and totalCost to auto-calculate unitPrice
  const watchedQuantity = form.watch("quantity");
  const watchedTotalCost = form.watch("totalCost");
  
  useEffect(() => {
    const quantity = parseFloat(String(watchedQuantity)) || 0;
    const totalCost = parseFloat(watchedTotalCost || "0") || 0;
    
    if (quantity > 0 && totalCost > 0) {
      const calculatedUnitPrice = (totalCost / quantity).toFixed(2);
      form.setValue("unitPrice", calculatedUnitPrice);
    }
  }, [watchedQuantity, watchedTotalCost, form]);

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
      toast({ title: t.error, description: error.message || t.failedToCreateProcurement, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcurement> }) => {
      await apiRequest("PATCH", `/api/procurement/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.success, description: t.procurementUpdated });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Update procurement error:", error);
      toast({ title: t.error, description: error.message || t.failedToUpdateProcurement, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/procurement/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ title: t.success, description: t.procurementDeleted });
    },
    onError: (error: Error) => {
      console.error("Delete procurement error:", error);
      toast({ title: t.error, description: error.message || t.failedToDeleteProcurement, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (data: { 
      id: string; 
      quantity: number; 
      unitPrice: string; 
      unit: string;
      totalPrice: string;
      category: string;
      expirationDays: number | null;
      supplier: string;
      status: string;
    }) => {
      await apiRequest("POST", `/api/procurement/${data.id}/reorder`, {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        unit: data.unit,
        totalPrice: data.totalPrice,
        category: data.category,
        expirationDays: data.expirationDays,
        supplier: data.supplier,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/procurement/invoices"] });
      setIsReorderDialogOpen(false);
      setReorderItem(null);
      setReorderQuantity("");
      setReorderUnitPrice("");
      setReorderUnit("");
      setReorderCategory("");
      setReorderExpirationDays("");
      setReorderSupplier("");
      setReorderStatus("pending");
      setReorderTotalPrice("");
      toast({ title: t.success, description: t.reorderCreated });
    },
    onError: (error: Error) => {
      console.error("Reorder procurement error:", error);
      toast({ title: t.error, description: error.message || t.failedToReorderProcurement, variant: "destructive" });
    },
  });

  const handleOpenReorderDialog = (item: Procurement) => {
    setReorderItem(item);
    const qty = item.quantity?.toString() || "1";
    const total = item.totalCost || "0";
    setReorderQuantity(qty);
    setReorderTotalPrice(total);
    // Calculate Price per Unit from Total Price ÷ Quantity
    const qtyNum = parseFloat(qty) || 1;
    const totalNum = parseFloat(total) || 0;
    setReorderUnitPrice(qtyNum > 0 ? (totalNum / qtyNum).toFixed(2) : "0.00");
    setReorderUnit(item.unit || "pcs");
    setReorderCategory(item.category || "inventory");
    setReorderExpirationDays((item as any).expirationDays?.toString() || "");
    setReorderSupplier(item.supplier || "");
    setReorderStatus("pending");
    setIsReorderDialogOpen(true);
  };

  const handleReorderQuantityChange = (value: string) => {
    setReorderQuantity(value);
    // Recalculate Price per Unit from Total Price ÷ Quantity
    const qty = parseFloat(value) || 0;
    const total = parseFloat(reorderTotalPrice) || 0;
    if (qty > 0) {
      setReorderUnitPrice((total / qty).toFixed(2));
    } else {
      setReorderUnitPrice("0.00");
    }
  };

  const handleReorderTotalPriceChange = (value: string) => {
    setReorderTotalPrice(value);
    // Recalculate Price per Unit from Total Price ÷ Quantity
    const qty = parseFloat(reorderQuantity) || 0;
    const total = parseFloat(value) || 0;
    if (qty > 0) {
      setReorderUnitPrice((total / qty).toFixed(2));
    } else {
      setReorderUnitPrice("0.00");
    }
  };

  const getReferenceQuantityDisplay = () => {
    if (reorderUnit === "pcs") {
      return t.referenceQuantityNotApplicable;
    }
    if (reorderItem?.quantity) {
      return `${reorderItem.quantity} ${reorderUnit}`;
    }
    return "-";
  };

  const handleReorderSubmit = () => {
    if (!reorderItem) return;
    const quantity = parseFloat(reorderQuantity) || 1;
    const unitPrice = reorderUnitPrice || "0";
    const unit = reorderUnit || "pcs";
    const totalPrice = reorderTotalPrice || "0";
    const category = reorderCategory || "inventory";
    const expirationDays = reorderExpirationDays ? parseInt(reorderExpirationDays, 10) : null;
    const supplier = reorderSupplier || "";
    const status = reorderStatus || "pending";
    reorderMutation.mutate({ 
      id: reorderItem.id, 
      quantity, 
      unitPrice, 
      unit,
      totalPrice,
      category,
      expirationDays,
      supplier,
      status,
    });
  };

  const handleSubmit = (data: z.infer<typeof procurementFormSchema>) => {
    console.log("[Procurement] Form submitted with data:", data);
    const trimmedUnitPrice = typeof data.unitPrice === 'string' ? data.unitPrice.trim() : null;
    const trimmedBranchId = typeof data.branchId === 'string' ? data.branchId.trim() : null;
    const trimmedTotalCost = data.totalCost.trim();
    const processedData: any = {
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
    // Include inventoryItemId for linking to existing inventory items (only for type="inventory")
    // Always send inventoryItemId on edit to ensure it's cleared when type changes
    if (data.type === "inventory" && data.inventoryItemId) {
      processedData.inventoryItemId = data.inventoryItemId;
    } else if (editingItem) {
      // Explicitly clear inventoryItemId when not type="inventory" or no item selected
      processedData.inventoryItemId = null;
    }
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
      inventoryItemId: item.inventoryItemId || "",
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
      toast({ title: t.success, description: t.invoiceUploaded });
    } catch (error) {
      console.error("Invoice upload error:", error);
      toast({ title: t.error, description: t.invoiceUploadError, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle invoice download using dedicated server endpoint
  const handleInvoiceDownload = async (procurementId: string) => {
    try {
      // Use dedicated download endpoint that handles all URL formats server-side
      // and returns file with proper Content-Disposition: attachment header
      const response = await fetch(`/api/procurement/${procurementId}/download-invoice`, { 
        credentials: "include" 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Download failed" }));
        throw new Error(errorData.error || "Failed to download invoice");
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'invoice.pdf';
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({ title: t.success, description: t.invoiceDownloaded });
    } catch (error) {
      console.error("Invoice download error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download invoice";
      toast({ title: t.error, description: errorMessage, variant: "destructive" });
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
        description: t.inventorySynced
      });
    },
    onError: (error: Error) => {
      console.error("Sync inventory error:", error);
      toast({ title: t.error, description: error.message || t.failedToSyncInventory, variant: "destructive" });
    },
  });

  // Sync procurement items to shop bills
  const syncBillsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/procurement/sync-shop-bills");
      return response.json();
    },
    onSuccess: (data: { created: number; updated: number; deleted: number; skipped: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurement"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      toast({ 
        title: t.success, 
        description: t.shopBillsSynced
      });
    },
    onError: (error: Error) => {
      console.error("Sync shop bills error:", error);
      toast({ title: t.error, description: error.message || t.failedToSyncShopBills, variant: "destructive" });
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
    <TooltipProvider delayDuration={150}>
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.procurementManagement}</h1>
          <p className="text-muted-foreground">{t.procurementDescription}</p>
        </div>
        <div className="flex gap-2 mobile-stack">
          <Button 
            variant="outline" 
            onClick={() => syncBillsMutation.mutate()}
            disabled={syncBillsMutation.isPending}
            data-testid="button-sync-shop-bills"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncBillsMutation.isPending ? 'animate-spin' : ''}`} />
            {syncBillsMutation.isPending ? t.syncing : t.syncShopBills}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-inventory"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? t.syncing : t.syncInventory}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); form.reset(); setInvoiceImage(null); }} data-testid="button-add-procurement">
                <Plus className="h-4 w-4 mr-2" />
                {t.newRequest}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? t.editProcurement : t.newProcurementRequest}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log("[Procurement] Form validation errors:", errors))} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.type}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder={t.selectType} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inventory">{t.inventory}</SelectItem>
                            <SelectItem value="maintenance">{t.maintenance}</SelectItem>
                            <SelectItem value="installation">{t.installation}</SelectItem>
                            <SelectItem value="equipment">{t.equipment}</SelectItem>
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
                        <FormLabel>{t.priority}<InfoTip>{tipText("Urgency level: low, medium, high, or urgent.", "مستوى الأولوية: منخفض، متوسط، عالٍ، أو عاجل.")}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder={t.selectPriority} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t.low}</SelectItem>
                            <SelectItem value="medium">{t.medium}</SelectItem>
                            <SelectItem value="high">{t.high}</SelectItem>
                            <SelectItem value="urgent">{t.urgent}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Inventory item selector - only show when type is "inventory" */}
                {watchedType === "inventory" && (
                  <FormField
                    control={form.control}
                    name="inventoryItemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.linkToExistingInventory}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value === "new" ? "" : value);
                            // Auto-fill title and category from selected inventory item
                            if (value && value !== "new") {
                              const selectedItem = inventoryItems.find(item => item.id === value);
                              if (selectedItem) {
                                form.setValue("title", selectedItem.name);
                                form.setValue("category", selectedItem.category || "");
                                form.setValue("supplier", selectedItem.supplier || "");
                              }
                            }
                          }} 
                          value={field.value || "new"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-inventory-item">
                              <SelectValue placeholder={t.createNewInventoryItem} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">+ {t.createNewInventoryItem}</SelectItem>
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.quantity} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.title}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.enterTitle} {...field} data-testid="input-title" />
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
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t.enterDescription} {...field} value={field.value || ""} data-testid="input-description" />
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
                        <FormLabel>{t.supplier}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.supplierName} {...field} value={field.value || ""} data-testid="input-supplier" />
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
                        <FormLabel>{t.category}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.selectCategory} {...field} value={field.value || ""} data-testid="input-category" />
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
                        <FormLabel>{t.quantity}</FormLabel>
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
                        <FormLabel>{t.pricePerUnit} (SAR)<InfoTip>{tipText("Auto-calculated from total cost divided by quantity.", "يُحسب تلقائياً من إجمالي التكلفة مقسوماً على الكمية.")}</InfoTip></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0.00" 
                            {...field} 
                            value={field.value || ""} 
                            readOnly 
                            className="bg-muted"
                            data-testid="input-unit-price" 
                          />
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
                        <FormLabel>{t.totalCost} (SAR)<InfoTip>{tipText("Total purchase amount in SAR (used to derive unit price).", "إجمالي مبلغ الشراء بالريال السعودي (يُستخدم لاحتساب سعر الوحدة).")}</InfoTip></FormLabel>
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
                        <FormLabel>{t.requestedBy}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.name} {...field} value={field.value || ""} data-testid="input-requested-by" />
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
                        <FormLabel>{t.status}<InfoTip>{tipText("Workflow stage: pending, approved, ordered, received, completed, or cancelled.", "مرحلة الطلب: قيد الانتظار، معتمد، مطلوب، مستلم، مكتمل، أو ملغى.")}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder={t.selectStatus} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">{t.pending}</SelectItem>
                            <SelectItem value="approved">{t.approved}</SelectItem>
                            <SelectItem value="ordered">{t.ordered}</SelectItem>
                            <SelectItem value="received">{t.received}</SelectItem>
                            <SelectItem value="completed">{t.completed}</SelectItem>
                            <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                                {/* Invoice Image Upload */}
                <div className="space-y-2">
                  <Label>{t.invoiceImage}</Label>
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
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.invoiceUploaded}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {invoiceImage.split('/').pop()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                aria-label={t.view}
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
                            </TooltipTrigger>
                            <TooltipContent>{t.view}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                aria-label="Remove"
                                onClick={() => setInvoiceImage(null)}
                                data-testid="button-remove-invoice"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer gap-2">
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                            <span className="text-sm text-muted-foreground">{t.loading}...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {t.dragDropOrClickToUpload}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t.supportedFileTypes}
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
                      <FormLabel>{t.notes}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t.additionalNotes} {...field} value={field.value || ""} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? t.saving : editingItem ? t.update : t.create}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingItem(null); form.reset(); setInvoiceImage(null); }}>
                    {t.cancel}
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
            <CardTitle className="text-sm font-medium">
              {t.totalRequests}
              <InfoTip>{tipText("Total number of procurement requests created.", "إجمالي عدد طلبات الشراء التي تم إنشاؤها.")}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t.pending}
              <InfoTip>{tipText("Requests awaiting approval.", "الطلبات في انتظار الموافقة.")}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t.approved}
              <InfoTip>{tipText("Requests approved but not yet ordered.", "الطلبات المعتمدة ولم يتم طلبها بعد.")}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t.inProgress}
              <InfoTip>{tipText("Orders that are placed or received.", "الطلبات المُرسلة أو المستلمة.")}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t.completed}
              <InfoTip>{tipText("Fully completed procurement requests.", "طلبات الشراء المكتملة بالكامل.")}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>{t.procurementRequests}</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="search-procurement" className="text-sm font-medium">{t.search}:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-procurement"
                    placeholder={t.searchProcurement}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                    data-testid="input-search-procurement"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40" data-testid="filter-status">
                  <SelectValue placeholder={t.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">{t.allStatuses}</SelectItem>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="approved">{t.approved}</SelectItem>
                  <SelectItem value="ordered">{t.ordered}</SelectItem>
                  <SelectItem value="received">{t.received}</SelectItem>
                  <SelectItem value="completed">{t.completed}</SelectItem>
                  <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">{t.all}</TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">{t.inventory}</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">{t.maintenance}</TabsTrigger>
              <TabsTrigger value="installation" data-testid="tab-installation">{t.installation}</TabsTrigger>
              <TabsTrigger value="equipment" data-testid="tab-equipment">{t.equipment}</TabsTrigger>
              <TabsTrigger value="invoices" data-testid="tab-invoices">{t.invoices}</TabsTrigger>
            </TabsList>

            {selectedType === "invoices" ? (
              isLoadingInvoices ? (
                <div className="text-center py-8 text-muted-foreground">{t.loading}...</div>
              ) : procurementInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t.noProcurementFound}</div>
              ) : (
                <div className="space-y-4">
                  {procurementInvoices.map((invoice) => (
                    <Card key={invoice.id} data-testid={`invoice-${invoice.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-muted">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                                  {invoice.procurement?.title && (
                                    <p className="text-sm text-muted-foreground mt-1">{invoice.procurement.title}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold">SAR {invoice.total}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {t.vatAmount}: SAR {invoice.vatAmount}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                                </Badge>
                                {invoice.customerName && (
                                  <Badge variant="secondary">
                                    <User className="h-3 w-3 mr-1" />
                                    {invoice.customerName}
                                  </Badge>
                                )}
                                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                  {invoice.invoiceType}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (invoice.pdfPath) {
                                      window.open(invoice.pdfPath, '_blank');
                                    }
                                  }}
                                  disabled={!invoice.pdfPath}
                                  data-testid={`button-download-invoice-${invoice.id}`}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {t.download}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t.loading}...</div>
            ) : procurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.noProcurementFound}</div>
            ) : (
              <div className="space-y-4">
                {procurements
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .filter((item) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      item.title?.toLowerCase().includes(query) ||
                      item.description?.toLowerCase().includes(query) ||
                      item.supplier?.toLowerCase().includes(query) ||
                      item.category?.toLowerCase().includes(query) ||
                      item.requestedBy?.toLowerCase().includes(query)
                    );
                  })
                  .map((item) => {
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
                                  {item.quantity && parseFloat(String(item.quantity)) > 0 && item.totalCost && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity} × SAR {(parseFloat(String(item.totalCost)) / parseFloat(String(item.quantity))).toFixed(2)}/unit
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
                                {item.billId && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t.syncedToBills}
                                  </Badge>
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
                                    <span>{t.expectedDelivery}: {format(new Date(item.expectedDelivery), "MMM dd, yyyy")}</span>
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
                                      <span className="text-sm">{t.invoicePdf}</span>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => window.open(item.invoiceImage!, '_blank')}
                                        data-testid={`button-view-invoice-${item.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {t.view}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => handleInvoiceDownload(item.id)}
                                        data-testid={`button-download-invoice-${item.id}`}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        {t.download}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 p-2 bg-muted rounded">
                                      {failedThumbs.has(item.id) ? (
                                        <div 
                                          className="h-12 w-12 flex items-center justify-center rounded border cursor-pointer"
                                          onClick={() => { setViewImageError(false); setViewImageUrl(item.invoiceImage); setViewingProcurementId(item.id); }}
                                          data-testid={`thumb-invoice-missing-${item.id}`}
                                        >
                                          <ImageOff className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                      ) : (
                                        <img 
                                          src={item.invoiceImage} 
                                          alt="Invoice" 
                                          className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80"
                                          onClick={() => { setViewImageError(false); setViewImageUrl(item.invoiceImage); setViewingProcurementId(item.id); }}
                                          onError={() => setFailedThumbs(prev => { const next = new Set(prev); next.add(item.id); return next; })}
                                        />
                                      )}
                                      <span className="text-sm text-muted-foreground">{t.invoiceImage}</span>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => { setViewImageError(false); setViewImageUrl(item.invoiceImage); setViewingProcurementId(item.id); }}
                                        data-testid={`button-view-invoice-${item.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {t.view}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => handleInvoiceDownload(item.id)}
                                        data-testid={`button-download-invoice-${item.id}`}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        {t.download}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
                                  {t.edit}
                                </Button>
                                {item.status === "pending" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "approved")}>
                                    {t.approve}
                                  </Button>
                                )}
                                {item.status === "approved" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "ordered")}>
                                    {t.markAsOrdered}
                                  </Button>
                                )}
                                {item.status === "ordered" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "received")}>
                                    {t.markAsReceived}
                                  </Button>
                                )}
                                {item.status === "received" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, "completed")}>
                                    {t.markAsCompleted}
                                  </Button>
                                )}
                                {item.type === "inventory" && ["received", "completed"].includes(item.status) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleOpenReorderDialog(item)}
                                    data-testid={`button-reorder-${item.id}`}
                                  >
                                    <Repeat className="h-3 w-3 mr-1" />
                                    {t.reorder}
                                  </Button>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => {
                                        if (confirm(t.deleteProcurementConfirm)) {
                                          deleteMutation.mutate(item.id);
                                        }
                                      }}
                                      data-testid={`button-delete-${item.id}`}
                                    >
                                      {t.delete}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{tipText("Permanently delete this procurement request.", "حذف طلب الشراء هذا نهائياً.")}</TooltipContent>
                                </Tooltip>
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
      <Dialog open={!!viewImageUrl} onOpenChange={() => { setViewImageUrl(null); setViewingProcurementId(null); setViewImageError(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t.invoiceImage}</DialogTitle>
          </DialogHeader>
          {viewImageUrl && (
            <div className="flex flex-col items-center gap-4">
              {viewImageError ? (
                <div className="flex flex-col items-center gap-3 py-8" data-testid="text-invoice-missing">
                  <ImageOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {t.invoiceFileMissing}
                  </p>
                </div>
              ) : (
                <>
                  <img 
                    src={viewImageUrl} 
                    alt="Invoice" 
                    className="max-h-[60vh] object-contain"
                    onError={() => setViewImageError(true)}
                  />
                  {viewingProcurementId && (
                    <Button 
                      onClick={() => handleInvoiceDownload(viewingProcurementId)}
                      data-testid="button-download-invoice-viewer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t.download}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={isReorderDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReorderDialogOpen(false);
          setReorderItem(null);
          setReorderQuantity("");
          setReorderUnitPrice("");
          setReorderUnit("");
          setReorderCategory("");
          setReorderExpirationDays("");
          setReorderSupplier("");
          setReorderStatus("pending");
          setReorderTotalPrice("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.reorder}: {reorderItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder-category">{t.category}</Label>
                <Select value={reorderCategory} onValueChange={setReorderCategory}>
                  <SelectTrigger id="reorder-category" data-testid="select-reorder-category">
                    <SelectValue placeholder={t.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">{t.inventory}</SelectItem>
                    <SelectItem value="maintenance">{t.maintenance}</SelectItem>
                    <SelectItem value="installation">{t.installation}</SelectItem>
                    <SelectItem value="equipment">{t.equipment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder-unit">{t.unit}</Label>
                <Select value={reorderUnit} onValueChange={setReorderUnit}>
                  <SelectTrigger id="reorder-unit" data-testid="select-reorder-unit">
                    <SelectValue placeholder={t.unit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorder-quantity">{t.quantity}</Label>
                <Input
                  id="reorder-quantity"
                  type="number"
                  min="1"
                  step="0.01"
                  value={reorderQuantity}
                  onChange={(e) => handleReorderQuantityChange(e.target.value)}
                  placeholder="1"
                  data-testid="input-reorder-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.referenceQuantity}</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {getReferenceQuantityDisplay()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder-unit-price">{t.pricePerUnit} (SAR)</Label>
              <Input
                id="reorder-unit-price"
                type="text"
                value={reorderUnitPrice}
                readOnly
                disabled
                className="bg-muted"
                data-testid="input-reorder-unit-price"
              />
              <p className="text-xs text-muted-foreground">
                {t.automaticallyCalculated}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder-total-price">{t.totalPrice} (SAR)</Label>
              <Input
                id="reorder-total-price"
                type="number"
                min="0"
                step="0.01"
                value={reorderTotalPrice}
                onChange={(e) => handleReorderTotalPriceChange(e.target.value)}
                placeholder="0.00"
                data-testid="input-reorder-total-price"
              />
              <p className="text-xs text-muted-foreground">
                {t.totalPriceForEntireStock}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder-expiration-days">{t.expirationDays}<InfoTip>{tipText("Number of days until this stock expires (leave blank if none).", "عدد الأيام حتى انتهاء صلاحية المخزون (اتركه فارغاً إن لم يوجد).")}</InfoTip></Label>
              <Input
                id="reorder-expiration-days"
                type="number"
                min="0"
                step="1"
                value={reorderExpirationDays}
                onChange={(e) => setReorderExpirationDays(e.target.value)}
                placeholder=""
                data-testid="input-reorder-expiration-days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder-supplier">{t.supplier}</Label>
              <Input
                id="reorder-supplier"
                type="text"
                value={reorderSupplier}
                onChange={(e) => setReorderSupplier(e.target.value)}
                placeholder={t.supplierName}
                data-testid="input-reorder-supplier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder-status">{t.status}</Label>
              <Select value={reorderStatus} onValueChange={setReorderStatus}>
                <SelectTrigger id="reorder-status" data-testid="select-reorder-status">
                  <SelectValue placeholder={t.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="approved">{t.approved}</SelectItem>
                  <SelectItem value="ordered">{t.ordered}</SelectItem>
                  <SelectItem value="received">{t.received}</SelectItem>
                  <SelectItem value="completed">{t.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReorderDialogOpen(false)}
              data-testid="button-reorder-cancel"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleReorderSubmit}
              disabled={reorderMutation.isPending || !reorderQuantity || !reorderTotalPrice}
              data-testid="button-reorder-submit"
            >
              {reorderMutation.isPending ? t.saving : t.create}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
