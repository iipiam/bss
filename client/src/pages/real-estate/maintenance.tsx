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
import { Plus, Edit, Trash2, Wrench, Calendar } from "lucide-react";
import { PageHeader, StatusBadge, PriorityBadge, fmtSar, fmtDate, REBreadcrumb, sarToHalala, useRET, ViewToggle, useViewMode } from "./_shared";
import { localizedStatus, localizedPriority } from "@/i18n/realEstateTranslations";

const STATUSES = ["open","assigned","in_progress","completed","cancelled"];
const PRIORITIES = ["low","medium","high","urgent"];

export default function MaintenancePage() {
  const t = useRET();
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/real-estate/maintenance"] });
  const { data: properties = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/properties"] });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/real-estate/units"] });
  const [view, setView] = useViewMode("maintenance");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ propertyId: "", unitId: "", title: "", description: "", category: "", priority: "medium", status: "open", vendorContact: "", estimatedCost: "", actualCost: "", reportedDate: new Date().toISOString().slice(0, 10), scheduledDate: "", completedDate: "" });

  const reset = () => { setEditing(null); setForm({ propertyId: properties[0]?.id || "", unitId: "", title: "", description: "", category: "", priority: "medium", status: "open", vendorContact: "", estimatedCost: "", actualCost: "", reportedDate: new Date().toISOString().slice(0, 10), scheduledDate: "", completedDate: "" }); };

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      propertyId: r.propertyId || "", unitId: r.unitId || "",
      title: r.title || "", description: r.description || "",
      category: r.category || "", priority: r.priority || "medium", status: r.status || "open",
      vendorContact: r.vendorContact || "",
      estimatedCost: r.estimatedCost ? Number(r.estimatedCost) / 100 : "",
      actualCost: r.actualCost ? Number(r.actualCost) / 100 : "",
      reportedDate: r.reportedDate?.slice(0, 10) || "",
      scheduledDate: r.scheduledDate?.slice(0, 10) || "",
      completedDate: r.completedDate?.slice(0, 10) || "",
    });
    setOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      const data = {
        ...payload,
        unitId: payload.unitId || null,
        estimatedCost: payload.estimatedCost === "" ? null : sarToHalala(payload.estimatedCost),
        actualCost: payload.actualCost === "" ? null : sarToHalala(payload.actualCost),
        scheduledDate: payload.scheduledDate || null,
        completedDate: payload.completedDate || null,
      };
      const res = editing
        ? await apiRequest("PATCH", `/api/real-estate/maintenance/${editing.id}`, data)
        : await apiRequest("POST", "/api/real-estate/maintenance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/real-estate/maintenance"] });
      toast({ title: editing ? t.requestUpdated : t.requestCreated });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/real-estate/maintenance/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/real-estate/maintenance"] }); toast({ title: t.requestDeleted }); },
  });

  const propName = (id: string) => properties.find((p: any) => p.id === id)?.name || "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <REBreadcrumb />
      <PageHeader title={t.maintenanceRequests} subtitle={t.maintenanceSubtitle} actions={
        <>
          <ViewToggle view={view} onChange={setView} testId="toggle-view-maintenance" />
          <Button onClick={() => { reset(); setOpen(true); }} data-testid="button-new-request"><Plus className="w-4 h-4 mr-1" />{t.newRequest}</Button>
        </>
      } />

      {view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.reported}</TableHead><TableHead>{t.property}</TableHead><TableHead>{t.title}</TableHead>
                  <TableHead>{t.priority}</TableHead><TableHead>{t.statusLabel}</TableHead>
                  <TableHead>{t.cost}</TableHead><TableHead className="w-24">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">{t.loading}</TableCell></TableRow>}
                {!isLoading && requests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t.noRequests}</TableCell></TableRow>}
                {requests.map((r: any) => (
                  <TableRow key={r.id} data-testid={`row-maintenance-${r.id}`}>
                    <TableCell>{fmtDate(r.reportedDate)}</TableCell>
                    <TableCell>{propName(r.propertyId)}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><PriorityBadge priority={r.priority} /></TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>{r.actualCost ? fmtSar(r.actualCost) : r.estimatedCost ? `~${fmtSar(r.estimatedCost)}` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} data-testid={`button-edit-${r.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(r.id); }} data-testid={`button-delete-${r.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
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
          {!isLoading && requests.length === 0 && <div className="text-center py-10 text-muted-foreground">{t.noRequests}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {requests.map((r: any) => (
              <Card key={r.id} className="hover-elevate" data-testid={`card-maintenance-${r.id}`}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0"><Wrench className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate" data-testid={`text-maint-title-${r.id}`}>{r.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{propName(r.propertyId)}</div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PriorityBadge priority={r.priority} />
                    {r.category && <span className="text-xs text-muted-foreground">{r.category}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="w-3.5 h-3.5" /><span className="text-foreground">{fmtDate(r.reportedDate)}</span></div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="font-semibold">{r.actualCost ? fmtSar(r.actualCost) : r.estimatedCost ? `~${fmtSar(r.estimatedCost)}` : "—"}</div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} data-testid={`button-edit-${r.id}`}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(r.id); }} data-testid={`button-delete-${r.id}`}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? t.editRequest : t.newMaintenanceRequest}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><label className="text-sm">{t.property} *</label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.unitOptional}</label>
              <Select value={form.unitId || "_none"} onValueChange={(v) => setForm({ ...form, unitId: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t.none}</SelectItem>
                  {units.filter((u: any) => !form.propertyId || u.propertyId === form.propertyId).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-sm">{t.title} *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-sm">{t.descriptionLabel}</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="text-sm">{t.category}</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t.maintCategoryHint} /></div>
            <div><label className="text-sm">{t.priority}</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{localizedPriority(t, p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.statusLabel}</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{localizedStatus(t, s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">{t.vendorContact}</label><Input value={form.vendorContact} onChange={(e) => setForm({ ...form, vendorContact: e.target.value })} /></div>
            <div><label className="text-sm">{t.estimatedCost}</label><Input type="number" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></div>
            <div><label className="text-sm">{t.actualCost}</label><Input type="number" step="0.01" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} /></div>
            <div><label className="text-sm">{t.reportedDate}</label><Input type="date" value={form.reportedDate} onChange={(e) => setForm({ ...form, reportedDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.scheduled}</label><Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></div>
            <div><label className="text-sm">{t.completed}</label><Input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button onClick={() => upsertMut.mutate(form)} disabled={upsertMut.isPending || !form.propertyId || !form.title}>{editing ? t.save : t.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
