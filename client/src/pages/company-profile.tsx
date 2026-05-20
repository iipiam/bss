import { useState, useEffect, useRef } from "react";
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
import { Plus, Trash2, Download, Upload, Image as ImageIcon, Save, Loader2, Palette, Eye, FileText } from "lucide-react";
import type { CompanyProfile, InsertCompanyProfile } from "@shared/schema";

type ProfileForm = Omit<InsertCompanyProfile, "restaurantId">;

const TEMPLATES = [
  { id: "modern", label: "Modern", desc: "Bold colors, gradient cover, card-based layout" },
  { id: "corporate", label: "Corporate", desc: "Classic serif headlines, formal structure" },
  { id: "creative", label: "Creative", desc: "Playful gradients, organic shapes, vibrant" },
  { id: "minimal", label: "Minimal", desc: "Clean typography, lots of whitespace" },
] as const;

const DEFAULT: ProfileForm = {
  template: "modern",
  primaryColor: "#2563eb",
  secondaryColor: "#0f172a",
  accentColor: "#f59e0b",
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

function ImageUploader({ value, onChange, label, height = "h-32", testId }: { value?: string | null; onChange: (v: string) => void; label: string; height?: string; testId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className={`relative ${height} border-2 border-dashed rounded-md overflow-hidden bg-muted/30 flex items-center justify-center`}>
        {value ? (
          <>
            <img src={value} className="w-full h-full object-contain" alt="upload" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => onChange("")}
              data-testid={`button-remove-${testId}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={() => ref.current?.click()} data-testid={`button-upload-${testId}`}>
            <Upload className="h-4 w-4 mr-2" /> Upload
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
              if (f.size > 4 * 1024 * 1024) {
                alert("Image must be under 4MB");
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
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(DEFAULT);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: profile, isLoading } = useQuery<CompanyProfile | null>({
    queryKey: ["/api/company-profile"],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        ...DEFAULT,
        ...profile,
        coreValues: (profile.coreValues as any) || [],
        services: (profile.services as any) || [],
        achievements: (profile.achievements as any) || [],
        testimonials: (profile.testimonials as any) || [],
        galleryImages: (profile.galleryImages as any) || [],
      } as ProfileForm);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PUT", "/api/company-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profile"] });
      toast({ title: "Saved", description: "Company profile saved successfully." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message || "Could not save", variant: "destructive" }),
  });

  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      await saveMutation.mutateAsync(form);
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
      toast({ title: "PDF generated", description: "Your company profile PDF has been downloaded." });
    } catch (e: any) {
      toast({ title: "PDF failed", description: e?.message || "Could not generate PDF", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setForm((p) => ({ ...p, [k]: v }));

  const addItem = <K extends "coreValues" | "services" | "achievements" | "testimonials" | "galleryImages">(k: K, item: any) =>
    setForm((p) => ({ ...p, [k]: [...((p[k] as any[]) || []), item] }));
  const removeItem = (k: any, idx: number) => setForm((p) => ({ ...p, [k]: ((p as any)[k] as any[]).filter((_, i) => i !== idx) }));
  const updateItem = (k: any, idx: number, field: string, val: any) =>
    setForm((p) => ({ ...p, [k]: ((p as any)[k] as any[]).map((it, i) => (i === idx ? { ...it, [field]: val } : it)) }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FileText className="h-6 w-6 text-primary" />
            {(t as any).companyProfile || "Company Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">Build a marketing-ready company profile and export it as a professional PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} data-testid="button-save-profile">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button onClick={generatePdf} disabled={isGenerating} data-testid="button-generate-pdf">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="edit" data-testid="tab-edit"><Palette className="h-4 w-4 mr-2" />Edit</TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview"><Eye className="h-4 w-4 mr-2" />Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: STYLE & SETTINGS */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Template & Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Template</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => update("template", tpl.id as any)}
                        data-testid={`button-template-${tpl.id}`}
                        className={`p-3 rounded-md border text-left hover-elevate ${form.template === tpl.id ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""}`}
                      >
                        <div className="font-semibold text-sm">{tpl.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{tpl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">PDF Language</Label>
                  <Select value={form.language} onValueChange={(v) => update("language", v as any)}>
                    <SelectTrigger data-testid="select-pdf-language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (LTR)</SelectItem>
                      <SelectItem value="ar">العربية (RTL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="mb-2 block font-semibold">Brand Colors</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <ColorField label="Primary" value={form.primaryColor} onChange={(v) => update("primaryColor", v)} testId="primary" />
                    <ColorField label="Secondary (Dark)" value={form.secondaryColor} onChange={(v) => update("secondaryColor", v)} testId="secondary" />
                    <ColorField label="Accent" value={form.accentColor} onChange={(v) => update("accentColor", v)} testId="accent" />
                  </div>
                </div>

                <Separator />

                <ImageUploader value={form.logoDataUrl} onChange={(v) => update("logoDataUrl", v)} label="Logo" testId="logo" />
              </CardContent>
            </Card>

            {/* RIGHT: CONTENT */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Company Name (English)</Label>
                    <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} data-testid="input-company-name" />
                  </div>
                  <div>
                    <Label>Company Name (Arabic)</Label>
                    <Input value={form.companyNameAr || ""} onChange={(e) => update("companyNameAr", e.target.value)} dir="rtl" data-testid="input-company-name-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Tagline (English)</Label>
                    <Input value={form.tagline || ""} onChange={(e) => update("tagline", e.target.value)} data-testid="input-tagline" />
                  </div>
                  <div>
                    <Label>Tagline (Arabic)</Label>
                    <Input value={form.taglineAr || ""} onChange={(e) => update("taglineAr", e.target.value)} dir="rtl" data-testid="input-tagline-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>About (English)</Label>
                    <Textarea rows={4} value={form.about || ""} onChange={(e) => update("about", e.target.value)} data-testid="input-about" />
                  </div>
                  <div>
                    <Label>About (Arabic)</Label>
                    <Textarea rows={4} value={form.aboutAr || ""} onChange={(e) => update("aboutAr", e.target.value)} dir="rtl" data-testid="input-about-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Vision (English)</Label>
                    <Textarea rows={3} value={form.vision || ""} onChange={(e) => update("vision", e.target.value)} data-testid="input-vision" />
                  </div>
                  <div>
                    <Label>Vision (Arabic)</Label>
                    <Textarea rows={3} value={form.visionAr || ""} onChange={(e) => update("visionAr", e.target.value)} dir="rtl" data-testid="input-vision-ar" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Mission (English)</Label>
                    <Textarea rows={3} value={form.mission || ""} onChange={(e) => update("mission", e.target.value)} data-testid="input-mission" />
                  </div>
                  <div>
                    <Label>Mission (Arabic)</Label>
                    <Textarea rows={3} value={form.missionAr || ""} onChange={(e) => update("missionAr", e.target.value)} dir="rtl" data-testid="input-mission-ar" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CORE VALUES */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Core Values</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("coreValues", { title: "", description: "" })} data-testid="button-add-value">
                  <Plus className="h-4 w-4 mr-1" /> Add Value
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.coreValues || []).length === 0 && <p className="text-sm text-muted-foreground">No core values yet. Click "Add Value" to begin.</p>}
                {(form.coreValues || []).map((v, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start" data-testid={`row-value-${i}`}>
                    <Input value={v.title} placeholder="Title (e.g., Integrity)" onChange={(e) => updateItem("coreValues", i, "title", e.target.value)} data-testid={`input-value-title-${i}`} />
                    <Textarea rows={2} value={v.description} placeholder="Description" onChange={(e) => updateItem("coreValues", i, "description", e.target.value)} data-testid={`input-value-desc-${i}`} />
                    <Button size="icon" variant="ghost" onClick={() => removeItem("coreValues", i)} data-testid={`button-remove-value-${i}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SERVICES */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Services & Products</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("services", { title: "", description: "", imageDataUrl: "" })} data-testid="button-add-service">
                  <Plus className="h-4 w-4 mr-1" /> Add Service
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(form.services || []).length === 0 && <p className="text-sm text-muted-foreground">No services yet.</p>}
                {(form.services || []).map((s, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 p-3 border rounded-md items-start" data-testid={`row-service-${i}`}>
                    <ImageUploader value={s.imageDataUrl} onChange={(v) => updateItem("services", i, "imageDataUrl", v)} label="Image" height="h-28" testId={`service-${i}`} />
                    <div className="space-y-2">
                      <Input value={s.title} placeholder="Service title" onChange={(e) => updateItem("services", i, "title", e.target.value)} data-testid={`input-service-title-${i}`} />
                      <Textarea rows={3} value={s.description} placeholder="Description" onChange={(e) => updateItem("services", i, "description", e.target.value)} data-testid={`input-service-desc-${i}`} />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem("services", i)} data-testid={`button-remove-service-${i}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ACHIEVEMENTS */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Key Achievements & Statistics</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("achievements", { value: "", label: "" })} data-testid="button-add-achievement">
                  <Plus className="h-4 w-4 mr-1" /> Add Stat
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.achievements || []).length === 0 && <p className="text-sm text-muted-foreground">No achievements yet. Example: "500+" / "Happy Clients".</p>}
                {(form.achievements || []).map((a, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-center" data-testid={`row-achievement-${i}`}>
                    <Input value={a.value} placeholder="Value (e.g., 500+)" onChange={(e) => updateItem("achievements", i, "value", e.target.value)} data-testid={`input-achievement-value-${i}`} />
                    <Input value={a.label} placeholder="Label (e.g., Happy Clients)" onChange={(e) => updateItem("achievements", i, "label", e.target.value)} data-testid={`input-achievement-label-${i}`} />
                    <Button size="icon" variant="ghost" onClick={() => removeItem("achievements", i)} data-testid={`button-remove-achievement-${i}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TESTIMONIALS */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Testimonials</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("testimonials", { name: "", role: "", quote: "", imageDataUrl: "" })} data-testid="button-add-testimonial">
                  <Plus className="h-4 w-4 mr-1" /> Add Testimonial
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(form.testimonials || []).length === 0 && <p className="text-sm text-muted-foreground">No testimonials yet.</p>}
                {(form.testimonials || []).map((tm, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-3 p-3 border rounded-md items-start" data-testid={`row-testimonial-${i}`}>
                    <ImageUploader value={tm.imageDataUrl} onChange={(v) => updateItem("testimonials", i, "imageDataUrl", v)} label="Photo" height="h-24" testId={`testimonial-${i}`} />
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={tm.name} placeholder="Name" onChange={(e) => updateItem("testimonials", i, "name", e.target.value)} data-testid={`input-testimonial-name-${i}`} />
                        <Input value={tm.role} placeholder="Role / Company" onChange={(e) => updateItem("testimonials", i, "role", e.target.value)} data-testid={`input-testimonial-role-${i}`} />
                      </div>
                      <Textarea rows={3} value={tm.quote} placeholder="Quote" onChange={(e) => updateItem("testimonials", i, "quote", e.target.value)} data-testid={`input-testimonial-quote-${i}`} />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem("testimonials", i)} data-testid={`button-remove-testimonial-${i}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* GALLERY */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Gallery (Optional)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => addItem("galleryImages", { caption: "", imageDataUrl: "" })} data-testid="button-add-gallery">
                  <Plus className="h-4 w-4 mr-1" /> Add Image
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {(form.galleryImages || []).length === 0 && <p className="text-sm text-muted-foreground">No gallery images yet.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(form.galleryImages || []).map((g, i) => (
                    <div key={i} className="border rounded-md p-3 space-y-2" data-testid={`row-gallery-${i}`}>
                      <ImageUploader value={g.imageDataUrl} onChange={(v) => updateItem("galleryImages", i, "imageDataUrl", v)} label={`Image ${i + 1}`} height="h-32" testId={`gallery-${i}`} />
                      <Input value={g.caption || ""} placeholder="Caption (optional)" onChange={(e) => updateItem("galleryImages", i, "caption", e.target.value)} data-testid={`input-gallery-caption-${i}`} />
                      <Button size="sm" variant="ghost" onClick={() => removeItem("galleryImages", i)} className="w-full" data-testid={`button-remove-gallery-${i}`}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CONTACT */}
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.contactEmail || ""} onChange={(e) => update("contactEmail", e.target.value)} data-testid="input-contact-email" /></div>
                <div><Label>Phone</Label><Input value={form.contactPhone || ""} onChange={(e) => update("contactPhone", e.target.value)} data-testid="input-contact-phone" /></div>
                <div><Label>Website</Label><Input value={form.contactWebsite || ""} onChange={(e) => update("contactWebsite", e.target.value)} placeholder="https://" data-testid="input-contact-website" /></div>
                <div className="md:row-span-2"><Label>Address</Label><Textarea rows={3} value={form.contactAddress || ""} onChange={(e) => update("contactAddress", e.target.value)} data-testid="input-contact-address" /></div>
                <div><Label>LinkedIn</Label><Input value={form.socialLinkedin || ""} onChange={(e) => update("socialLinkedin", e.target.value)} data-testid="input-linkedin" /></div>
                <div><Label>Instagram</Label><Input value={form.socialInstagram || ""} onChange={(e) => update("socialInstagram", e.target.value)} data-testid="input-instagram" /></div>
                <div><Label>Twitter / X</Label><Input value={form.socialTwitter || ""} onChange={(e) => update("socialTwitter", e.target.value)} data-testid="input-twitter" /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">Live Preview</CardTitle>
                  <CardDescription>Approximate preview of your PDF — generate to see exact output.</CardDescription>
                </div>
                <Badge variant="secondary">{TEMPLATES.find(x => x.id === form.template)?.label || "Modern"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ProfilePreview form={form} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============== LIVE PREVIEW COMPONENT ==============
function ProfilePreview({ form }: { form: ProfileForm }) {
  const isAr = form.language === "ar";
  const name = (isAr && form.companyNameAr) ? form.companyNameAr : (form.companyName || "Your Company Name");
  const tagline = (isAr ? form.taglineAr : form.tagline) || form.tagline;
  const about = (isAr ? form.aboutAr : form.about) || form.about;
  const vision = (isAr ? form.visionAr : form.vision) || form.vision;
  const mission = (isAr ? form.missionAr : form.mission) || form.mission;

  const placeholderImg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='#e0e7ff'/><circle cx='180' cy='160' r='60' fill='#a5b4fc' opacity='0.6'/></svg>`
  )}`;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="space-y-6 max-w-[820px] mx-auto bg-white text-slate-900">
      {/* Cover */}
      <div
        className="rounded-lg p-10 text-white relative overflow-hidden shadow-md"
        style={{
          background: form.template === "minimal"
            ? "white"
            : form.template === "creative"
              ? `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`
              : `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
          color: form.template === "minimal" ? form.secondaryColor : "white",
          minHeight: "260px",
        }}
      >
        {form.logoDataUrl && (
          <img src={form.logoDataUrl} alt="logo" className="h-14 mb-4 bg-white/90 rounded p-1 object-contain" />
        )}
        <div className="mt-6">
          <div className="text-xs tracking-widest opacity-80 mb-3">COMPANY PROFILE</div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{name}</h1>
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
              <div className="p-4 rounded-md" style={{ background: `${form.primaryColor}15`, borderLeft: `4px solid ${form.primaryColor}` }}>
                <h3 className="font-bold mb-2" style={{ color: form.primaryColor }}>{isAr ? "رؤيتنا" : "Our Vision"}</h3>
                <p className="text-sm text-slate-700 whitespace-pre-line">{vision}</p>
              </div>
            )}
            {mission && (
              <div className="p-4 rounded-md" style={{ background: `${form.accentColor}15`, borderLeft: `4px solid ${form.accentColor}` }}>
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
                <h4 className="font-bold mb-1" style={{ color: form.primaryColor }}>{v.title || `Value ${i + 1}`}</h4>
                <p className="text-sm text-slate-600">{v.description || "Description..."}</p>
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
                  <h4 className="font-bold" style={{ color: form.secondaryColor }}>{s.title || `Service ${i + 1}`}</h4>
                  <p className="text-sm text-slate-600 mt-1">{s.description || "Description..."}</p>
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
                <div className="text-sm text-slate-600 mt-1">{a.label || "Label"}</div>
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
                <p className="italic text-slate-700">"{tm.quote || "Quote..."}"</p>
                <div className="mt-3 flex items-center gap-3">
                  {tm.imageDataUrl && <img src={tm.imageDataUrl} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div>
                    <div className="font-bold" style={{ color: form.secondaryColor }}>{tm.name || "Name"}</div>
                    <div className="text-xs text-slate-500">{tm.role || "Role"}</div>
                  </div>
                </div>
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
            {form.contactEmail && <div><strong className="opacity-70">Email:</strong> {form.contactEmail}</div>}
            {form.contactPhone && <div><strong className="opacity-70">Phone:</strong> {form.contactPhone}</div>}
            {form.contactWebsite && <div><strong className="opacity-70">Web:</strong> {form.contactWebsite}</div>}
            {form.contactAddress && <div className="whitespace-pre-line"><strong className="opacity-70">Address:</strong> {form.contactAddress}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
