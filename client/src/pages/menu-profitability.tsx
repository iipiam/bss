import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, HelpCircle, RefreshCw, Download, FileText, DollarSign, Percent, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportToPDF } from "@/lib/exportUtils";

interface MenuProfitabilityItem {
  menuItemId: string;
  menuItemName: string;
  category: string;
  sellingPrice: number;
  portionSize: number;
  costSource: string;
  linkedTo: string;
  unitCost: number;
  actualCost: number;
  profitMargin: number;
  profitMarginPercent: number;
  status: "LOSS" | "LOW_MARGIN" | "OK";
}

interface MenuProfitabilityData {
  summary: {
    totalMenuItems: number;
    lossItems: number;
    lowMarginItems: number;
    okItems: number;
    unlinkedItems: number;
    totalPotentialLossPerUnit: number;
  };
  lossLeaders: MenuProfitabilityItem[];
  lowMargin: MenuProfitabilityItem[];
  profitable: MenuProfitabilityItem[];
  unlinked: MenuProfitabilityItem[];
  allItems: MenuProfitabilityItem[];
}

const COLORS = {
  loss: "#ef4444",
  lowMargin: "#f59e0b",
  ok: "#10b981",
  unlinked: "#6b7280"
};

export default function MenuProfitability() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isError, refetch } = useQuery<MenuProfitabilityData>({
    queryKey: ["/api/analytics/menu-profitability"],
    staleTime: 30000,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data",
      description: "Fetching latest profitability analysis...",
    });
  };

  const handleExport = () => {
    if (!data) return;
    
    const csvContent = [
      ["Menu Item", "Category", "Selling Price", "Cost", "Profit Margin", "Margin %", "Status", "Cost Source", "Linked To"].join(","),
      ...data.allItems.map(item => [
        `"${item.menuItemName}"`,
        `"${item.category || 'Uncategorized'}"`,
        item.sellingPrice.toFixed(2),
        item.actualCost.toFixed(2),
        item.profitMargin.toFixed(2),
        item.profitMarginPercent.toFixed(1) + "%",
        item.status,
        item.costSource,
        `"${item.linkedTo}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menu-profitability-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Menu profitability report downloaded as CSV",
    });
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    const columns = [
      { header: "Menu Item", accessor: "menuItemName", width: 50 },
      { header: "Category", accessor: (row: MenuProfitabilityItem) => row.category || "Uncategorized", width: 35 },
      { header: "Price (SAR)", accessor: (row: MenuProfitabilityItem) => row.sellingPrice.toFixed(2), width: 25 },
      { header: "Cost (SAR)", accessor: (row: MenuProfitabilityItem) => row.actualCost.toFixed(2), width: 25 },
      { header: "Profit (SAR)", accessor: (row: MenuProfitabilityItem) => row.profitMargin.toFixed(2), width: 25 },
      { header: "Margin %", accessor: (row: MenuProfitabilityItem) => row.profitMarginPercent.toFixed(1) + "%", width: 20 },
      { header: "Status", accessor: "status", width: 25 },
      { header: "Cost Source", accessor: "costSource", width: 25 },
    ];
    
    const result = exportToPDF(
      "Menu Profitability Analysis",
      data.allItems,
      columns,
      {
        subtitle: `Summary: ${data.summary.lossItems} Loss Items | ${data.summary.lowMarginItems} Low Margin | ${data.summary.okItems} Profitable | Total Loss/Unit: SAR ${data.summary.totalPotentialLossPerUnit.toFixed(2)}`,
        orientation: "landscape"
      }
    );
    
    if (result.success) {
      toast({
        title: "Export Complete",
        description: "Menu profitability report downloaded as PDF",
      });
    } else {
      toast({
        title: "Export Failed",
        description: result.error || "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Failed to load menu profitability data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pieData = [
    { name: "Loss Items", value: data.summary.lossItems, color: COLORS.loss },
    { name: "Low Margin", value: data.summary.lowMarginItems, color: COLORS.lowMargin },
    { name: "Profitable", value: data.summary.okItems, color: COLORS.ok },
  ].filter(item => item.value > 0);

  const topLossItems = data.lossLeaders.slice(0, 10).map(item => ({
    name: item.menuItemName.length > 15 ? item.menuItemName.substring(0, 15) + "..." : item.menuItemName,
    loss: Math.abs(item.profitMargin),
    fullName: item.menuItemName
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Menu Profitability Analysis</h1>
          <p className="text-muted-foreground">Identify which menu items are losing money</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {data.summary.lossItems > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical: {data.summary.lossItems} items selling below cost!</AlertTitle>
          <AlertDescription>
            You're losing SAR {data.summary.totalPotentialLossPerUnit.toFixed(2)} per unit on loss-making items.
            Review these items immediately and either increase prices or reduce costs.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Menu Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">{data.summary.totalMenuItems}</div>
            <p className="text-xs text-muted-foreground">Analyzed for profitability</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-red-600">Loss Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-loss-items">{data.summary.lossItems}</div>
            <p className="text-xs text-muted-foreground">Selling below cost</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Low Margin</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-low-margin-items">{data.summary.lowMarginItems}</div>
            <p className="text-xs text-muted-foreground">Less than 20% margin</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-green-600">Profitable</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-profitable-items">{data.summary.okItems}</div>
            <p className="text-xs text-muted-foreground">Healthy margin (20%+)</p>
          </CardContent>
        </Card>
      </div>

      {data.summary.unlinkedItems > 0 && (
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>{data.summary.unlinkedItems} items without cost data</AlertTitle>
          <AlertDescription>
            These menu items are not linked to recipes or inventory, so their costs are unknown (defaulting to 0).
            Link them to recipes or inventory items for accurate profitability tracking.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="loss" data-testid="tab-loss">
            Loss Items ({data.summary.lossItems})
          </TabsTrigger>
          <TabsTrigger value="lowmargin" data-testid="tab-lowmargin">
            Low Margin ({data.summary.lowMarginItems})
          </TabsTrigger>
          <TabsTrigger value="profitable" data-testid="tab-profitable">
            Profitable ({data.summary.okItems})
          </TabsTrigger>
          <TabsTrigger value="unlinked" data-testid="tab-unlinked">
            Unlinked ({data.summary.unlinkedItems})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Status Distribution</CardTitle>
                <CardDescription>Breakdown of menu items by profitability status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {topLossItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Top Loss-Making Items</CardTitle>
                  <CardDescription>Items with the highest per-unit losses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLossItems} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip 
                        formatter={(value: number) => [`SAR ${value.toFixed(2)}`, "Loss per unit"]}
                        labelFormatter={(label) => topLossItems.find(i => i.name === label)?.fullName || label}
                      />
                      <Bar dataKey="loss" fill={COLORS.loss} name="Loss per Unit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="loss">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Loss-Making Items</CardTitle>
              <CardDescription>
                These items are being sold BELOW cost. Each sale results in a loss.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable items={data.lossLeaders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowmargin">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">Low Margin Items</CardTitle>
              <CardDescription>
                These items have less than 20% profit margin. Consider price increases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable items={data.lowMargin} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitable">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Profitable Items</CardTitle>
              <CardDescription>
                These items have healthy profit margins (20% or more).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable items={data.profitable} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unlinked">
          <Card>
            <CardHeader>
              <CardTitle>Unlinked Items</CardTitle>
              <CardDescription>
                These items don't have recipes or inventory linked. Their cost is unknown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemsTable items={data.unlinked} showLinkWarning />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemsTable({ items, showLinkWarning = false }: { items: MenuProfitabilityItem[], showLinkWarning?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items in this category
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Menu Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Selling Price</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Profit/Loss</TableHead>
            <TableHead className="text-right">Margin %</TableHead>
            <TableHead>Cost Source</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.menuItemId} data-testid={`row-menu-item-${item.menuItemId}`}>
              <TableCell className="font-medium">{item.menuItemName}</TableCell>
              <TableCell>{item.category || "Uncategorized"}</TableCell>
              <TableCell className="text-right">SAR {item.sellingPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                {item.costSource === "none" ? (
                  <span className="text-muted-foreground">Unknown</span>
                ) : (
                  <>SAR {item.actualCost.toFixed(2)}</>
                )}
                {item.portionSize !== 1 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (×{item.portionSize})
                  </span>
                )}
              </TableCell>
              <TableCell className={`text-right font-medium ${item.profitMargin < 0 ? 'text-red-600' : item.profitMargin < item.sellingPrice * 0.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                {item.profitMargin < 0 ? "-" : "+"}SAR {Math.abs(item.profitMargin).toFixed(2)}
              </TableCell>
              <TableCell className={`text-right ${item.profitMarginPercent < 0 ? 'text-red-600' : item.profitMarginPercent < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                {item.profitMarginPercent.toFixed(1)}%
              </TableCell>
              <TableCell>
                {item.costSource === "recipe" && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Recipe: {item.linkedTo.length > 20 ? item.linkedTo.substring(0, 20) + "..." : item.linkedTo}
                  </Badge>
                )}
                {item.costSource === "inventory" && (
                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                    Inventory: {item.linkedTo.length > 15 ? item.linkedTo.substring(0, 15) + "..." : item.linkedTo}
                  </Badge>
                )}
                {item.costSource === "none" && (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    {showLinkWarning ? "⚠️ Not Linked" : "Not Linked"}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {item.status === "LOSS" && (
                  <Badge variant="destructive">LOSS</Badge>
                )}
                {item.status === "LOW_MARGIN" && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">LOW MARGIN</Badge>
                )}
                {item.status === "OK" && (
                  <Badge className="bg-green-500 hover:bg-green-600">PROFITABLE</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
