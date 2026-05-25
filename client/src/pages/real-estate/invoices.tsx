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
import { Download, Wallet } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, downloadBlob } from "./_shared";

const STATUSES = ["", "pending", "paid", "partial", "overdue", "cancelled"];
const METHODS = ["cash", "bank_transfer", "cheque", "online"];

export default function InvoicesPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/real-estate/invoices", { status: statusFilter }],
    queryFn: async () => {
      const url = statusFilter ? `/api/real-estate/invoices?status=${statusFilter}` : "/api/real-estate/invoices";
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });
  const { data: tenants = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });
  const tenantName = (id: string) => tenants.find((t: any) => t.id === id)?.fullName || "—";

  const [payOpen, setPayOpen] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "cash", referenceNumber: "", bankName: "", notes: "" });

  const payMut = useMutation({
    mutationFn: async () => {
      const data = { ...payForm, amount: sarToHalala(payForm.amount) };
      const res = await apiRequest("POST", `/api/real-estate/invoices/${payOpen.id}/mark-paid`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/dashboard/summary"] });
      toast({ title: "Payment recorded" });
      setPayOpen(null);
      setPayForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "cash", referenceNumber: "", bankName: "", notes: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Rental Invoices" subtitle="Generated invoices and balances" actions={
        <Select value={statusFilter || "_all"} onValueChange={(v) => setStatusFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-44" data-testid="select-status-filter"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All statuses</SelectItem>
            {STATUSES.filter(Boolean).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      } />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Invoice #</TableHead><TableHead>Tenant</TableHead><TableHead>Type</TableHead>
            <TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Total</TableHead>
            <TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead className="w-28">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && invoices.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No invoices</TableCell></TableRow>}
            {invoices.map((inv: any) => (
              <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                <TableCell>{tenantName(inv.tenantId)}</TableCell>
                <TableCell className="capitalize">{inv.type}</TableCell>
                <TableCell className="text-xs">{fmtDate(inv.issueDate)}</TableCell>
                <TableCell className="text-xs">{fmtDate(inv.dueDate)}</TableCell>
                <TableCell>{fmtSar(inv.totalAmount)}</TableCell>
                <TableCell className="text-emerald-600">{fmtSar(inv.amountPaid)}</TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" title="PDF" onClick={() => downloadBlob(`/api/real-estate/invoices/${inv.id}/pdf`, `${inv.invoiceNumber}.pdf`).catch((e) => toast({ title: "PDF error", description: e.message, variant: "destructive" }))}><Download className="w-4 h-4" /></Button>
                  {inv.status !== "paid" && inv.status !== "cancelled" && <Button size="icon" variant="ghost" title="Record payment" onClick={() => { setPayOpen(inv); setPayForm({ ...payForm, amount: String((Number(inv.totalAmount) - Number(inv.amountPaid)) / 100) }); }} data-testid={`button-pay-${inv.id}`}><Wallet className="w-4 h-4 text-emerald-500" /></Button>}
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment — {payOpen?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 text-sm">
              Balance due: <span className="font-semibold">{fmtSar((Number(payOpen?.totalAmount || 0) - Number(payOpen?.amountPaid || 0)))}</span>
            </div>
            <div><label className="text-sm">Amount (SAR) *</label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} data-testid="input-pay-amount" /></div>
            <div><label className="text-sm">Date</label><Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} /></div>
            <div><label className="text-sm">Method</label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Reference #</label><Input value={payForm.referenceNumber} onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Bank Name</label><Input value={payForm.bankName} onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
            <Button onClick={() => payMut.mutate()} disabled={payMut.isPending || !payForm.amount} data-testid="button-submit-payment">Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
