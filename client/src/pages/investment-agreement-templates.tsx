import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInvestmentAgreementTemplatesT } from "@/i18n/investmentAgreementTemplatesTranslations";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ListPlus, FileText, RefreshCw } from "lucide-react";
import type { InvestmentAgreementTemplate } from "@shared/schema";

const PLACEHOLDERS = [
  "agreement_date", "hijri_date", "my_restaurant_name", "restaurant_cr", "restaurant_tax_number", "restaurant_national_id",
  "investor_name", "national_id", "contact_number", "investor_type", "amount_invested", "amount_in_words",
  "interest_percentage", "percentage_in_words", "iban", "bank_name", "notes", "recipe_name", "recipe_clause",
];

type CustomPh = { key: string; label: string; value: string };

export default function InvestmentAgreementTemplatesPage() {
  const { isRTL, language } = useLanguage();
  const t = useInvestmentAgreementTemplatesT(language);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<InvestmentAgreementTemplate[]>({
    queryKey: ["/api/investment-agreement-templates"],
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [customPlaceholders, setCustomPlaceholders] = useState<CustomPh[]>([]);
  const [newPhKey, setNewPhKey] = useState("");
  const [newPhLabel, setNewPhLabel] = useState("");
  const [newPhValue, setNewPhValue] = useState("");

  const selected = templates.find(tpl => tpl.id === selectedId);

  useEffect(() => {
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
  }, [selectedId, selected?.updatedAt]);

  const sanitizeKey = (k: string) =>
    k.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");

  const addCustomPh = () => {
    const key = sanitizeKey(newPhKey);
    if (!key) { toast({ title: t.placeholderKeyRequired, variant: "destructive" }); return; }
    const reservedKeys = new Set(PLACEHOLDERS);
    if (reservedKeys.has(key) || customPlaceholders.some(p => p.key === key)) {
      toast({ title: t.placeholderKeyExists, variant: "destructive" }); return;
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
      if (selectedId) return await apiRequest("PATCH", `/api/investment-agreement-templates/${selectedId}`, body);
      return await apiRequest("POST", "/api/investment-agreement-templates", body);
    },
    onSuccess: async (resp: any) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/investment-agreement-templates"] });
      try {
        const created = await resp.json();
        if (!selectedId && created?.id) setSelectedId(created.id);
      } catch {}
      toast({ title: t.templateSaved });
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async () => await apiRequest("DELETE", `/api/investment-agreement-templates/${selectedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investment-agreement-templates"] });
      setSelectedId("");
      toast({ title: t.templateDeleted });
    },
    onError: (e: any) => toast({ title: t.error, description: e.message, variant: "destructive" }),
  });

  const insertPlaceholder = (ph: string) => {
    setContent((prev) => prev + ` {{${ph}}} `);
  };

  const loadDefaultContent = async () => {
    try {
      const r = await fetch('/api/investment-agreement-templates/default-content', { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setContent(data.content || '');
        const suggested: Array<{ key: string; label?: string; labelAr?: string; value?: string }> =
          Array.isArray(data.suggestedCustomPlaceholders) ? data.suggestedCustomPlaceholders : [];
        // Per spec: only pre-fill when the template has no custom placeholders
        // yet — never clobber user-entered rows on subsequent loads.
        if (suggested.length > 0 && customPlaceholders.length === 0) {
          setCustomPlaceholders(suggested
            .filter(s => s.key)
            .map(s => ({
              key: s.key,
              label: (isRTL ? (s.labelAr || s.label) : (s.label || s.labelAr)) || s.key,
              value: s.value || "",
            })));
        }
      }
    } catch (e: any) {
      toast({ title: t.error, description: e?.message, variant: 'destructive' });
    }
  };

  // Live preview with sample data
  const previewHtml = useMemo(() => {
    const sample: Record<string, string> = {
      agreement_date: "01/06/2026",
      hijri_date: isRTL ? "١٥ ذو القعدة ١٤٤٧ هـ" : "15 Dhu al-Qi'dah 1447 AH",
      my_restaurant_name: "My Restaurant",
      restaurant_cr: "1010000000",
      restaurant_tax_number: "300000000000003",
      restaurant_national_id: "1010000000",
      investor_name: "John Doe",
      national_id: "1234567890",
      contact_number: "+966500000000",
      investor_type: t.moneyInvestor,
      amount_invested: "100000.00",
      amount_in_words: isRTL ? "مئة ألف" : "one hundred thousand",
      interest_percentage: "10.00",
      percentage_in_words: isRTL ? "عشرة بالمئة" : "ten percent",
      iban: "SA0380000000608010167519",
      bank_name: "Al Rajhi Bank",
      notes: "—",
      recipe_name: "—",
      recipe_clause: "",
    };
    const esc = (s: string) => String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    // Escape user template first (rendered as plain text), then substitute sample/custom values (escaped) — mirrors backend.
    let html = esc(content);
    for (const [k, v] of Object.entries(sample)) html = html.split(`{{${k}}}`).join(esc(v));
    for (const cp of customPlaceholders) {
      if (cp.key) html = html.split(`{{${cp.key}}}`).join(esc(cp.value || ""));
    }
    html = html.split("\n").map((l) => `<p style="margin:6px 0;">${l || '&nbsp;'}</p>`).join("");
    return html;
  }, [content, customPlaceholders, t.moneyInvestor]);

  return (
    <div className="p-4 md:p-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.pageDesc}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t.tabTemplate}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setSelectedId("")} data-testid="button-new-template">
              <Plus className="h-4 w-4 me-2" /> {t.newTemplate}
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-3">…</p>
            ) : templates.length === 0 ? (
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
                    <span className="font-medium text-sm flex-1 truncate">{tpl.name}</span>
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
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
                      <Button type="button" size="sm" variant="outline" className="col-span-1"
                        onClick={() => insertPlaceholder(cp.key)} disabled={!cp.key}
                        data-testid={`button-insert-custom-ph-${idx}`}>
                        <ListPlus className="h-3 w-3" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="col-span-1"
                        onClick={() => removeCustomPh(idx)}
                        data-testid={`button-remove-custom-ph-${idx}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t">
                <Input className="col-span-3 font-mono text-xs" value={newPhKey}
                  onChange={(e) => setNewPhKey(e.target.value)} placeholder={t.placeholderKey}
                  data-testid="input-new-ph-key" />
                <Input className="col-span-3 text-xs" value={newPhLabel}
                  onChange={(e) => setNewPhLabel(e.target.value)} placeholder={t.placeholderLabel}
                  data-testid="input-new-ph-label" />
                <Input className="col-span-4 text-xs" value={newPhValue}
                  onChange={(e) => setNewPhValue(e.target.value)} placeholder={t.placeholderValue}
                  data-testid="input-new-ph-value" />
                <Button type="button" size="sm" className="col-span-2" onClick={addCustomPh}
                  data-testid="button-add-custom-ph">
                  <Plus className="h-3 w-3 me-1" /> {t.addPlaceholder}
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label>{t.templateContent}</Label>
                <Button type="button" size="sm" variant="ghost" onClick={loadDefaultContent}
                  data-testid="button-load-default" title={t.loadDefaultDesc}>
                  <RefreshCw className="h-3 w-3 me-1" /> {t.loadDefault}
                </Button>
              </div>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14}
                className="font-mono text-sm" data-testid="input-template-content" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is-default" checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)} data-testid="checkbox-default" />
              <Label htmlFor="is-default" className="cursor-pointer">{t.setAsDefault}</Label>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => saveMut.mutate()} disabled={!name || saveMut.isPending}
                data-testid="button-save-template">
                {selectedId ? t.updateTemplate : t.saveTemplate}
              </Button>
              {selectedId && (
                <Button variant="outline"
                  onClick={() => { if (confirm(t.confirmDelete)) deleteMut.mutate(); }}
                  data-testid="button-delete-template">
                  <Trash2 className="h-4 w-4 me-2" /> {t.delete}
                </Button>
              )}
            </div>

            <div>
              <Label>{t.livePreview}</Label>
              <div className="border rounded-md p-4 bg-background min-h-[200px] prose prose-sm max-w-none dark:prose-invert"
                dir={isRTL ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
