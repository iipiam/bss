import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, Truck, TrendingUp, DollarSign, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Tooltip as UITooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient } from "@/lib/queryClient";

export default function SalesComparison() {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/sales-comparison"],
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/sales-comparison"] });
      toast({ title: (t as any).salesDataSynced || "Sales data synced successfully" });
    } catch (error) {
      toast({ title: (t as any).failedToSyncSalesData || "Failed to sync sales data", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    const exportData = [
      {
        "Order Type": t.dineIn,
        "Orders": dineIn.totalOrders || 0,
        "Revenue (SAR)": dineIn.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": dineIn.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": dineIn.percentage?.toFixed(1) + "%" || "0.0%",
        "% of Revenue": dineIn.revenuePercentage?.toFixed(1) + "%" || "0.0%",
      },
      {
        "Order Type": (t as any).takeAway || "Take-Away",
        "Orders": takeAway.totalOrders || 0,
        "Revenue (SAR)": takeAway.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": takeAway.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": takeAway.percentage?.toFixed(1) + "%" || "0.0%",
        "% of Revenue": takeAway.revenuePercentage?.toFixed(1) + "%" || "0.0%",
      },
      {
        "Order Type": t.deliveryApps,
        "Orders": deliveryApps.totalOrders || 0,
        "Revenue (SAR)": deliveryApps.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": deliveryApps.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": deliveryApps.percentage?.toFixed(1) + "%" || "0.0%",
        "% of Revenue": deliveryApps.revenuePercentage?.toFixed(1) + "%" || "0.0%",
      },
    ];

    const columns = [
      { header: (t as any).orderType || "Order Type", accessor: "Order Type" },
      { header: t.orders, accessor: "Orders" },
      { header: `${t.revenue} (SAR)`, accessor: "Revenue (SAR)" },
      { header: t.avgOrderValue, accessor: "Avg Order Value (SAR)" },
      { header: `% ${t.orders}`, accessor: "% of Orders" },
      { header: `% ${t.revenue}`, accessor: "% of Revenue" },
    ];

    const result = exportToPDF(t.salesComparison, exportData, columns, {
      subtitle: `${t.totalOrders}: ${summary.totalOrders || 0} | ${t.totalRevenue}: ${summary.totalRevenue?.toFixed(2) || "0.00"} SAR`,
    });

    if (result.success) {
      toast({ title: t.pdfExportSuccessful });
    } else {
      toast({ title: t.failedToExportPDF, variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    const exportData = [
      {
        "Order Type": t.dineIn,
        "Orders": dineIn.totalOrders || 0,
        "Revenue (SAR)": dineIn.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": dineIn.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": dineIn.percentage?.toFixed(1) || "0.0",
        "% of Revenue": dineIn.revenuePercentage?.toFixed(1) || "0.0",
      },
      {
        "Order Type": (t as any).takeAway || "Take-Away",
        "Orders": takeAway.totalOrders || 0,
        "Revenue (SAR)": takeAway.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": takeAway.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": takeAway.percentage?.toFixed(1) || "0.0",
        "% of Revenue": takeAway.revenuePercentage?.toFixed(1) || "0.0",
      },
      {
        "Order Type": t.deliveryApps,
        "Orders": deliveryApps.totalOrders || 0,
        "Revenue (SAR)": deliveryApps.totalRevenue?.toFixed(2) || "0.00",
        "Avg Order Value (SAR)": deliveryApps.avgOrderValue?.toFixed(2) || "0.00",
        "% of Orders": deliveryApps.percentage?.toFixed(1) || "0.0",
        "% of Revenue": deliveryApps.revenuePercentage?.toFixed(1) || "0.0",
      },
    ];

    const result = exportToExcel(t.salesComparison, exportData);

    if (result.success) {
      toast({ title: t.excelExportSuccessful });
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

  const { summary = {}, dineIn = {}, takeAway = {}, deliveryApps = {} } = data || {};

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const orderCountData = [
    {
      name: t.dineIn,
      orders: dineIn.totalOrders || 0,
      revenue: dineIn.totalRevenue || 0,
    },
    {
      name: (t as any).takeAway || "Take-Away",
      orders: takeAway.totalOrders || 0,
      revenue: takeAway.totalRevenue || 0,
    },
    {
      name: t.deliveryApps,
      orders: deliveryApps.totalOrders || 0,
      revenue: deliveryApps.totalRevenue || 0,
    },
  ];

  const pieChartData = [
    { name: t.dineIn, value: dineIn.totalRevenue || 0 },
    { name: (t as any).takeAway || "Take-Away", value: takeAway.totalRevenue || 0 },
    { name: t.deliveryApps, value: deliveryApps.totalRevenue || 0 },
  ];

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{(t as any).salesComparisonAnalysis || "Sales Comparison Analysis"}</h1>
          <p className="text-muted-foreground mt-1">
            {(t as any).compareSalesChannels || "Compare performance across dine-in, take-away, and delivery app orders"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            variant="outline" 
            size="default"
            disabled={isSyncing}
            data-testid="button-sync-sales"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? (t.syncing || 'Syncing...') : ((t as any).sync || 'Sync')}
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="default"
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            {(t as any).exportPDF || "Export PDF"}
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
              {t.totalOrders}
              <InfoTip>{isRTL ? "إجمالي عدد الطلبات عبر جميع القنوات." : "Total number of orders across all channels."}</InfoTip>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(t as any).allOrderTypes || "All order types"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t.totalRevenue}
              <InfoTip>{isRTL ? "إجمالي الإيرادات من جميع قنوات البيع." : "Total revenue from all sales channels."}</InfoTip>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRevenue?.toFixed(2) || "0.00"} SAR</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(t as any).acrossAllChannels || "Across all channels"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t.dineIn}
              <InfoTip>{isRTL ? "نسبة طلبات تناول الطعام داخل المطعم من الإجمالي." : "Share of dine-in orders out of total orders."}</InfoTip>
            </CardTitle>
            <Store className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dineIn.percentage?.toFixed(1) || "0.0"}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dineIn.totalOrders || 0} {t.orders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t.deliveryApps}
              <InfoTip>{isRTL ? "نسبة طلبات تطبيقات التوصيل من إجمالي الطلبات." : "Share of delivery app orders out of total orders."}</InfoTip>
            </CardTitle>
            <Truck className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{deliveryApps.percentage?.toFixed(1) || "0.0"}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {deliveryApps.totalOrders || 0} {t.orders}
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
              <CardTitle>{t.dineIn}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.orders}</p>
              <p className="text-2xl font-bold">{dineIn.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{dineIn.percentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.revenue}</p>
              <p className="text-lg font-semibold">{dineIn.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{dineIn.revenuePercentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.avgOrderValue}</p>
              <p className="text-lg font-semibold">{dineIn.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle>{(t as any).takeAway || "Take-Away"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.orders}</p>
              <p className="text-2xl font-bold">{takeAway.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{takeAway.percentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.revenue}</p>
              <p className="text-lg font-semibold">{takeAway.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{takeAway.revenuePercentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.avgOrderValue}</p>
              <p className="text-lg font-semibold">{takeAway.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle>{t.deliveryApps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.orders}</p>
              <p className="text-2xl font-bold">{deliveryApps.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground">{deliveryApps.percentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.revenue}</p>
              <p className="text-lg font-semibold">{deliveryApps.totalRevenue?.toFixed(2) || "0.00"} SAR</p>
              <p className="text-xs text-muted-foreground">{deliveryApps.revenuePercentage?.toFixed(1) || "0.0"}% {(t as any).ofTotal || "of total"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.avgOrderValue}</p>
              <p className="text-lg font-semibold">{deliveryApps.avgOrderValue?.toFixed(2) || "0.00"} SAR</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{(t as any).ordersRevenueComparison || "Orders & Revenue Comparison"}</CardTitle>
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
                <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" name={t.orders} />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name={`${t.revenue} (SAR)`} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{(t as any).revenueDistribution || "Revenue Distribution"}</CardTitle>
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
            <CardTitle>{(t as any).deliveryAppBreakdown || "Delivery App Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-sm font-medium text-left p-2">{(t as any).appName || "App Name"}</th>
                    <th className="text-sm font-medium text-right p-2">{t.orders}</th>
                    <th className="text-sm font-medium text-right p-2">{t.revenue} (SAR)</th>
                    <th className="text-sm font-medium text-right p-2">{t.avgOrderValue}</th>
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
    </TooltipProvider>
  );
}
