import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { PageHeader, fmtSar, REBreadcrumb, useRET } from "./_shared";
import { localizedCategory, localizedStatus } from "@/i18n/realEstateTranslations";

type ReportType = "income-statement" | "cash-flow" | "balance-sheet" | "rent-roll" | "aging-receivables" | "occupancy";

export default function RealEstateReports() {
  const t = useRET();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const download = async (type: ReportType, format: "pdf" | "excel") => {
    const usesRange = type === "income-statement" || type === "cash-flow";
    const qs = usesRange ? `?from=${from}&to=${to}` : "";
    const res = await fetch(`/api/real-estate/reports/${type}/${format}${qs}`, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${today}.${format === "excel" ? "xlsx" : "pdf"}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const ExportButtons = ({ type }: { type: ReportType }) => (
    <div className="flex gap-2 justify-end mb-3">
      <Button variant="outline" size="sm" onClick={() => download(type, "excel")} data-testid={`button-export-excel-${type}`}>
        <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => download(type, "pdf")} data-testid={`button-export-pdf-${type}`}>
        <FileDown className="h-4 w-4 mr-1" /> PDF
      </Button>
    </div>
  );

  const { data: income } = useQuery<any>({ queryKey: ["/api/real-estate/reports/income-statement", from, to], queryFn: async () => (await fetch(`/api/real-estate/reports/income-statement?from=${from}&to=${to}`)).json() });
  const { data: cashFlow } = useQuery<any>({ queryKey: ["/api/real-estate/reports/cash-flow", from, to], queryFn: async () => (await fetch(`/api/real-estate/reports/cash-flow?from=${from}&to=${to}`)).json() });
  const { data: balance } = useQuery<any>({ queryKey: ["/api/real-estate/reports/balance-sheet"] });
  const { data: rentRoll = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/reports/rent-roll"] });
  const { data: aging } = useQuery<any>({ queryKey: ["/api/real-estate/reports/aging"] });
  const { data: occupancy } = useQuery<any>({ queryKey: ["/api/real-estate/reports/occupancy"] });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.reports} subtitle={t.reportsSubtitle} actions={
        <div className="flex flex-row gap-2 items-center">
          <label className="text-sm">{t.from}</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" data-testid="input-from" />
          <label className="text-sm">{t.to}</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" data-testid="input-to" />
        </div>
      } />

      <Tabs defaultValue="income">
        <TabsList className="flex-wrap">
          <TabsTrigger value="income">{t.incomeStatement}</TabsTrigger>
          <TabsTrigger value="cashflow">{t.cashFlow}</TabsTrigger>
          <TabsTrigger value="balance">{t.balanceSheet}</TabsTrigger>
          <TabsTrigger value="rentroll">{t.rentRoll}</TabsTrigger>
          <TabsTrigger value="aging">{t.agingReceivables}</TabsTrigger>
          <TabsTrigger value="occupancy">{t.occupancy}</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <ExportButtons type="income-statement" />
          <Card><CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div><div className="text-sm text-muted-foreground">{t.revenue}</div><div className="text-2xl font-semibold text-emerald-600">{fmtSar(income?.totalRevenue || 0)}</div></div>
              <div><div className="text-sm text-muted-foreground">{t.expensesTotal}</div><div className="text-2xl font-semibold text-rose-600">{fmtSar(income?.totalExpenses || 0)}</div></div>
              <div><div className="text-sm text-muted-foreground">{t.netOperatingIncome}</div><div className="text-2xl font-semibold">{fmtSar(income?.netIncome || 0)}</div></div>
            </div>
            {income?.expensesByCategory && (
              <div>
                <h3 className="font-medium mt-4 mb-2">{t.expensesByCategory}</h3>
                <Table><TableHeader><TableRow><TableHead>{t.category}</TableHead><TableHead className="text-right">{t.amount}</TableHead></TableRow></TableHeader>
                  <TableBody>{Object.entries(income.expensesByCategory).map(([k, v]: any) => <TableRow key={k}><TableCell>{localizedCategory(t, k)}</TableCell><TableCell className="text-right">{fmtSar(v)}</TableCell></TableRow>)}</TableBody>
                </Table>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <ExportButtons type="cash-flow" />
          <Card><CardContent className="p-6">
            <div className="flex flex-wrap justify-between gap-4 mb-4">
              <div><div className="text-sm text-muted-foreground">{t.cashIn}</div><div className="text-xl font-semibold text-emerald-600">{fmtSar(cashFlow?.totalIn || 0)}</div></div>
              <div><div className="text-sm text-muted-foreground">{t.cashOut}</div><div className="text-xl font-semibold text-rose-600">{fmtSar(cashFlow?.totalOut || 0)}</div></div>
              <div><div className="text-sm text-muted-foreground">{t.net}</div><div className="text-xl font-semibold">{fmtSar(cashFlow?.net || 0)}</div></div>
            </div>
            <Table><TableHeader><TableRow><TableHead>{t.month}</TableHead><TableHead className="text-right">{t.cashIn}</TableHead><TableHead className="text-right">{t.cashOut}</TableHead><TableHead className="text-right">{t.net}</TableHead><TableHead className="text-right">{t.running}</TableHead></TableRow></TableHeader>
              <TableBody>{(cashFlow?.monthly || []).map((m: any) => <TableRow key={m.month}><TableCell>{m.month}</TableCell><TableCell className="text-right text-emerald-600">{fmtSar(m.in)}</TableCell><TableCell className="text-right text-rose-600">{fmtSar(m.out)}</TableCell><TableCell className="text-right">{fmtSar(m.net)}</TableCell><TableCell className="text-right">{fmtSar(m.running)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="balance">
          <ExportButtons type="balance-sheet" />
          <Card><CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><h3 className="font-semibold mb-2">{t.assets}</h3><div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>{t.propertyValue}</span><span>{fmtSar(balance?.assets?.propertyValue || 0)}</span></div>
                <div className="flex justify-between"><span>{t.cashOnHand}</span><span>{fmtSar(balance?.assets?.cash || 0)}</span></div>
                <div className="flex justify-between"><span>{t.bank}</span><span>{fmtSar(balance?.assets?.bank || 0)}</span></div>
                <div className="flex justify-between"><span>{t.receivables}</span><span>{fmtSar(balance?.assets?.receivables || 0)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>{t.total}</span><span>{fmtSar(balance?.assets?.total || 0)}</span></div>
              </div></div>
              <div><h3 className="font-semibold mb-2">{t.liabilities}</h3><div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>{t.securityDeposits}</span><span>{fmtSar(balance?.liabilities?.deposits || 0)}</span></div>
                <div className="flex justify-between"><span>{t.vatPayable}</span><span>{fmtSar(balance?.liabilities?.vatPayable || 0)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>{t.total}</span><span>{fmtSar(balance?.liabilities?.total || 0)}</span></div>
              </div></div>
              <div><h3 className="font-semibold mb-2">{t.equity}</h3><div className="space-y-1 text-sm">
                <div className="flex justify-between font-semibold"><span>{t.total}</span><span>{fmtSar(balance?.equity?.total || 0)}</span></div>
              </div></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="rentroll">
          <ExportButtons type="rent-roll" />
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>{t.unit}</TableHead><TableHead>{t.tenant}</TableHead><TableHead className="text-right">{t.monthlyRent}</TableHead><TableHead>{t.startDate}</TableHead><TableHead>{t.endDate}</TableHead><TableHead>{t.statusLabel}</TableHead></TableRow></TableHeader>
              <TableBody>{rentRoll.map((r: any) => <TableRow key={r.contractId}><TableCell>{r.unitNumber}</TableCell><TableCell>{r.tenantName}</TableCell><TableCell className="text-right">{fmtSar(r.monthlyRent)}</TableCell><TableCell>{r.startDate?.slice(0, 10)}</TableCell><TableCell>{r.endDate?.slice(0, 10)}</TableCell><TableCell>{localizedStatus(t, r.status)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="aging">
          <ExportButtons type="aging-receivables" />
          <Card><CardContent className="p-6">
            <div className="grid grid-cols-5 gap-3">
              {[
                ["current", t.current], ["d30", t.d30], ["d60", t.d60], ["d90", t.d90], ["d90plus", t.d90plus],
              ].map(([k, label]) => (
                <Card key={k} className="text-center"><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{label}</span></CardHeader><CardContent><div className="text-lg font-semibold">{fmtSar(aging?.[k] || 0)}</div></CardContent></Card>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <ExportButtons type="occupancy" />
          <Card><CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.totalUnits}</span></CardHeader><CardContent><div className="text-2xl font-semibold">{occupancy?.total || 0}</div></CardContent></Card>
              <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.rentedCol}</span></CardHeader><CardContent><div className="text-2xl font-semibold text-emerald-600">{occupancy?.rented || 0}</div></CardContent></Card>
              <Card><CardHeader className="pb-1"><span className="text-xs text-muted-foreground">{t.rate}</span></CardHeader><CardContent><div className="text-2xl font-semibold">{occupancy?.rate != null ? `${Number(occupancy.rate).toFixed(1)}%` : "—"}</div></CardContent></Card>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
