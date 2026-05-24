import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { TrendingUp, DollarSign, Calculator, Download, RefreshCw, Wallet, PieChart as PieIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import type { ShopBill } from "@shared/schema";

type Period = "month" | "quarter" | "year" | "all";

interface PaymentSchedule {
  id: string;
  amount: string;
  status: string;
  paidDate: string | null;
  dueDate: string | null;
}

interface ServiceProject {
  id: string;
}

interface ProjectItemRow {
  id: string;
  projectId: string;
  cost: string;
  createdAt: string;
}

interface ProjectServiceRow {
  id: string;
  projectId: string;
  totalPrice: string;
  createdAt: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number) =>
  isFinite(n) ? `${n.toFixed(2)}%` : "—";

function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), q * 3, 1);
  }
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function inPeriod(dateStr: string | null | undefined, start: Date | null): boolean {
  if (!start) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start;
}

export default function ServiceProfitability() {
  const { t, isRTL } = useLanguage();
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("month");

  // overrides (string so user can clear)
  const [revOv, setRevOv] = useState<string>("");
  const [cogsOv, setCogsOv] = useState<string>("");
  const [opexOv, setOpexOv] = useState<string>("");
  const [interest, setInterest] = useState<string>("0");
  const [taxes, setTaxes] = useState<string>("0");
  const [depreciation, setDepreciation] = useState<string>("0");
  const [totalAssets, setTotalAssets] = useState<string>("0");
  const [equity, setEquity] = useState<string>("0");

  const liveOpts = { refetchInterval: 15000, refetchOnWindowFocus: true, staleTime: 5000 } as const;
  const { data: paymentSchedules = [] } = useQuery<PaymentSchedule[]>({
    queryKey: ["/api/payment-schedules"],
    ...liveOpts,
  });
  const { data: shopBills = [] } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    ...liveOpts,
  });
  const { data: projects = [] } = useQuery<ServiceProject[]>({
    queryKey: ["/api/service-projects"],
    ...liveOpts,
  });

  // Fetch project items + services for COGS aggregation across all projects
  const { data: projectAggregates } = useQuery<{ items: ProjectItemRow[]; services: ProjectServiceRow[] }>({
    queryKey: ["service-profitability-aggregates", projects.map((p) => p.id).join(",")],
    enabled: projects.length > 0,
    ...liveOpts,
    queryFn: async () => {
      const results = await Promise.all(
        projects.map(async (p) => {
          const res = await fetch(`/api/service-projects/${p.id}/items`, { credentials: "include" });
          if (!res.ok) {
            throw new Error(`Failed to load project ${p.id} aggregates: ${res.status}`);
          }
          const json = await res.json();
          const items = Array.isArray(json) ? json : (json.items || []);
          const services = Array.isArray(json) ? [] : (json.services || []);
          return { items, services };
        }),
      );
      return {
        items: results.flatMap((r) => r.items),
        services: results.flatMap((r) => r.services),
      };
    },
  });

  const periodFilterStart = periodStart(period);

  const autoRevenue = useMemo(() => {
    return paymentSchedules
      .filter((p) => p.status === "paid" && inPeriod(p.paidDate || p.dueDate, periodFilterStart))
      .reduce((s, p) => s + (parseFloat(p.amount || "0") || 0), 0);
  }, [paymentSchedules, periodFilterStart]);

  const autoCogs = useMemo(() => {
    if (!projectAggregates) return 0;
    const itemsCost = projectAggregates.items
      .filter((it) => inPeriod(it.createdAt, periodFilterStart))
      .reduce((s, it) => s + (parseFloat(it.cost || "0") || 0), 0);
    const servicesCost = projectAggregates.services
      .filter((sv) => inPeriod(sv.createdAt, periodFilterStart))
      .reduce((s, sv) => s + (parseFloat(sv.totalPrice || "0") || 0), 0);
    return itemsCost + servicesCost;
  }, [projectAggregates, periodFilterStart]);

  const autoOpex = useMemo(() => {
    return shopBills
      .filter((b) => !b.archived && inPeriod(b.paymentDate as any, periodFilterStart))
      .reduce((s, b) => s + (parseFloat(b.amount || "0") || 0), 0);
  }, [shopBills, periodFilterStart]);

  const revenue = revOv !== "" ? parseFloat(revOv) || 0 : autoRevenue;
  const cogs = cogsOv !== "" ? parseFloat(cogsOv) || 0 : autoCogs;
  const opex = opexOv !== "" ? parseFloat(opexOv) || 0 : autoOpex;
  const interestN = parseFloat(interest) || 0;
  const taxesN = parseFloat(taxes) || 0;
  const depN = parseFloat(depreciation) || 0;
  const assetsN = parseFloat(totalAssets) || 0;
  const equityN = parseFloat(equity) || 0;

  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - opex; // EBIT
  const ebitda = operatingProfit + depN;
  const netProfit = operatingProfit - interestN - taxesN;

  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
  const roa = assetsN > 0 ? (netProfit / assetsN) * 100 : 0;
  const roe = equityN > 0 ? (netProfit / equityN) * 100 : 0;

  // Reset overrides when period changes so auto-fill follows the period
  useEffect(() => {
    setRevOv("");
    setCogsOv("");
    setOpexOv("");
  }, [period]);

  const periodLabel = (() => {
    if (period === "month") return (t as any).thisMonth || "This Month";
    if (period === "quarter") return (t as any).thisQuarter || "This Quarter";
    if (period === "year") return (t as any).thisYear || "This Year";
    return (t as any).allTime || "All Time";
  })();

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      let y = margin;

      // Header band
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Profitability Report", margin, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const company = restaurant?.name || "BSS";
      doc.text(company, margin, 19);
      const now = new Date();
      const stamp = now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      doc.text(stamp, pageW - margin, 19, { align: "right" });
      doc.text(periodLabel, pageW - margin, 12, { align: "right" });

      y = 36;
      doc.setTextColor(20, 20, 20);

      // Summary cards (3 large numbers)
      const cardW = (pageW - margin * 2 - 8) / 3;
      const cardH = 26;
      const drawCard = (x: number, label: string, value: string, color: [number, number, number]) => {
        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + 4, y + 7);
        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + 4, y + 18);
        doc.setTextColor(20, 20, 20);
      };
      drawCard(margin, "Revenue", fmt(revenue) + " SAR", [16, 185, 129]);
      drawCard(margin + cardW + 4, "Net Profit", fmt(netProfit) + " SAR", netProfit >= 0 ? [37, 99, 235] : [220, 38, 38]);
      drawCard(margin + (cardW + 4) * 2, "Net Margin", pct(netMargin), [124, 58, 237]);

      y += cardH + 8;

      // Income statement table
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text("Income Statement", margin, y);
      y += 5;

      const rows: Array<[string, number, boolean?]> = [
        ["Revenue", revenue],
        ["Cost of Goods Sold (COGS)", -cogs],
        ["Gross Profit", grossProfit, true],
        ["Operating Expenses", -opex],
        ["Operating Profit (EBIT)", operatingProfit, true],
        ["Depreciation (add-back)", depN],
        ["EBITDA", ebitda, true],
        ["Interest", -interestN],
        ["Taxes", -taxesN],
        ["Net Profit", netProfit, true],
      ];

      const rowH = 7;
      rows.forEach((r) => {
        const [label, val, bold] = r;
        if (bold) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y, pageW - margin * 2, rowH, "F");
        }
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(10);
        doc.setTextColor(val < 0 ? 180 : 20, val < 0 ? 40 : 20, val < 0 ? 40 : 20);
        doc.text(label, margin + 2, y + 5);
        doc.text(fmt(val) + " SAR", pageW - margin - 2, y + 5, { align: "right" });
        doc.setTextColor(20, 20, 20);
        y += rowH;
      });

      y += 6;

      // Margins & Ratios
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Profitability Ratios", margin, y);
      y += 5;

      const ratios: Array<[string, string]> = [
        ["Gross Profit Margin", pct(grossMargin)],
        ["Operating Profit Margin", pct(operatingMargin)],
        ["Net Profit Margin", pct(netMargin)],
        ["EBITDA Margin", pct(ebitdaMargin)],
        ["Return on Assets (ROA)", assetsN > 0 ? pct(roa) : "—"],
        ["Return on Equity (ROE)", equityN > 0 ? pct(roe) : "—"],
      ];

      const ratioColW = (pageW - margin * 2) / 2;
      ratios.forEach((r, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const rx = margin + col * ratioColW;
        const ry = y + row * rowH;
        doc.setDrawColor(230, 230, 230);
        doc.line(rx, ry + rowH, rx + ratioColW, ry + rowH);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(r[0], rx + 2, ry + 5);
        doc.setFont("helvetica", "bold");
        doc.text(r[1], rx + ratioColW - 2, ry + 5, { align: "right" });
      });

      y += Math.ceil(ratios.length / 2) * rowH + 6;

      // Reference inputs section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Inputs Used", margin, y);
      y += 5;
      const inputs: Array<[string, string]> = [
        ["Total Assets", fmt(assetsN) + " SAR"],
        ["Shareholders' Equity", fmt(equityN) + " SAR"],
        ["Depreciation & Amortization", fmt(depN) + " SAR"],
        ["Interest", fmt(interestN) + " SAR"],
        ["Taxes", fmt(taxesN) + " SAR"],
      ];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      inputs.forEach((r) => {
        doc.text(r[0], margin + 2, y + 5);
        doc.text(r[1], pageW - margin - 2, y + 5, { align: "right" });
        doc.setDrawColor(235, 235, 235);
        doc.line(margin, y + rowH, pageW - margin, y + rowH);
        y += rowH;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("Generated by BSS — BlindSpot System", margin, pageH - 8);
      doc.text("Made By Kinzhal LTD Co.", pageW - margin, pageH - 8, { align: "right" });

      const fname = `profitability_${period}_${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(fname);
      toast({ title: (t as any).pdfDownloaded || "PDF downloaded", description: fname });
    } catch (e: any) {
      toast({ title: (t as any).error || "Error", description: String(e?.message || e), variant: "destructive" });
    }
  };

  const resetOverrides = () => {
    setRevOv("");
    setCogsOv("");
    setOpexOv("");
    setInterest("0");
    setTaxes("0");
    setDepreciation("0");
    setTotalAssets("0");
    setEquity("0");
    toast({ title: (t as any).resetDone || "Reset to auto-filled values" });
  };

  const StatCard = ({
    label,
    value,
    sub,
    accent,
    icon,
    tip,
  }: {
    label: string;
    value: string;
    sub?: string;
    accent: "green" | "blue" | "purple" | "amber" | "red";
    icon: React.ReactNode;
    tip?: React.ReactNode;
  }) => {
    const accentMap: Record<string, string> = {
      green: "text-green-600 dark:text-green-400",
      blue: "text-blue-600 dark:text-blue-400",
      purple: "text-purple-600 dark:text-purple-400",
      amber: "text-amber-600 dark:text-amber-400",
      red: "text-destructive",
    };
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
            {tip && <InfoTip>{tip}</InfoTip>}
          </CardTitle>
          <div className={accentMap[accent]}>{icon}</div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${accentMap[accent]}`} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-amber-500" />
            {(t as any).profitability || "Profitability"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {(t as any).profitabilityDesc ||
              "Revenue, costs, profit levels and margins for your service business."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{(t as any).thisMonth || "This Month"}</SelectItem>
              <SelectItem value="quarter">{(t as any).thisQuarter || "This Quarter"}</SelectItem>
              <SelectItem value="year">{(t as any).thisYear || "This Year"}</SelectItem>
              <SelectItem value="all">{(t as any).allTime || "All Time"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetOverrides} data-testid="button-reset">
            <RefreshCw className="h-4 w-4 me-2" />
            {(t as any).reset || "Reset"}
          </Button>
          <Button size="sm" onClick={exportPDF} data-testid="button-export-pdf">
            <Download className="h-4 w-4 me-2" />
            {(t as any).exportPdf || "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={(t as any).revenue || "Revenue"}
          value={fmt(revenue) + " SAR"}
          sub={revOv !== "" ? (t as any).manualOverride || "manual override" : (t as any).autoFromPayments || "auto: paid milestones"}
          accent="green"
          icon={<DollarSign className="h-4 w-4" />}
          tip={isRTL ? "إجمالي الإيرادات من دفعات المشاريع المسددة." : "Total income from paid project milestones."}
        />
        <StatCard
          label={(t as any).grossProfit || "Gross Profit"}
          value={fmt(grossProfit) + " SAR"}
          sub={`${(t as any).grossMargin || "Gross margin"} ${pct(grossMargin)}`}
          accent="blue"
          icon={<TrendingUp className="h-4 w-4" />}
          tip={isRTL ? "الإيرادات مطروحًا منها تكلفة البضاعة المباعة." : "Revenue minus cost of goods sold."}
        />
        <StatCard
          label={(t as any).operatingProfit || "Operating Profit (EBIT)"}
          value={fmt(operatingProfit) + " SAR"}
          sub={`${(t as any).operatingMargin || "Operating margin"} ${pct(operatingMargin)}`}
          accent="amber"
          icon={<PieIcon className="h-4 w-4" />}
          tip={isRTL ? "الربح قبل الفوائد والضرائب." : "Earnings before interest and taxes."}
        />
        <StatCard
          label={(t as any).netProfit || "Net Profit"}
          value={fmt(netProfit) + " SAR"}
          sub={`${(t as any).netMargin || "Net margin"} ${pct(netMargin)}`}
          accent={netProfit >= 0 ? "purple" : "red"}
          icon={<Wallet className="h-4 w-4" />}
          tip={isRTL ? "صافي الربح بعد جميع المصروفات والضرائب." : "Final profit after all expenses and taxes."}
        />
      </div>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>{(t as any).inputs || "Inputs"}</CardTitle>
          <CardDescription>
            {(t as any).inputsDesc ||
              "Auto-filled from your data for the selected period. Leave a field as the default or override with your own number."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label>
              {(t as any).revenue || "Revenue"} (SAR)
              <InfoTip>{isRTL ? "تجاوز إجمالي الإيرادات للفترة المختارة." : "Override total revenue for the selected period."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={revOv}
              placeholder={fmt(autoRevenue)}
              onChange={(e) => setRevOv(e.target.value)}
              data-testid="input-revenue"
            />
            <p className="text-xs text-muted-foreground">
              {(t as any).autoFromPayments || "Auto: paid payment milestones"}: {fmt(autoRevenue)} SAR
            </p>
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).cogs || "Cost of Goods Sold (COGS)"} (SAR)
              <InfoTip>{isRTL ? "التكاليف المباشرة لمواد المشاريع والخدمات." : "Direct costs of project materials and services."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={cogsOv}
              placeholder={fmt(autoCogs)}
              onChange={(e) => setCogsOv(e.target.value)}
              data-testid="input-cogs"
            />
            <p className="text-xs text-muted-foreground">
              {(t as any).autoFromProjects || "Auto: project items + services"}: {fmt(autoCogs)} SAR
            </p>
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).opex || "Operating Expenses"} (SAR)
              <InfoTip>{isRTL ? "المصروفات التشغيلية مثل الإيجار والمرافق والرواتب." : "Operating expenses like rent, utilities, salaries."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={opexOv}
              placeholder={fmt(autoOpex)}
              onChange={(e) => setOpexOv(e.target.value)}
              data-testid="input-opex"
            />
            <p className="text-xs text-muted-foreground">
              {(t as any).autoFromBills || "Auto: shop bills"}: {fmt(autoOpex)} SAR
            </p>
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).interest || "Interest"} (SAR)
              <InfoTip>{isRTL ? "مصاريف الفوائد على القروض والديون." : "Interest expense on loans and debt."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              data-testid="input-interest"
            />
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).taxes || "Taxes"} (SAR)
              <InfoTip>{isRTL ? "ضرائب الدخل المستحقة للفترة." : "Income tax expense for the period."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={taxes}
              onChange={(e) => setTaxes(e.target.value)}
              data-testid="input-taxes"
            />
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).depreciation || "Depreciation & Amortization"} (SAR)
              <InfoTip>{isRTL ? "مصاريف غير نقدية لاستهلاك الأصول؛ تُضاف لحساب EBITDA." : "Non-cash asset expense; added back for EBITDA."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={depreciation}
              onChange={(e) => setDepreciation(e.target.value)}
              data-testid="input-depreciation"
            />
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).totalAssets || "Total Assets"} (SAR)
              <InfoTip>{isRTL ? "إجمالي قيمة الأصول؛ يُستخدم لحساب ROA." : "Total asset value; used to compute ROA."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={totalAssets}
              onChange={(e) => setTotalAssets(e.target.value)}
              data-testid="input-assets"
            />
            <p className="text-xs text-muted-foreground">{(t as any).forRoa || "Used to compute ROA"}</p>
          </div>
          <div className="space-y-1">
            <Label>
              {(t as any).equity || "Shareholders' Equity"} (SAR)
              <InfoTip>{isRTL ? "حقوق المساهمين؛ تُستخدم لحساب ROE." : "Owner's equity; used to compute ROE."}</InfoTip>
            </Label>
            <Input
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              data-testid="input-equity"
            />
            <p className="text-xs text-muted-foreground">{(t as any).forRoe || "Used to compute ROE"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Income statement */}
      <Card>
        <CardHeader>
          <CardTitle>{(t as any).incomeStatement || "Income Statement"}</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label={(t as any).revenue || "Revenue"} value={revenue} />
          <Row label={(t as any).cogs || "Cost of Goods Sold (COGS)"} value={-cogs} negative />
          <Separator />
          <Row label={(t as any).grossProfit || "Gross Profit"} value={grossProfit} bold />
          <Row label={(t as any).opex || "Operating Expenses"} value={-opex} negative />
          <Separator />
          <Row label={(t as any).operatingProfit || "Operating Profit (EBIT)"} value={operatingProfit} bold />
          <Row label={(t as any).depreciation || "Depreciation & Amortization"} value={depN} sub />
          <Row label={"EBITDA"} value={ebitda} bold />
          <Separator />
          <Row label={(t as any).interest || "Interest"} value={-interestN} negative />
          <Row label={(t as any).taxes || "Taxes"} value={-taxesN} negative />
          <Separator />
          <Row label={(t as any).netProfit || "Net Profit"} value={netProfit} bold highlight />
        </CardContent>
      </Card>

      {/* Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>{(t as any).profitabilityRatios || "Profitability Ratios"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Ratio label={(t as any).grossMargin || "Gross Profit Margin"} value={pct(grossMargin)} />
          <Ratio label={(t as any).operatingMargin || "Operating Profit Margin"} value={pct(operatingMargin)} />
          <Ratio label={(t as any).netMargin || "Net Profit Margin"} value={pct(netMargin)} emphasized />
          <Ratio label={(t as any).ebitdaMargin || "EBITDA Margin"} value={pct(ebitdaMargin)} />
          <Ratio
            label={(t as any).roa || "Return on Assets (ROA)"}
            value={assetsN > 0 ? pct(roa) : "—"}
          />
          <Ratio
            label={(t as any).roe || "Return on Equity (ROE)"}
            value={equityN > 0 ? pct(roe) : "—"}
          />
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{(t as any).whatAffectsProfit || "What affects profitability?"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            (t as any).pricingStrategy || "Pricing strategy",
            (t as any).costControl || "Cost control",
            (t as any).operationalEfficiency || "Operational efficiency",
            (t as any).salesVolume || "Sales volume",
            (t as any).competition || "Competition",
            (t as any).economicConditions || "Economic conditions",
          ].map((label, i) => (
            <Badge key={i} variant="outline">
              {label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}

function Row({
  label,
  value,
  bold,
  sub,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  sub?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm py-1 ${
        highlight ? "bg-amber-50 dark:bg-amber-950/20 px-2 rounded-md" : ""
      } ${sub ? "ps-6 text-muted-foreground" : ""}`}
    >
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span
        className={`${bold ? "font-bold text-base" : "font-medium"} ${
          negative ? "text-destructive" : value < 0 ? "text-destructive" : ""
        }`}
      >
        {fmt(value)} SAR
      </span>
    </div>
  );
}

function Ratio({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        emphasized ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : ""
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
