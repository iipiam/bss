import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCateringT } from "@/i18n/cateringContractsTranslations";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, FileDown, Mail, MessageCircle, FileText, ListPlus, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhoneForWhatsApp, openWhatsAppWithMessage } from "@/lib/whatsapp";
import type { CateringContract, CateringContractTemplate, Recipe } from "@shared/schema";

type Meal = { name: string; price: number; menuItemId?: string; qtyPerDay?: number };
type Installment = { label: string; percent: number; amount: number; dueDate?: string };

const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

const PLACEHOLDERS = [
  "my_restaurant_name","client_name","phone","email","delivery_location",
  "meals_list","number_of_meals","delivery_days","delivery_time",
  "total_value","discount_percentage","final_value","payment_schedule",
  "start_date","end_date",
];

function emptyContract(): Partial<CateringContract> & { mealSelections: Meal[]; deliveryDays: string[]; paymentInstallments: Installment[] } {
  return {
    contractNumber: `CC-${Date.now().toString().slice(-6)}`,
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    deliveryLocation: "",
    mealSelections: [],
    mealsPerDay: 1,
    deliveryDays: [],
    deliveryTime: "",
    startDate: new Date().toISOString().slice(0, 10) as any,
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) as any,
    totalValue: "0" as any,
    discountPercent: "0" as any,
    finalValue: "0" as any,
    paymentInstallments: [],
    notes: "",
    status: "active",
  };
}

export default function CateringContractsPage() {
  const { language, isRTL } = useLanguage();
  const t = useCateringT(language);
  const { toast } = useToast();
  const [tab, setTab] = useState("contracts");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyContract());
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [pickedMenuIds, setPickedMenuIds] = useState<Record<string, boolean>>({});

  const { data: contracts = [], isLoading } = useQuery<CateringContract[]>({ queryKey: ["/api/catering-contracts"] });
  const { data: templates = [] } = useQuery<CateringContractTemplate[]>({ queryKey: ["/api/catering-contract-templates"] });
  const { data: menuItems = [] } = useQuery<Array<{ id: string; name: string; price: string; category?: string; recipeId?: string | null; portionSize?: string | null }>>({ queryKey: ["/api/menu"] });
  const { data: recipes = [] } = useQuery<Recipe[]>({ queryKey: ["/api/recipes"] });
  const [costReport, setCostReport] = useState<CateringContract | null>(null);

  const dayLabel = (k: string) => (t as any)[k] || k;

  // Auto compute totals when meals/discount change
  const recalc = (next: any) => {
    const meals: Meal[] = next.mealSelections || [];
    const start = new Date(next.startDate);
    const end = new Date(next.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const deliveryDaysCount = (next.deliveryDays || []).length;
    // Approx delivery dates within the contract window
    const weeks = days / 7;
    const totalDates = Math.round(weeks * deliveryDaysCount) || days;
    // Per-day cost = sum(meal.price × meal.qtyPerDay)
    const dailyValue = meals.reduce((s, m) => s + (Number(m.price) || 0) * (Number(m.qtyPerDay) || 1), 0);
    const total = dailyValue * totalDates;
    const totalQtyPerDay = meals.reduce((s, m) => s + (Number(m.qtyPerDay) || 1), 0);
    const discount = Number(next.discountPercent) || 0;
    const final = total * (1 - discount / 100);
    return { ...next, totalValue: total.toFixed(2), finalValue: final.toFixed(2), mealsPerDay: totalQtyPerDay || 1 };
  };

  const setField = (key: string, value: any) => setForm((prev: any) => recalc({ ...prev, [key]: value }));

  const createMut = useMutation({
    mutationFn: async (body: any) => await apiRequest("POST", "/api/catering-contracts", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catering-contracts"] });
      setDialogOpen(false);
      toast({ title: t.contractCreated });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: any) => await apiRequest("PATCH", `/api/catering-contracts/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catering-contracts"] });
      setDialogOpen(false);
      toast({ title: t.contractUpdated });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => await apiRequest("DELETE", `/api/catering-contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catering-contracts"] });
      toast({ title: t.contractDeleted });
    },
  });

  const openNew = () => { setEditing(null); setForm(emptyContract()); setDialogOpen(true); };
  const openEdit = (c: CateringContract) => {
    setEditing(c);
    setForm({
      ...c,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "",
      mealSelections: c.mealSelections || [],
      deliveryDays: c.deliveryDays || [],
      paymentInstallments: c.paymentInstallments || [],
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const body = { ...form };
    if (editing) updateMut.mutate({ id: editing.id, body });
    else createMut.mutate(body);
  };

  const downloadPdf = async (c: CateringContract) => {
    const resp = await fetch(`/api/catering-contracts/${c.id}/pdf?lang=${encodeURIComponent(language)}`, { credentials: "include" });
    if (!resp.ok) {
      toast({ title: "Error", description: await resp.text(), variant: "destructive" });
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catering-contract-${c.contractNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailMut = useMutation({
    mutationFn: async (id: string) => await apiRequest("POST", `/api/catering-contracts/${id}/send-email?lang=${encodeURIComponent(language)}`, {}),
    onSuccess: () => toast({ title: t.emailSent }),
    onError: (e: any) => toast({ title: t.emailFailed, description: e.message, variant: "destructive" }),
  });

  const sendWhatsApp = async (c: CateringContract, mode: 'contract' | 'quotation' = 'contract') => {
    if (!c.clientPhone) {
      toast({ title: t.noClientPhone || 'Client phone not set', variant: 'destructive' });
      return;
    }
    try {
      const resp = await apiRequest("POST", `/api/catering-contracts/${c.id}/share-link`, {});
      const { url: baseUrl } = await resp.json();
      const url = `${baseUrl}?lang=${encodeURIComponent(language)}&mode=${mode}`;
      const phone = formatPhoneForWhatsApp(c.clientPhone);
      const isQuote = mode === 'quotation';
      const msg = language === 'ar'
        ? (isQuote
            ? `مرحبا ${c.clientName}،\nنرفق لكم عرض سعر التموين رقم ${c.contractNumber}.\nالقيمة النهائية: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nعرض السعر (PDF):\n${url}\n\nنتطلع لتعاونكم.`
            : `مرحبا ${c.clientName}،\nعقد التموين رقم ${c.contractNumber} جاهز.\nالقيمة النهائية: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nتحميل العقد (PDF):\n${url}\n\nشكرا.`)
        : (isQuote
            ? `Hello ${c.clientName},\nPlease find attached our catering quotation ${c.contractNumber}.\nFinal value: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nQuotation (PDF):\n${url}\n\nWe look forward to working with you.`
            : `Hello ${c.clientName},\nYour catering contract ${c.contractNumber} is ready.\nFinal value: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nDownload contract (PDF):\n${url}\n\nThank you.`);
      openWhatsAppWithMessage(phone, msg);
    } catch (e: any) {
      toast({ title: t.pdfFailed || 'Failed', description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <FileText className="h-7 w-7" />
          {t.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-1">{t.pageSubtitle}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contracts" data-testid="tab-contracts">{t.tabContracts}</TabsTrigger>
          <TabsTrigger value="template" data-testid="tab-template">{t.tabTemplate}</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={openNew} data-testid="button-new-contract">
              <Plus className="h-4 w-4 me-2" /> {t.newContract}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : contracts.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-muted-foreground">{t.noContracts}</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {contracts.map((c) => (
                <Card key={c.id} data-testid={`card-contract-${c.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold" data-testid={`text-contract-number-${c.id}`}>{c.contractNumber}</span>
                          <Badge variant={c.status === 'active' ? 'default' : c.status === 'completed' ? 'secondary' : 'outline'}>
                            {(t as any)[c.status] || c.status}
                          </Badge>
                        </div>
                        <div className="text-sm">{c.clientName} — {c.clientPhone}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(c.startDate).toLocaleDateString('en-GB')} → {new Date(c.endDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className="text-sm font-medium mt-1">{parseFloat(c.finalValue || '0').toFixed(2)} {t.sar}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => downloadPdf(c)} data-testid={`button-pdf-${c.id}`}>
                          <FileDown className="h-4 w-4 me-1" /> {t.downloadPdf}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendWhatsApp(c, 'quotation')} data-testid={`button-quotation-${c.id}`}>
                          <MessageCircle className="h-4 w-4 me-1" /> {t.sendQuotation}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCostReport(c)} data-testid={`button-cost-report-${c.id}`}>
                          <TrendingUp className="h-4 w-4 me-1" /> {t.costReport}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => emailMut.mutate(c.id)} disabled={!c.clientEmail || emailMut.isPending} data-testid={`button-email-${c.id}`}>
                          <Mail className="h-4 w-4 me-1" /> {t.sendEmail}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendWhatsApp(c)} data-testid={`button-whatsapp-${c.id}`}>
                          <MessageCircle className="h-4 w-4 me-1" /> {t.sendWhatsApp}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)} data-testid={`button-edit-${c.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(c.id); }} data-testid={`button-delete-${c.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <TemplateEditor templates={templates} t={t} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t.editContract : t.newContract}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>{t.contractNumber}</Label>
                <Input value={form.contractNumber || ""} onChange={(e) => setField("contractNumber", e.target.value)} data-testid="input-contract-number" />
              </div>
              <div>
                <Label>{t.status}</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.clientName} *</Label>
                <Input value={form.clientName || ""} onChange={(e) => setField("clientName", e.target.value)} data-testid="input-client-name" />
              </div>
              <div>
                <Label>{t.clientPhone} *</Label>
                <Input value={form.clientPhone || ""} onChange={(e) => setField("clientPhone", e.target.value)} data-testid="input-client-phone" />
              </div>
              <div>
                <Label>{t.clientEmail}</Label>
                <Input type="email" value={form.clientEmail || ""} onChange={(e) => setField("clientEmail", e.target.value)} data-testid="input-client-email" />
              </div>
              <div>
                <Label>{t.deliveryLocation}</Label>
                <Input value={form.deliveryLocation || ""} onChange={(e) => setField("deliveryLocation", e.target.value)} data-testid="input-delivery-location" />
              </div>
              <div>
                <Label>{t.startDate}</Label>
                <Input type="date" value={form.startDate || ""} onChange={(e) => setField("startDate", e.target.value)} data-testid="input-start-date" />
              </div>
              <div>
                <Label>{t.endDate}</Label>
                <Input type="date" value={form.endDate || ""} onChange={(e) => setField("endDate", e.target.value)} data-testid="input-end-date" />
              </div>
              <div>
                <Label>{t.mealsPerDay}</Label>
                <Input type="number" min="1" value={form.mealsPerDay || 1} onChange={(e) => setField("mealsPerDay", parseInt(e.target.value) || 1)} data-testid="input-meals-per-day" />
              </div>
              <div>
                <Label>{t.deliveryTime}</Label>
                <Input value={form.deliveryTime || ""} onChange={(e) => setField("deliveryTime", e.target.value)} placeholder="12:00 - 14:00" data-testid="input-delivery-time" />
              </div>
            </div>

            <div>
              <Label>{t.deliveryDays}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DAY_KEYS.map((day) => {
                  const selected = (form.deliveryDays || []).includes(day);
                  return (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => {
                        const days = new Set(form.deliveryDays || []);
                        if (selected) days.delete(day); else days.add(day);
                        setField("deliveryDays", Array.from(days));
                      }}
                      data-testid={`button-day-${day}`}
                    >
                      {dayLabel(day)}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>{t.mealSelections}</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => { setPickedMenuIds({}); setMenuPickerOpen(true); }} data-testid="button-select-from-menu">
                    <ListPlus className="h-4 w-4 me-1" /> {t.selectFromMenu}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setField("mealSelections", [...(form.mealSelections || []), { name: "", price: 0, qtyPerDay: 1 }])} data-testid="button-add-meal">
                    <Plus className="h-4 w-4 me-1" /> {t.addMeal}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {(form.mealSelections || []).map((m: Meal, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input className="flex-1" placeholder={t.mealName} value={m.name} onChange={(e) => {
                      const list = [...form.mealSelections]; list[i] = { ...list[i], name: e.target.value }; setField("mealSelections", list);
                    }} data-testid={`input-meal-name-${i}`} />
                    <Input className="w-28" type="number" step="0.01" placeholder={t.mealPrice} value={m.price} onChange={(e) => {
                      const list = [...form.mealSelections]; list[i] = { ...list[i], price: parseFloat(e.target.value) || 0 }; setField("mealSelections", list);
                    }} data-testid={`input-meal-price-${i}`} />
                    <Input className="w-24" type="number" min="1" step="1" placeholder={t.qtyPerDay} title={t.qtyPerDay} value={m.qtyPerDay ?? 1} onChange={(e) => {
                      const list = [...form.mealSelections]; list[i] = { ...list[i], qtyPerDay: Math.max(1, parseInt(e.target.value) || 1) }; setField("mealSelections", list);
                    }} data-testid={`input-meal-qty-${i}`} />
                    <Button type="button" size="icon" variant="outline" onClick={() => {
                      const list = form.mealSelections.filter((_: any, idx: number) => idx !== i); setField("mealSelections", list);
                    }} data-testid={`button-remove-meal-${i}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>{t.totalValue}</Label>
                <Input value={form.totalValue || "0"} onChange={(e) => setField("totalValue", e.target.value)} data-testid="input-total-value" />
              </div>
              <div>
                <Label>{t.discountPercent}</Label>
                <Input type="number" step="0.01" value={form.discountPercent || "0"} onChange={(e) => setField("discountPercent", e.target.value)} data-testid="input-discount" />
              </div>
              <div>
                <Label>{t.finalValue}</Label>
                <Input value={form.finalValue || "0"} readOnly data-testid="input-final-value" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>{t.paymentInstallments}</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setField("paymentInstallments", [...(form.paymentInstallments || []), { label: "", percent: 0, amount: 0, dueDate: "" }])} data-testid="button-add-installment">
                  <Plus className="h-4 w-4 me-1" /> {t.addInstallment}
                </Button>
              </div>
              <div className="space-y-2">
                {(form.paymentInstallments || []).map((it: Installment, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-4" placeholder={t.installmentLabel} value={it.label} onChange={(e) => {
                      const list = [...form.paymentInstallments]; list[i] = { ...list[i], label: e.target.value }; setField("paymentInstallments", list);
                    }} data-testid={`input-installment-label-${i}`} />
                    <Input className="col-span-2" type="number" step="0.01" placeholder="%" value={it.percent} onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const final = parseFloat(form.finalValue) || 0;
                      const list = [...form.paymentInstallments];
                      list[i] = { ...list[i], percent: pct, amount: Number((final * pct / 100).toFixed(2)) };
                      setField("paymentInstallments", list);
                    }} data-testid={`input-installment-percent-${i}`} />
                    <Input className="col-span-3" type="number" step="0.01" placeholder={t.installmentAmount} value={it.amount} onChange={(e) => {
                      const list = [...form.paymentInstallments]; list[i] = { ...list[i], amount: parseFloat(e.target.value) || 0 }; setField("paymentInstallments", list);
                    }} data-testid={`input-installment-amount-${i}`} />
                    <Input className="col-span-2" type="date" value={it.dueDate || ""} onChange={(e) => {
                      const list = [...form.paymentInstallments]; list[i] = { ...list[i], dueDate: e.target.value }; setField("paymentInstallments", list);
                    }} data-testid={`input-installment-date-${i}`} />
                    <Button type="button" size="icon" variant="outline" onClick={() => {
                      const list = form.paymentInstallments.filter((_: any, idx: number) => idx !== i); setField("paymentInstallments", list);
                    }} data-testid={`button-remove-installment-${i}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.notes}</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setField("notes", e.target.value)} data-testid="input-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">{t.cancel}</Button>
            <Button onClick={handleSave} disabled={!form.clientName || !form.clientPhone || createMut.isPending || updateMut.isPending} data-testid="button-save">{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={menuPickerOpen} onOpenChange={setMenuPickerOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-menu-picker">
          <DialogHeader>
            <DialogTitle>{t.selectFromMenu}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t.pickMenuItems}</p>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1 py-2">
            {menuItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t.noMenuItems}</p>
            ) : (
              menuItems.map((mi) => (
                <label key={mi.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`row-menu-item-${mi.id}`}>
                  <Checkbox
                    checked={!!pickedMenuIds[mi.id]}
                    onCheckedChange={(v) => setPickedMenuIds(prev => ({ ...prev, [mi.id]: !!v }))}
                    data-testid={`checkbox-menu-item-${mi.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" data-testid={`text-menu-name-${mi.id}`}>{mi.name}</div>
                    {mi.category && <div className="text-xs text-muted-foreground truncate">{mi.category}</div>}
                  </div>
                  <Badge variant="secondary" data-testid={`text-menu-price-${mi.id}`}>{parseFloat(mi.price || "0").toFixed(2)} {t.sar}</Badge>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuPickerOpen(false)} data-testid="button-menu-picker-cancel">{t.cancel}</Button>
            <Button
              onClick={() => {
                const selected = menuItems.filter(mi => pickedMenuIds[mi.id]).map(mi => ({ menuItemId: mi.id, name: mi.name, price: parseFloat(mi.price || "0"), qtyPerDay: 1 }));
                if (selected.length) setField("mealSelections", [...(form.mealSelections || []), ...selected]);
                setMenuPickerOpen(false);
              }}
              data-testid="button-menu-picker-add"
            >
              {t.addSelected}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CostReportDialog
        contract={costReport}
        onClose={() => setCostReport(null)}
        menuItems={menuItems}
        recipes={recipes}
        t={t}
      />
    </div>
  );
}

function CostReportDialog({
  contract, onClose, menuItems, recipes, t,
}: {
  contract: CateringContract | null;
  onClose: () => void;
  menuItems: Array<{ id: string; name: string; price: string; recipeId?: string | null; portionSize?: string | null }>;
  recipes: Recipe[];
  t: ReturnType<typeof useCateringT>;
}) {
  const data = useMemo(() => {
    if (!contract) return null;
    const meals: Meal[] = Array.isArray(contract.mealSelections) ? (contract.mealSelections as any) : [];
    const menuById = new Map(menuItems.map(mi => [mi.id, mi]));
    const recipeById = new Map(recipes.map(r => [r.id, r]));

    const rows = meals.map((m) => {
      const mi = m.menuItemId ? menuById.get(m.menuItemId) : undefined;
      let cost: number | null = null;
      let note = "";
      if (!mi) {
        note = t.notLinkedToMenu;
      } else if (!mi.recipeId) {
        note = t.noRecipeLinked;
      } else {
        const recipe = recipeById.get(mi.recipeId);
        if (recipe) {
          const portion = parseFloat(mi.portionSize || "1") || 1;
          cost = parseFloat(recipe.cost || "0") * portion;
        } else {
          note = t.noRecipeLinked;
        }
      }
      const price = Number(m.price) || 0;
      const qty = Math.max(1, Number(m.qtyPerDay) || 1);
      const effectiveCost = cost ?? 0;
      const profit = price - effectiveCost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      return { name: m.name, price, qty, cost, costKnown: cost !== null, profit, margin, note };
    });

    // Compute total delivery dates within the contract window matching deliveryDays.
    const dayMap: Record<string, number> = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
    const days: string[] = Array.isArray(contract.deliveryDays) ? contract.deliveryDays : [];
    const dayNums = new Set(days.map(d => dayMap[String(d).toLowerCase()]).filter(n => n !== undefined));
    let deliveryDates = 0;
    if (contract.startDate && contract.endDate && dayNums.size > 0) {
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cur <= last) {
        if (dayNums.has(cur.getDay())) deliveryDates++;
        cur.setDate(cur.getDate() + 1);
      }
    }
    const dailyQty = rows.reduce((s, r) => s + r.qty, 0);
    const totalDeliveries = deliveryDates * dailyQty;
    const dailyCost = rows.reduce((s, r) => s + (r.cost ?? 0) * r.qty, 0);
    const dailyPrice = rows.reduce((s, r) => s + r.price * r.qty, 0);
    const avgPrice = dailyQty ? dailyPrice / dailyQty : 0;
    const avgCost  = dailyQty ? dailyCost / dailyQty : 0;
    const cogs = dailyCost * deliveryDates;
    const revenue = parseFloat(contract.finalValue || "0");
    const profit = revenue - cogs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const hasUnlinked = rows.some(r => !r.costKnown);

    return { rows, totalDeliveries, avgPrice, avgCost, cogs, revenue, profit, margin, hasUnlinked };
  }, [contract, menuItems, recipes, t]);

  if (!contract || !data) return null;
  const sar = t.sar;
  const fmt = (n: number) => n.toFixed(2);

  return (
    <Dialog open={!!contract} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-cost-report">
        <DialogHeader>
          <DialogTitle>{t.costReportTitle} — {contract.contractNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t.costReportSubtitle}</p>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {data.hasUnlinked && (
            <div className="text-xs rounded-md border border-dashed p-2 text-muted-foreground" data-testid="text-cost-warning">
              {t.costReportWarning}
            </div>
          )}

          <div>
            <div className="text-sm font-semibold mb-2">{t.mealsBreakdown}</div>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-start p-2">{t.mealName}</th>
                    <th className="text-end p-2">{t.qtyPerDay}</th>
                    <th className="text-end p-2">{t.mealPrice}</th>
                    <th className="text-end p-2">{t.unitCost}</th>
                    <th className="text-end p-2">{t.unitProfit}</th>
                    <th className="text-end p-2">{t.margin}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} className="border-t" data-testid={`row-cost-meal-${i}`}>
                      <td className="p-2">
                        <div>{r.name}</div>
                        {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                      </td>
                      <td className="p-2 text-end tabular-nums">{r.qty}</td>
                      <td className="p-2 text-end tabular-nums">{fmt(r.price)} {sar}</td>
                      <td className="p-2 text-end tabular-nums">{r.costKnown ? `${fmt(r.cost!)} ${sar}` : "—"}</td>
                      <td className="p-2 text-end tabular-nums">{fmt(r.profit)} {sar}</td>
                      <td className="p-2 text-end tabular-nums">{fmt(r.margin)}%</td>
                    </tr>
                  ))}
                  {data.rows.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">—</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <SummaryRow label={t.totalDeliveries} value={String(data.totalDeliveries)} testid="cost-total-deliveries" />
            <SummaryRow label={t.avgMealPrice} value={`${fmt(data.avgPrice)} ${sar}`} testid="cost-avg-price" />
            <SummaryRow label={t.avgMealCost} value={`${fmt(data.avgCost)} ${sar}`} testid="cost-avg-cost" />
            <SummaryRow label={t.estimatedCogs} value={`${fmt(data.cogs)} ${sar}`} testid="cost-cogs" />
            <SummaryRow label={t.contractRevenue} value={`${fmt(data.revenue)} ${sar}`} testid="cost-revenue" />
            <SummaryRow label={t.estimatedProfit} value={`${fmt(data.profit)} ${sar}`} testid="cost-profit"
              valueClass={data.profit >= 0 ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"} />
          </div>

          <div className="rounded-md border p-3 flex items-center justify-between">
            <div className="text-sm font-semibold">{t.overallMargin}</div>
            <div className={`text-lg tabular-nums font-bold ${data.margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="text-cost-overall-margin">
              {fmt(data.margin)}%
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cost-report-close">{t.closeReport}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value, testid, valueClass }: { label: string; value: string; testid: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${valueClass || ""}`} data-testid={`text-${testid}`}>{value}</span>
    </div>
  );
}

type CustomPh = { key: string; label: string; value: string };

function TemplateEditor({ templates, t }: { templates: CateringContractTemplate[]; t: ReturnType<typeof useCateringT> }) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [customPlaceholders, setCustomPlaceholders] = useState<CustomPh[]>([]);
  const [newPhKey, setNewPhKey] = useState("");
  const [newPhLabel, setNewPhLabel] = useState("");
  const [newPhValue, setNewPhValue] = useState("");

  const selected = templates.find(tpl => tpl.id === selectedId);

  // Sync form when selection changes
  useMemo(() => {
    if (selected) {
      setName(selected.name);
      setContent(selected.content);
      setIsDefault(selected.isDefault);
      setCustomPlaceholders(Array.isArray((selected as any).customPlaceholders) ? (selected as any).customPlaceholders : []);
    } else {
      setName("");
      setContent("");
      setIsDefault(false);
      setCustomPlaceholders([]);
    }
    setNewPhKey(""); setNewPhLabel(""); setNewPhValue("");
  }, [selectedId]);

  const sanitizeKey = (k: string) =>
    k.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");

  const addCustomPh = () => {
    const key = sanitizeKey(newPhKey);
    if (!key) {
      toast({ title: t.placeholderKeyRequired, variant: "destructive" });
      return;
    }
    const reservedKeys = new Set(PLACEHOLDERS);
    if (reservedKeys.has(key) || customPlaceholders.some(p => p.key === key)) {
      toast({ title: t.placeholderKeyExists, variant: "destructive" });
      return;
    }
    setCustomPlaceholders(prev => [...prev, { key, label: newPhLabel.trim() || key, value: newPhValue }]);
    setNewPhKey(""); setNewPhLabel(""); setNewPhValue("");
  };

  const updateCustomPh = (idx: number, patch: Partial<CustomPh>) => {
    setCustomPlaceholders(prev => {
      const next = prev.map((p, i) => i === idx ? { ...p, ...patch } : p);
      if (patch.key !== undefined) {
        const newKey = next[idx].key;
        const reserved = new Set(PLACEHOLDERS);
        const duplicate = next.some((p, i) => i !== idx && p.key && p.key === newKey);
        if (newKey && (reserved.has(newKey) || duplicate)) {
          toast({ title: t.placeholderKeyExists, variant: "destructive" });
          return prev;
        }
      }
      return next;
    });
  };

  const removeCustomPh = (idx: number) => {
    setCustomPlaceholders(prev => prev.filter((_, i) => i !== idx));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = { name, content, isDefault, customPlaceholders };
      if (selectedId) return await apiRequest("PATCH", `/api/catering-contract-templates/${selectedId}`, body);
      return await apiRequest("POST", "/api/catering-contract-templates", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catering-contract-templates"] });
      toast({ title: t.templateSaved });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async () => await apiRequest("DELETE", `/api/catering-contract-templates/${selectedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catering-contract-templates"] });
      setSelectedId("");
      toast({ title: t.templateDeleted });
    },
  });

  const insertPlaceholder = (ph: string) => {
    setContent((prev) => prev + ` {{${ph}}} `);
  };

  // Live preview with sample data
  const previewHtml = useMemo(() => {
    const sample: Record<string, string> = {
      my_restaurant_name: "My Restaurant",
      client_name: "John Doe",
      phone: "+966500000000",
      email: "client@example.com",
      delivery_location: "Riyadh, KSA",
      meals_list: "<ul><li>Chicken Mandi — 35.00 SAR</li><li>Salad — 10.00 SAR</li></ul>",
      number_of_meals: "2",
      delivery_days: "Sunday, Tuesday, Thursday",
      delivery_time: "12:00 - 14:00",
      total_value: "1,500.00 SAR",
      discount_percentage: "5.00%",
      final_value: "1,425.00 SAR",
      payment_schedule: "<table border='1' cellpadding='6' style='border-collapse:collapse;'><tr><td>50% on signing</td><td>712.50 SAR</td></tr><tr><td>50% on delivery</td><td>712.50 SAR</td></tr></table>",
      start_date: "01/06/2026",
      end_date: "30/06/2026",
    };
    const esc = (s: string) => String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    let html = content;
    for (const [k, v] of Object.entries(sample)) html = html.split(`{{${k}}}`).join(v);
    // User-defined custom placeholders (override built-ins). Values are escaped
    // so untrusted text cannot inject HTML/script into the preview.
    for (const cp of customPlaceholders) {
      if (cp.key) html = html.split(`{{${cp.key}}}`).join(esc(cp.value || ""));
    }
    // If plain text, convert newlines
    if (!/<[a-z][^>]*>/i.test(content)) {
      html = html.split("\n").map((l) => `<p style="margin:6px 0;">${l}</p>`).join("");
    }
    return html;
  }, [content, customPlaceholders]);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">{t.tabTemplate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => setSelectedId("")} data-testid="button-new-template">
            <Plus className="h-4 w-4 me-2" /> {t.newTemplate}
          </Button>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">{t.noTemplates}</p>
          ) : (
            templates.map((tpl) => (
              <button
                key={tpl.id}
                className={`w-full text-start p-2 rounded-md border hover-elevate ${selectedId === tpl.id ? 'bg-accent' : ''}`}
                onClick={() => setSelectedId(tpl.id)}
                data-testid={`button-template-${tpl.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm flex-1">{tpl.name}</span>
                  {tpl.isDefault && <Badge variant="secondary">{t.defaultTemplate}</Badge>}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{t.templateEditor}</CardTitle>
          <CardDescription>{t.templateEditorDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t.templateName}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-template-name" />
          </div>

          <div>
            <Label>{t.placeholders}</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {PLACEHOLDERS.map((ph) => (
                <Button key={ph} type="button" size="sm" variant="outline" onClick={() => insertPlaceholder(ph)} data-testid={`button-ph-${ph}`}>
                  {`{{${ph}}}`}
                </Button>
              ))}
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">{t.customPlaceholders}</Label>
              <span className="text-xs text-muted-foreground">{t.customPlaceholdersDesc}</span>
            </div>

            {customPlaceholders.length > 0 && (
              <div className="space-y-2">
                {customPlaceholders.map((cp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center" data-testid={`row-custom-ph-${idx}`}>
                    <Input
                      className="col-span-3 font-mono text-xs"
                      value={cp.key}
                      onChange={(e) => updateCustomPh(idx, { key: sanitizeKey(e.target.value) })}
                      placeholder={t.placeholderKey}
                      data-testid={`input-custom-ph-key-${idx}`}
                    />
                    <Input
                      className="col-span-3 text-xs"
                      value={cp.label}
                      onChange={(e) => updateCustomPh(idx, { label: e.target.value })}
                      placeholder={t.placeholderLabel}
                      data-testid={`input-custom-ph-label-${idx}`}
                    />
                    <Input
                      className="col-span-4 text-xs"
                      value={cp.value}
                      onChange={(e) => updateCustomPh(idx, { value: e.target.value })}
                      placeholder={t.placeholderValue}
                      data-testid={`input-custom-ph-value-${idx}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="col-span-1"
                      onClick={() => insertPlaceholder(cp.key)}
                      disabled={!cp.key}
                      data-testid={`button-insert-custom-ph-${idx}`}
                    >
                      <ListPlus className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="col-span-1"
                      onClick={() => removeCustomPh(idx)}
                      data-testid={`button-remove-custom-ph-${idx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t">
              <Input
                className="col-span-3 font-mono text-xs"
                value={newPhKey}
                onChange={(e) => setNewPhKey(e.target.value)}
                placeholder={t.placeholderKey}
                data-testid="input-new-ph-key"
              />
              <Input
                className="col-span-3 text-xs"
                value={newPhLabel}
                onChange={(e) => setNewPhLabel(e.target.value)}
                placeholder={t.placeholderLabel}
                data-testid="input-new-ph-label"
              />
              <Input
                className="col-span-4 text-xs"
                value={newPhValue}
                onChange={(e) => setNewPhValue(e.target.value)}
                placeholder={t.placeholderValue}
                data-testid="input-new-ph-value"
              />
              <Button
                type="button"
                size="sm"
                className="col-span-2"
                onClick={addCustomPh}
                data-testid="button-add-custom-ph"
              >
                <Plus className="h-3 w-3 me-1" /> {t.addPlaceholder}
              </Button>
            </div>
          </div>

          <div>
            <Label>{t.templateContent}</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="font-mono text-sm" data-testid="input-template-content" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is-default" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} data-testid="checkbox-default" />
            <Label htmlFor="is-default" className="cursor-pointer">{t.setAsDefault}</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate()} disabled={!name || saveMut.isPending} data-testid="button-save-template">
              {selectedId ? t.updateTemplate : t.saveTemplate}
            </Button>
            {selectedId && (
              <Button variant="outline" onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(); }} data-testid="button-delete-template">
                <Trash2 className="h-4 w-4 me-2" /> {t.delete}
              </Button>
            )}
          </div>

          <div>
            <Label>{t.livePreview}</Label>
            <div className="border rounded-md p-4 bg-background min-h-[200px] prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
