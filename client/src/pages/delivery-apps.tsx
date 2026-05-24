import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, GripVertical, Calculator, TrendingUp, FileText } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";
import type { DeliveryProfitability } from "@shared/schema";
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
  markUp: string;
  subsidyTiers: Array<{ minAmount: number; maxAmount: number | null; subsidy: number }>;
  posFees: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

type DeliveryAppFormValues = {
  name: string;
  commission: number;
  bankingFees: number;
  markUp: number;
  subsidyTiers: Array<{ minAmount: number; maxAmount: number | null; subsidy: number }>;
  posFees: number;
};

interface SortableDeliveryAppCardProps {
  app: DeliveryApp;
  onEdit: (app: DeliveryApp) => void;
  onDelete: (app: DeliveryApp) => void;
  testOrderAmount: number;
  t: any;
  layout: any;
  isRTL: boolean;
}

function SortableDeliveryAppCard({ app, onEdit, onDelete, testOrderAmount, t, layout, isRTL }: SortableDeliveryAppCardProps) {
  const tip = (en: string, ar: string) => (isRTL ? ar : en);
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
            <div>
              <span className="text-muted-foreground">{t.markUp || "Mark-Up"}</span>
              <p className="font-semibold">{parseFloat(app.markUp || "0").toFixed(2)}%</p>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t.edit} onClick={() => onEdit(app)} data-testid={`button-edit-${app.id}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tip("Edit this delivery app's fees and tiers.", "تعديل رسوم وشرائح هذا التطبيق.")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.delete}
                  onClick={() => onDelete(app)}
                  data-testid={`button-delete-${app.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tip("Permanently delete this delivery app.", "حذف تطبيق التوصيل نهائياً.")}</TooltipContent>
            </Tooltip>
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
  const { t, isRTL } = useLanguage();
  const tip = (en: string, ar: string) => (isRTL ? ar : en);

  const subsidyTierSchema = z.object({
    minAmount: z.coerce.number().min(0, t.minAmountMustBeZeroOrHigher),
    maxAmount: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? null : val,
      z.coerce.number().nullable()
    ),
    subsidy: z.coerce.number().min(0, "Subsidy must be 0 or higher"),
  }).refine(
    (data) => data.maxAmount === null || data.maxAmount > data.minAmount,
    {
      message: t.maxAmountMustBeGreaterThanMin,
      path: ["maxAmount"],
    }
  );

  const deliveryAppFormSchema = z.object({
    name: z.string().min(1, t.deliveryAppNameRequired),
    commission: z.coerce.number().min(0, "Commission must be 0 or higher").max(100, "Commission cannot exceed 100%"),
    bankingFees: z.coerce.number().min(0, "Banking fees must be 0 or higher").max(100, "Banking fees cannot exceed 100%"),
    markUp: z.coerce.number().min(0, "Mark-up must be 0 or higher").max(100, "Mark-up cannot exceed 100%").default(0),
    subsidyTiers: z.array(subsidyTierSchema).default([]),
    posFees: z.coerce.number().min(0, "POS fees must be 0 or higher").default(0),
  });

  const form = useForm<DeliveryAppFormValues>({
    resolver: zodResolver(deliveryAppFormSchema),
    defaultValues: {
      name: "",
      commission: 0,
      bankingFees: 0,
      markUp: 0,
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
        markUp: data.markUp.toFixed(2),
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
        markUp: data.markUp.toFixed(2),
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
      markUp: parseFloat(app.markUp || "0"),
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

  // Profitability Entries State
  const [profitabilityYear, setProfitabilityYear] = useState(new Date().getFullYear());
  const [profitabilityDialogOpen, setProfitabilityDialogOpen] = useState(false);
  const [editingProfitability, setEditingProfitability] = useState<DeliveryProfitability | null>(null);
  const [deletingProfitability, setDeletingProfitability] = useState<DeliveryProfitability | null>(null);

  // Profitability form schema
  const profitabilityFormSchema = z.object({
    deliveryAppId: z.string().min(1, "Delivery app is required"),
    periodType: z.enum(["daily", "weekly", "monthly"]),
    year: z.coerce.number().min(2020, "Year must be 2020 or later").max(2100, "Year must be 2100 or earlier"),
    month: z.coerce.number().min(1, "Month is required").max(12, "Month must be 1-12"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    orders: z.coerce.number().min(0, "Orders must be 0 or higher"),
    sales: z.coerce.number().min(0, "Sales must be 0 or higher"),
    revenue: z.coerce.number().min(0, "Revenue must be 0 or higher"),
    commission: z.coerce.number().min(0, "Commission must be 0 or higher"),
    banking: z.coerce.number().min(0, "Banking must be 0 or higher"),
    subsidy: z.coerce.number().min(0, "Subsidy must be 0 or higher"),
    vat: z.coerce.number().min(0, "VAT must be 0 or higher"),
    posFees: z.coerce.number().min(0, "POS Fees must be 0 or higher"),
    profit: z.coerce.number(),
    netEarnings: z.coerce.number(),
    notes: z.string().optional(),
  });

  type ProfitabilityFormValues = z.infer<typeof profitabilityFormSchema>;

  const profitabilityForm = useForm<ProfitabilityFormValues>({
    resolver: zodResolver(profitabilityFormSchema),
    defaultValues: {
      deliveryAppId: "",
      periodType: "monthly",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      startDate: "",
      endDate: "",
      orders: 0,
      sales: 0,
      revenue: 0,
      commission: 0,
      banking: 0,
      subsidy: 0,
      vat: 0,
      posFees: 0,
      profit: 0,
      netEarnings: 0,
      notes: "",
    },
  });
  
  const watchPeriodType = profitabilityForm.watch("periodType");

  // Fetch profitability entries
  const { data: profitabilityEntries = [], isLoading: isLoadingProfitability } = useQuery<DeliveryProfitability[]>({
    queryKey: ["/api/delivery-profitability", { year: profitabilityYear }],
    queryFn: async () => {
      const res = await fetch(`/api/delivery-profitability?year=${profitabilityYear}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profitability entries");
      return res.json();
    },
  });

  // Create profitability mutation
  const createProfitabilityMutation = useMutation({
    mutationFn: async (data: ProfitabilityFormValues) => {
      return await apiRequest("POST", "/api/delivery-profitability", {
        ...data,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        sales: data.sales.toFixed(2),
        revenue: data.revenue.toFixed(2),
        commission: data.commission.toFixed(2),
        banking: data.banking.toFixed(2),
        subsidy: data.subsidy.toFixed(2),
        vat: data.vat.toFixed(2),
        posFees: data.posFees.toFixed(2),
        profit: data.profit.toFixed(2),
        netEarnings: data.netEarnings.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-profitability"] });
      setProfitabilityDialogOpen(false);
      profitabilityForm.reset();
      toast({
        title: "Profitability entry created",
        description: "The entry has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create entry",
        description: error.message || "Could not create profitability entry",
        variant: "destructive",
      });
    },
  });

  // Update profitability mutation
  const updateProfitabilityMutation = useMutation({
    mutationFn: async (data: ProfitabilityFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/delivery-profitability/${data.id}`, {
        deliveryAppId: data.deliveryAppId,
        periodType: data.periodType,
        year: data.year,
        month: data.month,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        orders: data.orders,
        sales: data.sales.toFixed(2),
        revenue: data.revenue.toFixed(2),
        commission: data.commission.toFixed(2),
        banking: data.banking.toFixed(2),
        subsidy: data.subsidy.toFixed(2),
        vat: data.vat.toFixed(2),
        posFees: data.posFees.toFixed(2),
        profit: data.profit.toFixed(2),
        netEarnings: data.netEarnings.toFixed(2),
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-profitability"] });
      setProfitabilityDialogOpen(false);
      setEditingProfitability(null);
      profitabilityForm.reset();
      toast({
        title: "Profitability entry updated",
        description: "The entry has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update entry",
        description: error.message || "Could not update profitability entry",
        variant: "destructive",
      });
    },
  });

  // Delete profitability mutation
  const deleteProfitabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/delivery-profitability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-profitability"] });
      setDeletingProfitability(null);
      toast({
        title: "Profitability entry deleted",
        description: "The entry has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete entry",
        description: error.message || "Could not delete profitability entry",
        variant: "destructive",
      });
    },
  });

  const handleProfitabilitySubmit = (data: ProfitabilityFormValues) => {
    if (editingProfitability) {
      updateProfitabilityMutation.mutate({ ...data, id: editingProfitability.id });
    } else {
      createProfitabilityMutation.mutate(data);
    }
  };

  const handleEditProfitability = (entry: DeliveryProfitability) => {
    setEditingProfitability(entry);
    profitabilityForm.reset({
      deliveryAppId: entry.deliveryAppId,
      periodType: (entry.periodType as "daily" | "weekly" | "monthly") || "monthly",
      year: entry.year,
      month: entry.month,
      startDate: entry.startDate || "",
      endDate: entry.endDate || "",
      orders: entry.orders,
      sales: parseFloat(entry.sales),
      revenue: parseFloat(entry.revenue),
      commission: parseFloat(entry.commission),
      banking: parseFloat(entry.banking),
      subsidy: parseFloat(entry.subsidy),
      vat: parseFloat(entry.vat || "0"),
      posFees: parseFloat(entry.posFees),
      profit: parseFloat(entry.profit || "0"),
      netEarnings: parseFloat(entry.netEarnings),
      notes: entry.notes || "",
    });
    setProfitabilityDialogOpen(true);
  };

  const handleProfitabilityDialogChange = (isOpen: boolean) => {
    setProfitabilityDialogOpen(isOpen);
    if (!isOpen) {
      setEditingProfitability(null);
      profitabilityForm.reset();
    }
  };

  const getDeliveryAppName = (appId: string) => {
    const app = deliveryApps.find(a => a.id === appId);
    return app?.name || "Unknown App";
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`${layout.text3Xl} font-bold`}>{t.deliveryApps}</h1>
          <p className="text-muted-foreground mt-1">Manage delivery platform commissions and fees</p>
        </div>
      </div>

      <Tabs defaultValue="apps" className="space-y-4" data-testid="tabs-delivery">
        <TabsList>
          <TabsTrigger value="apps" data-testid="tab-delivery-apps">
            <TrendingUp className="h-4 w-4 mr-2" />
            Delivery Apps
          </TabsTrigger>
          <TabsTrigger value="profitability" data-testid="tab-profitability-entries">
            <FileText className="h-4 w-4 mr-2" />
            Profitability Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <div className="flex justify-end">
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
                      <FormLabel>{t.commission}<InfoTip>{tip("Platform commission percentage taken from each order.", "نسبة عمولة المنصة من كل طلب.")}</InfoTip></FormLabel>
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
                      <FormLabel>{t.bankingFees}<InfoTip>{tip("Payment processing fee percentage charged by the platform.", "نسبة رسوم المعالجة البنكية التي تأخذها المنصة.")}</InfoTip></FormLabel>
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
                  name="markUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.markUp || "Mark-Up %"}<InfoTip>{tip("Extra percentage added to menu prices on this platform.", "نسبة الزيادة المضافة على أسعار القائمة في هذه المنصة.")}</InfoTip></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t.enterMarkUp || "Enter mark-up percentage"}
                          {...field}
                          data-testid="input-mark-up"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Subsidy Tiers<InfoTip>{tip("Order amount ranges where the platform subsidizes part of the price.", "نطاقات قيمة الطلب التي تدعم فيها المنصة جزءاً من السعر.")}</InfoTip></FormLabel>
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
                  </div>
                  {form.watch("subsidyTiers").map((tier, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name={`subsidyTiers.${index}.minAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Min (SAR)<InfoTip>{tip("Lowest order amount this tier applies to.", "أقل مبلغ طلب تنطبق عليه هذه الشريحة.")}</InfoTip></FormLabel>
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
                              <FormLabel className="text-xs">Max (SAR)<InfoTip>{tip("Highest order amount for this tier (blank for no limit).", "أعلى مبلغ طلب لهذه الشريحة (اتركه فارغاً بلا حد).")}</InfoTip></FormLabel>
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
                              <FormLabel className="text-xs">Subsidy (SAR)<InfoTip>{tip("Amount the platform contributes per order in this tier.", "المبلغ الذي تساهم به المنصة لكل طلب في هذه الشريحة.")}</InfoTip></FormLabel>
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={t.delete}
                            onClick={() => {
                              const current = form.getValues("subsidyTiers");
                              form.setValue("subsidyTiers", current.filter((_, i) => i !== index));
                            }}
                            data-testid={`button-delete-tier-${index}`}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tip("Remove this subsidy tier.", "إزالة شريحة الدعم هذه.")}</TooltipContent>
                      </Tooltip>
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
                      <FormLabel>{t.posFees}<InfoTip>{tip("Fixed POS/processing fee deducted per order.", "رسوم نقطة البيع الثابتة المخصومة لكل طلب.")}</InfoTip></FormLabel>
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
            <h2 className={`${layout.textXl} font-semibold`}>{t.netEarningsCalculator}<InfoTip>{tip("Estimate net earnings after commission, fees, subsidy and VAT.", "تقدير صافي الأرباح بعد العمولة والرسوم والدعم وضريبة القيمة المضافة.")}</InfoTip></h2>
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
                  isRTL={isRTL}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={profitabilityYear.toString()}
                onValueChange={(val) => setProfitabilityYear(parseInt(val))}
              >
                <SelectTrigger className="w-[120px]" data-testid="select-profitability-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={profitabilityDialogOpen} onOpenChange={handleProfitabilityDialogChange}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-profitability">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProfitability ? "Edit Profitability Entry" : "Add Profitability Entry"}</DialogTitle>
                  <DialogDescription>
                    {editingProfitability ? "Update the profitability data for this period" : "Enter profitability data for a delivery app"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...profitabilityForm}>
                  <form onSubmit={profitabilityForm.handleSubmit(handleProfitabilitySubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profitabilityForm.control}
                        name="deliveryAppId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery App<InfoTip>{tip("Which delivery platform this profitability entry belongs to.", "تطبيق التوصيل الذي يخص هذا السجل.")}</InfoTip></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-delivery-app">
                                  <SelectValue placeholder="Select app" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {deliveryApps.map((app) => (
                                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="periodType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period Type<InfoTip>{tip("Choose whether this entry covers a day range, week, or month.", "اختر ما إذا كان السجل لنطاق يومي أو أسبوعي أو شهري.")}</InfoTip></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-period-type">
                                  <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily (Date Range)</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {watchPeriodType === "monthly" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profitabilityForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} data-testid="input-profitability-year" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profitabilityForm.control}
                          name="month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Month</FormLabel>
                              <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-month">
                                    <SelectValue placeholder="Select month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {monthNames.map((name, index) => (
                                    <SelectItem key={index + 1} value={(index + 1).toString()}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profitabilityForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-start-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profitabilityForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-end-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profitabilityForm.control}
                        name="orders"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orders<InfoTip>{tip("Total number of orders received in this period.", "إجمالي عدد الطلبات في هذه الفترة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} data-testid="input-orders" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="sales"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sales (SAR)<InfoTip>{tip("Gross sales amount before deductions.", "إجمالي المبيعات قبل الخصومات.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-sales" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="revenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Revenue (SAR)<InfoTip>{tip("Net revenue received from the platform.", "صافي الإيرادات المستلمة من المنصة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-revenue" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="commission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission (SAR)<InfoTip>{tip("Total commission paid to the platform.", "إجمالي العمولة المدفوعة للمنصة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-commission-amount" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="banking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banking (SAR)<InfoTip>{tip("Total banking/processing fees deducted.", "إجمالي الرسوم البنكية المخصومة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="subsidy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subsidy (SAR)<InfoTip>{tip("Platform subsidy received in this period.", "إجمالي الدعم من المنصة في هذه الفترة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-subsidy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="vat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT (SAR)<InfoTip>{tip("Value-added tax amount for the period.", "قيمة ضريبة القيمة المضافة للفترة.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-vat" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="posFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>POS Fees (SAR)<InfoTip>{tip("Fixed POS fees deducted across all orders.", "إجمالي رسوم نقطة البيع المخصومة من جميع الطلبات.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-pos-fees-amount" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="profit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profit (SAR)<InfoTip>{tip("Calculated profit before net adjustments.", "الربح المحسوب قبل التسويات الصافية.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-profit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profitabilityForm.control}
                        name="netEarnings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Net Earnings (SAR)<InfoTip>{tip("Final amount kept after all deductions.", "المبلغ النهائي بعد جميع الخصومات.")}</InfoTip></FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-net-earnings" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profitabilityForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional notes..." {...field} data-testid="input-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => handleProfitabilityDialogChange(false)} data-testid="button-cancel-profitability">
                        {t.cancel}
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createProfitabilityMutation.isPending || updateProfitabilityMutation.isPending}
                        data-testid="button-save-profitability"
                      >
                        {createProfitabilityMutation.isPending || updateProfitabilityMutation.isPending ? t.loading : t.save}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingProfitability ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          ) : profitabilityEntries.length === 0 ? (
            <Card>
              <CardContent className={`${layout.cardPadding} text-center py-12`}>
                <p className="text-muted-foreground">No profitability entries for {profitabilityYear}. Add one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table data-testid="table-profitability">
                  <TableHeader>
                    <TableRow>
                      <TableHead>App</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Net Earnings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitabilityEntries.map((entry) => (
                      <TableRow key={entry.id} data-testid={`row-profitability-${entry.id}`}>
                        <TableCell className="font-medium" data-testid={`text-app-name-${entry.id}`}>
                          {getDeliveryAppName(entry.deliveryAppId)}
                        </TableCell>
                        <TableCell data-testid={`text-period-${entry.id}`}>
                          {entry.periodType === "monthly" || !entry.periodType ? (
                            <span>{monthNames[entry.month - 1]} {entry.year}</span>
                          ) : (
                            <span className="text-sm">
                              <Badge variant="outline" className="mr-1">{entry.periodType}</Badge>
                              {entry.startDate && entry.endDate ? (
                                <span>{new Date(entry.startDate).toLocaleDateString()} - {new Date(entry.endDate).toLocaleDateString()}</span>
                              ) : (
                                <span>{monthNames[entry.month - 1]} {entry.year}</span>
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-orders-${entry.id}`}>
                          {entry.orders.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-sales-${entry.id}`}>
                          {parseFloat(entry.sales).toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-revenue-${entry.id}`}>
                          {parseFloat(entry.revenue).toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-commission-${entry.id}`}>
                          {parseFloat(entry.commission).toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-vat-${entry.id}`}>
                          {parseFloat(entry.vat || "0").toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-profit-${entry.id}`}>
                          <Badge variant={parseFloat(entry.profit || "0") >= 0 ? "default" : "destructive"}>
                            {parseFloat(entry.profit || "0").toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold" data-testid={`text-net-earnings-${entry.id}`}>
                          <Badge variant={parseFloat(entry.netEarnings) >= 0 ? "default" : "destructive"}>
                            {parseFloat(entry.netEarnings).toLocaleString('en-SA', { minimumFractionDigits: 2 })} SAR
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  aria-label={t.edit}
                                  onClick={() => handleEditProfitability(entry)}
                                  data-testid={`button-edit-profitability-${entry.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{tip("Edit this profitability entry.", "تعديل سجل الربحية هذا.")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  aria-label={t.delete}
                                  onClick={() => setDeletingProfitability(entry)}
                                  data-testid={`button-delete-profitability-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{tip("Permanently delete this profitability entry.", "حذف سجل الربحية نهائياً.")}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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

      <AlertDialog open={!!deletingProfitability} onOpenChange={(open) => !open && setDeletingProfitability(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profitability Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profitability entry for {deletingProfitability ? getDeliveryAppName(deletingProfitability.deliveryAppId) : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-profitability">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProfitability && deleteProfitabilityMutation.mutate(deletingProfitability.id)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-profitability"
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
