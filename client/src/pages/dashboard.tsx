import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { date: "Mon", sales: 4200 },
  { date: "Tue", sales: 3800 },
  { date: "Wed", sales: 5100 },
  { date: "Thu", sales: 4600 },
  { date: "Fri", sales: 6800 },
  { date: "Sat", sales: 7200 },
  { date: "Sun", sales: 5900 },
];

const topItems = [
  { name: "Margherita Pizza", sold: 45, revenue: "2,250 SAR" },
  { name: "Chicken Shawarma", sold: 38, revenue: "1,520 SAR" },
  { name: "Beef Burger", sold: 32, revenue: "1,920 SAR" },
  { name: "Caesar Salad", sold: 28, revenue: "1,120 SAR" },
];

const lowStockItems = [
  { name: "Tomatoes", quantity: 5, unit: "kg" },
  { name: "Mozzarella Cheese", quantity: 3, unit: "kg" },
  { name: "Chicken Breast", quantity: 8, unit: "kg" },
];

const recentOrders = [
  { id: "#12847", time: "2 min ago", items: 3, total: "145 SAR", status: "Preparing" },
  { id: "#12846", time: "5 min ago", items: 2, total: "89 SAR", status: "Ready" },
  { id: "#12845", time: "8 min ago", items: 5, total: "234 SAR", status: "Delivered" },
  { id: "#12844", time: "12 min ago", items: 1, total: "45 SAR", status: "Delivered" },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value="6,850 SAR"
          icon={DollarSign}
          trend={{ value: 12.5, direction: "up" }}
        />
        <MetricCard
          title="Active Orders"
          value={23}
          icon={ShoppingCart}
          trend={{ value: 8.2, direction: "up" }}
        />
        <MetricCard
          title="Low Stock Items"
          value={7}
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
              <LineChart data={salesData}>
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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between hover-elevate p-3 rounded-md">
                  <div className="flex-1">
                    <p className="font-mono font-semibold">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.time} • {order.items} items</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-mono font-semibold">{order.total}</p>
                    <p className={`text-xs ${
                      order.status === "Delivered" ? "text-green-600" :
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.sold} sold</p>
                  </div>
                  <p className="font-mono font-semibold">{item.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Inventory Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-900 rounded-md bg-orange-50 dark:bg-orange-950/20">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Low stock alert</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-orange-600">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-muted-foreground">remaining</p>
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
