import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Package, ShoppingCart, ArrowUp, ArrowDown, Download, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

export default function DeliveryAppProfitability() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/delivery-apps/analytics/profitability"],
  });

  const handleExportPDF = () => {
    if (!data || !data.apps) return;

    const exportData = data.apps.map((app: any) => ({
      "App Name": app.deliveryAppName,
      "Orders": app.totalOrders,
      "Revenue (SAR)": app.totalGrossRevenue.toFixed(2),
      "Commission (SAR)": app.totalCommissionCost.toFixed(2),
      "Banking Fees (SAR)": app.totalBankingFeesCost.toFixed(2),
      "POS Fees (SAR)": app.totalPosFees.toFixed(2),
      "Subsidy (SAR)": app.totalSubsidy.toFixed(2),
      "Item Costs (SAR)": app.totalItemCosts.toFixed(2),
      "Profit (SAR)": app.profit.toFixed(2),
      "Margin %": app.profitMargin.toFixed(1) + "%",
    }));

    const columns = [
      { header: "App Name", accessor: "App Name", width: 35 },
      { header: "Orders", accessor: "Orders", width: 18 },
      { header: "Revenue", accessor: "Revenue (SAR)", width: 23 },
      { header: "Commission", accessor: "Commission (SAR)", width: 23 },
      { header: "Banking", accessor: "Banking Fees (SAR)", width: 23 },
      { header: "POS Fees", accessor: "POS Fees (SAR)", width: 23 },
      { header: "Subsidy", accessor: "Subsidy (SAR)", width: 23 },
      { header: "Item Cost", accessor: "Item Costs (SAR)", width: 23 },
      { header: "Profit", accessor: "Profit (SAR)", width: 23 },
      { header: "Margin %", accessor: "Margin %", width: 20 },
    ];

    const result = exportToPDF("Delivery App Profitability", exportData, columns, {
      subtitle: `Total Orders: ${data.summary.totalOrders} | Net Profit: ${data.summary.profit.toFixed(2)} SAR`,
      orientation: "landscape",
    });

    if (result.success) {
      toast({ title: "PDF exported successfully" });
    } else {
      toast({ title: "Failed to export PDF", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    if (!data || !data.apps) return;

    const exportData = data.apps.map((app: any) => ({
      "App Name": app.deliveryAppName,
      "Orders": app.totalOrders,
      "Revenue (SAR)": parseFloat(app.totalGrossRevenue.toFixed(2)),
      "Commission (SAR)": parseFloat(app.totalCommissionCost.toFixed(2)),
      "Banking Fees (SAR)": parseFloat(app.totalBankingFeesCost.toFixed(2)),
      "POS Fees (SAR)": parseFloat(app.totalPosFees.toFixed(2)),
      "Subsidy (SAR)": parseFloat(app.totalSubsidy.toFixed(2)),
      "Item Costs (SAR)": parseFloat(app.totalItemCosts.toFixed(2)),
      "Net Revenue (SAR)": parseFloat(app.netRevenue.toFixed(2)),
      "Profit (SAR)": parseFloat(app.profit.toFixed(2)),
      "Profit Margin %": parseFloat(app.profitMargin.toFixed(2)),
    }));

    const result = exportToExcel("Delivery App Profitability", exportData);

    if (result.success) {
      toast({ title: "Excel exported successfully" });
    } else {
      toast({ title: "Failed to export Excel", variant: "destructive" });
    }
  };

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

  const { apps = [], summary = {} } = data || {};

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  // Prepare chart data
  const profitChartData = apps.map((app: any) => ({
    name: app.deliveryAppName,
    revenue: app.totalGrossRevenue,
    costs: app.totalCommissionCost + app.totalBankingFeesCost + app.totalPosFees,
    itemCosts: app.totalItemCosts,
    profit: app.profit,
  }));

  const pieChartData = apps.map((app: any) => ({
    name: app.deliveryAppName,
    value: Math.max(0, app.profit),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery App Profitability Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Compare delivery app performance, costs, and profitability
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="default"
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            size="default"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all delivery apps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGrossRevenue?.toFixed(2) || "0.00"} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.totalCommissionCost + summary.totalBankingFeesCost + summary.totalPosFees + summary.totalItemCosts || 0).toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fees + Item Costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary.profit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {summary.profit?.toFixed(2) || "0.00"} SAR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.profitMargin?.toFixed(1) || "0.0"}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Commission Costs</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalCommissionCost?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Banking Fees</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalBankingFeesCost?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">POS Fees</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalPosFees?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subsidies Received</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{summary.totalSubsidy?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Item Costs (COGS)</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalItemCosts?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Net Revenue</p>
              <p className="text-lg font-semibold text-primary">
                {summary.netRevenue?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Costs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Costs by App</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="costs" fill="#ef4444" name="Fees" />
                <Bar dataKey="itemCosts" fill="#f59e0b" name="Item Costs" />
                <Bar dataKey="profit" fill="#8b5cf6" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown by Delivery App</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-sm font-medium text-left p-2">App Name</th>
                  <th className="text-sm font-medium text-right p-2">Orders</th>
                  <th className="text-sm font-medium text-right p-2">Revenue</th>
                  <th className="text-sm font-medium text-right p-2">Commission</th>
                  <th className="text-sm font-medium text-right p-2">Banking</th>
                  <th className="text-sm font-medium text-right p-2">Subsidy</th>
                  <th className="text-sm font-medium text-right p-2">Item Cost</th>
                  <th className="text-sm font-medium text-right p-2">Profit</th>
                  <th className="text-sm font-medium text-right p-2">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app: any) => (
                  <tr key={app.deliveryAppId} className="border-b hover-elevate" data-testid={`row-app-${app.deliveryAppId}`}>
                    <td className="text-sm p-2 font-medium">{app.deliveryAppName}</td>
                    <td className="text-sm p-2 text-right">{app.totalOrders}</td>
                    <td className="text-sm p-2 text-right">{app.totalGrossRevenue.toFixed(2)}</td>
                    <td className="text-sm p-2 text-right text-red-600 dark:text-red-400">
                      -{app.totalCommissionCost.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right text-red-600 dark:text-red-400">
                      -{app.totalBankingFeesCost.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right text-green-600 dark:text-green-400">
                      +{app.totalSubsidy.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right text-red-600 dark:text-red-400">
                      -{app.totalItemCosts.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right font-semibold ${app.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}" data-testid={`text-profit-${app.deliveryAppId}`}>
                      {app.profit.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right">
                      <span className={`inline-flex items-center ${app.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {app.profitMargin >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {Math.abs(app.profitMargin).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
