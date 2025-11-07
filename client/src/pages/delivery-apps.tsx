import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, GripVertical, Calculator } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DeliveryApp {
  id: string;
  name: string;
  commission: string;
  bankingFees: string;
  subsidyTiers: Array<{ minAmount: number; maxAmount: number | null; subsidy: number }>;
  posFees: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const subsidyTierSchema = z.object({
  minAmount: z.coerce.number().min(0, "Minimum amount must be 0 or higher"),
  maxAmount: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.coerce.number().nullable()
  ),
  subsidy: z.coerce.number().min(0, "Subsidy must be 0 or higher"),
}).refine(
  (data) => data.maxAmount === null || data.maxAmount > data.minAmount,
  {
    message: "Maximum amount must be greater than minimum amount",
    path: ["maxAmount"],
  }
);

const deliveryAppFormSchema = z.object({
  name: z.string().min(1, "Delivery app name is required"),
  commission: z.coerce.number().min(0, "Commission must be 0 or higher").max(100, "Commission cannot exceed 100%"),
  bankingFees: z.coerce.number().min(0, "Banking fees must be 0 or higher").max(100, "Banking fees cannot exceed 100%"),
  subsidyTiers: z.array(subsidyTierSchema).max(3, "Maximum 3 subsidy tiers allowed").default([]),
  posFees: z.coerce.number().min(0, "POS fees must be 0 or higher").default(0),
});

type DeliveryAppFormValues = z.infer<typeof deliveryAppFormSchema>;

interface SortableDeliveryAppCardProps {
  app: DeliveryApp;
  onEdit: (app: DeliveryApp) => void;
  onDelete: (app: DeliveryApp) => void;
  testOrderAmount: number;
  t: any;
  layout: any;
}

function SortableDeliveryAppCard({ app, onEdit, onDelete, testOrderAmount, t, layout }: SortableDeliveryAppCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate net earnings for this app using correct formula
  const calculateNet = (amount: number) => {
    const commissionPercent = parseFloat(app.commission);
    const bankingFeesPercent = parseFloat(app.bankingFees);
    const posFees = parseFloat(app.posFees);
    
    // Find applicable subsidy tier (where order amount falls within the range)
    const applicableTier = app.subsidyTiers.find(tier => {
      const isAboveMin = amount >= tier.minAmount;
      const isBelowMax = tier.maxAmount === null || amount <= tier.maxAmount;
      return isAboveMin && isBelowMax;
    });
    const subsidy = applicableTier ? applicableTier.subsidy : 0;

    // Correct formula per user specification:
    // Commission = (Item Price - Subsidy) × Commission%
    const commissionAmount = (amount - subsidy) * (commissionPercent / 100);
    
    // Banking Fees = Item Price × Banking%
    const bankingFeesAmount = amount * (bankingFeesPercent / 100);
    
    // VAT = (Commission + Subsidy + Banking Fees) × 0.15
    const vatAmount = (commissionAmount + subsidy + bankingFeesAmount) * 0.15;
    
    // Net Earnings = Item Price - Commission - Subsidy - Banking Fees - VAT - POS Fees
    const netEarnings = amount - commissionAmount - subsidy - bankingFeesAmount - vatAmount - posFees;

    return {
      netEarnings,
      netPercentage: (netEarnings / amount) * 100,
      breakdown: {
        commission: commissionAmount,
        bankingFees: bankingFeesAmount,
        subsidy,
        vat: vatAmount,
        posFees,
      },
    };
  };

  const { netEarnings, netPercentage } = calculateNet(testOrderAmount);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "shadow-lg" : "hover-elevate"} data-testid={`card-delivery-app-${app.id}`}>
        <CardHeader className={layout.cardHeaderPadding}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 hover-elevate active-elevate-2 rounded-md touch-none"
                style={{ minWidth: '44px', minHeight: '44px' }}
                data-testid={`drag-handle-app-${app.id}`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base">{app.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={netPercentage >= 70 ? "default" : netPercentage >= 50 ? "secondary" : "destructive"} className="text-xs">
                    {netPercentage.toFixed(1)}% Net
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={layout.cardPadding}>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">{t.commission}</span>
              <p className="font-semibold">{parseFloat(app.commission).toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.bankingFees}</span>
              <p className="font-semibold">{parseFloat(app.bankingFees).toFixed(2)}%</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Subsidy Tiers</span>
              {app.subsidyTiers.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {app.subsidyTiers.sort((a, b) => a.minAmount - b.minAmount).map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-mono">
                        {tier.minAmount}-{tier.maxAmount ?? '∞'} SAR → +{tier.subsidy} SAR
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No tiers</p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">{t.posFees}</span>
              <p className="font-semibold">{parseFloat(app.posFees).toFixed(2)} SAR</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">For {testOrderAmount} SAR</span>
              <span className="text-sm font-bold text-primary">{netEarnings.toFixed(2)} SAR</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="icon" onClick={() => onEdit(app)} data-testid={`button-edit-${app.id}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(app)}
              data-testid={`button-delete-${app.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeliveryApps() {
  const layout = useDeviceLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DeliveryApp | null>(null);
  const [deletingApp, setDeletingApp] = useState<DeliveryApp | null>(null);
  const [testOrderAmount, setTestOrderAmount] = useState(100);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<DeliveryAppFormValues>({
    resolver: zodResolver(deliveryAppFormSchema),
    defaultValues: {
      name: "",
      commission: 0,
      bankingFees: 0,
      subsidyTiers: [],
      posFees: 0,
    },
  });

  const { data: deliveryApps = [], isLoading } = useQuery<DeliveryApp[]>({
    queryKey: ["/api/delivery-apps"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createDeliveryAppMutation = useMutation({
    mutationFn: async (data: DeliveryAppFormValues) => {
      return await apiRequest("POST", "/api/delivery-apps", {
        name: data.name,
        commission: data.commission.toFixed(2),
        bankingFees: data.bankingFees.toFixed(2),
        subsidyTiers: data.subsidyTiers,
        posFees: data.posFees.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-apps"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Delivery app created",
        description: "The delivery app has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateDeliveryApp,
        description: error.message || "Could not create delivery app",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryAppMutation = useMutation({
    mutationFn: async (data: DeliveryAppFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/delivery-apps/${data.id}`, {
        name: data.name,
        commission: data.commission.toFixed(2),
        bankingFees: data.bankingFees.toFixed(2),
        subsidyTiers: data.subsidyTiers,
        posFees: data.posFees.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-apps"] });
      setOpen(false);
      setEditingApp(null);
      form.reset();
      toast({
        title: "Delivery app updated",
        description: "The delivery app has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateDeliveryApp,
        description: error.message || "Could not update delivery app",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryAppMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/delivery-apps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-apps"] });
      setDeletingApp(null);
      toast({
        title: "Delivery app deleted",
        description: "The delivery app has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteDeliveryApp,
        description: error.message || "Could not delete delivery app",
        variant: "destructive",
      });
    },
  });

  const updateSortOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      await apiRequest("PATCH", "/api/delivery-apps/sort", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-apps"] });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateOrder,
        description: error.message || "Could not update delivery app order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DeliveryAppFormValues) => {
    if (editingApp) {
      updateDeliveryAppMutation.mutate({ ...data, id: editingApp.id });
    } else {
      createDeliveryAppMutation.mutate(data);
    }
  };

  const handleEdit = (app: DeliveryApp) => {
    setEditingApp(app);
    form.reset({
      name: app.name,
      commission: parseFloat(app.commission),
      bankingFees: parseFloat(app.bankingFees),
      subsidyTiers: app.subsidyTiers || [],
      posFees: parseFloat(app.posFees),
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingApp(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingApp(null);
    form.reset();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = deliveryApps.findIndex((app) => app.id === active.id);
      const newIndex = deliveryApps.findIndex((app) => app.id === over.id);

      const newOrder = arrayMove(deliveryApps, oldIndex, newIndex);
      const updates = newOrder.map((app, index) => ({
        id: app.id,
        sortOrder: index,
      }));

      updateSortOrderMutation.mutate(updates);
    }
  };

  const filteredApps = deliveryApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate example for the calculator
  const calculateExample = (amount: number, selectedApp?: DeliveryApp) => {
    if (!selectedApp) {
      return {
        gross: amount,
        commissionAmount: 0,
        bankingFeesAmount: 0,
        subsidy: 0,
        vat: 0,
        netEarnings: amount,
      };
    }

    const commissionPercent = parseFloat(selectedApp.commission);
    const bankingFeesPercent = parseFloat(selectedApp.bankingFees);
    const posFees = parseFloat(selectedApp.posFees);
    
    // Find applicable subsidy tier (where order amount falls within the range)
    const applicableTier = selectedApp.subsidyTiers.find(tier => {
      const isAboveMin = amount >= tier.minAmount;
      const isBelowMax = tier.maxAmount === null || amount <= tier.maxAmount;
      return isAboveMin && isBelowMax;
    });
    const subsidy = applicableTier ? applicableTier.subsidy : 0;

    // Correct formula per user specification:
    // Commission = (Item Price - Subsidy) × Commission%
    const commissionAmount = (amount - subsidy) * (commissionPercent / 100);
    
    // Banking Fees = Item Price × Banking%
    const bankingFeesAmount = amount * (bankingFeesPercent / 100);
    
    // VAT = (Commission + Subsidy + Banking Fees) × 0.15
    const vat = (commissionAmount + subsidy + bankingFeesAmount) * 0.15;
    
    // Net Earnings = Item Price - Commission - Subsidy - Banking Fees - VAT - POS Fees
    const netEarnings = amount - commissionAmount - subsidy - bankingFeesAmount - vat - posFees;

    return {
      gross: amount,
      commissionPercent,
      commissionAmount,
      bankingFeesPercent,
      bankingFeesAmount,
      subsidy,
      vat,
      netEarnings,
      posFees,
    };
  };

  const exampleApp = filteredApps[0];
  const calculation = calculateExample(testOrderAmount, exampleApp);

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`${layout.text3Xl} font-bold`}>{t.deliveryApps}</h1>
          <p className="text-muted-foreground mt-1">Manage delivery platform commissions and fees</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-delivery-app">
              <Plus className="h-4 w-4 mr-2" />
              {t.add}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingApp ? t.editDeliveryApp : t.addDeliveryApp}</DialogTitle>
              <DialogDescription>
                {editingApp ? "Update delivery app details" : "Add a new delivery app to track earnings"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.itemName}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HungerStation, Jahez, Mrsool" {...field} data-testid="input-delivery-app-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.commission}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t.enterCommission}
                          {...field}
                          data-testid="input-commission"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankingFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bankingFees}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t.enterBankingFees}
                          {...field}
                          data-testid="input-banking-fees"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Subsidy Tiers (Max 3)</FormLabel>
                    {form.watch("subsidyTiers").length < 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const current = form.getValues("subsidyTiers");
                          form.setValue("subsidyTiers", [...current, { minAmount: 0, maxAmount: null, subsidy: 0 }]);
                        }}
                        data-testid="button-add-tier"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    )}
                  </div>
                  {form.watch("subsidyTiers").map((tier, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name={`subsidyTiers.${index}.minAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Min (SAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  {...field}
                                  data-testid={`input-tier-min-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`subsidyTiers.${index}.maxAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Max (SAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="∞"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? null : parseFloat(val));
                                  }}
                                  data-testid={`input-tier-max-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`subsidyTiers.${index}.subsidy`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Subsidy (SAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  {...field}
                                  data-testid={`input-tier-subsidy-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const current = form.getValues("subsidyTiers");
                          form.setValue("subsidyTiers", current.filter((_, i) => i !== index));
                        }}
                        data-testid={`button-delete-tier-${index}`}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.watch("subsidyTiers").length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No subsidy tiers added. Click "Add Tier" to create one.</p>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="posFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.posFees}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t.enterPosFees}
                          {...field}
                          data-testid="input-pos-fees"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={createDeliveryAppMutation.isPending || updateDeliveryAppMutation.isPending}>
                    {createDeliveryAppMutation.isPending || updateDeliveryAppMutation.isPending ? t.loading : t.save}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Net Earnings Calculator */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className={layout.cardHeaderPadding}>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className={`${layout.textXl} font-semibold`}>{t.netEarningsCalculator}</h2>
          </div>
        </CardHeader>
        <CardContent className={layout.cardPadding}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.testOrderAmount}</label>
              <Input
                type="number"
                step="1"
                value={testOrderAmount}
                onChange={(e) => setTestOrderAmount(parseFloat(e.target.value) || 100)}
                className="max-w-xs"
                data-testid="input-test-order-amount"
              />
            </div>
            {exampleApp && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm font-medium">{t.grossAmount}</span>
                  <span className="font-mono font-semibold">{calculation.gross.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                  <span>Commission ({calculation.commissionPercent?.toFixed(2)}%)</span>
                  <span className="font-mono">-{calculation.commissionAmount.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                  <span>Banking Fees ({calculation.bankingFeesPercent?.toFixed(2)}%)</span>
                  <span className="font-mono">-{calculation.bankingFeesAmount.toFixed(2)} SAR</span>
                </div>
                {calculation.subsidy > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                    <span>Subsidy (Cost)</span>
                    <span className="font-mono">-{calculation.subsidy.toFixed(2)} SAR</span>
                  </div>
                )}
                {calculation.vat > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                    <span>VAT (15%)</span>
                    <span className="font-mono">-{calculation.vat.toFixed(2)} SAR</span>
                  </div>
                )}
                {calculation.posFees && calculation.posFees > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                    <span>{t.posFees}</span>
                    <span className="font-mono">-{calculation.posFees.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold text-primary">{t.netEarnings}</span>
                  <span className="font-mono font-bold text-lg text-primary">{calculation.netEarnings.toFixed(2)} SAR</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Example based on {exampleApp.name}
                </p>
              </div>
            )}
            {!exampleApp && (
              <p className="text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-delivery-apps"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <Card>
          <CardContent className={`${layout.cardPadding} text-center py-12`}>
            <p className="text-muted-foreground">{t.noData}</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredApps.map((app) => app.id)} strategy={rectSortingStrategy}>
            <div className={`grid ${layout.gridCols({ mobile: 1, tablet: 2, desktop: 3 })} ${layout.gap}`}>
              {filteredApps.map((app) => (
                <SortableDeliveryAppCard
                  key={app.id}
                  app={app}
                  onEdit={handleEdit}
                  onDelete={setDeletingApp}
                  testOrderAmount={testOrderAmount}
                  t={t}
                  layout={layout}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={!!deletingApp} onOpenChange={(open) => !open && setDeletingApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDeliveryApp}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingApp?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingApp && deleteDeliveryAppMutation.mutate(deletingApp.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
