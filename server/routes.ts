import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { generateZATCAInvoice, generateSubscriptionInvoice, generateMonthlyVatReport } from "./invoice";
import { PasswordResetMailer } from "./email";
import { sanitizePatchBody } from "./utils";
import { requirePermission, requireAnyPermission, requireAllPermissions } from "./middleware/requirePermission";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import rateLimit from "express-rate-limit";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { sql, eq, and, gte, lte, isNull, isNotNull, desc } from "drizzle-orm";
import {
  insertRestaurantSchema,
  insertBranchSchema,
  insertInventoryItemSchema,
  insertMenuItemSchema,
  updateMenuItemSchema,
  insertAddonSchema,
  insertRecipeSchema,
  insertOrderSchema,
  insertTransactionSchema,
  insertSettingsSchema,
  insertProcurementSchema,
  insertUserSchema,
  insertInvoiceSchema,
  insertCustomerSchema,
  insertSalarySchema,
  insertShopBillSchema,
  insertDeliveryAppSchema,
  insertInvestorSchema,
  updateInvestorSchema,
  insertLicenseSchema,
  users,
  restaurants,
  orders,
} from "@shared/schema";
import { getPlanPricing, type SubscriptionPlan, type BusinessType } from "@shared/subscriptionPricing";
import { ADMIN_PERMISSIONS, type PermissionSet } from "@shared/permissions";

// WebSocket clients with session context for multi-tenant filtering
interface WSClient {
  socket: WebSocket;
  restaurantId: string;
  userId: string;
  conversationIds: Set<string>; // Conversations this user is a member of
}
let wsClients: Set<WSClient> | null = null;

// Unified broadcast function with restaurant filtering
export function broadcastNotification(event: {
  type: 'order:created' | 'order:statusUpdated' | 'chat:message' | 'ticket:created' | 'ticket:updated' | 'ticket:message' | 'settings:updated';
  restaurantId: string;
  // Order fields
  orderId?: string;
  orderNumber?: string;
  status?: string;
  branchId?: string;
  branchName?: string;
  itemsSummary?: string;
  // Chat fields
  conversationId?: string;
  message?: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  };
  // Ticket fields
  ticketId?: string;
  ticketNumber?: string;
  subject?: string;
  category?: string;
  priority?: string;
  ticketStatus?: string;
  ticketMessage?: {
    id: string;
    ticketId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  };
}) {
  if (!wsClients) return;
  
  const message = JSON.stringify(event);
  let sentCount = 0;
  
  wsClients.forEach((client) => {
    // Filter by restaurant for multi-tenant isolation
    if (client.restaurantId !== event.restaurantId || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // For chat messages, additionally filter by conversation membership
    if (event.type === 'chat:message' && event.conversationId) {
      if (!client.conversationIds.has(event.conversationId)) {
        return; // Skip clients not in this conversation
      }
    }
    
    client.socket.send(message);
    sentCount++;
  });
  
  console.log(`[WebSocket] Broadcast ${event.type} to ${sentCount} clients in restaurant ${event.restaurantId}`);
}

// Authentication middleware - CRITICAL for multi-tenant isolation
// Also tracks user activity for IT Dashboard monitoring
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Track activity in background (don't wait for it to complete)
  if (req.session.user.id) {
    storage.updateUserActivity(req.session.user.id).catch((error: Error) => {
      console.error('[Activity Tracking] Failed to update activity:', error);
    });
  }
  
  next();
};

// Middleware to require IT account type for IT-specific routes
const requireITAccount = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.accountType !== 'it') {
    return res.status(403).json({ error: "Access denied. IT account required." });
  }
  next();
};

// Middleware to ensure user has a restaurantId (not IT account)
const requireRestaurant = (req: any, res: any, next: any) => {
  if (!req.session.user?.restaurantId) {
    return res.status(403).json({ error: "This endpoint requires a restaurant account" });
  }
  next();
};

export async function registerRoutes(app: Express, sessionParser: any): Promise<Server> {
  // Rate limiter for emergency bootstrap reset endpoint
  const bootstrapResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 attempts per 15 minutes
    message: { error: "Too many reset attempts. Please try again in 15 minutes." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.log(`[BOOTSTRAP] Rate limit exceeded from IP: ${req.ip || req.socket.remoteAddress}`);
      res.status(429).json({ error: "Too many reset attempts. Please try again in 15 minutes." });
    },
  });

  // Logo upload configuration
  const logoStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const dir = 'public/uploads/logos';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req: any, file: any, cb: any) => {
      const restaurantId = req.session?.user?.restaurantId;
      const ext = path.extname(file.originalname);
      cb(null, `logo-${restaurantId}-${Date.now()}${ext}`);
    }
  });

  const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['.png', '.jpg', '.jpeg', '.svg'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PNG, JPG, and SVG allowed.'));
      }
    }
  });

  // Branches (Multi-tenant isolated)
  app.get("/api/branches", requireAuth, requireRestaurant, requirePermission('branches'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branches = await storage.getBranches(restaurantId);
    res.json(branches);
  });

  app.get("/api/branches/:id", requireAuth, requireRestaurant, requirePermission('branches'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branch = await storage.getBranch(req.params.id, restaurantId);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json(branch);
  });

  app.post("/api/branches", requireAuth, requireRestaurant, requirePermission('branches'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertBranchSchema.parse({ ...req.body, restaurantId });
      const branch = await storage.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.patch("/api/branches/:id", requireAuth, requireRestaurant, requirePermission('branches'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertBranchSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const branch = await storage.updateBranch(req.params.id, restaurantId, safeData);
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.delete("/api/branches/:id", requireAuth, requireRestaurant, requirePermission('branches'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteBranch(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.status(204).send();
  });

  // Inventory
  app.get("/api/inventory", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const items = await storage.getInventoryItems(restaurantId, branchId);
    res.json(items);
  });

  app.post("/api/inventory", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertInventoryItemSchema.parse({ ...req.body, restaurantId });
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inventory item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inventory data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.patch("/api/inventory/sort", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      
      // SECURITY: Verify all inventory IDs belong to this restaurant before updating
      // This prevents cross-tenant metadata leak via probing
      const itemIds = updates.map((u: any) => u.id);
      const allItems = await storage.getInventoryItems(restaurantId);
      const validIds = new Set(allItems.map(i => i.id));
      
      const invalidIds = itemIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some inventory IDs do not belong to your restaurant" });
      }
      
      await storage.updateInventoryItemsSortOrder(restaurantId, updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inventory/:id", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const item = await storage.getInventoryItem(req.params.id, restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  });

  app.patch("/api/inventory/:id", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertInventoryItemSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const item = await storage.updateInventoryItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, requireRestaurant, requirePermission('inventory'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteInventoryItem(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  });

  // Menu
  app.get("/api/menu", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const items = await storage.getMenuItems(restaurantId);
    res.json(items);
  });

  // Menu Stock (based on inventory and recipes) - MUST be before /:id route
  app.get("/api/menu/stock", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const stock = await storage.getMenuItemsStock(restaurantId, branchId);
    res.json(stock);
  });

  app.get("/api/menu/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const item = await storage.getMenuItem(req.params.id, restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(item);
  });

  app.post("/api/menu", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertMenuItemSchema.parse({ ...req.body, restaurantId });
      const item = await storage.createMenuItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Menu creation validation error:", error);
      res.status(400).json({ error: "Invalid menu data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/menu/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, updateMenuItemSchema);
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const item = await storage.updateMenuItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });

  app.delete("/api/menu/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteMenuItem(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.status(204).send();
  });

  // Add-ons
  app.get("/api/addons", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const menuItemId = req.query.menuItemId as string | undefined;
    const addons = await storage.getAddons(restaurantId, menuItemId);
    res.json(addons);
  });

  app.get("/api/addons/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const addon = await storage.getAddon(req.params.id, restaurantId);
    if (!addon) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.json(addon);
  });

  app.post("/api/addons", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertAddonSchema.parse({ ...req.body, restaurantId });
      const addon = await storage.createAddon(data);
      res.status(201).json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });

  app.patch("/api/addons/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertAddonSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const addon = await storage.updateAddon(req.params.id, restaurantId, safeData);
      if (!addon) {
        return res.status(404).json({ error: "Add-on not found" });
      }
      res.json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });

  app.delete("/api/addons/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteAddon(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/addons/sort-order", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      
      // SECURITY: Verify all addon IDs belong to this restaurant before updating
      // This prevents cross-tenant metadata leak via probing
      const addonIds = req.body.map((u: any) => u.id);
      const allAddons = await storage.getAddons(restaurantId);
      const validIds = new Set(allAddons.map(a => a.id));
      
      const invalidIds = addonIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some addon IDs do not belong to your restaurant" });
      }
      
      await storage.updateAddonsSortOrder(restaurantId, req.body);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Invalid sort order data" });
    }
  });

  // Customers
  app.get("/api/customers", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const customers = await storage.getCustomers(restaurantId);
    res.json(customers);
  });

  app.get("/api/customers/:id", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const customer = await storage.getCustomer(req.params.id, restaurantId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });

  app.post("/api/customers", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const upsert = req.query.upsert === 'true';
      
      // If upsert mode is enabled, use upsertCustomer method
      if (upsert) {
        const { name, phone } = req.body;
        if (!name || !phone) {
          return res.status(400).json({ error: "Name and phone are required for upsert" });
        }
        const customer = await storage.upsertCustomer(restaurantId, { name, phone });
        console.log(`[POS Customer Auto-Save] Upserted customer: ${customer.id}, name: ${customer.name}, phone: ${customer.phone}`);
        return res.status(200).json(customer);
      }
      
      // Normal create mode
      const data = insertCustomerSchema.parse({ ...req.body, restaurantId });
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      console.error("[Customer API] Error:", error);
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertCustomerSchema.partial());
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, ...safeData } = data;
      const customer = await storage.updateCustomer(req.params.id, restaurantId, safeData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteCustomer(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  });

  // Licenses (for both restaurant and factory accounts)
  app.get("/api/licenses", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const licenses = await storage.getLicenses(restaurantId);
      res.json(licenses);
    } catch (error) {
      console.error("Failed to get licenses:", error);
      res.status(500).json({ error: "Failed to get licenses" });
    }
  });

  app.get("/api/licenses/expiring", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;
      const licenses = await storage.getExpiringLicenses(restaurantId, daysAhead);
      res.json(licenses);
    } catch (error) {
      console.error("Failed to get expiring licenses:", error);
      res.status(500).json({ error: "Failed to get expiring licenses" });
    }
  });

  app.get("/api/licenses/:id", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const license = await storage.getLicense(req.params.id, restaurantId);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      console.error("Failed to get license:", error);
      res.status(500).json({ error: "Failed to get license" });
    }
  });

  app.post("/api/licenses", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      
      // Transform date strings to Date objects before validation
      const bodyWithDates = {
        ...req.body,
        restaurantId,
        createdBy: userId,
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate,
      };
      
      const data = insertLicenseSchema.parse(bodyWithDates);
      const license = await storage.createLicense(data);
      res.status(201).json(license);
    } catch (error) {
      console.error("Failed to create license:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid license data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid license data" });
    }
  });

  app.patch("/api/licenses/:id", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      
      // Add updatedBy to request body
      const processedBody = { ...req.body, updatedBy: userId };
      
      const data = sanitizePatchBody(processedBody, insertLicenseSchema.partial());
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, createdBy: __, issueDate, expiryDate, ...rest } = data;
      
      // Transform date strings to Date objects if present (after sanitization)
      const safeData: any = { ...rest };
      if (issueDate) {
        safeData.issueDate = new Date(issueDate);
      }
      if (expiryDate) {
        safeData.expiryDate = new Date(expiryDate);
      }
      
      const license = await storage.updateLicense(req.params.id, restaurantId, safeData);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      console.error("Failed to update license:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid license data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid license data" });
    }
  });

  app.delete("/api/licenses/:id", requireAuth, requireRestaurant, requirePermission('licenses'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const success = await storage.deleteLicense(req.params.id, restaurantId);
      if (!success) {
        return res.status(404).json({ error: "License not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete license:", error);
      res.status(500).json({ error: "Failed to delete license" });
    }
  });

  // Shop Salaries
  app.get("/api/shop/salaries", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const salaries = await storage.getSalaries(restaurantId, branchId, startDate, endDate);
    res.json(salaries);
  });

  app.get("/api/shop/salaries/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const salary = await storage.getSalary(req.params.id);
    if (!salary || salary.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.json(salary);
  });

  app.post("/api/shop/salaries", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      console.log("[SALARY] Request body:", JSON.stringify(req.body, null, 2));
      // Convert ISO date string to Date object
      const bodyWithDate = {
        ...req.body,
        restaurantId,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      };
      const data = insertSalarySchema.parse(bodyWithDate);
      console.log("[SALARY] Parsed data:", JSON.stringify(data, null, 2));
      const salary = await storage.createSalary(data);
      res.status(201).json(salary);
    } catch (error) {
      console.error("[SALARY] Validation error:", error);
      if (error instanceof Error) {
        console.error("[SALARY] Error message:", error.message);
      }
      res.status(400).json({ error: "Invalid salary data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/shop/salaries/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getSalary(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Salary not found" });
      }
      const data = sanitizePatchBody(req.body, insertSalarySchema.partial());
      const salary = await storage.updateSalary(req.params.id, data);
      res.json(salary);
    } catch (error) {
      res.status(400).json({ error: "Invalid salary data" });
    }
  });

  app.delete("/api/shop/salaries/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const existing = await storage.getSalary(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Salary not found" });
    }
    const success = await storage.deleteSalary(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.status(204).send();
  });

  // Shop Bills
  app.get("/api/shop/bills", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const bills = await storage.getShopBills(restaurantId, branchId, startDate, endDate);
    res.json(bills);
  });

  app.get("/api/shop/bills/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const bill = await storage.getShopBill(req.params.id);
    if (!bill || bill.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json(bill);
  });

  app.post("/api/shop/bills", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      // Convert ISO date string to Date object
      const bodyWithDate = {
        ...req.body,
        restaurantId,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      };
      const data = insertShopBillSchema.parse(bodyWithDate);
      const bill = await storage.createShopBill(data);
      res.status(201).json(bill);
    } catch (error) {
      console.error("[SHOP] Bill validation error:", error);
      res.status(400).json({ error: "Invalid bill data" });
    }
  });

  app.patch("/api/shop/bills/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getShopBill(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }
      const data = sanitizePatchBody(req.body, insertShopBillSchema.partial());
      const bill = await storage.updateShopBill(req.params.id, data);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Invalid bill data" });
    }
  });

  app.delete("/api/shop/bills/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const existing = await storage.getShopBill(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Bill not found" });
    }
    const success = await storage.deleteShopBill(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/shop/bills/:id/archive", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getShopBill(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }
      const { archived } = req.body;
      const bill = await storage.archiveShopBill(req.params.id, archived);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Failed to archive bill" });
    }
  });

  app.post("/api/shop/bills/generate-salaries", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { paymentMonth } = req.body;
      
      if (!paymentMonth) {
        return res.status(400).json({ error: "Payment month is required (format: YYYY-MM)" });
      }
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(paymentMonth)) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
      }
      
      const result = await storage.generateSalaryBills(restaurantId, paymentMonth);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to generate salary bills:", error);
      res.status(500).json({ error: "Failed to generate salary bills" });
    }
  });

  // Delivery Apps
  app.get("/api/delivery-apps", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const apps = await storage.getDeliveryApps(restaurantId);
    res.json(apps);
  });

  app.patch("/api/delivery-apps/sort", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      // Verify all apps belong to user's restaurant
      for (const update of updates) {
        const app = await storage.getDeliveryApp(update.id);
        if (!app || app.restaurantId !== restaurantId) {
          return res.status(403).json({ error: "Unauthorized" });
        }
      }
      await storage.updateDeliveryAppsSortOrder(updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/delivery-apps/:id", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const app = await storage.getDeliveryApp(req.params.id);
    if (!app || app.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.json(app);
  });

  app.post("/api/delivery-apps", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertDeliveryAppSchema.parse({ ...req.body, restaurantId });
      const deliveryApp = await storage.createDeliveryApp(data);
      res.status(201).json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/delivery-apps/:id", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getDeliveryApp(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Delivery app not found" });
      }
      const data = sanitizePatchBody(req.body, insertDeliveryAppSchema.partial());
      const deliveryApp = await storage.updateDeliveryApp(req.params.id, data);
      res.json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/delivery-apps/:id", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const existing = await storage.getDeliveryApp(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    const success = await storage.deleteDeliveryApp(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.status(204).send();
  });

  app.get("/api/delivery-apps/analytics/profitability", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const profitability = await storage.getDeliveryAppProfitability(restaurantId);
      res.json(profitability);
    } catch (error) {
      console.error("[DELIVERY_APP] Profitability error:", error);
      res.status(500).json({ error: "Failed to calculate profitability" });
    }
  });

  app.get("/api/analytics/sales-comparison", requireAuth, requireRestaurant, requirePermission('sales'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const comparison = await storage.getSalesComparison(restaurantId);
      res.json(comparison);
    } catch (error) {
      console.error("[ANALYTICS] Sales comparison error:", error);
      res.status(500).json({ error: "Failed to get sales comparison data" });
    }
  });

  // Investors
  app.get("/api/investors", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investors = await storage.getInvestors(restaurantId);
      res.json(investors);
    } catch (error) {
      console.error("[INVESTORS] Get investors error:", error);
      res.status(500).json({ error: "Failed to get investors" });
    }
  });

  app.get("/api/investors/:id", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Get investor error:", error);
      res.status(500).json({ error: "Failed to get investor" });
    }
  });

  app.post("/api/investors", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertInvestorSchema.parse({ ...req.body, restaurantId });
      const investor = await storage.createInvestor(data);
      res.status(201).json(investor);
    } catch (error) {
      console.error("[INVESTORS] Create investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/investors/:id", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getInvestor(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const data = sanitizePatchBody(req.body, updateInvestorSchema);
      const investor = await storage.updateInvestor(req.params.id, data);
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Update investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/investors/:id", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getInvestor(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const success = await storage.deleteInvestor(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("[INVESTORS] Delete investor error:", error);
      res.status(500).json({ error: "Failed to delete investor" });
    }
  });

  // Recipes (MULTI-TENANT: require auth + restaurantId filtering)
  app.get("/api/recipes", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const recipes = await storage.getRecipes(restaurantId);
    res.json(recipes);
  });

  app.get("/api/recipes/:id", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const recipe = await storage.getRecipe(req.params.id, restaurantId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  });

  app.post("/api/recipes", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertRecipeSchema.parse({ ...req.body, restaurantId });
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.patch("/api/recipes/:id", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertRecipeSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const recipe = await storage.updateRecipe(req.params.id, restaurantId, safeData);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.patch("/api/recipes/sort", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      
      // SECURITY: Verify all recipe IDs belong to this restaurant before updating
      // This prevents cross-tenant metadata leak via probing
      const recipeIds = updates.map((u: any) => u.id);
      const allRecipes = await storage.getRecipes(restaurantId);
      const validIds = new Set(allRecipes.map(r => r.id));
      
      const invalidIds = recipeIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some recipe IDs do not belong to your restaurant" });
      }
      
      await storage.updateRecipesSortOrder(restaurantId, updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/recipes/:id", requireAuth, requireRestaurant, requirePermission('recipes'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteRecipe(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(204).send();
  });

  // Orders (MULTI-TENANT: require auth + restaurantId filtering)
  // IT accounts use a different endpoint below for cross-restaurant access
  app.get("/api/orders", requireAuth, requireRestaurant, requirePermission('orders'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const status = req.query.status as string | undefined;
    const orders = await storage.getOrders({ restaurantId, branchId, status });
    res.json(orders);
  });

  // IT Account endpoint for viewing all orders across restaurants
  app.get("/api/it/orders", requireAuth, requireITAccount, async (req, res) => {
    const restaurantId = req.query.restaurantId as string | undefined;
    const branchId = req.query.branchId as string | undefined;
    const status = req.query.status as string | undefined;
    
    // IT accounts can view orders from all restaurants or filter by specific restaurant
    // If no restaurantId is specified, pass empty string to get all orders
    const orders = await storage.getOrders({ restaurantId: restaurantId || '', branchId, status });
    res.json(orders);
  });
  
  // IT Account endpoint for updating order status across restaurants
  app.patch("/api/it/orders/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { status } = req.body;
      
      // Get the order first to find its restaurantId
      // Pass empty string to get all orders across all restaurants
      const allOrders = await storage.getOrders({ restaurantId: '' });
      const order = allOrders.find(o => o.id === req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrder(req.params.id, order.restaurantId, { status });
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Broadcast status update notification
      const branch = order.branchId ? await storage.getBranch(order.branchId, order.restaurantId) : null;
      broadcastNotification({
        type: 'order:statusUpdated',
        restaurantId: order.restaurantId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: updatedOrder.status,
        branchId: order.branchId ?? undefined,
        branchName: branch?.name,
      });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/orders/:id", requireAuth, requireRestaurant, requirePermission('orders'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const order = await storage.getOrder(req.params.id, restaurantId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  app.post("/api/orders", requireAuth, requireRestaurant, requirePermission('orders'), async (req, res) => {
    try {
      // Inject restaurantId and createdBy from session
      const restaurantId = req.session.user!.restaurantId!;
      const createdBy = req.session.user!.id;
      const data = insertOrderSchema.parse({ ...req.body, restaurantId, createdBy });
      
      const { orderProcessingService } = await import("./orderProcessingService");
      const orderItems = Array.isArray(data.items) ? data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        addons: item.addons
      })) : [];
      
      const prepResult = await orderProcessingService.prepareOrderStock(
        orderItems,
        data.branchId || ""
      );
      
      if (!prepResult.isValid) {
        return res.status(409).json({
          error: "Insufficient inventory",
          message: prepResult.message,
          insufficientItems: prepResult.insufficientItems,
        });
      }
      
      const order = await storage.createOrder(data);
      
      try {
        if (prepResult.stockRequirements) {
          await orderProcessingService.finalizeOrderWithInventory(
            data,
            prepResult.stockRequirements,
            order.id,
            data.branchId || ""
          );
        }
        
        // Broadcast order created notification
        const branch = data.branchId ? await storage.getBranch(data.branchId, data.restaurantId) : null;
        const itemsSummary = orderItems.length > 0 
          ? orderItems.slice(0, 3).map(item => item.name).join(', ') + (orderItems.length > 3 ? '...' : '')
          : 'No items';
        
        broadcastNotification({
          type: 'order:created',
          restaurantId: data.restaurantId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          branchId: data.branchId ?? undefined,
          branchName: branch?.name,
          itemsSummary,
        });
        
        res.status(201).json(order);
      } catch (deductionError) {
        console.error("Inventory deduction failed, attempting to delete order:", order.id);
        try {
          await storage.deleteOrder(order.id, order.restaurantId);
        } catch (deleteError) {
          console.error("Failed to delete order after inventory deduction failure:", deleteError);
        }
        throw deductionError;
      }
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: "Failed to create order", details: error.message });
      } else {
        res.status(400).json({ error: "Failed to create order" });
      }
    }
  });

  app.patch("/api/orders/:id", requireAuth, requireRestaurant, requirePermission('orders'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertOrderSchema.partial());
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, ...safeData } = data;
      const order = await storage.updateOrder(req.params.id, restaurantId, safeData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Broadcast order status update notification
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = items.length > 0 
        ? items.slice(0, 3).map((item: any) => item.name).join(', ') + (items.length > 3 ? '...' : '')
        : 'No items';
      
      broadcastNotification({
        type: 'order:statusUpdated',
        restaurantId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        branchId: order.branchId ?? undefined,
        branchName: branch?.name,
        itemsSummary,
      });
      
      res.json(order);
    } catch (error) {
      console.error("[ORDER] Update error:", error);
      res.status(400).json({ 
        error: "Invalid order data", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Transactions (Sales) (MULTI-TENANT: require auth + restaurantId filtering)
  app.get("/api/transactions", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = (startDate || endDate) ? { start: startDate, end: endDate } : undefined;
    const transactions = await storage.getTransactions({ restaurantId, branchId, dateRange });
    res.json(transactions);
  });

  app.get("/api/transactions/:id", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const transaction = await storage.getTransaction(req.params.id, restaurantId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.post("/api/transactions", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      // Validate request body without restaurantId (will be added from session)
      const bodySchema = insertTransactionSchema.omit({ restaurantId: true });
      const data = bodySchema.parse(req.body);
      // Add restaurantId from session for security
      const transaction = await storage.createTransaction({ ...data, restaurantId });
      res.status(201).json(transaction);
    } catch (error) {
      console.error("[Transactions] Creation error:", error);
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/dashboard", requireAuth, requireRestaurant, requirePermission('dashboard'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const orders = await storage.getOrders({ restaurantId, branchId });
    const transactions = await storage.getTransactions({ restaurantId, branchId });
    const inventory = await storage.getInventoryItems(restaurantId, branchId);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    // Calculate sales for different periods
    const todaysSales = transactions
      .filter(t => new Date(t.createdAt) >= today)
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const yesterdaysSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= yesterday && date < today;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const thisWeekSales = transactions
      .filter(t => new Date(t.createdAt) >= weekAgo)
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const lastWeekSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= twoWeeksAgo && date < weekAgo;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const thisMonthSales = transactions
      .filter(t => new Date(t.createdAt) >= monthStart)
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const lastMonthSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const thisYearSales = transactions
      .filter(t => new Date(t.createdAt) >= yearStart)
      .reduce((sum, t) => sum + parseFloat(t.total), 0);
    
    const lastYearSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= lastYearStart && date <= lastYearEnd;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      // For new accounts with no previous data, return 0 (neutral state)
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const activeOrders = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").length;
    const lowStockItems = inventory.filter(i => i.status === "Low Stock").length;

    // Calculate peak hours analysis
    const salesByHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0;
    }

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const hour = date.getHours();
      salesByHour[hour] += parseFloat(t.total);
    });

    const peakHoursData = Object.entries(salesByHour).map(([hour, sales]) => ({
      hour: parseInt(hour),
      sales: parseFloat(sales.toFixed(2)),
    })).sort((a, b) => a.hour - b.hour);

    // Find peak hour (hour with highest sales)
    const peakHour = peakHoursData.reduce((max, current) => 
      current.sales > max.sales ? current : max, 
      peakHoursData[0]
    );

    res.json({
      todaysSales: todaysSales.toFixed(2),
      activeOrders,
      lowStockItems,
      recentOrders: orders.slice(0, 4),
      performance: {
        dod: {
          current: todaysSales,
          previous: yesterdaysSales,
          change: calculateChange(todaysSales, yesterdaysSales),
        },
        wow: {
          current: thisWeekSales,
          previous: lastWeekSales,
          change: calculateChange(thisWeekSales, lastWeekSales),
        },
        mom: {
          current: thisMonthSales,
          previous: lastMonthSales,
          change: calculateChange(thisMonthSales, lastMonthSales),
        },
        yoy: {
          current: thisYearSales,
          previous: lastYearSales,
          change: calculateChange(thisYearSales, lastYearSales),
        },
      },
      peakHours: {
        hourlyData: peakHoursData,
        peakHour: peakHour.hour,
        peakSales: peakHour.sales,
      },
    });
  });

  app.get("/api/analytics/peak-hours/:hour", requireAuth, requireRestaurant, requirePermission('sales'), async (req, res) => {
    const hour = parseInt(req.params.hour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ error: "Invalid hour parameter (must be 0-23)" });
    }

    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const transactions = await storage.getTransactions({ restaurantId, branchId });
    const orders = await storage.getOrders({ restaurantId, branchId });

    const transactionsInHour = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getHours() === hour;
    });

    const orderMap = new Map(orders.map(o => [o.id, o]));

    const results = transactionsInHour.map(transaction => {
      const order = transaction.orderId ? orderMap.get(transaction.orderId) : null;
      return {
        transactionId: transaction.transactionId,
        customerName: order?.customerName || null,
        customerPhone: order?.customerPhone || "",
        total: parseFloat(transaction.total),
        itemCount: transaction.itemCount,
        paymentMethod: transaction.paymentMethod,
        orderType: order?.orderType || "",
        createdAt: transaction.createdAt,
      };
    });

    res.json(results);
  });

  app.get("/api/analytics/sales", requireAuth, requireRestaurant, requirePermission('sales'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const transactions = await storage.getTransactions({ restaurantId, branchId });

    const salesByDay: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const dayName = days[date.getDay()];
      salesByDay[dayName] = (salesByDay[dayName] || 0) + parseFloat(t.total);
    });

    const chartData = days.map(day => ({
      date: day,
      sales: Math.round(salesByDay[day] || 0),
    }));

    res.json(chartData);
  });

  // Settings (MULTI-TENANT: require auth + restaurantId filtering)
  app.get("/api/settings", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const settings = await storage.getSettings(restaurantId);
    const settingsWithKeys = {
      ...settings,
      moyasarPublishableKey: process.env.MOYASAR_PUBLISHABLE_KEY || null,
    };
    res.json(settingsWithKeys);
  });

  app.patch("/api/settings", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertSettingsSchema.partial().parse(req.body);
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const settings = await storage.updateSettings(restaurantId, safeData);
      
      // Broadcast settings update to all connected clients in this restaurant
      broadcastNotification({
        type: 'settings:updated',
        restaurantId,
      });
      
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // Logo upload endpoint
  app.post("/api/settings/logo", requireAuth, requireRestaurant, uploadLogo.single('logo'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get existing settings to delete old logo if exists
      const existingSettings = await storage.getSettings(restaurantId);
      if (existingSettings?.logoPath) {
        // logoPath is stored as "/uploads/logos/..." so we strip the leading slash and add "public" prefix
        const relativePath = existingSettings.logoPath.replace(/^\/+/, '');
        const oldLogoPath = path.join(process.cwd(), 'public', relativePath);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Store relative path in database
      const logoPath = `/uploads/logos/${req.file.filename}`;
      await storage.updateSettingsLogoPath(restaurantId, logoPath);

      res.json({ success: true, logoPath });
    } catch (error: any) {
      // Clean up uploaded file if database update fails
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(400).json({ error: error.message || "Failed to upload logo" });
    }
  });

  // Logo delete endpoint
  app.delete("/api/settings/logo", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Get existing settings to find logo path
      const existingSettings = await storage.getSettings(restaurantId);
      if (!existingSettings?.logoPath) {
        return res.status(404).json({ error: "No logo found" });
      }

      // Delete physical file - strip leading slash from stored path
      const relativePath = existingSettings.logoPath.replace(/^\/+/, '');
      const logoPath = path.join(process.cwd(), 'public', relativePath);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      // Update database to remove logo path
      await storage.updateSettingsLogoPath(restaurantId, null);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to remove logo" });
    }
  });

  // Procurement (MULTI-TENANT: require auth + restaurantId filtering)
  app.get("/api/procurement", requireAuth, requireRestaurant, requirePermission('procurement'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const { type, status, branchId } = req.query;
    const procurements = await storage.getProcurements({
      restaurantId,
      type: type as string | undefined,
      status: status as string | undefined,
      branchId: branchId as string | undefined
    });
    res.json(procurements);
  });

  app.get("/api/procurement/:id", requireAuth, requireRestaurant, requirePermission('procurement'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const procurement = await storage.getProcurement(req.params.id, restaurantId);
    if (!procurement) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.json(procurement);
  });

  app.post("/api/procurement", requireAuth, requireRestaurant, requirePermission('procurement'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertProcurementSchema.omit({ restaurantId: true }).parse(req.body);
      const procurement = await storage.createProcurement({ ...data, restaurantId });
      res.status(201).json(procurement);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.patch("/api/procurement/:id", requireAuth, requireRestaurant, requirePermission('procurement'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertProcurementSchema.partial());
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, ...safeData } = data;
      const procurement = await storage.updateProcurement(req.params.id, restaurantId, safeData);
      if (!procurement) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      res.json(procurement);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.delete("/api/procurement/:id", requireAuth, requireRestaurant, requirePermission('procurement'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteProcurement(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.status(204).send();
  });

  // POS - Generate Invoice (redirects to main invoice creation endpoint)
  app.post("/api/pos/generate-invoice", requireAuth, requireRestaurant, requirePermission('pos'), async (req, res) => {
    // This endpoint now redirects to the main invoice creation endpoint
    // which properly saves the invoice and generates QR code with URL
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
      }

      const order = await storage.getOrder(orderId, restaurantId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const settings = await storage.getSettings(restaurantId);
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;

      const invoiceNumber = `INV-${order.orderNumber}`;

      // Transform order items to invoice items format with VAT breakdown
      const invoiceItems = order.items.map(item => {
        const totalPrice = item.quantity * item.price;
        const basePrice = totalPrice / 1.15;
        const vatAmount = totalPrice - basePrice;
        return {
          name: item.name,
          quantity: item.quantity,
          basePrice: parseFloat(basePrice.toFixed(2)),
          vatAmount: parseFloat(vatAmount.toFixed(2)),
          total: parseFloat(totalPrice.toFixed(2)),
        };
      });

      // Create invoice record first to get the ID
      const invoiceData = {
        restaurantId: req.session.user!.restaurantId!,
        invoiceNumber,
        orderId: order.id,
        branchId: order.branchId,
        customerName: order.customerName || "Walk-in Customer",
        items: invoiceItems,
        subtotal: order.subtotal,
        vatAmount: order.tax,
        total: order.total,
        qrCode: "",
        pdfPath: "",
      };

      const createdInvoice = await storage.createInvoice(invoiceData);
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Generate PDF with invoice ID for QR code
      const pdfData = {
        order,
        companyName: settings?.restaurantName || "Restaurant Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location, Riyadh",
        companyEmail: settings?.email || "info@restaurant.sa",
        companyPhone: settings?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: new Date(),
        invoiceId: createdInvoice.id,
        baseUrl,
        logoPath: settings?.logoPath || undefined,
      };

      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);

      // Ensure invoices directory exists in public folder
      const invoicesDir = path.join(process.cwd(), "public", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Save PDF to filesystem
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Update invoice record with QR code and PDF path
      await storage.updateInvoice(createdInvoice.id, restaurantId, {
        qrCode,
        pdfPath: `/invoices/${pdfFilename}`,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Public endpoint for user signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, name, email, commercialRegistration, restaurantName, nationalId, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount } = req.body;
      
      console.log("[SIGNUP] Received signup request for username:", username);
      console.log("[SIGNUP] Request body:", { username, name, email, restaurantName, nationalId, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount });
      
      if (!username || !password || !name || !email || !commercialRegistration || !restaurantName || !nationalId || !taxNumber || !businessType || !restaurantType || !subscriptionPlan || !branchesCount) {
        console.log("[SIGNUP] Missing required fields");
        return res.status(400).json({ error: "All fields are required including Restaurant Name, National ID, Tax Number, Business Type, Restaurant Type, Commercial Registration, subscription plan, and number of branches" });
      }

      // Validate subscription plan based on business type
      // Factory businesses can only have monthly or yearly plans (no weekly)
      if (businessType === 'factory' && subscriptionPlan === 'weekly') {
        return res.status(400).json({ error: "Factory businesses can only have monthly or yearly subscription plans" });
      }

      // Validate branches count
      const branches = parseInt(branchesCount);
      if (isNaN(branches) || branches < 1) {
        return res.status(400).json({ error: "Number of branches must be at least 1" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Step 1: Create restaurant record first (multi-tenancy isolation)
      // Use Zod schema validation for runtime type safety and normalization
      const restaurantData = insertRestaurantSchema.parse({
        name: restaurantName,
        nationalId,
        taxNumber,
        commercialRegistration,
        businessType, // Will be validated by z.enum(["restaurant", "factory"])
        type: restaurantType, // Specific subtype (e.g., "Cloud Kitchen", "Manufacturing")
        subscriptionPlan,
        branchesCount: branches,
        subscriptionStatus: "inactive" as const, // Will be activated after payment
      });

      const restaurant = await storage.createRestaurant(restaurantData);

      // Step 2: Create admin user linked to restaurant
      const userData = {
        restaurantId: restaurant.id, // Link to restaurant for multi-tenant isolation
        username,
        password, // Will be hashed in storage
        fullName: name,
        email,
        role: "admin" as const,
        active: true,
        permissions: ADMIN_PERMISSIONS,
      };

      const user = await storage.createUser(userData);

      // Generate subscription invoice
      try {
        // Calculate subscription prices using shared pricing module
        const pricing = getPlanPricing(subscriptionPlan as SubscriptionPlan, branches, businessType as BusinessType);
        
        // For invoice line-item breakdown, calculate base plan and additional branches separately
        const basePlanPricing = getPlanPricing(subscriptionPlan as SubscriptionPlan, 1, businessType as BusinessType);
        const basePlanPrice = basePlanPricing.netAmount; // Net price for base plan (1 branch)
        
        const additionalBranchesCount = Math.max(0, branches - 1);
        const additionalBranchesPrice = additionalBranchesCount > 0 
          ? pricing.netAmount - basePlanPrice // Total net minus base = additional branches net
          : 0;
        
        // Use total amounts from pricing breakdown
        const subtotal = pricing.netAmount;      // Total NET before VAT
        const vatAmount = pricing.vatAmount;     // 15% VAT on subtotal
        const total = pricing.grossAmount;       // Total including VAT

        // Generate serial number
        const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();

        // Generate subscription invoice PDF
        const pdfBuffer = await generateSubscriptionInvoice({
          serialNumber,
          userFullName: user.fullName,
          userEmail: user.email ?? "",
          restaurantName: restaurant.name,
          nationalId: restaurant.nationalId,
          taxNumber: restaurant.taxNumber,
          commercialRegistration: restaurant.commercialRegistration,
          subscriptionPlan: restaurant.subscriptionPlan,
          branchesCount: restaurant.branchesCount,
          basePlanPrice,
          additionalBranchesPrice,
          subtotal,
          vatAmount,
          total,
          invoiceDate: new Date(),
        });

        // Save PDF to disk
        const invoicesDir = path.join(process.cwd(), 'public', 'subscription-invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const pdfFilename = `subscription-${serialNumber}.pdf`;
        const pdfPath = path.join(invoicesDir, pdfFilename);
        fs.writeFileSync(pdfPath, pdfBuffer);

        // Generate QR code for ZATCA compliance
        const QRCode = await import('qrcode');
        const qrData = `Invoice: ${serialNumber}\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal: ${total.toFixed(2)} SAR\nVAT: ${vatAmount.toFixed(2)} SAR`;
        const qrCode = await QRCode.toDataURL(qrData);

        // Save invoice to database
        await storage.createSubscriptionInvoice({
          userId: user.id,
          serialNumber,
          subscriptionPlan: restaurant.subscriptionPlan ?? "",
          branchesCount: restaurant.branchesCount,
          basePlanPrice: basePlanPrice.toString(),
          additionalBranchesPrice: additionalBranchesPrice.toString(),
          subtotal: subtotal.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
          pdfPath: `/subscription-invoices/${pdfFilename}`,
          qrCode,
        });

        console.log(`[SIGNUP] Subscription invoice generated: ${serialNumber}`);
        
        // SECURITY: Return invoice filename (not path) for authenticated download after login
        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName,
          role: user.role,
          restaurantId: user.restaurantId,
          invoiceFilename: pdfFilename  // Frontend will download via authenticated endpoint after auto-login
        });
      } catch (invoiceError) {
        console.error("[SIGNUP] Failed to generate subscription invoice:", invoiceError);
        // Don't fail signup if invoice generation fails - return without invoice path
        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName,
          role: user.role,
          restaurantId: user.restaurantId
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // IT Account Signup with Secret Key Validation
  app.post("/api/auth/it-signup", async (req, res) => {
    try {
      const { username, password, fullName, email, secretKey } = req.body;
      
      console.log("[IT-SIGNUP] Received IT signup request for username:", username);
      
      // Validate required fields
      if (!username || !password || !fullName || !email || !secretKey) {
        console.log("[IT-SIGNUP] Missing required fields");
        return res.status(400).json({ error: "All fields are required including secret key" });
      }
      
      // Validate secret key
      const VALID_SECRET_KEY = "KinzhalLTDCo@1990";
      if (secretKey !== VALID_SECRET_KEY) {
        console.log("[IT-SIGNUP] Invalid secret key provided");
        return res.status(403).json({ error: "Invalid secret key" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("[IT-SIGNUP] Username already exists");
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create IT account with full permissions
      const IT_PERMISSIONS = {
        pos: true,
        menu: true,
        bills: true,
        sales: true,
        users: true,
        orders: true,
        kitchen: true,
        recipes: true,
        reports: true,
        branches: true,
        licenses: true,
        settings: true,
        customers: true,
        dashboard: true,
        inventory: true,
        procurement: true,
        deliveryApps: true,
        workingHours: true,
      };
      
      // Create the IT user (no restaurantId for IT accounts)
      // Note: storage.createUser will hash the password internally
      const userData = {
        restaurantId: null, // IT accounts don't belong to any restaurant
        username,
        password, // Pass plain password - storage.createUser will hash it
        fullName,
        email,
        role: "admin" as const,
        active: true,
        permissions: IT_PERMISSIONS,
        devicePreference: "laptop" as const,
      };
      
      const user = await storage.createUser(userData);
      
      console.log("[IT-SIGNUP] IT account created successfully for username:", username);
      
      res.status(201).json({ 
        success: true,
        message: "IT account created successfully",
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error("[IT-SIGNUP] Error creating IT account:", error);
      res.status(500).json({ error: "Failed to create IT account" });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, accountType } = req.body;
      
      console.log("[AUTH] Login attempt for username:", username, "accountType:", accountType);
      
      if (!username || !password) {
        console.log("[AUTH] Missing username or password");
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      
      console.log("[AUTH] User found:", user ? `Yes (id: ${user.id}, active: ${user.active}, restaurantId: ${user.restaurantId})` : "No");
      
      if (!user) {
        console.log("[AUTH] User not found in database");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!user.active) {
        console.log("[AUTH] User is inactive");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("[AUTH] Comparing password hash");
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("[AUTH] Password match:", passwordMatch);
      
      if (!passwordMatch) {
        console.log("[AUTH] Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Auto-detect account type based on restaurantId (null = IT account)
      const validAccountType: "client" | "it" = user.restaurantId === null ? "it" : "client";
      console.log("[AUTH] Auto-detected accountType:", validAccountType, "(based on restaurantId:", user.restaurantId, ")");

      // Store user in session with restaurantId for multi-tenant isolation
      if (req.session) {
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.accountType = validAccountType; // Store account type in session
        req.session.user = {
          id: user.id,
          username: user.username,
          restaurantId: user.restaurantId || undefined, // CRITICAL: Keep null/undefined for IT accounts, not empty string
          role: user.role,
          email: user.email || '',
          fullName: user.fullName,
          branchId: user.branchId || '',
          isMainAccount: user.role === 'admin',
          devicePreference: (user.devicePreference as 'laptop' | 'ipad' | 'iphone') || 'laptop',
          permissions: user.permissions as PermissionSet
        };
        console.log("[AUTH] Session created for user:", user.id, "restaurant:", user.restaurantId, "accountType:", validAccountType);
      }

      // Track login activity for IT Dashboard monitoring
      await storage.updateUserLogin(user.id);

      // Fetch restaurant data for client accounts only
      // IT accounts don't have restaurantId and don't need restaurant data
      let restaurant = null;
      if (validAccountType === 'client' && user.restaurantId) {
        restaurant = await storage.getRestaurant(user.restaurantId);
        
        if (!restaurant) {
          return res.status(500).json({ error: "Restaurant not found" });
        }
      }

      // Return user without password and include restaurant data and accountType
      const { password: _, ...userWithoutPassword } = user;
      console.log("[AUTH] Login successful");
      res.json({ user: userWithoutPassword, restaurant, accountType: validAccountType });
    } catch (error) {
      console.error("[AUTH] Login error - Full details:", error);
      console.error("[AUTH] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[AUTH] Error message:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Forgot password route
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Don't reveal if user exists or not for security
      if (!user) {
        return res.json({ message: "If an account with that email exists, we've sent a password reset link" });
      }

      // Generate reset token (crypto random string)
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await storage.setPasswordResetToken(user.id, resetToken, resetExpiry);

      // Send password reset email
      const mailer = new PasswordResetMailer();
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const emailResult = await mailer.sendPasswordResetEmail(email, resetToken, baseUrl);

      // Log for development (fallback if email fails)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
        console.log(`[DEV] Reset link: ${baseUrl}/reset-password?token=${resetToken}`);
        if (!emailResult.success) {
          console.log(`[DEV] Email failed: ${emailResult.error} - Token logged above for testing`);
        }
      }

      // Always return success message (don't reveal if email was sent)
      res.json({ message: "If an account with that email exists, we've sent a password reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find user by reset token and check if not expired
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Update password
      await storage.updatePassword(user.id, password);

      // Clear reset token
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Bootstrap emergency admin reset (one-time use, requires secret token)
  app.post("/api/auth/bootstrap-reset", bootstrapResetLimiter, async (req, res) => {
    try {
      const { token, username, password } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Validate inputs
      if (!token || !username || !password) {
        console.log(`[BOOTSTRAP] Invalid request - missing fields from IP: ${clientIp}`);
        return res.status(400).json({ error: "Token, username, and password are required" });
      }

      if (password.length < 6) {
        console.log(`[BOOTSTRAP] Password too short from IP: ${clientIp}`);
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Check if token is valid and not consumed
      const validToken = await storage.getValidBootstrapToken(token);
      
      if (!validToken) {
        console.log(`[BOOTSTRAP] Invalid or consumed token attempted from IP: ${clientIp}`);
        return res.status(401).json({ error: "Invalid or already used reset token" });
      }

      // Find admin user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`[BOOTSTRAP] User not found: ${username} from IP: ${clientIp}`);
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== 'admin') {
        console.log(`[BOOTSTRAP] Attempted reset of non-admin account: ${username} from IP: ${clientIp}`);
        return res.status(403).json({ error: "Can only reset admin accounts via bootstrap" });
      }

      // Reset the password
      await storage.updatePassword(user.id, password);

      // Mark token as consumed
      await storage.consumeBootstrapToken(validToken.id, username, clientIp);

      console.log(`[BOOTSTRAP] Successfully reset password for admin: ${username} from IP: ${clientIp}`);
      
      res.json({ 
        message: "Admin password reset successful. You can now log in with your new password.",
        username: username 
      });
    } catch (error) {
      console.error("[BOOTSTRAP] Reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const accountType = req.session.accountType || "client";
    const restaurantId = req.session.user!.restaurantId!;
    
    // For IT accounts, fetch user without restaurantId
    // For client accounts, fetch user with restaurantId for multi-tenant isolation
    const user = restaurantId 
      ? await storage.getUser(req.session.userId!, restaurantId)
      : await storage.getUserById(req.session.userId!);
    
    if (!user || !user.active) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch restaurant data for client accounts only
    // IT accounts don't have restaurantId and don't need restaurant data
    let restaurant = null;
    if (accountType === 'client' && restaurantId) {
      restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(500).json({ error: "Restaurant not found" });
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, restaurant, accountType });
  });

  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType || "client";
      const restaurantId = req.session.user!.restaurantId!;
      const { devicePreference } = req.body;
      
      // Validate device preference
      if (devicePreference && !['laptop', 'ipad', 'iphone'].includes(devicePreference)) {
        return res.status(400).json({ error: "Invalid device preference. Must be 'laptop', 'ipad', or 'iphone'" });
      }

      // For IT accounts, update user without restaurantId
      // For client accounts, update user with restaurantId for multi-tenant isolation
      const updatedUser = restaurantId 
        ? await storage.updateUser(req.session.userId!, restaurantId, { devicePreference })
        : await storage.updateUserById(req.session.userId!, { devicePreference });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Fetch restaurant data for client accounts only
      // IT accounts don't have restaurantId and don't need restaurant data
      let restaurant = null;
      if (accountType === 'client' && restaurantId) {
        restaurant = await storage.getRestaurant(restaurantId);
        
        if (!restaurant) {
          return res.status(500).json({ error: "Restaurant not found" });
        }
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, restaurant });
    } catch (error) {
      console.error("Update user preference error:", error);
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  // Users Management (Admin only)
  app.get("/api/users", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // SECURITY: Check admin role from session (no redundant DB query)
    if (req.session.user!.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await storage.getUsers(restaurantId);
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.get("/api/users/:id", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // SECURITY: Check admin role from session (no redundant DB query)
    if (req.session.user!.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const user = await storage.getUser(req.params.id, restaurantId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { monthlySalary, ...userData } = req.body;
      
      // SECURITY: Two-phase creation flow with setupComplete flag
      let restaurantId: string;
      let isSetupMode = false;
      
      if (req.session?.userId && req.session?.user) {
        // Authenticated request - must be admin creating employee
        if (req.session.user.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }
        restaurantId = req.session.user.restaurantId!;
      } else {
        // Unauthenticated request - only allowed during initial setup
        if (!userData.restaurantId) {
          return res.status(400).json({ error: "Restaurant ID required for setup" });
        }
        
        // Check if restaurant setup is already complete
        const restaurant = await storage.getRestaurant(userData.restaurantId);
        if (!restaurant) {
          return res.status(400).json({ error: "Invalid restaurant ID" });
        }
        
        if (restaurant.setupComplete) {
          return res.status(403).json({ error: "Restaurant setup already complete. Please log in to create users." });
        }
        
        restaurantId = userData.restaurantId;
        isSetupMode = true;
      }
      
      const data = insertUserSchema.parse({ ...userData, restaurantId });
      
      // Validate monthlySalary if provided
      if (monthlySalary) {
        const salaryValue = parseFloat(monthlySalary);
        if (isNaN(salaryValue) || salaryValue <= 0) {
          return res.status(400).json({ error: "Invalid monthly salary amount" });
        }
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // storage.createUser handles password hashing
      const user = await storage.createUser(data);
      
      // Auto-create monthly salary entry if monthlySalary is provided
      if (monthlySalary && parseFloat(monthlySalary) > 0) {
        try {
          const today = new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          
          await storage.createSalary({
            restaurantId: restaurantId,
            employeeName: user.fullName,
            position: user.role,
            amount: monthlySalary,
            paymentDate: nextMonth,
            status: "pending",
            branchId: user.branchId || undefined,
          });
        } catch (salaryError) {
          console.error("Failed to create salary entry:", salaryError);
          // Delete the user if salary creation fails to maintain consistency
          await storage.deleteUser(user.id, restaurantId);
          return res.status(400).json({ error: "Failed to create employee salary entry" });
        }
      }
      
      // SECURITY: Mark setup as complete ONLY after all side-effects succeed
      // This prevents onboarding lockout if salary creation fails
      if (isSetupMode && user.role === 'admin') {
        // Create default chat channels (#general, #kitchen, #front-desk, #it-support)
        await storage.createDefaultChannels(restaurantId, user.id);
        console.log(`[SETUP] Created default chat channels for restaurant ${restaurantId}`);
        
        await storage.updateRestaurant(restaurantId, { setupComplete: true });
        console.log(`[SETUP] Restaurant ${restaurantId} setup completed with admin user ${user.username}`);
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // SECURITY: Check admin role from session (no redundant DB query)
      if (req.session.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { password, restaurantId: _, role: __, ...updateData } = req.body;
      
      // SECURITY: Strip restaurantId and role to prevent cross-tenant reassignment and privilege escalation
      
      console.log("[USER UPDATE] Updating user:", req.params.id);
      console.log("[USER UPDATE] Update data received:", JSON.stringify(updateData, null, 2));
      
      // If password is being updated, hash it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      const user = await storage.updateUser(req.params.id, restaurantId, updateData);
      if (!user) {
        console.log("[USER UPDATE] User not found after update");
        return res.status(404).json({ error: "User not found" });
      }

      console.log("[USER UPDATE] User updated successfully. New permissions:", JSON.stringify(user.permissions, null, 2));
      
      const { password: _p, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // SECURITY: Check admin role from session (no redundant DB query)
    if (req.session.user!.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Prevent deleting own account
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const success = await storage.deleteUser(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  });

  // User Profile Management
  app.get("/api/profile", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    try {
      const user = await storage.getUserProfile(req.session.userId!, restaurantId);
      if (!user || !user.active) {
        return res.status(404).json({ error: "User not found" });
      }

      const restaurant = await storage.getRestaurant(user.restaurantId!);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = user;
      res.json({ user: userProfile, restaurant });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.put("/api/profile", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    try {
      const { email, phone } = req.body;
      const profileUpdate: { email?: string; phone?: string } = {};

      if (email !== undefined) profileUpdate.email = email;
      if (phone !== undefined) profileUpdate.phone = phone;

      const updatedUser = await storage.updateUserProfile(req.session.user!.id, restaurantId, profileUpdate);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Subscription Management
  app.post("/api/subscription/cancel", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    try {
      const user = await storage.getUser(req.session.user!.id, restaurantId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const restaurant = await storage.getRestaurant(user.restaurantId!);
      if (!restaurant || restaurant.subscriptionStatus !== 'active') {
        return res.status(400).json({ error: "No active subscription to cancel" });
      }

      const updatedUser = await storage.cancelSubscription(req.session.user!.id, restaurantId);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to cancel subscription" });
      }

      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Financial Analytics
  app.get("/api/analytics/financial", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const { period, year } = req.query;
    
    const transactions = await storage.getTransactions({ restaurantId });
    const invoices = await storage.getInvoices({ restaurantId });
    
    // Calculate monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Number(year) || new Date().getFullYear(), i, 1);
      const monthTransactions = transactions.filter(t => {
        const txDate = t.createdAt;
        return txDate.getMonth() === i && txDate.getFullYear() === month.getFullYear();
      });
      
      const totalRevenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
      const vatCollected = monthTransactions.reduce((sum, t) => sum + parseFloat(t.tax), 0);
      
      return {
        month: month.toLocaleString('en-US', { month: 'short' }),
        revenue: totalRevenue.toFixed(2),
        vat: vatCollected.toFixed(2),
        transactions: monthTransactions.length,
      };
    });
    
    // Calculate yearly totals
    const yearlyRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const yearlyVAT = transactions.reduce((sum, t) => sum + parseFloat(t.tax), 0);
    
    res.json({
      monthly: monthlyData,
      yearly: {
        revenue: yearlyRevenue.toFixed(2),
        vat: yearlyVAT.toFixed(2),
        transactions: transactions.length,
        invoices: invoices.length,
      },
    });
  });

  // Invoices (MULTI-TENANT: require auth + restaurantId filtering)
  app.get("/api/invoices", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const { branchId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const dateRange = (start || end) ? { start, end } : undefined;
    
    const invoices = await storage.getInvoices({
      restaurantId,
      branchId: branchId as string | undefined,
      dateRange
    });
    res.json(invoices);
  });

  app.get("/api/invoices/:id", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const invoice = await storage.getInvoice(req.params.id, restaurantId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.post("/api/invoices", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertInvoiceSchema.parse(req.body);
      // SECURITY: Strip restaurantId from request body and use session restaurantId
      const { restaurantId: _, ...safeData } = data;
      const invoice = await storage.createInvoice({ ...safeData, restaurantId });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Public invoice viewer (no auth required) - accessible via QR code
  app.get("/public/invoice/:id", async (req, res) => {
    try {
      // Use public method that bypasses restaurantId check (safe for QR code access)
      const invoice = await storage.getInvoicePublic(req.params.id);
      if (!invoice) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Invoice Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
                h1 { color: #e74c3c; }
              </style>
            </head>
            <body>
              <h1>Invoice Not Found</h1>
              <p>The requested invoice does not exist.</p>
            </body>
          </html>
        `);
      }

      const settings = await storage.getSettings(invoice.restaurantId);
      const order = invoice.orderId ? await storage.getOrder(invoice.orderId, invoice.restaurantId) : null;
      
      // Generate HTML invoice view
      const html = `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: #f5f5f5; 
                padding: 20px;
                color: #333;
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 40px; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border-radius: 8px;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #2c3e50; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .header h1 { 
                font-size: 28px; 
                color: #2c3e50; 
                margin-bottom: 10px; 
              }
              .header .subtitle { 
                font-size: 18px; 
                color: #7f8c8d; 
                font-weight: normal; 
              }
              .company-info { 
                background: #ecf0f1; 
                padding: 15px; 
                border-radius: 6px; 
                margin-bottom: 25px; 
              }
              .company-info p { 
                margin: 5px 0; 
                font-size: 14px; 
              }
              .invoice-details { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin-bottom: 30px; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 6px; 
              }
              .detail-group h3 { 
                font-size: 14px; 
                color: #7f8c8d; 
                margin-bottom: 8px; 
                text-transform: uppercase; 
              }
              .detail-group p { 
                font-size: 16px; 
                font-weight: 600; 
                color: #2c3e50; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px; 
              }
              th { 
                background: #34495e; 
                color: white; 
                padding: 12px; 
                text-align: left; 
                font-weight: 600; 
              }
              td { 
                padding: 12px; 
                border-bottom: 1px solid #ecf0f1; 
              }
              tr:nth-child(even) { 
                background: #f8f9fa; 
              }
              .totals { 
                margin-left: auto; 
                width: 350px; 
                margin-top: 20px; 
              }
              .totals .row { 
                display: flex; 
                justify-content: space-between; 
                padding: 10px; 
                border-bottom: 1px solid #ecf0f1; 
              }
              .totals .row.total { 
                background: #2c3e50; 
                color: white; 
                font-weight: bold; 
                font-size: 18px; 
                border-radius: 6px; 
                margin-top: 5px; 
              }
              .footer { 
                text-align: center; 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #ecf0f1; 
                color: #7f8c8d; 
                font-size: 14px; 
              }
              .download-btn { 
                display: inline-block; 
                background: #3498db; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin-top: 20px; 
                font-weight: 600; 
                transition: background 0.3s; 
              }
              .download-btn:hover { 
                background: #2980b9; 
              }
              @media print {
                body { background: white; padding: 0; }
                .container { box-shadow: none; padding: 20px; }
                .download-btn { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${settings?.restaurantName || 'Restaurant Management System'}</h1>
                <p class="subtitle">Tax Invoice / فاتورة ضريبية</p>
              </div>

              <div class="company-info">
                <p><strong>VAT Number:</strong> ${settings?.vatNumber || 'N/A'}</p>
                <p><strong>Address:</strong> ${settings?.address || 'Riyadh, Saudi Arabia'}</p>
                <p><strong>Email:</strong> ${settings?.email || 'info@restaurant.sa'}</p>
                <p><strong>Phone:</strong> ${settings?.phone || '+966 11 234 5678'}</p>
              </div>

              <div class="invoice-details">
                <div class="detail-group">
                  <h3>Invoice Number</h3>
                  <p>${invoice.invoiceNumber}</p>
                </div>
                <div class="detail-group">
                  <h3>Date</h3>
                  <p>${new Date(invoice.createdAt).toLocaleDateString('en-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                ${invoice.customerName ? `
                <div class="detail-group">
                  <h3>Customer</h3>
                  <p>${invoice.customerName}</p>
                </div>
                ` : ''}
                ${order?.orderNumber ? `
                <div class="detail-group">
                  <h3>Order Number</h3>
                  <p>${order.orderNumber}</p>
                </div>
                ` : ''}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">${(item.total / item.quantity).toFixed(2)} SAR</td>
                      <td style="text-align: right;">${item.total.toFixed(2)} SAR</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <div class="row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal).toFixed(2)} SAR</span>
                </div>
                <div class="row">
                  <span>VAT (15%):</span>
                  <span>${parseFloat(invoice.vatAmount).toFixed(2)} SAR</span>
                </div>
                <div class="row total">
                  <span>Total Amount:</span>
                  <span>${parseFloat(invoice.total).toFixed(2)} SAR</span>
                </div>
              </div>

              ${invoice.qrCode ? `
                <div style="text-align: center; margin: 30px 0;">
                  <h3 style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">ZATCA QR Code</h3>
                  <img src="${invoice.qrCode}" alt="ZATCA QR Code" style="width: 200px; height: 200px; border: 2px solid #ecf0f1; padding: 10px; border-radius: 6px;" />
                </div>
              ` : ''}

              ${invoice.pdfPath ? `
                <div style="text-align: center;">
                  <a href="${invoice.pdfPath}" class="download-btn" download>Download PDF</a>
                </div>
              ` : ''}

              <div class="footer">
                <p><strong>ZATCA Compliant Invoice</strong></p>
                <p>This is an official tax invoice issued in accordance with Saudi Arabia VAT regulations.</p>
                <p style="margin-top: 10px;">Thank you for your business!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('[PUBLIC INVOICE] Error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>Error Loading Invoice</h1>
            <p>An error occurred while loading the invoice. Please try again later.</p>
          </body>
        </html>
      `);
    }
  });

  // Serve invoice PDFs as static files
  app.use('/invoices', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'invoices', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Invoice not found" });
    }
  });

  // Create invoice record and generate PDF
  app.post("/api/invoices/create-and-generate", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      console.log("[Invoice Generate] Request body:", JSON.stringify(req.body));
      const { orderId } = req.body;
      
      if (!orderId) {
        console.error("[Invoice Generate] Missing orderId in request body");
        return res.status(400).json({ error: "Order ID required" });
      }
      console.log("[Invoice Generate] Processing orderId:", orderId);

      const order = await storage.getOrder(orderId, restaurantId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const settings = await storage.getSettings(restaurantId);
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;

      const invoiceNumber = `INV-${order.orderNumber}`;

      // Transform order items to invoice items format with VAT breakdown
      const invoiceItems = order.items.map(item => {
        const totalPrice = item.quantity * item.price;
        const basePrice = totalPrice / 1.15; // Remove 15% VAT to get base
        const vatAmount = totalPrice - basePrice;
        return {
          name: item.name,
          quantity: item.quantity,
          basePrice: parseFloat(basePrice.toFixed(2)),
          vatAmount: parseFloat(vatAmount.toFixed(2)),
          total: parseFloat(totalPrice.toFixed(2)),
        };
      });

      // Create invoice record first to get the ID (without QR code and PDF path yet)
      const invoiceData = {
        restaurantId: req.session.user!.restaurantId!,
        invoiceNumber,
        orderId: order.id,
        branchId: order.branchId,
        customerName: order.customerName || "Walk-in Customer",
        items: invoiceItems,
        subtotal: order.subtotal,
        vatAmount: order.tax,
        total: order.total,
        qrCode: "", // Will be updated after PDF generation
        pdfPath: "", // Will be updated after PDF generation
      };

      const createdInvoice = await storage.createInvoice(invoiceData);

      // Get base URL from request
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Now generate PDF with invoice ID for QR code
      const pdfData = {
        order,
        companyName: settings?.restaurantName || "Restaurant Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location, Riyadh",
        companyEmail: settings?.email || "info@restaurant.sa",
        companyPhone: settings?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: new Date(),
        invoiceId: createdInvoice.id,
        baseUrl,
        logoPath: settings?.logoPath || undefined,
      };

      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);

      // Ensure invoices directory exists in public folder
      const invoicesDir = path.join(process.cwd(), "public", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Save PDF to filesystem
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Update invoice record with QR code and PDF path
      await storage.updateInvoice(createdInvoice.id, restaurantId, {
        qrCode,
        pdfPath: `/invoices/${pdfFilename}`,
      });

      // Return PDF as download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Excel Export/Import Routes
  const XLSX = await import('xlsx');

  // Download Excel Templates (Empty with headers only)
  app.get("/api/templates/inventory", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Item",
        category: "Sample Category",
        quantity: 100,
        unit: "kg",
        supplier: "Sample Supplier",
        status: "In Stock",
        branchId: ""
      }];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Template");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory_template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  app.get("/api/templates/menu", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Dish",
        category: "Main Course",
        basePrice: 50.00,
        price: 57.50,
        vatAmount: 7.50,
        discount: 0,
        description: "Sample description",
        available: true,
        imageUrl: ""
      }];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=menu_template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  app.get("/api/templates/recipes", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Recipe",
        menuItemId: "",
        prepTime: "15 min",
        cookTime: "30 min",
        servings: 4,
        cost: 25.00,
        ingredients: JSON.stringify([
          { inventoryItemId: "", name: "Sample Ingredient", quantity: 2, unit: "kg" }
        ]),
        steps: JSON.stringify([
          "Step 1: Sample preparation step",
          "Step 2: Sample cooking step"
        ])
      }];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recipes Template");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes_template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Export Inventory to Excel
  app.get("/api/export/inventory", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const items = await storage.getInventoryItems(restaurantId, branchId);
      
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Inventory export error:", error);
      res.status(500).json({ error: "Failed to export inventory" });
    }
  });

  // Export Menu to Excel
  app.get("/api/export/menu", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const items = await storage.getMenuItems(restaurantId);
      
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menu");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=menu.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Menu export error:", error);
      res.status(500).json({ error: "Failed to export menu" });
    }
  });

  // Export Recipes to Excel
  app.get("/api/export/recipes", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const recipes = await storage.getRecipes(restaurantId);
      
      // Flatten recipe data for Excel
      const flattenedRecipes = recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        cost: recipe.cost,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(flattenedRecipes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recipes");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Recipes export error:", error);
      res.status(500).json({ error: "Failed to export recipes" });
    }
  });

  // Export Orders to Excel
  app.get("/api/export/orders", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const status = req.query.status as string | undefined;
      const orders = await storage.getOrders({ restaurantId, branchId, status });
      
      // Flatten orders for Excel
      const flattenedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        branchId: order.branchId,
        customerName: order.customerName,
        orderType: order.orderType,
        status: order.status,
        table: order.table,
        address: order.address,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        items: JSON.stringify(order.items),
        createdAt: order.createdAt,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(flattenedOrders);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Orders export error:", error);
      res.status(500).json({ error: "Failed to export orders" });
    }
  });

  // Export Transactions to Excel
  app.get("/api/export/transactions", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const dateRange = (startDate || endDate) ? { start: startDate, end: endDate } : undefined;
      const transactions = await storage.getTransactions({ restaurantId, branchId, dateRange });
      
      const worksheet = XLSX.utils.json_to_sheet(transactions);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Transactions export error:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });

  // Export Procurement to Excel
  app.get("/api/export/procurement", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const branchId = req.query.branchId as string | undefined;
      const procurements = await storage.getProcurements({
        restaurantId,
        type,
        status,
        branchId
      });
      
      const worksheet = XLSX.utils.json_to_sheet(procurements);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Procurement");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=procurement.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Procurement export error:", error);
      res.status(500).json({ error: "Failed to export procurement" });
    }
  });

  // Export Customers to Excel
  app.get("/api/export/customers", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const customers = await storage.getCustomers(restaurantId);
      
      const worksheet = XLSX.utils.json_to_sheet(customers);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Customers export error:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  });

  // Export Branches to Excel
  app.get("/api/export/branches", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branches = await storage.getBranches(restaurantId);
      
      const worksheet = XLSX.utils.json_to_sheet(branches);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=branches.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Branches export error:", error);
      res.status(500).json({ error: "Failed to export branches" });
    }
  });

  // Export Profitability Data to Excel
  app.get("/api/export/profitability", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const period = req.query.period as string || 'month';
      
      // Get menu items, recipes, and orders
      const menuItems = await storage.getMenuItems(restaurantId);
      const recipes = await storage.getRecipes(restaurantId);
      const orders = await storage.getOrders({ restaurantId });
      
      // Filter orders by period
      const now = new Date();
      const cutoffDate = new Date();
      switch (period) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      const filteredOrders = orders.filter((order) => new Date(order.createdAt) >= cutoffDate);
      
      // Calculate profitability data
      const profitabilityData = menuItems.map((item) => {
        const recipe = item.recipeId ? recipes.find((r) => r.id === item.recipeId) : null;
        const cost = recipe ? parseFloat(recipe.cost) : 0;
        const basePrice = parseFloat(item.basePrice);
        const profit = basePrice - cost;
        const margin = basePrice > 0 ? (profit / basePrice) * 100 : 0;
        
        // Calculate sales volume
        const itemSales = filteredOrders.filter((order) =>
          order.items?.some((orderItem: any) => orderItem.id === item.id)
        );
        const salesVolume = itemSales.reduce((sum, order) => {
          const orderItem = order.items?.find((oi: any) => oi.id === item.id);
          return sum + (orderItem?.quantity || 0);
        }, 0);
        
        const totalRevenue = salesVolume * basePrice;
        const totalProfit = salesVolume * profit;
        
        return {
          "Item Name": item.name,
          "Category": item.category,
          "Base Price (SAR)": basePrice.toFixed(2),
          "Cost (SAR)": cost.toFixed(2),
          "Profit per Unit (SAR)": profit.toFixed(2),
          "Margin (%)": margin.toFixed(2),
          "Sales Volume": salesVolume,
          "Total Revenue (SAR)": totalRevenue.toFixed(2),
          "Total Profit (SAR)": totalProfit.toFixed(2),
        };
      });
      
      const worksheet = XLSX.utils.json_to_sheet(profitabilityData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Profitability");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=profitability-${period}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Profitability export error:", error);
      res.status(500).json({ error: "Failed to export profitability data" });
    }
  });

  // Export Financial Data to Excel
  app.get("/api/export/financial", requireAuth, requireRestaurant, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const period = req.query.period as string || 'monthly';
      
      // Fetch financial data using same logic as the analytics endpoint
      const transactions = await storage.getTransactions({ restaurantId });
      const invoices = await storage.getInvoices({ restaurantId });
      
      // Filter by year
      const yearTransactions = transactions.filter(t => 
        new Date(t.createdAt).getFullYear() === parseInt(year)
      );
      
      if (period === 'monthly') {
        // Monthly data
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthTransactions = yearTransactions.filter(t => 
            new Date(t.createdAt).getMonth() === i
          );
          
          const revenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
          const vat = revenue * 0.15; // 15% Saudi VAT
          
          return {
            "Month": new Date(parseInt(year), i).toLocaleString('default', { month: 'long' }),
            "Revenue (SAR)": revenue.toFixed(2),
            "VAT (SAR)": vat.toFixed(2),
            "Total (SAR)": (revenue + vat).toFixed(2),
            "Transactions": monthTransactions.length,
          };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(monthlyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Financial");
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-${year}-monthly.xlsx`);
        res.send(buffer);
      } else {
        // Yearly summary
        const revenue = yearTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
        const vat = revenue * 0.15;
        const yearInvoices = invoices.filter(inv => 
          new Date(inv.createdAt).getFullYear() === parseInt(year)
        );
        
        const yearlyData = [{
          "Year": year,
          "Total Revenue (SAR)": revenue.toFixed(2),
          "Total VAT (SAR)": vat.toFixed(2),
          "Total (SAR)": (revenue + vat).toFixed(2),
          "Total Transactions": yearTransactions.length,
          "Total Invoices": yearInvoices.length,
        }];
        
        const worksheet = XLSX.utils.json_to_sheet(yearlyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Yearly Financial");
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-${year}-yearly.xlsx`);
        res.send(buffer);
      }
    } catch (error) {
      console.error("Financial export error:", error);
      res.status(500).json({ error: "Failed to export financial data" });
    }
  });

  // Export Financial Statement as PDF
  app.get("/api/export/financial-pdf", requireAuth, requireRestaurant, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const period = (req.query.period as "monthly" | "yearly") || 'monthly';
      
      const settings = await storage.getSettings(restaurantId);
      
      // Fetch financial data
      const transactions = await storage.getTransactions({ restaurantId });
      const invoices = await storage.getInvoices({ restaurantId });
      
      // Filter by year
      const yearTransactions = transactions.filter(t => 
        new Date(t.createdAt).getFullYear() === parseInt(year)
      );
      const yearInvoices = invoices.filter(inv => 
        new Date(inv.createdAt).getFullYear() === parseInt(year)
      );
      
      // Calculate yearly totals
      const revenue = yearTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
      const vat = revenue * 0.15; // 15% Saudi VAT
      
      const yearlyData = {
        revenue: revenue.toFixed(2),
        vat: vat.toFixed(2),
        transactions: yearTransactions.length,
        invoices: yearInvoices.length,
      };
      
      // Calculate monthly data if needed
      let monthlyData;
      if (period === 'monthly') {
        monthlyData = Array.from({ length: 12 }, (_, i) => {
          const monthTransactions = yearTransactions.filter(t => 
            new Date(t.createdAt).getMonth() === i
          );
          
          const monthRevenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
          const monthVat = monthRevenue * 0.15;
          
          return {
            month: new Date(parseInt(year), i).toLocaleString('default', { month: 'long' }),
            revenue: monthRevenue.toFixed(2),
            vat: monthVat.toFixed(2),
            transactions: monthTransactions.length,
          };
        });
      }
      
      const { generateFinancialStatementPDF } = await import('./invoice.js');
      
      const pdfBuffer = await generateFinancialStatementPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        period,
        yearlyData,
        monthlyData,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=financial-statement-${year}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Financial PDF export error:", error);
      res.status(500).json({ error: "Failed to export financial statement" });
    }
  });

  // Download individual invoice PDF
  app.get("/api/invoices/:id/download", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const invoice = await storage.getInvoice(req.params.id, restaurantId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // If pdfPath exists, serve the file
      if (invoice.pdfPath) {
        // pdfPath is stored as /invoices/filename.pdf, strip leading slash and join with public directory
        const relativePath = invoice.pdfPath.replace(/^\/+/, '');
        const filePath = path.normalize(path.join(process.cwd(), 'public', relativePath));
        console.log('[Invoice Download] Looking for file at:', filePath);
        
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
          return res.sendFile(filePath);
        } else {
          console.error('[Invoice Download] PDF file not found at:', filePath);
        }
      }
      
      // If PDF doesn't exist, return error (PDF should be generated during invoice creation)
      res.status(404).json({ error: "Invoice PDF not found" });
    } catch (error) {
      console.error("Invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });

  // Import routes with file upload (using static multer import from top of file)
  const upload = multer({ storage: multer.memoryStorage() });

  // Configure multer for menu image uploads (disk storage)
  const menuImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'menu-images');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'menu-' + uniqueSuffix + ext);
    }
  });

  const uploadMenuImage = multer({
    storage: menuImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only image files are allowed!'));
    }
  });

  // Upload menu item image
  app.post("/api/menu/upload-image", requireAuth, requireRestaurant, requirePermission('menu'), uploadMenuImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      const imageUrl = `/uploads/menu-images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Serve uploaded menu images
  app.use('/uploads/menu-images', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    next();
  });
  app.use('/uploads/menu-images', (await import('express')).static(path.join(process.cwd(), 'uploads', 'menu-images')));

  // Authenticated endpoint to download subscription invoices
  // SECURITY: Requires authentication and verifies restaurant ownership via database join
  app.get('/api/subscription-invoices/:filename', requireAuth, requireRestaurant, async (req, res) => {
    try {
      const filename = req.params.filename;
      const restaurantId = req.session.user!.restaurantId!;
      
      // Validate filename format (e.g., subscription-0061-20251112-025947.pdf)
      const match = filename.match(/^subscription-(\d{4}-\d{8}-\d{6})\.pdf$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid filename format' });
      }
      
      const serialNumber = match[1]; // Extract serial number (e.g., "0061-20251112-025947")
      
      // SECURITY: Verify invoice ownership by checking restaurantId in database
      const invoice = await storage.getSubscriptionInvoiceBySerialNumber(serialNumber, restaurantId);
      if (!invoice) {
        return res.status(403).json({ error: 'Access denied - invoice does not belong to your restaurant' });
      }
      
      const filePath = path.join(process.cwd(), 'public', 'subscription-invoices', filename);
      
      // Verify file exists on disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Invoice PDF file not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(filePath);
    } catch (error) {
      console.error('Subscription invoice download error:', error);
      res.status(500).json({ error: 'Failed to download invoice' });
    }
  });

  // Get user's subscription invoices (list)
  // NOTE: This route MUST come after the /:filename route to avoid routing conflicts
  app.get("/api/subscription-invoices", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const invoices = await storage.getSubscriptionInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Get subscription invoices error:", error);
      res.status(500).json({ error: "Failed to fetch subscription invoices" });
    }
  });
  
  // TODO: Authenticated endpoint to download VAT reports
  // Will be implemented when VAT report management is added

  // ===== TEAM CHAT API =====
  
  // Get all conversations for authenticated user
  app.get("/api/chat/conversations", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const branchId = req.query.branchId as string | undefined;
      
      const conversations = await storage.getConversations(restaurantId, userId, branchId);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation by ID
  app.get("/api/chat/conversations/:id", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      
      // Verify user is a member of this conversation
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      const conversation = await storage.getConversation(conversationId, restaurantId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create a new channel
  app.post("/api/chat/channels", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const { name, scope, branchId } = req.body;
      
      // Validate input
      if (!name || !scope) {
        return res.status(400).json({ error: "Name and scope are required" });
      }
      
      if (scope === "branch" && !branchId) {
        return res.status(400).json({ error: "Branch ID required for branch-scoped channels" });
      }
      
      const conversation = await storage.createConversation({
        restaurantId,
        type: "channel",
        name,
        scope,
        branchId: scope === "branch" ? branchId : null,
        createdBy: userId,
      });
      
      // Add creator as member
      await storage.addConversationMember({
        restaurantId,
        conversationId: conversation.id,
        userId,
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Create channel error:", error);
      res.status(500).json({ error: "Failed to create channel" });
    }
  });

  // Get or create direct conversation between two users
  app.post("/api/chat/direct", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ error: "Other user ID is required" });
      }
      
      if (otherUserId === userId) {
        return res.status(400).json({ error: "Cannot create DM with yourself" });
      }
      
      // Verify other user exists and is in same restaurant
      const otherUser = await storage.getUser(otherUserId, restaurantId);
      if (!otherUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const conversation = await storage.getOrCreateDirectConversation(restaurantId, userId, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Get/create DM error:", error);
      res.status(500).json({ error: "Failed to get or create direct conversation" });
    }
  });

  // Get messages in a conversation
  app.get("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Verify user is a member
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      const messages = await storage.getChatMessages(conversationId, restaurantId, limit);
      res.json(messages.reverse()); // Reverse to get oldest first
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message to a conversation
  app.post("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      const { content } = req.body;
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Verify user is a member
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      // Get user info for sender name
      const user = await storage.getUser(userId, restaurantId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const message = await storage.createChatMessage({
        restaurantId,
        conversationId,
        senderId: userId,
        senderName: user.fullName,
        content: content.trim(),
      });
      
      // Broadcast new message via WebSocket to all restaurant members
      broadcastNotification({
        type: 'chat:message',
        restaurantId,
        conversationId,
        message: {
          id: message.id!,
          conversationId: message.conversationId!,
          senderId: message.senderId!,
          senderName: message.senderName!,
          content: message.content!,
          createdAt: message.createdAt!.toISOString(),
        },
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get conversation members
  app.get("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      
      // Verify user is a member
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      const members = await storage.getConversationMembers(conversationId, restaurantId);
      res.json(members);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get chat notification settings (restaurant defaults)
  app.get("/api/chat/notification-settings", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const settings = await storage.getChatNotificationDefaults(restaurantId);
      res.json(settings);
    } catch (error) {
      console.error("Get chat notification settings error:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  // Update chat notification settings (admin only)
  app.patch("/api/chat/notification-settings", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userRole = req.session.user!.role;
      
      // Only admins can update restaurant-wide notification defaults
      if (userRole !== 'admin') {
        return res.status(403).json({ error: "Only administrators can update notification settings" });
      }
      
      // Validate request body
      const schema = z.object({
        notificationsEnabled: z.boolean().optional(),
        soundEnabled: z.boolean().optional(),
        toneId: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      await storage.updateChatNotificationDefaults(restaurantId, data);
      
      // Broadcast settings update to all connected clients in this restaurant
      broadcastNotification({
        type: 'settings:updated',
        restaurantId,
      });
      
      // Return updated settings
      const updated = await storage.getChatNotificationDefaults(restaurantId);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid notification settings data", details: error.errors });
      }
      console.error("Update chat notification settings error:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Add member to conversation (channels only)
  app.post("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      const { userId: newUserId } = req.body;
      
      if (!newUserId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Verify current user is a member
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      // Verify conversation is a channel (not DM)
      const conversation = await storage.getConversation(conversationId, restaurantId);
      if (!conversation || conversation.type !== "channel") {
        return res.status(400).json({ error: "Can only add members to channels" });
      }
      
      // Verify new user exists and is in same restaurant
      const newUser = await storage.getUser(newUserId, restaurantId);
      if (!newUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if already a member
      const alreadyMember = await storage.isUserInConversation(conversationId, newUserId, restaurantId);
      if (alreadyMember) {
        return res.status(400).json({ error: "User is already a member" });
      }
      
      const member = await storage.addConversationMember({
        restaurantId,
        conversationId,
        userId: newUserId,
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Mark conversation as read
  app.post("/api/chat/conversations/:id/read", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const conversationId = req.params.id;
      const { lastReadMessageId } = req.body;
      
      // Verify user is a member
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      
      await storage.updateMessageRead({
        restaurantId,
        conversationId,
        userId,
        lastReadMessageId: lastReadMessageId || null,
        lastReadAt: new Date(),
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Get unread count for all conversations
  app.get("/api/chat/unread-count", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      
      const count = await storage.getUnreadChatCount(restaurantId, userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Get all employee users in restaurant for DM selection
  app.get("/api/chat/users", requireAuth, requireRestaurant, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const users = await storage.getUsers(restaurantId);
      
      // Filter to only show employees (exclude admins) and active users
      const employees = users.filter(u => u.role === 'employee' && u.active);
      
      // Return users without sensitive data
      const safeUsers = employees.map(u => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        role: u.role,
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Import Inventory from Excel
  app.post("/api/import/inventory", requireAuth, requireRestaurant, requirePermission('inventory'), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;

      for (const row of data as any[]) {
        try {
          await storage.createInventoryItem({
            restaurantId: req.session.user!.restaurantId!,
            name: row.name,
            category: row.category,
            quantity: String(row.quantity),
            unit: row.unit,
            supplier: row.supplier,
            status: row.status || "In Stock",
            branchId: row.branchId || null,
          });
          imported++;
        } catch (error) {
          console.error("Error importing row:", row, error);
          errors++;
        }
      }

      res.json({ message: `Imported ${imported} items, ${errors} errors` });
    } catch (error) {
      console.error("Inventory import error:", error);
      res.status(500).json({ error: "Failed to import inventory" });
    }
  });

  // Import Menu from Excel
  app.post("/api/import/menu", requireAuth, requireRestaurant, requirePermission('menu'), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;

      for (const row of data as any[]) {
        try {
          await storage.createMenuItem({
            restaurantId: req.session.user!.restaurantId!,
            name: row.name,
            category: row.category,
            basePrice: String(row.basePrice),
            price: String(row.price),
            vatAmount: String(row.vatAmount || 0),
            description: row.description,
            available: Boolean(row.available),
            imageUrl: row.imageUrl,
          });
          imported++;
        } catch (error) {
          console.error("Error importing row:", row, error);
          errors++;
        }
      }

      res.json({ message: `Imported ${imported} items, ${errors} errors` });
    } catch (error) {
      console.error("Menu import error:", error);
      res.status(500).json({ error: "Failed to import menu" });
    }
  });

  // Import Recipes from Excel
  app.post("/api/import/recipes", requireAuth, requireRestaurant, requirePermission('recipes'), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;

      for (const row of data as any[]) {
        try {
          await storage.createRecipe({
            restaurantId: req.session.user!.restaurantId!,
            name: row.name,
            prepTime: row.prepTime,
            cookTime: row.cookTime,
            servings: Number(row.servings),
            cost: String(row.cost),
            ingredients: typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients,
            steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps,
          });
          imported++;
        } catch (error) {
          console.error("Error importing row:", row, error);
          errors++;
        }
      }

      res.json({ message: `Imported ${imported} recipes, ${errors} errors` });
    } catch (error) {
      console.error("Recipes import error:", error);
      res.status(500).json({ error: "Failed to import recipes" });
    }
  });

  // Import Branches from Excel
  app.post("/api/import/branches", requireAuth, requireRestaurant, requirePermission('branches'), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;

      for (const row of data as any[]) {
        try {
          await storage.createBranch({
            restaurantId: req.session.user!.restaurantId!,
            name: row.name,
            location: row.location || row.address,
            phone: row.phone,
            manager: row.manager,
            staff: Number(row.staff) || undefined,
            status: row.status || undefined,
          });
          imported++;
        } catch (error) {
          console.error("Error importing row:", row, error);
          errors++;
        }
      }

      res.json({ message: `Imported ${imported} branches, ${errors} errors` });
    } catch (error) {
      console.error("Branches import error:", error);
      res.status(500).json({ error: "Failed to import branches" });
    }
  });

  // ==================== Monthly VAT Reports ====================

  // Get all VAT reports for the logged-in user
  app.get("/api/vat-reports", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const authUser = req.session.user!;
      const userId = authUser.id;
      const reports = await storage.getMonthlyVatReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching VAT reports:", error);
      res.status(500).json({ error: "Failed to fetch VAT reports" });
    }
  });

  // Generate monthly VAT report
  app.post("/api/vat-reports/generate", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const authUser = req.session.user!;
      const userId = authUser.id;
      const restaurantId = authUser.restaurantId!;
      const { month, year } = req.body;

      // Validate input
      if (!month || !year || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid month or year" });
      }

      // Check if report already exists for this month
      const existingReport = await storage.getVatReportByMonth(userId, month, year);
      if (existingReport) {
        return res.status(400).json({ error: "Report for this month already exists" });
      }

      // Get user data for the invoice
      const user = await storage.getUserProfile(userId, restaurantId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate sales data for the month (from transactions/orders)
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await storage.getTransactions({ 
        restaurantId: user.restaurantId!, 
        dateRange: { start: startDate, end: endDate }
      });
      
      // Calculate total sales (sum of all transaction totals)
      const totalSales = transactions.reduce((sum, tx) => sum + parseFloat(tx.total), 0);
      const totalSalesBaseAmount = totalSales / 1.15; // Remove 15% VAT
      const totalSalesVat = totalSales - totalSalesBaseAmount;

      // Calculate total purchases (from procurement)
      const procurements = await storage.getProcurements({ restaurantId: user.restaurantId! });
      const monthProcurements = procurements.filter(p => {
        if (!p.orderDate) return false;
        const procDate = new Date(p.orderDate);
        return procDate >= startDate && procDate <= endDate;
      });
      
      const totalPurchases = monthProcurements.reduce((sum, p) => {
        const amount = parseFloat(p.totalCost);
        return sum + amount;
      }, 0);
      const totalPurchasesBaseAmount = totalPurchases / 1.15; // Remove 15% VAT
      const totalPurchasesVat = totalPurchases - totalPurchasesBaseAmount;

      // Calculate net VAT payable
      const netVatPayable = totalSalesVat - totalPurchasesVat;

      // Generate serial number
      const serialNumber = await storage.getNextVatReportSerialNumber(year, month);

      // Fetch restaurant for company details
      const restaurant = await storage.getRestaurant(user.restaurantId!);

      // Generate PDF invoice
      const pdfBuffer = await generateMonthlyVatReport({
        serialNumber,
        reportMonth: month,
        reportYear: year,
        restaurantName: restaurant?.name || user.username,
        taxNumber: restaurant?.taxNumber || 'N/A',
        totalSales,
        totalSalesBaseAmount,
        totalSalesVat,
        totalPurchases,
        totalPurchasesBaseAmount,
        totalPurchasesVat,
        netVatPayable,
        generatedDate: new Date(),
      });

      // Save PDF to file
      const pdfDir = path.join(process.cwd(), 'public', 'vat-reports');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfFilename = `VAT-${year}-${month.toString().padStart(2, '0')}-${serialNumber.replace(/\//g, '-')}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Generate QR code
      const qrData = `VAT Report: ${serialNumber}\nPeriod: ${month}/${year}\nNet VAT: ${netVatPayable.toFixed(2)} SAR`;
      const qrCode = await QRCode.toDataURL(qrData);

      // Create VAT report record
      const report = await storage.createVatReport({
        userId,
        reportMonth: month,
        reportYear: year,
        serialNumber,
        totalSales: totalSales.toFixed(2),
        totalSalesBaseAmount: totalSalesBaseAmount.toFixed(2),
        totalSalesVat: totalSalesVat.toFixed(2),
        totalPurchases: totalPurchases.toFixed(2),
        totalPurchasesBaseAmount: totalPurchasesBaseAmount.toFixed(2),
        totalPurchasesVat: totalPurchasesVat.toFixed(2),
        netVatPayable: netVatPayable.toFixed(2),
        pdfPath: `/vat-reports/${pdfFilename}`,
        qrCode,
      });

      res.json(report);
    } catch (error) {
      console.error("Error generating VAT report:", error);
      res.status(500).json({ error: "Failed to generate VAT report" });
    }
  });

  // Download VAT report PDF
  app.get("/api/vat-reports/:id/download", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const authUser = req.session.user!;
      const userId = authUser.id;
      const reportId = req.params.id;

      const reports = await storage.getMonthlyVatReports(userId);
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (!report.pdfPath) {
        return res.status(404).json({ error: "PDF not available" });
      }

      // pdfPath is stored as /vat-reports/filename.pdf, strip leading slash and join with public directory
      const relativePath = report.pdfPath.replace(/^\/+/, '');
      const pdfFullPath = path.normalize(path.join(process.cwd(), 'public', relativePath));
      
      if (!fs.existsSync(pdfFullPath)) {
        console.error('[VAT Report Download] PDF file not found at:', pdfFullPath);
        return res.status(404).json({ error: "PDF file not found" });
      }

      res.download(pdfFullPath, path.basename(pdfFullPath));
    } catch (error) {
      console.error("Error downloading VAT report:", error);
      res.status(500).json({ error: "Failed to download VAT report" });
    }
  });

  // Moyasar Payment Gateway
  app.get("/api/moyasar/config", (_req, res) => {
    try {
      const { getPublishableKey } = require('./moyasarService');
      res.json({ 
        publishableKey: getPublishableKey(),
        currency: 'SAR',
      });
    } catch (error) {
      console.error("Error getting Moyasar config:", error);
      res.status(500).json({ error: "Failed to get payment configuration" });
    }
  });

  app.post("/api/moyasar/create-payment", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { orderId, amount, description, token, customerName, customerEmail, customerPhone } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const { createPayment } = require('./moyasarService');
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/moyasar/callback`;

      // Create payment with Moyasar
      const payment = await createPayment({
        amount: parseFloat(amount),
        description: description || `Order Payment`,
        callbackUrl,
        source: token ? {
          type: 'token' as const,
          token,
        } : undefined,
        metadata: {
          orderId,
          customerName,
          customerEmail,
          customerPhone,
        },
      });

      // Save payment record to database
      const amountSar = payment.amount / 100;
      const moyasarPayment = await storage.createMoyasarPayment({
        restaurantId,
        moyasarId: payment.id,
        orderId: orderId || null,
        transactionId: null,
        amount: amountSar.toString(),
        amountHalalas: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.source?.type || null,
        cardBrand: payment.source?.company || null,
        cardLast4: payment.source?.number ? payment.source.number.slice(-4) : null,
        fee: payment.fee ? (payment.fee / 100).toString() : null,
        refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : "0",
        description: payment.description,
        customerName,
        customerEmail,
        customerPhone,
        callbackUrl: payment.callback_url,
        metadata: payment.metadata,
        errorMessage: payment.source?.message || null,
        branchId: req.body.branchId || null,
      });

      res.json({
        success: true,
        payment: moyasarPayment,
        moyasarPayment: payment,
      });
    } catch (error: any) {
      console.error("Error creating Moyasar payment:", error);
      res.status(500).json({ 
        error: "Payment creation failed",
        message: error.message,
      });
    }
  });

  app.get("/api/moyasar/payment/:paymentId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { fetchPayment } = require('./moyasarService');
      const payment = await fetchPayment(req.params.paymentId);

      // Update payment in database
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarId(req.params.paymentId, restaurantId);
      if (moyasarPayment) {
        await storage.updateMoyasarPayment(moyasarPayment.id, restaurantId, {
          status: payment.status,
          paymentMethod: payment.source?.type || moyasarPayment.paymentMethod,
          cardBrand: payment.source?.company || moyasarPayment.cardBrand,
          cardLast4: payment.source?.number ? payment.source.number.slice(-4) : moyasarPayment.cardLast4,
          fee: payment.fee ? (payment.fee / 100).toString() : moyasarPayment.fee,
          refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount,
          errorMessage: payment.source?.message || moyasarPayment.errorMessage,
        });
      }

      res.json(payment);
    } catch (error: any) {
      console.error("Error fetching Moyasar payment:", error);
      res.status(500).json({ 
        error: "Failed to fetch payment",
        message: error.message,
      });
    }
  });

  app.post("/api/moyasar/refund/:paymentId", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { amount } = req.body;
      const { refundPayment } = require('./moyasarService');
      
      const payment = await refundPayment(
        req.params.paymentId, 
        amount ? parseFloat(amount) : undefined
      );

      // Update payment in database
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarId(req.params.paymentId, restaurantId);
      if (moyasarPayment) {
        await storage.updateMoyasarPayment(moyasarPayment.id, restaurantId, {
          status: payment.status,
          refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount,
        });
      }

      res.json({
        success: true,
        payment,
      });
    } catch (error: any) {
      console.error("Error refunding Moyasar payment:", error);
      res.status(500).json({ 
        error: "Refund failed",
        message: error.message,
      });
    }
  });

  app.post("/api/moyasar/callback", async (req, res) => {
    try {
      const { id: paymentId, status, amount, source } = req.body;

      // SECURITY: Verify Moyasar webhook signature (HMAC-SHA256)
      // This prevents forged payment confirmations
      const signature = req.headers['x-moyasar-signature'] as string;
      const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        if (!signature) {
          console.warn('[Moyasar Webhook] Missing signature header');
          return res.status(401).json({ error: 'Unauthorized: Missing signature' });
        }

        // Verify HMAC signature against raw request body
        // CRITICAL: Must use raw body bytes (captured by express.json verify callback)
        // because Moyasar signs the exact payload, not the parsed JSON
        const crypto = require('crypto');
        const rawBody = (req as any).rawBody;
        
        if (!rawBody) {
          console.error('[Moyasar Webhook] Raw body not available for signature verification');
          return res.status(500).json({ error: 'Server configuration error' });
        }
        
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        // Use constant-time comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        
        if (signatureBuffer.length !== expectedBuffer.length || 
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
          console.warn('[Moyasar Webhook] Invalid signature');
          return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
        }
      } else {
        // Log warning if webhook secret is not configured (development mode)
        console.warn('[Moyasar Webhook] MOYASAR_WEBHOOK_SECRET not configured - signature verification disabled');
      }
      
      // Verify payment with Moyasar as additional security layer
      const { fetchPayment } = require('./moyasarService');
      const payment = await fetchPayment(paymentId);

      // Fetch payment from database (bypasses tenant scoping for webhook)
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarIdAnyTenant(paymentId);
      if (!moyasarPayment) {
        console.warn(`[Moyasar Webhook] Payment not found: ${paymentId}`);
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update payment in database using the payment's restaurantId for tenant isolation
      await storage.updateMoyasarPayment(moyasarPayment.id, moyasarPayment.restaurantId, {
        status: payment.status,
        paymentMethod: payment.source?.type || moyasarPayment.paymentMethod,
        cardBrand: payment.source?.company || moyasarPayment.cardBrand,
        cardLast4: payment.source?.number ? payment.source.number.slice(-4) : moyasarPayment.cardLast4,
        fee: payment.fee ? (payment.fee / 100).toString() : moyasarPayment.fee,
        refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount,
        errorMessage: payment.source?.message || moyasarPayment.errorMessage,
      });

      // If payment is successful and linked to an order, update order status
      if (payment.status === 'paid' && moyasarPayment.orderId) {
        await storage.updateOrder(moyasarPayment.orderId, moyasarPayment.restaurantId, {
          status: 'paid',
          paymentMethod: 'Moyasar - ' + (payment.source?.company || payment.source?.type || 'Online'),
        });
      }

      console.log(`[Moyasar Webhook] Payment ${paymentId} updated successfully (restaurant: ${moyasarPayment.restaurantId})`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error processing Moyasar callback:", error);
      res.status(500).json({ 
        error: "Callback processing failed",
        message: error.message,
      });
    }
  });

  app.get("/api/moyasar/payments", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const payments = await storage.getMoyasarPayments(restaurantId, branchId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Support Tickets
  app.get("/api/tickets", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      
      const tickets = await storage.getSupportTickets(restaurantId, userId, status);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      let ticket;
      
      if (accountType === 'it') {
        // IT accounts have cross-tenant access
        ticket = await storage.getSupportTicketForIT(req.params.id);
      } else {
        // Restaurant accounts can only access their own tickets
        const restaurantId = req.session.user!.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.id, restaurantId);
      }
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      
      const ticket = await storage.createSupportTicket({
        restaurantId,
        userId,
        subject: req.body.subject,
        category: req.body.category,
        priority: req.body.priority || 'medium',
        description: req.body.description,
        status: 'open',
      });

      // Send email notification to IT support
      const { sendTicketNotificationEmail } = await import('./emailService');
      sendTicketNotificationEmail({
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        description: ticket.description,
        userId: ticket.userId,
        userName: req.body.userName,
        createdAt: ticket.createdAt.toISOString(),
      }).catch(err => {
        console.error('Failed to send email notification:', err);
        // Don't fail the request if email fails
      });

      // Broadcast real-time notification for new ticket
      broadcastNotification({
        type: 'ticket:created',
        restaurantId,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        ticketStatus: ticket.status,
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  app.patch("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, userId: __, ...safeData } = req.body;
      
      // SECURITY: Only IT accounts can set status to 'in-progress', 'resolved', or 'closed'
      const restrictedStatuses = ['in-progress', 'resolved', 'closed'];
      if (safeData.status && restrictedStatuses.includes(safeData.status)) {
        if (accountType !== 'it') {
          return res.status(403).json({ 
            error: "Only IT support can set ticket status to In Progress, Resolved, or Closed" 
          });
        }
      }
      
      let updated;
      if (accountType === 'it') {
        // IT accounts have cross-tenant access
        updated = await storage.updateSupportTicketForIT(req.params.id, safeData);
      } else {
        // Restaurant accounts can only update their own tickets
        const restaurantId = req.session.user!.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        updated = await storage.updateSupportTicket(req.params.id, restaurantId, safeData);
      }
      
      if (!updated) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      // Broadcast real-time notification for ticket update
      broadcastNotification({
        type: 'ticket:updated',
        restaurantId: updated.restaurantId,
        ticketId: updated.id,
        ticketNumber: updated.ticketNumber,
        subject: updated.subject,
        category: updated.category,
        priority: updated.priority,
        ticketStatus: updated.status,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // Ticket Messages
  app.get("/api/tickets/:ticketId/messages", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      let ticket;
      let messages;
      
      if (accountType === 'it') {
        // IT accounts have cross-tenant access
        ticket = await storage.getSupportTicketForIT(req.params.ticketId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        messages = await storage.getTicketMessagesForIT(req.params.ticketId);
      } else {
        // Restaurant accounts can only access their own tickets
        const restaurantId = req.session.user!.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.ticketId, restaurantId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        messages = await storage.getTicketMessages(req.params.ticketId, restaurantId);
      }

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/tickets/:ticketId/messages", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      const userId = req.session.user!.id;
      let ticket;
      let restaurantId: string;
      
      if (accountType === 'it') {
        // IT accounts have cross-tenant access
        ticket = await storage.getSupportTicketForIT(req.params.ticketId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        restaurantId = ticket.restaurantId;
      } else {
        // Restaurant accounts can only access their own tickets
        const userRestaurantId = req.session.user!.restaurantId;
        if (!userRestaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.ticketId, userRestaurantId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        restaurantId = userRestaurantId;
      }

      const message = await storage.createTicketMessage({
        restaurantId,
        ticketId: req.params.ticketId,
        senderId: userId,
        senderName: req.body.senderName || 'User',
        senderRole: req.body.senderRole || 'employee',
        message: req.body.message,
        isRead: false,
      });

      // Broadcast real-time notification for new ticket message
      broadcastNotification({
        type: 'ticket:message',
        restaurantId,
        ticketId: req.params.ticketId,
        ticketNumber: ticket.ticketNumber,
        ticketMessage: {
          id: message.id,
          ticketId: message.ticketId,
          senderId: message.senderId,
          senderName: message.senderName,
          senderRole: message.senderRole,
          message: message.message,
          createdAt: message.createdAt.toISOString(),
        },
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.get("/api/tickets/unread/count", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const count = await storage.getUnreadMessageCount(restaurantId, userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Employee Activity Log
  app.get("/api/employee-activities", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const employeeId = req.query.employeeId as string | undefined;
      const category = req.query.category as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const activities = await storage.getEmployeeActivities(restaurantId, employeeId, category, startDate, endDate);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/employee-activities/stats/:employeeId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const stats = await storage.getEmployeeActivityStats(req.params.employeeId, restaurantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ error: "Failed to fetch activity stats" });
    }
  });

  // IT Management Routes - Cross-tenant access for IT accounts
  app.get("/api/it/analytics", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see analytics across all restaurants
      const analytics = await storage.getITAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching IT analytics:", error);
      res.status(500).json({ error: "Failed to fetch IT analytics" });
    }
  });

  app.get("/api/it/staff", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see all IT staff across all restaurants
      const staff = await storage.getITStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching IT staff:", error);
      res.status(500).json({ error: "Failed to fetch IT staff" });
    }
  });

  app.get("/api/it/workload", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see workload across all restaurants
      const staff = await storage.getWorkloadDistribution();
      res.json({ staff }); // Wrap in object to match frontend expectations
    } catch (error) {
      console.error("Error fetching workload distribution:", error);
      res.status(500).json({ error: "Failed to fetch workload distribution" });
    }
  });

  app.get("/api/it/category-breakdown", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see category breakdown across all restaurants
      const breakdown = await storage.getCategoryBreakdown();
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  });

  app.get("/api/it/trends", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see ticket trends across all restaurants
      const trends = await storage.getTicketTrends();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching ticket trends:", error);
      res.status(500).json({ error: "Failed to fetch ticket trends" });
    }
  });

  app.post("/api/it/assign", requireAuth, requireITAccount, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const { ticketId, assignedTo } = req.body;

      if (!ticketId) {
        return res.status(400).json({ error: "ticketId is required" });
      }

      // IT accounts can assign tickets across all restaurants (pass null for restaurantId)
      const ticket = await storage.assignTicket(ticketId, null, assignedTo, userId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });

  app.get("/api/it/active-tickets", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see active tickets across all restaurants
      const activeTickets = await storage.getAllActiveTicketsForIT();

      res.json(activeTickets);
    } catch (error) {
      console.error("Error fetching active tickets:", error);
      res.status(500).json({ error: "Failed to fetch active tickets" });
    }
  });

  app.patch("/api/it/tickets/:id/assign", requireAuth, requireITAccount, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const ticketId = req.params.id; // Keep as string for storage layer
      const { staffId } = req.body; // Frontend sends staffId

      // IT accounts can assign tickets across all restaurants (pass null for restaurantId)
      const ticket = await storage.assignTicket(ticketId, null, staffId, userId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Broadcast real-time notification for ticket assignment
      broadcastNotification({
        type: 'ticket:updated',
        restaurantId: ticket.restaurantId,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        ticketStatus: ticket.status,
      });

      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });

  // Client Account Activity Tracking (IT-only)
  app.get("/api/it/client-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see activity data for all client accounts across all restaurants
      const clientAccounts = await storage.getClientAccountsActivity();
      res.json(clientAccounts);
    } catch (error) {
      console.error("Error fetching client accounts activity:", error);
      res.status(500).json({ error: "Failed to fetch client accounts activity" });
    }
  });

  // Performance Tracking (IT-only) - Sales per user across all restaurants
  app.get("/api/it/performance", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Parse date range from query parameters (default: last 30 days)
      const dateRange = req.query.dateRange as string | undefined;
      let startDate: Date;
      let endDate: Date = new Date();
      
      if (dateRange) {
        const daysAgo = parseInt(dateRange, 10);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
      } else {
        // Default: last 30 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      // Query performance data grouped by user
      // Join users with orders via createdBy field, then join restaurants for context
      // Filter orders by date range and only include active users
      const performanceData = await db
        .select({
          userId: users.id,
          username: users.username,
          fullName: users.fullName,
          role: users.role,
          restaurantId: restaurants.id,
          restaurantName: restaurants.name,
          businessType: restaurants.businessType,
          totalSales: sql<string>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
          totalOrders: sql<string>`COUNT(${orders.id})`,
          lastActivityAt: sql<Date>`MAX(${orders.createdAt})`,
        })
        .from(users)
        .innerJoin(orders, eq(orders.createdBy, users.id))
        .innerJoin(restaurants, eq(restaurants.id, users.restaurantId))
        .where(and(
          eq(users.active, true),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        ))
        .groupBy(users.id, users.username, users.fullName, users.role, restaurants.id, restaurants.name, restaurants.businessType)
        .orderBy(desc(sql<string>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`));

      // Calculate avgOrderValue on the fly (can't do in SQL SELECT with aggregate)
      const results = performanceData.map((row) => {
        const totalSales = parseFloat(row.totalSales || "0");
        const totalOrders = parseInt(row.totalOrders || "0", 10);
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Safely convert lastActivityAt to ISO string
        let lastActivityAtISO: string | null = null;
        if (row.lastActivityAt) {
          if (row.lastActivityAt instanceof Date) {
            lastActivityAtISO = row.lastActivityAt.toISOString();
          } else {
            // It's already a string (from database)
            lastActivityAtISO = new Date(row.lastActivityAt).toISOString();
          }
        }

        return {
          userId: row.userId || "",
          username: row.username || "N/A",
          fullName: row.fullName || "N/A",
          role: row.role || "employee",
          restaurantId: row.restaurantId || "",
          restaurantName: row.restaurantName || "N/A",
          businessType: row.businessType || "restaurant",
          totalSales: totalSales.toFixed(2),
          totalOrders,
          avgOrderValue: avgOrderValue.toFixed(2),
          lastActivityAt: lastActivityAtISO,
        };
      });

      res.json(results);
    } catch (error) {
      console.error("Error fetching IT performance data:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  // =====================================================
  // IT ACCOUNT MANAGEMENT ROUTES (IT-only access)
  // =====================================================

  // Get all accounts for IT management (with optional password visibility)
  app.get("/api/it/all-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Get all client accounts (non-IT accounts with restaurantId)
      const allAccounts = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          active: users.active,
          restaurantId: users.restaurantId,
          restaurantName: restaurants.name,
          businessType: restaurants.businessType,
          lastLoginAt: users.lastLoginAt,
          lastActivityAt: users.lastActivityAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(isNotNull(users.restaurantId)) // Only client accounts (not IT)
        .orderBy(desc(users.lastActivityAt));

      res.json(allAccounts);
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Get account password (IT-only, for viewing encrypted passwords)
  app.get("/api/it/accounts/:id/password", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [account] = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
        })
        .from(users)
        .where(eq(users.id, id));

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Return the hashed password - IT can see it's encrypted
      res.json({ 
        id: account.id,
        username: account.username,
        hashedPassword: account.password,
        note: "This is the bcrypt-hashed password. Use the change password feature to set a new password."
      });
    } catch (error) {
      console.error("Error fetching account password:", error);
      res.status(500).json({ error: "Failed to fetch account password" });
    }
  });

  // Change account password (IT-only)
  app.patch("/api/it/accounts/:id/password", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password
      const [updatedUser] = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, id))
        .returning({ id: users.id, username: users.username });

      if (!updatedUser) {
        return res.status(404).json({ error: "Account not found" });
      }

      console.log(`[IT] Password changed for user ${updatedUser.username} by IT account`);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing account password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Enable/Disable account (IT-only)
  app.patch("/api/it/accounts/:id/status", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: "Active status must be a boolean" });
      }

      // Update the active status
      const [updatedUser] = await db
        .update(users)
        .set({ active })
        .where(eq(users.id, id))
        .returning({ id: users.id, username: users.username, active: users.active });

      if (!updatedUser) {
        return res.status(404).json({ error: "Account not found" });
      }

      console.log(`[IT] Account ${updatedUser.username} ${active ? 'enabled' : 'disabled'} by IT account`);
      res.json({ success: true, user: updatedUser, message: `Account ${active ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      console.error("Error updating account status:", error);
      res.status(500).json({ error: "Failed to update account status" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time notifications on specific path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ 
    noServer: true // We'll handle the upgrade ourselves to access session
  });
  wsClients = new Set<WSClient>();
  
  // Handle HTTP upgrade to WebSocket with session authentication
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws/notifications') {
      // Parse session from upgrade request
      sessionParser(request, {} as any, () => {
        const session = (request as any).session;
        
        if (!session || !session.user) {
          console.log('[WebSocket] Upgrade rejected: No valid session');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        const { restaurantId, id: userId } = session.user;
        
        wss.handleUpgrade(request, socket, head, async (ws) => {
          // Fetch user's conversations to enable participant-only message delivery
          let conversationIds = new Set<string>();
          try {
            const conversations = await storage.getConversations(restaurantId, userId);
            conversationIds = new Set(conversations.map((c: any) => c.id));
          } catch (error) {
            console.error('[WebSocket] Failed to load conversations:', error);
          }
          
          const client: WSClient = {
            socket: ws,
            restaurantId,
            userId,
            conversationIds,
          };
          
          console.log(`[WebSocket] Client connected: user=${userId}, restaurant=${restaurantId}, conversations=${conversationIds.size}`);
          wsClients!.add(client);
          
          ws.on('close', () => {
            console.log('[WebSocket] Client disconnected from notifications');
            wsClients?.delete(client);
          });
          
          ws.on('error', (error) => {
            console.error('[WebSocket] Error:', error);
            wsClients?.delete(client);
          });
          
          wss.emit('connection', ws, request);
        });
      });
    } else {
      socket.destroy();
    }
  });

  return httpServer;
}
