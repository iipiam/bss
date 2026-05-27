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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, FileText, X } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, useRET } from "./_shared";
import { localizedCategory, localizedStatus } from "@/i18n/realEstateTranslations";

const CATS = ["maintenance","utilities","insurance","tax","management_fee","salary","marketing","renovation","legal","other"];
const STATUSES = ["pending","paid","overdue"];

export default function ExpensesPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/expenses"] });
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ propertyId: "", category: "maintenance", description: "", amount: "", vatAmount: "", vendorName: "", expenseDate: new Date().toISOString().slice(0, 10), dueDate: "", paidDate: "", status: "pending", notes: "", receiptUrl: "" });
  const [uploading, setUploading] = useState(false);

  const reset = () => { setEditing(null); setForm({ propertyId: properties[0]?.id || "", category: "maintenance", description: "", amount: "", vatAmount: "", vendorName: "", expenseDate: new Date().toISOString().slice(0, 10), dueDate: "", paidDate: "", status: "pending", notes: "", receiptUrl: "" }); };

  const openEdit = (ex: any) => {
    setEditing(ex);
    setForm({
      propertyId: ex.propertyId || "", category: ex.category || "maintenance",
      description: ex.description || "", amount: Number(ex.amount || 0) / 100,
      vatAmount: ex.vatAmount ? Number(ex.vatAmount) / 100 : "",
      vendorName: ex.vendorName || "",
      expenseDate: ex.expenseDate?.slice(0, 10) || "",
      dueDate: ex.dueDate?.slice(0, 10) || "", paidDate: ex.paidDate?.slice(0, 10) || "",
      status: ex.status || "pending", notes: ex.notes || "", receiptUrl: ex.receiptUrl || "",
    });
    setOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t.error, description: "File must be smaller than 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/real-estate/expenses/upload-invoice", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(e.message || "Upload failed");
      }
      const data = await res.json();
      setForm((f: any) => ({ ...f, receiptUrl: data.url }));
      toast({ title: t.invoiceUploaded || "Invoice uploaded" });
    } catch (e: any) {
      toast({ title: t.error, description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      const data = {
        ...payload,
        amount: sarToHalala(payload.amount || 0),
        vatAmount: payload.vatAmount === "" ? 0 : sarToHalala(payload.vatAmount),
        dueDate: payload.dueDate || null,
        paidDate: payload.paidDate || null,
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/expenses/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/expenses"] });
      toast({ title: editing ? t.expenseUpdated : t.expenseCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/expenses"] }); toast({ title: t.expenseDeleted }); },
  });

  const propName = (id: string) => properties.find((p: any) => p.id === id)?.name || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.propertyExpenses} subtitle={t.expensesSubtitle} actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-expense"><Plus className="w-4 h-4 mr-1" />{t.addExpense}</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.dateLabel}</TableHead><TableHead>{t.property}</TableHead><TableHead>{t.category}</TableHead>
                <TableHead>{t.descriptionLabel}</TableHead><TableHead>{t.amount}</TableHead>
                <TableHead>{t.vendor}</TableHead><TableHead>{t.statusLabel}</TableHead><TableHead className="w-24">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && expenses.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">{t.noExpenses}</TableCell></TableRow>}
              {expenses.map((ex: any) => (
                <TableRow key={ex.id} data-testid={`row-expense-${ex.id}`}>
                  <TableCell>{fmtDate(ex.expenseDate)}</TableCell>
                  <TableCell>{propName(ex.propertyId)}</TableCell>
                  <TableCell>{localizedCategory(t, ex.category)}</TableCell>
                  <TableCell>{ex.description}</TableCell>
                  <TableCell className="font-semibold">{fmtSar(ex.amount)}</TableCell>
                  <TableCell>{ex.vendorName || "—"}</TableCell>
                  <TableCell><StatusBadge status={ex.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ex.receiptUrl && (
                        <Button size="icon" variant="ghost" asChild data-testid={`button-view-invoice-${ex.id}`}>
                          <a href={ex.receiptUrl} target="_blank" rel="noreferrer" title={t.viewInvoice || "View invoice"}><FileText className="w-4 h-4" /></a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(ex)} data-testid={`button-edit-${ex.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(ex.id); }} data-testid={`button-delete-${ex.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? t.editExpense : t.newExpense}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><label className="text-sm">{t.property} *</label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.category}</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{localizedCategory(t, c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-sm">{t.descriptionLabel}</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="text-sm">{t.amountSar} *</label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="text-sm">{t.vatSar}</label><Input type="number" step="0.01" value={form.vatAmount} onChange={(e) => setForm({ ...form, vatAmount: e.target.value })} /></div>
            <div><label className="text-sm">{t.vendorName}</label><Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} /></div>
            <div><label className="text-sm">{t.statusLabel}</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{localizedStatus(t, s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.expenseDate}</label><Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.dueDate}</label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.paidDate}</label><Input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.notes}</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="col-span-2">
              <label className="text-sm">{t.invoiceAttachment || "Invoice (PDF / image)"}</label>
              {form.receiptUrl ? (
                <div className="flex items-center gap-2 mt-1 p-2 border rounded-md" data-testid="attached-invoice">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="text-sm flex-1 truncate hover:underline" data-testid="link-invoice">{form.receiptUrl.split("/").pop()}</a>
                  <Button size="icon" variant="ghost" onClick={() => setForm({ ...form, receiptUrl: "" })} data-testid="button-remove-invoice"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <label className="mt-1 flex items-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer hover-elevate" data-testid="dropzone-invoice">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? (t.loading || "Uploading...") : (t.uploadInvoiceHint || "Click to upload (PDF, JPG, PNG, GIF, WebP — max 10MB)")}</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} data-testid="input-invoice-file" />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.propertyId || !form.amount}>{editing ? t.save : t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
