import type { Express, RequestHandler } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  addons, branches, menuCategories, menuItems, orderPromotionApplications,
  promotionBranches, promotions, promotionTargets,
} from "@shared/schema";
import { AnalyticsRangeError, parseAnalyticsRange, promotionAnalyticsContract, summarizePromotionApplications } from "./promotion-analytics-contract";
import { derivePromotionLifecycle, evaluatePromotions, type PromotionCandidate } from "./promotion-service";

const targetInput = z.discriminatedUnion("targetType", [
  z.object({ targetType: z.literal("menu_item"), menuItemId: z.string().min(1), category: z.never().optional() }).strict(),
  z.object({ targetType: z.literal("category"), category: z.string().trim().min(1), menuItemId: z.never().optional() }).strict(),
]);
const timeMinute = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const money = z.union([z.string().regex(/^\d+(\.\d{1,2})?$/), z.number().finite().nonnegative()]).transform((v) => Number(v).toFixed(2));
const managementBase = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  enabled: z.boolean().default(false),
  paused: z.boolean().default(false),
  discountType: z.enum(["percentage", "fixed_product", "special_price", "fixed_order"]),
  discountValue: money,
  priority: z.number().int().min(-100000).max(100000).default(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: timeMinute.default("00:00"),
  endTime: timeMinute.default("23:59"),
  timezone: z.string().min(1).default("Asia/Riyadh").refine((v) => {
    try { new Intl.DateTimeFormat("en-US", { timeZone: v }).format(); return true; } catch { return false; }
  }, "Invalid IANA timezone"),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7).refine((v) => new Set(v).size === v.length),
  allBranches: z.boolean().default(true),
  stackingPolicy: z.literal("priority_only").default("priority_only"),
  maxTotalDiscount: money.nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  branchIds: z.array(z.string().min(1)).max(500).default([]),
  targets: z.array(targetInput).max(500).default([]),
}).strict();
const managementInput = managementBase.superRefine((v, ctx) => {
  if (v.endDate < v.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "endDate must be on or after startDate" });
  if (v.discountType === "percentage" && Number(v.discountValue) > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["discountValue"], message: "Percentage cannot exceed 100" });
});
const patchInput = managementBase.partial().extend({ version: z.number().int().positive() }).strict();
const quoteInput = z.object({
  branchId: z.string().min(1),
  items: z.array(z.object({
    id: z.string().min(1), quantity: z.number().int().positive().max(1000),
    addonIds: z.array(z.string().min(1)).max(100).optional(),
  }).strict()).min(1).max(500),
  externalDiscount: z.number().finite().nonnegative().optional(),
}).strict();

async function loadPromotions(restaurantId: string, executor: any = db): Promise<PromotionCandidate[]> {
  const [rows, branchRows, targetRows, usageRows]: [any[], any[], any[], any[]] = await Promise.all([
    executor.select().from(promotions).where(eq(promotions.restaurantId, restaurantId)).orderBy(desc(promotions.priority), asc(promotions.createdAt), asc(promotions.id)),
    executor.select().from(promotionBranches).where(eq(promotionBranches.restaurantId, restaurantId)),
    executor.select().from(promotionTargets).where(eq(promotionTargets.restaurantId, restaurantId)),
    executor.select({ promotionId: orderPromotionApplications.promotionId, count: sql<number>`count(*)::int` })
      .from(orderPromotionApplications).where(eq(orderPromotionApplications.restaurantId, restaurantId))
      .groupBy(orderPromotionApplications.promotionId),
  ]);
  const counts = new Map(usageRows.map((r) => [r.promotionId, Number(r.count)]));
  return rows.map((p) => ({
    ...p,
    branches: branchRows.filter((b) => b.promotionId === p.id).map((b) => b.branchId),
    targets: targetRows.filter((t) => t.promotionId === p.id),
    usageCount: counts.get(p.id) || 0,
  }));
}

export async function lockPromotionPricing(tx: any, restaurantId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`promotion-pricing:${restaurantId}`}, 0))`);
}

function promotionResponse(p: PromotionCandidate, now = new Date()) {
  return {
    ...p,
    // Stable management payload; retain `branches` for older consumers.
    branchIds: [...p.branches],
    targets: p.targets.map((t) => t.targetType === "menu_item"
      ? { targetType: "menu_item" as const, menuItemId: t.menuItemId! }
      : { targetType: "category" as const, category: t.category! }),
    lifecycle: derivePromotionLifecycle(p, now),
  };
}


async function validateLinks(restaurantId: string, data: {
  allBranches?: boolean; branchIds?: string[];
  discountType?: string; targets?: z.infer<typeof targetInput>[];
}) {
  const branchIds = data.branchIds || [];
  if (data.allBranches === false && branchIds.length === 0) throw new Error("At least one branch is required");
  if (branchIds.length) {
    const owned = await db.select({ id: branches.id }).from(branches)
      .where(and(eq(branches.restaurantId, restaurantId), inArray(branches.id, branchIds)));
    if (new Set(owned.map((v) => v.id)).size !== new Set(branchIds).size) throw new Error("A branch does not belong to this restaurant");
  }
  const targets = data.targets || [];
  const itemIds = targets.filter((t) => t.targetType === "menu_item").map((t) => (t as any).menuItemId as string);
  if (itemIds.length) {
    const owned = await db.select({ id: menuItems.id }).from(menuItems)
      .where(and(eq(menuItems.restaurantId, restaurantId), inArray(menuItems.id, itemIds)));
    if (new Set(owned.map((v) => v.id)).size !== new Set(itemIds).size) throw new Error("A menu item does not belong to this restaurant");
  }
  const categories = targets.filter((t) => t.targetType === "category").map((t) => (t as any).category as string);
  if (categories.length) {
    const [used, configured] = await Promise.all([
      db.selectDistinct({ category: menuItems.category }).from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), inArray(menuItems.category, categories))),
      db.select({ category: menuCategories.name }).from(menuCategories)
        .where(and(eq(menuCategories.restaurantId, restaurantId), inArray(menuCategories.name, categories))),
    ]);
    const known = new Set([...used, ...configured].map((v) => v.category));
    if (categories.some((category) => !known.has(category))) throw new Error("A category does not belong to this restaurant");
  }
  if (data.discountType && data.discountType !== "fixed_order" && targets.length === 0) throw new Error("Product promotions require at least one target");
  if (data.discountType === "fixed_order" && targets.length) throw new Error("Order promotions cannot have product targets");
}

function managementOnly(req: any, res: any, next: any) {
  if (req.session.user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}

async function replaceLinks(tx: any, restaurantId: string, promotionId: string, branchIds: string[], targets: z.infer<typeof targetInput>[]) {
  await tx.delete(promotionBranches).where(and(eq(promotionBranches.restaurantId, restaurantId), eq(promotionBranches.promotionId, promotionId)));
  await tx.delete(promotionTargets).where(and(eq(promotionTargets.restaurantId, restaurantId), eq(promotionTargets.promotionId, promotionId)));
  if (branchIds.length) await tx.insert(promotionBranches).values(branchIds.map((branchId) => ({ restaurantId, promotionId, branchId })));
  if (targets.length) await tx.insert(promotionTargets).values(targets.map((t) => ({
    restaurantId, promotionId, targetType: t.targetType,
    menuItemId: t.targetType === "menu_item" ? t.menuItemId : null,
    category: t.targetType === "category" ? t.category : null,
  })));
}

async function canonicalQuote(restaurantId: string, input: z.infer<typeof quoteInput>, executor: any = db, capturedAt = new Date()) {
  const branch = await executor.select({ id: branches.id }).from(branches)
    .where(and(eq(branches.id, input.branchId), eq(branches.restaurantId, restaurantId))).limit(1);
  if (!branch.length) throw new Error("Branch is required and must belong to this restaurant");
  const ids = [...new Set(input.items.map((i) => i.id))];
  const rows = await executor.select().from(menuItems).where(and(eq(menuItems.restaurantId, restaurantId), inArray(menuItems.id, ids)));
  if (rows.length !== ids.length) throw new Error("A menu item is invalid or belongs to another restaurant");
  const addonIds = [...new Set(input.items.flatMap((i) => i.addonIds || []))];
  const addonRows = addonIds.length
    ? await executor.select().from(addons).where(and(eq(addons.restaurantId, restaurantId), inArray(addons.id, addonIds)))
    : [];
  if (addonRows.length !== addonIds.length) throw new Error("An add-on is invalid or belongs to another restaurant");
  const itemMap = new Map<string, any>(rows.map((i: any) => [i.id, i]));
  const addonMap = new Map<string, any>(addonRows.map((a: any) => [a.id, a]));
  const lines = input.items.map((requested) => {
    const item = itemMap.get(requested.id)!;
    const selected = (requested.addonIds || []).map((id) => {
      const addon = addonMap.get(id)!;
      if (addon.menuItemIds?.length && !addon.menuItemIds.includes(item.id)) throw new Error(`Add-on ${addon.name} is not valid for ${item.name}`);
      return { id: addon.id, name: addon.name, price: Number(addon.basePrice) };
    });
    return {
      id: item.id, name: item.name, category: item.category, quantity: requested.quantity,
      // POS pricing is VAT-exclusive; tax/delivery gross-up is computed only
      // after all discounts. Never use the submitted cart price.
      price: Number(item.basePrice), legacyDiscountPercent: Number(item.discount), addons: selected,
    };
  });
  return evaluatePromotions({
    branchId: input.branchId, lines, promotions: await loadPromotions(restaurantId, executor), now: capturedAt,
    externalDiscount: input.externalDiscount,
  });
}

export function registerPromotionRoutes(
  app: Express,
  requireAuth: RequestHandler,
  requireRestaurant: RequestHandler,
  broadcast: (event: any) => void,
) {
  const secured = [requireAuth, requireRestaurant];
  app.get("/api/promotions", ...secured, managementOnly, async (req: any, res) => {
    const now = new Date();
    const rows = await loadPromotions(req.session.user.restaurantId);
    res.json(rows.map((p) => promotionResponse(p, now)));
  });
  app.get("/api/promotions/active/quote", ...secured, async (req: any, res) => {
    try {
      const itemIds = String(req.query.itemIds || "").split(",").filter(Boolean);
      const quantities = String(req.query.quantities || "").split(",").map(Number);
      const parsed = quoteInput.parse({
        branchId: req.query.branchId,
        items: itemIds.map((id, i) => ({ id, quantity: quantities[i] || 1 })),
      });
      res.json(await canonicalQuote(req.session.user.restaurantId, parsed));
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.post("/api/promotions/quote", ...secured, async (req: any, res) => {
    try { res.json(await canonicalQuote(req.session.user.restaurantId, quoteInput.parse(req.body))); }
    catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.get("/api/promotions/preview", ...secured, managementOnly, async (req: any, res) => {
    try {
      const itemIds = String(req.query.itemIds || "").split(",").filter(Boolean);
      const quantities = String(req.query.quantities || "").split(",").map(Number);
      res.json(await canonicalQuote(req.session.user.restaurantId, quoteInput.parse({
        branchId: req.query.branchId, items: itemIds.map((id, i) => ({ id, quantity: quantities[i] || 1 })),
      })));
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.get("/api/promotions/conflicts", ...secured, managementOnly, async (req: any, res) => {
    const rows = await loadPromotions(req.session.user.restaurantId);
    const conflicts: any[] = [];
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      const dateOverlap = a.startDate <= b.endDate && b.startDate <= a.endDate;
      const branchOverlap = a.allBranches || b.allBranches || a.branches.some((id) => b.branches.includes(id));
      const targetOverlap = a.discountType === "fixed_order" && b.discountType === "fixed_order"
        || a.targets.some((x) => b.targets.some((y) => x.targetType === y.targetType && (x.menuItemId ? x.menuItemId === y.menuItemId : x.category === y.category)));
      if (dateOverlap && branchOverlap && targetOverlap) conflicts.push({ firstId: a.id, secondId: b.id, resolution: [a, b].sort((x, y) => y.priority - x.priority || x.createdAt.getTime() - y.createdAt.getTime() || x.id.localeCompare(y.id))[0].id });
    }
    res.json(conflicts);
  });
  app.get("/api/promotions/analytics", ...secured, managementOnly, async (req: any, res) => {
    try {
    const restaurantId = req.session.user.restaurantId;
    const { start, end, previousStart } = parseAnalyticsRange(req.query.start, req.query.end);
    const [current, previous, totalOrders] = await Promise.all([
      db.select().from(orderPromotionApplications).where(and(eq(orderPromotionApplications.restaurantId, restaurantId), sql`${orderPromotionApplications.appliedAt} >= ${start}`, sql`${orderPromotionApplications.appliedAt} <= ${end}`)),
      db.select().from(orderPromotionApplications).where(and(eq(orderPromotionApplications.restaurantId, restaurantId), sql`${orderPromotionApplications.appliedAt} >= ${previousStart}`, sql`${orderPromotionApplications.appliedAt} < ${start}`)),
      db.execute(sql`SELECT count(*)::int count FROM orders WHERE restaurant_id=${restaurantId} AND created_at >= ${start} AND created_at <= ${end}`),
    ]);
    const metrics = summarizePromotionApplications(current), baseline = summarizePromotionApplications(previous);
    const allOrderCount = Number((totalOrders as any).rows?.[0]?.count || 0);
    const grouped = (key: "branchId") => Object.values(current.reduce((acc: any, row) => {
      const id = row[key]; acc[id] ||= { id, revenue: 0, orders: new Set() }; acc[id].revenue += Number(row.finalSubtotal); acc[id].orders.add(row.orderId); return acc;
    }, {})).map((v: any) => ({ id: v.id, revenue: round(v.revenue), orders: v.orders.size }));
    const product = new Map<string, { id: string; name: string; units: number; discount: number }>();
    for (const row of current) for (const line of row.snapshot.lines) {
      const value = product.get(line.menuItemId) || { id: line.menuItemId, name: line.name, units: 0, discount: 0 };
      value.units += line.quantity; value.discount += line.discountAmount; product.set(line.menuItemId, value);
    }
    const productIds = [...product.keys()];
    const costRows = productIds.length ? await db.execute(sql`
      SELECT m.id, m.name, COALESCE(r.cost, 0)::numeric AS cost
      FROM menu_items m LEFT JOIN recipes r ON r.id=m.recipe_id AND r.restaurant_id=m.restaurant_id
      WHERE m.restaurant_id=${restaurantId} AND m.id IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})
    `) : { rows: [] } as any;
    const latestFinalPrice = new Map<string, number>();
    for (const row of current) for (const line of row.snapshot.lines) latestFinalPrice.set(line.menuItemId, line.finalUnitPrice);
    const marginWarnings = ((costRows as any).rows || []).flatMap((row: any) => {
      const cost = Number(row.cost), selling = latestFinalPrice.get(row.id) || 0;
      return cost > 0 && selling < cost
        ? [{ menuItemId: row.id, name: row.name, recipeCost: round(cost), promotedPrice: round(selling), message: "Promoted price is below current recipe cost." }]
        : [];
    });
    const uplift = baseline.revenue ? (metrics.revenue - baseline.revenue) / baseline.revenue * 100 : null;
    res.json({
      period: { start, end }, metrics: { ...metrics, applicationRate: allOrderCount ? metrics.orders / allOrderCount : 0 },
      baseline, upliftPercent: uplift, topProducts: [...product.values()].sort((a, b) => b.units - a.units).slice(0, 10),
      branches: grouped("branchId"),
      dayPerformance: aggregateTime(current, "day"), hourPerformance: aggregateTime(current, "hour"),
      marginWarnings,
      tips: metrics.orders === 0 ? ["No promotion applications in this period."]
        : uplift != null && uplift < 0 ? ["Revenue is below the comparable previous period; review targeting and discount depth."]
        : metrics.grossDiscount > metrics.revenue * 0.25 ? ["Discount cost exceeds 25% of promoted revenue; review caps and margins."]
        : ["Promotions are producing measurable orders; test one variable at a time before increasing discount depth."],
    });
    } catch (error) {
      if (error instanceof AnalyticsRangeError) return res.status(400).json({ error: error.message });
      console.error("[Promotion Analytics] Global query failed:", error);
      return res.status(500).json({ error: "Failed to load promotion analytics" });
    }
  });
  // Must precede /:id so "analytics" remains the global endpoint while this
  // route is resolved as a per-promotion immutable-audit query.
  app.get("/api/promotions/:id/analytics", ...secured, managementOnly, async (req: any, res) => {
    try {
    const restaurantId = req.session.user.restaurantId;
    const { start, end, previousStart } = parseAnalyticsRange(req.query.start, req.query.end);
    const promotion = (await loadPromotions(restaurantId)).find((p) => p.id === req.params.id);
    if (!promotion) return res.status(404).json({ error: "Promotion not found" });
    const wherePeriod = (from: Date, to: Date, inclusive = true) => and(
      eq(orderPromotionApplications.restaurantId, restaurantId),
      eq(orderPromotionApplications.promotionId, promotion.id),
      sql`${orderPromotionApplications.appliedAt} >= ${from}`,
      inclusive ? sql`${orderPromotionApplications.appliedAt} <= ${to}` : sql`${orderPromotionApplications.appliedAt} < ${to}`,
    );
    const [current, previous, totalOrders] = await Promise.all([
      db.select().from(orderPromotionApplications).where(wherePeriod(start, end)),
      db.select().from(orderPromotionApplications).where(wherePeriod(previousStart, start, false)),
      db.execute(sql`SELECT count(*)::int count FROM orders WHERE restaurant_id=${restaurantId} AND created_at >= ${start} AND created_at <= ${end}`),
    ]);
    const metrics = summarizePromotionApplications(current), baseline = summarizePromotionApplications(previous);
    const products = new Map<string, { id: string; name: string; units: number; discount: number }>();
    for (const row of current) for (const line of row.snapshot.lines) {
      const entry = products.get(line.menuItemId) || { id: line.menuItemId, name: line.name, units: 0, discount: 0 };
      entry.units += line.quantity; entry.discount += line.discountAmount; products.set(line.menuItemId, entry);
    }
    const productIds = [...products.keys()];
    const costRows = productIds.length ? await db.execute(sql`
      SELECT m.id, m.name, COALESCE(r.cost, 0)::numeric AS cost
      FROM menu_items m LEFT JOIN recipes r ON r.id=m.recipe_id AND r.restaurant_id=m.restaurant_id
      WHERE m.restaurant_id=${restaurantId} AND m.id IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})
    `) : { rows: [] } as any;
    const latestFinalPrice = new Map<string, number>();
    for (const row of current) for (const line of row.snapshot.lines) latestFinalPrice.set(line.menuItemId, line.finalUnitPrice);
    const marginWarnings = ((costRows as any).rows || []).flatMap((row: any) => {
      const cost = Number(row.cost), selling = latestFinalPrice.get(row.id) || 0;
      return cost > 0 && selling < cost
        ? [{ menuItemId: row.id, name: row.name, recipeCost: round(cost), promotedPrice: round(selling), message: "Promoted price is below current recipe cost." }]
        : [];
    });
    const upliftPercent = baseline.revenue ? round((metrics.revenue - baseline.revenue) / baseline.revenue * 100) : null;
    res.json(promotionAnalyticsContract({
      promotion: promotionResponse(promotion),
      period: { start, end }, metrics, baseline, upliftPercent,
      totalOrders: Number((totalOrders as any).rows?.[0]?.count || 0),
      topProducts: [...products.values()].sort((a, b) => b.units - a.units).slice(0, 10),
      branches: Object.values(current.reduce((acc: any, row) => {
        acc[row.branchId] ||= { branchId: row.branchId, revenue: 0, orders: new Set<string>() };
        acc[row.branchId].revenue += Number(row.finalSubtotal); acc[row.branchId].orders.add(row.orderId); return acc;
      }, {})).map((v: any) => ({ branchId: v.branchId, revenue: round(v.revenue), orders: v.orders.size })),
      dayPerformance: aggregateTime(current, "day"), hourPerformance: aggregateTime(current, "hour"),
      marginWarnings,
    }));
    } catch (error) {
      if (error instanceof AnalyticsRangeError) return res.status(400).json({ error: error.message });
      console.error("[Promotion Analytics] Promotion query failed:", error);
      return res.status(500).json({ error: "Failed to load promotion analytics" });
    }
  });
  app.get("/api/promotions/:id", ...secured, managementOnly, async (req: any, res) => {
    const row = (await loadPromotions(req.session.user.restaurantId)).find((p) => p.id === req.params.id);
    if (!row) return res.status(404).json({ error: "Promotion not found" });
    res.json(promotionResponse(row));
  });
  app.post("/api/promotions", ...secured, managementOnly, async (req: any, res) => {
    try {
      const restaurantId = req.session.user.restaurantId, body = managementInput.parse(req.body);
      await validateLinks(restaurantId, body);
      const { branchIds, targets, ...values } = body;
      const created = await db.transaction(async (tx) => {
        await lockPromotionPricing(tx, restaurantId);
        const [row] = await tx.insert(promotions).values({ ...values, restaurantId, createdBy: req.session.user.id }).returning();
        await replaceLinks(tx, restaurantId, row.id, branchIds, targets);
        return row;
      });
      broadcast({ type: "promotion:updated", restaurantId, data: { action: "created", itemId: created.id } });
      res.status(201).json(created);
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.patch("/api/promotions/:id", ...secured, managementOnly, async (req: any, res) => {
    try {
      const restaurantId = req.session.user.restaurantId, body = patchInput.parse(req.body);
      const existing = (await loadPromotions(restaurantId)).find((p) => p.id === req.params.id);
      if (!existing) return res.status(404).json({ error: "Promotion not found" });
      const merged = { ...existing, ...body, branchIds: body.branchIds ?? existing.branches, targets: body.targets ?? existing.targets };
      if (merged.endDate < merged.startDate) throw new Error("endDate must be on or after startDate");
      if (merged.discountType === "percentage" && Number(merged.discountValue) > 100) throw new Error("Percentage cannot exceed 100");
      await validateLinks(restaurantId, merged as any);
      const { branchIds, targets, version, ...values } = body;
      const updated = await db.transaction(async (tx) => {
        await lockPromotionPricing(tx, restaurantId);
        const [row] = await tx.update(promotions).set({ ...values, updatedAt: new Date(), version: version + 1 })
          .where(and(eq(promotions.id, req.params.id), eq(promotions.restaurantId, restaurantId), eq(promotions.version, version))).returning();
        if (!row) throw new Error("Promotion was modified by another user");
        if (branchIds || targets) await replaceLinks(tx, restaurantId, row.id, branchIds ?? existing.branches, targets ?? existing.targets as any);
        return row;
      });
      broadcast({ type: "promotion:updated", restaurantId, data: { action: "updated", itemId: updated.id } });
      res.json(updated);
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  app.post("/api/promotions/:id/duplicate", ...secured, managementOnly, async (req: any, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const created = await db.transaction(async (tx) => {
        await lockPromotionPricing(tx, restaurantId);
        const source = (await loadPromotions(restaurantId, tx)).find((p) => p.id === req.params.id);
        if (!source) throw new Error("Promotion not found");
        const [row] = await tx.insert(promotions).values({
          restaurantId, name: `${source.name} (Copy)`, description: source.description, enabled: false, paused: false,
          discountType: source.discountType, discountValue: source.discountValue, priority: source.priority,
          startDate: source.startDate, endDate: source.endDate, startTime: source.startTime, endTime: source.endTime,
          timezone: source.timezone, weekdays: source.weekdays, allBranches: source.allBranches,
          stackingPolicy: "priority_only", maxTotalDiscount: source.maxTotalDiscount, usageLimit: source.usageLimit,
          createdBy: req.session.user.id,
        }).returning();
        await replaceLinks(tx, restaurantId, row.id, source.branches, source.targets as any);
        return row;
      });
      broadcast({ type: "promotion:updated", restaurantId, data: { action: "created", itemId: created.id } });
      res.status(201).json(created);
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  for (const action of ["pause", "resume", "archive"] as const) {
    app.post(`/api/promotions/:id/${action}`, ...secured, managementOnly, async (req: any, res) => {
      const restaurantId = req.session.user.restaurantId;
      const values = action === "pause" ? { paused: true } : action === "resume" ? { paused: false, enabled: true } : { archivedAt: new Date(), enabled: false };
      const row = await db.transaction(async (tx) => {
        await lockPromotionPricing(tx, restaurantId);
        const [updated] = await tx.update(promotions).set({ ...values, updatedAt: new Date(), version: sql`${promotions.version} + 1` })
          .where(and(eq(promotions.id, req.params.id), eq(promotions.restaurantId, restaurantId))).returning();
        return updated;
      });
      if (!row) return res.status(404).json({ error: "Promotion not found" });
      broadcast({ type: "promotion:updated", restaurantId, data: { action: "updated", itemId: row.id } });
      res.json(row);
    });
  }
}

function round(value: number) { return Math.round(value * 100) / 100; }
function aggregateTime(rows: Array<typeof orderPromotionApplications.$inferSelect>, unit: "day" | "hour") {
  const grouped = new Map<string, { revenue: number; orders: Set<string> }>();
  for (const row of rows) {
    const date = new Date(row.appliedAt);
    const key = unit === "day" ? date.toISOString().slice(0, 10) : String(date.getUTCHours()).padStart(2, "0");
    const value = grouped.get(key) || { revenue: 0, orders: new Set<string>() };
    value.revenue += Number(row.finalSubtotal); value.orders.add(row.orderId); grouped.set(key, value);
  }
  return [...grouped].map(([key, value]) => ({ key, revenue: round(value.revenue), orders: value.orders.size })).sort((a, b) => a.key.localeCompare(b.key));
}

export { canonicalQuote, loadPromotions };