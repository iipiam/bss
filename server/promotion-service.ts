import type { Promotion, PromotionTarget } from "@shared/schema";
import { roundHalala } from "@shared/deliveryCalc";

export interface PromotionCandidate extends Promotion {
  branches: string[];
  targets: PromotionTarget[];
  usageCount?: number;
}

export interface PromotionLineInput {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  legacyDiscountPercent?: number;
  addons?: Array<{ id: string; name: string; price: number }>;
}

export interface EvaluatedLine extends PromotionLineInput {
  originalPrice: number;
  lineOriginalSubtotal: number;
  lineDiscountAmount: number;
  lineFinalSubtotal: number;
  promotion?: { id: string; name: string; discountType: string; discountValue: number };
}

export interface PromotionEvaluation {
  evaluatedAt: string;
  originalSubtotal: number;
  subtotal: number;
  promotionDiscount: number;
  legacyDiscount: number;
  externalDiscount: number;
  externalDiscountSuppressed: boolean;
  discountAmount: number;
  lines: EvaluatedLine[];
  applications: Array<{
    promotionId: string;
    originalSubtotal: number;
    discountAmount: number;
    finalSubtotal: number;
    snapshot: {
      engineVersion: 1;
      evaluatedAt: string;
      timezone: string;
      promotion: { id: string; name: string; discountType: string; discountValue: number; priority: number; version: number };
      lines: Array<{ menuItemId: string; name: string; quantity: number; originalUnitPrice: number; finalUnitPrice: number; discountAmount: number }>;
      externalDiscountSuppressed: boolean;
    };
  }>;
}

const weekdayIndex: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function localParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || "";
  const hour = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minute: hour * 60 + Number(get("minute")),
    weekday: weekdayIndex[get("weekday")],
  };
}

function previousIsoDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

const minuteOfDay = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));

/** Inclusive endpoints and minute precision. Overnight tails belong to the
 * weekday/date on which the window started. */
export function isPromotionScheduledNow(promotion: PromotionCandidate, now: Date): boolean {
  if (!promotion.enabled || promotion.paused || promotion.archivedAt) return false;
  if (promotion.usageLimit != null && (promotion.usageCount || 0) >= promotion.usageLimit) return false;
  let local: ReturnType<typeof localParts>;
  try { local = localParts(now, promotion.timezone); } catch { return false; }
  const start = minuteOfDay(promotion.startTime);
  const end = minuteOfDay(promotion.endTime);
  let logicalDate = local.date;
  let logicalWeekday = local.weekday;
  let inWindow: boolean;
  if (end >= start) {
    inWindow = local.minute >= start && local.minute <= end;
  } else if (local.minute >= start) {
    inWindow = true;
  } else if (local.minute <= end) {
    inWindow = true;
    logicalDate = previousIsoDate(local.date);
    logicalWeekday = (local.weekday + 6) % 7;
  } else {
    inWindow = false;
  }
  return inWindow
    && logicalDate >= promotion.startDate
    && logicalDate <= promotion.endDate
    && promotion.weekdays.includes(logicalWeekday);
}

export function derivePromotionLifecycle(promotion: PromotionCandidate, now = new Date()) {
  if (promotion.archivedAt) return { state: "archived", countdownMs: null };
  if (promotion.paused) return { state: "paused", countdownMs: null };
  if (!promotion.enabled) return { state: "draft", countdownMs: null };
  if (isPromotionScheduledNow(promotion, now)) return { state: "active", countdownMs: null };
  // This countdown is date-level and intentionally approximate for list UI;
  // quote correctness always uses the timezone evaluator above.
  const start = Date.parse(`${promotion.startDate}T${promotion.startTime}:00Z`);
  if (start > now.getTime()) return { state: "scheduled", countdownMs: start - now.getTime() };
  return { state: "ended", countdownMs: null };
}

function comparePromotion(a: PromotionCandidate, b: PromotionCandidate): number {
  return b.priority - a.priority
    || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    || a.id.localeCompare(b.id);
}

function targetsLine(p: PromotionCandidate, line: PromotionLineInput): boolean {
  if (p.discountType === "fixed_order") return false;
  return p.targets.some((target) =>
    (target.targetType === "menu_item" && target.menuItemId === line.id)
    || (target.targetType === "category" && target.category === line.category));
}

function itemDiscountHalalas(p: PromotionCandidate, unitHalalas: number, quantity: number): number {
  if (p.discountType === "percentage") {
    return Math.round(unitHalalas * quantity * Math.min(100, Number(p.discountValue)) / 100);
  }
  if (p.discountType === "fixed_product") {
    return Math.round(Number(p.discountValue) * 100) * quantity;
  }
  if (p.discountType === "special_price") {
    return Math.max(0, unitHalalas - Math.round(Number(p.discountValue) * 100)) * quantity;
  }
  return 0;
}

/**
 * Pure pricing evaluator. Scheduled promotions have administrative precedence
 * over legacy menu discounts. Priority-only means one scheduled promotion
 * family wins: an order promotion competes with the highest item winner, and
 * losing promotion types are not stacked. An external coupon/blogger discount
 * is accepted only when no scheduled promotion produced a discount.
 */
export function evaluatePromotions(input: {
  now?: Date;
  branchId: string;
  lines: PromotionLineInput[];
  promotions: PromotionCandidate[];
  externalDiscount?: number;
}): PromotionEvaluation {
  const now = input.now || new Date();
  const active = input.promotions
    .filter((p) => isPromotionScheduledNow(p, now))
    .filter((p) => p.allBranches || p.branches.includes(input.branchId))
    .sort(comparePromotion);
  const itemCandidates = active.filter((p) => p.discountType !== "fixed_order");
  const orderCandidate = active.find((p) => p.discountType === "fixed_order");
  const selectedByLine = input.lines.map((line) => itemCandidates.find((p) => targetsLine(p, line)));
  const bestItem = selectedByLine.filter((p): p is PromotionCandidate => !!p).sort(comparePromotion)[0];
  const useOrder = !!orderCandidate && (!bestItem || comparePromotion(orderCandidate, bestItem) < 0);
  const chosenOrder = useOrder ? orderCandidate : undefined;
  // Priority-only is order-wide: if the scheduled winner family can discount
  // any line/order, legacy per-item discounts are suppressed everywhere.
  const scheduledFamilyCanDiscount = !!chosenOrder
    ? Number(chosenOrder.discountValue) > 0
    : input.lines.some((line, index) => {
        const p = selectedByLine[index];
        return !!p && itemDiscountHalalas(p, Math.max(0, Math.round(line.price * 100)), Math.max(1, Math.trunc(line.quantity))) > 0;
      });
  const evaluatedAt = now.toISOString();
  const appLines = new Map<string, EvaluatedLine[]>();
  let originalHalalas = 0;
  let scheduledHalalas = 0;
  let legacyHalalas = 0;
  const promotionSpend = new Map<string, number>();

  const lines: EvaluatedLine[] = input.lines.map((line, index) => {
    const quantity = Math.max(1, Math.trunc(line.quantity));
    const unit = Math.max(0, Math.round(line.price * 100));
    const addons = (line.addons || []).reduce((sum, a) => sum + Math.max(0, Math.round(a.price * 100)), 0);
    const base = (unit + addons) * quantity;
    originalHalalas += base;
    const promotion = chosenOrder ? undefined : selectedByLine[index];
    let discount = promotion ? itemDiscountHalalas(promotion, unit, quantity) : 0;
    if (promotion?.maxTotalDiscount != null) {
      const cap = Math.round(Number(promotion.maxTotalDiscount) * 100);
      discount = Math.min(discount, Math.max(0, cap - (promotionSpend.get(promotion.id) || 0)));
    }
    discount = Math.min(base, Math.max(0, discount));
    if (promotion) {
      scheduledHalalas += discount;
      promotionSpend.set(promotion.id, (promotionSpend.get(promotion.id) || 0) + discount);
    } else if (!scheduledFamilyCanDiscount) {
      const legacyPercent = Math.min(100, Math.max(0, Number(line.legacyDiscountPercent) || 0));
      discount = Math.round(unit * quantity * legacyPercent / 100);
      legacyHalalas += discount;
    }
    const result: EvaluatedLine = {
      ...line,
      quantity,
      // Stored item.price remains the item unit price; add-ons remain separate
      // so invoice/cart consumers do not count them twice.
      price: roundHalala(Math.max(0, unit * quantity - discount) / quantity / 100),
      originalPrice: roundHalala(unit / 100),
      lineOriginalSubtotal: roundHalala(base / 100),
      lineDiscountAmount: roundHalala(discount / 100),
      lineFinalSubtotal: roundHalala((base - discount) / 100),
      ...(promotion ? { promotion: {
        id: promotion.id, name: promotion.name, discountType: promotion.discountType,
        discountValue: Number(promotion.discountValue),
      }} : {}),
    };
    if (promotion && discount > 0) appLines.set(promotion.id, [...(appLines.get(promotion.id) || []), result]);
    return result;
  });

  if (chosenOrder) {
    let discount = Math.round(Number(chosenOrder.discountValue) * 100);
    if (chosenOrder.maxTotalDiscount != null) discount = Math.min(discount, Math.round(Number(chosenOrder.maxTotalDiscount) * 100));
    discount = Math.min(originalHalalas, Math.max(0, discount));
    scheduledHalalas = discount;
    if (discount > 0) {
      let allocated = 0;
      lines.forEach((line, index) => {
        const original = Math.round(line.lineOriginalSubtotal * 100);
        const share = index === lines.length - 1
          ? discount - allocated
          : Math.min(original, Math.floor(discount * original / originalHalalas));
        allocated += share;
        line.lineDiscountAmount = roundHalala(share / 100);
        line.lineFinalSubtotal = roundHalala((original - share) / 100);
        line.promotion = {
          id: chosenOrder.id, name: chosenOrder.name, discountType: chosenOrder.discountType,
          discountValue: Number(chosenOrder.discountValue),
        };
      });
      appLines.set(chosenOrder.id, lines);
    }
  }
  const hasScheduled = scheduledHalalas > 0;
  const hasInternalLineDiscount = hasScheduled || legacyHalalas > 0;
  const externalHalalas = hasInternalLineDiscount ? 0 : Math.min(
    Math.max(0, originalHalalas - legacyHalalas),
    Math.max(0, Math.round((input.externalDiscount || 0) * 100)),
  );
  const totalDiscount = scheduledHalalas + legacyHalalas + externalHalalas;
  const byId = new Map(active.map((p) => [p.id, p]));
  const applications = [...appLines.entries()].map(([id, affected]) => {
    const p = byId.get(id)!;
    const discount = chosenOrder?.id === id
      ? scheduledHalalas
      : affected.reduce((sum, line) => sum + Math.round(line.lineDiscountAmount * 100), 0);
    const original = affected.reduce((sum, line) => sum + Math.round(line.lineOriginalSubtotal * 100), 0);
    return {
      promotionId: id,
      originalSubtotal: roundHalala(original / 100),
      discountAmount: roundHalala(discount / 100),
      finalSubtotal: roundHalala((original - discount) / 100),
      snapshot: {
        engineVersion: 1 as const,
        evaluatedAt,
        timezone: p.timezone,
        promotion: {
          id: p.id, name: p.name, discountType: p.discountType,
          discountValue: Number(p.discountValue), priority: p.priority, version: p.version,
        },
        lines: affected.map((line) => ({
          menuItemId: line.id, name: line.name, quantity: line.quantity,
          originalUnitPrice: line.originalPrice,
          finalUnitPrice: p.discountType === "fixed_order"
            ? roundHalala(line.lineFinalSubtotal / line.quantity)
            : line.price,
          discountAmount: line.lineDiscountAmount,
        })),
        externalDiscountSuppressed: hasInternalLineDiscount && (input.externalDiscount || 0) > 0,
      },
    };
  });
  return {
    evaluatedAt,
    originalSubtotal: roundHalala(originalHalalas / 100),
    subtotal: roundHalala((originalHalalas - totalDiscount) / 100),
    promotionDiscount: roundHalala(scheduledHalalas / 100),
    legacyDiscount: roundHalala(legacyHalalas / 100),
    externalDiscount: roundHalala(externalHalalas / 100),
    externalDiscountSuppressed: hasInternalLineDiscount && (input.externalDiscount || 0) > 0,
    discountAmount: roundHalala(totalDiscount / 100),
    lines,
    applications,
  };
}

export const previewPromotions = evaluatePromotions;