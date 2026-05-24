import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calculator,
  MapPin,
  CalendarDays,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
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

interface Valuation {
  id: string;
  restaurantId: string;
  propertyId: string | null;
  propertyName: string;
  propertyType: string;
  location: string;
  area: string | null;
  areaUnit: string | null;
  estimatedValue: string;
  marketValue: string | null;
  assessmentDate: string;
  valuationType: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const valuationFormSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  propertyType: z.string().min(1, "Property type is required"),
  location: z.string().min(1, "Location is required"),
  area: z.string().optional(),
  areaUnit: z.string().default("sqm"),
  estimatedValue: z.string().min(1, "Estimated value is required"),
  marketValue: z.string().optional(),
  assessmentDate: z.string().min(1, "Assessment date is required"),
  valuationType: z.string().min(1, "Valuation type is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type ValuationFormValues = z.infer<typeof valuationFormSchema>;

export default function Valuations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<Valuation | null>(null);
  const [deletingValuation, setDeletingValuation] = useState<Valuation | null>(null);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const layout = useDeviceLayout();

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      propertyName: "",
      propertyType: "",
      location: "",
      area: "",
      areaUnit: "sqm",
      estimatedValue: "",
      marketValue: "",
      assessmentDate: "",
      valuationType: "",
      status: "pending",
      notes: "",
    },
  });

  const { data: valuations = [], isLoading } = useQuery<Valuation[]>({
    queryKey: ["/api/valuations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ValuationFormValues) => {
      const payload = {
        ...data,
        area: data.area || null,
        marketValue: data.marketValue || null,
        areaUnit: data.areaUnit || "sqm",
      };
      return await apiRequest("POST", "/api/valuations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/valuations"] });
      setOpen(false);
      form.reset();
      toast({
        title: (t as any).valuationCreated || "Valuation Created",
        description: (t as any).valuationCreatedDesc || "Property valuation has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToCreateValuation || "Failed to create valuation",
        description: error.message || ((t as any).couldNotCreateValuation || "Could not create valuation"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ValuationFormValues & { id: string }) => {
      const payload = {
        propertyName: data.propertyName,
        propertyType: data.propertyType,
        location: data.location,
        area: data.area || null,
        areaUnit: data.areaUnit || "sqm",
        estimatedValue: data.estimatedValue,
        marketValue: data.marketValue || null,
        assessmentDate: data.assessmentDate,
        valuationType: data.valuationType,
        status: data.status,
        notes: data.notes,
      };
      return await apiRequest("PATCH", `/api/valuations/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/valuations"] });
      setOpen(false);
      setEditingValuation(null);
      form.reset();
      toast({
        title: (t as any).valuationUpdated || "Valuation Updated",
        description: (t as any).valuationUpdatedDesc || "Property valuation has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToUpdateValuation || "Failed to update valuation",
        description: error.message || ((t as any).couldNotUpdateValuation || "Could not update valuation"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/valuations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/valuations"] });
      setDeletingValuation(null);
      toast({
        title: (t as any).valuationDeleted || "Valuation Deleted",
        description: (t as any).valuationDeletedDesc || "Property valuation has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: (t as any).failedToDeleteValuation || "Failed to delete valuation",
        description: error.message || ((t as any).couldNotDeleteValuation || "Could not delete valuation"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ValuationFormValues) => {
    const payload = {
      ...data,
      area: data.area || null,
      marketValue: data.marketValue || null,
      areaUnit: data.areaUnit || "sqm",
    };
    if (editingValuation) {
      updateMutation.mutate({ ...payload, id: editingValuation.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (valuation: Valuation) => {
    setEditingValuation(valuation);
    form.reset({
      propertyName: valuation.propertyName,
      propertyType: valuation.propertyType,
      location: valuation.location,
      area: valuation.area || "",
      areaUnit: valuation.areaUnit || "sqm",
      estimatedValue: valuation.estimatedValue,
      marketValue: valuation.marketValue || "",
      assessmentDate: valuation.assessmentDate ? valuation.assessmentDate.split("T")[0] : "",
      valuationType: valuation.valuationType,
      status: valuation.status,
      notes: valuation.notes || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingValuation(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingValuation(null);
    form.reset();
  };

  const filteredValuations = valuations.filter(
    (valuation) =>
      valuation.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      valuation.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalValuations = valuations.length;
  const pendingCount = valuations.filter((v) => v.status === "pending").length;
  const completedCount = valuations.filter((v) => v.status === "completed").length;
  const averageValue =
    valuations.length > 0
      ? valuations.reduce((sum, v) => sum + parseFloat(v.estimatedValue || "0"), 0) / valuations.length
      : 0;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "in_progress":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t.pending;
      case "in_progress":
        return t.inProgress;
      case "completed":
        return t.completed;
      default:
        return status;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "residential":
        return (t as any).residential || "Residential";
      case "commercial":
        return (t as any).commercial || "Commercial";
      case "land":
        return (t as any).land || "Land";
      case "industrial":
        return (t as any).industrial || "Industrial";
      default:
        return type;
    }
  };

  const getValuationTypeLabel = (type: string) => {
    switch (type) {
      case "market":
        return (t as any).market || "Market";
      case "investment":
        return (t as any).investment || "Investment";
      case "insurance":
        return (t as any).insurance || "Insurance";
      case "tax":
        return (t as any).tax || "Tax";
      default:
        return type;
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div
        className={`flex ${layout.isMobile ? "flex-col gap-3" : "items-center justify-between gap-2"}`}
      >
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-1`} data-testid="text-valuations-title">
            {(t as any).valuations || "Valuations"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {(t as any).valuationsDescription || "Property valuation assessments and reports"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-valuation"
              className={layout.isMobile ? "h-[44px]" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              {(t as any).addValuation || "Add Valuation"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingValuation ? ((t as any).editValuation || "Edit Valuation") : ((t as any).addValuation || "Add Valuation")}
              </DialogTitle>
              <DialogDescription>
                {editingValuation
                  ? ((t as any).updateValuationInfo || "Update property valuation information")
                  : ((t as any).addNewValuationAssessment || "Add a new property valuation assessment")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(t as any).propertyName || "Property Name"}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-property-name"
                          placeholder={(t as any).propertyNamePlaceholder || "Enter property name"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(t as any).propertyType || "Property Type"}<InfoTip>{isRTL ? "نوع العقار (سكني، تجاري، إلخ)." : "Category of the property (residential, commercial, etc.)."}</InfoTip></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder={(t as any).selectType || "Select type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">{(t as any).residential || "Residential"}</SelectItem>
                          <SelectItem value="commercial">{(t as any).commercial || "Commercial"}</SelectItem>
                          <SelectItem value="land">{(t as any).land || "Land"}</SelectItem>
                          <SelectItem value="industrial">{(t as any).industrial || "Industrial"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.location}<InfoTip>{isRTL ? "العنوان أو الموقع الجغرافي للعقار." : "Address or geographic location of the property."}</InfoTip></FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-location"
                          placeholder={(t as any).enterPropertyLocation || "Enter property location"}
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
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).area || "Area"}<InfoTip>{isRTL ? "مساحة العقار." : "Total area of the property."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-area"
                            type="number"
                            placeholder={(t as any).enterArea || "Enter area"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="areaUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).areaUnit || "Area Unit"}<InfoTip>{isRTL ? "وحدة قياس المساحة (متر مربع أو قدم مربع)." : "Unit of measurement for the area (sqm or sqft)."}</InfoTip></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-area-unit">
                              <SelectValue placeholder={(t as any).selectUnit || "Select unit"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sqm">sqm</SelectItem>
                            <SelectItem value="sqft">sqft</SelectItem>
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
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).estimatedValueSAR || "Estimated Value (SAR)"}<InfoTip>{isRTL ? "القيمة المقدرة للعقار بالريال السعودي." : "Your estimated value of the property in SAR."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-estimated-value"
                            type="number"
                            placeholder={(t as any).enterEstimatedValue || "Enter estimated value"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{(t as any).marketValueSAR || "Market Value (SAR)"}<InfoTip>{isRTL ? "القيمة السوقية الحالية للعقار بالريال السعودي." : "Current market value of the property in SAR."}</InfoTip></FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-market-value"
                            type="number"
                            placeholder={(t as any).enterMarketValue || "Enter market value"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="assessmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(t as any).assessmentDate || "Assessment Date"}<InfoTip>{isRTL ? "تاريخ إجراء التقييم." : "Date the valuation was performed."}</InfoTip></FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-assessment-date"
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valuationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{(t as any).valuationType || "Valuation Type"}<InfoTip>{isRTL ? "الغرض من التقييم (سوق، استثمار، تأمين، ضريبة)." : "Purpose of the valuation (market, investment, insurance, tax)."}</InfoTip></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-valuation-type">
                            <SelectValue placeholder={(t as any).selectValuationType || "Select valuation type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="market">{(t as any).market || "Market"}</SelectItem>
                          <SelectItem value="investment">{(t as any).investment || "Investment"}</SelectItem>
                          <SelectItem value="insurance">{(t as any).insurance || "Insurance"}</SelectItem>
                          <SelectItem value="tax">{(t as any).tax || "Tax"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.status}<InfoTip>{isRTL ? "حالة التقييم الحالية." : "Current stage of this valuation."}</InfoTip></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder={(t as any).selectStatus || "Select status"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">{t.pending}</SelectItem>
                          <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                          <SelectItem value="completed">{t.completed}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}<InfoTip>{isRTL ? "ملاحظات أو تفاصيل إضافية." : "Any additional notes or details."}</InfoTip></FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-notes"
                          placeholder={(t as any).additionalNotes || "Add any additional notes..."}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingValuation ? t.save : t.add}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-valuation-search"
          placeholder={`${t.search} valuations...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div
        className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 1 })}`}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{(t as any).totalValuations || "Total Valuations"}<InfoTip>{isRTL ? "إجمالي عدد التقييمات المسجلة." : "Total number of recorded valuations."}</InfoTip></p>
                <p className="text-2xl font-bold" data-testid="text-total-valuations">
                  {totalValuations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t.pending}<InfoTip>{isRTL ? "التقييمات قيد الانتظار." : "Valuations awaiting assessment."}</InfoTip></p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">
                  {pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t.completed}<InfoTip>{isRTL ? "التقييمات المنجزة." : "Valuations that are finalized."}</InfoTip></p>
                <p className="text-2xl font-bold" data-testid="text-completed-count">
                  {completedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{(t as any).averageValue || "Average Value"}<InfoTip>{isRTL ? "متوسط القيمة التقديرية لجميع العقارات." : "Mean estimated value across all properties."}</InfoTip></p>
                <p className="text-2xl font-bold" data-testid="text-average-value">
                  {parseFloat(averageValue.toFixed(0)).toLocaleString()} SAR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p>{t.loading}</p>
        </div>
      ) : filteredValuations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Calculator className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? ((t as any).noValuationsFoundSearch || "No valuations found matching your search")
              : ((t as any).noValuationsYet || "No valuations yet. Add your first property valuation.")}
          </p>
        </div>
      ) : (
        <div
          className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })}`}
        >
          {filteredValuations.map((valuation) => (
            <Card
              key={valuation.id}
              data-testid={`card-valuation-${valuation.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-semibold truncate"
                    data-testid={`text-valuation-name-${valuation.id}`}
                  >
                    {valuation.propertyName}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{valuation.location}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.edit}
                        onClick={() => handleEdit(valuation)}
                        data-testid={`button-edit-${valuation.id}`}
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
                        onClick={() => setDeletingValuation(valuation)}
                        data-testid={`button-delete-${valuation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRTL ? "تحذير: حذف هذا التقييم نهائياً." : "Warning: permanently delete this valuation."}</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">
                    {getPropertyTypeLabel(valuation.propertyType)}
                  </Badge>
                  <Badge variant="outline">
                    {getValuationTypeLabel(valuation.valuationType)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(valuation.status)}>
                    {getStatusLabel(valuation.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{(t as any).estimatedValue || "Estimated Value"}</span>
                    <span className="font-semibold" data-testid={`text-estimated-value-${valuation.id}`}>
                      {parseFloat(valuation.estimatedValue).toLocaleString()} SAR
                    </span>
                  </div>
                  {valuation.marketValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{(t as any).marketValue || "Market Value"}</span>
                      <span className="font-semibold" data-testid={`text-market-value-${valuation.id}`}>
                        {parseFloat(valuation.marketValue).toLocaleString()} SAR
                      </span>
                    </div>
                  )}
                  {valuation.area && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{(t as any).area || "Area"}</span>
                      <span data-testid={`text-area-${valuation.id}`}>
                        {valuation.area} {valuation.areaUnit || "sqm"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <span data-testid={`text-assessment-date-${valuation.id}`}>
                      {(() => {
                        try {
                          return format(new Date(valuation.assessmentDate), "MMM dd, yyyy");
                        } catch {
                          return valuation.assessmentDate;
                        }
                      })()}
                    </span>
                  </div>
                </div>

                {valuation.notes && (
                  <p className="text-xs text-muted-foreground italic truncate">
                    {valuation.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deletingValuation}
        onOpenChange={(open) => !open && setDeletingValuation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteValuationConfirm || `This will permanently delete "${deletingValuation?.propertyName}".`} {t.actionCannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() =>
                deletingValuation &&
                deleteMutation.mutate(deletingValuation.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
