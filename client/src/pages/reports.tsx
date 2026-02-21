import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const salesByBranch = [
  { branch: "Main - Riyadh", sales: 45200 },
  { branch: "Al Khobar", sales: 32800 },
  { branch: "Jeddah", sales: 38500 },
];

const topSellers = [
  { name: "Margherita Pizza", sold: 245 },
  { name: "Chicken Shawarma", sold: 198 },
  { name: "Beef Burger", sold: 176 },
  { name: "Caesar Salad", sold: 152 },
  { name: "Pepperoni Pizza", sold: 143 },
];

const worstSellers = [
  { name: "Seafood Pasta", sold: 12 },
  { name: "Lamb Chops", sold: 18 },
  { name: "Vegan Bowl", sold: 22 },
  { name: "Fish & Chips", sold: 27 },
];

const inventoryByCategory = [
  { name: "Vegetables", value: 35 },
  { name: "Meat", value: 28 },
  { name: "Dairy", value: 18 },
  { name: "Grains", value: 12 },
  { name: "Others", value: 7 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Reports() {
  const { t } = useLanguage();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{(t as any).reports || "Reports"}</h1>
          <p className="text-muted-foreground">{(t as any).comprehensiveReports || "Comprehensive business reports and analytics"}</p>
        </div>
        <Button data-testid="button-export-reports">
          <Download className="h-4 w-4 mr-2" />
          {(t as any).exportAllReports || "Export All Reports"}
        </Button>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList data-testid="tabs-reports">
          <TabsTrigger value="sales" data-testid="tab-sales">{(t as any).salesReports || "Sales Reports"}</TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">{(t as any).inventoryReports || "Inventory Reports"}</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">{t.performanceAnalysis}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalRevenue}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">116,500 SAR</p>
                <p className="text-sm text-muted-foreground mt-2">{(t as any).thisMonth || "This month"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalOrders}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">847</p>
                <p className="text-sm text-green-600 mt-2">{(t as any).plusFromLastMonth || "+15.3% from last month"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.avgOrderValue}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">138 SAR</p>
                <p className="text-sm text-muted-foreground mt-2">{(t as any).perOrder || "Per order"}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{(t as any).salesByBranch || "Sales by Branch"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByBranch}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="branch" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).inventoryDistributionByCategory || "Inventory Distribution by Category"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalItems}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">127</p>
                <p className="text-sm text-muted-foreground mt-2">{(t as any).inInventory || "In inventory"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.lowStockItems}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono text-orange-600">7</p>
                <p className="text-sm text-muted-foreground mt-2">{(t as any).needRestocking || "Need restocking"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{(t as any).inventoryValue || "Inventory Value"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-mono">28,450 SAR</p>
                <p className="text-sm text-muted-foreground mt-2">{(t as any).totalValue || "Total value"}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{(t as any).topPerformingItems || "Top Performing Items"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSellers.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="w-full bg-secondary rounded-full h-2 mt-1">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(item.sold / 245) * 100}%` }}
                          />
                        </div>
                      </div>
                      <p className="font-mono font-semibold">{item.sold}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{(t as any).underperformingItems || "Underperforming Items"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {worstSellers.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="w-full bg-secondary rounded-full h-2 mt-1">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${(item.sold / 27) * 100}%` }}
                          />
                        </div>
                      </div>
                      <p className="font-mono font-semibold">{item.sold}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
