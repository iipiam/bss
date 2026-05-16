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
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

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

function erRating(er: number) {
  if (er >= 5) return { label: "Excellent", color: "bg-green-500", text: "text-green-600" };
  if (er >= 3) return { label: "Good", color: "bg-yellow-500", text: "text-yellow-600" };
  return { label: "Low", color: "bg-red-500", text: "text-red-600" };
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
  const { t, isRTL } = useLanguage();
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
    toast({ title: t.exampleLoaded || "Example loaded" });
  };

  const resetAll = () => {
    if (!confirm(t.resetConfirm || "Reset everything? This cannot be undone.")) return;
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
    toast({ title: t.resetDone || "All data cleared" });
  };

  // ---- Influencers ----
  const computeER = (i: Pick<Influencer, "followers" | "likes" | "comments" | "shares" | "saves">) => {
    const engagements = (i.likes || 0) + (i.comments || 0) + (i.shares || 0) + (i.saves || 0);
    const er = i.followers > 0 ? (engagements / i.followers) * 100 : 0;
    return { engagements, er };
  };

  const singleResult = computeER(single);
  const singleRating = erRating(singleResult.er);

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
        title: t.error || "Error",
        description: t.bloggerNameRequired || "Blogger name is required",
        variant: "destructive",
      });
      return;
    }
    setBloggerFiles((arr) => [
      { ...bloggerForm, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...arr,
    ]);
    setBloggerForm(emptyBlogger());
    toast({ title: t.bloggerSaved || "Blogger file created" });
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
      erRating(r.er).label,
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

  const downloadInfluencerPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Influencer Engagement Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Average ER: ${avgER.toFixed(2)}%`, 14, 34);
    let y = 46;
    doc.setFontSize(11);
    doc.text("Name", 14, y);
    doc.text("Followers", 60, y);
    doc.text("Eng.", 95, y);
    doc.text("ER%", 120, y);
    doc.text("Rating", 145, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    doc.setFontSize(10);
    influencerResults.forEach((r) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text((r.name || "—").substring(0, 24), 14, y);
      doc.text(String(r.followers), 60, y);
      doc.text(String(r.engagements), 95, y);
      doc.text(r.er.toFixed(2), 120, y);
      doc.text(erRating(r.er).label, 145, y);
      y += 6;
    });
    doc.save(`influencers_${Date.now()}.pdf`);
  };

  const downloadFinancialPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Business & Financial Analysis", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    let y = 38;
    computed.forEach(({ p, calc }, idx) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${p.name}`, 14, y);
      y += 8;
      doc.setFontSize(10);
      const lines = [
        `Selling Price / Unit: ${fmt(p.sellingPrice)}`,
        `Variable Cost / Unit: ${fmt(p.variableCost)}`,
        `Monthly Fixed Costs: ${fmt(p.fixedCosts)}`,
        `Initial Capital: ${fmt(p.initialCapital)}`,
        `Monthly Units: ${fmt(p.monthlyUnits, 0)}`,
        `Monthly Growth: ${fmt(p.growthRate)}%`,
        `--`,
        `Gross Margin: ${fmt(calc.grossMarginPct)}%`,
        `Break-even Units: ${fmt(calc.breakEvenUnits, 0)}`,
        `Break-even Revenue: ${fmt(calc.breakEvenRevenue)}`,
        `Monthly Profit: ${fmt(calc.monthlyProfit)}`,
        `Yearly Profit: ${fmt(calc.yearlyProfit)}`,
        `Payback Period: ${isFinite(calc.paybackMonths) ? fmt(calc.paybackMonths, 1) + " months" : "N/A"}`,
        `ROI (annual): ${fmt(calc.roiPct)}%`,
      ];
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 14, y);
        y += 5;
      });
      y += 6;
    });
    doc.save(`financial_analysis_${Date.now()}.pdf`);
  };

  const downloadFullReport = () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(20);
    doc.text("Marketing & Business Toolkit Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // SWOT
    let y = 42;
    doc.setFontSize(14);
    doc.text("SWOT Analysis", 14, y);
    y += 8;
    doc.setFontSize(10);
    const swotPairs: [string, string][] = [
      ["Strengths", swot.strengths || "—"],
      ["Weaknesses", swot.weaknesses || "—"],
      ["Opportunities", swot.opportunities || "—"],
      ["Threats", swot.threats || "—"],
    ];
    swotPairs.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 14, y);
      doc.setFont("helvetica", "normal");
      const split = doc.splitTextToSize(v, 170);
      doc.text(split, 14, y + 5);
      y += 5 + split.length * 5 + 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Business Model Canvas
    doc.addPage();
    y = 20;
    doc.setFontSize(14);
    doc.text("Business Model Canvas", 14, y);
    y += 8;
    doc.setFontSize(10);
    const canvasBlocks: [string, string][] = [
      ["Customer Segments", canvas.customerSegments],
      ["Value Propositions", canvas.valuePropositions],
      ["Channels", canvas.channels],
      ["Customer Relationships", canvas.customerRelationships],
      ["Revenue Streams", canvas.revenueStreams],
      ["Key Resources", canvas.keyResources],
      ["Key Activities", canvas.keyActivities],
      ["Key Partnerships", canvas.keyPartnerships],
      ["Cost Structure", canvas.costStructure],
    ];
    canvasBlocks.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 14, y);
      doc.setFont("helvetica", "normal");
      const split = doc.splitTextToSize(v || "—", 170);
      doc.text(split, 14, y + 5);
      y += 5 + split.length * 5 + 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Financial
    doc.addPage();
    y = 20;
    doc.setFontSize(14);
    doc.text("Financial Models", 14, y);
    y += 8;
    doc.setFontSize(10);
    computed.forEach(({ p, calc }, idx) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${p.name}`, 14, y);
      doc.setFont("helvetica", "normal");
      y += 6;
      const lines = [
        `Selling Price: ${fmt(p.sellingPrice)} | Variable Cost: ${fmt(p.variableCost)}`,
        `Monthly Fixed: ${fmt(p.fixedCosts)} | Initial Capital: ${fmt(p.initialCapital)}`,
        `Monthly Units: ${fmt(p.monthlyUnits, 0)} | Growth: ${fmt(p.growthRate)}%`,
        `Gross Margin: ${fmt(calc.grossMarginPct)}% | BE Units: ${fmt(calc.breakEvenUnits, 0)}`,
        `Monthly Profit: ${fmt(calc.monthlyProfit)} | Yearly Profit: ${fmt(calc.yearlyProfit)}`,
        `Payback: ${isFinite(calc.paybackMonths) ? fmt(calc.paybackMonths, 1) + " mo" : "N/A"} | ROI: ${fmt(calc.roiPct)}%`,
      ];
      lines.forEach((l) => {
        doc.text(l, 14, y);
        y += 5;
      });
      y += 4;
    });

    doc.save(`marketing_toolkit_report_${Date.now()}.pdf`);
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
            {t.marketing || "Marketing"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.marketingSubtitle ||
              "Bloggers, Go-to-Market Strategies, Sales Cycles & Business Financial Analysis Toolkit"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadExample} data-testid="button-load-example">
            <Lightbulb className="h-4 w-4 me-2" />
            {t.loadExample || "Load Example"}
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll} data-testid="button-reset-all">
            <RotateCcw className="h-4 w-4 me-2" />
            {t.resetAll || "Reset"}
          </Button>
          <Button size="sm" onClick={downloadFullReport} data-testid="button-download-full-report">
            <Download className="h-4 w-4 me-2" />
            {t.downloadFullReport || "Full PDF Report"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="gtm" data-testid="tab-gtm" className="flex items-center gap-2 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t.gtmStrategy || "Go-to-Market"}</span>
            <span className="sm:hidden">GTM</span>
          </TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales" className="flex items-center gap-2 py-2">
            <TrendingUp className="h-4 w-4" />
            <span>{t.salesCycle || "Sales Cycle"}</span>
          </TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial" className="flex items-center gap-2 py-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{t.financialAnalysis || "Financial"}</span>
            <span className="sm:hidden">$</span>
          </TabsTrigger>
          <TabsTrigger value="bloggers" data-testid="tab-bloggers" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span>{t.bloggers || "Bloggers"}</span>
          </TabsTrigger>
        </TabsList>

        {/* ===================== GTM ===================== */}
        <TabsContent value="gtm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                {t.gtmStrategy || "Go-to-Market Strategy"}
              </CardTitle>
              <CardDescription>
                A Go-to-Market (GTM) strategy is the plan that defines how a company launches a product,
                reaches its target customers, and achieves competitive advantage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    icon: Users,
                    title: "1. Target Audience",
                    body: "Define your ideal customer profile (ICP) and buyer personas — demographics, behaviour, pain points and where they spend time.",
                  },
                  {
                    icon: Lightbulb,
                    title: "2. Value Proposition",
                    body: "A clear statement of the unique value you deliver, why it matters, and how it differs from alternatives in the market.",
                  },
                  {
                    icon: BarChart3,
                    title: "3. Market & Competitor Analysis",
                    body: "Understand market size (TAM/SAM/SOM), trends, and your direct & indirect competitors' positioning and pricing.",
                  },
                  {
                    icon: DollarSign,
                    title: "4. Pricing & Packaging",
                    body: "Set a pricing model (subscription, freemium, value-based) that aligns with customer value and unit economics.",
                  },
                  {
                    icon: Megaphone,
                    title: "5. Marketing Channels",
                    body: "Choose the most effective acquisition channels: SEO, paid ads, content, partnerships, events, influencer or community.",
                  },
                  {
                    icon: TrendingUp,
                    title: "6. Sales Motion & KPIs",
                    body: "Decide between self-serve, inside sales, or field sales. Track activation, conversion, CAC, LTV and payback.",
                  },
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
                {t.swotAnalysis || "SWOT Analysis"}
              </CardTitle>
              <CardDescription>
                Identify internal Strengths & Weaknesses, external Opportunities & Threats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    { k: "strengths", label: "Strengths", color: "border-green-500/40" },
                    { k: "weaknesses", label: "Weaknesses", color: "border-red-500/40" },
                    { k: "opportunities", label: "Opportunities", color: "border-blue-500/40" },
                    { k: "threats", label: "Threats", color: "border-orange-500/40" },
                  ] as const
                ).map((f) => (
                  <div key={f.k} className={`rounded-md border-2 ${f.color} p-3`}>
                    <Label className="text-sm font-semibold">{f.label}</Label>
                    <Textarea
                      rows={4}
                      className="mt-2 resize-none"
                      placeholder={`List your ${f.label.toLowerCase()}...`}
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
                {t.businessModelCanvas || "Business Model Canvas"}
              </CardTitle>
              <CardDescription>
                A one-page view of how your business creates, delivers, and captures value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {(
                  [
                    { k: "keyPartnerships", label: "Key Partnerships" },
                    { k: "keyActivities", label: "Key Activities" },
                    { k: "valuePropositions", label: "Value Propositions" },
                    { k: "customerRelationships", label: "Customer Relationships" },
                    { k: "customerSegments", label: "Customer Segments" },
                    { k: "keyResources", label: "Key Resources" },
                    { k: "channels", label: "Channels" },
                    { k: "costStructure", label: "Cost Structure" },
                    { k: "revenueStreams", label: "Revenue Streams" },
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
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {t.salesCycle || "Sales Cycle Stages"}
              </CardTitle>
              <CardDescription>
                The repeatable process your team follows to move a prospect from first touch to closed deal and beyond.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  {
                    n: 1,
                    title: "Prospecting",
                    body: "Identify potential customers through research, referrals, inbound leads, and outbound outreach.",
                  },
                  {
                    n: 2,
                    title: "Qualification",
                    body: "Verify fit using frameworks like BANT or MEDDIC — budget, authority, need, timing.",
                  },
                  {
                    n: 3,
                    title: "Discovery & Needs Analysis",
                    body: "Ask open-ended questions to understand pain points, goals, and decision-making criteria.",
                  },
                  {
                    n: 4,
                    title: "Presentation / Demo",
                    body: "Tailor your product demonstration to the prospect's specific needs and desired outcomes.",
                  },
                  {
                    n: 5,
                    title: "Proposal & Negotiation",
                    body: "Send a clear proposal, handle objections, and negotiate terms that work for both sides.",
                  },
                  {
                    n: 6,
                    title: "Closing",
                    body: "Confirm the decision, sign the contract, collect payment details, and onboard the customer.",
                  },
                  {
                    n: 7,
                    title: "Retention & Upsell",
                    body: "Deliver value, monitor satisfaction, expand the relationship through renewals and cross-sells.",
                  },
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
              <CardTitle className="text-base">Key Sales Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                ["CAC", "Cost to acquire a customer = Total Sales & Marketing Spend / New Customers"],
                ["LTV", "Lifetime value = Avg Revenue per Customer × Gross Margin × Avg Lifespan"],
                ["Conversion Rate", "% of leads that become paying customers at each funnel stage"],
                ["Sales Cycle Length", "Average time from first touch to closed deal"],
                ["Win Rate", "Deals won / Total deals worked"],
                ["Pipeline Coverage", "Total pipeline value / Target quota (3-4x is healthy)"],
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
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-amber-500" />
                  {t.financialAnalysis || "Business & Financial Analysis"}
                </CardTitle>
                <CardDescription>
                  Break-even, ROI, payback period, and 24-month cumulative profit — calculated in real time.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProducts((arr) => [...arr, { ...newProduct(), name: `Product ${arr.length + 1}` }])}
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {t.addProduct || "Add Product"}
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
                    placeholder="Product name"
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
                      ["sellingPrice", "Selling Price / Unit", "Price you charge for one unit."],
                      ["variableCost", "Variable Cost / Unit", "Cost that varies per unit sold (ingredients, materials)."],
                      ["fixedCosts", "Monthly Fixed Costs", "Rent, salaries, utilities — costs that don't change with volume."],
                      ["initialCapital", "Initial Capital", "Upfront investment in equipment, deposits, setup."],
                      ["monthlyUnits", "Expected Monthly Units", "Realistic monthly sales volume."],
                      ["growthRate", "Monthly Growth Rate %", "Expected month-over-month volume growth."],
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
                    ["Gross Margin", `${fmt(calc.grossMarginPct)}%`],
                    ["Break-even Units", fmt(calc.breakEvenUnits, 0)],
                    ["Break-even Revenue", fmt(calc.breakEvenRevenue)],
                    ["Monthly Profit", fmt(calc.monthlyProfit)],
                    ["Yearly Profit", fmt(calc.yearlyProfit)],
                    [
                      "Payback Period",
                      isFinite(calc.paybackMonths) ? `${fmt(calc.paybackMonths, 1)} mo` : "N/A",
                    ],
                    ["ROI (annual)", `${fmt(calc.roiPct)}%`],
                    ["Contribution / Unit", fmt(p.sellingPrice - p.variableCost)],
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
                        name="Cumulative Profit"
                      />
                      <Line
                        type="monotone"
                        dataKey="monthly"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Monthly Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===================== Bloggers ===================== */}
        <TabsContent value="bloggers" className="space-y-4">
          {/* Single Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-500" />
                {t.singleInfluencerCalc || "Single Influencer Calculator"}
              </CardTitle>
              <CardDescription>
                Quickly calculate engagement rate for one influencer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                {(
                  [
                    ["followers", "Followers / Reach"],
                    ["likes", "Likes"],
                    ["comments", "Comments"],
                    ["shares", "Shares"],
                    ["saves", "Saves"],
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
                  <div className="text-xs text-muted-foreground">Total Engagements</div>
                  <div className="text-xl font-bold" data-testid="stat-single-engagements">
                    {fmt(singleResult.engagements, 0)}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Engagement Rate</div>
                  <div className={`text-xl font-bold ${singleRating.text}`} data-testid="stat-single-er">
                    {fmt(singleResult.er)}%
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Rating</div>
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
              <CardTitle className="text-base">Food Niche Benchmarks</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                ["Nano (1k–10k)", "Good ER > 8%", "from-green-500 to-emerald-500"],
                ["Micro (10k–100k)", "Good ER > 4–5%", "from-yellow-500 to-amber-500"],
                ["Macro (100k+)", "Good ER > 2–3%", "from-blue-500 to-indigo-500"],
              ].map(([t1, t2, g]) => (
                <div key={t1} className={`rounded-md p-4 bg-gradient-to-br ${g} text-white`}>
                  <div className="font-semibold">{t1}</div>
                  <div className="text-xs opacity-90 mt-1">{t2}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">{t.compareInfluencers || "Compare Influencers"}</CardTitle>
                <CardDescription>
                  Add multiple influencers and compare their engagement performance.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addInfluencer} data-testid="button-add-influencer">
                  <Plus className="h-4 w-4 me-2" />
                  Add
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
                      <TableHead>Name</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Saves</TableHead>
                      <TableHead>ER%</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {influencerResults.map((r) => {
                      const rating = erRating(r.er);
                      return (
                        <TableRow key={r.id} data-testid={`row-influencer-${r.id}`}>
                          <TableCell>
                            <Input
                              value={r.name}
                              onChange={(e) => updateInfluencer(r.id, { name: e.target.value })}
                              placeholder="Name"
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
                <span className="text-sm font-medium">Average ER</span>
                <span className={`text-lg font-bold ${erRating(avgER).text}`} data-testid="stat-average-er">
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
                {t.createBloggerFile || "Create Blogger File"}
              </CardTitle>
              <CardDescription>
                Save a complete profile for each blogger including contact details and engagement stats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={bloggerForm.name}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, name: e.target.value })}
                    data-testid="input-blogger-name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Handle / Username</Label>
                  <Input
                    value={bloggerForm.handle}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, handle: e.target.value })}
                    placeholder="@username"
                    data-testid="input-blogger-handle"
                  />
                </div>
                <div>
                  <Label className="text-xs">Platform</Label>
                  <Input
                    value={bloggerForm.platform}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, platform: e.target.value })}
                    data-testid="input-blogger-platform"
                  />
                </div>
                <div>
                  <Label className="text-xs">Niche</Label>
                  <Input
                    value={bloggerForm.niche}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, niche: e.target.value })}
                    data-testid="input-blogger-niche"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={bloggerForm.contactEmail}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, contactEmail: e.target.value })}
                    data-testid="input-blogger-email"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={bloggerForm.contactPhone}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, contactPhone: e.target.value })}
                    data-testid="input-blogger-phone"
                  />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    value={bloggerForm.city}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, city: e.target.value })}
                    data-testid="input-blogger-city"
                  />
                </div>
                <div>
                  <Label className="text-xs">Followers</Label>
                  <Input
                    type="number"
                    value={bloggerForm.followers}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, followers: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-followers"
                  />
                </div>
                <div>
                  <Label className="text-xs">Likes</Label>
                  <Input
                    type="number"
                    value={bloggerForm.likes}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, likes: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-likes"
                  />
                </div>
                <div>
                  <Label className="text-xs">Comments</Label>
                  <Input
                    type="number"
                    value={bloggerForm.comments}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, comments: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-comments"
                  />
                </div>
                <div>
                  <Label className="text-xs">Shares</Label>
                  <Input
                    type="number"
                    value={bloggerForm.shares}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, shares: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-shares"
                  />
                </div>
                <div>
                  <Label className="text-xs">Saves</Label>
                  <Input
                    type="number"
                    value={bloggerForm.saves}
                    onChange={(e) => setBloggerForm({ ...bloggerForm, saves: parseFloat(e.target.value) || 0 })}
                    data-testid="input-blogger-saves"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
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
                  {t.saveBloggerFile || "Save Blogger File"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {bloggerFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t.savedBloggers || "Saved Blogger Files"} ({bloggerFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bloggerFiles.map((b) => {
                  const { er } = computeER(b);
                  const rating = erRating(er);
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
                          Followers: <b>{fmt(b.followers, 0)}</b> · Likes: <b>{fmt(b.likes, 0)}</b> ·
                          Comments: <b>{fmt(b.comments, 0)}</b> · Shares: <b>{fmt(b.shares, 0)}</b> ·
                          Saves: <b>{fmt(b.saves, 0)}</b>
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
