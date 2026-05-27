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
import { PageHeader, StatusBadge, fmtSar, REBreadcrumb, sarToHalala, useRET } from "./_shared";
import { localizedStatus, localizedType } from "@/i18n/realEstateTranslations";

const STATUSES = ["available","rented","under_maintenance","inactive"];

export default function UnitsPage() {
  const t = useRET();
  const { toast } = useToast();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const { data: units = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/units"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ propertyId: "", unitNumber: "", floor: "", type: "apartment", status: "available", bedrooms: "", bathrooms: "", areaSqm: "", monthlyRent: "", parking: "" });

  const reset = () => { setEditing(null); setForm({ propertyId: properties[0]?.id || "", unitNumber: "", floor: "", type: "apartment", status: "available", bedrooms: "", bathrooms: "", areaSqm: "", monthlyRent: "", parking: "" }); };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      propertyId: u.propertyId || "", unitNumber: u.unitNumber || "", floor: u.floor ?? "",
      type: u.type || "apartment", status: u.status || "available",
      bedrooms: u.bedrooms ?? "", bathrooms: u.bathrooms ?? "",
      areaSqm: u.areaSqm || "", monthlyRent: u.monthlyRent ? Number(u.monthlyRent) / 100 : "",
      parking: u.parking ?? "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      const data = {
        ...payload,
        floor: payload.floor === "" ? null : Number(payload.floor),
        bedrooms: payload.bedrooms === "" ? null : Number(payload.bedrooms),
        bathrooms: payload.bathrooms === "" ? null : Number(payload.bathrooms),
        parking: payload.parking === "" ? null : Number(payload.parking),
        areaSqm: payload.areaSqm === "" ? null : String(payload.areaSqm),
        monthlyRent: payload.monthlyRent === "" ? 0 : sarToHalala(payload.monthlyRent),
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/units/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/units", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] });
      toast({ title: editing ? t.unitUpdated : t.unitCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/units/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] }); toast({ title: t.unitDeleted }); },
    onError: (e: any) => toast({ title: t.cannotDelete, description: e.message, variant: "destructive" }),
  });

  const filtered = propertyFilter === "all" ? units : units.filter((u: any) => u.propertyId === propertyFilter);
  const propName = (id: string) => properties.find((p: any) => p.id === id)?.name || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.units} subtitle={t.unitsSubtitle} actions={
        <>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-48" data-testid="select-property-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allProperties}</SelectItem>
              {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-unit"><Plus className="w-4 h-4 mr-1" />{t.addUnit}</Button>
        </>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.unitNumberShort}</TableHead><TableHead>{t.property}</TableHead><TableHead>{t.typeLabel}</TableHead>
                <TableHead>{t.bedBath}</TableHead><TableHead>{t.monthlyRent}</TableHead>
                <TableHead>{t.statusLabel}</TableHead><TableHead className="w-24">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">{t.loading}</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t.noUnits}</TableCell></TableRow>}
              {filtered.map((u: any) => (
                <TableRow key={u.id} data-testid={`row-unit-${u.id}`}>
                  <TableCell className="font-medium">{u.unitNumber}</TableCell>
                  <TableCell>{propName(u.propertyId)}</TableCell>
                  <TableCell>{localizedType(t, u.type)}</TableCell>
                  <TableCell>{u.bedrooms ?? "—"} / {u.bathrooms ?? "—"}</TableCell>
                  <TableCell>{fmtSar(u.monthlyRent)}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)} data-testid={`button-edit-${u.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDeleteUnit)) deleteMut.mutate(u.id); }} data-testid={`button-delete-${u.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? t.editUnit : t.newUnit}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">{t.property} *</label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder={t.property} /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.unitNumber} *</label><Input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} /></div>
            <div><label className="text-sm">{t.floor}</label><Input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="text-sm">{t.typeLabel}</label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t.unitTypeHint} /></div>
            <div><label className="text-sm">{t.statusLabel}</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{localizedStatus(t, s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.bedrooms}</label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="text-sm">{t.bathrooms}</label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="text-sm">{t.areaSqm}</label><Input type="number" value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} /></div>
            <div><label className="text-sm">{t.monthlyRentSar}</label><Input type="number" step="0.01" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} /></div>
            <div><label className="text-sm">{t.parking}</label><Input type="number" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.propertyId || !form.unitNumber}>{editing ? t.save : t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
