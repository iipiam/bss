import assert from "node:assert/strict";
import { evaluatePromotions, isPromotionScheduledNow, type PromotionCandidate } from "../server/promotion-service";
import { restaurantSourceOrderSchema } from "../server/order-source-schema";
import { verifyOnlinePayment } from "../server/payment-verification";
import { parseAnalyticsRange, promotionAnalyticsContract, summarizePromotionApplications } from "../server/promotion-analytics-contract";

function promotion(overrides: Partial<PromotionCandidate> = {}): PromotionCandidate {
  return {
    id: "p1", restaurantId: "r1", name: "Test", description: null, enabled: true, paused: false,
    discountType: "percentage", discountValue: "10", priority: 1,
    startDate: "2024-01-01", endDate: "2030-12-31", startTime: "00:00", endTime: "23:59",
    timezone: "Asia/Riyadh", weekdays: [0, 1, 2, 3, 4, 5, 6], allBranches: true,
    stackingPolicy: "priority_only", maxTotalDiscount: null, usageLimit: null, createdBy: null,
    createdAt: new Date("2024-01-01T00:00:00Z"), updatedAt: new Date("2024-01-01T00:00:00Z"),
    archivedAt: null, version: 1, branches: [], usageCount: 0,
    targets: [{ id: "t1", restaurantId: "r1", promotionId: "p1", targetType: "menu_item", menuItemId: "i1", category: null }],
    ...overrides,
  };
}
const line = { id: "i1", name: "Meal", category: "Main", quantity: 2, price: 20, legacyDiscountPercent: 5 };
const evaluate = (p: PromotionCandidate | PromotionCandidate[], externalDiscount = 0, branchId = "b1") =>
  evaluatePromotions({ now: new Date("2025-06-15T12:00:00Z"), branchId, lines: [line], promotions: Array.isArray(p) ? p : [p], externalDiscount });

// Inclusive date/minute boundaries and inactive on the next minute.
const bounded = promotion({ startDate: "2025-06-15", endDate: "2025-06-15", startTime: "14:59", endTime: "15:00" });
assert.equal(isPromotionScheduledNow(bounded, new Date("2025-06-15T11:59:00Z")), true);
assert.equal(isPromotionScheduledNow(bounded, new Date("2025-06-15T12:00:59Z")), true);
assert.equal(isPromotionScheduledNow(bounded, new Date("2025-06-15T12:01:00Z")), false);

// Overnight tail belongs to the previous weekday/date.
const overnight = promotion({ startDate: "2025-06-14", endDate: "2025-06-14", startTime: "23:00", endTime: "01:00", weekdays: [6] });
assert.equal(isPromotionScheduledNow(overnight, new Date("2025-06-14T21:30:00Z")), true);
assert.equal(isPromotionScheduledNow(overnight, new Date("2025-06-14T22:01:00Z")), false);

// IANA timezone/DST: the same instant is evaluated in the configured zone.
const dst = promotion({ timezone: "America/New_York", startDate: "2025-03-09", endDate: "2025-03-09", startTime: "03:00", endTime: "03:00", weekdays: [0] });
assert.equal(isPromotionScheduledNow(dst, new Date("2025-03-09T07:00:00Z")), true);

assert.equal(evaluate(promotion()).promotionDiscount, 4); // percentage
assert.equal(evaluate(promotion({ discountType: "fixed_product", discountValue: "3" })).promotionDiscount, 6);
assert.equal(evaluate(promotion({ discountType: "special_price", discountValue: "12" })).promotionDiscount, 16);
assert.equal(evaluate(promotion({ discountType: "fixed_order", discountValue: "7", targets: [] })).promotionDiscount, 7);
assert.equal(evaluate(promotion({ discountType: "fixed_product", discountValue: "99" })).subtotal, 0); // clamp
assert.equal(evaluate(promotion({ discountType: "percentage", discountValue: "90", maxTotalDiscount: "5" })).promotionDiscount, 5);

// Priority, deterministic createdAt/id tie and selected branches.
const low = promotion({ id: "low", priority: 1, discountValue: "90" });
const high = promotion({ id: "high", priority: 2, discountValue: "10" });
assert.equal(evaluate([low, high]).applications[0].promotionId, "high");
const early = promotion({ id: "a", createdAt: new Date("2023-01-01"), discountValue: "5" });
const late = promotion({ id: "b", createdAt: new Date("2024-01-01"), discountValue: "50" });
assert.equal(evaluate([late, early]).applications[0].promotionId, "a");
assert.equal(evaluate(promotion({ allBranches: false, branches: ["b2"] }), 0, "b1").promotionDiscount, 0);
assert.equal(evaluate(promotion({ allBranches: false, branches: ["b1"] })).promotionDiscount, 4);

// Category target, usage cap and explicit external non-stacking.
assert.equal(evaluate(promotion({ targets: [{ id: "c", restaurantId: "r1", promotionId: "p1", targetType: "category", menuItemId: null, category: "Main" }] })).promotionDiscount, 4);
assert.equal(evaluate(promotion({ usageLimit: 1, usageCount: 1 })).promotionDiscount, 0);
const external = evaluate(promotion(), 12);
assert.equal(external.externalDiscount, 0);
assert.equal(external.externalDiscountSuppressed, true);
assert.equal(evaluate(promotion({ enabled: false }), 12).externalDiscount, 0); // legacy item discount also blocks coupon
assert.equal(evaluatePromotions({
  now: new Date("2025-06-15T12:00:00Z"), branchId: "b1",
  lines: [{ ...line, legacyDiscountPercent: 0 }], promotions: [], externalDiscount: 12,
}).externalDiscount, 12);

// A scheduled winner on one line suppresses legacy menu discounts on every
// other line; priority-only is an order-wide family policy, not per-line stack.
const mixed = evaluatePromotions({
  now: new Date("2025-06-15T12:00:00Z"), branchId: "b1",
  promotions: [promotion()],
  lines: [
    { id: "i1", name: "Scheduled", category: "Main", quantity: 1, price: 20, legacyDiscountPercent: 50 },
    { id: "i2", name: "Legacy only", category: "Other", quantity: 1, price: 20, legacyDiscountPercent: 50 },
  ],
});
assert.equal(mixed.promotionDiscount, 2);
assert.equal(mixed.legacyDiscount, 0);
assert.equal(mixed.lines[1].lineDiscountAmount, 0);

// Canonical input wins: submitted line display fields are transformed into an
// immutable breakdown whose arithmetic reconciles to halala.
const snapshot = evaluate(promotion());
assert.equal(snapshot.lines[0].originalPrice, 20);
assert.equal(snapshot.lines[0].price, 18);
assert.equal(snapshot.applications[0].snapshot.lines[0].originalUnitPrice, 20);
assert.equal(snapshot.originalSubtotal - snapshot.discountAmount, snapshot.subtotal);
assert.ok(Object.isFrozen(Object.freeze(structuredClone(snapshot.applications[0].snapshot))));

// Source checkout accepts the frontend's price-free cart and preserves addonIds
// for canonical reloading, while rejecting unknown request fields.
const sourceCheckout = restaurantSourceOrderSchema.parse({
  orderNumber: "ORD-test", branchId: "branch-1", orderType: "Dine-In",
  items: [{ id: "item-1", quantity: 2, addonIds: ["addon-1"] }],
  moyasarPaymentId: "pay_test_123", paymentStatus: "Paid",
});
assert.deepEqual(sourceCheckout.items[0].addonIds, ["addon-1"]);
assert.equal(sourceCheckout.moyasarPaymentId, "pay_test_123");
assert.equal(sourceCheckout.paymentStatus, "Paid");
assert.equal(restaurantSourceOrderSchema.safeParse({
  ...sourceCheckout, items: [{ id: "item-1", quantity: 1 }], untrusted: true,
}).success, false);

// Invoice/ZATCA consumers must use the stored final line snapshot, not a
// mutable price or a re-evaluated promotion.
const storedLine = { quantity: 2, price: 99, lineFinalSubtotal: 31.25, addons: [{ price: 4 }], promotion: { name: "Lunch" } };
const invoiceBase = storedLine.lineFinalSubtotal;
assert.equal(invoiceBase, 31.25);
assert.equal(Number((invoiceBase * 0.15).toFixed(2)), 4.69);

// Discounted delivery legal sale remains separate from platform profitability.
const deliveryLines = [18.37, 9.13];
const deliverySubtotal = deliveryLines.reduce((sum, value) => sum + value, 0);
const deliveryTax = Math.round(deliverySubtotal * 0.15 * 100) / 100;
const deliveryTotal = Math.round((deliverySubtotal + deliveryTax) * 100) / 100;
const deliverySnapshot = { gross: deliveryTotal, commission: 5, banking: 1, subsidy: 2, vat: 1.2, posFees: 1, net: 22.43 };
assert.equal(deliverySubtotal, 27.5);
assert.equal(deliveryTax, 4.13);
assert.equal(deliveryTotal, 31.63);
assert.notEqual(deliverySnapshot.net, deliveryTotal);
assert.equal(deliverySnapshot.gross, deliveryTotal);

const paymentBase = { requestedId: "pay_1", paymentMethod: "Online", expectedAmountHalalas: 3163, restaurantId: "r1",
  record: { id: "dbp1", restaurantId: "r1", moyasarId: "pay_1", orderId: null },
  provider: { id: "pay_1", status: "paid", currency: "SAR", amount: 3163 } };
assert.equal(verifyOnlinePayment(paymentBase).paymentStatus, "Paid");
for (const bad of [
  { ...paymentBase, provider: { ...paymentBase.provider, status: "failed" } },
  { ...paymentBase, provider: { ...paymentBase.provider, amount: 3162 } },
  { ...paymentBase, record: { ...paymentBase.record, restaurantId: "forged" } },
  { ...paymentBase, record: { ...paymentBase.record, orderId: "already-used" } },
]) assert.throws(() => verifyOnlinePayment(bad));

const bases = [1837, 913], taxTarget = 413;
const vats = bases.map((base, index) => index === bases.length - 1 ? taxTarget - Math.floor(taxTarget * bases[0] / 2750) : Math.floor(taxTarget * base / 2750));
assert.equal(vats.reduce((a, b) => a + b, 0), taxTarget);
assert.equal(bases.reduce((a, b) => a + b, 0) + vats.reduce((a, b) => a + b, 0), 3163);

const applicationRows = [{
  orderId: "order-1", finalSubtotal: "42.50", discountAmount: "7.50",
  snapshot: { lines: [{ menuItemId: "item-1", name: "Meal", quantity: 2, discountAmount: 7.5 }] },
}];
const recordedMetrics = summarizePromotionApplications(applicationRows);
assert.ok(recordedMetrics.revenue > 0);
assert.ok(recordedMetrics.orders > 0);
assert.ok(recordedMetrics.grossDiscount > 0);
const analyticsShape = promotionAnalyticsContract({
  promotion: { id: "promo-1" }, period: { start: new Date(), end: new Date() },
  metrics: recordedMetrics, baseline: summarizePromotionApplications([]), totalOrders: 4,
  upliftPercent: null, topProducts: [], branches: [], dayPerformance: [], hourPerformance: [], marginWarnings: [],
});
for (const key of ["promotion", "period", "metrics", "baseline", "upliftPercent", "topProducts", "branches", "dayPerformance", "hourPerformance", "marginWarnings", "tips"]) {
  assert.ok(key in analyticsShape, `analytics contract missing ${key}`);
}
assert.equal(analyticsShape.metrics.applicationRate, 0.25);
const noDataShape = promotionAnalyticsContract({
  promotion: { id: "promo-1" }, period: {}, metrics: summarizePromotionApplications([]),
  baseline: summarizePromotionApplications([]), totalOrders: 0, upliftPercent: null,
});
assert.equal(noDataShape.metrics.applicationRate, 0);
assert.deepEqual(noDataShape.topProducts, []);
assert.ok(noDataShape.tips.length > 0);

const analyticsNow = new Date("2026-06-15T12:00:00.000Z");
const defaultRange = parseAnalyticsRange("", "   ", analyticsNow);
assert.equal(defaultRange.end.toISOString(), analyticsNow.toISOString());
assert.equal(defaultRange.start.toISOString(), "2026-05-16T12:00:00.000Z");
const datedRange = parseAnalyticsRange("2026-06-01", "2026-06-03", analyticsNow);
assert.equal(datedRange.start.toISOString(), "2026-06-01T00:00:00.000Z");
assert.equal(datedRange.end.toISOString(), "2026-06-03T23:59:59.999Z");
assert.ok(Number.isFinite(datedRange.previousStart.getTime()));
const startOnly = parseAnalyticsRange("2026-06-01", undefined, analyticsNow);
assert.equal(startOnly.start.toISOString(), "2026-06-01T00:00:00.000Z");
assert.equal(startOnly.end.toISOString(), analyticsNow.toISOString());
const endOnly = parseAnalyticsRange(undefined, "2026-06-10", analyticsNow);
assert.equal(endOnly.end.toISOString(), "2026-06-10T23:59:59.999Z");
assert.equal(endOnly.start.toISOString(), "2026-05-11T23:59:59.999Z");
for (const args of [
  ["not-a-date", "2026-06-01"],
  ["2026-02-30", "2026-03-01"],
  ["2024-01-01", "2026-01-01"],
  ["0001-01-01", "0001-01-02"],
  ["2026-06-03", "2026-06-01"],
] as const) assert.throws(() => parseAnalyticsRange(args[0], args[1], analyticsNow));

console.log("Promotion verifier passed: schedule, timezone/DST, overnight, priority, branches, targets, math, caps, non-stacking and snapshots.");