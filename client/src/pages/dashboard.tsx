import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, CalendarDays } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface PerformanceMetric {
  current: number;
  previous: number;
  change: number;
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

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesChartData[]>({
    queryKey: ["/api/analytics/sales"],
  });

  if (dashboardLoading || salesLoading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.dashboard}</h1>
          <p className="text-muted-foreground">{t.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[#ffffff]">{t.dashboard}</h1>
        <p className="text-muted-foreground">{t.dashboardOverview || "Overview of your restaurant performance"}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
