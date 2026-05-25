import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, fmtSar, fmtDate, REBreadcrumb } from "./_shared";

export default function AccountingPage() {
  const { toast } = useToast();
  const { data: coa = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/accounting/coa"] });
  const { data: journal = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/accounting/journal"] });
  const { data: trialBalanceRaw } = useQuery<any>({ queryKey: ["/api/real-estate/accounting/trial-balance"] });
  const tbRows: any[] = Array.isArray(trialBalanceRaw) ? trialBalanceRaw : (trialBalanceRaw?.rows || []);
  const tbTotals = tbRows.reduce((acc, r) => ({ debit: acc.debit + Number(r.debit || 0), credit: acc.credit + Number(r.credit || 0) }), { debit: 0, credit: 0 });

  const ensureMut = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/real-estate/accounting/coa/ensure", {}); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/accounting/coa"] }); toast({ title: "Chart of accounts ensured" }); },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Accounting" subtitle="Double-entry chart of accounts, journal, and trial balance" actions={
        <Button onClick={() => ensureMut.mutate()} disabled={ensureMut.isPending} data-testid="button-ensure-coa">Initialize Standard COA</Button>
      } />

      <Tabs defaultValue="coa">
        <TabsList>
          <TabsTrigger value="coa" data-testid="tab-coa">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal" data-testid="tab-journal">Journal</TabsTrigger>
          <TabsTrigger value="tb" data-testid="tab-tb">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="coa">
          <Card><CardContent className="p-0"><Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Name (AR)</TableHead><TableHead>Type</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {coa.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No accounts. Click "Initialize Standard COA".</TableCell></TableRow>}
              {coa.sort((a: any, b: any) => String(a.code).localeCompare(String(b.code))).map((a: any) => (
                <TableRow key={a.id} data-testid={`row-coa-${a.code}`}>
                  <TableCell className="font-mono">{a.code}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell dir="rtl">{a.nameAr || "—"}</TableCell>
                  <TableCell className="capitalize">{a.type}</TableCell>
                  <TableCell>{a.isActive ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="journal">
          <Card><CardContent className="p-0"><Table>
            <TableHeader><TableRow><TableHead>Entry #</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
            <TableBody>
              {journal.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No journal entries</TableCell></TableRow>}
              {journal.map((j: any) => (
                <TableRow key={j.id} data-testid={`row-journal-${j.id}`}>
                  <TableCell className="font-mono">{j.entryNumber}</TableCell>
                  <TableCell>{fmtDate(j.entryDate)}</TableCell>
                  <TableCell>{j.description}</TableCell>
                  <TableCell className="text-xs">{j.referenceType ? `${j.referenceType}#${String(j.referenceId).slice(0, 8)}` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="tb">
          <Card>
            <CardHeader className="font-semibold">Trial Balance</CardHeader>
            <CardContent className="p-0"><Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
              <TableBody>
                {tbRows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No data</TableCell></TableRow>}
                {tbRows.map((r: any, i: number) => (
                  <TableRow key={i}><TableCell className="font-mono">{r.accountCode}</TableCell><TableCell>{r.accountName}</TableCell><TableCell className="text-right">{fmtSar(r.debit)}</TableCell><TableCell className="text-right">{fmtSar(r.credit)}</TableCell></TableRow>
                ))}
                {tbRows.length > 0 && (
                  <TableRow className="font-semibold border-t">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{fmtSar(tbTotals.debit)}</TableCell>
                    <TableCell className="text-right">{fmtSar(tbTotals.credit)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
