// Equipment Supplier Management module (service business types).
// All endpoints tenant-scoped by restaurantId and gated by the 'procurement' permission.
import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertEquipmentSupplierSchema,
  insertSupplierEquipmentSchema,
  insertSupplierPaymentSchema,
  insertSupplierRentalSchema,
  insertEquipmentTypeSchema,
  type EquipmentSupplier,
} from "@shared/schema";

const SUPPLIER_DOCS_DIR = path.join(process.cwd(), "uploads", "supplier-docs");

const supplierDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(SUPPLIER_DOCS_DIR)) fs.mkdirSync(SUPPLIER_DOCS_DIR, { recursive: true });
    cb(null, SUPPLIER_DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `supdoc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const uploadSupplierDoc = multer({
  storage: supplierDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per spec
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(pdf|jpe?g|png|webp)$/i;
    const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowedExt.test(file.originalname) && allowedMime.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, JPG, PNG, and WebP files up to 5MB are allowed"));
  },
});

// Resolve a stored path and ensure it stays inside the supplier docs dir.
function safeDocPath(storagePath: string): string | null {
  const resolved = path.resolve(storagePath);
  if (!resolved.startsWith(path.resolve(SUPPLIER_DOCS_DIR) + path.sep)) return null;
  return resolved;
}

function tryUnlink(storagePath: string | null | undefined) {
  if (!storagePath) return;
  const p = safeDocPath(storagePath);
  if (p && fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (e) { console.error("[suppliers] failed to delete file:", e); }
  }
}

const DEFAULT_EQUIPMENT_TYPES = [
  "حفارة", "لودر (بوكلين)", "رافعة (كرين)", "خلاطة خرسانة", "ضاغط هواء",
  "جنريتور كهرباء", "سقالات", "مضخة خرسانة", "شاحنة قلابة", "مضخة مياه",
];

const MANDATORY_DOC_KEYS = ["iban_cert", "cr_cert", "vat_cert"];
const SUPPLIER_DOC_KEYS = [...MANDATORY_DOC_KEYS, "lic1", "lic2"];
const EQUIPMENT_DOC_KEYS = ["photo", "licence", "assurance", "driver_photo"];

async function recomputeSupplierScore(supplierId: string, restaurantId: string): Promise<EquipmentSupplier | undefined> {
  const supplier = await storage.getEquipmentSupplier(supplierId, restaurantId);
  if (!supplier) return undefined;
  const equipment = await storage.getSupplierEquipment(supplierId, restaurantId);
  const docs = await storage.getSupplierDocuments(supplierId, restaurantId);

  const required = [
    supplier.companyName, supplier.contactName, supplier.phone, supplier.crNumber,
    supplier.vatNumber, supplier.bankName, supplier.bankAccountName, supplier.iban, supplier.city,
  ];
  const filled = required.filter(v => v && String(v).trim() !== "").length;
  let score = (filled / 9) * 50;
  const availableCount = equipment.filter(e => e.available).length;
  score += Math.min(20, availableCount * 5);
  const mandatoryUploaded = MANDATORY_DOC_KEYS.filter(k => docs.some(d => d.docKey === k)).length;
  score += mandatoryUploaded * 10;
  const rounded = Math.round(score);
  const status = rounded >= 100 ? "complete" : rounded > 0 ? "partial" : "draft";
  return storage.updateEquipmentSupplier(supplierId, restaurantId, { completionScore: Math.min(100, rounded), status });
}

export function registerSupplierRoutes(
  app: Express,
  requireAuth: any,
  requireRestaurant: any,
  requirePermission: (perm: string) => any,
  requireAction: (perm: string, action: string) => any,
) {
  const canView = [requireAuth, requireRestaurant, requirePermission("procurement")];
  const canAdd = [requireAuth, requireRestaurant, requireAction("procurement", "add")];
  const canEdit = [requireAuth, requireRestaurant, requireAction("procurement", "edit")];
  const canDelete = [requireAuth, requireRestaurant, requireAction("procurement", "delete")];
  const rid = (req: Request) => (req as any).session.user!.restaurantId! as string;

  // ---- Equipment types (global name list, per tenant, seeded with defaults) ----
  app.get("/api/suppliers/equipment-types", ...canView, async (req, res) => {
    try {
      let types = await storage.getEquipmentTypes(rid(req));
      if (types.length === 0) {
        for (let i = 0; i < DEFAULT_EQUIPMENT_TYPES.length; i++) {
          await storage.createEquipmentType({ restaurantId: rid(req), name: DEFAULT_EQUIPMENT_TYPES[i], sortOrder: i });
        }
        types = await storage.getEquipmentTypes(rid(req));
      }
      res.json(types);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/suppliers/equipment-types", ...canAdd, async (req, res) => {
    try {
      const data = insertEquipmentTypeSchema.omit({ restaurantId: true }).parse(req.body);
      const created = await storage.createEquipmentType({ ...data, restaurantId: rid(req) });
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.put("/api/suppliers/equipment-types/:id", ...canEdit, async (req, res) => {
    try {
      const data = insertEquipmentTypeSchema.omit({ restaurantId: true }).partial().parse(req.body);
      const updated = await storage.updateEquipmentType(req.params.id, rid(req), data);
      if (!updated) return res.status(404).json({ message: "Equipment type not found" });
      res.json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/suppliers/equipment-types/:id", ...canDelete, async (req, res) => {
    try {
      const ok = await storage.deleteEquipmentType(req.params.id, rid(req));
      if (!ok) return res.status(404).json({ message: "Equipment type not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Reports & alerts (must precede /api/suppliers/:id) ----
  app.get("/api/suppliers/reports/summary", ...canView, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const suppliers = await storage.getEquipmentSuppliers(restaurantId);
      const payments = await storage.getAllSupplierPayments(restaurantId);
      let totalEquipmentAvailable = 0;
      const cityMap: Record<string, number> = {};
      for (const s of suppliers) {
        const eq = await storage.getSupplierEquipment(s.id, restaurantId);
        totalEquipmentAvailable += eq.filter(e => e.available).length;
        const city = (s.city || "").trim() || "-";
        cityMap[city] = (cityMap[city] || 0) + 1;
      }
      const avgScore = suppliers.length ? suppliers.reduce((sum, s) => sum + (s.completionScore || 0), 0) / suppliers.length : 0;
      const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      const totalPending = payments.filter(p => p.status !== "paid").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      res.json({
        totalSuppliers: suppliers.length,
        avgScore: Math.round(avgScore),
        totalPaid, totalPending, totalEquipmentAvailable,
        byCity: Object.entries(cityMap).map(([city, count]) => ({ city, count })),
        byStatus: {
          complete: suppliers.filter(s => s.status === "complete").length,
          partial: suppliers.filter(s => s.status === "partial").length,
          draft: suppliers.filter(s => s.status === "draft").length,
        },
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/suppliers/reports/rankings", ...canView, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const suppliers = await storage.getEquipmentSuppliers(restaurantId);
      const types = await storage.getEquipmentTypes(restaurantId);
      const totalEqTypes = Math.max(1, types.length);
      const rankings = [];
      for (const s of suppliers) {
        const eq = await storage.getSupplierEquipment(s.id, restaurantId);
        const docs = await storage.getSupplierDocuments(s.id, restaurantId);
        const pays = await storage.getSupplierPayments(s.id, restaurantId);
        let score = (s.completionScore || 0) * 0.30;
        const availableEq = eq.filter(e => e.available).length;
        score += Math.min(20, (availableEq / totalEqTypes) * 20);
        if (eq.some(e => parseFloat(e.dailyRate || "0") > 0)) score += 25;
        score += Math.min(15, docs.length * 3);
        if (pays.length > 0) score += (pays.filter(p => p.status === "paid").length / pays.length) * 10;
        rankings.push({
          id: s.id, companyName: s.companyName, contactName: s.contactName, city: s.city,
          status: s.status, completionScore: s.completionScore,
          performanceScore: Math.round(score),
          equipmentCount: eq.length, availableEquipment: availableEq,
        });
      }
      rankings.sort((a, b) => b.performanceScore - a.performanceScore);
      res.json(rankings);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/suppliers/reports/pricing", ...canView, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const suppliers = await storage.getEquipmentSuppliers(restaurantId);
      const byEquipment: Record<string, Array<{ supplierId: string; companyName: string; hourlyRate: string | null; dailyRate: string | null; weeklyRate: string | null; available: boolean }>> = {};
      for (const s of suppliers) {
        const eq = await storage.getSupplierEquipment(s.id, restaurantId);
        for (const e of eq) {
          if (!byEquipment[e.name]) byEquipment[e.name] = [];
          byEquipment[e.name].push({
            supplierId: s.id, companyName: s.companyName,
            hourlyRate: e.hourlyRate, dailyRate: e.dailyRate, weeklyRate: e.weeklyRate,
            available: e.available,
          });
        }
      }
      res.json(Object.entries(byEquipment).map(([name, offers]) => ({ name, offers })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/suppliers/alerts", ...canView, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const suppliers = await storage.getEquipmentSuppliers(restaurantId);
      const nameById = new Map(suppliers.map(s => [s.id, s.companyName]));
      const payments = await storage.getAllSupplierPayments(restaurantId);
      const rentals = await storage.getAllSupplierRentals(restaurantId);
      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      const ago7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      const alerts: any[] = [];
      for (const p of payments) {
        if (p.status === "paid") continue;
        const due = new Date(p.dueDate);
        if (due < now) alerts.push({ type: "payment_overdue", supplierId: p.supplierId, supplierName: nameById.get(p.supplierId) || "", label: p.label, amount: p.amount, date: p.dueDate });
        else if (due <= in7) alerts.push({ type: "payment_due_soon", supplierId: p.supplierId, supplierName: nameById.get(p.supplierId) || "", label: p.label, amount: p.amount, date: p.dueDate });
      }
      for (const r of rentals) {
        const end = new Date(r.endDate);
        if (end >= now && end <= in7) alerts.push({ type: "rental_ending_soon", supplierId: r.supplierId, supplierName: nameById.get(r.supplierId) || "", label: r.equipmentName, date: r.endDate });
        else if (end < now && end >= ago7) alerts.push({ type: "rental_ended", supplierId: r.supplierId, supplierName: nameById.get(r.supplierId) || "", label: r.equipmentName, date: r.endDate });
      }
      res.json(alerts);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Suppliers CRUD ----
  app.get("/api/suppliers", ...canView, async (req, res) => {
    try {
      let suppliers = await storage.getEquipmentSuppliers(rid(req));
      const { filter, search } = req.query as { filter?: string; search?: string };
      if (filter && ["complete", "partial", "draft"].includes(filter)) suppliers = suppliers.filter(s => s.status === filter);
      if (search) {
        const q = search.toLowerCase();
        suppliers = suppliers.filter(s => s.companyName.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q));
      }
      // Attach equipment counts for the list cards
      const withCounts = [];
      for (const s of suppliers) {
        const eq = await storage.getSupplierEquipment(s.id, rid(req));
        withCounts.push({ ...s, equipmentCount: eq.length, availableEquipment: eq.filter(e => e.available).length });
      }
      res.json(withCounts);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/suppliers/:id", ...canView, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const supplier = await storage.getEquipmentSupplier(req.params.id, restaurantId);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const [equipment, payments, documents, equipmentDocuments, rentals] = await Promise.all([
        storage.getSupplierEquipment(supplier.id, restaurantId),
        storage.getSupplierPayments(supplier.id, restaurantId),
        storage.getSupplierDocuments(supplier.id, restaurantId),
        storage.getSupplierEquipmentDocuments(supplier.id, restaurantId),
        storage.getSupplierRentals(supplier.id, restaurantId),
      ]);
      res.json({ ...supplier, equipment, payments, documents, equipmentDocuments, rentals });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  const supplierBodySchema = insertEquipmentSupplierSchema.omit({ restaurantId: true });
  const equipmentRowSchema = insertSupplierEquipmentSchema.omit({ restaurantId: true, supplierId: true });

  app.post("/api/suppliers", ...canAdd, async (req, res) => {
    try {
      const { equipment: eqRows, ...body } = req.body || {};
      const data = supplierBodySchema.parse(body);
      const created = await storage.createEquipmentSupplier({ ...data, restaurantId: rid(req) } as any);
      if (Array.isArray(eqRows)) {
        for (let i = 0; i < eqRows.length; i++) {
          const row = equipmentRowSchema.parse({ ...eqRows[i], sortOrder: i });
          await storage.createSupplierEquipment({ ...row, restaurantId: rid(req), supplierId: created.id } as any);
        }
      }
      const updated = await recomputeSupplierScore(created.id, rid(req));
      res.status(201).json(updated || created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/suppliers/:id", ...canEdit, async (req, res) => {
    try {
      const restaurantId = rid(req);
      const { equipment: eqRows, ...body } = req.body || {};
      const data = supplierBodySchema.partial().parse(body);
      const updated = await storage.updateEquipmentSupplier(req.params.id, restaurantId, data);
      if (!updated) return res.status(404).json({ message: "Supplier not found" });
      if (Array.isArray(eqRows)) {
        // Replace equipment set (keeps ids stable when provided)
        const existing = await storage.getSupplierEquipment(req.params.id, restaurantId);
        const keepIds = new Set(eqRows.filter((r: any) => r.id).map((r: any) => r.id));
        for (const ex of existing) if (!keepIds.has(ex.id)) await storage.deleteSupplierEquipment(ex.id, restaurantId);
        for (let i = 0; i < eqRows.length; i++) {
          const r = eqRows[i];
          if (r.id) {
            const row = equipmentRowSchema.partial().parse({ ...r, sortOrder: i });
            await storage.updateSupplierEquipment(r.id, restaurantId, row);
          } else {
            const row = equipmentRowSchema.parse({ ...r, sortOrder: i });
            await storage.createSupplierEquipment({ ...row, restaurantId, supplierId: req.params.id } as any);
          }
        }
      }
      const final = await recomputeSupplierScore(req.params.id, restaurantId);
      res.json(final || updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/suppliers/:id", ...canDelete, async (req, res) => {
    try {
      const restaurantId = rid(req);
      // Remove files from disk before cascade delete
      const docs = await storage.getSupplierDocuments(req.params.id, restaurantId);
      const eqDocs = await storage.getSupplierEquipmentDocuments(req.params.id, restaurantId);
      const ok = await storage.deleteEquipmentSupplier(req.params.id, restaurantId);
      if (!ok) return res.status(404).json({ message: "Supplier not found" });
      for (const d of [...docs, ...eqDocs]) tryUnlink(d.storagePath);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Equipment sub-resource ----
  app.get("/api/suppliers/:id/equipment", ...canView, async (req, res) => {
    try { res.json(await storage.getSupplierEquipment(req.params.id, rid(req))); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/suppliers/:id/equipment", ...canAdd, async (req, res) => {
    try {
      const supplier = await storage.getEquipmentSupplier(req.params.id, rid(req));
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const row = equipmentRowSchema.parse(req.body);
      const created = await storage.createSupplierEquipment({ ...row, restaurantId: rid(req), supplierId: req.params.id } as any);
      await recomputeSupplierScore(req.params.id, rid(req));
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.put("/api/suppliers/:id/equipment/:eid", ...canEdit, async (req, res) => {
    try {
      const belongs = (await storage.getSupplierEquipment(req.params.id, rid(req))).some(e => e.id === req.params.eid);
      if (!belongs) return res.status(404).json({ message: "Equipment not found" });
      const row = equipmentRowSchema.partial().parse(req.body);
      const updated = await storage.updateSupplierEquipment(req.params.eid, rid(req), row);
      if (!updated) return res.status(404).json({ message: "Equipment not found" });
      await recomputeSupplierScore(req.params.id, rid(req));
      res.json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/suppliers/:id/equipment/:eid", ...canDelete, async (req, res) => {
    try {
      const belongs = (await storage.getSupplierEquipment(req.params.id, rid(req))).some(e => e.id === req.params.eid);
      if (!belongs) return res.status(404).json({ message: "Equipment not found" });
      const eqDocs = (await storage.getSupplierEquipmentDocuments(req.params.id, rid(req))).filter(d => d.equipmentId === req.params.eid);
      const ok = await storage.deleteSupplierEquipment(req.params.eid, rid(req));
      if (!ok) return res.status(404).json({ message: "Equipment not found" });
      for (const d of eqDocs) tryUnlink(d.storagePath);
      await recomputeSupplierScore(req.params.id, rid(req));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Payments sub-resource ----
  const paymentBodySchema = insertSupplierPaymentSchema.omit({ restaurantId: true, supplierId: true });
  app.get("/api/suppliers/:id/payments", ...canView, async (req, res) => {
    try {
      const payments = await storage.getSupplierPayments(req.params.id, rid(req));
      const now = new Date();
      res.json(payments.map(p => ({
        ...p,
        status: p.status !== "paid" && new Date(p.dueDate) < now ? "overdue" : p.status,
      })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/suppliers/:id/payments", ...canAdd, async (req, res) => {
    try {
      const supplier = await storage.getEquipmentSupplier(req.params.id, rid(req));
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const data = paymentBodySchema.parse(req.body);
      const created = await storage.createSupplierPayment({ ...data, restaurantId: rid(req), supplierId: req.params.id } as any);
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.put("/api/suppliers/:id/payments/:pid", ...canEdit, async (req, res) => {
    try {
      const belongs = (await storage.getSupplierPayments(req.params.id, rid(req))).some(p => p.id === req.params.pid);
      if (!belongs) return res.status(404).json({ message: "Payment not found" });
      const data = paymentBodySchema.partial().parse(req.body);
      if (data.status === "paid" && !data.paidDate) data.paidDate = new Date();
      const updated = await storage.updateSupplierPayment(req.params.pid, rid(req), data);
      if (!updated) return res.status(404).json({ message: "Payment not found" });
      res.json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/suppliers/:id/payments/:pid", ...canDelete, async (req, res) => {
    try {
      const belongs = (await storage.getSupplierPayments(req.params.id, rid(req))).some(p => p.id === req.params.pid);
      if (!belongs) return res.status(404).json({ message: "Payment not found" });
      const ok = await storage.deleteSupplierPayment(req.params.pid, rid(req));
      if (!ok) return res.status(404).json({ message: "Payment not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Supplier documents ----
  app.post("/api/suppliers/:id/documents", ...canEdit, uploadSupplierDoc.single("file"), async (req, res) => {
    try {
      const restaurantId = rid(req);
      const supplier = await storage.getEquipmentSupplier(req.params.id, restaurantId);
      if (!supplier) { if (req.file) tryUnlink(req.file.path); return res.status(404).json({ message: "Supplier not found" }); }
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const docKey = String(req.body.doc_key || req.body.docKey || "");
      if (!SUPPLIER_DOC_KEYS.includes(docKey)) { tryUnlink(req.file.path); return res.status(400).json({ message: "Invalid doc_key" }); }
      // Replace existing doc in the same slot
      const existing = (await storage.getSupplierDocuments(req.params.id, restaurantId)).find(d => d.docKey === docKey);
      if (existing) {
        tryUnlink(existing.storagePath);
        await storage.deleteSupplierDocument(existing.id, restaurantId);
      }
      const created = await storage.createSupplierDocument({
        restaurantId, supplierId: req.params.id, docKey,
        fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size,
        storagePath: req.file.path,
      });
      await recomputeSupplierScore(req.params.id, restaurantId);
      res.status(201).json(created);
    } catch (e: any) { if (req.file) tryUnlink(req.file.path); res.status(500).json({ message: e.message }); }
  });
  app.get("/api/suppliers/:id/documents/:did/file", ...canView, async (req, res) => {
    try {
      const doc = await storage.getSupplierDocument(req.params.did, rid(req));
      if (!doc || doc.supplierId !== req.params.id) return res.status(404).json({ message: "Document not found" });
      const p = safeDocPath(doc.storagePath);
      if (!p || !fs.existsSync(p)) return res.status(404).json({ message: "File not found" });
      res.setHeader("Content-Type", doc.fileType);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.fileName)}"`);
      fs.createReadStream(p).pipe(res);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/suppliers/:id/documents/:did", ...canDelete, async (req, res) => {
    try {
      const doc = await storage.getSupplierDocument(req.params.did, rid(req));
      if (!doc || doc.supplierId !== req.params.id) return res.status(404).json({ message: "Document not found" });
      await storage.deleteSupplierDocument(req.params.did, rid(req));
      tryUnlink(doc.storagePath);
      await recomputeSupplierScore(req.params.id, rid(req));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Equipment documents ----
  app.post("/api/suppliers/:id/equipment/:eid/documents", ...canEdit, uploadSupplierDoc.single("file"), async (req, res) => {
    try {
      const restaurantId = rid(req);
      const supplier = await storage.getEquipmentSupplier(req.params.id, restaurantId);
      if (!supplier) { if (req.file) tryUnlink(req.file.path); return res.status(404).json({ message: "Supplier not found" }); }
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const docKey = String(req.body.doc_key || req.body.docKey || "");
      if (!EQUIPMENT_DOC_KEYS.includes(docKey)) { tryUnlink(req.file.path); return res.status(400).json({ message: "Invalid doc_key" }); }
      const existing = (await storage.getSupplierEquipmentDocuments(req.params.id, restaurantId))
        .find(d => d.equipmentId === req.params.eid && d.docKey === docKey);
      if (existing) {
        tryUnlink(existing.storagePath);
        await storage.deleteSupplierEquipmentDocument(existing.id, restaurantId);
      }
      const created = await storage.createSupplierEquipmentDocument({
        restaurantId, supplierId: req.params.id, equipmentId: req.params.eid, docKey,
        fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size,
        storagePath: req.file.path,
      });
      res.status(201).json(created);
    } catch (e: any) { if (req.file) tryUnlink(req.file.path); res.status(500).json({ message: e.message }); }
  });
  app.get("/api/suppliers/:id/equipment/:eid/documents/:did/file", ...canView, async (req, res) => {
    try {
      const doc = await storage.getSupplierEquipmentDocument(req.params.did, rid(req));
      if (!doc || doc.supplierId !== req.params.id || doc.equipmentId !== req.params.eid) return res.status(404).json({ message: "Document not found" });
      const p = safeDocPath(doc.storagePath);
      if (!p || !fs.existsSync(p)) return res.status(404).json({ message: "File not found" });
      res.setHeader("Content-Type", doc.fileType);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.fileName)}"`);
      fs.createReadStream(p).pipe(res);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/suppliers/:id/equipment/:eid/documents/:did", ...canDelete, async (req, res) => {
    try {
      const doc = await storage.getSupplierEquipmentDocument(req.params.did, rid(req));
      if (!doc || doc.supplierId !== req.params.id || doc.equipmentId !== req.params.eid) return res.status(404).json({ message: "Document not found" });
      await storage.deleteSupplierEquipmentDocument(req.params.did, rid(req));
      tryUnlink(doc.storagePath);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Rentals ----
  const rentalBodySchema = insertSupplierRentalSchema.omit({ restaurantId: true, supplierId: true });
  app.get("/api/suppliers/:id/rentals", ...canView, async (req, res) => {
    try { res.json(await storage.getSupplierRentals(req.params.id, rid(req))); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Rental agreement PDF (single or multiple rentals combined) ----
  const fmtD = (d: Date | string) => new Date(d).toLocaleDateString("en-GB");
  const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  async function buildAgreementData(supplierId: string, restaurantId: string, ids: string[]) {
    const supplier = await storage.getEquipmentSupplier(supplierId, restaurantId);
    if (!supplier) return null;
    const all = await storage.getSupplierRentals(supplierId, restaurantId);
    const rentals = all.filter(r => ids.includes(r.id));
    if (rentals.length === 0) return null;
    const equipment = await storage.getSupplierEquipment(supplierId, restaurantId);
    return { supplier, rentals, equipment };
  }

  function rentalAgreementHtml(supplier: EquipmentSupplier, rentals: any[], equipment: any[], lang: string) {
    const isAr = lang === "ar";
    const L = (en: string, ar: string) => (isAr ? ar : en);
    const first = rentals[0];
    const rateUnit = first.rateUnit || "daily";
    const unitLbl = rateUnit === "hourly" ? L("SAR/hour", "ريال/ساعة") : rateUnit === "weekly" ? L("SAR/week", "ريال/أسبوع") : L("SAR/day", "ريال/يوم");
    const rateOf = (name: string) => {
      const e = equipment.find((x: any) => x.name === name);
      if (!e) return "-";
      return (rateUnit === "hourly" ? e.hourlyRate : rateUnit === "weekly" ? e.weeklyRate : e.dailyRate) || "-";
    };
    const driverOf = (name: string) => {
      const e = equipment.find((x: any) => x.name === name);
      return e?.hasDriver ? L("Yes", "نعم") : L("No", "لا");
    };
    const terms = [supplier.fuel, supplier.breakdown, supplier.minRental, supplier.notice, supplier.cancellation, supplier.insurance].filter(Boolean).join(" • ") || "-";
    return `<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;color:#111827;font-size:13px;padding:8px}
      h1{font-size:20px;color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      td,th{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:${isAr ? "right" : "left"}}
      th{background:#eef2ff}
      p{margin:6px 0}
      .sig{margin-top:48px;display:flex;justify-content:space-between;gap:24px}
    </style></head><body>
      <h1>${L("Equipment Rental Agreement", "عقد إيجار معدات")}</h1>
      <p>${L("Reference", "المرجع")}: <b>${rentals.map(r => esc(r.referenceNumber)).join(", ")}</b> | ${L("Date", "التاريخ")}: ${fmtD(new Date())}</p>
      <p>${L("First party (Renter)", "الطرف الأول (المستأجر)")}: <b>${esc(first.renterName || "-")}</b>${first.renterEmail ? ` — ${esc(first.renterEmail)}` : ""}${first.renterWhatsapp ? ` — ${esc(first.renterWhatsapp)}` : ""}</p>
      <p>${L("Second party (Supplier)", "الطرف الثاني (المورد)")}: <b>${esc(supplier.companyName)}</b> — ${esc(supplier.contactName)} — ${esc(supplier.phone)}</p>
      <p>${L("CR", "السجل التجاري")}: ${esc(supplier.crNumber)} | ${L("VAT", "الرقم الضريبي")}: ${esc(supplier.vatNumber)} | IBAN: ${esc(supplier.iban)}</p>
      <p>${L("Period", "المدة")}: ${fmtD(first.startDate)} → ${fmtD(first.endDate)} | ${L("Location", "الموقع")}: ${esc(first.location || "-")}</p>
      <table><thead><tr><th>${L("Equipment", "المعدة")}</th><th>${L("Rate", "السعر")} (${unitLbl})</th><th>${L("Driver", "سائق")}</th></tr></thead>
      <tbody>${rentals.map(r => `<tr><td>${esc(r.equipmentName)}</td><td>${esc(rateOf(r.equipmentName))}</td><td>${driverOf(r.equipmentName)}</td></tr>`).join("")}</tbody></table>
      <p style="margin-top:20px"><b>${L("Terms", "الشروط")}:</b> ${esc(terms)}</p>
      <div class="sig"><span>${L("First party signature", "توقيع الطرف الأول")}: ______________</span><span>${L("Second party signature", "توقيع الطرف الثاني")}: ______________</span></div>
    </body></html>`;
  }

  app.get("/api/suppliers/:id/rentals/agreement.pdf", ...canView, async (req, res) => {
    try {
      const ids = String(req.query.ids || "").split(",").filter(Boolean);
      if (ids.length === 0) return res.status(400).json({ message: "ids required" });
      const data = await buildAgreementData(req.params.id, rid(req), ids);
      if (!data) return res.status(404).json({ message: "Rental not found" });
      const lang = req.query.lang === "ar" ? "ar" : "en";
      const { renderPdf } = await import("./realEstatePdf");
      const pdf = await renderPdf(rentalAgreementHtml(data.supplier, data.rentals, data.equipment, lang));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="rental-agreement-${data.rentals[0].referenceNumber || data.rentals[0].id}.pdf"`);
      res.send(pdf);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ---- Shared email helper (Resend integration/key first, SMTP fallback) ----
  async function sendSupplierEmail(to: string, subject: string, html: string, text: string, attachments?: Array<{ filename: string; content: Buffer }>) {
    let sendError: string | undefined;
    try {
      let connectorKey: string | undefined;
      let fromEmail: string | undefined;
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY
        ? "repl " + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
        ? "depl " + process.env.WEB_REPL_RENEWAL
        : null;
      if (xReplitToken && hostname) {
        const r = await fetch(
          "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
          { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } as any },
        );
        const data = await r.json();
        const s = data.items?.[0]?.settings;
        if (s?.api_key) { connectorKey = s.api_key; fromEmail = s.from_email; }
      }
      const envKey = process.env.RESEND_API_KEY;
      const candidates = [connectorKey, envKey].filter(Boolean) as string[];
      const apiKey = candidates.find(k => k.startsWith("re_")) || candidates[0];
      if (!fromEmail) fromEmail = process.env.EMAIL_FROM || process.env.IT_EMAIL || "IT@kinbss.org";
      if (apiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        const data: any = await resend.emails.send({ from: fromEmail!, to, subject, html, text, attachments } as any);
        if (data?.error) sendError = data.error.message; else return { ok: true };
      }
    } catch (e: any) {
      sendError = e.message;
    }
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    if (!hasSmtp) return { ok: false, error: sendError || "No email provider is configured" };
    const { sendGenericEmail } = await import("./emailService");
    const result = await sendGenericEmail({
      to, subject, html, text,
      attachments: attachments?.map(a => ({ ...a, contentType: "application/pdf" })),
    });
    return result.ok ? { ok: true } : { ok: false, error: sendError || result.error || "Failed to send email" };
  }

  // ---- Share rental agreement via email (PDF attached) ----
  app.post("/api/suppliers/:id/rentals/share-email", ...canView, async (req, res) => {
    try {
      const body = z.object({
        ids: z.array(z.string()).min(1),
        to: z.string().email().optional(),
        lang: z.enum(["en", "ar"]).optional(),
      }).parse(req.body);
      const data = await buildAgreementData(req.params.id, rid(req), body.ids);
      if (!data) return res.status(404).json({ message: "Rental not found" });
      const to = body.to || data.rentals[0].renterEmail;
      if (!to) return res.status(400).json({ message: "No renter email on file" });
      const lang = body.lang === "ar" ? "ar" : "en";
      const isAr = lang === "ar";
      const { renderPdf } = await import("./realEstatePdf");
      const pdf = await renderPdf(rentalAgreementHtml(data.supplier, data.rentals, data.equipment, lang));
      const ref = data.rentals.map(r => r.referenceNumber).filter(Boolean).join(", ");
      const subject = isAr ? `عقد إيجار معدات — ${ref}` : `Equipment Rental Agreement — ${ref}`;
      const eqNames = data.rentals.map(r => r.equipmentName).join(", ");
      const text = isAr
        ? `مرفق عقد إيجار المعدات (${eqNames}) من ${data.supplier.companyName}. المدة: ${fmtD(data.rentals[0].startDate)} إلى ${fmtD(data.rentals[0].endDate)}.`
        : `Attached is the equipment rental agreement (${eqNames}) from ${data.supplier.companyName}. Period: ${fmtD(data.rentals[0].startDate)} to ${fmtD(data.rentals[0].endDate)}.`;
      const html = `<p>${esc(text)}</p>`;
      const result = await sendSupplierEmail(to, subject, html, text, [
        { filename: `rental-agreement-${data.rentals[0].referenceNumber || data.rentals[0].id}.pdf`, content: pdf },
      ]);
      if (!result.ok) return res.status(500).json({ message: result.error });
      res.json({ success: true, to });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  // ---- Share payment schedule via email ----
  app.post("/api/suppliers/:id/payments/share-email", ...canView, async (req, res) => {
    try {
      const body = z.object({
        to: z.string().email().optional(),
        lang: z.enum(["en", "ar"]).optional(),
      }).parse(req.body);
      const supplier = await storage.getEquipmentSupplier(req.params.id, rid(req));
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const to = body.to || supplier.email;
      if (!to) return res.status(400).json({ message: "No email on file" });
      const payments = await storage.getSupplierPayments(req.params.id, rid(req));
      if (payments.length === 0) return res.status(400).json({ message: "No payments to share" });
      const isAr = body.lang === "ar";
      const L = (en: string, ar: string) => (isAr ? ar : en);
      const total = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const paid = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const rows = payments.map((p: any) =>
        `<tr><td>${esc(p.label)}</td><td>${Number(p.amount).toLocaleString()}</td><td>${fmtD(p.dueDate)}</td><td>${p.status === "paid" ? L("Paid", "مدفوع") : L("Pending", "قيد الانتظار")}</td></tr>`).join("");
      const subject = L(`Payment schedule — ${supplier.companyName}`, `جدول الدفعات — ${supplier.companyName}`);
      const html = `<div dir="${isAr ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif">
        <h2>${esc(subject)}</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><th>${L("Installment", "الدفعة")}</th><th>${L("Amount (SAR)", "المبلغ (ريال)")}</th><th>${L("Due Date", "تاريخ الاستحقاق")}</th><th>${L("Status", "الحالة")}</th></tr>
          ${rows}
        </table>
        <p>${L("Total", "الإجمالي")}: <b>${total.toLocaleString()}</b> | ${L("Paid", "المدفوع")}: <b>${paid.toLocaleString()}</b> | ${L("Remaining", "المتبقي")}: <b>${(total - paid).toLocaleString()}</b></p>
      </div>`;
      const text = payments.map((p: any) => `${p.label}: ${p.amount} SAR — ${fmtD(p.dueDate)} — ${p.status}`).join("\n");
      const result = await sendSupplierEmail(to, subject, html, text);
      if (!result.ok) return res.status(500).json({ message: result.error });
      res.json({ success: true, to });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/suppliers/:id/rentals", ...canAdd, async (req, res) => {
    try {
      const supplier = await storage.getEquipmentSupplier(req.params.id, rid(req));
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      const data = rentalBodySchema.parse(req.body);
      const referenceNumber = "RNT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await storage.createSupplierRental({ ...data, restaurantId: rid(req), supplierId: req.params.id, referenceNumber } as any);
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
}
