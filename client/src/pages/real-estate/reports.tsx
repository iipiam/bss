import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, fmtSar, REBreadcrumb, downloadBlob } from "./_shared";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

export default function ReportsPage() {
  const { toast } = useToast();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());

  const { data: income } = useQuery<any>({ queryKey: ["/api/real-estate/reports/income-statement", { from, to }], queryFn: () => fetch(`/api/real-estate/reports/income-statement?from=${from}&to=${to}`, { credentials: "include" }).then((r) => r.json()) });
  const { data: rentRoll } = useQuery<any>({ queryKey: ["/api/real-estate/reports/rent-roll"] });
  const { data: cashFlow } = useQuery<any>({ queryKey: ["/api/real-estate/reports/cash-flow", { from, to }], queryFn: () => fetch(`/api/real-estate/reports/cash-flow?from=${from}&to=${to}`, { credentials: "include" }).then((r) => r.json()) });
  const { data: balanceSheet } = useQuery<any>({ queryKey: ["/api/real-estate/reports/balance-sheet"] });
  const { data: aging } = useQuery<any>({ queryKey: ["/api/real-estate/reports/aging-receivables"] });
  const { data: occupancy } = useQuery<any>({ queryKey: ["/api/real-estate/reports/occupancy"] });

  const dlPdf = (type: string) => {
    const qs = ["income-statement", "cash-flow"].includes(type) ? `?from=${from}&to=${to}` : "";
    downloadBlob(`/api/real-estate/reports/${type}/pdf${qs}`, `${type}.pdf`).catch((e) => toast({ title: "PDF error", description: e.message, variant: "destructive" }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Reports" subtitle="Financial & operational reports" />

      <Card className="mb-4"><CardContent className="p-4 flex flex-row gap-3 items-end flex-wrap">
        <div><label className="text-xs">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="input-from" /></div>
        <div><label className="text-xs">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="input-to" /></div>
      </CardContent></Card>

      <Tabs defaultValue="income">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="income" data-testid="tab-income">Income Statement</TabsTrigger>
          <TabsTrigger value="cash" data-testid="tab-cash">Cash Flow</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="rent-roll" data-testid="tab-rent-roll">Rent Roll</TabsTrigger>
          <TabsTrigger value="aging" data-testid="tab-aging">Aging Receivables</TabsTrigger>
          <TabsTrigger value="occupancy" data-testid="tab-occupancy">Occupancy</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card><CardHeader className="flex flex-row items-center justify-between gap-2"><span className="font-semibold">Income Statement</span>
            <Button size="sm" variant="outline" onClick={() => dlPdf("income-statement")}><Download className="w-4 h-4 mr-1" />PDF</Button></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-muted-foreground">Revenue</div><div className="text-xl font-semibold text-emerald-600">{fmtSar(income?.totalRevenue)}</div></div>
                <div><div className="text-xs text-muted-foreground">Expenses</div><div className="text-xl font-semibold text-rose-600">{fmtSar(income?.totalExpenses)}</div></div>
                <div><div className="text-xs text-muted-foreground">Net Operating Income</div><div className="text-xl font-semibold">{fmtSar(income?.noi)}</div></div>
              </div>
              {Array.isArray(income?.expensesByCategory) && income.expensesByCategory.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold mb-2">Expenses by Category</div>
                  <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>{income.expensesByCategory.map((row: any) => (
                      <TableRow key={row.category}><TableCell className="capitalize">{row.category}</TableCell><TableCell className="text-right">{fmtSar(row.amount)}</TableCell></TableRow>
                    ))}</TableBody></Table>
                </div>
              )}
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card><CardHeader className="flex flex-row items-center justify-between gap-2"><span className="font-semibold">Cash Flow</span>
            <Button size="sm" variant="outline" onClick={() => dlPdf("cash-flow")}><Download className="w-4 h-4 mr-1" />PDF</Button></CardHeader>
            <CardContent>
              {(() => {
                const series = (cashFlow?.series || []) as Array<{ month: string; cashIn: number; cashOut: number; net: number; runningBalance: number }>;
                const cIn = series.reduce((a, b) => a + Number(b.cashIn || 0), 0);
                const cOut = series.reduce((a, b) => a + Number(b.cashOut || 0), 0);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div><div className="text-xs text-muted-foreground">Cash In</div><div className="text-xl font-semibold text-emerald-600">{fmtSar(cIn)}</div></div>
                      <div><div className="text-xs text-muted-foreground">Cash Out</div><div className="text-xl font-semibold text-rose-600">{fmtSar(cOut)}</div></div>
                      <div><div className="text-xs text-muted-foreground">Net</div><div className="text-xl font-semibold">{fmtSar(cIn - cOut)}</div></div>
                    </div>
                    {series.length > 0 && (
                      <div className="mt-6">
                        <Table>
                          <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Cash In</TableHead><TableHead className="text-right">Cash Out</TableHead><TableHead className="text-right">Net</TableHead><TableHead className="text-right">Running</TableHead></TableRow></TableHeader>
                          <TableBody>{series.map((m) => (
                            <TableRow key={m.month}><TableCell>{m.month}</TableCell><TableCell className="text-right">{fmtSar(m.cashIn)}</TableCell><TableCell className="text-right">{fmtSar(m.cashOut)}</TableCell><TableCell className="text-right">{fmtSar(m.net)}</TableCell><TableCell className="text-right">{fmtSar(m.runningBalance)}</TableCell></TableRow>
                          ))}</TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card><CardHeader className="flex flex-row items-center justify-between gap-2"><span className="font-semibold">Balance Sheet</span>
            <Button size="sm" variant="outline" onClick={() => dlPdf("balance-sheet")}><Download className="w-4 h-4 mr-1" />PDF</Button></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-muted-foreground">Assets</div><div className="text-xl font-semibold">{fmtSar(balanceSheet?.assets?.total)}</div></div>
                <div><div className="text-xs text-muted-foreground">Liabilities</div><div className="text-xl font-semibold">{fmtSar(balanceSheet?.liabilities?.total)}</div></div>
                <div><div className="text-xs text-muted-foreground">Equity</div><div className="text-xl font-semibold">{fmtSar(balanceSheet?.equity)}</div></div>
              </div>
              {balanceSheet?.assets && (
                <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="font-semibold mb-2">Assets</div>
                    <div className="flex justify-between"><span>Property Value</span><span>{fmtSar(balanceSheet.assets.propertyValue)}</span></div>
                    <div className="flex justify-between"><span>Receivables</span><span>{fmtSar(balanceSheet.assets.receivables)}</span></div>
                    <div className="flex justify-between"><span>Cash on Hand</span><span>{fmtSar(balanceSheet.assets.cashOnHand)}</span></div>
                    <div className="flex justify-between"><span>Bank</span><span>{fmtSar(balanceSheet.assets.bank)}</span></div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Liabilities</div>
                    <div className="flex justify-between"><span>Security Deposits</span><span>{fmtSar(balanceSheet.liabilities?.securityDeposits)}</span></div>
                    <div className="flex justify-between"><span>VAT Payable</span><span>{fmtSar(balanceSheet.liabilities?.vatPayable)}</span></div>
                  </div>
                </div>
              )}
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="rent-roll">
          <Card><CardHeader className="flex flex-row items-center justify-between gap-2"><span className="font-semibold">Rent Roll</span>
            <Button size="sm" variant="outline" onClick={() => dlPdf("rent-roll")}><Download className="w-4 h-4 mr-1" />PDF</Button></CardHeader>
            <CardContent className="p-0"><Table>
              <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Tenant</TableHead><TableHead>Monthly Rent</TableHead><TableHead>End Date</TableHead></TableRow></TableHeader>
              <TableBody>{(Array.isArray(rentRoll) ? rentRoll : []).map((r: any, i: number) => (
                <TableRow key={i}><TableCell>{r.unitNumber}</TableCell><TableCell>{r.tenantName || "—"}</TableCell><TableCell>{fmtSar(r.monthlyRent)}</TableCell><TableCell>{r.endDate || "—"}</TableCell></TableRow>
              ))}</TableBody>
            </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card><CardHeader><span className="font-semibold">Aging Receivables</span></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div><div className="text-xs text-muted-foreground">Current</div><div className="text-lg font-semibold">{fmtSar(aging?.buckets?.current)}</div></div>
                <div><div className="text-xs text-muted-foreground">1-30 days</div><div className="text-lg font-semibold text-amber-600">{fmtSar(aging?.buckets?.d30)}</div></div>
                <div><div className="text-xs text-muted-foreground">31-60 days</div><div className="text-lg font-semibold text-orange-600">{fmtSar(aging?.buckets?.d60)}</div></div>
                <div><div className="text-xs text-muted-foreground">61-90 days</div><div className="text-lg font-semibold text-rose-600">{fmtSar(aging?.buckets?.d90)}</div></div>
                <div><div className="text-xs text-muted-foreground">90+ days</div><div className="text-lg font-semibold text-rose-700">{fmtSar(aging?.buckets?.d90plus)}</div></div>
              </div>
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card><CardHeader><span className="font-semibold">Occupancy</span></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-xs text-muted-foreground">Total Units</div><div className="text-xl font-semibold">{occupancy?.overall?.totalUnits ?? 0}</div></div>
                <div><div className="text-xs text-muted-foreground">Rented</div><div className="text-xl font-semibold text-emerald-600">{occupancy?.overall?.rentedUnits ?? 0}</div></div>
                <div><div className="text-xs text-muted-foreground">Rate</div><div className="text-xl font-semibold">{occupancy?.overall?.occupancyPct != null ? `${Number(occupancy.overall.occupancyPct).toFixed(1)}%` : "—"}</div></div>
              </div>
              {Array.isArray(occupancy?.byProperty) && occupancy.byProperty.length > 0 && (
                <div className="mt-6">
                  <Table>
                    <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Rented</TableHead><TableHead className="text-right">Occupancy</TableHead></TableRow></TableHeader>
                    <TableBody>{occupancy.byProperty.map((p: any, i: number) => (
                      <TableRow key={i}><TableCell>{p.name}</TableCell><TableCell className="capitalize">{p.type}</TableCell><TableCell className="text-right">{p.units}</TableCell><TableCell className="text-right">{p.rented}</TableCell><TableCell className="text-right">{Number(p.occupancyPct || 0).toFixed(1)}%</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </div>
              )}
            </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
