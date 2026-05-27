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
import { Plus, FileDown, XCircle } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, downloadBlob, useRET } from "./_shared";
import { localizedFrequency } from "@/i18n/realEstateTranslations";

const FREQS = ["monthly","quarterly","biannual","annual"];

export default function ContractsPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: contracts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/contracts"] });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/units"] });
  const { data: tenants = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });
  const [open, setOpen] = useState(false);
  const [termOpen, setTermOpen] = useState<any>(null);
  const [termReason, setTermReason] = useState("");
  const [form, setForm] = useState<any>({ unitId: "", tenantId: "", startDate: "", endDate: "", durationMonths: 12, monthlyRent: "", securityDeposit: "", paymentFrequency: "monthly", paymentDay: 1, vatRate: 15, autoRenew: false, termsConditions: "" });

  const reset = () => setForm({ unitId: "", tenantId: "", startDate: "", endDate: "", durationMonths: 12, monthlyRent: "", securityDeposit: "", paymentFrequency: "monthly", paymentDay: 1, vatRate: 15, autoRenew: false, termsConditions: "" });

  const createMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/real-estate/contracts", {
        ...payload,
        monthlyRent: sarToHalala(payload.monthlyRent || 0),
        securityDeposit: sarToHalala(payload.securityDeposit || 0),
        durationMonths: Number(payload.durationMonths),
        paymentDay: Number(payload.paymentDay),
        vatRate: String(payload.vatRate),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/invoices"] });
      toast({ title: t.contractCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const terminateMut = useMutation({
    mutationFn: async ({ id, reason }: any) => { await apiRequest("POST", `/api/real-estate/contracts/${id}/terminate`, { terminationReason: reason }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/contracts"] });
      toast({ title: t.contractTerminated });
      setTermOpen(null); setTermReason("");
    },
  });

  const unitLabel = (id: string) => units.find((u: any) => u.id === id)?.unitNumber || "—";
  const tenantLabel = (id: string) => tenants.find((te: any) => te.id === id)?.fullName || "—";

  const downloadPdf = async (id: string) => {
    try { await downloadBlob(`/api/real-estate/contracts/${id}/pdf`, `contract-${id}.pdf`); }
    catch (e: any) { toast({ title: t.pdfError, description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.rentalContracts} subtitle={t.contractsSubtitle} actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-new-contract"><Plus className="w-4 h-4 mr-1" />{t.newContract}</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.contractNumber}</TableHead><TableHead>{t.tenant}</TableHead><TableHead>{t.unit}</TableHead>
                <TableHead>{t.period}</TableHead><TableHead>{t.monthlyRent}</TableHead>
                <TableHead>{t.statusLabel}</TableHead><TableHead className="w-32">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && contracts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t.noContracts}</TableCell></TableRow>}
              {contracts.map((c: any) => (
                <TableRow key={c.id} data-testid={`row-contract-${c.id}`}>
                  <TableCell className="font-medium">{c.contractNumber}</TableCell>
                  <TableCell>{tenantLabel(c.tenantId)}</TableCell>
                  <TableCell>{unitLabel(c.unitId)}</TableCell>
                  <TableCell>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</TableCell>
                  <TableCell>{fmtSar(c.monthlyRent)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => downloadPdf(c.id)} data-testid={`button-pdf-${c.id}`}><FileDown className="w-4 h-4" /></Button>
                      {c.status === "active" && (
                        <Button size="icon" variant="ghost" onClick={() => setTermOpen(c)} data-testid={`button-terminate-${c.id}`}><XCircle className="w-4 h-4 text-rose-500" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t.newRentalContract}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><label className="text-sm">{t.unit} *</label>
              <Select value={form.unitId} onValueChange={(v) => {
                const u = units.find((x: any) => x.id === v);
                setForm({ ...form, unitId: v, monthlyRent: u?.monthlyRent ? Number(u.monthlyRent) / 100 : form.monthlyRent });
              }}>
                <SelectTrigger data-testid="select-unit"><SelectValue placeholder={t.selectUnit} /></SelectTrigger>
                <SelectContent>{units.filter((u: any) => u.status === "available").map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.tenant} *</label>
              <Select value={form.tenantId} onValueChange={(v) => setForm({ ...form, tenantId: v })}>
                <SelectTrigger data-testid="select-tenant"><SelectValue placeholder={t.selectTenant} /></SelectTrigger>
                <SelectContent>{tenants.map((te: any) => <SelectItem key={te.id} value={te.id}>{te.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.startDate} *</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.endDate} *</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.durationMonths}</label><Input type="number" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} /></div>
            <div><label className="text-sm">{t.monthlyRentSar} *</label><Input type="number" step="0.01" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} /></div>
            <div><label className="text-sm">{t.securityDeposit}</label><Input type="number" step="0.01" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} /></div>
            <div><label className="text-sm">{t.paymentFrequency}</label>
              <Select value={form.paymentFrequency} onValueChange={(v) => setForm({ ...form, paymentFrequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FREQS.map((f) => <SelectItem key={f} value={f}>{localizedFrequency(t, f)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.paymentDay}</label><Input type="number" min="1" max="28" value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: e.target.value })} /></div>
            <div><label className="text-sm">{t.vatRate}</label><Input type="number" step="0.01" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="autoRenew" checked={form.autoRenew} onCheckedChange={(c) => setForm({ ...form, autoRenew: !!c })} />
              <label htmlFor="autoRenew" className="text-sm">{t.autoRenewOnExpiry}</label>
            </div>
            <div className="col-span-2"><label className="text-sm">{t.termsAndConditions}</label><Textarea rows={4} value={form.termsConditions} onChange={(e) => setForm({ ...form, termsConditions: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.unitId || !form.tenantId || !form.startDate || !form.endDate} data-testid="button-create-contract">{t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!termOpen} onOpenChange={(o) => !o && setTermOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.terminateContract}</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="text-sm">{t.terminationReason}</label>
            <Textarea value={termReason} onChange={(e) => setTermReason(e.target.value)} placeholder={t.terminationReasonPlaceholder} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermOpen(null)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={() => terminateMut.mutate({ id: termOpen?.id, reason: termReason })}>{t.terminate}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
