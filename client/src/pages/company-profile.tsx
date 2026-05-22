import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download, Upload, Save, Loader2, Palette, Eye, FileText, Type, Layout, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CompanyProfile, InsertCompanyProfile } from "@shared/schema";

type ProfileForm = Omit<InsertCompanyProfile, "restaurantId">;

// Localized labels for UI (the page's own text; switches based on app language / RTL).
// Falls back to English when global t.* doesn't have a key.
const LABELS = {
  en: {
    pageTitle: "Company Profile",
    pageSubtitle: "Build a marketing-ready company profile and export it as a professional PDF.",
    save: "Save", saving: "Saving...",
    generatePdf: "Generate PDF", generating: "Generating...",
    edit: "Edit", livePreview: "Live Preview",
    templateBranding: "Template & Branding",
    template: "Template",
    fontFamily: "Font Family",
    headerStyle: "Header Style",
    pdfLanguage: "PDF Language",
    autoMatchApp: "Auto (match app language)",
    brandColors: "Brand Colors",
    primary: "Primary", secondary: "Secondary (Dark)", accent: "Accent",
    logo: "Logo", coverImage: "Cover / Hero Image",
    upload: "Upload", remove: "Remove",
    companyInformation: "Company Information",
    companyNameEn: "Company Name (English)", companyNameAr: "Company Name (Arabic)",
    taglineEn: "Tagline (English)", taglineAr: "Tagline (Arabic)",
    aboutEn: "About (English)", aboutAr: "About (Arabic)",
    visionEn: "Vision (English)", visionAr: "Vision (Arabic)",
    missionEn: "Mission (English)", missionAr: "Mission (Arabic)",
    coreValues: "Core Values", addValue: "Add Value",
    valueTitle: "Title (e.g., Integrity)", valueDesc: "Description",
    noValues: 'No core values yet. Click "Add Value" to begin.',
    servicesAndProducts: "Services & Products", addService: "Add Service",
    serviceTitle: "Service title", serviceDesc: "Description",
    noServices: "No services yet.",
    keyAchievements: "Key Achievements & Statistics", addStat: "Add Stat",
    statValue: "Value (e.g., 500+)", statLabel: "Label (e.g., Happy Clients)",
    noAchievements: 'No achievements yet. Example: "500+" / "Happy Clients".',
    testimonials: "Testimonials", addTestimonial: "Add Testimonial",
    photo: "Photo", quoteFrom: "Name", role: "Role / Company", quote: "Quote",
    noTestimonials: "No testimonials yet.",
    gallery: "Gallery (Optional)", addImage: "Add Image",
    image: "Image", caption: "Caption (optional)",
    noGallery: "No gallery images yet.",
    ourClients: "Our Clients", addPartner: "Add Partner",
    partnerName: "Partner Name", partnerWebsite: "Website (optional)",
    partnerLogo: "Logo",
    noPartners: "No partners yet. Showcase notable customers and clients here.",
    contactInformation: "Contact Information",
    email: "Email", phone: "Phone", website: "Website", address: "Address",
    linkedin: "LinkedIn", instagram: "Instagram", twitter: "Twitter / X",
    livePreviewDesc: "Approximate preview of your PDF — generate to see exact output.",
    saved: "Saved", savedDesc: "Company profile saved successfully.",
    saveFailed: "Save failed", couldNotSave: "Could not save",
    pdfGenerated: "PDF generated", pdfGeneratedDesc: "Your company profile PDF has been downloaded.",
    pdfFailed: "PDF failed", couldNotGenerate: "Could not generate PDF",
    imageTooBig: "Image must be under 4MB",
  },
  ar: {
    pageTitle: "ملف الشركة التعريفي",
    pageSubtitle: "أنشئ ملفًا تعريفيًا احترافيًا لشركتك وقم بتصديره كملف PDF.",
    save: "حفظ", saving: "جارٍ الحفظ...",
    generatePdf: "إنشاء PDF", generating: "جارٍ الإنشاء...",
    edit: "تعديل", livePreview: "معاينة مباشرة",
    templateBranding: "القالب والهوية البصرية",
    template: "القالب",
    fontFamily: "نوع الخط",
    headerStyle: "نمط الترويسة",
    pdfLanguage: "لغة الملف",
    autoMatchApp: "تلقائي (مطابقة لغة التطبيق)",
    brandColors: "ألوان الهوية",
    primary: "اللون الرئيسي", secondary: "اللون الثانوي (غامق)", accent: "لون التمييز",
    logo: "الشعار", coverImage: "صورة الغلاف",
    upload: "رفع", remove: "إزالة",
    companyInformation: "معلومات الشركة",
    companyNameEn: "اسم الشركة (إنجليزي)", companyNameAr: "اسم الشركة (عربي)",
    taglineEn: "الشعار (إنجليزي)", taglineAr: "الشعار (عربي)",
    aboutEn: "نبذة (إنجليزي)", aboutAr: "نبذة (عربي)",
    visionEn: "الرؤية (إنجليزي)", visionAr: "الرؤية (عربي)",
    missionEn: "الرسالة (إنجليزي)", missionAr: "الرسالة (عربي)",
    coreValues: "القيم الأساسية", addValue: "إضافة قيمة",
    valueTitle: "العنوان (مثال: النزاهة)", valueDesc: "الوصف",
    noValues: "لا توجد قيم بعد. اضغط \"إضافة قيمة\" للبدء.",
    servicesAndProducts: "الخدمات والمنتجات", addService: "إضافة خدمة",
    serviceTitle: "عنوان الخدمة", serviceDesc: "الوصف",
    noServices: "لا توجد خدمات بعد.",
    keyAchievements: "الإنجازات والإحصائيات", addStat: "إضافة إحصائية",
    statValue: "القيمة (مثال: +500)", statLabel: "التسمية (مثال: عميل سعيد)",
    noAchievements: "لا توجد إنجازات بعد.",
    testimonials: "آراء العملاء", addTestimonial: "إضافة شهادة",
    photo: "صورة", quoteFrom: "الاسم", role: "الدور / الشركة", quote: "النص",
    noTestimonials: "لا توجد شهادات بعد.",
    gallery: "معرض الصور (اختياري)", addImage: "إضافة صورة",
    image: "صورة", caption: "تعليق (اختياري)",
    noGallery: "لا توجد صور بعد.",
    ourClients: "عملاؤنا", addPartner: "إضافة عميل",
    partnerName: "اسم العميل", partnerWebsite: "الموقع الإلكتروني (اختياري)",
    partnerLogo: "الشعار",
    noPartners: "لا يوجد عملاء بعد. اعرض عملاءك المميزين هنا.",
    contactInformation: "معلومات التواصل",
    email: "البريد الإلكتروني", phone: "الهاتف", website: "الموقع الإلكتروني", address: "العنوان",
    linkedin: "لينكدإن", instagram: "إنستغرام", twitter: "تويتر / X",
    livePreviewDesc: "معاينة تقريبية للملف — قم بالإنشاء لرؤية الناتج الفعلي.",
    saved: "تم الحفظ", savedDesc: "تم حفظ ملف الشركة بنجاح.",
    saveFailed: "فشل الحفظ", couldNotSave: "تعذّر الحفظ",
    pdfGenerated: "تم إنشاء PDF", pdfGeneratedDesc: "تم تنزيل ملف PDF الخاص بشركتك.",
    pdfFailed: "فشل الإنشاء", couldNotGenerate: "تعذّر إنشاء PDF",
    imageTooBig: "حجم الصورة يجب أن يكون أقل من 4 ميغابايت",
  },
} as const;

function useLabels() {
  const { isRTL } = useLanguage();
  return isRTL ? LABELS.ar : LABELS.en;
}

const TEMPLATES = [
  { id: "modern",    en: "Modern",    ar: "عصري",       descEn: "Bold gradients, vibrant cover, card layout",      descAr: "تدرّجات لونية جريئة وغلاف نابض، تخطيط بطاقات" },
  { id: "corporate", en: "Corporate", ar: "مؤسسي",      descEn: "Classic serif headlines, formal structure",        descAr: "عناوين كلاسيكية بخط Serif وهيكل رسمي" },
  { id: "creative",  en: "Creative",  ar: "إبداعي",     descEn: "Playful gradients, organic shapes, vibrant",       descAr: "تدرّجات مرحة وأشكال عضوية وألوان زاهية" },
  { id: "minimal",   en: "Minimal",   ar: "بسيط",       descEn: "Clean typography, generous whitespace",            descAr: "طباعة نظيفة ومساحات بيضاء واسعة" },
  { id: "executive", en: "Executive", ar: "تنفيذي",     descEn: "Premium formal layout for C-level audiences",      descAr: "تخطيط رسمي فاخر للمدراء التنفيذيين" },
  { id: "elegant",   en: "Elegant",   ar: "أنيق",       descEn: "Refined serif elegance, editorial feel",           descAr: "أناقة Serif راقية بطابع تحريري" },
  { id: "bold",      en: "Bold",      ar: "جريء",       descEn: "Oversized type, high-impact contrast",             descAr: "خطوط كبيرة وتباين عالي التأثير" },
  { id: "tech",      en: "Tech",      ar: "تقني",       descEn: "Modern startup style, geometric and clean",        descAr: "أسلوب الشركات الناشئة، هندسي ونظيف" },
] as const;

const FONTS = [
  { id: "inter",      en: "Inter (Modern Sans)",        ar: "Inter (حديث)",         css: "Inter, system-ui" },
  { id: "manrope",    en: "Manrope (Tech Sans)",        ar: "Manrope (تقني)",       css: "Manrope, system-ui" },
  { id: "poppins",    en: "Poppins (Friendly Sans)",    ar: "Poppins (ودود)",       css: "Poppins, system-ui" },
  { id: "montserrat", en: "Montserrat (Geometric)",     ar: "Montserrat (هندسي)",   css: "Montserrat, system-ui" },
  { id: "playfair",   en: "Playfair Display (Editorial)", ar: "Playfair (تحريري)",  css: '"Playfair Display", serif' },
  { id: "lora",       en: "Lora (Refined Serif)",       ar: "Lora (راقي)",          css: "Lora, serif" },
] as const;

const HEADER_STYLES = [
  { id: "gradient", en: "Gradient",       ar: "تدرّج لوني" },
  { id: "solid",    en: "Solid Color",    ar: "لون موحّد" },
  { id: "split",    en: "Two-Tone Split", ar: "مقسوم بلونين" },
  { id: "image",    en: "Cover Image",    ar: "صورة غلاف" },
  { id: "minimal",  en: "Minimal Light",  ar: "بسيط فاتح" },
] as const;

const COLOR_PRESETS = [
  { name: "Royal",    primary: "#2563eb", secondary: "#0f172a", accent: "#f59e0b" },
  { name: "Emerald",  primary: "#059669", secondary: "#064e3b", accent: "#d97706" },
  { name: "Crimson",  primary: "#dc2626", secondary: "#1f2937", accent: "#f59e0b" },
  { name: "Sapphire", primary: "#0284c7", secondary: "#0c4a6e", accent: "#fb923c" },
  { name: "Purple",   primary: "#7c3aed", secondary: "#1e1b4b", accent: "#ec4899" },
  { name: "Sand",     primary: "#a16207", secondary: "#451a03", accent: "#0e7490" },
  { name: "Slate",    primary: "#475569", secondary: "#0f172a", accent: "#10b981" },
  { name: "Mono",     primary: "#111827", secondary: "#374151", accent: "#9ca3af" },
];

const DEFAULT: ProfileForm = {
  template: "modern",
  primaryColor: "#2563eb",
  secondaryColor: "#0f172a",
  accentColor: "#f59e0b",
  fontFamily: "inter",
  headerStyle: "gradient",
  companyName: "",
  companyNameAr: "",
  tagline: "",
  taglineAr: "",
  about: "",
  aboutAr: "",
  vision: "",
  visionAr: "",
  mission: "",
  missionAr: "",
  logoDataUrl: "",
  coverDataUrl: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  contactWebsite: "",
  socialLinkedin: "",
  socialInstagram: "",
  socialTwitter: "",
  coreValues: [],
  services: [],
  achievements: [],
  testimonials: [],
  galleryImages: [],
  partners: [],
  language: "en",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ImageUploader({ value, onChange, label, height = "h-32", testId, maxSizeMB = 4 }: { value?: string | null; onChange: (v: string) => void; label: string; height?: string; testId: string; maxSizeMB?: number }) {
  const L = useLabels();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className={`relative ${height} border-2 border-dashed rounded-md overflow-hidden bg-muted/30 flex items-center justify-center`}>
        {value ? (
          <>
            <img src={value} className="w-full h-full object-contain" alt="upload" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label={L.remove}
                  className="absolute top-2 right-2"
                  onClick={() => onChange("")}
                  data-testid={`button-remove-${testId}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{L.remove}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={() => ref.current?.click()} data-testid={`button-upload-${testId}`}>
            <Upload className="h-4 w-4 mr-2" /> {L.upload}
          </Button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          data-testid={`input-file-${testId}`}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > maxSizeMB * 1024 * 1024) {
                alert(L.imageTooBig);
                return;
              }
              const data = await readFileAsDataUrl(f);
              onChange(data);
            }
          }}
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border cursor-pointer"
          data-testid={`input-color-${testId}`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" data-testid={`input-color-text-${testId}`} />
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const { isRTL, language, t } = useLanguage();
  const L = useLabels();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(DEFAULT);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [isGenerating, setIsGenerating] = useState(false);
  // "auto" means follow the global app language; otherwise force a specific one
  const [pdfLangMode, setPdfLangMode] = useState<"auto" | "en" | "ar">("auto");

  const { data: profile, isLoading } = useQuery<CompanyProfile | null>({
    queryKey: ["/api/company-profile"],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        ...DEFAULT,
        ...profile,
        fontFamily: (profile as any).fontFamily || "inter",
        headerStyle: (profile as any).headerStyle || "gradient",
        coreValues: (profile.coreValues as any) || [],
        services: (profile.services as any) || [],
        achievements: (profile.achievements as any) || [],
        testimonials: (profile.testimonials as any) || [],
        galleryImages: (profile.galleryImages as any) || [],
        partners: ((profile as any).partners as any) || [],
      } as ProfileForm);
    }
  }, [profile]);

  // Auto-sync PDF language with global app language (unless user overrides)
  const effectivePdfLang: "en" | "ar" = useMemo(() => {
    if (pdfLangMode !== "auto") return pdfLangMode;
    return isRTL ? "ar" : "en";
  }, [pdfLangMode, isRTL]);

  useEffect(() => {
    if (form.language !== effectivePdfLang) {
      setForm((p) => ({ ...p, language: effectivePdfLang }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePdfLang]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PUT", "/api/company-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profile"] });
      toast({ title: L.saved, description: L.savedDesc });
    },
    onError: (e: any) => toast({ title: L.saveFailed, description: e?.message || L.couldNotSave, variant: "destructive" }),
  });

  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      await saveMutation.mutateAsync({ ...form, language: effectivePdfLang });
      const res = await fetch("/api/company-profile/pdf", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(form.companyName || "company-profile").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-profile.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: L.pdfGenerated, description: L.pdfGeneratedDesc });
    } catch (e: any) {
      toast({ title: L.pdfFailed, description: e?.message || L.couldNotGenerate, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setForm((p) => ({ ...p, [k]: v }));
  const addItem = <K extends "coreValues" | "services" | "achievements" | "testimonials" | "galleryImages" | "partners">(k: K, item: any) =>
    setForm((p) => ({ ...p, [k]: [...((p[k] as any[]) || []), item] }));
  const removeItem = (k: any, idx: number) => setForm((p) => ({ ...p, [k]: ((p as any)[k] as any[]).filter((_, i) => i !== idx) }));
  const updateItem = (k: any, idx: number, field: string, val: any) =>
    setForm((p) => ({ ...p, [k]: ((p as any)[k] as any[]).map((it, i) => (i === idx ? { ...it, [field]: val } : it)) }));
  const moveItem = (k: any, idx: number, dir: -1 | 1) =>
    setForm((p) => {
      const arr = [...(((p as any)[k] as any[]) || [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...p, [k]: arr };
    });

  const applyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setForm((p) => ({ ...p, primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent }));
  };

  const tplLabel = (t: typeof TEMPLATES[number]) => isRTL ? t.ar : t.en;
  const tplDesc = (t: typeof TEMPLATES[number]) => isRTL ? t.descAr : t.descEn;
  const fontLabel = (f: typeof FONTS[number]) => isRTL ? f.ar : f.en;
  const hsLabel = (h: typeof HEADER_STYLES[number]) => isRTL ? h.ar : h.en;
  const activeFont = FONTS.find((f) => f.id === form.fontFamily) || FONTS[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"} key={`cp-${language}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FileText className="h-6 w-6 text-primary" />
            {L.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{L.pageSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} data-testid="button-save-profile">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saveMutation.isPending ? L.saving : L.save}
          </Button>
          <Button onClick={generatePdf} disabled={isGenerating} data-testid="button-generate-pdf">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isGenerating ? L.generating : L.generatePdf}
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="edit" data-testid="tab-edit"><Palette className="h-4 w-4 mr-2" />{L.edit}</TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview"><Eye className="h-4 w-4 mr-2" />{L.livePreview}</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: TEMPLATE & BRANDING */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4" /> {L.templateBranding}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="mb-2 block">{L.template}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => update("template", tpl.id as any)}
                        data-testid={`button-template-${tpl.id}`}
                        className={`p-3 rounded-md border text-start hover-elevate transition-colors ${form.template === tpl.id ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""}`}
                      >
                        <div className="font-semibold text-sm">{tplLabel(tpl)}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-snug">{tplDesc(tpl)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 flex items-center gap-2"><Type className="h-3.5 w-3.5" /> {L.fontFamily}</Label>
                  <Select value={form.fontFamily} onValueChange={(v) => update("fontFamily", v as any)}>
                    <SelectTrigger data-testid="select-font-family"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONTS.map((f) => (
                        <SelectItem key={f.id} value={f.id} data-testid={`option-font-${f.id}`}>
                          <span style={{ fontFamily: f.css }}>{fontLabel(f)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">{L.headerStyle}</Label>
                  <Select value={form.headerStyle} onValueChange={(v) => update("headerStyle", v as any)}>
                    <SelectTrigger data-testid="select-header-style"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HEADER_STYLES.map((h) => (
                        <SelectItem key={h.id} value={h.id} data-testid={`option-header-${h.id}`}>{hsLabel(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">{L.pdfLanguage}</Label>
                  <Select value={pdfLangMode} onValueChange={(v) => setPdfLangMode(v as any)}>
                    <SelectTrigger data-testid="select-pdf-language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{L.autoMatchApp}</SelectItem>
                      <SelectItem value="en">English (LTR)</SelectItem>
                      <SelectItem value="ar">العربية (RTL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="mb-2 block font-semibold">{L.brandColors}</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <ColorField label={L.primary} value={form.primaryColor} onChange={(v) => update("primaryColor", v)} testId="primary" />
                    <ColorField label={L.secondary} value={form.secondaryColor} onChange={(v) => update("secondaryColor", v)} testId="secondary" />
                    <ColorField label={L.accent} value={form.accentColor} onChange={(v) => update("accentColor", v)} testId="accent" />
                  </div>
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">{isRTL ? "إعدادات لونية مسبقة" : "Color Presets"}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((cp) => (
                        <button
                          key={cp.name}
                          type="button"
                          onClick={() => applyPreset(cp)}
                          className="rounded-md border p-1.5 hover-elevate active-elevate-2"
                          data-testid={`button-preset-${cp.name.toLowerCase()}`}
                          title={cp.name}
                        >
                          <div className="flex h-6 rounded overflow-hidden">
                            <div className="flex-1" style={{ background: cp.primary }} />
                            <div className="flex-1" style={{ background: cp.secondary }} />
                            <div className="flex-1" style={{ background: cp.accent }} />
                          </div>
                          <div className="text-[10px] text-center mt-1 truncate">{cp.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <ImageUploader value={form.logoDataUrl} onChange={(v) => update("logoDataUrl", v)} label={L.logo} testId="logo" />
                <ImageUploader value={form.coverDataUrl} onChange={(v) => update("coverDataUrl", v)} label={L.coverImage} height="h-40" testId="cover" />
              </CardContent>
            </Card>

            {/* RIGHT: CONTENT */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{L.companyInformation}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{L.companyNameEn}</Label>
                    <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} data-testid="input-company-name" />
                  </div>
                  <div>
                    <Label>{L.companyNameAr}</Label>
                    <Input value={form.companyNameAr || ""} onChange={(e) => update("companyNameAr", e.target.value)} dir="rtl" data-testid="input-company-name-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{L.taglineEn}</Label>
                    <Input value={form.tagline || ""} onChange={(e) => update("tagline", e.target.value)} data-testid="input-tagline" />
                  </div>
                  <div>
                    <Label>{L.taglineAr}</Label>
                    <Input value={form.taglineAr || ""} onChange={(e) => update("taglineAr", e.target.value)} dir="rtl" data-testid="input-tagline-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{L.aboutEn}</Label>
                    <Textarea rows={4} value={form.about || ""} onChange={(e) => update("about", e.target.value)} data-testid="input-about" />
                  </div>
                  <div>
                    <Label>{L.aboutAr}</Label>
                    <Textarea rows={4} value={form.aboutAr || ""} onChange={(e) => update("aboutAr", e.target.value)} dir="rtl" data-testid="input-about-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{L.visionEn}</Label>
                    <Textarea rows={3} value={form.vision || ""} onChange={(e) => update("vision", e.target.value)} data-testid="input-vision" />
                  </div>
                  <div>
                    <Label>{L.visionAr}</Label>
                    <Textarea rows={3} value={form.visionAr || ""} onChange={(e) => update("visionAr", e.target.value)} dir="rtl" data-testid="input-vision-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{L.missionEn}</Label>
                    <Textarea rows={3} value={form.mission || ""} onChange={(e) => update("mission", e.target.value)} data-testid="input-mission" />
                  </div>
                  <div>
                    <Label>{L.missionAr}</Label>
                    <Textarea rows={3} value={form.missionAr || ""} onChange={(e) => update("missionAr", e.target.value)} dir="rtl" data-testid="input-mission-ar" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CORE VALUES */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{L.coreValues}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("coreValues", { title: "", description: "" })} data-testid="button-add-value">
                  <Plus className="h-4 w-4 mr-1" /> {L.addValue}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.coreValues || []).length === 0 && <p className="text-sm text-muted-foreground">{L.noValues}</p>}
                {(form.coreValues || []).map((v, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start" data-testid={`row-value-${i}`}>
                    <Input value={v.title} placeholder={L.valueTitle} onChange={(e) => updateItem("coreValues", i, "title", e.target.value)} data-testid={`input-value-title-${i}`} />
                    <Textarea rows={2} value={v.description} placeholder={L.valueDesc} onChange={(e) => updateItem("coreValues", i, "description", e.target.value)} data-testid={`input-value-desc-${i}`} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={L.remove} onClick={() => removeItem("coreValues", i)} data-testid={`button-remove-value-${i}`}><Trash2 className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>{L.remove}</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SERVICES */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{L.servicesAndProducts}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("services", { title: "", description: "", imageDataUrl: "" })} data-testid="button-add-service">
                  <Plus className="h-4 w-4 mr-1" /> {L.addService}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(form.services || []).length === 0 && <p className="text-sm text-muted-foreground">{L.noServices}</p>}
                {(form.services || []).map((s, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 p-3 border rounded-md items-start" data-testid={`row-service-${i}`}>
                    <ImageUploader value={s.imageDataUrl} onChange={(v) => updateItem("services", i, "imageDataUrl", v)} label={L.image} height="h-28" testId={`service-${i}`} />
                    <div className="space-y-2">
                      <Input value={s.title} placeholder={L.serviceTitle} onChange={(e) => updateItem("services", i, "title", e.target.value)} data-testid={`input-service-title-${i}`} />
                      <Textarea rows={3} value={s.description} placeholder={L.serviceDesc} onChange={(e) => updateItem("services", i, "description", e.target.value)} data-testid={`input-service-desc-${i}`} />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={L.remove} onClick={() => removeItem("services", i)} data-testid={`button-remove-service-${i}`}><Trash2 className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>{L.remove}</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ACHIEVEMENTS */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{L.keyAchievements}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("achievements", { value: "", label: "" })} data-testid="button-add-achievement">
                  <Plus className="h-4 w-4 mr-1" /> {L.addStat}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.achievements || []).length === 0 && <p className="text-sm text-muted-foreground">{L.noAchievements}</p>}
                {(form.achievements || []).map((a, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-center" data-testid={`row-achievement-${i}`}>
                    <Input value={a.value} placeholder={L.statValue} onChange={(e) => updateItem("achievements", i, "value", e.target.value)} data-testid={`input-achievement-value-${i}`} />
                    <Input value={a.label} placeholder={L.statLabel} onChange={(e) => updateItem("achievements", i, "label", e.target.value)} data-testid={`input-achievement-label-${i}`} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={L.remove} onClick={() => removeItem("achievements", i)} data-testid={`button-remove-achievement-${i}`}><Trash2 className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>{L.remove}</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TESTIMONIALS */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{L.testimonials}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("testimonials", { name: "", role: "", quote: "", imageDataUrl: "" })} data-testid="button-add-testimonial">
                  <Plus className="h-4 w-4 mr-1" /> {L.addTestimonial}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(form.testimonials || []).length === 0 && <p className="text-sm text-muted-foreground">{L.noTestimonials}</p>}
                {(form.testimonials || []).map((tm, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-3 p-3 border rounded-md items-start" data-testid={`row-testimonial-${i}`}>
                    <ImageUploader value={tm.imageDataUrl} onChange={(v) => updateItem("testimonials", i, "imageDataUrl", v)} label={L.photo} height="h-24" testId={`testimonial-${i}`} />
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={tm.name} placeholder={L.quoteFrom} onChange={(e) => updateItem("testimonials", i, "name", e.target.value)} data-testid={`input-testimonial-name-${i}`} />
                        <Input value={tm.role} placeholder={L.role} onChange={(e) => updateItem("testimonials", i, "role", e.target.value)} data-testid={`input-testimonial-role-${i}`} />
                      </div>
                      <Textarea rows={3} value={tm.quote} placeholder={L.quote} onChange={(e) => updateItem("testimonials", i, "quote", e.target.value)} data-testid={`input-testimonial-quote-${i}`} />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={L.remove} onClick={() => removeItem("testimonials", i)} data-testid={`button-remove-testimonial-${i}`}><Trash2 className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>{L.remove}</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* GALLERY */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{L.gallery}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("galleryImages", { caption: "", imageDataUrl: "" })} data-testid="button-add-gallery">
                  <Plus className="h-4 w-4 mr-1" /> {L.addImage}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.galleryImages || []).length === 0 && <p className="text-sm text-muted-foreground">{L.noGallery}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(form.galleryImages || []).map((g, i) => (
                    <div key={i} className="border rounded-md p-3 space-y-2" data-testid={`row-gallery-${i}`}>
                      <ImageUploader value={g.imageDataUrl} onChange={(v) => updateItem("galleryImages", i, "imageDataUrl", v)} label={`${L.image} ${i + 1}`} height="h-32" testId={`gallery-${i}`} />
                      <Input value={g.caption || ""} placeholder={L.caption} onChange={(e) => updateItem("galleryImages", i, "caption", e.target.value)} data-testid={`input-gallery-caption-${i}`} />
                      <Button size="sm" variant="ghost" onClick={() => removeItem("galleryImages", i)} className="w-full" data-testid={`button-remove-gallery-${i}`}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> {L.remove}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* OUR CLIENTS / PARTNERS */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{t.ourClients || L.ourClients}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("partners", { name: "", logoDataUrl: "", website: "" })} data-testid="button-add-partner">
                  <Plus className="h-4 w-4 mr-1" /> {t.addPartner || L.addPartner}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.partners || []).length === 0 && <p className="text-sm text-muted-foreground">{t.noPartners || L.noPartners}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(form.partners || []).map((pt, i) => (
                    <div key={i} className="border rounded-md p-3 space-y-2" data-testid={`row-partner-${i}`}>
                      <ImageUploader value={pt.logoDataUrl} onChange={(v) => updateItem("partners", i, "logoDataUrl", v)} label={t.partnerLogo || L.partnerLogo} height="h-28" testId={`partner-${i}`} maxSizeMB={1} />
                      <Input value={pt.name} placeholder={t.partnerName || L.partnerName} onChange={(e) => updateItem("partners", i, "name", e.target.value)} data-testid={`input-partner-name-${i}`} />
                      <Input value={pt.website || ""} placeholder={t.partnerWebsite || L.partnerWebsite} onChange={(e) => updateItem("partners", i, "website", e.target.value)} data-testid={`input-partner-website-${i}`} />
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => moveItem("partners", i, -1)} disabled={i === 0} data-testid={`button-partner-up-${i}`}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move up</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => moveItem("partners", i, 1)} disabled={i === (form.partners || []).length - 1} data-testid={`button-partner-down-${i}`}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move down</TooltipContent>
                        </Tooltip>
                        <Button size="sm" variant="ghost" onClick={() => removeItem("partners", i)} className="flex-1" data-testid={`button-remove-partner-${i}`}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> {L.remove}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CONTACT */}
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle className="text-base">{L.contactInformation}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>{L.email}</Label><Input type="email" value={form.contactEmail || ""} onChange={(e) => update("contactEmail", e.target.value)} data-testid="input-contact-email" /></div>
                <div><Label>{L.phone}</Label><Input value={form.contactPhone || ""} onChange={(e) => update("contactPhone", e.target.value)} data-testid="input-contact-phone" /></div>
                <div><Label>{L.website}</Label><Input value={form.contactWebsite || ""} onChange={(e) => update("contactWebsite", e.target.value)} placeholder="https://" data-testid="input-contact-website" /></div>
                <div className="md:row-span-2"><Label>{L.address}</Label><Textarea rows={3} value={form.contactAddress || ""} onChange={(e) => update("contactAddress", e.target.value)} data-testid="input-contact-address" /></div>
                <div><Label>{L.linkedin}</Label><Input value={form.socialLinkedin || ""} onChange={(e) => update("socialLinkedin", e.target.value)} data-testid="input-linkedin" /></div>
                <div><Label>{L.instagram}</Label><Input value={form.socialInstagram || ""} onChange={(e) => update("socialInstagram", e.target.value)} data-testid="input-instagram" /></div>
                <div><Label>{L.twitter}</Label><Input value={form.socialTwitter || ""} onChange={(e) => update("socialTwitter", e.target.value)} data-testid="input-twitter" /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">{L.livePreview}</CardTitle>
                  <CardDescription>{L.livePreviewDesc}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{tplLabel(TEMPLATES.find(x => x.id === form.template) || TEMPLATES[0])}</Badge>
                  <Badge variant="outline" style={{ fontFamily: activeFont.css }}>{fontLabel(activeFont)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProfilePreview form={form} fontCss={activeFont.css} L={L} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============== LIVE PREVIEW COMPONENT ==============
function ProfilePreview({ form, fontCss, L }: { form: ProfileForm; fontCss: string; L: typeof LABELS.en }) {
  const isAr = form.language === "ar";
  const name = (isAr && form.companyNameAr) ? form.companyNameAr : (form.companyName || (isAr ? "اسم شركتك" : "Your Company Name"));
  const tagline = (isAr ? form.taglineAr : form.tagline) || form.tagline;
  const about = (isAr ? form.aboutAr : form.about) || form.about;
  const vision = (isAr ? form.visionAr : form.vision) || form.vision;
  const mission = (isAr ? form.missionAr : form.mission) || form.mission;

  const placeholderImg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='#e0e7ff'/><circle cx='180' cy='160' r='60' fill='#a5b4fc' opacity='0.6'/></svg>`
  )}`;

  // Header background based on header style
  const headerBg = (() => {
    if (form.template === "minimal" || form.headerStyle === "minimal") return "white";
    if (form.headerStyle === "solid") return form.primaryColor;
    if (form.headerStyle === "split") return `linear-gradient(90deg, ${form.primaryColor} 0%, ${form.primaryColor} 50%, ${form.secondaryColor} 50%, ${form.secondaryColor} 100%)`;
    if (form.headerStyle === "image" && form.coverDataUrl) return `linear-gradient(135deg, ${form.primaryColor}cc, ${form.secondaryColor}cc), url(${form.coverDataUrl}) center/cover`;
    if (form.template === "creative" || form.template === "tech") return `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`;
    return `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`;
  })();

  const headerTextColor = (form.template === "minimal" || form.headerStyle === "minimal") ? form.secondaryColor : "white";

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="space-y-6 max-w-[820px] mx-auto bg-white text-slate-900" style={{ fontFamily: fontCss }}>
      {/* Cover */}
      <div
        className="rounded-lg p-10 relative overflow-hidden shadow-md"
        style={{ background: headerBg, color: headerTextColor, minHeight: "260px" }}
      >
        {form.logoDataUrl && (
          <img src={form.logoDataUrl} alt="logo" className="h-14 mb-4 bg-white/90 rounded p-1 object-contain" />
        )}
        <div className="mt-6">
          <div className="text-xs tracking-widest opacity-80 mb-3">{isAr ? "ملف الشركة" : "COMPANY PROFILE"}</div>
          <h1 className={`font-extrabold leading-tight ${form.template === "bold" ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"}`}>{name}</h1>
          {tagline && <p className="mt-4 text-lg opacity-90 max-w-xl">{tagline}</p>}
        </div>
      </div>

      {/* About */}
      {(about || vision || mission) && (
        <div className="border rounded-lg p-6 space-y-4">
          {about && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: form.secondaryColor }}>{isAr ? "نبذة عنّا" : "About Us"}</h2>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{about}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vision && (
              <div className="p-4 rounded-md" style={{ background: `${form.primaryColor}15`, borderInlineStart: `4px solid ${form.primaryColor}` }}>
                <h3 className="font-bold mb-2" style={{ color: form.primaryColor }}>{isAr ? "رؤيتنا" : "Our Vision"}</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{vision}</p>
              </div>
            )}
            {mission && (
              <div className="p-4 rounded-md" style={{ background: `${form.accentColor}15`, borderInlineStart: `4px solid ${form.accentColor}` }}>
                <h3 className="font-bold mb-2" style={{ color: form.accentColor }}>{isAr ? "رسالتنا" : "Our Mission"}</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{mission}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Values */}
      {(form.coreValues || []).length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "قيمنا" : "Our Values"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(form.coreValues || []).map((v, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-md">
                <h4 className="font-bold mb-1" style={{ color: form.primaryColor }}>{v.title || `${L.coreValues} ${i + 1}`}</h4>
                <p className="text-sm text-slate-600">{v.description || L.valueDesc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {(form.services || []).length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "خدماتنا" : "Services & Products"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(form.services || []).map((s, i) => (
              <div key={i} className="border rounded-md overflow-hidden">
                <img src={s.imageDataUrl || placeholderImg} alt="" className="w-full h-36 object-cover" />
                <div className="p-3">
                  <h4 className="font-bold" style={{ color: form.secondaryColor }}>{s.title || `${L.serviceTitle} ${i + 1}`}</h4>
                  <p className="text-sm text-slate-600 mt-1">{s.description || L.serviceDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {(form.achievements || []).length > 0 && (
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${form.primaryColor}10, ${form.accentColor}10)` }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "إنجازاتنا" : "Key Achievements"}</h2>
          <div className={`grid gap-4 ${(form.achievements || []).length >= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}>
            {(form.achievements || []).map((a, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-extrabold" style={{ color: form.primaryColor }}>{a.value || "0+"}</div>
                <div className="text-sm text-slate-600 mt-1">{a.label || L.statLabel}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {(form.testimonials || []).length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "آراء العملاء" : "Testimonials"}</h2>
          <div className="space-y-3">
            {(form.testimonials || []).map((tm, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-md">
                <p className="italic text-slate-700">"{tm.quote || L.quote}"</p>
                <div className="mt-3 flex items-center gap-3">
                  {tm.imageDataUrl && <img src={tm.imageDataUrl} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div>
                    <div className="font-bold" style={{ color: form.secondaryColor }}>{tm.name || L.quoteFrom}</div>
                    <div className="text-xs text-slate-500">{tm.role || L.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Our Clients / Partners */}
      {(form.partners || []).length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "عملاؤنا" : (L.ourClients || "Our Clients")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(form.partners || []).map((pt, i) => (
              <div key={i} className="border rounded-md p-3 text-center bg-white" data-testid={`preview-partner-${i}`}>
                <div className="h-20 flex items-center justify-center bg-slate-50 rounded mb-2 overflow-hidden">
                  <img src={pt.logoDataUrl || placeholderImg} alt={pt.name} className="max-h-16 max-w-full object-contain" />
                </div>
                <div className="text-sm font-bold" style={{ color: form.secondaryColor }}>{pt.name || L.partnerName}</div>
                {pt.website && <div className="text-xs mt-1 break-all" style={{ color: form.primaryColor }}>{pt.website}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {(form.galleryImages || []).length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: form.secondaryColor }}>{isAr ? "معرض الصور" : "Gallery"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(form.galleryImages || []).map((g, i) => (
              <div key={i}>
                <img src={g.imageDataUrl} alt="" className="w-full h-40 object-cover rounded-md" />
                {g.caption && <div className="text-xs text-slate-500 mt-1 text-center">{g.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      {(form.contactEmail || form.contactPhone || form.contactAddress) && (
        <div className="rounded-lg p-6 text-white" style={{ background: `linear-gradient(135deg, ${form.secondaryColor}, ${form.primaryColor})` }}>
          <h2 className="text-xl font-bold mb-4">{isAr ? "تواصل معنا" : "Contact Us"}</h2>
          <div className="space-y-1 text-sm opacity-95">
            {form.contactEmail && <div><strong className="opacity-70">{L.email}:</strong> {form.contactEmail}</div>}
            {form.contactPhone && <div><strong className="opacity-70">{L.phone}:</strong> {form.contactPhone}</div>}
            {form.contactWebsite && <div><strong className="opacity-70">{L.website}:</strong> {form.contactWebsite}</div>}
            {form.contactAddress && <div className="whitespace-pre-line"><strong className="opacity-70">{L.address}:</strong> {form.contactAddress}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
