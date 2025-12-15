import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Receipt, FileDown, Wallet, Target, Radio, Truck, Package, ChevronDown, ChevronUp, HelpCircle, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import type { Invoice, ShopBill, InventoryItem, BepMetrics } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { queryClient } from "@/lib/queryClient";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

interface DeliveryBreakdown {
  id: string;
  name: string;
  orders: number;
  sales: number;
  revenue: number;
  commission: number;
  banking: number;
  subsidy: number;
  posFees: number;
  netEarnings: number;
  commissionRate: number;
  bankingRate: number;
  active: boolean;
}

interface DeliveryBreakdownResponse {
  breakdown: DeliveryBreakdown[];
  totals: {
    orders: number;
    sales: number;
    revenue: number;
    commission: number;
    banking: number;
    subsidy: number;
    posFees: number;
    netEarnings: number;
  };
  year: string;
}

export default function Financial() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ["/api/analytics/financial", selectedYear, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/financial?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) throw new Error("Failed to fetch financial data");
      return response.json();
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: allBills = [], isLoading: billsLoading } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    queryFn: async () => {
      const response = await fetch("/api/shop/bills?includeArchived=true");
      if (!response.ok) throw new Error("Failed to fetch bills");
      return response.json();
    },
  });

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: deliveryBreakdown, isLoading: deliveryLoading } = useQuery<DeliveryBreakdownResponse>({
    queryKey: ["/api/analytics/delivery-breakdown", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/delivery-breakdown?year=${selectedYear}`);
      if (!response.ok) throw new Error("Failed to fetch delivery breakdown");
      return response.json();
    },
  });

  const { data: bepMetrics, isLoading: bepLoading } = useQuery<BepMetrics>({
    queryKey: ["/api/analytics/bep", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/bep?year=${selectedYear}`);
      if (!response.ok) throw new Error("Failed to fetch BEP metrics");
      return response.json();
    },
  });

  const [fixedExpensesOpen, setFixedExpensesOpen] = useState(false);
  const [priceChange, setPriceChange] = useState("0");
  const [variableCostChange, setVariableCostChange] = useState("0");
  const [fixedCostChange, setFixedCostChange] = useState("0");

  const { lastNotification } = useNotifications();

  useEffect(() => {
    if (lastNotification?.type === 'sales:updated') {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/financial"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/delivery-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/bep"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    }
  }, [lastNotification]);

  const sensitivityScenarios = useMemo(() => {
    if (!bepMetrics) return { best: null, base: null, worst: null };
    
    const priceMultiplier = 1 + parseFloat(priceChange) / 100;
    const variableMultiplier = 1 + parseFloat(variableCostChange) / 100;
    const fixedMultiplier = 1 + parseFloat(fixedCostChange) / 100;
    
    const adjustedPrice = bepMetrics.avgSellingPrice * priceMultiplier;
    const adjustedVariableCost = bepMetrics.avgVariableCostPerUnit * variableMultiplier;
    const adjustedFixedCosts = bepMetrics.fixedCosts * fixedMultiplier;
    
    const adjustedCM = adjustedPrice - adjustedVariableCost;
    const adjustedCMRatio = adjustedPrice > 0 ? adjustedCM / adjustedPrice : 0;
    
    const adjustedBepUnits = adjustedCM > 0 ? Math.ceil(adjustedFixedCosts / adjustedCM) : 0;
    const adjustedBepRevenue = adjustedCMRatio > 0 ? adjustedFixedCosts / adjustedCMRatio : 0;
    
    const bestPrice = bepMetrics.avgSellingPrice * 1.2;
    const bestVC = bepMetrics.avgVariableCostPerUnit * 0.8;
    const bestFC = bepMetrics.fixedCosts * 0.8;
    const bestCM = bestPrice - bestVC;
    const bestCMRatio = bestPrice > 0 ? bestCM / bestPrice : 0;
    const bestBepRevenue = bestCMRatio > 0 ? bestFC / bestCMRatio : 0;
    
    const worstPrice = bepMetrics.avgSellingPrice * 0.8;
    const worstVC = bepMetrics.avgVariableCostPerUnit * 1.2;
    const worstFC = bepMetrics.fixedCosts * 1.2;
    const worstCM = worstPrice - worstVC;
    const worstCMRatio = worstPrice > 0 ? worstCM / worstPrice : 0;
    const worstBepRevenue = worstCMRatio > 0 ? worstFC / worstCMRatio : 0;
    
    return {
      best: { bepRevenue: bestBepRevenue, label: "Best Case" },
      base: { bepRevenue: adjustedBepRevenue, label: "Your Scenario" },
      worst: { bepRevenue: worstBepRevenue, label: "Worst Case" },
      adjusted: {
        price: adjustedPrice,
        variableCost: adjustedVariableCost,
        fixedCosts: adjustedFixedCosts,
        contributionMargin: adjustedCM,
        contributionMarginRatio: adjustedCMRatio,
        bepUnits: adjustedBepUnits,
        bepRevenue: adjustedBepRevenue,
      }
    };
  }, [bepMetrics, priceChange, variableCostChange, fixedCostChange]);

  const scenarioChartData = useMemo(() => {
    if (!sensitivityScenarios.best || !sensitivityScenarios.base || !sensitivityScenarios.worst) return [];
    return [
      { name: "Best Case", bepRevenue: sensitivityScenarios.best.bepRevenue, fill: "hsl(142, 76%, 36%)" },
      { name: "Your Scenario", bepRevenue: sensitivityScenarios.base.bepRevenue, fill: "hsl(199, 89%, 48%)" },
      { name: "Worst Case", bepRevenue: sensitivityScenarios.worst.bepRevenue, fill: "hsl(0, 84%, 60%)" },
    ];
  }, [sensitivityScenarios]);

  if (financialLoading || invoicesLoading || billsLoading || inventoryLoading || deliveryLoading || bepLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
        <p className="text-muted-foreground">Loading financial data...</p>
      </div>
    );
  }

  const yearlyData = financialData?.yearly || { revenue: "0", vat: "0", transactions: 0, invoices: 0 };

  // Filter bills for selected year
  const billsForYear = allBills.filter((bill) => {
    const billYear = new Date(bill.paymentDate).getFullYear();
    return billYear === parseInt(selectedYear);
  });

  // Calculate bills statistics
  const totalBillsAmount = billsForYear.reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);
  const paidBillsAmount = billsForYear.filter(b => b.status === "paid").reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);
  const pendingBillsAmount = billsForYear.filter(b => b.status === "pending").reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);

  // Calculate total inventory value - sum of all Total Prices (price field represents total cost of current stock)
  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    const price = parseFloat(item.price || "0");
    return sum + price;
  }, 0);

  // Total expenses including inventory
  const totalExpensesWithInventory = totalBillsAmount + totalInventoryValue;
  
  // Revenue from financial data (for display purposes)
  const totalRevenue = parseFloat(yearlyData.revenue || "0");

  // Filter out one-time payments and foundational bills for recurring expenses analysis
  // Note: paymentPeriod can be 'one-time' or 'oneTime' depending on when data was created
  const recurringBillsForYear = billsForYear.filter(bill => 
    bill.paymentPeriod !== "one-time" && 
    bill.paymentPeriod !== "oneTime" && 
    bill.billType !== "foundational"
  );

  // Helper function to prorate bill amounts to monthly values
  // quarterly÷3, semi-annual÷6, yearly÷12, weekly×4.33
  const getMonthlyAmount = (paymentPeriod: string | null | undefined, amount: number): number => {
    if (!paymentPeriod || amount === 0) return amount;
    switch (paymentPeriod.toLowerCase()) {
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'semi-annual':
      case 'semiannual':
        return amount / 6;
      case 'yearly':
      case 'annual':
        return amount / 12;
      default:
        return amount;
    }
  };

  // Group recurring bills by type for pie chart (excludes one-time & foundational)
  // Uses prorated monthly amounts for accurate comparison
  const billsByType = recurringBillsForYear.reduce((acc, bill) => {
    const type = bill.billType;
    const rawAmount = parseFloat(bill.amount || "0");
    const monthlyAmount = getMonthlyAmount(bill.paymentPeriod, rawAmount);
    acc[type] = (acc[type] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  const billTypeData = Object.entries(billsByType).map(([name, value]) => ({ name, value }));

  // Colors for pie chart
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Group recurring bills by month for line chart (excludes one-time & foundational)
  const billsByMonthMap = recurringBillsForYear.reduce((acc, bill) => {
    const billDate = new Date(bill.paymentDate);
    const monthNum = billDate.getMonth();
    const monthKey = String(monthNum).padStart(2, '0');
    if (!acc[monthKey]) {
      acc[monthKey] = { month: billDate.toLocaleString('default', { month: 'short' }), amount: 0 };
    }
    acc[monthKey].amount += parseFloat(bill.amount || "0");
    return acc;
  }, {} as Record<string, { month: string; amount: number }>);

  const monthlyBillsData = Object.entries(billsByMonthMap)
    .map(([key, value]) => ({ month: value.month, expenses: value.amount, sortKey: key }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ month, expenses }) => ({ month, expenses }));
  
  // Calculate recurring expenses total (for summary display) - uses prorated monthly amounts
  const recurringExpensesTotal = recurringBillsForYear.reduce((sum, bill) => {
    const rawAmount = parseFloat(bill.amount || "0");
    return sum + getMonthlyAmount(bill.paymentPeriod, rawAmount);
  }, 0);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/financial?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-${selectedYear}-${selectedPeriod}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t.exportSuccessful,
        description: "Financial data exported to Excel",
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportFinancial,
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/export/financial-pdf?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-statement-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t.pdfExportSuccessful,
        description: "Financial statement exported to PDF",
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : t.failedToExportPDF,
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download Successful",
        description: `Invoice ${invoiceNumber} downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleExportAllInvoices = async () => {
    if (invoices.length === 0) {
      toast({
        title: "No invoices",
        description: "No invoices available to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting invoices",
      description: `Downloading ${invoices.length} invoice(s)...`,
    });

    for (const invoice of invoices) {
      try {
        await handleDownloadInvoice(invoice.id, invoice.invoiceNumber);
      } catch (error) {
        console.error(`Failed to download invoice ${invoice.invoiceNumber}:`, error);
      }
    }
  };

  const handleExportExpensesPDF = async () => {
    try {
      const response = await fetch(`/api/export/expenses-pdf?year=${selectedYear}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-report-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "PDF Export Successful",
        description: `Expenses report for ${selectedYear} exported to PDF`,
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : "Failed to export expenses PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
          <p className="text-muted-foreground">Monthly and yearly financial reports with ZATCA VAT invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{parseFloat(yearlyData.revenue).toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">Year {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{parseFloat(yearlyData.vat).toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">15% Saudi VAT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{yearlyData.transactions}</div>
            <p className="text-xs text-muted-foreground">Total sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{yearlyData.invoices}</div>
            <p className="text-xs text-muted-foreground">ZATCA compliant</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statements" data-testid="tab-statements">Financial Statements</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">ZATCA Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-4">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & VAT</CardTitle>
              <CardDescription>Revenue and VAT collection breakdown for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={financialData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (SAR)" />
                  <Bar dataKey="vat" fill="hsl(var(--chart-2))" name="VAT (SAR)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Transactions Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Transactions</CardTitle>
              <CardDescription>Number of transactions per month in {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={financialData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Detailed monthly financial data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
                  <div>Month</div>
                  <div className="text-right">Revenue</div>
                  <div className="text-right">VAT</div>
                  <div className="text-right">Transactions</div>
                </div>
                {financialData?.monthly?.map((month: any) => (
                  <div key={month.month} className="grid grid-cols-4 gap-4 text-sm font-mono">
                    <div>{month.month}</div>
                    <div className="text-right">{parseFloat(month.revenue).toFixed(2)} SAR</div>
                    <div className="text-right">{parseFloat(month.vat).toFixed(2)} SAR</div>
                    <div className="text-right">{month.transactions}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExportExpensesPDF} data-testid="button-export-expenses-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
          
          {/* Expense Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalExpensesWithInventory.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">Bills + Inventory ({selectedYear})</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-blue-600" data-testid="expense-inventory-value">{totalInventoryValue.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{inventoryItems.length} items in stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Bills</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">{paidBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((paidBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% of bills</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-orange-600">{pendingBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((pendingBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% of bills</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Operating Expenses</CardTitle>
              <CardDescription>Recurring expenses by month for {selectedYear} (excludes one-time & foundational)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyBillsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)} SAR`} />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name="Expenses (SAR)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* BEP Calculator Section */}
          <Card className="bg-gradient-to-r from-teal-500/5 to-cyan-600/10">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle>BEP Calculator</CardTitle>
                    <CardDescription>Break-Even Point Analysis for {selectedYear}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={bepMetrics?.isProfitable ? "default" : "destructive"} data-testid="bep-status-badge">
                    {bepMetrics?.isProfitable ? "Profitable" : "Unprofitable"}
                  </Badge>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                    <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-600">Live</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* A. Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Card className="bg-gradient-to-r from-green-500/5 to-green-600/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Fixed Costs</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-fixed-costs" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Recurring expenses like rent, salaries, utilities. Excludes one-time and foundational costs.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold font-mono text-green-600" data-testid="bep-fixed-costs">
                      {(bepMetrics?.fixedCosts || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500/5 to-orange-600/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Variable Costs</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-variable-costs" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Cost of goods sold (COGS) based on recipes and ingredients used.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold font-mono text-orange-600" data-testid="bep-variable-costs">
                      {(bepMetrics?.cogsTotal || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">BEP Units</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-bep" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Sales needed to cover all costs. Above this = profit, below = loss.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold font-mono text-teal-600" data-testid="bep-units">
                      {(bepMetrics?.bepUnits || 0).toLocaleString("en-SA")} units
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10">
                  <CardContent className="pt-4">
                    <span className="text-xs text-muted-foreground">BEP Revenue</span>
                    <p className="text-lg font-bold font-mono text-teal-600" data-testid="bep-revenue">
                      {(bepMetrics?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <span className="text-xs text-muted-foreground">Current Revenue</span>
                    <p className="text-lg font-bold font-mono" data-testid="bep-current-revenue">
                      {(bepMetrics?.revenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </CardContent>
                </Card>

                <Card className={bepMetrics?.marginOfSafety && bepMetrics.marginOfSafety >= 0 ? "bg-gradient-to-r from-blue-500/5 to-blue-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Margin of Safety</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-margin-of-safety" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">How much revenue can drop before reaching break-even.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className={`text-lg font-bold font-mono ${(bepMetrics?.marginOfSafety || 0) >= 20 ? 'text-green-600' : (bepMetrics?.marginOfSafety || 0) >= 0 ? 'text-blue-600' : 'text-destructive'}`} data-testid="bep-margin-of-safety">
                      {(bepMetrics?.marginOfSafety || 0).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className={bepMetrics?.isProfitable ? "bg-gradient-to-r from-green-500/5 to-green-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
                  <CardContent className="pt-4">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <p className={`text-lg font-bold font-mono ${bepMetrics?.isProfitable ? 'text-green-600' : 'text-destructive'}`} data-testid="bep-status">
                      {bepMetrics?.isProfitable ? 'Profitable' : 'Below BEP'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* B. Collapsible Fixed Expenses Breakdown */}
              <Collapsible open={fixedExpensesOpen} onOpenChange={setFixedExpensesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" data-testid="button-toggle-fixed-expenses">
                    <span>Fixed Expenses Breakdown</span>
                    {fixedExpensesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount (SAR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bepMetrics?.fixedCostsBreakdown.map((item, index) => (
                        <TableRow key={index} data-testid={`fixed-expense-row-${index}`}>
                          <TableCell className="capitalize font-medium">{item.category}</TableCell>
                          <TableCell className="text-right font-mono">{item.amount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Total Fixed Costs</TableCell>
                        <TableCell className="text-right font-bold font-mono" data-testid="fixed-expenses-total">
                          {(bepMetrics?.fixedCosts || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CollapsibleContent>
              </Collapsible>

              {/* C. Cost Structure Section */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Cost Structure</p>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">Selling Price/Unit</span>
                    <p className="text-lg font-bold font-mono" data-testid="bep-selling-price-unit">
                      {(bepMetrics?.avgSellingPrice || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">Variable Cost/Unit</span>
                    <p className="text-lg font-bold font-mono" data-testid="bep-variable-cost-unit">
                      {(bepMetrics?.avgVariableCostPerUnit || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Contribution Margin/Unit</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-contribution-margin" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Amount each unit sold contributes to covering fixed costs.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold font-mono" data-testid="bep-contribution-margin-unit">
                      {(bepMetrics?.contributionMarginPerUnit || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">CM Ratio</span>
                    <p className="text-lg font-bold font-mono" data-testid="bep-cm-ratio">
                      {((bepMetrics?.contributionMarginRatio || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* D. Sensitivity Analysis Section */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Sensitivity Analysis</p>
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Selling Price Change</label>
                    <Select value={priceChange} onValueChange={setPriceChange} data-testid="select-price-change">
                      <SelectTrigger data-testid="select-price-change-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-20">-20%</SelectItem>
                        <SelectItem value="-10">-10%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">+10%</SelectItem>
                        <SelectItem value="20">+20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Variable Cost Change</label>
                    <Select value={variableCostChange} onValueChange={setVariableCostChange} data-testid="select-variable-cost-change">
                      <SelectTrigger data-testid="select-variable-cost-change-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-20">-20%</SelectItem>
                        <SelectItem value="-10">-10%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">+10%</SelectItem>
                        <SelectItem value="20">+20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Fixed Cost Change</label>
                    <Select value={fixedCostChange} onValueChange={setFixedCostChange} data-testid="select-fixed-cost-change">
                      <SelectTrigger data-testid="select-fixed-cost-change-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-20">-20%</SelectItem>
                        <SelectItem value="-10">-10%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">+10%</SelectItem>
                        <SelectItem value="20">+20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gradient-to-r from-green-500/5 to-green-600/10 border-green-500/20">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground font-medium text-green-600">Best Case</p>
                      <p className="text-sm text-muted-foreground">+20% Price, -20% Costs</p>
                      <p className="text-xl font-bold font-mono text-green-600 mt-2" data-testid="scenario-best-bep">
                        {(sensitivityScenarios.best?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10 border-blue-500/20">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground font-medium text-blue-600">Your Scenario</p>
                      <p className="text-sm text-muted-foreground">
                        {priceChange !== "0" && `${parseInt(priceChange) > 0 ? '+' : ''}${priceChange}% Price`}
                        {priceChange !== "0" && (variableCostChange !== "0" || fixedCostChange !== "0") && ", "}
                        {variableCostChange !== "0" && `${parseInt(variableCostChange) > 0 ? '+' : ''}${variableCostChange}% VC`}
                        {variableCostChange !== "0" && fixedCostChange !== "0" && ", "}
                        {fixedCostChange !== "0" && `${parseInt(fixedCostChange) > 0 ? '+' : ''}${fixedCostChange}% FC`}
                        {priceChange === "0" && variableCostChange === "0" && fixedCostChange === "0" && "No changes"}
                      </p>
                      <p className="text-xl font-bold font-mono text-blue-600 mt-2" data-testid="scenario-base-bep">
                        {(sensitivityScenarios.adjusted?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-red-500/5 to-red-600/10 border-red-500/20">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground font-medium text-red-600">Worst Case</p>
                      <p className="text-sm text-muted-foreground">-20% Price, +20% Costs</p>
                      <p className="text-xl font-bold font-mono text-red-600 mt-2" data-testid="scenario-worst-bep">
                        {(sensitivityScenarios.worst?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* E. Bar Chart for Scenario Comparison */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Scenario Comparison</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scenarioChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <RechartsTooltip 
                      formatter={(value: number) => `${value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                    />
                    <Bar dataKey="bepRevenue" name="BEP Revenue" radius={[4, 4, 0, 0]}>
                      {scenarioChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Lower BEP Revenue is better - means you need less sales to break even
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Expenses by Type Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Expenses by Type</CardTitle>
                <CardDescription>Recurring expenses breakdown (excludes one-time & foundational)</CardDescription>
              </CardHeader>
              <CardContent>
                {billTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={billTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {billTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toFixed(2)} SAR`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No expense data available</div>
                )}
              </CardContent>
            </Card>

            {/* Top Expenses by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Expenses Summary</CardTitle>
                <CardDescription>Recurring expenses by category (excludes one-time & foundational)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Inventory Value - Always show first */}
                  <div className="flex items-center justify-between bg-blue-500/5 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Inventory Value</span>
                    </div>
                    <span className="font-mono font-semibold text-blue-600">{totalInventoryValue.toFixed(2)} SAR</span>
                  </div>
                  {billTypeData.sort((a, b) => b.value - a.value).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium capitalize">{item.name}</span>
                      </div>
                      <span className="font-mono font-semibold">{item.value.toFixed(2)} SAR</span>
                    </div>
                  ))}
                  {billTypeData.length === 0 && totalInventoryValue === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No expenses recorded</div>
                  )}
                  {/* Total Line */}
                  <div className="flex items-center justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">Total Operating Expenses</span>
                    <span className="font-mono font-bold text-lg">{(recurringExpensesTotal + totalInventoryValue).toFixed(2)} SAR</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bills Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Expenses for {selectedYear}</CardTitle>
              <CardDescription>{billsForYear.length} expense records</CardDescription>
            </CardHeader>
            <CardContent>
              {billsForYear.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b pb-2">
                    <div>Type</div>
                    <div>Payment Date</div>
                    <div className="text-right">Amount</div>
                    <div>Period</div>
                    <div>Status</div>
                    <div className="truncate">Description</div>
                  </div>
                  {billsForYear.map((bill) => (
                    <div key={bill.id} className="grid grid-cols-6 gap-4 text-sm items-center hover-elevate p-2 rounded-md">
                      <div className="font-medium capitalize">{bill.billType}</div>
                      <div className="text-muted-foreground">{new Date(bill.paymentDate).toLocaleDateString()}</div>
                      <div className="text-right font-mono font-semibold">{parseFloat(bill.amount).toFixed(2)} SAR</div>
                      <div className="text-xs capitalize">{bill.paymentPeriod}</div>
                      <div>
                        <Badge variant={bill.status === "paid" ? "default" : bill.status === "overdue" ? "destructive" : "secondary"}>
                          {bill.status}
                        </Badge>
                      </div>
                      <div className="truncate text-muted-foreground text-xs">{bill.description || "-"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expenses recorded for {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery App Financial Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Delivery App Breakdown</CardTitle>
                    <CardDescription>Detailed financial performance by delivery app for {selectedYear}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {deliveryBreakdown && deliveryBreakdown.breakdown.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold">App</th>
                          <th className="text-right py-2 font-semibold">Orders</th>
                          <th className="text-right py-2 font-semibold">Sales</th>
                          <th className="text-right py-2 font-semibold">Revenue</th>
                          <th className="text-right py-2 font-semibold">Commission</th>
                          <th className="text-right py-2 font-semibold">Banking</th>
                          <th className="text-right py-2 font-semibold">Subsidy</th>
                          <th className="text-right py-2 font-semibold">Net Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryBreakdown.breakdown.map((app) => (
                          <tr key={app.id} className="border-b hover-elevate" data-testid={`delivery-breakdown-${app.id}`}>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{app.name}</span>
                                {!app.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                              </div>
                            </td>
                            <td className="text-right py-3 font-mono">{app.orders}</td>
                            <td className="text-right py-3 font-mono">{app.sales.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                            <td className="text-right py-3 font-mono">{app.revenue.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                            <td className="text-right py-3 font-mono text-destructive">-{app.commission.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                            <td className="text-right py-3 font-mono text-destructive">-{app.banking.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                            <td className="text-right py-3 font-mono text-green-600">+{app.subsidy.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                            <td className={`text-right py-3 font-mono font-bold ${app.netEarnings >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {app.netEarnings >= 0 ? '+' : ''}{app.netEarnings.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr className="font-bold">
                          <td className="py-3">Total</td>
                          <td className="text-right py-3 font-mono">{deliveryBreakdown.totals.orders}</td>
                          <td className="text-right py-3 font-mono">{deliveryBreakdown.totals.sales.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                          <td className="text-right py-3 font-mono">{deliveryBreakdown.totals.revenue.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                          <td className="text-right py-3 font-mono text-destructive">-{deliveryBreakdown.totals.commission.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                          <td className="text-right py-3 font-mono text-destructive">-{deliveryBreakdown.totals.banking.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                          <td className="text-right py-3 font-mono text-green-600">+{deliveryBreakdown.totals.subsidy.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</td>
                          <td className={`text-right py-3 font-mono font-bold ${deliveryBreakdown.totals.netEarnings >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {deliveryBreakdown.totals.netEarnings >= 0 ? '+' : ''}{deliveryBreakdown.totals.netEarnings.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Delivery Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                    <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                        <div className="text-2xl font-bold font-mono">{deliveryBreakdown.totals.orders}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-purple-500/5 to-purple-600/10">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Sales</div>
                        <div className="text-2xl font-bold font-mono">{deliveryBreakdown.totals.sales.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-red-500/5 to-red-600/10">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Fees</div>
                        <div className="text-2xl font-bold font-mono text-destructive">
                          -{(deliveryBreakdown.totals.commission + deliveryBreakdown.totals.banking + deliveryBreakdown.totals.posFees).toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR
                        </div>
                      </CardContent>
                    </Card>
                    <Card className={`bg-gradient-to-r ${deliveryBreakdown.totals.netEarnings >= 0 ? 'from-green-500/5 to-green-600/10' : 'from-red-500/5 to-red-600/10'}`}>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Net Earnings</div>
                        <div className={`text-2xl font-bold font-mono ${deliveryBreakdown.totals.netEarnings >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {deliveryBreakdown.totals.netEarnings >= 0 ? '+' : ''}{deliveryBreakdown.totals.netEarnings.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No delivery app orders for {selectedYear}</p>
                  <p className="text-xs mt-2">Orders placed through delivery apps will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ZATCA Compliant Invoices</CardTitle>
                  <CardDescription>All generated invoices with QR codes for Saudi Arabia compliance</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportAllInvoices} data-testid="button-export-all-invoices">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices generated yet</p>
                  <p className="text-sm">Invoices will appear here automatically when transactions are completed</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-4 font-medium text-sm border-b pb-2">
                    <div>Invoice #</div>
                    <div>Customer</div>
                    <div className="text-right">Subtotal</div>
                    <div className="text-right">VAT</div>
                    <div className="text-right">Total</div>
                    <div className="text-right">Date</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-7 gap-4 text-sm items-center hover-elevate p-2 rounded-md" data-testid={`invoice-${invoice.id}`}>
                      <div className="font-mono font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-muted-foreground">{invoice.customerName || "Walk-in"}</div>
                      <div className="text-right font-mono">{parseFloat(invoice.subtotal).toFixed(2)}</div>
                      <div className="text-right font-mono text-muted-foreground">{parseFloat(invoice.vatAmount).toFixed(2)}</div>
                      <div className="text-right font-mono font-medium">{parseFloat(invoice.total).toFixed(2)} SAR</div>
                      <div className="text-right text-muted-foreground text-xs">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
