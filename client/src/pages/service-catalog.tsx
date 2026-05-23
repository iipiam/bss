import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Wrench,
  CheckCircle,
  DollarSign,
  Tag,
  Clock,
  Layers,
  Package,
  X,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { format } from "date-fns";

interface ServiceCatalogItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  category: string | null;
  pricingMethod: string;
  unitPrice: string;
  unit: string | null;
  estimatedDuration: string | null;
  status: string;
  createdAt: string;
}

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  pricingMethod: z.string().min(1, "Pricing method is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
  unit: z.string().optional().default(""),
  estimatedDuration: z.string().optional().default(""),
  status: z.string().min(1, "Status is required"),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ProductItemDraft {
  name: string;
  cost: string;
  sellingPrice: string;
  percentage: string;
  phase: string;
}
interface ProductServiceDraft {
  serviceCatalogId: string;
  name: string;
  unitPrice: string;
  quantity: string;
  phase: string;
}
interface ProductTaskDraft {
  name: string;
  description: string;
  duration: string;
  phase: string;
}
interface ServiceProduct {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  createdAt: string;
}
interface ServiceProductDetail extends ServiceProduct {
  items: Array<{ id: string; name: string; cost: string; percentage: string; sortOrder: number; phase?: number }>;
  services: Array<{ id: string; serviceCatalogId: string | null; name: string | null; unitPrice: string | null; quantity: string; sortOrder: number; phase?: number }>;
  tasks: Array<{ id: string; name: string; description: string | null; duration: number; sortOrder: number; phase?: number }>;
}

const getPricingMethodLabel = (method: string, t: any): string => {
  const labels: Record<string, string> = {
    per_piece: t.perPiece,
    per_length: t.perLength,
    per_area: t.perArea,
    per_hour: t.perHour,
    lump_sum: t.lumpSum,
  };
  return labels[method] || method;
};

function getStatusBadgeVariant(status: string): "default" | "secondary" {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    default:
      return "secondary";
  }
}

export default function ServiceCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceCatalogItem | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ServiceProduct | null>(null);
  const [reportProductId, setReportProductId] = useState<string | null>(null);
  const [reportSellingPrice, setReportSellingPrice] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStatus, setProductStatus] = useState("active");
  const [productItems, setProductItems] = useState<ProductItemDraft[]>([]);
  const [productServices, setProductServices] = useState<ProductServiceDraft[]>([]);
  const [productTasks, setProductTasks] = useState<ProductTaskDraft[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      pricingMethod: "per_piece",
      unitPrice: "",
      unit: "",
      estimatedDuration: "",
      status: "active",
    },
  });

  const { data: services = [], isLoading } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/service-catalog"],
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<ServiceProduct[]>({
    queryKey: ["/api/service-products"],
  });

  const { data: editingProduct } = useQuery<ServiceProductDetail>({
    queryKey: ["/api/service-products", editingProductId],
    enabled: !!editingProductId,
  });

  const resetProductForm = () => {
    setProductName("");
    setProductDescription("");
    setProductCategory("");
    setProductStatus("active");
    setProductItems([]);
    setProductServices([]);
    setProductTasks([]);
    setEditingProductId(null);
  };

  const loadProductIntoForm = (p: ServiceProductDetail) => {
    setProductName(p.name);
    setProductDescription(p.description || "");
    setProductCategory(p.category || "");
    setProductStatus(p.status);
    setProductItems(p.items.map((i) => ({ name: i.name, cost: i.cost, sellingPrice: (i as any).sellingPrice ?? "0", percentage: i.percentage, phase: String(i.phase ?? 1) })));
    setProductServices(p.services.map((s) => ({ serviceCatalogId: s.serviceCatalogId || "", name: s.name || "", unitPrice: s.unitPrice || "", quantity: s.quantity, phase: String(s.phase ?? 1) })));
    setProductTasks(p.tasks.map((tk) => ({ name: tk.name, description: tk.description || "", duration: String(tk.duration), phase: String(tk.phase ?? 1) })));
  };

  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: productName,
        description: productDescription || null,
        category: productCategory || null,
        status: productStatus,
        items: productItems.map((i, idx) => ({
          name: i.name,
          cost: i.cost || "0",
          sellingPrice: i.sellingPrice || "0",
          percentage: i.percentage || "0",
          sortOrder: idx,
          phase: Math.max(1, parseInt(i.phase || "1", 10) || 1),
        })),
        services: productServices.map((s, idx) => ({
          serviceCatalogId: s.serviceCatalogId || null,
          name: s.name || null,
          unitPrice: s.unitPrice || null,
          quantity: s.quantity || "1",
          sortOrder: idx,
          phase: Math.max(1, parseInt(s.phase || "1", 10) || 1),
        })),
        tasks: productTasks.map((tk, idx) => ({
          name: tk.name,
          description: tk.description || null,
          duration: parseInt(tk.duration || "1", 10),
          sortOrder: idx,
          phase: Math.max(1, parseInt(tk.phase || "1", 10) || 1),
        })),
      };
      const invalid = productServices.find((s) => !s.serviceCatalogId && s.name.trim() && (!s.unitPrice || isNaN(parseFloat(s.unitPrice)) || parseFloat(s.unitPrice) <= 0));
      if (invalid) {
        throw new Error(t.serviceNeedsPrice || `Service "${invalid.name}" needs a unit price greater than 0.`);
      }
      if (editingProductId) {
        return await apiRequest("PATCH", `/api/service-products/${editingProductId}`, payload);
      }
      return await apiRequest("POST", "/api/service-products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-products"] });
      setProductDialogOpen(false);
      resetProductForm();
      toast({
        title: editingProductId ? (t.productUpdated || "Product updated") : (t.productCreated || "Product created"),
      });
    },
    onError: (e: any) => {
      toast({
        title: t.failedToSaveProduct || "Failed to save product",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/service-products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-products"] });
      setDeletingProduct(null);
      toast({ title: t.productDeleted || "Product deleted" });
    },
  });

  const handleEditProduct = (p: ServiceProduct) => {
    setEditingProductId(p.id);
    setProductDialogOpen(true);
  };

  useEffect(() => {
    if (editingProductId && editingProduct && editingProduct.id === editingProductId) {
      loadProductIntoForm(editingProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProductId, editingProduct]);

  const handleOpenProductDialog = (isOpen: boolean) => {
    setProductDialogOpen(isOpen);
    if (!isOpen) resetProductForm();
  };

  const handleAddNewProduct = () => {
    resetProductForm();
    setProductDialogOpen(true);
  };

  const productTotalCost = productItems.reduce((sum, i) => sum + parseFloat(i.cost || "0"), 0);
  const productTotalSellingPrice = productItems.reduce((sum, i) => sum + parseFloat(i.sellingPrice || "0"), 0);
  const productTotalPercentage = productItems.reduce((sum, i) => sum + parseFloat(i.percentage || "0"), 0);
  const productServicesCost = productServices.reduce((sum, s) => {
    const qty = parseFloat(s.quantity || "1") || 1;
    const unit = parseFloat(s.unitPrice || "0") || 0;
    return sum + qty * unit;
  }, 0);
  const productGrandTotalCost = productTotalCost + productServicesCost;

  const { data: reportProduct } = useQuery<ServiceProductDetail>({
    queryKey: ["/api/service-products", reportProductId],
    enabled: !!reportProductId,
  });

  const reportTotals = (() => {
    if (!reportProduct) return { itemsCost: 0, itemsSellingPrice: 0, servicesCost: 0, total: 0 };
    const itemsCost = (reportProduct.items || []).reduce(
      (s, it) => s + (parseFloat(it.cost || "0") || 0),
      0,
    );
    const itemsSellingPrice = (reportProduct.items || []).reduce(
      (s, it) => s + (parseFloat(((it as any).sellingPrice) || "0") || 0),
      0,
    );
    const servicesCost = (reportProduct.services || []).reduce((s, sv) => {
      const qty = parseFloat(sv.quantity || "1") || 1;
      const unit = parseFloat(sv.unitPrice || "0") || 0;
      return s + qty * unit;
    }, 0);
    return { itemsCost, itemsSellingPrice, servicesCost, total: itemsCost + servicesCost };
  })();

  // Auto-fill the profit calculator with the product's total items selling
  // price whenever the report data (or its underlying entries) change, unless
  // the user has manually edited the field.
  const [reportSellingPriceTouched, setReportSellingPriceTouched] = useState(false);
  useEffect(() => {
    if (!reportProduct || reportSellingPriceTouched) return;
    setReportSellingPrice(
      reportTotals.itemsSellingPrice > 0 ? reportTotals.itemsSellingPrice.toFixed(2) : "",
    );
  }, [reportProduct, reportTotals.itemsSellingPrice, reportSellingPriceTouched]);

  const reportSellingPriceNum = parseFloat(reportSellingPrice || "0") || 0;
  const reportProfit = reportSellingPriceNum - reportTotals.total;
  const reportMargin = reportSellingPriceNum > 0 ? (reportProfit / reportSellingPriceNum) * 100 : 0;
  const reportMarkup = reportTotals.total > 0 ? (reportProfit / reportTotals.total) * 100 : 0;

  const openReport = (id: string) => {
    setReportProductId(id);
    setReportSellingPrice("");
    setReportSellingPriceTouched(false);
  };

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const payload = {
        ...data,
        description: data.description || null,
        category: data.category || null,
        unit: data.unit || null,
        estimatedDuration: data.estimatedDuration || null,
      };
      return await apiRequest("POST", "/api/service-catalog", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setOpen(false);
      form.reset();
      toast({
        title: t.serviceCreated,
        description: t.serviceCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateService,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues & { id: string }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        pricingMethod: data.pricingMethod,
        unitPrice: data.unitPrice,
        unit: data.unit || null,
        estimatedDuration: data.estimatedDuration || null,
        status: data.status,
      };
      return await apiRequest("PATCH", `/api/service-catalog/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: t.serviceUpdated,
        description: t.serviceUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateService,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/service-catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setDeletingService(null);
      toast({
        title: t.serviceDeleted,
        description: t.serviceDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteService,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    const payload = {
      ...data,
      description: data.description || null,
      category: data.category || null,
      unit: data.unit || null,
      estimatedDuration: data.estimatedDuration || null,
    };
    if (editingService) {
      updateServiceMutation.mutate({ ...payload, id: editingService.id });
    } else {
      createServiceMutation.mutate(payload);
    }
  };

  const handleEdit = (service: ServiceCatalogItem) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      category: service.category || "",
      pricingMethod: service.pricingMethod,
      unitPrice: service.unitPrice,
      unit: service.unit || "",
      estimatedDuration: service.estimatedDuration || "",
      status: service.status,
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingService(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingService(null);
    form.reset();
  };

  const handleAddNew = () => {
    form.reset({
      name: "",
      description: "",
      category: "",
      pricingMethod: "per_piece",
      unitPrice: "",
      unit: "",
      estimatedDuration: "",
      status: "active",
    });
    setEditingService(null);
    setOpen(true);
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeServices = services.filter((s) => s.status === "active");
  const avgPrice =
    services.length > 0
      ? services.reduce((sum, s) => sum + parseFloat(s.unitPrice || "0"), 0) / services.length
      : 0;
  const totalCategories = new Set(services.map((s) => s.category).filter(Boolean)).size;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            <h1 className={`${layout.text3Xl} font-bold`} data-testid="text-service-catalog-title">
              {t.serviceCatalogPage}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {t.serviceCatalogDescription}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
        <Button
          data-testid="button-add-product"
          variant="outline"
          className={layout.isMobile ? "h-[44px]" : ""}
          onClick={() => { setActiveTab("products"); handleAddNewProduct(); }}
        >
          <Package className="h-4 w-4 mr-2" />
          {t.addProduct || "Add Product"}
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-service"
              className={layout.isMobile ? "h-[44px]" : ""}
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addService}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? t.editService : t.addService}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? t.updateServiceInfo
                  : t.addNewService}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.serviceName}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-service-name"
                          placeholder={t.enterServiceName}
                          {...field}
                        />
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
                        <Textarea
                          data-testid="input-service-description"
                          placeholder={t.serviceDescription}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-service-category"
                            placeholder="e.g., Installation"
                            {...field}
                          />
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
                        <FormLabel>{t.status}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-status">
                              <SelectValue placeholder={t.selectStatus} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t.active}</SelectItem>
                            <SelectItem value="inactive">{t.inactive}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.pricingMethod}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pricing-method">
                              <SelectValue placeholder={t.selectMethod} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="per_piece">{t.perPiece}</SelectItem>
                            <SelectItem value="per_length">{t.perLength}</SelectItem>
                            <SelectItem value="per_area">{t.perArea}</SelectItem>
                            <SelectItem value="per_hour">{t.perHour}</SelectItem>
                            <SelectItem value="lump_sum">{t.lumpSum}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.price}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-unit-price"
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.unit}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-service-unit"
                            placeholder="e.g., meter, sqm, hour"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.estimatedDuration}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-estimated-duration"
                            placeholder="e.g., 2 hours, 1 day"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-submit"
                    disabled={
                      createServiceMutation.isPending ||
                      updateServiceMutation.isPending
                    }
                  >
                    {editingService ? t.save : t.add}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="services" data-testid="tab-services">
            <Wrench className="h-4 w-4 mr-2" />
            {t.serviceCatalogTab || "Services"}
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />
            {t.productsTab || "Products"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-services"
          placeholder={`${t.search} ${t.serviceCatalogPage.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div
        className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 2 })}`}
      >
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.totalServices}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-services">
              {services.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.activeServices}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-active-services">
              {activeServices.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.avgPrice}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-average-price">
              {avgPrice.toFixed(2)} SAR
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.categories}</p>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-categories">
              {totalCategories}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Wrench className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? t.noServicesFound
              : t.noServicesYet}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              data-testid={`card-service-${service.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-service-name-${service.id}`}
                  >
                    {service.name}
                  </h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.edit}
                        onClick={() => handleEdit(service)}
                        data-testid={`button-edit-${service.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.edit}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.delete}
                        onClick={() => setDeletingService(service)}
                        data-testid={`button-delete-${service.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.delete}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusBadgeVariant(service.status)}
                    className={service.status === "active" ? "bg-green-600 text-white no-default-hover-elevate" : ""}
                  >
                    {service.status === "active" ? t.active : service.status === "inactive" ? t.inactive : t.draft}
                  </Badge>
                  <Badge variant="outline">
                    {getPricingMethodLabel(service.pricingMethod, t)}
                  </Badge>
                </div>

                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-service-description-${service.id}`}>
                    {service.description}
                  </p>
                )}

                <div className="space-y-1.5">
                  {service.category && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate" data-testid={`text-service-category-${service.id}`}>
                        {service.category}
                      </span>
                    </div>
                  )}
                  {service.estimatedDuration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate" data-testid={`text-service-duration-${service.id}`}>
                        {service.estimatedDuration}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <DollarSign className="h-3 w-3" />
                    <span data-testid={`text-service-price-${service.id}`}>
                      {parseFloat(service.unitPrice).toLocaleString()} SAR
                    </span>
                  </div>
                  {service.unit && (
                    <span className="text-xs text-muted-foreground">
                      / {service.unit}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{formatDate(service.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-4">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center p-12"><p>{t.loading}...</p></div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t.noProducts || "No products yet."}</p>
            </div>
          ) : (
            <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}>
              {products.map((p) => (
                <Card key={p.id} data-testid={`card-product-${p.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold truncate" data-testid={`text-product-name-${p.id}`}>{p.name}</h3>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openReport(p.id)} data-testid={`button-report-product-${p.id}`}>
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.costProfitReport || "Cost & Profit Report"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)} data-testid={`button-edit-product-${p.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.edit}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(p)} data-testid={`button-delete-product-${p.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.delete}</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={p.status === "active" ? "default" : "secondary"} className={p.status === "active" ? "bg-green-600 text-white no-default-hover-elevate" : ""}>
                        {p.status === "active" ? t.active : t.inactive}
                      </Badge>
                      {p.category && <Badge variant="outline">{p.category}</Badge>}
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openReport(p.id)}
                      data-testid={`button-open-report-${p.id}`}
                    >
                      <TrendingUp className="h-4 w-4 me-2" />
                      {t.costProfitReport || "Cost & Profit Report"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={productDialogOpen} onOpenChange={handleOpenProductDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProductId ? (t.editProduct || "Edit Product") : (t.addProduct || "Add Product")}</DialogTitle>
            <DialogDescription>{t.serviceProductsDescription || "Bundle items, services, and tasks into reusable products."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.productName || "Product Name"}</Label>
                <Input data-testid="input-product-name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.productCategory || "Category"}</Label>
                <Input data-testid="input-product-category" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.description}</Label>
              <Textarea data-testid="input-product-description" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>{t.status}</Label>
              <Select value={productStatus} onValueChange={setProductStatus}>
                <SelectTrigger data-testid="select-product-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="inactive">{t.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" /> {t.productItems || "Items"}
                </Label>
                <Button type="button" size="sm" variant="outline" data-testid="button-add-product-item"
                  onClick={() => { const nextPh = Math.max(1, ...productItems.map(x => parseInt(x.phase || "1", 10) || 1)); setProductItems([...productItems, { name: "", cost: "", sellingPrice: "", percentage: "", phase: String(nextPh) }]); }}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addItem || "Add Item"}
                </Button>
              </div>
              {productItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-item-${idx}`}>
                  <div className="col-span-3"><Input placeholder={t.productName || "Name"} value={it.name} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], name: e.target.value }; setProductItems(a); }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder={t.itemCost || "Cost (SAR)"} value={it.cost} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], cost: e.target.value }; setProductItems(a); }} data-testid={`input-item-cost-${idx}`} /></div>
                  <div className="col-span-2"><Input type="number" placeholder={(t as any).sellingPrice || "Sell (SAR)"} value={it.sellingPrice} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], sellingPrice: e.target.value }; setProductItems(a); }} data-testid={`input-item-selling-price-${idx}`} /></div>
                  <div className="col-span-2"><Input type="number" placeholder={t.itemPercentage || "%"} value={it.percentage} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], percentage: e.target.value }; setProductItems(a); }} /></div>
                  <div className="col-span-1"><Input type="number" min="1" placeholder={(t as any).phase || "Phase"} value={it.phase} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], phase: e.target.value }; setProductItems(a); }} data-testid={`input-item-phase-${idx}`} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => setProductItems(productItems.filter((_, i) => i !== idx))} data-testid={`button-remove-item-${idx}`}><X className="h-4 w-4" /></Button></div>
                </div>
              ))}
              {productItems.length > 0 && (
                <div className="flex items-center justify-end gap-4 text-sm pt-2 border-t flex-wrap">
                  <span className="text-muted-foreground">{t.totalItemsCost || "Total Cost"}: <span className="font-semibold text-foreground" data-testid="text-total-items-cost">{productTotalCost.toFixed(2)} SAR</span></span>
                  <span className="text-muted-foreground">{(t as any).totalSellPrice || "Total Sell Price"}: <span className="font-semibold text-foreground" data-testid="text-total-selling-price">{productTotalSellingPrice.toFixed(2)} SAR</span></span>
                  <span className="text-muted-foreground">{t.totalPercentage || "Total %"}: <span className={`font-semibold ${productTotalPercentage !== 100 ? "text-destructive" : "text-foreground"}`} data-testid="text-total-percentage">{productTotalPercentage.toFixed(2)}%</span></span>
                </div>
              )}
              {(productItems.length > 0 || productServices.length > 0) && (
                <div className="rounded-md bg-muted/50 p-3 mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.itemsCost || "Items cost"}</span>
                    <span className="font-medium" data-testid="text-product-items-cost">{productTotalCost.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{(t as any).totalSellPrice || "Total Sell Price"}</span>
                    <span className="font-medium" data-testid="text-product-items-selling-price">{productTotalSellingPrice.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.servicesCost || "Services cost"}</span>
                    <span className="font-medium" data-testid="text-product-services-cost">{productServicesCost.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-1">
                    <span className="font-semibold">{t.totalProductCost || "Total product cost"}</span>
                    <span className="font-bold text-base" data-testid="text-product-grand-total">{productGrandTotalCost.toFixed(2)} SAR</span>
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> {t.productServices || "Services"}
                </Label>
                <Button type="button" size="sm" variant="outline" data-testid="button-add-product-service"
                  onClick={() => { const nextPh = Math.max(1, ...productServices.map(x => parseInt(x.phase || "1", 10) || 1)); setProductServices([...productServices, { serviceCatalogId: "", name: "", unitPrice: "", quantity: "1", phase: String(nextPh) }]); }}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addProductService || "Add Service"}
                </Button>
              </div>
              {productServices.map((s, idx) => (
                <div key={idx} className="space-y-2 border rounded-md p-2" data-testid={`row-service-${idx}`}>
                  {services.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={s.serviceCatalogId || "__custom__"}
                          onValueChange={(v) => {
                            const a = [...productServices];
                            if (v === "__custom__") {
                              a[idx] = { ...a[idx], serviceCatalogId: "" };
                            } else {
                              const cat = services.find((x) => x.id === v);
                              a[idx] = { ...a[idx], serviceCatalogId: v, name: cat?.name || a[idx].name, unitPrice: cat?.unitPrice || a[idx].unitPrice };
                            }
                            setProductServices(a);
                          }}
                        >
                          <SelectTrigger data-testid={`select-catalog-service-${idx}`}>
                            <SelectValue placeholder={t.selectCatalogService || "Select from catalog (optional)"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__custom__">{t.customService || "Custom service"}</SelectItem>
                            {services.map((sv) => (<SelectItem key={sv.id} value={sv.id}>{sv.name} ({parseFloat(sv.unitPrice).toLocaleString()} SAR)</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Input
                        placeholder={t.serviceName || "Service name"}
                        value={s.name}
                        onChange={(e) => { const a = [...productServices]; a[idx] = { ...a[idx], name: e.target.value }; setProductServices(a); }}
                        data-testid={`input-service-name-${idx}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder={t.unitPrice || "Unit price"}
                        value={s.unitPrice}
                        onChange={(e) => { const a = [...productServices]; a[idx] = { ...a[idx], unitPrice: e.target.value }; setProductServices(a); }}
                        data-testid={`input-service-price-${idx}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder={t.quantity || "Qty"}
                        value={s.quantity}
                        onChange={(e) => { const a = [...productServices]; a[idx] = { ...a[idx], quantity: e.target.value }; setProductServices(a); }}
                        data-testid={`input-service-qty-${idx}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder={(t as any).phase || "Phase"}
                        value={s.phase}
                        onChange={(e) => { const a = [...productServices]; a[idx] = { ...a[idx], phase: e.target.value }; setProductServices(a); }}
                        data-testid={`input-service-phase-${idx}`}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button type="button" size="icon" variant="ghost" onClick={() => setProductServices(productServices.filter((_, i) => i !== idx))} data-testid={`button-remove-service-${idx}`}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tasks */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> {t.productTasks || "Tasks"}
                </Label>
                <Button type="button" size="sm" variant="outline" data-testid="button-add-product-task"
                  onClick={() => { const nextPh = Math.max(1, ...productTasks.map(x => parseInt(x.phase || "1", 10) || 1)); setProductTasks([...productTasks, { name: "", description: "", duration: "1", phase: String(nextPh) }]); }}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addProductTask || "Add Task"}
                </Button>
              </div>
              {productTasks.map((tk, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-task-${idx}`}>
                  <div className="col-span-6"><Input placeholder={t.productName || "Task name"} value={tk.name} onChange={(e) => { const a = [...productTasks]; a[idx] = { ...a[idx], name: e.target.value }; setProductTasks(a); }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder={`${t.taskDuration || "Duration"} (${t.durationDays || "days"})`} value={tk.duration} onChange={(e) => { const a = [...productTasks]; a[idx] = { ...a[idx], duration: e.target.value }; setProductTasks(a); }} /></div>
                  <div className="col-span-2"><Input type="number" min="1" placeholder={(t as any).phase || "Phase"} value={tk.phase} onChange={(e) => { const a = [...productTasks]; a[idx] = { ...a[idx], phase: e.target.value }; setProductTasks(a); }} data-testid={`input-task-phase-${idx}`} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => setProductTasks(productTasks.filter((_, i) => i !== idx))} data-testid={`button-remove-task-${idx}`}><X className="h-4 w-4" /></Button></div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="outline" data-testid="button-add-product-phase"
                  onClick={() => {
                    const nextPh = Math.max(1, ...productItems.map(x => parseInt(x.phase || "1", 10) || 1), ...productServices.map(x => parseInt(x.phase || "1", 10) || 1), ...productTasks.map(x => parseInt(x.phase || "1", 10) || 1)) + 1;
                    setProductTasks([...productTasks, { name: "", description: "", duration: "1", phase: String(nextPh) }]);
                  }}>
                  <Plus className="h-3 w-3 mr-1" /> {(t as any).addPhase || "Add Phase"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenProductDialog(false)} data-testid="button-cancel-product">{t.cancel}</Button>
              <Button type="button" disabled={!productName || saveProductMutation.isPending} onClick={() => saveProductMutation.mutate()} data-testid="button-save-product">
                {editingProductId ? t.save : t.add}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProduct} onOpenChange={(o) => !o && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteProduct || "Are you sure you want to delete this product?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-product">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete-product" onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteServiceConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingService &&
                deleteServiceMutation.mutate(deletingService.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reportProductId} onOpenChange={(o) => { if (!o) { setReportProductId(null); setReportSellingPrice(""); setReportSellingPriceTouched(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.costProfitReport || "Cost & Profit Report"}
              {reportProduct && <span className="text-muted-foreground font-normal">— {reportProduct.name}</span>}
            </DialogTitle>
            <DialogDescription>{t.costProfitReportDesc || "Breakdown of product costs and profit projection."}</DialogDescription>
          </DialogHeader>

          {!reportProduct ? (
            <div className="text-sm text-muted-foreground p-4">{t.loading || "Loading..."}</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2"><Layers className="h-4 w-4" /> {t.productItems || "Items"}</Label>
                {reportProduct.items.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t.noItems || "No items"}</div>
                ) : (
                  <div className="space-y-1">
                    {reportProduct.items.map((it) => {
                      const itCost = parseFloat(it.cost || "0") || 0;
                      const itSell = parseFloat(((it as any).sellingPrice) || "0") || 0;
                      return (
                        <div key={it.id} className="flex items-center justify-between text-sm gap-2" data-testid={`report-item-${it.id}`}>
                          <span className="flex-1 min-w-0 truncate">{it.name}</span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {(t as any).cost || "Cost"}: <span className="text-foreground font-medium">{itCost.toFixed(2)}</span>
                          </span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {(t as any).sell || "Sell"}: <span className="text-foreground font-medium">{itSell.toFixed(2)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t pt-3">
                <Label className="text-base font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> {t.productServices || "Services"}</Label>
                {reportProduct.services.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t.noServices || "No services"}</div>
                ) : (
                  <div className="space-y-1">
                    {reportProduct.services.map((sv) => {
                      const qty = parseFloat(sv.quantity || "1") || 1;
                      const unit = parseFloat(sv.unitPrice || "0") || 0;
                      return (
                        <div key={sv.id} className="flex items-center justify-between text-sm" data-testid={`report-service-${sv.id}`}>
                          <span>{sv.name || "—"} <span className="text-muted-foreground">× {qty}</span></span>
                          <span className="font-medium">{(qty * unit).toFixed(2)} SAR</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.itemsCost || "Items cost"}</span>
                  <span className="font-medium" data-testid="report-items-cost">{reportTotals.itemsCost.toFixed(2)} SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{(t as any).totalSellPrice || "Total Sell Price (items)"}</span>
                  <span className="font-medium" data-testid="report-items-selling-price">{reportTotals.itemsSellingPrice.toFixed(2)} SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.servicesCost || "Services cost"}</span>
                  <span className="font-medium" data-testid="report-services-cost">{reportTotals.servicesCost.toFixed(2)} SAR</span>
                </div>
                <div className="flex items-center justify-between border-t pt-1">
                  <span className="font-semibold">{t.totalProductCost || "Total product cost"}</span>
                  <span className="font-bold text-base" data-testid="report-total-cost">{reportTotals.total.toFixed(2)} SAR</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <Label className="text-base font-semibold">{t.profitCalculator || "Profit Calculator"}</Label>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">{t.sellingPrice || "Selling Price (SAR)"}</Label>
                    <Input
                      type="number"
                      value={reportSellingPrice}
                      onChange={(e) => { setReportSellingPrice(e.target.value); setReportSellingPriceTouched(true); }}
                      placeholder="0.00"
                      data-testid="input-report-selling-price"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {reportTotals.itemsSellingPrice > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setReportSellingPrice(reportTotals.itemsSellingPrice.toFixed(2)); setReportSellingPriceTouched(true); }}
                        data-testid="button-suggest-items-selling"
                      >
                        {(t as any).useItemsSellPrice || "Use items sell price"}
                      </Button>
                    )}
                    {[1.3, 1.5, 2].map((mult) => (
                      <Button
                        key={mult}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setReportSellingPrice((reportTotals.total * mult).toFixed(2)); setReportSellingPriceTouched(true); }}
                        data-testid={`button-suggest-${mult}`}
                      >
                        ×{mult}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border p-3 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.profit || "Profit"}</span>
                    <span className={`font-semibold ${reportProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`} data-testid="report-profit">
                      {reportProfit.toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.profitMargin || "Profit margin"}</span>
                    <span className="font-semibold" data-testid="report-margin">{reportMargin.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.markup || "Markup over cost"}</span>
                    <span className="font-semibold" data-testid="report-markup">{reportMarkup.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
