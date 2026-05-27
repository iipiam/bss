import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileDown, DollarSign } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, downloadBlob, useRET } from "./_shared";
import { localizedMethod, localizedStatus } from "@/i18n/realEstateTranslations";

const METHODS = ["bank_transfer","cash","cheque","online"];

export default function InvoicesPage() {
  const t = useRET();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: invoices = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/invoices"] });
  const [payOpen, setPayOpen] = useState<any>(null);
  const [payForm, setPayForm] = useState<any>({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "bank_transfer", referenceNumber: "", bankName: "" });

  const payMut = useMutation({
    mutationFn: async ({ invoiceId, payload }: any) => {
      await apiRequest("POST", `/api/real-estate/invoices/${invoiceId}/mark-paid`, {
        ...payload, amount: sarToHalala(payload.amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/payments"] });
      toast({ title: t.paymentRecorded });
      setPayOpen(null);
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const downloadPdf = async (id: string) => {
    try { await downloadBlob(`/api/real-estate/invoices/${id}/pdf`, `invoice-${id}.pdf`); }
    catch (e: any) { toast({ title: t.pdfError, description: e.message, variant: "destructive" }); }
  };

  const filtered = statusFilter === "all" ? invoices : invoices.filter((i: any) => i.status === statusFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.rentalInvoices} subtitle={t.invoicesSubtitle} actions={
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            {["pending","paid","partial","overdue","cancelled"].map((s) => <SelectItem key={s} value={s}>{localizedStatus(t, s)}</SelectItem>)}
          </SelectContent>
        </Select>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.invoiceNumber}</TableHead><TableHead>{t.issued}</TableHead><TableHead>{t.due}</TableHead>
                <TableHead>{t.total}</TableHead><TableHead>{t.paidCol}</TableHead>
                <TableHead>{t.statusLabel}</TableHead><TableHead className="w-32">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t.noInvoices}</TableCell></TableRow>}
              {filtered.map((inv: any) => (
                <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                  <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell>{fmtSar(inv.totalAmount)}</TableCell>
                  <TableCell>{fmtSar(inv.amountPaid || 0)}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => downloadPdf(inv.id)} data-testid={`button-pdf-${inv.id}`}><FileDown className="w-4 h-4" /></Button>
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <Button size="icon" variant="ghost" onClick={() => { setPayOpen(inv); setPayForm({ ...payForm, amount: (Number(inv.totalAmount) - Number(inv.amountPaid || 0)) / 100 }); }} data-testid={`button-pay-${inv.id}`}><DollarSign className="w-4 h-4 text-emerald-500" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.recordPayment} — {payOpen?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 text-sm text-muted-foreground">{t.balanceDue}: <strong>{fmtSar((Number(payOpen?.totalAmount || 0) - Number(payOpen?.amountPaid || 0)))}</strong></div>
            <div><label className="text-sm">{t.amountSar}</label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
            <div><label className="text-sm">{t.dateLabel}</label><Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.method}</label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{localizedMethod(t, m)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.referenceNo}</label><Input value={payForm.referenceNumber} onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.bankName}</label><Input value={payForm.bankName} onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(null)}>{t.cancel}</Button>
            <Button onClick={() => payMut.mutate({ invoiceId: payOpen.id, payload: payForm })} disabled={payMut.isPending}>{t.record}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
