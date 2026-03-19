import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Receipt, FileDown, Wallet, Target, Radio, Truck, Package, ChevronDown, ChevronUp, HelpCircle, Calculator, BarChart3, Scale, ArrowDownUp } from "lucide-react";
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
    
    // Safe parsing with NaN fallback to 0
    const safeParseFloat = (val: string): number => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    // Get base values with safe defaults (use 1 for prices to avoid division by zero)
    const basePrice = bepMetrics.avgSellingPrice || 1;
    const baseVC = bepMetrics.avgVariableCostPerUnit || 0;
    const baseFC = bepMetrics.fixedCosts || 0;
    
    const priceMultiplier = 1 + safeParseFloat(priceChange) / 100;
    const variableMultiplier = 1 + safeParseFloat(variableCostChange) / 100;
    const fixedMultiplier = 1 + safeParseFloat(fixedCostChange) / 100;
    
    const adjustedPrice = basePrice * priceMultiplier;
    const adjustedVariableCost = baseVC * variableMultiplier;
    const adjustedFixedCosts = baseFC * fixedMultiplier;
    
    const adjustedCM = adjustedPrice - adjustedVariableCost;
    const adjustedCMRatio = adjustedPrice > 0 ? adjustedCM / adjustedPrice : 0;
    
    const adjustedBepUnits = adjustedCM > 0 ? Math.ceil(adjustedFixedCosts / adjustedCM) : 0;
    const adjustedBepRevenue = adjustedCMRatio > 0 ? adjustedFixedCosts / adjustedCMRatio : 0;
    
    // Best case: +20% price, -20% costs
    const bestPrice = basePrice * 1.2;
    const bestVC = baseVC * 0.8;
    const bestFC = baseFC * 0.8;
    const bestCM = bestPrice - bestVC;
    const bestCMRatio = bestPrice > 0 ? bestCM / bestPrice : 0;
    const bestBepRevenue = bestCMRatio > 0 ? bestFC / bestCMRatio : 0;
    
    // Worst case: -20% price, +20% costs
    const worstPrice = basePrice * 0.8;
    const worstVC = baseVC * 1.2;
    const worstFC = baseFC * 1.2;
    const worstCM = worstPrice - worstVC;
    const worstCMRatio = worstPrice > 0 ? worstCM / worstPrice : 0;
    const worstBepRevenue = worstCMRatio > 0 ? worstFC / worstCMRatio : 0;
    
    // Ensure all values are valid numbers (not NaN or Infinity)
    const safeValue = (val: number): number => {
      return isNaN(val) || !isFinite(val) ? 0 : val;
    };
    
    return {
      best: { bepRevenue: safeValue(bestBepRevenue), label: (t as any).bestCase || "Best Case" },
      base: { bepRevenue: safeValue(adjustedBepRevenue), label: (t as any).yourScenario || "Your Scenario" },
      worst: { bepRevenue: safeValue(worstBepRevenue), label: (t as any).worstCase || "Worst Case" },
      adjusted: {
        price: safeValue(adjustedPrice),
        variableCost: safeValue(adjustedVariableCost),
        fixedCosts: safeValue(adjustedFixedCosts),
        contributionMargin: safeValue(adjustedCM),
        contributionMarginRatio: safeValue(adjustedCMRatio),
        bepUnits: safeValue(adjustedBepUnits),
        bepRevenue: safeValue(adjustedBepRevenue),
      }
    };
  }, [bepMetrics, priceChange, variableCostChange, fixedCostChange]);

  const scenarioChartData = useMemo(() => {
    if (!sensitivityScenarios.best || !sensitivityScenarios.base || !sensitivityScenarios.worst) return [];
    return [
      { name: (t as any).bestCase || "Best Case", bepRevenue: sensitivityScenarios.best.bepRevenue, fill: "hsl(142, 76%, 36%)" },
      { name: (t as any).yourScenario || "Your Scenario", bepRevenue: sensitivityScenarios.base.bepRevenue, fill: "hsl(199, 89%, 48%)" },
      { name: (t as any).worstCase || "Worst Case", bepRevenue: sensitivityScenarios.worst.bepRevenue, fill: "hsl(0, 84%, 60%)" },
    ];
  }, [sensitivityScenarios]);

  if (financialLoading || invoicesLoading || billsLoading || inventoryLoading || deliveryLoading || bepLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">{t.financialStatements}</h1>
        <p className="text-muted-foreground">{t.loadingFinancialData}</p>
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
        description: (t as any).financialDataExportedToExcel || "Financial data exported to Excel",
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
        description: (t as any).financialStatementExportedToPdf || "Financial statement exported to PDF",
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
        title: (t as any).downloadSuccessful || "Download Successful",
        description: `${(t as any).invoice || "Invoice"} ${invoiceNumber} ${(t as any).downloaded || "downloaded"}`,
      });
    } catch (error) {
      toast({
        title: (t as any).downloadFailed || "Download Failed",
        description: error instanceof Error ? error.message : ((t as any).failedToDownloadInvoice || "Failed to download invoice"),
        variant: "destructive",
      });
    }
  };

  const handleExportAllInvoices = async () => {
    if (invoices.length === 0) {
      toast({
        title: (t as any).noInvoices || "No invoices",
        description: (t as any).noInvoicesAvailable || "No invoices available to export",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: (t as any).exportingInvoices || "Exporting invoices",
      description: `${(t as any).downloading || "Downloading"} ${invoices.length} ${(t as any).invoiceCount || "invoice(s)"}...`,
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
        title: t.pdfExportSuccessful,
        description: `${(t as any).expensesReportFor || "Expenses report for"} ${selectedYear} ${(t as any).exportedToPdf || "exported to PDF"}`,
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : ((t as any).failedToExportExpensesPdf || "Failed to export expenses PDF"),
        variant: "destructive",
      });
    }
  };

  const handleExportStatementPDF = async (type: 'income-statement' | 'balance-sheet' | 'cash-flow') => {
    const titles: Record<string, string> = {
      'income-statement': (t as any).incomeStatement || 'Income Statement',
      'balance-sheet': (t as any).balanceSheet || 'Balance Sheet',
      'cash-flow': (t as any).cashFlowStatement || 'Cash Flow Statement',
    };
    try {
      const response = await fetch(`/api/export/${type}-pdf?year=${selectedYear}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t.pdfExportSuccessful,
        description: `${titles[type]} ${(t as any).exportedToPdf || "exported to PDF"}`,
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: error instanceof Error ? error.message : ((t as any).failedToExportPdf || "Failed to export PDF"),
        variant: "destructive",
      });
    }
  };

  const cogs = bepMetrics?.cogsTotal || 0;
  const grossProfit = totalRevenue - cogs;
  const operatingExpenses = billsForYear.filter(b => b.billType !== 'foundational').reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
  const operatingIncome = grossProfit - operatingExpenses;
  const vatPayable = totalRevenue * 0.15;
  const netIncome = operatingIncome;

  const expensesByCategory = billsForYear.reduce((acc, bill) => {
    const cat = bill.billType || 'other';
    acc[cat] = (acc[cat] || 0) + parseFloat(bill.amount || "0");
    return acc;
  }, {} as Record<string, number>);

  const totalAssets = totalRevenue + totalInventoryValue;
  const totalLiabilities = vatPayable + pendingBillsAmount;
  const ownersEquity = totalAssets - totalLiabilities;

  const cashFromOperations = netIncome + totalInventoryValue - pendingBillsAmount;
  const cashFromInvesting = -(inventoryItems.reduce((s, i) => s + parseFloat(i.price || "0"), 0));
  const netCashFlow = cashFromOperations + cashFromInvesting;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.financialStatements}</h1>
          <p className="text-muted-foreground">{t.financialDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            {(t as any).exportExcel || "Export Excel"}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            {(t as any).exportPdf || "Export PDF"}
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
            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{parseFloat(yearlyData.revenue).toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{t.year} {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.vatCollected}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{parseFloat(yearlyData.vat).toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{(t as any).saudiVat15 || "15% Saudi VAT"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.transactions}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{yearlyData.transactions}</div>
            <p className="text-xs text-muted-foreground">{t.totalSales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.invoicesGenerated}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{yearlyData.invoices}</div>
            <p className="text-xs text-muted-foreground">{(t as any).zatcaCompliant || "ZATCA compliant"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="statements" data-testid="tab-statements">{t.financialStatements}</TabsTrigger>
          <TabsTrigger value="income-statement" data-testid="tab-income-statement">{(t as any).incomeStatement || "Income Statement"}</TabsTrigger>
          <TabsTrigger value="balance-sheet" data-testid="tab-balance-sheet">{(t as any).balanceSheet || "Balance Sheet"}</TabsTrigger>
          <TabsTrigger value="cash-flow" data-testid="tab-cash-flow">{(t as any).cashFlowStatement || "Cash Flow"}</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">{t.expenses}</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">{t.zatcaInvoices}</TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-4">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).monthlyRevenueAndVat || "Monthly Revenue & VAT"}</CardTitle>
              <CardDescription>{(t as any).revenueAndVatBreakdown || "Revenue and VAT collection breakdown for"} {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={financialData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name={`${t.totalRevenue} (SAR)`} />
                  <Bar dataKey="vat" fill="hsl(var(--chart-2))" name={`${t.vatCollected} (SAR)`} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Transactions Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).monthlyTransactions || "Monthly Transactions"}</CardTitle>
              <CardDescription>{(t as any).transactionsPerMonth || "Number of transactions per month in"} {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={financialData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} name={(t as any).transactions || "Transactions"} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).monthlyBreakdown || "Monthly Breakdown"}</CardTitle>
              <CardDescription>{(t as any).detailedMonthlyData || "Detailed monthly financial data"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
                  <div>{(t as any).month || "Month"}</div>
                  <div className="text-right">{t.totalRevenue}</div>
                  <div className="text-right">{t.vatCollected}</div>
                  <div className="text-right">{(t as any).transactions || "Transactions"}</div>
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
              {(t as any).exportPdf || "Export PDF"}
            </Button>
          </div>
          
          {/* Expense Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalExpensesWithInventory.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{(t as any).billsPlusInventory || "Bills + Inventory"} ({selectedYear})</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).inventoryValue || "Inventory Value"}</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-blue-600" data-testid="expense-inventory-value">{totalInventoryValue.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{inventoryItems.length} {(t as any).itemsInStock || "items in stock"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidBills}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">{paidBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((paidBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% {(t as any).ofBills || "of bills"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.pendingBills}</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-orange-600">{pendingBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((pendingBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% {(t as any).ofBills || "of bills"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).monthlyOperatingExpenses || "Monthly Operating Expenses"}</CardTitle>
              <CardDescription>{(t as any).recurringExpensesByMonth || "Recurring expenses by month for"} {selectedYear} {(t as any).excludesOneTimeFoundational || "(excludes one-time & foundational)"}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyBillsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: number | string) => `${Number(value).toFixed(2)} SAR`} />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} name={`${t.totalExpenses} (SAR)`} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            {/* BEP Calculator Section */}
            {bepMetrics && (
              <Card className="bg-gradient-to-r from-teal-500/5 to-cyan-600/10">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle>{t.bepCalculator}</CardTitle>
                        <CardDescription>{t.breakEvenPointAnalysis} {(t as any).forWord || "for"} {selectedYear}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={bepMetrics.isProfitable ? "default" : "destructive"} data-testid="bep-status-badge">
                        {bepMetrics.isProfitable ? t.profitable : t.unprofitable}
                      </Badge>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                        <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-600">{(t as any).live || "Live"}</span>
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
                          <span className="text-xs text-muted-foreground">{t.fixedCosts}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-fixed-costs" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{(t as any).fixedCostsTooltip || "Recurring expenses like rent, salaries, utilities. Excludes one-time and foundational costs."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-bold font-mono text-green-600" data-testid="bep-fixed-costs">
                          {bepMetrics.fixedCosts.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500/5 to-orange-600/10">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{(t as any).variableCosts || "Variable Costs"}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-variable-costs" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{(t as any).variableCostsTooltip || "Cost of goods sold (COGS) based on recipes and ingredients used."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-bold font-mono text-orange-600" data-testid="bep-variable-costs">
                          {bepMetrics.cogsTotal.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{(t as any).bepUnits || "BEP Units"}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-bep" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{(t as any).bepUnitsTooltip || "Sales needed to cover all costs. Above this = profit, below = loss."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-bold font-mono text-teal-600" data-testid="bep-units">
                          {bepMetrics.bepUnits.toLocaleString("en-SA")} {(t as any).units || "units"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10">
                      <CardContent className="pt-4">
                        <span className="text-xs text-muted-foreground">{t.bepRevenue}</span>
                        <p className="text-lg font-bold font-mono text-teal-600" data-testid="bep-revenue">
                          {bepMetrics.bepRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <span className="text-xs text-muted-foreground">{t.currentRevenue}</span>
                        <p className="text-lg font-bold font-mono" data-testid="bep-current-revenue">
                          {bepMetrics.revenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={bepMetrics.marginOfSafety >= 0 ? "bg-gradient-to-r from-blue-500/5 to-blue-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{t.marginOfSafety}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-margin-of-safety" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{(t as any).marginOfSafetyTooltip || "How much revenue can drop before reaching break-even."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p
                          className={`text-lg font-bold font-mono ${
                            bepMetrics.marginOfSafety >= 20
                              ? "text-green-600"
                              : bepMetrics.marginOfSafety >= 0
                              ? "text-blue-600"
                              : "text-destructive"
                          }`}
                          data-testid="bep-margin-of-safety"
                        >
                          {bepMetrics.marginOfSafety.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={bepMetrics.isProfitable ? "bg-gradient-to-r from-green-500/5 to-green-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
                      <CardContent className="pt-4">
                        <span className="text-xs text-muted-foreground">{t.status}</span>
                        <p className={`text-lg font-bold font-mono ${bepMetrics.isProfitable ? "text-green-600" : "text-destructive"}`} data-testid="bep-status">
                          {bepMetrics.isProfitable ? t.profitable : t.belowBep}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* B. Collapsible Fixed Expenses Breakdown */}
                  <Collapsible open={fixedExpensesOpen} onOpenChange={setFixedExpensesOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between" data-testid="button-toggle-fixed-expenses">
                        <span>{t.fixedExpensesBreakdown}</span>
                        {fixedExpensesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      {bepMetrics.fixedCostsBreakdown && bepMetrics.fixedCostsBreakdown.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.category}</TableHead>
                              <TableHead className="text-right">{t.amount} (SAR)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bepMetrics.fixedCostsBreakdown.map((item, index) => (
                              <TableRow key={index} data-testid={`fixed-expense-row-${index}`}>
                                <TableCell className="capitalize font-medium">{item.category}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {item.amount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell className="font-bold">{t.totalFixedCosts}</TableCell>
                              <TableCell className="text-right font-bold font-mono" data-testid="fixed-expenses-total">
                                {bepMetrics.fixedCosts.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">{(t as any).noFixedExpensesBreakdown || "No fixed expenses breakdown available"}</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* C. Cost Structure Section */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">{t.costStructure}</p>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground">{(t as any).sellingPricePerUnit || "Selling Price/Unit"}</span>
                        <p className="text-lg font-bold font-mono" data-testid="bep-selling-price-unit">
                          {bepMetrics.avgSellingPrice.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground">{(t as any).variableCostPerUnit || "Variable Cost/Unit"}</span>
                        <p className="text-lg font-bold font-mono" data-testid="bep-variable-cost-unit">
                          {bepMetrics.avgVariableCostPerUnit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{(t as any).contributionMarginPerUnit || "Contribution Margin/Unit"}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" data-testid="tooltip-contribution-margin" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{(t as any).contributionMarginTooltip || "Amount each unit sold contributes to covering fixed costs."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-bold font-mono" data-testid="bep-contribution-margin-unit">
                          {bepMetrics.contributionMarginPerUnit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                      </div>
                      <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground">{t.cmRatio}</span>
                        <p className="text-lg font-bold font-mono" data-testid="bep-cm-ratio">
                          {((bepMetrics.contributionMarginRatio || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* D. Sensitivity Analysis Section */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">{(t as any).sensitivityAnalysis || "Sensitivity Analysis"}</p>
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">{(t as any).sellingPriceChange || "Selling Price Change"}</label>
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
                        <label className="text-xs text-muted-foreground">{(t as any).variableCostChange || "Variable Cost Change"}</label>
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
                        <label className="text-xs text-muted-foreground">{(t as any).fixedCostChange || "Fixed Cost Change"}</label>
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
                          <p className="text-xs text-muted-foreground font-medium text-green-600">{(t as any).bestCase || "Best Case"}</p>
                          <p className="text-sm text-muted-foreground">{(t as any).bestCaseDesc || "+20% Price, -20% Costs"}</p>
                          <p className="text-xl font-bold font-mono text-green-600 mt-2" data-testid="scenario-best-bep">
                            {(sensitivityScenarios.best?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10 border-blue-500/20">
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium text-blue-600">{(t as any).yourScenario || "Your Scenario"}</p>
                          <p className="text-sm text-muted-foreground">
                            {priceChange !== "0" && `${parseInt(priceChange) > 0 ? "+" : ""}${priceChange}% Price`}
                            {priceChange !== "0" && (variableCostChange !== "0" || fixedCostChange !== "0") && ", "}
                            {variableCostChange !== "0" && `${parseInt(variableCostChange) > 0 ? "+" : ""}${variableCostChange}% VC`}
                            {variableCostChange !== "0" && fixedCostChange !== "0" && ", "}
                            {fixedCostChange !== "0" && `${parseInt(fixedCostChange) > 0 ? "+" : ""}${fixedCostChange}% FC`}
                            {priceChange === "0" && variableCostChange === "0" && fixedCostChange === "0" && ((t as any).noChanges || "No changes")}
                          </p>
                          <p className="text-xl font-bold font-mono text-blue-600 mt-2" data-testid="scenario-base-bep">
                            {(sensitivityScenarios.adjusted?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-red-500/5 to-red-600/10 border-red-500/20">
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground font-medium text-red-600">{(t as any).worstCase || "Worst Case"}</p>
                          <p className="text-sm text-muted-foreground">{(t as any).worstCaseDesc || "-20% Price, +20% Costs"}</p>
                          <p className="text-xl font-bold font-mono text-red-600 mt-2" data-testid="scenario-worst-bep">
                            {(sensitivityScenarios.worst?.bepRevenue || 0).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* E. Bar Chart for Scenario Comparison */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">{(t as any).scenarioComparison || "Scenario Comparison"}</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scenarioChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                        <RechartsTooltip
                          formatter={(value: number) =>
                            `${value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`
                          }
                        />
                        <Bar dataKey="bepRevenue" name={t.bepRevenue} radius={[4, 4, 0, 0]}>
                          {scenarioChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {(t as any).lowerBepBetter || "Lower BEP Revenue is better - means you need less sales to break even"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Expenses by Type Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{(t as any).operatingExpensesByType || "Operating Expenses by Type"}</CardTitle>
                <CardDescription>{(t as any).recurringExpensesBreakdown || "Recurring expenses breakdown (excludes one-time & foundational)"}</CardDescription>
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
                      <RechartsTooltip formatter={(value: number | string) => `${Number(value).toFixed(2)} SAR`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">{t.noExpenseData}</div>
                )}
              </CardContent>
            </Card>

            {/* Top Expenses by Type */}
            <Card>
              <CardHeader>
                <CardTitle>{(t as any).operatingExpensesSummary || "Operating Expenses Summary"}</CardTitle>
                <CardDescription>{(t as any).recurringExpensesByCategory || "Recurring expenses by category (excludes one-time & foundational)"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Inventory Value - Always show first */}
                  <div className="flex items-center justify-between bg-blue-500/5 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{(t as any).inventoryValue || "Inventory Value"}</span>
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
                    <div className="text-center py-8 text-muted-foreground">{(t as any).noExpensesRecorded || "No expenses recorded"}</div>
                  )}
                  {/* Total Line */}
                  <div className="flex items-center justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">{(t as any).totalOperatingExpenses || "Total Operating Expenses"}</span>
                    <span className="font-mono font-bold text-lg">{(recurringExpensesTotal + totalInventoryValue).toFixed(2)} SAR</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Bills Table */}
          <Card>
            <CardHeader>
              <CardTitle>{(t as any).allExpensesFor || "All Expenses for"} {selectedYear}</CardTitle>
              <CardDescription>{billsForYear.length} {(t as any).expenseRecords || "expense records"}</CardDescription>
            </CardHeader>
            <CardContent>
              {billsForYear.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b pb-2">
                    <div>{(t as any).type || "Type"}</div>
                    <div>{(t as any).paymentDate || "Payment Date"}</div>
                    <div className="text-right">{t.amount}</div>
                    <div>{(t as any).period || "Period"}</div>
                    <div>{t.status}</div>
                    <div className="truncate">{t.description}</div>
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
                  <p>{(t as any).noExpensesRecordedFor || "No expenses recorded for"} {selectedYear}</p>
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
                    <CardTitle>{(t as any).deliveryAppBreakdown || "Delivery App Breakdown"}</CardTitle>
                    <CardDescription>{(t as any).detailedFinancialPerformance || "Detailed financial performance by delivery app for"} {selectedYear}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  {(t as any).live || "Live"}
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
                          <th className="text-left py-2 font-semibold">{(t as any).app || "App"}</th>
                          <th className="text-right py-2 font-semibold">{(t as any).orders || "Orders"}</th>
                          <th className="text-right py-2 font-semibold">{t.totalSales}</th>
                          <th className="text-right py-2 font-semibold">{t.totalRevenue}</th>
                          <th className="text-right py-2 font-semibold">{(t as any).commissionLabel || "Commission"}</th>
                          <th className="text-right py-2 font-semibold">{(t as any).banking || "Banking"}</th>
                          <th className="text-right py-2 font-semibold">{(t as any).subsidyLabel || "Subsidy"}</th>
                          <th className="text-right py-2 font-semibold">{(t as any).netEarnings || "Net Earnings"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryBreakdown.breakdown.map((app) => (
                          <tr key={app.id} className="border-b hover-elevate" data-testid={`delivery-breakdown-${app.id}`}>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{app.name}</span>
                                {!app.active && <Badge variant="secondary" className="text-xs">{t.inactive}</Badge>}
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
                          <td className="py-3">{(t as any).total || "Total"}</td>
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
                        <div className="text-sm text-muted-foreground">{t.totalOrders}</div>
                        <div className="text-2xl font-bold font-mono">{deliveryBreakdown.totals.orders}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-purple-500/5 to-purple-600/10">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">{t.totalSales}</div>
                        <div className="text-2xl font-bold font-mono">{deliveryBreakdown.totals.sales.toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-red-500/5 to-red-600/10">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">{(t as any).totalFees || "Total Fees"}</div>
                        <div className="text-2xl font-bold font-mono text-destructive">
                          -{(deliveryBreakdown.totals.commission + deliveryBreakdown.totals.banking + deliveryBreakdown.totals.posFees).toLocaleString("en-SA", { minimumFractionDigits: 2 })} SAR
                        </div>
                      </CardContent>
                    </Card>
                    <Card className={`bg-gradient-to-r ${deliveryBreakdown.totals.netEarnings >= 0 ? 'from-green-500/5 to-green-600/10' : 'from-red-500/5 to-red-600/10'}`}>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">{(t as any).netEarnings || "Net Earnings"}</div>
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
                  <p>{(t as any).noDeliveryAppOrders || "No delivery app orders for"} {selectedYear}</p>
                  <p className="text-xs mt-2">{(t as any).deliveryOrdersWillAppear || "Orders placed through delivery apps will appear here"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement (Profit & Loss) */}
        <TabsContent value="income-statement" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => handleExportStatementPDF('income-statement')} data-testid="button-export-income-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              {(t as any).exportPdf || "Export PDF"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>{(t as any).incomeStatement || "Income Statement"} ({(t as any).profitAndLoss || "Profit & Loss"})</CardTitle>
                  <CardDescription>{(t as any).forThePeriodEnding || "For the period ending"} {(t as any).december || "December"} 31, {selectedYear}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">{(t as any).description || "Description"}</TableHead>
                    <TableHead className="text-right">{t.amount} (SAR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{t.totalRevenue}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base">{totalRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).salesRevenue || "Sales Revenue"}</TableCell>
                    <TableCell className="text-right font-mono">{totalRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).costOfGoodsSold || "Cost of Goods Sold (COGS)"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base text-destructive">({cogs.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</TableCell>
                  </TableRow>

                  <TableRow className="bg-green-500/5">
                    <TableCell className="font-bold text-lg">{(t as any).grossProfit || "Gross Profit"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-lg ${grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {grossProfit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground text-sm">{(t as any).grossMargin || "Gross Margin"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).operatingExpensesLabel || "Operating Expenses"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base text-destructive">({operatingExpenses.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</TableCell>
                  </TableRow>
                  {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                    <TableRow key={cat}>
                      <TableCell className="pl-8 text-muted-foreground capitalize">{cat}</TableCell>
                      <TableCell className="text-right font-mono">{amount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).operatingIncome || "Operating Income"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-base ${operatingIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {operatingIncome.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold text-lg">{(t as any).netIncome || "Net Income"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-net-income">
                      {netIncome.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className={grossProfit >= 0 ? "bg-gradient-to-r from-green-500/5 to-green-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).grossProfit || "Gross Profit"}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-gross-profit">
                  {grossProfit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
                <p className="text-xs text-muted-foreground">{(t as any).grossMargin || "Gross Margin"}: {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).operatingExpensesLabel || "Operating Expenses"}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-destructive" data-testid="text-operating-expenses">
                  {operatingExpenses.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
                <p className="text-xs text-muted-foreground">{Object.keys(expensesByCategory).length} {(t as any).categories || "categories"}</p>
              </CardContent>
            </Card>

            <Card className={netIncome >= 0 ? "bg-gradient-to-r from-blue-500/5 to-blue-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).netIncome || "Net Income"}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-net-income-card">
                  {netIncome.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
                <p className="text-xs text-muted-foreground">{(t as any).netMargin || "Net Margin"}: {totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0'}%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => handleExportStatementPDF('balance-sheet')} data-testid="button-export-balance-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              {(t as any).exportPdf || "Export PDF"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{(t as any).balanceSheet || "Balance Sheet"}</CardTitle>
                  <CardDescription>{(t as any).asOf || "As of"} {(t as any).december || "December"} 31, {selectedYear}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">{(t as any).account || "Account"}</TableHead>
                    <TableHead className="text-right">{t.amount} (SAR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).assets || "Assets"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base"></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/20">
                    <TableCell className="pl-4 font-semibold">{(t as any).currentAssets || "Current Assets"}</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).cashAndRevenue || "Cash & Revenue"}</TableCell>
                    <TableCell className="text-right font-mono">{totalRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).inventoryValue || "Inventory"}</TableCell>
                    <TableCell className="text-right font-mono">{totalInventoryValue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-blue-500/10">
                    <TableCell className="font-bold text-base">{(t as any).totalAssets || "Total Assets"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base" data-testid="text-total-assets">
                      {totalAssets.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="mt-6" />

              <Table>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base w-[60%]">{(t as any).liabilities || "Liabilities"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base"></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/20">
                    <TableCell className="pl-4 font-semibold">{(t as any).currentLiabilities || "Current Liabilities"}</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).vatPayable || "VAT Payable (15%)"}</TableCell>
                    <TableCell className="text-right font-mono">{vatPayable.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).accountsPayable || "Accounts Payable (Pending Bills)"}</TableCell>
                    <TableCell className="text-right font-mono">{pendingBillsAmount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-orange-500/10">
                    <TableCell className="font-bold text-base">{(t as any).totalLiabilities || "Total Liabilities"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base" data-testid="text-total-liabilities">
                      {totalLiabilities.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="mt-6" />

              <Table>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base w-[60%]">{(t as any).ownersEquity || "Owner's Equity"}</TableCell>
                    <TableCell className="text-right font-bold font-mono text-base"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).retainedEarnings || "Retained Earnings"}</TableCell>
                    <TableCell className={`text-right font-mono ${ownersEquity >= 0 ? '' : 'text-destructive'}`}>{ownersEquity.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-green-500/10">
                    <TableCell className="font-bold text-base">{(t as any).totalEquity || "Total Equity"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-base ${ownersEquity >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-total-equity">
                      {ownersEquity.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-r from-blue-500/5 to-blue-600/10">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).totalAssets || "Total Assets"}</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="text-total-assets-card">{totalAssets.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-500/5 to-orange-600/10">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).totalLiabilities || "Total Liabilities"}</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-orange-600" data-testid="text-total-liabilities-card">{totalLiabilities.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</div>
              </CardContent>
            </Card>
            <Card className={ownersEquity >= 0 ? "bg-gradient-to-r from-green-500/5 to-green-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).ownersEquity || "Owner's Equity"}</CardTitle>
                <Scale className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${ownersEquity >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-equity-card">{ownersEquity.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cash-flow" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => handleExportStatementPDF('cash-flow')} data-testid="button-export-cashflow-pdf">
              <FileDown className="h-4 w-4 mr-2" />
              {(t as any).exportPdf || "Export PDF"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <ArrowDownUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>{(t as any).cashFlowStatement || "Cash Flow Statement"}</CardTitle>
                  <CardDescription>{(t as any).forThePeriodEnding || "For the period ending"} {(t as any).december || "December"} 31, {selectedYear}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">{(t as any).description || "Description"}</TableHead>
                    <TableHead className="text-right">{t.amount} (SAR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).operatingActivities || "Operating Activities"}</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).netIncome || "Net Income"}</TableCell>
                    <TableCell className={`text-right font-mono ${netIncome >= 0 ? '' : 'text-destructive'}`}>{netIncome.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).inventoryAdjustments || "Inventory Adjustments"}</TableCell>
                    <TableCell className="text-right font-mono">+{totalInventoryValue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).accountsPayableChange || "Change in Accounts Payable"}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">-{pendingBillsAmount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-500/5">
                    <TableCell className="font-semibold pl-4">{(t as any).netCashFromOperations || "Net Cash from Operations"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono ${cashFromOperations >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {cashFromOperations.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30">
                    <TableCell className="font-bold text-base">{(t as any).investingActivities || "Investing Activities"}</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">{(t as any).inventoryPurchases || "Inventory Purchases"}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{cashFromInvesting.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow className="bg-purple-500/5">
                    <TableCell className="font-semibold pl-4">{(t as any).netCashFromInvesting || "Net Cash from Investing"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono ${cashFromInvesting >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {cashFromInvesting.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold text-lg">{(t as any).netCashFlow || "Net Cash Flow"}</TableCell>
                    <TableCell className={`text-right font-bold font-mono text-lg ${netCashFlow >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-net-cash-flow">
                      {netCashFlow.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className={cashFromOperations >= 0 ? "bg-gradient-to-r from-blue-500/5 to-blue-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).operatingActivities || "Operating Activities"}</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${cashFromOperations >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-cash-operations">
                  {cashFromOperations.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
              </CardContent>
            </Card>
            <Card className={cashFromInvesting >= 0 ? "bg-gradient-to-r from-purple-500/5 to-purple-600/10" : "bg-gradient-to-r from-orange-500/5 to-orange-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).investingActivities || "Investing Activities"}</CardTitle>
                <ArrowDownUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${cashFromInvesting >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-cash-investing">
                  {cashFromInvesting.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
              </CardContent>
            </Card>
            <Card className={netCashFlow >= 0 ? "bg-gradient-to-r from-green-500/5 to-green-600/10" : "bg-gradient-to-r from-red-500/5 to-red-600/10"}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{(t as any).netCashFlow || "Net Cash Flow"}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${netCashFlow >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="text-net-cash-flow-card">
                  {netCashFlow.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{(t as any).zatcaCompliantInvoices || "ZATCA Compliant Invoices"}</CardTitle>
                  <CardDescription>{(t as any).allGeneratedInvoices || "All generated invoices with QR codes for Saudi Arabia compliance"}</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportAllInvoices} data-testid="button-export-all-invoices">
                  <Download className="h-4 w-4 mr-2" />
                  {(t as any).exportAll || "Export All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{(t as any).noInvoicesGenerated || "No invoices generated yet"}</p>
                  <p className="text-sm">{(t as any).invoicesWillAppear || "Invoices will appear here automatically when transactions are completed"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-4 font-medium text-sm border-b pb-2">
                    <div>{(t as any).invoiceNumber || "Invoice #"}</div>
                    <div>{t.customer}</div>
                    <div className="text-right">{(t as any).subtotal || "Subtotal"}</div>
                    <div className="text-right">{t.vatCollected}</div>
                    <div className="text-right">{(t as any).total || "Total"}</div>
                    <div className="text-right">{t.date}</div>
                    <div className="text-right">{t.actions}</div>
                  </div>
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-7 gap-4 text-sm items-center hover-elevate p-2 rounded-md" data-testid={`invoice-${invoice.id}`}>
                      <div className="font-mono font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-muted-foreground">{invoice.customerName || ((t as any).walkIn || "Walk-in")}</div>
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
