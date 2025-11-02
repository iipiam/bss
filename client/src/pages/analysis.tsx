import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Clock } from "lucide-react";

const profitMargins = [
  { category: "Pizza", revenue: 45200, cost: 18800, margin: 58.4 },
  { category: "Burgers", revenue: 32100, cost: 15700, margin: 51.1 },
  { category: "Sandwiches", revenue: 28500, cost: 13200, margin: 53.7 },
  { category: "Salads", revenue: 18900, cost: 7600, margin: 59.8 },
  { category: "Main Course", revenue: 24800, cost: 14900, margin: 39.9 },
];

const costBreakdown = [
  { category: "Food Costs", amount: 42500, percentage: 36.5, trend: "down", change: 2.3 },
  { category: "Labor Costs", amount: 35200, percentage: 30.2, trend: "up", change: 1.8 },
  { category: "Utilities", amount: 8900, percentage: 7.6, trend: "stable", change: 0.2 },
  { category: "Rent", amount: 15000, percentage: 12.9, trend: "stable", change: 0 },
  { category: "Marketing", amount: 6800, percentage: 5.8, trend: "up", change: 3.5 },
  { category: "Other", amount: 8100, percentage: 7.0, trend: "down", change: 1.2 },
];

const branchPerformance = [
  { name: "Main Branch - Riyadh", revenue: 45200, orders: 342, avgOrder: 132, efficiency: 92 },
  { name: "Al Khobar Branch", revenue: 32800, orders: 258, avgOrder: 127, efficiency: 88 },
  { name: "Jeddah Branch", revenue: 38500, orders: 295, avgOrder: 130, efficiency: 90 },
];

export default function Analysis() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Business Analysis</h1>
        <p className="text-muted-foreground">Detailed insights into business performance and costs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">116,500 SAR</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">70,200 SAR</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -2.3% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-green-600">46,300 SAR</p>
            <p className="text-xs text-muted-foreground mt-1">39.7% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency Score</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">90%</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +3.2% this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profit" data-testid="tab-profit">Profit Analysis</TabsTrigger>
          <TabsTrigger value="costs" data-testid="tab-costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="branches" data-testid="tab-branches">Branch Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margins by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {profitMargins.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{item.category}</p>
                        <div className="flex gap-6 text-sm text-muted-foreground mt-1">
                          <span>Revenue: <span className="font-mono">{item.revenue.toLocaleString()} SAR</span></span>
                          <span>Cost: <span className="font-mono">{item.cost.toLocaleString()} SAR</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-mono text-green-600">{item.margin}%</p>
                        <p className="text-xs text-muted-foreground">margin</p>
                      </div>
                    </div>
                    <Progress value={item.margin} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Costs Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costBreakdown.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-md border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.percentage}% of total costs
                          {item.trend !== "stable" && (
                            <span className={`ml-2 ${item.trend === "down" ? "text-green-600" : "text-red-600"}`}>
                              {item.trend === "down" ? "↓" : "↑"} {item.change}%
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">{item.amount.toLocaleString()} SAR</p>
                    </div>
                    <Progress value={item.percentage * 1.5} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <div className="grid gap-6">
            {branchPerformance.map((branch, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{branch.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Efficiency:</span>
                      <span className="text-xl font-mono text-primary">{branch.efficiency}%</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                      <p className="text-2xl font-bold font-mono">{branch.revenue.toLocaleString()} SAR</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                      <p className="text-2xl font-bold font-mono">{branch.orders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg. Order Value</p>
                      <p className="text-2xl font-bold font-mono">{branch.avgOrder} SAR</p>
                    </div>
                  </div>
                  <Progress value={branch.efficiency} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
