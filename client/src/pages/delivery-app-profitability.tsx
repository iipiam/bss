import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Package, ShoppingCart, ArrowUp, ArrowDown, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Tooltip as UITooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function DeliveryAppProfitability() {
  const { t, language } = useLanguage();
  const isAr = language === 'Arabic';
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/delivery-apps/analytics/profitability"],
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-apps/analytics/profitability"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-profitability"] });
      toast({ title: (t as any).profitabilityDataSynced || "Profitability data synced successfully" });
    } catch (error) {
      toast({ title: (t as any).failedToSyncProfitability || "Failed to sync profitability data", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPDF = () => {
    if (!data || !data.apps) return;

    const exportData = data.apps.map((app: any) => ({
      "App Name": app.deliveryAppName,
      "Orders": app.totalOrders,
      "Revenue (SAR)": app.totalGrossRevenue.toFixed(2),
      "Commission (SAR)": app.totalCommissionCost.toFixed(2),
      "Banking Fees (SAR)": app.totalBankingFeesCost.toFixed(2),
      "Subsidy (SAR)": app.totalSubsidy.toFixed(2),
      "VAT (SAR)": app.totalVat.toFixed(2),
      "POS Fees (SAR)": app.totalPosFees.toFixed(2),
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
      { header: "Subsidy", accessor: "Subsidy (SAR)", width: 23 },
      { header: "VAT", accessor: "VAT (SAR)", width: 23 },
      { header: "POS Fees", accessor: "POS Fees (SAR)", width: 23 },
      { header: "Item Cost", accessor: "Item Costs (SAR)", width: 23 },
      { header: "Profit", accessor: "Profit (SAR)", width: 23 },
      { header: "Margin %", accessor: "Margin %", width: 20 },
    ];

    const result = exportToPDF("Delivery App Profitability", exportData, columns, {
      subtitle: `Total Orders: ${data.summary.totalOrders} | Net Profit: ${data.summary.profit.toFixed(2)} SAR`,
      orientation: "landscape",
    });

    if (result.success) {
      toast({ title: t.success });
    } else {
      toast({ title: t.failedToExportPDF, variant: "destructive" });
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
      "Subsidy (SAR)": parseFloat(app.totalSubsidy.toFixed(2)),
      "VAT (SAR)": parseFloat(app.totalVat.toFixed(2)),
      "POS Fees (SAR)": parseFloat(app.totalPosFees.toFixed(2)),
      "Item Costs (SAR)": parseFloat(app.totalItemCosts.toFixed(2)),
      "Net Revenue (SAR)": parseFloat(app.netRevenue.toFixed(2)),
      "Profit (SAR)": parseFloat(app.profit.toFixed(2)),
      "Profit Margin %": parseFloat(app.profitMargin.toFixed(2)),
    }));

    const result = exportToExcel("Delivery App Profitability", exportData);

    if (result.success) {
      toast({ title: t.success });
    } else {
      toast({ title: t.failedToExportExcel, variant: "destructive" });
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
    costs: app.totalCommissionCost + app.totalBankingFeesCost + app.totalSubsidy + app.totalVat + app.totalPosFees,
    itemCosts: app.totalItemCosts,
    profit: app.profit,
  }));

  const pieChartData = apps.map((app: any) => ({
    name: app.deliveryAppName,
    value: Math.max(0, app.profit),
  }));

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{(t as any).deliveryAppProfitabilityAnalysis || "Delivery App Profitability Analysis"}</h1>
          <p className="text-muted-foreground mt-1">
            {(t as any).compareDeliveryAppPerformance || "Compare delivery app performance, costs, and profitability"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            variant="outline" 
            size="default"
            disabled={isSyncing}
            data-testid="button-sync-profitability"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? ((t as any).syncing || 'Syncing...') : ((t as any).sync || 'Sync')}
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="default"
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            {(t as any).exportPdf || "Export PDF"}
          </Button>
          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            size="default"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {(t as any).exportExcel || "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {(t as any).totalOrders || "Total Orders"}
              <InfoTip>{isAr ? "إجمالي عدد الطلبات من جميع تطبيقات التوصيل." : "Total number of orders across all delivery apps."}</InfoTip>
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(t as any).acrossAllDeliveryApps || "Across all delivery apps"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {(t as any).grossRevenue || "Gross Revenue"}
              <InfoTip>{isAr ? "إجمالي الإيرادات قبل خصم الرسوم والتكاليف." : "Total revenue before deducting fees and costs."}</InfoTip>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGrossRevenue?.toFixed(2) || "0.00"} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.totalSales}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {(t as any).totalCosts || "Total Costs"}
              <InfoTip>{isAr ? "مجموع العمولات والرسوم والدعم والضريبة وتكلفة الأصناف." : "Sum of commissions, fees, subsidies, VAT and item costs."}</InfoTip>
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.totalCommissionCost + summary.totalBankingFeesCost + summary.totalSubsidy + summary.totalVat + summary.totalPosFees + summary.totalItemCosts || 0).toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(t as any).allCostsPlusVat || "All Costs + VAT"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {(t as any).netProfit || "Net Profit"}
              <InfoTip>{isAr ? "صافي الربح بعد خصم جميع الرسوم والتكاليف." : "Net profit after deducting all fees and costs."}</InfoTip>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary.profit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {summary.profit?.toFixed(2) || "0.00"} SAR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.profitMargin?.toFixed(1) || "0.0"}% {(t as any).margin || "margin"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{(t as any).costBreakdown || "Cost Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).commission || "Commission"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalCommissionCost?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).bankingFees || "Banking Fees"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalBankingFeesCost?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).subsidy || "Subsidy"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalSubsidy?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).vatFifteenPercent || "VAT (15%)"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalVat?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).posFees || "POS Fees"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalPosFees?.toFixed(2) || "0.00"} SAR
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{(t as any).itemCostsCogs || "Item Costs (COGS)"}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{summary.totalItemCosts?.toFixed(2) || "0.00"} SAR
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
            <CardTitle>{(t as any).revenueCostsByApp || "Revenue vs Costs by App"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name={(t as any).revenue || "Revenue"} />
                <Bar dataKey="costs" fill="#ef4444" name={(t as any).fees || "Fees"} />
                <Bar dataKey="itemCosts" fill="#f59e0b" name={(t as any).itemCostsLabel || "Item Costs"} />
                <Bar dataKey="profit" fill="#8b5cf6" name={(t as any).profit || "Profit"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{(t as any).profitDistribution || "Profit Distribution"}</CardTitle>
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
          <CardTitle>{(t as any).detailedBreakdownByApp || "Detailed Breakdown by Delivery App"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-sm font-medium text-left p-2">{(t as any).appName || "App Name"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).orders || "Orders"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).revenue || "Revenue"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).commission || "Commission"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).banking || "Banking"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).subsidy || "Subsidy"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).vat || "VAT"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).itemCostLabel || "Item Cost"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).profit || "Profit"}</th>
                  <th className="text-sm font-medium text-right p-2">{(t as any).marginPercent || "Margin %"}</th>
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
                    <td className="text-sm p-2 text-right text-red-600 dark:text-red-400">
                      -{app.totalSubsidy.toFixed(2)}
                    </td>
                    <td className="text-sm p-2 text-right text-red-600 dark:text-red-400">
                      -{app.totalVat.toFixed(2)}
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
    </TooltipProvider>
  );
}
