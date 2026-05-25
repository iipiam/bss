import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, XCircle } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, downloadBlob } from "./_shared";

const FREQ = ["monthly", "quarterly", "biannual", "annual"];
const STATUSES = ["draft", "active", "expired", "terminated", "renewed"];

export default function ContractsPage() {
  const { toast } = useToast();
  const { data: contracts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/contracts"] });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/units"] });
  const { data: tenants = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });

  const [open, setOpen] = useState(false);
  const [termOpen, setTermOpen] = useState<any>(null);
  const [termReason, setTermReason] = useState("");
  const blank = { unitId: "", tenantId: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", durationMonths: 12, monthlyRent: "", securityDeposit: "", paymentFrequency: "monthly", paymentDay: 1, vatRate: 15, status: "draft", autoRenew: false, renewalNoticeDays: 60, terms: "" };
  const [form, setForm] = useState<any>(blank);

  const createMut = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        durationMonths: Number(form.durationMonths),
        monthlyRent: sarToHalala(form.monthlyRent),
        securityDeposit: form.securityDeposit === "" ? 0 : sarToHalala(form.securityDeposit),
        totalValue: sarToHalala(Number(form.monthlyRent) * Number(form.durationMonths)),
        paymentDay: Number(form.paymentDay),
        vatRate: Number(form.vatRate),
        renewalNoticeDays: Number(form.renewalNoticeDays),
      };
      const res = await apiRequest("POST", "/api/real-estate/contracts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] });
      toast({ title: "Contract created" });
      setOpen(false); setForm(blank);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const terminateMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/real-estate/contracts/${id}/terminate`, { reason: termReason, terminatedDate: new Date().toISOString().slice(0, 10) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] });
      toast({ title: "Contract terminated" });
      setTermOpen(null); setTermReason("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unitLabel = (id: string) => { const u = units.find((x: any) => x.id === id); return u ? `${u.unitNumber}` : "—"; };
  const tenantLabel = (id: string) => tenants.find((x: any) => x.id === id)?.fullName || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Rental Contracts" subtitle="Lease agreements & rent schedules" actions={
        <Button onClick={() => setOpen(true)} data-testid="button-add-contract"><Plus className="w-4 h-4 mr-1" />New Contract</Button>
      } />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Contract #</TableHead><TableHead>Tenant</TableHead><TableHead>Unit</TableHead>
            <TableHead>Period</TableHead><TableHead>Monthly Rent</TableHead><TableHead>Status</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && contracts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No contracts</TableCell></TableRow>}
            {contracts.map((c: any) => (
              <TableRow key={c.id} data-testid={`row-contract-${c.id}`}>
                <TableCell className="font-medium">{c.contractNumber || c.id.slice(0, 8)}</TableCell>
                <TableCell>{tenantLabel(c.tenantId)}</TableCell>
                <TableCell>{unitLabel(c.unitId)}</TableCell>
                <TableCell className="text-xs">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</TableCell>
                <TableCell>{fmtSar(c.monthlyRent)}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" title="Download PDF" onClick={() => downloadBlob(`/api/real-estate/contracts/${c.id}/pdf`, `contract-${c.contractNumber || c.id}.pdf`).catch((e) => toast({ title: "PDF error", description: e.message, variant: "destructive" }))}><Download className="w-4 h-4" /></Button>
                  {c.status === "active" && <Button size="icon" variant="ghost" title="Terminate" onClick={() => setTermOpen(c)}><XCircle className="w-4 h-4 text-rose-500" /></Button>}
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Rental Contract</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><label className="text-sm">Unit *</label>
              <Select value={form.unitId} onValueChange={(v) => { const u = units.find((x: any) => x.id === v); setForm({ ...form, unitId: v, monthlyRent: u?.monthlyRent ? Number(u.monthlyRent) / 100 : form.monthlyRent }); }}>
                <SelectTrigger data-testid="select-unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{units.filter((u: any) => u.status === "available").map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unitNumber} ({fmtSar(u.monthlyRent)}/mo)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Tenant *</label>
              <Select value={form.tenantId} onValueChange={(v) => setForm({ ...form, tenantId: v })}>
                <SelectTrigger data-testid="select-tenant"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Start Date *</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="text-sm">End Date *</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="text-sm">Duration (months)</label><Input type="number" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} /></div>
            <div><label className="text-sm">Monthly Rent (SAR) *</label><Input type="number" step="0.01" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} data-testid="input-monthly-rent" /></div>
            <div><label className="text-sm">Security Deposit (SAR)</label><Input type="number" step="0.01" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} /></div>
            <div><label className="text-sm">Payment Frequency</label>
              <Select value={form.paymentFrequency} onValueChange={(v) => setForm({ ...form, paymentFrequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FREQ.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Payment Day (1-28)</label><Input type="number" min={1} max={28} value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: e.target.value })} /></div>
            <div><label className="text-sm">VAT Rate (%)</label><Input type="number" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} /></div>
            <div><label className="text-sm">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.filter((s) => ["draft", "active"].includes(s)).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Checkbox checked={form.autoRenew} onCheckedChange={(v) => setForm({ ...form, autoRenew: !!v })} data-testid="checkbox-auto-renew" /><label className="text-sm">Auto-renew on expiry</label>
            </div>
            <div className="col-span-2"><label className="text-sm">Terms & Conditions</label><Textarea rows={4} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.unitId || !form.tenantId || !form.endDate || !form.monthlyRent} data-testid="button-save-contract">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!termOpen} onOpenChange={(o) => !o && setTermOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Terminate Contract</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="text-sm">Termination Reason</label>
            <Textarea value={termReason} onChange={(e) => setTermReason(e.target.value)} placeholder="Reason for termination..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => terminateMut.mutate(termOpen.id)} disabled={terminateMut.isPending}>Terminate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
