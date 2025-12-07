import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { generateZATCAInvoice, generateSubscriptionInvoice, generateMonthlyVatReport, generateInvestorStatementPDF, generateBssAnalysisStatementPDF, generateRefundClearanceInvoice, getBrowser } from "./invoice";
import { PasswordResetMailer } from "./email";
import { sanitizePatchBody } from "./utils";
import { requirePermission, requireAnyPermission, requireAllPermissions, requireAction } from "./middleware/requirePermission";
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
  insertCompanyBillSchema,
  insertBusinessInfoSchema,
  users,
  restaurants,
  orders,
  subscriptionInvoices,
  refundInvoices,
  companyBills,
  businessInfo,
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
  type: 'order:created' | 'order:statusUpdated' | 'chat:message' | 'ticket:created' | 'ticket:updated' | 'ticket:message' | 'settings:updated' | 'menu:updated' | 'permissions:updated' | 'recipe:costUpdated' | 'sales:updated';
  restaurantId: string;
  // Target specific user (for permissions:updated)
  targetUserId?: string;
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
  // Menu update fields
  data?: {
    action: 'created' | 'updated' | 'deleted';
    item?: any;
    itemId?: string;
  };
  // Recipe cost update fields
  updatedRecipeIds?: string[];
  // Sales update fields (for BEP real-time tracking)
  invoiceId?: string;
  invoiceTotal?: string;
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
    
    // For permission updates, only send to the target user
    if (event.type === 'permissions:updated' && event.targetUserId) {
      if (client.userId !== event.targetUserId) {
        return; // Skip clients that are not the target user
      }
    }
    
    client.socket.send(message);
    sentCount++;
  });
  
  console.log(`[WebSocket] Broadcast ${event.type} to ${sentCount} clients in restaurant ${event.restaurantId}`);
}

// Helper function to add a conversation to a user's WebSocket client
// Called when user joins a new conversation so they receive real-time notifications
export function addUserToConversation(userId: string, restaurantId: string, conversationId: string) {
  if (!wsClients) return;
  
  let updatedCount = 0;
  wsClients.forEach((client) => {
    if (client.userId === userId && client.restaurantId === restaurantId && client.socket.readyState === WebSocket.OPEN) {
      client.conversationIds.add(conversationId);
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    console.log(`[WebSocket] Added conversation ${conversationId} to ${updatedCount} client(s) for user ${userId}`);
  }
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

  app.post("/api/branches", requireAuth, requireRestaurant, requireAction('branches', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertBranchSchema.parse({ ...req.body, restaurantId });
      const branch = await storage.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.patch("/api/branches/:id", requireAuth, requireRestaurant, requireAction('branches', 'edit'), async (req, res) => {
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

  app.delete("/api/branches/:id", requireAuth, requireRestaurant, requireAction('branches', 'delete'), async (req, res) => {
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

  app.post("/api/inventory", requireAuth, requireRestaurant, requireAction('inventory', 'add'), async (req, res) => {
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

  app.patch("/api/inventory/sort", requireAuth, requireRestaurant, requireAction('inventory', 'edit'), async (req, res) => {
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

  app.patch("/api/inventory/:id", requireAuth, requireRestaurant, requireAction('inventory', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertInventoryItemSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      
      // Check if price or quantity is being updated - need to update recipe costs (unit price = price / quantity)
      const priceOrQuantityChanged = safeData.price !== undefined || safeData.quantity !== undefined;
      let oldItem: any = null;
      if (priceOrQuantityChanged) {
        oldItem = await storage.getInventoryItem(req.params.id, restaurantId);
      }
      
      const item = await storage.updateInventoryItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // If price or quantity changed, update all recipe costs that use this inventory item
      // Unit price is calculated as: price / quantity
      if (priceOrQuantityChanged && oldItem) {
        const oldUnitPrice = parseFloat(oldItem.quantity) > 0 ? parseFloat(oldItem.price) / parseFloat(oldItem.quantity) : 0;
        const newUnitPrice = parseFloat(item.quantity) > 0 ? parseFloat(item.price) / parseFloat(item.quantity) : 0;
        
        if (oldUnitPrice !== newUnitPrice) {
          const updatedRecipes = await storage.updateRecipeCostsForInventoryItem(req.params.id, restaurantId, newUnitPrice);
          
          // Broadcast recipe cost update notification for real-time updates
          if (updatedRecipes.length > 0) {
            broadcastNotification({
              type: 'recipe:costUpdated',
              restaurantId,
              updatedRecipeIds: updatedRecipes.map(r => r.id),
            });
          }
        }
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, requireRestaurant, requireAction('inventory', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteInventoryItem(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  });

  // Menu - disable caching for real-time updates to POS
  app.get("/api/menu", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const items = await storage.getMenuItems(restaurantId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(items);
  });

  // Menu Stock (based on inventory and recipes) - MUST be before /:id route
  app.get("/api/menu/stock", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const branchId = req.query.branchId as string | undefined;
    const stock = await storage.getMenuItemsStock(restaurantId, branchId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(stock);
  });

  app.get("/api/menu/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const item = await storage.getMenuItem(req.params.id, restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(item);
  });

  app.post("/api/menu", requireAuth, requireRestaurant, requireAction('menu', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertMenuItemSchema.parse({ ...req.body, restaurantId });
      const item = await storage.createMenuItem(data);
      
      // Broadcast menu update to all connected POS clients
      broadcastNotification({
        type: 'menu:updated',
        restaurantId,
        data: { action: 'created', item }
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Menu creation validation error:", error);
      res.status(400).json({ error: "Invalid menu data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/menu/:id", requireAuth, requireRestaurant, requireAction('menu', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, updateMenuItemSchema);
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const item = await storage.updateMenuItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // Broadcast menu update to all connected POS clients
      broadcastNotification({
        type: 'menu:updated',
        restaurantId,
        data: { action: 'updated', item }
      });
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });

  app.delete("/api/menu/:id", requireAuth, requireRestaurant, requireAction('menu', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const menuItemId = req.params.id;
    const success = await storage.deleteMenuItem(menuItemId, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    
    // Broadcast menu update to all connected POS clients
    broadcastNotification({
      type: 'menu:updated',
      restaurantId,
      data: { action: 'deleted', itemId: menuItemId }
    });
    
    res.status(204).send();
  });

  // Add-ons - disable caching for real-time updates to POS
  app.get("/api/addons", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const menuItemId = req.query.menuItemId as string | undefined;
    const addons = await storage.getAddons(restaurantId, menuItemId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(addons);
  });

  app.get("/api/addons/:id", requireAuth, requireRestaurant, requirePermission('menu'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const addon = await storage.getAddon(req.params.id, restaurantId);
    if (!addon) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(addon);
  });

  app.post("/api/addons", requireAuth, requireRestaurant, requireAction('menu', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertAddonSchema.parse({ ...req.body, restaurantId });
      const addon = await storage.createAddon(data);
      res.status(201).json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });

  app.patch("/api/addons/:id", requireAuth, requireRestaurant, requireAction('menu', 'edit'), async (req, res) => {
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

  app.delete("/api/addons/:id", requireAuth, requireRestaurant, requireAction('menu', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteAddon(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/addons/sort-order", requireAuth, requireRestaurant, requireAction('menu', 'edit'), async (req, res) => {
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

  app.post("/api/customers", requireAuth, requireRestaurant, requireAction('customers', 'add'), async (req, res) => {
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

  app.patch("/api/customers/:id", requireAuth, requireRestaurant, requireAction('customers', 'edit'), async (req, res) => {
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

  app.delete("/api/customers/:id", requireAuth, requireRestaurant, requireAction('customers', 'delete'), async (req, res) => {
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

  app.post("/api/licenses", requireAuth, requireRestaurant, requireAction('licenses', 'add'), async (req, res) => {
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

  app.patch("/api/licenses/:id", requireAuth, requireRestaurant, requireAction('licenses', 'edit'), async (req, res) => {
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

  app.delete("/api/licenses/:id", requireAuth, requireRestaurant, requireAction('licenses', 'delete'), async (req, res) => {
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

  app.post("/api/shop/salaries", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
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

  app.patch("/api/shop/salaries/:id", requireAuth, requireRestaurant, requireAction('bills', 'edit'), async (req, res) => {
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

  app.delete("/api/shop/salaries/:id", requireAuth, requireRestaurant, requireAction('bills', 'delete'), async (req, res) => {
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

  app.post("/api/shop/bills", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
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

  app.patch("/api/shop/bills/:id", requireAuth, requireRestaurant, requireAction('bills', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getShopBill(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }
      // Convert ISO date string to Date object if present
      const bodyWithDate = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      };
      // Remove undefined paymentDate to avoid overwriting with undefined
      if (bodyWithDate.paymentDate === undefined) {
        delete bodyWithDate.paymentDate;
      }
      const data = sanitizePatchBody(bodyWithDate, insertShopBillSchema.partial());
      const bill = await storage.updateShopBill(req.params.id, data);
      res.json(bill);
    } catch (error) {
      console.error("[SHOP] Bill update error:", error);
      res.status(400).json({ error: "Invalid bill data" });
    }
  });

  app.delete("/api/shop/bills/:id", requireAuth, requireRestaurant, requireAction('bills', 'delete'), async (req, res) => {
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

  app.patch("/api/shop/bills/:id/archive", requireAuth, requireRestaurant, requireAction('bills', 'edit'), async (req, res) => {
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

  app.post("/api/shop/bills/generate-salaries", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
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

  app.patch("/api/delivery-apps/sort", requireAuth, requireRestaurant, requireAction('deliveryApps', 'edit'), async (req, res) => {
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

  app.post("/api/delivery-apps", requireAuth, requireRestaurant, requireAction('deliveryApps', 'add'), async (req, res) => {
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

  app.patch("/api/delivery-apps/:id", requireAuth, requireRestaurant, requireAction('deliveryApps', 'edit'), async (req, res) => {
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

  app.delete("/api/delivery-apps/:id", requireAuth, requireRestaurant, requireAction('deliveryApps', 'delete'), async (req, res) => {
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
  app.get("/api/investors", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investors = await storage.getInvestors(restaurantId);
      res.json(investors);
    } catch (error) {
      console.error("[INVESTORS] Get investors error:", error);
      res.status(500).json({ error: "Failed to get investors" });
    }
  });

  app.get("/api/investors/:id", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
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

  app.post("/api/investors", requireAuth, requireRestaurant, requireAction('investors', 'add'), async (req, res) => {
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

  app.patch("/api/investors/:id", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
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

  app.delete("/api/investors/:id", requireAuth, requireRestaurant, requireAction('investors', 'delete'), async (req, res) => {
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

  // Investor Statement PDF Generation
  app.get("/api/investors/:id/statement", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Get investor
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      
      // Get restaurant settings for company info
      const settings = await storage.getSettings(restaurantId);
      if (!settings) {
        return res.status(400).json({ error: "Restaurant settings not found" });
      }
      
      // Get financial data for calculations
      const transactions = await storage.getTransactions({ restaurantId });
      const orders = await storage.getOrders({ restaurantId });
      const menuItems = await storage.getMenuItems(restaurantId);
      const recipes = await storage.getRecipes(restaurantId);
      const salaries = await storage.getSalaries(restaurantId);
      const shopBills = await storage.getShopBills(restaurantId);
      
      let totalRevenue = 0;
      let totalCOGS = 0;
      let totalSalaries = 0;
      let totalBills = 0;
      let recipeName = '';
      
      // Filter orders to only include finalized/completed orders (exclude cancelled and pending)
      const validOrderStatuses = ['Completed', 'Ready', 'Preparing', 'Paid'];
      const finalizedOrders = orders.filter(order => validOrderStatuses.includes(order.status));
      
      // Check if this is a recipe-based investor
      if (investor.investorType === 'recipe' && investor.recipeId) {
        // Recipe investor: Calculate profit from specific recipe sales only
        const investorRecipe = recipes.find(r => r.id === investor.recipeId);
        recipeName = investorRecipe?.name || '';
        
        // Find menu items linked to this recipe
        const recipeMenuItems = menuItems.filter(m => m.recipeId === investor.recipeId);
        const recipeMenuItemIds = recipeMenuItems.map(m => m.id);
        
        // Calculate revenue and COGS from finalized orders containing this recipe's menu items
        finalizedOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (recipeMenuItemIds.includes(item.id)) {
                // Revenue from this recipe's items (using basePrice for VAT-excluded calculations)
                const menuItem = recipeMenuItems.find(m => m.id === item.id);
                if (menuItem) {
                  totalRevenue += parseFloat(menuItem.basePrice || "0") * (item.quantity || 1);
                  
                  // COGS for this recipe (applying portionSize for accurate cost calculation)
                  if (investorRecipe) {
                    const recipeCost = parseFloat(investorRecipe.cost || "0");
                    const portionSize = parseFloat(menuItem.portionSize || "1");
                    const itemCost = recipeCost * portionSize;
                    totalCOGS += itemCost * (item.quantity || 1);
                  }
                }
              }
            });
          }
        });
        
        // Recipe investors don't share in salaries/bills costs - just recipe net profit
        totalSalaries = 0;
        totalBills = 0;
      } else {
        // Money investor: Calculate from total business net profit
        totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total || "0"), 0);
        
        // Calculate COGS from finalized orders only
        finalizedOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const menuItem = menuItems.find(m => m.id === item.id);
              if (menuItem && menuItem.recipeId) {
                const recipe = recipes.find(r => r.id === menuItem.recipeId);
                if (recipe) {
                  const recipeCost = parseFloat(recipe.cost || "0");
                  const portionSize = parseFloat(menuItem.portionSize || "1");
                  const itemCost = recipeCost * portionSize;
                  totalCOGS += itemCost * (item.quantity || 1);
                }
              }
            });
          }
        });
        
        // Calculate total salaries and bills
        totalSalaries = salaries.reduce((sum: number, s) => sum + parseFloat(s.amount || "0"), 0);
        totalBills = shopBills.reduce((sum: number, b) => sum + parseFloat(b.amount || "0"), 0);
      }
      
      // Net profit
      const netProfit = totalRevenue - totalCOGS - totalSalaries - totalBills;
      
      // Calculate investor's earnings based on interest percentage
      // Clamp to 0 if net profit is negative (no receivables when in loss)
      const interestPercentage = parseFloat(investor.interestPercentage || "0");
      const calculatedEarnings = (netProfit * interestPercentage) / 100;
      const monthlyEarnings = Math.max(0, calculatedEarnings);
      
      // Statement period (current month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Generate PDF
      const pdfBuffer = await generateInvestorStatementPDF({
        investor: {
          id: investor.id,
          name: investor.name,
          amountInvested: investor.amountInvested,
          interestPercentage: investor.interestPercentage,
          notes: investor.notes,
          createdAt: investor.createdAt,
          investorType: investor.investorType || 'money',
          recipeName: recipeName,
        },
        companyName: settings.restaurantName || 'Company',
        companyVAT: settings.vatNumber || '',
        companyAddress: settings.address || '',
        companyPhone: settings.phone || '',
        companyEmail: settings.email || '',
        netProfit,
        monthlyEarnings,
        totalRevenue,
        totalCOGS,
        totalSalaries,
        totalBills,
        statementDate: now,
        periodStart,
        periodEnd,
        logoPath: settings.logoPath || undefined,
      });
      
      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="investor-statement-${investor.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("[INVESTORS] Statement generation error:", error);
      res.status(500).json({ error: "Failed to generate investor statement" });
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

  app.post("/api/recipes", requireAuth, requireRestaurant, requireAction('recipes', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertRecipeSchema.parse({ ...req.body, restaurantId });
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.patch("/api/recipes/:id", requireAuth, requireRestaurant, requireAction('recipes', 'edit'), async (req, res) => {
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

  app.patch("/api/recipes/sort", requireAuth, requireRestaurant, requireAction('recipes', 'edit'), async (req, res) => {
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

  app.delete("/api/recipes/:id", requireAuth, requireRestaurant, requireAction('recipes', 'delete'), async (req, res) => {
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

  app.post("/api/orders", requireAuth, requireRestaurant, requireAction('orders', 'add'), async (req, res) => {
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

  app.patch("/api/orders/:id", requireAuth, requireRestaurant, requireAction('orders', 'edit'), async (req, res) => {
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

  app.patch("/api/settings", requireAuth, requireRestaurant, requireAction('settings', 'edit'), async (req, res) => {
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
  app.post("/api/settings/logo", requireAuth, requireRestaurant, requireAction('settings', 'edit'), uploadLogo.single('logo'), async (req, res) => {
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
  app.delete("/api/settings/logo", requireAuth, requireRestaurant, requireAction('settings', 'edit'), async (req, res) => {
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

  app.post("/api/procurement", requireAuth, requireRestaurant, requireAction('procurement', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertProcurementSchema.omit({ restaurantId: true }).parse(req.body);
      const procurement = await storage.createProcurement({ ...data, restaurantId });
      res.status(201).json(procurement);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.patch("/api/procurement/:id", requireAuth, requireRestaurant, requireAction('procurement', 'edit'), async (req, res) => {
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

  app.delete("/api/procurement/:id", requireAuth, requireRestaurant, requireAction('procurement', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const success = await storage.deleteProcurement(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.status(204).send();
  });

  // POS - Generate Invoice (redirects to main invoice creation endpoint)
  app.post("/api/pos/generate-invoice", requireAuth, requireRestaurant, requireAction('pos', 'add'), async (req, res) => {
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

      // Broadcast sales update for real-time BEP tracking
      broadcastNotification({
        type: 'sales:updated',
        restaurantId,
        invoiceId: createdInvoice.id,
        invoiceTotal: order.total,
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
        subscriptionStatus: "active" as const, // Activated immediately upon signup
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

        // Fetch business info for invoice
        const businessInfo = await storage.getBusinessInfo();

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
          businessInfo,
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
        investors: true,
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

  app.patch("/api/users/:id", requireAuth, requireRestaurant, requireAction('users', 'edit'), async (req, res) => {
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

      // Convert date strings to Date objects for timestamp fields
      const dateFields = ['hireDate', 'probationEndDate', 'visaExpiryDate', 'ticketDate', 'lastReviewDate'];
      for (const field of dateFields) {
        if (updateData[field] !== undefined) {
          if (updateData[field] === null || updateData[field] === '') {
            updateData[field] = null;
          } else if (typeof updateData[field] === 'string') {
            updateData[field] = new Date(updateData[field]);
          }
        }
      }

      const user = await storage.updateUser(req.params.id, restaurantId, updateData);
      if (!user) {
        console.log("[USER UPDATE] User not found after update");
        return res.status(404).json({ error: "User not found" });
      }

      console.log("[USER UPDATE] User updated successfully. New permissions:", JSON.stringify(user.permissions, null, 2));
      
      // Broadcast permission update to the target user for real-time refresh
      broadcastNotification({
        type: 'permissions:updated',
        restaurantId: restaurantId,
        targetUserId: req.params.id,
      });
      
      const { password: _p, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRestaurant, requireAction('users', 'delete'), async (req, res) => {
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
    const { reason } = req.body as { reason?: "mistake" | "client_request" };
    
    try {
      const user = await storage.getUser(req.session.user!.id, restaurantId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const restaurant = await storage.getRestaurant(user.restaurantId!);
      if (!restaurant) {
        return res.status(400).json({ error: "Restaurant not found" });
      }
      
      // Allow cancelling both active and inactive subscriptions
      if (restaurant.subscriptionStatus === 'cancelled') {
        return res.status(400).json({ error: "Subscription is already cancelled" });
      }

      let pdfBase64: string | null = null;

      // Only generate refund invoice for ACTIVE subscriptions with valid data
      // Inactive subscriptions have nothing to refund
      if (restaurant.subscriptionStatus === 'active' && restaurant.subscriptionPlan && restaurant.subscriptionStartDate) {
        const businessInfoResult = await db.select().from(businessInfo).limit(1);
        const bi = businessInfoResult[0] || null;

        const subscriptionStartDate = new Date(restaurant.subscriptionStartDate);
        const cancellationDate = new Date();
        
        const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
        const monthsUsed = Math.ceil((cancellationDate.getTime() - subscriptionStartDate.getTime()) / msPerMonth);

        let yearlyPrice = 1990;
        if (restaurant.subscriptionPlan === "premium") yearlyPrice = 2990;
        if (restaurant.subscriptionPlan === "enterprise") yearlyPrice = 4990;
        
        const monthlyRate = 199;
        const chargedAmount = monthlyRate * monthsUsed;
        
        // For "mistake" cancellations, refund is 0. For "client_request", calculate actual refund
        const refundAmount = reason === "client_request" 
          ? Math.max(0, yearlyPrice - chargedAmount)
          : 0;

        // Generate serial number
        const currentYear = new Date().getFullYear();
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(refundInvoices)
          .where(sql`EXTRACT(YEAR FROM ${refundInvoices.createdAt}) = ${currentYear}`);
        const sequenceNumber = (countResult[0]?.count || 0) + 1;
        const serialNumber = `RC-${currentYear}-${String(sequenceNumber).padStart(6, '0')}`;

        try {
          const pdfBuffer = await generateRefundClearanceInvoice({
            serialNumber,
            clientName: user.fullName || "Unknown",
            clientEmail: user.email || "unknown@email.com",
            restaurantName: restaurant.name,
            taxNumber: restaurant.taxNumber,
            commercialRegistration: restaurant.commercialRegistration,
            subscriptionPlan: restaurant.subscriptionPlan,
            subscriptionStartDate,
            cancellationDate,
            monthsUsed,
            originalPrice: yearlyPrice,
            monthlyRate,
            chargedAmount,
            refundAmount,
            cancellationReason: reason, // Pass reason to invoice generator
            businessInfo: bi ? {
              companyNameEn: bi.companyNameEn,
              companyNameAr: bi.companyNameAr,
              vatNumber: bi.vatNumber,
              crNumber: bi.crNumber,
              email: bi.email,
              phone: bi.phone,
              addressEn: bi.addressEn,
              addressAr: bi.addressAr,
            } : null,
          });
          pdfBase64 = pdfBuffer.toString('base64');

          // Save refund invoice to database
          await db.insert(refundInvoices).values({
            restaurantId,
            serialNumber,
            clientName: user.fullName || "Unknown",
            clientEmail: user.email || "unknown@email.com",
            restaurantName: restaurant.name,
            subscriptionPlan: restaurant.subscriptionPlan,
            subscriptionStartDate,
            cancellationDate,
            monthsUsed,
            originalPrice: yearlyPrice.toString(),
            monthlyRate: monthlyRate.toString(),
            chargedAmount: chargedAmount.toString(),
            refundAmount: refundAmount.toString(),
            pdfData: pdfBase64,
          });
          console.log(`[Client] Refund invoice saved: ${serialNumber} for restaurant ${restaurantId}, reason: ${reason || 'unspecified'}`);
        } catch (pdfError) {
          console.error("Failed to generate refund clearance PDF:", pdfError);
        }
      }

      const updatedUser = await storage.cancelSubscription(req.session.user!.id, restaurantId, reason);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to cancel subscription" });
      }

      res.json({ 
        success: true, 
        pdfBase64,
        message: pdfBase64 ? 'Subscription cancelled with refund clearance' : 'Subscription cancelled'
      });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      res.status(500).json({ 
        error: "Failed to cancel subscription", 
        details: error?.message || String(error)
      });
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

  // Delivery App Financial Breakdown
  app.get("/api/analytics/delivery-breakdown", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      
      // Get all delivery apps and orders
      const deliveryApps = await storage.getDeliveryApps(restaurantId);
      const orders = await storage.getOrders({ restaurantId });
      
      // Filter orders by year
      const yearOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getFullYear() === parseInt(year);
      });
      
      // Calculate subsidy for an order based on delivery app's tier structure
      const calculateSubsidy = (orderTotal: number, subsidyTiers: Array<{ minAmount: number; maxAmount: number | null; subsidy: number }>) => {
        if (!subsidyTiers || subsidyTiers.length === 0) return 0;
        for (const tier of subsidyTiers) {
          if (orderTotal >= tier.minAmount && (tier.maxAmount === null || orderTotal <= tier.maxAmount)) {
            return tier.subsidy;
          }
        }
        return 0;
      };
      
      // Calculate breakdown for each delivery app
      const breakdown = deliveryApps.map(app => {
        const appOrders = yearOrders.filter(o => o.deliveryAppId === app.id);
        const orderCount = appOrders.length;
        const sales = appOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        const revenue = sales; // Revenue equals sales for delivery apps
        
        // Calculate commission (percentage of sales)
        const commissionRate = parseFloat(app.commission) / 100;
        const commission = sales * commissionRate;
        
        // Calculate banking fees (percentage of sales)
        const bankingRate = parseFloat(app.bankingFees) / 100;
        const banking = sales * bankingRate;
        
        // Calculate total subsidy
        const subsidy = appOrders.reduce((sum, o) => {
          const orderTotal = parseFloat(o.total);
          return sum + calculateSubsidy(orderTotal, app.subsidyTiers as any);
        }, 0);
        
        // Calculate POS fees (fixed per order or total)
        const posFees = parseFloat(app.posFees) * orderCount;
        
        // Net Earnings = Revenue - Commission - Banking - POS Fees + Subsidy
        const netEarnings = revenue - commission - banking - posFees + subsidy;
        
        return {
          id: app.id,
          name: app.name,
          orders: orderCount,
          sales: parseFloat(sales.toFixed(2)),
          revenue: parseFloat(revenue.toFixed(2)),
          commission: parseFloat(commission.toFixed(2)),
          banking: parseFloat(banking.toFixed(2)),
          subsidy: parseFloat(subsidy.toFixed(2)),
          posFees: parseFloat(posFees.toFixed(2)),
          netEarnings: parseFloat(netEarnings.toFixed(2)),
          commissionRate: parseFloat(app.commission),
          bankingRate: parseFloat(app.bankingFees),
          active: app.active,
        };
      });
      
      // Calculate totals
      const totals = {
        orders: breakdown.reduce((sum, b) => sum + b.orders, 0),
        sales: breakdown.reduce((sum, b) => sum + b.sales, 0),
        revenue: breakdown.reduce((sum, b) => sum + b.revenue, 0),
        commission: breakdown.reduce((sum, b) => sum + b.commission, 0),
        banking: breakdown.reduce((sum, b) => sum + b.banking, 0),
        subsidy: breakdown.reduce((sum, b) => sum + b.subsidy, 0),
        posFees: breakdown.reduce((sum, b) => sum + b.posFees, 0),
        netEarnings: breakdown.reduce((sum, b) => sum + b.netEarnings, 0),
      };
      
      res.json({
        breakdown,
        totals,
        year,
      });
    } catch (error) {
      console.error("Delivery breakdown error:", error);
      res.status(500).json({ error: "Failed to calculate delivery breakdown" });
    }
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
      
      // Broadcast sales update for real-time BEP tracking
      broadcastNotification({
        type: 'sales:updated',
        restaurantId,
        invoiceId: invoice.id,
        invoiceTotal: invoice.total,
      });
      
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

      // Broadcast sales update for real-time BEP tracking
      broadcastNotification({
        type: 'sales:updated',
        restaurantId,
        invoiceId: createdInvoice.id,
        invoiceTotal: order.total,
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
  app.get("/api/export/financial", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
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
  app.get("/api/export/financial-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
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

  // Export Expenses PDF
  app.get("/api/export/expenses-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      
      const settings = await storage.getSettings(restaurantId);
      
      // Fetch all required data
      const bills = await storage.getShopBills(restaurantId);
      const inventory = await storage.getInventoryItems(restaurantId);
      const transactions = await storage.getTransactions({ restaurantId });
      
      // Filter by year
      const yearBills = bills.filter(b => {
        const paymentDate = new Date(b.paymentDate);
        return paymentDate.getFullYear() === parseInt(year);
      });
      
      const yearTransactions = transactions.filter(t => 
        new Date(t.createdAt).getFullYear() === parseInt(year)
      );
      
      // Calculate inventory value
      const inventoryValue = inventory.reduce((sum, item) => {
        return sum + parseFloat(item.price) * parseFloat(item.quantity);
      }, 0);
      
      // Calculate bills totals
      const totalBillsAmount = yearBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const paidBillsAmount = yearBills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const pendingBillsAmount = yearBills
        .filter(b => b.status !== 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      
      // Aggregate bills by billType
      const categoryMap = new Map<string, number>();
      yearBills.forEach(b => {
        const cat = b.billType || 'other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + parseFloat(b.amount));
      });
      const billsByCategory = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      
      // Calculate monthly operating expenses (exclude one-time and foundational)
      const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
        const monthBills = yearBills.filter(b => {
          const paymentDate = new Date(b.paymentDate);
          return paymentDate.getMonth() === i && 
                 b.paymentPeriod !== 'one-time' && 
                 b.billType !== 'foundational';
        });
        const amount = monthBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        return {
          month: new Date(parseInt(year), i).toLocaleString('default', { month: 'long' }),
          amount
        };
      });
      
      // Calculate BEP data
      const totalRevenue = yearTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
      const unitsSold = yearTransactions.reduce((sum, t) => {
        return sum + (t.itemCount || 1);
      }, 0);
      
      // Fixed costs exclude foundational bills (one-time setup costs)
      const fixedCosts = yearBills
        .filter(b => b.billType !== 'foundational')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const variableCostsPerUnit = unitsSold > 0 ? inventoryValue / unitsSold : 0;
      const sellingPricePerUnit = unitsSold > 0 ? totalRevenue / unitsSold : 0;
      const contributionMarginPerUnit = sellingPricePerUnit - variableCostsPerUnit;
      const contributionMarginTotal = unitsSold * contributionMarginPerUnit;
      const breakEvenUnits = contributionMarginPerUnit > 0 ? fixedCosts / contributionMarginPerUnit : 0;
      const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;
      const marginOfSafety = totalRevenue > 0 && totalRevenue > breakEvenRevenue 
        ? ((totalRevenue - breakEvenRevenue) / totalRevenue) * 100 
        : 0;
      const isProfitable = totalRevenue >= breakEvenRevenue;
      
      const totalExpenses = totalBillsAmount + inventoryValue;
      
      const { generateExpensesPDF } = await import('./invoice.js');
      
      const pdfBuffer = await generateExpensesPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        totalExpenses,
        inventoryValue,
        totalBillsAmount,
        paidBillsAmount,
        pendingBillsAmount,
        billsByCategory,
        monthlyExpenses,
        breakEvenAnalysis: {
          fixedCosts,
          variableCostsPerUnit,
          sellingPricePerUnit,
          contributionMarginPerUnit,
          contributionMarginTotal,
          breakEvenUnits,
          breakEvenRevenue,
          marginOfSafety,
          currentRevenue: totalRevenue,
          unitsSold,
          isProfitable
        }
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=expenses-report-${year}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Expenses PDF export error:", error);
      res.status(500).json({ error: "Failed to export expenses report" });
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
  app.post("/api/menu/upload-image", requireAuth, requireRestaurant, requireAction('menu', 'edit'), uploadMenuImage.single('image'), async (req, res) => {
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

  // Configure multer for license file uploads (disk storage)
  const licenseFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'license-files');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'license-' + uniqueSuffix + ext);
    }
  });

  const uploadLicenseFile = multer({
    storage: licenseFileStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for license documents
    fileFilter: function (req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDF documents are allowed!'));
    }
  });

  // Upload license file
  app.post("/api/licenses/upload-file", requireAuth, requireRestaurant, requireAction('licenses', 'add'), uploadLicenseFile.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Return authenticated download URL instead of public static URL
      const fileUrl = `/api/licenses/files/${req.file.filename}`;
      const originalName = req.file.originalname;
      res.json({ fileUrl, originalName });
    } catch (error) {
      console.error("License file upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Authenticated endpoint to download license files
  // SECURITY: Requires authentication and checks license permission
  app.get('/api/licenses/files/:filename', requireAuth, requireRestaurant, requireAction('licenses', 'view'), async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Validate filename format to prevent path traversal
      // Only allow alphanumeric, hyphens, underscores, and single dots
      if (!/^license-[\w-]+\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename format' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'license-files', filename);
      
      // Verify file exists on disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'License file not found' });
      }
      
      // Determine content type based on extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(filePath);
    } catch (error) {
      console.error('License file download error:', error);
      res.status(500).json({ error: 'Failed to download license file' });
    }
  });

  // Configure multer for bill invoice uploads (IT-only, disk storage)
  const billInvoiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'bill-invoices');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'bill-' + uniqueSuffix + ext);
    }
  });

  const uploadBillInvoice = multer({
    storage: billInvoiceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype === 'application/pdf';
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF files are allowed for bill invoices!'));
    }
  });

  // Authenticated endpoint to download bill invoice files (IT-only)
  app.get('/api/it/bill-invoices/:filename', requireAuth, requireITAccount, async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Validate filename format to prevent path traversal
      if (!/^bill-[\w-]+\.pdf$/i.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename format' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'bill-invoices', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Bill invoice file not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(filePath);
    } catch (error) {
      console.error('Bill invoice download error:', error);
      res.status(500).json({ error: 'Failed to download bill invoice' });
    }
  });

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
  app.get("/api/chat/conversations", requireAuth, requireRestaurant, async (req, res) => {
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
  app.get("/api/chat/conversations/:id", requireAuth, requireRestaurant, async (req, res) => {
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
  app.post("/api/chat/channels", requireAuth, requireRestaurant, async (req, res) => {
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
      
      // Update creator's WebSocket client to receive notifications for new channel
      addUserToConversation(userId, restaurantId, conversation.id);
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Create channel error:", error);
      res.status(500).json({ error: "Failed to create channel" });
    }
  });

  // Get or create direct conversation between two users
  app.post("/api/chat/direct", requireAuth, requireRestaurant, async (req, res) => {
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
      
      // Update both users' WebSocket clients to receive notifications for this DM
      addUserToConversation(userId, restaurantId, conversation.id);
      addUserToConversation(otherUserId, restaurantId, conversation.id);
      
      res.json(conversation);
    } catch (error) {
      console.error("Get/create DM error:", error);
      res.status(500).json({ error: "Failed to get or create direct conversation" });
    }
  });

  // Get messages in a conversation
  app.get("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, async (req, res) => {
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
  app.post("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, async (req, res) => {
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
  app.get("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, async (req, res) => {
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
  app.get("/api/chat/notification-settings", requireAuth, requireRestaurant, async (req, res) => {
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
  app.patch("/api/chat/notification-settings", requireAuth, requireRestaurant, async (req, res) => {
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
  app.post("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, async (req, res) => {
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
      
      // Update new member's WebSocket client to receive notifications for this channel
      addUserToConversation(newUserId, restaurantId, conversationId);
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Mark conversation as read
  app.post("/api/chat/conversations/:id/read", requireAuth, requireRestaurant, async (req, res) => {
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
  app.get("/api/chat/unread-count", requireAuth, requireRestaurant, async (req, res) => {
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
  app.get("/api/chat/users", requireAuth, requireRestaurant, async (req, res) => {
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
  app.post("/api/import/inventory", requireAuth, requireRestaurant, requireAction('inventory', 'add'), upload.single('file'), async (req, res) => {
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
          // Support multiple column name variations (Excel exports may use different headers)
          const name = row.name || row.Name || row['Item Name'] || row['item name'];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          await storage.createInventoryItem({
            restaurantId: req.session.user!.restaurantId!,
            name: name,
            category: row.category || row.Category || '',
            quantity: String(row.quantity || row.Quantity || 0),
            unit: row.unit || row.Unit || '',
            supplier: row.supplier || row.Supplier || '',
            status: row.status || row.Status || "In Stock",
            branchId: row.branchId || row.BranchId || null,
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
  app.post("/api/import/menu", requireAuth, requireRestaurant, requireAction('menu', 'add'), upload.single('file'), async (req, res) => {
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
          // Support multiple column name variations (Excel exports may use different headers)
          const name = row.name || row.Name || row['Item Name'] || row['item name'];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          
          const category = row.category || row.Category || '';
          const basePrice = row.basePrice || row.BasePrice || row['Base Price'] || row['base_price'] || '0';
          const price = row.price || row.Price || row['Price (SAR)'] || '0';
          const vatAmount = row.vatAmount || row.VatAmount || row['VAT Amount'] || row['vat_amount'] || '0';
          const description = row.description || row.Description || '';
          const available = row.available !== undefined ? Boolean(row.available) : 
                           row.Available !== undefined ? Boolean(row.Available) : true;
          const imageUrl = row.imageUrl || row.ImageUrl || row['Image URL'] || null;
          const discount = row.discount || row.Discount || '0';
          
          await storage.createMenuItem({
            restaurantId: req.session.user!.restaurantId!,
            name,
            category,
            basePrice: String(basePrice),
            price: String(price),
            vatAmount: String(vatAmount),
            description,
            available,
            imageUrl,
            discount: String(discount),
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
  app.post("/api/import/recipes", requireAuth, requireRestaurant, requireAction('recipes', 'add'), upload.single('file'), async (req, res) => {
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
          // Support multiple column name variations (Excel exports may use different headers)
          const name = row.name || row.Name || row['Recipe Name'] || row['recipe name'];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          
          const prepTime = row.prepTime || row.PrepTime || row['Prep Time'] || row['prep_time'] || row['Preparation Time'] || '';
          const cookTime = row.cookTime || row.CookTime || row['Cook Time'] || row['cook_time'] || row['Cooking Time'] || '';
          const servings = row.servings || row.Servings || row['Servings'] || row['Number of Servings'] || 1;
          const cost = row.cost || row.Cost || row['Cost'] || row['Recipe Cost'] || '0';
          
          // Handle ingredients - can be JSON string, array, or text
          let ingredients = [];
          const rawIngredients = row.ingredients || row.Ingredients || row['Ingredients'];
          if (rawIngredients) {
            if (typeof rawIngredients === 'string') {
              try {
                ingredients = JSON.parse(rawIngredients);
              } catch {
                // If not valid JSON, treat as comma-separated or single ingredient
                ingredients = rawIngredients.split(',').map((i: string) => i.trim()).filter(Boolean);
              }
            } else if (Array.isArray(rawIngredients)) {
              ingredients = rawIngredients;
            }
          }
          
          // Handle steps - can be JSON string, array, or text
          let steps = [];
          const rawSteps = row.steps || row.Steps || row['Steps'] || row['Instructions'];
          if (rawSteps) {
            if (typeof rawSteps === 'string') {
              try {
                steps = JSON.parse(rawSteps);
              } catch {
                // If not valid JSON, treat as newline or numbered list
                steps = rawSteps.split(/\n|\d+\.\s*/).map((s: string) => s.trim()).filter(Boolean);
              }
            } else if (Array.isArray(rawSteps)) {
              steps = rawSteps;
            }
          }
          
          await storage.createRecipe({
            restaurantId: req.session.user!.restaurantId!,
            name,
            prepTime: String(prepTime),
            cookTime: String(cookTime),
            servings: Number(servings),
            cost: String(cost),
            ingredients,
            steps,
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
  app.post("/api/import/branches", requireAuth, requireRestaurant, requireAction('branches', 'add'), upload.single('file'), async (req, res) => {
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
  app.post("/api/vat-reports/generate", requireAuth, requireRestaurant, requireAction('reports', 'add'), async (req, res) => {
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
      // Filter out accounts from cancelled restaurants
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
          subscriptionStatus: restaurants.subscriptionStatus,
          lastLoginAt: users.lastLoginAt,
          lastActivityAt: users.lastActivityAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(and(
          isNotNull(users.restaurantId),
          sql`${restaurants.subscriptionStatus} != 'cancelled' OR ${restaurants.subscriptionStatus} IS NULL`
        ))
        .orderBy(desc(users.lastActivityAt));

      res.json(allAccounts);
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Get archived (cancelled) accounts for IT management
  app.get("/api/it/archived-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Get all cancelled accounts with their details
      const archivedAccounts = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          restaurantId: users.restaurantId,
          restaurantName: restaurants.name,
          businessType: restaurants.businessType,
          subscriptionPlan: restaurants.subscriptionPlan,
          subscriptionStartDate: restaurants.subscriptionStartDate,
          subscriptionEndDate: restaurants.subscriptionEndDate,
          subscriptionCancelledAt: restaurants.subscriptionCancelledAt,
          cancellationReason: restaurants.cancellationReason,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(and(
          isNotNull(users.restaurantId),
          eq(restaurants.subscriptionStatus, 'cancelled')
        ))
        .orderBy(desc(restaurants.subscriptionCancelledAt));

      // Get refund invoices for each archived account
      const archivedWithRefunds = await Promise.all(
        archivedAccounts.map(async (account) => {
          if (!account.restaurantId) return { ...account, refundInvoice: null };
          
          const [refundInvoice] = await db
            .select({
              id: refundInvoices.id,
              serialNumber: refundInvoices.serialNumber,
              refundAmount: refundInvoices.refundAmount,
              monthsUsed: refundInvoices.monthsUsed,
              originalPrice: refundInvoices.originalPrice,
              chargedAmount: refundInvoices.chargedAmount,
              cancellationDate: refundInvoices.cancellationDate,
              pdfData: refundInvoices.pdfData,
            })
            .from(refundInvoices)
            .where(eq(refundInvoices.restaurantId, account.restaurantId))
            .orderBy(desc(refundInvoices.createdAt))
            .limit(1);
          
          return { ...account, refundInvoice: refundInvoice || null };
        })
      );

      res.json(archivedWithRefunds);
    } catch (error) {
      console.error("Error fetching archived accounts:", error);
      res.status(500).json({ error: "Failed to fetch archived accounts" });
    }
  });

  // Generate refund invoice for a cancelled account that doesn't have one
  app.post("/api/it/archived-accounts/:restaurantId/generate-refund-invoice", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { reason } = req.body; // 'mistake' or 'client_request'

      // Get the restaurant details
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      if (restaurant.subscriptionStatus !== 'cancelled') {
        return res.status(400).json({ error: "Restaurant subscription is not cancelled" });
      }

      // Check if refund invoice already exists
      const existingInvoice = await db
        .select()
        .from(refundInvoices)
        .where(eq(refundInvoices.restaurantId, restaurantId))
        .limit(1);

      if (existingInvoice.length > 0) {
        return res.status(400).json({ error: "Refund invoice already exists for this account" });
      }

      // Get admin user for this restaurant
      const [adminUser] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.restaurantId, restaurantId),
          eq(users.role, 'admin')
        ));

      // Get business info for the invoice
      const businessInfoResult = await db.select().from(businessInfo).limit(1);
      const bi = businessInfoResult[0] || null;

      // Calculate refund details
      const subscriptionStartDate = restaurant.subscriptionStartDate 
        ? new Date(restaurant.subscriptionStartDate) 
        : new Date(restaurant.createdAt || new Date());
      const cancellationDate = restaurant.subscriptionCancelledAt 
        ? new Date(restaurant.subscriptionCancelledAt) 
        : new Date();
      
      const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
      const monthsUsed = Math.max(1, Math.ceil((cancellationDate.getTime() - subscriptionStartDate.getTime()) / msPerMonth));

      let yearlyPrice = 1990;
      if (restaurant.subscriptionPlan === "premium") yearlyPrice = 2990;
      if (restaurant.subscriptionPlan === "enterprise") yearlyPrice = 4990;
      
      const monthlyRate = 199;
      const chargedAmount = monthlyRate * monthsUsed;
      
      // Determine cancellation reason
      const cancellationReason = reason || restaurant.cancellationReason || 'mistake';
      const refundAmount = cancellationReason === "client_request" 
        ? Math.max(0, yearlyPrice - chargedAmount)
        : 0;

      // Update restaurant with cancellation reason if not set
      if (!restaurant.cancellationReason) {
        await db
          .update(restaurants)
          .set({ cancellationReason })
          .where(eq(restaurants.id, restaurantId));
      }

      // Generate serial number
      const currentYear = new Date().getFullYear();
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(refundInvoices)
        .where(sql`EXTRACT(YEAR FROM ${refundInvoices.createdAt}) = ${currentYear}`);
      const sequenceNumber = (countResult[0]?.count || 0) + 1;
      const serialNumber = `RC-${currentYear}-${String(sequenceNumber).padStart(6, '0')}`;

      // Generate PDF
      const pdfBuffer = await generateRefundClearanceInvoice({
        serialNumber,
        clientName: adminUser?.fullName || "Unknown",
        clientEmail: adminUser?.email || "unknown@email.com",
        restaurantName: restaurant.name,
        taxNumber: restaurant.taxNumber,
        commercialRegistration: restaurant.commercialRegistration,
        subscriptionPlan: restaurant.subscriptionPlan || 'monthly',
        subscriptionStartDate,
        cancellationDate,
        monthsUsed,
        originalPrice: yearlyPrice,
        monthlyRate,
        chargedAmount,
        refundAmount,
        cancellationReason: cancellationReason as "mistake" | "client_request",
        businessInfo: bi ? {
          companyNameEn: bi.companyNameEn,
          companyNameAr: bi.companyNameAr,
          vatNumber: bi.vatNumber,
          crNumber: bi.crNumber,
          email: bi.email,
          phone: bi.phone,
          addressEn: bi.addressEn,
          addressAr: bi.addressAr,
        } : null,
      });
      const pdfBase64 = pdfBuffer.toString('base64');

      // Save refund invoice to database
      const [newInvoice] = await db.insert(refundInvoices).values({
        restaurantId,
        serialNumber,
        clientName: adminUser?.fullName || "Unknown",
        clientEmail: adminUser?.email || "unknown@email.com",
        restaurantName: restaurant.name,
        subscriptionPlan: restaurant.subscriptionPlan || 'monthly',
        subscriptionStartDate,
        cancellationDate,
        monthsUsed,
        originalPrice: yearlyPrice.toString(),
        monthlyRate: monthlyRate.toString(),
        chargedAmount: chargedAmount.toString(),
        refundAmount: refundAmount.toString(),
        pdfData: pdfBase64,
      }).returning();

      console.log(`[IT] Generated refund invoice ${serialNumber} for restaurant ${restaurantId}, reason: ${cancellationReason}`);

      res.json({ 
        success: true, 
        invoice: newInvoice,
        pdfBase64,
        message: `Refund invoice generated successfully` 
      });
    } catch (error) {
      console.error("Error generating refund invoice:", error);
      res.status(500).json({ error: "Failed to generate refund invoice" });
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

  // ==========================================
  // IT Business Management Routes
  // ==========================================

  // Get all clients with subscription details (IT-only) - exclude cancelled accounts (those appear in Archive)
  app.get("/api/it/business-management/clients", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Get all restaurants with their admin user details (excluding cancelled subscriptions)
      const clients = await db
        .select({
          restaurantId: restaurants.id,
          restaurantName: restaurants.name,
          businessType: restaurants.businessType,
          type: restaurants.type,
          subscriptionPlan: restaurants.subscriptionPlan,
          subscriptionStatus: restaurants.subscriptionStatus,
          subscriptionStartDate: restaurants.subscriptionStartDate,
          subscriptionEndDate: restaurants.subscriptionEndDate,
          branchesCount: restaurants.branchesCount,
          nationalId: restaurants.nationalId,
          taxNumber: restaurants.taxNumber,
          commercialRegistration: restaurants.commercialRegistration,
          createdAt: restaurants.createdAt,
          // Admin user details
          adminId: users.id,
          adminFullName: users.fullName,
          adminEmail: users.email,
          adminPhone: users.phone,
          adminUsername: users.username,
        })
        .from(restaurants)
        .leftJoin(users, and(
          eq(users.restaurantId, restaurants.id),
          eq(users.role, 'admin')
        ))
        .where(sql`${restaurants.subscriptionStatus} != 'cancelled' OR ${restaurants.subscriptionStatus} IS NULL`)
        .orderBy(desc(restaurants.createdAt));

      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get all subscription invoices (IT-only)
  app.get("/api/it/business-management/invoices", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { fromDate, toDate, restaurantId } = req.query;

      // Build query with optional filters
      let query = db
        .select({
          id: subscriptionInvoices.id,
          serialNumber: subscriptionInvoices.serialNumber,
          subscriptionPlan: subscriptionInvoices.subscriptionPlan,
          branchesCount: subscriptionInvoices.branchesCount,
          basePlanPrice: subscriptionInvoices.basePlanPrice,
          additionalBranchesPrice: subscriptionInvoices.additionalBranchesPrice,
          subtotal: subscriptionInvoices.subtotal,
          vatAmount: subscriptionInvoices.vatAmount,
          total: subscriptionInvoices.total,
          invoiceDate: subscriptionInvoices.invoiceDate,
          pdfPath: subscriptionInvoices.pdfPath,
          // User and restaurant details
          userId: users.id,
          userName: users.fullName,
          userEmail: users.email,
          restaurantId: restaurants.id,
          restaurantName: restaurants.name,
          taxNumber: restaurants.taxNumber,
          commercialRegistration: restaurants.commercialRegistration,
        })
        .from(subscriptionInvoices)
        .leftJoin(users, eq(subscriptionInvoices.userId, users.id))
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      const invoices = await query;

      // Apply date filters in memory if provided
      let filteredInvoices = invoices;
      if (fromDate) {
        const from = new Date(fromDate as string);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) <= to);
      }
      if (restaurantId) {
        filteredInvoices = filteredInvoices.filter(inv => inv.restaurantId === restaurantId);
      }

      res.json(filteredInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Get VAT summary for all subscriptions (IT-only)
  app.get("/api/it/business-management/vat-summary", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;

      // Get all subscription invoices
      const invoices = await db
        .select({
          subtotal: subscriptionInvoices.subtotal,
          vatAmount: subscriptionInvoices.vatAmount,
          total: subscriptionInvoices.total,
          invoiceDate: subscriptionInvoices.invoiceDate,
        })
        .from(subscriptionInvoices)
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      // Apply date filters
      let filteredInvoices = invoices;
      if (fromDate) {
        const from = new Date(fromDate as string);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) <= to);
      }

      // Calculate totals
      const totalSubscriptions = filteredInvoices.length;
      const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || "0"), 0);
      const totalVat = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount || "0"), 0);
      const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

      // VAT calculation verification (should be 15% of subtotal)
      const calculatedVat = totalSubtotal * 0.15;

      res.json({
        totalSubscriptions,
        totalSubtotal: totalSubtotal.toFixed(2),
        totalVatCollected: totalVat.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        vatRate: "15%",
        vatCalculationVerification: {
          baseAmount: totalSubtotal.toFixed(2),
          calculatedVat: calculatedVat.toFixed(2),
          isCorrect: Math.abs(totalVat - calculatedVat) < 0.01,
        },
        periodStart: fromDate || null,
        periodEnd: toDate || null,
      });
    } catch (error) {
      console.error("Error calculating VAT summary:", error);
      res.status(500).json({ error: "Failed to calculate VAT summary" });
    }
  });

  // Generate VAT Statement PDF (IT-only)
  app.post("/api/it/business-management/vat-statement/pdf", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Validate request body
      const dateRangeSchema = z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      });
      
      const validatedBody = dateRangeSchema.parse(req.body);
      const { fromDate, toDate } = validatedBody;

      // Get all subscription invoices for the period
      const invoices = await db
        .select({
          serialNumber: subscriptionInvoices.serialNumber,
          subscriptionPlan: subscriptionInvoices.subscriptionPlan,
          branchesCount: subscriptionInvoices.branchesCount,
          subtotal: subscriptionInvoices.subtotal,
          vatAmount: subscriptionInvoices.vatAmount,
          total: subscriptionInvoices.total,
          invoiceDate: subscriptionInvoices.invoiceDate,
          userName: users.fullName,
          restaurantName: restaurants.name,
          taxNumber: restaurants.taxNumber,
        })
        .from(subscriptionInvoices)
        .leftJoin(users, eq(subscriptionInvoices.userId, users.id))
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      // Apply date filters
      let filteredInvoices = invoices;
      if (fromDate) {
        const from = new Date(fromDate);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) <= to);
      }

      // Calculate totals
      const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || "0"), 0);
      const totalVat = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount || "0"), 0);
      const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

      // Generate ZATCA-compliant QR code
      const qrData = [
        "Kinzhal LTD Co.",
        "310000000000003", // Company VAT number
        new Date().toISOString(),
        totalRevenue.toFixed(2),
        totalVat.toFixed(2)
      ].join("|");
      const qrCodeDataURL = await QRCode.toDataURL(qrData);

      // Import Puppeteer dynamically and detect Chromium path
      const puppeteer = await import("puppeteer");
      const { execSync } = await import("child_process");
      const { existsSync } = await import("fs");
      
      // Detect Chromium executable path
      let chromiumPath: string | undefined = undefined;
      try {
        chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
        if (!chromiumPath || !existsSync(chromiumPath)) {
          chromiumPath = undefined;
        }
      } catch (e) {
        // Chromium not found via which
      }
      
      const browser = await puppeteer.default.launch({
        headless: true,
        executablePath: chromiumPath,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ],
      });
      const page = await browser.newPage();

      // Create HTML content for VAT statement
      const periodText = fromDate && toDate 
        ? `${new Date(fromDate).toLocaleDateString('en-GB')} - ${new Date(toDate).toLocaleDateString('en-GB')}`
        : 'All Time';

      const invoiceRows = filteredInvoices.map((inv, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${inv.serialNumber}</td>
          <td>${inv.restaurantName || 'N/A'}</td>
          <td>${inv.taxNumber || 'N/A'}</td>
          <td>${inv.subscriptionPlan}</td>
          <td>${parseFloat(inv.subtotal || "0").toFixed(2)}</td>
          <td>${parseFloat(inv.vatAmount || "0").toFixed(2)}</td>
          <td>${parseFloat(inv.total || "0").toFixed(2)}</td>
          <td>${new Date(inv.invoiceDate!).toLocaleDateString('en-GB')}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="ltr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header h1 { color: #1a365d; margin: 0; font-size: 20px; }
            .header h2 { color: #2d3748; margin: 5px 0; font-size: 14px; }
            .header p { color: #666; margin: 3px 0; font-size: 11px; }
            .period { background: #f0f4f8; padding: 10px; margin: 15px 0; border-radius: 5px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background: #1a365d; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            .summary { background: #e8f4e8; padding: 15px; margin-top: 20px; border-radius: 5px; }
            .summary h3 { margin: 0 0 10px 0; color: #1a365d; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .qr-section { text-align: center; margin-top: 20px; }
            .qr-section img { width: 100px; height: 100px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
            .zatca-badge { background: #22c55e; color: white; padding: 3px 8px; border-radius: 3px; font-size: 9px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VAT Statement / بيان ضريبة القيمة المضافة</h1>
            <h2>Kinzhal LTD Co. - BlindSpot System (BSS)</h2>
            <p>VAT Registration: 310000000000003</p>
            <span class="zatca-badge">ZATCA Compliant / متوافق مع هيئة الزكاة</span>
          </div>
          
          <div class="period">
            <strong>Statement Period / فترة البيان:</strong> ${periodText}
            <br>
            <strong>Generated On / تاريخ الإنشاء:</strong> ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No. / رقم الفاتورة</th>
                <th>Client / العميل</th>
                <th>Tax No. / الرقم الضريبي</th>
                <th>Plan / الخطة</th>
                <th>Base (SAR) / الأساس</th>
                <th>VAT 15% / الضريبة</th>
                <th>Total (SAR) / الإجمالي</th>
                <th>Date / التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceRows || '<tr><td colspan="9" style="text-align:center;">No invoices found / لا توجد فواتير</td></tr>'}
            </tbody>
          </table>

          <div class="summary">
            <h3>VAT Summary / ملخص ضريبة القيمة المضافة</h3>
            <div class="summary-row">
              <span>Total Subscriptions / إجمالي الاشتراكات:</span>
              <span>${filteredInvoices.length}</span>
            </div>
            <div class="summary-row">
              <span>Total Base Amount / إجمالي المبلغ الأساسي:</span>
              <span>${totalSubtotal.toFixed(2)} SAR</span>
            </div>
            <div class="summary-row">
              <span>VAT Rate / نسبة الضريبة:</span>
              <span>15%</span>
            </div>
            <div class="summary-row total-row">
              <span>Total VAT Collected / إجمالي الضريبة المحصلة:</span>
              <span>${totalVat.toFixed(2)} SAR</span>
            </div>
            <div class="summary-row total-row">
              <span>Total Revenue (incl. VAT) / إجمالي الإيرادات:</span>
              <span>${totalRevenue.toFixed(2)} SAR</span>
            </div>
          </div>

          <div class="qr-section">
            <p>Scan for ZATCA Verification / امسح للتحقق من هيئة الزكاة</p>
            <img src="${qrCodeDataURL}" alt="QR Code" />
          </div>

          <div class="footer">
            <p>This is a computer-generated document and does not require a signature.</p>
            <p>هذا المستند مُنشأ آلياً ولا يتطلب توقيعاً.</p>
            <p>Made By Kinzhal LTD Co. | BlindSpot System (BSS)</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=VAT-Statement-${new Date().toISOString().split('T')[0]}.pdf`);
      res.end(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Error generating VAT statement PDF:", error);
      res.status(500).json({ error: "Failed to generate VAT statement PDF" });
    }
  });

  // Generate VAT Statement Excel (IT-only)
  app.post("/api/it/business-management/vat-statement/excel", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Validate request body
      const dateRangeSchema = z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      });
      
      const validatedBody = dateRangeSchema.parse(req.body);
      const { fromDate, toDate } = validatedBody;
      const XLSX = await import("xlsx");

      // Get all subscription invoices for the period
      const invoices = await db
        .select({
          serialNumber: subscriptionInvoices.serialNumber,
          subscriptionPlan: subscriptionInvoices.subscriptionPlan,
          branchesCount: subscriptionInvoices.branchesCount,
          subtotal: subscriptionInvoices.subtotal,
          vatAmount: subscriptionInvoices.vatAmount,
          total: subscriptionInvoices.total,
          invoiceDate: subscriptionInvoices.invoiceDate,
          userName: users.fullName,
          userEmail: users.email,
          restaurantName: restaurants.name,
          taxNumber: restaurants.taxNumber,
          commercialRegistration: restaurants.commercialRegistration,
        })
        .from(subscriptionInvoices)
        .leftJoin(users, eq(subscriptionInvoices.userId, users.id))
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      // Apply date filters
      let filteredInvoices = invoices;
      if (fromDate) {
        const from = new Date(fromDate);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filteredInvoices = filteredInvoices.filter(inv => new Date(inv.invoiceDate!) <= to);
      }

      // Calculate totals
      const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || "0"), 0);
      const totalVat = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount || "0"), 0);
      const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

      // Prepare data for Excel
      const excelData = filteredInvoices.map((inv, idx) => ({
        '#': idx + 1,
        'Invoice Number': inv.serialNumber,
        'Client Name': inv.restaurantName || 'N/A',
        'Client Email': inv.userEmail || 'N/A',
        'Tax Number': inv.taxNumber || 'N/A',
        'Commercial Registration': inv.commercialRegistration || 'N/A',
        'Subscription Plan': inv.subscriptionPlan,
        'Branches': inv.branchesCount,
        'Base Amount (SAR)': parseFloat(inv.subtotal || "0"),
        'VAT 15% (SAR)': parseFloat(inv.vatAmount || "0"),
        'Total (SAR)': parseFloat(inv.total || "0"),
        'Invoice Date': new Date(inv.invoiceDate!).toLocaleDateString('en-GB'),
      }));

      // Add summary rows
      excelData.push({} as any); // Empty row
      excelData.push({
        '#': '',
        'Invoice Number': 'SUMMARY / الملخص',
        'Client Name': '',
        'Client Email': '',
        'Tax Number': '',
        'Commercial Registration': '',
        'Subscription Plan': '',
        'Branches': '',
        'Base Amount (SAR)': totalSubtotal,
        'VAT 15% (SAR)': totalVat,
        'Total (SAR)': totalRevenue,
        'Invoice Date': '',
      } as any);
      excelData.push({
        '#': '',
        'Invoice Number': `Total Subscriptions: ${filteredInvoices.length}`,
        'Client Name': '',
        'Client Email': '',
        'Tax Number': '',
        'Commercial Registration': '',
        'Subscription Plan': '',
        'Branches': '',
        'Base Amount (SAR)': '',
        'VAT 15% (SAR)': `VAT Rate: 15%`,
        'Total (SAR)': '',
        'Invoice Date': '',
      } as any);

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'VAT Statement');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },  // #
        { wch: 25 }, // Invoice Number
        { wch: 25 }, // Client Name
        { wch: 25 }, // Client Email
        { wch: 15 }, // Tax Number
        { wch: 20 }, // Commercial Registration
        { wch: 15 }, // Subscription Plan
        { wch: 10 }, // Branches
        { wch: 18 }, // Base Amount
        { wch: 15 }, // VAT
        { wch: 15 }, // Total
        { wch: 12 }, // Invoice Date
      ];

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=VAT-Statement-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating VAT statement Excel:", error);
      res.status(500).json({ error: "Failed to generate VAT statement Excel" });
    }
  });

  // Download individual subscription invoice PDF (IT-only)
  app.get("/api/it/business-management/invoices/:invoiceId/pdf", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { invoiceId } = req.params;

      // Get the specific invoice with user and restaurant details
      const [invoice] = await db
        .select({
          id: subscriptionInvoices.id,
          serialNumber: subscriptionInvoices.serialNumber,
          subscriptionPlan: subscriptionInvoices.subscriptionPlan,
          branchesCount: subscriptionInvoices.branchesCount,
          basePlanPrice: subscriptionInvoices.basePlanPrice,
          additionalBranchesPrice: subscriptionInvoices.additionalBranchesPrice,
          subtotal: subscriptionInvoices.subtotal,
          vatAmount: subscriptionInvoices.vatAmount,
          total: subscriptionInvoices.total,
          invoiceDate: subscriptionInvoices.invoiceDate,
          userName: users.fullName,
          userEmail: users.email,
          restaurantName: restaurants.name,
          taxNumber: restaurants.taxNumber,
          commercialRegistration: restaurants.commercialRegistration,
        })
        .from(subscriptionInvoices)
        .leftJoin(users, eq(subscriptionInvoices.userId, users.id))
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(eq(subscriptionInvoices.id, invoiceId));

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Generate ZATCA-compliant QR code
      const qrData = [
        "Kinzhal LTD Co.",
        "310000000000003",
        new Date(invoice.invoiceDate!).toISOString(),
        parseFloat(invoice.total || "0").toFixed(2),
        parseFloat(invoice.vatAmount || "0").toFixed(2)
      ].join("|");
      const qrCodeDataURL = await QRCode.toDataURL(qrData);

      // Import Puppeteer dynamically and detect Chromium path
      const puppeteer = await import("puppeteer");
      const { execSync } = await import("child_process");
      const { existsSync } = await import("fs");
      
      let chromiumPath: string | undefined = undefined;
      try {
        chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
        if (!chromiumPath || !existsSync(chromiumPath)) {
          chromiumPath = undefined;
        }
      } catch (e) {
        // Chromium not found via which
      }
      
      const browser = await puppeteer.default.launch({
        headless: true,
        executablePath: chromiumPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
      });
      const page = await browser.newPage();

      const planNames: { [key: string]: { en: string; ar: string } } = {
        weekly: { en: 'Weekly', ar: 'أسبوعي' },
        monthly: { en: 'Monthly', ar: 'شهري' },
        yearly: { en: 'Yearly', ar: 'سنوي' },
      };
      const planName = planNames[invoice.subscriptionPlan] || { en: invoice.subscriptionPlan, ar: invoice.subscriptionPlan };

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="ltr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; font-size: 12px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a365d; padding-bottom: 20px; }
            .header h1 { color: #1a365d; margin: 0; font-size: 24px; }
            .header h2 { color: #2d3748; margin: 8px 0; font-size: 16px; }
            .header p { color: #666; margin: 3px 0; font-size: 11px; }
            .zatca-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 10px; display: inline-block; margin-top: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .info-block { flex: 1; }
            .info-block h3 { margin: 0 0 10px 0; color: #1a365d; font-size: 13px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .info-block p { margin: 4px 0; font-size: 11px; color: #4a5568; }
            .info-block strong { color: #1a365d; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #1a365d; color: white; font-size: 11px; }
            td { font-size: 11px; }
            tr:nth-child(even) { background: #f8fafc; }
            .totals { margin-top: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 15px; font-size: 12px; }
            .totals-row.subtotal { background: #f0f4f8; border-radius: 4px; }
            .totals-row.vat { background: #fef3c7; border-radius: 4px; margin: 5px 0; }
            .totals-row.total { background: #1a365d; color: white; border-radius: 4px; font-size: 14px; font-weight: bold; }
            .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .qr-section img { width: 100px; height: 100px; }
            .qr-section p { font-size: 10px; color: #666; margin: 5px 0; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .bilingual { display: flex; justify-content: space-between; }
            .bilingual .ar { text-align: right; direction: rtl; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SUBSCRIPTION INVOICE / فاتورة الاشتراك</h1>
            <h2>Kinzhal LTD Co. - BlindSpot System (BSS)</h2>
            <p>VAT Registration: 310000000000003 | الرقم الضريبي</p>
            <span class="zatca-badge">ZATCA Compliant / متوافق مع هيئة الزكاة</span>
          </div>

          <div class="invoice-info">
            <div class="info-block">
              <h3>Invoice Details / تفاصيل الفاتورة</h3>
              <p><strong>Invoice No:</strong> ${invoice.serialNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.invoiceDate!).toLocaleDateString('en-GB')}</p>
              <p><strong>Plan:</strong> ${planName.en} / ${planName.ar}</p>
            </div>
            <div class="info-block">
              <h3>Customer / العميل</h3>
              <p><strong>Name:</strong> ${invoice.restaurantName || invoice.userName || 'N/A'}</p>
              <p><strong>Tax No:</strong> ${invoice.taxNumber || 'N/A'}</p>
              <p><strong>CR:</strong> ${invoice.commercialRegistration || 'N/A'}</p>
              <p><strong>Email:</strong> ${invoice.userEmail || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:50%">Description / الوصف</th>
                <th style="text-align:center">Qty / الكمية</th>
                <th style="text-align:right">Unit Price / سعر الوحدة</th>
                <th style="text-align:right">Amount / المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${planName.en} Subscription / اشتراك ${planName.ar}</td>
                <td style="text-align:center">1</td>
                <td style="text-align:right">${parseFloat(invoice.basePlanPrice || "0").toFixed(2)} SAR</td>
                <td style="text-align:right">${parseFloat(invoice.basePlanPrice || "0").toFixed(2)} SAR</td>
              </tr>
              ${parseFloat(invoice.additionalBranchesPrice || "0") > 0 ? `
              <tr>
                <td>Additional Branches (${(invoice.branchesCount || 1) - 1}) / فروع إضافية</td>
                <td style="text-align:center">${(invoice.branchesCount || 1) - 1}</td>
                <td style="text-align:right">${(parseFloat(invoice.additionalBranchesPrice || "0") / Math.max((invoice.branchesCount || 1) - 1, 1)).toFixed(2)} SAR</td>
                <td style="text-align:right">${parseFloat(invoice.additionalBranchesPrice || "0").toFixed(2)} SAR</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row subtotal">
              <span>Subtotal (excl. VAT) / المبلغ قبل الضريبة:</span>
              <span>${parseFloat(invoice.subtotal || "0").toFixed(2)} SAR</span>
            </div>
            <div class="totals-row vat">
              <span>VAT (15%) / ضريبة القيمة المضافة:</span>
              <span>${parseFloat(invoice.vatAmount || "0").toFixed(2)} SAR</span>
            </div>
            <div class="totals-row total">
              <span>Total (incl. VAT) / الإجمالي شامل الضريبة:</span>
              <span>${parseFloat(invoice.total || "0").toFixed(2)} SAR</span>
            </div>
          </div>

          <div class="qr-section">
            <p>Scan for ZATCA Verification / امسح للتحقق من هيئة الزكاة</p>
            <img src="${qrCodeDataURL}" alt="QR Code" />
          </div>

          <div class="footer">
            <p>This is a computer-generated document and does not require a signature.</p>
            <p>هذا المستند مُنشأ آلياً ولا يتطلب توقيعاً.</p>
            <p>Made By Kinzhal LTD Co. | BlindSpot System (BSS)</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.serialNumber}.pdf`);
      res.end(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Error generating subscription invoice PDF:", error);
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  });

  // Suspend/Activate subscription (IT-only)
  app.patch("/api/it/business-management/subscriptions/:restaurantId/status", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ["active", "inactive", "cancelled", "expired"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: active, inactive, cancelled, expired" });
      }

      // Update the restaurant's subscription status
      const [updatedRestaurant] = await db
        .update(restaurants)
        .set({ subscriptionStatus: status })
        .where(eq(restaurants.id, restaurantId))
        .returning();

      if (!updatedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      console.log(`[IT] Subscription status updated for restaurant ${restaurantId}: ${status}`);
      
      res.json({ 
        success: true, 
        restaurantId,
        newStatus: status,
        message: `Subscription ${status === 'active' ? 'activated' : 'suspended'} successfully`
      });
    } catch (error) {
      console.error("Error updating subscription status:", error);
      res.status(500).json({ error: "Failed to update subscription status" });
    }
  });

  // Delete subscription with optional refund clearance invoice (IT-only)
  app.delete("/api/it/business-management/subscriptions/:restaurantId", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { reason } = req.body as { reason: "mistake" | "client_request" };

      if (!reason || !["mistake", "client_request"].includes(reason)) {
        return res.status(400).json({ error: "Invalid reason. Must be 'mistake' or 'client_request'" });
      }

      // Get restaurant info
      const restaurant = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          businessType: restaurants.businessType,
          subscriptionPlan: restaurants.subscriptionPlan,
          subscriptionStartDate: restaurants.subscriptionStartDate,
          subscriptionEndDate: restaurants.subscriptionEndDate,
          taxNumber: restaurants.taxNumber,
          commercialRegistration: restaurants.commercialRegistration,
        })
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!restaurant[0]) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const rest = restaurant[0];

      // Get owner details by finding user with this restaurantId
      let ownerInfo = { fullName: "Unknown", email: "unknown@email.com" };
      const owner = await db
        .select({ fullName: users.fullName, email: users.email })
        .from(users)
        .where(eq(users.restaurantId, restaurantId))
        .limit(1);
      if (owner[0]) {
        ownerInfo = { fullName: owner[0].fullName || "Unknown", email: owner[0].email || "unknown@email.com" };
      }

      // Get business info for invoice
      const businessInfoResult = await db.select().from(businessInfo).limit(1);
      const bi = businessInfoResult[0] || null;

      let pdfBase64: string | null = null;
      let refundAmount = 0;

      // Generate refund invoice for ALL cancellation reasons
      if (rest.subscriptionPlan && rest.subscriptionStartDate) {
        // Import pricing functions
        const { getPlanPricing } = await import("@shared/subscriptionPricing");
        
        const subscriptionStartDate = new Date(rest.subscriptionStartDate);
        const cancellationDate = new Date();
        
        // Calculate months used (round up to full months)
        const monthsUsed = Math.ceil(
          (cancellationDate.getTime() - subscriptionStartDate.getTime()) / 
          (30 * 24 * 60 * 60 * 1000)
        );

        // Get plan pricing
        const businessType = (rest.businessType === 'factory' ? 'factory' : 'restaurant') as 'restaurant' | 'factory';
        const planType = rest.subscriptionPlan as 'weekly' | 'monthly' | 'yearly';
        const pricing = getPlanPricing(planType, 1, businessType);
        
        // Calculate monthly rate based on plan
        let monthlyRate = 199;  // Fixed monthly rate for early cancellation
        let originalPrice = pricing.grossAmount;
        
        if (planType === 'monthly') {
          monthlyRate = originalPrice;
        } else if (planType === 'weekly') {
          monthlyRate = originalPrice * 4; // Approximate monthly from weekly
        }
        // For yearly plans, use the fixed 199 SAR monthly rate

        const chargedAmount = monthlyRate * Math.min(monthsUsed, 12);
        
        // For "mistake" cancellations, refund is 0. For "client_request", calculate actual refund
        if (reason === "client_request") {
          refundAmount = Math.max(0, originalPrice - chargedAmount);
        } else {
          // Mistake subscription - no refund, but still generate invoice for records
          refundAmount = 0;
        }

        // Generate serial number
        const currentYear = new Date().getFullYear();
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(refundInvoices)
          .where(sql`EXTRACT(YEAR FROM ${refundInvoices.createdAt}) = ${currentYear}`);
        const sequenceNumber = (countResult[0]?.count || 0) + 1;
        const serialNumber = `RC-${currentYear}-${String(sequenceNumber).padStart(6, '0')}`;

        // Generate refund clearance PDF
        const { generateRefundClearanceInvoice } = await import("./invoice");
        const pdfBuffer = await generateRefundClearanceInvoice({
          serialNumber,
          clientName: ownerInfo.fullName,
          clientEmail: ownerInfo.email,
          restaurantName: rest.name,
          taxNumber: rest.taxNumber,
          commercialRegistration: rest.commercialRegistration,
          subscriptionPlan: rest.subscriptionPlan,
          subscriptionStartDate,
          cancellationDate,
          monthsUsed: Math.min(monthsUsed, 12),
          originalPrice,
          monthlyRate,
          chargedAmount,
          refundAmount,
          cancellationReason: reason, // Pass reason to invoice generator
          businessInfo: bi,
        });

        pdfBase64 = pdfBuffer.toString('base64');

        // Save refund invoice to database
        await db.insert(refundInvoices).values({
          restaurantId,
          serialNumber,
          clientName: ownerInfo.fullName,
          clientEmail: ownerInfo.email,
          restaurantName: rest.name,
          subscriptionPlan: rest.subscriptionPlan,
          subscriptionStartDate,
          cancellationDate,
          monthsUsed: Math.min(monthsUsed, 12),
          originalPrice: originalPrice.toString(),
          monthlyRate: monthlyRate.toString(),
          chargedAmount: chargedAmount.toString(),
          refundAmount: refundAmount.toString(),
          pdfData: pdfBase64,
        });
        console.log(`[IT] Refund clearance invoice saved: ${serialNumber} for restaurant ${restaurantId}, reason: ${reason}`);
      }

      // Update subscription status to cancelled with reason
      await db
        .update(restaurants)
        .set({ 
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: new Date(),
          cancellationReason: reason
        })
        .where(eq(restaurants.id, restaurantId));

      console.log(`[IT] Subscription deleted for restaurant ${restaurantId}, reason: ${reason}`);

      res.json({
        success: true,
        restaurantId,
        reason,
        refundAmount,
        pdfBase64,
        message: reason === 'client_request' 
          ? 'Subscription cancelled with refund clearance invoice generated'
          : 'Subscription cancelled (mistake entry)'
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // Get refund invoice for a restaurant (IT-only)
  app.get("/api/it/business-management/refund-invoices/:restaurantId", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      const invoices = await db
        .select({
          id: refundInvoices.id,
          restaurantId: refundInvoices.restaurantId,
          serialNumber: refundInvoices.serialNumber,
          clientName: refundInvoices.clientName,
          clientEmail: refundInvoices.clientEmail,
          restaurantName: refundInvoices.restaurantName,
          subscriptionPlan: refundInvoices.subscriptionPlan,
          subscriptionStartDate: refundInvoices.subscriptionStartDate,
          cancellationDate: refundInvoices.cancellationDate,
          monthsUsed: refundInvoices.monthsUsed,
          originalPrice: refundInvoices.originalPrice,
          monthlyRate: refundInvoices.monthlyRate,
          chargedAmount: refundInvoices.chargedAmount,
          refundAmount: refundInvoices.refundAmount,
          pdfData: refundInvoices.pdfData,
          createdAt: refundInvoices.createdAt,
        })
        .from(refundInvoices)
        .where(eq(refundInvoices.restaurantId, restaurantId))
        .orderBy(desc(refundInvoices.createdAt));

      res.json(invoices);
    } catch (error) {
      console.error("Error fetching refund invoices:", error);
      res.status(500).json({ error: "Failed to fetch refund invoices" });
    }
  });

  // Get all refund invoices (IT-only)
  app.get("/api/it/business-management/refund-invoices", requireAuth, requireITAccount, async (req, res) => {
    try {
      const invoices = await db
        .select({
          id: refundInvoices.id,
          restaurantId: refundInvoices.restaurantId,
          serialNumber: refundInvoices.serialNumber,
          clientName: refundInvoices.clientName,
          restaurantName: refundInvoices.restaurantName,
          refundAmount: refundInvoices.refundAmount,
          createdAt: refundInvoices.createdAt,
        })
        .from(refundInvoices)
        .orderBy(desc(refundInvoices.createdAt));

      res.json(invoices);
    } catch (error) {
      console.error("Error fetching all refund invoices:", error);
      res.status(500).json({ error: "Failed to fetch refund invoices" });
    }
  });

  // ============================================
  // BUSINESS OPERATIONS - Company Bills CRUD (IT-only)
  // ============================================

  // Get all company bills with optional filtering
  app.get("/api/it/business-operations/bills", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { status, billType, fromDate, toDate } = req.query;

      let bills = await db
        .select({
          id: companyBills.id,
          billType: companyBills.billType,
          vendor: companyBills.vendor,
          amount: companyBills.amount,
          vatAmount: companyBills.vatAmount,
          totalAmount: companyBills.totalAmount,
          billDate: companyBills.billDate,
          dueDate: companyBills.dueDate,
          paidDate: companyBills.paidDate,
          status: companyBills.status,
          paymentPeriod: companyBills.paymentPeriod,
          description: companyBills.description,
          referenceNumber: companyBills.referenceNumber,
          attachmentPath: companyBills.attachmentPath,
          createdBy: companyBills.createdBy,
          createdByName: users.fullName,
          createdAt: companyBills.createdAt,
        })
        .from(companyBills)
        .leftJoin(users, eq(companyBills.createdBy, users.id))
        .orderBy(desc(companyBills.billDate));

      // Apply filters
      if (status && status !== 'all') {
        bills = bills.filter(b => b.status === status);
      }
      if (billType && billType !== 'all') {
        bills = bills.filter(b => b.billType === billType);
      }
      if (fromDate) {
        const from = new Date(fromDate as string);
        bills = bills.filter(b => new Date(b.billDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        bills = bills.filter(b => new Date(b.billDate!) <= to);
      }

      res.json(bills);
    } catch (error) {
      console.error("Error fetching company bills:", error);
      res.status(500).json({ error: "Failed to fetch company bills" });
    }
  });

  // Create a new company bill with optional PDF invoice upload
  app.post("/api/it/business-operations/bills", requireAuth, requireITAccount, uploadBillInvoice.single('invoiceFile'), async (req, res) => {
    try {
      // Parse form data - multipart form fields are in req.body as strings
      const billData = {
        billType: req.body.billType,
        vendor: req.body.vendor,
        amount: req.body.amount,
        vatAmount: req.body.vatAmount,
        totalAmount: req.body.totalAmount,
        billDate: req.body.billDate,
        dueDate: req.body.dueDate || null,
        paidDate: req.body.paidDate || null,
        status: req.body.status || 'pending',
        paymentPeriod: req.body.paymentPeriod || 'monthly',
        description: req.body.description || null,
        referenceNumber: req.body.referenceNumber || null,
        attachmentPath: req.file ? `/api/it/bill-invoices/${req.file.filename}` : null,
        createdBy: req.session.user?.id,
      };

      const validatedData = insertCompanyBillSchema.parse(billData);

      const [newBill] = await db
        .insert(companyBills)
        .values(validatedData)
        .returning();

      console.log(`[IT] Company bill created: ${newBill.id} by user ${req.session.user?.id}${req.file ? ' with PDF invoice' : ''}`);
      res.status(201).json(newBill);
    } catch (error) {
      console.error("Error creating company bill:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bill data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create company bill" });
    }
  });

  // Update a company bill
  app.patch("/api/it/business-operations/bills/:billId", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { billId } = req.params;
      
      // Define allowed update fields
      const allowedFields = [
        'billType', 'vendor', 'amount', 'vatAmount', 'totalAmount',
        'billDate', 'dueDate', 'paidDate', 'status', 'paymentPeriod',
        'description', 'referenceNumber'
      ];
      
      // Manually filter to allowed fields
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Convert date strings to Date objects
      if (updateData.billDate) updateData.billDate = new Date(updateData.billDate);
      if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
      if (updateData.paidDate) updateData.paidDate = new Date(updateData.paidDate);

      const [updatedBill] = await db
        .update(companyBills)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(companyBills.id, billId))
        .returning();

      if (!updatedBill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      console.log(`[IT] Company bill updated: ${billId} by user ${req.session.user?.id}`);
      res.json(updatedBill);
    } catch (error) {
      console.error("Error updating company bill:", error);
      res.status(500).json({ error: "Failed to update company bill" });
    }
  });

  // Delete a company bill
  app.delete("/api/it/business-operations/bills/:billId", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { billId } = req.params;

      const [deletedBill] = await db
        .delete(companyBills)
        .where(eq(companyBills.id, billId))
        .returning();

      if (!deletedBill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      console.log(`[IT] Company bill deleted: ${billId} by user ${req.session.user?.id}`);
      res.json({ success: true, message: "Bill deleted successfully" });
    } catch (error) {
      console.error("Error deleting company bill:", error);
      res.status(500).json({ error: "Failed to delete company bill" });
    }
  });

  // Get company bills summary (for dashboard)
  app.get("/api/it/business-operations/summary", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;

      let bills = await db
        .select()
        .from(companyBills)
        .orderBy(desc(companyBills.billDate));

      // Apply date filters
      if (fromDate) {
        const from = new Date(fromDate as string);
        bills = bills.filter(b => new Date(b.billDate!) >= from);
      }
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        bills = bills.filter(b => new Date(b.billDate!) <= to);
      }

      // Calculate summaries by category
      const byCategory: Record<string, { amount: number; vatAmount: number; totalAmount: number; count: number }> = {};
      let totalAmount = 0;
      let totalVat = 0;
      let totalBills = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      for (const bill of bills) {
        const category = bill.billType;
        if (!byCategory[category]) {
          byCategory[category] = { amount: 0, vatAmount: 0, totalAmount: 0, count: 0 };
        }
        byCategory[category].amount += parseFloat(bill.amount);
        byCategory[category].vatAmount += parseFloat(bill.vatAmount);
        byCategory[category].totalAmount += parseFloat(bill.totalAmount);
        byCategory[category].count++;

        totalAmount += parseFloat(bill.amount);
        totalVat += parseFloat(bill.vatAmount);
        totalBills += parseFloat(bill.totalAmount);

        if (bill.status === 'paid') paidCount++;
        else if (bill.status === 'pending') pendingCount++;
        else if (bill.status === 'overdue') overdueCount++;
      }

      res.json({
        totalExpenses: totalBills.toFixed(2),
        totalBaseAmount: totalAmount.toFixed(2),
        totalVatPaid: totalVat.toFixed(2),
        billsCount: bills.length,
        paidCount,
        pendingCount,
        overdueCount,
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          ...data,
          amount: data.amount.toFixed(2),
          vatAmount: data.vatAmount.toFixed(2),
          totalAmount: data.totalAmount.toFixed(2),
        })),
        periodStart: fromDate || null,
        periodEnd: toDate || null,
      });
    } catch (error) {
      console.error("Error calculating business operations summary:", error);
      res.status(500).json({ error: "Failed to calculate summary" });
    }
  });

  // ============================================
  // BUSINESS INFO - Company Details (IT-only)
  // ============================================

  // Get business info (singleton - returns the single record or default values)
  app.get("/api/it/business-info", requireAuth, requireITAccount, async (req, res) => {
    try {
      const [info] = await db.select().from(businessInfo).limit(1);
      
      if (!info) {
        // Return default values if no record exists
        res.json({
          id: null,
          companyNameEn: "BlindSpot System (BSS)",
          companyNameAr: "نظام بلايند سبوت",
          vatNumber: "",
          crNumber: "",
          nationalId: "",
          email: "IT@SaudiKinzhal.org",
          phone: "",
          website: "",
          addressEn: "Saudi Arabia",
          addressAr: "المملكة العربية السعودية",
          city: "",
          postalCode: "",
          bankName: "",
          bankAccountName: "",
          bankAccountNumber: "",
          bankIban: "",
          logoUrl: null,
          updatedBy: null,
          updatedAt: null,
        });
      } else {
        res.json(info);
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
      res.status(500).json({ error: "Failed to fetch business info" });
    }
  });

  // Update business info (creates if doesn't exist, updates if exists)
  app.put("/api/it/business-info", requireAuth, requireITAccount, async (req, res) => {
    try {
      const userId = req.session.user?.id;
      
      // Check if a record exists
      const [existing] = await db.select().from(businessInfo).limit(1);
      
      const updateData = {
        companyNameEn: req.body.companyNameEn || "BlindSpot System (BSS)",
        companyNameAr: req.body.companyNameAr || "نظام بلايند سبوت",
        vatNumber: req.body.vatNumber || "",
        crNumber: req.body.crNumber || "",
        nationalId: req.body.nationalId || "",
        email: req.body.email || "IT@SaudiKinzhal.org",
        phone: req.body.phone || "",
        website: req.body.website || "",
        addressEn: req.body.addressEn || "Saudi Arabia",
        addressAr: req.body.addressAr || "المملكة العربية السعودية",
        city: req.body.city || "",
        postalCode: req.body.postalCode || "",
        bankName: req.body.bankName || "",
        bankAccountName: req.body.bankAccountName || "",
        bankAccountNumber: req.body.bankAccountNumber || "",
        bankIban: req.body.bankIban || "",
        logoUrl: req.body.logoUrl || null,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      let result;
      if (existing) {
        // Update existing record
        [result] = await db
          .update(businessInfo)
          .set(updateData)
          .where(eq(businessInfo.id, existing.id))
          .returning();
      } else {
        // Create new record
        [result] = await db
          .insert(businessInfo)
          .values(updateData)
          .returning();
      }

      console.log(`[IT] Business info updated by user ${userId}`);
      res.json(result);
    } catch (error) {
      console.error("Error updating business info:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid business info data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update business info" });
    }
  });

  // ============================================
  // BSS ANALYSIS - Analytics Dashboard (IT-only)
  // ============================================

  // Get comprehensive BSS analytics overview
  app.get("/api/it/bss-analysis/overview", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;

      // Get all subscription invoices
      let invoices = await db
        .select()
        .from(subscriptionInvoices)
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      // Get all company bills (expenses)
      let bills = await db
        .select()
        .from(companyBills)
        .orderBy(desc(companyBills.billDate));

      // Get all refund invoices to deduct from revenue
      let refunds = await db
        .select()
        .from(refundInvoices)
        .orderBy(desc(refundInvoices.createdAt));

      // Get all restaurants/clients
      const allRestaurants = await db
        .select()
        .from(restaurants);

      // Get all users (accounts)
      const allUsers = await db
        .select({
          id: users.id,
          restaurantId: users.restaurantId,
        })
        .from(users)
        .where(isNotNull(users.restaurantId));

      // Apply date filters (with null safety checks)
      if (fromDate) {
        const from = new Date(fromDate as string);
        invoices = invoices.filter(inv => inv.invoiceDate && new Date(inv.invoiceDate) >= from);
        bills = bills.filter(b => b.billDate && new Date(b.billDate) >= from);
        refunds = refunds.filter(r => r.createdAt && new Date(r.createdAt) >= from);
      }
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        invoices = invoices.filter(inv => inv.invoiceDate && new Date(inv.invoiceDate) <= to);
        bills = bills.filter(b => b.billDate && new Date(b.billDate) <= to);
        refunds = refunds.filter(r => r.createdAt && new Date(r.createdAt) <= to);
      }

      // Calculate total refunds issued (refundAmount is VAT-inclusive)
      // VAT rate is 15% per Saudi regulations
      const VAT_RATE = 0.15;
      const totalRefunds = refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || "0"), 0);

      // Calculate subscription revenue (gross before refunds)
      const grossSubscriptionRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || "0"), 0);
      const grossVatCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount || "0"), 0);
      const grossTotalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

      // Net revenue after refunds (refunds are VAT-inclusive amounts at 15% Saudi VAT rate)
      // Formula: netRefund = totalRefunds / (1 + VAT_RATE)
      const netRefundAmount = totalRefunds / (1 + VAT_RATE); // Net refund before VAT
      const refundVatAmount = totalRefunds - netRefundAmount; // VAT portion of refunds
      const subscriptionRevenue = grossSubscriptionRevenue - netRefundAmount;
      const vatCollected = grossVatCollected - refundVatAmount;
      const totalRevenue = grossTotalRevenue - totalRefunds;

      // Calculate expenses
      const totalExpenses = bills.reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);
      const expenseVat = bills.reduce((sum, b) => sum + parseFloat(b.vatAmount || "0"), 0);

      // Net profit calculation (using net revenue after refunds)
      const netProfit = subscriptionRevenue - (totalExpenses - expenseVat);
      const netVat = vatCollected - expenseVat;

      // Count by business type
      const restaurantCount = allRestaurants.filter(r => r.businessType === 'restaurant').length;
      const factoryCount = allRestaurants.filter(r => r.businessType === 'factory').length;

      // Count by subscription status
      const activeSubscriptions = allRestaurants.filter(r => r.subscriptionStatus === 'active').length;
      const expiredSubscriptions = allRestaurants.filter(r => r.subscriptionStatus === 'expired').length;
      const cancelledSubscriptions = allRestaurants.filter(r => r.subscriptionStatus === 'cancelled').length;

      // Subscription plan breakdown
      const planBreakdown = {
        weekly: invoices.filter(inv => inv.subscriptionPlan === 'weekly').length,
        monthly: invoices.filter(inv => inv.subscriptionPlan === 'monthly').length,
        yearly: invoices.filter(inv => inv.subscriptionPlan === 'yearly').length,
      };

      // Revenue by plan
      const revenueByPlan = {
        weekly: invoices.filter(inv => inv.subscriptionPlan === 'weekly')
          .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0).toFixed(2),
        monthly: invoices.filter(inv => inv.subscriptionPlan === 'monthly')
          .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0).toFixed(2),
        yearly: invoices.filter(inv => inv.subscriptionPlan === 'yearly')
          .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0).toFixed(2),
      };

      res.json({
        // Revenue metrics (net after refunds)
        subscriptionRevenue: subscriptionRevenue.toFixed(2),
        vatCollected: vatCollected.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        totalInvoices: invoices.length,

        // Refund metrics
        totalRefunds: totalRefunds.toFixed(2),
        refundCount: refunds.length,
        grossRevenue: grossTotalRevenue.toFixed(2),

        // Expense metrics
        totalExpenses: totalExpenses.toFixed(2),
        expenseVat: expenseVat.toFixed(2),
        totalBills: bills.length,

        // Profit metrics
        netProfit: netProfit.toFixed(2),
        netVat: netVat.toFixed(2),
        profitMargin: subscriptionRevenue > 0 ? ((netProfit / subscriptionRevenue) * 100).toFixed(1) : "0",

        // Account metrics
        totalClients: allRestaurants.length,
        totalAccounts: allUsers.length,
        restaurantCount,
        factoryCount,

        // Subscription status
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,

        // Plan breakdown
        planBreakdown,
        revenueByPlan,

        // Period
        periodStart: fromDate || null,
        periodEnd: toDate || null,
      });
    } catch (error) {
      console.error("Error calculating BSS analysis overview:", error);
      res.status(500).json({ error: "Failed to calculate analytics" });
    }
  });

  // Get monthly revenue trends
  app.get("/api/it/bss-analysis/revenue-trends", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { months = 12 } = req.query;
      const numMonths = parseInt(months as string) || 12;

      // Get all subscription invoices
      const invoices = await db
        .select()
        .from(subscriptionInvoices)
        .orderBy(desc(subscriptionInvoices.invoiceDate));

      // Get all company bills
      const bills = await db
        .select()
        .from(companyBills)
        .orderBy(desc(companyBills.billDate));

      // Get all refund invoices to deduct from revenue
      const refunds = await db
        .select()
        .from(refundInvoices)
        .orderBy(desc(refundInvoices.createdAt));

      // Group by month - track net revenue, VAT, net expenses (before VAT), and gross expenses
      const monthlyData: Record<string, { revenue: number; vat: number; netExpenses: number; expenseVat: number; profit: number; refunds: number }> = {};

      // Initialize last N months
      for (let i = 0; i < numMonths; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { revenue: 0, vat: 0, netExpenses: 0, expenseVat: 0, profit: 0, refunds: 0 };
      }

      // Add invoice revenue (gross)
      for (const inv of invoices) {
        const date = new Date(inv.invoiceDate!);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].revenue += parseFloat(inv.subtotal || "0");
          monthlyData[key].vat += parseFloat(inv.vatAmount || "0");
        }
      }

      // Deduct refunds from revenue (refund amounts are VAT-inclusive at 15% Saudi VAT rate)
      const VAT_RATE = 0.15;
      for (const refund of refunds) {
        // Skip refunds with null createdAt
        if (!refund.createdAt) continue;
        
        const date = new Date(refund.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          const refundAmount = parseFloat(refund.refundAmount || "0");
          const netRefund = refundAmount / (1 + VAT_RATE); // Extract net amount before VAT
          const refundVat = refundAmount - netRefund;
          monthlyData[key].revenue -= netRefund;
          monthlyData[key].vat -= refundVat;
          monthlyData[key].refunds += refundAmount;
        }
      }

      // Add expenses (track both gross and net for proper profit calculation)
      for (const bill of bills) {
        if (!bill.billDate) continue;
        const date = new Date(bill.billDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          const grossExpense = parseFloat(bill.totalAmount || "0");
          const billVat = parseFloat(bill.vatAmount || "0");
          monthlyData[key].netExpenses += (grossExpense - billVat); // Net expense before VAT
          monthlyData[key].expenseVat += billVat;
        }
      }

      // Calculate profit (net revenue after refunds minus net expenses)
      for (const key of Object.keys(monthlyData)) {
        monthlyData[key].profit = monthlyData[key].revenue - monthlyData[key].netExpenses;
      }

      // Convert to array and sort
      const trends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue.toFixed(2),
          vat: data.vat.toFixed(2),
          expenses: (data.netExpenses + data.expenseVat).toFixed(2), // Return gross expenses for display
          netExpenses: data.netExpenses.toFixed(2),
          profit: data.profit.toFixed(2),
          refunds: data.refunds.toFixed(2),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      res.json(trends);
    } catch (error) {
      console.error("Error fetching revenue trends:", error);
      res.status(500).json({ error: "Failed to fetch revenue trends" });
    }
  });

  // Get accounts by business type breakdown
  app.get("/api/it/bss-analysis/accounts-by-type", requireAuth, requireITAccount, async (req, res) => {
    try {
      const allRestaurants = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          businessType: restaurants.businessType,
          subscriptionStatus: restaurants.subscriptionStatus,
          subscriptionPlan: restaurants.subscriptionPlan,
        })
        .from(restaurants);

      const byType = {
        restaurant: {
          total: 0,
          active: 0,
          expired: 0,
          cancelled: 0,
          byPlan: { weekly: 0, monthly: 0, yearly: 0 },
        },
        factory: {
          total: 0,
          active: 0,
          expired: 0,
          cancelled: 0,
          byPlan: { weekly: 0, monthly: 0, yearly: 0 },
        },
      };

      for (const r of allRestaurants) {
        const type = r.businessType as 'restaurant' | 'factory';
        if (!byType[type]) continue;

        byType[type].total++;
        
        if (r.subscriptionStatus === 'active') byType[type].active++;
        else if (r.subscriptionStatus === 'expired') byType[type].expired++;
        else if (r.subscriptionStatus === 'cancelled') byType[type].cancelled++;

        const plan = r.subscriptionPlan as 'weekly' | 'monthly' | 'yearly';
        if (plan && byType[type].byPlan[plan] !== undefined) {
          byType[type].byPlan[plan]++;
        }
      }

      res.json({
        totalClients: allRestaurants.length,
        byType,
      });
    } catch (error) {
      console.error("Error fetching accounts by type:", error);
      res.status(500).json({ error: "Failed to fetch accounts breakdown" });
    }
  });

  // Download BSS Analysis Statement as PDF
  app.get("/api/it/bss-analysis/download-pdf", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;

      // Calculate all the same metrics as the overview endpoint
      const allRestaurants = await db
        .select()
        .from(restaurants);

      const allUsers = await db
        .select()
        .from(users)
        .where(isNotNull(users.restaurantId));

      // Build invoice date conditions
      const invoiceConditions = [];
      if (fromDate && typeof fromDate === 'string') {
        invoiceConditions.push(gte(subscriptionInvoices.invoiceDate, new Date(fromDate)));
      }
      if (toDate && typeof toDate === 'string') {
        invoiceConditions.push(lte(subscriptionInvoices.invoiceDate, new Date(toDate)));
      }
      const invoices = invoiceConditions.length > 0
        ? await db.select().from(subscriptionInvoices).where(and(...invoiceConditions))
        : await db.select().from(subscriptionInvoices);

      // Build bills date conditions
      const billsConditions = [];
      if (fromDate && typeof fromDate === 'string') {
        billsConditions.push(gte(companyBills.billDate, new Date(fromDate)));
      }
      if (toDate && typeof toDate === 'string') {
        billsConditions.push(lte(companyBills.billDate, new Date(toDate)));
      }
      const bills = billsConditions.length > 0
        ? await db.select().from(companyBills).where(and(...billsConditions))
        : await db.select().from(companyBills);

      // Build refund date conditions
      const refundConditions = [];
      if (fromDate && typeof fromDate === 'string') {
        refundConditions.push(gte(refundInvoices.createdAt, new Date(fromDate)));
      }
      if (toDate && typeof toDate === 'string') {
        refundConditions.push(lte(refundInvoices.createdAt, new Date(toDate)));
      }
      const refunds = refundConditions.length > 0
        ? await db.select().from(refundInvoices).where(and(...refundConditions))
        : await db.select().from(refundInvoices);

      // Calculate total refunds (VAT-inclusive at 15% Saudi VAT rate)
      const VAT_RATE = 0.15;
      let totalRefunds = 0;
      for (const refund of refunds) {
        totalRefunds += parseFloat(refund.refundAmount || "0");
      }

      // Calculate metrics (gross before refunds)
      let grossSubscriptionRevenue = 0;
      let grossVatCollected = 0;
      const planBreakdown = { weekly: 0, monthly: 0, yearly: 0 };
      const revenueByPlan = { weekly: 0, monthly: 0, yearly: 0 };

      for (const inv of invoices) {
        grossSubscriptionRevenue += parseFloat(inv.subtotal || "0");
        grossVatCollected += parseFloat(inv.vatAmount || "0");
        const plan = inv.subscriptionPlan as 'weekly' | 'monthly' | 'yearly';
        if (plan && planBreakdown[plan] !== undefined) {
          planBreakdown[plan]++;
          revenueByPlan[plan] += parseFloat(inv.subtotal || "0");
        }
      }

      // Calculate net revenue after refunds
      const netRefund = totalRefunds / (1 + VAT_RATE); // Net refund before VAT
      const refundVat = totalRefunds - netRefund;
      const subscriptionRevenue = grossSubscriptionRevenue - netRefund;
      const vatCollected = grossVatCollected - refundVat;

      let grossExpenses = 0;
      let expenseVat = 0;
      for (const bill of bills) {
        grossExpenses += parseFloat(bill.totalAmount || "0");
        expenseVat += parseFloat(bill.vatAmount || "0");
      }
      const netExpenses = grossExpenses - expenseVat; // Net expenses before VAT

      const totalRevenue = subscriptionRevenue + vatCollected;
      const netProfit = subscriptionRevenue - netExpenses; // Net revenue minus net expenses
      const netVat = vatCollected - expenseVat;
      const grossRevenue = grossSubscriptionRevenue + grossVatCollected;

      let restaurantCount = 0;
      let factoryCount = 0;
      let activeSubscriptions = 0;
      let expiredSubscriptions = 0;
      let cancelledSubscriptions = 0;

      for (const r of allRestaurants) {
        if (r.businessType === 'restaurant') restaurantCount++;
        else if (r.businessType === 'factory') factoryCount++;
        if (r.subscriptionStatus === 'active') activeSubscriptions++;
        else if (r.subscriptionStatus === 'expired') expiredSubscriptions++;
        else if (r.subscriptionStatus === 'cancelled') cancelledSubscriptions++;
      }

      // Get business info for the PDF
      const businessInfo = await storage.getBusinessInfo();

      // Generate PDF with refund metrics
      const pdfBuffer = await generateBssAnalysisStatementPDF({
        subscriptionRevenue,
        vatCollected,
        totalRevenue,
        totalInvoices: invoices.length,
        totalRefunds,
        refundCount: refunds.length,
        grossRevenue,
        totalExpenses: grossExpenses,
        expenseVat,
        totalBills: bills.length,
        netProfit,
        netVat,
        profitMargin: subscriptionRevenue > 0 ? (netProfit / subscriptionRevenue) * 100 : 0,
        totalClients: allRestaurants.length,
        totalAccounts: allUsers.length,
        restaurantCount,
        factoryCount,
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        planBreakdown,
        revenueByPlan,
        periodStart: fromDate ? new Date(fromDate as string) : new Date(new Date().getFullYear(), 0, 1),
        periodEnd: toDate ? new Date(toDate as string) : new Date(),
        businessInfo,
      });

      const filename = `bss-analysis-statement-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating BSS analysis PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
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
