import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Receipt, FileDown, Wallet, Target, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { Invoice, ShopBill, InventoryItem } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package } from "lucide-react";

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

  if (financialLoading || invoicesLoading || billsLoading || inventoryLoading) {
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

  // Calculate total inventory value
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + parseFloat(item.price || "0"), 0);

  // Total expenses including inventory
  const totalExpensesWithInventory = totalBillsAmount + totalInventoryValue;

  // Break Even Point (BEP) Calculation
  // Fixed Costs = Operating Bills (rent, utilities, salaries, etc.)
  // Variable Costs = Inventory/COGS
  // Revenue = Total Sales
  const totalRevenue = parseFloat(yearlyData.revenue || "0");
  const fixedCosts = totalBillsAmount; // Operating expenses
  const variableCosts = totalInventoryValue; // COGS approximation
  
  // Calculate total units sold from invoices for the selected year
  const invoicesForYear = invoices.filter((inv) => {
    const invYear = new Date(inv.createdAt || "").getFullYear();
    return invYear === parseInt(selectedYear);
  });
  const totalUnitsSold = invoicesForYear.reduce((sum, inv) => {
    const items = inv.items as Array<{ quantity: number }> || [];
    return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
  }, 0);
  
  // Per-unit calculations
  const sellingPricePerUnit = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;
  const variableCostPerUnit = totalUnitsSold > 0 ? variableCosts / totalUnitsSold : 0;
  const contributionMarginPerUnit = sellingPricePerUnit - variableCostPerUnit;
  
  // Contribution Margin = Revenue - Variable Costs
  const contributionMargin = totalRevenue - variableCosts;
  // Contribution Margin Ratio = Contribution Margin / Revenue
  const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;
  
  // BEP in Units = Fixed Costs / Contribution Margin per Unit
  const bepInUnits = contributionMarginPerUnit > 0 ? Math.ceil(fixedCosts / contributionMarginPerUnit) : 0;
  // BEP in Revenue = Fixed Costs / Contribution Margin Ratio
  const bepInRevenue = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;
  
  // Margin of Safety = (Current Revenue - BEP Revenue) / Current Revenue * 100%
  const marginOfSafety = totalRevenue > 0 ? ((totalRevenue - bepInRevenue) / totalRevenue) * 100 : 0;
  
  // Current position relative to BEP
  const revenueVsBep = totalRevenue - bepInRevenue;
  const bepProgress = bepInRevenue > 0 ? (totalRevenue / bepInRevenue) * 100 : 0;
  
  // BEP Chart Data - showing revenue levels vs costs
  const maxRevenue = Math.max(totalRevenue * 1.5, bepInRevenue * 1.5, 10000);
  const bepChartData = [
    { revenue: 0, totalCosts: fixedCosts, totalRevenue: 0, label: '0' },
    { revenue: maxRevenue * 0.25, totalCosts: fixedCosts + (variableCostPerUnit * (maxRevenue * 0.25 / sellingPricePerUnit || 0)), totalRevenue: maxRevenue * 0.25, label: `${(maxRevenue * 0.25 / 1000).toFixed(0)}K` },
    { revenue: bepInRevenue, totalCosts: fixedCosts + variableCosts * (bepInRevenue / totalRevenue || 0), totalRevenue: bepInRevenue, label: 'BEP', isBep: true },
    { revenue: maxRevenue * 0.75, totalCosts: fixedCosts + (variableCostPerUnit * (maxRevenue * 0.75 / sellingPricePerUnit || 0)), totalRevenue: maxRevenue * 0.75, label: `${(maxRevenue * 0.75 / 1000).toFixed(0)}K` },
    { revenue: maxRevenue, totalCosts: fixedCosts + (variableCostPerUnit * (maxRevenue / sellingPricePerUnit || 0)), totalRevenue: maxRevenue, label: `${(maxRevenue / 1000).toFixed(0)}K` },
  ].sort((a, b) => a.revenue - b.revenue);

  // Filter out one-time payments and foundational bills for recurring expenses analysis
  const recurringBillsForYear = billsForYear.filter(bill => 
    bill.paymentPeriod !== "one-time" && bill.billType !== "foundational"
  );

  // Group recurring bills by type for pie chart (excludes one-time & foundational)
  const billsByType = recurringBillsForYear.reduce((acc, bill) => {
    const type = bill.billType;
    acc[type] = (acc[type] || 0) + parseFloat(bill.amount || "0");
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
  
  // Calculate recurring expenses total (for summary display)
  const recurringExpensesTotal = recurringBillsForYear.reduce((sum, bill) => sum + parseFloat(bill.amount || "0"), 0);

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
        title: t.downloadSuccessful,
        description: `Invoice ${invoiceNumber} downloaded`,
      });
    } catch (error) {
      toast({
        title: t.downloadFailed,
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

          {/* Break Even Point (BEP) Analysis */}
          <Card className="bg-gradient-to-r from-purple-500/5 to-purple-600/10">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>BEP (Break Even Point) Analysis</CardTitle>
                    <CardDescription>Complete break-even analysis for {selectedYear}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-600">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* BEP Summary - Main Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1 p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">BEP in Revenue</p>
                  <p className="text-xl font-bold font-mono text-purple-600" data-testid="bep-revenue">
                    {bepInRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </p>
                </div>
                <div className="space-y-1 p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">BEP in Units</p>
                  <p className="text-xl font-bold font-mono text-purple-600" data-testid="bep-units">
                    {bepInUnits.toLocaleString("en-SA")} units
                  </p>
                </div>
                <div className="space-y-1 p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Revenue</p>
                  <p className="text-xl font-bold font-mono">
                    {totalRevenue.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </p>
                </div>
                <div className="space-y-1 p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className={`text-xl font-bold font-mono ${revenueVsBep >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="bep-status">
                    {revenueVsBep >= 0 ? 'Profitable' : 'Below BEP'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Break Even</span>
                  <span className="font-semibold">{Math.min(bepProgress, 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${bepProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                    style={{ width: `${Math.min(bepProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* BEP Graph */}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-3">Break-Even Chart</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={bepChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`}
                      labelFormatter={(label) => label === 'BEP' ? 'Break-Even Point' : `Revenue: ${label} SAR`}
                    />
                    <Line type="monotone" dataKey="totalRevenue" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Revenue" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="totalCosts" stroke="hsl(var(--destructive))" strokeWidth={2} name="Total Costs" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Where Revenue (blue) crosses Total Costs (red) = Break-Even Point
                </p>
              </div>

              {/* Cost & Margin Details */}
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                {/* Fixed & Variable Costs */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Cost Structure</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fixed Costs (Bills)</span>
                      <span className="font-mono font-medium">{fixedCosts.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Variable Costs (Total)</span>
                      <span className="font-mono font-medium">{variableCosts.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Variable Cost per Unit</span>
                      <span className="font-mono font-medium">{variableCostPerUnit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selling Price per Unit</span>
                      <span className="font-mono font-medium">{sellingPricePerUnit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                  </div>
                </div>

                {/* Contribution Margin */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Contribution Margin</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contribution Margin (Total)</span>
                      <span className="font-mono font-medium">{contributionMargin.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contribution Margin per Unit</span>
                      <span className="font-mono font-medium">{contributionMarginPerUnit.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contribution Margin Ratio</span>
                      <span className="font-mono font-medium">{(contributionMarginRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Units Sold</span>
                      <span className="font-mono font-medium">{totalUnitsSold.toLocaleString("en-SA")} units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Margin of Safety */}
              <div className={`p-3 rounded-md ${marginOfSafety >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Margin of Safety</span>
                    <p className="text-xs text-muted-foreground">How much revenue can drop before reaching BEP</p>
                  </div>
                  <span className={`text-lg font-bold font-mono ${marginOfSafety >= 20 ? 'text-green-600' : marginOfSafety >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {marginOfSafety.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Profit/Loss indicator */}
              <div className={`p-3 rounded-md ${revenueVsBep >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{revenueVsBep >= 0 ? 'Profit Above BEP' : 'Amount Below BEP'}</span>
                  <span className={`text-lg font-bold font-mono ${revenueVsBep >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {revenueVsBep >= 0 ? '+' : ''}{revenueVsBep.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </span>
                </div>
              </div>

              {/* Assumptions */}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Assumptions</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Fixed Costs = All bills (rent, utilities, salaries, etc.) for {selectedYear}</li>
                  <li>Variable Costs = Total inventory value (COGS approximation)</li>
                  <li>Selling Price per Unit = Total Revenue / Total Units Sold</li>
                  <li>Variable Cost per Unit = Total Variable Costs / Total Units Sold</li>
                  <li>BEP in Units = Fixed Costs / (Selling Price - Variable Cost per Unit)</li>
                  <li>BEP in Revenue = Fixed Costs / Contribution Margin Ratio</li>
                  <li>Margin of Safety = (Revenue - BEP Revenue) / Revenue × 100%</li>
                </ul>
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
