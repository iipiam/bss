import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Megaphone,
  Target,
  TrendingUp,
  Users,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Info,
  FileText,
  BarChart3,
  DollarSign,
  Calculator,
  Lightbulb,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getMarketingT } from "@/i18n/marketingTranslations";

const LS_KEY = "bss_marketing_toolkit_v1";

type FinProduct = {
  id: string;
  name: string;
  sellingPrice: number;
  variableCost: number;
  fixedCosts: number;
  initialCapital: number;
  monthlyUnits: number;
  growthRate: number;
};

type SwotState = { strengths: string; weaknesses: string; opportunities: string; threats: string };

type CanvasState = {
  customerSegments: string;
  valuePropositions: string;
  channels: string;
  customerRelationships: string;
  revenueStreams: string;
  keyResources: string;
  keyActivities: string;
  keyPartnerships: string;
  costStructure: string;
};

type Influencer = {
  id: string;
  name: string;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

type BloggerFile = {
  id: string;
  createdAt: string;
  name: string;
  handle: string;
  niche: string;
  platform: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  notes: string;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

const newProduct = (): FinProduct => ({
  id: crypto.randomUUID(),
  name: "Product 1",
  sellingPrice: 100,
  variableCost: 40,
  fixedCosts: 5000,
  initialCapital: 20000,
  monthlyUnits: 100,
  growthRate: 5,
});

const exampleProduct = (): FinProduct => ({
  id: crypto.randomUUID(),
  name: "Signature Burger",
  sellingPrice: 45,
  variableCost: 18,
  fixedCosts: 12000,
  initialCapital: 50000,
  monthlyUnits: 800,
  growthRate: 6,
});

const newInfluencer = (): Influencer => ({
  id: crypto.randomUUID(),
  name: "",
  followers: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
});

const emptyBlogger = (): Omit<BloggerFile, "id" | "createdAt"> => ({
  name: "",
  handle: "",
  niche: "Food",
  platform: "Instagram",
  contactEmail: "",
  contactPhone: "",
  city: "",
  notes: "",
  followers: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
});

function computeFin(p: FinProduct) {
  const grossMarginPct =
    p.sellingPrice > 0 ? ((p.sellingPrice - p.variableCost) / p.sellingPrice) * 100 : 0;
  const contributionMargin = p.sellingPrice - p.variableCost;
  const breakEvenUnits = contributionMargin > 0 ? p.fixedCosts / contributionMargin : 0;
  const breakEvenRevenue = breakEvenUnits * p.sellingPrice;
  const monthlyRevenue = p.sellingPrice * p.monthlyUnits;
  const monthlyVarCost = p.variableCost * p.monthlyUnits;
  const monthlyProfit = monthlyRevenue - monthlyVarCost - p.fixedCosts;
  const yearlyProfit = monthlyProfit * 12;
  const paybackMonths = monthlyProfit > 0 ? p.initialCapital / monthlyProfit : Infinity;
  const roiPct = p.initialCapital > 0 ? (yearlyProfit / p.initialCapital) * 100 : 0;

  const months = 24;
  let cumulative = -p.initialCapital;
  let units = p.monthlyUnits;
  const chart: { month: string; cumulative: number; monthly: number }[] = [];
  for (let i = 1; i <= months; i++) {
    const rev = units * p.sellingPrice;
    const vc = units * p.variableCost;
    const profit = rev - vc - p.fixedCosts;
    cumulative += profit;
    chart.push({
      month: `M${i}`,
      cumulative: Math.round(cumulative),
      monthly: Math.round(profit),
    });
    units = units * (1 + p.growthRate / 100);
  }
  return {
    grossMarginPct,
    breakEvenUnits,
    breakEvenRevenue,
    monthlyProfit,
    yearlyProfit,
    paybackMonths,
    roiPct,
    chart,
  };
}

function fmt(n: number, digits = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function erRating(er: number, labels?: { excellent: string; good: string; low: string }) {
  const L = labels ?? { excellent: "Excellent", good: "Good", low: "Low" };
  if (er >= 5) return { label: L.excellent, color: "bg-green-500", text: "text-green-600" };
  if (er >= 3) return { label: L.good, color: "bg-yellow-500", text: "text-yellow-600" };
  return { label: L.low, color: "bg-red-500", text: "text-red-600" };
}

function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground inline-block ms-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function Marketing() {
  const { language, isRTL } = useLanguage();
  const t = getMarketingT(language);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gtm");
  const reportRef = useRef<HTMLDivElement>(null);

  // ---- Persisted state ----
  const [products, setProducts] = useState<FinProduct[]>([newProduct()]);
  const [swot, setSwot] = useState<SwotState>({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
  });
  const [canvas, setCanvas] = useState<CanvasState>({
    customerSegments: "",
    valuePropositions: "",
    channels: "",
    customerRelationships: "",
    revenueStreams: "",
    keyResources: "",
    keyActivities: "",
    keyPartnerships: "",
    costStructure: "",
  });
  const [influencers, setInfluencers] = useState<Influencer[]>([newInfluencer()]);
  const [single, setSingle] = useState<Influencer>(newInfluencer());
  const [bloggerFiles, setBloggerFiles] = useState<BloggerFile[]>([]);
  const [bloggerForm, setBloggerForm] = useState(emptyBlogger());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.products) && s.products.length) setProducts(s.products);
        if (s.swot) setSwot(s.swot);
        if (s.canvas) setCanvas(s.canvas);
        if (Array.isArray(s.influencers) && s.influencers.length) setInfluencers(s.influencers);
        if (Array.isArray(s.bloggerFiles)) setBloggerFiles(s.bloggerFiles);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ products, swot, canvas, influencers, bloggerFiles })
      );
    } catch {}
  }, [products, swot, canvas, influencers, bloggerFiles]);

  // ---- Financial model ----
  const computed = useMemo(() => products.map((p) => ({ p, calc: computeFin(p) })), [products]);

  const updateProduct = (id: string, patch: Partial<FinProduct>) =>
    setProducts((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removeProduct = (id: string) =>
    setProducts((arr) => (arr.length > 1 ? arr.filter((p) => p.id !== id) : arr));

  const loadExample = () => {
    setProducts([exampleProduct()]);
    setSwot({
      strengths: "Strong brand, loyal customers, experienced team",
      weaknesses: "Limited marketing budget, single location",
      opportunities: "Growing online demand, expansion to new cities",
      threats: "Rising ingredient costs, new competitors",
    });
    setCanvas({
      customerSegments: "Young professionals, families, food enthusiasts",
      valuePropositions: "Premium quality, authentic recipes, fast delivery",
      channels: "Physical store, mobile app, delivery platforms",
      customerRelationships: "Personal service, loyalty program, social engagement",
      revenueStreams: "Dine-in sales, takeout, catering, subscriptions",
      keyResources: "Kitchen, brand, recipes, staff, suppliers",
      keyActivities: "Cooking, marketing, delivery operations",
      keyPartnerships: "Local farms, delivery apps, payment providers",
      costStructure: "Rent, salaries, ingredients, marketing, utilities",
    });
    toast({ title: t.exampleLoaded });
  };

  const resetAll = () => {
    if (!confirm(t.resetConfirm)) return;
    setProducts([newProduct()]);
    setSwot({ strengths: "", weaknesses: "", opportunities: "", threats: "" });
    setCanvas({
      customerSegments: "",
      valuePropositions: "",
      channels: "",
      customerRelationships: "",
      revenueStreams: "",
      keyResources: "",
      keyActivities: "",
      keyPartnerships: "",
      costStructure: "",
    });
    setInfluencers([newInfluencer()]);
    setSingle(newInfluencer());
    setBloggerFiles([]);
    setBloggerForm(emptyBlogger());
    localStorage.removeItem(LS_KEY);
    toast({ title: t.resetDone });
  };

  // ---- Influencers ----
  const computeER = (i: Pick<Influencer, "followers" | "likes" | "comments" | "shares" | "saves">) => {
    const engagements = (i.likes || 0) + (i.comments || 0) + (i.shares || 0) + (i.saves || 0);
    const er = i.followers > 0 ? (engagements / i.followers) * 100 : 0;
    return { engagements, er };
  };

  const singleResult = computeER(single);
  const ratingLabels = { excellent: t.excellent, good: t.good, low: t.low };
  const singleRating = erRating(singleResult.er, ratingLabels);

  const influencerResults = influencers.map((inf) => ({ ...inf, ...computeER(inf) }));
  const avgER =
    influencerResults.length > 0
      ? influencerResults.reduce((s, r) => s + r.er, 0) / influencerResults.length
      : 0;

  const addInfluencer = () => setInfluencers((arr) => [...arr, newInfluencer()]);
  const removeInfluencer = (id: string) =>
    setInfluencers((arr) => (arr.length > 1 ? arr.filter((i) => i.id !== id) : arr));
  const updateInfluencer = (id: string, patch: Partial<Influencer>) =>
    setInfluencers((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  // ---- Blogger Files ----
  const addBloggerFile = () => {
    if (!bloggerForm.name.trim()) {
      toast({
        title: t.error,
        description: t.bloggerNameRequired,
        variant: "destructive",
      });
      return;
    }
    setBloggerFiles((arr) => [
      { ...bloggerForm, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...arr,
    ]);
    setBloggerForm(emptyBlogger());
    toast({ title: t.bloggerSaved });
  };

  const deleteBloggerFile = (id: string) =>
    setBloggerFiles((arr) => arr.filter((b) => b.id !== id));

  // ---- CSV / PDF Export ----
  const downloadCSV = () => {
    const headers = ["Name", "Followers", "Likes", "Comments", "Shares", "Saves", "ER%", "Rating"];
    const rows = influencerResults.map((r) => [
      r.name || "—",
      r.followers,
      r.likes,
      r.comments,
      r.shares,
      r.saves,
      r.er.toFixed(2),
      erRating(r.er, ratingLabels).label,
    ]);
    const csv =
      [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influencers_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ Professional PDF export via html2canvas ============
  // Captures rendered DOM (preserves charts, tables, RTL, Arabic glyphs).
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const captureElementToPDF = async (
    el: HTMLElement,
    filename: string,
    title: string,
  ) => {
    const isDark = document.documentElement.classList.contains("dark");
    const bg = isDark ? "#0a0a0a" : "#ffffff";
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: bg,
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
    });
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerH = 18;
    const footerH = 10;
    const contentW = pageW - margin * 2;
    const contentH = pageH - headerH - footerH;
    const imgW = contentW;

    const drawHeader = (pageNum: number, totalPages: number) => {
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, pageW, headerH - 4, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, 9);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      const sub = `${t.pdfGenerated}: ${new Date().toLocaleString()}`;
      pdf.text(sub, pageW - margin, 9, { align: "right" });
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(8);
      pdf.text(
        `${t.page} ${pageNum} ${t.of} ${totalPages}`,
        pageW / 2,
        pageH - 4,
        { align: "center" },
      );
      pdf.text("BSS — Marketing Toolkit", margin, pageH - 4);
    };

    // Slice the tall canvas into page-sized strips
    const pxPerMM = canvas.width / imgW;
    const pageContentPx = contentH * pxPerMM;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageContentPx));

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      const sliceY = i * pageContentPx;
      const sliceH = Math.min(pageContentPx, canvas.height - sliceY);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, -sliceY);
      const sliceImg = sliceCanvas.toDataURL("image/png");
      const sliceImgH = (sliceH / pxPerMM);
      drawHeader(i + 1, totalPages);
      pdf.addImage(sliceImg, "PNG", margin, headerH, imgW, sliceImgH);
    }

    pdf.save(filename);
  };

  const captureSection = async (sectionId: string, switchTab: string, filename: string, title: string) => {
    setActiveTab(switchTab);
    // Wait for tab content to mount and charts to render
    await wait(450);
    const el = document.getElementById(sectionId);
    if (!el) {
      toast({ title: t.error, description: `Section not found: ${sectionId}` });
      return;
    }
    try {
      await captureElementToPDF(el, filename, title);
    } catch (err: any) {
      toast({ title: t.error, description: String(err?.message || err) });
    }
  };

  const downloadInfluencerPDF = () =>
    captureSection(
      "pdf-section-influencers",
      "bloggers",
      `influencers_${Date.now()}.pdf`,
      `${t.bloggers} — ${t.compareInfluencers}`,
    );

  const downloadFinancialPDF = () =>
    captureSection(
      "pdf-section-financial",
      "financial",
      `financial_analysis_${Date.now()}.pdf`,
      t.finTitle,
    );

  const downloadFullReport = async () => {
    toast({ title: t.pdfTitle, description: t.pdfGenerated + "..." });
    try {
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerH = 18;
      const footerH = 10;
      const contentW = pageW - margin * 2;
      const contentH = pageH - headerH - footerH;
      const isDark = document.documentElement.classList.contains("dark");
      const bg = isDark ? "#0a0a0a" : "#ffffff";
      let firstPage = true;

      // Cover page
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(t.pdfTitle, pageW / 2, pageH / 2 - 10, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(t.marketingSubtitle, pageW / 2, pageH / 2 + 2, { align: "center", maxWidth: pageW - 40 });
      pdf.setFontSize(10);
      pdf.text(`${t.pdfGenerated}: ${new Date().toLocaleString()}`, pageW / 2, pageH - 20, { align: "center" });
      pdf.text("BSS — BlindSpot System", pageW / 2, pageH - 14, { align: "center" });
      firstPage = false;

      const sections: { tab: string; id: string; title: string }[] = [
        { tab: "gtm", id: "pdf-section-gtm", title: t.gtmStrategy },
        { tab: "sales", id: "pdf-section-sales", title: t.salesCycle },
        { tab: "financial", id: "pdf-section-financial", title: t.finTitle },
        { tab: "bloggers", id: "pdf-section-bloggers", title: t.bloggers },
      ];

      for (const s of sections) {
        setActiveTab(s.tab);
        await wait(500);
        const el = document.getElementById(s.id);
        if (!el) continue;
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: bg,
          useCORS: true,
          logging: false,
          windowWidth: el.scrollWidth,
        });
        const imgW = contentW;
        const pxPerMM = canvas.width / imgW;
        const pageContentPx = contentH * pxPerMM;
        const totalPages = Math.max(1, Math.ceil(canvas.height / pageContentPx));

        for (let i = 0; i < totalPages; i++) {
          if (!firstPage) pdf.addPage();
          firstPage = false;
          // Header
          pdf.setFillColor(124, 58, 237);
          pdf.rect(0, 0, pageW, headerH - 4, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13);
          pdf.text(s.title, margin, 9);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(
            `${t.pdfGenerated}: ${new Date().toLocaleString()}`,
            pageW - margin,
            9,
            { align: "right" },
          );
          // Slice
          const sliceY = i * pageContentPx;
          const sliceH = Math.min(pageContentPx, canvas.height - sliceY);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, -sliceY);
          const sliceImg = sliceCanvas.toDataURL("image/png");
          pdf.addImage(sliceImg, "PNG", margin, headerH, imgW, sliceH / pxPerMM);
          // Footer
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(8);
          pdf.text(
            `${s.title} — ${t.page} ${i + 1} ${t.of} ${totalPages}`,
            pageW / 2,
            pageH - 4,
            { align: "center" },
          );
          pdf.text("BSS — Marketing Toolkit", margin, pageH - 4);
        }
      }

      pdf.save(`marketing_toolkit_report_${Date.now()}.pdf`);
    } catch (err: any) {
      toast({ title: t.error, description: String(err?.message || err) });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"} ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" data-testid="text-marketing-title">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Megaphone className="h-5 w-5" />
            </span>
            {t.marketing}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t.marketingSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadExample} data-testid="button-load-example">
            <Lightbulb className="h-4 w-4 me-2" />
            {t.loadExample}
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll} data-testid="button-reset-all">
            <RotateCcw className="h-4 w-4 me-2" />
            {t.resetAll}
          </Button>
          <Button size="sm" onClick={downloadFullReport} data-testid="button-download-full-report">
            <Download className="h-4 w-4 me-2" />
            {t.downloadFullReport}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="gtm" data-testid="tab-gtm" className="flex items-center gap-2 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t.gtmStrategy}</span>
            <span className="sm:hidden">GTM</span>
          </TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales" className="flex items-center gap-2 py-2">
            <TrendingUp className="h-4 w-4" />
            <span>{t.salesCycle}</span>
          </TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial" className="flex items-center gap-2 py-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{t.financialAnalysis}</span>
            <span className="sm:hidden">$</span>
          </TabsTrigger>
          <TabsTrigger value="bloggers" data-testid="tab-bloggers" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span>{t.bloggers}</span>
          </TabsTrigger>
        </TabsList>

        {/* ===================== GTM ===================== */}
        <TabsContent value="gtm" className="space-y-4" id="pdf-section-gtm">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                {t.gtmTitle}
              </CardTitle>
              <CardDescription>{t.gtmDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Users, title: t.card1Title, body: t.card1Body },
                  { icon: Lightbulb, title: t.card2Title, body: t.card2Body },
                  { icon: BarChart3, title: t.card3Title, body: t.card3Body },
                  { icon: DollarSign, title: t.card4Title, body: t.card4Body },
                  { icon: Megaphone, title: t.card5Title, body: t.card5Body },
                  { icon: TrendingUp, title: t.card6Title, body: t.card6Body },
                ].map((b) => (
                  <div key={b.title} className="rounded-md border p-4 space-y-2 hover-elevate">
                    <div className="flex items-center gap-2 font-medium">
                      <b.icon className="h-4 w-4 text-violet-500" />
                      {b.title}
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{b.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SWOT */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                {t.swotAnalysis}
              </CardTitle>
              <CardDescription>{t.swotDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    { k: "strengths", label: t.strengths, color: "border-green-500/40" },
                    { k: "weaknesses", label: t.weaknesses, color: "border-red-500/40" },
                    { k: "opportunities", label: t.opportunities, color: "border-blue-500/40" },
                    { k: "threats", label: t.threats, color: "border-orange-500/40" },
                  ] as const
                ).map((f) => (
                  <div key={f.k} className={`rounded-md border-2 ${f.color} p-3`}>
                    <Label className="text-sm font-semibold">{f.label}</Label>
                    <Textarea
                      rows={4}
                      className="mt-2 resize-none"
                      placeholder={`${t.listYour} ${f.label}...`}
                      value={swot[f.k]}
                      onChange={(e) => setSwot({ ...swot, [f.k]: e.target.value })}
                      data-testid={`textarea-swot-${f.k}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Model Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                {t.businessModelCanvas}
              </CardTitle>
              <CardDescription>{t.bmcDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {(
                  [
                    { k: "keyPartnerships", label: t.keyPartnerships },
                    { k: "keyActivities", label: t.keyActivities },
                    { k: "valuePropositions", label: t.valuePropositions },
                    { k: "customerRelationships", label: t.customerRelationships },
                    { k: "customerSegments", label: t.customerSegments },
                    { k: "keyResources", label: t.keyResources },
                    { k: "channels", label: t.channels },
                    { k: "costStructure", label: t.costStructure },
                    { k: "revenueStreams", label: t.revenueStreams },
                  ] as const
                ).map((b) => (
                  <div key={b.k} className="rounded-md border p-3">
                    <Label className="text-xs font-semibold">{b.label}</Label>
                    <Textarea
                      rows={3}
                      className="mt-2 text-xs resize-none"
                      placeholder={`${b.label}...`}
                      value={canvas[b.k]}
                      onChange={(e) => setCanvas({ ...canvas, [b.k]: e.target.value })}
                      data-testid={`textarea-canvas-${b.k}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== Sales Cycle ===================== */}
        <TabsContent value="sales" className="space-y-4" id="pdf-section-sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {t.salesCycleStages}
              </CardTitle>
              <CardDescription>{t.salesCycleDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  { n: 1, title: t.stage1Title, body: t.stage1Body },
                  { n: 2, title: t.stage2Title, body: t.stage2Body },
                  { n: 3, title: t.stage3Title, body: t.stage3Body },
                  { n: 4, title: t.stage4Title, body: t.stage4Body },
                  { n: 5, title: t.stage5Title, body: t.stage5Body },
                  { n: 6, title: t.stage6Title, body: t.stage6Body },
                  { n: 7, title: t.stage7Title, body: t.stage7Body },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-md border p-3 hover-elevate">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-semibold text-sm">
                      {s.n}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {s.title}
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.keySalesMetrics}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                [t.cac, t.cacDesc],
                [t.ltv, t.ltvDesc],
                [t.conversionRate, t.conversionRateDesc],
                [t.cycleLength, t.cycleLengthDesc],
                [t.winRate, t.winRateDesc],
                [t.pipelineCoverage, t.pipelineCoverageDesc],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border p-3">
                  <div className="font-semibold">{k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== Financial ===================== */}
        <TabsContent value="financial" className="space-y-4" id="pdf-section-financial">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-amber-500" />
                  {t.finTitle}
                </CardTitle>
                <CardDescription>{t.finDesc}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProducts((arr) => [...arr, { ...newProduct(), name: `Product ${arr.length + 1}` }])}
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {t.addProduct}
                </Button>
                <Button size="sm" onClick={downloadFinancialPDF} data-testid="button-download-financial-pdf">
                  <Download className="h-4 w-4 me-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
          </Card>

          {computed.map(({ p, calc }, idx) => (
            <Card key={p.id} data-testid={`card-product-${p.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex-1">
                  <Input
                    value={p.name}
                    onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                    className="font-semibold text-base max-w-md"
                    placeholder={t.productName}
                    data-testid={`input-product-name-${p.id}`}
                  />
                </div>
                {products.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(p.id)}
                    data-testid={`button-remove-product-${p.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  {(
                    [
                      ["sellingPrice", t.sellingPrice, t.sellingPriceHelp],
                      ["variableCost", t.variableCost, t.variableCostHelp],
                      ["fixedCosts", t.fixedCosts, t.fixedCostsHelp],
                      ["initialCapital", t.initialCapital, t.initialCapitalHelp],
                      ["monthlyUnits", t.monthlyUnits, t.monthlyUnitsHelp],
                      ["growthRate", t.growthRate, t.growthRateHelp],
                    ] as const
                  ).map(([k, label, help]) => (
                    <div key={k}>
                      <Label className="text-xs">
                        {label}
                        <InfoTip>{help}</InfoTip>
                      </Label>
                      <Input
                        type="number"
                        value={p[k]}
                        onChange={(e) => updateProduct(p.id, { [k]: parseFloat(e.target.value) || 0 })}
                        data-testid={`input-${k}-${p.id}`}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    [t.grossMargin, `${fmt(calc.grossMarginPct)}%`],
                    [t.breakEvenUnits, fmt(calc.breakEvenUnits, 0)],
                    [t.breakEvenRevenue, fmt(calc.breakEvenRevenue)],
                    [t.monthlyProfit, fmt(calc.monthlyProfit)],
                    [t.yearlyProfit, fmt(calc.yearlyProfit)],
                    [
                      t.paybackPeriod,
                      isFinite(calc.paybackMonths) ? `${fmt(calc.paybackMonths, 1)} mo` : t.na,
                    ],
                    [t.roiAnnual, `${fmt(calc.roiPct)}%`],
                    [t.contributionUnit, fmt(p.sellingPrice - p.variableCost)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{k}</div>
                      <div className="text-lg font-bold" data-testid={`stat-${k.replace(/\s+/g, "-").toLowerCase()}-${p.id}`}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calc.chart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        name={t.cumulativeProfit}
                      />
                      <Line
                        type="monotone"
                        dataKey="monthly"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name={t.monthlyProfitChart}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===================== Bloggers ===================== */}
        <TabsContent value="bloggers" className="space-y-4" id="pdf-section-bloggers">
          {/* Single Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-500" />
                {t.singleInfluencerCalc}
              </CardTitle>
              <CardDescription>{t.singleInfluencerDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                {(
                  [
                    ["followers", t.followers],
                    ["likes", t.likes],
                    ["comments", t.comments],
                    ["shares", t.shares],
                    ["saves", t.saves],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={single[k]}
                      onChange={(e) => setSingle({ ...single, [k]: parseFloat(e.target.value) || 0 })}
                      data-testid={`input-single-${k}`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.totalEngagements}</div>
                  <div className="text-xl font-bold" data-testid="stat-single-engagements">
                    {fmt(singleResult.engagements, 0)}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.engagementRate}</div>
                  <div className={`text-xl font-bold ${singleRating.text}`} data-testid="stat-single-er">
                    {fmt(singleResult.er)}%
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.rating}</div>
                  <div className="mt-1">
                    <Badge className={`${singleRating.color} text-white`} data-testid="badge-single-rating">
                      {singleRating.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.foodBenchmarks}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                [t.nano, t.nanoDesc, "from-green-500 to-emerald-500"],
                [t.micro, t.microDesc, "from-yellow-500 to-amber-500"],
                [t.macro, t.macroDesc, "from-blue-500 to-indigo-500"],
              ].map(([t1, t2, g]) => (
                <div key={t1} className={`rounded-md p-4 bg-gradient-to-br ${g} text-white`}>
                  <div className="font-semibold">{t1}</div>
                  <div className="text-xs opacity-90 mt-1">{t2}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card id="pdf-section-influencers">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">{t.compareInfluencers}</CardTitle>
                <CardDescription>{t.compareDesc}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addInfluencer} data-testid="button-add-influencer">
                  <Plus className="h-4 w-4 me-2" />
                  {t.add}
                </Button>
                <Button size="sm" variant="outline" onClick={downloadCSV} data-testid="button-download-csv">
                  <Download className="h-4 w-4 me-2" />
                  CSV
                </Button>
                <Button size="sm" onClick={downloadInfluencerPDF} data-testid="button-download-influencer-pdf">
                  <Download className="h-4 w-4 me-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.name}</TableHead>
                      <TableHead>{t.followers}</TableHead>
                      <TableHead>{t.likes}</TableHead>
                      <TableHead>{t.comments}</TableHead>
                      <TableHead>{t.shares}</TableHead>
                      <TableHead>{t.saves}</TableHead>
                      <TableHead>ER%</TableHead>
                      <TableHead>{t.rating}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {influencerResults.map((r) => {
                      const rating = erRating(r.er, ratingLabels);
                      return (
                        <TableRow key={r.id} data-testid={`row-influencer-${r.id}`}>
                          <TableCell>
                            <Input
                              value={r.name}
                              onChange={(e) => updateInfluencer(r.id, { name: e.target.value })}
                              placeholder={t.name}
                              className="min-w-32"
                              data-testid={`input-influencer-name-${r.id}`}
                            />
                          </TableCell>
                          {(["followers", "likes", "comments", "shares", "saves"] as const).map((k) => (
                            <TableCell key={k}>
                              <Input
                                type="number"
                                value={r[k]}
                                onChange={(e) =>
                                  updateInfluencer(r.id, { [k]: parseFloat(e.target.value) || 0 })
                                }
                                className="w-24"
                                data-testid={`input-influencer-${k}-${r.id}`}
                              />
                            </TableCell>
                          ))}
                          <TableCell className={`font-semibold ${rating.text}`}>
                            {fmt(r.er)}%
                          </TableCell>
                          <TableCell>
                            <Badge className={`${rating.color} text-white`}>{rating.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {influencers.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeInfluencer(r.id)}
                                data-testid={`button-remove-influencer-${r.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 rounded-md border p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{t.averageER}</span>
                <span className={`text-lg font-bold ${erRating(avgER, ratingLabels).text}`} data-testid="stat-average-er">
                  {fmt(avgER)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Blogger Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-500" />
                {t.createBloggerFile}
              </CardTitle>
              <CardDescription>{t.createBloggerDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t.name} *</Label>
                  <Input
                    value={bloggerForm.name}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, name: e.target.value })}
                    data-testid="input-blogger-name"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.handle}</Label>
                  <Input
                    value={bloggerForm.handle}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, handle: e.target.value })}
                    placeholder="@username"
                    data-testid="input-blogger-handle"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.platform}</Label>
                  <Input
                    value={bloggerForm.platform}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, platform: e.target.value })}
                    data-testid="input-blogger-platform"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.niche}</Label>
                  <Input
                    value={bloggerForm.niche}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, niche: e.target.value })}
                    data-testid="input-blogger-niche"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.email}</Label>
                  <Input
                    type="email"
                    value={bloggerForm.contactEmail}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, contactEmail: e.target.value })}
                    data-testid="input-blogger-email"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.phone}</Label>
                  <Input
                    value={bloggerForm.contactPhone}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, contactPhone: e.target.value })}
                    data-testid="input-blogger-phone"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.city}</Label>
                  <Input
                    value={bloggerForm.city}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, city: e.target.value })}
                    data-testid="input-blogger-city"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.followers}</Label>
                  <Input
                    type="number"
                    value={bloggerForm.followers}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, followers: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-followers"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.likes}</Label>
                  <Input
                    type="number"
                    value={bloggerForm.likes}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, likes: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-likes"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.comments}</Label>
                  <Input
                    type="number"
                    value={bloggerForm.comments}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, comments: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-comments"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.shares}</Label>
                  <Input
                    type="number"
                    value={bloggerForm.shares}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, shares: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-shares"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.saves}</Label>
                  <Input
                    type="number"
                    value={bloggerForm.saves}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, saves: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-saves"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t.notes}</Label>
                <Textarea
                  rows={2}
                  value={bloggerForm.notes}
                  onChange={(e) => setBloggerForm({ ...bloggerForm, notes: e.target.value })}
                  data-testid="textarea-blogger-notes"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={addBloggerFile} data-testid="button-save-blogger">
                  <Plus className="h-4 w-4 me-2" />
                  {t.saveBloggerFile}
                </Button>
              </div>
            </CardContent>
          </Card>

          {bloggerFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t.savedBloggers} ({bloggerFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bloggerFiles.map((b) => {
                  const { er } = computeER(b);
                  const rating = erRating(er, ratingLabels);
                  return (
                    <div
                      key={b.id}
                      className="rounded-md border p-3 flex flex-col md:flex-row md:items-center gap-3"
                      data-testid={`card-blogger-${b.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          {b.name}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            {b.handle && `· ${b.handle}`} {b.platform && `· ${b.platform}`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {b.niche} {b.city && `· ${b.city}`}{" "}
                          {b.contactEmail && `· ${b.contactEmail}`}{" "}
                          {b.contactPhone && `· ${b.contactPhone}`}
                        </div>
                        <div className="text-xs mt-1">
                          {t.followers}: <b>{fmt(b.followers, 0)}</b> · {t.likes}: <b>{fmt(b.likes, 0)}</b> ·
                          {t.comments}: <b>{fmt(b.comments, 0)}</b> · {t.shares}: <b>{fmt(b.shares, 0)}</b> ·
                          {t.saves}: <b>{fmt(b.saves, 0)}</b>
                        </div>
                        {b.notes && <div className="text-xs text-muted-foreground mt-1 italic">{b.notes}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <div className="text-xs text-muted-foreground">ER</div>
                          <div className={`text-lg font-bold ${rating.text}`}>{fmt(er)}%</div>
                        </div>
                        <Badge className={`${rating.color} text-white`}>{rating.label}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBloggerFile(b.id)}
                          data-testid={`button-delete-blogger-${b.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
