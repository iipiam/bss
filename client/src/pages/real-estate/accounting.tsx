import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileDown, FileSpreadsheet, Download } from "lucide-react";
import { PageHeader, fmtSar, fmtDate, REBreadcrumb, useRET } from "./_shared";
import { localizedAccountType } from "@/i18n/realEstateTranslations";

export default function AccountingPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: accounts = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/accounting/coa"] });
  const { data: entries = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/accounting/journal"] });
  const { data: trialBalance = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/accounting/trial-balance"] });

  const downloadExport = async (type: "coa" | "journal" | "trial-balance", format: "pdf" | "excel") => {
    try {
      const res = await fetch(`/api/real-estate/accounting/${type}/export?format=${format}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: t.error, description: e.message, variant: "destructive" });
    }
  };

  const downloadEntryPdf = async (entry: any) => {
    try {
      const res = await fetch(`/api/real-estate/accounting/journal/${entry.id}/export`, { credentials: "include" });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journal-${entry.entryNumber || entry.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: t.error, description: e.message, variant: "destructive" });
    }
  };

  const ExportButtons = ({ type }: { type: "coa" | "journal" | "trial-balance" }) => (
    <div className="flex gap-2 p-3 border-b">
      <Button size="sm" variant="outline" onClick={() => downloadExport(type, "pdf")} data-testid={`button-export-${type}-pdf`}>
        <FileDown className="w-4 h-4 mr-1" />{t.exportPdf || "Export PDF"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => downloadExport(type, "excel")} data-testid={`button-export-${type}-excel`}>
        <FileSpreadsheet className="w-4 h-4 mr-1" />{t.exportExcel || "Export Excel"}
      </Button>
    </div>
  );

  const seedMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/real-estate/accounting/coa/ensure"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/accounting/coa"] });
      toast({ title: t.chartEnsured });
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.accounting} subtitle={t.accountingSubtitle} actions={
        accounts.length === 0 ? (
          <Button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} data-testid="button-seed-chart"><Plus className="w-4 h-4 mr-1" />{t.initializeStandardCoa}</Button>
        ) : null
      } />

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">{t.chartOfAccounts}</TabsTrigger>
          <TabsTrigger value="journal">{t.journal}</TabsTrigger>
          <TabsTrigger value="tb">{t.trialBalance}</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card><CardContent className="p-0">
            <ExportButtons type="coa" />
            <Table>
              <TableHeader><TableRow><TableHead>{t.code}</TableHead><TableHead>{t.name}</TableHead><TableHead>{t.nameAr}</TableHead><TableHead>{t.typeLabel}</TableHead><TableHead>{t.active}</TableHead></TableRow></TableHeader>
              <TableBody>
                {accounts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">{t.noAccountsHint}</TableCell></TableRow>}
                {accounts.map((a: any) => (
                  <TableRow key={a.id} data-testid={`row-account-${a.code}`}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.nameAr || "—"}</TableCell>
                    <TableCell>{localizedAccountType(t, a.type)}</TableCell>
                    <TableCell>{a.isActive ? t.active_yes : t.active_no}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="journal">
          <Card><CardContent className="p-0">
            <ExportButtons type="journal" />
            <Table>
              <TableHeader><TableRow><TableHead>{t.entryNumber}</TableHead><TableHead>{t.dateLabel}</TableHead><TableHead>{t.descriptionLabel}</TableHead><TableHead>{t.reference}</TableHead><TableHead className="text-right">{t.total}</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
              <TableBody>
                {entries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t.noJournalEntries}</TableCell></TableRow>}
                {entries.map((e: any) => (
                  <TableRow key={e.id} data-testid={`row-entry-${e.id}`}>
                    <TableCell className="font-mono">{e.entryNumber}</TableCell>
                    <TableCell>{fmtDate(e.entryDate)}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.reference || "—"}</TableCell>
                    <TableCell className="text-right">{fmtSar(e.totalDebit)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => downloadEntryPdf(e)} data-testid={`button-pdf-entry-${e.id}`} title={t.exportPdf || "Export PDF"}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tb">
          <Card><CardContent className="p-0">
            <ExportButtons type="trial-balance" />
            <Table>
              <TableHeader><TableRow><TableHead>{t.account}</TableHead><TableHead>{t.typeLabel}</TableHead><TableHead className="text-right">{t.debit}</TableHead><TableHead className="text-right">{t.credit}</TableHead></TableRow></TableHeader>
              <TableBody>
                {trialBalance.map((r: any) => (
                  <TableRow key={r.code} data-testid={`row-tb-${r.code}`}>
                    <TableCell><span className="font-mono">{r.code}</span> — {r.name}</TableCell>
                    <TableCell>{localizedAccountType(t, r.type)}</TableCell>
                    <TableCell className="text-right">{fmtSar(r.debit)}</TableCell>
                    <TableCell className="text-right">{fmtSar(r.credit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
