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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import QRCode from "qrcode";
import type {
  MenuItem,
  Recipe,
  InventoryItem,
  ShopBill,
  Customer,
  MealSubscription,
  MarketingDiscountCode,
  MarketingBroadcastTemplate,
} from "@shared/schema";
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
import { InfoTip } from "@/components/ui/info-tip";
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
  Tag,
  MessageCircle,
  Image as ImageIcon,
  QrCode,
  Copy,
  ExternalLink,
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
import { toCanvas as htiToCanvas } from "html-to-image";
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

  // ---- Influencer Marketing Calculator (extended) ----
  const [calcCurrency, setCalcCurrency] = useState<"SAR" | "USD">("SAR");
  const [calcCpm, setCalcCpm] = useState<number>(50);
  const [calcSponsorFollowers, setCalcSponsorFollowers] = useState<number>(25000);
  const [calcSponsorEr, setCalcSponsorEr] = useState<number>(4);
  const [roiInputs, setRoiInputs] = useState({
    cost: 5000,
    impressions: 50000,
    engagements: 2500,
    aov: 80,
    conversionRate: 2,
  });
  const [earningsInputs, setEarningsInputs] = useState({
    pricePerPost: 800,
    pricePerStory: 150,
    posts: 4,
    stories: 8,
    affiliateRevenue: 500,
  });

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
        if (s.calcCurrency === "SAR" || s.calcCurrency === "USD") setCalcCurrency(s.calcCurrency);
        if (typeof s.calcCpm === "number") setCalcCpm(s.calcCpm);
        if (typeof s.calcSponsorFollowers === "number") setCalcSponsorFollowers(s.calcSponsorFollowers);
        if (typeof s.calcSponsorEr === "number") setCalcSponsorEr(s.calcSponsorEr);
        if (s.roiInputs && typeof s.roiInputs === "object") setRoiInputs((prev) => ({ ...prev, ...s.roiInputs }));
        if (s.earningsInputs && typeof s.earningsInputs === "object") setEarningsInputs((prev) => ({ ...prev, ...s.earningsInputs }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          products, swot, canvas, influencers, bloggerFiles,
          calcCurrency, calcCpm, calcSponsorFollowers, calcSponsorEr, roiInputs, earningsInputs,
        })
      );
    } catch {}
  }, [products, swot, canvas, influencers, bloggerFiles, calcCurrency, calcCpm, calcSponsorFollowers, calcSponsorEr, roiInputs, earningsInputs]);

  // ---- Menu / cost data from BSS ----
  const { data: menuItems = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/menu"] });
  const { data: recipes = [] } = useQuery<Recipe[]>({ queryKey: ["/api/recipes"] });
  const { data: inventory = [] } = useQuery<InventoryItem[]>({ queryKey: ["/api/inventory"] });
  const { data: shopBills = [] } = useQuery<ShopBill[]>({ queryKey: ["/api/shop/bills"] });

  // ====== Marketing Tools state ======
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: mealSubs = [] } = useQuery<MealSubscription[]>({ queryKey: ["/api/meal-subscriptions"] });
  const { data: discountCodes = [] } = useQuery<MarketingDiscountCode[]>({
    queryKey: ["/api/marketing/discount-codes"],
  });
  const { data: broadcastTemplates = [] } = useQuery<MarketingBroadcastTemplate[]>({
    queryKey: ["/api/marketing/broadcast-templates"],
  });

  // Discount form
  const [discountForm, setDiscountForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    value: "",
    expiresAt: "",
    usageCap: "",
    active: true,
  });
  const createDiscount = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/marketing/discount-codes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/discount-codes"] });
      toast({ title: t.codeCreated });
      setDiscountForm({ code: "", discountType: "percent", value: "", expiresAt: "", usageCap: "", active: true });
    },
    onError: (e: any) => toast({ title: t.error, description: String(e?.message || e), variant: "destructive" }),
  });
  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/marketing/discount-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/discount-codes"] });
      toast({ title: t.codeDeleted });
    },
  });

  // Broadcast templates
  const [tplForm, setTplForm] = useState({
    name: "",
    segment: "all" as "all" | "recent" | "subscribers",
    message: "",
    menuPdfUrl: "",
  });
  const saveTemplate = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/marketing/broadcast-templates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/broadcast-templates"] });
      toast({ title: t.templateSaved });
      setTplForm({ name: "", segment: "all", message: "", menuPdfUrl: "" });
    },
    onError: (e: any) => toast({ title: t.error, description: String(e?.message || e), variant: "destructive" }),
  });
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/marketing/broadcast-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/broadcast-templates"] });
      toast({ title: t.templateDeleted });
    },
  });
  const [activeBroadcastId, setActiveBroadcastId] = useState<string | null>(null);

  const broadcastRecipients = useMemo(() => {
    const tpl = broadcastTemplates.find((b) => b.id === activeBroadcastId);
    if (!tpl) return [] as Array<{ name: string; phone: string }>;
    const segment = tpl.segment;
    if (segment === "subscribers") {
      return mealSubs
        .filter((s: any) => s.subscriberPhone)
        .map((s: any) => ({ name: s.subscriberName || "", phone: s.subscriberPhone }));
    }
    if (segment === "recent") {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return customers
        .filter((c) => c.phone && new Date(c.createdAt as any).getTime() >= cutoff)
        .map((c) => ({ name: c.name, phone: c.phone }));
    }
    return customers.filter((c) => c.phone).map((c) => ({ name: c.name, phone: c.phone }));
  }, [activeBroadcastId, broadcastTemplates, customers, mealSubs]);

  // Poster
  const [posterForm, setPosterForm] = useState({
    title: "",
    body: "",
    price: "",
    imageDataUrl: "",
    accentColor: "#7c3aed",
  });
  const [posterBusy, setPosterBusy] = useState(false);
  const handlePosterImage = (file: File | null) => {
    if (!file) {
      setPosterForm((p) => ({ ...p, imageDataUrl: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPosterForm((p) => ({ ...p, imageDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };
  const generatePoster = async () => {
    setPosterBusy(true);
    try {
      const res = await apiRequest("POST", "/api/marketing/poster-pdf", posterForm);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poster-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: t.posterGenerated });
    } catch (e: any) {
      toast({ title: t.error, description: String(e?.message || e), variant: "destructive" });
    } finally {
      setPosterBusy(false);
    }
  };

  // QR
  const [qrForm, setQrForm] = useState({ url: "", label: "", size: 512 });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const generateQr = async () => {
    if (!/^https?:\/\//i.test(qrForm.url.trim())) {
      toast({ title: t.invalidUrl, variant: "destructive" });
      return;
    }
    try {
      const data = await QRCode.toDataURL(qrForm.url.trim(), { width: qrForm.size, margin: 2 });
      setQrDataUrl(data);
    } catch (e: any) {
      toast({ title: t.error, description: String(e?.message || e), variant: "destructive" });
    }
  };
  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${(qrForm.label || "code").replace(/[^a-z0-9]+/gi, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyToClipboard = (text: string, msg: string) => {
    try {
      navigator.clipboard?.writeText(text);
      toast({ title: msg });
    } catch {}
  };

  const buildWaLink = (phone: string, message: string) => {
    const digits = String(phone || "").replace(/[^0-9]/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  };

  const monthlyFixedCosts = useMemo(() => {
    const factor: Record<string, number> = {
      "one-time": 0,
      weekly: 4.33,
      monthly: 1,
      quarterly: 1 / 3,
      "semi-annually": 1 / 6,
      yearly: 1 / 12,
    };
    return shopBills
      .filter((b) => !b.archived)
      .reduce((sum, b) => sum + (parseFloat(b.amount) || 0) * (factor[b.paymentPeriod] ?? 1), 0);
  }, [shopBills]);

  const computeVariableCost = (mi: MenuItem): number => {
    const portion = parseFloat(mi.portionSize || "1") || 1;
    if (mi.recipeId) {
      const r = recipes.find((x) => x.id === mi.recipeId);
      if (r) return (parseFloat(r.cost) || 0) * portion;
    }
    if (mi.inventoryItemId) {
      const inv = inventory.find((x) => x.id === mi.inventoryItemId);
      if (inv) {
        const unitPrice =
          parseFloat(inv.unitPrice || "0") ||
          parseFloat(inv.price || "0") / (parseFloat(inv.quantity || "1") || 1);
        const stockNo = parseFloat(mi.stockNo || "1") || 1;
        return unitPrice * stockNo;
      }
    }
    return 0;
  };

  const addProductFromMenu = (menuItemId: string) => {
    const mi = menuItems.find((m) => m.id === menuItemId);
    if (!mi) return;
    const sellingPrice = parseFloat(mi.price) || 0;
    const variableCost = computeVariableCost(mi);
    const linked: FinProduct = {
      id: crypto.randomUUID(),
      name: mi.name,
      sellingPrice,
      variableCost,
      fixedCosts: Math.round(monthlyFixedCosts),
      initialCapital: 20000,
      monthlyUnits: 100,
      growthRate: 5,
    };
    setProducts((arr) => [...arr, linked]);
    toast({ title: t.linkedFromMenuToast, description: mi.name });
  };

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

  // ============ Professional PDF export via html-to-image ============
  // Captures rendered DOM (preserves charts, tables, RTL, Arabic glyphs).
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Detect Arabic / Hebrew / Urdu characters in a string
  const containsRTLChars = (s: string) =>
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s);

  // Render a text label to a PNG dataURL via the browser's own text shaping
  // engine. This fixes (1) Arabic text shaping (cursive joining / contextual
  // glyph forms), (2) Unicode BiDi resolution, and (3) RTL layout — none of
  // which jsPDF's built-in `pdf.text()` can do with the helvetica core font.
  const renderTextToImage = async (
    text: string,
    opts: {
      fontSize: number; // px
      color: string;
      bg?: string;
      bold?: boolean;
      maxWidthPx?: number;
      paddingPx?: number;
      align?: "left" | "right" | "center";
    },
  ): Promise<{ dataUrl: string; wPx: number; hPx: number }> => {
    const rtl = containsRTLChars(text);
    const padding = opts.paddingPx ?? 4;
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.pointerEvents = "none";
    host.style.zIndex = "-1";
    host.setAttribute("aria-hidden", "true");

    const inner = document.createElement("div");
    inner.textContent = text;
    inner.dir = rtl ? "rtl" : "ltr";
    inner.style.display = "inline-block";
    inner.style.boxSizing = "border-box";
    inner.style.padding = `${padding}px`;
    inner.style.background = opts.bg ?? "transparent";
    inner.style.color = opts.color;
    inner.style.fontSize = `${opts.fontSize}px`;
    inner.style.lineHeight = "1.25";
    inner.style.fontWeight = opts.bold ? "700" : "400";
    inner.style.whiteSpace = opts.maxWidthPx ? "normal" : "nowrap";
    inner.style.textAlign = opts.align ?? (rtl ? "right" : "left");
    if (opts.maxWidthPx) inner.style.maxWidth = `${opts.maxWidthPx}px`;
    // Use system Arabic-capable fonts when RTL, else generic sans
    inner.style.fontFamily = rtl
      ? '"Noto Naskh Arabic","Segoe UI","Tahoma","Geeza Pro","Arial Unicode MS",Arial,sans-serif'
      : '"Inter","Segoe UI",Arial,sans-serif';

    host.appendChild(inner);
    document.body.appendChild(host);
    try {
      // Force layout
      const rect = inner.getBoundingClientRect();
      const wPx = Math.max(1, Math.ceil(rect.width));
      const hPx = Math.max(1, Math.ceil(rect.height));
      const canvas = await htiToCanvas(inner, {
        pixelRatio: 2,
        backgroundColor: opts.bg ?? undefined,
        cacheBust: true,
        skipFonts: false,
        width: wPx,
        height: hPx,
      });
      return { dataUrl: canvas.toDataURL("image/png"), wPx, hPx };
    } finally {
      document.body.removeChild(host);
    }
  };

  // Place a text label on the PDF, rendered as an image so Arabic shaping,
  // BiDi, and RTL alignment all work correctly.
  const placeTextImage = async (
    pdf: jsPDF,
    text: string,
    xMM: number,
    yMM: number,
    opts: {
      fontSizePx: number;
      color: string;
      bg?: string;
      bold?: boolean;
      maxWidthMM?: number;
      align?: "left" | "right" | "center";
      pxPerMM?: number;
    },
  ) => {
    const pxPerMM = opts.pxPerMM ?? 3.78; // ~96dpi
    const maxWidthPx = opts.maxWidthMM ? Math.floor(opts.maxWidthMM * pxPerMM) : undefined;
    const { dataUrl, wPx, hPx } = await renderTextToImage(text, {
      fontSize: opts.fontSizePx,
      color: opts.color,
      bg: opts.bg,
      bold: opts.bold,
      maxWidthPx,
      align: opts.align,
    });
    const wMM = wPx / pxPerMM;
    const hMM = hPx / pxPerMM;
    let drawX = xMM;
    if (opts.align === "right") drawX = xMM - wMM;
    else if (opts.align === "center") drawX = xMM - wMM / 2;
    pdf.addImage(dataUrl, "PNG", drawX, yMM, wMM, hMM);
    return { wMM, hMM };
  };

  const captureElementToPDF = async (
    el: HTMLElement,
    filename: string,
    title: string,
  ) => {
    const isDark = document.documentElement.classList.contains("dark");
    const bg = isDark ? "#0a0a0a" : "#ffffff";
    const canvas = await htiToCanvas(el, {
      pixelRatio: 2,
      backgroundColor: bg,
      cacheBust: true,
      skipFonts: false,
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

    const headerBarBg = "#7c3aed";
    const drawHeader = async (pageNum: number, totalPages: number) => {
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, pageW, headerH - 4, "F");
      // Title (may be Arabic) — rasterized for proper shaping/BiDi/RTL
      const titleIsRTL = containsRTLChars(title);
      await placeTextImage(
        pdf,
        title,
        titleIsRTL ? pageW - margin : margin,
        2,
        {
          fontSizePx: 16,
          color: "#ffffff",
          bg: headerBarBg,
          bold: true,
          maxWidthMM: pageW - margin * 2 - 70,
          align: titleIsRTL ? "right" : "left",
        },
      );
      const sub = `${t.pdfGenerated}: ${new Date().toLocaleString()}`;
      // Anchor subtitle on the opposite side from the title so they don't overlap.
      await placeTextImage(
        pdf,
        sub,
        titleIsRTL ? margin : pageW - margin,
        4,
        {
          fontSizePx: 9,
          color: "#ffffff",
          bg: headerBarBg,
          align: titleIsRTL ? "left" : "right",
        },
      );
      // Footer — page indicator (translated, may be Arabic) + ASCII brand
      const pageStr = `${t.page} ${pageNum} / ${totalPages}`;
      await placeTextImage(pdf, pageStr, pageW / 2, pageH - 7, {
        fontSizePx: 9,
        color: "#787878",
        align: "center",
      });
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("BSS - Marketing Toolkit", margin, pageH - 4);
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
      await drawHeader(i + 1, totalPages);
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

      // Cover page — solid purple background
      const coverBg = "#7c3aed";
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, pageW, pageH, "F");
      // Title (rasterized — handles Arabic shaping/BiDi/RTL)
      await placeTextImage(pdf, t.pdfTitle, pageW / 2, pageH / 2 - 18, {
        fontSizePx: 36,
        color: "#ffffff",
        bg: coverBg,
        bold: true,
        align: "center",
        maxWidthMM: pageW - 30,
      });
      await placeTextImage(pdf, t.marketingSubtitle, pageW / 2, pageH / 2 + 4, {
        fontSizePx: 14,
        color: "#ffffff",
        bg: coverBg,
        align: "center",
        maxWidthMM: pageW - 40,
      });
      await placeTextImage(
        pdf,
        `${t.pdfGenerated}: ${new Date().toLocaleString()}`,
        pageW / 2,
        pageH - 24,
        { fontSizePx: 11, color: "#ffffff", bg: coverBg, align: "center" },
      );
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("BSS - BlindSpot System", pageW / 2, pageH - 14, { align: "center" });
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
        const canvas = await htiToCanvas(el, {
          pixelRatio: 2,
          backgroundColor: bg,
          cacheBust: true,
          skipFonts: false,
        });
        const imgW = contentW;
        const pxPerMM = canvas.width / imgW;
        const pageContentPx = contentH * pxPerMM;
        const totalPages = Math.max(1, Math.ceil(canvas.height / pageContentPx));

        const headerBg = "#7c3aed";
        const titleIsRTL = containsRTLChars(s.title);
        const sub = `${t.pdfGenerated}: ${new Date().toLocaleString()}`;
        for (let i = 0; i < totalPages; i++) {
          if (!firstPage) pdf.addPage();
          firstPage = false;
          // Header bar
          pdf.setFillColor(124, 58, 237);
          pdf.rect(0, 0, pageW, headerH - 4, "F");
          // Title (rasterized — Arabic shaping/BiDi/RTL)
          await placeTextImage(
            pdf,
            s.title,
            titleIsRTL ? pageW - margin : margin,
            2,
            {
              fontSizePx: 15,
              color: "#ffffff",
              bg: headerBg,
              bold: true,
              maxWidthMM: pageW - margin * 2 - 70,
              align: titleIsRTL ? "right" : "left",
            },
          );
          await placeTextImage(
            pdf,
            sub,
            titleIsRTL ? margin : pageW - margin,
            4,
            {
              fontSizePx: 9,
              color: "#ffffff",
              bg: headerBg,
              align: titleIsRTL ? "left" : "right",
            },
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
          // Footer — page indicator (translated)
          await placeTextImage(
            pdf,
            `${s.title} — ${t.page} ${i + 1} / ${totalPages}`,
            pageW / 2,
            pageH - 7,
            { fontSizePx: 9, color: "#787878", align: "center" },
          );
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text("BSS - Marketing Toolkit", margin, pageH - 4);
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
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
          <TabsTrigger value="discounts" data-testid="tab-discounts" className="flex items-center gap-2 py-2">
            <Tag className="h-4 w-4" />
            <span>{t.discounts}</span>
          </TabsTrigger>
          <TabsTrigger value="broadcast" data-testid="tab-broadcast" className="flex items-center gap-2 py-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t.whatsappBroadcast}</span>
            <span className="sm:hidden">WA</span>
          </TabsTrigger>
          <TabsTrigger value="poster" data-testid="tab-poster" className="flex items-center gap-2 py-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.posterGenerator}</span>
            <span className="sm:hidden">Poster</span>
          </TabsTrigger>
          <TabsTrigger value="qr" data-testid="tab-qr" className="flex items-center gap-2 py-2">
            <QrCode className="h-4 w-4" />
            <span>{t.qrCodes}</span>
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
              <div className="flex gap-2 flex-wrap items-center">
                <Select value="" onValueChange={(v) => v && addProductFromMenu(v)}>
                  <SelectTrigger className="w-[220px] h-9" data-testid="select-menu-item">
                    <SelectValue placeholder={t.selectFromMenu} />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">{t.noMenuItems}</div>
                    ) : (
                      menuItems.map((mi) => (
                        <SelectItem key={mi.id} value={mi.id} data-testid={`option-menu-${mi.id}`}>
                          {mi.name} — {fmt(parseFloat(mi.price) || 0)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => removeProduct(p.id)}
                        data-testid={`button-remove-product-${p.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
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

          {/* Currency Toggle + Sponsorship Rate Estimator */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  {t.calcSponsorshipEstimator}
                </CardTitle>
                <CardDescription>
                  {t.calcSponsorshipDesc}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">{t.calcCurrency}</Label>
                <Select value={calcCurrency} onValueChange={(v) => setCalcCurrency(v as "SAR" | "USD")}>
                  <SelectTrigger className="w-24" data-testid="select-calc-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t.followers}</Label>
                  <Input
                    type="number"
                    value={calcSponsorFollowers}
                    onChange={(e) => setCalcSponsorFollowers(parseFloat(e.target.value) || 0)}
                    data-testid="input-sponsor-followers"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcEngagementRatePct}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calcSponsorEr}
                    onChange={(e) => setCalcSponsorEr(parseFloat(e.target.value) || 0)}
                    data-testid="input-sponsor-er"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {t.calcCpmLabel} ({calcCurrency})
                    <InfoTip>{t.calcCpmTooltip}</InfoTip>
                  </Label>
                  <Input
                    type="number"
                    value={calcCpm}
                    onChange={(e) => setCalcCpm(parseFloat(e.target.value) || 0)}
                    data-testid="input-sponsor-cpm"
                  />
                </div>
              </div>
              {(() => {
                const reach = calcSponsorFollowers * (calcSponsorEr / 100);
                const estPrice = (reach * calcCpm) / 1000;
                const lowPrice = estPrice * 0.7;
                const highPrice = estPrice * 1.3;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{t.calcEngagedReach}</div>
                      <div className="text-lg font-bold" data-testid="stat-sponsor-reach">{fmt(reach, 0)}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="text-xs text-muted-foreground">{t.calcSuggestedPrice}</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="stat-sponsor-price">
                        {fmt(estPrice, 0)} {calcCurrency}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{t.calcPriceMin}</div>
                      <div className="text-base font-semibold" data-testid="stat-sponsor-low">
                        {fmt(lowPrice, 0)} {calcCurrency}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{t.calcPriceMax}</div>
                      <div className="text-base font-semibold" data-testid="stat-sponsor-high">
                        {fmt(highPrice, 0)} {calcCurrency}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Cost & ROI Calculator (For Brands) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                {t.calcRoiTitle}
              </CardTitle>
              <CardDescription>
                {t.calcRoiDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">{t.calcCampaignCost} ({calcCurrency})</Label>
                  <Input
                    type="number"
                    value={roiInputs.cost}
                    onChange={(e) => setRoiInputs({ ...roiInputs, cost: parseFloat(e.target.value) || 0 })}
                    data-testid="input-roi-cost"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcImpressions}</Label>
                  <Input
                    type="number"
                    value={roiInputs.impressions}
                    onChange={(e) => setRoiInputs({ ...roiInputs, impressions: parseFloat(e.target.value) || 0 })}
                    data-testid="input-roi-impressions"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcEngagementsLabel}</Label>
                  <Input
                    type="number"
                    value={roiInputs.engagements}
                    onChange={(e) => setRoiInputs({ ...roiInputs, engagements: parseFloat(e.target.value) || 0 })}
                    data-testid="input-roi-engagements"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {t.calcAov} ({calcCurrency})
                    <InfoTip>{t.calcAovTooltip}</InfoTip>
                  </Label>
                  <Input
                    type="number"
                    value={roiInputs.aov}
                    onChange={(e) => setRoiInputs({ ...roiInputs, aov: parseFloat(e.target.value) || 0 })}
                    data-testid="input-roi-aov"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {t.calcConversionPct}
                    <InfoTip>{t.calcConversionTooltip}</InfoTip>
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={roiInputs.conversionRate}
                    onChange={(e) => setRoiInputs({ ...roiInputs, conversionRate: parseFloat(e.target.value) || 0 })}
                    data-testid="input-roi-conversion"
                  />
                </div>
              </div>
              {(() => {
                const cpe = roiInputs.engagements > 0 ? roiInputs.cost / roiInputs.engagements : 0;
                const cpm = roiInputs.impressions > 0 ? (roiInputs.cost / roiInputs.impressions) * 1000 : 0;
                const estSales = roiInputs.engagements * (roiInputs.conversionRate / 100);
                const estRevenue = estSales * roiInputs.aov;
                const profit = estRevenue - roiInputs.cost;
                const roi = roiInputs.cost > 0 ? (profit / roiInputs.cost) * 100 : 0;
                const roas = roiInputs.cost > 0 ? estRevenue / roiInputs.cost : 0;
                const roiPositive = roi >= 0;
                const chartData = [
                  { name: t.calcChartCost, value: roiInputs.cost },
                  { name: t.calcChartRevenue, value: estRevenue },
                  { name: t.calcChartProfit, value: profit },
                ];
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{t.calcCpe}</div>
                        <div className="text-lg font-bold" data-testid="stat-roi-cpe">{fmt(cpe, 3)} {calcCurrency}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{t.calcCpm}</div>
                        <div className="text-lg font-bold" data-testid="stat-roi-cpm">{fmt(cpm, 2)} {calcCurrency}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{t.calcEstSales}</div>
                        <div className="text-lg font-bold" data-testid="stat-roi-sales">{fmt(estSales, 0)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{t.calcEstRevenue}</div>
                        <div className="text-lg font-bold" data-testid="stat-roi-revenue">{fmt(estRevenue, 0)} {calcCurrency}</div>
                      </div>
                      <div className={`rounded-md border p-3 ${roiPositive ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                        <div className="text-xs text-muted-foreground">{t.calcRoi}</div>
                        <div className={`text-xl font-bold ${roiPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="stat-roi-roi">
                          {fmt(roi, 1)}%
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{t.calcRoas}</div>
                        <div className="text-lg font-bold" data-testid="stat-roi-roas">{fmt(roas, 2)}×</div>
                      </div>
                      <div className="rounded-md border p-3 col-span-2">
                        <div className="text-xs text-muted-foreground">{t.calcProfitLoss}</div>
                        <div className={`text-lg font-bold ${roiPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="stat-roi-profit">
                          {fmt(profit, 0)} {calcCurrency}
                        </div>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Influencer Earnings Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                {t.calcEarningsTitle}
              </CardTitle>
              <CardDescription>
                {t.calcEarningsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">{t.calcPricePerPost} ({calcCurrency})</Label>
                  <Input
                    type="number"
                    value={earningsInputs.pricePerPost}
                    onChange={(e) => setEarningsInputs({ ...earningsInputs, pricePerPost: parseFloat(e.target.value) || 0 })}
                    data-testid="input-earnings-price-post"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcPricePerStory} ({calcCurrency})</Label>
                  <Input
                    type="number"
                    value={earningsInputs.pricePerStory}
                    onChange={(e) => setEarningsInputs({ ...earningsInputs, pricePerStory: parseFloat(e.target.value) || 0 })}
                    data-testid="input-earnings-price-story"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcPostsPerMonth}</Label>
                  <Input
                    type="number"
                    value={earningsInputs.posts}
                    onChange={(e) => setEarningsInputs({ ...earningsInputs, posts: parseFloat(e.target.value) || 0 })}
                    data-testid="input-earnings-posts"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcStoriesPerMonth}</Label>
                  <Input
                    type="number"
                    value={earningsInputs.stories}
                    onChange={(e) => setEarningsInputs({ ...earningsInputs, stories: parseFloat(e.target.value) || 0 })}
                    data-testid="input-earnings-stories"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.calcAffiliatePerMonth} ({calcCurrency})</Label>
                  <Input
                    type="number"
                    value={earningsInputs.affiliateRevenue}
                    onChange={(e) => setEarningsInputs({ ...earningsInputs, affiliateRevenue: parseFloat(e.target.value) || 0 })}
                    data-testid="input-earnings-affiliate"
                  />
                </div>
              </div>
              {(() => {
                const postRev = earningsInputs.pricePerPost * earningsInputs.posts;
                const storyRev = earningsInputs.pricePerStory * earningsInputs.stories;
                const monthly = postRev + storyRev + earningsInputs.affiliateRevenue;
                const yearly = monthly * 12;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{t.calcPostsRevenue}</div>
                      <div className="text-lg font-bold" data-testid="stat-earnings-posts">{fmt(postRev, 0)} {calcCurrency}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{t.calcStoriesRevenue}</div>
                      <div className="text-lg font-bold" data-testid="stat-earnings-stories">{fmt(storyRev, 0)} {calcCurrency}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-purple-50 dark:bg-purple-950/30">
                      <div className="text-xs text-muted-foreground">{t.calcMonthlyTotal}</div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-earnings-monthly">
                        {fmt(monthly, 0)} {calcCurrency}
                      </div>
                    </div>
                    <div className="rounded-md border p-3 bg-indigo-50 dark:bg-indigo-950/30">
                      <div className="text-xs text-muted-foreground">{t.calcYearlyProjection}</div>
                      <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400" data-testid="stat-earnings-yearly">
                        {fmt(yearly, 0)} {calcCurrency}
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Delete"
                                    onClick={() => removeInfluencer(r.id)}
                                    data-testid={`button-remove-influencer-${r.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              onClick={() => deleteBloggerFile(b.id)}
                              data-testid={`button-delete-blogger-${b.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===================== Discounts ===================== */}
        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-violet-500" />
                {t.discountCodes}
              </CardTitle>
              <CardDescription>{t.discountCodesDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <Label>{t.code}</Label>
                  <Input
                    data-testid="input-discount-code"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                  />
                </div>
                <div>
                  <Label>{t.discountType}</Label>
                  <Select
                    value={discountForm.discountType}
                    onValueChange={(v) => setDiscountForm({ ...discountForm, discountType: v as any })}
                  >
                    <SelectTrigger data-testid="select-discount-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">{t.percent}</SelectItem>
                      <SelectItem value="fixed">{t.fixedAmount}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.value}</Label>
                  <Input
                    data-testid="input-discount-value"
                    type="number"
                    min="0"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.expiresAt}</Label>
                  <Input
                    data-testid="input-discount-expires"
                    type="date"
                    value={discountForm.expiresAt}
                    onChange={(e) => setDiscountForm({ ...discountForm, expiresAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.usageCap}</Label>
                  <Input
                    data-testid="input-discount-cap"
                    type="number"
                    min="0"
                    value={discountForm.usageCap}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageCap: e.target.value })}
                  />
                </div>
              </div>
              <Button
                data-testid="button-create-discount"
                onClick={() =>
                  createDiscount.mutate({
                    code: discountForm.code.trim(),
                    discountType: discountForm.discountType,
                    discountValue: String(Number(discountForm.value) || 0),
                    expiresAt: discountForm.expiresAt || null,
                    usageCap: discountForm.usageCap ? Number(discountForm.usageCap) : null,
                    active: true,
                  })
                }
                disabled={createDiscount.isPending || !discountForm.code.trim() || !discountForm.value}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.createCode}
              </Button>

              {discountCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noDiscountCodes}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.code}</TableHead>
                      <TableHead>{t.discountType}</TableHead>
                      <TableHead>{t.value}</TableHead>
                      <TableHead>{t.expiresAt}</TableHead>
                      <TableHead>{t.used} / {t.usageCap}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountCodes.map((c) => (
                      <TableRow key={c.id} data-testid={`row-discount-${c.id}`}>
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            <span data-testid={`text-code-${c.id}`}>{c.code}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Copy"
                                  data-testid={`button-copy-${c.id}`}
                                  onClick={() => copyToClipboard(c.code, t.copied)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell>{c.discountType === "percent" ? t.percent : t.fixedAmount}</TableCell>
                        <TableCell>{c.discountType === "percent" ? `${c.discountValue}%` : c.discountValue}</TableCell>
                        <TableCell>
                          {c.expiresAt ? new Date(c.expiresAt as any).toLocaleDateString() : t.noExpiry}
                        </TableCell>
                        <TableCell>
                          {(c.usageCount ?? 0)} / {c.usageCap ?? t.noLimit}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Delete"
                                data-testid={`button-delete-discount-${c.id}`}
                                onClick={() => deleteDiscount.mutate(c.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== WhatsApp Broadcast ===================== */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                {t.whatsappBroadcast}
              </CardTitle>
              <CardDescription>{t.broadcastDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>{t.templateName}</Label>
                  <Input
                    data-testid="input-template-name"
                    value={tplForm.name}
                    onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.segment}</Label>
                  <Select
                    value={tplForm.segment}
                    onValueChange={(v) => setTplForm({ ...tplForm, segment: v as any })}
                  >
                    <SelectTrigger data-testid="select-segment"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.segmentAll}</SelectItem>
                      <SelectItem value="recent">{t.segmentRecent}</SelectItem>
                      <SelectItem value="subscribers">{t.segmentSubscribers}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>{t.messageBody}</Label>
                  <Textarea
                    data-testid="input-template-message"
                    rows={4}
                    value={tplForm.message}
                    onChange={(e) => setTplForm({ ...tplForm, message: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>{t.menuPdfUrlOptional}</Label>
                  <Input
                    data-testid="input-template-url"
                    value={tplForm.menuPdfUrl}
                    onChange={(e) => setTplForm({ ...tplForm, menuPdfUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Button
                data-testid="button-save-template"
                onClick={() =>
                  saveTemplate.mutate({
                    name: tplForm.name.trim(),
                    segment: tplForm.segment,
                    message: tplForm.message.trim(),
                    menuPdfUrl: tplForm.menuPdfUrl.trim() || null,
                  })
                }
                disabled={saveTemplate.isPending || !tplForm.name.trim() || !tplForm.message.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.saveTemplate}
              </Button>

              {broadcastTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noTemplates}</p>
              ) : (
                <div className="space-y-2">
                  {broadcastTemplates.map((tpl) => (
                    <Card key={tpl.id} data-testid={`row-template-${tpl.id}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl.segment === "all" ? t.segmentAll : tpl.segment === "recent" ? t.segmentRecent : t.segmentSubscribers}
                            </p>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{tpl.message}</p>
                            {tpl.menuPdfUrl ? (
                              <p className="text-xs text-muted-foreground mt-1 break-all">{tpl.menuPdfUrl}</p>
                            ) : null}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-load-template-${tpl.id}`}
                              onClick={() => setActiveBroadcastId(tpl.id)}
                            >
                              {t.generateLinks}
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Delete"
                                  data-testid={`button-delete-template-${tpl.id}`}
                                  onClick={() => deleteTemplate.mutate(tpl.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeBroadcastId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
                      <span>{t.recipients} ({broadcastRecipients.length})</span>
                      {broadcastRecipients.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid="button-open-all"
                          onClick={() => {
                            const tpl = broadcastTemplates.find((b) => b.id === activeBroadcastId);
                            if (!tpl) return;
                            const msg = `${tpl.message}${tpl.menuPdfUrl ? `\n${tpl.menuPdfUrl}` : ""}`;
                            broadcastRecipients.slice(0, 20).forEach((r) => {
                              window.open(buildWaLink(r.phone, msg), "_blank");
                            });
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {t.openAllRecipients}
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {broadcastRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.noRecipients}</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {broadcastRecipients.map((r, i) => {
                          const tpl = broadcastTemplates.find((b) => b.id === activeBroadcastId)!;
                          const msg = `${tpl.message}${tpl.menuPdfUrl ? `\n${tpl.menuPdfUrl}` : ""}`;
                          const link = buildWaLink(r.phone, msg);
                          return (
                            <div
                              key={`${r.phone}-${i}`}
                              data-testid={`row-recipient-${i}`}
                              className="flex items-center justify-between gap-2 p-2 rounded-md border"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{r.name || r.phone}</p>
                                <p className="text-xs text-muted-foreground">{r.phone}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-wa-${i}`}
                                  onClick={() => window.open(link, "_blank")}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  {t.openWhatsApp}
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      aria-label="Copy link"
                                      data-testid={`button-copy-link-${i}`}
                                      onClick={() => copyToClipboard(link, t.linkCopied)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy link</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== Poster Generator ===================== */}
        <TabsContent value="poster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-violet-500" />
                {t.posterGenerator}
              </CardTitle>
              <CardDescription>{t.posterDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>{t.posterTitle}</Label>
                    <Input
                      data-testid="input-poster-title"
                      value={posterForm.title}
                      onChange={(e) => setPosterForm({ ...posterForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t.posterBody}</Label>
                    <Textarea
                      data-testid="input-poster-body"
                      rows={4}
                      value={posterForm.body}
                      onChange={(e) => setPosterForm({ ...posterForm, body: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t.posterPrice}</Label>
                      <Input
                        data-testid="input-poster-price"
                        value={posterForm.price}
                        onChange={(e) => setPosterForm({ ...posterForm, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t.accentColor}</Label>
                      <Input
                        data-testid="input-poster-color"
                        type="color"
                        value={posterForm.accentColor}
                        onChange={(e) => setPosterForm({ ...posterForm, accentColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.posterImage}</Label>
                    <Input
                      data-testid="input-poster-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePosterImage(e.target.files?.[0] || null)}
                    />
                    {posterForm.imageDataUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1"
                        data-testid="button-remove-poster-image"
                        onClick={() => setPosterForm({ ...posterForm, imageDataUrl: "" })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t.removeImage}
                      </Button>
                    )}
                  </div>
                  <Button
                    data-testid="button-generate-poster"
                    onClick={generatePoster}
                    disabled={posterBusy || !posterForm.title.trim()}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {posterBusy ? t.generatingPoster : t.generatePoster}
                  </Button>
                </div>
                <div className="border rounded-md p-4 bg-muted/30 min-h-[400px]">
                  <div
                    className="aspect-[1/1.414] rounded-md p-6 flex flex-col gap-3 text-white"
                    style={{ background: `linear-gradient(135deg, ${posterForm.accentColor}, #1f2937)` }}
                    data-testid="preview-poster"
                  >
                    <p className="text-2xl font-bold">{posterForm.title || t.posterTitle}</p>
                    {posterForm.imageDataUrl && (
                      <img
                        src={posterForm.imageDataUrl}
                        alt=""
                        className="rounded-md object-cover max-h-48 w-full"
                      />
                    )}
                    <p className="text-sm opacity-90 whitespace-pre-wrap">{posterForm.body}</p>
                    {posterForm.price && (
                      <p className="text-3xl font-bold mt-auto">{posterForm.price}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== QR Codes ===================== */}
        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-violet-500" />
                {t.qrCodes}
              </CardTitle>
              <CardDescription>{t.qrCodesDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label>{t.qrUrl}</Label>
                  <Input
                    data-testid="input-qr-url"
                    value={qrForm.url}
                    placeholder={t.qrUrlPlaceholder}
                    onChange={(e) => setQrForm({ ...qrForm, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.qrSize}</Label>
                  <Select
                    value={String(qrForm.size)}
                    onValueChange={(v) => setQrForm({ ...qrForm, size: Number(v) })}
                  >
                    <SelectTrigger data-testid="select-qr-size"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256">256 px</SelectItem>
                      <SelectItem value="512">512 px</SelectItem>
                      <SelectItem value="1024">1024 px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>{t.qrLabel}</Label>
                  <Input
                    data-testid="input-qr-label"
                    value={qrForm.label}
                    placeholder={t.qrLabelPlaceholder}
                    onChange={(e) => setQrForm({ ...qrForm, label: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button data-testid="button-generate-qr" onClick={generateQr} disabled={!qrForm.url.trim()}>
                  <QrCode className="h-4 w-4 mr-1" />
                  {t.generateQr}
                </Button>
                {qrDataUrl && (
                  <Button variant="outline" data-testid="button-download-qr" onClick={downloadQr}>
                    <Download className="h-4 w-4 mr-1" />
                    {t.downloadQr}
                  </Button>
                )}
              </div>
              {qrDataUrl && (
                <div className="border rounded-md p-6 inline-flex flex-col items-center gap-2 bg-white">
                  <img src={qrDataUrl} alt="QR code" className="w-64 h-64" data-testid="img-qr-preview" />
                  {qrForm.label && <p className="text-sm font-medium text-black">{qrForm.label}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
