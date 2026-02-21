import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const { t } = useLanguage();
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
      return await apiRequest("POST", "/api/valuations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/valuations"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Valuation Created",
        description: "Property valuation has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create valuation",
        description: error.message || "Could not create valuation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ValuationFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/valuations/${data.id}`, {
        propertyName: data.propertyName,
        propertyType: data.propertyType,
        location: data.location,
        area: data.area,
        areaUnit: data.areaUnit,
        estimatedValue: data.estimatedValue,
        marketValue: data.marketValue,
        assessmentDate: data.assessmentDate,
        valuationType: data.valuationType,
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/valuations"] });
      setOpen(false);
      setEditingValuation(null);
      form.reset();
      toast({
        title: "Valuation Updated",
        description: "Property valuation has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update valuation",
        description: error.message || "Could not update valuation",
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
        title: "Valuation Deleted",
        description: "Property valuation has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete valuation",
        description: error.message || "Could not delete valuation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ValuationFormValues) => {
    if (editingValuation) {
      updateMutation.mutate({ ...data, id: editingValuation.id });
    } else {
      createMutation.mutate(data);
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
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "residential":
        return "Residential";
      case "commercial":
        return "Commercial";
      case "land":
        return "Land";
      case "industrial":
        return "Industrial";
      default:
        return type;
    }
  };

  const getValuationTypeLabel = (type: string) => {
    switch (type) {
      case "market":
        return "Market";
      case "investment":
        return "Investment";
      case "insurance":
        return "Insurance";
      case "tax":
        return "Tax";
      default:
        return type;
    }
  };

  return (
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
              Add Valuation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingValuation ? "Edit Valuation" : "Add Valuation"}
              </DialogTitle>
              <DialogDescription>
                {editingValuation
                  ? "Update property valuation information"
                  : "Add a new property valuation assessment"}
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
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-property-name"
                          placeholder="Enter property name"
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
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-location"
                          placeholder="Enter property location"
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
                        <FormLabel>Area</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-area"
                            type="number"
                            placeholder="Enter area"
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
                        <FormLabel>Area Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-area-unit">
                              <SelectValue placeholder="Select unit" />
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
                        <FormLabel>Estimated Value (SAR)</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-estimated-value"
                            type="number"
                            placeholder="Enter estimated value"
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
                        <FormLabel>Market Value (SAR)</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-market-value"
                            type="number"
                            placeholder="Enter market value"
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
                      <FormLabel>Assessment Date</FormLabel>
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
                      <FormLabel>Valuation Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-valuation-type">
                            <SelectValue placeholder="Select valuation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="market">Market</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="tax">Tax</SelectItem>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-notes"
                          placeholder="Add any additional notes..."
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
                    {editingValuation ? "Save" : "Add"}
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
                <p className="text-sm text-muted-foreground">Total Valuations</p>
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
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <p className="text-sm text-muted-foreground">Completed</p>
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
                <p className="text-sm text-muted-foreground">Average Value</p>
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
          <p>Loading...</p>
        </div>
      ) : filteredValuations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Calculator className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "No valuations found matching your search"
              : "No valuations yet. Add your first property valuation."}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(valuation)}
                    data-testid={`button-edit-${valuation.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingValuation(valuation)}
                    data-testid={`button-delete-${valuation.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                    <span className="text-muted-foreground">Estimated Value</span>
                    <span className="font-semibold" data-testid={`text-estimated-value-${valuation.id}`}>
                      {parseFloat(valuation.estimatedValue).toLocaleString()} SAR
                    </span>
                  </div>
                  {valuation.marketValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Market Value</span>
                      <span className="font-semibold" data-testid={`text-market-value-${valuation.id}`}>
                        {parseFloat(valuation.marketValue).toLocaleString()} SAR
                      </span>
                    </div>
                  )}
                  {valuation.area && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Area</span>
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
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingValuation?.propertyName}". This
              action cannot be undone.
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
  );
}
