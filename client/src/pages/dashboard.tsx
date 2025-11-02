import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

interface DashboardData {
  todaysSales: string;
  activeOrders: number;
  lowStockItems: number;
  recentOrders: Order[];
}

interface SalesChartData {
  date: string;
  sales: number;
}

export default function Dashboard() {
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
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant performance</p>
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
