import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Receipt, FileDown, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { Invoice, ShopBill } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

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

  if (financialLoading || invoicesLoading || billsLoading) {
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

  // Group bills by type for pie chart
  const billsByType = billsForYear.reduce((acc, bill) => {
    const type = bill.billType;
    acc[type] = (acc[type] || 0) + parseFloat(bill.amount || "0");
    return acc;
  }, {} as Record<string, number>);

  const billTypeData = Object.entries(billsByType).map(([name, value]) => ({ name, value }));

  // Colors for pie chart
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Group bills by month for line chart (sorted chronologically)
  const billsByMonthMap = billsForYear.reduce((acc, bill) => {
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
        title: "Export successful",
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
        title: "PDF export successful",
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
        title: "Download successful",
        description: `Invoice ${invoiceNumber} downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
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
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{totalBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">Year {selectedYear}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">{paidBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((paidBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% of total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-orange-600">{pendingBillsAmount.toFixed(2)} SAR</div>
                <p className="text-xs text-muted-foreground">{((pendingBillsAmount / totalBillsAmount) * 100 || 0).toFixed(1)}% of total</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses</CardTitle>
              <CardDescription>Operating expenses by month for {selectedYear}</CardDescription>
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Expenses by Type Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Type</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
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
                <CardTitle>Expenses Summary</CardTitle>
                <CardDescription>Total by expense category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billTypeData.sort((a, b) => b.value - a.value).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium capitalize">{item.name}</span>
                      </div>
                      <span className="font-mono font-semibold">{item.value.toFixed(2)} SAR</span>
                    </div>
                  ))}
                  {billTypeData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No expenses recorded</div>
                  )}
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
