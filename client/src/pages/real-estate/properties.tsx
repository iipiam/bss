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
import { Plus, Edit, Trash2, Building2, MapPin } from "lucide-react";
import { PageHeader, StatusBadge, fmtSar, REBreadcrumb, sarToHalala, useRET, ViewToggle, useViewMode } from "./_shared";
import { localizedType, localizedStatus } from "@/i18n/realEstateTranslations";

const TYPES = ["residential","commercial","industrial","land","villa","apartment","office","warehouse","mall","compound","hotel","showroom","clinic","other"];
const STATUSES = ["available","rented","for_sale","under_maintenance","inactive"];

export default function PropertiesPage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: properties = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/properties"] });
  const [view, setView] = useViewMode("properties");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: "", type: "residential", status: "available", city: "", district: "", address: "", areaSqm: "", floors: "", yearBuilt: "", purchasePrice: "", currentValue: "", ownerName: "", notes: "" });

  const reset = () => { setEditing(null); setForm({ name: "", type: "residential", status: "available", city: "", district: "", address: "", areaSqm: "", floors: "", yearBuilt: "", purchasePrice: "", currentValue: "", ownerName: "", notes: "" }); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || "", type: p.type || "residential", status: p.status || "available",
      city: p.city || "", district: p.district || "", address: p.address || "",
      areaSqm: p.areaSqm || "", floors: p.floors ?? "", yearBuilt: p.yearBuilt ?? "",
      purchasePrice: p.purchasePrice ? Number(p.purchasePrice) / 100 : "",
      currentValue: p.currentValue ? Number(p.currentValue) / 100 : "",
      ownerName: p.ownerName || "", notes: p.notes || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      const data = {
        ...payload,
        floors: payload.floors === "" ? null : Number(payload.floors),
        yearBuilt: payload.yearBuilt === "" ? null : Number(payload.yearBuilt),
        purchasePrice: payload.purchasePrice === "" ? 0 : sarToHalala(payload.purchasePrice),
        currentValue: payload.currentValue === "" ? 0 : sarToHalala(payload.currentValue),
        areaSqm: payload.areaSqm === "" ? null : String(payload.areaSqm),
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/properties/${editing.id}`, data)
        : await apiRequest("POST", "/api/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: editing ? t.propertyUpdated : t.propertyCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/properties/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/properties"] }); toast({ title: t.propertyDeleted }); },
    onError: (e: any) => toast({ title: t.cannotDelete, description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.properties} subtitle={t.propertiesSubtitle} actions={
        <>
          <ViewToggle view={view} onChange={setView} testId="toggle-view-properties" />
          <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-property"><Plus className="w-4 h-4 mr-1" />{t.addProperty}</Button>
        </>
      } />

      {view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead><TableHead>{t.typeLabel}</TableHead><TableHead>{t.city}</TableHead>
                  <TableHead>{t.statusLabel}</TableHead>
                  <TableHead>{t.currentValue}</TableHead><TableHead className="w-24">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">{t.loading}</TableCell></TableRow>}
                {!isLoading && properties.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t.noProperties}</TableCell></TableRow>}
                {properties.map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-property-${p.id}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{localizedType(t, p.type)}</TableCell>
                    <TableCell>{p.city || "—"}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>{fmtSar(p.currentValue)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDeleteProperty)) deleteMut.mutate(p.id); }} data-testid={`button-delete-${p.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div>
          {isLoading && <div className="text-center py-10 text-muted-foreground">{t.loading}</div>}
          {!isLoading && properties.length === 0 && <div className="text-center py-10 text-muted-foreground">{t.noProperties}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {properties.map((p: any) => (
              <Card key={p.id} className="hover-elevate" data-testid={`card-property-${p.id}`}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate" data-testid={`text-property-name-${p.id}`}>{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{localizedType(t, p.type)}</div>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{p.city || "—"}{p.district ? ` · ${p.district}` : ""}</span></div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="font-semibold">{fmtSar(p.currentValue)}</div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDeleteProperty)) deleteMut.mutate(p.id); }} data-testid={`button-delete-${p.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t.editProperty : t.newProperty}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">{t.name} *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-name" /></div>
            <div><label className="text-sm">{t.typeLabel}</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((tp) => <SelectItem key={tp} value={tp}>{localizedType(t, tp)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.statusLabel}</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{localizedStatus(t, s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.city}</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-sm">{t.district}</label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.address}</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="text-sm">{t.areaSqm}</label><Input type="number" value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} /></div>
            <div><label className="text-sm">{t.floors}</label><Input type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} /></div>
            <div><label className="text-sm">{t.yearBuilt}</label><Input type="number" value={form.yearBuilt} onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })} /></div>
            <div><label className="text-sm">{t.ownerName}</label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
            <div><label className="text-sm">{t.purchasePrice}</label><Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
            <div><label className="text-sm">{t.currentValue}</label><Input type="number" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.notes}</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.name} data-testid="button-save">{editing ? t.save : t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
