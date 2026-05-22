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
  percentage: string;
}
interface ProductServiceDraft {
  serviceCatalogId: string;
  quantity: string;
}
interface ProductTaskDraft {
  name: string;
  description: string;
  duration: string;
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
  items: Array<{ id: string; name: string; cost: string; percentage: string; sortOrder: number }>;
  services: Array<{ id: string; serviceCatalogId: string; quantity: string; sortOrder: number }>;
  tasks: Array<{ id: string; name: string; description: string | null; duration: number; sortOrder: number }>;
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
    setProductItems(p.items.map((i) => ({ name: i.name, cost: i.cost, percentage: i.percentage })));
    setProductServices(p.services.map((s) => ({ serviceCatalogId: s.serviceCatalogId, quantity: s.quantity })));
    setProductTasks(p.tasks.map((tk) => ({ name: tk.name, description: tk.description || "", duration: String(tk.duration) })));
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
          percentage: i.percentage || "0",
          sortOrder: idx,
        })),
        services: productServices.map((s, idx) => ({
          serviceCatalogId: s.serviceCatalogId,
          quantity: s.quantity || "1",
          sortOrder: idx,
        })),
        tasks: productTasks.map((tk, idx) => ({
          name: tk.name,
          description: tk.description || null,
          duration: parseInt(tk.duration || "1", 10),
          sortOrder: idx,
        })),
      };
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
  const productTotalPercentage = productItems.reduce((sum, i) => sum + parseFloat(i.percentage || "0"), 0);

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
                  onClick={() => setProductItems([...productItems, { name: "", cost: "", percentage: "" }])}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addItem || "Add Item"}
                </Button>
              </div>
              {productItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-item-${idx}`}>
                  <div className="col-span-5"><Input placeholder={t.productName || "Name"} value={it.name} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], name: e.target.value }; setProductItems(a); }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder={t.itemCost || "Cost (SAR)"} value={it.cost} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], cost: e.target.value }; setProductItems(a); }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder={t.itemPercentage || "% of Total"} value={it.percentage} onChange={(e) => { const a = [...productItems]; a[idx] = { ...a[idx], percentage: e.target.value }; setProductItems(a); }} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => setProductItems(productItems.filter((_, i) => i !== idx))} data-testid={`button-remove-item-${idx}`}><X className="h-4 w-4" /></Button></div>
                </div>
              ))}
              {productItems.length > 0 && (
                <div className="flex items-center justify-end gap-4 text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{t.totalItemsCost || "Total Cost"}: <span className="font-semibold text-foreground" data-testid="text-total-items-cost">{productTotalCost.toFixed(2)} SAR</span></span>
                  <span className="text-muted-foreground">{t.totalPercentage || "Total %"}: <span className={`font-semibold ${productTotalPercentage !== 100 ? "text-destructive" : "text-foreground"}`} data-testid="text-total-percentage">{productTotalPercentage.toFixed(2)}%</span></span>
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
                  onClick={() => setProductServices([...productServices, { serviceCatalogId: "", quantity: "1" }])}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addProductService || "Add Service"}
                </Button>
              </div>
              {productServices.map((s, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-service-${idx}`}>
                  <div className="col-span-8">
                    <Select value={s.serviceCatalogId} onValueChange={(v) => { const a = [...productServices]; a[idx] = { ...a[idx], serviceCatalogId: v }; setProductServices(a); }}>
                      <SelectTrigger data-testid={`select-catalog-service-${idx}`}><SelectValue placeholder={t.selectCatalogService || "Select service"} /></SelectTrigger>
                      <SelectContent>
                        {services.map((sv) => (<SelectItem key={sv.id} value={sv.id}>{sv.name} ({parseFloat(sv.unitPrice).toLocaleString()} SAR)</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3"><Input type="number" placeholder={t.quantity || "Qty"} value={s.quantity} onChange={(e) => { const a = [...productServices]; a[idx] = { ...a[idx], quantity: e.target.value }; setProductServices(a); }} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => setProductServices(productServices.filter((_, i) => i !== idx))} data-testid={`button-remove-service-${idx}`}><X className="h-4 w-4" /></Button></div>
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
                  onClick={() => setProductTasks([...productTasks, { name: "", description: "", duration: "1" }])}>
                  <Plus className="h-3 w-3 mr-1" /> {t.addProductTask || "Add Task"}
                </Button>
              </div>
              {productTasks.map((tk, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end" data-testid={`row-task-${idx}`}>
                  <div className="col-span-7"><Input placeholder={t.productName || "Task name"} value={tk.name} onChange={(e) => { const a = [...productTasks]; a[idx] = { ...a[idx], name: e.target.value }; setProductTasks(a); }} /></div>
                  <div className="col-span-4"><Input type="number" placeholder={`${t.taskDuration || "Duration"} (${t.durationDays || "days"})`} value={tk.duration} onChange={(e) => { const a = [...productTasks]; a[idx] = { ...a[idx], duration: e.target.value }; setProductTasks(a); }} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => setProductTasks(productTasks.filter((_, i) => i !== idx))} data-testid={`button-remove-task-${idx}`}><X className="h-4 w-4" /></Button></div>
                </div>
              ))}
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
    </div>
  );
}
