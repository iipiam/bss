import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, DollarSign, Percent, Package, Calculator, AlertTriangle, Target, Scale, Scissors, Download, FileText, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { MenuItem, Recipe, Order, ShopBill, InventoryItem } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportToPDF } from "@/lib/exportUtils";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Profitability() {
  const [period, setPeriod] = useState<string>("month");
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const { data: bills = [], isLoading: isLoadingBills } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    queryFn: async () => {
      const response = await fetch("/api/shop/bills?includeArchived=false");
      if (!response.ok) throw new Error(t.failedToFetchBills);
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const isLoading = isLoadingMenu || isLoadingRecipes || isLoadingOrders || isLoadingBills || isLoadingInventory;

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
      // Find recipe linked to this menu item via menuItem.recipeId
      const recipe = item.recipeId ? recipes.find((r) => r.id === item.recipeId) : null;
      // Apply portion size multiplier to recipe cost (1.0=full, 0.5=half, 0.25=quarter, 0.75=three-quarter)
      const portionMultiplier = item.portionSize ? parseFloat(item.portionSize as string) : 1.0;
      
      // Calculate cost: recipe-based OR simple inventory item
      let cost = 0;
      if (recipe) {
        // Recipe-based item: use recipe cost × portion multiplier
        cost = parseFloat(recipe.cost) * portionMultiplier;
      } else if (item.inventoryItemId && Number(item.stockNo) > 0) {
        // Simple inventory item (like drinks): stockNo × inventory unit price
        const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId);
        if (inventoryItem) {
          // Use unitPrice directly (already calculated by API) or calculate from price/referenceQuantity
          let unitPrice = 0;
          if (inventoryItem.unitPrice) {
            unitPrice = parseFloat(inventoryItem.unitPrice.toString());
          } else if (inventoryItem.price) {
            const invPrice = parseFloat(inventoryItem.price.toString());
            const refQty = parseFloat((inventoryItem.referenceQuantity || "1").toString());
            unitPrice = refQty > 0 ? invPrice / refQty : invPrice;
          }
          cost = parseFloat(item.stockNo!.toString()) * unitPrice;
        }
      }
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
  }, [menuItems, recipes, filteredOrders, inventoryItems]);

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

  const handleExportPDF = () => {
    const periodLabel = period === "week" ? "This Week" : period === "month" ? "This Month" : period === "quarter" ? "This Quarter" : "This Year";
    
    const exportData = profitabilityData
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .map((item) => ({
        "Item": item.name,
        "Category": item.category,
        "Price (SAR)": item.basePrice.toFixed(2),
        "Cost (SAR)": item.cost.toFixed(2),
        "Profit/Unit (SAR)": item.profit.toFixed(2),
        "Margin %": item.margin.toFixed(1) + "%",
        "Sales Vol.": item.salesVolume,
        "Total Profit (SAR)": item.totalProfit.toFixed(2),
      }));

    const columns = [
      { header: "Item", accessor: "Item", width: 35 },
      { header: "Category", accessor: "Category", width: 25 },
      { header: "Price", accessor: "Price (SAR)", width: 20 },
      { header: "Cost", accessor: "Cost (SAR)", width: 20 },
      { header: "Profit/Unit", accessor: "Profit/Unit (SAR)", width: 22 },
      { header: "Margin %", accessor: "Margin %", width: 18 },
      { header: "Sales Vol.", accessor: "Sales Vol.", width: 18 },
      { header: "Total Profit", accessor: "Total Profit (SAR)", width: 22 },
    ];

    const totalSalesVolume = profitabilityData.reduce((sum, i) => sum + i.salesVolume, 0);
    const subtitle = `Period: ${periodLabel} | Total Revenue: ${totalRevenue.toFixed(2)} SAR | Total Profit: ${totalProfit.toFixed(2)} SAR | Avg Margin: ${avgMargin.toFixed(1)}% | Items Sold: ${totalSalesVolume}`;

    const result = exportToPDF("Profitability Analysis Report", exportData, columns, {
      subtitle,
      orientation: "landscape",
    });

    if (result.success) {
      toast({
        title: t.pdfExportSuccessful,
        description: "Profitability report exported to PDF",
      });
    } else {
      toast({
        title: t.exportFailed,
        description: "Failed to export profitability report to PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportStrategicPDF = () => {
    const periodLabel = period === "week" ? "This Week" : period === "month" ? "This Month" : period === "quarter" ? "This Quarter" : "This Year";
    
    const strategicData = [
      { section: "--- TOP PERFORMERS BY PROFIT ---", name: "", category: "", profit: "", margin: "" },
      ...topByProfit.map((item) => ({
        section: "",
        name: item.name,
        category: item.category,
        profit: item.totalProfit.toFixed(2) + " SAR",
        margin: item.margin.toFixed(1) + "%",
      })),
      { section: "--- TOP PERFORMERS BY MARGIN ---", name: "", category: "", profit: "", margin: "" },
      ...topByMargin.map((item) => ({
        section: "",
        name: item.name,
        category: item.category,
        profit: item.totalProfit.toFixed(2) + " SAR",
        margin: item.margin.toFixed(1) + "%",
      })),
      { section: "--- CATEGORY BREAKDOWN ---", name: "", category: "", profit: "", margin: "" },
      ...categoryData.filter(c => c.revenue > 0).map((cat) => ({
        section: "",
        name: cat.category,
        category: "-",
        profit: cat.profit.toFixed(2) + " SAR",
        margin: cat.revenue > 0 ? ((cat.profit / cat.revenue) * 100).toFixed(1) + "%" : "N/A",
      })),
      { section: "--- LOW MARGIN ITEMS (ATTENTION NEEDED) ---", name: "", category: "", profit: "", margin: "" },
      ...lowPerformers.map((item) => ({
        section: "",
        name: item.name,
        category: item.category,
        profit: item.profit.toFixed(2) + " SAR/unit",
        margin: item.margin.toFixed(1) + "%",
      })),
    ];

    const columns = [
      { header: "Section", accessor: "section", width: 60 },
      { header: "Item/Category", accessor: "name", width: 45 },
      { header: "Category", accessor: "category", width: 30 },
      { header: "Profit", accessor: "profit", width: 30 },
      { header: "Margin", accessor: "margin", width: 25 },
    ];

    const totalSalesVolume = profitabilityData.reduce((sum, i) => sum + i.salesVolume, 0);
    const subtitle = `Strategic Overview | Period: ${periodLabel} | Revenue: ${totalRevenue.toFixed(2)} SAR | Profit: ${totalProfit.toFixed(2)} SAR | Avg Margin: ${avgMargin.toFixed(1)}%`;

    const result = exportToPDF("Strategic Overview Report", strategicData, columns, {
      subtitle,
      orientation: "portrait",
    });

    if (result.success) {
      toast({
        title: t.pdfExportSuccessful,
        description: "Strategic overview exported to PDF",
      });
    } else {
      toast({
        title: t.exportFailed,
        description: "Failed to export strategic overview to PDF",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/profitability?period=${period}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profitability-${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t.pdfExportSuccessful,
        description: "Profitability data exported to Excel",
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportProfitability,
        variant: "destructive",
      });
    }
  };

  const handleSyncCosts = async () => {
    // Debug: log inventory and menu items with inventory links
    console.log("=== SYNC COSTS DEBUG ===");
    console.log("Inventory Items count:", inventoryItems.length);
    console.log("Menu Items count:", menuItems.length);
    
    // Find menu items with inventory links
    const linkedItems = menuItems.filter((m) => m.inventoryItemId);
    console.log("Menu items with inventoryItemId:", linkedItems.length);
    linkedItems.forEach((item) => {
      const inv = inventoryItems.find((i) => i.id === item.inventoryItemId);
      console.log(`- ${item.name}: inventoryItemId=${item.inventoryItemId}, stockNo=${item.stockNo}`);
      if (inv) {
        console.log(`  -> Found inventory: ${inv.name}, unitPrice=${inv.unitPrice}, price=${inv.price}, refQty=${inv.referenceQuantity}`);
      } else {
        console.log(`  -> NO MATCHING INVENTORY FOUND!`);
      }
    });
    
    // Refresh all queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] }),
    ]);
    
    toast({
      title: "Costs Synced",
      description: "Menu and inventory data refreshed. Check browser console for debug info.",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profitability Analysis</h1>
          <p className="text-muted-foreground">
            Analyze profit margins, costs, and revenue by item and category (pre-VAT)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncCosts} data-testid="button-sync-costs">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Costs
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
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
        <Tabs defaultValue="strategic" className="space-y-6" data-testid="tabs-profitability">
          <TabsList>
            <TabsTrigger value="strategic" data-testid="tab-strategic">
              <Target className="h-4 w-4 mr-2" />
              Strategic Overview
            </TabsTrigger>
            <TabsTrigger value="pricing" data-testid="tab-pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing Analysis
            </TabsTrigger>
            <TabsTrigger value="scaling" data-testid="tab-scaling">
              <Scale className="h-4 w-4 mr-2" />
              Scaling Viability
            </TabsTrigger>
            <TabsTrigger value="cost-management" data-testid="tab-cost">
              <Scissors className="h-4 w-4 mr-2" />
              Cost Management
            </TabsTrigger>
          </TabsList>

          {/* Strategic Decision-Making Tab */}
          <TabsContent value="strategic" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={handleExportStrategicPDF} data-testid="button-export-strategic-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
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
          </TabsContent>

          {/* Pricing Analysis Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <PricingAnalysisTab profitabilityData={profitabilityData} />
          </TabsContent>

          {/* Scaling Viability Tab */}
          <TabsContent value="scaling" className="space-y-6">
            <ScalingAnalysisTab profitabilityData={profitabilityData} totalRevenue={totalRevenue} totalProfit={totalProfit} />
          </TabsContent>

          {/* Cost Management Tab */}
          <TabsContent value="cost-management" className="space-y-6">
            <CostManagementTab 
              profitabilityData={profitabilityData} 
              bills={bills.filter((bill) => {
                const billDate = new Date(bill.paymentDate);
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
                
                // Filter by date and exclude foundational/one-time bills (consistent with Dashboard)
                const billType = String(bill.billType || '').toLowerCase();
                const paymentPeriod = String(bill.paymentPeriod || '').toLowerCase();
                const isRecurring = billType !== 'foundational' && 
                                   paymentPeriod !== 'one-time' && 
                                   paymentPeriod !== 'onetime';
                
                return billDate >= cutoffDate && isRecurring;
              })}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Pricing Analysis Tab Component
function PricingAnalysisTab({ profitabilityData }: { profitabilityData: any[] }) {
  // Items below cost (negative margin)
  const belowCostItems = profitabilityData.filter(item => item.margin < 0);
  
  // Low margin items (0-20%)
  const lowMarginItems = profitabilityData.filter(item => item.margin >= 0 && item.margin < 20);
  
  // Healthy margin items (20-40%)
  const healthyMarginItems = profitabilityData.filter(item => item.margin >= 20 && item.margin < 40);
  
  // High margin items (40%+)
  const highMarginItems = profitabilityData.filter(item => item.margin >= 40);

  const handleExportPDF = () => {
    const allItems = [...belowCostItems, ...lowMarginItems, ...healthyMarginItems, ...highMarginItems]
      .map(item => ({
        ...item,
        category: item.margin < 0 ? 'Below Cost' : item.margin < 20 ? 'Low (0-20%)' : item.margin < 40 ? 'Healthy (20-40%)' : 'Premium (40%+)',
        suggestedPrice: (item.cost / 0.7).toFixed(2),
      }));
    
    exportToPDF("Pricing Analysis Report", allItems, [
      { header: "Item Name", accessor: "name", width: 60 },
      { header: "Category", accessor: "category", width: 35 },
      { header: "Price (SAR)", accessor: (row: any) => row.basePrice.toFixed(2), width: 30 },
      { header: "Cost (SAR)", accessor: (row: any) => row.cost.toFixed(2), width: 30 },
      { header: "Profit (SAR)", accessor: (row: any) => row.profit.toFixed(2), width: 30 },
      { header: "Margin %", accessor: (row: any) => row.margin.toFixed(1) + "%", width: 25 },
      { header: "Suggested Price", accessor: "suggestedPrice", width: 35 },
    ], { subtitle: `Items analyzed: ${allItems.length}` });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pricing-pdf">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Below Cost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{belowCostItems.length}</div>
            <p className="text-xs text-muted-foreground">Items losing money</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Margin</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowMarginItems.length}</div>
            <p className="text-xs text-muted-foreground">0-20% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyMarginItems.length}</div>
            <p className="text-xs text-muted-foreground">20-40% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highMarginItems.length}</div>
            <p className="text-xs text-muted-foreground">40%+ margin</p>
          </CardContent>
        </Card>
      </div>

      {belowCostItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Pricing Issues</AlertTitle>
          <AlertDescription>
            {belowCostItems.length} item(s) are priced below cost. Immediate price adjustment recommended.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Price Coverage Analysis</CardTitle>
            <CardDescription>Items by margin category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Below Cost', value: belowCostItems.length, fill: '#ef4444' },
                    { name: 'Low (0-20%)', value: lowMarginItems.length, fill: '#f59e0b' },
                    { name: 'Healthy (20-40%)', value: healthyMarginItems.length, fill: '#3b82f6' },
                    { name: 'Premium (40%+)', value: highMarginItems.length, fill: '#10b981' },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Recommendations</CardTitle>
            <CardDescription>Action items to optimize pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {belowCostItems.length > 0 && (
              <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">Immediate Action Required</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      Increase prices on {belowCostItems.length} items currently below cost
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {lowMarginItems.length > 0 && (
              <div className="p-4 border border-orange-200 dark:border-orange-900 rounded-lg bg-orange-50 dark:bg-orange-950">
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">Consider Price Increase</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                      {lowMarginItems.length} items have low margins. Consider 10-15% price increase
                    </p>
                  </div>
                </div>
              </div>
            )}

            {highMarginItems.length > 0 && (
              <div className="p-4 border border-green-200 dark:border-green-900 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Pricing Strength</h4>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      {highMarginItems.length} items have excellent margins. Monitor competition
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Item Analysis by Margin Category</CardTitle>
            <CardDescription>Comprehensive breakdown of all menu items across margin categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {belowCostItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-lg">Below Cost Items ({belowCostItems.length})</h4>
                </div>
                <div className="rounded-md border border-red-200 dark:border-red-900">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-red-50 dark:bg-red-950">
                      <tr>
                        <th className="p-3 text-left font-medium">Item</th>
                        <th className="p-3 text-right font-medium">Price</th>
                        <th className="p-3 text-right font-medium">Cost</th>
                        <th className="p-3 text-right font-medium">Loss</th>
                        <th className="p-3 text-right font-medium">Margin</th>
                        <th className="p-3 text-right font-medium">Suggested Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {belowCostItems.sort((a, b) => a.margin - b.margin).map((item) => {
                        const suggestedPrice = item.cost / 0.7;
                        const loss = item.cost - item.basePrice;
                        return (
                          <tr key={item.id} className="border-b" data-testid={`item-below-cost-${item.id}`}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right font-mono">{item.basePrice.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">{item.cost.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono text-red-600 dark:text-red-500">{loss.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">
                              <Badge variant="destructive">{item.margin.toFixed(1)}%</Badge>
                            </td>
                            <td className="p-3 text-right font-mono text-green-600 dark:text-green-500 font-semibold">
                              {suggestedPrice.toFixed(2)} SAR
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {lowMarginItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-lg">Low Margin Items (0-20%) ({lowMarginItems.length})</h4>
                </div>
                <div className="rounded-md border border-orange-200 dark:border-orange-900">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-orange-50 dark:bg-orange-950">
                      <tr>
                        <th className="p-3 text-left font-medium">Item</th>
                        <th className="p-3 text-right font-medium">Price</th>
                        <th className="p-3 text-right font-medium">Cost</th>
                        <th className="p-3 text-right font-medium">Profit</th>
                        <th className="p-3 text-right font-medium">Margin</th>
                        <th className="p-3 text-right font-medium">Suggested Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowMarginItems.sort((a, b) => a.margin - b.margin).map((item) => {
                        const suggestedPrice = item.cost / 0.7;
                        const profit = item.basePrice - item.cost;
                        return (
                          <tr key={item.id} className="border-b" data-testid={`item-low-margin-${item.id}`}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right font-mono">{item.basePrice.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">{item.cost.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-500">{profit.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">
                              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900">{item.margin.toFixed(1)}%</Badge>
                            </td>
                            <td className="p-3 text-right font-mono text-green-600 dark:text-green-500 font-semibold">
                              {suggestedPrice.toFixed(2)} SAR
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {healthyMarginItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold text-lg">Healthy Margin Items (20-40%) ({healthyMarginItems.length})</h4>
                </div>
                <div className="rounded-md border border-blue-200 dark:border-blue-900">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-blue-50 dark:bg-blue-950">
                      <tr>
                        <th className="p-3 text-left font-medium">Item</th>
                        <th className="p-3 text-right font-medium">Price</th>
                        <th className="p-3 text-right font-medium">Cost</th>
                        <th className="p-3 text-right font-medium">Profit</th>
                        <th className="p-3 text-right font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthyMarginItems.sort((a, b) => b.margin - a.margin).map((item) => {
                        const profit = item.basePrice - item.cost;
                        return (
                          <tr key={item.id} className="border-b" data-testid={`item-healthy-margin-${item.id}`}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right font-mono">{item.basePrice.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">{item.cost.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-500">{profit.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">
                              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{item.margin.toFixed(1)}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {highMarginItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold text-lg">Premium Margin Items (40%+) ({highMarginItems.length})</h4>
                </div>
                <div className="rounded-md border border-green-200 dark:border-green-900">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-green-50 dark:bg-green-950">
                      <tr>
                        <th className="p-3 text-left font-medium">Item</th>
                        <th className="p-3 text-right font-medium">Price</th>
                        <th className="p-3 text-right font-medium">Cost</th>
                        <th className="p-3 text-right font-medium">Profit</th>
                        <th className="p-3 text-right font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highMarginItems.sort((a, b) => b.margin - a.margin).map((item) => {
                        const profit = item.basePrice - item.cost;
                        return (
                          <tr key={item.id} className="border-b" data-testid={`item-premium-margin-${item.id}`}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right font-mono">{item.basePrice.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">{item.cost.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono text-green-600 dark:text-green-500 font-semibold">{profit.toFixed(2)} SAR</td>
                            <td className="p-3 text-right font-mono">
                              <Badge className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">{item.margin.toFixed(1)}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Scaling Analysis Tab Component
function ScalingAnalysisTab({ profitabilityData, totalRevenue, totalProfit }: { profitabilityData: any[], totalRevenue: number, totalProfit: number }) {
  const itemsWithSales = profitabilityData.filter(item => item.salesVolume > 0);
  const avgUnitsSold = itemsWithSales.reduce((sum, item) => sum + item.salesVolume, 0) / itemsWithSales.length || 0;
  const avgProfitPerUnit = totalProfit / itemsWithSales.reduce((sum, item) => sum + item.salesVolume, 0) || 0;

  // Calculate unit economics
  const highVolumeItems = profitabilityData
    .filter(item => item.salesVolume > avgUnitsSold)
    .sort((a, b) => b.salesVolume - a.salesVolume)
    .slice(0, 10);

  const handleExportPDF = () => {
    exportToPDF("Scaling Viability Report", itemsWithSales, [
      { header: "Item Name", accessor: "name", width: 60 },
      { header: "Sales Volume", accessor: (row: any) => row.salesVolume.toString(), width: 30 },
      { header: "Profit/Unit (SAR)", accessor: (row: any) => row.profit.toFixed(2), width: 35 },
      { header: "Total Revenue (SAR)", accessor: (row: any) => row.totalRevenue.toFixed(2), width: 40 },
      { header: "Total Profit (SAR)", accessor: (row: any) => row.totalProfit.toFixed(2), width: 40 },
      { header: "Margin %", accessor: (row: any) => row.margin.toFixed(1) + "%", width: 25 },
    ], { subtitle: `Avg Profit/Unit: ${avgProfitPerUnit.toFixed(2)} SAR | Overall Margin: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%` });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-scaling-pdf">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit/Unit</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgProfitPerUnit.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">Per item sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break-Even Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.ceil(avgUnitsSold)}</div>
            <p className="text-xs text-muted-foreground">Average per item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall profitability</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Scale className="h-4 w-4" />
        <AlertTitle>Scaling Viability Assessment</AlertTitle>
        <AlertDescription>
          With an average profit of {avgProfitPerUnit.toFixed(2)} SAR per unit, you can invest up to this amount in customer acquisition while maintaining profitability. 
          Higher margin items provide more room for marketing and growth investments.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics by Volume</CardTitle>
            <CardDescription>High-volume items and their profitability</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={highVolumeItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="salesVolume" fill="#3b82f6" name="Units Sold" />
                <Bar yAxisId="right" dataKey="profit" fill="#10b981" name="Profit/Unit (SAR)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scaling Recommendations</CardTitle>
            <CardDescription>Investment opportunities by item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">High-Margin Scaling</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Items with 40%+ margins can support aggressive customer acquisition. 
                    Consider spending up to 20% of unit profit on marketing.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Volume Opportunities</h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    High-volume items with healthy margins are ideal for promotions. 
                    Small discounts can drive significant volume increases.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">Limited Scaling Potential</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    Items with margins below 20% have limited room for marketing investment. 
                    Focus on cost reduction before scaling.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Capacity by Item</CardTitle>
          <CardDescription>Maximum sustainable customer acquisition cost per item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Item</th>
                  <th className="p-3 text-right font-medium">Profit/Unit</th>
                  <th className="p-3 text-right font-medium">Margin %</th>
                  <th className="p-3 text-right font-medium">Sales Volume</th>
                  <th className="p-3 text-right font-medium">Max CAC</th>
                  <th className="p-3 text-right font-medium">Scaling Potential</th>
                </tr>
              </thead>
              <tbody>
                {highVolumeItems.map((item) => {
                  const maxCAC = item.profit * 0.2; // 20% of profit
                  const scalingPotential = item.margin > 40 ? 'High' : item.margin > 20 ? 'Medium' : 'Low';
                  
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-right font-mono text-green-600 dark:text-green-500">
                        {item.profit.toFixed(2)} SAR
                      </td>
                      <td className="p-3 text-right font-mono">{item.margin.toFixed(1)}%</td>
                      <td className="p-3 text-right font-mono">{item.salesVolume}</td>
                      <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-500">
                        {maxCAC.toFixed(2)} SAR
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={
                          scalingPotential === 'High' ? 'default' : 
                          scalingPotential === 'Medium' ? 'secondary' : 
                          'outline'
                        }>
                          {scalingPotential}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Cost Management Tab Component
function CostManagementTab({ profitabilityData, bills }: { profitabilityData: any[]; bills: ShopBill[] }) {
  // Identify cost reduction opportunities
  const highCostItems = profitabilityData
    .filter(item => item.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  const lowMarginHighCost = profitabilityData
    .filter(item => item.margin < 30 && item.cost > 10)
    .sort((a, b) => b.cost - a.cost);

  // Helper function to prorate bill amounts to monthly values
  // quarterly÷3, semi-annual÷6, yearly÷12, weekly×4.33
  // Handles all known variants: case-insensitive, hyphenated, spaced, and compound forms
  const getMonthlyAmount = (paymentPeriod: string | null | undefined, amount: number): number => {
    if (!paymentPeriod || amount === 0) return amount;
    const period = paymentPeriod.toLowerCase().replace(/[\s-]/g, ''); // normalize: remove spaces/hyphens
    switch (period) {
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'semiannual':
      case 'biannual':
        return amount / 6;
      case 'yearly':
      case 'annual':
      case 'annually':
        return amount / 12;
      default:
        return amount;
    }
  };

  // Filter to recurring bills only (exclude one-time and foundational)
  const recurringBills = bills.filter(bill => {
    const paymentPeriod = String(bill.paymentPeriod || '').toLowerCase();
    const billType = String(bill.billType || '').toLowerCase();
    return billType !== 'foundational' && 
           paymentPeriod !== 'one-time' && 
           paymentPeriod !== 'onetime';
  });

  // Calculate operating expenses from bills with proration
  const totalOperatingExpenses = recurringBills.reduce((sum, bill) => {
    const rawAmount = parseFloat(bill.amount || "0");
    return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
  }, 0);
  const paidExpenses = recurringBills.filter(b => b.status === "paid").reduce((sum, bill) => {
    const rawAmount = parseFloat(bill.amount || "0");
    return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
  }, 0);
  const pendingExpenses = recurringBills.filter(b => b.status === "pending").reduce((sum, bill) => {
    const rawAmount = parseFloat(bill.amount || "0");
    return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
  }, 0);

  // Group bills by type with prorated amounts
  const expensesByType = recurringBills.reduce((acc, bill) => {
    const type = bill.billType;
    const rawAmount = parseFloat(bill.amount || "0");
    acc[type] = (acc[type] || 0) + getMonthlyAmount(bill.paymentPeriod, rawAmount);
    return acc;
  }, {} as Record<string, number>);

  const expenseTypeData = Object.entries(expensesByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const handleExportPDF = () => {
    const exportData = [
      ...highCostItems.map(item => ({ ...item, type: 'Menu Item Cost' })),
      ...recurringBills.map(bill => ({
        name: bill.description || bill.billType,
        cost: getMonthlyAmount(bill.paymentPeriod, parseFloat(bill.amount || "0")),
        type: bill.billType,
        status: bill.status,
        margin: 0,
      })),
    ];
    
    exportToPDF("Cost Management Report", exportData, [
      { header: "Item/Expense", accessor: "name", width: 70 },
      { header: "Type", accessor: "type", width: 40 },
      { header: "Monthly Cost (SAR)", accessor: (row: any) => row.cost.toFixed(2), width: 40 },
      { header: "Margin %", accessor: (row: any) => row.margin ? row.margin.toFixed(1) + "%" : "-", width: 30 },
      { header: "Status", accessor: (row: any) => row.status || "-", width: 30 },
    ], { subtitle: `Monthly Operating Expenses: ${totalOperatingExpenses.toFixed(2)} SAR | Paid: ${paidExpenses.toFixed(2)} SAR | Pending: ${pendingExpenses.toFixed(2)} SAR` });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-cost-pdf">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
      {/* Operating Expenses Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-orange-600">{totalOperatingExpenses.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">Recurring expenses (excludes one-time & foundational)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-600">{paidExpenses.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{((paidExpenses / totalOperatingExpenses) * 100 || 0).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-orange-600">{pendingExpenses.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{((pendingExpenses / totalOperatingExpenses) * 100 || 0).toFixed(1)}% of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Operating Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses by Category</CardTitle>
          <CardDescription>Recurring expenses breakdown (excludes one-time & foundational)</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
                <Bar dataKey="value" fill="hsl(var(--destructive))" name="Expense Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No operating expense data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <Scissors className="h-4 w-4" />
        <AlertTitle>Cost Reduction Strategy</AlertTitle>
        <AlertDescription>
          Reducing costs by just 10% on high-cost items can significantly improve margins without changing prices. 
          Focus on ingredient substitutions, supplier negotiations, portion control, and operating expense optimization.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Highest Cost Items</CardTitle>
            <CardDescription>Items with largest cost per unit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={highCostItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} SAR`} />
                <Bar dataKey="cost" fill="#ef4444" name="Cost/Unit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Reduction Impact</CardTitle>
            <CardDescription>Potential margin improvement from 10% cost reduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {highCostItems.slice(0, 5).map((item) => {
              const reducedCost = item.cost * 0.9;
              const newProfit = item.basePrice - reducedCost;
              const newMargin = (newProfit / item.basePrice) * 100;
              const marginIncrease = newMargin - item.margin;

              return (
                <div key={item.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline">+{marginIncrease.toFixed(1)}% margin</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cost: {item.cost.toFixed(2)} → {reducedCost.toFixed(2)} SAR
                  </div>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-500">
                    Margin: {item.margin.toFixed(1)}% → {newMargin.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Cost Reduction Targets</CardTitle>
          <CardDescription>High-cost items with low margins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Item</th>
                  <th className="p-3 text-right font-medium">Current Cost</th>
                  <th className="p-3 text-right font-medium">Current Margin</th>
                  <th className="p-3 text-right font-medium">Target Cost (-10%)</th>
                  <th className="p-3 text-right font-medium">New Margin</th>
                  <th className="p-3 text-right font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {lowMarginHighCost.map((item) => {
                  const targetCost = item.cost * 0.9;
                  const newProfit = item.basePrice - targetCost;
                  const newMargin = (newProfit / item.basePrice) * 100;
                  const priority = item.margin < 20 && item.cost > 20 ? 'Critical' : item.margin < 30 ? 'High' : 'Medium';

                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-right font-mono text-red-600 dark:text-red-500">
                        {item.cost.toFixed(2)} SAR
                      </td>
                      <td className="p-3 text-right font-mono">{item.margin.toFixed(1)}%</td>
                      <td className="p-3 text-right font-mono text-green-600 dark:text-green-500">
                        {targetCost.toFixed(2)} SAR
                      </td>
                      <td className="p-3 text-right font-mono text-green-600 dark:text-green-500 font-semibold">
                        {newMargin.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={
                          priority === 'Critical' ? 'destructive' : 
                          priority === 'High' ? 'default' : 
                          'secondary'
                        }>
                          {priority}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Negotiation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review contracts with suppliers for high-cost items. Bulk purchasing and long-term contracts can reduce costs by 5-15%.
            </p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              5-15%
            </div>
            <p className="text-xs text-muted-foreground">Potential savings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredient Substitution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Explore alternative ingredients that maintain quality while reducing costs. Even small changes can improve margins.
            </p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              10-20%
            </div>
            <p className="text-xs text-muted-foreground">Potential savings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portion Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Standardize portions to reduce waste and ensure consistent costs. Digital scales and training can help.
            </p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              5-10%
            </div>
            <p className="text-xs text-muted-foreground">Potential savings</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
