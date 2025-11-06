import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ShoppingBag, Truck, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

export default function SalesComparison() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/sales-comparison"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const { summary = {}, dineIn = {}, takeAway = {}, deliveryApps = {} } = data || {};

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Prepare chart data
  const orderCountData = [
    {
      name: "Dine-In",
      orders: dineIn.totalOrders || 0,
      revenue: dineIn.totalRevenue || 0,
    },
    {
      name: "Take-Away",
      orders: takeAway.totalOrders || 0,
      revenue: takeAway.totalRevenue || 0,
    },
    {
      name: "Delivery Apps",
      orders: deliveryApps.totalOrders || 0,
      revenue: deliveryApps.totalRevenue || 0,
    },
  ];

  const pieChartData = [
    { name: "Dine-In", value: dineIn.totalRevenue || 0 },
    { name: "Take-Away", value: takeAway.totalRevenue || 0 },
    { name: "Delivery Apps", value: deliveryApps.totalRevenue || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Comparison Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Compare performance across dine-in, take-away, and delivery app orders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All order types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRevenue?.toFixed(2) || "0.00"} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dine-In</CardTitle>
            <Store className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dineIn.percentage?.toFixed(1) || "0.0"}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dineIn.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Delivery Apps</CardTitle>
            <Truck className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{deliveryApps.percentage?.toFixed(1) || "0.0"}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {deliveryApps.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle>Dine-In</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{dineIn.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{dineIn.percentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">{dineIn.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{dineIn.revenuePercentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-lg font-semibold">{dineIn.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle>Take-Away</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{takeAway.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{takeAway.percentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">{takeAway.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{takeAway.revenuePercentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-lg font-semibold">{takeAway.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle>Delivery Apps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{deliveryApps.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{deliveryApps.percentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">{deliveryApps.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{deliveryApps.revenuePercentage?.toFixed(1) || "0.0"}% of total</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-lg font-semibold">{deliveryApps.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders and Revenue Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Orders & Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" name="Orders" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue (SAR)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / summary.totalRevenue) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Delivery App Breakdown */}
      {deliveryApps.breakdown && deliveryApps.breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery App Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-sm font-medium text-left p-2">App Name</th>
                    <th className="text-sm font-medium text-right p-2">Orders</th>
                    <th className="text-sm font-medium text-right p-2">Revenue (SAR)</th>
                    <th className="text-sm font-medium text-right p-2">Avg. Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryApps.breakdown.map((app: any) => (
                    <tr key={app.appId} className="border-b hover-elevate" data-testid={`row-app-${app.appId}`}>
                      <td className="text-sm p-2 font-medium">{app.appName}</td>
                      <td className="text-sm p-2 text-right">{app.totalOrders}</td>
                      <td className="text-sm p-2 text-right">{app.totalRevenue.toFixed(2)}</td>
                      <td className="text-sm p-2 text-right">{app.avgOrderValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
