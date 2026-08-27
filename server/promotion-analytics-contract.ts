const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export class AnalyticsRangeError extends Error {}

export function parseAnalyticsRange(rawStart: unknown, rawEnd: unknown, now = new Date()) {
  const parse = (raw: unknown, endOfDay: boolean): Date | undefined => {
    if (raw == null || String(raw).trim() === "") return undefined;
    const value = String(raw).trim();
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new AnalyticsRangeError("Invalid analytics date");
      }
    } else {
      // Bounded ISO compatibility; locale/browser date strings are rejected.
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
        throw new AnalyticsRangeError("Analytics dates must be YYYY-MM-DD or ISO timestamps");
      }
      date = new Date(value);
    }
    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) {
      throw new AnalyticsRangeError("Analytics date year is out of range");
    }
    return date;
  };
  if (!Number.isFinite(now.getTime())) throw new AnalyticsRangeError("Invalid analytics clock");
  const explicitEnd = parse(rawEnd, true);
  const end = explicitEnd || new Date(now);
  const start = parse(rawStart, false) || new Date(end.getTime() - 30 * 86400000);
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(duration) || duration < 0) throw new AnalyticsRangeError("Analytics start must not be after end");
  if (duration > 366 * 86400000) throw new AnalyticsRangeError("Analytics range cannot exceed 366 days");
  const previousStart = new Date(start.getTime() - duration);
  if (!Number.isFinite(previousStart.getTime()) || previousStart.getUTCFullYear() < 1999 || previousStart.getUTCFullYear() > 2100) {
    throw new AnalyticsRangeError("Analytics baseline is out of range");
  }
  return { start, end, previousStart };
}

export function summarizePromotionApplications(rows: any[]) {
  const orders = new Set(rows.map((row) => row.orderId)).size;
  const revenue = rows.reduce((sum, row) => sum + Number(row.finalSubtotal), 0);
  const units = rows.reduce((sum, row) => sum + (row.snapshot?.lines || []).reduce((n: number, line: any) => n + Number(line.quantity || 0), 0), 0);
  const grossDiscount = rows.reduce((sum, row) => sum + Number(row.discountAmount), 0);
  return { revenue: round(revenue), orders, units, grossDiscount: round(grossDiscount), aov: orders ? round(revenue / orders) : 0 };
}

export function promotionAnalyticsTips(metrics: ReturnType<typeof summarizePromotionApplications>, uplift: number | null) {
  if (!metrics.orders) return ["No promotion applications in this period. Review schedule, branch and product targeting."];
  if (uplift != null && uplift < 0) return ["Revenue is below the comparable previous period; review targeting and discount depth."];
  if (metrics.grossDiscount > metrics.revenue * 0.25) return ["Discount cost exceeds 25% of promoted revenue; review caps and margins."];
  return ["Promotion is producing measurable orders; test one variable at a time before increasing discount depth."];
}

export function promotionAnalyticsContract(input: any) {
  return {
    promotion: input.promotion, period: input.period,
    metrics: { ...input.metrics, applicationRate: input.totalOrders ? input.metrics.orders / input.totalOrders : 0 },
    baseline: input.baseline, upliftPercent: input.upliftPercent,
    topProducts: input.topProducts || [], branches: input.branches || [],
    dayPerformance: input.dayPerformance || [], hourPerformance: input.hourPerformance || [],
    marginWarnings: input.marginWarnings || [],
    tips: input.tips || promotionAnalyticsTips(input.metrics, input.upliftPercent),
  };
}