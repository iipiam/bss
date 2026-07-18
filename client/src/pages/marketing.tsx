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
import { useAuth } from "@/lib/auth";
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
  InfluencerProfile,
  MarketingFinSnapshot,
  MarketingFinScenario,
} from "@shared/schema";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { AlertTriangle, Save, ShieldAlert, Search, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import { toCanvas as htiToCanvas } from "html-to-image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useBusinessType } from "@/hooks/useBusinessType";
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

  // Tenant-scoped localStorage key so different accounts on the same browser
  // never see each other's marketing data.
  const { user: _mktUser } = useAuth();
  const mktLsKey = `${LS_KEY}__${_mktUser?.restaurantId || _mktUser?.id || 'anon'}`;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(mktLsKey);
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
        mktLsKey,
        JSON.stringify({
          products, swot, canvas, influencers, bloggerFiles,
          calcCurrency, calcCpm, calcSponsorFollowers, calcSponsorEr, roiInputs, earningsInputs,
        })
      );
    } catch {}
  }, [products, swot, canvas, influencers, bloggerFiles, calcCurrency, calcCpm, calcSponsorFollowers, calcSponsorEr, roiInputs, earningsInputs]);

  // ---- Business-type-aware cost data from BSS ----
  // Restaurant → menu items; Factory → products (same API, different labels);
  // Service businesses → service catalog; Real estate → properties.
  const { isRestaurant, isFactory, isRealEstate, isServiceBusiness } = useBusinessType();
  const usesMenu = isRestaurant || isFactory;
  const { data: menuItems = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/menu"], enabled: usesMenu });
  const { data: serviceProductsList = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/service-products"],
    enabled: isServiceBusiness,
  });
  const { data: propertiesList = [] } = useQuery<Array<{ id: string; name: string; purchasePrice: number | null; currentValue: number | null }>>({
    queryKey: ["/api/properties"],
    enabled: isRealEstate,
  });
  const { data: recipes = [] } = useQuery<Recipe[]>({ queryKey: ["/api/recipes"], enabled: usesMenu });
  const { data: inventory = [] } = useQuery<InventoryItem[]>({ queryKey: ["/api/inventory"], enabled: usesMenu });
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

  // ---- QR scan tracking + blogger commission tiers ----
  const { data: qrScanStats = [] } = useQuery<Array<{ targetType: string; targetId: string; count: number }>>({
    queryKey: ["/api/marketing/qr-scans/stats"],
  });
  const { data: allCommissionTiers = [] } = useQuery<Array<{ id: string; bloggerId: string; fromScans: number; toScans: number | null; ratePerScan: string; sortOrder: number }>>({
    queryKey: ["/api/marketing/commission-tiers"],
  });
  const scanCountFor = (targetType: string, targetId: string) =>
    qrScanStats.find((s) => s.targetType === targetType && s.targetId === targetId)?.count ?? 0;

  // Cumulative commission: e.g. tiers 1-20 @ 1 SAR, 21-50 @ 2 SAR
  const commissionFor = (bloggerId: string, scans: number) => {
    const tiers = allCommissionTiers
      .filter((tr) => tr.bloggerId === bloggerId)
      .sort((a, b) => a.fromScans - b.fromScans);
    let total = 0;
    for (const tier of tiers) {
      if (scans < tier.fromScans) break;
      const upper = tier.toScans === null ? scans : Math.min(scans, tier.toScans);
      const n = upper - tier.fromScans + 1;
      if (n > 0) total += n * parseFloat(tier.ratePerScan || "0");
    }
    return total;
  };

  const downloadQrPng = async (payload: string, filename: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      toast({ title: t.error, description: e?.message || "Failed to generate QR", variant: "destructive" });
    }
  };

  // Tier editor dialog
  const [tierDialogBlogger, setTierDialogBlogger] = useState<{ id: string; name: string } | null>(null);
  const [tierRows, setTierRows] = useState<Array<{ fromScans: string; toScans: string; ratePerScan: string }>>([]);
  const openTierEditor = (blogger: { id: string; name: string }) => {
    const existing = allCommissionTiers
      .filter((tr) => tr.bloggerId === blogger.id)
      .sort((a, b) => a.fromScans - b.fromScans);
    setTierRows(
      existing.length > 0
        ? existing.map((tr) => ({
            fromScans: String(tr.fromScans),
            toScans: tr.toScans === null ? "" : String(tr.toScans),
            ratePerScan: tr.ratePerScan,
          }))
        : [{ fromScans: "1", toScans: "", ratePerScan: "" }],
    );
    setTierDialogBlogger(blogger);
  };
  const saveTiersMutation = useMutation({
    mutationFn: async () => {
      if (!tierDialogBlogger) return;
      const tiers = tierRows
        .filter((r) => r.fromScans !== "" && r.ratePerScan !== "")
        .map((r) => ({
          fromScans: Math.max(1, Math.round(Number(r.fromScans) || 1)),
          toScans: r.toScans === "" ? null : Math.max(1, Math.round(Number(r.toScans) || 1)),
          ratePerScan: String(Number(r.ratePerScan) || 0),
        }));
      return apiRequest("PUT", `/api/marketing/blogger-profiles/${tierDialogBlogger.id}/commission-tiers`, { tiers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/commission-tiers"] });
      setTierDialogBlogger(null);
      toast({ title: "Commission tiers saved" });
    },
    onError: (e: any) => {
      let message = e?.message || "Failed to save tiers";
      try {
        const parsed = JSON.parse(String(message).replace(/^\d+:\s*/, ""));
        if (parsed?.error) message = parsed.error;
      } catch {}
      toast({ title: t.error, description: message, variant: "destructive" });
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

  // ===== Fake Followers Detector =====
  const emptyFakeForm = () => ({
    username: "",
    platform: "Instagram",
    followers: 10000,
    following: 500,
    avgLikes: 300,
    avgComments: 20,
    posts: 100,
    growth30d: 500,
    genericCommentsPct: 20,
    notes: "",
  });
  const [fakeForm, setFakeForm] = useState(emptyFakeForm());
  const { data: influencerProfiles = [] } = useQuery<InfluencerProfile[]>({
    queryKey: ["/api/marketing/influencer-profiles"],
  });
  const computeFake = (f: typeof fakeForm) => {
    const er = f.followers > 0 ? ((f.avgLikes + f.avgComments) / f.followers) * 100 : 0;
    const followRatio = f.followers > 0 ? f.following / f.followers : 0;
    const growthRate = f.followers > 0 ? (f.growth30d / f.followers) * 100 : 0;
    const flags: string[] = [];
    let fakePct = 0;
    if (er < 2) { fakePct += 30; flags.push(isRTL ? "تفاعل منخفض (<2%)" : "Low engagement (<2%)"); }
    if (followRatio > 1.5) { fakePct += 20; flags.push(isRTL ? "نسبة متابعة/متابعين عالية" : "High following/followers ratio"); }
    if (growthRate > 15) { fakePct += 25; flags.push(isRTL ? "نمو مفاجئ (>15% / 30 يوم)" : "Sudden growth (>15% / 30d)"); }
    if (f.genericCommentsPct > 40) { fakePct += 15; flags.push(isRTL ? "تعليقات عامة كثيرة" : "Many generic comments"); }
    fakePct = Math.min(100, fakePct);
    const qualityScore = Math.max(0, Math.round(100 - fakePct));
    const status: "good" | "review" | "reject" = fakePct < 15 ? "good" : fakePct <= 30 ? "review" : "reject";
    return { er, fakePct, qualityScore, status, flags };
  };
  const fakeResult = useMemo(() => computeFake(fakeForm), [fakeForm, isRTL]);
  const fakeColor = (p: number) => p > 30 ? "text-red-600" : p >= 15 ? "text-yellow-600" : "text-green-600";
  const fakeBg = (s: string) => s === "good" ? "bg-green-600" : s === "reject" ? "bg-red-600" : "bg-yellow-600";

  const saveInfluencer = useMutation({
    mutationFn: async () => {
      const r = computeFake(fakeForm);
      return apiRequest("POST", "/api/marketing/influencer-profiles", {
        ...fakeForm,
        genericCommentsPct: String(fakeForm.genericCommentsPct),
        fakePct: String(r.fakePct.toFixed(2)),
        qualityScore: r.qualityScore,
        status: r.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/influencer-profiles"] });
      toast({ title: isRTL ? "تم الحفظ" : "Saved" });
      setFakeForm(emptyFakeForm());
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });
  const deleteInfluencer = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/marketing/influencer-profiles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/marketing/influencer-profiles"] }),
  });

  const avgFakeAll = influencerProfiles.length
    ? influencerProfiles.reduce((s, i) => s + Number(i.fakePct || 0), 0) / influencerProfiles.length
    : 0;

  const exportInfluencerCsv = () => {
    const headers = ["Username", "Platform", "Followers", "Following", "AvgLikes", "AvgComments", "Posts", "Growth30d", "GenericCommentsPct", "FakePct", "QualityScore", "Status", "Notes"];
    const rows = influencerProfiles.map(i => [
      i.username, i.platform, i.followers, i.following, i.avgLikes, i.avgComments, i.posts, i.growth30d,
      i.genericCommentsPct, i.fakePct, i.qualityScore, i.status, (i.notes || "").replace(/[\r\n,]/g, " "),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `influencers_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
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

  // Snapshot adapts to business type:
  // - Restaurant/Factory: avg selling price + avg variable cost from menu/products
  // - Real estate: avg current value + avg purchase price from properties
  // - Service businesses: catalog count only (no per-unit price in the catalog)
  const currentSnapshot = useMemo(() => {
    if (isRealEstate) {
      if (propertiesList.length === 0) {
        return { avgSellingPrice: 0, avgVariableCost: 0, count: 0 };
      }
      let valueSum = 0;
      let purchaseSum = 0;
      for (const p of propertiesList) {
        valueSum += Number(p.currentValue) || 0;
        purchaseSum += Number(p.purchasePrice) || 0;
      }
      return {
        avgSellingPrice: valueSum / propertiesList.length,
        avgVariableCost: purchaseSum / propertiesList.length,
        count: propertiesList.length,
      };
    }
    if (isServiceBusiness) {
      return { avgSellingPrice: 0, avgVariableCost: 0, count: serviceProductsList.length };
    }
    if (menuItems.length === 0) {
      return { avgSellingPrice: 0, avgVariableCost: 0, count: 0 };
    }
    let priceSum = 0;
    let costSum = 0;
    for (const mi of menuItems) {
      priceSum += parseFloat(mi.price) || 0;
      costSum += computeVariableCost(mi);
    }
    return {
      avgSellingPrice: priceSum / menuItems.length,
      avgVariableCost: costSum / menuItems.length,
      count: menuItems.length,
    };
  }, [menuItems, recipes, inventory, isRealEstate, isServiceBusiness, propertiesList, serviceProductsList]);

  // Business-type-aware labels for the financial snapshot
  const finSnapshotDesc = isRealEstate
    ? t.currentSnapshotDescRealEstate
    : isServiceBusiness
      ? t.currentSnapshotDescServices
      : isFactory
        ? t.currentSnapshotDescProducts
        : t.currentSnapshotDesc;
  const finBasedOnLabel = (n: number) =>
    (isRealEstate
      ? t.basedOnProperties
      : isServiceBusiness
        ? t.basedOnCatalogProducts
        : isFactory
          ? t.basedOnProducts
          : t.basedOnMenuItems
    ).replace("{n}", String(n));
  const finAvgPriceLabel = isRealEstate ? t.avgPropertyValue : t.avgSellingPriceUnit;
  const finAvgCostLabel = isRealEstate ? t.avgPurchasePrice : t.avgVariableCostUnit;

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

  const addProductFromCatalog = async (productId: string) => {
    const sp = serviceProductsList.find((p) => p.id === productId);
    if (!sp) return;
    try {
      const res = await apiRequest("GET", `/api/service-products/${productId}`);
      const detail = await res.json();
      const itemsTotal = (detail.items || []).reduce(
        (s: number, it: any) => s + (parseFloat(it.cost || "0") || 0),
        0,
      );
      const servicesTotal = (detail.services || []).reduce((s: number, sv: any) => {
        const qty = parseFloat(sv.quantity || "1") || 1;
        const unit = parseFloat(sv.unitPrice || "0") || 0;
        return s + qty * unit;
      }, 0);
      const variableCost = itemsTotal + servicesTotal;
      const linked: FinProduct = {
        id: crypto.randomUUID(),
        name: sp.name,
        sellingPrice: Math.round(variableCost * 1.5),
        variableCost: Math.round(variableCost),
        fixedCosts: Math.round(monthlyFixedCosts),
        initialCapital: 20000,
        monthlyUnits: 100,
        growthRate: 5,
      };
      setProducts((arr) => [...arr, linked]);
      toast({ title: t.linkedFromCatalogToast, description: sp.name });
    } catch (e: any) {
      toast({ title: t.error, description: String(e?.message || e), variant: "destructive" });
    }
  };

  const addProductFromProperty = async (propertyId: string) => {
    const prop = propertiesList.find((p) => p.id === propertyId);
    if (!prop) return;
    try {
      const res = await apiRequest("GET", `/api/properties/${propertyId}`);
      const detail = await res.json();
      const units: Array<{ monthlyRent?: number }> = detail.units || [];
      const rentSum = units.reduce((s, u) => s + (Number(u.monthlyRent) || 0), 0);
      const avgRent = units.length > 0 ? rentSum / units.length : 0;
      const linked: FinProduct = {
        id: crypto.randomUUID(),
        name: prop.name,
        sellingPrice: Math.round(avgRent),
        variableCost: 0,
        fixedCosts: Math.round(monthlyFixedCosts),
        initialCapital: Number(detail.purchasePrice) || Number(detail.currentValue) || 20000,
        monthlyUnits: units.length || 1,
        growthRate: 2,
      };
      setProducts((arr) => [...arr, linked]);
      toast({ title: t.linkedFromPropertyToast, description: prop.name });
    } catch (e: any) {
      toast({ title: t.error, description: String(e?.message || e), variant: "destructive" });
    }
  };

  // ---- Financial model ----
  const computed = useMemo(() => products.map((p) => ({ p, calc: computeFin(p) })), [products]);

  const updateProduct = (id: string, patch: Partial<FinProduct>) =>
    setProducts((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removeProduct = (id: string) =>
    setProducts((arr) => (arr.length > 1 ? arr.filter((p) => p.id !== id) : arr));

  // ===== Business & Financial Analysis upgrades =====
  const finTabActive = activeTab === "financial";
  const { data: finActuals } = useQuery<{ periodDays: number; items: Array<{ name: string; units: number; revenue: number }> }>({
    queryKey: ["/api/marketing/fin/actuals"],
    enabled: finTabActive,
  });
  const { data: finFixedCosts } = useQuery<{ total: number; bills: number; salaries: number; billsCount: number; salariesCount: number }>({
    queryKey: ["/api/marketing/fin/fixed-costs"],
    enabled: finTabActive,
  });
  const { data: finSnapshotsList = [] } = useQuery<MarketingFinSnapshot[]>({
    queryKey: ["/api/marketing/fin/snapshots"],
    enabled: finTabActive,
  });
  const { data: finScenariosList = [] } = useQuery<MarketingFinScenario[]>({
    queryKey: ["/api/marketing/fin/scenarios"],
    enabled: finTabActive,
  });
  const { data: finSettings } = useQuery<{ minMarginPct: string; maxBreakEvenUnits: string; alertsEnabled: boolean }>({
    queryKey: ["/api/marketing/fin/settings"],
    enabled: finTabActive,
  });

  const actualFor = (name: string) =>
    (finActuals?.items || []).find((a) => a.name.trim().toLowerCase() === name.trim().toLowerCase());

  const autoFillFixedCosts = () => {
    if (!finFixedCosts || finFixedCosts.total <= 0) return;
    const total = Math.round(finFixedCosts.total);
    setProducts((arr) => arr.map((p) => ({ ...p, fixedCosts: total })));
    toast({
      title: t.finAutoFilledToast,
      description: `${t.finFromBills}: ${fmt(finFixedCosts.bills)} (${finFixedCosts.billsCount}) • ${t.finFromSalaries}: ${fmt(finFixedCosts.salaries)} (${finFixedCosts.salariesCount})`,
    });
  };

  // What-if sliders (percent adjustments, applied to a selected product)
  const [whatIfProductId, setWhatIfProductId] = useState<string>("");
  const [whatIf, setWhatIf] = useState({ price: 0, varCost: 0, fixed: 0, volume: 0 });
  const whatIfProduct = products.find((p) => p.id === whatIfProductId) || products[0];
  const whatIfCalc = useMemo(() => {
    if (!whatIfProduct) return null;
    const adj: FinProduct = {
      ...whatIfProduct,
      sellingPrice: whatIfProduct.sellingPrice * (1 + whatIf.price / 100),
      variableCost: whatIfProduct.variableCost * (1 + whatIf.varCost / 100),
      fixedCosts: whatIfProduct.fixedCosts * (1 + whatIf.fixed / 100),
      monthlyUnits: whatIfProduct.monthlyUnits * (1 + whatIf.volume / 100),
    };
    return { base: computeFin(whatIfProduct), adj: computeFin(adj) };
  }, [whatIfProduct, whatIf]);

  // Target profit pricing
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [targetProfit, setTargetProfit] = useState<number>(10000);
  const targetProduct = products.find((p) => p.id === targetProductId) || products[0];
  const targetCalc = useMemo(() => {
    if (!targetProduct) return null;
    // Required price at current volume: (target + fixed + varCost*units) / units
    const units = targetProduct.monthlyUnits;
    const requiredPrice = units > 0 ? (targetProfit + targetProduct.fixedCosts + targetProduct.variableCost * units) / units : NaN;
    // Required volume at current price: (target + fixed) / contribution
    const contribution = targetProduct.sellingPrice - targetProduct.variableCost;
    const requiredVolume = contribution > 0 ? (targetProfit + targetProduct.fixedCosts) / contribution : NaN;
    return { requiredPrice, requiredVolume };
  }, [targetProduct, targetProfit]);

  // Scenarios
  const [scenarioName, setScenarioName] = useState("");
  const [activeScenarioName, setActiveScenarioName] = useState<string | null>(null);
  const saveScenarioMut = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/marketing/fin/scenarios", { name: scenarioName.trim(), data: products }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/fin/scenarios"] });
      toast({ title: t.finScenarioSavedToast });
      setScenarioName("");
    },
    onError: (e: any) => toast({ title: t.error, description: String(e?.message || e), variant: "destructive" }),
  });
  const deleteScenarioMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/marketing/fin/scenarios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/marketing/fin/scenarios"] }),
  });
  const loadScenario = (sc: MarketingFinScenario) => {
    const data = sc.data as unknown as FinProduct[];
    if (Array.isArray(data) && data.length) {
      setProducts(data);
      setActiveScenarioName(sc.name);
      toast({ title: t.finScenarioLoadedToast, description: sc.name });
    }
  };
  const scenarioSummary = (sc: MarketingFinScenario) => {
    const data = (sc.data as unknown as FinProduct[]) || [];
    let profit = 0;
    let marginSum = 0;
    for (const p of data) {
      const c = computeFin(p);
      profit += c.monthlyProfit;
      marginSum += c.grossMarginPct;
    }
    return { profit, avgMargin: data.length ? marginSum / data.length : 0, count: data.length };
  };

  // Snapshots
  const saveSnapshotMut = useMutation({
    mutationFn: async () => {
      for (const { p, calc } of computed) {
        await apiRequest("POST", "/api/marketing/fin/snapshots", {
          productName: p.name,
          grossMarginPct: String(Math.round(calc.grossMarginPct * 100) / 100),
          breakEvenUnits: String(Math.round(calc.breakEvenUnits)),
          breakEvenRevenue: String(Math.round(calc.breakEvenRevenue * 100) / 100),
          monthlyProfit: String(Math.round(calc.monthlyProfit * 100) / 100),
          roiPct: String(Math.round(calc.roiPct * 100) / 100),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/fin/snapshots"] });
      toast({ title: t.finSnapshotSavedToast });
    },
    onError: (e: any) => toast({ title: t.error, description: String(e?.message || e), variant: "destructive" }),
  });
  const deleteSnapshotMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/marketing/fin/snapshots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/marketing/fin/snapshots"] }),
  });
  const [trendProduct, setTrendProduct] = useState<string>("");
  const snapshotProductNames = useMemo(
    () => Array.from(new Set(finSnapshotsList.map((s) => s.productName))),
    [finSnapshotsList],
  );
  const trendData = useMemo(() => {
    const name = trendProduct || snapshotProductNames[0];
    if (!name) return [];
    return finSnapshotsList
      .filter((s) => s.productName === name)
      .sort((a, b) => new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime())
      .map((s) => ({
        date: new Date(s.createdAt as any).toLocaleDateString(),
        profit: parseFloat(s.monthlyProfit) || 0,
        margin: parseFloat(s.grossMarginPct) || 0,
      }));
  }, [finSnapshotsList, trendProduct, snapshotProductNames]);

  // Alert thresholds
  const [thresholdForm, setThresholdForm] = useState({ minMarginPct: "20", maxBreakEvenUnits: "1000", alertsEnabled: true });
  useEffect(() => {
    if (finSettings) {
      setThresholdForm({
        minMarginPct: String(parseFloat(finSettings.minMarginPct) || 20),
        maxBreakEvenUnits: String(parseFloat(finSettings.maxBreakEvenUnits) || 1000),
        alertsEnabled: finSettings.alertsEnabled !== false,
      });
    }
  }, [finSettings]);
  const saveThresholdsMut = useMutation({
    mutationFn: async () =>
      apiRequest("PUT", "/api/marketing/fin/settings", {
        minMarginPct: parseFloat(thresholdForm.minMarginPct) || 0,
        maxBreakEvenUnits: parseFloat(thresholdForm.maxBreakEvenUnits) || 0,
        alertsEnabled: thresholdForm.alertsEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/fin/settings"] });
      toast({ title: t.finThresholdsSavedToast });
    },
    onError: (e: any) => toast({ title: t.error, description: String(e?.message || e), variant: "destructive" }),
  });
  const finAlerts = useMemo(() => {
    if (!thresholdForm.alertsEnabled) return [];
    const minMargin = parseFloat(thresholdForm.minMarginPct) || 0;
    const maxBE = parseFloat(thresholdForm.maxBreakEvenUnits) || Infinity;
    const list: Array<{ product: string; message: string }> = [];
    for (const { p, calc } of computed) {
      if (calc.grossMarginPct < minMargin) {
        list.push({ product: p.name, message: `${t.finAlertLowMargin} (${fmt(calc.grossMarginPct)}% < ${minMargin}%)` });
      }
      if (maxBE > 0 && isFinite(maxBE) && calc.breakEvenUnits > maxBE) {
        list.push({ product: p.name, message: `${t.finAlertHighBreakEven} (${fmt(calc.breakEvenUnits, 0)} > ${maxBE})` });
      }
    }
    return list;
  }, [computed, thresholdForm, t]);

  // Investor summary totals
  const finTotals = useMemo(() => {
    let profit = 0;
    let marginSum = 0;
    for (const { calc } of computed) {
      profit += calc.monthlyProfit;
      marginSum += calc.grossMarginPct;
    }
    return { profit, avgMargin: computed.length ? marginSum / computed.length : 0 };
  }, [computed]);

  const downloadInvestorPDF = async () => {
    setActiveTab("financial");
    await wait(450);
    const el = document.getElementById("pdf-section-investor");
    if (!el) return;
    try {
      await captureElementToPDF(el, `investor_summary_${Date.now()}.pdf`, t.finInvestorSummary);
    } catch (err: any) {
      toast({ title: t.error, description: String(err?.message || err) });
    }
  };

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

  // ---- Blogger Files (DB-backed, tenant-isolated) ----
  const { data: dbBloggers = [] } = useQuery<BloggerFile[]>({
    queryKey: ["/api/marketing/blogger-profiles"],
  });
  useEffect(() => {
    if (Array.isArray(dbBloggers)) {
      setBloggerFiles(
        dbBloggers.map((b: any) => ({
          id: b.id,
          createdAt: b.createdAt || new Date().toISOString(),
          name: b.name || "",
          handle: b.handle || "",
          niche: b.niche || "Food",
          platform: b.platform || "Instagram",
          contactEmail: b.contactEmail || "",
          contactPhone: b.contactPhone || "",
          city: b.city || "",
          notes: b.notes || "",
          followers: Number(b.followers) || 0,
          likes: Number(b.likes) || 0,
          comments: Number(b.comments) || 0,
          shares: Number(b.shares) || 0,
          saves: Number(b.saves) || 0,
        })),
      );
    }
  }, [dbBloggers]);

  const saveBloggerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/marketing/blogger-profiles", {
        name: bloggerForm.name,
        handle: bloggerForm.handle || "",
        niche: bloggerForm.niche || "Food",
        platform: bloggerForm.platform || "Instagram",
        contactEmail: bloggerForm.contactEmail || "",
        contactPhone: bloggerForm.contactPhone || "",
        city: bloggerForm.city || "",
        notes: bloggerForm.notes || "",
        followers: Math.round(Number(bloggerForm.followers) || 0),
        likes: Math.round(Number(bloggerForm.likes) || 0),
        comments: Math.round(Number(bloggerForm.comments) || 0),
        shares: Math.round(Number(bloggerForm.shares) || 0),
        saves: Math.round(Number(bloggerForm.saves) || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/blogger-profiles"] });
      setBloggerForm(emptyBlogger());
      toast({ title: t.bloggerSaved });
    },
    onError: (e: any) => {
      toast({ title: t.error, description: e?.message || "Failed to save", variant: "destructive" });
    },
  });

  const deleteBloggerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/marketing/blogger-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/blogger-profiles"] });
    },
    onError: (e: any) => {
      toast({ title: t.error, description: e?.message || "Failed to delete", variant: "destructive" });
    },
  });

  const addBloggerFile = () => {
    if (!bloggerForm.name.trim()) {
      toast({
        title: t.error,
        description: t.bloggerNameRequired,
        variant: "destructive",
      });
      return;
    }
    saveBloggerMutation.mutate();
  };

  const deleteBloggerFile = (id: string) => deleteBloggerMutation.mutate(id);

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
      [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influencers_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 h-auto">
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
          <TabsTrigger value="fake-detector" data-testid="tab-fake-detector" className="flex items-center gap-2 py-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">{isRTL ? "كاشف المتابعين الوهميين" : "Fake Detector"}</span>
            <span className="sm:hidden">Fake</span>
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
                {usesMenu && menuItems.length > 0 && (
                  <Select value="" onValueChange={(v) => v && addProductFromMenu(v)}>
                    <SelectTrigger className="w-[220px] h-9" data-testid="select-menu-item">
                      <SelectValue placeholder={isFactory ? t.selectFromProducts : t.selectFromMenu} />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((mi) => (
                        <SelectItem key={mi.id} value={mi.id} data-testid={`option-menu-${mi.id}`}>
                          {mi.name} — {fmt(parseFloat(mi.price) || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isServiceBusiness && (
                  <Select value="" onValueChange={(v) => v && addProductFromCatalog(v)}>
                    <SelectTrigger className="w-[260px] h-9" data-testid="select-catalog-product">
                      <SelectValue placeholder={t.selectFromCatalog} />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceProductsList.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">{t.noCatalogProducts}</div>
                      ) : (
                        serviceProductsList.map((sp) => (
                          <SelectItem key={sp.id} value={sp.id} data-testid={`option-catalog-product-${sp.id}`}>
                            {sp.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {isRealEstate && (
                  <Select value="" onValueChange={(v) => v && addProductFromProperty(v)}>
                    <SelectTrigger className="w-[240px] h-9" data-testid="select-property">
                      <SelectValue placeholder={t.selectFromProperties} />
                    </SelectTrigger>
                    <SelectContent>
                      {propertiesList.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">{t.noProperties}</div>
                      ) : (
                        propertiesList.map((pr) => (
                          <SelectItem key={pr.id} value={pr.id} data-testid={`option-property-${pr.id}`}>
                            {pr.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setProducts((arr) => [
                      ...arr,
                      {
                        ...newProduct(),
                        name: `Product ${arr.length + 1}`,
                        ...(usesMenu && currentSnapshot.count > 0
                          ? {
                              sellingPrice: Math.round(currentSnapshot.avgSellingPrice * 100) / 100,
                              variableCost: Math.round(currentSnapshot.avgVariableCost * 100) / 100,
                            }
                          : {}),
                        ...(monthlyFixedCosts > 0 ? { fixedCosts: Math.round(monthlyFixedCosts) } : {}),
                      },
                    ])
                  }
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {t.addProduct}
                </Button>
                {finFixedCosts && finFixedCosts.total > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={autoFillFixedCosts} data-testid="button-autofill-fixed-costs">
                        <Coins className="h-4 w-4 me-2" />
                        {t.finAutoFillCosts}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t.finFromBills}: {fmt(finFixedCosts.bills)} • {t.finFromSalaries}: {fmt(finFixedCosts.salaries)}
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button size="sm" variant="outline" onClick={downloadInvestorPDF} data-testid="button-download-investor-pdf">
                  <FileText className="h-4 w-4 me-2" />
                  {t.finDownloadInvestorPdf}
                </Button>
                <Button size="sm" onClick={downloadFinancialPDF} data-testid="button-download-financial-pdf">
                  <Download className="h-4 w-4 me-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="font-semibold">{t.currentSnapshotTitle}</div>
                <div className="text-sm text-muted-foreground">{finSnapshotDesc}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{finAvgPriceLabel}</div>
                  <div className="text-lg font-bold" data-testid="stat-current-avg-selling-price">
                    {currentSnapshot.count > 0 && !isServiceBusiness ? fmt(currentSnapshot.avgSellingPrice) : "—"}
                  </div>
                  {currentSnapshot.count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {finBasedOnLabel(currentSnapshot.count)}
                    </div>
                  )}
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{finAvgCostLabel}</div>
                  <div className="text-lg font-bold" data-testid="stat-current-avg-variable-cost">
                    {currentSnapshot.count > 0 && !isServiceBusiness ? fmt(currentSnapshot.avgVariableCost) : "—"}
                  </div>
                  {currentSnapshot.count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {finBasedOnLabel(currentSnapshot.count)}
                    </div>
                  )}
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.currentMonthlyFixedCosts}</div>
                  <div className="text-lg font-bold" data-testid="stat-current-monthly-fixed-costs">
                    {fmt(monthlyFixedCosts)}
                  </div>
                </div>
              </div>
            </CardContent>
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

                {(() => {
                  const actual = actualFor(p.name);
                  const plannedRevenue = p.sellingPrice * p.monthlyUnits;
                  return (
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          {t.finActualVsPlanned}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.finLast30Days}</div>
                      </div>
                      {actual ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">{t.finActualUnits}</div>
                            <div className="font-bold" data-testid={`stat-actual-units-${p.id}`}>{fmt(actual.units, 0)}</div>
                            <div className="text-xs text-muted-foreground">{t.finPlannedUnits}: {fmt(p.monthlyUnits, 0)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">{t.finActualRevenue}</div>
                            <div className="font-bold" data-testid={`stat-actual-revenue-${p.id}`}>{fmt(actual.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{t.finPlannedRevenue}: {fmt(plannedRevenue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">{t.finVariance} ({t.finUnits})</div>
                            <div className={`font-bold ${actual.units >= p.monthlyUnits ? "text-green-600" : "text-red-600"}`} data-testid={`stat-variance-units-${p.id}`}>
                              {actual.units >= p.monthlyUnits ? "+" : ""}{fmt(actual.units - p.monthlyUnits, 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">{t.finVariance} ({t.finRevenue})</div>
                            <div className={`font-bold ${actual.revenue >= plannedRevenue ? "text-green-600" : "text-red-600"}`} data-testid={`stat-variance-revenue-${p.id}`}>
                              {actual.revenue >= plannedRevenue ? "+" : ""}{fmt(actual.revenue - plannedRevenue)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{t.finNoActualData}</div>
                      )}
                    </div>
                  );
                })()}

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

          {/* What-If Analysis */}
          {whatIfProduct && whatIfCalc && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                    {t.finWhatIf}
                  </CardTitle>
                  <CardDescription>{t.finWhatIfDesc}</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {products.length > 1 && (
                    <Select value={whatIfProduct.id} onValueChange={setWhatIfProductId}>
                      <SelectTrigger className="w-[200px]" data-testid="select-whatif-product">
                        <SelectValue placeholder={t.finSelectProduct} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setWhatIf({ price: 0, varCost: 0, fixed: 0, volume: 0 })} data-testid="button-whatif-reset">
                    <RotateCcw className="h-4 w-4 me-2" />
                    {t.finResetSliders}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {(
                    [
                      ["price", t.finPriceAdj],
                      ["varCost", t.finVarCostAdj],
                      ["fixed", t.finFixedCostAdj],
                      ["volume", t.finVolumeAdj],
                    ] as const
                  ).map(([k, label]) => (
                    <div key={k}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="font-semibold">{whatIf[k] > 0 ? "+" : ""}{whatIf[k]}%</span>
                      </div>
                      <Slider
                        min={-50}
                        max={50}
                        step={1}
                        value={[whatIf[k]]}
                        onValueChange={([v]) => setWhatIf((s) => ({ ...s, [k]: v }))}
                        data-testid={`slider-whatif-${k}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(
                    [
                      [t.grossMargin, `${fmt(whatIfCalc.base.grossMarginPct)}%`, `${fmt(whatIfCalc.adj.grossMarginPct)}%`, whatIfCalc.adj.grossMarginPct >= whatIfCalc.base.grossMarginPct],
                      [t.breakEvenUnits, fmt(whatIfCalc.base.breakEvenUnits, 0), fmt(whatIfCalc.adj.breakEvenUnits, 0), whatIfCalc.adj.breakEvenUnits <= whatIfCalc.base.breakEvenUnits],
                      [t.monthlyProfit, fmt(whatIfCalc.base.monthlyProfit), fmt(whatIfCalc.adj.monthlyProfit), whatIfCalc.adj.monthlyProfit >= whatIfCalc.base.monthlyProfit],
                      [t.roiAnnual, `${fmt(whatIfCalc.base.roiPct)}%`, `${fmt(whatIfCalc.adj.roiPct)}%`, whatIfCalc.adj.roiPct >= whatIfCalc.base.roiPct],
                    ] as const
                  ).map(([label, base, adj, good]) => (
                    <div key={label as string} className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground line-through">{base}</div>
                      <div className={`text-lg font-bold ${good ? "text-green-600" : "text-red-600"}`}>{adj}</div>
                      <div className="text-xs text-muted-foreground">{t.finAdjusted}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Profit Pricing */}
          {targetProduct && targetCalc && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-emerald-500" />
                    {t.finTargetPricing}
                  </CardTitle>
                </div>
                {products.length > 1 && (
                  <Select value={targetProduct.id} onValueChange={setTargetProductId}>
                    <SelectTrigger className="w-[200px]" data-testid="select-target-product">
                      <SelectValue placeholder={t.finSelectProduct} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t.finTargetProfit}</Label>
                  <Input
                    type="number"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                    data-testid="input-target-profit"
                  />
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.finRequiredPrice} ({t.finAtCurrentVolume})</div>
                  <div className="text-lg font-bold" data-testid="stat-required-price">
                    {isFinite(targetCalc.requiredPrice) ? fmt(targetCalc.requiredPrice) : t.finNotAchievable}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{t.finRequiredVolume} ({t.finAtCurrentPrice})</div>
                  <div className="text-lg font-bold" data-testid="stat-required-volume">
                    {isFinite(targetCalc.requiredVolume) ? fmt(targetCalc.requiredVolume, 0) : t.finNotAchievable}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5 text-cyan-500" />
                {t.finScenarios}
                {activeScenarioName && (
                  <Badge variant="secondary" data-testid="badge-active-scenario">{t.finActiveScenario}: {activeScenarioName}</Badge>
                )}
              </CardTitle>
              <CardDescription>{t.finScenariosDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Input
                  className="max-w-xs"
                  placeholder={t.finScenarioName}
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  data-testid="input-scenario-name"
                />
                <Button
                  size="sm"
                  onClick={() => saveScenarioMut.mutate()}
                  disabled={!scenarioName.trim() || saveScenarioMut.isPending}
                  data-testid="button-save-scenario"
                >
                  <Save className="h-4 w-4 me-2" />
                  {t.finSaveScenario}
                </Button>
              </div>
              {finScenariosList.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.finNoScenarios}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.finScenarioName}</TableHead>
                      <TableHead>{t.finProductsCount}</TableHead>
                      <TableHead>{t.finTotalMonthlyProfit}</TableHead>
                      <TableHead>{t.finAvgMargin}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finScenariosList.map((sc) => {
                      const s = scenarioSummary(sc);
                      return (
                        <TableRow key={sc.id} data-testid={`row-scenario-${sc.id}`}>
                          <TableCell className="font-medium">{sc.name}</TableCell>
                          <TableCell>{s.count}</TableCell>
                          <TableCell className={s.profit >= 0 ? "text-green-600" : "text-red-600"}>{fmt(s.profit)}</TableCell>
                          <TableCell>{fmt(s.avgMargin)}%</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => loadScenario(sc)} data-testid={`button-load-scenario-${sc.id}`}>
                                {t.finLoadScenario}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteScenarioMut.mutate(sc.id)} data-testid={`button-delete-scenario-${sc.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Snapshot History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  {t.finSnapshots}
                </CardTitle>
                <CardDescription>{t.finSnapshotsDesc}</CardDescription>
              </div>
              <Button size="sm" onClick={() => saveSnapshotMut.mutate()} disabled={saveSnapshotMut.isPending} data-testid="button-save-snapshot">
                <Save className="h-4 w-4 me-2" />
                {t.finSaveSnapshot}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {finSnapshotsList.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t.finNoSnapshots}</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs">{t.finTrendChart}</Label>
                    <Select value={trendProduct || snapshotProductNames[0] || ""} onValueChange={setTrendProduct}>
                      <SelectTrigger className="w-[220px]" data-testid="select-trend-product">
                        <SelectValue placeholder={t.finSelectProduct} />
                      </SelectTrigger>
                      <SelectContent>
                        {snapshotProductNames.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {trendData.length > 0 && (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={2} name={t.monthlyProfit} />
                          <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} name={t.grossMargin} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.finDate}</TableHead>
                        <TableHead>{t.productName}</TableHead>
                        <TableHead>{t.grossMargin}</TableHead>
                        <TableHead>{t.breakEvenUnits}</TableHead>
                        <TableHead>{t.monthlyProfit}</TableHead>
                        <TableHead>{t.roiAnnual}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finSnapshotsList.slice(0, 20).map((s) => (
                        <TableRow key={s.id} data-testid={`row-snapshot-${s.id}`}>
                          <TableCell className="text-xs">{new Date(s.createdAt as any).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{s.productName}</TableCell>
                          <TableCell>{fmt(parseFloat(s.grossMarginPct) || 0)}%</TableCell>
                          <TableCell>{fmt(parseFloat(s.breakEvenUnits) || 0, 0)}</TableCell>
                          <TableCell>{fmt(parseFloat(s.monthlyProfit) || 0)}</TableCell>
                          <TableCell>{fmt(parseFloat(s.roiPct) || 0)}%</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => deleteSnapshotMut.mutate(s.id)} data-testid={`button-delete-snapshot-${s.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                {t.finAlerts}
              </CardTitle>
              <CardDescription>{t.finAlertsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <div>
                  <Label className="text-xs">{t.finMinMargin}</Label>
                  <Input
                    type="number"
                    value={thresholdForm.minMarginPct}
                    onChange={(e) => setThresholdForm((s) => ({ ...s, minMarginPct: e.target.value }))}
                    data-testid="input-min-margin"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.finMaxBreakEvenUnits}</Label>
                  <Input
                    type="number"
                    value={thresholdForm.maxBreakEvenUnits}
                    onChange={(e) => setThresholdForm((s) => ({ ...s, maxBreakEvenUnits: e.target.value }))}
                    data-testid="input-max-break-even"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={thresholdForm.alertsEnabled}
                    onCheckedChange={(v) => setThresholdForm((s) => ({ ...s, alertsEnabled: v }))}
                    data-testid="switch-alerts-enabled"
                  />
                  <Label className="text-xs">{t.finAlertsEnabled}</Label>
                </div>
                <Button size="sm" onClick={() => saveThresholdsMut.mutate()} disabled={saveThresholdsMut.isPending} data-testid="button-save-thresholds">
                  <Save className="h-4 w-4 me-2" />
                  {t.finSaveThresholds}
                </Button>
              </div>
              {thresholdForm.alertsEnabled && (
                finAlerts.length === 0 ? (
                  <div className="text-sm text-green-600" data-testid="text-no-alerts">{t.finNoAlerts}</div>
                ) : (
                  <div className="space-y-2">
                    {finAlerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900 p-2 text-sm" data-testid={`alert-fin-${i}`}>
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="font-semibold">{a.product}:</span>
                        <span>{a.message}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Hidden investor summary for PDF capture */}
          <div className="fixed -left-[10000px] top-0" aria-hidden="true">
          <div
            id="pdf-section-investor"
            className="w-[900px] bg-background p-6 space-y-4"
          >
            <div>
              <div className="text-2xl font-bold">{t.finInvestorSummary}</div>
              <div className="text-sm text-muted-foreground">{t.finInvestorSummaryDesc}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="font-semibold mb-2">{t.finKeyMetrics}</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{t.finTotalMonthlyProfit}</div>
                  <div className="text-lg font-bold">{fmt(finTotals.profit)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t.finAvgMargin}</div>
                  <div className="text-lg font-bold">{fmt(finTotals.avgMargin)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t.finProductsCount}</div>
                  <div className="text-lg font-bold">{products.length}</div>
                </div>
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="font-semibold mb-2">{t.finTitle}</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">{t.productName}</th>
                    <th className="py-1">{t.grossMargin}</th>
                    <th className="py-1">{t.breakEvenUnits}</th>
                    <th className="py-1">{t.monthlyProfit}</th>
                    <th className="py-1">{t.roiAnnual}</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.map(({ p, calc }) => (
                    <tr key={p.id}>
                      <td className="py-1 font-medium">{p.name}</td>
                      <td className="py-1">{fmt(calc.grossMarginPct)}%</td>
                      <td className="py-1">{fmt(calc.breakEvenUnits, 0)}</td>
                      <td className="py-1">{fmt(calc.monthlyProfit)}</td>
                      <td className="py-1">{fmt(calc.roiPct)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(swot.strengths || swot.weaknesses || swot.opportunities || swot.threats) && (
              <div className="rounded-md border p-4">
                <div className="font-semibold mb-2">SWOT</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">{t.strengths}: </span>{swot.strengths || "—"}</div>
                  <div><span className="font-semibold">{t.weaknesses}: </span>{swot.weaknesses || "—"}</div>
                  <div><span className="font-semibold">{t.opportunities}: </span>{swot.opportunities || "—"}</div>
                  <div><span className="font-semibold">{t.threats}: </span>{swot.threats || "—"}</div>
                </div>
              </div>
            )}
            {(canvas.valuePropositions || canvas.customerSegments || canvas.revenueStreams) && (
              <div className="rounded-md border p-4">
                <div className="font-semibold mb-2">{t.businessModelCanvas}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">{t.valuePropositions}: </span>{canvas.valuePropositions || "—"}</div>
                  <div><span className="font-semibold">{t.customerSegments}: </span>{canvas.customerSegments || "—"}</div>
                  <div><span className="font-semibold">{t.revenueStreams}: </span>{canvas.revenueStreams || "—"}</div>
                  <div><span className="font-semibold">{t.channels}: </span>{canvas.channels || "—"}</div>
                </div>
              </div>
            )}
          </div>
          </div>
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
                  const scans = scanCountFor("blogger", b.id);
                  const commission = commissionFor(b.id, scans);
                  const hasTiers = allCommissionTiers.some((tr) => tr.bloggerId === b.id);
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
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-end">
                          <div className="text-xs text-muted-foreground">ER</div>
                          <div className={`text-lg font-bold ${rating.text}`}>{fmt(er)}%</div>
                        </div>
                        <div className="text-end">
                          <div className="text-xs text-muted-foreground">QR Scans</div>
                          <div className="text-lg font-bold" data-testid={`text-blogger-scans-${b.id}`}>
                            {scans}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="text-xs text-muted-foreground">Commission</div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid={`text-blogger-commission-${b.id}`}>
                            {hasTiers ? `${fmt(commission)} SAR` : "—"}
                          </div>
                        </div>
                        <Badge className={`${rating.color} text-white`}>{rating.label}</Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Download QR"
                              onClick={() => downloadQrPng(`BSS-BL:${b.id}`, `blogger-${(b.name || "qr").replace(/\s+/g, "-")}.png`)}
                              data-testid={`button-qr-blogger-${b.id}`}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download QR code</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Commission tiers"
                              onClick={() => openTierEditor({ id: b.id, name: b.name })}
                              data-testid={`button-tiers-blogger-${b.id}`}
                            >
                              <Coins className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Commission tiers</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Settlement PDF"
                              asChild
                              data-testid={`button-settlement-pdf-blogger-${b.id}`}
                            >
                              <a href={`/api/marketing/blogger-profiles/${b.id}/settlement-pdf`} target="_blank" rel="noopener">
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{language === "ar" ? "تقرير تسوية العمولة (PDF)" : "Commission settlement PDF"}</TooltipContent>
                        </Tooltip>
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

          <Dialog open={!!tierDialogBlogger} onOpenChange={(open) => !open && setTierDialogBlogger(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Commission Tiers — {tierDialogBlogger?.name}</DialogTitle>
                <DialogDescription>
                  Set how much this blogger earns per QR scan. Example: scans 1–20 pay 1 SAR each, scans 21–50 pay 2 SAR each. Leave "To" empty for no upper limit.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
                  <span>From scan</span>
                  <span>To scan</span>
                  <span>SAR per scan</span>
                  <span></span>
                </div>
                {tierRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <Input
                      type="number"
                      min="1"
                      value={row.fromScans}
                      onChange={(e) => setTierRows(tierRows.map((r, j) => (j === i ? { ...r, fromScans: e.target.value } : r)))}
                      data-testid={`input-tier-from-${i}`}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="∞"
                      value={row.toScans}
                      onChange={(e) => setTierRows(tierRows.map((r, j) => (j === i ? { ...r, toScans: e.target.value } : r)))}
                      data-testid={`input-tier-to-${i}`}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.ratePerScan}
                      onChange={(e) => setTierRows(tierRows.map((r, j) => (j === i ? { ...r, ratePerScan: e.target.value } : r)))}
                      data-testid={`input-tier-rate-${i}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove tier"
                      onClick={() => setTierRows(tierRows.filter((_, j) => j !== i))}
                      data-testid={`button-remove-tier-${i}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const last = tierRows[tierRows.length - 1];
                    const nextFrom = last && last.toScans !== "" ? String((Number(last.toScans) || 0) + 1) : "";
                    setTierRows([...tierRows, { fromScans: nextFrom, toScans: "", ratePerScan: "" }]);
                  }}
                  data-testid="button-add-tier"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add tier
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTierDialogBlogger(null)} data-testid="button-cancel-tiers">
                  Cancel
                </Button>
                <Button
                  onClick={() => saveTiersMutation.mutate()}
                  disabled={saveTiersMutation.isPending}
                  data-testid="button-save-tiers"
                >
                  {saveTiersMutation.isPending ? "Saving..." : "Save tiers"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                      <TableHead>QR Scans</TableHead>
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
                        <TableCell data-testid={`text-scans-${c.id}`}>
                          {scanCountFor("discount_code", c.id)}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Download QR"
                                data-testid={`button-qr-discount-${c.id}`}
                                onClick={() => downloadQrPng(`BSS-DC:${c.code}`, `discount-${c.code}.png`)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download QR code</TooltipContent>
                          </Tooltip>
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

        {/* ===================== Fake Followers Detector ===================== */}
        <TabsContent value="fake-detector" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                {isRTL ? "كاشف المتابعين الوهميين — محلل المؤثرين 2026" : "Fake Followers Detector — Influencer Analyzer 2026"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "أدخل بيانات الحساب لتقدير نسبة المتابعين الوهميين، جودة الجمهور، والإشارات الحمراء."
                  : "Enter account metrics to estimate fake follower %, audience quality, and red flags."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TooltipProvider delayDuration={150}>
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">
                    {isRTL ? "اسم المستخدم" : "Username (@handle)"}
                    <InfoTip>{isRTL ? "اسم المستخدم على المنصة بدون رابط، مثل @example. يُستخدم للحفظ والمراجعة لاحقًا." : "Public handle without URL, e.g. @example. Used for saving and lookup."}</InfoTip>
                  </Label>
                  <Input value={fakeForm.username} onChange={(e) => setFakeForm({ ...fakeForm, username: e.target.value })} placeholder="@example" data-testid="input-fake-username" />
                </div>
                <div>
                  <Label className="text-xs">
                    {isRTL ? "المنصة" : "Platform"}
                    <InfoTip>{isRTL ? "اختر المنصة التي يعمل عليها المؤثر. التفاعل يختلف كثيرًا بين Instagram و TikTok و YouTube." : "Pick the network the influencer is on. Engagement norms differ widely between Instagram, TikTok and YouTube."}</InfoTip>
                  </Label>
                  <Select value={fakeForm.platform} onValueChange={(v) => setFakeForm({ ...fakeForm, platform: v })}>
                    <SelectTrigger data-testid="select-fake-platform"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Snapchat">Snapchat</SelectItem>
                      <SelectItem value="X">X / Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(() => {
                  const fieldTips: Record<string, string> = {
                    followers: isRTL ? "إجمالي عدد المتابعين الظاهر على الحساب." : "Total followers as shown on the account.",
                    following: isRTL ? "عدد الحسابات التي يتابعها هذا المؤثر. نسبة عالية (متابعة > متابعين) إشارة بوت." : "How many accounts the influencer follows. A high follow-to-follower ratio (>1.5) is a bot red flag.",
                    avgLikes: isRTL ? "متوسط الإعجابات على آخر 10-20 منشور — يحدد معدل التفاعل." : "Average likes across the last 10-20 posts — used to compute engagement rate.",
                    avgComments: isRTL ? "متوسط التعليقات على آخر 10-20 منشور." : "Average comments across the last 10-20 posts.",
                    posts: isRTL ? "العدد الإجمالي للمنشورات على الحساب." : "Total number of posts on the account.",
                    growth30d: isRTL ? "نسبة نمو المتابعين خلال آخر 30 يومًا (%). قفزة > 15% بدون حملة = إشارة شراء متابعين." : "Follower growth % over the last 30 days. A spike >15% without a campaign suggests bought followers.",
                    genericCommentsPct: isRTL ? "نسبة التعليقات السطحية مثل 'Nice 🔥' أو الإيموجي فقط. > 40% إشارة بوت." : "Share of shallow comments like 'Nice 🔥' or emoji-only replies. >40% is a bot indicator.",
                  };
                  return ([
                    ["followers", isRTL ? "المتابعون" : "Followers"],
                    ["following", isRTL ? "يتابع" : "Following"],
                    ["avgLikes", isRTL ? "متوسط الإعجابات/منشور" : "Avg Likes/Post"],
                    ["avgComments", isRTL ? "متوسط التعليقات/منشور" : "Avg Comments/Post"],
                    ["posts", isRTL ? "عدد المنشورات" : "Posts"],
                    ["growth30d", isRTL ? "نمو 30 يوم" : "Growth (30d)"],
                    ["genericCommentsPct", isRTL ? "% تعليقات عامة" : "% Generic Comments"],
                  ] as const).map(([k, label]) => (
                    <div key={k}>
                      <Label className="text-xs">
                        {label}
                        <InfoTip>{fieldTips[k]}</InfoTip>
                      </Label>
                      <Input
                        type="number"
                        value={(fakeForm as any)[k]}
                        onChange={(e) => setFakeForm({ ...fakeForm, [k]: parseFloat(e.target.value) || 0 })}
                        data-testid={`input-fake-${k}`}
                      />
                    </div>
                  ));
                })()}
                <div className="md:col-span-3 lg:col-span-5">
                  <Label className="text-xs">
                    {isRTL ? "ملاحظات" : "Notes"}
                    <InfoTip>{isRTL ? "ملاحظات خاصة بك (سعر مقترح، أسلوب المحتوى، تاريخ آخر تعاون...)." : "Your private notes (proposed rate, content style, last collaboration date...)."}</InfoTip>
                  </Label>
                  <Input value={fakeForm.notes} onChange={(e) => setFakeForm({ ...fakeForm, notes: e.target.value })} data-testid="input-fake-notes" />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "معدل التفاعل" : "Engagement Rate"}
                    <InfoTip>{isRTL ? "ER = (إعجابات + تعليقات) ÷ المتابعون × 100. أقل من 2% يضيف +30% إلى نسبة الوهمي." : "ER = (likes + comments) ÷ followers × 100. Below 2% adds +30% to fake score."}</InfoTip>
                  </div>
                  <div className="text-xl font-bold" data-testid="stat-fake-er">{fakeResult.er.toFixed(2)}%</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "نسبة المتابعين الوهميين" : "Estimated Fake %"}
                    <InfoTip>{isRTL ? "تقدير مركّب: تفاعل منخفض +30، نسبة متابعة عالية +20، نمو مفاجئ +25، تعليقات عامة +15. حد أقصى 100." : "Composite: low ER +30, high follow ratio +20, sudden growth +25, generic comments +15. Capped at 100."}</InfoTip>
                  </div>
                  <div className={`text-2xl font-bold ${fakeColor(fakeResult.fakePct)}`} data-testid="stat-fake-pct">{fakeResult.fakePct.toFixed(1)}%</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "جودة الجمهور (0-100)" : "Audience Quality"}
                    <InfoTip>{isRTL ? "100 ناقص نسبة الوهمي. كلما ارتفع الرقم كان الجمهور أنقى." : "100 minus the fake %. Higher means a cleaner, more authentic audience."}</InfoTip>
                  </div>
                  <div className="text-2xl font-bold" data-testid="stat-fake-quality">{fakeResult.qualityScore}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "التوصية" : "Recommendation"}
                    <InfoTip>{isRTL ? "أخضر = اقبل (<15%)، أصفر = راجع يدويًا (15-30%)، أحمر = استبعد فورًا (>30%)." : "Green = Accept (<15%), Yellow = Review manually (15-30%), Red = Reject immediately (>30%)."}</InfoTip>
                  </div>
                  <Badge className={`${fakeBg(fakeResult.status)} text-white mt-1`} data-testid="badge-fake-status">
                    {fakeResult.status === "good" ? (isRTL ? "ممتاز - اقبل" : "Accept") : fakeResult.status === "review" ? (isRTL ? "مقبول - راجع" : "Review") : (isRTL ? "مرتفع - استبعد" : "Reject")}
                  </Badge>
                </div>
              </div>
              </TooltipProvider>

              {fakeResult.flags.length > 0 && (
                <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    {isRTL ? "إشارات حمراء" : "Red Flags Detected"}
                  </div>
                  <ul className="text-sm list-disc ps-5 space-y-1" data-testid="list-fake-flags">
                    {fakeResult.flags.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-64 rounded-md border p-3">
                  <div className="text-sm font-semibold mb-2">{isRTL ? "حقيقي مقابل وهمي" : "Real vs Fake"}</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: isRTL ? "حقيقي" : "Real", value: 100 - fakeResult.fakePct },
                          { name: isRTL ? "وهمي" : "Fake", value: fakeResult.fakePct },
                        ]}
                        dataKey="value" nameKey="name" outerRadius={70} label
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#dc2626" />
                      </Pie>
                      <Legend />
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64 rounded-md border p-3">
                  <div className="text-sm font-semibold mb-2">{isRTL ? "معايير قطاع الطعام (السعودية)" : "Food Niche Benchmarks (Saudi Arabia)"}</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={[
                      { label: isRTL ? "جيد" : "Good", value: 18 },
                      { label: isRTL ? "متوسط" : "Average", value: 35 },
                      { label: isRTL ? "سيء" : "Bad", value: 50 },
                      { label: isRTL ? "هذا الحساب" : "This Account", value: fakeResult.fakePct },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <RTooltip />
                      <Bar dataKey="value">
                        <Cell fill="#16a34a" />
                        <Cell fill="#ca8a04" />
                        <Cell fill="#dc2626" />
                        <Cell fill="#2563eb" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <TooltipProvider delayDuration={150}>
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => saveInfluencer.mutate()} disabled={saveInfluencer.isPending || !fakeForm.username} data-testid="button-save-influencer">
                      <Save className="h-4 w-4 me-2" />
                      {isRTL ? "حفظ ملف المؤثر" : "Save Influencer Profile"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isRTL ? "يحفظ النتائج الحالية في قائمة المؤثرين أدناه ليصبح بإمكانك المقارنة والتصدير لاحقًا." : "Saves the current result to the influencer list below so you can compare and export later."}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setFakeForm(emptyFakeForm())} data-testid="button-clear-fake">
                      <RotateCcw className="h-4 w-4 me-2" />
                      {isRTL ? "مسح" : "Clear"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isRTL ? "يفرغ النموذج للبدء بفحص مؤثر جديد. لا يحذف الملفات المحفوظة." : "Resets the form to evaluate a new influencer. Does not delete saved profiles."}
                  </TooltipContent>
                </Tooltip>
              </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Benchmarks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRTL ? "القاعدة الذهبية" : "The Golden Rule"}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
              <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-md p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white cursor-help" data-testid="golden-rule-green">
                    <div className="font-semibold">{isRTL ? "أقل من 15% — ممتاز" : "< 15% — Excellent"}</div>
                    <div className="text-xs opacity-90 mt-1">{isRTL ? "اقبل المؤثر بثقة" : "Accept with confidence"}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {isRTL ? "جمهور حقيقي إلى حد كبير. آمن لإطلاق حملة مدفوعة بدون قلق." : "Audience is largely real. Safe to launch a paid campaign with confidence."}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-md p-4 bg-gradient-to-br from-yellow-500 to-amber-500 text-white cursor-help" data-testid="golden-rule-yellow">
                    <div className="font-semibold">{isRTL ? "15% - 30% — مقبول" : "15% - 30% — Acceptable"}</div>
                    <div className="text-xs opacity-90 mt-1">{isRTL ? "راجع البيانات يدوياً" : "Review manually"}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {isRTL ? "افحص جودة التعليقات والدول الأعلى تفاعلًا قبل الاتفاق، وتفاوض على السعر." : "Inspect comment quality and top audience countries before agreeing, and negotiate the rate."}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-md p-4 bg-gradient-to-br from-red-500 to-rose-500 text-white cursor-help" data-testid="golden-rule-red">
                    <div className="font-semibold">{isRTL ? "أكثر من 30% — استبعده" : "> 30% — Reject"}</div>
                    <div className="text-xs opacity-90 mt-1">{isRTL ? "خطر مرتفع" : "High risk"}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {isRTL ? "نسبة بوتات مرتفعة. الميزانية ستضيع على متابعين غير حقيقيين." : "High bot share. Budget will likely be wasted on inauthentic followers."}
                </TooltipContent>
              </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Multiple Influencers Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">{isRTL ? "ملفات المؤثرين المحفوظة" : "Saved Influencer Profiles"}</CardTitle>
                <CardDescription>
                  {isRTL ? `العدد: ${influencerProfiles.length} — متوسط النسبة الوهمية: ${avgFakeAll.toFixed(1)}%` : `${influencerProfiles.length} profile(s) — Avg Fake: ${avgFakeAll.toFixed(1)}%`}
                </CardDescription>
              </div>
              <TooltipProvider delayDuration={150}>
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={exportInfluencerCsv} disabled={!influencerProfiles.length} data-testid="button-export-csv">
                      <Download className="h-4 w-4 me-2" />CSV
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isRTL ? "تصدير القائمة كملف CSV لفتحه في Excel/Sheets." : "Export the list as CSV to open in Excel/Sheets."}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/api/marketing/influencer-profiles/pdf" target="_blank" rel="noopener" data-testid="button-export-pdf">
                        <Download className="h-4 w-4 me-2" />PDF
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isRTL ? "تنزيل تقرير PDF منسّق لجميع الملفات المحفوظة." : "Download a formatted PDF report of all saved profiles."}
                  </TooltipContent>
                </Tooltip>
              </div>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              {influencerProfiles.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {isRTL ? "لا توجد ملفات بعد. احفظ مؤثرًا أعلاه." : "No profiles yet. Save an influencer above."}
                </div>
              ) : (
                <TooltipProvider delayDuration={150}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? "اسم المستخدم" : "Username"}<InfoTip>{isRTL ? "اسم المستخدم على المنصة." : "Account handle on the platform."}</InfoTip></TableHead>
                        <TableHead>{isRTL ? "المنصة" : "Platform"}<InfoTip>{isRTL ? "الشبكة الاجتماعية للمؤثر." : "Social network of the influencer."}</InfoTip></TableHead>
                        <TableHead className="text-right">{isRTL ? "المتابعون" : "Followers"}<InfoTip>{isRTL ? "إجمالي المتابعين وقت الحفظ." : "Total followers at the time of saving."}</InfoTip></TableHead>
                        <TableHead className="text-right">{isRTL ? "% وهمي" : "Fake %"}<InfoTip>{isRTL ? "النسبة المقدّرة للمتابعين الوهميين. أخضر آمن، أصفر راجع، أحمر استبعد." : "Estimated share of fake followers. Green safe, yellow review, red reject."}</InfoTip></TableHead>
                        <TableHead className="text-right">{isRTL ? "الجودة" : "Quality"}<InfoTip>{isRTL ? "100 ناقص نسبة الوهمي." : "100 minus the fake %."}</InfoTip></TableHead>
                        <TableHead>{isRTL ? "الحالة" : "Status"}<InfoTip>{isRTL ? "التوصية النهائية: قبول / مراجعة / استبعاد." : "Final recommendation: accept / review / reject."}</InfoTip></TableHead>
                        <TableHead>{isRTL ? "ملاحظات" : "Notes"}<InfoTip>{isRTL ? "ملاحظاتك الخاصة بالمؤثر." : "Your private notes about the influencer."}</InfoTip></TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {influencerProfiles.map((i) => (
                        <TableRow key={i.id} data-testid={`row-influencer-${i.id}`}>
                          <TableCell className="font-medium">{i.username}</TableCell>
                          <TableCell>{i.platform}</TableCell>
                          <TableCell className="text-right">{i.followers.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-semibold ${fakeColor(Number(i.fakePct))}`}>
                            {Number(i.fakePct).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">{i.qualityScore}</TableCell>
                          <TableCell>
                            <Badge className={`${fakeBg(i.status)} text-white`}>{i.status.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{i.notes}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => deleteInfluencer.mutate(i.id)} data-testid={`button-delete-influencer-${i.id}`}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{isRTL ? "حذف هذا الملف" : "Delete this profile"}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {isRTL ? "كيفية قراءة النتائج + أفضل الأدوات (2026)" : "How to Read Results + Best Tools (2026)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div>
                <div className="font-semibold mb-1">{isRTL ? "نظام التقييم" : "Scoring System"}</div>
                <ul className="list-disc ps-5 space-y-1 text-muted-foreground">
                  <li>{isRTL ? "تفاعل أقل من 2% → +30%" : "Engagement < 2% → +30%"}</li>
                  <li>{isRTL ? "نسبة متابعة/متابعين > 1.5 → +20%" : "Following/Followers ratio > 1.5 → +20%"}</li>
                  <li>{isRTL ? "نمو مفاجئ > 15% / 30 يوم → +25%" : "Sudden growth > 15% / 30d → +25%"}</li>
                  <li>{isRTL ? "تعليقات عامة > 40% → +15%" : "Generic comments > 40% → +15%"}</li>
                </ul>
              </div>

              <div className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-xs">
                {isRTL
                  ? "✅ نسبة المتابعين الحقيقيين (Real Followers %) + كشف البوتات (Fake Followers) — معيار مهم جدًا في Scorecard التقييم. إذا تجاوزت نسبة المزيفين 25-30%، يُفضّل استبعاد المدوّن."
                  : "✅ Real Followers % + Bot Detection (Fake Followers) is a critical Scorecard metric. If fake-follower share exceeds 25-30%, it's best to exclude the influencer."}
              </div>

              <div>
                <div className="font-semibold mb-1">
                  {isRTL ? "أفضل الطرق والأدوات للكشف عن البوتات (محدّث 2026)" : "Best Tools & Methods to Detect Bots (Updated 2026)"}
                </div>
                <div className="font-medium text-foreground mb-1">
                  {isRTL ? "1. أدوات مجانية سريعة (موصى بها للبداية)" : "1. Fast Free Tools (recommended to start)"}
                </div>
                <p className="text-muted-foreground mb-2">
                  {isRTL ? "استخدم هذه الأدوات أولًا لفحص 50-100 حساب بسرعة:" : "Use these first to scan 50-100 accounts quickly:"}
                </p>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? "الأداة" : "Tool"}</TableHead>
                        <TableHead>{isRTL ? "المنصات" : "Platforms"}</TableHead>
                        <TableHead>{isRTL ? "مجانية؟" : "Free?"}</TableHead>
                        <TableHead>{isRTL ? "دقة تقريبية" : "Accuracy"}</TableHead>
                        <TableHead>{isRTL ? "رابط مباشر" : "Direct Link"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { tool: "Modash Fake Follower Check", platforms: isRTL ? "Instagram (الأفضل)" : "Instagram (best)", free: isRTL ? "مجاني تمامًا (بدون تسجيل)" : "Fully free (no signup)", acc: isRTL ? "عالية جدًا" : "Very high", url: "https://modash.io/fake-follower-check", host: "modash.io/fake-follower-check" },
                        { tool: "HypeAuditor", platforms: "Instagram", free: isRTL ? "مجاني (محدود)" : "Free (limited)", acc: isRTL ? "ممتازة" : "Excellent", url: "https://hypeauditor.com/free-tools", host: "hypeauditor.com/free-tools" },
                        { tool: "Upfluence", platforms: "Instagram", free: isRTL ? "مجاني بدون تسجيل" : "Free, no signup", acc: isRTL ? "جيدة" : "Good", url: "https://upfluence.com/instagram-fake-follower-check", host: "upfluence.com/instagram-fake-follower-check" },
                        { tool: "Collabstr", platforms: "Instagram + TikTok", free: isRTL ? "مجاني" : "Free", acc: isRTL ? "جيدة" : "Good", url: "https://collabstr.com", host: "collabstr.com" },
                        { tool: "StarNgage", platforms: "Instagram + TikTok", free: isRTL ? "مجاني" : "Free", acc: isRTL ? "جيدة" : "Good", url: "https://starngage.com", host: "starngage.com" },
                        { tool: "Social Auditor", platforms: "Instagram + TikTok + YouTube", free: isRTL ? "مجاني محدود" : "Free, limited", acc: isRTL ? "جيدة" : "Good", url: "https://socialauditor.io", host: "socialauditor.io" },
                        { tool: "ViralMango", platforms: isRTL ? "الثلاث منصات" : "All three platforms", free: isRTL ? "مجاني" : "Free", acc: isRTL ? "جيدة" : "Good", url: "https://analytics.viralmango.com", host: "analytics.viralmango.com" },
                      ].map((r) => (
                        <TableRow key={r.tool} data-testid={`row-fake-tool-${r.tool.toLowerCase().replace(/\s+/g, '-')}`}>
                          <TableCell className="font-medium">{r.tool}</TableCell>
                          <TableCell>{r.platforms}</TableCell>
                          <TableCell>{r.free}</TableCell>
                          <TableCell>{r.acc}</TableCell>
                          <TableCell>
                            <a className="text-primary underline" href={r.url} target="_blank" rel="noopener">{r.host}</a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">{isRTL ? "كيف تستخدمها (خطوة بخطوة)" : "How to Use Them (step by step)"}</div>
                <ol className="list-decimal ps-5 space-y-1 text-muted-foreground">
                  <li>{isRTL ? "افتح الأداة (مثل Modash)." : "Open the tool (e.g. Modash)."}</li>
                  <li>{isRTL ? "أدخل اسم المستخدم (@username)." : "Enter the username (@username)."}</li>
                  <li>{isRTL ? "انتظر 10-30 ثانية." : "Wait 10-30 seconds."}</li>
                  <li>
                    {isRTL ? "ستظهر لك:" : "You'll see:"}
                    <ul className="list-disc ps-5 mt-1 space-y-0.5">
                      <li>{isRTL ? "Fake Followers % (النسبة المزيفة)" : "Fake Followers % (fake share)"}</li>
                      <li>Audience Quality Score</li>
                      <li>{isRTL ? "Top Countries (مهم لمعرفة إذا كان الجمهور سعودي أم هندي/برازيلي)" : "Top Countries (so you know if the audience is Saudi vs. Indian/Brazilian)"}</li>
                      <li>{isRTL ? "Suspicious Growth (ارتفاع مفاجئ في المتابعين)" : "Suspicious Growth (sudden follower spikes)"}</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div>
                <div className="font-semibold mb-1">{isRTL ? "القاعدة الذهبية" : "The Golden Rule"}</div>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span>{isRTL ? "أقل من 15% مزيف → ممتاز" : "Less than 15% fake → Excellent"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span>{isRTL ? "15-25% → مقبول (لكن راقب)" : "15-25% → Acceptable (monitor)"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>{isRTL ? "أكثر من 30% → استبعده فورًا" : "Over 30% → Exclude immediately"}</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-semibold mb-1">{isRTL ? "2. أدوات مدفوعة (للمستوى الاحترافي)" : "2. Paid Tools (pro tier)"}</div>
                <p className="text-muted-foreground mb-1">
                  {isRTL ? "عندما تكبر قائمتك إلى 50 مدوّن:" : "Once your list grows to 50+ influencers:"}
                </p>
                <ul className="list-disc ps-5 space-y-1 text-muted-foreground">
                  <li><span className="font-medium text-foreground">HypeAuditor</span> — {isRTL ? "الأقوى في كشف البوتات المتطورة." : "strongest at detecting advanced bots."}</li>
                  <li><span className="font-medium text-foreground">Modash</span> — {isRTL ? "ممتاز للبحث والفحص معًا." : "excellent for search + audit in one."}</li>
                  <li><span className="font-medium text-foreground">Lessie AI</span> — {isRTL ? "مجاني/رخيص ويغطي TikTok جيدًا." : "free/cheap with solid TikTok coverage."}</li>
                </ul>
              </div>

              <div className="rounded-md border border-blue-500/40 bg-blue-500/10 p-3 text-xs">
                {isRTL
                  ? "نصيحة: استخدم الأداة المجانية لفحص الحساب ثم أدخل الأرقام هنا للحصول على تقييم سريع وحفظ السجل لإدارة 10+ مؤثرين."
                  : "Tip: Use a free tool to scan the account, then enter the numbers here for a quick rating and save the record to manage 10+ influencers."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
