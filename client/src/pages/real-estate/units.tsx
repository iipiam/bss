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
import { PageHeader, StatusBadge, fmtSar, REBreadcrumb, sarToHalala } from "./_shared";

const STATUSES = ["available", "rented", "under_maintenance", "inactive"];

export default function UnitsPage() {
  const { toast } = useToast();
  const [propertyFilter, setPropertyFilter] = useState<string>("");
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const unitsKey = propertyFilter ? ["/api/real-estate/units", { propertyId: propertyFilter }] : ["/api/real-estate/units"];
  const { data: units = [], isLoading } = useQuery<any[]>({
    queryKey: unitsKey,
    queryFn: async () => {
      const url = propertyFilter ? `/api/real-estate/units?propertyId=${propertyFilter}` : "/api/real-estate/units";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { propertyId: "", unitNumber: "", type: "", floor: "", areaSqm: "", bedrooms: "", bathrooms: "", parkingSpaces: "", monthlyRent: "", status: "available", notes: "" };
  const [form, setForm] = useState<any>(blank);

  const reset = () => { setEditing(null); setForm(blank); };
  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      propertyId: u.propertyId, unitNumber: u.unitNumber || "", type: u.type || "",
      floor: u.floor ?? "", areaSqm: u.areaSqm || "", bedrooms: u.bedrooms ?? "",
      bathrooms: u.bathrooms ?? "", parkingSpaces: u.parkingSpaces ?? "",
      monthlyRent: u.monthlyRent ? Number(u.monthlyRent) / 100 : "",
      status: u.status || "available", notes: u.notes || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (p: any) => {
      const data = {
        ...p,
        floor: p.floor === "" ? null : Number(p.floor),
        bedrooms: p.bedrooms === "" ? null : Number(p.bedrooms),
        bathrooms: p.bathrooms === "" ? null : Number(p.bathrooms),
        parkingSpaces: p.parkingSpaces === "" ? null : Number(p.parkingSpaces),
        areaSqm: p.areaSqm === "" ? null : String(p.areaSqm),
        monthlyRent: p.monthlyRent === "" ? 0 : sarToHalala(p.monthlyRent),
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/units/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/units", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] });
      toast({ title: editing ? "Unit updated" : "Unit created" });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/units/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/units"] }); toast({ title: "Unit deleted" }); },
    onError: (e: any) => toast({ title: "Cannot delete", description: e.message, variant: "destructive" }),
  });

  const propName = (id: string) => properties.find((p: any) => p.id === id)?.name || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Units" subtitle="Rentable units within properties" actions={
        <div className="flex gap-2 items-center">
          <Select value={propertyFilter || "_all"} onValueChange={(v) => setPropertyFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-56" data-testid="select-property-filter"><SelectValue placeholder="All properties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All properties</SelectItem>
              {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-unit"><Plus className="w-4 h-4 mr-1" />Add Unit</Button>
        </div>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit #</TableHead><TableHead>Property</TableHead><TableHead>Type</TableHead>
                <TableHead>Bed/Bath</TableHead><TableHead>Monthly Rent</TableHead><TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>}
              {!isLoading && units.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No units</TableCell></TableRow>}
              {units.map((u: any) => (
                <TableRow key={u.id} data-testid={`row-unit-${u.id}`}>
                  <TableCell className="font-medium">{u.unitNumber}</TableCell>
                  <TableCell>{propName(u.propertyId)}</TableCell>
                  <TableCell>{u.type || "—"}</TableCell>
                  <TableCell>{u.bedrooms ?? "—"}/{u.bathrooms ?? "—"}</TableCell>
                  <TableCell>{fmtSar(u.monthlyRent)}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this unit?")) deleteMut.mutate(u.id); }}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Unit" : "New Unit"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">Property *</label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })} disabled={!!editing}>
                <SelectTrigger data-testid="select-property"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Unit Number *</label><Input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} data-testid="input-unit-number" /></div>
            <div><label className="text-sm">Type</label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="apartment / office / studio" /></div>
            <div><label className="text-sm">Floor</label><Input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="text-sm">Area (sqm)</label><Input type="number" value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} /></div>
            <div><label className="text-sm">Bedrooms</label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="text-sm">Bathrooms</label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="text-sm">Parking</label><Input type="number" value={form.parkingSpaces} onChange={(e) => setForm({ ...form, parkingSpaces: e.target.value })} /></div>
            <div><label className="text-sm">Monthly Rent (SAR)</label><Input type="number" step="0.01" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} data-testid="input-monthly-rent" /></div>
            <div><label className="text-sm">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-sm">Notes</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.unitNumber || !form.propertyId} data-testid="button-save-unit">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
