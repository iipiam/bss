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
import { Plus, Trash2, Pencil, FileDown, Mail, MessageCircle, FileText } from "lucide-react";
import { formatPhoneForWhatsApp, openWhatsAppWithMessage } from "@/lib/whatsapp";
import type { CateringContract, CateringContractTemplate } from "@shared/schema";

type Meal = { name: string; price: number };
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

  const { data: contracts = [], isLoading } = useQuery<CateringContract[]>({ queryKey: ["/api/catering-contracts"] });
  const { data: templates = [] } = useQuery<CateringContractTemplate[]>({ queryKey: ["/api/catering-contract-templates"] });

  const dayLabel = (k: string) => (t as any)[k] || k;

  // Auto compute totals when meals/discount change
  const recalc = (next: any) => {
    const meals: Meal[] = next.mealSelections || [];
    const mealsPerDay = Number(next.mealsPerDay) || 1;
    const start = new Date(next.startDate);
    const end = new Date(next.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const deliveryDaysCount = (next.deliveryDays || []).length;
    // Approx delivering days within period
    const weeks = days / 7;
    const totalDeliveries = Math.round(weeks * deliveryDaysCount) || days;
    const pricePerMeal = meals.length ? meals.reduce((s, m) => s + (Number(m.price) || 0), 0) / meals.length : 0;
    const total = pricePerMeal * mealsPerDay * totalDeliveries;
    const discount = Number(next.discountPercent) || 0;
    const final = total * (1 - discount / 100);
    return { ...next, totalValue: total.toFixed(2), finalValue: final.toFixed(2) };
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
    const resp = await fetch(`/api/catering-contracts/${c.id}/pdf`, { credentials: "include" });
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
    mutationFn: async (id: string) => await apiRequest("POST", `/api/catering-contracts/${id}/send-email`, {}),
    onSuccess: () => toast({ title: t.emailSent }),
    onError: (e: any) => toast({ title: t.emailFailed, description: e.message, variant: "destructive" }),
  });

  const sendWhatsApp = async (c: CateringContract) => {
    if (!c.clientPhone) return;
    try {
      const resp = await apiRequest("POST", `/api/catering-contracts/${c.id}/share-link`, {});
      const { url } = await resp.json();
      const phone = formatPhoneForWhatsApp(c.clientPhone);
      const msg = language === 'ar'
        ? `مرحبا ${c.clientName}،\nعقد التموين رقم ${c.contractNumber} جاهز.\nالقيمة النهائية: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nتحميل العقد (PDF):\n${url}\n\nشكرا.`
        : `Hello ${c.clientName},\nYour catering contract ${c.contractNumber} is ready.\nFinal value: ${parseFloat(c.finalValue || '0').toFixed(2)} ${t.sar}\n\nDownload contract (PDF):\n${url}\n\nThank you.`;
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
                <Button type="button" size="sm" variant="outline" onClick={() => setField("mealSelections", [...(form.mealSelections || []), { name: "", price: 0 }])} data-testid="button-add-meal">
                  <Plus className="h-4 w-4 me-1" /> {t.addMeal}
                </Button>
              </div>
              <div className="space-y-2">
                {(form.mealSelections || []).map((m: Meal, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input className="flex-1" placeholder={t.mealName} value={m.name} onChange={(e) => {
                      const list = [...form.mealSelections]; list[i] = { ...list[i], name: e.target.value }; setField("mealSelections", list);
                    }} data-testid={`input-meal-name-${i}`} />
                    <Input className="w-32" type="number" step="0.01" placeholder={t.mealPrice} value={m.price} onChange={(e) => {
                      const list = [...form.mealSelections]; list[i] = { ...list[i], price: parseFloat(e.target.value) || 0 }; setField("mealSelections", list);
                    }} data-testid={`input-meal-price-${i}`} />
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
    </div>
  );
}

function TemplateEditor({ templates, t }: { templates: CateringContractTemplate[]; t: ReturnType<typeof useCateringT> }) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const selected = templates.find(tpl => tpl.id === selectedId);

  // Sync form when selection changes
  useMemo(() => {
    if (selected) {
      setName(selected.name);
      setContent(selected.content);
      setIsDefault(selected.isDefault);
    } else {
      setName("");
      setContent("");
      setIsDefault(false);
    }
  }, [selectedId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = { name, content, isDefault };
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
    let html = content;
    for (const [k, v] of Object.entries(sample)) html = html.split(`{{${k}}}`).join(v);
    // If plain text, convert newlines
    if (!/<[a-z][^>]*>/i.test(content)) {
      html = html.split("\n").map((l) => `<p style="margin:6px 0;">${l}</p>`).join("");
    }
    return html;
  }, [content]);

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
