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
import { useForm } from "react-hook-form";
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
  subsidy: string;
  posFees: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const deliveryAppFormSchema = z.object({
  name: z.string().min(1, "Delivery app name is required"),
  commission: z.coerce.number().min(0, "Commission must be 0 or higher").max(100, "Commission cannot exceed 100%"),
  bankingFees: z.coerce.number().min(0, "Banking fees must be 0 or higher").max(100, "Banking fees cannot exceed 100%"),
  subsidy: z.coerce.number().min(0, "Subsidy must be 0 or higher").default(0),
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

  // Calculate net earnings for this app
  const calculateNet = (amount: number) => {
    const commission = parseFloat(app.commission);
    const bankingFees = parseFloat(app.bankingFees);
    const subsidy = parseFloat(app.subsidy);
    const posFees = parseFloat(app.posFees);

    const afterCommission = amount * (1 - commission / 100);
    const afterBanking = afterCommission * (1 - bankingFees / 100);
    const afterSubsidy = afterBanking + subsidy;
    const netEarnings = afterSubsidy - posFees;

    return {
      netEarnings,
      netPercentage: (netEarnings / amount) * 100,
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
            <div>
              <span className="text-muted-foreground">{t.subsidy}</span>
              <p className="font-semibold">{parseFloat(app.subsidy).toFixed(2)} SAR</p>
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
      subsidy: 0,
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
        subsidy: data.subsidy.toFixed(2),
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
        title: "Failed to create delivery app",
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
        subsidy: data.subsidy.toFixed(2),
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
        title: "Failed to update delivery app",
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
        title: "Failed to delete delivery app",
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
        title: "Failed to update order",
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
      subsidy: parseFloat(app.subsidy),
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
        afterCommission: amount,
        afterBanking: amount,
        afterSubsidy: amount,
        netEarnings: amount,
      };
    }

    const commission = parseFloat(selectedApp.commission);
    const bankingFees = parseFloat(selectedApp.bankingFees);
    const subsidy = parseFloat(selectedApp.subsidy);
    const posFees = parseFloat(selectedApp.posFees);

    const afterCommission = amount * (1 - commission / 100);
    const afterBanking = afterCommission * (1 - bankingFees / 100);
    const afterSubsidy = afterBanking + subsidy;
    const netEarnings = afterSubsidy - posFees;

    return {
      gross: amount,
      commission,
      afterCommission,
      bankingFees,
      afterBanking,
      subsidy,
      afterSubsidy,
      posFees,
      netEarnings,
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
          <DialogContent>
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
                <FormField
                  control={form.control}
                  name="subsidy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.subsidy}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t.enterSubsidy}
                          {...field}
                          data-testid="input-subsidy"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t.afterCommission} ({calculation.commission?.toFixed(2)}%)</span>
                  <span className="font-mono">{calculation.afterCommission.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t.afterBankingFees} ({calculation.bankingFees?.toFixed(2)}%)</span>
                  <span className="font-mono">{calculation.afterBanking.toFixed(2)} SAR</span>
                </div>
                {calculation.subsidy! > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t.afterSubsidy} (+{calculation.subsidy?.toFixed(2)} SAR)</span>
                    <span className="font-mono">{calculation.afterSubsidy.toFixed(2)} SAR</span>
                  </div>
                )}
                {calculation.posFees! > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t.afterPosFees} (-{calculation.posFees?.toFixed(2)} SAR)</span>
                    <span className="font-mono">{calculation.netEarnings.toFixed(2)} SAR</span>
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
