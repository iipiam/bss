import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, Package, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { MenuItem, Recipe, Order } from "@shared/schema";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Profitability() {
  const [period, setPeriod] = useState<string>("month");

  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const isLoading = isLoadingMenu || isLoadingRecipes || isLoadingOrders;

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return orders.filter((order) => new Date(order.createdAt) >= cutoffDate);
  }, [orders, period]);

  // Calculate profit metrics using basePrice (pre-VAT)
  const profitabilityData = useMemo(() => {
    const itemProfitability = menuItems.map((item) => {
      const recipe = recipes.find((r) => r.menuItemId === item.id);
      const cost = recipe ? parseFloat(recipe.cost) : 0;
      // Use basePrice (pre-VAT) for accurate profit calculation
      const basePrice = parseFloat(item.basePrice);
      const profit = basePrice - cost;
      const margin = basePrice > 0 ? (profit / basePrice) * 100 : 0;

      // Calculate sales volume from filtered orders
      const itemSales = filteredOrders.filter((order) =>
        order.items?.some((orderItem: any) => orderItem.id === item.id)
      );
      
      const salesVolume = itemSales.reduce((sum, order) => {
        const orderItem = order.items?.find((oi: any) => oi.id === item.id);
        return sum + (orderItem?.quantity || 0);
      }, 0);

      const totalRevenue = salesVolume * basePrice;
      const totalProfit = salesVolume * profit;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        basePrice,
        cost,
        profit,
        margin,
        salesVolume,
        totalRevenue,
        totalProfit,
      };
    });

    return itemProfitability;
  }, [menuItems, recipes, filteredOrders]);

  // Overall metrics
  const totalRevenue = profitabilityData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalCost = profitabilityData.reduce((sum, item) => sum + (item.cost * item.salesVolume), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Top performers
  const topByProfit = [...profitabilityData]
    .filter((item) => item.salesVolume > 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5);

  const topByMargin = [...profitabilityData]
    .filter((item) => item.salesVolume > 0)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  const lowPerformers = [...profitabilityData]
    .filter((item) => item.salesVolume > 0)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);

  // Category profitability
  const categoryData = profitabilityData.reduce((acc, item) => {
    const existing = acc.find((c) => c.category === item.category);
    if (existing) {
      existing.revenue += item.totalRevenue;
      existing.profit += item.totalProfit;
    } else {
      acc.push({
        category: item.category,
        revenue: item.totalRevenue,
        profit: item.totalProfit,
      });
    }
    return acc;
  }, [] as Array<{ category: string; revenue: number; profit: number }>);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profitability Analysis</h1>
          <p className="text-muted-foreground">
            Analyze profit margins, costs, and revenue by item and category (pre-VAT)
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalRevenue.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">From {profitabilityData.reduce((sum, i) => sum + i.salesVolume, 0)} items sold</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-profit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-500">
              {totalProfit.toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground">After recipe costs</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-margin">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all items</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-cost">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-500">
              {totalCost.toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground">Recipe ingredient costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Items by Profit */}
        <Card data-testid="card-top-profit">
          <CardHeader>
            <CardTitle>Top Items by Profit</CardTitle>
            <CardDescription>Highest profit-generating menu items</CardDescription>
          </CardHeader>
          <CardContent>
            {topByProfit.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topByProfit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
                  <Bar dataKey="totalProfit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items by Margin */}
        <Card data-testid="card-top-margin">
          <CardHeader>
            <CardTitle>Top Items by Margin</CardTitle>
            <CardDescription>Highest profit margin percentages</CardDescription>
          </CardHeader>
          <CardContent>
            {topByMargin.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topByMargin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="margin" fill="#3b82f6" name="Margin %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card data-testid="card-category-profit">
          <CardHeader>
            <CardTitle>Profit by Category</CardTitle>
            <CardDescription>Revenue and profit distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 && categoryData.some(c => c.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData.filter(c => c.revenue > 0)}
                    dataKey="profit"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category}: ${entry.profit.toFixed(0)} SAR`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No category data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Performers */}
        <Card data-testid="card-low-margin">
          <CardHeader>
            <CardTitle>Low Margin Items</CardTitle>
            <CardDescription>Items with lowest profit margins</CardDescription>
          </CardHeader>
          <CardContent>
            {lowPerformers.length > 0 ? (
              <div className="space-y-3">
                {lowPerformers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`low-margin-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="font-mono font-semibold text-red-600 dark:text-red-500">
                          {item.margin.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.profit.toFixed(2)} SAR profit/item
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No low-margin items found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card data-testid="card-detailed-table">
        <CardHeader>
          <CardTitle>All Items Profitability</CardTitle>
          <CardDescription>Complete breakdown of all menu items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Item</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-right font-medium">Price</th>
                  <th className="p-3 text-right font-medium">Cost</th>
                  <th className="p-3 text-right font-medium">Profit/Unit</th>
                  <th className="p-3 text-right font-medium">Margin %</th>
                  <th className="p-3 text-right font-medium">Sales Vol.</th>
                  <th className="p-3 text-right font-medium">Total Profit</th>
                </tr>
              </thead>
              <tbody>
                {profitabilityData
                  .sort((a, b) => b.totalProfit - a.totalProfit)
                  .map((item) => (
                    <tr key={item.id} className="border-b" data-testid={`row-profit-${item.id}`}>
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.category}</td>
                      <td className="p-3 text-right font-mono">{item.basePrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-red-600 dark:text-red-500">
                        {item.cost.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-green-600 dark:text-green-500">
                        {item.profit.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span
                          className={
                            item.margin > 50
                              ? "text-green-600 dark:text-green-500"
                              : item.margin > 30
                              ? "text-blue-600 dark:text-blue-500"
                              : "text-red-600 dark:text-red-500"
                          }
                        >
                          {item.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{item.salesVolume}</td>
                      <td className="p-3 text-right font-mono font-semibold text-green-600 dark:text-green-500">
                        {item.totalProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
