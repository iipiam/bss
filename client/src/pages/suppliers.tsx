import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, LayoutGrid, List, Pencil, Trash2, ArrowLeft, ArrowRight, Upload, Eye,
  FileText, Bell, Settings2, BarChart3, Truck, CheckCircle2, Download, X,
} from "lucide-react";

// ---------- types ----------
type EquipmentRow = {
  id?: string; name: string; available: boolean; hourlyRate: string | null;
  dailyRate: string | null; weeklyRate: string | null; hasDriver: boolean; condition: string | null;
};
type Supplier = {
  id: string; companyName: string; contactName: string; phone: string; whatsapp: string | null;
  email: string | null; website: string | null; city: string; coverage: string | null;
  crNumber: string; crExpiry: string | null; vatNumber: string; bankName: string;
  bankAccountName: string; iban: string; paymentMethod: string | null; paymentTerms: string | null;
  taxInvoice: string | null; fuel: string | null; breakdown: string | null; minRental: string | null;
  notice: string | null; cancellation: string | null; insurance: string | null; notes: string | null;
  status: string; completionScore: number; equipmentCount?: number; availableEquipment?: number;
};
type SupplierDetail = Supplier & {
  equipment: (EquipmentRow & { id: string })[];
  payments: { id: string; label: string; amount: string; dueDate: string; status: string; paidDate: string | null }[];
  documents: { id: string; docKey: string; fileName: string }[];
  equipmentDocuments: { id: string; equipmentId: string; docKey: string; fileName: string }[];
  rentals: { id: string; equipmentName: string; startDate: string; endDate: string; location: string | null; referenceNumber: string | null }[];
};

const SUPPLIER_DOC_SLOTS = [
  { key: "iban_cert", en: "IBAN Bank Certificate", ar: "شهادة الآيبان البنكية", required: true },
  { key: "cr_cert", en: "Commercial Registration", ar: "السجل التجاري", required: true },
  { key: "vat_cert", en: "VAT Certificate", ar: "شهادة ضريبة القيمة المضافة", required: true },
  { key: "lic1", en: "Rental Licence", ar: "رخصة التأجير", required: false },
  { key: "lic2", en: "Additional Document", ar: "مستند إضافي", required: false },
];
const EQ_DOC_SLOTS = [
  { key: "photo", en: "Photo", ar: "صورة" },
  { key: "licence", en: "Licence", ar: "الرخصة" },
  { key: "assurance", en: "Insurance", ar: "التأمين" },
  { key: "driver_photo", en: "Driver Photo", ar: "صورة السائق" },
];

const emptyForm = {
  companyName: "", contactName: "", phone: "", whatsapp: "", email: "", website: "",
  city: "", coverage: "", crNumber: "", crExpiry: "", vatNumber: "", bankName: "",
  bankAccountName: "", iban: "", paymentMethod: "", paymentTerms: "", taxInvoice: "",
  fuel: "", breakdown: "", minRental: "", notice: "", cancellation: "", insurance: "", notes: "",
};

function CompletionRing({ score }: { score: number }) {
  const r = 18, c = 2 * Math.PI * r;
  const color = score >= 100 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          className={`${color} stroke-current`} strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, score)) / 100} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{score}%</span>
    </div>
  );
}

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    complete: { label: isAr ? "مكتمل" : "Complete", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
    partial: { label: isAr ? "جزئي" : "Partial", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    draft: { label: isAr ? "مسودة" : "Draft", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status] || map.draft;
  return <Badge className={`no-default-active-elevate ${m.cls}`} data-testid={`badge-status-${status}`}>{m.label}</Badge>;
}

const fmtSAR = (v: number | string) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

export default function SuppliersPage() {
  const { language } = useLanguage();
  const isAr = language === "Arabic" || language === "Urdu";
  const L = (en: string, ar: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [view, setView] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [eqRows, setEqRows] = useState<EquipmentRow[]>([]);
  const [eqMgrOpen, setEqMgrOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [payForm, setPayForm] = useState({ label: "", amount: "", dueDate: "" });
  const [rentalForm, setRentalForm] = useState({ companyName: "", startDate: "", endDate: "", location: "", rateUnit: "daily", equipment: [] as string[] });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: detail } = useQuery<SupplierDetail>({
    queryKey: ["/api/suppliers", selectedId],
    enabled: !!selectedId,
  });
  const { data: eqTypes = [] } = useQuery<{ id: string; name: string }[]>({ queryKey: ["/api/suppliers/equipment-types"] });
  const { data: alerts = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers/alerts"] });
  const { data: summary } = useQuery<any>({ queryKey: ["/api/suppliers/reports/summary"], enabled: reportsOpen });
  const { data: rankings = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers/reports/rankings"], enabled: reportsOpen });
  const { data: pricing = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers/reports/pricing"], enabled: reportsOpen });

  const invalidate = (id?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["/api/suppliers", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers/alerts"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      for (const k of ["whatsapp", "email", "website", "coverage", "paymentMethod", "paymentTerms", "taxInvoice", "fuel", "breakdown", "minRental", "notice", "cancellation", "insurance", "notes"])
        if (!payload[k]) payload[k] = null;
      payload.crExpiry = form.crExpiry ? new Date(form.crExpiry) : null;
      payload.equipment = eqRows.map((r, i) => ({
        ...r, sortOrder: i,
        hourlyRate: r.hourlyRate || null, dailyRate: r.dailyRate || null, weeklyRate: r.weeklyRate || null,
        condition: r.condition || null,
      }));
      if (editing) return apiRequest("PUT", `/api/suppliers/${editing.id}`, payload);
      return apiRequest("POST", "/api/suppliers", payload);
    },
    onSuccess: () => {
      invalidate(editing?.id);
      setFormOpen(false);
      toast({ title: L("Saved", "تم الحفظ") });
    },
    onError: (e: any) => toast({ title: L("Error", "خطأ"), description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => { invalidate(); setSelectedId(null); toast({ title: L("Deleted", "تم الحذف") }); },
    onError: (e: any) => toast({ title: L("Error", "خطأ"), description: e.message, variant: "destructive" }),
  });

  const addPaymentMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/suppliers/${selectedId}/payments`, {
      label: payForm.label, amount: payForm.amount, dueDate: new Date(payForm.dueDate),
    }),
    onSuccess: () => { invalidate(selectedId); setPayForm({ label: "", amount: "", dueDate: "" }); toast({ title: L("Installment added", "تمت إضافة الدفعة") }); },
    onError: (e: any) => toast({ title: L("Error", "خطأ"), description: e.message, variant: "destructive" }),
  });
  const markPaidMut = useMutation({
    mutationFn: (pid: string) => apiRequest("PUT", `/api/suppliers/${selectedId}/payments/${pid}`, { status: "paid", paidDate: new Date() }),
    onSuccess: () => invalidate(selectedId),
  });
  const delPaymentMut = useMutation({
    mutationFn: (pid: string) => apiRequest("DELETE", `/api/suppliers/${selectedId}/payments/${pid}`),
    onSuccess: () => invalidate(selectedId),
  });

  const addTypeMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/suppliers/equipment-types", { name: newTypeName, sortOrder: eqTypes.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/suppliers/equipment-types"] }); setNewTypeName(""); },
    onError: (e: any) => toast({ title: L("Error", "خطأ"), description: e.message, variant: "destructive" }),
  });
  const delTypeMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/suppliers/equipment-types/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/suppliers/equipment-types"] }),
  });

  const rentalMut = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const name of rentalForm.equipment) {
        results.push(await apiRequest("POST", `/api/suppliers/${selectedId}/rentals`, {
          equipmentName: name, startDate: new Date(rentalForm.startDate), endDate: new Date(rentalForm.endDate),
          location: rentalForm.location || null,
        }));
      }
      return results;
    },
    onSuccess: () => {
      invalidate(selectedId);
      printRentalAgreement();
      setRentalForm({ companyName: "", startDate: "", endDate: "", location: "", rateUnit: "daily", equipment: [] });
      toast({ title: L("Rental agreement generated", "تم إنشاء عقد الإيجار") });
    },
    onError: (e: any) => toast({ title: L("Error", "خطأ"), description: e.message, variant: "destructive" }),
  });

  async function uploadDoc(file: File, docKey: string, equipmentId?: string) {
    if (file.size > 5 * 1024 * 1024) { toast({ title: L("File too large (max 5MB)", "الملف كبير جداً (الحد 5 م.ب)"), variant: "destructive" }); return; }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_key", docKey);
    const url = equipmentId
      ? `/api/suppliers/${selectedId}/equipment/${equipmentId}/documents`
      : `/api/suppliers/${selectedId}/documents`;
    const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: L("Upload failed", "فشل الرفع"), description: err.message, variant: "destructive" });
      return;
    }
    invalidate(selectedId);
    toast({ title: L("Uploaded", "تم الرفع") });
  }
  async function deleteDoc(docId: string, equipmentId?: string) {
    const url = equipmentId
      ? `/api/suppliers/${selectedId}/equipment/${equipmentId}/documents/${docId}`
      : `/api/suppliers/${selectedId}/documents/${docId}`;
    await apiRequest("DELETE", url);
    invalidate(selectedId);
  }

  function printRentalAgreement() {
    if (!detail) return;
    const eqList = detail.equipment.filter(e => rentalForm.equipment.includes(e.name));
    const rateOf = (e: EquipmentRow) => rentalForm.rateUnit === "hourly" ? e.hourlyRate : rentalForm.rateUnit === "weekly" ? e.weeklyRate : e.dailyRate;
    const unitLbl = rentalForm.rateUnit === "hourly" ? L("SAR/hour", "ريال/ساعة") : rentalForm.rateUnit === "weekly" ? L("SAR/week", "ريال/أسبوع") : L("SAR/day", "ريال/يوم");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${L("Rental Agreement", "عقد إيجار معدات")}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #ccc;padding:8px;font-size:13px}p{font-size:13px}</style></head><body>
      <h1>${L("Equipment Rental Agreement", "عقد إيجار معدات")}</h1>
      <p>${L("First party (Renter)", "الطرف الأول (المستأجر)")}: <b>${rentalForm.companyName}</b></p>
      <p>${L("Second party (Supplier)", "الطرف الثاني (المورد)")}: <b>${detail.companyName}</b> — ${detail.contactName} — ${detail.phone}</p>
      <p>${L("CR", "السجل التجاري")}: ${detail.crNumber} | ${L("VAT", "الرقم الضريبي")}: ${detail.vatNumber} | IBAN: ${detail.iban}</p>
      <p>${L("Period", "المدة")}: ${rentalForm.startDate} → ${rentalForm.endDate} | ${L("Location", "الموقع")}: ${rentalForm.location || "-"}</p>
      <table><thead><tr><th>${L("Equipment", "المعدة")}</th><th>${L("Rate", "السعر")} (${unitLbl})</th><th>${L("Driver", "سائق")}</th></tr></thead>
      <tbody>${eqList.map(e => `<tr><td>${e.name}</td><td>${rateOf(e) || "-"}</td><td>${e.hasDriver ? L("Yes", "نعم") : L("No", "لا")}</td></tr>`).join("")}</tbody></table>
      <p style="margin-top:24px">${L("Terms", "الشروط")}: ${[detail.fuel, detail.breakdown, detail.minRental, detail.notice, detail.cancellation, detail.insurance].filter(Boolean).join(" • ") || "-"}</p>
      <br/><br/><table style="border:none"><tr><td style="border:none">${L("First party signature", "توقيع الطرف الأول")}: ______________</td><td style="border:none">${L("Second party signature", "توقيع الطرف الثاني")}: ______________</td></tr></table>
      </body></html>`);
    w.document.close();
    w.print();
  }

  function exportSupplierExcel() {
    if (!detail) return;
    const rows = [
      [L("Company", "الشركة"), detail.companyName], [L("Contact", "جهة الاتصال"), detail.contactName],
      [L("Phone", "الهاتف"), detail.phone], [L("City", "المدينة"), detail.city],
      [L("CR Number", "السجل التجاري"), detail.crNumber], [L("VAT Number", "الرقم الضريبي"), detail.vatNumber],
      [L("Bank", "البنك"), detail.bankName], ["IBAN", detail.iban],
      [], [L("Equipment", "المعدات"), L("Available", "متاح"), L("Hourly", "ساعة"), L("Daily", "يوم"), L("Weekly", "أسبوع")],
      ...detail.equipment.map(e => [e.name, e.available ? "Y" : "N", e.hourlyRate || "", e.dailyRate || "", e.weeklyRate || ""]),
    ];
    const csv = rows.map(r => (r as any[]).map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `supplier-${detail.companyName}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setEqRows([]);
    setFormOpen(true);
  }
  function openEdit(s: SupplierDetail | Supplier) {
    setEditing(s as Supplier);
    const d = s as SupplierDetail;
    setForm({
      ...emptyForm,
      ...Object.fromEntries(Object.keys(emptyForm).map(k => [k, (s as any)[k] ?? ""])),
      crExpiry: (s as any).crExpiry ? String((s as any).crExpiry).slice(0, 10) : "",
    } as typeof emptyForm);
    setEqRows((d.equipment || []).map(e => ({ ...e })));
    setFormOpen(true);
  }

  const requiredOk = ["companyName", "contactName", "phone", "city", "crNumber", "vatNumber", "bankName", "bankAccountName", "iban"]
    .every(k => (form as any)[k]?.trim());

  const filtered = useMemo(() => suppliers, [suppliers]);
  const visible = filtered
    .filter(s => filter === "all" || s.status === filter)
    .filter(s => !search || s.companyName.toLowerCase().includes(search.toLowerCase()) || s.contactName.toLowerCase().includes(search.toLowerCase()));

  const payTotals = useMemo(() => {
    const pays = detail?.payments || [];
    const total = pays.reduce((s, p) => s + Number(p.amount), 0);
    const paid = pays.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    return { total, paid, remaining: total - paid };
  }, [detail]);

  // ---------- detail view ----------
  if (selectedId && detail) {
    const isOverdue = (p: { dueDate: string; status: string }) => p.status !== "paid" && new Date(p.dueDate) < new Date();
    return (
      <div className="p-4 md:p-6 space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} data-testid="button-back-suppliers"><BackIcon /></Button>
            <CompletionRing score={detail.completionScore} />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-supplier-name">{detail.companyName}</h1>
              <p className="text-sm text-muted-foreground">{detail.contactName} • {detail.city}</p>
            </div>
            <StatusBadge status={detail.status} isAr={isAr} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => openEdit(detail)} data-testid="button-edit-supplier"><Pencil className="w-4 h-4" />{L("Edit", "تعديل")}</Button>
            <Button variant="outline" onClick={exportSupplierExcel} data-testid="button-export-excel"><Download className="w-4 h-4" />Excel</Button>
            <Button variant="destructive" onClick={() => { if (confirm(L("Delete this supplier?", "حذف هذا المورد؟"))) deleteMut.mutate(detail.id); }} data-testid="button-delete-supplier"><Trash2 className="w-4 h-4" />{L("Delete", "حذف")}</Button>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="profile" data-testid="tab-profile">{L("Profile", "الملف")}</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">{L("Payments", "الدفعات")}</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">{L("Documents", "المستندات")}</TabsTrigger>
            <TabsTrigger value="eqdocs" data-testid="tab-eqdocs">{L("Equipment Docs", "مستندات المعدات")}</TabsTrigger>
            <TabsTrigger value="rental" data-testid="tab-rental">{L("Rental Contract", "عقد الإيجار")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card><CardHeader><CardTitle className="text-base">{L("Identity & Contact", "الهوية والتواصل")}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  {[[L("Phone", "الهاتف"), detail.phone], ["WhatsApp", detail.whatsapp], [L("Email", "البريد"), detail.email], [L("Website", "الموقع"), detail.website], [L("City", "المدينة"), detail.city], [L("Coverage", "التغطية"), detail.coverage]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span>{v || "-"}</span></div>
                  ))}
                </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">{L("Legal & Banking", "القانونية والبنكية")}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  {[[L("CR Number", "السجل التجاري"), detail.crNumber], [L("CR Expiry", "انتهاء السجل"), fmtDate(detail.crExpiry)], [L("VAT Number", "الرقم الضريبي"), detail.vatNumber], [L("Bank", "البنك"), detail.bankName], [L("Account Holder", "اسم الحساب"), detail.bankAccountName], ["IBAN", detail.iban], [L("Payment Method", "طريقة الدفع"), detail.paymentMethod], [L("Payment Terms", "شروط الدفع"), detail.paymentTerms], [L("Tax Invoice", "فاتورة ضريبية"), detail.taxInvoice]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="break-all">{v || "-"}</span></div>
                  ))}
                </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">{L("Contract Terms", "شروط التعاقد")}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  {[[L("Fuel", "الوقود"), detail.fuel], [L("Breakdown", "الأعطال"), detail.breakdown], [L("Min Rental", "الحد الأدنى للإيجار"), detail.minRental], [L("Notice", "الإشعار المسبق"), detail.notice], [L("Cancellation", "الإلغاء"), detail.cancellation], [L("Insurance", "التأمين"), detail.insurance], [L("Notes", "ملاحظات"), detail.notes]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span>{v || "-"}</span></div>
                  ))}
                </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">{L("Equipment & Rates", "المعدات والأسعار")}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{L("Name", "الاسم")}</TableHead><TableHead>{L("Avail.", "متاح")}</TableHead>
                      <TableHead>{L("Hour", "ساعة")}</TableHead><TableHead>{L("Day", "يوم")}</TableHead><TableHead>{L("Week", "أسبوع")}</TableHead>
                      <TableHead>{L("Driver", "سائق")}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {detail.equipment.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{L("No equipment", "لا توجد معدات")}</TableCell></TableRow>}
                      {detail.equipment.map(e => (
                        <TableRow key={e.id} data-testid={`row-equipment-${e.id}`}>
                          <TableCell>{e.name}</TableCell>
                          <TableCell>{e.available ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}</TableCell>
                          <TableCell>{e.hourlyRate || "-"}</TableCell><TableCell>{e.dailyRate || "-"}</TableCell><TableCell>{e.weeklyRate || "-"}</TableCell>
                          <TableCell>{e.hasDriver ? L("Yes", "نعم") : L("No", "لا")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[[L("Total", "الإجمالي"), payTotals.total], [L("Paid", "المدفوع"), payTotals.paid], [L("Remaining", "المتبقي"), payTotals.remaining]].map(([k, v]) => (
                <Card key={k as string}><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{k}</p><p className="text-lg font-bold" data-testid={`text-pay-${k}`}>{fmtSAR(v as number)} {L("SAR", "ريال")}</p></CardContent></Card>
              ))}
            </div>
            <Card><CardContent className="pt-4 space-y-3">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="space-y-1"><Label>{L("Description", "الوصف")}</Label><Input value={payForm.label} onChange={e => setPayForm({ ...payForm, label: e.target.value })} data-testid="input-payment-label" /></div>
                <div className="space-y-1"><Label>{L("Amount (SAR)", "المبلغ (ريال)")}</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} data-testid="input-payment-amount" /></div>
                <div className="space-y-1"><Label>{L("Due Date", "تاريخ الاستحقاق")}</Label><Input type="date" value={payForm.dueDate} onChange={e => setPayForm({ ...payForm, dueDate: e.target.value })} data-testid="input-payment-due" /></div>
                <Button onClick={() => addPaymentMut.mutate()} disabled={!payForm.label || !payForm.amount || !payForm.dueDate || addPaymentMut.isPending} data-testid="button-add-payment"><Plus className="w-4 h-4" />{L("Add", "إضافة")}</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>{L("Description", "الوصف")}</TableHead><TableHead>{L("Amount", "المبلغ")}</TableHead><TableHead>{L("Due", "الاستحقاق")}</TableHead><TableHead>{L("Status", "الحالة")}</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {detail.payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{L("No installments", "لا توجد دفعات")}</TableCell></TableRow>}
                  {detail.payments.map(p => (
                    <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                      <TableCell>{p.label}</TableCell>
                      <TableCell>{fmtSAR(p.amount)}</TableCell>
                      <TableCell>{fmtDate(p.dueDate)}</TableCell>
                      <TableCell>
                        {p.status === "paid"
                          ? <Badge className="no-default-active-elevate bg-green-500/15 text-green-700 dark:text-green-400">{L("Paid", "مدفوع")}</Badge>
                          : isOverdue(p)
                            ? <Badge className="no-default-active-elevate bg-red-500/15 text-red-700 dark:text-red-400">{L("Overdue", "متأخر")}</Badge>
                            : <Badge className="no-default-active-elevate bg-amber-500/15 text-amber-700 dark:text-amber-400">{L("Pending", "قيد الانتظار")}</Badge>}
                      </TableCell>
                      <TableCell className="text-end">
                        {p.status !== "paid" && <Button size="sm" variant="outline" onClick={() => markPaidMut.mutate(p.id)} data-testid={`button-markpaid-${p.id}`}>{L("Mark Paid", "تحديد كمدفوع")}</Button>}
                        <Button size="icon" variant="ghost" onClick={() => delPaymentMut.mutate(p.id)} data-testid={`button-delpay-${p.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="documents">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUPPLIER_DOC_SLOTS.map(slot => {
                const doc = detail.documents.find(d => d.docKey === slot.key);
                return (
                  <Card key={slot.key}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{isAr ? slot.ar : slot.en}{slot.required && <span className="text-red-500"> *</span>}</p>
                        {doc ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : null}
                      </div>
                      {doc ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{doc.fileName}</span>
                          <Button size="icon" variant="ghost" asChild data-testid={`button-viewdoc-${slot.key}`}>
                            <a href={`/api/suppliers/${detail.id}/documents/${doc.id}/file`} target="_blank" rel="noreferrer"><Eye className="w-4 h-4" /></a>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteDoc(doc.id)} data-testid={`button-deldoc-${slot.key}`}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer border border-dashed rounded-md p-2 justify-center">
                          <Upload className="w-4 h-4" />{L("Upload (PDF/JPG/PNG, 5MB)", "رفع (PDF/JPG/PNG، 5م.ب)")}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, slot.key); e.target.value = ""; }} data-testid={`input-upload-${slot.key}`} />
                        </label>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="eqdocs" className="space-y-4">
            {detail.equipment.length === 0 && <p className="text-muted-foreground text-sm">{L("Add equipment first", "أضف معدات أولاً")}</p>}
            {detail.equipment.map(eq => (
              <Card key={eq.id}>
                <CardHeader><CardTitle className="text-base">{eq.name}</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {EQ_DOC_SLOTS.map(slot => {
                    const doc = detail.equipmentDocuments.find(d => d.equipmentId === eq.id && d.docKey === slot.key);
                    return (
                      <div key={slot.key} className="border rounded-md p-2 space-y-1">
                        <p className="text-xs font-medium">{isAr ? slot.ar : slot.en}</p>
                        {doc ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-muted-foreground truncate max-w-[90px]">{doc.fileName}</span>
                            <Button size="icon" variant="ghost" asChild><a href={`/api/suppliers/${detail.id}/equipment/${eq.id}/documents/${doc.id}/file`} target="_blank" rel="noreferrer"><Eye className="w-4 h-4" /></a></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteDoc(doc.id, eq.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                            <Upload className="w-3 h-3" />{L("Upload", "رفع")}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, slot.key, eq.id); e.target.value = ""; }} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rental" className="space-y-4">
            <Card><CardContent className="pt-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{L("My Company Name", "اسم شركتي")}</Label><Input value={rentalForm.companyName} onChange={e => setRentalForm({ ...rentalForm, companyName: e.target.value })} data-testid="input-rental-company" /></div>
                <div className="space-y-1"><Label>{L("Location", "الموقع")}</Label><Input value={rentalForm.location} onChange={e => setRentalForm({ ...rentalForm, location: e.target.value })} data-testid="input-rental-location" /></div>
                <div className="space-y-1"><Label>{L("Start Date", "تاريخ البداية")}</Label><Input type="date" value={rentalForm.startDate} onChange={e => setRentalForm({ ...rentalForm, startDate: e.target.value })} data-testid="input-rental-start" /></div>
                <div className="space-y-1"><Label>{L("End Date", "تاريخ النهاية")}</Label><Input type="date" value={rentalForm.endDate} onChange={e => setRentalForm({ ...rentalForm, endDate: e.target.value })} data-testid="input-rental-end" /></div>
                <div className="space-y-1"><Label>{L("Rate Unit", "وحدة السعر")}</Label>
                  <Select value={rentalForm.rateUnit} onValueChange={v => setRentalForm({ ...rentalForm, rateUnit: v })}>
                    <SelectTrigger data-testid="select-rate-unit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{L("Hourly", "بالساعة")}</SelectItem>
                      <SelectItem value="daily">{L("Daily", "يومي")}</SelectItem>
                      <SelectItem value="weekly">{L("Weekly", "أسبوعي")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{L("Equipment", "المعدات")}</Label>
                {detail.equipment.filter(e => e.available).map(e => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={rentalForm.equipment.includes(e.name)} onCheckedChange={c => setRentalForm({ ...rentalForm, equipment: c ? [...rentalForm.equipment, e.name] : rentalForm.equipment.filter(n => n !== e.name) })} data-testid={`checkbox-rental-${e.id}`} />
                    {e.name} <span className="text-muted-foreground text-xs">({L("day", "يوم")}: {e.dailyRate || "-"} / {L("hour", "ساعة")}: {e.hourlyRate || "-"} / {L("week", "أسبوع")}: {e.weeklyRate || "-"})</span>
                  </label>
                ))}
              </div>
              <Button onClick={() => rentalMut.mutate()} disabled={!rentalForm.companyName || !rentalForm.startDate || !rentalForm.endDate || rentalForm.equipment.length === 0 || rentalMut.isPending} data-testid="button-generate-rental">
                <FileText className="w-4 h-4" />{L("Generate Agreement", "إنشاء العقد")}
              </Button>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">{L("Rental History", "سجل الإيجارات")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>{L("Ref", "المرجع")}</TableHead><TableHead>{L("Equipment", "المعدة")}</TableHead><TableHead>{L("From", "من")}</TableHead><TableHead>{L("To", "إلى")}</TableHead><TableHead>{L("Location", "الموقع")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {detail.rentals.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{L("No rentals yet", "لا توجد إيجارات")}</TableCell></TableRow>}
                    {detail.rentals.map(r => (
                      <TableRow key={r.id} data-testid={`row-rental-${r.id}`}>
                        <TableCell>{r.referenceNumber}</TableCell><TableCell>{r.equipmentName}</TableCell>
                        <TableCell>{fmtDate(r.startDate)}</TableCell><TableCell>{fmtDate(r.endDate)}</TableCell><TableCell>{r.location || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
          </TabsContent>
        </Tabs>
        {renderFormDialog()}
      </div>
    );
  }

  // ---------- form dialog ----------
  function renderFormDialog() {
    const F = (key: keyof typeof emptyForm, label: string, labelAr: string, required = false, type = "text") => (
      <div className="space-y-1">
        <Label>{L(label, labelAr)}{required && <span className="text-red-500"> *</span>}</Label>
        <Input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} data-testid={`input-${key}`} />
      </div>
    );
    return (
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{editing ? L("Edit Supplier", "تعديل المورد") : L("New Supplier", "مورد جديد")}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold mb-2">{L("Identity & Contact", "الهوية والتواصل")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {F("companyName", "Company Name", "اسم الشركة", true)}
                {F("contactName", "Contact Name", "اسم جهة الاتصال", true)}
                {F("phone", "Phone", "الهاتف", true)}
                {F("whatsapp", "WhatsApp", "واتساب")}
                {F("email", "Email", "البريد الإلكتروني")}
                {F("website", "Website", "الموقع الإلكتروني")}
                {F("city", "City", "المدينة", true)}
                {F("coverage", "Coverage Cities", "مدن التغطية")}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{L("Legal & Banking", "القانونية والبنكية")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {F("crNumber", "CR Number (10 digits)", "السجل التجاري (10 أرقام)", true)}
                {F("crExpiry", "CR Expiry", "تاريخ انتهاء السجل", false, "date")}
                {F("vatNumber", "VAT Number (15 digits)", "الرقم الضريبي (15 رقم)", true)}
                {F("bankName", "Bank Name", "اسم البنك", true)}
                {F("bankAccountName", "Account Holder", "اسم صاحب الحساب", true)}
                {F("iban", "IBAN", "الآيبان", true)}
                {F("paymentMethod", "Payment Method", "طريقة الدفع")}
                {F("paymentTerms", "Payment Terms", "شروط الدفع")}
                {F("taxInvoice", "Issues Tax Invoice?", "يصدر فاتورة ضريبية؟")}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold">{L("Equipment & Rates", "المعدات والأسعار")}</h3>
                <Button size="sm" variant="outline" onClick={() => setEqRows([...eqRows, { name: eqTypes[0]?.name || "", available: true, hourlyRate: "", dailyRate: "", weeklyRate: "", hasDriver: false, condition: "" }])} data-testid="button-add-equipment-row"><Plus className="w-4 h-4" />{L("Add Row", "إضافة صف")}</Button>
              </div>
              <div className="space-y-2">
                {eqRows.map((r, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-8 gap-2 items-center border rounded-md p-2">
                    <Select value={r.name} onValueChange={v => setEqRows(eqRows.map((x, j) => j === i ? { ...x, name: v } : x))}>
                      <SelectTrigger className="md:col-span-2" data-testid={`select-eq-name-${i}`}><SelectValue placeholder={L("Equipment", "المعدة")} /></SelectTrigger>
                      <SelectContent>{eqTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder={L("Hour", "ساعة")} type="number" value={r.hourlyRate ?? ""} onChange={e => setEqRows(eqRows.map((x, j) => j === i ? { ...x, hourlyRate: e.target.value } : x))} data-testid={`input-eq-hour-${i}`} />
                    <Input placeholder={L("Day", "يوم")} type="number" value={r.dailyRate ?? ""} onChange={e => setEqRows(eqRows.map((x, j) => j === i ? { ...x, dailyRate: e.target.value } : x))} data-testid={`input-eq-day-${i}`} />
                    <Input placeholder={L("Week", "أسبوع")} type="number" value={r.weeklyRate ?? ""} onChange={e => setEqRows(eqRows.map((x, j) => j === i ? { ...x, weeklyRate: e.target.value } : x))} data-testid={`input-eq-week-${i}`} />
                    <label className="flex items-center gap-1 text-xs"><Checkbox checked={r.available} onCheckedChange={c => setEqRows(eqRows.map((x, j) => j === i ? { ...x, available: !!c } : x))} />{L("Avail.", "متاح")}</label>
                    <label className="flex items-center gap-1 text-xs"><Checkbox checked={r.hasDriver} onCheckedChange={c => setEqRows(eqRows.map((x, j) => j === i ? { ...x, hasDriver: !!c } : x))} />{L("Driver", "سائق")}</label>
                    <Button size="icon" variant="ghost" onClick={() => setEqRows(eqRows.filter((_, j) => j !== i))} data-testid={`button-del-eq-${i}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{L("Contract Terms", "شروط التعاقد")}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {F("fuel", "Fuel (who pays)", "الوقود (من يدفع)")}
                {F("breakdown", "Breakdown Policy", "سياسة الأعطال")}
                {F("minRental", "Minimum Rental", "الحد الأدنى للإيجار")}
                {F("notice", "Advance Notice", "الإشعار المسبق")}
                {F("cancellation", "Cancellation Penalty", "غرامة الإلغاء")}
                {F("insurance", "Insurance", "التأمين")}
              </div>
              <div className="space-y-1 mt-3">
                <Label>{L("Notes", "ملاحظات")}</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} data-testid="button-cancel-form">{L("Cancel", "إلغاء")}</Button>
            <Button onClick={() => saveMut.mutate()} disabled={!requiredOk || saveMut.isPending} data-testid="button-save-supplier">
              {saveMut.isPending ? L("Saving...", "جارٍ الحفظ...") : L("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ---------- list view ----------
  return (
    <div className="p-4 md:p-6 space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" />{L("Equipment Suppliers", "موردو المعدات")}</h1>
          <p className="text-sm text-muted-foreground">{L("Manage equipment rental companies", "إدارة شركات تأجير المعدات")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setAlertsOpen(true)} className="relative" data-testid="button-alerts">
            <Bell className="w-4 h-4" />{L("Alerts", "التنبيهات")}
            {alerts.length > 0 && <Badge className="no-default-active-elevate absolute -top-2 -end-2 bg-red-500 text-white">{alerts.length}</Badge>}
          </Button>
          <Button variant="outline" onClick={() => setReportsOpen(true)} data-testid="button-reports"><BarChart3 className="w-4 h-4" />{L("Reports", "التقارير")}</Button>
          <Button variant="outline" onClick={() => setEqMgrOpen(true)} data-testid="button-eq-manager"><Settings2 className="w-4 h-4" />{L("Equipment Types", "أنواع المعدات")}</Button>
          <Button onClick={openCreate} data-testid="button-new-supplier"><Plus className="w-4 h-4" />{L("New Supplier", "مورد جديد")}</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "complete", "partial", "draft"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} data-testid={`filter-${f}`}>
            {f === "all" ? L("All", "الكل") : f === "complete" ? L("Complete", "مكتمل") : f === "partial" ? L("Partial", "جزئي") : L("Draft", "مسودة")}
          </Button>
        ))}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute start-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="ps-8" placeholder={L("Search company or contact...", "بحث عن شركة أو جهة اتصال...")} value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search" />
        </div>
        <Button size="icon" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")} data-testid="button-view-grid"><LayoutGrid /></Button>
        <Button size="icon" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")} data-testid="button-view-table"><List /></Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{L("No suppliers yet. Click 'New Supplier' to add one.", "لا يوجد موردون بعد. اضغط 'مورد جديد' للإضافة.")}</CardContent></Card>
      ) : view === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(s => (
            <Card key={s.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedId(s.id)} data-testid={`card-supplier-${s.id}`}>
              <CardContent className="pt-4 flex items-center gap-3">
                <CompletionRing score={s.completionScore} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.companyName}</p>
                  <p className="text-sm text-muted-foreground truncate">{s.contactName} • {s.city}</p>
                  <p className="text-xs text-muted-foreground">{L("Equipment", "المعدات")}: {s.availableEquipment}/{s.equipmentCount}</p>
                </div>
                <StatusBadge status={s.status} isAr={isAr} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{L("Company", "الشركة")}</TableHead><TableHead>{L("Contact", "جهة الاتصال")}</TableHead>
              <TableHead>{L("City", "المدينة")}</TableHead><TableHead>{L("Equipment", "المعدات")}</TableHead>
              <TableHead>{L("Score", "الاكتمال")}</TableHead><TableHead>{L("Status", "الحالة")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.map(s => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedId(s.id)} data-testid={`row-supplier-${s.id}`}>
                  <TableCell className="font-medium">{s.companyName}</TableCell>
                  <TableCell>{s.contactName}</TableCell><TableCell>{s.city}</TableCell>
                  <TableCell>{s.availableEquipment}/{s.equipmentCount}</TableCell>
                  <TableCell>{s.completionScore}%</TableCell>
                  <TableCell><StatusBadge status={s.status} isAr={isAr} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {renderFormDialog()}

      {/* Equipment type manager */}
      <Dialog open={eqMgrOpen} onOpenChange={setEqMgrOpen}>
        <DialogContent dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{L("Equipment Types", "أنواع المعدات")}</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder={L("New type name", "اسم النوع الجديد")} data-testid="input-new-type" />
            <Button onClick={() => addTypeMut.mutate()} disabled={!newTypeName.trim() || addTypeMut.isPending} data-testid="button-add-type"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {eqTypes.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-1.5" data-testid={`row-type-${t.id}`}>
                <span className="text-sm">{t.name}</span>
                <Button size="icon" variant="ghost" onClick={() => delTypeMut.mutate(t.id)} data-testid={`button-del-type-${t.id}`}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts */}
      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{L("Alerts", "التنبيهات")}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.length === 0 && <p className="text-muted-foreground text-sm">{L("No alerts", "لا توجد تنبيهات")}</p>}
            {alerts.map((a, i) => {
              const typeLbl: Record<string, [string, string, string]> = {
                payment_overdue: ["Payment overdue", "دفعة متأخرة", "text-red-600 dark:text-red-400"],
                payment_due_soon: ["Payment due soon", "دفعة مستحقة قريباً", "text-amber-600 dark:text-amber-400"],
                rental_ending_soon: ["Rental ending soon", "إيجار ينتهي قريباً", "text-amber-600 dark:text-amber-400"],
                rental_ended: ["Rental ended", "انتهى الإيجار", "text-muted-foreground"],
              };
              const t = typeLbl[a.type] || ["", "", ""];
              return (
                <div key={i} className="border rounded-md p-2 cursor-pointer hover-elevate" onClick={() => { setSelectedId(a.supplierId); setAlertsOpen(false); }} data-testid={`alert-${i}`}>
                  <p className={`text-sm font-medium ${t[2]}`}>{L(t[0], t[1])}</p>
                  <p className="text-xs text-muted-foreground">{a.supplierName} — {a.label} {a.amount ? `(${fmtSAR(a.amount)} ${L("SAR", "ريال")})` : ""} • {fmtDate(a.date)}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reports */}
      <Dialog open={reportsOpen} onOpenChange={setReportsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{L("Supplier Reports", "تقارير الموردين")}</DialogTitle></DialogHeader>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                [L("Avg Score", "متوسط الاكتمال"), `${summary.avgScore}%`],
                [L("Total Paid", "إجمالي المدفوع"), `${fmtSAR(summary.totalPaid)} ${L("SAR", "ريال")}`],
                [L("Equipment Available", "معدات متاحة"), summary.totalEquipmentAvailable],
                [L("Pending", "قيد الانتظار"), `${fmtSAR(summary.totalPending)} ${L("SAR", "ريال")}`],
              ].map(([k, v]) => (
                <Card key={k as string}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-bold" data-testid={`kpi-${k}`}>{v as any}</p></CardContent></Card>
              ))}
            </div>
          )}
          <h3 className="font-semibold mt-2">{L("Supplier Rankings", "ترتيب الموردين")}</h3>
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>{L("Company", "الشركة")}</TableHead><TableHead>{L("City", "المدينة")}</TableHead><TableHead>{L("Performance", "الأداء")}</TableHead><TableHead>{L("Completion", "الاكتمال")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {rankings.map((r, i) => (
                <TableRow key={r.id} data-testid={`row-ranking-${r.id}`}>
                  <TableCell>{i + 1}</TableCell><TableCell>{r.companyName}</TableCell><TableCell>{r.city}</TableCell>
                  <TableCell><Badge className="no-default-active-elevate">{r.performanceScore}/100</Badge></TableCell>
                  <TableCell>{r.completionScore}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <h3 className="font-semibold mt-2">{L("Price Comparison", "مقارنة الأسعار")}</h3>
          {pricing.length === 0 ? <p className="text-sm text-muted-foreground">{L("No pricing data", "لا توجد بيانات أسعار")}</p> : pricing.map(p => (
            <div key={p.name} className="border rounded-md p-2">
              <p className="font-medium text-sm mb-1">{p.name}</p>
              <Table>
                <TableHeader><TableRow><TableHead>{L("Supplier", "المورد")}</TableHead><TableHead>{L("Hour", "ساعة")}</TableHead><TableHead>{L("Day", "يوم")}</TableHead><TableHead>{L("Week", "أسبوع")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {p.offers.map((o: any, i: number) => (
                    <TableRow key={i}><TableCell>{o.companyName}</TableCell><TableCell>{o.hourlyRate || "-"}</TableCell><TableCell>{o.dailyRate || "-"}</TableCell><TableCell>{o.weeklyRate || "-"}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
