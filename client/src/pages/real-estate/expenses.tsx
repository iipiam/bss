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
import { Plus, Edit, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala } from "./_shared";

const CATS = ["maintenance", "utilities", "insurance", "tax", "management_fee", "salary", "marketing", "renovation", "legal", "other"];
const STATUSES = ["pending", "paid", "overdue"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/expenses"] });
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const propName = (id?: string) => (id ? properties.find((p: any) => p.id === id)?.name : null) || "—";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { propertyId: "", category: "maintenance", description: "", amount: "", taxAmount: "", vendorName: "", expenseDate: new Date().toISOString().slice(0, 10), dueDate: "", paidDate: "", status: "pending", notes: "" };
  const [form, setForm] = useState<any>(blank);
  const reset = () => { setEditing(null); setForm(blank); };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      ...blank, ...e,
      amount: e.amount ? Number(e.amount) / 100 : "",
      taxAmount: e.taxAmount ? Number(e.taxAmount) / 100 : "",
      propertyId: e.propertyId || "",
      expenseDate: e.expenseDate || new Date().toISOString().slice(0, 10),
      dueDate: e.dueDate || "", paidDate: e.paidDate || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        propertyId: form.propertyId || null,
        amount: sarToHalala(form.amount),
        taxAmount: form.taxAmount === "" ? 0 : sarToHalala(form.taxAmount),
        dueDate: form.dueDate || null,
        paidDate: form.paidDate || null,
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/expenses/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/expenses", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/expenses"] }); toast({ title: editing ? "Expense updated" : "Expense created" }); setOpen(false); reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/expenses"] }); toast({ title: "Expense deleted" }); },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Property Expenses" subtitle="Operating costs by property" actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-expense"><Plus className="w-4 h-4 mr-1" />Add Expense</Button>
      } />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Property</TableHead><TableHead>Category</TableHead>
            <TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Vendor</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && expenses.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No expenses</TableCell></TableRow>}
            {expenses.map((e: any) => (
              <TableRow key={e.id} data-testid={`row-expense-${e.id}`}>
                <TableCell>{fmtDate(e.expenseDate)}</TableCell>
                <TableCell>{propName(e.propertyId)}</TableCell>
                <TableCell className="capitalize">{e.category}</TableCell>
                <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                <TableCell>{fmtSar(e.amount)}</TableCell>
                <TableCell>{e.vendorName || "—"}</TableCell>
                <TableCell><StatusBadge status={e.status} /></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(e.id); }}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "New Expense"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">Description *</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-description" /></div>
            <div><label className="text-sm">Property</label>
              <Select value={form.propertyId || "_none"} onValueChange={(v) => setForm({ ...form, propertyId: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Amount (SAR) *</label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="input-amount" /></div>
            <div><label className="text-sm">VAT (SAR)</label><Input type="number" step="0.01" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} /></div>
            <div><label className="text-sm">Vendor Name</label><Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} /></div>
            <div><label className="text-sm">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Expense Date</label><Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
            <div><label className="text-sm">Due Date</label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="text-sm">Paid Date</label><Input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Notes</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsertMut.mutate()} disabled={upsertMut.isPending || !form.description || !form.amount} data-testid="button-save-expense">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
