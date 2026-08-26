import type { Express } from "express";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  branches, cashAccounts, cashLedgerEntries, cashObligations, employmentExits,
  customers, inventoryItems, inventoryTransactions, invoices, invoiceZatcaStatus, loyaltyAccounts,
  loyaltyTransactions, menuItems, recipes, orders, overviewSettings, salaries, shopBills, users,
  wasteLogs, workSchedules, workTimeEntries,
  zatcaRetryAttempts,
} from "@shared/schema";
import { retryPendingInvoice } from "./zatca/service";
import { overviewSnapshotFreshness, rebuildOverviewDailySnapshots } from "./general-overview-snapshots";

type Broadcast = (event: { type: "overview:updated" | "zatca:updated"; restaurantId: string; branchId?: string }) => void;
const id = z.string().min(1);
const branchInput = z.object({ branchId: id });
const dateQuery = z.object({ branchId: id.optional(), start: z.coerce.date().optional(), end: z.coerce.date().optional() });

/** Admin-only operational overview API. Tenant and branch scope is enforced here,
 * rather than relying on callers to supply a restaurant id. */
export function registerGeneralOverviewRoutes(app: Express, broadcast: Broadcast) {
  const admin = (req: any, res: any, next: any) => {
    if (!req.session?.user) return res.status(401).json({ error: "Not authenticated" });
    if (!req.session.user.restaurantId) return res.status(403).json({ error: "Restaurant account required" });
    if (req.session.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    next();
  };
  const restaurant = (req: any) => req.session.user.restaurantId as string;
  const ownedAssignedBranch = (branchColumn: any, restaurantId: string) =>
    sql`${branchColumn} is not null and exists (select 1 from ${branches} owned_branch where owned_branch.id = ${branchColumn} and owned_branch.restaurant_id = ${restaurantId})`;
  async function branchFor(req: any, res: any, branchId: string) {
    const [branch] = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, branchId), eq(branches.restaurantId, restaurant(req))));
    if (!branch) { res.status(403).json({ error: "Branch does not belong to this restaurant" }); return false; }
    return true;
  }
  // These legacy list aliases are read-only.  Do not add generic mutation
  // handlers here: overview rows have linked IDs whose tenant/branch ownership
  // must be checked in the same transaction by a purpose-built endpoint.
  function resource(path: string, table: any) {
    app.get(`/api/general-overview/${path}`, admin, async (req: any, res) => {
      const hasBranch = req.query.branchId !== undefined;
      const branchId = hasBranch ? id.safeParse(req.query.branchId) : null;
      if (hasBranch && !branchId?.success) return res.status(400).json({ error: "Invalid branchId" });
      if (branchId?.data && !await branchFor(req, res, branchId.data)) return;
      const conditions = [eq(table.restaurantId, restaurant(req))];
      if (branchId?.data) conditions.push(eq(table.branchId, branchId.data));
      else conditions.push(ownedAssignedBranch(table.branchId, restaurant(req)));
      res.json(await db.select().from(table).where(and(...conditions)).orderBy(desc(table.createdAt)));
    });
  }
  resource("cash-accounts", cashAccounts);
  resource("cash-ledger", cashLedgerEntries);
  resource("cash-obligations", cashObligations);
  // Workforce aliases are registered below with employee-safe joins and strict
  // required branch semantics; do not register them through the generic reader.
  resource("loyalty-accounts", loyaltyAccounts);
  resource("loyalty-transactions", loyaltyTransactions);

  // Workforce mutations deliberately have dedicated schemas: an employee ID is
  // never accepted merely because it exists; it must belong to this tenant and
  // selected branch while the write transaction is open.
  const workforceBranch = async (tx: any, req: any, branchId: string, employeeId: string) => {
    const [employee] = await tx.select({ id: users.id, fullName: users.fullName, username: users.username })
      .from(users)
      .where(and(eq(users.id, employeeId), eq(users.restaurantId, restaurant(req)), eq(users.branchId, branchId), eq(users.active, true)))
      .for("update");
    if (!employee) throw new Error("Employee does not belong to this restaurant and branch");
    return employee;
  };
  const optionalReadBranch = async (req: any, res: any): Promise<string | null | undefined> => {
    if (req.query.branchId === undefined) return null;
    const parsed = id.safeParse(req.query.branchId);
    if (!parsed.success) { res.status(400).json({ error: "Invalid branchId" }); return; }
    if (!await branchFor(req, res, parsed.data)) return;
    return parsed.data;
  };
  const withEmployeeNames = async (restaurantId: string, rows: any[]) => {
    const employeeIds = [...new Set(rows.map((row) => row.employeeId))];
    if (!employeeIds.length) return rows;
    const people = await db.select({ id: users.id, name: users.fullName, username: users.username }).from(users)
      .where(and(eq(users.restaurantId, restaurantId), inArray(users.id, employeeIds)));
    const names = new Map(people.map((person) => [person.id, person.name || person.username]));
    return rows.map((row) => ({ ...row, employeeName: names.get(row.employeeId) || "Unknown employee" }));
  };
  app.get("/api/general-overview/employees", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select({ id: users.id, name: users.fullName, username: users.username }).from(users)
      .where(and(eq(users.restaurantId, restaurant(req)), branchId ? eq(users.branchId, branchId) : ownedAssignedBranch(users.branchId, restaurant(req)), eq(users.active, true)))
      .orderBy(users.fullName);
    res.json(rows.map((row) => ({ id: row.id, name: row.name || row.username })));
  });
  app.get("/api/general-overview/work-schedules", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select().from(workSchedules).where(and(eq(workSchedules.restaurantId, restaurant(req)), branchId ? eq(workSchedules.branchId, branchId) : ownedAssignedBranch(workSchedules.branchId, restaurant(req)))).orderBy(desc(workSchedules.scheduledDate));
    res.json(await withEmployeeNames(restaurant(req), rows));
  });
  app.post("/api/general-overview/work-schedules", admin, async (req: any, res) => {
    const parsed = z.object({
      branchId: id, employeeId: id, scheduledDate: z.coerce.date().optional(), shiftDate: z.coerce.date().optional(),
      scheduledStart: z.coerce.date().optional(), scheduledEnd: z.coerce.date().optional(),
      scheduledHours: z.coerce.number().positive().max(24).optional(),
    }).superRefine((data, ctx) => {
      if (!data.scheduledDate && !data.shiftDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledDate"], message: "scheduledDate or shiftDate is required" });
      if ((data.scheduledStart || data.scheduledEnd) && (!data.scheduledStart || !data.scheduledEnd || data.scheduledEnd <= data.scheduledStart)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEnd"], message: "scheduledEnd must be after scheduledStart" });
      if (!data.scheduledHours && (!data.scheduledStart || !data.scheduledEnd)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledHours"], message: "scheduledHours or start/end is required" });
    }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid work schedule", details: parsed.error.flatten() });
    if (!await branchFor(req, res, parsed.data.branchId)) return;
    const hours = parsed.data.scheduledHours ?? (parsed.data.scheduledEnd!.getTime() - parsed.data.scheduledStart!.getTime()) / 3600000;
    if (hours <= 0 || hours > 24) return res.status(400).json({ error: "Scheduled hours must be greater than 0 and at most 24" });
    try {
      const [row] = await db.transaction(async (tx) => {
        await workforceBranch(tx, req, parsed.data.branchId, parsed.data.employeeId);
        return tx.insert(workSchedules).values({ restaurantId: restaurant(req), branchId: parsed.data.branchId, employeeId: parsed.data.employeeId, scheduledDate: (parsed.data.scheduledDate || parsed.data.shiftDate)!.toISOString().slice(0, 10), scheduledHours: String(hours) }).returning();
      });
      broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: parsed.data.branchId }); res.status(201).json(row);
    } catch (error: any) { res.status(error.code === "23505" ? 409 : 400).json({ error: error.message }); }
  });
  app.get("/api/general-overview/time-entries", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select().from(workTimeEntries).where(and(eq(workTimeEntries.restaurantId, restaurant(req)), branchId ? eq(workTimeEntries.branchId, branchId) : ownedAssignedBranch(workTimeEntries.branchId, restaurant(req)))).orderBy(desc(workTimeEntries.startedAt));
    res.json(await withEmployeeNames(restaurant(req), rows));
  });
  app.post("/api/general-overview/time-entries", admin, async (req: any, res) => {
    const parsed = z.object({ branchId: id, employeeId: id, startedAt: z.coerce.date().optional(), clockIn: z.coerce.date().optional(), endedAt: z.coerce.date().optional(), clockOut: z.coerce.date().optional() }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid time entry", details: parsed.error.flatten() });
    const startedAt = parsed.data.startedAt || parsed.data.clockIn, endedAt = parsed.data.endedAt || parsed.data.clockOut;
    if (!startedAt || !endedAt || endedAt <= startedAt) return res.status(400).json({ error: "clockOut must be after clockIn" });
    const hours = (endedAt.getTime() - startedAt.getTime()) / 3600000;
    if (hours > 24) return res.status(400).json({ error: "Time entry must not exceed 24 hours" });
    if (!await branchFor(req, res, parsed.data.branchId)) return;
    try {
      const [row] = await db.transaction(async (tx) => {
        await workforceBranch(tx, req, parsed.data.branchId, parsed.data.employeeId);
        return tx.insert(workTimeEntries).values({ restaurantId: restaurant(req), branchId: parsed.data.branchId, employeeId: parsed.data.employeeId, startedAt, endedAt, hours: String(hours) }).returning();
      });
      broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: parsed.data.branchId }); res.status(201).json(row);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
  });
  app.get("/api/general-overview/employment-exits", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select().from(employmentExits).where(and(eq(employmentExits.restaurantId, restaurant(req)), branchId ? eq(employmentExits.branchId, branchId) : ownedAssignedBranch(employmentExits.branchId, restaurant(req)))).orderBy(desc(employmentExits.exitDate));
    res.json(await withEmployeeNames(restaurant(req), rows));
  });
  app.post("/api/general-overview/employment-exits", admin, async (req: any, res) => {
    const parsed = z.object({ branchId: id, employeeId: id, exitDate: z.coerce.date(), reason: z.string().trim().min(1).max(1000).optional() }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid employment exit", details: parsed.error.flatten() });
    if (!await branchFor(req, res, parsed.data.branchId)) return;
    try {
      const [row] = await db.transaction(async (tx) => {
        await workforceBranch(tx, req, parsed.data.branchId, parsed.data.employeeId);
        const [existing] = await tx.select({ id: employmentExits.id }).from(employmentExits).where(and(eq(employmentExits.restaurantId, restaurant(req)), eq(employmentExits.branchId, parsed.data.branchId), eq(employmentExits.employeeId, parsed.data.employeeId))).for("update");
        if (existing) throw Object.assign(new Error("Employee already has an exit record for this branch"), { code: "23505" });
        return tx.insert(employmentExits).values({ restaurantId: restaurant(req), branchId: parsed.data.branchId, employeeId: parsed.data.employeeId, exitDate: parsed.data.exitDate.toISOString().slice(0, 10), reason: parsed.data.reason }).returning();
      });
      broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: parsed.data.branchId }); res.status(201).json(row);
    } catch (error: any) { res.status(error.code === "23505" ? 409 : 400).json({ error: error.message }); }
  });

  app.get("/api/general-overview/settings/:branchId", admin, async (req: any, res) => {
    if (!await branchFor(req, res, req.params.branchId)) return;
    const [row] = await db.select().from(overviewSettings).where(and(eq(overviewSettings.restaurantId, restaurant(req)), eq(overviewSettings.branchId, req.params.branchId)));
    res.json(row || { branchId: req.params.branchId, foodCostThreshold: "35" });
  });
  app.get("/api/general-overview/settings", admin, async (req: any, res) => {
    const branchId = id.safeParse(req.query.branchId); if (!branchId.success) return res.status(400).json({ error: "branchId is required" });
    if (!await branchFor(req, res, branchId.data)) return;
    const [row] = await db.select().from(overviewSettings).where(and(eq(overviewSettings.restaurantId, restaurant(req)), eq(overviewSettings.branchId, branchId.data)));
    res.json(row || { branchId: branchId.data, foodCostThreshold: "35" });
  });
  app.patch("/api/general-overview/settings", admin, async (req: any, res) => {
    const branchId = id.safeParse(req.query.branchId); if (!branchId.success) return res.status(400).json({ error: "branchId is required" });
    if (!await branchFor(req, res, branchId.data)) return;
    const parsed = z.object({ foodCostThreshold: z.coerce.number().min(0).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "foodCostThreshold must be 0-100" });
    const [row] = await db.insert(overviewSettings).values({ restaurantId: restaurant(req), branchId: branchId.data, foodCostThreshold: String(parsed.data.foodCostThreshold) }).onConflictDoUpdate({ target: [overviewSettings.restaurantId, overviewSettings.branchId], set: { foodCostThreshold: String(parsed.data.foodCostThreshold), updatedAt: new Date() } }).returning();
    broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: branchId.data }); res.json(row);
  });
  app.put("/api/general-overview/settings/:branchId", admin, async (req: any, res) => {
    if (!await branchFor(req, res, req.params.branchId)) return;
    const parsed = z.object({ foodCostThreshold: z.coerce.number().min(0).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "foodCostThreshold must be 0-100" });
    const [row] = await db.insert(overviewSettings).values({ restaurantId: restaurant(req), branchId: req.params.branchId, foodCostThreshold: String(parsed.data.foodCostThreshold) })
      .onConflictDoUpdate({ target: [overviewSettings.restaurantId, overviewSettings.branchId], set: { foodCostThreshold: String(parsed.data.foodCostThreshold), updatedAt: new Date() } }).returning();
    broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: req.params.branchId }); res.json(row);
  });
  app.get("/api/general-overview/freshness", admin, async (req: any, res) => {
    const branchId = req.query.branchId ? id.safeParse(req.query.branchId) : null;
    if (req.query.branchId && !branchId?.success) return res.status(400).json({ error: "Invalid branchId" });
    if (branchId?.data && !await branchFor(req, res, branchId.data)) return;
    res.json(await overviewSnapshotFreshness(restaurant(req), branchId?.data));
  });
  app.post("/api/general-overview/rebuild", admin, async (req: any, res) => {
    // Tenant-scoped so an administrator cannot trigger work for another tenant.
    await rebuildOverviewDailySnapshots(restaurant(req));
    res.json({ ok: true, ...(await overviewSnapshotFreshness(restaurant(req))) });
  });

  app.post("/api/general-overview/waste", admin, async (req: any, res) => {
    const parsed = z.object({ branchId: id, inventoryItemId: id.optional(), itemName: z.string().min(1), wasteKind: z.enum(["ingredient", "portion"]).default("ingredient"), quantity: z.coerce.number().positive(), unit: z.string().min(1), cost: z.coerce.number().min(0).default(0), reason: z.string().min(1), occurredAt: z.coerce.date().optional() }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid waste log", details: parsed.error.flatten() });
    if (!await branchFor(req, res, parsed.data.branchId)) return;
    try {
      const row = await db.transaction(async (tx) => {
        const [ownedBranch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, parsed.data.branchId), eq(branches.restaurantId, restaurant(req)))).for("update");
        if (!ownedBranch) throw new Error("Branch does not belong to this restaurant");
        if (parsed.data.inventoryItemId) {
          const [item] = await tx.select().from(inventoryItems).where(and(eq(inventoryItems.id, parsed.data.inventoryItemId), eq(inventoryItems.restaurantId, restaurant(req)), eq(inventoryItems.branchId, parsed.data.branchId))).for("update");
          if (!item) throw new Error("Linked inventory item not found in branch");
          const before = Number(item.quantity); if (before < parsed.data.quantity) throw new Error("Insufficient inventory for waste log");
          const after = before - parsed.data.quantity;
          await tx.update(inventoryItems).set({ quantity: String(after) }).where(eq(inventoryItems.id, item.id));
          await tx.insert(inventoryTransactions).values({ restaurantId: restaurant(req), branchId: parsed.data.branchId, inventoryItemId: item.id, type: "wastage", quantityChange: String(-parsed.data.quantity), quantityBefore: String(before), quantityAfter: String(after), notes: parsed.data.reason });
        }
        const [created] = await tx.insert(wasteLogs).values({ ...parsed.data, restaurantId: restaurant(req), actorId: req.session.user.id, quantity: String(parsed.data.quantity), cost: String(parsed.data.cost) }).returning();
        return created;
      });
      broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: parsed.data.branchId }); res.status(201).json(row);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/general-overview/waste", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    res.json(await db.select().from(wasteLogs).where(and(eq(wasteLogs.restaurantId, restaurant(req)), branchId ? eq(wasteLogs.branchId, branchId) : ownedAssignedBranch(wasteLogs.branchId, restaurant(req)))).orderBy(desc(wasteLogs.occurredAt)));
  });

  app.get("/api/general-overview/cash-entries", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select().from(cashLedgerEntries).where(and(eq(cashLedgerEntries.restaurantId, restaurant(req)), branchId ? eq(cashLedgerEntries.branchId, branchId) : ownedAssignedBranch(cashLedgerEntries.branchId, restaurant(req)))).orderBy(desc(cashLedgerEntries.occurredAt));
    res.json(rows.map((r) => ({ ...r, type: r.direction === "in" ? "inflow" : "outflow" })));
  });
  app.post("/api/general-overview/cash-entries", admin, async (req: any, res) => {
    const data = z.object({ amount: z.coerce.number().positive(), type: z.enum(["inflow", "outflow"]), category: z.string().min(1), description: z.string().max(1000).optional(), occurredAt: z.coerce.date().optional(), branchId: id }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!data.success) return res.status(400).json({ error: "Invalid cash entry" });
    if (!await branchFor(req, res, data.data.branchId!)) return;
    const row = await db.transaction(async (tx) => {
      const [ownedBranch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.data.branchId), eq(branches.restaurantId, restaurant(req)))).for("update");
      if (!ownedBranch) throw new Error("Branch does not belong to this restaurant");
      let [account] = await tx.select().from(cashAccounts).where(and(eq(cashAccounts.restaurantId, restaurant(req)), eq(cashAccounts.branchId, data.data.branchId!), eq(cashAccounts.active, true))).limit(1);
      if (!account) [account] = await tx.insert(cashAccounts).values({ restaurantId: restaurant(req), branchId: data.data.branchId!, name: "Operating cash" }).returning();
      const [entry] = await tx.insert(cashLedgerEntries).values({ restaurantId: restaurant(req), branchId: data.data.branchId!, accountId: account.id, direction: data.data.type === "inflow" ? "in" : "out", amount: String(data.data.amount), category: data.data.category, description: data.data.description, occurredAt: data.data.occurredAt, actorId: req.session.user.id }).returning();
      return entry;
    });
    broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: data.data.branchId }); res.status(201).json({ ...row, type: data.data.type });
  });
  app.get("/api/general-overview/commitments", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    res.json(await db.select().from(cashObligations).where(and(eq(cashObligations.restaurantId, restaurant(req)), branchId ? eq(cashObligations.branchId, branchId) : ownedAssignedBranch(cashObligations.branchId, restaurant(req)))).orderBy(cashObligations.dueDate));
  });
  app.post("/api/general-overview/commitments", admin, async (req: any, res) => {
    const data = z.object({ branchId: id, kind: z.enum(["payable", "expected_inflow"]), amount: z.coerce.number().positive(), dueDate: z.coerce.date(), category: z.string().min(1), description: z.string().max(1000).optional() }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!data.success) return res.status(400).json({ error: "Invalid commitment" }); if (!await branchFor(req, res, data.data.branchId!)) return;
    const [row] = await db.insert(cashObligations).values({ restaurantId: restaurant(req), branchId: data.data.branchId!, kind: data.data.kind, amount: String(data.data.amount), dueDate: data.data.dueDate.toISOString().slice(0, 10), description: data.data.description || data.data.category }).returning();
    broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: data.data.branchId }); res.status(201).json(row);
  });
  app.get("/api/general-overview/loyalty", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const rows = await db.select().from(loyaltyAccounts).where(and(eq(loyaltyAccounts.restaurantId, restaurant(req)), branchId ? eq(loyaltyAccounts.branchId, branchId) : ownedAssignedBranch(loyaltyAccounts.branchId, restaurant(req))));
    res.json({ enrolled: rows.length, members: rows.length, accounts: rows });
  });
  app.post("/api/general-overview/loyalty/transactions", admin, async (req: any, res) => {
    const data = z.object({ branchId: id, customerId: id, points: z.coerce.number().positive(), type: z.enum(["enrollment", "earn", "redeem", "redemption"]) }).safeParse({ ...req.body, branchId: req.body.branchId || req.query.branchId });
    if (!data.success) return res.status(400).json({ error: "Invalid loyalty transaction" }); if (!await branchFor(req, res, data.data.branchId!)) return;
    try { const output = await db.transaction(async (tx) => {
      const [ownedBranch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.data.branchId), eq(branches.restaurantId, restaurant(req)))).for("update");
      if (!ownedBranch) throw new Error("Branch does not belong to this restaurant");
      const [customer] = await tx.select().from(customers).where(and(eq(customers.id, data.data.customerId), eq(customers.restaurantId, restaurant(req)))); if (!customer) throw new Error("Customer not found");
      let [account] = await tx.select().from(loyaltyAccounts).where(and(eq(loyaltyAccounts.restaurantId, restaurant(req)), eq(loyaltyAccounts.customerId, customer.id))).for("update");
      if (!account) { if (data.data.type !== "enrollment") throw new Error("Customer is not enrolled"); [account] = await tx.insert(loyaltyAccounts).values({ restaurantId: restaurant(req), branchId: data.data.branchId!, customerId: customer.id, pointsBalance: "0" }).returning(); }
      if (account.branchId !== data.data.branchId) throw new Error("Loyalty account belongs to another branch");
      const change = ["redeem", "redemption"].includes(data.data.type) ? -data.data.points : data.data.points;
      if (Number(account.pointsBalance) + change < 0) throw new Error("Insufficient loyalty points");
      const [updated] = await tx.update(loyaltyAccounts).set({ pointsBalance: String(Number(account.pointsBalance) + change), updatedAt: new Date() }).where(eq(loyaltyAccounts.id, account.id)).returning();
      await tx.insert(loyaltyTransactions).values({ restaurantId: restaurant(req), branchId: data.data.branchId!, loyaltyAccountId: account.id, type: data.data.type, points: String(change) });
      return updated;
    }); broadcast({ type: "overview:updated", restaurantId: restaurant(req), branchId: data.data.branchId }); res.status(201).json(output); } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/general-overview/zatca", admin, async (req: any, res) => {
    const branchId = await optionalReadBranch(req, res); if (branchId === undefined) return;
    const restaurantId = restaurant(req);
    const rows = await db.select({ invoiceId: invoices.id, invoiceNumber: invoices.invoiceNumber, branchId: invoices.branchId, createdAt: invoices.createdAt, submissionStatus: invoiceZatcaStatus.submissionStatus, invoiceType: invoiceZatcaStatus.invoiceType, submittedAt: invoiceZatcaStatus.submittedAt, clearedAt: invoiceZatcaStatus.clearedAt, errors: invoiceZatcaStatus.zatcaErrors }).from(invoices).innerJoin(invoiceZatcaStatus, and(eq(invoiceZatcaStatus.invoiceId, invoices.id), eq(invoiceZatcaStatus.restaurantId, invoices.restaurantId))).where(and(eq(invoices.restaurantId, restaurantId), branchId ? eq(invoices.branchId, branchId) : ownedAssignedBranch(invoices.branchId, restaurantId))).orderBy(desc(invoices.createdAt));
    const attempts = await db.select({ invoiceId: zatcaRetryAttempts.invoiceId, createdAt: zatcaRetryAttempts.createdAt }).from(zatcaRetryAttempts)
      .where(and(eq(zatcaRetryAttempts.restaurantId, restaurantId), branchId ? eq(zatcaRetryAttempts.branchId, branchId) : ownedAssignedBranch(zatcaRetryAttempts.branchId, restaurantId)));
    const retryStats = new Map<string, { retryAttemptCount: number; latestRetryAttemptAt: Date | null }>();
    for (const attempt of attempts) {
      const stat = retryStats.get(attempt.invoiceId) || { retryAttemptCount: 0, latestRetryAttemptAt: null };
      stat.retryAttemptCount++;
      if (!stat.latestRetryAttemptAt || attempt.createdAt > stat.latestRetryAttemptAt) stat.latestRetryAttemptAt = attempt.createdAt;
      retryStats.set(attempt.invoiceId, stat);
    }
    res.json(rows.map((row) => {
      const retries = retryStats.get(row.invoiceId) || { retryAttemptCount: 0, latestRetryAttemptAt: null };
      const latestError: any = Array.isArray(row.errors) && row.errors.length ? row.errors[row.errors.length - 1] : null;
      return { ...row, status: row.submissionStatus, type: row.invoiceType, lastError: latestError?.message || latestError || null, ...retries };
    }));
  });
  app.post("/api/general-overview/zatca/:invoiceId/retry", admin, async (req: any, res) => {
    const [invoice] = await db.select({ id: invoices.id, branchId: invoices.branchId }).from(invoices).where(and(eq(invoices.id, req.params.invoiceId), eq(invoices.restaurantId, restaurant(req))));
    if (!invoice || !invoice.branchId) return res.status(404).json({ error: "Invoice not found or unassigned" });
    const key = String(req.get("Idempotency-Key") || req.body?.idempotencyKey || `manual-${req.params.invoiceId}-${req.session.user.id}-${Date.now()}`);
    const [prior] = await db.select().from(zatcaRetryAttempts).where(and(eq(zatcaRetryAttempts.restaurantId, restaurant(req)), eq(zatcaRetryAttempts.invoiceId, invoice.id), eq(zatcaRetryAttempts.idempotencyKey, key)));
    if (prior) return res.json({ idempotent: true, outcome: prior.outcome, message: prior.errorMessage });
    const result = await retryPendingInvoice(restaurant(req), invoice.id);
    await db.insert(zatcaRetryAttempts).values({ restaurantId: restaurant(req), branchId: invoice.branchId, invoiceId: invoice.id, actorId: req.session.user.id, idempotencyKey: key, outcome: result.status, errorMessage: result.message }).onConflictDoNothing();
    broadcast({ type: "zatca:updated", restaurantId: restaurant(req), branchId: invoice.branchId });
    if (!result.success) return res.status(result.status === "missing" ? 404 : 409).json(result);
    res.json(result);
  });

  app.get("/api/general-overview/summary", admin, async (req: any, res) => {
    const q = dateQuery.safeParse(req.query); if (!q.success) return res.status(400).json({ error: "Invalid query" });
    if (q.data.branchId && !await branchFor(req, res, q.data.branchId)) return;
    const start = q.data.start || new Date(Date.now() - 7 * 86400000), end = q.data.end || new Date();
    const restaurantId = restaurant(req);
    const scoped = <T extends { branchId: any }>(table: T) =>
      q.data.branchId ? eq(table.branchId, q.data.branchId) : sql`${table.branchId} is not null`;
    const inRange = <T extends { restaurantId: any; branchId: any; createdAt?: any }>(table: T, dateColumn: any) =>
      and(eq(table.restaurantId, restaurantId), scoped(table), gte(dateColumn, start), lte(dateColumn, end));
    const [orderRows, wasteRows, menuRows, recipeRows, inventoryRows, ledger, accounts, obligations,
      invoiceRows, salaryRows, schedules, timeEntries, exits, employees, loyaltyRows, loyaltyTx] = await Promise.all([
      db.select().from(orders).where(inRange(orders, orders.createdAt)),
      db.select().from(wasteLogs).where(inRange(wasteLogs, wasteLogs.occurredAt)),
      db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId)),
       db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId)),
       db.select().from(inventoryItems).where(and(eq(inventoryItems.restaurantId, restaurantId), scoped(inventoryItems))),
      db.select().from(cashLedgerEntries).where(and(eq(cashLedgerEntries.restaurantId, restaurantId), scoped(cashLedgerEntries))),
      db.select().from(cashAccounts).where(and(eq(cashAccounts.restaurantId, restaurantId), scoped(cashAccounts))),
      db.select().from(cashObligations).where(and(eq(cashObligations.restaurantId, restaurantId), scoped(cashObligations))),
      db.select({ createdAt: invoices.createdAt, status: invoiceZatcaStatus.submissionStatus }).from(invoices).innerJoin(invoiceZatcaStatus, and(eq(invoiceZatcaStatus.invoiceId, invoices.id), eq(invoiceZatcaStatus.restaurantId, invoices.restaurantId))).where(inRange(invoices, invoices.createdAt)),
      db.select().from(salaries).where(and(eq(salaries.restaurantId, restaurantId), scoped(salaries), gte(salaries.paymentDate, start), lte(salaries.paymentDate, end))),
      db.select().from(workSchedules).where(and(eq(workSchedules.restaurantId, restaurantId), scoped(workSchedules), gte(workSchedules.scheduledDate, start.toISOString().slice(0, 10)), lte(workSchedules.scheduledDate, end.toISOString().slice(0, 10)))),
      db.select().from(workTimeEntries).where(and(eq(workTimeEntries.restaurantId, restaurantId), scoped(workTimeEntries), gte(workTimeEntries.startedAt, start), lte(workTimeEntries.startedAt, end))),
      db.select().from(employmentExits).where(and(eq(employmentExits.restaurantId, restaurantId), scoped(employmentExits), gte(employmentExits.exitDate, new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)))),
      db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.active, true), scoped(users))),
      db.select().from(loyaltyAccounts).where(and(eq(loyaltyAccounts.restaurantId, restaurantId), scoped(loyaltyAccounts))),
      db.select().from(loyaltyTransactions).where(and(eq(loyaltyTransactions.restaurantId, restaurantId), scoped(loyaltyTransactions), gte(loyaltyTransactions.occurredAt, start), lte(loyaltyTransactions.occurredAt, end))),
    ]);
    const validOrders = orderRows.filter(o => !["cancelled", "canceled", "refunded"].includes(o.status.toLowerCase()));
    const revenue = validOrders.reduce((n, o) => n + Number(o.total), 0);
    const menu = new Map(menuRows.map(x => [x.id, x]));
    const inventory = new Map(inventoryRows.map(x => [x.id, x]));
    let theoreticalCogs = 0;
    let recipeEstimateIncomplete = false;
    for (const order of validOrders) for (const line of order.items || []) {
      const item = menu.get(line.id); if (!item) continue;
      const qty = Number(line.quantity || 0);
      const currentRecipe = item.recipeId ? recipeRows.find(r => r.id === item.recipeId) : undefined;
      // Recipes are tenant-wide legacy records. Calculate from ingredients that
      // exist in the selected branch instead of trusting the cross-branch
      // denormalized recipe.cost. A partially unavailable recipe is not priced.
      if (currentRecipe) {
        const ingredients = currentRecipe.ingredients || [];
        if (ingredients.every((ingredient: any) => inventory.has(ingredient.inventoryItemId))) {
          theoreticalCogs += ingredients.reduce((sum: number, ingredient: any) => sum + Number(ingredient.quantity || 0) * Number(inventory.get(ingredient.inventoryItemId)?.unitPrice || ingredient.unitPrice || 0), 0) * Number(item.portionSize || 1) * qty;
        } else recipeEstimateIncomplete = true;
      }
      else if (item.inventoryItemId && inventory.get(item.inventoryItemId)) theoreticalCogs += Number(inventory.get(item.inventoryItemId)!.unitPrice) * Number(item.stockNo || 1) * qty;
    }
    const wasteCost = wasteRows.reduce((n, x) => n + Number(x.cost), 0);
    const actualCogs = theoreticalCogs + wasteCost;
    const percentage = revenue ? actualCogs / revenue * 100 : 0;
    const periodLedger = ledger.filter(x => x.occurredAt >= start && x.occurredAt <= end);
    const inflow = periodLedger.filter(x => x.direction === "in").reduce((n, x) => n + Number(x.amount), 0);
    const outflow = periodLedger.filter(x => x.direction === "out").reduce((n, x) => n + Number(x.amount), 0);
    const balance = accounts.reduce((n, x) => n + Number(x.openingBalance), 0) + ledger.reduce((n, x) => n + (x.direction === "in" ? Number(x.amount) : -Number(x.amount)), 0);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const burnRate = outflow / days, runwayDays = burnRate > 0 ? balance / burnRate : null;
    const byDay = new Map<string, { date: string; value: number; inflow: number; outflow: number }>();
    for (const o of validOrders) { const date = o.createdAt.toISOString().slice(0, 10), v = byDay.get(date) || { date, value: 0, inflow: 0, outflow: 0 }; v.value += Number(o.total); byDay.set(date, v); }
    for (const x of periodLedger) { const date = x.occurredAt.toISOString().slice(0, 10), v = byDay.get(date) || { date, value: 0, inflow: 0, outflow: 0 }; x.direction === "in" ? v.inflow += Number(x.amount) : v.outflow += Number(x.amount); byDay.set(date, v); }
    const byWeek = new Map<string, { week: string; value: number; inflow: number; outflow: number }>();
    for (const day of byDay.values()) {
      const d = new Date(`${day.date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      const week = d.toISOString().slice(0, 10), value = byWeek.get(week) || { week, value: 0, inflow: 0, outflow: 0 };
      value.value += day.value; value.inflow += day.inflow; value.outflow += day.outflow; byWeek.set(week, value);
    }
    const statuses = (name: string) => invoiceRows.filter(x => x.status === name).length;
    const todayRows = invoiceRows.filter(x => x.createdAt.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10));
    const successToday = todayRows.filter(x => ["cleared", "reported", "warning"].includes(x.status)).length;
    const salaryCost = salaryRows.reduce((n, x) => n + Number(x.amount), 0);
    const scheduledHours = schedules.reduce((n, x) => n + Number(x.scheduledHours), 0);
    const actualHours = timeEntries.reduce((n, x) => n + Number(x.hours || (x.endedAt ? (x.endedAt.getTime() - x.startedAt.getTime()) / 3600000 : 0)), 0);
    const trailing = validOrders.filter(x => x.createdAt >= new Date(end.getTime() - 30 * 86400000) && x.customerId);
    const visits = new Map<string, number>(); trailing.forEach(x => visits.set(x.customerId!, (visits.get(x.customerId!) || 0) + 1));
    const repeat = [...visits.values()].filter(n => n >= 2).length;
    const deliveryRevenue = validOrders.filter(x => !!x.deliveryAppId).reduce((n, x) => n + Number(x.total), 0);
    const due = new Date(); due.setDate(due.getDate() + 30);
    const open = obligations.filter(x => x.status === "open" && new Date(x.dueDate) >= new Date() && new Date(x.dueDate) <= due);
    const unassignedResult = await db.execute(sql`select
      (select count(*) from orders where restaurant_id=${restaurantId} and branch_id is null) + (select count(*) from invoices where restaurant_id=${restaurantId} and branch_id is null) + (select count(*) from inventory_items where restaurant_id=${restaurantId} and branch_id is null) + (select count(*) from salaries where restaurant_id=${restaurantId} and branch_id is null) + (select count(*) from shop_bills where restaurant_id=${restaurantId} and branch_id is null) as count`);
    const unassigned: any = unassignedResult.rows[0] || { count: 0 };
    const settingRows = q.data.branchId ? await db.select().from(overviewSettings).where(and(eq(overviewSettings.restaurantId, restaurantId), eq(overviewSettings.branchId, q.data.branchId))) : [];
    const threshold = settingRows.length ? Number(settingRows[0].foodCostThreshold) : 35;
    res.json({ branchId: q.data.branchId || null, range: { start, end },
      foodCost: { method: "current_recipe_estimate", warning: "COGS is a current-recipe estimate, not historical actual COGS; waste is reported separately.", recipeEstimateIncomplete, theoreticalCogs, theoretical: theoreticalCogs, wasteCost, actualCogs, actual: actualCogs, revenue, percentage, actualPercent: percentage, threshold, exceeded: percentage > threshold },
      cashFlow: { inflow, outflow, cashIn: inflow, cashOut: outflow, net: inflow - outflow, balance, currentBalance: balance, openingBalance: accounts.reduce((n, x) => n + Number(x.openingBalance), 0), burnRate, runwayDays, openPayables: open.filter(x => x.kind === "payable").reduce((n,x) => n + Number(x.amount), 0), expectedInflows: open.filter(x => x.kind === "expected_inflow").reduce((n,x) => n + Number(x.amount), 0), daily: [...byDay.values()], weekly: [...byWeek.values()] },
      zatca: { cleared: statuses("cleared"), clearedCount: statuses("cleared"), reported: statuses("reported"), reportedCount: statuses("reported"), warning: statuses("warning"), failed: statuses("rejected"), failedCount: statuses("rejected"), pending: statuses("pending") + statuses("submitted"), dailySuccessRate: todayRows.length ? successToday / todayRows.length * 100 : 0 },
      labor: { salaryCost, weeklySalaryCost: salaryCost / days * 7, monthlySalaryCost: salaryCost / days * 30.4375, salaryProration: "Recorded salary payments are normalized to 7 and 30.4375 days for weekly/monthly views.", percentage: revenue ? salaryCost / revenue * 100 : 0, laborPercent: revenue ? salaryCost / revenue * 100 : 0, scheduledHours, actualHours, variance: actualHours - scheduledHours, scheduledActualVariance: actualHours - scheduledHours, turnover: employees.length ? exits.length / employees.length * 100 : 0, turnoverRate: employees.length ? exits.length / employees.length * 100 : 0, headcount: employees.length },
      retention: { customers: visits.size, repeatCustomers: repeat, repeatRate: visits.size ? repeat / visits.size * 100 : 0, repeatCustomerRate: visits.size ? repeat / visits.size * 100 : 0, directRevenue: revenue - deliveryRevenue, deliveryRevenue, enrolled: loyaltyRows.length, loyaltyEnrollment: loyaltyRows.length, redeemedPoints: loyaltyTx.filter(x => Number(x.points) < 0).reduce((n,x) => n + -Number(x.points), 0), redeemedValue: loyaltyTx.filter(x => Number(x.points) < 0).reduce((n,x) => n + Number(x.value), 0) },
      series: [...byDay.values()].sort((a,b) => a.date.localeCompare(b.date)), unassignedCount: Number(unassigned.count), unassignedRecords: Number(unassigned.count) });
  });
}