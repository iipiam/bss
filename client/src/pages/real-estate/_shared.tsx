import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRealEstateT, localizedStatus, localizedPriority } from "@/i18n/realEstateTranslations";

export const halalaToSar = (h: number | string | null | undefined) => {
  const n = typeof h === "string" ? Number(h) : h ?? 0;
  return ((n || 0) / 100).toFixed(2);
};

export const fmtSar = (h: number | string | null | undefined) => {
  return `ر.س ${Number(halalaToSar(h)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

export const sarToHalala = (sar: number | string) => Math.round(Number(sar || 0) * 100);

export const fmtDate = (d?: string | Date | null) => {
  if (!d) return "—";
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
};

export function useRET() {
  const { language } = useLanguage();
  return getRealEstateT(language);
}

const STATUS_TONES: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rented: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  terminated: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  renewed: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  partial: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  overdue: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
  open: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  assigned: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  in_progress: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  under_maintenance: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  for_sale: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  inactive: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const t = useRET();
  const s = String(status || "—");
  const tone = STATUS_TONES[s] || "bg-muted text-muted-foreground";
  return <Badge className={`${tone} no-default-active-elevate`} data-testid={`badge-status-${s}`}>{localizedStatus(t, s)}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const t = useRET();
  const map: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    urgent: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  const p = String(priority || "medium");
  return <Badge className={`${map[p] || map.medium} no-default-active-elevate`}>{localizedPriority(t, p)}</Badge>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-row gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function REBreadcrumb() {
  const t = useRET();
  return (
    <div className="mb-2 text-sm text-muted-foreground">
      <Link href="/real-estate" className="hover:underline" data-testid="link-re-home">{t.propertyManagement}</Link>
    </div>
  );
}

export async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
