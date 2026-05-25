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
import { PageHeader, StatusBadge, PriorityBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala } from "./_shared";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "assigned", "in_progress", "completed", "cancelled"];

export default function MaintenancePage() {
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/maintenance"] });
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/units"] });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank: any = { propertyId: "", unitId: "", title: "", description: "", category: "", priority: "medium", status: "open", reportedDate: new Date().toISOString().slice(0, 10), scheduledDate: "", completedDate: "", vendorName: "", vendorContact: "", estimatedCost: "", actualCost: "", notes: "" };
  const [form, setForm] = useState<any>(blank);
  const reset = () => { setEditing(null); setForm(blank); };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      ...blank, ...m,
      unitId: m.unitId || "",
      estimatedCost: m.estimatedCost ? Number(m.estimatedCost) / 100 : "",
      actualCost: m.actualCost ? Number(m.actualCost) / 100 : "",
      scheduledDate: m.scheduledDate || "", completedDate: m.completedDate || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        unitId: form.unitId || null,
        estimatedCost: form.estimatedCost === "" ? 0 : sarToHalala(form.estimatedCost),
        actualCost: form.actualCost === "" ? 0 : sarToHalala(form.actualCost),
        scheduledDate: form.scheduledDate || null,
        completedDate: form.completedDate || null,
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/maintenance/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/maintenance", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/maintenance"] }); toast({ title: editing ? "Request updated" : "Request created" }); setOpen(false); reset(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/maintenance/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/maintenance"] }); toast({ title: "Deleted" }); },
  });

  const propName = (id: string) => properties.find((p: any) => p.id === id)?.name || "—";
  const filteredUnits = form.propertyId ? units.filter((u: any) => u.propertyId === form.propertyId) : units;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title="Maintenance Requests" subtitle="Track upkeep and repairs" actions={
        <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-add-maintenance"><Plus className="w-4 h-4 mr-1" />New Request</Button>
      } />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Reported</TableHead><TableHead>Title</TableHead><TableHead>Property</TableHead>
            <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Cost</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && requests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No requests</TableCell></TableRow>}
            {requests.map((m: any) => (
              <TableRow key={m.id} data-testid={`row-maintenance-${m.id}`}>
                <TableCell>{fmtDate(m.reportedDate)}</TableCell>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{propName(m.propertyId)}</TableCell>
                <TableCell><PriorityBadge priority={m.priority} /></TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell>{fmtSar(m.actualCost || m.estimatedCost)}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(m.id); }}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Request" : "New Maintenance Request"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2"><label className="text-sm">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-title" /></div>
            <div><label className="text-sm">Property *</label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v, unitId: "" })}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Unit (optional)</label>
              <Select value={form.unitId || "_none"} onValueChange={(v) => setForm({ ...form, unitId: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {filteredUnits.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Category</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="plumbing / electrical / hvac" /></div>
            <div><label className="text-sm">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Reported Date</label><Input type="date" value={form.reportedDate} onChange={(e) => setForm({ ...form, reportedDate: e.target.value })} /></div>
            <div><label className="text-sm">Scheduled</label><Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></div>
            <div><label className="text-sm">Completed</label><Input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} /></div>
            <div><label className="text-sm">Vendor Name</label><Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} /></div>
            <div><label className="text-sm">Vendor Contact</label><Input value={form.vendorContact} onChange={(e) => setForm({ ...form, vendorContact: e.target.value })} /></div>
            <div><label className="text-sm">Estimated Cost (SAR)</label><Input type="number" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></div>
            <div><label className="text-sm">Actual Cost (SAR)</label><Input type="number" step="0.01" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsertMut.mutate()} disabled={upsertMut.isPending || !form.title || !form.propertyId} data-testid="button-save-maintenance">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
