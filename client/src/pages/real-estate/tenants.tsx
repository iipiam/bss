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
import { PageHeader, REBreadcrumb } from "./_shared";

const ID_TYPES = ["national_id", "iqama", "passport"];

export default function TenantsPage() {
  const { toast } = useToast();
  const { data: tenants = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { fullName: "", idNumber: "", idType: "national_id", phone: "", email: "", nationality: "", companyName: "", crNumber: "", notes: "" };
  const [form, setForm] = useState<any>(blank);
  const reset = () => { setEditing(null); setForm(blank); };

  const openEdit = (t: any) => { setEditing(t); setForm({ ...blank, ...t }); setOpen(true); };

  const upsertMut = useMutation({
    mutationFn: async (p: any) => {
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/tenants/${editing.id}`, p)
        : await apiRequest("POST", "/api/real-estate/tenants", p);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/tenants"] }); toast({ title: editing ? "Tenant updated" : "Tenant created" }); setOpen(false); reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/tenants/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/tenants"] }); toast({ title: "Tenant deleted" }); },
    onError: (e: any) => toast({ title: "Cannot delete", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Tenants" subtitle="Individuals and companies renting your units" actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-tenant"><Plus className="w-4 h-4 mr-1" />Add Tenant</Button>
      } />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Full Name</TableHead><TableHead>ID</TableHead><TableHead>Phone</TableHead>
            <TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && tenants.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No tenants</TableCell></TableRow>}
            {tenants.map((t: any) => (
              <TableRow key={t.id} data-testid={`row-tenant-${t.id}`}>
                <TableCell className="font-medium">{t.fullName}</TableCell>
                <TableCell className="text-xs">{t.idType ? `${t.idType}: ` : ""}{t.idNumber || "—"}</TableCell>
                <TableCell>{t.phone || "—"}</TableCell>
                <TableCell>{t.email || "—"}</TableCell>
                <TableCell>{t.companyName || "—"}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this tenant?")) deleteMut.mutate(t.id); }}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Tenant" : "New Tenant"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">Full Name *</label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} data-testid="input-full-name" /></div>
            <div><label className="text-sm">ID Type</label>
              <Select value={form.idType || "national_id"} onValueChange={(v) => setForm({ ...form, idType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ID_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">ID Number</label><Input value={form.idNumber || ""} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></div>
            <div><label className="text-sm">Phone</label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-sm">Email</label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm">Nationality</label><Input value={form.nationality || ""} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><label className="text-sm">Company Name</label><Input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div><label className="text-sm">CR Number</label><Input value={form.crNumber || ""} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Notes</label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.fullName} data-testid="button-save-tenant">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
