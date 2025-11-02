import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Invoice } from "@shared/schema";

export default function Financial() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("monthly");

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

  if (financialLoading || invoicesLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
        <p className="text-muted-foreground">Loading financial data...</p>
      </div>
    );
  }

  const yearlyData = financialData?.yearly || { revenue: "0", vat: "0", transactions: 0, invoices: 0 };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Statements</h1>
          <p className="text-muted-foreground">Monthly and yearly financial reports with ZATCA VAT invoices</p>
        </div>
        <div className="flex gap-2">
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

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ZATCA Compliant Invoices</CardTitle>
                  <CardDescription>All generated invoices with QR codes for Saudi Arabia compliance</CardDescription>
                </div>
                <Button variant="outline">
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
                  <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b pb-2">
                    <div>Invoice #</div>
                    <div>Customer</div>
                    <div className="text-right">Subtotal</div>
                    <div className="text-right">VAT</div>
                    <div className="text-right">Total</div>
                    <div className="text-right">Date</div>
                  </div>
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-6 gap-4 text-sm items-center hover-elevate p-2 rounded-md" data-testid={`invoice-${invoice.id}`}>
                      <div className="font-mono font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-muted-foreground">{invoice.customerName || "Walk-in"}</div>
                      <div className="text-right font-mono">{parseFloat(invoice.subtotal).toFixed(2)}</div>
                      <div className="text-right font-mono text-muted-foreground">{parseFloat(invoice.vatAmount).toFixed(2)}</div>
                      <div className="text-right font-mono font-medium">{parseFloat(invoice.total).toFixed(2)} SAR</div>
                      <div className="text-right text-muted-foreground text-xs">
                        {new Date(invoice.createdAt).toLocaleDateString()}
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
