import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, CalendarDays, Clock, User, Phone, CreditCard, Wallet } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Order, ShopBill } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useState } from "react";

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
  icon: Icon 
}: { 
  title: string; 
  metric: PerformanceMetric; 
  icon: React.ElementType;
}) => {
  const { t } = useLanguage();
  const isPositive = metric.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card className="hover-elevate transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPositive 
              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(metric.change).toFixed(1)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">{metric.current.toFixed(2)} SAR</p>
            <p className="text-xs text-muted-foreground">{t.currentPeriod}</p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {t.previous}: <span className="font-mono">{metric.previous.toFixed(2)} SAR</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PeakHoursCard = ({ 
  peakHours 
}: { 
  peakHours: { hourlyData: PeakHoursData[]; peakHour: number; peakSales: number }
}) => {
  const { t } = useLanguage();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: customerOrders, isLoading: ordersLoading, isError } = useQuery<HourlyCustomerOrder[]>({
    queryKey: [`/api/analytics/peak-hours/${selectedHour}`],
    enabled: selectedHour !== null,
  });
  
  const formatHour = (hour: number) => {
    if (hour === 0) return `12 ${t.am}`;
    if (hour === 12) return `12 ${t.pm}`;
    if (hour < 12) return `${hour} ${t.am}`;
    return `${hour - 12} ${t.pm}`;
  };

  const chartData = peakHours.hourlyData.map(d => ({
    hour: formatHour(d.hour),
    hourNumber: d.hour,
    sales: d.sales,
    isPeak: d.hour === peakHours.peakHour
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
                <p className="text-sm text-muted-foreground mt-1">{t.hourlySalesDistribution}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t.peakHour}</p>
              <p className="text-2xl font-bold">{formatHour(peakHours.peakHour)}</p>
              <p className="text-sm font-mono text-muted-foreground">{peakHours.peakSales.toFixed(2)} SAR</p>
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
                formatter={(value: number) => [`${value.toFixed(2)} SAR`, t.salesAmount]}
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
                    fill={entry.isPeak ? "hsl(var(--chart-1))" : "hsl(var(--primary))"}
                    opacity={entry.isPeak ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-customer-orders">
          <DialogHeader>
            <DialogTitle>
              {selectedHour !== null && `${t.customersAt} ${formatHour(selectedHour)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ordersLoading ? (
              <p className="text-center text-muted-foreground">{t.loading}...</p>
            ) : isError ? (
              <p className="text-center text-red-600 dark:text-red-400 py-8" data-testid="text-error">
                {t.error || "Error loading customer orders"}
              </p>
            ) : customerOrders && customerOrders.length > 0 ? (
              <div className="space-y-3">
                {customerOrders.map((order) => (
                  <Card key={order.transactionId} className="hover-elevate" data-testid={`card-order-${order.transactionId}`}>
                    <CardContent className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold" data-testid={`text-customer-${order.transactionId}`}>
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
                          <p className="text-2xl font-bold" data-testid={`text-total-${order.transactionId}`}>
                            {order.total.toFixed(2)} SAR
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.itemCount} {order.itemCount === 1 ? t.itemName : t.itemName + 's'}
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
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-customers">
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
  const { device } = useDevice();
  const isMobile = device === 'iphone';

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesChartData[]>({
    queryKey: ["/api/analytics/sales"],
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    queryFn: async () => {
      const response = await fetch("/api/shop/bills?includeArchived=false");
      if (!response.ok) throw new Error("Failed to fetch bills");
      return response.json();
    },
  });

  // Calculate monthly expense trends (last 6 months)
  const monthlyExpensesMap = bills.reduce((acc, bill) => {
    const billDate = new Date(bill.paymentDate);
    const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { date: billDate, amount: 0 };
    }
    acc[monthKey].amount += parseFloat(bill.amount || "0");
    return acc;
  }, {} as Record<string, { date: Date; amount: number }>);

  const expenseTrendData = Object.entries(monthlyExpensesMap)
    .map(([key, value]) => ({
      month: value.date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
      expenses: value.amount,
      sortKey: key
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)
    .map(({ month, expenses }) => ({ month, expenses }));

  const totalExpenses = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);
  const pendingExpenses = bills.filter(b => b.status === "pending").reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);

  if (dashboardLoading || salesLoading || billsLoading) {
    return (
      <div className={isMobile ? "p-4 space-y-4" : "p-8 space-y-8"}>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.dashboard}</h1>
          <p className="text-muted-foreground">{t.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "p-4 space-y-4" : "p-8 space-y-8"}>
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[#ffffff]">{t.dashboard}</h1>
        <p className="text-muted-foreground text-sm">{t.dashboardOverview || "Overview of your restaurant performance"}</p>
      </div>
      <div className={`grid gap-${isMobile ? '3' : '6'} ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <MetricCard
          title="Today's Sales"
          value={`${dashboardData?.todaysSales || "0.00"} SAR`}
          icon={DollarSign}
          trend={{ value: 12.5, direction: "up" }}
        />
        <MetricCard
          title="Active Orders"
          value={dashboardData?.activeOrders || 0}
          icon={ShoppingCart}
          trend={{ value: 8.2, direction: "up" }}
        />
        <MetricCard
          title="Low Stock Items"
          value={dashboardData?.lowStockItems || 0}
          icon={Package}
          trend={{ value: 3.1, direction: "down" }}
        />
        <MetricCard
          title="Pending Alerts"
          value={4}
          icon={AlertTriangle}
        />
      </div>

      {/* Performance Analysis Section */}
      {dashboardData?.performance && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t.performanceAnalysis || "Performance Analysis"}</h2>
            <p className="text-muted-foreground">{t.performanceAnalysisDesc || "Compare sales across different time periods"}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Operating Expenses</CardTitle>
                <CardDescription>Monthly expense trends and summary</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-orange-600">{totalExpenses.toFixed(2)} SAR</p>
              <p className="text-xs text-muted-foreground">
                Pending: <span className="font-mono">{pendingExpenses.toFixed(2)} SAR</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expenseTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expense data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between hover-elevate p-3 rounded-md">
                  <div className="flex-1">
                    <p className="font-mono font-semibold">#{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-mono font-semibold">{parseFloat(order.total).toFixed(2)} SAR</p>
                    <p className={`text-xs ${
                      order.status === "Completed" || order.status === "Delivered" ? "text-green-600" :
                      order.status === "Ready" ? "text-blue-600" :
                      "text-orange-600"
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
