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

const TYPES = ["residential","commercial","industrial","land","villa","apartment","office","warehouse","mall","compound","hotel","showroom","clinic","other"];
const STATUSES = ["available","rented","for_sale","under_maintenance","inactive"];

export default function PropertiesPage() {
  const { toast } = useToast();
  const { data: properties = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
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
        ? await apiRequest("PATCH", `/api/real-estate/properties/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/properties"] });
      toast({ title: editing ? "Property updated" : "Property created" });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/properties/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/properties"] }); toast({ title: "Property deleted" }); },
    onError: (e: any) => toast({ title: "Cannot delete", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Properties" subtitle="Real estate assets in your portfolio" actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-property"><Plus className="w-4 h-4 mr-1" />Add Property</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>City</TableHead>
                <TableHead>Status</TableHead><TableHead>Current Value</TableHead><TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">Loading…</TableCell></TableRow>}
              {!isLoading && properties.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No properties yet</TableCell></TableRow>}
              {properties.map((p: any) => (
                <TableRow key={p.id} data-testid={`row-property-${p.id}`}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="capitalize">{p.type}</TableCell>
                  <TableCell>{p.city || "—"}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>{fmtSar(p.currentValue)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this property?")) deleteMut.mutate(p.id); }} data-testid={`button-delete-${p.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Property" : "New Property"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-name" /></div>
            <div><label className="text-sm">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">City</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-sm">District</label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Address</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="text-sm">Area (sqm)</label><Input type="number" value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} /></div>
            <div><label className="text-sm">Floors</label><Input type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} /></div>
            <div><label className="text-sm">Year Built</label><Input type="number" value={form.yearBuilt} onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })} /></div>
            <div><label className="text-sm">Owner Name</label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
            <div><label className="text-sm">Purchase Price (SAR)</label><Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
            <div><label className="text-sm">Current Value (SAR)</label><Input type="number" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Notes</label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.name} data-testid="button-save">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
