import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  CalendarCheck,
  Users,
  DollarSign,
  Truck,
  Pause,
  Play,
  XCircle,
  MapPin,
  Clock,
  Download,
  MessageCircle,
  CheckCircle2,
  Undo2,
  Wallet,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MealSubscription, MenuItem as MenuItemType } from "@shared/schema";

interface MealSelection {
  name: string;
  menuItemId?: string;
}

type MealSelectionsMap = Record<string, MealSelection[]>;

type PlanType = "daily" | "weekly" | "monthly";
type MealTimeType = "breakfast" | "lunch" | "dinner";
type PaymentStatusType = "paid" | "pending" | "partial";
type SubscriptionStatusType = "active" | "paused" | "expired" | "cancelled";

const PLAN_TYPES: PlanType[] = ["daily", "weekly", "monthly"];
const MEAL_TIMES: MealTimeType[] = ["breakfast", "lunch", "dinner"];
const PAYMENT_STATUSES: PaymentStatusType[] = ["paid", "pending", "partial"];

const DEFAULT_DELIVERY_HOURS: Record<string, string> = {
  breakfast: "07:00",
  lunch: "12:00",
  dinner: "19:00",
};

const subscriptionFormSchema = z.object({
  subscriberName: z.string().min(1, "Name is required"),
  subscriberPhone: z.string().min(1, "Phone is required"),
  subscriberEmail: z.string().optional(),
  deliveryAddress: z.string().optional(),
  dietaryNotes: z.string().optional(),
  mealSelections: z.record(z.string(), z.array(z.object({
    name: z.string(),
    menuItemId: z.string().optional(),
  }))).default({}),
  planType: z.enum(["daily", "weekly", "monthly"]),
  scheduleDays: z.array(z.string()).default([]),
  mealTime: z.array(z.enum(["breakfast", "lunch", "dinner"])).min(1, "Select at least one meal time"),
  deliveryHours: z.record(z.string(), z.string()).default({}),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  numberOfDays: z.coerce.number().min(1, "Minimum 1 day").optional(),
  amount: z.string().min(1, "Amount is required"),
  paymentStatus: z.enum(["paid", "pending", "partial"]),
  status: z.enum(["active", "paused", "expired", "cancelled"]).default("active"),
  notes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function asPlanType(val: string): PlanType {
  return PLAN_TYPES.includes(val as PlanType) ? (val as PlanType) : "daily";
}

function parseMealTimes(val: string): MealTimeType[] {
  if (!val) return ["lunch"];
  const parts = val.split(",").map((s) => s.trim()).filter((s) => MEAL_TIMES.includes(s as MealTimeType));
  return parts.length > 0 ? (parts as MealTimeType[]) : ["lunch"];
}

function parseDeliveryHoursStatic(val: unknown): Record<string, string> {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, string>;
  return {};
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

function asPaymentStatus(val: string): PaymentStatusType {
  return PAYMENT_STATUSES.includes(val as PaymentStatusType) ? (val as PaymentStatusType) : "pending";
}

function asSubscriptionStatus(val: string): SubscriptionStatusType {
  const valid: SubscriptionStatusType[] = ["active", "paused", "expired", "cancelled"];
  return valid.includes(val as SubscriptionStatusType) ? (val as SubscriptionStatusType) : "active";
}

function parseMealSelectionsFlat(raw: unknown): MealSelection[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is MealSelection =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === "string"
    );
  }
  if (typeof raw === 'object') {
    const map = raw as Record<string, unknown>;
    const all: MealSelection[] = [];
    for (const vals of Object.values(map)) {
      if (Array.isArray(vals)) {
        for (const item of vals) {
          if (typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).name === 'string') {
            all.push(item as MealSelection);
          }
        }
      }
    }
    return all;
  }
  return [];
}

function parseMealSelectionsMap(raw: unknown, mealTimes: string[]): MealSelectionsMap {
  const result: MealSelectionsMap = {};
  for (const mt of mealTimes) result[mt] = [];
  if (!raw) return result;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const map = raw as Record<string, unknown>;
    for (const mt of mealTimes) {
      if (Array.isArray(map[mt])) {
        result[mt] = (map[mt] as unknown[]).filter(
          (item): item is MealSelection =>
            typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).name === 'string'
        );
      }
    }
    return result;
  }
  if (Array.isArray(raw)) {
    const flat = raw.filter(
      (item): item is MealSelection =>
        typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).name === 'string'
    );
    if (mealTimes.length > 0) {
      result[mealTimes[0]] = flat;
    }
    return result;
  }
  return result;
}

export default function MealSubscriptionsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<MealSubscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "today">("all");

  const { data: subscriptions = [], isLoading } = useQuery<MealSubscription[]>({
    queryKey: ["/api/meal-subscriptions"],
  });

  const { data: todaysDeliveryList = [] } = useQuery<MealSubscription[]>({
    queryKey: ["/api/meal-subscriptions/today"],
  });

  const { data: menuItems = [] } = useQuery<MenuItemType[]>({
    queryKey: ["/api/menu"],
  });

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      subscriberName: "",
      subscriberPhone: "",
      subscriberEmail: "",
      deliveryAddress: "",
      dietaryNotes: "",
      mealSelections: {},
      planType: "daily",
      scheduleDays: [],
      mealTime: ["lunch"],
      startDate: "",
      endDate: "",
      numberOfDays: undefined,
      amount: "",
      paymentStatus: "pending",
      status: "active",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const payload = {
        ...data,
        mealTime: data.mealTime.join(","),
        startDate: data.startDate ? new Date(data.startDate + "T00:00:00").toISOString() : new Date().toISOString(),
        endDate: data.endDate ? new Date(data.endDate + "T00:00:00").toISOString() : null,
      };
      const res = await apiRequest("POST", "/api/meal-subscriptions", payload);
      return res.json();
    },
    onSuccess: (created: MealSubscription) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      toast({ title: t.subscriptionCreated });
      setDialogOpen(false);
      form.reset();
      if (created?.id && created?.subscriberPhone) {
        handleWhatsApp(created);
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubscriptionFormValues> }) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.mealTime) payload.mealTime = data.mealTime.join(",");
      if (data.startDate) payload.startDate = new Date(data.startDate + "T00:00:00").toISOString();
      if (data.endDate) payload.endDate = new Date(data.endDate + "T00:00:00").toISOString();
      return apiRequest("PATCH", `/api/meal-subscriptions/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      toast({ title: t.subscriptionUpdated });
      setDialogOpen(false);
      setEditingSubscription(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/meal-subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      toast({ title: t.subscriptionDeleted });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/meal-subscriptions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      toast({ title: t.subscriptionUpdated });
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async ({ id, mealTime }: { id: string; mealTime: string }) => {
      return apiRequest("POST", `/api/meal-subscriptions/${id}/mark-delivered`, { mealTime });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      toast({ title: t.delivered });
      const sub = subscriptions.find(s => s.id === variables.id);
      if (sub) {
        const pdfUrl = `${window.location.origin}/api/meal-subscriptions/${sub.id}/schedule-pdf`;
        const mtLabel = getMealTimeLabel(variables.mealTime);
        import("@/lib/whatsapp").then(({ openWhatsAppWithMessage }) => {
          const message = `*${t.mealSubscriptions}*\n\n${sub.subscriberName},\n\n✓ ${mtLabel} ${t.delivered}\n\n${pdfUrl}`;
          openWhatsAppWithMessage(sub.subscriberPhone, message);
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const undoDeliveryMutation = useMutation({
    mutationFn: async ({ id, mealTime }: { id: string; mealTime: string }) => {
      return apiRequest("POST", `/api/meal-subscriptions/${id}/undo-delivered`, { mealTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  type DeliveryLogEntry = { date: string; mealTime: string; deliveredAt: string };

  const isMealDeliveredToday = (sub: MealSubscription, mealTime: string): boolean => {
    const todayStr = new Date().toISOString().split("T")[0];
    const log = Array.isArray(sub.deliveryLog) ? (sub.deliveryLog as DeliveryLogEntry[]) : [];
    return log.some((entry) => entry.date === todayStr && entry.mealTime === mealTime);
  };

  const getDeliveredTime = (sub: MealSubscription, mealTime: string): string | null => {
    const todayStr = new Date().toISOString().split("T")[0];
    const log = Array.isArray(sub.deliveryLog) ? (sub.deliveryLog as DeliveryLogEntry[]) : [];
    const entry = log.find((e) => e.date === todayStr && e.mealTime === mealTime);
    if (entry?.deliveredAt) {
      return new Date(entry.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  };

  const handleOpenCreate = () => {
    setEditingSubscription(null);
    form.reset({
      subscriberName: "",
      subscriberPhone: "",
      subscriberEmail: "",
      deliveryAddress: "",
      dietaryNotes: "",
      mealSelections: {},
      planType: "daily",
      scheduleDays: [],
      mealTime: ["lunch"],
      deliveryHours: { ...DEFAULT_DELIVERY_HOURS },
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      numberOfDays: undefined,
      amount: "",
      paymentStatus: "pending",
      status: "active",
      notes: "",
    });
    setDialogOpen(true);
  };

  const parseDeliveryHours = (val: unknown): Record<string, string> => {
    if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, string>;
    return {};
  };

  const handleOpenEdit = (sub: MealSubscription) => {
    setEditingSubscription(sub);
    const existingHours = parseDeliveryHours(sub.deliveryHours);
    const mealTimes = parseMealTimes(sub.mealTime);
    const deliveryHours: Record<string, string> = {};
    for (const mt of mealTimes) {
      deliveryHours[mt] = existingHours[mt] || DEFAULT_DELIVERY_HOURS[mt] || "12:00";
    }
    form.reset({
      subscriberName: sub.subscriberName,
      subscriberPhone: sub.subscriberPhone,
      subscriberEmail: sub.subscriberEmail || "",
      deliveryAddress: sub.deliveryAddress || "",
      dietaryNotes: sub.dietaryNotes || "",
      mealSelections: parseMealSelectionsMap(sub.mealSelections, parseMealTimes(sub.mealTime)),
      planType: asPlanType(sub.planType),
      scheduleDays: Array.isArray(sub.scheduleDays) ? sub.scheduleDays : [],
      mealTime: mealTimes,
      deliveryHours,
      startDate: sub.startDate ? new Date(sub.startDate).toISOString().split("T")[0] : "",
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : "",
      numberOfDays: sub.numberOfDays || undefined,
      amount: sub.amount?.toString() || "",
      paymentStatus: asPaymentStatus(sub.paymentStatus),
      status: asSubscriptionStatus(sub.status),
      notes: sub.notes || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: SubscriptionFormValues) => {
    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const monthlyRev = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);

  const filteredSubscriptions = subscriptions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.subscriberName.toLowerCase().includes(q) ||
        s.subscriberPhone.includes(q)
      );
    }
    return true;
  });



  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      paused: "secondary",
      expired: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      active: t.active,
      paused: t.paused,
      expired: t.expired,
      cancelled: t.cancelled,
    };
    return <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      partial: "outline",
    };
    const labels: Record<string, string> = {
      paid: t.paid,
      pending: t.pending,
      partial: t.partial,
    };
    return <Badge variant={variants[status] || "outline"} data-testid={`badge-payment-${status}`}>{labels[status] || status}</Badge>;
  };

  const getMealTimeLabel = (time: string) => {
    const labels: Record<string, string> = {
      breakfast: t.breakfast,
      lunch: t.lunch,
      dinner: t.dinner,
    };
    return labels[time] || time;
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      daily: t.daily,
      weekly: t.weekly,
      monthly: t.monthly,
    };
    return labels[plan] || plan;
  };

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      sunday: t.sunday,
      monday: t.monday,
      tuesday: t.tuesday,
      wednesday: t.wednesday,
      thursday: t.thursday,
      friday: t.friday,
      saturday: t.saturday,
    };
    return labels[day] || day;
  };

  const toggleDay = (day: string) => {
    const current = form.getValues("scheduleDays") || [];
    if (current.includes(day)) {
      form.setValue("scheduleDays", current.filter((d) => d !== day));
    } else {
      form.setValue("scheduleDays", [...current, day]);
    }
  };

  const calculateAmountFromMap = (selectionsMap?: MealSelectionsMap, days?: number) => {
    const map = selectionsMap ?? form.getValues("mealSelections") ?? {};
    let mealsPerDay = 0;
    for (const mealTimeSelections of Object.values(map)) {
      for (const sel of mealTimeSelections) {
        if (sel.menuItemId) {
          const menuItem = menuItems.find((m) => m.id === sel.menuItemId);
          if (menuItem?.price) mealsPerDay += parseFloat(menuItem.price);
        }
      }
    }
    const numDays = days ?? form.getValues("numberOfDays") ?? 1;
    const total = mealsPerDay * numDays;
    if (total > 0) {
      form.setValue("amount", total.toFixed(2));
    }
  };

  const toggleMenuItemForMealTime = (mealTime: string, item: MenuItemType) => {
    const allSelections = { ...(form.getValues("mealSelections") || {}) };
    const current = allSelections[mealTime] || [];
    const isSelected = current.some((s) => s.menuItemId === item.id);
    if (isSelected) {
      allSelections[mealTime] = current.filter((s) => s.menuItemId !== item.id);
    } else {
      allSelections[mealTime] = [...current, { name: item.name, menuItemId: item.id }];
    }
    form.setValue("mealSelections", allSelections);
    calculateAmountFromMap(allSelections);
  };

  const removeSelectionFromMealTime = (mealTime: string, idx: number) => {
    const allSelections = { ...(form.getValues("mealSelections") || {}) };
    const current = allSelections[mealTime] || [];
    allSelections[mealTime] = current.filter((_, i) => i !== idx);
    form.setValue("mealSelections", allSelections);
    calculateAmountFromMap(allSelections);
  };

  const handleDownloadPdf = async (subId: string) => {
    try {
      const response = await fetch(`/api/meal-subscriptions/${subId}/schedule-pdf`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meal-subscription-schedule.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Failed to download schedule PDF", variant: "destructive" });
    }
  };

  const handleWhatsApp = (sub: MealSubscription) => {
    import("@/lib/whatsapp").then(({ formatPhoneForWhatsApp, openWhatsAppWithMessage }) => {
      const mealTimesList = sub.mealTime.split(",").map(t => t.trim());
      const mealTimesStr = mealTimesList.map(t => getMealTimeLabel(t)).join(", ");
      const selectionsMap = parseMealSelectionsMap(sub.mealSelections, mealTimesList);
      let mealsBlock = "";
      for (const mt of mealTimesList) {
        const items = selectionsMap[mt] || [];
        if (items.length > 0) {
          mealsBlock += `\n*${getMealTimeLabel(mt)}:*\n${items.map(s => `  - ${s.name}`).join("\n")}\n`;
        }
      }
      const scheduleUrl = `${window.location.origin}/api/meal-subscriptions/${sub.id}/schedule-pdf`;
      const daysInfo = sub.numberOfDays ? `\n${t.numberOfDays || "Number of Days"}: ${sub.numberOfDays}` : '';
      const message = `*${t.mealSubscriptions}*\n\n${sub.subscriberName},\n\n${t.planType}: ${getPlanLabel(sub.planType)}\n${t.mealTime}: ${mealTimesStr}${mealsBlock}${daysInfo}\n${t.subscriptionAmount}: ${parseFloat(sub.amount || '0').toFixed(2)} SAR\n\n${scheduleUrl}`;
      openWhatsAppWithMessage(sub.subscriberPhone, message);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-subscriptions">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.mealSubscriptions}</h1>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-subscription">
          <Plus className="mr-2 h-4 w-4" />
          {t.addSubscription}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.activeSubscriptions}</p>
              <p className="text-2xl font-bold" data-testid="text-active-count">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-md bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.monthlyRevenue}</p>
              <p className="text-2xl font-bold" data-testid="text-monthly-revenue">{monthlyRev.toFixed(2)} SAR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-md bg-blue-500/10 p-2">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.creditBalance || "Credit Balance"}</p>
              <p className="text-2xl font-bold" data-testid="text-total-credit">
                {subscriptions
                  .filter((s) => s.status === "active")
                  .reduce((sum, s) => sum + parseFloat(s.creditBalance || "0"), 0)
                  .toFixed(2)} SAR
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-md bg-orange-500/10 p-2">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.todaysDeliveries}</p>
              <p className="text-2xl font-bold" data-testid="text-today-deliveries">
                {todaysDeliveryList.reduce((count, sub) => {
                  const mealTimes = sub.mealTime.split(",").map((mt) => mt.trim());
                  const pending = mealTimes.filter((mt) => !isMealDeliveredToday(sub, mt)).length;
                  return count + pending;
                }, 0)} / {todaysDeliveryList.reduce((count, sub) => count + sub.mealTime.split(",").length, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            data-testid="button-tab-all"
          >
            {t.mealSubscriptions}
          </Button>
          <Button
            variant={activeTab === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("today")}
            data-testid="button-tab-today"
          >
            {t.todaysDeliveries}
          </Button>
        </div>
        {activeTab === "all" && (
          <>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search || "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all || "All"}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="paused">{t.paused}</SelectItem>
                <SelectItem value="expired">{t.expired}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {activeTab === "today" ? (
        todaysDeliveryList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-deliveries-today">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noDeliveriesToday}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todaysDeliveryList.map((sub) => {
              const mealTimes = sub.mealTime.split(",").map((mt) => mt.trim());
              const selectionsMap = parseMealSelectionsMap(sub.mealSelections, mealTimes);
              const allDone = mealTimes.every((mt) => isMealDeliveredToday(sub, mt));
              return (
                <Card key={sub.id} className={allDone ? "opacity-60" : ""} data-testid={`card-delivery-${sub.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg" data-testid={`text-delivery-name-${sub.id}`}>{sub.subscriberName}</h3>
                        {allDone && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t.allDelivered}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {sub.subscriberPhone}
                        </span>
                        {sub.deliveryAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {sub.deliveryAddress}
                          </span>
                        )}
                      </div>
                    </div>
                    {getPaymentBadge(sub.paymentStatus)}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sub.dietaryNotes && (
                      <p className="text-xs text-muted-foreground italic">{sub.dietaryNotes}</p>
                    )}
                    <div className="space-y-2 pt-2 border-t">
                      {mealTimes.map((mt) => {
                        const done = isMealDeliveredToday(sub, mt);
                        const doneTime = getDeliveredTime(sub, mt);
                        const mtSelections = selectionsMap[mt] || [];
                        return (
                          <div key={mt} className="rounded-md border p-2 space-y-2">
                            {mtSelections.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {mtSelections.map((item, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {item.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{getMealTimeLabel(mt)}</span>
                              {(() => {
                                const hours = parseDeliveryHoursStatic(sub.deliveryHours);
                                const hour = hours[mt];
                                return hour ? <span className="text-xs text-muted-foreground">({formatTime12h(hour)})</span> : null;
                              })()}
                              {done && doneTime && (
                                <Badge variant="outline" className="text-xs">{doneTime}</Badge>
                              )}
                            </div>
                            {done ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-green-600 text-white">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t.delivered}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => undoDeliveryMutation.mutate({ id: sub.id, mealTime: mt })}
                                  disabled={undoDeliveryMutation.isPending}
                                  data-testid={`button-undo-delivery-${sub.id}-${mt}`}
                                >
                                  <Undo2 className="h-3 w-3 mr-1" />
                                  {t.undoDelivery}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => markDeliveredMutation.mutate({ id: sub.id, mealTime: mt })}
                                disabled={markDeliveredMutation.isPending}
                                data-testid={`button-mark-delivered-${sub.id}-${mt}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {t.markDelivered}
                              </Button>
                            )}
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        filteredSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-subscriptions">
              <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noSubscriptions}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSubscriptions.map((sub) => {
              const mealTimesList = sub.mealTime.split(",").map(mt => mt.trim());
              const selectionsMap = parseMealSelectionsMap(sub.mealSelections, mealTimesList);
              return (
                <Card key={sub.id} data-testid={`card-subscription-${sub.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold truncate" data-testid={`text-name-${sub.id}`}>{sub.subscriberName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {sub.subscriberPhone}
                        </span>
                        {sub.deliveryAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{sub.deliveryAddress}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {getStatusBadge(sub.status)}
                      {getPaymentBadge(sub.paymentStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {sub.mealTime.split(",").map((mt) => {
                        const trimmed = mt.trim();
                        const label = getMealTimeLabel(trimmed);
                        const hours = parseDeliveryHoursStatic(sub.deliveryHours);
                        const hour = hours[trimmed];
                        return (
                          <span key={trimmed} className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {hour ? `${label} (${formatTime12h(hour)})` : label}
                          </span>
                        );
                      })}
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3 text-muted-foreground" />
                        {getPlanLabel(sub.planType)}
                      </span>
                      <span className="font-semibold">{parseFloat(sub.amount || "0").toFixed(2)} SAR{sub.numberOfDays ? ` (${sub.numberOfDays} ${t.days || "days"})` : ""}</span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <span className={`font-semibold ${parseFloat(sub.creditBalance || "0") <= 0 ? "text-destructive" : "text-green-600"}`}>
                          {parseFloat(sub.creditBalance || "0").toFixed(2)} SAR
                        </span>
                      </span>
                    </div>
                    {Array.isArray(sub.scheduleDays) && sub.scheduleDays.length > 0 && (
                      <div className="grid grid-cols-7 gap-1">
                        {DAY_KEYS.map((day) => {
                          const isActive = sub.scheduleDays.includes(day);
                          const dayInitial = getDayLabel(day).charAt(0).toUpperCase();
                          return (
                            <div
                              key={day}
                              className={`flex items-center justify-center rounded-md text-xs font-medium h-7 w-full transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              {dayInitial}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {Object.entries(selectionsMap).some(([, items]) => items.length > 0) && (
                      <div className="space-y-1">
                        {Object.entries(selectionsMap).map(([mt, items]) => items.length > 0 ? (
                          <div key={mt} className="flex flex-wrap gap-1 items-center">
                            <span className="text-xs text-muted-foreground font-medium">{getMealTimeLabel(mt)}:</span>
                            {items.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        ) : null)}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(sub.id)} data-testid={`button-pdf-${sub.id}`}>
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleWhatsApp(sub)} data-testid={`button-whatsapp-${sub.id}`}>
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(sub)} data-testid={`button-edit-${sub.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        {t.edit || "Edit"}
                      </Button>
                      {sub.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: sub.id, status: "paused" })} data-testid={`button-pause-${sub.id}`}>
                          <Pause className="h-3 w-3 mr-1" />
                          {t.pauseSubscription}
                        </Button>
                      )}
                      {sub.status === "paused" && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: sub.id, status: "active" })} data-testid={`button-resume-${sub.id}`}>
                          <Play className="h-3 w-3 mr-1" />
                          {t.resumeSubscription}
                        </Button>
                      )}
                      {(sub.status === "active" || sub.status === "paused") && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: sub.id, status: "cancelled" })} data-testid={`button-cancel-${sub.id}`}>
                          <XCircle className="h-3 w-3 mr-1" />
                          {t.cancelSubscription}
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(sub.id)} data-testid={`button-delete-${sub.id}`}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t.delete || "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingSubscription ? t.editSubscription : t.addSubscription}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subscriberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.subscriberName}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-subscriber-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriberPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.subscriberPhone}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-subscriber-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriberEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.subscriberEmail}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-subscriber-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.deliveryAddress}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-delivery-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.planType}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-plan-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">{t.daily}</SelectItem>
                          <SelectItem value="weekly">{t.weekly}</SelectItem>
                          <SelectItem value="monthly">{t.monthly}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mealTime"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t.mealTime}</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {MEAL_TIMES.map((time) => {
                          const selected = (form.watch("mealTime") || []).includes(time);
                          return (
                            <Button
                              key={time}
                              type="button"
                              size="sm"
                              variant={selected ? "default" : "outline"}
                              className={`toggle-elevate ${selected ? "toggle-elevated" : ""}`}
                              onClick={() => {
                                const current = form.getValues("mealTime") || [];
                                const currentHours = form.getValues("deliveryHours") || {};
                                let updated: MealTimeType[];
                                let updatedHours = { ...currentHours };
                                if (selected) {
                                  updated = current.filter((t) => t !== time);
                                  if (updated.length === 0) return;
                                  delete updatedHours[time];
                                } else {
                                  updated = [...current, time];
                                  updatedHours[time] = DEFAULT_DELIVERY_HOURS[time] || "12:00";
                                }
                                form.setValue("mealTime", updated, { shouldValidate: true });
                                form.setValue("deliveryHours", updatedHours);
                                calculateAmountFromMap(form.getValues("mealSelections") as any);
                              }}
                              data-testid={`button-meal-time-${time}`}
                            >
                              {getMealTimeLabel(time)}
                            </Button>
                          );
                        })}
                      </div>
                      {(form.watch("mealTime") || []).length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-3 p-3 rounded-md border bg-muted/20">
                          {(form.watch("mealTime") || []).map((mt) => (
                            <div key={mt} className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">{getMealTimeLabel(mt)}</span>
                              <Input
                                type="time"
                                value={(form.watch("deliveryHours") || {})[mt] || DEFAULT_DELIVERY_HOURS[mt] || "12:00"}
                                onChange={(e) => {
                                  const hours = { ...form.getValues("deliveryHours") };
                                  hours[mt] = e.target.value;
                                  form.setValue("deliveryHours", hours);
                                }}
                                className="w-[120px]"
                                data-testid={`input-delivery-hour-${mt}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.paymentStatus}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">{t.paid}</SelectItem>
                          <SelectItem value="pending">{t.pending}</SelectItem>
                          <SelectItem value="partial">{t.partial}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>{t.scheduleDays}</FormLabel>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {DAY_KEYS.map((day) => {
                    const selected = (form.watch("scheduleDays") || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`flex flex-col items-center justify-center rounded-md py-2 text-xs font-medium transition-colors cursor-pointer border ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60"
                        }`}
                        onClick={() => toggleDay(day)}
                        data-testid={`button-day-${day}`}
                      >
                        <span className="text-[10px] uppercase opacity-70">{getDayLabel(day).slice(0, 3)}</span>
                        <span className="text-sm font-semibold">{getDayLabel(day).charAt(0)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.startDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.endDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.numberOfDays || "Number of Days"} | عدد الأيام</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g. 30"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                            field.onChange(val);
                            if (val && val > 0) {
                              calculateAmountFromMap(form.getValues("mealSelections") as any, val);
                            }
                          }}
                          data-testid="input-number-of-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => {
                    const selectionsMap = (form.watch("mealSelections") || {}) as any as MealSelectionsMap;
                    const numDays = form.watch("numberOfDays");
                    let mealsPerDay = 0;
                    for (const mt of Object.keys(selectionsMap)) {
                      for (const sel of (selectionsMap[mt] || [])) {
                        if (sel.menuItemId) {
                          const mi = menuItems.find((m) => m.id === sel.menuItemId);
                          if (mi?.price) mealsPerDay += parseFloat(mi.price);
                        }
                      }
                    }
                    const hasCalc = mealsPerDay > 0 && numDays && numDays > 0;
                    return (
                      <FormItem>
                        <FormLabel>{t.subscriptionAmount} (SAR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-amount" />
                        </FormControl>
                        {hasCalc && (
                          <p className="text-xs text-muted-foreground" data-testid="text-amount-calc">
                            {mealsPerDay.toFixed(2)} SAR × {numDays} {t.days || "days"} = {(mealsPerDay * numDays).toFixed(2)} SAR
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div>
                <FormLabel>{t.mealSelections}</FormLabel>
                {(form.watch("mealTime") || []).map((mt) => {
                  const currentMap = (form.watch("mealSelections") || {}) as any as MealSelectionsMap;
                  const mtSelections = currentMap[mt] || [];
                  return (
                    <div key={mt} className="mt-3 space-y-2">
                      <p className="text-sm font-medium">{getMealTimeLabel(mt)}</p>
                      {menuItems.filter(item => item.available).length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {menuItems.filter(item => item.available).map((item) => {
                            const isSelected = mtSelections.some((s) => s.menuItemId === item.id);
                            return (
                              <Button
                                key={item.id}
                                type="button"
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={`toggle-elevate ${isSelected ? "toggle-elevated" : ""}`}
                                onClick={() => toggleMenuItemForMealTime(mt, item)}
                                data-testid={`button-menu-item-${mt}-${item.id}`}
                              >
                                {item.name} ({parseFloat(item.price).toFixed(2)} SAR)
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t.noMenuItems || "No menu items available."}</p>
                      )}
                      {mtSelections.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mtSelections.map((sel, idx) => (
                            <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-selection-${mt}-${idx}`}>
                              {sel.name}
                              <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={() => removeSelectionFromMealTime(mt, idx)}
                                data-testid={`button-remove-selection-${mt}-${idx}`}
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <FormField
                control={form.control}
                name="dietaryNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.dietaryNotes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} data-testid="input-dietary-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes || "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-dialog">
                  {t.cancel || "Cancel"}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingSubscription ? (t.save || "Save") : t.addSubscription}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteSubscription}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteSubscription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
