import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowDownLeft, ArrowUpRight, Banknote, CalendarDays,
  CheckCircle2, Clock3, Coins, Gauge, Loader2, RefreshCw, Save,
  Settings2, ShieldCheck, Users, Utensils, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useBranch } from "@/contexts/BranchContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { generalOverviewTranslations } from "@/i18n/translations";
import { useToast } from "@/hooks/use-toast";

const today = new Date();
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const pick = (object: any, ...keys: string[]) => keys.reduce((value, key) => value ?? object?.[key], undefined);
const asArray = (value: any) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
const normalizeZatcaRows = (rows: any[]) => rows.map((row) => {
  const firstError = Array.isArray(row.errors) ? row.errors[0] : row.errors;
  const error = typeof firstError === "object" ? firstError?.message || firstError?.error : firstError;
  return {
    ...row,
    status: row.status || row.submissionStatus,
    type: row.type || row.invoiceType,
    lastError: row.lastError || error,
    attemptCount: row.attemptCount ?? row.attempts ?? row.retryCount,
    lastAttemptAt: row.lastAttemptAt || row.latestAttemptAt || row.attemptedAt,
  };
});

type OverviewText = typeof generalOverviewTranslations.English | typeof generalOverviewTranslations.Arabic;
type Tone = "slate" | "orange" | "emerald" | "sky" | "violet" | "rose";

const toneClasses: Record<Tone, string> = {
  slate: "bg-muted text-muted-foreground",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function Metric({ label, value, note, tone = "slate", icon: Icon }: {
  label: string; value: string; note?: string; tone?: Tone; icon: any;
}) {
  return (
    <Card className="border-border/70 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight" dir="ltr">{value}</p>
          </div>
          <span className={`rounded-lg p-2 ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></span>
        </div>
        {note && <p className="mt-2 text-xs text-muted-foreground"><bdi>{note}</bdi></p>}
      </CardContent>
    </Card>
  );
}

function Section({ title, eyebrow, children, action }: {
  title: string; eyebrow: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b bg-card/70 px-4 py-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><CardTitle className="mt-1 text-base">{title}</CardTitle></div>
        {action}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function ZatcaTable({ rows, retryMutation, text, locale }: {
  rows: any[]; retryMutation: any; text: OverviewText; locale: string;
}) {
  const statusLabel = (status: string) => {
    const normalized = status.toLowerCase();
    if (["cleared", "accepted", "success"].includes(normalized)) return text.clearedLabel;
    if (["reported"].includes(normalized)) return text.reported;
    if (normalized === "pending") return text.statusPending;
    if (normalized === "rejected") return text.statusRejected;
    if (normalized === "accepted") return text.statusAccepted;
    if (normalized === "error") return text.statusError;
    if (normalized === "failed") return text.failedLabel;
    return status || text.unknown;
  };
  return (
    <Section eyebrow={text.compliance} title={text.invoiceTransmission}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-start text-xs" data-testid="table-zatca-transactions">
          <thead className="border-b text-muted-foreground">
            <tr>{[text.invoice, text.type, text.status, text.lastError, text.attempts, text.lastAttempt, text.action].map((heading) => <th className="px-2 pb-2 text-start font-medium" key={heading}>{heading}</th>)}</tr>
          </thead>
          <tbody>{rows.map((row, index) => {
            const status = String(row.status || "unknown").toLowerCase();
            const retryable = ["pending", "failed", "rejected", "error"].includes(status);
            return (
              <tr className="border-b last:border-0" key={row.id || row.invoiceId || index} data-testid={`row-zatca-${row.invoiceId || row.id || index}`}>
                <td className="px-2 py-2 font-mono" dir="ltr">{row.invoiceNumber || row.invoiceId || "—"}</td>
                <td className="px-2 py-2">{row.type || "—"}</td>
                <td className="px-2 py-2"><Badge variant={retryable ? "destructive" : "outline"}>{statusLabel(row.status || "")}</Badge></td>
                <td className="max-w-[180px] truncate px-2 py-2 text-muted-foreground">{row.lastError || "—"}</td>
                <td className="px-2 py-2 font-mono" dir="ltr">{row.attemptCount ?? "—"}</td>
                <td className="px-2 py-2 text-muted-foreground" dir="ltr">{row.lastAttemptAt ? new Date(row.lastAttemptAt).toLocaleString(locale) : "—"}</td>
                <td className="px-2 py-2 text-end">{retryable && <Button size="sm" variant="outline" disabled={retryMutation.isPending} onClick={() => { if (window.confirm(text.retryConfirm)) retryMutation.mutate(row.invoiceId || row.id); }} data-testid={`button-retry-zatca-${row.invoiceId || row.id || index}`}>{retryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : text.retry}</Button>}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {!rows.length && <p className="py-5 text-center text-sm text-muted-foreground">{text.noInvoices}</p>}
      </div>
    </Section>
  );
}

function LaborOperations({ branchId, text }: { branchId: string; text: OverviewText }) {
  const { toast } = useToast();
  const readUrl = (path: string) => `/api/general-overview/${path}${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`;
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ["/api/general-overview/employees", branchId], queryFn: async () => { const response = await fetch(readUrl("employees")); return response.ok ? asArray(await response.json()) : []; } });
  const { data: schedules = [] } = useQuery<any[]>({ queryKey: ["/api/general-overview/work-schedules", branchId], queryFn: async () => { const response = await fetch(readUrl("work-schedules")); return response.ok ? asArray(await response.json()) : []; } });
  const { data: timeEntries = [] } = useQuery<any[]>({ queryKey: ["/api/general-overview/time-entries", branchId], queryFn: async () => { const response = await fetch(readUrl("time-entries")); return response.ok ? asArray(await response.json()) : []; } });
  const [employeeId, setEmployeeId] = useState("");
  const [shiftDate, setShiftDate] = useState(isoDate(today));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [exitDate, setExitDate] = useState(isoDate(today));
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: async ({ path, body }: any) => (await apiRequest("POST", `/api/general-overview/${path}?branchId=${encodeURIComponent(branchId)}`, body)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-overview/work-schedules", branchId] });
      queryClient.invalidateQueries({ queryKey: ["/api/general-overview/time-entries", branchId] });
      toast({ title: text.laborSaved });
    },
    onError: () => toast({ title: text.laborSaveFailed, description: text.checkEmployeeDates, variant: "destructive" }),
  });
  const employeeSelect = (
    <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={!branchId} className="h-9 w-full rounded-md border bg-background px-2 text-sm" data-testid="select-labor-employee">
      <option value="">{text.selectEmployee}</option>
      {employees.map((employee: any) => <option key={employee.id} value={employee.id}>{employee.name || employee.fullName || employee.email}</option>)}
    </select>
  );
  return (
    <Section eyebrow={text.people} title={text.laborOperations}>
      <p className="mb-4 text-sm text-muted-foreground">{branchId ? `${employees.length} ${text.employeeAvailable}` : text.selectBranchLabor}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <form className="space-y-2 rounded-lg border bg-card p-3" onSubmit={(event) => { event.preventDefault(); save.mutate({ path: "work-schedules", body: { employeeId, shiftDate, scheduledStart: start, scheduledEnd: end } }); }}>
          <h3 className="font-semibold">{text.scheduleShift}</h3>{employeeSelect}
          <Label>{text.shiftDate}</Label><Input className="text-start" dir="ltr" type="date" value={shiftDate} onChange={(event) => setShiftDate(event.target.value)} disabled={!branchId} required />
          <div className="grid grid-cols-2 gap-2"><Input dir="ltr" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} disabled={!branchId} required aria-label={text.scheduledStart} /><Input dir="ltr" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} disabled={!branchId} required aria-label={text.scheduledEnd} /></div>
          <Button className="w-full" disabled={!branchId || save.isPending} data-testid="button-save-schedule">{text.saveSchedule}</Button>
        </form>
        <form className="space-y-2 rounded-lg border bg-card p-3" onSubmit={(event) => { event.preventDefault(); save.mutate({ path: "time-entries", body: { employeeId, clockIn, clockOut } }); }}>
          <h3 className="font-semibold">{text.actualTime}</h3>{employeeSelect}
          <Input dir="ltr" type="datetime-local" value={clockIn} onChange={(event) => setClockIn(event.target.value)} disabled={!branchId} required aria-label={text.clockIn} />
          <Input dir="ltr" type="datetime-local" value={clockOut} onChange={(event) => setClockOut(event.target.value)} disabled={!branchId} required aria-label={text.clockOut} />
          <Button className="w-full" disabled={!branchId || save.isPending} data-testid="button-save-time-entry">{text.saveTime}</Button>
        </form>
        <form className="space-y-2 rounded-lg border bg-card p-3" onSubmit={(event) => { event.preventDefault(); save.mutate({ path: "employment-exits", body: { employeeId, exitDate, reason } }); }}>
          <h3 className="font-semibold">{text.employmentExit}</h3>{employeeSelect}
          <Input dir="ltr" type="date" value={exitDate} onChange={(event) => setExitDate(event.target.value)} disabled={!branchId} required aria-label={text.exitDate} />
          <Input placeholder={text.reason} value={reason} onChange={(event) => setReason(event.target.value)} disabled={!branchId} required />
          <Button variant="outline" className="w-full" disabled={!branchId || save.isPending} data-testid="button-save-employment-exit">{text.recordExit}</Button>
        </form>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{text.recentSchedules}</h3>{schedules.slice(0, 4).map((item: any, index) => <p className="border-t py-2 text-sm font-mono" dir="ltr" key={item.id || index}>{item.shiftDate} · {item.scheduledStart}–{item.scheduledEnd}</p>)}</div>
        <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{text.recentEntries}</h3>{timeEntries.slice(0, 4).map((item: any, index) => <p className="border-t py-2 text-sm font-mono" dir="ltr" key={item.id || index}>{item.clockIn}–{item.clockOut}</p>)}</div>
      </div>
    </Section>
  );
}

export default function GeneralOverview() {
  const { user } = useAuth();
  const { branches, currentBranch } = useBranch();
  const { lastNotification } = useNotifications();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const text: OverviewText = language === "Arabic" ? generalOverviewTranslations.Arabic : generalOverviewTranslations.English;
  const originalDocumentTitle = useRef(document.title);
  const locale = language === "Arabic" ? "ar-SA" : "en-US";
  const money = (value: unknown) => `${Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
  const [branchId, setBranchId] = useState("all");
  const [range, setRange] = useState({ start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: isoDate(today) });
  const [showSettings, setShowSettings] = useState(false);
  const [threshold, setThreshold] = useState("32");
  const [waste, setWaste] = useState({ itemName: "", quantity: "1", unit: "kg", cost: "", reason: "spoilage", occurredAt: isoDate(today) });
  const [cash, setCash] = useState({ type: "outflow", category: "", amount: "", description: "", occurredAt: isoDate(today) });
  const [commitment, setCommitment] = useState({ kind: "payable", category: "", amount: "", dueDate: isoDate(today), description: "" });
  const [loyaltyEntry, setLoyaltyEntry] = useState({ customerId: "", points: "1", type: "enrollment" });
  const selectedBranchId = branchId === "all" ? "" : branchId;
  const querySuffix = `${selectedBranchId ? `branchId=${encodeURIComponent(selectedBranchId)}&` : ""}start=${range.start}T00:00:00.000Z&end=${range.end}T23:59:59.999Z`;
  const key = (path: string) => [`/api/general-overview/${path}?${querySuffix}`];
  const { data: summary, isLoading, isError, refetch } = useQuery<any>({ queryKey: key("summary"), queryFn: async () => { const response = await fetch(`/api/general-overview/summary?${querySuffix}`); if (!response.ok) throw new Error(text.loadError); return response.json(); }, refetchInterval: 30000 });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/general-overview/settings", selectedBranchId], queryFn: async () => { const response = await fetch(`/api/general-overview/settings?branchId=${encodeURIComponent(selectedBranchId)}`); if (!response.ok) throw new Error(text.loadError); return response.json(); }, enabled: !!selectedBranchId });
  const branchOnlyUrl = (path: string) => `/api/general-overview/${path}${selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : ""}`;
  const { data: wasteRows = [] } = useQuery<any[]>({ queryKey: key("waste"), queryFn: async () => { const response = await fetch(branchOnlyUrl("waste")); return response.ok ? asArray(await response.json()) : []; } });
  const { data: cashRows = [] } = useQuery<any[]>({ queryKey: key("cash-entries"), queryFn: async () => { const response = await fetch(branchOnlyUrl("cash-entries")); return response.ok ? asArray(await response.json()) : []; } });
  const { data: commitments = [] } = useQuery<any[]>({ queryKey: key("commitments"), queryFn: async () => { const response = await fetch(branchOnlyUrl("commitments")); return response.ok ? asArray(await response.json()) : []; } });
  const { data: loyalty = [] } = useQuery<any>({ queryKey: key("loyalty"), queryFn: async () => { const response = await fetch(branchOnlyUrl("loyalty")); return response.ok ? response.json() : {}; } });
  const { data: zatcaRows = [] } = useQuery<any[]>({ queryKey: key("zatca"), queryFn: async () => { const response = await fetch(`/api/general-overview/zatca${selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : ""}`); return response.ok ? asArray(await response.json()) : []; } });
  const retryMutation = useMutation({ mutationFn: async (invoiceId: string) => (await apiRequest("POST", `/api/general-overview/zatca/${invoiceId}/retry`, {})).json(), onSuccess: () => { queryClient.invalidateQueries({ queryKey: key("zatca") }); queryClient.invalidateQueries({ queryKey: key("summary") }); toast({ title: text.retryQueued }); }, onError: () => toast({ title: text.retryFailed, variant: "destructive" }) });

  useEffect(() => {
    document.title = text.browserTitle;
  }, [text.browserTitle]);
  useEffect(() => () => {
    document.title = originalDocumentTitle.current;
  }, []);
  useEffect(() => { if (settings) setThreshold(String(pick(settings, "foodCostThreshold", "threshold", "foodCostTarget") ?? 32)); }, [settings]);
  useEffect(() => {
    const event = lastNotification as any;
    const branchMatches = !selectedBranchId || !event?.branchId || event.branchId === selectedBranchId;
    if (event && branchMatches && ["overview:updated", "zatca:updated", "sales:updated", "order:created", "order:statusUpdated"].includes(event.type)) {
      queryClient.invalidateQueries({ queryKey: key("summary") });
      if (selectedBranchId) {
        queryClient.invalidateQueries({ queryKey: key("waste") });
        queryClient.invalidateQueries({ queryKey: key("cash-entries") });
        queryClient.invalidateQueries({ queryKey: key("zatca") });
      }
    }
  }, [lastNotification, selectedBranchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canWrite = !!selectedBranchId;
  const mutate = (path: string, body: any, invalidates: string[]) => useMutation({
    mutationFn: async () => {
      if (!selectedBranchId) throw new Error(text.selectBranchError);
      const response = await apiRequest("POST", `/api/general-overview/${path}?branchId=${encodeURIComponent(selectedBranchId)}`, body);
      return response.json ? response.json() : response;
    },
    onSuccess: () => { invalidates.forEach((pathToInvalidate) => queryClient.invalidateQueries({ queryKey: key(pathToInvalidate) })); toast({ title: text.saved, description: text.overviewUpdated }); },
    onError: (error: any) => toast({ title: text.saveFailed, description: error?.message || text.saveFailed, variant: "destructive" }),
  });
  const wasteMutation = mutate("waste", { ...waste, reason: waste.reason === text.spoilage ? "spoilage" : waste.reason, quantity: Number(waste.quantity), cost: Number(waste.cost || 0) }, ["waste", "summary"]);
  const cashMutation = mutate("cash-entries", { ...cash, amount: Number(cash.amount) }, ["cash-entries", "summary"]);
  const commitmentMutation = mutate("commitments", { ...commitment, amount: Number(commitment.amount) }, ["commitments", "summary"]);
  const loyaltyMutation = mutate("loyalty/transactions", { ...loyaltyEntry, points: Number(loyaltyEntry.points) }, ["loyalty", "summary"]);
  const settingsMutation = useMutation({ mutationFn: async () => { const response = await apiRequest("PATCH", `/api/general-overview/settings?branchId=${encodeURIComponent(selectedBranchId)}`, { foodCostThreshold: Number(threshold) }); return response.json ? response.json() : response; }, onSuccess: () => { setShowSettings(false); queryClient.invalidateQueries({ queryKey: ["/api/general-overview/settings", selectedBranchId] }); toast({ title: text.thresholdUpdated }); } });
  const overview = summary || {};
  const food = overview.foodCost || {};
  const cashFlow = overview.cashFlow || {};
  const zatca = overview.zatca || {};
  const labor = overview.labor || {};
  const retention = overview.retention || {};
  const branchName = branchId === "all" ? text.allBranches : branches.find((branch) => branch.id === branchId)?.name || currentBranch?.name || text.selectedBranch;
  const chart = asArray(pick(overview, "series", "salesSeries"));
  const maxChart = Math.max(...chart.map((item: any) => Number(pick(item, "value", "sales", "amount") || 0)), 1);
  const unassigned = Number(pick(overview, "unassignedCount", "unassignedRecords") || 0);
  const upcoming = useMemo(() => commitments.slice(0, 5), [commitments]);
  const cogsMethod = pick(food, "estimateMethod", "method", "cogsMethod");
  const cogsWarning = pick(food, "estimateWarning", "warning");
  const runway = pick(cashFlow, "runway", "runwayDays");
  const unavailable = runway === null || runway === undefined || runway === "";

  if (!user) return null;
  return (
    <main className="min-h-full bg-background p-3 text-foreground sm:p-5 lg:p-7" data-testid="page-general-overview" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Gauge className="h-4 w-4" />{text.operationsControl}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">{text.title}</h1><p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" data-testid="select-overview-branch"><option value="all">{text.allBranches}</option>{branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</select>
            <Input dir="ltr" type="date" value={range.start} onChange={(event) => setRange({ ...range, start: event.target.value })} className="h-9 w-[135px]" data-testid="input-overview-start" /><span className="text-xs text-muted-foreground">{text.to}</span><Input dir="ltr" type="date" value={range.end} onChange={(event) => setRange({ ...range, end: event.target.value })} className="h-9 w-[135px]" data-testid="input-overview-end" />
            <Button variant="outline" size="icon" onClick={() => refetch()} aria-label={text.refresh} data-testid="button-refresh-overview"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{branchName}</Badge>
          <span className="text-xs text-muted-foreground">{text.liveRead}</span>
          {!canWrite && <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-800 dark:text-amber-300">{text.selectBranch}</Badge>}
          {unassigned > 0 && <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-800 dark:text-amber-300"><AlertTriangle className="me-1 h-3 w-3" /><bdi>{unassigned} {text.unassigned}</bdi></Badge>}
        </div>
        {isError ? (
          <Card className="border-destructive/40 bg-destructive/10"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-destructive">{text.loadError}<Button variant="outline" onClick={() => refetch()} data-testid="button-retry-overview">{text.retry}</Button></CardContent></Card>
        ) : isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((number) => <div key={number} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : (
          <>
            <fieldset disabled={!canWrite} className="contents" aria-label={text.branchControls}>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label={text.foodCost} value={`${Number(pick(food, "percentage", "actualPercent") || 0).toFixed(1)}%`} note={`${text.target} ${threshold}% · ${text.actual} ${money(pick(food, "actualCogs", "actual"))}`} tone="orange" icon={Utensils} />
                <Metric label={text.cashBalance} value={money(pick(cashFlow, "balance", "net"))} note={`${text.in} ${money(pick(cashFlow, "inflow", "cashIn"))} · ${text.out} ${money(pick(cashFlow, "outflow", "cashOut"))}`} tone="emerald" icon={Banknote} />
                <Metric label={text.zatcaToday} value={`${Number(pick(zatca, "dailySuccessRate", "successRate") || 0).toFixed(1)}%`} note={`${pick(zatca, "cleared", "clearedCount") || 0} ${text.cleared} · ${pick(zatca, "failed", "failedCount") || 0} ${text.failed}`} tone="sky" icon={ShieldCheck} />
                <Metric label={text.repeatCustomers} value={`${Number(pick(retention, "repeatRate", "repeatCustomerRate") || 0).toFixed(1)}%`} note={`${pick(retention, "enrolled", "loyaltyEnrollment") || 0} ${text.loyaltyEnrolled}`} tone="violet" icon={Users} />
              </section>
              <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <Section eyebrow={text.marginWatch} title={text.foodWaste} action={<Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} data-testid="button-food-settings"><Settings2 className="me-1.5 h-4 w-4" />{text.threshold}</Button>}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><p className="text-xs text-muted-foreground">{text.theoreticalCogs}</p><p className="mt-1 font-mono text-lg font-semibold" dir="ltr">{money(pick(food, "theoreticalCogs", "theoretical"))}</p></div>
                    <div><p className="text-xs text-muted-foreground">{text.actualCogs}</p><p className="mt-1 font-mono text-lg font-semibold" dir="ltr">{money(pick(food, "actualCogs", "actual"))}</p></div>
                    <div className={Number(pick(food, "percentage", "actualPercent") || 0) > Number(threshold) ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}><p className="text-xs">{text.varianceSignal}</p><p className="mt-1 flex items-center gap-1 font-semibold">{Number(pick(food, "percentage", "actualPercent") || 0) > Number(threshold) ? <><AlertTriangle className="h-4 w-4" />{text.aboveThreshold}</> : <><CheckCircle2 className="h-4 w-4" />{text.withinThreshold}</>}</p></div>
                  </div>
                  {showSettings && <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"><div><Label htmlFor="food-threshold">{text.foodTarget}</Label><Input id="food-threshold" dir="ltr" type="number" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="mt-1 w-28" data-testid="input-food-threshold" /></div><Button onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending} data-testid="button-save-food-threshold"><Save className="me-1.5 h-4 w-4" />{text.save}</Button></div>}
                  <div className="mt-5 flex h-20 items-end gap-1 border-b" dir="ltr">{chart.slice(-14).map((item: any, index: number) => <div key={index} className="group flex flex-1 flex-col justify-end" title={money(pick(item, "value", "sales", "amount"))}><div className="rounded-t-sm bg-primary/70 transition-all duration-300 group-hover:bg-primary" style={{ height: `${Math.max(8, Number(pick(item, "value", "sales", "amount") || 0) / maxChart * 100)}%` }} /></div>)}</div>
                  <form className="mt-5 grid gap-2 sm:grid-cols-5" onSubmit={(event) => { event.preventDefault(); wasteMutation.mutate(); }}><Input placeholder={text.itemName} value={waste.itemName} onChange={(event) => setWaste({ ...waste, itemName: event.target.value })} required data-testid="input-waste-item" /><Input dir="ltr" type="number" placeholder={text.quantity} value={waste.quantity} onChange={(event) => setWaste({ ...waste, quantity: event.target.value })} required /><Input dir="ltr" type="number" placeholder={text.costSar} value={waste.cost} onChange={(event) => setWaste({ ...waste, cost: event.target.value })} /><Input placeholder={text.reason} value={waste.reason === "spoilage" ? text.spoilage : waste.reason} onChange={(event) => setWaste({ ...waste, reason: event.target.value })} /><Button type="submit" disabled={wasteMutation.isPending} data-testid="button-log-waste">{wasteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : text.logWaste}</Button></form>
                  <div className="mt-4 space-y-2">{wasteRows.slice(0, 3).map((row: any, index: number) => <div className="flex justify-between border-t pt-2 text-sm" key={row.id || index}><span>{row.itemName} <span className="text-muted-foreground">· {row.reason}</span></span><span className="font-mono" dir="ltr">{money(row.cost)}</span></div>)}</div>
                </Section>
                <Section eyebrow={text.liquidity} title={text.cashControl}>
                  <div className="grid grid-cols-2 gap-3"><Metric label={text.cashIn} value={money(pick(cashFlow, "inflow", "cashIn"))} note={text.selectedPeriod} tone="emerald" icon={ArrowDownLeft} /><Metric label={text.cashOut} value={money(pick(cashFlow, "outflow", "cashOut"))} note={text.selectedPeriod} tone="rose" icon={ArrowUpRight} /></div>
                  <form className="mt-5 space-y-2" onSubmit={(event) => { event.preventDefault(); cashMutation.mutate(); }}><div className="grid grid-cols-2 gap-2"><select value={cash.type} onChange={(event) => setCash({ ...cash, type: event.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="outflow">{text.cashOut}</option><option value="inflow">{text.cashIn}</option></select><Input dir="ltr" type="number" placeholder={text.amountSar} value={cash.amount} onChange={(event) => setCash({ ...cash, amount: event.target.value })} required /></div><div className="grid grid-cols-2 gap-2"><Input placeholder={text.category} value={cash.category} onChange={(event) => setCash({ ...cash, category: event.target.value })} required /><Input placeholder={text.description} value={cash.description} onChange={(event) => setCash({ ...cash, description: event.target.value })} /></div><Button className="w-full" type="submit" disabled={cashMutation.isPending} data-testid="button-add-cash-entry">{cashMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : text.addCash}</Button></form>
                  <div className="mt-4 space-y-2">{cashRows.slice(0, 3).map((row: any, index: number) => <div className="flex justify-between border-t pt-2 text-sm" key={row.id || index}><span>{row.category || row.description || text.entry}</span><span dir="ltr" className={`font-mono ${row.type === "inflow" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{row.type === "inflow" ? "+" : "-"}{money(row.amount)}</span></div>)}</div>
                </Section>
              </div>
              <div className="grid gap-5 xl:grid-cols-3">
                <Section eyebrow={text.compliance} title={text.zatcaHealth}><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-emerald-500/10 p-3"><CheckCircle2 className="mx-auto h-4 w-4 text-emerald-700 dark:text-emerald-300" /><p className="mt-1 font-mono text-xl font-semibold" dir="ltr">{pick(zatca, "cleared", "clearedCount") || 0}</p><p className="text-[11px] text-muted-foreground">{text.clearedLabel}</p></div><div className="rounded-lg bg-sky-500/10 p-3"><Clock3 className="mx-auto h-4 w-4 text-sky-700 dark:text-sky-300" /><p className="mt-1 font-mono text-xl font-semibold" dir="ltr">{pick(zatca, "reported", "reportedCount") || 0}</p><p className="text-[11px] text-muted-foreground">{text.reported}</p></div><div className="rounded-lg bg-red-500/10 p-3"><XCircle className="mx-auto h-4 w-4 text-red-700 dark:text-red-300" /><p className="mt-1 font-mono text-xl font-semibold" dir="ltr">{pick(zatca, "failed", "failedCount") || 0}</p><p className="text-[11px] text-muted-foreground">{text.failedLabel}</p></div></div><p className="mt-4 text-xs text-muted-foreground">{text.zatcaNote}</p></Section>
                <Section eyebrow={text.people} title={text.laborPulse}><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground">{text.laborPercent}</p><p className="font-mono text-2xl font-semibold" dir="ltr">{Number(pick(labor, "percentage", "laborPercent") || 0).toFixed(1)}%</p></div><div><p className="text-xs text-muted-foreground">{text.scheduleVariance}</p><p className="font-mono text-2xl font-semibold" dir="ltr">{Number(pick(labor, "variance", "scheduledActualVariance") || 0).toFixed(1)}h</p></div></div><div className="mt-5 flex items-center justify-between border-t pt-3 text-sm"><span>{text.turnover}</span><Badge variant="outline" dir="ltr">{Number(pick(labor, "turnover", "turnoverRate") || 0).toFixed(1)}%</Badge></div></Section>
                <Section eyebrow={text.forwardView} title={text.upcoming}><div className="space-y-3">{upcoming.length ? upcoming.map((row: any, index: number) => <div className="flex items-center gap-3 border-b pb-2 text-sm last:border-0" key={row.id || index}><CalendarDays className="h-4 w-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{row.description || row.category || text.commitment}</p><p className="text-xs text-muted-foreground"><bdi>{row.dueDate || text.noDueDate}</bdi> · {row.kind === "expected_inflow" ? text.expectedIn : text.payable}</p></div><span className="font-mono text-sm" dir="ltr">{money(row.amount)}</span></div>) : <p className="py-5 text-center text-sm text-muted-foreground">{text.noCommitments}</p>}</div><form className="mt-4 space-y-2 border-t pt-4" onSubmit={(event) => { event.preventDefault(); commitmentMutation.mutate(); }}><div className="grid grid-cols-2 gap-2"><select value={commitment.kind} onChange={(event) => setCommitment({ ...commitment, kind: event.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="payable">{text.payable}</option><option value="expected_inflow">{text.expectedInflow}</option></select><Input dir="ltr" type="number" placeholder={text.amountSar} value={commitment.amount} onChange={(event) => setCommitment({ ...commitment, amount: event.target.value })} required /></div><div className="grid grid-cols-2 gap-2"><Input placeholder={text.category} value={commitment.category} onChange={(event) => setCommitment({ ...commitment, category: event.target.value })} required /><Input dir="ltr" type="date" value={commitment.dueDate} onChange={(event) => setCommitment({ ...commitment, dueDate: event.target.value })} /></div><Button variant="outline" className="w-full" type="submit" disabled={commitmentMutation.isPending} data-testid="button-add-commitment">{commitmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : text.addCommitment}</Button></form></Section>
              </div>
              <Section eyebrow={text.loyalty} title={text.customerRetention}><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{text.enrolledMembers}</p><p className="font-mono text-2xl font-semibold" dir="ltr">{pick(retention, "enrolled", "loyaltyEnrollment") || pick(loyalty, "enrolled", "members") || 0}</p></div><Coins className="h-6 w-6 text-primary" /></div><form className="mt-4 grid gap-2 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); loyaltyMutation.mutate(); }}><Input dir="ltr" placeholder={text.customerId} value={loyaltyEntry.customerId} onChange={(event) => setLoyaltyEntry({ ...loyaltyEntry, customerId: event.target.value })} required data-testid="input-loyalty-customer" /><Input dir="ltr" type="number" placeholder={text.points} value={loyaltyEntry.points} onChange={(event) => setLoyaltyEntry({ ...loyaltyEntry, points: event.target.value })} required /><Button type="submit" disabled={loyaltyMutation.isPending} data-testid="button-add-loyalty">{loyaltyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : text.recordActivity}</Button></form></Section>
              <Section eyebrow={text.cashOutlook} title={text.runwayCommitments}><div className="grid gap-3 sm:grid-cols-3"><Metric label={text.runway} value={unavailable ? text.notAvailable : `${runway} ${text.days}`} icon={Gauge} /><Metric label={text.openPayables} value={money(pick(cashFlow, "openPayables", "payables"))} icon={ArrowUpRight} /><Metric label={text.expectedInflows} value={money(pick(cashFlow, "expectedInflows", "inflows"))} icon={ArrowDownLeft} /></div></Section>
              <Section eyebrow={text.retention} title={text.revenueMix}><div className="grid gap-3 sm:grid-cols-5"><Metric label={text.directRevenue} value={money(pick(retention, "directRevenue", "direct"))} icon={Banknote} /><Metric label={text.deliveryRevenue} value={money(pick(retention, "deliveryRevenue", "deliveryPlatformRevenue"))} icon={Utensils} /><Metric label={text.repeatRate} value={pick(retention, "repeatRate", "repeatCustomerRate") == null ? text.notAvailable : `${Number(pick(retention, "repeatRate", "repeatCustomerRate")).toFixed(1)}%`} icon={Users} /><Metric label={text.enrollments} value={String(pick(retention, "enrolled", "loyaltyEnrollment") ?? text.notAvailable)} icon={Coins} /><Metric label={text.redeemedValue} value={money(pick(retention, "redeemedValue", "redemptionValue"))} icon={ArrowDownLeft} /></div></Section>
              <ZatcaTable rows={normalizeZatcaRows(zatcaRows)} retryMutation={retryMutation} text={text} locale={locale} />
              <LaborOperations branchId={selectedBranchId} text={text} />
            </fieldset>
            <Section eyebrow={text.dataQuality} title={text.estimateNotes}><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">{text.cogsMethod}: </span>{cogsMethod || text.notAvailable}</p><p className={cogsWarning ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}>{cogsWarning ? text.currentRecipeEstimateWarning : text.noCogsWarning}</p><p><span className="text-muted-foreground">{text.cashRunway}: </span><bdi>{unavailable ? text.notAvailable : `${runway} ${text.days}`}</bdi></p></div></Section>
          </>
        )}
      </div>
    </main>
  );
}