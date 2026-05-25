import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { FileText, Send, Trash2, Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPhoneForWhatsApp } from "@/lib/whatsapp";

export interface AssigneeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeType: "contractor" | "employee";
  assigneeId: string | null;
  assigneeName: string;
  assigneePhone?: string | null;
}

interface HistoryRow {
  id: string;
  projectId: string;
  projectName?: string;
  projectNumber?: string;
  taskId?: string | null;
  taskName?: string | null;
  phase: number;
  role: "task_assignee" | "phase_lead";
  action: "assigned" | "unassigned" | "completed";
  createdAt: string;
}

interface SettlementRow {
  id: string;
  projectId: string | null;
  fee: string;
  vatIncluded: boolean;
  vatAmount: string;
  totalAmount: string;
  paymentMethod: string;
  notes: string | null;
  status: "draft" | "sent";
  sentAt: string | null;
  createdAt: string;
}

interface ServiceProjectLite {
  id: string;
  name: string;
  projectNumber: string;
}

export default function AssigneeHistoryDialog({
  open, onOpenChange, assigneeType, assigneeId, assigneeName, assigneePhone,
}: AssigneeHistoryDialogProps) {
  const { t } = useLanguage() as any;
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("history");
  const [fee, setFee] = useState("");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [projectId, setProjectId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [histProjectFilter, setHistProjectFilter] = useState<string>("all");
  const [settProjectFilter, setSettProjectFilter] = useState<string>("all");
  const [histPage, setHistPage] = useState(1);
  const [settPage, setSettPage] = useState(1);
  const PAGE_SIZE = 10;

  const enabled = !!assigneeId && open;

  const { data: history = [], isLoading: histLoading } = useQuery<HistoryRow[]>({
    queryKey: ["/api/assignment-history", assigneeType, assigneeId],
    queryFn: async () => {
      const r = await fetch(`/api/assignment-history/${assigneeType}/${assigneeId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load history");
      return r.json();
    },
    enabled,
  });

  const { data: settlements = [], isLoading: settLoading } = useQuery<SettlementRow[]>({
    queryKey: ["/api/contractor-settlements", assigneeType, assigneeId],
    queryFn: async () => {
      const r = await fetch(`/api/contractor-settlements/assignee/${assigneeType}/${assigneeId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load settlements");
      return r.json();
    },
    enabled,
  });

  const { data: projects = [] } = useQuery<ServiceProjectLite[]>({
    queryKey: ["/api/service-projects"],
    enabled,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const body = {
        assigneeType, assigneeId,
        fee: parseFloat(fee) || 0,
        vatIncluded, paymentMethod,
        projectId: projectId || null,
        notes: notes || null,
      };
      return apiRequest("POST", "/api/contractor-settlements", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractor-settlements", assigneeType, assigneeId] });
      setFee(""); setVatIncluded(false); setPaymentMethod("cash"); setProjectId(""); setNotes("");
      toast({ title: t.success || "Saved", description: t.settlementCreated || "Settlement created" });
      setTab("settlements");
    },
    onError: (e: any) => toast({ title: t.error || "Error", description: e.message, variant: "destructive" }),
  });

  const markSentMut = useMutation({
    mutationFn: async (id: string) => apiRequest("PATCH", `/api/contractor-settlements/${id}`, { status: "sent" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractor-settlements", assigneeType, assigneeId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/contractor-settlements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractor-settlements", assigneeType, assigneeId] });
      toast({ title: t.success || "Deleted" });
    },
    onError: (e: any) => toast({ title: t.error || "Error", description: e.message, variant: "destructive" }),
  });

  const feeNum = parseFloat(fee) || 0;
  const vatAmt = vatIncluded ? +(feeNum * 0.15).toFixed(2) : 0;
  const total = +(feeNum + vatAmt).toFixed(2);

  const actionBadge = (a: string) => {
    if (a === "assigned") return <Badge className="bg-blue-600 text-white">{t.assigned || "Assigned"}</Badge>;
    if (a === "completed") return <Badge className="bg-green-600 text-white">{t.completed || "Completed"}</Badge>;
    return <Badge variant="secondary">{t.unassigned || "Unassigned"}</Badge>;
  };

  const sendWhatsApp = (s: SettlementRow) => {
    if (!assigneePhone) {
      toast({ title: t.error || "Error", description: t.noPhoneNumber || "No phone number on file", variant: "destructive" });
      return;
    }
    const phone = formatPhoneForWhatsApp(assigneePhone).replace(/^\+/, "");
    const pdfUrl = `${window.location.origin}/api/contractor-settlements/${s.id}/pdf`;
    const text = `*Settlement Voucher | سند تسوية*
Payee | المستفيد: ${assigneeName}
Fee | الأتعاب: ${parseFloat(s.fee).toFixed(2)} SAR
VAT 15% | الضريبة: ${parseFloat(s.vatAmount).toFixed(2)} SAR
Total | الإجمالي: ${parseFloat(s.totalAmount).toFixed(2)} SAR
Payment Method | طريقة الدفع: ${s.paymentMethod}

Document | المستند:
${pdfUrl}

Please confirm receipt | يرجى تأكيد الاستلام.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    if (s.status === "draft") markSentMut.mutate(s.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(t.assignmentFile || "Assignment File")} — {assigneeName}</DialogTitle>
          <DialogDescription>
            {t.assignmentFileDesc || "Full history of assignments + settlements for this person."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history" data-testid="tab-history">{t.history || "History"}</TabsTrigger>
            <TabsTrigger value="settlements" data-testid="tab-settlements">{t.settlements || "Settlements"}</TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new-settlement">{t.newSettlement || "New Settlement"}</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-2 mt-4">
            {histLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t.loading || "Loading..."}</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-history">
                {t.noAssignmentHistory || "No assignment history yet."}
              </p>
            ) : (() => {
              const filtered = histProjectFilter === "all"
                ? history
                : history.filter(h => h.projectId === histProjectFilter);
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const page = Math.min(histPage, totalPages);
              const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
              const projOpts = Array.from(new Map(history.filter(h => h.projectId).map(h => [h.projectId, { id: h.projectId, name: h.projectName || "", number: h.projectNumber || "" }])).values());
              return (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Select value={histProjectFilter} onValueChange={(v) => { setHistProjectFilter(v); setHistPage(1); }}>
                      <SelectTrigger className="w-[260px]" data-testid="select-history-project-filter"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allProjects || "All Projects"}</SelectItem>
                        {projOpts.map(p => (
                          <SelectItem key={p.id} value={p.id}>#{p.number} — {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">{filtered.length} {t.entries || "entries"}</span>
                  </div>
                  {paged.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-2 p-3 rounded-md border" data-testid={`history-row-${h.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {actionBadge(h.action)}
                          <Badge variant="outline">{h.role === "phase_lead" ? (t.phaseLead || "Phase Lead") : (t.taskAssignee || "Task")}</Badge>
                          <Badge variant="secondary">Phase {h.phase}</Badge>
                          <span className="font-medium truncate">{h.taskName || "-"}</span>
                        </div>
                        {h.projectId && (
                          <Link href={`/service-projects/${h.projectId}`} className="text-xs text-muted-foreground hover:underline block mt-1">
                            {h.projectNumber ? `#${h.projectNumber} • ` : ""}{h.projectName || ""}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</span>
                        {h.projectId && (
                          <Button size="sm" variant="outline"
                            onClick={() => { setProjectId(h.projectId); setTab("new"); }}
                            data-testid={`button-create-settlement-from-${h.id}`}>
                            <Plus className="h-3 w-3 mr-1" /> {t.settle || "Settle"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setHistPage(page - 1)} data-testid="button-history-prev">{t.previous || "Previous"}</Button>
                      <span className="text-xs">{page} / {totalPages}</span>
                      <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setHistPage(page + 1)} data-testid="button-history-next">{t.next || "Next"}</Button>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="settlements" className="space-y-2 mt-4">
            {settLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t.loading || "Loading..."}</p>
            ) : settlements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-settlements">
                {t.noSettlements || "No settlements yet."}
              </p>
            ) : null}
            {settlements.length > 0 && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Select value={settProjectFilter} onValueChange={(v) => { setSettProjectFilter(v); setSettPage(1); }}>
                  <SelectTrigger className="w-[260px]" data-testid="select-settlement-project-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allProjects || "All Projects"}</SelectItem>
                    <SelectItem value="none">{t.noProject || "No Project"}</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>#{p.projectNumber} — {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {(settProjectFilter === "all" ? settlements : settProjectFilter === "none" ? settlements.filter(s => !s.projectId) : settlements.filter(s => s.projectId === settProjectFilter)).length} {t.entries || "entries"}
                </span>
              </div>
            )}
            {settlements.length > 0 && (() => {
              const filtered = settProjectFilter === "all"
                ? settlements
                : settProjectFilter === "none"
                ? settlements.filter(s => !s.projectId)
                : settlements.filter(s => s.projectId === settProjectFilter);
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const page = Math.min(settPage, totalPages);
              const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
              return (<>
                {paged.map((s) => {
                const proj = projects.find(p => p.id === s.projectId);
                return (
                  <div key={s.id} className="p-3 rounded-md border space-y-2" data-testid={`settlement-row-${s.id}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={s.status === "sent" ? "bg-green-600 text-white" : "bg-amber-500 text-white"}>
                          {s.status === "sent" ? (t.sent || "Sent") : (t.draft || "Draft")}
                        </Badge>
                        <span className="font-semibold text-base">{parseFloat(s.totalAmount).toFixed(2)} SAR</span>
                        <span className="text-xs text-muted-foreground">
                          ({parseFloat(s.fee).toFixed(2)} + VAT {parseFloat(s.vatAmount).toFixed(2)})
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    {proj && (
                      <div className="text-xs text-muted-foreground">
                        #{proj.projectNumber} • {proj.name}
                      </div>
                    )}
                    {s.notes && <div className="text-xs whitespace-pre-wrap">{s.notes}</div>}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" asChild data-testid={`button-download-pdf-${s.id}`}>
                        <a href={`/api/contractor-settlements/${s.id}/pdf`} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4 mr-1" /> {t.pdf || "PDF"}
                        </a>
                      </Button>
                      <Button size="sm" onClick={() => sendWhatsApp(s)} data-testid={`button-whatsapp-${s.id}`}>
                        <Send className="h-4 w-4 mr-1" /> {t.sendWhatsApp || "WhatsApp"}
                      </Button>
                      {s.status === "draft" && (
                        <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(s.id)} data-testid={`button-delete-settlement-${s.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setSettPage(page - 1)} data-testid="button-settlements-prev">{t.previous || "Previous"}</Button>
                  <span className="text-xs">{page} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setSettPage(page + 1)} data-testid="button-settlements-next">{t.next || "Next"}</Button>
                </div>
              )}
              </>);
            })()}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settlement-fee">{t.fee || "Fee"} (SAR) *</Label>
                <Input id="settlement-fee" type="number" step="0.01" min="0" value={fee}
                  onChange={(e) => setFee(e.target.value)} data-testid="input-settlement-fee" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settlement-payment">{t.paymentMethod || "Payment Method"}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="settlement-payment" data-testid="select-payment-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.cash || "Cash"}</SelectItem>
                    <SelectItem value="bank_transfer">{t.bankTransfer || "Bank Transfer"}</SelectItem>
                    <SelectItem value="other">{t.other || "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="settlement-project">{t.project || "Project"} ({t.optional || "optional"})</Label>
                <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
                  <SelectTrigger id="settlement-project" data-testid="select-settlement-project"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.none || "None"}</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>#{p.projectNumber} — {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch checked={vatIncluded} onCheckedChange={setVatIncluded} id="vat-switch" data-testid="switch-vat" />
                <Label htmlFor="vat-switch">{t.addVat15 || "Add VAT 15%"}</Label>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="settlement-notes">{t.notes || "Notes"}</Label>
                <Textarea id="settlement-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} data-testid="textarea-settlement-notes" />
              </div>
            </div>
            <div className="rounded-md border p-3 bg-muted/30 text-sm">
              <div className="flex justify-between"><span>{t.fee || "Fee"}</span><span>{feeNum.toFixed(2)} SAR</span></div>
              <div className="flex justify-between"><span>VAT (15%)</span><span>{vatAmt.toFixed(2)} SAR</span></div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>{t.total || "Total"}</span><span>{total.toFixed(2)} SAR</span></div>
            </div>
            <Button onClick={() => createMut.mutate()} disabled={!feeNum || createMut.isPending}
              className="w-full" data-testid="button-create-settlement">
              <Plus className="h-4 w-4 mr-1" /> {createMut.isPending ? (t.saving || "Saving...") : (t.createSettlement || "Create Settlement")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
