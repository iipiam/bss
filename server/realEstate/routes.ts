// REST API for Property Management vertical (real_estate business type).
// All routes are mounted under /api/real-estate/* and gated by requirePermission('propertyManagement').
import type { Express, Request, Response } from "express";
import { pool } from "../db";
import {
  propertiesStore, unitsStore, tenantsStore, contractsStore,
  invoicesStore, paymentsStore, expensesStore, maintenanceStore,
  coaStore, journalStore, notificationsStore,
} from "./storage";
import { generateInvoiceSchedule } from "./invoiceGen";
import {
  ensureStandardChartOfAccounts, postPaymentReceived, postSecurityDeposit, postExpensePaid, postInvoiceIssued,
} from "./accounting";
import { generateInvoicePdf, generateReceiptPdf, generateContractPdf, generateReportPdf } from "./pdf";
import { seedRealEstate } from "./seed";
import * as XLSX from "xlsx";
import multer from "multer";
import path from "path";
import fs from "fs";

const expenseInvoiceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "public", "uploads", "expense-invoices");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `exp-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const uploadExpenseInvoice = multer({
  storage: expenseInvoiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(pdf|jpe?g|png|gif|webp)$/i;
    const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedExt.test(file.originalname) && allowedMime.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, JPG, PNG, GIF, or WebP files are allowed"));
  },
});

type Mw = (req: any, res: any, next: any) => any;

const ok = (res: Response, body: any, status = 200) => res.status(status).json(body);
const err = (res: Response, e: any) => res.status(e?.message?.includes("Cannot") ? 400 : 500).json({ message: e?.message || "Server error" });

const SAR = (h: number) => (Number(h || 0) / 100).toFixed(2);

export function registerRealEstateRoutes(
  app: Express,
  requireAuth: Mw,
  requireRestaurant: Mw,
  requirePermission: (perm: string) => Mw,
  requireAction: (perm: string, action: "view" | "add" | "edit" | "delete") => Mw,
) {
  const view = [requireAuth, requireRestaurant, requirePermission("propertyManagement")];
  const add = [requireAuth, requireRestaurant, requireAction("propertyManagement", "add")];
  const edit = [requireAuth, requireRestaurant, requireAction("propertyManagement", "edit")];
  const del = [requireAuth, requireRestaurant, requireAction("propertyManagement", "delete")];
  const rid = (req: any) => req.session.user.restaurantId as string;
  const uid = (req: any) => req.session.user?.id as string | undefined;

  // ============ Properties ============
  app.get("/api/real-estate/properties", ...view, async (req, res) => {
    try { ok(res, await propertiesStore.list(rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/properties/:id", ...view, async (req, res) => {
    try {
      const property = await propertiesStore.get(req.params.id, rid(req));
      if (!property) return res.status(404).json({ message: "Not found" });
      const units = await unitsStore.list(rid(req), req.params.id);
      ok(res, { ...property, units });
    } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/properties", ...add, async (req, res) => {
    try { ok(res, await propertiesStore.create(rid(req), req.body), 201); } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/properties/:id", ...edit, async (req, res) => {
    try { ok(res, await propertiesStore.update(req.params.id, rid(req), req.body)); } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/properties/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await propertiesStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/properties/:id/financial-summary", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const inc = await pool.query(
        `SELECT COALESCE(SUM(rp.amount_paid),0)::bigint as income
         FROM rental_payments rp JOIN rental_contracts rc ON rc.id = rp.contract_id
         JOIN property_units pu ON pu.id = rc.unit_id
         WHERE pu.property_id = $1 AND rp.restaurant_id = $2`, [req.params.id, r]);
      const exp = await pool.query(
        `SELECT COALESCE(SUM(amount),0)::bigint as expenses
         FROM property_expenses WHERE property_id = $1 AND restaurant_id = $2 AND status = 'paid'`,
        [req.params.id, r]);
      const property = await propertiesStore.get(req.params.id, r);
      const income = Number(inc.rows[0]?.income || 0);
      const expenses = Number(exp.rows[0]?.expenses || 0);
      const noi = income - expenses;
      const yieldPct = property?.currentValue ? (noi / property.currentValue) * 100 : 0;
      ok(res, { income, expenses, noi, yieldPct });
    } catch (e) { err(res, e); }
  });

  // ============ Units ============
  app.get("/api/real-estate/units", ...view, async (req, res) => {
    try { ok(res, await unitsStore.list(rid(req), req.query.propertyId as string | undefined)); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/units/:id", ...view, async (req, res) => {
    try { ok(res, await unitsStore.get(req.params.id, rid(req))); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/units", ...add, async (req, res) => {
    try { ok(res, await unitsStore.create(rid(req), req.body), 201); } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/units/:id", ...edit, async (req, res) => {
    try { ok(res, await unitsStore.update(req.params.id, rid(req), req.body)); } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/units/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await unitsStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });

  // ============ Tenants ============
  app.get("/api/real-estate/tenants", ...view, async (req, res) => {
    try {
      const tenants = await tenantsStore.list(rid(req));
      const enriched = await Promise.all(tenants.map(async (t: any) => ({
        ...t, outstandingBalance: await tenantsStore.outstandingBalance(t.id, rid(req)),
      })));
      ok(res, enriched);
    } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/tenants/:id", ...view, async (req, res) => {
    try {
      const tenant = await tenantsStore.get(req.params.id, rid(req));
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const contracts = await pool.query(`SELECT * FROM rental_contracts WHERE tenant_id = $1 AND restaurant_id = $2 ORDER BY created_at DESC`, [req.params.id, rid(req)]);
      const payments = await pool.query(`SELECT * FROM rental_payments WHERE tenant_id = $1 AND restaurant_id = $2 ORDER BY payment_date DESC`, [req.params.id, rid(req)]);
      const outstanding = await tenantsStore.outstandingBalance(req.params.id, rid(req));
      ok(res, { ...tenant, contracts: contracts.rows, payments: payments.rows, outstandingBalance: outstanding });
    } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/tenants", ...add, async (req, res) => {
    try { ok(res, await tenantsStore.create(rid(req), req.body), 201); } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/tenants/:id", ...edit, async (req, res) => {
    try { ok(res, await tenantsStore.update(req.params.id, rid(req), req.body)); } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/tenants/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await tenantsStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });

  // ============ Contracts ============
  app.get("/api/real-estate/contracts", ...view, async (req, res) => {
    try { ok(res, await contractsStore.list(rid(req), req.query.status as string | undefined)); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/contracts/:id", ...view, async (req, res) => {
    try {
      const contract = await contractsStore.get(req.params.id, rid(req));
      if (!contract) return res.status(404).json({ message: "Not found" });
      const invoices = await invoicesStore.list(rid(req), { contractId: req.params.id });
      ok(res, { ...contract, invoices });
    } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/contracts", ...add, async (req, res) => {
    try {
      const body = req.body;
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      if (!body.durationMonths) {
        body.durationMonths = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
          + (endDate.getUTCMonth() - startDate.getUTCMonth());
      }
      if (!body.totalValue) body.totalValue = (body.monthlyRent || 0) * body.durationMonths;
      const c = await contractsStore.create(rid(req), body);
      // contract number
      const yr = new Date().getUTCFullYear();
      const cnt = await pool.query(`SELECT COUNT(*)::int as c FROM rental_contracts WHERE restaurant_id = $1 AND contract_number LIKE $2`, [rid(req), `RC-${yr}-%`]);
      const num = `RC-${yr}-${String(cnt.rows[0]?.c || 1).padStart(4, "0")}`;
      await contractsStore.setContractNumber(c.id, num);

      if (c.status === "active") {
        await unitsStore.setStatus(c.unitId, rid(req), "rented");
        await generateInvoiceSchedule(rid(req), { ...c, contractNumber: num });
      }
      const enriched = await contractsStore.get(c.id, rid(req));
      ok(res, enriched, 201);
    } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/contracts/:id", ...edit, async (req, res) => {
    try {
      const before = await contractsStore.get(req.params.id, rid(req));
      const updated = await contractsStore.update(req.params.id, rid(req), req.body);
      // if newly activated, generate schedule + flip unit to rented
      if (before?.status !== "active" && updated?.status === "active") {
        await unitsStore.setStatus(updated.unitId, rid(req), "rented");
        const existing = await invoicesStore.list(rid(req), { contractId: updated.id });
        if (existing.length === 0) await generateInvoiceSchedule(rid(req), updated);
      }
      ok(res, updated);
    } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/contracts/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await contractsStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/contracts/:id/terminate", ...edit, async (req, res) => {
    try {
      const c = await contractsStore.get(req.params.id, rid(req));
      if (!c) return res.status(404).json({ message: "Not found" });
      const reason = req.body.terminationReason || "";
      const settlement = Number(req.body.settlementAmount || 0);
      const updated = await contractsStore.setStatus(c.id, rid(req), "terminated", {
        terminatedDate: new Date().toISOString().slice(0, 10),
        terminationReason: reason,
      });
      await unitsStore.setStatus(c.unitId, rid(req), "available");
      // cancel future pending invoices
      await pool.query(
        `UPDATE rental_invoices SET status = 'cancelled'
         WHERE contract_id = $1 AND restaurant_id = $2 AND status = 'pending' AND issue_date > CURRENT_DATE`,
        [c.id, rid(req)],
      );
      // settlement invoice if any
      if (settlement > 0) {
        const invoiceNumber = await invoicesStore.nextInvoiceNumber(rid(req));
        const inv = await invoicesStore.create(rid(req), {
          contractId: c.id, unitId: c.unitId, tenantId: c.tenantId,
          invoiceNumber, type: "penalty", amount: settlement, taxAmount: 0, totalAmount: settlement,
          dueDate: new Date().toISOString().slice(0, 10),
          issueDate: new Date().toISOString().slice(0, 10),
          status: "pending", notes: `Termination settlement: ${reason}`,
        });
        try { await postInvoiceIssued(rid(req), inv); } catch {}
      }
      ok(res, updated);
    } catch (e) { err(res, e); }
  });

  // ============ Invoices ============
  app.get("/api/real-estate/invoices", ...view, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = String(req.query.status);
      if (req.query.contractId) filters.contractId = String(req.query.contractId);
      if (req.query.tenantId) filters.tenantId = String(req.query.tenantId);
      ok(res, await invoicesStore.list(rid(req), filters));
    } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/invoices/:id", ...view, async (req, res) => {
    try {
      const inv = await invoicesStore.get(req.params.id, rid(req));
      if (!inv) return res.status(404).json({ message: "Not found" });
      const payments = await paymentsStore.listByInvoice(req.params.id, rid(req));
      ok(res, { ...inv, payments });
    } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/invoices/:id/mark-paid", ...edit, async (req, res) => {
    try {
      const inv = await invoicesStore.get(req.params.id, rid(req));
      if (!inv) return res.status(404).json({ message: "Not found" });
      const balance = (inv.totalAmount || 0) - (inv.amountPaid || 0);
      const amount = Math.min(Number(req.body.amount || balance), balance);
      const payment = await paymentsStore.create(rid(req), {
        invoiceId: inv.id, contractId: inv.contractId, tenantId: inv.tenantId,
        amountPaid: amount,
        paymentDate: req.body.paymentDate || new Date().toISOString().slice(0, 10),
        method: req.body.method || "cash",
        referenceNumber: req.body.referenceNumber || null,
        bankName: req.body.bankName || null,
        receivedByUserId: uid(req) || null,
        notes: req.body.notes || null,
      });
      const updated = await invoicesStore.applyPayment(inv.id, rid(req), amount);
      try {
        if (inv.type === "deposit") await postSecurityDeposit(rid(req), payment.id, amount, payment.method);
        else await postPaymentReceived(rid(req), payment, inv.invoiceNumber);
      } catch (e) { console.error("[realEstate] post journal failed", e); }
      ok(res, { invoice: updated, payment });
    } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/invoices/:id/pdf", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const inv = await invoicesStore.get(req.params.id, r);
      if (!inv) return res.status(404).json({ message: "Not found" });
      const contract = await contractsStore.get(inv.contractId, r);
      const unit = await unitsStore.get(inv.unitId, r);
      const tenant = await tenantsStore.get(inv.tenantId, r);
      const property = unit ? await propertiesStore.get(unit.propertyId, r) : null;
      const restR = await pool.query(`SELECT name, tax_number FROM restaurants WHERE id = $1`, [r]);
      const pdf = await generateInvoicePdf({
        invoice: inv, contract, unit, tenant, property,
        companyName: restR.rows[0]?.name || "Company",
        taxNumber: restR.rows[0]?.tax_number || undefined,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${inv.invoiceNumber}.pdf"`);
      res.end(pdf);
    } catch (e) { err(res, e); }
  });

  // ============ Payments ============
  app.get("/api/real-estate/payments", ...view, async (req, res) => {
    try { ok(res, await paymentsStore.list(rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/payments/:id/receipt-pdf", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const pay = await paymentsStore.get(req.params.id, r);
      if (!pay) return res.status(404).json({ message: "Not found" });
      const inv = await invoicesStore.get(pay.invoiceId, r);
      const tenant = await tenantsStore.get(pay.tenantId, r);
      const restR = await pool.query(`SELECT name, tax_number FROM restaurants WHERE id = $1`, [r]);
      const pdf = await generateReceiptPdf({
        payment: pay, invoice: inv, tenant,
        companyName: restR.rows[0]?.name || "Company", taxNumber: restR.rows[0]?.tax_number || undefined,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="receipt-${pay.id.slice(0, 8)}.pdf"`);
      res.end(pdf);
    } catch (e) { err(res, e); }
  });

  // ============ Contract PDF ============
  app.get("/api/real-estate/contracts/:id/pdf", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const c = await contractsStore.get(req.params.id, r);
      if (!c) return res.status(404).json({ message: "Not found" });
      const unit = await unitsStore.get(c.unitId, r);
      const tenant = await tenantsStore.get(c.tenantId, r);
      const property = unit ? await propertiesStore.get(unit.propertyId, r) : null;
      const restR = await pool.query(`SELECT name, tax_number FROM restaurants WHERE id = $1`, [r]);
      const pdf = await generateContractPdf({
        contract: c, unit, tenant, property,
        companyName: restR.rows[0]?.name || "Company", taxNumber: restR.rows[0]?.tax_number || undefined,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="contract-${c.contractNumber || c.id.slice(0, 8)}.pdf"`);
      res.end(pdf);
    } catch (e) { err(res, e); }
  });

  // ============ Expenses ============
  app.get("/api/real-estate/expenses", ...view, async (req, res) => {
    try { ok(res, await expensesStore.list(rid(req), req.query.propertyId as string | undefined)); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/expenses/:id", ...view, async (req, res) => {
    try { ok(res, await expensesStore.get(req.params.id, rid(req))); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/expenses", ...add, async (req, res) => {
    try {
      const e = await expensesStore.create(rid(req), req.body);
      if (e.status === "paid") { try { await postExpensePaid(rid(req), e); } catch {} }
      ok(res, e, 201);
    } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/expenses/:id", ...edit, async (req, res) => {
    try {
      const before = await expensesStore.get(req.params.id, rid(req));
      const updated = await expensesStore.update(req.params.id, rid(req), req.body);
      if (before?.status !== "paid" && updated?.status === "paid") {
        try { await postExpensePaid(rid(req), updated); } catch {}
      }
      ok(res, updated);
    } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/expenses/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await expensesStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });

  // Upload an invoice image/PDF for an expense. Returns the public URL to store on the expense's receiptUrl.
  app.post("/api/real-estate/expenses/upload-invoice", ...add, uploadExpenseInvoice.single("file"), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/expense-invoices/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Upload failed" }); }
  });

  // ============ Maintenance ============
  app.get("/api/real-estate/maintenance", ...view, async (req, res) => {
    try { ok(res, await maintenanceStore.list(rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/maintenance/:id", ...view, async (req, res) => {
    try { ok(res, await maintenanceStore.get(req.params.id, rid(req))); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/maintenance", ...add, async (req, res) => {
    try { ok(res, await maintenanceStore.create(rid(req), req.body), 201); } catch (e) { err(res, e); }
  });
  app.patch("/api/real-estate/maintenance/:id", ...edit, async (req, res) => {
    try {
      const before = await maintenanceStore.get(req.params.id, rid(req));
      const updated = await maintenanceStore.update(req.params.id, rid(req), req.body);
      if (updated?.priority === "urgent" && updated.unitId) {
        await unitsStore.setStatus(updated.unitId, rid(req), "under_maintenance");
      } else if (before?.priority === "urgent" && updated?.priority !== "urgent" && updated?.status === "completed" && updated.unitId) {
        const unit = await unitsStore.get(updated.unitId, rid(req));
        if (unit?.status === "under_maintenance") await unitsStore.setStatus(updated.unitId, rid(req), "available");
      }
      ok(res, updated);
    } catch (e) { err(res, e); }
  });
  app.delete("/api/real-estate/maintenance/:id", ...del, async (req, res) => {
    try { ok(res, { ok: await maintenanceStore.remove(req.params.id, rid(req)) }); } catch (e) { err(res, e); }
  });

  // ============ Accounting ============
  app.get("/api/real-estate/accounting/coa", ...view, async (req, res) => {
    try { ok(res, await coaStore.list(rid(req))); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/accounting/coa/ensure", ...edit, async (req, res) => {
    try { await ensureStandardChartOfAccounts(rid(req)); ok(res, await coaStore.list(rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/accounting/journal", ...view, async (req, res) => {
    try { ok(res, await journalStore.listEntries(rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/accounting/journal/:id", ...view, async (req, res) => {
    try { ok(res, await journalStore.getEntryWithLines(req.params.id, rid(req))); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/accounting/trial-balance", ...view, async (req, res) => {
    try { ok(res, await journalStore.trialBalance(rid(req))); } catch (e) { err(res, e); }
  });

  // ---- Accounting exports (PDF + Excel) for chart of accounts, journal, trial balance ----
  async function buildAccountingExport(type: string, restaurantId: string) {
    if (type === "coa" || type === "chart-of-accounts") {
      const rows = await coaStore.list(restaurantId);
      return {
        title: "Chart of Accounts", titleAr: "دليل الحسابات",
        summary: [{ label: "Total Accounts / إجمالي الحسابات", value: String(rows.length) }],
        headers: ["Code", "Name", "Name (AR)", "Type", "Active"],
        rows: rows.map((a: any) => [a.code || "", a.name || "", a.nameAr || "", a.type || "", a.isActive ? "Yes" : "No"]),
      };
    }
    if (type === "journal") {
      const entries = await journalStore.listEntries(restaurantId);
      const detailed = await Promise.all(entries.map((e: any) => journalStore.getEntryWithLines(e.id, restaurantId)));
      const flatRows: string[][] = [];
      let totalDr = 0, totalCr = 0;
      for (const e of detailed) {
        if (!e) continue;
        const lines = e.lines || [];
        for (let i = 0; i < lines.length; i++) {
          const ln = lines[i];
          totalDr += Number(ln.debit || 0); totalCr += Number(ln.credit || 0);
          flatRows.push([
            i === 0 ? (e.entryNumber || "") : "",
            i === 0 ? (e.entryDate?.slice(0, 10) || "") : "",
            i === 0 ? (e.description || "") : "",
            `${ln.accountCode || ""} — ${ln.accountName || ""}`,
            ln.debit ? SAR(ln.debit) : "",
            ln.credit ? SAR(ln.credit) : "",
          ]);
        }
      }
      return {
        title: "General Journal", titleAr: "دفتر اليومية",
        summary: [
          { label: "Entries / القيود", value: String(entries.length) },
          { label: "Total Debits / إجمالي المدين", value: SAR(totalDr) + " ر.س" },
          { label: "Total Credits / إجمالي الدائن", value: SAR(totalCr) + " ر.س" },
        ],
        headers: ["Entry #", "Date", "Description", "Account", "Debit (ر.س)", "Credit (ر.س)"],
        rows: flatRows,
      };
    }
    if (type === "trial-balance") {
      const tb = await journalStore.trialBalance(restaurantId);
      const totalDr = tb.reduce((s: number, r: any) => s + Number(r.debit || 0), 0);
      const totalCr = tb.reduce((s: number, r: any) => s + Number(r.credit || 0), 0);
      return {
        title: "Trial Balance", titleAr: "ميزان المراجعة",
        summary: [
          { label: "Total Debits / إجمالي المدين", value: SAR(totalDr) + " ر.س" },
          { label: "Total Credits / إجمالي الدائن", value: SAR(totalCr) + " ر.س" },
          { label: "Difference / الفرق", value: SAR(totalDr - totalCr) + " ر.س" },
        ],
        headers: ["Code", "Account", "Debit (ر.س)", "Credit (ر.س)", "Balance (ر.س)"],
        rows: tb.map((r: any) => [r.accountCode || "", r.accountName || "", SAR(r.debit), SAR(r.credit), SAR(r.balance)]),
      };
    }
    return null;
  }

  app.get("/api/real-estate/accounting/journal/:id/export", ...view, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const entry: any = await journalStore.getEntryWithLines(req.params.id, restaurantId);
      if (!entry) return res.status(404).json({ message: "Journal entry not found" });
      const lines = entry.lines || [];
      let totalDr = 0, totalCr = 0;
      const rows = lines.map((ln: any) => {
        totalDr += Number(ln.debit || 0); totalCr += Number(ln.credit || 0);
        return [
          `${ln.accountCode || ""} — ${ln.accountName || ""}`,
          ln.notes || ln.description || "",
          ln.debit ? SAR(ln.debit) : "",
          ln.credit ? SAR(ln.credit) : "",
        ];
      });
      rows.push(["", "TOTAL / الإجمالي", SAR(totalDr), SAR(totalCr)]);
      const restR = await pool.query(`SELECT name FROM restaurants WHERE id = $1`, [restaurantId]);
      const companyName = restR.rows[0]?.name || "Company";
      const fmtDate = (d: any): string => {
        if (!d) return "—";
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        const s = String(d);
        return s.slice(0, 10) || "—";
      };
      const pdf = await generateReportPdf({
        title: `Journal Entry ${entry.entryNumber || ""}`,
        titleAr: `قيد يومية ${entry.entryNumber || ""}`,
        companyName,
        rows: [
          { label: "Entry # / رقم القيد", value: entry.entryNumber || "—" },
          { label: "Date / التاريخ", value: fmtDate(entry.entryDate) },
          { label: "Description / الوصف", value: entry.description || "—" },
          { label: "Reference / المرجع", value: entry.referenceType ? `${entry.referenceType} ${entry.referenceId || ""}`.trim() : "—" },
          { label: "Total Debit / إجمالي المدين", value: SAR(totalDr) + " ر.س" },
          { label: "Total Credit / إجمالي الدائن", value: SAR(totalCr) + " ر.س" },
        ],
        tableRows: { headers: ["Account / الحساب", "Description / الوصف", "Debit (ر.س)", "Credit (ر.س)"], data: rows },
      });
      const buf = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", String(buf.length));
      res.setHeader("Content-Disposition", `attachment; filename="journal-${entry.entryNumber || entry.id}.pdf"`);
      res.send(buf);
    } catch (e) {
      console.error("[realEstate] journal export error:", e);
      err(res, e);
    }
  });

  app.get("/api/real-estate/accounting/:type/export", ...view, async (req, res) => {
    try {
      const format = String(req.query.format || "pdf").toLowerCase();
      const data = await buildAccountingExport(req.params.type, rid(req));
      if (!data) return res.status(400).json({ message: "Unsupported accounting export type" });
      const stamp = new Date().toISOString().slice(0, 10);
      const fname = `${req.params.type}-${stamp}`;
      if (format === "excel" || format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.aoa_to_sheet([
          [data.title], [data.titleAr], [],
          ["Generated", new Date().toISOString().slice(0, 19).replace("T", " ")], [],
          ["Summary"],
          ...data.summary.map((s) => [s.label, s.value]),
        ]);
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
        if (data.rows.length) {
          const detailSheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
          XLSX.utils.book_append_sheet(wb, detailSheet, "Details");
        }
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fname}.xlsx"`);
        return res.end(buf);
      }
      // PDF (default)
      const restR = await pool.query(`SELECT name FROM restaurants WHERE id = $1`, [rid(req)]);
      const companyName = restR.rows[0]?.name || "Company";
      const pdf = await generateReportPdf({
        title: data.title, titleAr: data.titleAr, rows: data.summary, companyName,
        tableRows: data.rows.length ? { headers: data.headers, data: data.rows } : undefined,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fname}.pdf"`);
      res.end(pdf);
    } catch (e) { err(res, e); }
  });

  // ============ Dashboard ============
  app.get("/api/real-estate/dashboard/summary", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const propsCount = await pool.query(`SELECT COUNT(*)::int as c FROM properties WHERE restaurant_id = $1`, [r]);
      const unitsByStatus = await pool.query(`SELECT status, COUNT(*)::int as c FROM property_units WHERE restaurant_id = $1 GROUP BY status`, [r]);
      const monthly = await pool.query(
        `SELECT COALESCE(SUM(amount_paid),0)::bigint as rev
         FROM rental_payments WHERE restaurant_id = $1 AND payment_date >= date_trunc('month', CURRENT_DATE)`, [r]);
      const monthlyExp = await pool.query(
        `SELECT COALESCE(SUM(amount),0)::bigint as exp
         FROM property_expenses WHERE restaurant_id = $1 AND status = 'paid' AND expense_date >= date_trunc('month', CURRENT_DATE)`, [r]);
      const overdue = await pool.query(
        `SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount - amount_paid),0)::bigint as amt
         FROM rental_invoices WHERE restaurant_id = $1 AND status = 'overdue'`, [r]);
      const expiring = await pool.query(
        `SELECT id, contract_number, end_date FROM rental_contracts
         WHERE restaurant_id = $1 AND status = 'active' AND end_date <= CURRENT_DATE + INTERVAL '90 days'
         ORDER BY end_date ASC LIMIT 20`, [r]);
      const recentPayments = await pool.query(
        `SELECT * FROM rental_payments WHERE restaurant_id = $1 ORDER BY payment_date DESC, created_at DESC LIMIT 10`, [r]);
      const revenue12 = await pool.query(
        `SELECT to_char(date_trunc('month', payment_date), 'YYYY-MM') as month,
                COALESCE(SUM(amount_paid),0)::bigint as revenue
         FROM rental_payments WHERE restaurant_id = $1 AND payment_date >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [r]);
      const expenses12 = await pool.query(
        `SELECT to_char(date_trunc('month', expense_date), 'YYYY-MM') as month,
                COALESCE(SUM(amount),0)::bigint as expenses
         FROM property_expenses WHERE restaurant_id = $1 AND status = 'paid' AND expense_date >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [r]);
      const propsByType = await pool.query(
        `SELECT type, COUNT(*)::int as c FROM properties WHERE restaurant_id = $1 GROUP BY type`, [r]);

      const unitsMap = unitsByStatus.rows.reduce((m: any, x: any) => ({ ...m, [x.status]: x.c }), {});
      const totalUnits = Object.values(unitsMap).reduce((a: any, b: any) => a + b, 0) as number;
      const occupied = unitsMap.rented || 0;
      ok(res, {
        totalProperties: propsCount.rows[0]?.c || 0,
        totalUnits, occupiedUnits: occupied,
        occupancyPct: totalUnits ? (occupied / totalUnits) * 100 : 0,
        monthlyRevenue: Number(monthly.rows[0]?.rev || 0),
        monthlyExpenses: Number(monthlyExp.rows[0]?.exp || 0),
        netIncome: Number(monthly.rows[0]?.rev || 0) - Number(monthlyExp.rows[0]?.exp || 0),
        overdueCount: overdue.rows[0]?.c || 0,
        overdueAmount: Number(overdue.rows[0]?.amt || 0),
        expiringContracts: expiring.rows,
        recentPayments: recentPayments.rows.map((r: any) => ({ ...r, amountPaid: Number(r.amount_paid) })),
        revenue12: revenue12.rows.map((x: any) => ({ month: x.month, revenue: Number(x.revenue) })),
        expenses12: expenses12.rows.map((x: any) => ({ month: x.month, expenses: Number(x.expenses) })),
        propertiesByType: propsByType.rows,
      });
    } catch (e) { err(res, e); }
  });

  // ============ Reports ============
  app.get("/api/real-estate/reports/income-statement", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const from = (req.query.from as string) || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);
      const propertyFilter = req.query.propertyId ? `AND pu.property_id = '${String(req.query.propertyId).replace(/'/g, "")}'` : "";
      const rev = await pool.query(
        `SELECT p.type as property_type, COALESCE(SUM(rp.amount_paid),0)::bigint as revenue
         FROM rental_payments rp
         JOIN rental_contracts rc ON rc.id = rp.contract_id
         JOIN property_units pu ON pu.id = rc.unit_id
         JOIN properties p ON p.id = pu.property_id
         WHERE rp.restaurant_id = $1 AND rp.payment_date BETWEEN $2 AND $3 ${propertyFilter}
         GROUP BY p.type`,
        [r, from, to]);
      const expCat = await pool.query(
        `SELECT category, COALESCE(SUM(amount),0)::bigint as amt
         FROM property_expenses WHERE restaurant_id = $1 AND status = 'paid' AND expense_date BETWEEN $2 AND $3
         ${req.query.propertyId ? `AND property_id = '${String(req.query.propertyId).replace(/'/g, "")}'` : ""}
         GROUP BY category`, [r, from, to]);
      const revenue = rev.rows.reduce((a, b) => a + Number(b.revenue), 0);
      const expenses = expCat.rows.reduce((a, b) => a + Number(b.amt), 0);
      ok(res, {
        from, to,
        revenueByType: rev.rows.map((x: any) => ({ type: x.property_type, revenue: Number(x.revenue) })),
        expensesByCategory: expCat.rows.map((x: any) => ({ category: x.category, amount: Number(x.amt) })),
        totalRevenue: revenue, totalExpenses: expenses, noi: revenue - expenses,
      });
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/rent-roll", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const rr = await pool.query(
        `SELECT pu.unit_number, p.name as property_name, t.full_name as tenant_name,
                rc.monthly_rent, rc.start_date, rc.end_date, rc.status as contract_status,
                COALESCE(SUM(CASE WHEN ri.status IN ('pending','partial','overdue') THEN ri.total_amount - ri.amount_paid ELSE 0 END), 0)::bigint as outstanding,
                MIN(CASE WHEN ri.status IN ('pending','partial','overdue') THEN ri.due_date END) as next_due
         FROM property_units pu
         LEFT JOIN rental_contracts rc ON rc.unit_id = pu.id AND rc.status = 'active'
         LEFT JOIN property_tenants t ON t.id = rc.tenant_id
         LEFT JOIN rental_invoices ri ON ri.contract_id = rc.id
         JOIN properties p ON p.id = pu.property_id
         WHERE pu.restaurant_id = $1
         GROUP BY pu.unit_number, p.name, t.full_name, rc.monthly_rent, rc.start_date, rc.end_date, rc.status
         ORDER BY p.name, pu.unit_number`, [r]);
      ok(res, rr.rows.map((row: any) => ({
        unitNumber: row.unit_number, propertyName: row.property_name, tenantName: row.tenant_name,
        monthlyRent: Number(row.monthly_rent || 0), startDate: row.start_date, endDate: row.end_date,
        contractStatus: row.contract_status, outstanding: Number(row.outstanding || 0), nextDue: row.next_due,
      })));
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/cash-flow", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const from = (req.query.from as string) || new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
      const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);
      const rev = await pool.query(
        `SELECT to_char(date_trunc('month', payment_date),'YYYY-MM') as month, SUM(amount_paid)::bigint as cash_in
         FROM rental_payments WHERE restaurant_id = $1 AND payment_date BETWEEN $2 AND $3
         GROUP BY 1`, [r, from, to]);
      const exp = await pool.query(
        `SELECT to_char(date_trunc('month', expense_date),'YYYY-MM') as month, SUM(amount)::bigint as cash_out
         FROM property_expenses WHERE restaurant_id = $1 AND status = 'paid' AND expense_date BETWEEN $2 AND $3
         GROUP BY 1`, [r, from, to]);
      const map: Record<string, { month: string; cashIn: number; cashOut: number }> = {};
      for (const x of rev.rows) map[x.month] = { month: x.month, cashIn: Number(x.cash_in), cashOut: 0 };
      for (const x of exp.rows) { map[x.month] = map[x.month] || { month: x.month, cashIn: 0, cashOut: 0 }; map[x.month].cashOut = Number(x.cash_out); }
      const months = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
      let running = 0;
      const series = months.map((m) => { running += m.cashIn - m.cashOut; return { ...m, net: m.cashIn - m.cashOut, runningBalance: running }; });
      ok(res, { from, to, series });
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/balance-sheet", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const propVal = await pool.query(`SELECT COALESCE(SUM(current_value),0)::bigint as v FROM properties WHERE restaurant_id = $1`, [r]);
      const recv = await pool.query(
        `SELECT COALESCE(SUM(total_amount - amount_paid),0)::bigint as v
         FROM rental_invoices WHERE restaurant_id = $1 AND status IN ('pending','partial','overdue')`, [r]);
      const cash = await journalStore.trialBalance(r);
      const cashOnHand = cash.find((x) => x.accountCode === "1010")?.balance || 0;
      const bank = cash.find((x) => x.accountCode === "1020")?.balance || 0;
      const deposits = -(cash.find((x) => x.accountCode === "2020")?.balance || 0);
      const vat = -(cash.find((x) => x.accountCode === "2110")?.balance || 0);
      const assets = Number(propVal.rows[0]?.v || 0) + Number(recv.rows[0]?.v || 0) + cashOnHand + bank;
      const liabilities = deposits + vat;
      ok(res, {
        assets: { propertyValue: Number(propVal.rows[0]?.v || 0), receivables: Number(recv.rows[0]?.v || 0), cashOnHand, bank, total: assets },
        liabilities: { securityDeposits: deposits, vatPayable: vat, total: liabilities },
        equity: assets - liabilities,
      });
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/aging-receivables", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const rows = await pool.query(
        `SELECT
           SUM(CASE WHEN CURRENT_DATE - due_date <= 0 THEN total_amount - amount_paid ELSE 0 END)::bigint as current,
           SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN total_amount - amount_paid ELSE 0 END)::bigint as d30,
           SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN total_amount - amount_paid ELSE 0 END)::bigint as d60,
           SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN total_amount - amount_paid ELSE 0 END)::bigint as d90,
           SUM(CASE WHEN CURRENT_DATE - due_date > 90 THEN total_amount - amount_paid ELSE 0 END)::bigint as d90plus
         FROM rental_invoices
         WHERE restaurant_id = $1 AND status IN ('pending','partial','overdue')`, [r]);
      const x = rows.rows[0] || {};
      ok(res, {
        buckets: {
          current: Number(x.current || 0),
          d30: Number(x.d30 || 0),
          d60: Number(x.d60 || 0),
          d90: Number(x.d90 || 0),
          d90plus: Number(x.d90plus || 0),
        },
      });
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/occupancy", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const overall = await pool.query(
        `SELECT COUNT(*)::int as total, SUM(CASE WHEN status='rented' THEN 1 ELSE 0 END)::int as rented
         FROM property_units WHERE restaurant_id = $1`, [r]);
      const byProperty = await pool.query(
        `SELECT p.name, p.type,
                COUNT(pu.id)::int as units,
                SUM(CASE WHEN pu.status='rented' THEN 1 ELSE 0 END)::int as rented
         FROM properties p LEFT JOIN property_units pu ON pu.property_id = p.id
         WHERE p.restaurant_id = $1 GROUP BY p.id, p.name, p.type ORDER BY p.name`, [r]);
      const o = overall.rows[0] || {};
      ok(res, {
        overall: {
          totalUnits: o.total || 0, rentedUnits: o.rented || 0,
          occupancyPct: o.total ? (Number(o.rented) / Number(o.total)) * 100 : 0,
        },
        byProperty: byProperty.rows.map((x: any) => ({
          name: x.name, type: x.type, units: x.units, rented: x.rented,
          occupancyPct: x.units ? (Number(x.rented) / Number(x.units)) * 100 : 0,
        })),
      });
    } catch (e) { err(res, e); }
  });

  // ---------- Report export helpers ----------
  // Build a normalized {title, titleAr, summary, headers, rows} structure for a given report type.
  // Re-used by both the PDF and Excel exports so they stay in lockstep.
  async function buildReportExport(reportType: string, req: Request, range: { from?: string; to?: string }) {
    const cookie = req.headers.cookie || "";
    const base = `http://localhost:${process.env.PORT || 5000}/api/real-estate/reports`;
    const qs = range.from && range.to ? `?from=${range.from}&to=${range.to}` : "";
    const fetchJson = async (path: string) => (await fetch(`${base}${path}`, { headers: { cookie } })).json();

    if (reportType === "rent-roll") {
      const data = await fetchJson("/rent-roll");
      return {
        title: "Rent Roll Report", titleAr: "تقرير الإيجارات",
        summary: [{ label: "Total Units", value: String(data.length) }],
        headers: ["Property", "Unit", "Tenant", "Monthly Rent (ر.س)", "Start Date", "End Date", "Status", "Outstanding (ر.س)"],
        rows: data.map((d: any) => [d.propertyName || "", d.unitNumber, d.tenantName || "-", SAR(d.monthlyRent), d.startDate || "-", d.endDate || "-", d.contractStatus || "-", SAR(d.outstanding)]),
      };
    }
    if (reportType === "income-statement") {
      const data = await fetchJson(`/income-statement${qs}`);
      return {
        title: "Income Statement", titleAr: "قائمة الدخل",
        summary: [
          { label: "From / من", value: data.from },
          { label: "To / إلى", value: data.to },
          { label: "Total Revenue / إجمالي الإيرادات", value: SAR(data.totalRevenue) + " ر.س" },
          { label: "Total Expenses / إجمالي المصروفات", value: SAR(data.totalExpenses) + " ر.س" },
          { label: "Net Operating Income / صافي الدخل", value: SAR(data.noi) + " ر.س" },
        ],
        headers: ["Line", "Amount (ر.س)"],
        rows: [
          ...(data.revenueByType || []).map((x: any) => [`Revenue — ${x.type}`, SAR(x.revenue)]),
          ...(data.expensesByCategory || []).map((x: any) => [`Expense — ${x.category}`, SAR(x.amount)]),
        ],
      };
    }
    if (reportType === "cash-flow") {
      const data = await fetchJson(`/cash-flow${qs}`);
      const series = data.series || [];
      const totalIn = series.reduce((s: number, m: any) => s + Number(m.cashIn || 0), 0);
      const totalOut = series.reduce((s: number, m: any) => s + Number(m.cashOut || 0), 0);
      return {
        title: "Cash Flow Report", titleAr: "تقرير التدفق النقدي",
        summary: [
          { label: "From / من", value: data.from },
          { label: "To / إلى", value: data.to },
          { label: "Cash In / المقبوضات", value: SAR(totalIn) + " ر.س" },
          { label: "Cash Out / المدفوعات", value: SAR(totalOut) + " ر.س" },
          { label: "Net / الصافي", value: SAR(totalIn - totalOut) + " ر.س" },
        ],
        headers: ["Month", "Cash In (ر.س)", "Cash Out (ر.س)", "Net (ر.س)", "Running Balance (ر.س)"],
        rows: series.map((m: any) => [m.month, SAR(m.cashIn), SAR(m.cashOut), SAR(m.net), SAR(m.runningBalance)]),
      };
    }
    if (reportType === "balance-sheet") {
      const data = await fetchJson("/balance-sheet");
      return {
        title: "Balance Sheet", titleAr: "الميزانية العمومية",
        summary: [
          { label: "Total Assets / إجمالي الأصول", value: SAR(data.assets?.total || 0) + " ر.س" },
          { label: "Total Liabilities / إجمالي الالتزامات", value: SAR(data.liabilities?.total || 0) + " ر.س" },
          { label: "Equity / حقوق الملكية", value: SAR(data.equity || 0) + " ر.س" },
        ],
        headers: ["Account", "Amount (ر.س)"],
        rows: [
          ["Property Value", SAR(data.assets?.propertyValue || 0)],
          ["Cash on Hand", SAR(data.assets?.cashOnHand || 0)],
          ["Bank", SAR(data.assets?.bank || 0)],
          ["Receivables", SAR(data.assets?.receivables || 0)],
          ["Total Assets", SAR(data.assets?.total || 0)],
          ["Security Deposits (Liability)", SAR(data.liabilities?.securityDeposits || 0)],
          ["VAT Payable", SAR(data.liabilities?.vatPayable || 0)],
          ["Total Liabilities", SAR(data.liabilities?.total || 0)],
          ["Equity", SAR(data.equity || 0)],
        ],
      };
    }
    if (reportType === "aging-receivables" || reportType === "aging") {
      const data = await fetchJson("/aging-receivables");
      const b = data.buckets || {};
      const total = Number(b.current || 0) + Number(b.d30 || 0) + Number(b.d60 || 0) + Number(b.d90 || 0) + Number(b.d90plus || 0);
      return {
        title: "Aging Receivables", titleAr: "تقرير أعمار الذمم",
        summary: [{ label: "Total Outstanding / إجمالي المستحقات", value: SAR(total) + " ر.س" }],
        headers: ["Bucket", "Amount (ر.س)"],
        rows: [
          ["Current (0 days)", SAR(b.current || 0)],
          ["1-30 days", SAR(b.d30 || 0)],
          ["31-60 days", SAR(b.d60 || 0)],
          ["61-90 days", SAR(b.d90 || 0)],
          ["90+ days", SAR(b.d90plus || 0)],
        ],
      };
    }
    if (reportType === "occupancy") {
      const data = await fetchJson("/occupancy");
      const o = data.overall || {};
      return {
        title: "Occupancy Report", titleAr: "تقرير الإشغال",
        summary: [
          { label: "Total Units / إجمالي الوحدات", value: String(o.totalUnits || 0) },
          { label: "Rented / المؤجرة", value: String(o.rentedUnits || 0) },
          { label: "Occupancy % / نسبة الإشغال", value: `${Number(o.occupancyPct || 0).toFixed(1)}%` },
        ],
        headers: ["Property", "Type", "Units", "Rented", "Occupancy %"],
        rows: (data.byProperty || []).map((x: any) => [x.name, x.type, String(x.units), String(x.rented), `${Number(x.occupancyPct || 0).toFixed(1)}%`]),
      };
    }
    return null;
  }

  app.get("/api/real-estate/reports/:type/pdf", ...view, async (req, res) => {
    try {
      const r = rid(req);
      const restR = await pool.query(`SELECT name FROM restaurants WHERE id = $1`, [r]);
      const companyName = restR.rows[0]?.name || "Company";
      const data = await buildReportExport(req.params.type, req, { from: req.query.from as string, to: req.query.to as string });
      if (!data) return res.status(400).json({ message: "Unsupported report type" });
      const pdf = await generateReportPdf({
        title: data.title, titleAr: data.titleAr, rows: data.summary, companyName,
        tableRows: data.rows.length ? { headers: data.headers, data: data.rows } : undefined,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${req.params.type}-${new Date().toISOString().slice(0, 10)}.pdf"`);
      res.end(pdf);
    } catch (e) { err(res, e); }
  });

  app.get("/api/real-estate/reports/:type/excel", ...view, async (req, res) => {
    try {
      const data = await buildReportExport(req.params.type, req, { from: req.query.from as string, to: req.query.to as string });
      if (!data) return res.status(400).json({ message: "Unsupported report type" });
      const wb = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.aoa_to_sheet([
        [data.title], [data.titleAr], [],
        ["Generated", new Date().toISOString().slice(0, 19).replace("T", " ")], [],
        ["Summary"],
        ...data.summary.map((s) => [s.label, s.value]),
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      if (data.rows.length) {
        const detailSheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
        XLSX.utils.book_append_sheet(wb, detailSheet, "Details");
      }
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${req.params.type}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      res.end(buf);
    } catch (e) { err(res, e); }
  });

  // ============ Notifications ============
  app.get("/api/real-estate/notifications", ...view, async (req, res) => {
    try { ok(res, await notificationsStore.list(rid(req), req.query.unread === "true")); } catch (e) { err(res, e); }
  });
  app.get("/api/real-estate/notifications/unread-count", ...view, async (req, res) => {
    try { ok(res, { count: await notificationsStore.unreadCount(rid(req)) }); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/notifications/:id/read", ...edit, async (req, res) => {
    try { await notificationsStore.markRead(req.params.id, rid(req)); ok(res, { ok: true }); } catch (e) { err(res, e); }
  });
  app.post("/api/real-estate/notifications/read-all", ...edit, async (req, res) => {
    try { await notificationsStore.markAllRead(rid(req)); ok(res, { ok: true }); } catch (e) { err(res, e); }
  });

  // ============ Seed ============
  app.post("/api/real-estate/seed", requireAuth, requireRestaurant, async (req, res) => {
    try {
      if (req.session.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
      }
      const result = await seedRealEstate(rid(req));
      ok(res, { ok: true, ...result });
    } catch (e) { err(res, e); }
  });
}
