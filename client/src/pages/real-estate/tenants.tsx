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
import { Plus, Edit, Trash2 } from "lucide-react";
import { PageHeader, REBreadcrumb, useRET } from "./_shared";
import { localizedIdType } from "@/i18n/realEstateTranslations";

const ID_TYPES = ["national_id","iqama","passport"];

export default function TenantsPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: tenants = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/tenants"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ fullName: "", idType: "national_id", idNumber: "", phone: "", email: "", nationality: "", companyName: "", crNumber: "" });

  const reset = () => { setEditing(null); setForm({ fullName: "", idType: "national_id", idNumber: "", phone: "", email: "", nationality: "", companyName: "", crNumber: "" }); };

  const openEdit = (te: any) => {
    setEditing(te);
    setForm({
      fullName: te.fullName || "", idType: te.idType || "national_id", idNumber: te.idNumber || "",
      phone: te.phone || "", email: te.email || "", nationality: te.nationality || "",
      companyName: te.companyName || "", crNumber: te.crNumber || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/tenants/${editing.id}`, payload)
        : await apiRequest("POST", "/api/real-estate/tenants", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/tenants"] });
      toast({ title: editing ? t.tenantUpdated : t.tenantCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/tenants/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/tenants"] }); toast({ title: t.tenantDeleted }); },
    onError: (e: any) => toast({ title: t.cannotDelete, description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.tenants} subtitle={t.tenantsSubtitle} actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-tenant"><Plus className="w-4 h-4 mr-1" />{t.addTenant}</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.fullName}</TableHead><TableHead>{t.idLabel}</TableHead><TableHead>{t.phone}</TableHead>
                <TableHead>{t.email}</TableHead><TableHead>{t.company}</TableHead><TableHead className="w-24">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && tenants.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t.noTenants}</TableCell></TableRow>}
              {tenants.map((te: any) => (
                <TableRow key={te.id} data-testid={`row-tenant-${te.id}`}>
                  <TableCell className="font-medium">{te.fullName}</TableCell>
                  <TableCell>{localizedIdType(t, te.idType)}: {te.idNumber || "—"}</TableCell>
                  <TableCell>{te.phone || "—"}</TableCell>
                  <TableCell>{te.email || "—"}</TableCell>
                  <TableCell>{te.companyName || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(te)} data-testid={`button-edit-${te.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDeleteTenant)) deleteMut.mutate(te.id); }} data-testid={`button-delete-${te.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? t.editTenant : t.newTenant}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">{t.fullName} *</label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><label className="text-sm">{t.idType}</label>
              <Select value={form.idType} onValueChange={(v) => setForm({ ...form, idType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ID_TYPES.map((i) => <SelectItem key={i} value={i}>{localizedIdType(t, i)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.idNumber}</label><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></div>
            <div><label className="text-sm">{t.phone}</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-sm">{t.email}</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm">{t.nationality}</label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><label className="text-sm">{t.companyName}</label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.crNumber}</label><Input value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.fullName}>{editing ? t.save : t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
