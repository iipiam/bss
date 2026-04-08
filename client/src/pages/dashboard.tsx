import { MetricCard } from "@/components/metric-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Phone,
  CreditCard,
  Wallet,
  RefreshCw,
  Truck,
  CheckCircle2,
  MapPin,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Order, ShopBill, MealSubscription } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useDeviceLayout, useCompactChartConfig } from "@/lib/mobileLayout";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

interface PerformanceMetric {
  current: number;
  previous: number;
  change: number;
}

interface PeakHoursData {
  hour: number;
  sales: number;
}

interface HourlyCustomerOrder {
  transactionId: string;
  customerName: string | null;
  customerPhone: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  orderType: string;
  createdAt: Date;
}

interface DashboardData {
  todaysSales: string;
  activeOrders: number;
  lowStockItems: number;
  cogsTotal: number;
  recentOrders: Order[];
  performance: {
    dod: PerformanceMetric;
    wow: PerformanceMetric;
    mom: PerformanceMetric;
    yoy: PerformanceMetric;
  };
  peakHours: {
    hourlyData: PeakHoursData[];
    peakHour: number;
    peakSales: number;
  };
}

interface SalesChartData {
  date: string;
  sales: number;
}

const PerformanceCard = ({
  title,
  metric,
  icon: Icon,
}: {
  title: string;
  metric: PerformanceMetric;
  icon: React.ElementType;
}) => {
  const { t } = useLanguage();
  const layout = useDeviceLayout();
  // Only show "No data" when there's truly no historical data (previous === 0)
  // Don't confuse this with legitimate 0% change when current === previous (both non-zero)
  const hasNoHistoricalData = metric.previous === 0 && metric.change === 0;
  const isPositive = metric.change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="hover-elevate transition-all">
      <CardContent className={layout.cardPadding}>
        <div
          className={`flex items-center justify-between gap-2 ${layout.isMobile ? "mb-2" : "mb-4"}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Icon
                className={`${layout.isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`}
              />
            </div>
            <h3
              className={`font-semibold ${layout.isMobile ? "text-xs" : "text-sm"} text-muted-foreground truncate`}
            >
              {title}
            </h3>
          </div>
          {hasNoHistoricalData ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-muted/50 text-muted-foreground shrink-0 whitespace-nowrap">
              <span>No data</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap ${
                isPositive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : metric.change === 0
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(metric.change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <p className={`${layout.text2Xl} font-bold`}>
              {metric.current.toFixed(2)} SAR
            </p>
            <p className="text-xs text-muted-foreground">{t.currentPeriod}</p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {t.previous}:{" "}
              <span className="font-mono">
                {metric.previous.toFixed(2)} SAR
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PeakHoursCard = ({
  peakHours,
}: {
  peakHours: {
    hourlyData: PeakHoursData[];
    peakHour: number;
    peakSales: number;
  };
}) => {
  const { t } = useLanguage();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: customerOrders,
    isLoading: ordersLoading,
    isError,
  } = useQuery<HourlyCustomerOrder[]>({
    queryKey: [`/api/analytics/peak-hours/${selectedHour}`],
    enabled: selectedHour !== null,
  });

  const formatHour = (hour: number) => {
    if (hour === 0) return `12 ${t.am}`;
    if (hour === 12) return `12 ${t.pm}`;
    if (hour < 12) return `${hour} ${t.am}`;
    return `${hour - 12} ${t.pm}`;
  };

  const chartData = peakHours.hourlyData.map((d) => ({
    hour: formatHour(d.hour),
    hourNumber: d.hour,
    sales: d.sales,
    isPeak: d.hour === peakHours.peakHour,
  }));

  const handleBarClick = (data: any) => {
    if (data && data.hourNumber !== undefined) {
      setSelectedHour(data.hourNumber);
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card className="hover-elevate transition-all">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t.peakHoursAnalysis}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.hourlySalesDistribution}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t.peakHour}</p>
              <p className="text-2xl font-bold">
                {formatHour(peakHours.peakHour)}
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                {peakHours.peakSales.toFixed(2)} SAR
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="hour"
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(2)} SAR`,
                  t.salesAmount,
                ]}
                labelClassName="text-sm font-semibold"
              />
              <Bar
                dataKey="sales"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor="pointer"
                data-testid="bar-peak-hours"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isPeak
                        ? "hsl(var(--chart-1))"
                        : "hsl(var(--primary))"
                    }
                    opacity={entry.isPeak ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-3xl max-h-[80vh] overflow-y-auto"
          data-testid="dialog-customer-orders"
        >
          <DialogHeader>
            <DialogTitle>
              {selectedHour !== null &&
                `${t.customersAt} ${formatHour(selectedHour)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ordersLoading ? (
              <p className="text-center text-muted-foreground">
                {t.loading}...
              </p>
            ) : isError ? (
              <p
                className="text-center text-red-600 dark:text-red-400 py-8"
                data-testid="text-error"
              >
                {t.errorLoadingCustomerOrders}
              </p>
            ) : customerOrders && customerOrders.length > 0 ? (
              <div className="space-y-3">
                {customerOrders.map((order) => (
                  <Card
                    key={order.transactionId}
                    className="hover-elevate"
                    data-testid={`card-order-${order.transactionId}`}
                  >
                    <CardContent className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span
                              className="font-semibold"
                              data-testid={`text-customer-${order.transactionId}`}
                            >
                              {order.customerName || t.walkInCustomer}
                            </span>
                          </div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{order.customerPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span>{order.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-right md:text-left">
                          <p
                            className="text-2xl font-bold"
                            data-testid={`text-total-${order.transactionId}`}
                          >
                            {order.total.toFixed(2)} SAR
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.itemCount}{" "}
                            {order.itemCount === 1
                              ? t.itemName
                              : t.itemName + "s"}
                          </p>
                          {order.orderType && (
                            <p className="text-sm text-muted-foreground">
                              {t.orderType}: {order.orderType}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p
                className="text-center text-muted-foreground py-8"
                data-testid="text-no-customers"
              >
                {t.noCustomersFound}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Dashboard() {
  const { t } = useLanguage();
  const layout = useDeviceLayout();
  const chartConfig = useCompactChartConfig();
  const { lastNotification, isConnected } = useNotifications();
  const { restaurant } = useAuth();
  const businessType = restaurant?.businessType || 'restaurant';

  // Real-time updates: Refresh dashboard data when sales/order/inventory/bills updates come in
  useEffect(() => {
    if (lastNotification) {
      // Orders and sales updates
      if (
        lastNotification.type === "sales:updated" ||
        lastNotification.type === "order:created" ||
        lastNotification.type === "order:statusUpdated"
      ) {
        // Invalidate dashboard queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ["/api/analytics/dashboard"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/sales"] });
      }
      
      // Inventory updates - refresh low stock count
      if (lastNotification.type === "inventory:updated") {
        queryClient.invalidateQueries({
          queryKey: ["/api/analytics/dashboard"],
        });
      }
      
      // Bills updates - refresh bills data for operating expenses
      if (lastNotification.type === "bills:updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/shop/bills"] });
      }
    }
  }, [lastNotification]);

  const { data: dashboardData, isLoading: dashboardLoading } =
    useQuery<DashboardData>({
      queryKey: ["/api/analytics/dashboard"],
      refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time updates
      staleTime: 0, // Ensure instant updates
    });

  const { data: salesData, isLoading: salesLoading } = useQuery<
    SalesChartData[]
  >({
    queryKey: ["/api/analytics/sales"],
    staleTime: 0, // Ensure instant updates
  });

  const { toast } = useToast();

  const { data: todaysDeliveries = [] } = useQuery<MealSubscription[]>({
    queryKey: ["/api/meal-subscriptions/today"],
    enabled: businessType === 'restaurant',
    staleTime: 0,
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

  const getMealTimeLabel = (mealTime: string) => {
    const labels: Record<string, string> = { breakfast: t.breakfast || 'Breakfast', lunch: t.lunch || 'Lunch', dinner: t.dinner || 'Dinner' };
    return labels[mealTime] || mealTime;
  };

  const formatTime12h = (time24: string): string => {
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${ampm}`;
  };

  const getDeliveryHour = (sub: MealSubscription, mealTime: string): string | null => {
    const hours = sub.deliveryHours && typeof sub.deliveryHours === 'object' && !Array.isArray(sub.deliveryHours)
      ? sub.deliveryHours as Record<string, string>
      : {};
    return hours[mealTime] || null;
  };

  const parseMealSelections = (selections: unknown): { name: string; menuItemId?: string }[] => {
    if (Array.isArray(selections)) return selections;
    if (typeof selections === 'string') { try { const p = JSON.parse(selections); if (Array.isArray(p)) return p; if (typeof p === 'object' && p !== null) { const all: { name: string; menuItemId?: string }[] = []; for (const vals of Object.values(p)) { if (Array.isArray(vals)) { for (const item of vals as any[]) { if (typeof item === 'object' && item !== null && typeof item.name === 'string') all.push(item); } } } return all; } return []; } catch { return []; } }
    if (typeof selections === 'object' && selections !== null) {
      const all: { name: string; menuItemId?: string }[] = [];
      for (const vals of Object.values(selections as Record<string, unknown>)) {
        if (Array.isArray(vals)) {
          for (const item of vals) {
            if (typeof item === 'object' && item !== null && typeof (item as any).name === 'string') all.push(item as { name: string; menuItemId?: string });
          }
        }
      }
      return all;
    }
    return [];
  };

  const markDeliveredMutation = useMutation({
    mutationFn: async ({ id, mealTime }: { id: string; mealTime: string }) => {
      return apiRequest("POST", `/api/meal-subscriptions/${id}/mark-delivered`, { mealTime });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-subscriptions"] });
      toast({ title: t.delivered });
      const sub = todaysDeliveries.find(s => s.id === variables.id);
      if (sub) {
        const pdfUrl = `${window.location.origin}/api/meal-subscriptions/${sub.id}/schedule-pdf`;
        const mtLabel = getMealTimeLabel(variables.mealTime);
        import("@/lib/whatsapp").then(({ openWhatsAppWithMessage }) => {
          const message = `*${t.mealSubscriptions || "Meal Subscriptions"}*\n\n${sub.subscriberName},\n\n✓ ${mtLabel} ${t.delivered}\n\n${pdfUrl}`;
          openWhatsAppWithMessage(sub.subscriberPhone, message);
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    queryFn: async () => {
      const response = await fetch("/api/shop/bills?includeArchived=false");
      if (!response.ok) throw new Error(t.failedToFetchBills);
      return response.json();
    },
    staleTime: 0, // Ensure instant updates
  });

  // Filter out foundational and one-time bills from operating expenses (only recurring costs)
  // Note: paymentPeriod can be 'one-time' or 'oneTime' depending on when data was created
  // Use explicit String() conversion to handle any type issues
  const operatingBills = bills.filter((bill) => {
    const billType = String(bill.billType || "").toLowerCase();
    const paymentPeriod = String(bill.paymentPeriod || "").toLowerCase();
    return (
      billType !== "foundational" &&
      paymentPeriod !== "one-time" &&
      paymentPeriod !== "onetime"
    );
  });

  // Helper function to prorate bill amounts to monthly values
  // quarterly÷3, semi-annual÷6, yearly÷12, weekly×4.33
  // Handles all known variants: case-insensitive, hyphenated, spaced, and compound forms
  const getMonthlyAmount = (
    paymentPeriod: string | null | undefined,
    amount: number,
  ): number => {
    if (!paymentPeriod || amount === 0) return amount;
    const period = paymentPeriod.toLowerCase().replace(/[\s-]/g, ""); // normalize: remove spaces/hyphens
    switch (period) {
      case "weekly":
        return amount * 4.33;
      case "monthly":
        return amount;
      case "quarterly":
        return amount / 3;
      case "semiannual":
      case "biannual":
        return amount / 6;
      case "yearly":
      case "annual":
      case "annually":
        return amount / 12;
      default:
        return amount;
    }
  };

  // Calculate monthly expense trends (last 6 months) - excluding foundational bills
  // Uses prorated monthly amounts for consistent comparison
  const monthlyExpensesMap = operatingBills.reduce(
    (acc, bill) => {
      const billDate = new Date(bill.paymentDate);
      const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { date: billDate, amount: 0 };
      }
      const rawAmount = parseFloat(bill.amount || "0");
      const monthlyAmount = getMonthlyAmount(bill.paymentPeriod, rawAmount);
      acc[monthKey].amount += monthlyAmount;
      return acc;
    },
    {} as Record<string, { date: Date; amount: number }>,
  );

  const expenseTrendData = Object.entries(monthlyExpensesMap)
    .map(([key, value]) => ({
      month: value.date.toLocaleDateString("default", {
        month: "short",
        year: "numeric",
      }),
      expenses: value.amount,
      sortKey: key,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)
    .map(({ month, expenses }) => ({ month, expenses }));

  // Operating expenses = recurring bills (prorated to monthly) + COGS (Cost of Goods Sold from completed orders)
  const recurringBillsTotal = operatingBills.reduce((sum, bill) => {
    const rawAmount = parseFloat(bill.amount || "0");
    return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
  }, 0);
  const totalExpenses = recurringBillsTotal + (dashboardData?.cogsTotal || 0);
  const pendingExpenses = operatingBills
    .filter((b) => b.status === "pending")
    .reduce((sum, bill) => {
      const rawAmount = parseFloat(bill.amount || "0");
      return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
    }, 0);

  if (dashboardLoading || salesLoading || billsLoading) {
    return (
      <div className={`${layout.padding} ${layout.spaceY}`}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>{t.dashboard}</h1>
          <p className="text-muted-foreground">{t.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div>
        <h1
          className={`${layout.text3Xl} font-bold mb-2 text-[#ffffff] flex items-center gap-2`}
        >
          {t.dashboard}
          {isConnected && (
            <Badge
              variant="outline"
              className="text-xs bg-green-500/10 text-green-600"
            >
              <RefreshCw
                className="h-3 w-3 mr-1 animate-spin"
                style={{ animationDuration: "3s" }}
              />
              Live
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground text-sm">
          {businessType === 'real_estate' ? (t as any).brokerageOverview : (t.dashboardOverview || "Overview of your restaurant performance")}
        </p>
      </div>
      <div
        className={`grid ${layout.gap} ${layout.gridCols({ desktop: 3, mobile: 2 })}`}
      >
        <MetricCard
          title={t.todaysSales}
          value={`${dashboardData?.todaysSales || "0.00"} SAR`}
          icon={DollarSign}
        />
        {businessType !== 'real_estate' && (
          <MetricCard
            title={t.activeOrders}
            value={dashboardData?.activeOrders || 0}
            icon={ShoppingCart}
          />
        )}
        {businessType !== 'real_estate' && (
          <MetricCard
            title={t.lowStockItems}
            value={dashboardData?.lowStockItems || 0}
            icon={Package}
          />
        )}
      </div>

      {/* Performance Analysis Section */}
      {dashboardData?.performance && (
        <div className="space-y-4">
          <div>
            <h2 className={`${layout.text2Xl} font-bold mb-1`}>
              {t.performanceAnalysis || "Performance Analysis"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t.performanceAnalysisDesc ||
                "Compare sales across different time periods"}
            </p>
          </div>
          <div
            className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, mobile: 2 })}`}
          >
            <PerformanceCard
              title={t.dod || "Day-over-Day (DoD)"}
              metric={dashboardData.performance.dod}
              icon={Calendar}
            />
            <PerformanceCard
              title={t.wow || "Week-over-Week (WoW)"}
              metric={dashboardData.performance.wow}
              icon={CalendarDays}
            />
            <PerformanceCard
              title={t.mom || "Month-over-Month (MoM)"}
              metric={dashboardData.performance.mom}
              icon={CalendarDays}
            />
            <PerformanceCard
              title={t.yoy || "Year-over-Year (YoY)"}
              metric={dashboardData.performance.yoy}
              icon={CalendarDays}
            />
          </div>
        </div>
      )}

      {/* Peak Hours Analysis Section */}
      {dashboardData?.peakHours && (
        <PeakHoursCard peakHours={dashboardData.peakHours} />
      )}

      {/* Expense Trends Section */}
      <Card className="hover-elevate transition-all">
        <CardHeader className={layout.isMobile ? "p-4" : ""}>
          <div
            className={`flex items-center ${layout.isMobile ? "flex-col gap-3" : "justify-between"}`}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className={layout.isMobile ? "text-base" : ""}>
                  {t.operatingExpenses}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t.expenseTrendsAndSummary}
                </CardDescription>
              </div>
            </div>
            <div
              className={layout.isMobile ? "text-center w-full" : "text-right"}
            >
              <p
                className={`${layout.text2Xl} font-bold font-mono text-orange-600`}
              >
                {totalExpenses.toFixed(2)} SAR
              </p>
              <p className="text-xs text-muted-foreground">
                {t.pending}:{" "}
                <span className="font-mono">
                  {pendingExpenses.toFixed(2)} SAR
                </span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className={layout.isMobile ? "p-3" : ""}>
          {expenseTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <BarChart data={expenseTrendData}>
                <CartesianGrid
                  {...chartConfig.cartesianGrid}
                  className="stroke-border"
                />
                <XAxis
                  dataKey="month"
                  style={{ fontSize: chartConfig.fontSize }}
                  tick={{ fontSize: chartConfig.fontSize }}
                />
                <YAxis
                  style={{ fontSize: chartConfig.fontSize }}
                  tick={{ fontSize: chartConfig.fontSize }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} SAR`}
                />
                <Bar
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  name={t.expenses}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noExpenseData}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {businessType === 'restaurant' && todaysDeliveries.length > 0 && (
        <Card>
          <CardHeader className={`${layout.cardHeaderPadding} flex flex-row items-center justify-between gap-2`}>
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-orange-500/10 p-2">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className={layout.isMobile ? "text-base" : ""}>
                  {t.todaysDeliveries}
                </CardTitle>
                <CardDescription>
                  {todaysDeliveries.reduce((count, sub) => {
                    const mealTimes = sub.mealTime.split(",").map((mt) => mt.trim());
                    return count + mealTimes.filter((mt) => !isMealDeliveredToday(sub, mt)).length;
                  }, 0)} {t.pending || 'pending'} / {todaysDeliveries.reduce((count, sub) => count + sub.mealTime.split(",").length, 0)} {t.total || 'total'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={layout.cardPadding}>
            <div className="space-y-3">
              {todaysDeliveries.map((sub) => {
                const mealTimes = sub.mealTime.split(",").map((mt) => mt.trim());
                const selections = parseMealSelections(sub.mealSelections);
                const allDone = mealTimes.every((mt) => isMealDeliveredToday(sub, mt));
                return (
                  <div key={sub.id} className={`rounded-md border p-3 space-y-2 ${allDone ? "opacity-50" : ""}`} data-testid={`dashboard-delivery-${sub.id}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold truncate">{sub.subscriberName}</span>
                        {allDone && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs shrink-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t.allDelivered}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{sub.subscriberPhone}</span>
                        {sub.deliveryAddress && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="truncate max-w-[120px]">{sub.deliveryAddress}</span></span>}
                      </div>
                    </div>
                    {selections.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selections.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{item.name}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {mealTimes.map((mt) => {
                        const done = isMealDeliveredToday(sub, mt);
                        const doneTime = getDeliveredTime(sub, mt);
                        const scheduledHour = getDeliveryHour(sub, mt);
                        const hourLabel = scheduledHour ? formatTime12h(scheduledHour) : null;
                        return (
                          <div key={mt} className="flex items-center gap-1">
                            {done ? (
                              <Badge variant="default" className="bg-green-600 text-white text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {getMealTimeLabel(mt)} {doneTime && `(${doneTime})`}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => markDeliveredMutation.mutate({ id: sub.id, mealTime: mt })}
                                disabled={markDeliveredMutation.isPending}
                                data-testid={`dashboard-deliver-${sub.id}-${mt}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {getMealTimeLabel(mt)}{hourLabel && ` (${hourLabel})`}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div
        className={`grid ${layout.gap} ${layout.gridCols({ desktop: 2, mobile: 1 })}`}
      >
        <Card>
          <CardHeader className={layout.cardHeaderPadding}>
            <CardTitle className={layout.isMobile ? "text-base" : ""}>
              {t.salesThisWeek}
            </CardTitle>
          </CardHeader>
          <CardContent className={layout.cardPadding}>
            <ResponsiveContainer width="100%" height={layout.chartHeight}>
              <LineChart data={salesData || []}>
                <CartesianGrid
                  {...chartConfig.cartesianGrid}
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: chartConfig.fontSize }}
                  tick={{ fontSize: chartConfig.fontSize }}
                />
                <YAxis
                  style={{ fontSize: chartConfig.fontSize }}
                  tick={{ fontSize: chartConfig.fontSize }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {businessType !== 'real_estate' && (
          <Card>
            <CardHeader className={layout.cardHeaderPadding}>
              <CardTitle className={layout.isMobile ? "text-base" : ""}>
                {t.recentOrders}
              </CardTitle>
            </CardHeader>
            <CardContent className={layout.cardPadding}>
              <div className={layout.isMobile ? "space-y-2" : "space-y-4"}>
                {dashboardData?.recentOrders?.map((order) => (
                  <div
                    key={order.id}
                    className={`flex items-center justify-between hover-elevate ${layout.isMobile ? "p-2" : "p-3"} rounded-md`}
                  >
                    <div className="flex-1">
                      <p
                        className={`font-mono font-semibold ${layout.isMobile ? "text-sm" : ""}`}
                      >
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()} •{" "}
                        {order.items.length} {t.items}
                      </p>
                    </div>
                    <div
                      className={`text-right ${layout.isMobile ? "mr-2" : "mr-4"}`}
                    >
                      <p
                        className={`font-mono font-semibold ${layout.isMobile ? "text-sm" : ""}`}
                      >
                        {parseFloat(order.total).toFixed(2)} SAR
                      </p>
                      <p
                        className={`text-xs ${
                          order.status === "Completed" ||
                          order.status === "Delivered"
                            ? "text-green-600"
                            : order.status === "Ready"
                              ? "text-blue-600"
                              : "text-orange-600"
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
