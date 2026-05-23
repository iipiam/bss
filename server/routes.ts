import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { generateZATCAInvoice, generateSubscriptionInvoice, generateMonthlyVatReport, generateInvestorStatementPDF, generateBssAnalysisStatementPDF, generateRefundClearanceInvoice, getBrowser, generateMealSubscriptionSchedulePDF } from "./invoice";
import { PasswordResetMailer } from "./email";
import { sanitizePatchBody } from "./utils";
import { generateCompanyProfilePDF } from "./company-profile-pdf";
import { generateBusinessCardPDF } from "./business-card-pdf";
import { amountToWords, percentageToWords } from "./lib/numberToWords";
import { insertCompanyProfileSchema } from "@shared/schema";
import { logActivity } from "./activityLogger";
import { requirePermission, requireAnyPermission, requireAllPermissions, requireAction } from "./middleware/requirePermission";
import { hasAnyPermission } from "@shared/permissions";
import {
  processInvoiceForZatca,
  onboardToZatca,
  getProductionCSID,
  runComplianceChecks,
  retryPendingInvoices,
} from "./zatca/service";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import rateLimit from "express-rate-limit";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { sql, eq, and, gte, lte, isNull, isNotNull, desc, ne } from "drizzle-orm";
import * as XLSX from 'xlsx';
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
  insertViolationSchema,
  insertDeliveryAppSchema,
  insertDeliveryProfitabilitySchema,
  insertInvestorSchema,
  updateInvestorSchema,
  insertLicenseSchema,
  insertCompanyBillSchema,
  insertBusinessInfoSchema,
  insertPrinterSchema,
  insertMarketingDiscountCodeSchema,
  insertMarketingBroadcastTemplateSchema,
  users,
  restaurants,
  orders,
  subscriptionInvoices,
  refundInvoices,
  companyBills,
  businessInfo,
  procurement,
  deviceSerialNumbers,
  mealSubscriptions,
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
  type: 'order:created' | 'order:statusUpdated' | 'chat:message' | 'ticket:created' | 'ticket:updated' | 'ticket:message' | 'settings:updated' | 'menu:updated' | 'permissions:updated' | 'recipe:costUpdated' | 'sales:updated' | 'inventory:updated' | 'bills:updated' | 'salaries:updated';
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
    action: 'created' | 'updated' | 'deleted' | 'category-created' | 'category-updated' | 'category-deleted';
    item?: any;
    itemId?: string;
    category?: any;
    categoryId?: string;
  };
  // Recipe cost update fields
  updatedRecipeIds?: string[];
  // Sales update fields (for BEP real-time tracking)
  invoiceId?: string;
  invoiceTotal?: string;
  // Inventory update fields
  inventoryItemId?: string;
  inventoryItemName?: string;
  updatedFields?: string[];
}) {
  if (!wsClients) return;
  
  const message = JSON.stringify(event);
  let sentCount = 0;
  
  wsClients.forEach((client) => {
    if (client.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // For ticket events, also send to IT accounts (marked with 'IT_ACCOUNT' sentinel)
    const isTicketEvent = event.type === 'ticket:created' || event.type === 'ticket:updated' || event.type === 'ticket:message';
    const isITClient = client.restaurantId === 'IT_ACCOUNT';
    
    // Filter by restaurant for multi-tenant isolation (except IT accounts get all ticket events)
    if (!isITClient && client.restaurantId !== event.restaurantId) {
      return;
    }
    
    // For non-ticket events, IT clients should only receive events if they match the restaurant
    if (!isTicketEvent && isITClient && event.restaurantId) {
      return; // IT clients don't need non-ticket events from specific restaurants
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
  // IT accounts have restaurantId as null/undefined
  if (req.session.user.restaurantId) {
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

  // Violation document upload configuration
  const violationDocStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'violation-documents');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const restaurantId = (req as any).session?.user?.restaurantId;
      const ext = path.extname(file.originalname);
      const uniqueName = `violation-${restaurantId}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });

  const uploadViolationDoc = multer({
    storage: violationDocStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for PDFs and images
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, PNG, JPG, JPEG, GIF, and WebP allowed.'));
      }
    }
  });

  // Violation reference PDF upload configuration
  const violationReferenceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'violation-references');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const restaurantId = (req as any).session?.user?.restaurantId;
      const authority = (req as any).body?.authority || 'unknown';
      const ext = path.extname(file.originalname);
      const uniqueName = `ref-${restaurantId}-${authority}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });

  const uploadViolationReference = multer({
    storage: violationReferenceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for PDFs
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['.pdf'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF files allowed.'));
      }
    }
  });

  // Branches (Multi-tenant isolated)
  app.get("/api/branches", requireAuth, requireRestaurant, requirePermission('branches', 'pos'), async (req, res) => {
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

  // Device Serial Numbers (EGS for ZATCA) - Admin only access
  app.get("/api/device-serial-numbers", requireAuth, requireRestaurant, async (req, res) => {
    // Only admin users can access device serial numbers
    if (req.session.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    const restaurantId = req.session.user!.restaurantId!;
    const serials = await storage.getDeviceSerialNumbers(restaurantId);
    res.json(serials);
  });

  // IT-only endpoint to get device serial numbers for any restaurant
  app.get("/api/it/device-serial-numbers/:restaurantId", requireAuth, async (req, res) => {
    // Only IT accounts (restaurantId = null) can access this
    if (req.session.user!.restaurantId !== null) {
      return res.status(403).json({ error: "IT access only" });
    }
    // Validate restaurant ID is provided and valid format
    const targetRestaurantId = req.params.restaurantId;
    if (!targetRestaurantId || targetRestaurantId.length < 10) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }
    const serials = await storage.getDeviceSerialNumbers(targetRestaurantId);
    res.json(serials);
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
      const userId = req.session.user!.id;
      const userName = req.session.user!.fullName || req.session.user!.username;
      
      // Calculate and store unitPrice = price / quantity (stays fixed once entered)
      const parsedBody = { ...req.body, restaurantId };
      const qty = parseFloat(parsedBody.quantity) || 0;
      const price = parseFloat(parsedBody.price) || 0;
      if (qty > 0 && price > 0) {
        parsedBody.unitPrice = (price / qty).toFixed(2);
      } else {
        parsedBody.unitPrice = "0";
      }
      
      const data = insertInventoryItemSchema.parse(parsedBody);
      const item = await storage.createInventoryItem(data);
      
      // Auto-create procurement record for this inventory item
      try {
        const refQty = item.referenceQuantity ? parseInt(String(item.referenceQuantity), 10) : null;
        const invQty = item.quantity ? parseInt(String(item.quantity), 10) : null;
        const quantity = refQty || invQty || null;
        const unitPrice = refQty && refQty > 0 
          ? (parseFloat(item.price) / refQty).toFixed(2) 
          : null;
        
        const procurementData = {
          restaurantId,
          type: "inventory" as const,
          title: item.name,
          description: `Auto-generated from inventory: ${item.name}${item.category ? ` (${item.category})` : ''}`,
          supplier: item.supplier || null,
          category: item.category || null,
          quantity,
          unitPrice,
          totalCost: item.price,
          status: "received" as const,
          priority: "medium" as const,
          requestedBy: userName,
          approvedBy: userName,
          branchId: item.branchId || null,
          notes: `Inventory Item ID: ${item.id}`,
        };
        await storage.createProcurement(procurementData);
        console.log(`[INVENTORY] Auto-created procurement for inventory item: ${item.name}`);
      } catch (procError) {
        // Log but don't fail the main inventory creation
        console.error("[INVENTORY] Failed to auto-create procurement:", procError);
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'created_inventory',
          actionCategory: 'inventory',
          description: `Created inventory item ${item.name}`,
          entityType: 'inventory',
          entityId: item.id,
          branchId: item.branchId || undefined,
        }).catch(err => console.error('Activity log error:', err));
      }
      
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
      // Coerce numeric fields to strings before schema validation (schema expects strings for text columns)
      const body = { ...req.body };
      if (body.quantity !== undefined) body.quantity = String(body.quantity);
      if (body.referenceQuantity !== undefined) body.referenceQuantity = String(body.referenceQuantity);
      if (body.price !== undefined) body.price = String(body.price);
      if (body.expirationDays !== undefined && body.expirationDays !== null) body.expirationDays = Number(body.expirationDays);
      const data = sanitizePatchBody(body, insertInventoryItemSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      // Also strip unitPrice - it should never be changed after initial creation
      const { restaurantId: _, unitPrice: __, ...safeData } = data;
      
      // Check if price, quantity, or unit is being updated - need to update recipes
      const priceOrQuantityChanged = safeData.price !== undefined || safeData.quantity !== undefined;
      const unitChanged = safeData.unit !== undefined;
      let oldItem: any = null;
      if (priceOrQuantityChanged || unitChanged) {
        oldItem = await storage.getInventoryItem(req.params.id, restaurantId);
      }
      
      const item = await storage.updateInventoryItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Broadcast inventory update for real-time sync (especially unit changes)
      const updatedFields = Object.keys(safeData);
      broadcastNotification({
        type: 'inventory:updated',
        restaurantId,
        inventoryItemId: req.params.id,
        inventoryItemName: item.name,
        updatedFields,
      });
      
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
      
      // If unit changed, update all recipe ingredients that use this inventory item
      if (unitChanged && oldItem && oldItem.unit !== item.unit) {
        const updatedRecipes = await storage.updateRecipeUnitsForInventoryItem(req.params.id, restaurantId, item.unit);
        console.log(`[INVENTORY] Updated unit from "${oldItem.unit}" to "${item.unit}" for ${updatedRecipes.length} recipes`);
        
        // Broadcast recipe update notification for real-time updates
        if (updatedRecipes.length > 0) {
          broadcastNotification({
            type: 'recipe:costUpdated',
            restaurantId,
            updatedRecipeIds: updatedRecipes.map(r => r.id),
          });
        }
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'updated_inventory',
          actionCategory: 'inventory',
          description: `Updated inventory item ${item.name}`,
          entityType: 'inventory',
          entityId: item.id,
          branchId: item.branchId || undefined,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.json(item);
    } catch (error: any) {
      console.error('[INVENTORY PATCH] Error:', error.message || error);
      res.status(400).json({ error: error.message || "Invalid inventory data" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, requireRestaurant, requireAction('inventory', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // Get item name before deletion for logging
    const itemToDelete = await storage.getInventoryItem(req.params.id, restaurantId);
    
    const success = await storage.deleteInventoryItem(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // Fire-and-forget activity logging
    if (req.session.user && itemToDelete) {
      logActivity({
        restaurantId,
        employeeId: req.session.user.id,
        employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
        action: 'deleted_inventory',
        actionCategory: 'inventory',
        description: `Deleted inventory item ${itemToDelete.name}`,
        entityType: 'inventory',
        entityId: req.params.id,
        branchId: itemToDelete.branchId || undefined,
      }).catch(err => console.error('Activity log error:', err));
    }
    
    res.status(204).send();
  });

  // Menu - disable caching for real-time updates to POS
  app.get("/api/menu", requireAuth, requireRestaurant, requirePermission('menu', 'pos'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const items = await storage.getMenuItems(restaurantId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(items);
  });

  // Menu Stock (based on inventory and recipes) - MUST be before /:id route
  app.get("/api/menu/stock", requireAuth, requireRestaurant, requirePermission('menu', 'pos'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const stock = await storage.getMenuItemsStock(restaurantId, branchId);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(stock);
    } catch (error) {
      console.error('[MENU STOCK] Error calculating stock:', error);
      // Return empty stock object on error to prevent UI crashes
      res.json({});
    }
  });

  app.get("/api/menu/:id", requireAuth, requireRestaurant, requirePermission('menu', 'pos'), async (req, res) => {
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
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'created_menu_item',
          actionCategory: 'menu',
          description: `Created menu item ${item.name}`,
          entityType: 'menu_item',
          entityId: item.id,
        }).catch(err => console.error('Activity log error:', err));
      }
      
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
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'updated_menu_item',
          actionCategory: 'menu',
          description: `Updated menu item ${item.name}`,
          entityType: 'menu_item',
          entityId: item.id,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });

  app.delete("/api/menu/:id", requireAuth, requireRestaurant, requireAction('menu', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const menuItemId = req.params.id;
    
    // Get item name before deletion for logging
    const itemToDelete = await storage.getMenuItem(menuItemId, restaurantId);
    
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
    
    // Fire-and-forget activity logging
    if (req.session.user && itemToDelete) {
      logActivity({
        restaurantId,
        employeeId: req.session.user.id,
        employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
        action: 'deleted_menu_item',
        actionCategory: 'menu',
        description: `Deleted menu item ${itemToDelete.name}`,
        entityType: 'menu_item',
        entityId: menuItemId,
      }).catch(err => console.error('Activity log error:', err));
    }
    
    res.status(204).send();
  });

  // Menu Categories - custom categories that persist across sessions
  app.get("/api/menu-categories", requireAuth, requireRestaurant, requirePermission('menu', 'pos'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const categories = await storage.getMenuCategories(restaurantId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(categories);
  });

  app.post("/api/menu-categories", requireAuth, requireRestaurant, requireAction('menu', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Category name is required" });
      }
      const category = await storage.createMenuCategory({ restaurantId, name: name.trim() });
      
      // Broadcast category update to all connected clients
      broadcastNotification({
        type: 'menu:updated',
        restaurantId,
        data: { action: 'category-created', category }
      });
      
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.patch("/api/menu-categories/:id", requireAuth, requireRestaurant, requireAction('menu', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Category name is required" });
      }
      const category = await storage.updateMenuCategory(req.params.id, restaurantId, { name: name.trim() });
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Broadcast category update to all connected clients
      broadcastNotification({
        type: 'menu:updated',
        restaurantId,
        data: { action: 'category-updated', category }
      });
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/menu-categories/:id", requireAuth, requireRestaurant, requireAction('menu', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const categoryId = req.params.id;
    const success = await storage.deleteMenuCategory(categoryId, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Broadcast category update to all connected clients
    broadcastNotification({
      type: 'menu:updated',
      restaurantId,
      data: { action: 'category-deleted', categoryId }
    });
    
    res.status(204).send();
  });

  // Add-ons - disable caching for real-time updates to POS
  app.get("/api/addons", requireAuth, requireRestaurant, requirePermission('menu', 'pos'), async (req, res) => {
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
  app.get("/api/customers", requireAuth, requireRestaurant, requirePermission('customers', 'pos'), async (req, res) => {
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
    } catch (error: any) {
      console.error("[SALARY PATCH] Error:", error);
      const isSchemaError = error.message?.includes('does not exist') || error.message?.includes('column');
      const safeMessage = isSchemaError 
        ? "Database schema needs update. Please run 'npm run db:push' on the server."
        : "Invalid salary data";
      res.status(400).json({ error: safeMessage });
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

  // Sync Salaries from Employee profiles
  app.post("/api/shop/salaries/sync", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const result = await storage.syncSalariesFromEmployees(restaurantId);
      
      // Broadcast real-time update
      broadcastNotification({
        type: 'salaries:updated',
        restaurantId,
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("[SALARY SYNC] Error:", error);
      res.status(500).json({ error: "Failed to sync salaries" });
    }
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
      
      // Broadcast real-time update for Operating Expenses tracking
      broadcastNotification({
        type: 'bills:updated',
        restaurantId,
      });
      console.log(`[SHOP] Bill created - broadcasting real-time update for restaurant ${restaurantId}`);
      
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
      // Coerce numeric fields to strings before schema validation (schema expects strings for text columns)
      const body = { ...req.body };
      if (body.amount !== undefined) body.amount = String(body.amount);
      // Convert ISO date string to Date object if present
      const bodyWithDate = {
        ...body,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      };
      // Remove undefined paymentDate to avoid overwriting with undefined
      if (bodyWithDate.paymentDate === undefined) {
        delete bodyWithDate.paymentDate;
      }
      const data = sanitizePatchBody(bodyWithDate, insertShopBillSchema.partial());
      const bill = await storage.updateShopBill(req.params.id, restaurantId, data);
      
      // Broadcast real-time update for Operating Expenses tracking
      broadcastNotification({
        type: 'bills:updated',
        restaurantId,
      });
      console.log(`[SHOP] Bill updated - broadcasting real-time update for restaurant ${restaurantId}`);
      
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
    const success = await storage.deleteShopBill(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    // Broadcast real-time update for Operating Expenses tracking
    broadcastNotification({
      type: 'bills:updated',
      restaurantId,
    });
    console.log(`[SHOP] Bill deleted - broadcasting real-time update for restaurant ${restaurantId}`);
    
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
      
      // Broadcast real-time update for Operating Expenses tracking
      broadcastNotification({
        type: 'bills:updated',
        restaurantId,
      });
      
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
      
      // Broadcast real-time updates for Fixed Costs and Operating Expenses
      broadcastNotification({
        type: 'salaries:updated',
        restaurantId,
      });
      broadcastNotification({
        type: 'bills:updated',
        restaurantId,
      });
      console.log(`[SHOP] Salary bills generated - broadcasting real-time update for restaurant ${restaurantId}`);
      
      res.json(result);
    } catch (error: any) {
      console.error("Failed to generate salary bills:", error);
      // Return safe error message without exposing internal details
      const isSchemaError = error.message?.includes('does not exist') || error.message?.includes('column');
      const safeMessage = isSchemaError 
        ? "Database schema needs update. Please run 'npm run db:push' on the server."
        : "Failed to generate salary bills. Please try again.";
      res.status(500).json({ error: safeMessage });
    }
  });

  // Shop Files - Configure multer for shop document uploads
  const shopFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'shop-files');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'shop-' + uniqueSuffix + ext);
    }
  });

  const uploadShopFile = multer({
    storage: shopFileStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ['application/pdf'];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF documents are allowed!'));
    }
  });

  // Multer config for signup file uploads (same storage as shop files)
  const uploadSignupFiles = multer({
    storage: shopFileStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ['application/pdf'];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF documents are allowed!'));
    }
  }).fields([
    { name: 'crCertificate', maxCount: 1 },
    { name: 'vatCertificate', maxCount: 1 },
    { name: 'ibanCertificate', maxCount: 1 },
    { name: 'nationalAddress', maxCount: 1 }
  ]);

  // Get all shop files for a restaurant
  app.get("/api/shop/files", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const files = await storage.getShopFiles(restaurantId);
      res.json(files);
    } catch (error) {
      console.error("[SHOP FILES] Get files error:", error);
      res.status(500).json({ error: "Failed to get shop files" });
    }
  });

  // Upload a shop file
  app.post("/api/shop/files/upload", requireAuth, requireRestaurant, requireAction('bills', 'add'), uploadShopFile.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const fileType = req.body.fileType;

      // Validate file type
      const validTypes = ['cr_certificate', 'vat_certificate', 'iban_certificate', 'national_address'];
      if (!fileType || !validTypes.includes(fileType)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid file type. Must be one of: " + validTypes.join(', ') });
      }

      // Check if file of this type already exists
      const existingFile = await storage.getShopFileByType(restaurantId, fileType);
      if (existingFile) {
        // Delete old file from disk
        const oldPath = path.join(process.cwd(), existingFile.filePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
        // Delete old record
        await storage.deleteShopFile(existingFile.id, restaurantId);
      }

      // Create new file record
      const fileRecord = await storage.createShopFile({
        restaurantId,
        fileType,
        fileName: req.file.originalname,
        filePath: `uploads/shop-files/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
      });

      res.status(201).json(fileRecord);
    } catch (error) {
      console.error("[SHOP FILES] Upload error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Download a shop file
  app.get("/api/shop/files/:id/download", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const file = await storage.getShopFile(req.params.id, restaurantId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(process.cwd(), file.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader('Content-Type', file.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("[SHOP FILES] Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Delete a shop file
  app.delete("/api/shop/files/:id", requireAuth, requireRestaurant, requireAction('bills', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const file = await storage.getShopFile(req.params.id, restaurantId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record from database
      await storage.deleteShopFile(req.params.id, restaurantId);
      res.status(204).send();
    } catch (error) {
      console.error("[SHOP FILES] Delete error:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Shop Bill Invoice Upload - Configure multer for bill invoice uploads
  const shopBillInvoiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'shop-bill-invoices');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'bill-invoice-' + uniqueSuffix + ext);
    }
  });

  const uploadShopBillInvoice = multer({
    storage: shopBillInvoiceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF, JPEG, PNG, GIF, and WebP files are allowed for bill invoices!'));
    }
  });

  // Upload invoice to a shop bill
  app.post("/api/shop/bills/:id/invoice", requireAuth, requireRestaurant, requireAction('bills', 'edit'), uploadShopBillInvoice.single('invoice'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const restaurantId = req.session.user!.restaurantId!;
      const billId = req.params.id;

      // Check if bill exists and belongs to restaurant
      const existing = await storage.getShopBill(billId);
      if (!existing || existing.restaurantId !== restaurantId) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Bill not found" });
      }

      // Delete old invoice if exists
      if (existing.invoiceImage) {
        const oldPath = path.join(process.cwd(), existing.invoiceImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update bill with new invoice path
      const invoicePath = `uploads/shop-bill-invoices/${req.file.filename}`;
      const bill = await storage.updateShopBill(billId, restaurantId, { invoiceImage: invoicePath });
      
      console.log(`[SHOP BILLS] Invoice uploaded for bill ${billId}`);
      res.json(bill);
    } catch (error) {
      console.error("[SHOP BILLS] Invoice upload error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload invoice" });
    }
  });

  // Download/view invoice for a shop bill
  app.get("/api/shop/bills/:id/invoice", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const bill = await storage.getShopBill(req.params.id);
      
      if (!bill || bill.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }

      if (!bill.invoiceImage) {
        return res.status(404).json({ error: "No invoice attached to this bill" });
      }

      const filePath = path.join(process.cwd(), bill.invoiceImage);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Invoice file not found on disk" });
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="bill-invoice${ext}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("[SHOP BILLS] Invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });

  // Delete invoice from a shop bill
  app.delete("/api/shop/bills/:id/invoice", requireAuth, requireRestaurant, requireAction('bills', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const bill = await storage.getShopBill(req.params.id);
      
      if (!bill || bill.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }

      if (!bill.invoiceImage) {
        return res.status(404).json({ error: "No invoice attached to this bill" });
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), bill.invoiceImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update bill to remove invoice path
      const updatedBill = await storage.updateShopBill(req.params.id, restaurantId, { invoiceImage: null });
      
      console.log(`[SHOP BILLS] Invoice deleted for bill ${req.params.id}`);
      res.json(updatedBill);
    } catch (error) {
      console.error("[SHOP BILLS] Invoice delete error:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Violations
  app.get("/api/violations", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const authority = req.query.authority as string | undefined;
      const status = req.query.status as string | undefined;
      const violations = await storage.getViolations(restaurantId, branchId, authority, status);
      res.json(violations);
    } catch (error) {
      console.error("[VIOLATIONS] Get violations error:", error);
      res.status(500).json({ error: "Failed to get violations" });
    }
  });

  app.get("/api/violations/stats", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const stats = await storage.getViolationStats(restaurantId);
      res.json(stats);
    } catch (error) {
      console.error("[VIOLATIONS] Get stats error:", error);
      res.status(500).json({ error: "Failed to get violation statistics" });
    }
  });

  app.get("/api/violations/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const violation = await storage.getViolation(req.params.id, restaurantId);
      if (!violation) {
        return res.status(404).json({ error: "Violation not found" });
      }
      res.json(violation);
    } catch (error) {
      console.error("[VIOLATIONS] Get violation error:", error);
      res.status(500).json({ error: "Failed to get violation" });
    }
  });

  app.post("/api/violations", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertViolationSchema.parse({ ...req.body, restaurantId });
      const violation = await storage.createViolation(data);
      res.status(201).json(violation);
    } catch (error) {
      console.error("[VIOLATIONS] Create violation error:", error);
      res.status(400).json({ error: "Invalid violation data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/violations/:id", requireAuth, requireRestaurant, requireAction('bills', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getViolation(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Violation not found" });
      }
      // Convert date strings to Date objects
      const bodyWithDates = { ...req.body };
      if (bodyWithDates.violationDate && typeof bodyWithDates.violationDate === 'string') {
        bodyWithDates.violationDate = new Date(bodyWithDates.violationDate);
      }
      if (bodyWithDates.resolvedDate && typeof bodyWithDates.resolvedDate === 'string') {
        bodyWithDates.resolvedDate = new Date(bodyWithDates.resolvedDate);
      }
      const data = sanitizePatchBody(bodyWithDates, insertViolationSchema.partial());
      const violation = await storage.updateViolation(req.params.id, restaurantId, data as any);
      res.json(violation);
    } catch (error) {
      console.error("[VIOLATIONS] Update violation error:", error);
      res.status(400).json({ error: "Invalid violation data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/violations/:id", requireAuth, requireRestaurant, requireAction('bills', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getViolation(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Violation not found" });
      }
      const success = await storage.deleteViolation(req.params.id, restaurantId);
      if (!success) {
        return res.status(404).json({ error: "Violation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("[VIOLATIONS] Delete violation error:", error);
      res.status(500).json({ error: "Failed to delete violation" });
    }
  });

  // Violation document upload
  app.post("/api/violations/:id/document", requireAuth, requireRestaurant, requireAction('bills', 'edit'), uploadViolationDoc.single('document'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getViolation(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Violation not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No document file uploaded" });
      }
      
      // Store the file path relative to uploads directory
      const documentPath = `uploads/${req.file.filename}`;
      const violation = await storage.updateViolation(req.params.id, restaurantId, { documentPath });
      res.json(violation);
    } catch (error) {
      console.error("[VIOLATIONS] Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Create bill from violation (link violation to one-time bill payment)
  app.post("/api/violations/:id/create-bill", requireAuth, requireRestaurant, requireAction('bills', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getViolation(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Violation not found" });
      }
      
      // Check if violation already has a linked bill
      if (existing.linkedBillId) {
        return res.status(400).json({ error: "Violation already has a linked bill" });
      }
      
      // Create the shop bill
      const billData = {
        restaurantId,
        branchId: existing.branchId,
        billType: 'one_time' as const,
        amount: existing.feeAmount,
        description: `Violation: ${existing.title} (${existing.authority})`,
        paymentDate: new Date(),
        paymentPeriod: 'one_time' as const,
        status: 'pending' as const,
        archived: false,
      };
      
      const bill = await storage.createShopBill(billData);
      
      // Link the bill to the violation
      await storage.updateViolation(req.params.id, restaurantId, { linkedBillId: bill.id });
      
      res.status(201).json({ violation: { ...existing, linkedBillId: bill.id }, bill });
    } catch (error) {
      console.error("[VIOLATIONS] Create bill error:", error);
      res.status(500).json({ error: "Failed to create bill from violation" });
    }
  });

  // Violation References (MULTI-TENANT: PDF documents per authority type)
  app.get("/api/violation-references", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const authority = req.query.authority as string | undefined;
      const references = await storage.getViolationReferences(restaurantId, authority);
      res.json(references);
    } catch (error) {
      console.error("[VIOLATION-REFERENCES] Get error:", error);
      res.status(500).json({ error: "Failed to fetch violation references" });
    }
  });

  app.get("/api/violation-references/:id", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const reference = await storage.getViolationReference(req.params.id, restaurantId);
      if (!reference) {
        return res.status(404).json({ error: "Violation reference not found" });
      }
      res.json(reference);
    } catch (error) {
      console.error("[VIOLATION-REFERENCES] Get by ID error:", error);
      res.status(500).json({ error: "Failed to fetch violation reference" });
    }
  });

  app.post("/api/violation-references", requireAuth, requireRestaurant, requireAction('bills', 'add'), uploadViolationReference.single('file'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const { authority, title: rawTitle, description: rawDescription } = req.body;
      
      // Trim and validate title/description
      const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
      
      if (!authority || !title) {
        return res.status(400).json({ error: "Authority and title are required" });
      }
      
      if (title.length > 255) {
        return res.status(400).json({ error: "Title must be 255 characters or less" });
      }
      
      if (description.length > 1000) {
        return res.status(400).json({ error: "Description must be 1000 characters or less" });
      }
      
      const validAuthorities = ['municipality', 'zatca', 'police', 'ministry_of_commerce'];
      if (!validAuthorities.includes(authority)) {
        return res.status(400).json({ error: "Invalid authority type" });
      }
      
      const reference = await storage.createViolationReference({
        restaurantId,
        authority,
        title,
        description: description || null,
        documentPath: file.path,
      });
      
      res.status(201).json(reference);
    } catch (error) {
      console.error("[VIOLATION-REFERENCES] Create error:", error);
      res.status(500).json({ error: "Failed to create violation reference" });
    }
  });

  app.delete("/api/violation-references/:id", requireAuth, requireRestaurant, requireAction('bills', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const reference = await storage.getViolationReference(req.params.id, restaurantId);
      
      if (!reference) {
        return res.status(404).json({ error: "Violation reference not found" });
      }
      
      // Delete the file from disk
      if (reference.documentPath && fs.existsSync(reference.documentPath)) {
        fs.unlinkSync(reference.documentPath);
      }
      
      const deleted = await storage.deleteViolationReference(req.params.id, restaurantId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("[VIOLATION-REFERENCES] Delete error:", error);
      res.status(500).json({ error: "Failed to delete violation reference" });
    }
  });

  // Serve violation reference files
  app.get("/api/violation-references/:id/file", requireAuth, requireRestaurant, requirePermission('bills'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const reference = await storage.getViolationReference(req.params.id, restaurantId);
      
      if (!reference) {
        return res.status(404).json({ error: "Violation reference not found" });
      }
      
      if (!reference.documentPath || !fs.existsSync(reference.documentPath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Extract filename from the document path
      const fileName = path.basename(reference.documentPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.sendFile(path.resolve(reference.documentPath));
    } catch (error) {
      console.error("[VIOLATION-REFERENCES] File serve error:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // Printers (Settings)
  app.get("/api/printers", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      const printers = await storage.getPrinters(restaurantId, branchId);
      res.json(printers);
    } catch (error) {
      console.error("[PRINTERS] Get error:", error);
      res.status(500).json({ error: "Failed to fetch printers" });
    }
  });

  app.get("/api/printers/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const printer = await storage.getPrinter(req.params.id, restaurantId);
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }
      res.json(printer);
    } catch (error) {
      console.error("[PRINTERS] Get by ID error:", error);
      res.status(500).json({ error: "Failed to fetch printer" });
    }
  });

  app.post("/api/printers", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertPrinterSchema.parse({ ...req.body, restaurantId });
      const printer = await storage.createPrinter(data);
      res.status(201).json(printer);
    } catch (error) {
      console.error("[PRINTERS] Create error:", error);
      res.status(400).json({ error: "Invalid printer data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/printers/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getPrinter(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Printer not found" });
      }
      const data = sanitizePatchBody(req.body, insertPrinterSchema.partial());
      const printer = await storage.updatePrinter(req.params.id, restaurantId, data);
      res.json(printer);
    } catch (error) {
      console.error("[PRINTERS] Update error:", error);
      res.status(400).json({ error: "Invalid printer data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/printers/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getPrinter(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Printer not found" });
      }
      const success = await storage.deletePrinter(req.params.id, restaurantId);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete printer" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("[PRINTERS] Delete error:", error);
      res.status(500).json({ error: "Failed to delete printer" });
    }
  });

  app.post("/api/printers/:id/set-default", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { branchId } = req.body;
      const existing = await storage.getPrinter(req.params.id, restaurantId);
      if (!existing) {
        return res.status(404).json({ error: "Printer not found" });
      }
      const printer = await storage.setDefaultPrinter(req.params.id, restaurantId, branchId);
      res.json(printer);
    } catch (error) {
      console.error("[PRINTERS] Set default error:", error);
      res.status(500).json({ error: "Failed to set default printer" });
    }
  });

  // Print to thermal/network printer via raw TCP socket
  app.post("/api/printers/:id/print", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Print text is required" });
      }

      const printer = await storage.getPrinter(req.params.id, restaurantId);
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }

      // Only network printers are supported for now
      if (printer.connectionType !== 'network') {
        return res.status(400).json({ 
          error: "Only network printers are supported for direct printing. USB and Bluetooth printers require client-side printing via QZ Tray or browser print dialog." 
        });
      }

      if (!printer.ipAddress) {
        return res.status(400).json({ error: "Printer IP address is not configured" });
      }

      // Import net module for TCP socket
      const net = await import('net');
      
      // ESC/POS commands
      const ESC = '\x1B';
      const GS = '\x1D';
      const INIT = ESC + '@';           // Initialize printer
      const ALIGN_CENTER = ESC + 'a' + '\x01';
      const ALIGN_LEFT = ESC + 'a' + '\x00';
      const CUT_PAPER = GS + 'V' + '\x00';  // Full cut
      const FEED_LINES = '\n\n\n\n';    // Feed paper before cut
      
      // Build print data with ESC/POS commands
      const printData = Buffer.from(
        INIT +                    // Initialize printer
        ALIGN_LEFT +              // Left align
        text +                    // The actual text content
        FEED_LINES +              // Feed paper
        CUT_PAPER,                // Cut paper
        'utf8'
      );

      // Send to printer via TCP socket on port 9100 (standard for thermal printers)
      const PRINTER_PORT = 9100;
      const TIMEOUT_MS = 10000; // 10 second timeout

      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        let resolved = false;

        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
          }
        };

        // Set timeout
        socket.setTimeout(TIMEOUT_MS);

        socket.on('timeout', () => {
          cleanup();
          reject(new Error('Connection timeout - printer may be offline or unreachable'));
        });

        socket.on('error', (err: Error) => {
          cleanup();
          reject(new Error(`Printer connection error: ${err.message}`));
        });

        socket.on('close', () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        });

        // Connect to printer
        socket.connect(PRINTER_PORT, printer.ipAddress!, () => {
          // Send print data
          socket.write(printData, (err) => {
            if (err) {
              cleanup();
              reject(new Error(`Failed to send print data: ${err.message}`));
            } else {
              // Close connection after sending
              socket.end();
            }
          });
        });
      });

      console.log(`[PRINTERS] Print job sent successfully to ${printer.name} (${printer.ipAddress})`);
      res.json({ success: true, message: "Print job sent successfully" });

    } catch (error) {
      console.error("[PRINTERS] Print error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to print";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Delivery Apps
  app.get("/api/delivery-apps", requireAuth, requireRestaurant, requirePermission('deliveryApps', 'pos'), async (req, res) => {
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

  // Delivery Profitability Manual Entries
  app.get("/api/delivery-profitability", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const entries = await storage.getDeliveryProfitability(restaurantId, year);
      res.json(entries);
    } catch (error) {
      console.error("[DELIVERY_PROFITABILITY] Get entries error:", error);
      res.status(500).json({ error: "Failed to get delivery profitability entries" });
    }
  });

  app.get("/api/delivery-profitability/:id", requireAuth, requireRestaurant, requirePermission('deliveryApps'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const entry = await storage.getDeliveryProfitabilityEntry(req.params.id);
      if (!entry || entry.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("[DELIVERY_PROFITABILITY] Get entry error:", error);
      res.status(500).json({ error: "Failed to get delivery profitability entry" });
    }
  });

  app.post("/api/delivery-profitability", requireAuth, requireRestaurant, requireAction('deliveryApps', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertDeliveryProfitabilitySchema.parse({ ...req.body, restaurantId });
      const entry = await storage.upsertDeliveryProfitability(data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("[DELIVERY_PROFITABILITY] Create entry error:", error);
      res.status(400).json({ error: "Invalid delivery profitability data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/delivery-profitability/:id", requireAuth, requireRestaurant, requireAction('deliveryApps', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getDeliveryProfitabilityEntry(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Entry not found" });
      }
      const data = sanitizePatchBody(req.body, insertDeliveryProfitabilitySchema.partial());
      const entry = await storage.updateDeliveryProfitability(req.params.id, data);
      res.json(entry);
    } catch (error) {
      console.error("[DELIVERY_PROFITABILITY] Update entry error:", error);
      res.status(400).json({ error: "Invalid delivery profitability data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/delivery-profitability/:id", requireAuth, requireRestaurant, requireAction('deliveryApps', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const existing = await storage.getDeliveryProfitabilityEntry(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Entry not found" });
      }
      const success = await storage.deleteDeliveryProfitability(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("[DELIVERY_PROFITABILITY] Delete entry error:", error);
      res.status(500).json({ error: "Failed to delete entry" });
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

  // BEP (Break-Even Point) Analytics
  app.get("/api/analytics/bep", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const yearParam = req.query.year as string;
      
      // Validate year parameter
      const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ error: "Invalid year parameter. Must be a valid year between 2000 and 2100." });
      }
      
      const bepMetrics = await storage.getBepMetrics(restaurantId, year);
      res.json(bepMetrics);
    } catch (error) {
      console.error("[ANALYTICS] BEP metrics error:", error);
      res.status(500).json({ error: "Failed to calculate BEP metrics" });
    }
  });

  // Menu Item Profitability Analysis - diagnose which items are losing money
  app.get("/api/analytics/menu-profitability", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Get all menu items with their recipes
      const allMenuItems = await storage.getMenuItems(restaurantId);
      const allRecipes = await storage.getRecipes(restaurantId);
      const allInventory = await storage.getInventoryItems(restaurantId);
      
      // Create lookup maps
      const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
      const inventoryMap = new Map(allInventory.map(inv => [inv.id, inv]));
      
      // Calculate profitability for each menu item
      const profitabilityReport = allMenuItems.map(menuItem => {
        const basePrice = parseFloat(menuItem.basePrice) || 0;
        const portionSize = parseFloat(menuItem.portionSize || "1") || 1;
        
        let recipeCost = 0;
        let costSource = "none";
        let linkedName = "";
        
        // Check if linked to recipe
        if (menuItem.recipeId) {
          const recipe = recipeMap.get(menuItem.recipeId);
          if (recipe) {
            recipeCost = parseFloat(recipe.cost) || 0;
            costSource = "recipe";
            linkedName = recipe.name;
          }
        }
        // Check if linked to inventory
        else if (menuItem.inventoryItemId) {
          const inventory = inventoryMap.get(menuItem.inventoryItemId);
          if (inventory) {
            const unitPrice = parseFloat(inventory.unitPrice || "0") || 
                             (parseFloat(inventory.price || "0") / (parseFloat(inventory.quantity || "1") || 1));
            recipeCost = unitPrice;
            costSource = "inventory";
            linkedName = inventory.name;
          }
        }
        
        const actualCost = recipeCost * portionSize;
        const profitMargin = basePrice - actualCost;
        const profitMarginPercent = basePrice > 0 ? (profitMargin / basePrice) * 100 : 0;
        
        return {
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          category: menuItem.category,
          sellingPrice: basePrice,
          portionSize: portionSize,
          costSource: costSource,
          linkedTo: linkedName,
          unitCost: recipeCost,
          actualCost: actualCost,
          profitMargin: profitMargin,
          profitMarginPercent: profitMarginPercent,
          status: profitMargin < 0 ? "LOSS" : profitMargin < basePrice * 0.2 ? "LOW_MARGIN" : "OK"
        };
      });
      
      // Sort by profit margin (worst first)
      profitabilityReport.sort((a, b) => a.profitMargin - b.profitMargin);
      
      // Summary statistics
      const lossItems = profitabilityReport.filter(item => item.status === "LOSS");
      const lowMarginItems = profitabilityReport.filter(item => item.status === "LOW_MARGIN");
      const okItems = profitabilityReport.filter(item => item.status === "OK");
      const unlinkedItems = profitabilityReport.filter(item => item.costSource === "none");
      
      const totalPotentialLoss = lossItems.reduce((sum, item) => sum + Math.abs(item.profitMargin), 0);
      
      res.json({
        summary: {
          totalMenuItems: profitabilityReport.length,
          lossItems: lossItems.length,
          lowMarginItems: lowMarginItems.length,
          okItems: okItems.length,
          unlinkedItems: unlinkedItems.length,
          totalPotentialLossPerUnit: totalPotentialLoss
        },
        lossLeaders: lossItems,
        lowMargin: lowMarginItems,
        profitable: okItems,
        unlinked: unlinkedItems,
        allItems: profitabilityReport
      });
    } catch (error) {
      console.error("[ANALYTICS] Menu profitability error:", error);
      res.status(500).json({ error: "Failed to calculate menu profitability" });
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

  // Monthly Investor Earnings Report - Must come before :id route
  app.get("/api/investors/monthly-report", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { month, year } = req.query;
      
      // Parse month/year or default to current month
      const now = new Date();
      const targetMonth = parseInt(month as string) || (now.getMonth() + 1); // 1-indexed
      const targetYear = parseInt(year as string) || now.getFullYear();
      
      // Get all active investors
      const investors = await storage.getInvestors(restaurantId);
      const activeInvestors = investors.filter((i: any) => i.active !== false);
      
      // Get financial data for the specific month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      
      const transactions = await storage.getTransactions({ restaurantId });
      const orders = await storage.getOrders({ restaurantId });
      const menuItems = await storage.getMenuItems(restaurantId);
      const recipes = await storage.getRecipes(restaurantId);
      const salaries = await storage.getSalaries(restaurantId);
      const shopBills = await storage.getShopBills(restaurantId);
      
      // Filter transactions and orders for the target month
      const monthlyTransactions = transactions.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        return txDate >= startDate && txDate <= endDate;
      });
      
      const validOrderStatuses = ['Completed', 'Ready', 'Preparing', 'Paid'];
      const monthlyOrders = orders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate <= endDate && validOrderStatuses.includes(o.status);
      });
      
      // Calculate total revenue from monthly transactions
      const totalRevenue = monthlyTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.total || "0"), 0);
      
      // Calculate COGS from monthly orders
      let totalCOGS = 0;
      monthlyOrders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const menuItem = menuItems.find((m: any) => m.id === item.id);
            if (menuItem && menuItem.recipeId) {
              const recipe = recipes.find((r: any) => r.id === menuItem.recipeId);
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
      
      // Calculate total salaries
      const totalSalaries = salaries.reduce((sum: number, s: any) => sum + parseFloat(s.amount || "0"), 0);
      
      // Calculate recurring bills (prorated to monthly)
      const recurringBills = shopBills.filter((b: any) => {
        const billType = String(b.billType || '').toLowerCase();
        const paymentPeriod = String(b.paymentPeriod || '').toLowerCase();
        return billType !== 'foundational' && 
               paymentPeriod !== 'one-time' && 
               paymentPeriod !== 'onetime';
      });
      
      const getMonthlyAmount = (amount: number, period: string): number => {
        const normalized = String(period || 'monthly').toLowerCase();
        switch (normalized) {
          case 'weekly': return amount * 4.33;
          case 'monthly': return amount;
          case 'quarterly': return amount / 3;
          case 'semi-annually':
          case 'semiannually':
          case 'semi-annual': return amount / 6;
          case 'yearly':
          case 'annually': return amount / 12;
          default: return amount;
        }
      };
      
      const totalBills = recurringBills.reduce((sum: number, b: any) => {
        const rawAmount = parseFloat(b.amount || "0");
        return sum + getMonthlyAmount(rawAmount, b.paymentPeriod || 'monthly');
      }, 0);
      
      // Get delivery profitability for this month (delivery is a separate revenue stream)
      const deliveryEntries = await storage.getDeliveryProfitability(restaurantId, targetYear);
      const monthlyDeliveryEntries = deliveryEntries.filter((e: any) => e.month === targetMonth);
      
      let deliveryRevenue = 0;
      let deliveryFees = 0;
      
      for (const entry of monthlyDeliveryEntries) {
        deliveryRevenue += parseFloat(String(entry.sales || '0'));
        deliveryFees += parseFloat(String(entry.commission || '0'));
        deliveryFees += parseFloat(String(entry.banking || '0'));
        deliveryFees += parseFloat(String(entry.vat || '0'));
        deliveryFees += parseFloat(String(entry.posFees || '0'));
      }
      
      // Calculate net profit: POS revenue + delivery revenue - COGS - salaries - bills - delivery fees
      const netProfit = (totalRevenue + deliveryRevenue) - totalCOGS - totalSalaries - totalBills - deliveryFees;
      
      // Calculate earnings for each investor
      const investorEarnings = activeInvestors.map((investor: any) => {
        const interestPercentage = parseFloat(investor.interestPercentage || "0");
        const calculatedEarnings = (netProfit * interestPercentage) / 100;
        const earnings = Math.max(0, calculatedEarnings);
        
        return {
          id: investor.id,
          name: investor.name,
          investorType: investor.investorType || 'money',
          interestPercentage: investor.interestPercentage,
          earnings: earnings.toFixed(2),
          amountInvested: investor.amountInvested,
        };
      });
      
      // Month names for display
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      res.json({
        month: targetMonth,
        year: targetYear,
        monthName: monthNames[targetMonth - 1],
        netProfit: netProfit.toFixed(2),
        totalRevenue: (totalRevenue + deliveryRevenue).toFixed(2),
        posRevenue: totalRevenue.toFixed(2),
        totalCOGS: totalCOGS.toFixed(2),
        totalSalaries: totalSalaries.toFixed(2),
        totalBills: totalBills.toFixed(2),
        deliveryRevenue: deliveryRevenue.toFixed(2),
        deliveryFees: deliveryFees.toFixed(2),
        investors: investorEarnings,
      });
    } catch (error) {
      console.error("[INVESTORS] Monthly report error:", error);
      res.status(500).json({ error: "Failed to generate monthly report" });
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

  // Investor document upload configuration
  const investorDocStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'investor-documents');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const restaurantId = (req as any).session?.user?.restaurantId;
      const investorId = req.params.id;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${restaurantId}_${investorId}_${uniqueSuffix}${ext}`);
    }
  });

  const uploadInvestorDoc = multer({
    storage: investorDocStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedTypes = ['application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Upload document for investor - stores as base64 in database for persistence
  app.post("/api/investors/:id/document", requireAuth, requireRestaurant, requireAction('investors', 'edit'), uploadInvestorDoc.single('document'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;

      // Verify investor exists and belongs to this restaurant
      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        // Delete uploaded file if investor not found
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: "Investor not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read the file and convert to base64 for persistent database storage
      const fileBuffer = fs.readFileSync(req.file.path);
      const documentContent = fileBuffer.toString('base64');
      const documentFilename = req.file.originalname;

      // Delete the temp file after reading
      fs.unlinkSync(req.file.path);

      // Delete old filesystem document if exists (legacy cleanup)
      if (investor.documentPath) {
        const oldPath = path.join(process.cwd(), investor.documentPath);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }

      // Update investor with base64 content stored in database (persistent)
      const updated = await storage.updateInvestor(investorId, { 
        documentContent,
        documentFilename,
        documentPath: null // Clear legacy path since we're using database storage
      });

      console.log(`[INVESTORS] Document uploaded and stored in database for investor ${investorId}, filename: ${documentFilename}`);
      res.json({ success: true, documentFilename, investor: updated });
    } catch (error) {
      console.error("[INVESTORS] Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Download/view investor document - serves from database content
  app.get("/api/investors/:id/document", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;
      const mode = req.query.mode as string;

      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }

      // Check for document content in database (new persistent storage)
      if (investor.documentContent) {
        // Serve from database content
        const filename = investor.documentFilename || `${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}_document.pdf`;
        if (mode === 'inline') {
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        } else {
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        res.setHeader('Content-Type', 'application/pdf');
        
        // Convert base64 back to buffer and send
        const buffer = Buffer.from(investor.documentContent, 'base64');
        return res.send(buffer);
      }

      // Fallback: Check for legacy filesystem document
      if (investor.documentPath) {
        const filePath = path.join(process.cwd(), investor.documentPath);
        if (fs.existsSync(filePath)) {
          const filename = `${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}_document.pdf`;
          if (mode === 'inline') {
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          } else {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          }
          res.setHeader('Content-Type', 'application/pdf');
          return res.sendFile(filePath);
        }
      }

      return res.status(404).json({ error: "No document found" });
    } catch (error) {
      console.error("[INVESTORS] Document download error:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Delete investor document - clears from database and filesystem
  app.delete("/api/investors/:id/document", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;

      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }

      if (!investor.documentContent && !investor.documentPath) {
        return res.status(404).json({ error: "No document to delete" });
      }

      // Delete legacy file from disk if exists
      if (investor.documentPath) {
        const filePath = path.join(process.cwd(), investor.documentPath);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }

      // Clear document from database (both path and content)
      await storage.updateInvestor(investorId, { 
        documentPath: null,
        documentContent: null,
        documentFilename: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[INVESTORS] Document delete error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Upload IBAN Certificate for investor
  app.post("/api/investors/:id/iban-certificate", requireAuth, requireRestaurant, requireAction('investors', 'edit'), uploadInvestorDoc.single('document'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;

      // Verify investor exists and belongs to this restaurant
      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: "Investor not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read the file and convert to base64 for persistent database storage
      const fileBuffer = fs.readFileSync(req.file.path);
      const ibanCertificateContent = fileBuffer.toString('base64');
      const ibanCertificateFilename = req.file.originalname;

      // Delete the temp file after reading
      fs.unlinkSync(req.file.path);

      // Update investor with IBAN certificate
      const updatedInvestor = await storage.updateInvestor(investorId, {
        ibanCertificateContent,
        ibanCertificateFilename,
      });

      res.json({ 
        success: true, 
        filename: ibanCertificateFilename,
        investor: updatedInvestor
      });
    } catch (error) {
      console.error("[INVESTORS] IBAN certificate upload error:", error);
      res.status(500).json({ error: "Failed to upload IBAN certificate" });
    }
  });

  // Get/Download IBAN Certificate
  app.get("/api/investors/:id/iban-certificate", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;
      const mode = req.query.mode as string;

      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }

      if (!investor.ibanCertificateContent) {
        return res.status(404).json({ error: "No IBAN certificate found" });
      }

      const filename = investor.ibanCertificateFilename || `${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}_iban_certificate.pdf`;
      
      if (mode === 'inline') {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      res.setHeader('Content-Type', 'application/pdf');
      
      const buffer = Buffer.from(investor.ibanCertificateContent, 'base64');
      return res.send(buffer);
    } catch (error) {
      console.error("[INVESTORS] IBAN certificate download error:", error);
      res.status(500).json({ error: "Failed to download IBAN certificate" });
    }
  });

  // Delete IBAN Certificate
  app.delete("/api/investors/:id/iban-certificate", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;

      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }

      if (!investor.ibanCertificateContent) {
        return res.status(404).json({ error: "No IBAN certificate to delete" });
      }

      await storage.updateInvestor(investorId, { 
        ibanCertificateContent: null,
        ibanCertificateFilename: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[INVESTORS] IBAN certificate delete error:", error);
      res.status(500).json({ error: "Failed to delete IBAN certificate" });
    }
  });

  // =========================================================================
  // Investment Agreement: template + per-investor generated/signed PDFs
  // =========================================================================
  const DEFAULT_INVESTOR_AGREEMENT_TEMPLATE = `عقد استثمار صامت (شراكة صامتة)
بسم الله الرحمن الرحيم
التاريخ: {{hijri_date}}
الموافق: {{agreement_date}}
المكان: مدينة {{city}}.

الأطراف المتعاقدة:
الطرف الأول (المالك / الشريك النشط):
السيد/ {{owner_name}}، {{owner_nationality}} الجنسية، رقم الهوية الوطنية: {{restaurant_national_id}}، رقم الجوال: {{owner_phone}} (يُشار إليه فيما بعد بـ"المالك" أو "الشريك النشط").
الطرف الثاني (المستثمر الصامت):
السيد/ {{investor_name}}، جنسية: {{investor_nationality}}، رقم الهوية/الإقامة: {{national_id}}، رقم الجوال: {{contact_number}} (يُشار إليه فيما بعد بـ"المستثمر الصامت").

المقدمة:
لما كان الطرف الأول يملك ويدير مؤسسة/شركة {{my_restaurant_name}} مسجلة في السجل التجاري برقم {{restaurant_cr}} بتاريخ {{cr_issue_date}} تحت اسم {{trade_name}}، ويقوم بنشاط {{business_activity}}.
ولما رغب الطرف الثاني في الاستثمار في هذه المؤسسة كمستثمر صامت (دون أي مشاركة في الإدارة أو التشغيل اليومي بأي شكل من الأشكال)، واتفق الطرفان على الشروط والنسب التالية:

المادة الأولى: الغرض من العقد
يهدف هذا العقد إلى تنظيم علاقة استثمار صامت بين الطرفين، حيث يقدم المستثمر الصامت رأس مال نقدي فقط مقابل حصة في الأرباح الصافية فقط، دون أن يكون له أي دور إداري أو تشغيلي تماماً.

المادة الثانية: قيمة الاستثمار وحصة المستثمر الصامت:
يستثمر الطرف الثاني مبلغًا قدره {{amount_invested}} ر.س (فقط {{amount_in_words}} لا غير)، مقابل حصة قدرها {{interest_percentage}}% ({{percentage_in_words}}) من الأرباح الصافية للمؤسسة وفروعها وامتيازاتها التجارية وعقودها إن وُجدت.

المادة الثالثة: التزامات الطرف الأول (الشريك النشط)
• إدارة المؤسسة بكفاءة واحترافية وحسن نية.
• تزويد المستثمر الصامت بتقارير مالية دورية (شهرية أو ربع سنوية) تتضمن البيانات المالية والأرباح الصافية.
• عدم التصرف في أصول المؤسسة بطريقة تضر بالمستثمر الصامت.
• حفظ أسرار العمل والمعلومات المالية.

المادة الرابعة: التزامات الطرف الثاني (المستثمر الصامت):
• عدم التدخل في إدارة أو تشغيل المؤسسة تماماً بأي شكل من الأشكال.
• الحفاظ على سرية جميع المعلومات التجارية.
• لا يحق للمستثمر المطالبة باسترجاع أمواله إلا بعد مضي سنتين ميلاديتين من تاريخ التوقيع بالموافقة على العقد أو إذا تم الإخلال بالتزامات الطرف الأول.

المادة الخامسة: توزيع الأرباح والخسائر
• تُحسب الأرباح الصافية بعد خصم جميع المصروفات والالتزامات.
• يحصل المستثمر الصامت على نسبته من الأرباح الصافية إن وُجدت خلال مدة لا تتجاوز (30) يومًا من نهاية كل فترة محاسبية.
• في حال بيع المنشأة يستحق المستثمر من قيمة البيعة بما يتساوى مع نسبة استثماره.
• تتحمل الخسائر بنسبة الحصة في الأرباح (مع سقف مسؤولية المستثمر الصامت بحد استثماره فقط).

المادة السادسة: مدة العقد
مدة العقد غير محددة تبدأ من تاريخ توقيعه، وتنتهي بخروج المستثمر أو الإفلاس الكامل مع ما يُثبت ذلك.

المادة السابعة: الإنهاء والخروج
• يجوز إنهاء العقد باتفاق الطرفين أو في حال الإخلال الجوهري.
• عند الإنهاء أو الخروج، يحق للمستثمر الصامت استرداد رأس ماله (أو نسبته من صافي الأصول) حسب الاتفاق أو التقييم المحايد.

المادة الثامنة: النزاعات
يخضع هذا العقد لأنظمة المملكة العربية السعودية، وتكون المحاكم المختصة في مدينة {{disputes_city}} هي المختصة بالفصل في أي نزاع ينشأ عن هذا العقد.

المادة التاسعة: أحكام عامة
• يُعد هذا العقد ساريًا وملزمًا للطرفين وورثتهما.
• أي تعديل يجب أن يكون كتابيًا وموقعًا من الطرفين.
• يتكون العقد من {{pages_count}} صفحة وملاحق (إن وجدت).

ملاحظات إضافية: {{notes}}

تم الاتفاق والتوقيع:

الطرف الأول (المالك):
الاسم: {{owner_name}}
التوقيع: …………………….
التاريخ: {{agreement_date}}

الطرف الثاني (المستثمر الصامت):
الاسم: {{investor_name}}
التوقيع: …………………….
التاريخ: {{agreement_date}}

شهود (اختياري):
1. الاسم: {{witness_1_name}}
   التوقيع: …………………….
2. الاسم: {{witness_2_name}}
   التوقيع: …………………….`;

  function getInvestorPlaceholders(restaurant: any, investor: any, recipeName: string, isAr: boolean, pdfLang: string = 'en'): Record<string, string> {
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : '—';
    const typeLabel = (investor.investorType || 'money') === 'recipe'
      ? (isAr ? 'مستثمر وصفة' : 'Recipe Investor')
      : (isAr ? 'مستثمر نقدي' : 'Money Investor');
    const recipeClause = (investor.investorType === 'recipe' && recipeName)
      ? (isAr
          ? `يساهم المستثمر بالوصفة: ${recipeName}.`
          : `The Investor contributes the recipe: ${recipeName}.`)
      : '';
    const amountNum = parseFloat(investor.amountInvested || '0');
    const pctNum = parseFloat(investor.interestPercentage || '0');
    const lang: 'ar' | 'en' = isAr ? 'ar' : 'en';
    // Map the PDF language (code or full name) to a BCP-47 locale tag used
    // with the Umm al-Qura calendar. Covers all 10 supported languages.
    // Note: ICU does not ship an Umm al-Qura locale for Tagalog/Filipino,
    // so we fall back to English forms of the month names there.
    const hijriLocaleMap: Record<string, string> = {
      en: 'en', english: 'en',
      ar: 'ar-SA', arabic: 'ar-SA',
      de: 'de', german: 'de',
      zh: 'zh', chinese: 'zh',
      bn: 'bn', bengali: 'bn',
      it: 'it', italian: 'it',
      hi: 'hi', hindi: 'hi',
      ur: 'ur', urdu: 'ur',
      es: 'es', spanish: 'es',
      tl: 'en', tagalog: 'en', fil: 'en', filipino: 'en',
    };
    const baseLocale = hijriLocaleMap[(pdfLang || 'en').toLowerCase()] || 'en';
    let hijriDate = '';
    try {
      hijriDate = new Intl.DateTimeFormat(
        `${baseLocale}-u-ca-islamic-umalqura`,
        { day: 'numeric', month: 'long', year: 'numeric' }
      ).format(new Date());
    } catch {
      try {
        // Fallback to English Umm al-Qura formatting if the requested
        // locale isn't available in this ICU build.
        hijriDate = new Intl.DateTimeFormat(
          'en-u-ca-islamic-umalqura',
          { day: 'numeric', month: 'long', year: 'numeric' }
        ).format(new Date());
      } catch {
        // Final fallback: Gregorian date in the user's language.
        hijriDate = fmtDate(new Date());
      }
    }
    return {
      agreement_date: fmtDate(new Date()),
      hijri_date: hijriDate,
      my_restaurant_name: restaurant?.name || '',
      restaurant_cr: (restaurant?.commercialRegistration || '') as string,
      restaurant_tax_number: (restaurant?.taxNumber || '') as string,
      restaurant_national_id: (restaurant?.nationalId || '') as string,
      investor_name: investor.name || '',
      national_id: investor.nationalId || '—',
      contact_number: investor.contactNumber || '—',
      investor_type: typeLabel,
      amount_invested: amountNum.toFixed(2),
      // amountToWords already includes the currency word ("ريالاً" / "riyals")
      // and halalas precision (e.g. 28.50 → "ثمانية وعشرون ريالاً وخمسون هللة" /
      // "twenty-eight riyals and fifty halalas"). The default template wraps this
      // with "(فقط ... لا غير)" so it reads naturally without a duplicate currency.
      amount_in_words: amountToWords(amountNum, lang),
      interest_percentage: pctNum.toFixed(2),
      percentage_in_words: percentageToWords(pctNum, lang),
      iban: investor.iban || '—',
      bank_name: investor.bankName || '—',
      notes: investor.notes || '—',
      recipe_name: recipeName || '—',
      recipe_clause: recipeClause,
    };
  }

  async function buildInvestorAgreementPdfBuffer(restaurantId: string, investorId: string, lang: string = 'en'): Promise<Buffer> {
    const investor = await storage.getInvestor(investorId);
    if (!investor || investor.restaurantId !== restaurantId) throw new Error('Investor not found');
    const restaurant = await storage.getRestaurant(restaurantId);
    const templates = await storage.getInvestmentAgreementTemplates(restaurantId);
    const defaultTpl = templates.find(t => t.isDefault) || templates[0];
    const tpl = (defaultTpl?.content && defaultTpl.content.trim()) ? defaultTpl.content : DEFAULT_INVESTOR_AGREEMENT_TEMPLATE;
    const customPlaceholders = Array.isArray((defaultTpl as any)?.customPlaceholders) ? (defaultTpl as any).customPlaceholders as Array<{key:string;value?:string}> : [];
    let recipeName = '';
    if (investor.investorType === 'recipe' && (investor as any).recipeId) {
      try {
        const recipe = await storage.getRecipe((investor as any).recipeId, restaurantId);
        if (recipe) recipeName = (recipe as any).name || '';
      } catch (e) { /* ignore */ }
    }

    const isAr = lang === 'ar' || lang === 'Arabic' || lang === 'ur' || lang === 'Urdu';
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';
    const L = (en: string, ar: string) => isAr ? ar : en;

    const basePlaceholders = getInvestorPlaceholders(restaurant, investor, recipeName, isAr, lang);
    const placeholders: Record<string, string> = { ...basePlaceholders };
    for (const cp of customPlaceholders) {
      if (cp && typeof cp.key === 'string' && cp.key && !(cp.key in placeholders)) {
        placeholders[cp.key] = String(cp.value ?? '');
      }
    }
    // SECURITY: templates are always treated as plain text and escaped before
    // injection into the rendered HTML. This prevents stored-template HTML/JS
    // (including remote URLs that could trigger SSRF via Puppeteer) from
    // being injected into the PDF render.
    let body = tpl.split('\n').map((l) => escapeHtml(l)).join('<br/>');
    for (const [k, v] of Object.entries(placeholders)) {
      body = body.split(`{{${k}}}`).join(escapeHtml(String(v ?? '')));
    }

    const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>Investment Agreement - ${escapeHtml(investor.name)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: ${isAr ? "'Noto Naskh Arabic','Amiri','Segoe UI',Arial,sans-serif" : "'Segoe UI',Arial,sans-serif"};
      color: #222; font-size: 12px; line-height: 1.7;
      direction: ${dir}; text-align: ${align}; margin: 0;
    }
    .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 12px; margin-bottom: 18px; }
    .header h1 { color: #1a365d; margin: 0; font-size: 22px; }
    .header .subtitle { color: #666; font-size: 11px; margin-top: 4px; }
    .meta {
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
      background: #f8fafc; padding: 10px 14px; border-radius: 6px;
      margin-bottom: 16px; font-size: 11px;
    }
    .meta .item { display: flex; gap: 6px; }
    .meta .item .lbl { color: #555; font-weight: 600; }
    .body { font-size: 12px; line-height: 1.85; }
    .footer {
      position: fixed; bottom: 6mm; ${isAr ? 'right' : 'left'}: 16mm; ${isAr ? 'left' : 'right'}: 16mm;
      text-align: center; color: #999; font-size: 9.5px;
      border-top: 1px solid #e2e8f0; padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(restaurant?.name || '')}</h1>
    <div class="subtitle">${L('Investment Agreement', 'اتفاقية استثمار')}</div>
  </div>
  <div class="meta">
    <div class="item"><span class="lbl">${L('Investor:', 'المستثمر:')}</span><span>${escapeHtml(investor.name)}</span></div>
    <div class="item"><span class="lbl">${L('Date:', 'التاريخ:')}</span><span>${escapeHtml(placeholders.agreement_date)}</span></div>
    <div class="item"><span class="lbl">${L('Reference:', 'المرجع:')}</span><span>INV-${escapeHtml(investor.id.slice(0, 8).toUpperCase())}</span></div>
  </div>
  <div class="body">${body}</div>
  <div class="footer">${L('Generated by BlindSpot System (BSS) — kinbss.org', 'تم الإنشاء بواسطة نظام بلايند سبوت (BSS) — kinbss.org')}</div>
</body>
</html>`;

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '16mm', bottom: '22mm', left: '16mm' },
      });
      return Buffer.from(pdfData);
    } finally {
      await page.close();
    }
  }

  // Investment Agreement Templates (multi-template CRUD)
  const RESERVED_INVESTOR_PH_KEYS = new Set([
    'agreement_date', 'hijri_date', 'my_restaurant_name', 'restaurant_cr', 'restaurant_tax_number', 'restaurant_national_id',
    'investor_name', 'national_id', 'contact_number', 'investor_type', 'amount_invested', 'amount_in_words',
    'interest_percentage', 'percentage_in_words', 'iban', 'bank_name', 'notes', 'recipe_name', 'recipe_clause',
  ]);
  // Template-level placeholders (not per-investor): user fills them once in the
  // template's Custom Placeholders grid and they apply to every generated PDF.
  const SUGGESTED_INVESTOR_CUSTOM_PLACEHOLDERS: Array<{ key: string; label: string; labelAr: string }> = [
    { key: 'owner_name',           label: 'Owner full name',                  labelAr: 'اسم المالك الكامل' },
    { key: 'owner_nationality',    label: 'Owner nationality',                labelAr: 'جنسية المالك' },
    { key: 'owner_phone',          label: 'Owner phone number',               labelAr: 'رقم جوال المالك' },
    { key: 'investor_nationality', label: 'Investor nationality',             labelAr: 'جنسية المستثمر' },
    { key: 'cr_issue_date',        label: 'CR issue date',                    labelAr: 'تاريخ إصدار السجل التجاري' },
    { key: 'trade_name',           label: 'Trade name',                       labelAr: 'الاسم التجاري' },
    { key: 'business_activity',    label: 'Business activity',                labelAr: 'نوع النشاط' },
    { key: 'city',                 label: 'Establishment city',               labelAr: 'مدينة المنشأة' },
    { key: 'disputes_city',        label: 'Disputes jurisdiction city',       labelAr: 'مدينة الاختصاص القضائي' },
    { key: 'pages_count',          label: 'Number of contract pages',         labelAr: 'عدد صفحات العقد' },
    { key: 'witness_1_name',       label: 'Witness 1 name',                   labelAr: 'اسم الشاهد الأول' },
    { key: 'witness_2_name',       label: 'Witness 2 name',                   labelAr: 'اسم الشاهد الثاني' },
  ];
  const investorCustomPhSchema = z.array(z.object({
    key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/i, 'Invalid placeholder key'),
    label: z.string().max(120).optional().default(''),
    value: z.string().max(5000).optional().default(''),
  })).max(50).superRefine((arr, ctx) => {
    const seen = new Set<string>();
    arr.forEach((p, i) => {
      const k = p.key.toLowerCase();
      if (RESERVED_INVESTOR_PH_KEYS.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, 'key'], message: 'Reserved placeholder key' });
      }
      if (seen.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, 'key'], message: 'Duplicate placeholder key' });
      }
      seen.add(k);
    });
  });
  const investorTemplateBodySchema = z.object({
    name: z.string().trim().min(1).max(200),
    content: z.string().max(50000).optional().default(''),
    isDefault: z.boolean().optional().default(false),
    customPlaceholders: investorCustomPhSchema.optional().default([]),
  });

  app.get("/api/investment-agreement-templates", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const templates = await storage.getInvestmentAgreementTemplates(restaurantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/investment-agreement-templates/default-content", requireAuth, requireRestaurant, requirePermission('investors'), async (_req, res) => {
    res.json({
      content: DEFAULT_INVESTOR_AGREEMENT_TEMPLATE,
      placeholders: Array.from(RESERVED_INVESTOR_PH_KEYS),
      suggestedCustomPlaceholders: SUGGESTED_INVESTOR_CUSTOM_PLACEHOLDERS.map(p => ({
        key: p.key, label: p.label, labelAr: p.labelAr, value: '',
      })),
    });
  });

  app.post("/api/investment-agreement-templates", requireAuth, requireRestaurant, requireAction('investors', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const parsed = investorTemplateBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid template', errors: parsed.error.flatten() });
      const template = await storage.createInvestmentAgreementTemplate({ ...parsed.data, restaurantId } as any);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/investment-agreement-templates/:id", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const parsed = investorTemplateBodySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid template', errors: parsed.error.flatten() });
      const template = await storage.updateInvestmentAgreementTemplate(req.params.id, restaurantId, parsed.data as any);
      if (!template) return res.status(404).json({ message: 'Template not found' });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/investment-agreement-templates/:id", requireAuth, requireRestaurant, requireAction('investors', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const ok = await storage.deleteInvestmentAgreementTemplate(req.params.id, restaurantId);
      if (!ok) return res.status(404).json({ message: 'Template not found' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate the investment agreement PDF (and persist a copy on the investor)
  app.get("/api/investors/:id/agreement/pdf", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investorId = req.params.id;
      const lang = String(req.query.lang || 'en');
      const mode = String(req.query.mode || 'download');

      const investor = await storage.getInvestor(investorId);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: 'Investor not found' });
      }

      const pdfBuffer = await buildInvestorAgreementPdfBuffer(restaurantId, investorId, lang);
      const filename = `Investment_Agreement_${(investor.name || 'investor').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      // Persist a copy on the investor record so the agreement lives in their file.
      try {
        await storage.updateInvestor(investorId, {
          agreementContent: pdfBuffer.toString('base64'),
          agreementFilename: filename,
          agreementGeneratedAt: new Date(),
        } as any);
      } catch (e) {
        console.error('[INVESTORS] Failed to persist generated agreement:', e);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader(
        'Content-Disposition',
        `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${filename}"`,
      );
      return res.end(pdfBuffer);
    } catch (error: any) {
      console.error('[INVESTORS] Agreement PDF error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate agreement' });
    }
  });

  // Download a previously generated agreement (from investor.agreementContent)
  app.get("/api/investors/:id/agreement", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: 'Investor not found' });
      }
      const content = (investor as any).agreementContent;
      if (!content) return res.status(404).json({ error: 'No agreement generated yet' });
      const mode = String(req.query.mode || 'download');
      const filename = (investor as any).agreementFilename ||
        `Investment_Agreement_${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${filename}"`,
      );
      return res.send(Buffer.from(content, 'base64'));
    } catch (error: any) {
      console.error('[INVESTORS] Agreement fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch agreement' });
    }
  });

  // Upload the signed agreement (after client signature)
  app.post(
    "/api/investors/:id/signed-agreement",
    requireAuth, requireRestaurant, requireAction('investors', 'edit'),
    uploadInvestorDoc.single('document'),
    async (req, res) => {
      try {
        const restaurantId = req.session.user!.restaurantId!;
        const investorId = req.params.id;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        try {
          const investor = await storage.getInvestor(investorId);
          if (!investor || investor.restaurantId !== restaurantId) {
            return res.status(404).json({ error: 'Investor not found' });
          }
          const buf = fs.readFileSync(req.file.path);
          const signedAgreementContent = buf.toString('base64');
          const signedAgreementFilename = req.file.originalname;
          const updated = await storage.updateInvestor(investorId, {
            signedAgreementContent,
            signedAgreementFilename,
            signedAgreementUploadedAt: new Date(),
          } as any);
          res.json({ success: true, signedAgreementFilename, investor: updated });
        } finally {
          // Always remove the multer temp file, even on failure.
          try { fs.unlinkSync(req.file.path); } catch {}
        }
      } catch (error: any) {
        console.error('[INVESTORS] Signed agreement upload error:', error);
        res.status(500).json({ error: 'Failed to upload signed agreement' });
      }
    },
  );

  // Download the signed agreement
  app.get("/api/investors/:id/signed-agreement", requireAuth, requireRestaurant, requirePermission('investors'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: 'Investor not found' });
      }
      const content = (investor as any).signedAgreementContent;
      if (!content) return res.status(404).json({ error: 'No signed agreement uploaded' });
      const mode = String(req.query.mode || 'download');
      const filename = (investor as any).signedAgreementFilename ||
        `Signed_Investment_Agreement_${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${filename}"`,
      );
      return res.send(Buffer.from(content, 'base64'));
    } catch (error: any) {
      console.error('[INVESTORS] Signed agreement fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch signed agreement' });
    }
  });

  // Delete the signed agreement
  app.delete("/api/investors/:id/signed-agreement", requireAuth, requireRestaurant, requireAction('investors', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: 'Investor not found' });
      }
      await storage.updateInvestor(req.params.id, {
        signedAgreementContent: null,
        signedAgreementFilename: null,
        signedAgreementUploadedAt: null,
      } as any);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[INVESTORS] Signed agreement delete error:', error);
      res.status(500).json({ error: 'Failed to delete signed agreement' });
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
        
        // Calculate total salaries and recurring bills (exclude foundational & one-time)
        totalSalaries = salaries.reduce((sum: number, s) => sum + parseFloat(s.amount || "0"), 0);
        
        // Filter out foundational and one-time bills - only include recurring operational expenses
        const recurringBills = shopBills.filter(b => {
          const billType = String(b.billType || '').toLowerCase();
          const paymentPeriod = String(b.paymentPeriod || '').toLowerCase();
          return billType !== 'foundational' && 
                 paymentPeriod !== 'one-time' && 
                 paymentPeriod !== 'onetime';
        });
        
        // Helper function to prorate bill amounts to monthly values
        // Quarterly bills should be divided by 3, semi-annual by 6, yearly by 12
        const getMonthlyAmount = (amount: number, period: string): number => {
          const normalized = String(period || 'monthly').toLowerCase();
          switch (normalized) {
            case 'weekly':
              return amount * 4.33; // Average weeks per month
            case 'monthly':
              return amount;
            case 'quarterly':
              return amount / 3; // Divide by 3 months
            case 'semi-annually':
            case 'semiannually':
            case 'semi-annual':
              return amount / 6; // Divide by 6 months
            case 'yearly':
            case 'annually':
              return amount / 12; // Divide by 12 months
            default:
              return amount; // Default to monthly
          }
        };
        
        // Sum bills with proper proration for monthly calculations
        totalBills = recurringBills.reduce((sum: number, b) => {
          const rawAmount = parseFloat(b.amount || "0");
          return sum + getMonthlyAmount(rawAmount, b.paymentPeriod || 'monthly');
        }, 0);
        
        // Add delivery profitability for money investors (delivery is a separate revenue stream)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const deliveryEntries = await storage.getDeliveryProfitability(restaurantId, currentYear);
        const monthlyDeliveryEntries = deliveryEntries.filter((e: any) => e.month === currentMonth);
        
        let deliveryRevenue = 0;
        let deliveryFees = 0;
        
        for (const entry of monthlyDeliveryEntries) {
          deliveryRevenue += parseFloat(String(entry.sales || '0'));
          deliveryFees += parseFloat(String(entry.commission || '0'));
          deliveryFees += parseFloat(String(entry.banking || '0'));
          deliveryFees += parseFloat(String(entry.vat || '0'));
          deliveryFees += parseFloat(String(entry.posFees || '0'));
        }
        
        // Add delivery net contribution to revenue (delivery revenue - delivery fees)
        totalRevenue += deliveryRevenue;
        // Delivery fees are not COGS but separate operational costs
        totalBills += deliveryFees;
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
          nationalId: investor.nationalId || '',
          contactNumber: investor.contactNumber || '',
          amountInvested: investor.amountInvested,
          interestPercentage: investor.interestPercentage,
          notes: investor.notes,
          createdAt: investor.createdAt,
          investorType: investor.investorType || 'money',
          recipeName: recipeName,
          iban: investor.iban,
          bankName: investor.bankName,
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
      const mode = req.query.mode as string;
      const filename = `investor-statement-${investor.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      if (mode === 'inline') {
        // Preview mode: display in browser
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      } else {
        // Download mode: force download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
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

  // IMPORTANT: Sort route must come BEFORE :id route to avoid matching "sort" as an id
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
      const { addToInventory, ...recipeBody } = req.body;
      const data = insertRecipeSchema.parse({ ...recipeBody, restaurantId });
      const recipe = await storage.createRecipe(data);
      
      // If addToInventory flag is set, create an inventory item from the recipe
      if (addToInventory) {
        try {
          const inventoryData = {
            restaurantId,
            name: recipe.name,
            category: 'Prepared',
            quantity: '1',
            unit: 'pcs',
            price: String(recipe.cost || '0'),
            supplier: 'In-House',
            referenceQuantity: '1',
          };
          console.log('[Recipe-to-Inventory] Creating inventory item:', inventoryData);
          const createdItem = await storage.createInventoryItem(inventoryData);
          console.log('[Recipe-to-Inventory] Successfully created inventory item:', createdItem?.id, createdItem?.name);
        } catch (inventoryError) {
          console.error('[Recipe-to-Inventory] Failed to create inventory item from recipe:', inventoryError);
          // Don't fail the recipe creation if inventory creation fails
        }
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'created_recipe',
          actionCategory: 'recipes',
          description: `Created recipe ${recipe.name}${addToInventory ? ' (also added to inventory)' : ''}`,
          entityType: 'recipe',
          entityId: recipe.id,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.patch("/api/recipes/:id", requireAuth, requireRestaurant, requireAction('recipes', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { addToInventory, ...recipeBody } = req.body;
      const data = sanitizePatchBody(recipeBody, insertRecipeSchema.partial());
      // SECURITY: Strip restaurantId from request body at route layer (defense-in-depth)
      const { restaurantId: _, ...safeData } = data;
      const recipe = await storage.updateRecipe(req.params.id, restaurantId, safeData);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      // If addToInventory flag is set, create an inventory item from the recipe
      if (addToInventory) {
        try {
          const inventoryData = {
            restaurantId,
            name: recipe.name,
            category: 'Prepared',
            quantity: '1',
            unit: 'pcs',
            price: String(recipe.cost || '0'),
            supplier: 'In-House',
            referenceQuantity: '1',
          };
          console.log('[Recipe-to-Inventory] Creating inventory item:', inventoryData);
          const createdItem = await storage.createInventoryItem(inventoryData);
          console.log('[Recipe-to-Inventory] Successfully created inventory item:', createdItem?.id, createdItem?.name);
        } catch (inventoryError) {
          console.error('[Recipe-to-Inventory] Failed to create inventory item from recipe:', inventoryError);
        }
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'updated_recipe',
          actionCategory: 'recipes',
          description: `Updated recipe ${recipe.name}${addToInventory ? ' (also added to inventory)' : ''}`,
          entityType: 'recipe',
          entityId: recipe.id,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.delete("/api/recipes/:id", requireAuth, requireRestaurant, requireAction('recipes', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // Get recipe name before deletion for logging
    const recipeToDelete = await storage.getRecipe(req.params.id, restaurantId);
    
    const success = await storage.deleteRecipe(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Fire-and-forget activity logging
    if (req.session.user && recipeToDelete) {
      logActivity({
        restaurantId,
        employeeId: req.session.user.id,
        employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
        action: 'deleted_recipe',
        actionCategory: 'recipes',
        description: `Deleted recipe ${recipeToDelete.name}`,
        entityType: 'recipe',
        entityId: req.params.id,
      }).catch(err => console.error('Activity log error:', err));
    }
    
    res.status(204).send();
  });

  // Sync all recipe ingredient units with current inventory units (one-time fix)
  app.post("/api/recipes/sync-units", requireAuth, requireRestaurant, requireAction('recipes', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Get all inventory items and recipes
      const inventoryItems = await storage.getInventoryItems(restaurantId);
      const inventoryMap = new Map(inventoryItems.map(item => [item.id, item]));
      
      let totalUpdated = 0;
      
      // For each inventory item, update recipe units
      for (const item of inventoryItems) {
        const updatedRecipes = await storage.updateRecipeUnitsForInventoryItem(item.id, restaurantId, item.unit);
        totalUpdated += updatedRecipes.length;
      }
      
      console.log(`[RECIPES] Synced units for ${totalUpdated} recipe-ingredient combinations`);
      
      // Broadcast update for real-time refresh
      broadcastNotification({
        type: 'recipe:costUpdated',
        restaurantId,
        updatedRecipeIds: [],
      });
      
      res.json({ success: true, updatedCount: totalUpdated });
    } catch (error) {
      console.error("[RECIPES] Sync units error:", error);
      res.status(500).json({ error: "Failed to sync recipe units" });
    }
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
        
        // Fire-and-forget activity logging
        if (req.session.user) {
          logActivity({
            restaurantId,
            employeeId: req.session.user.id,
            employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
            action: 'created_order',
            actionCategory: 'orders',
            description: `Created order ${order.orderNumber}`,
            entityType: 'order',
            entityId: order.id,
            branchId: order.branchId || undefined,
          }).catch(err => console.error('Activity log error:', err));
        }
        
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

    // Get menu items, recipes, and inventory for COGS calculation (matching getBepMetrics logic)
    const menuItems = await storage.getMenuItems(restaurantId);
    const recipes = await storage.getRecipes(restaurantId);

    // Create lookup maps
    const menuItemMap = new Map(menuItems.map(mi => [mi.id, mi]));
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const inventoryMap = new Map(inventory.map(inv => [inv.id, inv]));

    // Calculate COGS from CURRENT MONTH completed orders so it pairs fairly with
    // monthly-prorated operating bills on the dashboard's expenses card.
    const _nowForCogs = new Date();
    const _monthStartForCogs = new Date(_nowForCogs.getFullYear(), _nowForCogs.getMonth(), 1);
    let cogsTotal = 0;
    const completedStatuses = new Set(['Completed', 'Paid', 'Delivered']);
    const completedOrders = orders.filter(o =>
      completedStatuses.has(o.status) && new Date(o.createdAt) >= _monthStartForCogs,
    );

    for (const order of completedOrders) {
      if (order.items && Array.isArray(order.items)) {
        for (const orderItem of order.items as any[]) {
          const menuItemId = orderItem.id;
          const quantity = orderItem.quantity || 1;
          
          const menuItem = menuItemMap.get(menuItemId);
          if (!menuItem) continue;

          if (menuItem.recipeId) {
            // Menu item has a recipe - use recipe cost × portionSize × quantity
            const recipe = recipeMap.get(menuItem.recipeId);
            if (recipe) {
              const recipeCost = parseFloat(recipe.cost || "0");
              const portionSize = parseFloat(menuItem.portionSize || "1.0") || 1.0;
              cogsTotal += recipeCost * portionSize * quantity;
            }
          } else if (menuItem.inventoryItemId) {
            // Menu item is direct from inventory - use inventory unitPrice × quantity
            const inventoryItem = inventoryMap.get(menuItem.inventoryItemId);
            if (inventoryItem) {
              // Use unitPrice if available, otherwise calculate from price/quantity
              let unitCost = parseFloat(inventoryItem.unitPrice || "0");
              if (unitCost === 0) {
                const invPrice = parseFloat(inventoryItem.price || "0");
                const invQty = parseFloat(inventoryItem.quantity || "1") || 1;
                unitCost = invQty > 0 ? invPrice / invQty : 0;
              }
              cogsTotal += unitCost * quantity;
            }
          }
          // Else: no cost data available, COGS += 0
        }
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    
    // daysInMonth(year, monthIndex) — uses JS Date day-0-of-next-month trick.
    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // For a fair MoM comparison, compare month-to-date against the SAME day-range
    // in the previous month (e.g. May 1-22 vs Apr 1-22), clamping the day so
    // e.g. May 31 -> Apr 30 instead of overflowing into the following month.
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastMonthIndex = (now.getMonth() + 11) % 12;
    const lastMonthStart = new Date(lastMonthYear, lastMonthIndex, 1);
    const lastMonthClampedDay = Math.min(now.getDate(), daysInMonth(lastMonthYear, lastMonthIndex));
    const lastMonthSamePoint = new Date(
      lastMonthYear, lastMonthIndex, lastMonthClampedDay,
      now.getHours(), now.getMinutes(), now.getSeconds(),
    );

    const yearStart = new Date(now.getFullYear(), 0, 1);
    // For a fair YoY comparison, compare YTD against the SAME period last year
    // (Jan 1 last year through today's date last year). Clamp day so Feb 29 in a
    // leap year compares against Feb 28 of the prior (non-leap) year.
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearClampedDay = Math.min(now.getDate(), daysInMonth(now.getFullYear() - 1, now.getMonth()));
    const lastYearSamePoint = new Date(
      now.getFullYear() - 1, now.getMonth(), lastYearClampedDay,
      now.getHours(), now.getMinutes(), now.getSeconds(),
    );

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
        return date >= lastMonthStart && date <= lastMonthSamePoint;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    const thisYearSales = transactions
      .filter(t => new Date(t.createdAt) >= yearStart)
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    const lastYearSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= lastYearStart && date <= lastYearSamePoint;
      })
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      // For new accounts with no previous data, return 0 (neutral state)
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Active = order is still being worked on. Exclude terminal states plus statuses
    // that represent revenue-recognized / fulfilled work counted as completed elsewhere.
    // Must stay aligned with `completedStatuses` above so no order falls into "neither".
    const finishedOrderStatuses = new Set(["Cancelled", ...completedStatuses]);
    const activeOrders = orders.filter(o => !finishedOrderStatuses.has(o.status)).length;
    // Treat both "Low Stock" and "Out of Stock" as needing attention.
    const lowStockItems = inventory.filter(i => i.status === "Low Stock" || i.status === "Out of Stock").length;

    // Calculate peak hours analysis over the last 30 days only, so the pattern
    // reflects current operations rather than all-time historical noise.
    const salesByHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0;
    }
    const peakWindowStart = new Date(today);
    peakWindowStart.setDate(peakWindowStart.getDate() - 30);

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      if (date < peakWindowStart) return;
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

    // Sort orders by creation date (newest first) for recent orders display
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Add delivery profitability data
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const deliveryEntries = await storage.getDeliveryProfitability(restaurantId, currentYear);
    
    // Calculate delivery totals
    let deliveryTotalRevenue = 0;
    let deliveryTotalProfit = 0;
    let deliveryTotalOrders = 0;
    let deliveryMonthRevenue = 0;
    let deliveryMonthProfit = 0;
    
    for (const entry of deliveryEntries) {
      const sales = parseFloat(String(entry.sales || '0'));
      const profit = parseFloat(String(entry.profit || entry.netEarnings || '0'));
      const entryOrders = parseInt(String(entry.orders || '0'));
      
      deliveryTotalRevenue += sales;
      deliveryTotalProfit += profit;
      deliveryTotalOrders += entryOrders;
      
      // Current month data
      if (entry.month === currentMonth) {
        deliveryMonthRevenue += sales;
        deliveryMonthProfit += profit;
      }
    }
    
    res.json({
      todaysSales: todaysSales.toFixed(2),
      activeOrders,
      lowStockItems,
      cogsTotal,
      recentOrders: sortedOrders.slice(0, 4),
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
      delivery: {
        yearRevenue: deliveryTotalRevenue,
        yearProfit: deliveryTotalProfit,
        yearOrders: deliveryTotalOrders,
        monthRevenue: deliveryMonthRevenue,
        monthProfit: deliveryMonthProfit,
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

    // Match dashboard chart scope: last 30 days only, so the drilldown rows
    // correspond to the same window used to compute the peak-hour bar.
    const _peakNow = new Date();
    const _peakToday = new Date(_peakNow.getFullYear(), _peakNow.getMonth(), _peakNow.getDate());
    const _peakWindowStart = new Date(_peakToday);
    _peakWindowStart.setDate(_peakWindowStart.getDate() - 30);

    const transactionsInHour = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= _peakWindowStart && date.getHours() === hour;
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

    // Calculate start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // Filter transactions to only include current week
    const thisWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startOfWeek;
    });

    const salesByDay: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    thisWeekTransactions.forEach(t => {
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
      
      // If linking to existing inventory, validate ownership
      if (data.inventoryItemId) {
        const existingItem = await storage.getInventoryItem(data.inventoryItemId, restaurantId);
        if (!existingItem) {
          return res.status(400).json({ error: "Invalid inventory item selected" });
        }
        console.log(`[PROCUREMENT] Linking to existing inventory item: ${existingItem.name} (${data.inventoryItemId})`);
      }
      
      let procurement = await storage.createProcurement({ ...data, restaurantId });
      
      // Auto-create inventory item ONLY when:
      // 1. Type is "inventory"
      // 2. Status is complete (received/completed)
      // 3. No existing inventory item is linked
      const hasExistingInventoryLink = !!procurement.inventoryItemId;
      if (procurement.type === "inventory" && ["received", "completed"].includes(procurement.status) && !hasExistingInventoryLink) {
        try {
          const inventoryData = {
            restaurantId,
            name: procurement.title,
            category: procurement.category || "General",
            quantity: String(procurement.quantity || 1),
            unit: "pcs",
            referenceQuantity: String(procurement.quantity || 1),
            price: procurement.totalCost || "0",
            supplier: procurement.supplier || "",
            status: "In Stock",
            branchId: procurement.branchId || null,
          };
          const inventoryItem = await storage.createInventoryItem(inventoryData);
          console.log(`[PROCUREMENT] Auto-created inventory item: ${inventoryItem.name} from procurement ${procurement.id}`);
          
          // Link inventory item to procurement to prevent duplicate creation
          const updatedProcurement = await storage.updateProcurement(procurement.id, restaurantId, { inventoryItemId: inventoryItem.id } as any);
          if (updatedProcurement) {
            procurement = updatedProcurement;
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to auto-create inventory item:", invError);
        }
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'created_procurement',
          actionCategory: 'procurement',
          description: `Created procurement ${procurement.title}`,
          entityType: 'procurement',
          entityId: procurement.id,
          branchId: procurement.branchId || undefined,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.status(201).json(procurement);
    } catch (error: any) {
      console.error("[Procurement] Create error:", error);
      const details = error?.errors?.[0]?.message || error?.message || "Unknown error";
      res.status(400).json({ error: "Invalid procurement data", details });
    }
  });

  app.patch("/api/procurement/:id", requireAuth, requireRestaurant, requireAction('procurement', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = sanitizePatchBody(req.body, insertProcurementSchema.partial());
      // SECURITY: Strip restaurantId from request body to prevent cross-tenant reassignment
      const { restaurantId: _, ...safeData } = data;
      
      // Get existing procurement to check for status change
      const existingProcurement = await storage.getProcurement(req.params.id, restaurantId);
      if (!existingProcurement) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      
      const newStatus = safeData.status || existingProcurement.status;
      const oldStatus = existingProcurement.status;
      
      // Prepare update data with latest values for bill descriptions
      const updatedTitle = safeData.title || existingProcurement.title;
      const updatedSupplier = safeData.supplier !== undefined ? safeData.supplier : existingProcurement.supplier;
      const updatedBranchId = safeData.branchId !== undefined ? safeData.branchId : existingProcurement.branchId;
      const updatedType = safeData.type || existingProcurement.type;
      
      // Sync with bills when status changes
      let billIdToSet: string | null | undefined = undefined;
      
      // SECURITY: Verify billId ownership upfront if one exists
      let validBillId: string | null = null;
      if (existingProcurement.billId) {
        const existingBill = await storage.getShopBill(existingProcurement.billId);
        if (existingBill && existingBill.restaurantId === restaurantId) {
          validBillId = existingProcurement.billId;
        } else {
          // Bill doesn't exist or belongs to another tenant - clear the stale link
          console.warn(`[SECURITY] Clearing stale/invalid billId ${existingProcurement.billId} from procurement ${req.params.id}`);
          billIdToSet = null; // Will clear the bad link
        }
      }
      
      if (safeData.status && safeData.status !== oldStatus) {
        const totalCost = parseFloat(safeData.totalCost || existingProcurement.totalCost || "0");
        
        if (safeData.status === "cancelled") {
          // Remove associated bill when cancelled
          if (validBillId) {
            await storage.deleteShopBill(validBillId, restaurantId);
            billIdToSet = null; // Clear the billId link
          }
        } else if (safeData.status === "completed") {
          // Create or update bill as "paid" only when completed (not received)
          const billData = {
            restaurantId,
            billType: updatedType === "inventory" ? "foundational" : "maintenance",
            amount: totalCost.toFixed(2),
            paymentDate: new Date(),
            paymentPeriod: "one-time" as const,
            status: "paid" as const,
            description: `Procurement: ${updatedTitle}${updatedSupplier ? ` (${updatedSupplier})` : ""}`,
            branchId: updatedBranchId || null,
          };
          
          if (validBillId) {
            // Update existing bill - ownership verified above
            await storage.updateShopBill(validBillId, restaurantId, billData);
          } else {
            const bill = await storage.createShopBill(billData as any);
            billIdToSet = bill.id;
          }
        } else if (["pending", "approved", "ordered", "received"].includes(safeData.status)) {
          // Create or update bill as "pending" for in-progress statuses
          const billData = {
            restaurantId,
            billType: updatedType === "inventory" ? "foundational" : "maintenance",
            amount: totalCost.toFixed(2),
            paymentDate: existingProcurement.expectedDelivery || new Date(),
            paymentPeriod: "one-time" as const,
            status: "pending" as const,
            description: `Procurement: ${updatedTitle}${updatedSupplier ? ` (${updatedSupplier})` : ""}`,
            branchId: updatedBranchId || null,
          };
          
          if (validBillId) {
            // Update existing bill - ownership verified above
            await storage.updateShopBill(validBillId, restaurantId, billData);
          } else {
            const bill = await storage.createShopBill(billData as any);
            billIdToSet = bill.id;
          }
        }
      }
      
      // Add billId to update if it changed
      if (billIdToSet !== undefined) {
        (safeData as any).billId = billIdToSet;
      }
      
      // Auto-create inventory item when procurement type is "inventory" and status changes to complete
      // Only create if no inventory item has been created yet (check inventoryItemId)
      const wasNotComplete = !["received", "completed"].includes(oldStatus);
      const isNowComplete = ["received", "completed"].includes(newStatus);
      const isAlreadyComplete = ["received", "completed"].includes(oldStatus);
      const hasExistingInventory = !!existingProcurement.inventoryItemId;
      const newInventoryLink = (safeData as any).inventoryItemId;
      const isNewlyLinking = newInventoryLink && !hasExistingInventory;
      
      console.log(`[PROCUREMENT] Update check - type:${updatedType}, oldStatus:${oldStatus}, newStatus:${newStatus}, hasExistingInventory:${hasExistingInventory}, newInventoryLink:${newInventoryLink}, isReorder:${!!existingProcurement.originalProcurementId}`);
      
      // Handle case: status changes to complete AND user provides inventoryItemId in this request
      if (updatedType === "inventory" && wasNotComplete && isNowComplete && newInventoryLink) {
        try {
          const inventoryItem = await storage.getInventoryItem(newInventoryLink, restaurantId);
          if (inventoryItem) {
            const currentQty = parseFloat(String(inventoryItem.quantity)) || 0;
            const addQty = parseFloat(String(safeData.quantity ?? existingProcurement.quantity ?? 0)) || 0;
            const newQty = currentQty + addQty;
            
            const procUnitPrice = safeData.unitPrice ?? existingProcurement.unitPrice ?? "0";
            const newTotalPrice = (newQty * parseFloat(String(procUnitPrice))).toFixed(2);
            
            await storage.updateInventoryItem(newInventoryLink, restaurantId, {
              quantity: String(newQty),
              price: newTotalPrice,
            });
            console.log(`[PROCUREMENT] Status completed with inventory link - added ${addQty} to inventory ${inventoryItem.name} (new qty: ${newQty}, unitPrice: ${procUnitPrice})`);
          } else {
            console.warn(`[PROCUREMENT] Inventory item ${newInventoryLink} not found`);
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to update inventory on status change:", invError);
        }
      }
      // Handle case: procurement is already completed AND user just linked it to inventory
      else if (updatedType === "inventory" && isAlreadyComplete && isNewlyLinking) {
        try {
          const inventoryItem = await storage.getInventoryItem(newInventoryLink, restaurantId);
          if (inventoryItem) {
            const currentQty = parseFloat(String(inventoryItem.quantity)) || 0;
            const addQty = parseFloat(String(safeData.quantity ?? existingProcurement.quantity ?? 0)) || 0;
            const newQty = currentQty + addQty;
            
            const procUnitPrice2 = safeData.unitPrice ?? existingProcurement.unitPrice ?? "0";
            const newTotalPrice2 = (newQty * parseFloat(String(procUnitPrice2))).toFixed(2);
            
            await storage.updateInventoryItem(newInventoryLink, restaurantId, {
              quantity: String(newQty),
              price: newTotalPrice2,
            });
            console.log(`[PROCUREMENT] Newly linked completed procurement - added ${addQty} to inventory ${inventoryItem.name} (new qty: ${newQty}, unitPrice: ${procUnitPrice2})`);
          } else {
            console.warn(`[PROCUREMENT] Newly linked inventory item ${newInventoryLink} not found`);
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to update newly linked inventory:", invError);
        }
      }
      
      // Handle reorder - when a reorder procurement is received/completed, ADD to existing inventory
      const isReorder = !!existingProcurement.originalProcurementId;
      if (updatedType === "inventory" && wasNotComplete && isNowComplete && isReorder && existingProcurement.inventoryItemId) {
        try {
          const inventoryItem = await storage.getInventoryItem(existingProcurement.inventoryItemId, restaurantId);
          if (inventoryItem) {
            const currentQty = parseFloat(String(inventoryItem.quantity)) || 0;
            // Use updated quantity if provided in this request, otherwise use existing procurement quantity
            const addQty = parseFloat(String(safeData.quantity ?? existingProcurement.quantity ?? 0)) || 0;
            const newQty = currentQty + addQty;
            
            const procUnitPrice3 = safeData.unitPrice ?? existingProcurement.unitPrice ?? "0";
            const newTotalPrice3 = (newQty * parseFloat(String(procUnitPrice3))).toFixed(2);
            
            await storage.updateInventoryItem(existingProcurement.inventoryItemId, restaurantId, {
              quantity: String(newQty),
              price: newTotalPrice3,
            });
            console.log(`[PROCUREMENT] Reorder received - added ${addQty} to inventory ${inventoryItem.name} (new qty: ${newQty}, unitPrice: ${procUnitPrice3})`);
          } else {
            console.warn(`[PROCUREMENT] Reorder inventory item ${existingProcurement.inventoryItemId} not found`);
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to update inventory for reorder:", invError);
        }
      }
      // Handle procurement linked to existing inventory (not a reorder) - ADD to existing inventory
      else if (updatedType === "inventory" && wasNotComplete && isNowComplete && hasExistingInventory && !isReorder) {
        try {
          const inventoryItem = await storage.getInventoryItem(existingProcurement.inventoryItemId!, restaurantId);
          if (inventoryItem) {
            const currentQty = parseFloat(String(inventoryItem.quantity)) || 0;
            // Use updated quantity if provided in this request, otherwise use existing procurement quantity
            const addQty = parseFloat(String(safeData.quantity ?? existingProcurement.quantity ?? 0)) || 0;
            const newQty = currentQty + addQty;
            
            const procUnitPrice4 = safeData.unitPrice ?? existingProcurement.unitPrice ?? "0";
            const newTotalPrice4 = (newQty * parseFloat(String(procUnitPrice4))).toFixed(2);
            
            await storage.updateInventoryItem(existingProcurement.inventoryItemId!, restaurantId, {
              quantity: String(newQty),
              price: newTotalPrice4,
            });
            console.log(`[PROCUREMENT] Linked inventory updated - added ${addQty} to inventory ${inventoryItem.name} (new qty: ${newQty}, unitPrice: ${procUnitPrice4})`);
          } else {
            console.warn(`[PROCUREMENT] Linked inventory item ${existingProcurement.inventoryItemId} not found`);
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to update linked inventory:", invError);
        }
      }
      // Handle new procurement - create inventory item when first completed
      else if (updatedType === "inventory" && wasNotComplete && isNowComplete && !hasExistingInventory) {
        try {
          const inventoryData = {
            restaurantId,
            name: updatedTitle,
            category: existingProcurement.category || "General",
            quantity: String(existingProcurement.quantity || 1),
            unit: "pcs",
            referenceQuantity: String(existingProcurement.quantity || 1),
            price: safeData.totalCost || existingProcurement.totalCost || "0",
            supplier: updatedSupplier || "",
            status: "In Stock",
            branchId: updatedBranchId || null,
          };
          const inventoryItem = await storage.createInventoryItem(inventoryData);
          console.log(`[PROCUREMENT] Auto-created inventory item: ${inventoryItem.name} from procurement update ${req.params.id}`);
          
          // Link inventory item to procurement to prevent duplicate creation
          (safeData as any).inventoryItemId = inventoryItem.id;
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to auto-create inventory item on update:", invError);
        }
      }
      
      const procurement = await storage.updateProcurement(req.params.id, restaurantId, safeData);
      if (!procurement) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      
      // Fire-and-forget activity logging
      if (req.session.user) {
        logActivity({
          restaurantId,
          employeeId: req.session.user.id,
          employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
          action: 'updated_procurement',
          actionCategory: 'procurement',
          description: `Updated procurement ${procurement.title}`,
          entityType: 'procurement',
          entityId: procurement.id,
          branchId: procurement.branchId || undefined,
        }).catch(err => console.error('Activity log error:', err));
      }
      
      res.json(procurement);
    } catch (error) {
      console.error("Procurement update error:", error);
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.delete("/api/procurement/:id", requireAuth, requireRestaurant, requireAction('procurement', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // Get procurement to check for associated bill
    const existingProcurement = await storage.getProcurement(req.params.id, restaurantId);
    if (!existingProcurement) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    
    // Delete associated bill if exists and belongs to this tenant
    if (existingProcurement.billId) {
      const existingBill = await storage.getShopBill(existingProcurement.billId);
      if (existingBill && existingBill.restaurantId === restaurantId) {
        await storage.deleteShopBill(existingProcurement.billId, restaurantId);
      } else if (existingBill) {
        console.warn(`[SECURITY] Procurement ${req.params.id} has billId ${existingProcurement.billId} belonging to another tenant - not deleting`);
      }
    }
    
    const success = await storage.deleteProcurement(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    
    // Fire-and-forget activity logging
    if (req.session.user && existingProcurement) {
      logActivity({
        restaurantId,
        employeeId: req.session.user.id,
        employeeName: req.session.user.fullName || req.session.user.username || 'Unknown',
        action: 'deleted_procurement',
        actionCategory: 'procurement',
        description: `Deleted procurement ${existingProcurement.title}`,
        entityType: 'procurement',
        entityId: req.params.id,
        branchId: existingProcurement.branchId || undefined,
      }).catch(err => console.error('Activity log error:', err));
    }
    
    res.status(204).send();
  });

  // Reorder a completed/received procurement
  app.post("/api/procurement/:id/reorder", requireAuth, requireRestaurant, requireAction('procurement', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userName = req.session.user!.fullName || req.session.user!.username;
      
      // Get price, quantity, unit, and new fields from request body
      const { quantity, unitPrice, unit, totalPrice, category, expirationDays, supplier, status } = req.body;
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Quantity is required and must be greater than 0" });
      }
      if (!totalPrice || parseFloat(totalPrice) < 0) {
        return res.status(400).json({ error: "Total price is required" });
      }
      const validUnits = ['kg', 'g', 'l', 'ml', 'pcs'];
      const procurementUnit = unit && validUnits.includes(unit) ? unit : 'pcs';
      const validStatuses = ['pending', 'approved', 'ordered', 'received', 'completed'];
      const procurementStatus = status && validStatuses.includes(status) ? status : 'pending';
      const validCategories = ['inventory', 'maintenance', 'installation', 'equipment'];
      const procurementCategory = category && validCategories.includes(category) ? category : 'inventory';
      
      // Get the original procurement
      const originalProcurement = await storage.getProcurement(req.params.id, restaurantId);
      if (!originalProcurement) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      
      // Only allow reordering of completed or received procurements
      if (!["received", "completed"].includes(originalProcurement.status)) {
        return res.status(400).json({ error: "Only completed or received procurements can be reordered" });
      }
      
      // Parse and validate numeric values
      const parsedQuantity = parseFloat(quantity);
      const parsedTotalPrice = parseFloat(totalPrice);
      const parsedUnitPrice = unitPrice ? parseFloat(unitPrice) : (parsedQuantity > 0 ? parsedTotalPrice / parsedQuantity : 0);
      const parsedExpirationDays = expirationDays ? parseInt(expirationDays, 10) : null;
      
      // Use totalPrice directly instead of calculating from unitPrice
      const totalCostNum = parsedTotalPrice;
      
      // Use supplier from request or fall back to original
      const procurementSupplier = supplier !== undefined ? supplier : originalProcurement.supplier;
      
      // Create a new procurement record based on the original with new price/quantity
      // Include originalProcurementId and inventoryItemId directly in creation to ensure they're saved
      const reorderData = {
        restaurantId,
        type: procurementCategory as "inventory" | "maintenance" | "installation" | "equipment",
        title: `Reorder: ${originalProcurement.title}`,
        description: originalProcurement.description,
        supplier: procurementSupplier,
        category: procurementCategory,
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice.toFixed(2),
        totalCost: totalCostNum.toFixed(2),
        status: procurementStatus as "pending" | "approved" | "ordered" | "received" | "completed",
        priority: originalProcurement.priority as "low" | "medium" | "high" | "urgent",
        requestedBy: userName,
        branchId: originalProcurement.branchId,
        notes: `Reorder of procurement ID: ${originalProcurement.id}${parsedExpirationDays ? `. Expiration: ${parsedExpirationDays} days` : ''}`,
        unit: procurementUnit,
        expirationDays: parsedExpirationDays,
        originalProcurementId: originalProcurement.id,
        inventoryItemId: originalProcurement.inventoryItemId,
      };
      
      console.log(`[PROCUREMENT] Creating reorder with inventoryItemId: ${originalProcurement.inventoryItemId}, originalProcurementId: ${originalProcurement.id}`);
      
      const newProcurement = await storage.createProcurement(reorderData);
      console.log(`[PROCUREMENT] Reorder created with id: ${newProcurement.id}, inventoryItemId: ${newProcurement.inventoryItemId}, originalProcurementId: ${newProcurement.originalProcurementId}`);
      
      // If reorder is created with completed/received status AND has inventoryItemId, update inventory immediately
      if (["completed", "received"].includes(procurementStatus) && originalProcurement.inventoryItemId) {
        try {
          const inventoryItem = await storage.getInventoryItem(originalProcurement.inventoryItemId, restaurantId);
          if (inventoryItem) {
            const currentQty = parseFloat(String(inventoryItem.quantity)) || 0;
            const addQty = parsedQuantity;
            const newQty = currentQty + addQty;
            
            const newTotalPrice5 = (newQty * parsedUnitPrice).toFixed(2);
            
            await storage.updateInventoryItem(originalProcurement.inventoryItemId, restaurantId, {
              quantity: String(newQty),
              price: newTotalPrice5,
            });
            console.log(`[PROCUREMENT] Reorder completed at creation - added ${addQty} to inventory ${inventoryItem.name} (was: ${currentQty}, now: ${newQty}, unitPrice: ${parsedUnitPrice})`);
          } else {
            console.warn(`[PROCUREMENT] Reorder inventory item ${originalProcurement.inventoryItemId} not found`);
          }
        } catch (invError) {
          console.error("[PROCUREMENT] Failed to update inventory on reorder creation:", invError);
        }
      }
      
      // Create an invoice for the reorder
      const settings = await storage.getSettings(restaurantId);
      const branch = originalProcurement.branchId ? await storage.getBranch(originalProcurement.branchId, restaurantId) : null;
      
      // Calculate VAT (15%) - unitPrice is VAT-inclusive
      // Net price per unit = unitPrice / 1.15
      // VAT per unit = unitPrice - netPricePerUnit
      const netPricePerUnit = parsedUnitPrice / 1.15;
      const vatPerUnit = parsedUnitPrice - netPricePerUnit;
      
      // Calculate totals
      const subtotalNum = netPricePerUnit * parsedQuantity;
      const vatAmountNum = vatPerUnit * parsedQuantity;
      const totalNum = subtotalNum + vatAmountNum; // Should equal totalCostNum
      
      // Generate invoice number
      const invoiceNumber = `REORDER-${Date.now()}`;
      
      // Create invoice items with consistent VAT calculation (including unit)
      const invoiceItems = [{
        name: originalProcurement.title,
        quantity: parsedQuantity,
        basePrice: parseFloat(netPricePerUnit.toFixed(2)),
        vatAmount: parseFloat(vatPerUnit.toFixed(2)),
        total: parseFloat((netPricePerUnit + vatPerUnit).toFixed(2)),
        unit: procurementUnit,
      }];
      
      // Create invoice record - ensure line items reconcile with totals
      // Link to procurement via procurementId
      const invoiceData = {
        restaurantId,
        invoiceNumber,
        invoiceType: "standard" as const,
        orderId: null,
        procurementId: newProcurement.id,
        branchId: originalProcurement.branchId || null,
        customerName: procurementSupplier || "Supplier",
        items: invoiceItems,
        subtotal: subtotalNum.toFixed(2),
        vatAmount: vatAmountNum.toFixed(2),
        total: totalNum.toFixed(2),
        qrCode: "",
        pdfPath: "",
      };
      
      const createdInvoice = await storage.createInvoice(invoiceData);
      
      // Fetch the updated procurement to return
      const finalProcurement = await storage.getProcurement(newProcurement.id, restaurantId);
      
      console.log(`[PROCUREMENT] Created reorder ${newProcurement.id} from original ${originalProcurement.id} with invoice ${createdInvoice.id}`);
      res.status(201).json({ procurement: finalProcurement, invoice: createdInvoice });
    } catch (error) {
      console.error("Reorder error:", error);
      res.status(400).json({ error: "Failed to create reorder" });
    }
  });

  // Get procurement-related invoices (reorder invoices)
  app.get("/api/procurement/invoices", requireAuth, requireRestaurant, requireAction('procurement', 'view'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Query invoices where procurementId is not null
      const allInvoices = await storage.getInvoices({ restaurantId });
      const procurementInvoices = allInvoices.filter(invoice => invoice.procurementId != null);
      
      // Enrich with procurement details
      const enrichedInvoices = await Promise.all(
        procurementInvoices.map(async (invoice) => {
          const procurementDetails = invoice.procurementId 
            ? await storage.getProcurement(invoice.procurementId, restaurantId)
            : null;
          return {
            ...invoice,
            procurement: procurementDetails,
          };
        })
      );
      
      // Sort by creation date descending (newest first)
      enrichedInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(enrichedInvoices);
    } catch (error) {
      console.error("Get procurement invoices error:", error);
      res.status(500).json({ error: "Failed to get procurement invoices" });
    }
  });

  // Sync all inventory items to procurement (creates missing procurement records)
  app.post("/api/procurement/sync-inventory", requireAuth, requireRestaurant, requireAction('procurement', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userName = req.session.user!.fullName || req.session.user!.username;
      
      // Get all inventory items
      const inventoryItems = await storage.getInventoryItems(restaurantId);
      
      // Get all existing procurements to check which inventory items already have records
      const existingProcurements = await storage.getProcurements({ restaurantId });
      
      // Extract inventory IDs that already have procurement records (from notes field)
      const existingInventoryIds = new Set<string>();
      for (const proc of existingProcurements) {
        if (proc.notes && proc.notes.includes("Inventory Item ID:")) {
          const match = proc.notes.match(/Inventory Item ID:\s*([a-f0-9-]+)/i);
          if (match) {
            existingInventoryIds.add(match[1]);
          }
        }
      }
      
      // Create procurement records for inventory items that don't have one
      let created = 0;
      let skipped = 0;
      
      for (const item of inventoryItems) {
        if (existingInventoryIds.has(item.id)) {
          skipped++;
          continue;
        }
        
        try {
          const refQty = item.referenceQuantity ? parseInt(String(item.referenceQuantity), 10) : null;
          const invQty = item.quantity ? parseInt(String(item.quantity), 10) : null;
          const quantity = refQty || invQty || null;
          const unitPrice = refQty && refQty > 0 
            ? (parseFloat(item.price) / refQty).toFixed(2) 
            : null;
          
          const procurementData = {
            restaurantId,
            type: "inventory" as const,
            title: item.name,
            description: `Synced from inventory: ${item.name}${item.category ? ` (${item.category})` : ''}`,
            supplier: item.supplier || null,
            category: item.category || null,
            quantity,
            unitPrice,
            totalCost: item.price,
            status: "received" as const,
            priority: "medium" as const,
            requestedBy: userName,
            approvedBy: userName,
            branchId: item.branchId || null,
            notes: `Inventory Item ID: ${item.id}`,
          };
          
          await storage.createProcurement(procurementData);
          created++;
        } catch (err) {
          console.error(`[PROCUREMENT SYNC] Failed to create procurement for inventory item ${item.id}:`, err);
        }
      }
      
      console.log(`[PROCUREMENT SYNC] Created ${created} procurement records, skipped ${skipped} (already exist)`);
      res.json({ 
        success: true, 
        created, 
        skipped, 
        total: inventoryItems.length,
        message: `Created ${created} procurement records for inventory items` 
      });
    } catch (error) {
      console.error("[PROCUREMENT SYNC] Error syncing inventory to procurement:", error);
      res.status(500).json({ error: "Failed to sync inventory to procurement" });
    }
  });

  // Sync all procurement items to shop bills (ensures bills match procurement status)
  app.post("/api/procurement/sync-shop-bills", requireAuth, requireRestaurant, requireAction('procurement', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // Get all procurement items
      const procurements = await storage.getProcurements({ restaurantId });
      
      let created = 0;
      let updated = 0;
      let deleted = 0;
      let skipped = 0;
      
      // Process in parallel batches for speed
      const batchSize = 5;
      for (let i = 0; i < procurements.length; i += batchSize) {
        const batch = procurements.slice(i, i + batchSize);
        await Promise.all(batch.map(async (proc) => {
          try {
            const totalCost = parseFloat(proc.totalCost || "0");
            if (totalCost <= 0) {
              skipped++;
              return;
            }
            
            // Verify existing bill ownership if present
            let validBillId: string | null = null;
            if (proc.billId) {
              const existingBill = await storage.getShopBill(proc.billId);
              if (existingBill && existingBill.restaurantId === restaurantId) {
                validBillId = proc.billId;
              }
            }
            
            if (proc.status === "cancelled") {
              // Remove bill for cancelled procurements
              if (validBillId) {
                await storage.deleteShopBill(validBillId, restaurantId);
                deleted++;
              } else {
                skipped++;
              }
            } else if (proc.status === "completed") {
              // Create/update bill as paid for completed
              const billData = {
                restaurantId,
                billType: proc.type === "inventory" ? "foundational" : "maintenance",
                amount: totalCost.toFixed(2),
                paymentDate: new Date(),
                paymentPeriod: "one-time" as const,
                status: "paid" as const,
                description: `Procurement: ${proc.title}${proc.supplier ? ` (${proc.supplier})` : ""}`,
                branchId: proc.branchId || null,
              };
              
              if (validBillId) {
                await storage.updateShopBill(validBillId, restaurantId, billData);
                updated++;
              } else {
                await storage.createShopBill(billData as any);
                created++;
              }
            } else if (["pending", "approved", "ordered", "received"].includes(proc.status)) {
              // Create/update bill as pending for in-progress statuses
              const billData = {
                restaurantId,
                billType: proc.type === "inventory" ? "foundational" : "maintenance",
                amount: totalCost.toFixed(2),
                paymentDate: proc.expectedDelivery || new Date(),
                paymentPeriod: "one-time" as const,
                status: "pending" as const,
                description: `Procurement: ${proc.title}${proc.supplier ? ` (${proc.supplier})` : ""}`,
                branchId: proc.branchId || null,
              };
              
              if (validBillId) {
                await storage.updateShopBill(validBillId, restaurantId, billData);
                updated++;
              } else {
                await storage.createShopBill(billData as any);
                created++;
              }
            } else {
              skipped++;
            }
          } catch (err) {
            console.error(`[PROCUREMENT SYNC BILLS] Failed to sync bill for procurement ${proc.id}:`, err);
            skipped++;
          }
        }));
      }
      
      console.log(`[PROCUREMENT SYNC BILLS] Created ${created}, updated ${updated}, deleted ${deleted}, skipped ${skipped}`);
      res.json({ 
        success: true, 
        created, 
        updated,
        deleted,
        skipped, 
        total: procurements.length,
        message: `Synced shop bills: ${created} created, ${updated} updated, ${deleted} deleted` 
      });
    } catch (error) {
      console.error("[PROCUREMENT SYNC BILLS] Error syncing procurement to bills:", error);
      res.status(500).json({ error: "Failed to sync procurement to shop bills" });
    }
  });

  // Generate B2B (Standard) Invoice for Procurement Request
  app.post("/api/procurement/:id/generate-b2b-invoice", requireAuth, requireRestaurant, requireAction('procurement', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const procurementId = req.params.id;
      
      // Get procurement record
      const procurementRecord = await storage.getProcurement(procurementId, restaurantId);
      if (!procurementRecord) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      
      const settings = await storage.getSettings(restaurantId);
      const branch = procurementRecord.branchId 
        ? await storage.getBranch(procurementRecord.branchId, restaurantId) 
        : null;
      
      // Generate B2B invoice number (separate sequence from POS)
      const invoiceNumber = await storage.getNextB2BInvoiceNumber(restaurantId);
      
      // Calculate pricing from procurement data
      const totalCost = parseFloat(procurementRecord.totalCost || "0");
      const vatRate = 0.15;
      const subtotal = totalCost / (1 + vatRate);
      const vatAmount = totalCost - subtotal;
      
      // Create Order-like object for PDF generation
      const procurementOrder = {
        id: procurementId,
        restaurantId,
        branchId: procurementRecord.branchId || null,
        orderNumber: `PROC-${procurementRecord.id.substring(0, 8).toUpperCase()}`,
        orderType: "Procurement",
        status: "completed",
        items: [{
          name: procurementRecord.title || "Procurement Item",
          quantity: procurementRecord.quantity || 1,
          price: procurementRecord.unitPrice ? parseFloat(procurementRecord.unitPrice) : totalCost,
        }],
        subtotal: subtotal.toFixed(2),
        tax: vatAmount.toFixed(2),
        total: totalCost.toFixed(2),
        customerName: procurementRecord.supplier || "Supplier",
        table: null,
        address: null,
        createdAt: procurementRecord.createdAt || new Date(),
      } as any;
      
      // Transform items to invoice items format with VAT breakdown
      const invoiceItems = procurementOrder.items.map((item: any) => {
        const itemTotal = item.quantity * item.price;
        const basePrice = itemTotal / 1.15;
        const itemVat = itemTotal - basePrice;
        return {
          name: item.name,
          quantity: item.quantity,
          basePrice: parseFloat(basePrice.toFixed(2)),
          vatAmount: parseFloat(itemVat.toFixed(2)),
          total: parseFloat(itemTotal.toFixed(2)),
        };
      });
      
      // Create invoice record first to get the ID (B2B Standard Invoice)
      const invoiceData = {
        restaurantId,
        invoiceNumber,
        invoiceType: "standard" as const, // B2B - Standard Tax Invoice
        orderId: null, // No order ID - this is from procurement
        branchId: procurementRecord.branchId || null,
        customerName: procurementRecord.supplier || "Supplier",
        customerVatNumber: settings?.vatNumber || null, // Use supplier VAT if available
        items: invoiceItems,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        total: totalCost.toFixed(2),
        qrCode: "",
        pdfPath: "",
      };
      
      const createdInvoice = await storage.createInvoice(invoiceData);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Generate PDF with invoice ID for QR code (Standard Invoice format for B2B)
      const pdfData = {
        order: procurementOrder,
        companyName: settings?.restaurantName || "Business Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location, Riyadh",
        companyEmail: settings?.email || "info@business.sa",
        companyPhone: settings?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: new Date(),
        invoiceId: createdInvoice.id,
        baseUrl,
        logoPath: settings?.logoPath || undefined,
        invoiceType: "standard" as const, // B2B - Standard Tax Invoice
        customerVatNumber: settings?.vatNumber, // Buyer VAT for B2B invoice
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
      
      // Process invoice through ZATCA if enabled (B2B Standard Invoice - requires clearance)
      try {
        
        const zatcaResult = await processInvoiceForZatca({
          restaurantId,
          invoiceId: createdInvoice.id,
          invoiceNumber,
          invoiceType: "standard", // B2B - Standard Tax Invoice (requires clearance)
          paymentMethod: "bank_transfer",
          subtotal: totalCost / 1.15,
          vatAmount: totalCost - (totalCost / 1.15),
          total: totalCost,
          discount: 0,
          items: invoiceItems.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.basePrice,
            totalAmount: item.total
          })),
          customerName: procurementRecord.supplier || undefined
        });

        if (zatcaResult.success) {
          console.log(`[ZATCA] B2B Invoice ${invoiceNumber} processed: ${zatcaResult.submissionStatus}`);
        } else if (zatcaResult.errors && zatcaResult.errors.length > 0) {
          console.log(`[ZATCA] B2B Invoice ${invoiceNumber} not submitted (ZATCA disabled or not configured)`);
        }
      } catch (zatcaError) {
        console.error("[ZATCA] Non-blocking error processing B2B invoice:", zatcaError);
      }
      
      // Broadcast sales update for real-time BEP tracking
      broadcastNotification({
        type: 'sales:updated',
        restaurantId,
        invoiceId: createdInvoice.id,
        invoiceTotal: totalCost.toFixed(2),
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=b2b-invoice-${invoiceNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("B2B Invoice generation error:", error);
      res.status(500).json({ error: "Failed to generate B2B invoice" });
    }
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

      // Create invoice record first to get the ID (B2C Simplified Invoice)
      const invoiceData = {
        restaurantId: req.session.user!.restaurantId!,
        invoiceNumber,
        invoiceType: "simplified" as const, // B2C - Simplified Tax Invoice
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

      // Generate PDF with invoice ID for QR code (Simplified Invoice format)
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
        invoiceType: "simplified" as const, // B2C - Simplified Tax Invoice
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

      // Process invoice through ZATCA if enabled (async, non-blocking)
      try {
        
        const zatcaResult = await processInvoiceForZatca({
          restaurantId,
          invoiceId: createdInvoice.id,
          invoiceNumber,
          invoiceType: "simplified", // B2C - Simplified Tax Invoice
          paymentMethod: (order.paymentMethod as "cash" | "card" | "bank_transfer") || "cash",
          subtotal: parseFloat(order.subtotal),
          vatAmount: parseFloat(order.tax),
          total: parseFloat(order.total),
          discount: 0,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalAmount: item.quantity * item.price
          })),
          customerName: order.customerName || undefined
        });

        if (zatcaResult.success) {
          console.log(`[ZATCA] Invoice ${invoiceNumber} processed successfully: ${zatcaResult.submissionStatus}`);
        } else if (zatcaResult.errors && zatcaResult.errors.length > 0) {
          console.log(`[ZATCA] Invoice ${invoiceNumber} not submitted (ZATCA disabled or not configured)`);
        }
      } catch (zatcaError) {
        console.error("[ZATCA] Non-blocking error processing invoice:", zatcaError);
        // Continue - ZATCA processing is non-blocking
      }

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

  // Public endpoint for user signup (with file upload support)
  // Creates a pending signup and redirects to Geidea for payment
  app.post("/api/auth/signup", uploadSignupFiles, async (req, res) => {
    try {
      const { username, password, name, email, commercialRegistration, restaurantName, nationalId, hasVatRegistration, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount } = req.body;
      
      console.log("[SIGNUP] Received signup request for username:", username);
      console.log("[SIGNUP] Request body:", { username, name, email, restaurantName, nationalId, hasVatRegistration, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount });
      
      // Get uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files) {
        console.log("[SIGNUP] Uploaded files:", Object.keys(files));
      }
      
      // Parse hasVatRegistration boolean from form data
      const hasVatReg = hasVatRegistration === 'true' || hasVatRegistration === true;
      
      // Validate required fields (taxNumber only required if hasVatRegistration is true)
      if (!username || !password || !name || !email || !commercialRegistration || !restaurantName || !nationalId || !businessType || !restaurantType || !subscriptionPlan || !branchesCount) {
        console.log("[SIGNUP] Missing required fields");
        return res.status(400).json({ error: "All fields are required including Restaurant Name, National ID, Business Type, Restaurant Type, Commercial Registration, subscription plan, and number of branches" });
      }
      
      // If VAT registration is true, require tax number and VAT certificate
      if (hasVatReg && !taxNumber) {
        console.log("[SIGNUP] Missing tax number for VAT registered business");
        return res.status(400).json({ error: "Tax Number is required when you have VAT registration" });
      }
      
      // Check for VAT certificate when hasVatRegistration is true
      if (hasVatReg && (!files || !files.vatCertificate || files.vatCertificate.length === 0)) {
        console.log("[SIGNUP] Missing VAT certificate for VAT registered business");
        return res.status(400).json({ error: "VAT Certificate is required when you have VAT registration" });
      }

      // Validate required business documents (all are now mandatory)
      if (!files || !files.crCertificate || files.crCertificate.length === 0) {
        console.log("[SIGNUP] Missing CR certificate");
        return res.status(400).json({ error: "CR Certificate is required" });
      }
      
      if (!files || !files.ibanCertificate || files.ibanCertificate.length === 0) {
        console.log("[SIGNUP] Missing IBAN certificate");
        return res.status(400).json({ error: "IBAN Certificate is required" });
      }
      
      if (!files || !files.nationalAddress || files.nationalAddress.length === 0) {
        console.log("[SIGNUP] Missing National Address certificate");
        return res.status(400).json({ error: "National Address certificate is required" });
      }

      // Validate subscription plan based on business type
      // Factory and service businesses can only have monthly or yearly plans (no weekly)
      const noWeeklyTypes = ['factory', 'design_services', 'installation_services', 'it_services'];
      if (noWeeklyTypes.includes(businessType) && subscriptionPlan === 'weekly') {
        return res.status(400).json({ error: "This business type can only have monthly or yearly subscription plans" });
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

      // Calculate subscription amount using shared pricing module
      const pricing = getPlanPricing(subscriptionPlan as SubscriptionPlan, branches, businessType as BusinessType);
      const totalAmount = pricing.grossAmount; // Total including VAT
      
      console.log(`[SIGNUP] Calculated subscription amount: ${totalAmount} SAR for ${subscriptionPlan} plan, ${branches} branch(es)`);

      // Hash password for secure storage
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      // Collect uploaded file paths for pending signup
      const uploadedFilePaths: Record<string, { filename: string; originalname: string; mimetype: string; size: number }> = {};
      if (files) {
        for (const [fieldName, fileArr] of Object.entries(files)) {
          if (fileArr && fileArr.length > 0) {
            const file = fileArr[0];
            uploadedFilePaths[fieldName] = {
              filename: file.filename,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            };
          }
        }
      }

      // Create Geidea payment session
      const { createPaymentSession } = await import('./geidea');
      
      // Determine callback URL based on environment
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
      const host = req.get('host') || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const callbackUrl = `${baseUrl}/api/geidea/signup-callback`;
      
      const merchantReferenceId = `SIGNUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const geideaSession = await createPaymentSession({
        amount: totalAmount,
        currency: 'SAR',
        callbackUrl,
        merchantReferenceId,
        customerEmail: email,
        customerName: name,
        cardOnFile: false, // Tokenization requires special merchant approval
        initiatedBy: 'Internet', // Customer-initiated payment via web
      });

      if (!geideaSession.session?.id) {
        console.error("[SIGNUP] Failed to create Geidea session:", geideaSession);
        return res.status(500).json({ error: "Failed to initialize payment. Please try again." });
      }

      console.log(`[SIGNUP] Created Geidea session: ${geideaSession.session.id}`);

      // Create pending signup record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

      await storage.createPendingSignup({
        geideaSessionId: geideaSession.session.id,
        merchantReferenceId,
        username,
        passwordHash,
        fullName: name,
        email,
        restaurantName,
        nationalId,
        hasVatRegistration: hasVatReg,
        taxNumber: hasVatReg ? taxNumber : null,
        commercialRegistration,
        businessType: businessType as "restaurant" | "factory" | "real_estate",
        restaurantType,
        subscriptionPlan: subscriptionPlan as "weekly" | "monthly" | "yearly",
        branchesCount: branches,
        amount: totalAmount.toString(),
        status: "pending",
        uploadedFiles: uploadedFilePaths,
        expiresAt,
      });

      console.log(`[SIGNUP] Created pending signup for username: ${username}, Geidea session: ${geideaSession.session.id}`);

      // Return Geidea payment URL for frontend to redirect
      res.status(200).json({
        redirectUrl: geideaSession.session.paymentUrl,
        sessionId: geideaSession.session.id,
        amount: totalAmount,
        message: "Redirecting to payment...",
      });
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
        activityLog: true,
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
      const { devicePreference, language } = req.body;
      
      // Validate device preference
      if (devicePreference && !['laptop', 'ipad', 'iphone'].includes(devicePreference)) {
        return res.status(400).json({ error: "Invalid device preference. Must be 'laptop', 'ipad', or 'iphone'" });
      }

      // Validate language preference
      const validLanguages = ['English', 'Arabic', 'German', 'Chinese', 'Bengali', 'Italian', 'Hindi', 'Urdu', 'Spanish', 'Tagalog'];
      if (language && !validLanguages.includes(language)) {
        return res.status(400).json({ error: "Invalid language preference" });
      }

      const updateData: Record<string, any> = {};
      if (devicePreference) updateData.devicePreference = devicePreference;
      if (language) updateData.language = language;

      // For IT accounts, update user without restaurantId
      // For client accounts, update user with restaurantId for multi-tenant isolation
      const updatedUser = restaurantId 
        ? await storage.updateUser(req.session.userId!, restaurantId, updateData)
        : await storage.updateUserById(req.session.userId!, updateData);
      
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

  // Employee Activity Log (Admin only - track sub-account actions)
  app.get("/api/employee-activities", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    
    // Only admins can view activity logs
    if (req.session.user!.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { employeeId, category, startDate, endDate } = req.query;
      
      const activities = await storage.getEmployeeActivities(
        restaurantId,
        employeeId as string | undefined,
        category as string | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(activities);
    } catch (error) {
      console.error("Get employee activities error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Sync Employees - Add all employee accounts to activity log (Admin only)
  app.post("/api/employee-activities/sync", requireAuth, requireRestaurant, requirePermission('users'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const adminUser = req.session.user!;
    
    // Only admins can sync employees
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Get all employees for this restaurant
      const employees = await storage.getUsers(restaurantId);
      
      // Create activity log entries for each employee
      const syncedCount = await Promise.all(
        employees.map(async (employee) => {
          // Log the employee account sync
          logActivity({
            restaurantId,
            employeeId: adminUser.id,
            employeeName: adminUser.fullName || adminUser.username,
            action: "synced_employee",
            actionCategory: "employees",
            description: `Synced employee account: ${employee.fullName || employee.username} (${employee.role})`,
            entityType: "user",
            entityId: employee.id,
            newData: {
              username: employee.username,
              fullName: employee.fullName,
              email: employee.email,
              role: employee.role,
              active: employee.active,
              branchId: employee.branchId,
            },
          });
          return 1;
        })
      );
      
      res.json({ 
        success: true, 
        syncedCount: syncedCount.length,
        message: `Successfully synced ${syncedCount.length} employee accounts to activity log` 
      });
    } catch (error) {
      console.error("Sync employees error:", error);
      res.status(500).json({ error: "Failed to sync employees" });
    }
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

  // In-memory store for pending subscription updates (for production, use Redis or database)
  const pendingSubscriptionUpdates = new Map<string, {
    restaurantId: string;
    userId: string;
    newPlan: string;
    newBranchesCount: number;
    amount: number;
    merchantReferenceId: string;
    createdAt: string;
  }>();

  // Subscription Plan Update with Payment
  app.post("/api/subscription/update-payment", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const userId = req.session.user!.id;
    
    try {
      const { plan, branchesCount } = req.body as { plan: 'weekly' | 'monthly' | 'yearly'; branchesCount: number };
      
      if (!plan || !['weekly', 'monthly', 'yearly'].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan. Must be 'weekly', 'monthly', or 'yearly'" });
      }
      
      const branches = parseInt(String(branchesCount)) || 1;
      if (branches < 1) {
        return res.status(400).json({ error: "Number of branches must be at least 1" });
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      const user = await storage.getUser(userId, restaurantId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Factory businesses cannot have weekly plans
      if (restaurant.businessType === 'factory' && plan === 'weekly') {
        return res.status(400).json({ error: "Factory businesses can only have monthly or yearly subscription plans" });
      }
      
      // Calculate new subscription amount
      const pricing = getPlanPricing(plan as SubscriptionPlan, branches, (restaurant.businessType || 'restaurant') as BusinessType);
      const totalAmount = pricing.grossAmount;
      
      console.log(`[SUBSCRIPTION UPDATE] User ${userId} updating to ${plan} plan with ${branches} branches, amount: ${totalAmount} SAR`);
      
      // Generate callback URL
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
      const host = req.get('host') || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const callbackUrl = `${baseUrl}/api/geidea/subscription-update-callback`;
      
      const merchantReferenceId = `SUB-UPDATE-${restaurantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the pending subscription update
      pendingSubscriptionUpdates.set(merchantReferenceId, {
        restaurantId,
        userId,
        newPlan: plan,
        newBranchesCount: branches,
        amount: totalAmount,
        merchantReferenceId,
        createdAt: new Date().toISOString(),
      });
      
      // Create Geidea payment session
      const { createPaymentSession } = await import('./geidea');
      const geideaSession = await createPaymentSession({
        amount: totalAmount,
        currency: 'SAR',
        callbackUrl,
        merchantReferenceId,
        customerEmail: user.email || undefined,
        customerName: user.fullName || undefined,
        cardOnFile: false, // Tokenization requires special merchant approval
        initiatedBy: 'Internet',
      });
      
      if (!geideaSession.session?.id) {
        console.error("[SUBSCRIPTION UPDATE] Failed to create Geidea session:", geideaSession);
        return res.status(500).json({ error: "Failed to initialize payment. Please try again." });
      }
      
      console.log(`[SUBSCRIPTION UPDATE] Created Geidea session: ${geideaSession.session.id} for ${merchantReferenceId}`);
      
      res.json({
        redirectUrl: geideaSession.session.paymentUrl,
        sessionId: geideaSession.session.id,
        amount: totalAmount,
        message: "Redirecting to payment...",
      });
    } catch (error: any) {
      console.error("[SUBSCRIPTION UPDATE] Error:", error);
      res.status(500).json({ error: "Failed to initiate subscription update payment" });
    }
  });

  // Geidea callback for subscription update payments
  app.post("/api/geidea/subscription-update-callback", async (req, res) => {
    const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : req.protocol) + '://' + req.get('host');
    
    try {
      const { order } = req.body;
      
      if (!order) {
        console.error("[Geidea Subscription Update Callback] Missing order in callback");
        return res.redirect(`${baseUrl}/dashboard?error=payment_failed`);
      }
      
      const { orderId: geideaOrderId, status, merchantReferenceId, amount, currency } = order;
      
      console.log(`[Geidea Subscription Update Callback] Received callback:`, {
        geideaOrderId,
        status,
        merchantReferenceId,
        amount,
        currency,
      });
      
      // Get pending update from memory
      const pendingUpdate = pendingSubscriptionUpdates.get(merchantReferenceId);
      
      if (!pendingUpdate) {
        console.error(`[Geidea Subscription Update Callback] No pending update found for ${merchantReferenceId}`);
        return res.redirect(`${baseUrl}/dashboard?error=update_not_found`);
      }
      
      // Verify payment with Geidea
      const { getOrderDetails, isPaymentSuccessful } = await import('./geidea');
      let verifiedOrder;
      try {
        verifiedOrder = await getOrderDetails(geideaOrderId);
      } catch (verifyError: any) {
        console.error(`[Geidea Subscription Update Callback] Failed to verify order:`, verifyError);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=verification_failed`);
      }
      
      // Check payment status
      const paymentStatus = verifiedOrder?.order?.status || status;
      if (!isPaymentSuccessful(paymentStatus)) {
        console.log(`[Geidea Subscription Update Callback] Payment not successful: ${paymentStatus}`);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=payment_failed`);
      }
      
      // Verify merchantReferenceId matches
      const verifiedMerchantReferenceId = verifiedOrder?.order?.merchantReferenceId;
      if (verifiedMerchantReferenceId !== merchantReferenceId) {
        console.error(`[Geidea Subscription Update Callback] MerchantReferenceId mismatch: expected ${merchantReferenceId}, got ${verifiedMerchantReferenceId}`);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=verification_failed`);
      }
      
      // Verify currency matches
      const verifiedCurrency = verifiedOrder?.order?.currency || currency;
      if (verifiedCurrency !== 'SAR') {
        console.error(`[Geidea Subscription Update Callback] Currency mismatch: expected SAR, got ${verifiedCurrency}`);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=currency_mismatch`);
      }
      
      // Verify amount matches
      const verifiedAmount = parseFloat(verifiedOrder?.order?.amount || amount);
      if (Math.abs(verifiedAmount - pendingUpdate.amount) > 0.01) {
        console.error(`[Geidea Subscription Update Callback] Amount mismatch: expected ${pendingUpdate.amount}, got ${verifiedAmount}`);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=amount_mismatch`);
      }
      
      // Check if pending update has expired (15 minutes max)
      const createdAt = new Date(pendingUpdate.createdAt);
      const now = new Date();
      const expiryMs = 15 * 60 * 1000; // 15 minutes
      if (now.getTime() - createdAt.getTime() > expiryMs) {
        console.error(`[Geidea Subscription Update Callback] Pending update expired for ${merchantReferenceId}`);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=update_expired`);
      }
      
      // Update the restaurant's subscription
      const { restaurantId, newPlan, newBranchesCount, userId } = pendingUpdate;
      
      try {
        // Update restaurant subscription
        await db.update(restaurants)
          .set({
            subscriptionPlan: newPlan,
            branchesCount: newBranchesCount,
            subscriptionStatus: 'active',
            subscriptionStartDate: new Date(),
          })
          .where(eq(restaurants.id, restaurantId));
        
        console.log(`[Geidea Subscription Update Callback] Updated restaurant ${restaurantId} to ${newPlan} plan with ${newBranchesCount} branches`);
        
        // Generate subscription invoice
        const restaurant = await storage.getRestaurant(restaurantId);
        const user = await storage.getUser(userId, restaurantId);
        
        if (restaurant && user) {
          // Get business info for invoice
          const bi = await storage.getBusinessInfo();
          
          // Generate invoice serial number
          const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();
          
          // Calculate pricing details
          const pricing = getPlanPricing(newPlan as SubscriptionPlan, newBranchesCount, (restaurant.businessType || 'restaurant') as BusinessType);
          const additionalBranches = Math.max(0, newBranchesCount - 1);
          const additionalBranchesPrice = pricing.perBranchPrice * additionalBranches;
          
          // Generate PDF invoice using the correct function
          const pdfBuffer = await generateSubscriptionInvoice({
            serialNumber,
            userFullName: user.fullName,
            userEmail: user.email ?? "",
            restaurantName: restaurant.name,
            nationalId: restaurant.nationalId,
            taxNumber: restaurant.taxNumber ?? "",
            commercialRegistration: restaurant.commercialRegistration,
            subscriptionPlan: newPlan,
            branchesCount: newBranchesCount,
            basePlanPrice: pricing.basePrice,
            additionalBranchesPrice: additionalBranchesPrice,
            subtotal: pricing.netAmount,
            vatAmount: pricing.vatAmount,
            total: pricing.grossAmount,
            invoiceDate: new Date(),
            businessInfo: bi,
          });
          
          // Save invoice to database with correct column names
          const invoicesDir = path.join(process.cwd(), 'public', 'subscription-invoices');
          if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
          }
          
          const pdfFilename = `subscription-${serialNumber}.pdf`;
          const pdfPath = path.join(invoicesDir, pdfFilename);
          fs.writeFileSync(pdfPath, pdfBuffer);
          
          await db.insert(subscriptionInvoices).values({
            userId: userId,
            serialNumber,
            subscriptionPlan: newPlan,
            branchesCount: newBranchesCount,
            basePlanPrice: pricing.basePrice.toString(),
            additionalBranchesPrice: additionalBranchesPrice.toString(),
            subtotal: pricing.netAmount.toString(),
            vatAmount: pricing.vatAmount.toString(),
            total: pricing.grossAmount.toString(),
            pdfPath: `/subscription-invoices/${pdfFilename}`,
          });
          
          console.log(`[Geidea Subscription Update Callback] Generated subscription invoice ${serialNumber}`);
        }
        
        // Clean up pending update
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        
        // Redirect to dashboard with success
        return res.redirect(`${baseUrl}/dashboard?subscription_updated=true`);
      } catch (updateError: any) {
        console.error(`[Geidea Subscription Update Callback] Failed to update subscription:`, updateError);
        pendingSubscriptionUpdates.delete(merchantReferenceId);
        return res.redirect(`${baseUrl}/dashboard?error=update_failed`);
      }
    } catch (error: any) {
      console.error("[Geidea Subscription Update Callback] Error:", error);
      return res.redirect(`${baseUrl}/dashboard?error=callback_error`);
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
    
    // Get delivery profitability data
    const targetYear = Number(year) || new Date().getFullYear();
    const deliveryEntries = await storage.getDeliveryProfitability(restaurantId, targetYear);
    
    // Calculate delivery totals
    let deliveryTotalRevenue = 0;
    let deliveryTotalProfit = 0;
    let deliveryTotalOrders = 0;
    let deliveryTotalCosts = 0;
    
    for (const entry of deliveryEntries) {
      deliveryTotalRevenue += parseFloat(String(entry.sales || '0'));
      deliveryTotalProfit += parseFloat(String(entry.profit || entry.netEarnings || '0'));
      deliveryTotalOrders += parseInt(String(entry.orders || '0'));
      deliveryTotalCosts += parseFloat(String(entry.commission || '0'));
      deliveryTotalCosts += parseFloat(String(entry.banking || '0'));
      deliveryTotalCosts += parseFloat(String(entry.vat || '0'));
      deliveryTotalCosts += parseFloat(String(entry.posFees || '0'));
    }
    
    // Monthly delivery breakdown
    const deliveryMonthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthEntries = deliveryEntries.filter(e => e.month === monthNum);
      
      let revenue = 0;
      let profit = 0;
      
      for (const entry of monthEntries) {
        revenue += parseFloat(String(entry.sales || '0'));
        profit += parseFloat(String(entry.profit || entry.netEarnings || '0'));
      }
      
      return {
        month: new Date(targetYear, i, 1).toLocaleString('en-US', { month: 'short' }),
        revenue: revenue.toFixed(2),
        profit: profit.toFixed(2),
      };
    });
    
    res.json({
      monthly: monthlyData,
      yearly: {
        revenue: yearlyRevenue.toFixed(2),
        vat: yearlyVAT.toFixed(2),
        transactions: transactions.length,
        invoices: invoices.length,
      },
      delivery: {
        yearly: {
          revenue: deliveryTotalRevenue.toFixed(2),
          profit: deliveryTotalProfit.toFixed(2),
          costs: deliveryTotalCosts.toFixed(2),
          orders: deliveryTotalOrders,
        },
        monthly: deliveryMonthlyData,
      },
      combinedRevenue: (yearlyRevenue + deliveryTotalRevenue).toFixed(2),
    });
  });

  // Delivery App Financial Breakdown
  app.get("/api/analytics/delivery-breakdown", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      
      // Get all delivery apps and manual profitability entries
      const deliveryAppsData = await storage.getDeliveryApps(restaurantId);
      const manualEntries = await storage.getDeliveryProfitability(restaurantId, parseInt(year));
      
      // Aggregate manual entries by delivery app (sum all months for the year)
      const manualTotalsByApp = new Map<string, {
        orders: number;
        sales: number;
        revenue: number;
        commission: number;
        banking: number;
        subsidy: number;
        posFees: number;
        netEarnings: number;
      }>();
      
      manualEntries.forEach(entry => {
        const existing = manualTotalsByApp.get(entry.deliveryAppId) || {
          orders: 0, sales: 0, revenue: 0, commission: 0, banking: 0, subsidy: 0, posFees: 0, netEarnings: 0
        };
        manualTotalsByApp.set(entry.deliveryAppId, {
          orders: existing.orders + (entry.orders || 0),
          sales: existing.sales + parseFloat(entry.sales || "0"),
          revenue: existing.revenue + parseFloat(entry.revenue || "0"),
          commission: existing.commission + parseFloat(entry.commission || "0"),
          banking: existing.banking + parseFloat(entry.banking || "0"),
          subsidy: existing.subsidy + parseFloat(entry.subsidy || "0"),
          posFees: existing.posFees + parseFloat(entry.posFees || "0"),
          netEarnings: existing.netEarnings + parseFloat(entry.netEarnings || "0"),
        });
      });
      
      // Build breakdown using manual entries (primary source)
      const breakdown = deliveryAppsData.map(app => {
        const manualData = manualTotalsByApp.get(app.id);
        
        if (manualData) {
          // Use manual data
          return {
            id: app.id,
            name: app.name,
            orders: manualData.orders,
            sales: parseFloat(manualData.sales.toFixed(2)),
            revenue: parseFloat(manualData.revenue.toFixed(2)),
            commission: parseFloat(manualData.commission.toFixed(2)),
            banking: parseFloat(manualData.banking.toFixed(2)),
            subsidy: parseFloat(manualData.subsidy.toFixed(2)),
            posFees: parseFloat(manualData.posFees.toFixed(2)),
            netEarnings: parseFloat(manualData.netEarnings.toFixed(2)),
            commissionRate: parseFloat(app.commission),
            bankingRate: parseFloat(app.bankingFees),
            active: app.active,
            hasManualData: true,
          };
        }
        
        // No manual data - return zeroes
        return {
          id: app.id,
          name: app.name,
          orders: 0,
          sales: 0,
          revenue: 0,
          commission: 0,
          banking: 0,
          subsidy: 0,
          posFees: 0,
          netEarnings: 0,
          commissionRate: parseFloat(app.commission),
          bankingRate: parseFloat(app.bankingFees),
          active: app.active,
          hasManualData: false,
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

      // Create invoice record first to get the ID (B2C Simplified Invoice)
      const invoiceData = {
        restaurantId: req.session.user!.restaurantId!,
        invoiceNumber,
        invoiceType: "simplified" as const, // B2C - Simplified Tax Invoice
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

      // Now generate PDF with invoice ID for QR code (Simplified Invoice format)
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
        invoiceType: "simplified" as const, // B2C - Simplified Tax Invoice
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
      
      // Get menu items, recipes, inventory items, and orders
      const menuItems = await storage.getMenuItems(restaurantId);
      const recipes = await storage.getRecipes(restaurantId);
      const inventoryItems = await storage.getInventoryItems(restaurantId);
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
        // Apply portion size multiplier to recipe cost (1.0=full, 0.5=half, 0.25=quarter, 0.75=three-quarter)
        const portionMultiplier = item.portionSize ? parseFloat(item.portionSize) : 1.0;
        
        // Calculate cost: recipe-based OR simple inventory item
        let cost = 0;
        if (recipe) {
          // Recipe-based item: use recipe cost × portion multiplier
          cost = parseFloat(recipe.cost) * portionMultiplier;
        } else if (item.inventoryItemId) {
          // Simple inventory item (like drinks): stockNo × inventory unit price
          // Default stockNo to 1 if not set
          const stockNo = item.stockNo ? parseFloat(item.stockNo.toString()) : 1;
          if (stockNo > 0) {
            const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId);
            if (inventoryItem) {
              // Use unitPrice directly (already calculated) or calculate from price/referenceQuantity
              let unitPrice = 0;
              if (inventoryItem.unitPrice) {
                unitPrice = parseFloat(inventoryItem.unitPrice.toString());
              } else if (inventoryItem.price) {
                const invPrice = parseFloat(inventoryItem.price.toString());
                const refQty = parseFloat((inventoryItem.referenceQuantity || "1").toString());
                unitPrice = refQty > 0 ? invPrice / refQty : invPrice;
              }
              cost = stockNo * unitPrice;
            }
          }
        }
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
      
      // Calculate inventory value - sum of all Total Prices (price field represents total cost of current stock)
      const inventoryValue = inventory.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price;
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
      // Note: paymentPeriod can be 'one-time' or 'oneTime' depending on when data was created
      const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
        const monthBills = yearBills.filter(b => {
          const paymentDate = new Date(b.paymentDate);
          return paymentDate.getMonth() === i && 
                 b.paymentPeriod !== 'one-time' && 
                 b.paymentPeriod !== 'oneTime' && 
                 b.billType !== 'foundational';
        });
        const amount = monthBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        return {
          month: new Date(parseInt(year), i).toLocaleString('default', { month: 'long' }),
          amount
        };
      });
      
      // Get BEP data from the centralized calculation (uses correct COGS from recipes)
      const bepData = await storage.getBepMetrics(restaurantId, parseInt(year));
      
      console.log('[PDF Export] BEP data from getBepMetrics:', {
        fixedCosts: bepData.fixedCosts,
        cogsTotal: bepData.cogsTotal,
        avgVariableCostPerUnit: bepData.avgVariableCostPerUnit,
        unitsSold: bepData.unitsSold,
        revenue: bepData.revenue
      });
      
      // Extract values from BEP data
      const totalRevenue = bepData.revenue;
      const unitsSold = bepData.unitsSold;
      const fixedCosts = bepData.fixedCosts;
      const variableCostsPerUnit = bepData.avgVariableCostPerUnit;
      const sellingPricePerUnit = bepData.avgSellingPrice;
      const contributionMarginPerUnit = bepData.contributionMarginPerUnit;
      const contributionMarginTotal = bepData.contributionMarginRatio * totalRevenue;
      const breakEvenUnits = bepData.bepUnits;
      const breakEvenRevenue = bepData.bepRevenue;
      const marginOfSafety = bepData.marginOfSafety;
      const isProfitable = bepData.isProfitable;
      
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
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Expenses PDF export error:", error);
      res.status(500).json({ error: "Failed to export expenses report" });
    }
  });

  // Export Income Statement PDF
  app.get("/api/export/income-statement-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const settings = await storage.getSettings(restaurantId);
      const bills = await storage.getShopBills(restaurantId);
      const bepData = await storage.getBepMetrics(restaurantId, parseInt(year));

      const totalRevenue = bepData.revenue;
      const cogs = bepData.cogsTotal;
      const grossProfit = totalRevenue - cogs;

      const yearBills = bills.filter(b => new Date(b.paymentDate).getFullYear() === parseInt(year));
      const operatingExpenses = yearBills
        .filter(b => b.billType !== 'foundational')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const operatingIncome = grossProfit - operatingExpenses;
      const netIncome = operatingIncome;

      const categoryMap = new Map<string, number>();
      yearBills.filter(b => b.billType !== 'foundational').forEach(b => {
        const cat = b.billType || 'other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + parseFloat(b.amount));
      });
      const expensesByCategory = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const { generateIncomeStatementPDF } = await import('./invoice.js');
      const pdfBuffer = await generateIncomeStatementPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        revenue: totalRevenue,
        cogs,
        grossProfit,
        operatingExpenses,
        operatingIncome,
        netIncome,
        expensesByCategory,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=income-statement-${year}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Income Statement PDF export error:", error);
      res.status(500).json({ error: "Failed to export income statement" });
    }
  });

  // Export Balance Sheet PDF
  app.get("/api/export/balance-sheet-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const settings = await storage.getSettings(restaurantId);
      const bills = await storage.getShopBills(restaurantId);
      const inventory = await storage.getInventoryItems(restaurantId);
      const bepData = await storage.getBepMetrics(restaurantId, parseInt(year));

      const totalRevenue = bepData.revenue;
      const cogs = bepData.cogsTotal;
      const grossProfit = totalRevenue - cogs;

      const yearBills = bills.filter(b => new Date(b.paymentDate).getFullYear() === parseInt(year));
      const operatingExpenses = yearBills
        .filter(b => b.billType !== 'foundational')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const netIncome = grossProfit - operatingExpenses;

      const inventoryValue = inventory.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const totalAssets = totalRevenue + inventoryValue;
      const vatPayable = totalRevenue * 0.15;
      const pendingBillsAmount = yearBills
        .filter(b => b.status !== 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const totalLiabilities = vatPayable + pendingBillsAmount;
      const ownersEquity = totalAssets - totalLiabilities;

      const { generateBalanceSheetPDF } = await import('./invoice.js');
      const pdfBuffer = await generateBalanceSheetPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        cashAndRevenue: totalRevenue,
        inventoryValue,
        totalAssets,
        vatPayable,
        accountsPayable: pendingBillsAmount,
        totalLiabilities,
        ownersEquity,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=balance-sheet-${year}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Balance Sheet PDF export error:", error);
      res.status(500).json({ error: "Failed to export balance sheet" });
    }
  });

  // Export Cash Flow Statement PDF
  app.get("/api/export/cash-flow-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const settings = await storage.getSettings(restaurantId);
      const bills = await storage.getShopBills(restaurantId);
      const inventory = await storage.getInventoryItems(restaurantId);
      const bepData = await storage.getBepMetrics(restaurantId, parseInt(year));

      const totalRevenue = bepData.revenue;
      const cogs = bepData.cogsTotal;
      const grossProfit = totalRevenue - cogs;

      const yearBills = bills.filter(b => new Date(b.paymentDate).getFullYear() === parseInt(year));
      const operatingExpenses = yearBills
        .filter(b => b.billType !== 'foundational')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const netIncome = grossProfit - operatingExpenses;

      const inventoryValue = inventory.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const pendingBillsAmount = yearBills
        .filter(b => b.status !== 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);

      const cashFromOperations = netIncome + inventoryValue - pendingBillsAmount;
      const cashFromInvesting = -inventoryValue;
      const netCashFlow = cashFromOperations + cashFromInvesting;

      const { generateCashFlowPDF } = await import('./invoice.js');
      const pdfBuffer = await generateCashFlowPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        netIncome,
        inventoryAdjustments: inventoryValue,
        accountsPayableChange: pendingBillsAmount,
        cashFromOperations,
        inventoryPurchases: cashFromInvesting,
        cashFromInvesting,
        netCashFlow,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cash-flow-${year}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Cash Flow PDF export error:", error);
      res.status(500).json({ error: "Failed to export cash flow statement" });
    }
  });

  // Export Owner's Equity Statement PDF
  app.get("/api/export/equity-statement-pdf", requireAuth, requireRestaurant, requirePermission('reports'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const year = req.query.year as string || new Date().getFullYear().toString();
      const settings = await storage.getSettings(restaurantId);
      const bills = await storage.getShopBills(restaurantId);
      const bepData = await storage.getBepMetrics(restaurantId, parseInt(year));

      const totalRevenue = bepData.revenue;
      const cogs = bepData.cogsTotal;
      const grossProfit = totalRevenue - cogs;

      const yearBills = bills.filter(b => new Date(b.paymentDate).getFullYear() === parseInt(year));
      const operatingExpenses = yearBills
        .filter(b => b.billType !== 'foundational')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const netIncome = grossProfit - operatingExpenses;

      const beginningEquity = 0;
      const ownerInvestments = 0;
      const ownerWithdrawals = 0;
      const endingEquity = beginningEquity + netIncome + ownerInvestments - ownerWithdrawals;

      const { generateEquityStatementPDF } = await import('./invoice.js');
      const pdfBuffer = await generateEquityStatementPDF({
        companyName: settings?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings?.vatNumber || "",
        year,
        beginningEquity,
        netIncome,
        ownerInvestments,
        ownerWithdrawals,
        endingEquity,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=equity-statement-${year}.pdf`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Equity Statement PDF export error:", error);
      res.status(500).json({ error: "Failed to export equity statement" });
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
      
      // If pdfPath exists, try to serve the file
      if (invoice.pdfPath) {
        const relativePath = invoice.pdfPath.replace(/^\/+/, '');
        const filePath = path.normalize(path.join(process.cwd(), 'public', relativePath));
        
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
          return res.sendFile(filePath);
        }
        console.log('[Invoice Download] PDF not on disk, regenerating:', filePath);
      }
      
      // PDF doesn't exist - regenerate it on-demand
      const settings = await storage.getSettings(restaurantId);
      const order = invoice.orderId ? await storage.getOrder(invoice.orderId, restaurantId) : null;
      const branch = invoice.branchId ? await storage.getBranch(invoice.branchId, restaurantId) : null;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Build PDF data from invoice record
      const pdfData = {
        order: order || {
          orderNumber: invoice.invoiceNumber,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.vatAmount,
          total: invoice.total,
          customerName: invoice.customerName || "Customer",
          createdAt: invoice.createdAt,
        } as any,
        companyName: settings?.restaurantName || "Restaurant Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location",
        companyEmail: settings?.email || "",
        companyPhone: settings?.phone || "",
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date(invoice.createdAt),
        invoiceId: invoice.id,
        baseUrl,
        logoPath: settings?.logoPath || undefined,
        invoiceType: invoice.invoiceType as "simplified" | "standard",
        customerVatNumber: invoice.customerVatNumber || undefined,
      };
      
      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);
      
      // Save regenerated PDF to filesystem
      const invoicesDir = path.join(process.cwd(), "public", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      const pdfFilename = `${invoice.invoiceNumber}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);
      
      // Update invoice record with new PDF path
      await storage.updateInvoice(invoice.id, restaurantId, {
        qrCode: qrCode || invoice.qrCode,
        pdfPath: `/invoices/${pdfFilename}`,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });

  // Download individual invoice XML (ZATCA-compliant UBL 2.1 format)
  app.get("/api/invoices/:id/download-xml", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const invoice = await storage.getInvoice(req.params.id, restaurantId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Get restaurant settings for seller info
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // Import the XML generator
      const { generateUnsignedInvoiceXml } = await import("./zatca/xml-generator");
      
      // Parse invoice date
      const invoiceDate = new Date(invoice.createdAt);
      const issueDate = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const issueTime = invoiceDate.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
      
      // Map invoice items to ZATCA format
      const items = (invoice.items as Array<{ name: string; quantity: number; basePrice: number; vatAmount: number; total: number }>).map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.basePrice / item.quantity,
        totalAmount: item.total,
        taxCategory: "S" as const,
        taxPercent: 15,
      }));
      
      // Generate UUID for invoice (use invoice ID)
      const uuid = invoice.id;
      
      // Build ZATCA invoice data
      const zatcaData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: "simplified" as const,
        invoiceSubType: "01" as const,
        paymentMethod: "cash" as const,
        subtotal: parseFloat(invoice.subtotal),
        vatAmount: parseFloat(invoice.vatAmount),
        total: parseFloat(invoice.total),
        discount: 0,
        items,
        invoiceCounter: 1,
        previousInvoiceHash: null,
        uuid,
        issueDate,
        issueTime,
        sellerInfo: {
          name: restaurant.name,
          vatNumber: restaurant.taxNumber || "300000000000003",
          streetName: "Street Name",
          buildingNumber: "1234",
          citySubdivision: "District",
          city: "Riyadh",
          postalZone: "12345",
          countryCode: "SA",
          crNumber: restaurant.commercialRegistration || "0000000000",
        },
        buyerInfo: invoice.customerName ? {
          name: invoice.customerName,
        } : undefined,
      };
      
      // Generate XML
      const xml = generateUnsignedInvoiceXml(zatcaData);
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.xml`);
      res.send(xml);
    } catch (error) {
      console.error("Invoice XML download error:", error);
      res.status(500).json({ error: "Failed to generate invoice XML" });
    }
  });

  // Create Credit or Debit Note against an existing B2B invoice
  // Allows both restaurant accounts (for their own invoices) and IT accounts (for any client invoice)
  app.post("/api/invoices/:id/adjustment-note", requireAuth, async (req, res) => {
    try {
      const sessionRestaurantId = req.session.user?.restaurantId;
      const isITAccount = !sessionRestaurantId;
      const originalInvoiceId = req.params.id;
      const { noteType, reason, items: adjustmentItems } = req.body;
      
      // Validate note type
      if (!noteType || !['credit_note', 'debit_note'].includes(noteType)) {
        return res.status(400).json({ error: "noteType must be 'credit_note' or 'debit_note'" });
      }
      
      // Validate reason
      if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        return res.status(400).json({ error: "A valid reason is required for the adjustment note (at least 3 characters)" });
      }
      
      if (reason.trim().length > 500) {
        return res.status(400).json({ error: "Reason is too long (max 500 characters)" });
      }
      
      // For IT accounts, we need to get the invoice without a restaurantId filter
      // For restaurant accounts, filter by their restaurantId for security
      let originalInvoice;
      if (isITAccount) {
        // IT account: get invoice from any restaurant using public lookup
        originalInvoice = await storage.getInvoicePublic(originalInvoiceId);
      } else {
        // Restaurant account: only their own invoices
        originalInvoice = await storage.getInvoice(originalInvoiceId, sessionRestaurantId);
      }
      
      if (!originalInvoice) {
        return res.status(404).json({ error: "Original invoice not found" });
      }
      
      // Get the restaurantId from the invoice itself
      const restaurantId = originalInvoice.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ error: "Invoice does not have a valid restaurant" });
      }
      
      // Only allow adjustment notes for B2B (standard) invoices
      if (originalInvoice.invoiceType !== 'standard') {
        return res.status(400).json({ error: "Adjustment notes can only be created for B2B (standard) invoices" });
      }
      
      // Prevent creating adjustment notes against other adjustment notes
      const originalDocType = (originalInvoice as any).documentType;
      if (originalDocType === 'credit_note' || originalDocType === 'debit_note') {
        return res.status(400).json({ error: "Cannot create adjustment notes against other credit or debit notes" });
      }
      
      // Reject partial adjustments - only full invoice reversal is supported for ZATCA compliance
      if (adjustmentItems && Array.isArray(adjustmentItems) && adjustmentItems.length > 0) {
        return res.status(400).json({ error: "Partial adjustments are not currently supported. Credit/debit notes must be for the full invoice amount." });
      }
      
      // Parse original invoice items with defensive checks
      const originalItems = originalInvoice.items as Array<{ name: string; quantity: number; basePrice: number; vatAmount: number; total: number }>;
      if (!Array.isArray(originalItems) || originalItems.length === 0) {
        return res.status(400).json({ error: "Original invoice has no valid items" });
      }
      
      // Helper function for precise 2-decimal rounding
      const toTwoDecimals = (num: number): number => Math.round(num * 100) / 100;
      
      // Full reversal - use original invoice items and their exact VAT values with 2-decimal precision
      const noteItems = originalItems.map(item => {
        const basePrice = toTwoDecimals(typeof item.basePrice === 'number' ? item.basePrice : parseFloat(String(item.basePrice)) || 0);
        const vatAmount = toTwoDecimals(typeof item.vatAmount === 'number' ? item.vatAmount : parseFloat(String(item.vatAmount)) || 0);
        const total = toTwoDecimals(typeof item.total === 'number' ? item.total : parseFloat(String(item.total)) || 0);
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 1;
        const name = String(item.name || 'Item');
        
        return { name, quantity, basePrice, vatAmount, total };
      });
      
      // Use original invoice totals with 2-decimal precision for ZATCA compliance
      const adjustmentSubtotal = toTwoDecimals(parseFloat(originalInvoice.subtotal) || 0);
      const adjustmentVatAmount = toTwoDecimals(parseFloat(originalInvoice.vatAmount) || 0);
      const adjustmentTotal = toTwoDecimals(parseFloat(originalInvoice.total) || 0);
      
      // Verify items sum to match invoice totals (reconciliation guard)
      const itemsSubtotal = toTwoDecimals(noteItems.reduce((sum, item) => sum + item.basePrice, 0));
      const itemsVatAmount = toTwoDecimals(noteItems.reduce((sum, item) => sum + item.vatAmount, 0));
      const itemsTotal = toTwoDecimals(noteItems.reduce((sum, item) => sum + item.total, 0));
      
      // Allow small tolerance for rounding differences (1 SAR)
      const tolerance = 1.0;
      if (Math.abs(itemsSubtotal - adjustmentSubtotal) > tolerance ||
          Math.abs(itemsVatAmount - adjustmentVatAmount) > tolerance ||
          Math.abs(itemsTotal - adjustmentTotal) > tolerance) {
        console.error(`[Adjustment Note] Reconciliation failed: Items (${itemsSubtotal}/${itemsVatAmount}/${itemsTotal}) vs Invoice (${adjustmentSubtotal}/${adjustmentVatAmount}/${adjustmentTotal})`);
        return res.status(422).json({ 
          error: "Invoice data reconciliation failed - line item totals do not match invoice totals. Please contact support.",
          details: { itemsSubtotal, itemsVatAmount, itemsTotal, invoiceSubtotal: adjustmentSubtotal, invoiceVatAmount: adjustmentVatAmount, invoiceTotal: adjustmentTotal }
        });
      }
      
      // Generate unique note number
      const settings = await storage.getSettings(restaurantId);
      const notePrefix = noteType === 'credit_note' ? 'CN' : 'DN';
      const noteSequence = (settings?.b2bInvoiceSequence || 1) + 1;
      const noteNumber = `${notePrefix}-${new Date().getFullYear()}-${noteSequence.toString().padStart(6, '0')}`;
      
      // Update the B2B sequence
      if (settings) {
        await storage.updateSettings(restaurantId, { b2bInvoiceSequence: noteSequence } as any);
      }
      
      // Create the adjustment note
      const newNote = await storage.createInvoice({
        restaurantId,
        invoiceNumber: noteNumber,
        invoiceType: 'standard', // Same as original (B2B)
        documentType: noteType,
        referencedInvoiceId: originalInvoiceId,
        adjustmentReason: reason.trim(),
        transactionId: null,
        orderId: originalInvoice.orderId || null,
        procurementId: originalInvoice.procurementId || null,
        branchId: originalInvoice.branchId || null,
        customerName: originalInvoice.customerName,
        customerVatNumber: originalInvoice.customerVatNumber,
        items: noteItems,
        subtotal: adjustmentSubtotal.toFixed(2),
        vatAmount: adjustmentVatAmount.toFixed(2),
        total: adjustmentTotal.toFixed(2),
        qrCode: null,
        pdfPath: null,
      } as any);
      
      // Generate PDF for the note
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const restaurant = await storage.getRestaurant(restaurantId);
      const branch = originalInvoice.branchId ? await storage.getBranch(originalInvoice.branchId, restaurantId) : null;
      
      const pdfData = {
        order: {
          orderNumber: noteNumber,
          items: noteItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.basePrice / item.quantity })),
          subtotal: adjustmentSubtotal.toString(),
          tax: adjustmentVatAmount.toString(),
          total: adjustmentTotal.toString(),
          customerName: originalInvoice.customerName || "Customer",
          orderType: noteType === 'credit_note' ? 'Credit Note' : 'Debit Note',
          createdAt: new Date(),
        } as any,
        companyName: restaurant?.name || settings?.restaurantName || "Restaurant",
        companyVAT: restaurant?.taxNumber || settings?.vatNumber || "300000000000003",
        branchAddress: branch?.location || settings?.address || "Main Location",
        companyEmail: settings?.email || "",
        companyPhone: settings?.phone || "",
        invoiceNumber: noteNumber,
        invoiceDate: new Date(),
        invoiceId: newNote.id,
        baseUrl,
        logoPath: settings?.logoPath || undefined,
        invoiceType: 'standard' as const,
        customerVatNumber: originalInvoice.customerVatNumber || undefined,
        documentType: noteType as 'credit_note' | 'debit_note',
        referencedInvoiceNumber: originalInvoice.invoiceNumber,
        adjustmentReason: reason.trim(),
      };
      
      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);
      
      // Save PDF to disk
      const invoicesDir = path.join(process.cwd(), "public", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      const pdfFilename = `${noteNumber.replace(/\//g, '-')}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);
      
      // Update invoice record with PDF path and QR code
      await storage.updateInvoice(newNote.id, restaurantId, {
        qrCode: qrCode,
        pdfPath: `/invoices/${pdfFilename}`,
      });
      
      res.json({
        success: true,
        note: {
          ...newNote,
          pdfPath: `/invoices/${pdfFilename}`,
          qrCode,
        },
        message: noteType === 'credit_note' 
          ? `Credit note ${noteNumber} created successfully`
          : `Debit note ${noteNumber} created successfully`,
      });
    } catch (error) {
      console.error("Adjustment note creation error:", error);
      res.status(500).json({ error: "Failed to create adjustment note" });
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

  // Configure multer for procurement invoice image uploads (disk storage)
  const procurementInvoiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'procurement-invoices');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'procurement-' + uniqueSuffix + ext);
    }
  });

  const uploadProcurementInvoice = multer({
    storage: procurementInvoiceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

  // Upload procurement invoice image
  app.post("/api/procurement/upload-invoice", requireAuth, requireRestaurant, requireAction('procurement', 'add'), uploadProcurementInvoice.single('invoiceImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const imageUrl = `/api/procurement/invoices/${req.file.filename}`;
      res.json({ imageUrl, originalName: req.file.originalname });
    } catch (error) {
      console.error("Procurement invoice upload error:", error);
      res.status(500).json({ error: "Failed to upload invoice image" });
    }
  });

  // Authenticated endpoint to view/download procurement invoice images
  // SECURITY: Requires authentication and procurement view permission
  // Files can only be uploaded by users with procurement add permission, so access is implicitly controlled
  app.get('/api/procurement/invoices/:filename', requireAuth, requireRestaurant, requireAction('procurement', 'view'), async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Validate filename format to prevent path traversal
      if (!/^procurement-[\w-]+\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename format' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'procurement-invoices', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Invoice image not found' });
      }
      
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
      console.error('Procurement invoice download error:', error);
      res.status(500).json({ error: 'Failed to download invoice image' });
    }
  });

  // Download procurement invoice by procurement ID (authenticated, with proper Content-Disposition)
  // This endpoint resolves the stored invoice URL and serves the file as an attachment
  app.get('/api/procurement/:id/download-invoice', requireAuth, requireRestaurant, requireAction('procurement', 'view'), async (req, res) => {
    try {
      const procurementId = req.params.id;
      const restaurantId = req.session.user?.restaurantId;
      
      // Get the procurement record
      const procurementRecord = await db.select().from(procurement).where(
        sql`${procurement.id} = ${procurementId} AND ${procurement.restaurantId} = ${restaurantId}`
      ).limit(1);
      
      if (!procurementRecord || procurementRecord.length === 0) {
        return res.status(404).json({ error: 'Procurement record not found' });
      }
      
      const record = procurementRecord[0];
      
      if (!record.invoiceImage) {
        return res.status(404).json({ error: 'No invoice attached to this procurement' });
      }
      
      // Extract filename from stored URL (handles /api/procurement/invoices/filename or /uploads/procurement-invoices/filename)
      let filename: string | null = null;
      const apiMatch = record.invoiceImage.match(/\/api\/procurement\/invoices\/([^?]+)/);
      const uploadMatch = record.invoiceImage.match(/\/uploads\/procurement-invoices\/([^?]+)/);
      
      if (apiMatch) {
        filename = apiMatch[1];
      } else if (uploadMatch) {
        filename = uploadMatch[1];
      } else {
        // Try to extract last path segment
        filename = record.invoiceImage.split('/').pop()?.split('?')[0] || null;
      }
      
      if (!filename || !/^procurement-[\w-]+\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return res.status(400).json({ error: 'Invalid invoice file format' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'procurement-invoices', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Invoice file not found on server' });
      }
      
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      
      // Create user-friendly download filename
      const sanitizedTitle = record.title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '_').slice(0, 50);
      const downloadFilename = `invoice_${sanitizedTitle || 'procurement'}${ext}`;
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(filePath);
    } catch (error) {
      console.error('Procurement invoice download by ID error:', error);
      res.status(500).json({ error: 'Failed to download invoice' });
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
  // Use ?download=true query param to force download instead of inline display
  app.get('/api/it/bill-invoices/:filename', requireAuth, requireITAccount, async (req, res) => {
    try {
      const filename = req.params.filename;
      const forceDownload = req.query.download === 'true';
      
      // Validate filename format to prevent path traversal
      if (!/^bill-[\w-]+\.pdf$/i.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename format' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'bill-invoices', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Bill invoice file not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      // Use attachment for download, inline for viewing in browser
      const disposition = forceDownload ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
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
            displaySize: "medium",
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

  // Geidea Payment Gateway
  app.post("/api/geidea/create-session", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { orderId, amount, description, customerEmail, customerName, customerPhone, branchId, language, cardOnFile } = req.body;
      
      // SECURITY: For POS payments with orderId, validate order ownership and use server-side amount
      let validatedAmount: number;
      let validatedDescription: string;
      let validatedBranchId: string | null = branchId || null;
      
      if (orderId && orderId.startsWith('ORD-')) {
        // This is a POS order - for now use client amount since order isn't created yet in DB
        // The POS creates order AFTER payment succeeds, so we can't validate against existing order
        // We rely on the order total being calculated server-side when order is created
        if (!amount || parseFloat(amount) <= 0) {
          return res.status(400).json({ error: "Invalid amount" });
        }
        validatedAmount = parseFloat(amount);
        validatedDescription = description || `Order ${orderId}`;
      } else if (orderId) {
        // Subscription or other order type - validate against existing record if needed
        // For now, use provided amount with basic validation
        if (!amount || parseFloat(amount) <= 0) {
          return res.status(400).json({ error: "Invalid amount" });
        }
        validatedAmount = parseFloat(amount);
        validatedDescription = description || 'Payment';
      } else {
        // Generic payment without order
        if (!amount || parseFloat(amount) <= 0) {
          return res.status(400).json({ error: "Invalid amount" });
        }
        validatedAmount = parseFloat(amount);
        validatedDescription = description || 'Payment';
      }

      const { createPaymentSession } = await import('./geidea');
      
      const merchantReferenceId = orderId || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use HTTPS for callback URL in production
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
      const callbackUrl = `${protocol}://${req.get('host')}/api/geidea/callback`;

      const sessionResponse = await createPaymentSession({
        amount: validatedAmount,
        merchantReferenceId,
        callbackUrl,
        customerEmail,
        language: language || 'en',
        cardOnFile: cardOnFile || false,
        initiatedBy: 'Internet',
      });

      // Save payment record to database (reusing moyasarPayments table for now)
      const geideaPayment = await storage.createMoyasarPayment({
        restaurantId,
        moyasarId: sessionResponse.session.id,
        orderId: orderId || null,
        transactionId: null,
        amount: validatedAmount.toFixed(2),
        amountHalalas: Math.round(validatedAmount * 100),
        currency: 'SAR',
        status: 'initiated',
        paymentMethod: 'geidea',
        cardBrand: null,
        cardLast4: null,
        fee: null,
        refundedAmount: "0",
        description: validatedDescription,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        callbackUrl,
        metadata: { merchantReferenceId, gateway: 'geidea', restaurantId } as Record<string, any>,
        errorMessage: null,
        branchId: validatedBranchId,
      });

      // Extract redirect URL from Geidea response (may be in different locations)
      const redirectUrl = sessionResponse.session.paymentUrl || 
                          sessionResponse.session.paymentIntent?.redirectUrl || 
                          null;
      
      res.json({
        success: true,
        sessionId: sessionResponse.session.id,
        redirectUrl,
        paymentId: geideaPayment.id,
        payment: geideaPayment,
      });
    } catch (error: any) {
      console.error("[Geidea] Session creation error:", error);
      res.status(500).json({ 
        error: "Payment session creation failed",
        message: error.message,
      });
    }
  });

  app.post("/api/geidea/callback", async (req, res) => {
    try {
      const { order } = req.body;
      
      if (!order) {
        console.warn('[Geidea Webhook] Missing order in callback');
        return res.status(400).json({ error: 'Missing order data' });
      }

      const { orderId: geideaOrderId, status, detailedStatus, merchantReferenceId, amount, currency } = order;
      
      console.log(`[Geidea Webhook] Received callback for order ${geideaOrderId}, status: ${status}`);

      // Find payment by session ID (stored as moyasarId)
      let payment = await storage.getMoyasarPaymentByMoyasarIdAnyTenant(geideaOrderId);
      
      if (!payment) {
        console.warn(`[Geidea Webhook] Payment not found for order: ${geideaOrderId}`);
        return res.status(404).json({ error: "Payment not found" });
      }

      // SECURITY: Verify merchantReferenceId matches our stored record to prevent tampering
      const storedMetadata = payment.metadata as { merchantReferenceId?: string; gateway?: string; restaurantId?: string } | null;
      if (storedMetadata?.merchantReferenceId && merchantReferenceId !== storedMetadata.merchantReferenceId) {
        console.warn(`[Geidea Webhook] Merchant reference mismatch! Expected: ${storedMetadata.merchantReferenceId}, Got: ${merchantReferenceId}`);
        return res.status(403).json({ error: "Invalid merchant reference" });
      }

      // IDEMPOTENCY: Skip if already in terminal state
      if (payment.status === 'paid' || payment.status === 'failed') {
        console.log(`[Geidea Webhook] Payment ${geideaOrderId} already in terminal state: ${payment.status}`);
        const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : req.protocol) + '://' + req.get('host');
        if (payment.status === 'paid') {
          return res.redirect(`${baseUrl}/payment-success?orderId=${payment.orderId || ''}&paymentId=${payment.id}`);
        } else {
          return res.redirect(`${baseUrl}/payment-failed?orderId=${payment.orderId || ''}&reason=already_processed`);
        }
      }

      // Map Geidea status to internal status
      const { isPaymentSuccessful, isPaymentFailed, extractTokenFromOrder } = await import('./geidea');
      let internalStatus = status.toLowerCase();
      if (isPaymentSuccessful(status)) {
        internalStatus = 'paid';
      } else if (isPaymentFailed(status)) {
        internalStatus = 'failed';
      }

      // Get card details from transactions if available
      let cardBrand = null;
      let cardLast4 = null;
      let tokenId = null;
      if (order.transactions && order.transactions.length > 0) {
        const lastTx = order.transactions[order.transactions.length - 1];
        if (lastTx.paymentMethod) {
          cardBrand = lastTx.paymentMethod.brand || null;
          cardLast4 = lastTx.paymentMethod.maskedCardNumber ? 
            lastTx.paymentMethod.maskedCardNumber.slice(-4) : null;
        }
      }

      // Extract token from order for recurring payments (cardOnFile)
      tokenId = extractTokenFromOrder(order);
      if (tokenId) {
        console.log(`[Geidea Webhook] Extracted token for recurring payments: ${tokenId}`);
      }

      // Build updated metadata with tokenId if extracted
      const updatedMetadata = {
        ...(storedMetadata || {}),
        ...(tokenId ? { tokenId } : {}),
      } as Record<string, any>;

      // Update payment in database
      await storage.updateMoyasarPayment(payment.id, payment.restaurantId, {
        status: internalStatus,
        cardBrand,
        cardLast4,
        paymentMethod: 'geidea-card',
        metadata: updatedMetadata,
      });

      // If payment is successful and linked to an order, update order status
      if (internalStatus === 'paid' && payment.orderId) {
        await storage.updateOrder(payment.orderId, payment.restaurantId, {
          status: 'paid',
          paymentMethod: 'Geidea - ' + (cardBrand || 'Card'),
        });
      }

      console.log(`[Geidea Webhook] Payment ${geideaOrderId} updated to ${internalStatus} (restaurant: ${payment.restaurantId})`);
      
      // Redirect to success or failure page
      const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : req.protocol) + '://' + req.get('host');
      if (internalStatus === 'paid') {
        res.redirect(`${baseUrl}/payment-success?orderId=${payment.orderId || ''}&paymentId=${payment.id}`);
      } else {
        res.redirect(`${baseUrl}/payment-failed?orderId=${payment.orderId || ''}&reason=${encodeURIComponent(detailedStatus || status)}`);
      }
    } catch (error: any) {
      console.error("[Geidea Callback] Error:", error);
      res.status(500).json({ 
        error: "Callback processing failed",
        message: error.message,
      });
    }
  });

  // Geidea GET redirect for signup payments - user is redirected here after payment
  app.get("/api/geidea/signup-callback", async (req, res) => {
    const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : req.protocol) + '://' + req.get('host');
    
    try {
      // Geidea redirects with orderId in query params after payment
      const { orderId } = req.query;
      
      console.log(`[Geidea Signup GET] Received redirect with orderId: ${orderId}`);
      console.log(`[Geidea Signup GET] Full query params:`, req.query);
      
      if (!orderId || typeof orderId !== 'string') {
        console.warn('[Geidea Signup GET] Missing orderId in redirect');
        return res.redirect(`${baseUrl}/signup?error=missing_order`);
      }
      
      // Get order details from Geidea API
      const { getOrderDetails, isPaymentSuccessful, isPaymentFailed, extractTokenFromOrder } = await import('./geidea');
      
      let orderDetails: any;
      try {
        console.log(`[Geidea Signup GET] Fetching order details for: ${orderId}`);
        orderDetails = await getOrderDetails(orderId);
        console.log(`[Geidea Signup GET] Order details:`, JSON.stringify(orderDetails, null, 2));
      } catch (err: any) {
        console.error(`[Geidea Signup GET] Failed to get order details:`, err);
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      if (!orderDetails?.order) {
        console.error('[Geidea Signup GET] Invalid order response');
        return res.redirect(`${baseUrl}/signup?error=invalid_order`);
      }
      
      const { sessionId, status, merchantReferenceId, totalAmount, currency } = orderDetails.order;
      
      console.log(`[Geidea Signup GET] Order status: ${status}, sessionId: ${sessionId}, merchantRef: ${merchantReferenceId}`);
      
      // Find pending signup by session ID
      const pendingSignup = await storage.getPendingSignupBySessionId(sessionId);
      
      if (!pendingSignup) {
        console.warn(`[Geidea Signup GET] Pending signup not found for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/signup?error=signup_not_found`);
      }
      
      // Check if already processed (idempotency)
      if (pendingSignup.status === 'paid') {
        console.log(`[Geidea Signup GET] Signup already completed for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/login?signup=success`);
      }
      
      if (pendingSignup.status === 'failed') {
        console.log(`[Geidea Signup GET] Signup already failed for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/signup?error=payment_failed`);
      }
      
      // Helper to cleanup uploaded files on failure
      const cleanupUploadedFiles = async () => {
        const fs = await import('fs').then(m => m.promises);
        const uploadedFiles = pendingSignup.uploadedFiles as Record<string, { filename: string }> | null;
        if (uploadedFiles) {
          for (const [key, file] of Object.entries(uploadedFiles)) {
            try {
              await fs.unlink(`uploads/${file.filename}`);
              console.log(`[Geidea Signup GET] Cleaned up file: uploads/${file.filename}`);
            } catch (cleanupErr) {
              console.warn(`[Geidea Signup GET] Could not cleanup file: uploads/${file.filename}`);
            }
          }
        }
      };
      
      // SECURITY: Validate merchantReferenceId matches (prevent cross-order replay attacks)
      if (merchantReferenceId && merchantReferenceId !== pendingSignup.merchantReferenceId) {
        console.error(`[Geidea Signup GET] SECURITY: Merchant Reference mismatch! Expected: ${pendingSignup.merchantReferenceId}, Got: ${merchantReferenceId}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // SECURITY: Validate currency is SAR
      if (currency && currency !== 'SAR') {
        console.error(`[Geidea Signup GET] SECURITY: Currency mismatch! Expected: SAR, Got: ${currency}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // SECURITY: Validate amount matches (with rounding tolerance)
      const expectedAmount = parseFloat(pendingSignup.amount);
      if (totalAmount) {
        const amountDiff = Math.abs(totalAmount - expectedAmount);
        if (amountDiff > 0.01) {
          console.error(`[Geidea Signup GET] SECURITY: Amount mismatch! Expected: ${expectedAmount}, Got: ${totalAmount}`);
          await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
          await cleanupUploadedFiles();
          return res.redirect(`${baseUrl}/signup?error=amount_mismatch`);
        }
      }
      
      // Check if payment failed
      if (isPaymentFailed(status)) {
        console.log(`[Geidea Signup GET] Payment failed with status: ${status}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=payment_failed`);
      }
      
      // Check if payment is not yet successful
      if (!isPaymentSuccessful(status)) {
        console.log(`[Geidea Signup GET] Payment not yet successful, status: ${status}`);
        return res.redirect(`${baseUrl}/signup?error=payment_pending`);
      }
      
      // SECURITY: Mark as processing to prevent race conditions (double processing)
      // If another request has already started processing, status will not be 'pending'
      if (pendingSignup.status !== 'pending') {
        console.log(`[Geidea Signup GET] Already being processed, status: ${pendingSignup.status}`);
        if (pendingSignup.status === 'paid') {
          return res.redirect(`${baseUrl}/login?signup=success`);
        }
        return res.redirect(`${baseUrl}/signup?error=already_processing`);
      }
      
      // Payment is successful and verified - create the account
      console.log(`[Geidea Signup GET] Payment verified successful with all security checks passed, creating account...`);
      
      // Extract token if available
      const tokenId = extractTokenFromOrder(orderDetails.order);
      if (tokenId) {
        console.log(`[Geidea Signup GET] Extracted token: ${tokenId}`);
      }
      
      try {
        // Step 1: Create restaurant
        const restaurantData = insertRestaurantSchema.parse({
          name: pendingSignup.restaurantName,
          nationalId: pendingSignup.nationalId,
          hasVatRegistration: pendingSignup.hasVatRegistration,
          taxNumber: pendingSignup.hasVatRegistration ? pendingSignup.taxNumber : null,
          commercialRegistration: pendingSignup.commercialRegistration,
          businessType: pendingSignup.businessType,
          type: pendingSignup.restaurantType,
          subscriptionPlan: pendingSignup.subscriptionPlan,
          branchesCount: pendingSignup.branchesCount,
          subscriptionStatus: "active" as const,
        });

        const restaurant = await storage.createRestaurant(restaurantData);
        console.log(`[Geidea Signup GET] Created restaurant: ${restaurant.id}`);

        // Step 2: Generate Device Serial Numbers
        const deviceSerials = await storage.generateDeviceSerialNumbers(
          restaurant.id,
          pendingSignup.branchesCount,
          pendingSignup.commercialRegistration
        );
        console.log(`[Geidea Signup GET] Generated ${deviceSerials.length} device serials`);

        // Step 3: Create admin user
        const userData = {
          restaurantId: restaurant.id,
          username: pendingSignup.username,
          passwordHash: pendingSignup.passwordHash,
          fullName: pendingSignup.fullName,
          email: pendingSignup.email,
          role: "admin" as const,
          active: true,
          permissions: ADMIN_PERMISSIONS,
        };

        const user = await storage.createUserWithHashedPassword(userData);
        console.log(`[Geidea Signup GET] Created user: ${user.id}`);

        // Step 4: Associate uploaded files with restaurant
        const uploadedFiles = pendingSignup.uploadedFiles as Record<string, { filename: string; originalname: string; mimetype: string; size: number }> | null;
        if (uploadedFiles) {
          const fileTypeMapping: { [key: string]: string } = {
            crCertificate: "cr_certificate",
            vatCertificate: "vat_certificate",
            ibanCertificate: "iban_certificate",
            nationalAddress: "national_address"
          };
          
          for (const [fieldName, fileInfo] of Object.entries(uploadedFiles)) {
            const fileType = fileTypeMapping[fieldName];
            if (fileType && fileInfo) {
              try {
                await storage.createShopFile({
                  restaurantId: restaurant.id,
                  fileType: fileType as "cr_certificate" | "vat_certificate" | "iban_certificate" | "national_address",
                  fileName: fileInfo.originalname,
                  filePath: `uploads/shop-files/${fileInfo.filename}`,
                  fileSize: fileInfo.size,
                  mimeType: fileInfo.mimetype,
                  uploadedBy: user.id,
                });
                console.log(`[Geidea Signup GET] Associated ${fileType} with restaurant ${restaurant.id}`);
              } catch (fileError) {
                console.error(`[Geidea Signup GET] Failed to associate ${fileType}:`, fileError);
              }
            }
          }
        }

        // Step 5: Generate subscription invoice
        try {
          const branches = pendingSignup.branchesCount;
          const pricing = getPlanPricing(
            pendingSignup.subscriptionPlan as SubscriptionPlan, 
            branches, 
            pendingSignup.businessType as BusinessType
          );
          
          const basePlanPricing = getPlanPricing(
            pendingSignup.subscriptionPlan as SubscriptionPlan, 
            1, 
            pendingSignup.businessType as BusinessType
          );
          const basePlanPrice = basePlanPricing.netAmount;
          const additionalBranchesPrice = branches > 1 ? pricing.netAmount - basePlanPrice : 0;
          
          const subtotal = pricing.netAmount;
          const vatAmount = pricing.vatAmount;
          const total = pricing.grossAmount;

          const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();
          const businessInfo = await storage.getBusinessInfo();

          const pdfBuffer = await generateSubscriptionInvoice({
            serialNumber,
            userFullName: user.fullName,
            userEmail: user.email ?? "",
            restaurantName: restaurant.name,
            nationalId: restaurant.nationalId,
            taxNumber: restaurant.taxNumber ?? "",
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

          const invoicesDir = path.join(process.cwd(), 'public', 'subscription-invoices');
          if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
          }

          const pdfFilename = `subscription-${serialNumber}.pdf`;
          const pdfPath = path.join(invoicesDir, pdfFilename);
          fs.writeFileSync(pdfPath, pdfBuffer);

          const QRCode = await import('qrcode');
          const qrData = `Invoice: ${serialNumber}\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal: ${total.toFixed(2)} SAR\nVAT: ${vatAmount.toFixed(2)} SAR`;
          const qrCode = await QRCode.toDataURL(qrData);

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

          console.log(`[Geidea Signup GET] Generated subscription invoice: ${serialNumber}`);
        } catch (invoiceError) {
          console.error("[Geidea Signup GET] Failed to generate subscription invoice:", invoiceError);
          // Don't fail signup if invoice generation fails
        }

        // Step 6: Store payment record
        try {
          await storage.createMoyasarPayment({
            restaurantId: restaurant.id,
            moyasarId: orderId,
            orderId: null,
            amount: pendingSignup.amount,
            amountHalalas: Math.round(parseFloat(pendingSignup.amount) * 100),
            currency: 'SAR',
            status: 'paid',
            paymentMethod: 'geidea-card',
            cardBrand: orderDetails.order.transactions?.[0]?.paymentMethod?.brand || null,
            cardLast4: orderDetails.order.transactions?.[0]?.paymentMethod?.maskedCardNumber?.slice(-4) || null,
            fee: null,
            refundedAmount: "0",
            description: `Subscription payment for ${pendingSignup.subscriptionPlan} plan`,
            customerName: pendingSignup.fullName,
            customerEmail: pendingSignup.email,
            customerPhone: null,
            callbackUrl: null,
            metadata: { 
              gateway: 'geidea', 
              type: 'signup_subscription',
              tokenId: tokenId || null,
            } as Record<string, any>,
            errorMessage: null,
            branchId: null,
          });
          console.log(`[Geidea Signup GET] Stored payment record`);
        } catch (paymentError) {
          console.error("[Geidea Signup GET] Failed to store payment record:", paymentError);
          // Don't fail signup if payment record storage fails
        }

        // Step 6: Mark pending signup as paid
        await storage.updatePendingSignupStatus(pendingSignup.id, 'paid');

        console.log(`[Geidea Signup GET] Signup completed successfully for user: ${pendingSignup.username}`);
        return res.redirect(`${baseUrl}/login?signup=success`);

      } catch (accountError: any) {
        console.error(`[Geidea Signup GET] Error creating account:`, accountError);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=account_creation_failed`);
      }
      
    } catch (error: any) {
      console.error('[Geidea Signup GET] Unexpected error:', error);
      return res.redirect(`${baseUrl}/signup?error=unexpected_error`);
    }
  });

  // Geidea callback for signup payments - completes account creation on success (POST from Geidea server)
  app.post("/api/geidea/signup-callback", async (req, res) => {
    const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : req.protocol) + '://' + req.get('host');
    
    // Helper to cleanup uploaded files on failure - defined at handler scope
    const cleanupUploadedFilesForSignup = async (signup: { uploadedFiles: any } | null) => {
      if (!signup) return;
      const fs = await import('fs').then(m => m.promises);
      const uploadedFiles = signup.uploadedFiles as Record<string, { filename: string }> | null;
      if (uploadedFiles) {
        for (const [key, file] of Object.entries(uploadedFiles)) {
          try {
            await fs.unlink(`uploads/${file.filename}`);
            console.log(`[Geidea Signup Callback] Cleaned up file: uploads/${file.filename}`);
          } catch (cleanupErr) {
            console.warn(`[Geidea Signup Callback] Could not cleanup file: uploads/${file.filename}`);
          }
        }
      }
    };
    
    // Track pending signup for cleanup in outer catch
    let pendingSignup: any = null;
    
    try {
      const { order } = req.body;
      
      if (!order) {
        console.warn('[Geidea Signup Callback] Missing order in callback');
        // Try to extract sessionId from body root level (Geidea may send it there)
        const fallbackSessionId = req.body?.sessionId;
        if (fallbackSessionId) {
          const orphanedSignup = await storage.getPendingSignupBySessionId(fallbackSessionId);
          if (orphanedSignup && orphanedSignup.status === 'pending') {
            console.warn(`[Geidea Signup Callback] Found orphaned signup for session ${fallbackSessionId}, marking as failed`);
            await storage.updatePendingSignupStatus(orphanedSignup.id, 'failed');
            await cleanupUploadedFilesForSignup(orphanedSignup);
          }
        }
        return res.redirect(`${baseUrl}/signup?error=missing_order`);
      }

      const { orderId: geideaOrderId, status, detailedStatus, sessionId } = order;
      
      console.log(`[Geidea Signup Callback] Received callback for order ${geideaOrderId}, session ${sessionId}, status: ${status}`);

      // Find pending signup by session ID
      pendingSignup = await storage.getPendingSignupBySessionId(sessionId);
      
      if (!pendingSignup) {
        console.warn(`[Geidea Signup Callback] Pending signup not found for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/signup?error=signup_not_found`);
      }

      // Check if already processed (idempotency)
      if (pendingSignup.status === 'paid') {
        console.log(`[Geidea Signup Callback] Signup already completed for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/login?signup=success`);
      }
      
      if (pendingSignup.status === 'failed') {
        console.log(`[Geidea Signup Callback] Signup already failed for session: ${sessionId}`);
        return res.redirect(`${baseUrl}/signup?error=payment_failed`);
      }

      // SECURITY: Verify order status directly with Geidea API (don't trust callback payload)
      const { isPaymentSuccessful, isPaymentFailed, extractTokenFromOrder, getOrderDetails } = await import('./geidea');
      
      // Shorthand cleanup for this signup
      const cleanupUploadedFiles = () => cleanupUploadedFilesForSignup(pendingSignup);
      
      let verifiedOrder: any;
      try {
        console.log(`[Geidea Signup Callback] Verifying order ${geideaOrderId} with Geidea API...`);
        verifiedOrder = await getOrderDetails(geideaOrderId);
        console.log(`[Geidea Signup Callback] Verified order status: ${verifiedOrder?.order?.status}, amount: ${verifiedOrder?.order?.totalAmount}`);
      } catch (verifyError: any) {
        console.error(`[Geidea Signup Callback] Failed to verify order with Geidea:`, verifyError);
        // SECURITY: NEVER proceed without verification - fail the transaction and cleanup
        console.error(`[Geidea Signup Callback] SECURITY: Cannot verify payment ${geideaOrderId} - rejecting callback`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // Verify we got a valid response with order data
      if (!verifiedOrder?.order) {
        console.error(`[Geidea Signup Callback] SECURITY: Invalid verification response - no order data`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }

      // Use verified order data (NEVER fall back to unverified callback data)
      const verifiedStatus = verifiedOrder.order.status;
      const verifiedAmount = verifiedOrder.order.totalAmount;
      const verifiedSessionId = verifiedOrder.order.sessionId;
      const verifiedMerchantRef = verifiedOrder.order.merchantReferenceId;
      const verifiedCurrency = verifiedOrder.order.currency;
      
      // Validate session ID matches (security check)
      if (verifiedSessionId && verifiedSessionId !== sessionId) {
        console.error(`[Geidea Signup Callback] SECURITY: Session ID mismatch! Expected: ${sessionId}, Got: ${verifiedSessionId}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // Validate merchantReferenceId matches (security check against cross-order replay)
      if (verifiedMerchantRef && verifiedMerchantRef !== pendingSignup.merchantReferenceId) {
        console.error(`[Geidea Signup Callback] SECURITY: Merchant Reference mismatch! Expected: ${pendingSignup.merchantReferenceId}, Got: ${verifiedMerchantRef}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // Validate currency is SAR (security check)
      if (verifiedCurrency && verifiedCurrency !== 'SAR') {
        console.error(`[Geidea Signup Callback] SECURITY: Currency mismatch! Expected: SAR, Got: ${verifiedCurrency}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=verification_failed`);
      }
      
      // Validate amount matches (security check against tampering)
      const expectedAmount = parseFloat(pendingSignup.amount);
      if (verifiedAmount) {
        // Allow small rounding differences (less than 0.01)
        const amountDiff = Math.abs(verifiedAmount - expectedAmount);
        if (amountDiff > 0.01) {
          console.error(`[Geidea Signup Callback] SECURITY: Amount mismatch! Expected: ${expectedAmount}, Got: ${verifiedAmount}`);
          await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
          await cleanupUploadedFiles();
          return res.redirect(`${baseUrl}/signup?error=amount_mismatch`);
        }
      }
      
      // Check payment status (using verified status when available)
      if (isPaymentFailed(verifiedStatus)) {
        console.log(`[Geidea Signup Callback] Payment failed for session ${sessionId}: ${detailedStatus || verifiedStatus}`);
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=payment_failed&reason=${encodeURIComponent(detailedStatus || verifiedStatus)}`);
      }
      
      if (!isPaymentSuccessful(verifiedStatus)) {
        console.log(`[Geidea Signup Callback] Payment pending for session ${sessionId}: ${verifiedStatus}`);
        return res.redirect(`${baseUrl}/signup?error=payment_pending&reason=${encodeURIComponent(verifiedStatus)}`);
      }

      // Payment successful and verified - complete account creation
      console.log(`[Geidea Signup Callback] Payment verified and successful for session ${sessionId}, completing signup...`);

      // Extract card token for recurring payments (from verified order or callback data)
      const tokenId = extractTokenFromOrder(verifiedOrder?.order || order);
      if (tokenId) {
        console.log(`[Geidea Signup Callback] Extracted token for recurring payments: ${tokenId}`);
      }

      try {
        // Step 1: Create restaurant
        const restaurantData = insertRestaurantSchema.parse({
          name: pendingSignup.restaurantName,
          nationalId: pendingSignup.nationalId,
          hasVatRegistration: pendingSignup.hasVatRegistration,
          taxNumber: pendingSignup.hasVatRegistration ? pendingSignup.taxNumber : null,
          commercialRegistration: pendingSignup.commercialRegistration,
          businessType: pendingSignup.businessType,
          type: pendingSignup.restaurantType,
          subscriptionPlan: pendingSignup.subscriptionPlan,
          branchesCount: pendingSignup.branchesCount,
          subscriptionStatus: "active" as const,
        });

        const restaurant = await storage.createRestaurant(restaurantData);
        console.log(`[Geidea Signup Callback] Created restaurant: ${restaurant.id}`);

        // Step 2: Generate Device Serial Numbers
        const deviceSerials = await storage.generateDeviceSerialNumbers(
          restaurant.id,
          pendingSignup.branchesCount,
          pendingSignup.commercialRegistration
        );
        console.log(`[Geidea Signup Callback] Generated ${deviceSerials.length} device serials`);

        // Step 3: Create admin user
        const userData = {
          restaurantId: restaurant.id,
          username: pendingSignup.username,
          passwordHash: pendingSignup.passwordHash, // Already hashed
          fullName: pendingSignup.fullName,
          email: pendingSignup.email,
          role: "admin" as const,
          active: true,
          permissions: ADMIN_PERMISSIONS,
        };

        const user = await storage.createUserWithHashedPassword(userData);
        console.log(`[Geidea Signup Callback] Created user: ${user.id}`);

        // Step 4: Associate uploaded files with restaurant
        const uploadedFiles = pendingSignup.uploadedFiles as Record<string, { filename: string; originalname: string; mimetype: string; size: number }> | null;
        if (uploadedFiles) {
          const fileTypeMapping: { [key: string]: string } = {
            crCertificate: "cr_certificate",
            vatCertificate: "vat_certificate",
            ibanCertificate: "iban_certificate",
            nationalAddress: "national_address"
          };
          
          for (const [fieldName, fileInfo] of Object.entries(uploadedFiles)) {
            const fileType = fileTypeMapping[fieldName];
            if (fileType && fileInfo) {
              try {
                await storage.createShopFile({
                  restaurantId: restaurant.id,
                  fileType: fileType as "cr_certificate" | "vat_certificate" | "iban_certificate" | "national_address",
                  fileName: fileInfo.originalname,
                  filePath: `uploads/shop-files/${fileInfo.filename}`,
                  fileSize: fileInfo.size,
                  mimeType: fileInfo.mimetype,
                  uploadedBy: user.id,
                });
                console.log(`[Geidea Signup Callback] Associated ${fileType} with restaurant ${restaurant.id}`);
              } catch (fileError) {
                console.error(`[Geidea Signup Callback] Failed to associate ${fileType}:`, fileError);
              }
            }
          }
        }

        // Step 5: Generate subscription invoice
        try {
          const branches = pendingSignup.branchesCount;
          const pricing = getPlanPricing(
            pendingSignup.subscriptionPlan as SubscriptionPlan, 
            branches, 
            pendingSignup.businessType as BusinessType
          );
          
          const basePlanPricing = getPlanPricing(
            pendingSignup.subscriptionPlan as SubscriptionPlan, 
            1, 
            pendingSignup.businessType as BusinessType
          );
          const basePlanPrice = basePlanPricing.netAmount;
          const additionalBranchesPrice = branches > 1 ? pricing.netAmount - basePlanPrice : 0;
          
          const subtotal = pricing.netAmount;
          const vatAmount = pricing.vatAmount;
          const total = pricing.grossAmount;

          const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();
          const businessInfo = await storage.getBusinessInfo();

          const pdfBuffer = await generateSubscriptionInvoice({
            serialNumber,
            userFullName: user.fullName,
            userEmail: user.email ?? "",
            restaurantName: restaurant.name,
            nationalId: restaurant.nationalId,
            taxNumber: restaurant.taxNumber ?? "",
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

          const invoicesDir = path.join(process.cwd(), 'public', 'subscription-invoices');
          if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
          }

          const pdfFilename = `subscription-${serialNumber}.pdf`;
          const pdfPath = path.join(invoicesDir, pdfFilename);
          fs.writeFileSync(pdfPath, pdfBuffer);

          const QRCode = await import('qrcode');
          const qrData = `Invoice: ${serialNumber}\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal: ${total.toFixed(2)} SAR\nVAT: ${vatAmount.toFixed(2)} SAR`;
          const qrCode = await QRCode.toDataURL(qrData);

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

          console.log(`[Geidea Signup Callback] Generated subscription invoice: ${serialNumber}`);
        } catch (invoiceError) {
          console.error("[Geidea Signup Callback] Failed to generate subscription invoice:", invoiceError);
          // Don't fail signup if invoice generation fails
        }

        // Step 6: Store payment record with token for recurring billing
        try {
          await storage.createMoyasarPayment({
            restaurantId: restaurant.id,
            moyasarId: geideaOrderId,
            orderId: null,
            amount: pendingSignup.amount,
            amountHalalas: Math.round(parseFloat(pendingSignup.amount) * 100),
            currency: 'SAR',
            status: 'paid',
            paymentMethod: 'geidea-card',
            cardBrand: order.transactions?.[0]?.paymentMethod?.brand || null,
            cardLast4: order.transactions?.[0]?.paymentMethod?.maskedCardNumber?.slice(-4) || null,
            fee: null,
            refundedAmount: "0",
            description: `Subscription payment for ${pendingSignup.subscriptionPlan} plan`,
            customerName: pendingSignup.fullName,
            customerEmail: pendingSignup.email,
            customerPhone: null,
            callbackUrl: null,
            metadata: { 
              gateway: 'geidea', 
              type: 'signup_subscription',
              tokenId: tokenId || null,
            } as Record<string, any>,
            errorMessage: null,
            branchId: null,
          });
          console.log(`[Geidea Signup Callback] Stored payment record for recurring billing`);
        } catch (paymentError) {
          console.error("[Geidea Signup Callback] Failed to store payment record:", paymentError);
        }

        // Step 7: Mark pending signup as completed
        await storage.updatePendingSignupStatus(pendingSignup.id, 'paid');

        console.log(`[Geidea Signup Callback] Signup completed successfully for ${pendingSignup.username}`);
        
        // Redirect to login page with success message
        return res.redirect(`${baseUrl}/login?signup=success&username=${encodeURIComponent(pendingSignup.username)}`);

      } catch (accountError: any) {
        console.error("[Geidea Signup Callback] Account creation error:", accountError);
        // Payment succeeded but account creation failed - this is a critical error
        // Mark as failed and cleanup files so user can retry
        await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
        await cleanupUploadedFiles();
        return res.redirect(`${baseUrl}/signup?error=account_creation_failed`);
      }

    } catch (error: any) {
      console.error("[Geidea Signup Callback] Error:", error);
      // Cleanup: mark pending signup as failed and delete staged files if we have a reference
      if (pendingSignup && pendingSignup.status === 'pending') {
        try {
          await storage.updatePendingSignupStatus(pendingSignup.id, 'failed');
          await cleanupUploadedFilesForSignup(pendingSignup);
          console.log(`[Geidea Signup Callback] Marked signup as failed and cleaned up files after error`);
        } catch (cleanupError) {
          console.error(`[Geidea Signup Callback] Failed to cleanup after error:`, cleanupError);
        }
      }
      return res.redirect(`${baseUrl}/signup?error=callback_error`);
    }
  });

  // Payment status check endpoint for frontend polling after redirect
  app.get("/api/geidea/payment-status/:paymentId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const payment = await storage.getMoyasarPayment(req.params.paymentId);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // SECURITY: Verify payment belongs to this restaurant
      if (payment.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json({
        id: payment.id,
        status: payment.status,
        orderId: payment.orderId,
        amount: payment.amount,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        isPaid: payment.status === 'paid',
        isFailed: payment.status === 'failed',
        isPending: !['paid', 'failed'].includes(payment.status),
      });
    } catch (error: any) {
      console.error("[Geidea] Payment status check error:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  app.get("/api/geidea/order/:orderId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      
      // First verify this order belongs to this restaurant by checking our payment records
      const payment = await storage.getMoyasarPaymentByMoyasarId(req.params.orderId, restaurantId);
      if (!payment) {
        return res.status(404).json({ error: "Order not found for this restaurant" });
      }
      
      const { getOrderDetails, isPaymentSuccessful } = await import('./geidea');
      const orderDetails = await getOrderDetails(req.params.orderId);
      
      // SECURITY: Verify the Geidea order's merchantReferenceId matches our stored record
      const storedMetadata = payment.metadata as { merchantReferenceId?: string } | null;
      if (storedMetadata?.merchantReferenceId && orderDetails.order?.merchantReferenceId !== storedMetadata.merchantReferenceId) {
        console.warn(`[Geidea] Order merchantReferenceId mismatch for restaurant ${restaurantId}`);
        return res.status(403).json({ error: "Order verification failed" });
      }
      
      res.json({
        ...orderDetails,
        isSuccessful: isPaymentSuccessful(orderDetails.order.status),
      });
    } catch (error: any) {
      console.error("[Geidea] Get order error:", error);
      res.status(500).json({ 
        error: "Failed to get order details",
        message: error.message,
      });
    }
  });

  app.get("/api/geidea/payments", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const branchId = req.query.branchId as string | undefined;
      // Reuse moyasar payments storage, filter by gateway in metadata
      const allPayments = await storage.getMoyasarPayments(restaurantId, branchId);
      const geideaPayments = allPayments.filter((p: any) => 
        p.paymentMethod === 'geidea' || 
        p.paymentMethod === 'geidea-card' ||
        (p.metadata && typeof p.metadata === 'object' && (p.metadata as any).gateway === 'geidea')
      );
      res.json(geideaPayments);
    } catch (error) {
      console.error("[Geidea] Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Geidea recurring subscription charge using saved token
  // SECURITY: Token must be retrieved from a stored payment belonging to this restaurant
  app.post("/api/geidea/charge-subscription", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { paymentId, amount, subscriptionId, description, customerName, customerEmail } = req.body;

      // SECURITY: Require paymentId instead of raw tokenId to prevent cross-tenant token theft
      if (!paymentId) {
        return res.status(400).json({ error: "Original payment ID is required for subscription charges" });
      }

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      // SECURITY: Look up the original payment and verify it belongs to this restaurant
      const originalPayment = await storage.getMoyasarPayment(paymentId);
      if (!originalPayment) {
        return res.status(404).json({ error: "Original payment not found" });
      }
      
      // SECURITY: Verify tenant ownership
      if (originalPayment.restaurantId !== restaurantId) {
        console.warn(`[Geidea] Attempted cross-tenant token access: restaurant ${restaurantId} tried to use payment from ${originalPayment.restaurantId}`);
        return res.status(403).json({ error: "Payment not found for this restaurant" });
      }

      // Extract tokenId from stored metadata
      const metadata = originalPayment.metadata as { tokenId?: string } | null;
      const tokenId = metadata?.tokenId;

      if (!tokenId) {
        return res.status(400).json({ error: "No saved card token found for this payment. The original payment must use cardOnFile:true" });
      }

      const { chargeWithToken } = await import('./geidea');

      const merchantReferenceId = subscriptionId || `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const result = await chargeWithToken({
        tokenId,
        amount: parseFloat(amount),
        merchantReferenceId,
      });

      // Save payment record
      const payment = await storage.createMoyasarPayment({
        restaurantId,
        moyasarId: result.order?.orderId || merchantReferenceId,
        orderId: subscriptionId || null,
        transactionId: null,
        amount: parseFloat(amount).toFixed(2),
        amountHalalas: Math.round(parseFloat(amount) * 100),
        currency: 'SAR',
        status: result.order?.status === 'Success' || result.order?.status === 'Captured' ? 'paid' : 'pending',
        paymentMethod: 'geidea-recurring',
        cardBrand: null,
        cardLast4: null,
        fee: null,
        refundedAmount: "0",
        description: description || 'Subscription charge',
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: null,
        callbackUrl: null,
        metadata: { merchantReferenceId, gateway: 'geidea', tokenId, type: 'recurring', restaurantId } as Record<string, any>,
        errorMessage: null,
        branchId: null,
      });

      console.log(`[Geidea] Subscription charge successful for restaurant ${restaurantId}: ${result.order?.orderId}`);

      res.json({
        success: true,
        orderId: result.order?.orderId,
        status: result.order?.status,
        paymentId: payment.id,
        payment,
      });
    } catch (error: any) {
      console.error("[Geidea] Subscription charge error:", error);
      res.status(500).json({
        error: "Subscription charge failed",
        message: error.message,
      });
    }
  });

  // Support Tickets
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      
      let tickets;
      if (accountType === 'it') {
        // IT accounts see all tickets across all restaurants
        tickets = await storage.getAllSupportTicketsForIT(userId, status);
      } else {
        // Restaurant accounts can only access their own tickets
        const restaurantId = req.session.user!.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        tickets = await storage.getSupportTickets(restaurantId, userId, status);
      }
      
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
      // Transform to expected format: { categories: [{ name, value }] }
      const categories = breakdown.map(item => ({
        name: item.category,
        value: item.count
      }));
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  });

  app.get("/api/it/trends", requireAuth, requireITAccount, async (req, res) => {
    try {
      // IT accounts can see ticket trends across all restaurants
      const trends = await storage.getTicketTrends();
      // Wrap in expected format: { trends: [...] }
      res.json({ trends });
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

  // IT-only: Get shop files for a specific client
  app.get("/api/it/client-files/:restaurantId", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const files = await storage.getShopFiles(restaurantId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching client files:", error);
      res.status(500).json({ error: "Failed to fetch client files" });
    }
  });

  // IT-only: Download a client's shop file
  app.get("/api/it/client-files/:restaurantId/:fileId/download", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId, fileId } = req.params;
      const file = await storage.getShopFile(fileId, restaurantId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(process.cwd(), file.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader('Content-Type', file.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading client file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Performance Tracking (IT-only) - Sales per MAIN USER (admin) across all restaurants
  // Sub-account actions are linked to their main user via restaurantId
  // Only shows ONE main user per restaurant to avoid double-counting
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

      // Step 1: Get order aggregates by restaurant
      const orderStats = await db
        .select({
          restaurantId: orders.restaurantId,
          totalSales: sql<string>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
          totalOrders: sql<string>`COUNT(${orders.id})`,
          lastActivityAt: sql<Date>`MAX(${orders.createdAt})`,
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        ))
        .groupBy(orders.restaurantId);

      // Create a map of restaurant ID to order stats
      const orderStatsMap = new Map<string, { totalSales: string; totalOrders: string; lastActivityAt: Date | null }>();
      for (const stat of orderStats) {
        if (stat.restaurantId) {
          orderStatsMap.set(stat.restaurantId, {
            totalSales: stat.totalSales,
            totalOrders: stat.totalOrders,
            lastActivityAt: stat.lastActivityAt,
          });
        }
      }

      // Step 2: Get one primary admin per restaurant (using MIN(id) to pick the first/oldest admin)
      // This prevents double-counting when a restaurant has multiple admins
      const primaryAdmins = await db
        .select({
          restaurantId: users.restaurantId,
          primaryAdminId: sql<string>`MIN(${users.id})`,
        })
        .from(users)
        .where(and(
          eq(users.active, true),
          eq(users.role, "admin"),
          isNotNull(users.restaurantId)
        ))
        .groupBy(users.restaurantId);

      // Get full admin details for each primary admin
      const primaryAdminIds = primaryAdmins.map(a => a.primaryAdminId).filter(Boolean);
      if (primaryAdminIds.length === 0) {
        return res.json([]);
      }

      // Step 3: Get full user and restaurant details for primary admins
      const adminDetails = await db
        .select({
          userId: users.id,
          username: users.username,
          fullName: users.fullName,
          role: users.role,
          restaurantId: restaurants.id,
          restaurantName: restaurants.name,
          businessType: restaurants.businessType,
        })
        .from(users)
        .innerJoin(restaurants, eq(restaurants.id, users.restaurantId))
        .where(sql`${users.id} = ANY(ARRAY[${sql.raw(primaryAdminIds.map(id => `'${id}'`).join(','))}]::varchar[])`);

      // Combine admin details with order stats
      const results = adminDetails.map((admin) => {
        const stats = orderStatsMap.get(admin.restaurantId || "");
        const totalSales = parseFloat(stats?.totalSales || "0");
        const totalOrders = parseInt(stats?.totalOrders || "0", 10);
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Safely convert lastActivityAt to ISO string
        let lastActivityAtISO: string | null = null;
        if (stats?.lastActivityAt) {
          if (stats.lastActivityAt instanceof Date) {
            lastActivityAtISO = stats.lastActivityAt.toISOString();
          } else {
            lastActivityAtISO = new Date(stats.lastActivityAt as any).toISOString();
          }
        }

        return {
          userId: admin.userId || "",
          username: admin.username || "N/A",
          fullName: admin.fullName || "N/A",
          role: admin.role || "admin",
          restaurantId: admin.restaurantId || "",
          restaurantName: admin.restaurantName || "N/A",
          businessType: admin.businessType || "restaurant",
          totalSales: totalSales.toFixed(2),
          totalOrders,
          avgOrderValue: avgOrderValue.toFixed(2),
          lastActivityAt: lastActivityAtISO,
        };
      });

      // Sort by total sales descending
      results.sort((a, b) => parseFloat(b.totalSales) - parseFloat(a.totalSales));

      // Filter out restaurants with no orders in the date range
      const filteredResults = results.filter(r => r.totalOrders > 0);

      res.json(filteredResults);
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

  // Get all pending signups for IT management
  app.get("/api/it/pending-signups", requireAuth, requireITAccount, async (req, res) => {
    try {
      const pendingSignups = await storage.getAllPendingSignups();
      res.json(pendingSignups);
    } catch (error) {
      console.error("Error fetching pending signups:", error);
      res.status(500).json({ error: "Failed to fetch pending signups" });
    }
  });

  // Delete a pending signup (IT only)
  app.delete("/api/it/pending-signups/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePendingSignup(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pending signup:", error);
      res.status(500).json({ error: "Failed to delete pending signup" });
    }
  });

  // Clean up expired pending signups (IT only)
  app.post("/api/it/pending-signups/cleanup", requireAuth, requireITAccount, async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredPendingSignups();
      res.json({ deletedCount });
    } catch (error) {
      console.error("Error cleaning up expired signups:", error);
      res.status(500).json({ error: "Failed to cleanup expired signups" });
    }
  });

  // Update pending signup status (IT only)
  app.patch("/api/it/pending-signups/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['pending', 'paid', 'failed', 'expired'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: pending, paid, failed, expired" });
      }
      
      const pendingSignup = await storage.getPendingSignupById(id);
      if (!pendingSignup) {
        return res.status(404).json({ error: "Pending signup not found" });
      }
      
      await storage.updatePendingSignupStatus(id, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Error updating pending signup status:", error);
      res.status(500).json({ error: "Failed to update pending signup status" });
    }
  });

  // Activate pending signup and create active account (IT only)
  app.post("/api/it/pending-signups/:id/activate", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      
      const pendingSignup = await storage.getPendingSignupById(id);
      if (!pendingSignup) {
        return res.status(404).json({ error: "Pending signup not found" });
      }
      
      // Check if already processed
      if (pendingSignup.status === 'paid') {
        return res.status(400).json({ error: "This signup has already been activated" });
      }
      
      console.log(`[IT Activate] Activating pending signup: ${id}`);
      
      // Step 1: Create restaurant
      const restaurantData = insertRestaurantSchema.parse({
        name: pendingSignup.restaurantName,
        nationalId: pendingSignup.nationalId,
        hasVatRegistration: pendingSignup.hasVatRegistration,
        taxNumber: pendingSignup.hasVatRegistration ? pendingSignup.taxNumber : null,
        commercialRegistration: pendingSignup.commercialRegistration,
        businessType: pendingSignup.businessType,
        type: pendingSignup.restaurantType,
        subscriptionPlan: pendingSignup.subscriptionPlan,
        branchesCount: pendingSignup.branchesCount,
        subscriptionStatus: "active" as const,
      });

      const restaurant = await storage.createRestaurant(restaurantData);
      console.log(`[IT Activate] Created restaurant: ${restaurant.id}`);

      // Step 2: Generate Device Serial Numbers
      const deviceSerials = await storage.generateDeviceSerialNumbers(
        restaurant.id,
        pendingSignup.branchesCount,
        pendingSignup.commercialRegistration
      );
      console.log(`[IT Activate] Generated ${deviceSerials.length} device serials`);

      // Step 3: Create admin user
      const userData = {
        restaurantId: restaurant.id,
        username: pendingSignup.username,
        passwordHash: pendingSignup.passwordHash,
        fullName: pendingSignup.fullName,
        email: pendingSignup.email,
        role: "admin" as const,
        active: true,
        permissions: ADMIN_PERMISSIONS,
      };

      const user = await storage.createUserWithHashedPassword(userData);
      console.log(`[IT Activate] Created user: ${user.id}`);

      // Step 4: Associate uploaded files with restaurant
      const uploadedFiles = pendingSignup.uploadedFiles as Record<string, { filename: string; originalname: string; mimetype: string; size: number }> | null;
      if (uploadedFiles) {
        const fileTypeMapping: { [key: string]: string } = {
          crCertificate: "cr_certificate",
          vatCertificate: "vat_certificate",
          ibanCertificate: "iban_certificate",
          nationalAddress: "national_address"
        };
        
        for (const [fieldName, fileInfo] of Object.entries(uploadedFiles)) {
          const fileType = fileTypeMapping[fieldName];
          if (fileType && fileInfo) {
            try {
              await storage.createShopFile({
                restaurantId: restaurant.id,
                fileType: fileType as "cr_certificate" | "vat_certificate" | "iban_certificate" | "national_address",
                fileName: fileInfo.originalname,
                filePath: `uploads/shop-files/${fileInfo.filename}`,
                fileSize: fileInfo.size,
                mimeType: fileInfo.mimetype,
                uploadedBy: user.id,
              });
              console.log(`[IT Activate] Associated ${fileType} with restaurant ${restaurant.id}`);
            } catch (fileError) {
              console.error(`[IT Activate] Failed to associate ${fileType}:`, fileError);
            }
          }
        }
      }

      // Step 5: Generate subscription invoice
      try {
        const branches = pendingSignup.branchesCount;
        const pricing = getPlanPricing(
          pendingSignup.subscriptionPlan as SubscriptionPlan, 
          branches, 
          pendingSignup.businessType as BusinessType
        );
        
        const basePlanPricing = getPlanPricing(
          pendingSignup.subscriptionPlan as SubscriptionPlan, 
          1, 
          pendingSignup.businessType as BusinessType
        );
        const basePlanPrice = basePlanPricing.netAmount;
        const additionalBranchesPrice = branches > 1 ? pricing.netAmount - basePlanPrice : 0;
        
        const subtotal = pricing.netAmount;
        const vatAmount = pricing.vatAmount;
        const total = pricing.grossAmount;

        const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();
        const businessInfo = await storage.getBusinessInfo();

        const pdfBuffer = await generateSubscriptionInvoice({
          serialNumber,
          userFullName: user.fullName,
          userEmail: user.email ?? "",
          restaurantName: restaurant.name,
          nationalId: restaurant.nationalId,
          taxNumber: restaurant.taxNumber ?? "",
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

        const invoicesDir = path.join(process.cwd(), 'public', 'subscription-invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const pdfFilename = `subscription-${serialNumber}.pdf`;
        const pdfPath = path.join(invoicesDir, pdfFilename);
        fs.writeFileSync(pdfPath, pdfBuffer);

        const QRCode = await import('qrcode');
        const qrData = `Invoice: ${serialNumber}\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal: ${total.toFixed(2)} SAR\nVAT: ${vatAmount.toFixed(2)} SAR`;
        const qrCode = await QRCode.toDataURL(qrData);

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

        console.log(`[IT Activate] Generated subscription invoice: ${serialNumber}`);
      } catch (invoiceError) {
        console.error("[IT Activate] Failed to generate subscription invoice:", invoiceError);
      }

      // Step 6: Mark pending signup as paid
      await storage.updatePendingSignupStatus(id, 'paid');
      console.log(`[IT Activate] Marked pending signup as paid`);

      res.json({ 
        success: true, 
        restaurantId: restaurant.id,
        userId: user.id,
        message: "Account activated successfully"
      });
    } catch (error) {
      console.error("Error activating pending signup:", error);
      res.status(500).json({ error: "Failed to activate pending signup" });
    }
  });

  // Check and suspend expired subscriptions (IT only)
  app.post("/api/it/check-expired-subscriptions", requireAuth, requireITAccount, async (req, res) => {
    try {
      const expiredSubscriptions = await storage.getExpiredSubscriptions();
      let suspendedCount = 0;
      
      for (const restaurant of expiredSubscriptions) {
        await storage.updateRestaurantSubscriptionStatus(restaurant.id, 'expired');
        console.log(`[Subscription Check] Suspended expired subscription for restaurant: ${restaurant.id} (${restaurant.name})`);
        suspendedCount++;
      }
      
      res.json({ 
        suspendedCount, 
        expiredRestaurants: expiredSubscriptions.map(r => ({ id: r.id, name: r.name }))
      });
    } catch (error) {
      console.error("Error checking expired subscriptions:", error);
      res.status(500).json({ error: "Failed to check expired subscriptions" });
    }
  });

  // Get all IT accounts for IT management (users with null restaurantId)
  app.get("/api/it/it-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      // Get all IT accounts (users with null restaurantId)
      const itAccounts = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          active: users.active,
          lastLoginAt: users.lastLoginAt,
          lastActivityAt: users.lastActivityAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(isNull(users.restaurantId))
        .orderBy(desc(users.lastActivityAt));

      res.json(itAccounts);
    } catch (error) {
      console.error("Error fetching IT accounts:", error);
      res.status(500).json({ error: "Failed to fetch IT accounts" });
    }
  });

  // Create new IT account
  app.post("/api/it/it-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { username, password, fullName, email, phone, role } = req.body;

      // Validate required fields
      if (!username || !password || !fullName) {
        return res.status(400).json({ error: "Username, password, and full name are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create IT account (null restaurantId)
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users)
        .values({
          username,
          password: hashedPassword,
          fullName,
          email: email || null,
          phone: phone || null,
          role: role || "admin",
          restaurantId: null, // IT accounts have null restaurantId
          permissions: {} as any,
          active: true,
        })
        .returning();

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating IT account:", error);
      res.status(500).json({ error: "Failed to create IT account" });
    }
  });

  // Update IT account
  app.patch("/api/it/it-accounts/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, email, phone, active, password } = req.body;

      // Verify it's an IT account
      const existingUser = await storage.getUserById(id);
      if (!existingUser || existingUser.restaurantId !== null) {
        return res.status(404).json({ error: "IT account not found" });
      }

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (active !== undefined) updateData.active = active;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.json(existingUser);
      }

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating IT account:", error);
      res.status(500).json({ error: "Failed to update IT account" });
    }
  });

  // Delete IT account
  app.delete("/api/it/it-accounts/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.session.user!.id;

      // Prevent deleting own account
      if (id === currentUserId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Verify it's an IT account
      const existingUser = await storage.getUserById(id);
      if (!existingUser || existingUser.restaurantId !== null) {
        return res.status(404).json({ error: "IT account not found" });
      }

      await db.delete(users).where(eq(users.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting IT account:", error);
      res.status(500).json({ error: "Failed to delete IT account" });
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
  // IT Client Export Routes (IT-only)
  // ==========================================

  // Export client accounts to Excel
  app.get("/api/it/export-clients/excel", requireAuth, requireITAccount, async (req, res) => {
    try {
      console.log("[IT EXPORT] Generating Excel export of client accounts");

      // Get all accounts with restaurant info
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
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(and(
          isNotNull(users.restaurantId),
          ne(restaurants.subscriptionStatus, 'cancelled')
        ));

      // Get all device serial numbers
      const allSerials = await db.select().from(deviceSerialNumbers);

      // Group serials by restaurantId
      const serialsByRestaurant = allSerials.reduce((acc, s) => {
        if (!acc[s.restaurantId]) acc[s.restaurantId] = [];
        acc[s.restaurantId].push(s.serialNumber);
        return acc;
      }, {} as Record<string, string[]>);

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const wsData = [
        ['Account ID', 'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Restaurant ID', 'Restaurant Name', 'Business Type', 'Subscription', 'Created', 'Last Login', 'Device Serial Numbers'],
        ...allAccounts.map(a => [
          a.id,
          a.username,
          a.fullName || '',
          a.email || '',
          a.phone || '',
          a.role || 'user',
          a.active ? 'Active' : 'Inactive',
          a.restaurantId || '',
          a.restaurantName || '',
          a.businessType || '',
          a.subscriptionStatus || '',
          a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
          a.lastLoginAt ? new Date(a.lastLoginAt).toISOString().split('T')[0] : '',
          a.restaurantId ? (serialsByRestaurant[a.restaurantId]?.join(', ') || 'None') : 'None'
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Client Accounts');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`[IT EXPORT] Excel export generated with ${allAccounts.length} accounts`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="client-accounts.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error("[IT EXPORT] Excel export error:", error);
      res.status(500).json({ error: "Failed to generate Excel export" });
    }
  });

  // Export client accounts to PDF
  app.get("/api/it/export-clients/pdf", requireAuth, requireITAccount, async (req, res) => {
    try {
      console.log("[IT EXPORT] Generating PDF export of client accounts");

      // Get all accounts with restaurant info
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
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
        .where(and(
          isNotNull(users.restaurantId),
          ne(restaurants.subscriptionStatus, 'cancelled')
        ));

      // Get all device serial numbers
      const allSerials = await db.select().from(deviceSerialNumbers);

      // Group serials by restaurantId
      const serialsByRestaurant = allSerials.reduce((acc, s) => {
        if (!acc[s.restaurantId]) acc[s.restaurantId] = [];
        acc[s.restaurantId].push(s.serialNumber);
        return acc;
      }, {} as Record<string, string[]>);

      // Create HTML for PDF
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { text-align: center; color: #333; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background: #4a90d9; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .header { text-align: center; margin-bottom: 20px; }
    .date { text-align: right; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BSS Client Accounts Report</h1>
    <p class="date">Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Username</th>
        <th>Full Name</th>
        <th>Restaurant</th>
        <th>Status</th>
        <th>Subscription</th>
        <th>Device Serial Numbers</th>
      </tr>
    </thead>
    <tbody>
      ${allAccounts.map(a => `
        <tr>
          <td>${a.username}</td>
          <td>${a.fullName || '-'}</td>
          <td>${a.restaurantName || '-'}</td>
          <td>${a.active ? 'Active' : 'Inactive'}</td>
          <td>${a.subscriptionStatus || '-'}</td>
          <td>${a.restaurantId ? (serialsByRestaurant[a.restaurantId]?.join(', ') || 'None') : 'None'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
`;

      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setContent(html);
      const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true });
      await browser.close();

      console.log(`[IT EXPORT] PDF export generated with ${allAccounts.length} accounts`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="client-accounts.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[IT EXPORT] PDF export error:", error);
      res.status(500).json({ error: "Failed to generate PDF export" });
    }
  });

  // ==========================================
  // IT Company Files Routes (IT-only)
  // ==========================================

  // Configure multer for company file uploads
  const companyFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'company-files');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'company-' + uniqueSuffix + ext);
    }
  });

  const uploadCompanyFile = multer({
    storage: companyFileStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ['application/pdf'];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF documents are allowed!'));
    }
  });

  // Get all company files
  app.get("/api/it/company-files", requireAuth, requireITAccount, async (req, res) => {
    try {
      const files = await storage.getCompanyFiles();
      res.json(files);
    } catch (error) {
      console.error("[COMPANY FILES] Get files error:", error);
      res.status(500).json({ error: "Failed to get company files" });
    }
  });

  // Upload a company file
  app.post("/api/it/company-files/upload", requireAuth, requireITAccount, uploadCompanyFile.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.session.user!.id;
      const fileType = req.body.fileType;
      const description = req.body.description;

      // Validate file type
      const validTypes = ['cr_certificate', 'vat_certificate', 'license', 'iban_certificate', 'national_address'];
      if (!fileType || !validTypes.includes(fileType)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid file type. Must be one of: " + validTypes.join(', ') });
      }

      // Create new file record
      const fileRecord = await storage.createCompanyFile({
        fileType,
        fileName: req.file.originalname,
        filePath: `uploads/company-files/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
        uploadedBy: userId,
      });

      res.status(201).json(fileRecord);
    } catch (error) {
      console.error("[COMPANY FILES] Upload error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Download a company file
  app.get("/api/it/company-files/:id/download", requireAuth, requireITAccount, async (req, res) => {
    try {
      const file = await storage.getCompanyFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.join(process.cwd(), file.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader('Content-Type', file.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("[COMPANY FILES] Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Delete a company file
  app.delete("/api/it/company-files/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const file = await storage.getCompanyFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record from database
      await storage.deleteCompanyFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("[COMPANY FILES] Delete error:", error);
      res.status(500).json({ error: "Failed to delete file" });
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
        const businessType = rest.businessType as 'restaurant' | 'factory' | 'real_estate';
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
          email: "IT@kinbss.org",
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

  // Get BEP (Break-Even Point) Analysis for BSS
  app.get("/api/it/bss-analysis/bep", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { year } = req.query;
      const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      
      // Get subscription invoices for the selected year
      // Note: All subscription invoices represent COMPLETED PAYMENTS (post-transaction receipts)
      // They are generated after successful payment processing, not before
      const invoices = await db
        .select()
        .from(subscriptionInvoices)
        .orderBy(desc(subscriptionInvoices.invoiceDate));
      
      // Filter by year - all subscription invoices are inherently "paid"
      const yearInvoices = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const invDate = new Date(inv.invoiceDate);
        return invDate >= yearStart && invDate <= yearEnd;
      });
      
      // Get company bills (operating expenses) for the selected year
      const bills = await db
        .select()
        .from(companyBills)
        .orderBy(desc(companyBills.billDate));
      
      const yearBills = bills.filter(b => {
        if (!b.billDate) return false;
        const billDate = new Date(b.billDate);
        // Only include paid bills for accurate fixed cost calculation
        const isPaid = b.status === 'paid';
        return isPaid && billDate >= yearStart && billDate <= yearEnd;
      });
      
      // Get refund invoices for the selected year
      const refunds = await db
        .select()
        .from(refundInvoices)
        .orderBy(desc(refundInvoices.createdAt));
      
      const yearRefunds = refunds.filter(r => {
        if (!r.createdAt) return false;
        const refundDate = new Date(r.createdAt);
        return refundDate >= yearStart && refundDate <= yearEnd;
      });
      
      // Get all users to map userIds to restaurantIds
      const allUsers = await db.select().from(users);
      const userToRestaurantMap = new Map(allUsers.map(u => [u.id, u.restaurantId]));
      
      // Derive unique restaurants from paid invoices in the selected year
      // This ensures revenue and client count are aligned to the same period
      const uniqueRestaurantIdsInYear = new Set(
        yearInvoices
          .map(inv => userToRestaurantMap.get(inv.userId))
          .filter((id): id is string => !!id)
      );
      const clientsInYear = uniqueRestaurantIdsInYear.size;
      
      // Use year-scoped client count for BEP calculation
      const activeClients = clientsInYear;
      
      // Calculate revenue (net after refunds)
      const VAT_RATE = 0.15;
      const grossRevenue = yearInvoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal || "0"), 0);
      const totalRefunds = yearRefunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || "0"), 0);
      const netRefundAmount = totalRefunds / (1 + VAT_RATE);
      const revenue = grossRevenue - netRefundAmount;
      
      // Calculate fixed costs (operating expenses, excluding VAT)
      // Group by bill type for breakdown
      const fixedCostsBreakdown: { category: string; amount: number }[] = [];
      const billsByType: Record<string, number> = {};
      
      for (const bill of yearBills) {
        const billType = bill.billType || 'other';
        const amount = parseFloat(bill.amount || "0"); // Base amount before VAT
        billsByType[billType] = (billsByType[billType] || 0) + amount;
      }
      
      for (const [category, amount] of Object.entries(billsByType)) {
        fixedCostsBreakdown.push({ category, amount });
      }
      
      // Sort breakdown by amount descending
      fixedCostsBreakdown.sort((a, b) => b.amount - a.amount);
      
      const fixedCosts = fixedCostsBreakdown.reduce((sum, item) => sum + item.amount, 0);
      
      // Calculate BEP metrics using active client-based model
      // This approach normalizes for billing cadence differences (weekly/monthly/yearly)
      // The question we answer: "How many active clients do we need to break even this year?"
      
      const totalSubscriptions = yearInvoices.length; // Raw invoice count (for display)
      
      // Average annual revenue per active client normalizes across billing frequencies
      // A monthly client paying 215 SAR * 12 months = same as yearly client paying 2580 SAR
      const avgRevenuePerClient = activeClients > 0 
        ? revenue / activeClients 
        : (totalSubscriptions > 0 ? revenue / totalSubscriptions : 0); // Fallback to invoice-based
      
      // For SaaS model, variable costs per client are minimal (hosting, support)
      const variableCostPerClient = 0; // SaaS model - minimal per-client variable costs
      const totalVariableCosts = variableCostPerClient * activeClients;
      
      // BEP in number of active clients = Fixed Costs / Contribution Margin per Client
      const contributionMarginPerClient = avgRevenuePerClient - variableCostPerClient;
      const bepSubscriptions = contributionMarginPerClient > 0 
        ? Math.ceil(fixedCosts / contributionMarginPerClient) 
        : 0;
      
      // BEP Revenue = BEP Clients * Avg Revenue per Client
      const bepRevenue = bepSubscriptions * avgRevenuePerClient;
      
      // Margin of Safety
      const marginOfSafety = revenue > 0 && bepRevenue > 0
        ? ((revenue - bepRevenue) / revenue) * 100
        : 0;
      
      // Contribution Margin Ratio
      const contributionMarginRatio = avgRevenuePerClient > 0 
        ? contributionMarginPerClient / avgRevenuePerClient 
        : 0;
      
      // Net profit
      const netProfit = revenue - fixedCosts - totalVariableCosts;
      const isProfitable = netProfit > 0;
      
      res.json({
        // Core BEP metrics
        fixedCosts,
        variableCosts: totalVariableCosts,
        revenue,
        netProfit,
        
        // BEP calculations
        bepSubscriptions,
        bepRevenue,
        marginOfSafety,
        isProfitable,
        
        // Unit metrics (using active clients for normalized BEP analysis)
        totalSubscriptions,
        activeClients,
        avgRevenuePerSubscription: avgRevenuePerClient, // Named for UI compatibility
        contributionMarginPerSubscription: contributionMarginPerClient, // Named for UI compatibility
        contributionMarginRatio,
        
        // Breakdown
        fixedCostsBreakdown,
        
        // Period
        year: selectedYear,
      });
    } catch (error) {
      console.error("Error calculating IT BEP metrics:", error);
      res.status(500).json({ error: "Failed to calculate BEP metrics" });
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

      const byType: Record<string, { total: number; active: number; expired: number; cancelled: number; byPlan: Record<string, number> }> = {
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
        real_estate: {
          total: 0,
          active: 0,
          expired: 0,
          cancelled: 0,
          byPlan: { weekly: 0, monthly: 0, yearly: 0 },
        },
      };

      for (const r of allRestaurants) {
        const type = r.businessType as string;
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

  // ============== ZATCA SETTINGS & E-INVOICING ROUTES (IT ONLY) ==============
  
  // Get ZATCA settings (IT only - requires restaurantId in query)
  app.get("/api/zatca/settings", requireAuth, requireITAccount, async (req, res) => {
    try {
      const targetRestaurantId = req.query.restaurantId as string;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in query parameter" });
      }
      
      const settings = await storage.getZatcaSettings(targetRestaurantId);
      if (!settings) {
        return res.json(null);
      }
      
      // Map database field names to frontend field names
      const safeSettings: Record<string, any> = {
        ...settings,
        // Map seller-prefixed fields to short names for frontend
        streetName: settings.sellerStreetName,
        buildingNumber: settings.sellerBuildingNumber,
        citySubdivision: settings.sellerCitySubdivision,
        city: settings.sellerCity,
        postalZone: settings.sellerPostalZone,
        countryCode: settings.csrCountryName,
        crNumber: settings.sellerCrNumber,
        // Mask sensitive values
        privateKey: settings.privateKey ? "[CONFIGURED]" : null,
        complianceCsid: settings.complianceCsid ? "[CONFIGURED]" : null,
        complianceCsidSecret: settings.complianceCsidSecret ? "[CONFIGURED]" : null,
        productionCsid: settings.productionCsid ? "[CONFIGURED]" : null,
        productionCsidSecret: settings.productionCsidSecret ? "[CONFIGURED]" : null,
      };
      
      res.json(safeSettings);
    } catch (error) {
      console.error("Error fetching ZATCA settings:", error);
      res.status(500).json({ error: "Failed to fetch ZATCA settings" });
    }
  });

  // Create or update ZATCA settings (IT only)
  app.post("/api/zatca/settings", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId, ...rawSettingsData } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      
      // Map frontend field names to database column names (seller prefix for address fields)
      const fieldMappings: Record<string, string> = {
        streetName: "sellerStreetName",
        buildingNumber: "sellerBuildingNumber",
        citySubdivision: "sellerCitySubdivision",
        city: "sellerCity",
        postalZone: "sellerPostalZone",
        crNumber: "sellerCrNumber",
        countryCode: "csrCountryName",
      };
      
      // Whitelist only the editable settings fields
      const allowedDbFields = [
        "environment", "isEnabled",
        "csrCommonName", "csrSerialNumber", "csrOrganizationIdentifier",
        "csrOrganizationUnitName", "csrOrganizationName", "csrCountryName",
        "csrInvoiceType", "csrLocationAddress", "csrIndustryBusinessCategory",
        "sellerStreetName", "sellerBuildingNumber", "sellerCitySubdivision",
        "sellerCity", "sellerPostalZone", "sellerCrNumber",
        "privateKey", "complianceCsid", "complianceCsidSecret", "complianceRequestId", "complianceCsidReceivedAt",
        "productionCsid", "productionCsidSecret", "onboardingStatus",
      ];
      
      const settingsData: Record<string, any> = {};
      
      const sensitiveFields = ["privateKey", "complianceCsid", "complianceCsidSecret", "productionCsid", "productionCsidSecret", "complianceRequestId"];
      const dateFields = new Set(["complianceCsidReceivedAt", "csidExpiresAt"]);
      
      const coerceValue = (key: string, value: any) => {
        if (value === null || value === undefined) return value;
        if (dateFields.has(key) && typeof value === "string") {
          const d = new Date(value);
          return isNaN(d.getTime()) ? null : d;
        }
        return value;
      };
      
      // First apply field mappings from frontend names to DB names
      for (const [frontendKey, dbKey] of Object.entries(fieldMappings)) {
        if (frontendKey in rawSettingsData && rawSettingsData[frontendKey] !== undefined) {
          settingsData[dbKey] = coerceValue(dbKey, rawSettingsData[frontendKey]);
        }
      }
      
      // Then copy allowed DB-named fields directly
      for (const key of allowedDbFields) {
        if (key in rawSettingsData && rawSettingsData[key] !== undefined && !(key in settingsData)) {
          if (sensitiveFields.includes(key) && rawSettingsData[key] === "[CONFIGURED]") {
            continue;
          }
          settingsData[key] = coerceValue(key, rawSettingsData[key]);
        }
      }
      
      const existingSettings = await storage.getZatcaSettings(targetRestaurantId);
      
      if (existingSettings) {
        const updated = await storage.updateZatcaSettings(targetRestaurantId, settingsData);
        res.json(updated);
      } else {
        const created = await storage.createZatcaSettings({
          restaurantId: targetRestaurantId,
          environment: settingsData.environment || "sandbox",
          ...settingsData
        });
        res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Error saving ZATCA settings:", error?.message || error);
      res.status(500).json({ error: "Failed to save ZATCA settings", details: error?.message });
    }
  });

  // Generate CSR for ZATCA onboarding (IT only)
  app.post("/api/zatca/generate-csr", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      
      const { generateCSR } = await import("./zatca/crypto");
      const settings = await storage.getZatcaSettings(targetRestaurantId);
      
      if (!settings) {
        return res.status(400).json({ error: "ZATCA settings not configured. Please save settings first." });
      }
      
      const env = (settings.environment || "sandbox") as "sandbox" | "simulation" | "production";
      const { csr, privateKey } = generateCSR(
        settings.csrCommonName || "",
        settings.csrOrganizationName || "",
        settings.csrOrganizationUnitName || "",
        settings.csrCountryName || "SA",
        settings.csrSerialNumber || "",
        settings.csrOrganizationIdentifier || "",
        (settings.csrInvoiceType || "1100") as "1000" | "0100" | "1100",
        settings.csrSerialNumber || "",
        settings.csrOrganizationUnitName || "",
        "BSS",
        env
      );
      
      await storage.updateZatcaSettings(targetRestaurantId, {
        csr,
        privateKey
      });
      
      res.json({ 
        success: true, 
        message: "CSR generated successfully. Ready for ZATCA onboarding." 
      });
    } catch (error: any) {
      console.error("Error generating CSR:", error?.message || error);
      res.status(400).json({ error: error?.message || "Failed to generate CSR" });
    }
  });

  // Onboard to ZATCA (request compliance CSID) - IT only
  app.post("/api/zatca/onboard", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId, otp: rawOtp } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      // Strip ALL whitespace (spaces, tabs, newlines) from OTP — copy/paste from
      // the ZATCA portal often introduces invisible whitespace that ZATCA
      // rejects with "OTP Invalid".
      const otp = String(rawOtp || "").replace(/\s+/g, "");
      if (!otp) {
        return res.status(400).json({ error: "OTP is required" });
      }
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ error: `OTP must be exactly 6 digits. Received "${otp}" (${otp.length} chars). Generate a fresh OTP from fatoora.zatca.gov.sa and paste only the digits.` });
      }
      console.log(`[ZATCA Onboard] OTP received (${otp.length} chars): ${otp.substring(0, 2)}****`);
      
      const settings = await storage.getZatcaSettings(targetRestaurantId);
      if (!settings) {
        return res.status(400).json({ error: "ZATCA settings not configured. Please save settings first." });
      }

      const env = (settings.environment || "sandbox") as "sandbox" | "simulation" | "production";
      console.log(`[ZATCA Onboard] Environment: ${env}`);
      console.log(`[ZATCA Onboard] Settings: CN=${settings.csrCommonName}, O=${settings.csrOrganizationName}, OU=${settings.csrOrganizationUnitName}, VAT=${settings.csrOrganizationIdentifier}, SN=${settings.csrSerialNumber}, InvType=${settings.csrInvoiceType}`);

      const vatNumber = (settings.csrOrganizationIdentifier || "").trim();
      if (!vatNumber) {
        return res.status(400).json({ error: "VAT Number (Organization Identifier) is required. Please enter it in the CSR Configuration tab." });
      }
      if (!/^\d{15}$/.test(vatNumber)) {
        return res.status(400).json({ error: `VAT Number must be exactly 15 digits. Current value "${vatNumber}" has ${vatNumber.replace(/\D/g, "").length} digits.` });
      }
      if (!vatNumber.startsWith("3")) {
        return res.status(400).json({ error: `VAT Number must start with digit 3. Current value starts with "${vatNumber[0]}".` });
      }
      if (!vatNumber.endsWith("3")) {
        return res.status(400).json({ error: `VAT Number must end with digit 3. Current value ends with "${vatNumber[vatNumber.length - 1]}".` });
      }

      if (!settings.csrOrganizationName?.trim()) {
        return res.status(400).json({ error: "Organization Name is required. Please enter it in the CSR Configuration tab." });
      }
      if (!settings.csrCommonName?.trim()) {
        return res.status(400).json({ error: "Common Name (EGS Unit) is required. Please enter it in the CSR Configuration tab." });
      }
      if (!settings.csrSerialNumber?.trim()) {
        return res.status(400).json({ error: "Device Serial Number is required. Please enter it in the CSR Configuration tab." });
      }
      if (!settings.csrOrganizationUnitName?.trim()) {
        return res.status(400).json({ error: "Branch/Unit Name is required. Please enter it in the CSR Configuration tab." });
      }

      console.log(`[ZATCA Onboard] All fields validated. Auto-regenerating CSR before requesting CSID...`);
      const { generateCSR } = await import("./zatca/crypto");
      const { csr: freshCsr, privateKey: freshKey } = generateCSR(
        settings.csrCommonName || "",
        settings.csrOrganizationName || "",
        settings.csrOrganizationUnitName || "",
        settings.csrCountryName || "SA",
        settings.csrSerialNumber || "",
        settings.csrOrganizationIdentifier || "",
        (settings.csrInvoiceType || "1100") as "1000" | "0100" | "1100",
        settings.csrSerialNumber || "",
        settings.csrOrganizationUnitName || "",
        "BSS",
        env
      );

      await storage.updateZatcaSettings(targetRestaurantId, {
        csr: freshCsr,
        privateKey: freshKey
      });
      console.log("[ZATCA Onboard] Fresh CSR saved, length:", freshCsr.length);

      
      const result = await onboardToZatca(targetRestaurantId, otp);
      
      if (result.success) {
        res.json(result);
      } else {
        console.error("[ZATCA Onboard] Failed:", result.message);
        res.status(400).json({ error: result.message, details: (result as any).details });
      }
    } catch (error: any) {
      console.error("Error onboarding to ZATCA:", error?.message || error);
      res.status(400).json({ error: error?.message || "Failed to onboard to ZATCA" });
    }
  });

  // Request production CSID - IT only
  app.post("/api/zatca/production-csid", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId, complianceRequestId } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      if (!complianceRequestId) {
        return res.status(400).json({ error: "Compliance request ID is required" });
      }
      
      
      const result = await getProductionCSID(targetRestaurantId, complianceRequestId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error: any) {
      console.error("Error requesting production CSID:", error?.stack || error);
      res.status(500).json({
        error: error?.message || "Failed to request production CSID",
        stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
      });
    }
  });

  // Reset ZATCA onboarding - IT only (clears corrupted credentials)
  app.post("/api/zatca/reset-onboarding", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }

      const existingSettings = await storage.getZatcaSettings(targetRestaurantId);
      if (!existingSettings) {
        return res.status(404).json({ error: "No ZATCA settings found for this restaurant" });
      }

      await storage.updateZatcaSettings(targetRestaurantId, {
        privateKey: null,
        complianceCsid: null,
        complianceCsidSecret: null,
        complianceRequestId: null,
        complianceCsidReceivedAt: null,
        productionCsid: null,
        productionCsidSecret: null,
        onboardingStatus: "not_started",
        isEnabled: false,
      });

      console.log(`[ZATCA] Onboarding reset for restaurant ${targetRestaurantId}`);
      res.json({ success: true, message: "ZATCA onboarding has been reset. You can now re-run Step 2 to get fresh credentials." });
    } catch (error) {
      console.error("Error resetting ZATCA onboarding:", error);
      res.status(500).json({ error: "Failed to reset ZATCA onboarding" });
    }
  });

  // Get invoice ZATCA status - IT only
  app.get("/api/zatca/invoices", requireAuth, requireITAccount, async (req, res) => {
    try {
      const targetRestaurantId = req.query.restaurantId as string;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in query parameter" });
      }
      
      const { status } = req.query;
      const invoices = await storage.getInvoiceZatcaStatuses(
        targetRestaurantId, 
        status as string | undefined
      );
      
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching ZATCA invoices:", error);
      res.status(500).json({ error: "Failed to fetch ZATCA invoices" });
    }
  });

  // Run ZATCA compliance checks - IT only
  app.post("/api/zatca/compliance-checks", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      
      
      const result = await runComplianceChecks(targetRestaurantId);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error running compliance checks:", error?.stack || error);
      res.status(500).json({
        error: error?.message || "Failed to run compliance checks",
        stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
      });
    }
  });

  // Retry pending invoices - IT only
  app.post("/api/zatca/retry-pending", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      
      
      const result = await retryPendingInvoices(targetRestaurantId);
      
      res.json(result);
    } catch (error) {
      console.error("Error retrying pending invoices:", error);
      res.status(500).json({ error: "Failed to retry pending invoices" });
    }
  });

  // Process invoice for ZATCA (used internally or for testing) - IT only
  app.post("/api/zatca/process-invoice", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { restaurantId: targetRestaurantId, ...invoiceData } = req.body;
      if (!targetRestaurantId) {
        return res.status(400).json({ error: "Restaurant ID required in request body" });
      }
      
      
      const result = await processInvoiceForZatca({
        restaurantId: targetRestaurantId,
        ...invoiceData
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error processing invoice for ZATCA:", error);
      res.status(500).json({ error: "Failed to process invoice for ZATCA" });
    }
  });

  // ==================== CONTRACTS ====================
  app.get("/api/contracts", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const allContracts = await storage.getContracts(restaurantId);
      res.json(allContracts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const contract = await storage.getContract(req.params.id, restaurantId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contracts", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const contract = await storage.createContract(data);
      res.status(201).json(contract);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const contract = await storage.updateContract(req.params.id, restaurantId, data);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteContract(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Contract not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== VALUATIONS ====================
  app.get("/api/valuations", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const allValuations = await storage.getValuations(restaurantId);
      res.json(allValuations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/valuations/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const valuation = await storage.getValuation(req.params.id, restaurantId);
      if (!valuation) return res.status(404).json({ message: "Valuation not found" });
      res.json(valuation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/valuations", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.assessmentDate) data.assessmentDate = new Date(data.assessmentDate);
      const valuation = await storage.createValuation(data);
      res.status(201).json(valuation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/valuations/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.assessmentDate) data.assessmentDate = new Date(data.assessmentDate);
      const valuation = await storage.updateValuation(req.params.id, restaurantId, data);
      if (!valuation) return res.status(404).json({ message: "Valuation not found" });
      res.json(valuation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/valuations/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteValuation(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Valuation not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SERVICE CATALOG ====================
  app.get("/api/service-catalog", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const items = await storage.getServiceCatalogItems(restaurantId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-catalog/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const item = await storage.getServiceCatalogItem(req.params.id, restaurantId);
      if (!item) return res.status(404).json({ message: "Service not found" });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-catalog", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      const item = await storage.createServiceCatalogItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/service-catalog/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const item = await storage.updateServiceCatalogItem(req.params.id, restaurantId, req.body);
      if (!item) return res.status(404).json({ message: "Service not found" });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/service-catalog/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteServiceCatalogItem(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Service not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SERVICE PRODUCTS (bundles) ====================
  app.get("/api/service-products", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const products = await storage.getServiceProducts(restaurantId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-products/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const product = await storage.getServiceProduct(req.params.id, restaurantId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const [items, services, tasks] = await Promise.all([
        storage.getProductItems(req.params.id, restaurantId),
        storage.getProductServiceLinks(req.params.id, restaurantId),
        storage.getProductTasks(req.params.id, restaurantId),
      ]);
      res.json({ ...product, items, services, tasks });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-products", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { items = [], services = [], tasks = [], ...rest } = req.body || {};
      const badSvc = (services as any[]).find((s) => !s?.serviceCatalogId && s?.name && (s.unitPrice == null || s.unitPrice === "" || isNaN(parseFloat(String(s.unitPrice))) || parseFloat(String(s.unitPrice)) <= 0));
      if (badSvc) return res.status(400).json({ message: `Service "${badSvc.name}" needs a unit price greater than 0.` });
      const product = await storage.createServiceProduct({ ...rest, restaurantId });
      await storage.replaceProductChildren(product.id, restaurantId, {
        items: items.map((it: any, idx: number) => ({
          name: String(it.name || ""),
          cost: String(it.cost ?? "0"),
          sellingPrice: String(it.sellingPrice ?? "0"),
          percentage: String(it.percentage ?? "0"),
          sortOrder: idx,
        })).filter((it: any) => it.name),
        services: services.map((s: any, idx: number) => ({
          serviceCatalogId: s.serviceCatalogId ? String(s.serviceCatalogId) : null,
          name: s.name ? String(s.name) : null,
          unitPrice: s.unitPrice != null && s.unitPrice !== "" ? String(s.unitPrice) : null,
          quantity: String(s.quantity ?? "1"),
          sortOrder: idx,
        })).filter((s: any) => s.serviceCatalogId || s.name),
        tasks: tasks.map((tk: any, idx: number) => ({
          name: String(tk.name || ""),
          description: tk.description ? String(tk.description) : null,
          duration: parseInt(String(tk.duration ?? "1"), 10) || 1,
          sortOrder: idx,
        })).filter((tk: any) => tk.name),
      });
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/service-products/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { items, services, tasks, ...rest } = req.body || {};
      const { restaurantId: _omit, id: _id, createdAt: _c, ...safe } = rest;
      if (Array.isArray(services)) {
        const badSvc = (services as any[]).find((s) => !s?.serviceCatalogId && s?.name && (s.unitPrice == null || s.unitPrice === "" || isNaN(parseFloat(String(s.unitPrice))) || parseFloat(String(s.unitPrice)) <= 0));
        if (badSvc) return res.status(400).json({ message: `Service "${badSvc.name}" needs a unit price greater than 0.` });
      }
      const product = await storage.updateServiceProduct(req.params.id, restaurantId, safe);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (Array.isArray(items) || Array.isArray(services) || Array.isArray(tasks)) {
        await storage.replaceProductChildren(req.params.id, restaurantId, {
          items: (items || []).map((it: any, idx: number) => ({
            name: String(it.name || ""),
            cost: String(it.cost ?? "0"),
            sellingPrice: String(it.sellingPrice ?? "0"),
            percentage: String(it.percentage ?? "0"),
            sortOrder: idx,
          })).filter((it: any) => it.name),
          services: (services || []).map((s: any, idx: number) => ({
            serviceCatalogId: s.serviceCatalogId ? String(s.serviceCatalogId) : null,
            name: s.name ? String(s.name) : null,
            unitPrice: s.unitPrice != null && s.unitPrice !== "" ? String(s.unitPrice) : null,
            quantity: String(s.quantity ?? "1"),
            sortOrder: idx,
          })).filter((s: any) => s.serviceCatalogId || s.name),
          tasks: (tasks || []).map((tk: any, idx: number) => ({
            name: String(tk.name || ""),
            description: tk.description ? String(tk.description) : null,
            duration: parseInt(String(tk.duration ?? "1"), 10) || 1,
            sortOrder: idx,
          })).filter((tk: any) => tk.name),
        });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/service-products/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const deleted = await storage.deleteServiceProduct(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Product not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-projects/:id/apply-product", requireAuth, requireRestaurant, requireAction('projects', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { productId } = req.body || {};
      if (!productId) return res.status(400).json({ message: "productId is required" });
      const result = await storage.applyProductToProject(productId, req.params.id, restaurantId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.message?.includes("not found") ? 404 : 500).json({ message: error.message });
    }
  });

  app.get("/api/service-projects/:id/items", requireAuth, requireRestaurant, requirePermission('projects'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const [items, services] = await Promise.all([
        storage.getProjectItems(restaurantId, req.params.id),
        storage.getProjectServices(restaurantId, req.params.id),
      ]);
      res.json({ items, services });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CONTRACTORS ====================
  app.get("/api/contractors", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const allContractors = await storage.getContractors(restaurantId);
      res.json(allContractors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contractors/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const contractor = await storage.getContractor(req.params.id, restaurantId);
      if (!contractor) return res.status(404).json({ message: "Contractor not found" });
      res.json(contractor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contractors", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      const contractor = await storage.createContractor(data);
      res.status(201).json(contractor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/contractors/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const contractor = await storage.updateContractor(req.params.id, restaurantId, req.body);
      if (!contractor) return res.status(404).json({ message: "Contractor not found" });
      res.json(contractor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/contractors/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteContractor(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Contractor not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SERVICE PROJECTS ====================
  app.get("/api/service-projects", requireAuth, requireRestaurant, requirePermission('projects'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projects = await storage.getServiceProjects(restaurantId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-projects/:id", requireAuth, requireRestaurant, requirePermission('projects'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const project = await storage.getServiceProject(req.params.id, restaurantId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-projects", requireAuth, requireRestaurant, requireAction('projects', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = { ...req.body, restaurantId };
      // Decision Center fields are managed exclusively by the dedicated endpoints.
      delete (data as any).approvalStatus;
      delete (data as any).lifecycleStatus;
      delete (data as any).approvedAt;
      delete (data as any).approvedBy;
      delete (data as any).declineReason;
      delete (data as any).customerId;
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const project = await storage.createServiceProject(data);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/service-projects/:id", requireAuth, requireRestaurant, requireAction('projects', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = { ...req.body };
      // Decision Center fields cannot be mutated via the generic PATCH — use
      // /approve, /decline, /lifecycle instead.
      delete (data as any).approvalStatus;
      delete (data as any).lifecycleStatus;
      delete (data as any).approvedAt;
      delete (data as any).approvedBy;
      delete (data as any).declineReason;
      delete (data as any).customerId;
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const project = await storage.updateServiceProject(req.params.id, restaurantId, data);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/service-projects/:id", requireAuth, requireRestaurant, requireAction('projects', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const deleted = await storage.deleteServiceProject(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Project not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROJECT DECISION CENTER ====================
  // Approve: marks project approved, links/creates Customer, generates dossier
  // PDF and attaches it to that customer.
  app.post("/api/service-projects/:id/approve", requireAuth, requireRestaurant, requireAction('projects', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const userId = req.session.user!.id;
      const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
      const generatePdf = req.body?.generatePdf !== false; // default true

      const existing = await storage.getServiceProject(req.params.id, restaurantId);
      if (!existing) return res.status(404).json({ message: "Project not found" });
      if (existing.approvalStatus && existing.approvalStatus !== 'pending') {
        return res.status(400).json({ message: `Project cannot be approved from status "${existing.approvalStatus}"` });
      }

      // Generate the dossier PDF FIRST so approval + document persistence can
      // run atomically in a single transaction inside storage.approveServiceProject.
      // If PDF generation fails, the project remains "pending" and the user can retry.
      let pdfAttachment = null as null | { fileName: string; mimeType: string; contentBase64: string; kind: string };
      if (generatePdf) {
        try {
          const pdf = await buildProjectDossierPdf(req.params.id, restaurantId, lang);
          if (!pdf) {
            return res.status(502).json({
              message: "Dossier PDF could not be generated. Project was NOT approved — please retry.",
            });
          }
          pdfAttachment = {
            fileName: `project-dossier-${existing.projectNumber}.pdf`,
            mimeType: 'application/pdf',
            contentBase64: pdf.buffer.toString('base64'),
            kind: 'agreement',
          };
        } catch (pdfErr: any) {
          console.error("[Approve] PDF generation failed (approval aborted):", pdfErr?.message);
          return res.status(502).json({
            message: `Dossier PDF could not be generated: ${pdfErr?.message || 'unknown error'}. Project was NOT approved — please retry.`,
          });
        }
      }

      const approved = await storage.approveServiceProject(req.params.id, restaurantId, userId, pdfAttachment);
      if (!approved) return res.status(404).json({ message: "Project not found" });

      res.json({ project: approved.project, customer: approved.customer, document: approved.document });
    } catch (error: any) {
      console.error("Approve project error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-projects/:id/decline", requireAuth, requireRestaurant, requireAction('projects', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return res.status(400).json({ message: "Reason is required" });
      const project = await storage.declineServiceProject(req.params.id, restaurantId, reason);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/service-projects/:id/lifecycle", requireAuth, requireRestaurant, requireAction('projects', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const to = req.body?.to;
      if (to !== 'in_progress' && to !== 'finished') {
        return res.status(400).json({ message: "Invalid lifecycle target" });
      }
      const project = await storage.setServiceProjectLifecycle(req.params.id, restaurantId, to);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Customer-side reads for Decision Center linkage
  app.get("/api/customers/:id/projects", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const customer = await storage.getCustomer(req.params.id, restaurantId);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      const projects = await storage.getServiceProjectsForCustomer(restaurantId, req.params.id);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/:id/documents", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const customer = await storage.getCustomer(req.params.id, restaurantId);
      if (!customer) return res.status(404).json({ error: "Customer not found" });

      const stored = await storage.getCustomerDocuments(restaurantId, req.params.id);
      // Don't ship the full base64 content in the list response.
      const storedList = stored.map(d => ({
        id: d.id, customerId: d.customerId, projectId: d.projectId, kind: d.kind,
        fileName: d.fileName, mimeType: d.mimeType, createdAt: d.createdAt, source: 'stored' as const,
      }));

      // Add synthetic "live" entries for each linked project so the dossier
      // (and quotation/agreement) always reflect the current project state
      // — same PDFs as the project detail page. Only include entries the
      // caller can actually download (their downstream endpoints require
      // 'projects' / 'quotations' permissions).
      const user = req.session.user!;
      const canProjects = hasAnyPermission(user.permissions, user.role, 'projects' as any);
      const canQuotations = hasAnyPermission(user.permissions, user.role, 'quotations' as any);
      const projects = await storage.getServiceProjectsForCustomer(restaurantId, req.params.id);
      const allQuotations = (projects.length && canQuotations) ? await storage.getQuotations(restaurantId) : [];
      const liveList: any[] = [];
      for (const p of projects) {
        if (canProjects) {
          liveList.push({
            id: `live:dossier:${p.id}`,
            customerId: req.params.id,
            projectId: p.id,
            kind: 'dossier',
            fileName: `project-dossier-${p.projectNumber}.pdf`,
            mimeType: 'application/pdf',
            createdAt: p.updatedAt || p.createdAt,
            source: 'live' as const,
            projectName: p.name,
            projectNumber: p.projectNumber,
          });
          liveList.push({
            id: `live:agreement:${p.id}`,
            customerId: req.params.id,
            projectId: p.id,
            kind: 'agreement',
            fileName: `project-agreement-${p.projectNumber}.pdf`,
            mimeType: 'application/pdf',
            createdAt: p.updatedAt || p.createdAt,
            source: 'live' as const,
            projectName: p.name,
            projectNumber: p.projectNumber,
          });
        }
        for (const q of allQuotations.filter(q => q.projectId === p.id)) {
          liveList.push({
            id: `live:quotation:${q.id}`,
            customerId: req.params.id,
            projectId: p.id,
            kind: 'quotation',
            fileName: `quotation-${q.quotationNumber}.pdf`,
            mimeType: 'application/pdf',
            createdAt: q.createdAt,
            source: 'live' as const,
            projectName: p.name,
            projectNumber: p.projectNumber,
          });
        }
      }
      // Live entries first so users see the up-to-date dossier on top
      res.json([...liveList, ...storedList]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customer-documents/:id/download", requireAuth, requireRestaurant, requirePermission('customers'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const id = req.params.id;

      // Synthetic "live" docs proxy to the live project PDF builders so the
      // customer-side download is always the same as the project detail page.
      if (id.startsWith('live:')) {
        const parts = id.split(':');
        const kind = parts[1];
        const refId = parts.slice(2).join(':');
        const lang = req.query.lang === 'ar' ? 'ar' : 'en';
        if (kind === 'dossier') {
          const project = await storage.getServiceProject(refId, restaurantId);
          if (!project) return res.status(404).json({ error: "Project not found" });
          const result = await buildProjectDossierPdf(refId, restaurantId, lang);
          if (!result) return res.status(404).json({ error: "Dossier unavailable" });
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="project-dossier-${project.projectNumber}.pdf"`);
          return res.send(result.buffer);
        }
        if (kind === 'agreement') {
          // Reuse the agreement endpoint by issuing an internal redirect.
          const project = await storage.getServiceProject(refId, restaurantId);
          if (!project) return res.status(404).json({ error: "Project not found" });
          return res.redirect(`/api/service-projects/${refId}/agreement-pdf?lang=${lang}`);
        }
        if (kind === 'quotation') {
          const quotation = await storage.getQuotation(refId, restaurantId);
          if (!quotation) return res.status(404).json({ error: "Quotation not found" });
          return res.redirect(`/api/quotations/${refId}/download-pdf?lang=${lang}`);
        }
        return res.status(400).json({ error: "Unknown live document type" });
      }

      const doc = await storage.getCustomerDocument(id, restaurantId);
      if (!doc) return res.status(404).json({ error: "Document not found" });
      const buf = Buffer.from(doc.contentBase64, 'base64');
      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName.replace(/"/g, '')}"`);
      res.send(buf);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== QUOTATIONS ====================
  app.get("/api/quotations", requireAuth, requireRestaurant, requirePermission('quotations'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const allQuotations = await storage.getQuotations(restaurantId);
      res.json(allQuotations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quotations/:id", requireAuth, requireRestaurant, requirePermission('quotations'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const quotation = await storage.getQuotation(req.params.id, restaurantId);
      if (!quotation) return res.status(404).json({ message: "Quotation not found" });
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotations", requireAuth, requireRestaurant, requireAction('quotations', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.validUntil) data.validUntil = new Date(data.validUntil);
      const quotation = await storage.createQuotation(data);
      res.status(201).json(quotation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/quotations/:id", requireAuth, requireRestaurant, requireAction('quotations', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.validUntil) data.validUntil = new Date(data.validUntil);
      const quotation = await storage.updateQuotation(req.params.id, restaurantId, data);
      if (!quotation) return res.status(404).json({ message: "Quotation not found" });
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/quotations/:id", requireAuth, requireRestaurant, requireAction('quotations', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteQuotation(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Quotation not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PAYMENT SCHEDULES ====================
  app.get("/api/payment-schedules", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projectId = req.query.projectId as string | undefined;
      const schedules = await storage.getPaymentSchedules(restaurantId, projectId);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payment-schedules", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.paidDate) data.paidDate = new Date(data.paidDate);
      const schedule = await storage.createPaymentSchedule(data);
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/payment-schedules/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.paidDate) data.paidDate = new Date(data.paidDate);
      const existing = await storage.getPaymentSchedule(req.params.id, restaurantId);
      const schedule = await storage.updatePaymentSchedule(req.params.id, restaurantId, data);
      if (!schedule) return res.status(404).json({ message: "Payment schedule not found" });

      // When transitioning to "paid", create a transaction + ZATCA invoice so the
      // payment shows up in dashboard, sales tracking and financial statements.
      const becamePaid = schedule.status === 'paid' && existing?.status !== 'paid' && !schedule.invoiceId;
      if (becamePaid) {
        try {
          const total = parseFloat(schedule.amount || '0');
          if (total > 0) {
            const project = await storage.getServiceProject(schedule.projectId, restaurantId);
            const subtotal = total / 1.15;
            const tax = total - subtotal;
            const txnId = `PRJ-${(project?.projectNumber || 'X')}-${schedule.id.substring(0, 8)}-${Date.now()}`;

            const txn = await storage.createTransaction({
              restaurantId,
              transactionId: txnId,
              itemCount: 1,
              subtotal: subtotal.toFixed(2),
              tax: tax.toFixed(2),
              total: total.toFixed(2),
              paymentMethod: 'Project Payment',
            });

            const invoiceNumber = `PRJ-${(project?.projectNumber || 'X')}-${schedule.id.substring(0, 8)}`;
            const customerName = project?.clientName || schedule.milestoneName;
            const itemName = `${project?.name ? project.name + ' - ' : ''}${schedule.milestoneName}`;
            const invoice = await storage.createInvoice({
              restaurantId,
              invoiceNumber,
              invoiceType: 'simplified',
              transactionId: txn.id,
              customerName,
              items: [{
                name: itemName,
                quantity: 1,
                basePrice: parseFloat(subtotal.toFixed(2)),
                vatAmount: parseFloat(tax.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
              }],
              subtotal: subtotal.toFixed(2),
              vatAmount: tax.toFixed(2),
              total: total.toFixed(2),
            } as any);

            const finalSchedule = await storage.updatePaymentSchedule(req.params.id, restaurantId, {
              invoiceId: invoice.id,
              transactionId: txn.id,
            } as any);
            return res.json(finalSchedule || schedule);
          }
        } catch (err: any) {
          console.error("[PaymentSchedule] Failed to create transaction/invoice on paid:", err);
        }
      }
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/payment-schedules/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deletePaymentSchedule(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Payment schedule not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payment-schedules/:id/send-email", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const schedule = await storage.getPaymentSchedule(req.params.id, restaurantId);
      if (!schedule) return res.status(404).json({ message: "Payment schedule not found" });
      if (!schedule.invoiceId) return res.status(400).json({ message: "No invoice generated yet for this payment" });

      const project = await storage.getServiceProject(schedule.projectId, restaurantId);
      const toEmail: string | undefined = (req.body?.email as string | undefined) || project?.clientEmail || undefined;
      if (!toEmail) return res.status(400).json({ message: "Client email is not set" });

      const invoice = await storage.getInvoice(schedule.invoiceId, restaurantId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      // Resolve PDF bytes — reuse on-disk PDF or regenerate via ZATCA pipeline
      let pdfBuffer: Buffer | null = null;
      if (invoice.pdfPath) {
        const relativePath = invoice.pdfPath.replace(/^\/+/, '');
        const filePath = path.normalize(path.join(process.cwd(), 'public', relativePath));
        if (fs.existsSync(filePath)) {
          pdfBuffer = fs.readFileSync(filePath);
        }
      }
      if (!pdfBuffer) {
        const settings = await storage.getSettings(restaurantId);
        const order = invoice.orderId ? await storage.getOrder(invoice.orderId, restaurantId) : null;
        const branch = invoice.branchId ? await storage.getBranch(invoice.branchId, restaurantId) : null;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const pdfData: any = {
          order: order || {
            orderNumber: invoice.invoiceNumber,
            items: invoice.items,
            subtotal: invoice.subtotal,
            tax: invoice.vatAmount,
            total: invoice.total,
            customerName: invoice.customerName || project?.clientName || "Customer",
            createdAt: invoice.createdAt,
          },
          companyName: settings?.restaurantName || "Business",
          companyVAT: settings?.vatNumber || "",
          branchAddress: branch?.location || settings?.address || "",
          companyEmail: settings?.email || "",
          companyPhone: settings?.phone || "",
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: new Date(invoice.createdAt),
          invoiceId: invoice.id,
          baseUrl,
          logoPath: settings?.logoPath || undefined,
          invoiceType: invoice.invoiceType as "simplified" | "standard",
          customerVatNumber: invoice.customerVatNumber || undefined,
        };
        const result = await generateZATCAInvoice(pdfData);
        pdfBuffer = result.pdfBuffer;
        try {
          const invoicesDir = path.join(process.cwd(), "public", "invoices");
          if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
          const pdfFilename = `${invoice.invoiceNumber}.pdf`;
          fs.writeFileSync(path.join(invoicesDir, pdfFilename), pdfBuffer);
          await storage.updateInvoice(invoice.id, restaurantId, { pdfPath: `/invoices/${pdfFilename}` });
        } catch {}
      }

      const clientName = project?.clientName || invoice.customerName || "Customer";
      const subject = `Invoice ${invoice.invoiceNumber} — ${project?.name || schedule.milestoneName}`;
      const html = `<p>Dear ${escapeHtml(clientName)},</p><p>Please find attached your invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> for <strong>${escapeHtml(schedule.milestoneName)}</strong> (amount: ${escapeHtml(String(schedule.amount))} SAR).</p><p>Thank you for your business.</p>`;
      const text = `Invoice ${invoice.invoiceNumber}\nMilestone: ${schedule.milestoneName}\nAmount: ${schedule.amount} SAR\n\nPlease find attached.`;

      let sent = false;
      let sendError: string | undefined;
      try {
        const { Resend } = await import('resend');
        let apiKey: string | undefined;
        let fromEmail: string | undefined;
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY
          ? 'repl ' + process.env.REPL_IDENTITY
          : process.env.WEB_REPL_RENEWAL
          ? 'depl ' + process.env.WEB_REPL_RENEWAL
          : null;
        if (xReplitToken && hostname) {
          const r = await fetch(
            'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
            { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } as any }
          );
          const data = await r.json();
          const s = data.items?.[0]?.settings;
          if (s?.api_key) { apiKey = s.api_key; fromEmail = s.from_email; }
        }
        if (!apiKey) apiKey = process.env.RESEND_API_KEY;
        if (!fromEmail) fromEmail = process.env.EMAIL_FROM || process.env.IT_EMAIL || 'IT@kinbss.org';
        if (apiKey) {
          const resend = new Resend(apiKey);
          const data: any = await resend.emails.send({
            from: fromEmail!,
            to: toEmail,
            subject,
            html,
            text,
            attachments: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: Buffer.from(pdfBuffer) }],
          });
          if (data?.error) sendError = data.error.message; else sent = true;
        }
      } catch (e: any) {
        sendError = e.message;
      }

      if (!sent) {
        const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        if (!hasSmtp) {
          return res.status(500).json({ message: sendError || 'No email provider is configured. Please set RESEND_API_KEY or SMTP credentials.' });
        }
        const { sendGenericEmail } = await import('./emailService');
        const result = await sendGenericEmail({
          to: toEmail, subject, html, text,
          attachments: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: Buffer.from(pdfBuffer), contentType: 'application/pdf' }],
        });
        if (!result.ok) return res.status(500).json({ message: sendError || result.error || 'Failed to send email' });
      }
      res.json({ success: true, to: toEmail });
    } catch (error: any) {
      console.error("[PaymentSchedule] send-email error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROJECT SERVICES ====================
  app.get("/api/project-services", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projectId = req.query.projectId as string;
      if (!projectId) return res.status(400).json({ message: "projectId is required" });
      const services = await storage.getProjectServices(restaurantId, projectId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/project-services", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      const service = await storage.createProjectService(data);
      res.status(201).json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/project-services/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      const service = await storage.updateProjectService(req.params.id, restaurantId, data);
      if (!service) return res.status(404).json({ message: "Project service not found" });
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/project-services/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteProjectService(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Project service not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROJECT BILLS ====================
  app.get("/api/project-bills", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projectId = req.query.projectId as string;
      if (!projectId) return res.status(400).json({ message: "projectId is required" });
      const bills = await storage.getProjectBills(restaurantId, projectId);
      res.json(bills);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/project-bills", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.billDate) data.billDate = new Date(data.billDate);
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.paidDate) data.paidDate = new Date(data.paidDate);
      const bill = await storage.createProjectBill(data);
      res.status(201).json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/project-bills/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.billDate) data.billDate = new Date(data.billDate);
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.paidDate) data.paidDate = new Date(data.paidDate);
      const bill = await storage.updateProjectBill(req.params.id, restaurantId, data);
      if (!bill) return res.status(404).json({ message: "Project bill not found" });
      res.json(bill);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/project-bills/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteProjectBill(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Project bill not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROJECT PROCUREMENTS ====================
  app.get("/api/project-procurements", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projectId = req.query.projectId as string;
      if (!projectId) return res.status(400).json({ message: "projectId is required" });
      const procurements = await storage.getProjectProcurements(restaurantId, projectId);
      res.json(procurements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/project-procurements", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
      if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
      const procurement = await storage.createProjectProcurement(data);
      res.status(201).json(procurement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/project-procurements/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
      if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
      const procurement = await storage.updateProjectProcurement(req.params.id, restaurantId, data);
      if (!procurement) return res.status(404).json({ message: "Project procurement not found" });
      res.json(procurement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/project-procurements/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteProjectProcurement(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Project procurement not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROJECT TASKS ====================
  app.get("/api/project-tasks", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const projectId = req.query.projectId as string;
      const tasks = projectId
        ? await storage.getProjectTasks(restaurantId, projectId)
        : await storage.getAllProjectTasks(restaurantId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/project-tasks", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const task = await storage.createProjectTask(data);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/project-tasks/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const task = await storage.updateProjectTask(req.params.id, restaurantId, data);
      if (!task) return res.status(404).json({ message: "Project task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/project-tasks/:id", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const deleted = await storage.deleteProjectTask(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Project task not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CPM ALGORITHM ====================
  app.post("/api/project-tasks/calculate-cpm", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const { projectId } = req.body;
      if (!projectId) return res.status(400).json({ message: "projectId is required" });

      const tasks = await storage.getProjectTasks(restaurantId, projectId);
      if (tasks.length === 0) return res.json([]);

      const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));

      for (const task of tasks) {
        const deps = (task.dependencies || []).filter(d => taskMap.has(d));
        const earlyStart = deps.length === 0 ? 0 : Math.max(...deps.map(d => taskMap.get(d)!.earlyFinish || 0));
        const earlyFinish = earlyStart + task.duration;
        taskMap.get(task.id)!.earlyStart = earlyStart;
        taskMap.get(task.id)!.earlyFinish = earlyFinish;
      }

      const projectDuration = Math.max(...Array.from(taskMap.values()).map(t => t.earlyFinish || 0));

      const reverseTasks = [...tasks].reverse();
      for (const task of reverseTasks) {
        const successors = tasks.filter(t => (t.dependencies || []).includes(task.id));
        const lateFinish = successors.length === 0 ? projectDuration : Math.min(...successors.map(s => taskMap.get(s.id)!.lateStart || projectDuration));
        const lateStart = lateFinish - task.duration;
        const slack = lateStart - (taskMap.get(task.id)!.earlyStart || 0);
        taskMap.get(task.id)!.lateStart = lateStart;
        taskMap.get(task.id)!.lateFinish = lateFinish;
        taskMap.get(task.id)!.slack = slack;
        taskMap.get(task.id)!.isCritical = slack === 0;
      }

      const updatedTasks = Array.from(taskMap.values());
      for (const t of updatedTasks) {
        await storage.updateProjectTask(t.id, restaurantId, {
          earlyStart: t.earlyStart,
          earlyFinish: t.earlyFinish,
          lateStart: t.lateStart,
          lateFinish: t.lateFinish,
          slack: t.slack,
          isCritical: t.isCritical,
        });
      }

      res.json(updatedTasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== QUOTATION DECISIONS ====================
  app.get("/api/quotation-decisions", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const quotationId = req.query.quotationId as string;
      if (!quotationId) return res.status(400).json({ message: "quotationId is required" });
      const decisions = await storage.getQuotationDecisions(restaurantId, quotationId);
      res.json(decisions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotation-decisions", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const data = { ...req.body, restaurantId };
      if (data.decidedAt) data.decidedAt = new Date(data.decidedAt);
      const decision = await storage.createQuotationDecision(data);
      res.status(201).json(decision);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PAYMENT SCHEDULE AUTO-GENERATE ====================
  app.post("/api/payment-schedules/auto-generate", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const { projectId, installments } = req.body;
      if (!projectId || !installments || installments < 1) {
        return res.status(400).json({ message: "projectId and installments (>= 1) are required" });
      }

      const services = await storage.getProjectServices(restaurantId, projectId);
      const total = services.reduce((sum, s) => sum + parseFloat(String(s.totalPrice || "0")), 0);
      if (total <= 0) return res.status(400).json({ message: "No services found or total is zero" });

      const perInstallment = Math.round((total / installments) * 100) / 100;
      const schedules = [];
      for (let i = 0; i < installments; i++) {
        const amount = i === installments - 1 ? Math.round((total - perInstallment * (installments - 1)) * 100) / 100 : perInstallment;
        const schedule = await storage.createPaymentSchedule({
          restaurantId,
          projectId,
          milestoneName: `Installment ${i + 1}`,
          amount: String(amount),
          status: "pending",
        });
        schedules.push(schedule);
      }

      res.status(201).json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const settings = await storage.getCompanySettings(restaurantId);
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      
      const allowedFields = ['companyName', 'companyEmail', 'companyPhone', 'companyAddress', 'companyLogo', 'agreementTemplate', 'agreementPlaceholders', 'termsAndConditions', 'companyDocuments'];
      const sanitized: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          sanitized[key] = req.body[key];
        }
      }
      
      const settings = await storage.upsertCompanySettings(restaurantId, sanitized);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/company-settings/documents", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      
      const { name, type, content, size } = req.body;
      if (!name || !content) return res.status(400).json({ message: "Name and content required" });
      if (size && size > 10 * 1024 * 1024) return res.status(400).json({ message: "File too large (max 10MB)" });
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (type && !allowedMimeTypes.includes(type)) return res.status(400).json({ message: "Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP" });
      const contentLength = typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : 0;
      if (contentLength > 15 * 1024 * 1024) return res.status(400).json({ message: "Content too large" });
      
      const settings = await storage.getCompanySettings(restaurantId);
      const documents = Array.isArray(settings?.companyDocuments) ? [...settings.companyDocuments as any[]] : [];
      const newDoc = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        name,
        type: type || 'application/octet-stream',
        size: size || 0,
        content,
        uploadedAt: new Date().toISOString(),
      };
      documents.push(newDoc);
      
      await storage.upsertCompanySettings(restaurantId, { companyDocuments: documents });
      res.json(newDoc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/company-settings/documents/:docId", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      
      const settings = await storage.getCompanySettings(restaurantId);
      const documents = Array.isArray(settings?.companyDocuments) ? (settings.companyDocuments as any[]) : [];
      const filtered = documents.filter((d: any) => d.id !== req.params.docId);
      
      await storage.upsertCompanySettings(restaurantId, { companyDocuments: filtered });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  function escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  app.get("/api/quotations/:id/download-pdf", requireAuth, requireRestaurant, requirePermission('quotations'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });

      const lang = req.query.lang === 'ar' ? 'ar' : 'en';
      const isAr = lang === 'ar';
      const dir = isAr ? 'rtl' : 'ltr';
      const align = isAr ? 'right' : 'left';

      const quotation = await storage.getQuotation(req.params.id, restaurantId);
      if (!quotation) return res.status(404).json({ message: "Quotation not found" });
      
      const companyInfo = await storage.getCompanySettings(restaurantId);
      
      const items = Array.isArray(quotation.items) ? quotation.items : [];
      const itemRows = items.map((item: any, idx: number) => `
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td style="text-align:center">${item.quantity || 1}</td>
          <td style="text-align:right">${parseFloat(item.unitPrice || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</td>
          <td style="text-align:right">${parseFloat(item.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
            body { font-family: ${isAr ? "'Noto Naskh Arabic','Amiri',Arial,sans-serif" : "Arial, sans-serif"}; padding: 40px; font-size: 12px; color: #333; direction: ${dir}; text-align: ${align}; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { max-width: 50%; }
            .company-info h1 { color: #1a365d; margin: 0; font-size: 24px; }
            .company-info p { margin: 3px 0; color: #666; font-size: 11px; }
            .quotation-info { text-align: right; }
            .quotation-info h2 { color: #1a365d; margin: 0; font-size: 28px; text-transform: uppercase; }
            .quotation-info p { margin: 3px 0; color: #666; }
            .client-section { background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 25px; }
            .client-section h3 { color: #1a365d; margin: 0 0 8px 0; font-size: 14px; }
            .client-section p { margin: 3px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #1a365d; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .totals { margin-top: 20px; text-align: right; }
            .totals-row { display: flex; justify-content: flex-end; gap: 40px; padding: 5px 0; font-size: 13px; }
            .totals-row.grand { font-size: 16px; font-weight: bold; color: #1a365d; border-top: 2px solid #1a365d; padding-top: 10px; margin-top: 10px; }
            .terms { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .terms h3 { color: #1a365d; font-size: 14px; }
            .terms p { font-size: 11px; color: #666; line-height: 1.6; }
            .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #999; font-size: 10px; }
            .ar { font-family: 'Amiri', serif; direction: rtl; text-align: right; }
            .validity { background: #fef3c7; padding: 10px 15px; border-radius: 6px; margin: 20px 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${escapeHtml(companyInfo?.companyName) || 'Company Name'}</h1>
              ${companyInfo?.companyAddress ? `<p>${escapeHtml(companyInfo.companyAddress)}</p>` : ''}
              ${companyInfo?.companyPhone ? `<p>Tel: ${escapeHtml(companyInfo.companyPhone)}</p>` : ''}
              ${companyInfo?.companyEmail ? `<p>Email: ${escapeHtml(companyInfo.companyEmail)}</p>` : ''}
            </div>
            <div class="quotation-info">
              <h2>Quotation</h2>
              <p class="ar">عرض سعر</p>
              <p><strong>${escapeHtml(quotation.quotationNumber)}</strong></p>
              <p>Date: ${new Date(quotation.createdAt).toLocaleDateString('en-GB')}</p>
              <p>Status: ${quotation.status.toUpperCase()}</p>
            </div>
          </div>

          <div class="client-section">
            <h3>Client / العميل</h3>
            <p><strong>${escapeHtml(quotation.clientName)}</strong></p>
            ${quotation.clientPhone ? `<p>Phone: ${escapeHtml(quotation.clientPhone)}</p>` : ''}
            ${quotation.clientEmail ? `<p>Email: ${escapeHtml(quotation.clientEmail)}</p>` : ''}
          </div>

          ${quotation.description ? `<p style="margin-bottom:20px;">${escapeHtml(quotation.description)}</p>` : ''}

          <table>
            <thead>
              <tr>
                <th style="width:50px;text-align:center">#</th>
                <th>Description / الوصف</th>
                <th style="width:80px;text-align:center">Qty / الكمية</th>
                <th style="width:120px;text-align:right">Unit Price / سعر الوحدة</th>
                <th style="width:120px;text-align:right">Total / المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || '<tr><td colspan="5" style="text-align:center">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row"><span>Subtotal / المجموع الفرعي:</span><span>${parseFloat(quotation.subtotal || '0').toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</span></div>
            <div class="totals-row"><span>VAT ${quotation.vatRate || '15'}% / ضريبة القيمة المضافة:</span><span>${parseFloat(quotation.vatAmount || '0').toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</span></div>
            <div class="totals-row grand"><span>Total / الإجمالي:</span><span>${parseFloat(quotation.totalAmount || '0').toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</span></div>
          </div>

          ${quotation.validUntil ? `<div class="validity">Valid Until / صالح حتى: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}</div>` : ''}

          ${quotation.notes ? `<div class="terms"><h3>Notes / ملاحظات</h3><p>${escapeHtml(quotation.notes)}</p></div>` : ''}

          <div class="footer">
            <p>${escapeHtml(companyInfo?.companyName) || 'Company'} - All Rights Reserved</p>
            <p>Generated on ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </body>
        </html>
      `;

      const puppeteer = await import("puppeteer");
      const { execSync } = await import("child_process");
      const { existsSync } = await import("fs");
      
      let chromiumPath: string | undefined = undefined;
      try {
        chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
        if (!chromiumPath || !existsSync(chromiumPath)) chromiumPath = undefined;
      } catch (e) {}
      
      const browser = await puppeteer.default.launch({
        headless: true,
        executablePath: chromiumPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfData = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }, printBackground: true });
      await browser.close();
      const pdfBuffer = Buffer.from(pdfData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Quotation PDF error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Shared helper: builds the project Dossier PDF as a Buffer so both the
  // download route and the Decision Center approve flow can reuse it.
  async function buildProjectDossierPdf(
    projectId: string,
    restaurantId: string,
    lang: 'en' | 'ar',
  ): Promise<{ project: any; buffer: Buffer } | null> {
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';

    const project = await storage.getServiceProject(projectId, restaurantId);
    if (!project) return null;

    const companyInfo = await storage.getCompanySettings(restaurantId);
    const services = await storage.getProjectServices(restaurantId, project.id);
    const bills = await storage.getProjectBills(restaurantId, project.id);
    const procurements = await storage.getProjectProcurements(restaurantId, project.id);
    const tasks = await storage.getProjectTasks(restaurantId, project.id);
    const schedules = await storage.getPaymentSchedules(restaurantId, project.id);

    const totalServices = services.reduce((s, svc) => s + parseFloat(svc.totalPrice || '0'), 0);
    const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount || '0'), 0);
    const totalProcurements = procurements.reduce((s, p) => s + parseFloat(p.totalPrice || '0'), 0);
    const totalPaid = schedules.filter(s => s.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
    const totalScheduled = schedules.reduce((s, p) => s + parseFloat(p.amount || '0'), 0);

    const serviceRows = services.map((svc, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(svc.name)}</td>
          <td>${escapeHtml(svc.pricingMethod)}</td>
          <td style="text-align:right">${parseFloat(svc.unitPrice || '0').toFixed(2)}</td>
          <td style="text-align:center">${svc.quantity}</td>
          <td style="text-align:right">${parseFloat(svc.totalPrice || '0').toFixed(2)} SAR</td>
        </tr>`).join('');
    const billRows = bills.map((b, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(b.description)}</td>
          <td>${escapeHtml(b.vendor || '-')}</td>
          <td style="text-align:right">${parseFloat(b.amount || '0').toFixed(2)} SAR</td>
          <td>${escapeHtml(b.status)}</td>
        </tr>`).join('');
    const procurementRows = procurements.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(p.itemName)}</td>
          <td>${escapeHtml(p.vendor || '-')}</td>
          <td style="text-align:center">${p.quantity}</td>
          <td style="text-align:right">${parseFloat(p.totalPrice || '0').toFixed(2)} SAR</td>
          <td>${escapeHtml(p.status)}</td>
        </tr>`).join('');
    const taskRows = tasks.map((t, idx) => `
        <tr style="${t.isCritical ? 'background:#fef2f2;' : ''}">
          <td>${idx + 1}</td>
          <td>${escapeHtml(t.name)}${t.isCritical ? ' ⚠' : ''}</td>
          <td style="text-align:center">${t.duration} days</td>
          <td>${escapeHtml(t.status)}</td>
          <td style="text-align:center">${t.slack ?? '-'}</td>
        </tr>`).join('');
    const scheduleRows = schedules.map((s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(s.milestoneName)}</td>
          <td style="text-align:right">${parseFloat(s.amount || '0').toFixed(2)} SAR</td>
          <td>${s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-GB') : '-'}</td>
          <td>${escapeHtml(s.status)}</td>
        </tr>`).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
            body { font-family: ${isAr ? "'Noto Naskh Arabic','Amiri',Arial,sans-serif" : "Arial, sans-serif"}; padding: 30px; font-size: 11px; color: #333; direction: ${dir}; text-align: ${align}; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a365d; padding-bottom: 15px; margin-bottom: 20px; }
            .company-info h1 { color: #1a365d; margin: 0; font-size: 22px; }
            .company-info p { margin: 2px 0; color: #666; font-size: 10px; }
            .dossier-title { text-align: right; }
            .dossier-title h2 { color: #1a365d; margin: 0; font-size: 24px; }
            .dossier-title p { margin: 2px 0; color: #666; }
            .ar { font-family: 'Amiri', serif; direction: rtl; }
            .project-info { background: #f0f4f8; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
            .project-info h3 { color: #1a365d; margin: 0 0 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .info-item { font-size: 11px; }
            .info-item span { color: #666; }
            .section { margin: 25px 0; page-break-inside: avoid; }
            .section h3 { color: #1a365d; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
            th { background: #1a365d; color: white; padding: 8px; text-align: left; font-size: 10px; }
            td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .summary-box { background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .summary-item { text-align: center; }
            .summary-item .label { font-size: 10px; color: #666; }
            .summary-item .value { font-size: 16px; font-weight: bold; color: #1a365d; }
            .total-row { font-weight: bold; background: #f0f4f8 !important; }
            .footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #999; font-size: 9px; }
            .critical { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${escapeHtml(companyInfo?.companyName) || 'Company Name'}</h1>
              ${companyInfo?.companyAddress ? `<p>${escapeHtml(companyInfo.companyAddress)}</p>` : ''}
              ${companyInfo?.companyPhone ? `<p>Tel: ${escapeHtml(companyInfo.companyPhone)}</p>` : ''}
              ${companyInfo?.companyEmail ? `<p>Email: ${escapeHtml(companyInfo.companyEmail)}</p>` : ''}
            </div>
            <div class="dossier-title">
              <h2>Project Dossier</h2>
              <p class="ar">ملف المشروع</p>
              <p>${escapeHtml(project.projectNumber)}</p>
              <p>${new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div class="project-info">
            <h3>${escapeHtml(project.name)}</h3>
            <div class="info-grid">
              <div class="info-item"><span>Client / العميل:</span> ${escapeHtml(project.clientName)}</div>
              ${project.clientLegalRepresentative ? `<div class="info-item"><span>Representative / الممثل:</span> ${escapeHtml(project.clientLegalRepresentative)}</div>` : ''}
              ${project.clientCrNumber ? `<div class="info-item"><span>CR / ID:</span> ${escapeHtml(project.clientCrNumber)}</div>` : ''}
              ${project.clientVatNumber ? `<div class="info-item"><span>VAT No:</span> ${escapeHtml(project.clientVatNumber)}</div>` : ''}
              ${project.clientPhone ? `<div class="info-item"><span>Phone:</span> ${escapeHtml(project.clientPhone)}</div>` : ''}
              ${project.clientEmail ? `<div class="info-item"><span>Email:</span> ${escapeHtml(project.clientEmail)}</div>` : ''}
              ${project.clientAddress ? `<div class="info-item"><span>Address:</span> ${escapeHtml(project.clientAddress)}</div>` : ''}
              <div class="info-item"><span>Status:</span> ${escapeHtml(project.status)}</div>
              <div class="info-item"><span>Priority:</span> ${escapeHtml(project.priority)}</div>
              <div class="info-item"><span>Location:</span> ${escapeHtml(project.location) || '-'}</div>
              <div class="info-item"><span>Start Date:</span> ${project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : '-'}</div>
              <div class="info-item"><span>End Date:</span> ${project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB') : '-'}</div>
              <div class="info-item"><span>Budget:</span> ${project.estimatedBudget ? parseFloat(project.estimatedBudget).toFixed(2) + ' SAR' : '-'}</div>
            </div>
            ${project.description ? `<p style="margin-top:8px;">${escapeHtml(project.description)}</p>` : ''}
          </div>

          <div class="summary-box">
            <div class="summary-grid">
              <div class="summary-item"><div class="label">Services Value / قيمة الخدمات</div><div class="value">${totalServices.toFixed(2)} SAR</div></div>
              <div class="summary-item"><div class="label">Total Bills / إجمالي الفواتير</div><div class="value">${totalBills.toFixed(2)} SAR</div></div>
              <div class="summary-item"><div class="label">Procurements / المشتريات</div><div class="value">${totalProcurements.toFixed(2)} SAR</div></div>
            </div>
          </div>

          ${services.length > 0 ? `
          <div class="section">
            <h3>Services / الخدمات</h3>
            <table>
              <thead><tr><th>#</th><th>Service</th><th>Method</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr></thead>
              <tbody>${serviceRows}
                <tr class="total-row"><td colspan="5" style="text-align:right">Total / الإجمالي:</td><td style="text-align:right">${totalServices.toFixed(2)} SAR</td></tr>
              </tbody>
            </table>
          </div>` : ''}

          ${bills.length > 0 ? `
          <div class="section">
            <h3>Bills / الفواتير</h3>
            <table>
              <thead><tr><th>#</th><th>Description</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>${billRows}
                <tr class="total-row"><td colspan="3" style="text-align:right">Total:</td><td style="text-align:right">${totalBills.toFixed(2)} SAR</td><td></td></tr>
              </tbody>
            </table>
          </div>` : ''}

          ${procurements.length > 0 ? `
          <div class="section">
            <h3>Procurements / المشتريات</h3>
            <table>
              <thead><tr><th>#</th><th>Item</th><th>Vendor</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>${procurementRows}
                <tr class="total-row"><td colspan="4" style="text-align:right">Total:</td><td style="text-align:right">${totalProcurements.toFixed(2)} SAR</td><td></td></tr>
              </tbody>
            </table>
          </div>` : ''}

          ${tasks.length > 0 ? `
          <div class="section">
            <h3>Tasks / المهام</h3>
            <table>
              <thead><tr><th>#</th><th>Task</th><th>Duration</th><th>Status</th><th>Slack</th></tr></thead>
              <tbody>${taskRows}</tbody>
            </table>
          </div>` : ''}

          ${schedules.length > 0 ? `
          <div class="section">
            <h3>Payment Schedule / جدول الدفعات</h3>
            <table>
              <thead><tr><th>#</th><th>Milestone</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>${scheduleRows}
                <tr class="total-row"><td></td><td style="text-align:right">Total:</td><td style="text-align:right">${totalScheduled.toFixed(2)} SAR</td><td></td><td>Paid: ${totalPaid.toFixed(2)} SAR</td></tr>
              </tbody>
            </table>
          </div>` : ''}

          ${project.notes ? `<div class="section"><h3>Notes / ملاحظات</h3><p>${escapeHtml(project.notes)}</p></div>` : ''}

          <div class="footer">
            <p>${escapeHtml(companyInfo?.companyName) || 'Company'} - Project Dossier - ${escapeHtml(project.projectNumber)}</p>
            <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
          </div>
        </body>
        </html>`;

    const puppeteer = await import("puppeteer");
    const { execSync } = await import("child_process");
    const { existsSync } = await import("fs");
    let chromiumPath: string | undefined = undefined;
    try {
      chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
      if (!chromiumPath || !existsSync(chromiumPath)) chromiumPath = undefined;
    } catch (e) {}
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfData = await page.pdf({ format: 'A4', margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' }, printBackground: true });
    await browser.close();
    return { project, buffer: Buffer.from(pdfData) };
  }

  app.get("/api/service-projects/:id/dossier-pdf", requireAuth, requireRestaurant, requirePermission('projects'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });
      const lang = req.query.lang === 'ar' ? 'ar' : 'en';
      const result = await buildProjectDossierPdf(req.params.id, restaurantId, lang);
      if (!result) return res.status(404).json({ message: "Project not found" });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="project-dossier-${result.project.projectNumber}.pdf"`);
      res.send(result.buffer);
    } catch (error: any) {
      console.error("Project dossier PDF error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate Agreement PDF for a service project — fills the company's
  // agreement template with the project's data and produces a PDF.
  app.get("/api/service-projects/:id/agreement-pdf", requireAuth, requireRestaurant, requirePermission('projects'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      if (!restaurantId) return res.status(403).json({ message: "Access denied" });

      const lang = req.query.lang === 'ar' ? 'ar' : 'en';
      const isAr = lang === 'ar';
      const dir = isAr ? 'rtl' : 'ltr';
      const align = isAr ? 'right' : 'left';

      const project = await storage.getServiceProject(req.params.id, restaurantId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const company = await storage.getCompanySettings(restaurantId);
      const services = await storage.getProjectServices(restaurantId, project.id);
      const totalAmount = services.reduce((s, svc) => s + parseFloat(svc.totalPrice || '0'), 0);

      const template = (company?.agreementTemplate || '').trim();
      if (!template) {
        return res.status(400).json({
          message: "No agreement template configured. Please set one in Company Settings → Agreement Template."
        });
      }

      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '-';
      const fmtMoney = (n: number) => `${n.toFixed(2)} SAR`;

      const vatAmount = totalAmount * 0.15;
      const totalWithVat = totalAmount + vatAmount;

      const replacements: Record<string, string> = {
        '{{clientName}}': project.clientName || '',
        '{{clientPhone}}': project.clientPhone || '',
        '{{clientEmail}}': project.clientEmail || '',
        '{{clientCrNumber}}': project.clientCrNumber || '',
        '{{clientVatNumber}}': project.clientVatNumber || '',
        '{{clientAddress}}': project.clientAddress || '',
        '{{clientLegalRepresentative}}': project.clientLegalRepresentative || '',
        '{{projectName}}': project.name || '',
        '{{projectNumber}}': project.projectNumber || '',
        '{{projectLocation}}': project.location || '',
        '{{projectDescription}}': project.description || '',
        '{{totalAmount}}': fmtMoney(totalAmount),
        '{{vatAmount}}': fmtMoney(vatAmount),
        '{{totalWithVat}}': fmtMoney(totalWithVat),
        '{{startDate}}': fmtDate(project.startDate),
        '{{endDate}}': fmtDate(project.endDate),
        '{{companyName}}': company?.companyName || '',
        '{{companyAddress}}': company?.companyAddress || '',
        '{{companyPhone}}': company?.companyPhone || '',
        '{{companyEmail}}': company?.companyEmail || '',
        '{{date}}': new Date().toLocaleDateString('en-GB'),
      };

      let body = template;
      for (const [key, val] of Object.entries(replacements)) {
        body = body.split(key).join(escapeHtml(val));
      }
      const bodyHtml = body.replace(/\n/g, '<br/>');
      const terms = (company?.termsAndConditions || '').trim();

      const servicesRows = services.length > 0
        ? services.map((svc, i) => {
            const qty = parseFloat(svc.quantity || '1');
            const unit = svc.unit ? escapeHtml(svc.unit) : '';
            const unitPrice = parseFloat(svc.unitPrice || '0');
            const total = parseFloat(svc.totalPrice || '0');
            return `
              <tr>
                <td class="num">${i + 1}</td>
                <td>
                  <div class="svc-name">${escapeHtml(svc.name || '')}</div>
                  ${svc.description ? `<div class="svc-desc">${escapeHtml(svc.description)}</div>` : ''}
                </td>
                <td class="num">${qty}${unit ? ' ' + unit : ''}</td>
                <td class="num">${fmtMoney(unitPrice)}</td>
                <td class="num">${fmtMoney(total)}</td>
              </tr>`;
          }).join('')
        : `<tr><td colspan="5" class="empty">No services added to this project.</td></tr>`;

      const logoHtml = company?.companyLogo
        ? `<img src="${escapeHtml(company.companyLogo)}" alt="logo" class="logo" />`
        : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
            body { font-family: ${isAr ? "'Noto Naskh Arabic','Amiri',Arial,sans-serif" : "Arial, sans-serif"}; padding: 40px; font-size: 12px; color: #222; line-height: 1.5; direction: ${dir}; text-align: ${align}; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a365d; padding-bottom: 15px; margin-bottom: 20px; }
            .company-info { display: flex; gap: 14px; align-items: flex-start; }
            .company-info .logo { width: 64px; height: 64px; object-fit: contain; }
            .company-info h1 { color: #1a365d; margin: 0; font-size: 22px; }
            .company-info p { margin: 2px 0; color: #555; font-size: 10px; }
            .doc-title { text-align: right; }
            .doc-title h2 { color: #1a365d; margin: 0; font-size: 22px; }
            .doc-title p { margin: 2px 0; color: #666; font-size: 11px; }

            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
            .party-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; }
            .party-box h4 { margin: 0 0 6px 0; color: #1a365d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .party-box .row { font-size: 11px; margin: 2px 0; }
            .party-box .row .lbl { color: #666; display: inline-block; min-width: 70px; }

            .project-box { background: #f0f4f8; border-left: 4px solid #1a365d; padding: 10px 14px; margin-bottom: 18px; }
            .project-box .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 11px; }
            .project-box .lbl { color: #666; }
            .project-box .desc { margin-top: 8px; font-size: 11px; color: #333; }

            .section-title { color: #1a365d; font-size: 13px; font-weight: 700; border-bottom: 2px solid #1a365d; padding-bottom: 4px; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }

            table.services { width: 100%; border-collapse: collapse; font-size: 11px; }
            table.services th { background: #1a365d; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
            table.services th.num, table.services td.num { text-align: right; }
            table.services td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            table.services .svc-name { font-weight: 600; color: #1a365d; }
            table.services .svc-desc { color: #666; font-size: 10px; margin-top: 2px; }
            table.services .empty { text-align: center; color: #999; padding: 14px; font-style: italic; }

            .totals { display: flex; justify-content: flex-end; margin-top: 10px; }
            .totals table { font-size: 11px; min-width: 280px; }
            .totals td { padding: 4px 10px; }
            .totals .lbl { color: #666; }
            .totals .val { text-align: right; font-family: 'Courier New', monospace; }
            .totals tr.grand { font-weight: 700; color: #1a365d; border-top: 2px solid #1a365d; font-size: 13px; }

            .agreement-body { white-space: pre-wrap; padding: 8px 0; font-size: 11px; }

            .terms { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #444; white-space: pre-wrap; }

            .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sig-block { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; text-align: center; }

            .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; color: #888; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${logoHtml}
              <div>
                <h1>${escapeHtml(company?.companyName || 'Company')}</h1>
                ${company?.companyAddress ? `<p>${escapeHtml(company.companyAddress)}</p>` : ''}
                ${company?.companyPhone ? `<p>Tel: ${escapeHtml(company.companyPhone)}</p>` : ''}
                ${company?.companyEmail ? `<p>Email: ${escapeHtml(company.companyEmail)}</p>` : ''}
              </div>
            </div>
            <div class="doc-title">
              <h2>Agreement / اتفاقية</h2>
              <p>${escapeHtml(project.projectNumber)}</p>
              <p>${new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div class="parties">
            <div class="party-box">
              <h4>Service Provider / مقدم الخدمة</h4>
              <div class="row"><span class="lbl">Name:</span> ${escapeHtml(company?.companyName || '-')}</div>
              ${company?.companyAddress ? `<div class="row"><span class="lbl">Address:</span> ${escapeHtml(company.companyAddress)}</div>` : ''}
              ${company?.companyPhone ? `<div class="row"><span class="lbl">Phone:</span> ${escapeHtml(company.companyPhone)}</div>` : ''}
              ${company?.companyEmail ? `<div class="row"><span class="lbl">Email:</span> ${escapeHtml(company.companyEmail)}</div>` : ''}
            </div>
            <div class="party-box">
              <h4>Client / العميل</h4>
              <div class="row"><span class="lbl">Name:</span> ${escapeHtml(project.clientName || '-')}</div>
              ${project.clientLegalRepresentative ? `<div class="row"><span class="lbl">Representative:</span> ${escapeHtml(project.clientLegalRepresentative)}</div>` : ''}
              ${project.clientCrNumber ? `<div class="row"><span class="lbl">CR / ID:</span> ${escapeHtml(project.clientCrNumber)}</div>` : ''}
              ${project.clientVatNumber ? `<div class="row"><span class="lbl">VAT No:</span> ${escapeHtml(project.clientVatNumber)}</div>` : ''}
              ${project.clientPhone ? `<div class="row"><span class="lbl">Phone:</span> ${escapeHtml(project.clientPhone)}</div>` : ''}
              ${project.clientEmail ? `<div class="row"><span class="lbl">Email:</span> ${escapeHtml(project.clientEmail)}</div>` : ''}
              ${project.clientAddress ? `<div class="row"><span class="lbl">Address:</span> ${escapeHtml(project.clientAddress)}</div>` : ''}
              ${project.location ? `<div class="row"><span class="lbl">Location:</span> ${escapeHtml(project.location)}</div>` : ''}
            </div>
          </div>

          <div class="project-box">
            <div class="grid">
              <div><span class="lbl">Project:</span> <strong>${escapeHtml(project.name || '-')}</strong></div>
              <div><span class="lbl">Number:</span> <strong>${escapeHtml(project.projectNumber || '-')}</strong></div>
              <div><span class="lbl">Start Date:</span> ${fmtDate(project.startDate)}</div>
              <div><span class="lbl">End Date:</span> ${fmtDate(project.endDate)}</div>
            </div>
            ${project.description ? `<div class="desc"><span class="lbl">Description: </span>${escapeHtml(project.description)}</div>` : ''}
          </div>

          <div class="section-title">Services / الخدمات</div>
          <table class="services">
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>Service / الخدمة</th>
                <th class="num" style="width:90px;">Qty</th>
                <th class="num" style="width:110px;">Unit Price</th>
                <th class="num" style="width:120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${servicesRows}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr><td class="lbl">Subtotal</td><td class="val">${fmtMoney(totalAmount)}</td></tr>
              <tr><td class="lbl">VAT (15%)</td><td class="val">${fmtMoney(vatAmount)}</td></tr>
              <tr class="grand"><td>Total</td><td class="val">${fmtMoney(totalWithVat)}</td></tr>
            </table>
          </div>

          <div class="section-title">Agreement / الاتفاقية</div>
          <div class="agreement-body">${bodyHtml}</div>

          ${terms ? `<div class="section-title">Terms &amp; Conditions / الشروط والأحكام</div><div class="terms">${escapeHtml(terms)}</div>` : ''}

          <div class="signatures">
            <div class="sig-block">${escapeHtml(company?.companyName || 'Service Provider')}</div>
            <div class="sig-block">${escapeHtml(project.clientName || 'Client')}</div>
          </div>

          <div class="footer">Generated on ${new Date().toLocaleString('en-GB')} — ${escapeHtml(project.projectNumber)}</div>
        </body>
        </html>
      `;

      const puppeteer = await import("puppeteer");
      const { execSync } = await import("child_process");
      const { existsSync } = await import("fs");

      let chromiumPath: string | undefined = undefined;
      try {
        chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
        if (!chromiumPath || !existsSync(chromiumPath)) chromiumPath = undefined;
      } catch (e) {}

      const browser = await puppeteer.default.launch({
        headless: true,
        executablePath: chromiumPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfData = await page.pdf({ format: 'A4', margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' }, printBackground: true });
      await browser.close();
      const pdfBuffer = Buffer.from(pdfData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="agreement-${project.projectNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Project agreement PDF error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MEAL SUBSCRIPTIONS ====================
  app.get("/api/meal-subscriptions", requireAuth, requireRestaurant, requirePermission('mealSubscriptions'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const status = req.query.status as string | undefined;
      const subscriptions = await storage.getMealSubscriptions(restaurantId, status);
      res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching meal subscriptions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meal-subscriptions/today", requireAuth, requireRestaurant, requirePermission('mealSubscriptions'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const deliveries = await storage.getTodaysMealDeliveries(restaurantId);
      res.json(deliveries);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching today's meal deliveries:", message);
      res.status(500).json({ message });
    }
  });

  app.get("/api/meal-subscriptions/:id", requireAuth, requireRestaurant, requirePermission('mealSubscriptions'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const subscription = await storage.getMealSubscription(req.params.id, restaurantId);
      if (!subscription) return res.status(404).json({ message: "Subscription not found" });
      res.json(subscription);
    } catch (error: any) {
      console.error("Error fetching meal subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meal-subscriptions", requireAuth, requireRestaurant, requireAction('mealSubscriptions', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { id, createdAt, restaurantId: _rid, ...safeBody } = req.body;
      if (safeBody.startDate && typeof safeBody.startDate === 'string') safeBody.startDate = new Date(safeBody.startDate);
      if (safeBody.endDate && typeof safeBody.endDate === 'string') safeBody.endDate = new Date(safeBody.endDate);
      if (!safeBody.creditBalance && safeBody.amount) {
        safeBody.creditBalance = safeBody.amount;
      }
      const subscription = await storage.createMealSubscription({ ...safeBody, restaurantId });
      if (subscription.paymentStatus === 'paid' && parseFloat(subscription.amount || '0') > 0) {
        try {
          const subtotal = parseFloat(subscription.amount || '0') / 1.15;
          const tax = parseFloat(subscription.amount || '0') - subtotal;
          await storage.createTransaction({
            restaurantId,
            transactionId: `MSUB-${subscription.id.substring(0, 8)}-${Date.now()}`,
            itemCount: Array.isArray(subscription.mealSelections) ? (subscription.mealSelections as Array<unknown>).length : 1,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: parseFloat(subscription.amount || '0').toFixed(2),
            paymentMethod: 'Meal Subscription',
          });
        } catch (txError) {
          console.error("Error creating transaction for meal subscription:", txError);
        }
      }
      res.status(201).json(subscription);
    } catch (error: any) {
      console.error("Error creating meal subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/meal-subscriptions/:id", requireAuth, requireRestaurant, requireAction('mealSubscriptions', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { id, createdAt, restaurantId: _rid, ...safeBody } = req.body;
      if (safeBody.startDate && typeof safeBody.startDate === 'string') safeBody.startDate = new Date(safeBody.startDate);
      if (safeBody.endDate && typeof safeBody.endDate === 'string') safeBody.endDate = new Date(safeBody.endDate);
      const existingSub = await storage.getMealSubscription(req.params.id, restaurantId);
      if (safeBody.amount && existingSub) {
        const oldAmount = parseFloat(existingSub.amount || "0");
        const newAmount = parseFloat(safeBody.amount);
        const oldCredit = parseFloat(existingSub.creditBalance || "0");
        const spent = oldAmount - oldCredit;
        safeBody.creditBalance = Math.max(0, newAmount - spent).toFixed(2);
      }
      const subscription = await storage.updateMealSubscription(req.params.id, restaurantId, safeBody);
      if (!subscription) return res.status(404).json({ message: "Subscription not found" });
      if (safeBody.paymentStatus === 'paid' && existingSub?.paymentStatus !== 'paid' && parseFloat(subscription.amount || '0') > 0) {
        try {
          const subtotal = parseFloat(subscription.amount || '0') / 1.15;
          const tax = parseFloat(subscription.amount || '0') - subtotal;
          await storage.createTransaction({
            restaurantId,
            transactionId: `MSUB-${subscription.id.substring(0, 8)}-${Date.now()}`,
            itemCount: Array.isArray(subscription.mealSelections) ? (subscription.mealSelections as Array<unknown>).length : 1,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: parseFloat(subscription.amount || '0').toFixed(2),
            paymentMethod: 'Meal Subscription',
          });
        } catch (txError) {
          console.error("Error creating transaction for meal subscription payment:", txError);
        }
      }
      res.json(subscription);
    } catch (error: any) {
      console.error("Error updating meal subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/meal-subscriptions/:id/schedule-pdf", async (req, res) => {
    try {
      const subscriptionId = req.params.id;
      const allSubs = await db.select().from(mealSubscriptions).where(eq(mealSubscriptions.id, subscriptionId)).limit(1);
      const subscription = allSubs[0];
      if (!subscription) return res.status(404).json({ message: "Subscription not found" });
      const restaurantId = subscription.restaurantId;
      const restaurant = await storage.getRestaurant(restaurantId);
      const menuItemsList = await storage.getMenuItems(restaurantId);
      const mealTimes = subscription.mealTime.split(",").map((t: string) => t.trim());
      const rawSel = subscription.mealSelections;
      const selectionsMap: Record<string, Array<{ name: string; menuItemId?: string }>> = {};
      if (rawSel && typeof rawSel === 'object' && !Array.isArray(rawSel)) {
        const map = rawSel as Record<string, unknown>;
        for (const mt of mealTimes) {
          if (Array.isArray(map[mt])) {
            selectionsMap[mt] = (map[mt] as any[]).filter(item => typeof item === 'object' && item !== null && typeof item.name === 'string');
          }
        }
      } else if (Array.isArray(rawSel)) {
        const flat = rawSel.filter((item: any) => typeof item === 'object' && item !== null && typeof item.name === 'string') as Array<{ name: string; menuItemId?: string }>;
        if (mealTimes.length > 0) selectionsMap[mealTimes[0]] = flat;
      }
      const mealSelectionsGrouped: Record<string, Array<{ name: string; price?: string }>> = {};
      for (const [mt, items] of Object.entries(selectionsMap)) {
        mealSelectionsGrouped[mt] = items.map(s => {
          const menuItem = s.menuItemId ? menuItemsList.find((m: any) => m.id === s.menuItemId) : null;
          return { name: s.name, price: menuItem?.price?.toString() };
        });
      }
      const pdfBuffer = await generateMealSubscriptionSchedulePDF({
        subscriberName: subscription.subscriberName,
        subscriberPhone: subscription.subscriberPhone,
        subscriberEmail: subscription.subscriberEmail || undefined,
        deliveryAddress: subscription.deliveryAddress || undefined,
        dietaryNotes: subscription.dietaryNotes || undefined,
        mealSelectionsGrouped,
        planType: subscription.planType,
        scheduleDays: Array.isArray(subscription.scheduleDays) ? subscription.scheduleDays : [],
        mealTime: subscription.mealTime,
        startDate: subscription.startDate?.toISOString() || '',
        endDate: subscription.endDate?.toISOString(),
        amount: subscription.amount || '0',
        numberOfDays: subscription.numberOfDays || undefined,
        paymentStatus: subscription.paymentStatus,
        restaurantName: restaurant?.name || 'Restaurant',
        createdAt: subscription.createdAt?.toISOString() || new Date().toISOString(),
        deliveryLog: Array.isArray(subscription.deliveryLog) ? subscription.deliveryLog as Array<{ date: string; mealTime: string; deliveredAt: string }> : [],
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=meal-subscription-${subscription.subscriberName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating meal subscription schedule PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meal-subscriptions/:id/mark-delivered", requireAuth, requireRestaurant, requireAction('mealSubscriptions', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { mealTime } = req.body;
      if (!mealTime) return res.status(400).json({ message: "mealTime is required" });
      const sub = await storage.getMealSubscription(req.params.id, restaurantId);
      if (!sub) return res.status(404).json({ message: "Subscription not found" });
      const todayStr = new Date().toISOString().split("T")[0];
      const existingLog = Array.isArray(sub.deliveryLog) ? sub.deliveryLog as unknown[] : [];
      const alreadyDelivered = existingLog.some((entry) => {
        const e = entry as { date: string; mealTime: string };
        return e.date === todayStr && e.mealTime === mealTime;
      });
      if (alreadyDelivered) return res.status(400).json({ message: "Already marked as delivered" });

      let selections: { name: string; menuItemId?: string }[] = [];
      const rawSel = sub.mealSelections;
      if (rawSel && typeof rawSel === 'object' && !Array.isArray(rawSel)) {
        const map = rawSel as Record<string, unknown>;
        if (Array.isArray(map[mealTime])) {
          selections = (map[mealTime] as any[]).filter(item => typeof item === 'object' && item !== null && typeof item.name === 'string');
        }
      } else if (Array.isArray(rawSel)) {
        selections = rawSel.filter((item: any) => typeof item === 'object' && item !== null && typeof item.name === 'string') as { name: string; menuItemId?: string }[];
      }
      const menuItemIds = selections.filter((s) => s.menuItemId).map((s) => s.menuItemId!);
      let inventoryResult = { deducted: false, details: [] as string[] };
      if (menuItemIds.length > 0) {
        const { orderProcessingService } = await import("./orderProcessingService");
        inventoryResult = await orderProcessingService.deductInventoryForMealDelivery(
          menuItemIds, restaurantId, req.params.id, mealTime
        );
      }

      let deliveryCost = 0;
      if (menuItemIds.length > 0) {
        const allMenuItems = await storage.getMenuItems(restaurantId);
        for (const mid of menuItemIds) {
          const mi = allMenuItems.find((m) => m.id === mid);
          if (mi?.price) deliveryCost += parseFloat(mi.price);
        }
      }

      const currentCredit = parseFloat(sub.creditBalance || sub.amount || "0");
      const newCredit = Math.max(0, currentCredit - deliveryCost);

      const newEntry = { date: todayStr, mealTime, deliveredAt: new Date().toISOString(), inventoryDeducted: inventoryResult.deducted, cost: deliveryCost.toFixed(2) };
      const updatedLog = [...existingLog, newEntry];
      const updated = await storage.updateMealSubscription(req.params.id, restaurantId, { deliveryLog: updatedLog, creditBalance: newCredit.toFixed(2) });
      res.json({ ...updated, inventoryResult });
    } catch (error: any) {
      console.error("Error marking delivery:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/meal-subscriptions/:id/undo-delivered", requireAuth, requireRestaurant, requireAction('mealSubscriptions', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { mealTime } = req.body;
      if (!mealTime) return res.status(400).json({ message: "mealTime is required" });
      const sub = await storage.getMealSubscription(req.params.id, restaurantId);
      if (!sub) return res.status(404).json({ message: "Subscription not found" });
      const todayStr = new Date().toISOString().split("T")[0];
      const existingLog = Array.isArray(sub.deliveryLog) ? sub.deliveryLog as unknown[] : [];

      const deliveryEntry = existingLog.find((entry) => {
        const e = entry as { date: string; mealTime: string };
        return e.date === todayStr && e.mealTime === mealTime;
      }) as { date: string; mealTime: string; inventoryDeducted?: boolean } | undefined;

      if (deliveryEntry?.inventoryDeducted) {
        let selections: { name: string; menuItemId?: string }[] = [];
        const rawSelUndo = sub.mealSelections;
        if (rawSelUndo && typeof rawSelUndo === 'object' && !Array.isArray(rawSelUndo)) {
          const map = rawSelUndo as Record<string, unknown>;
          if (Array.isArray(map[mealTime])) {
            selections = (map[mealTime] as any[]).filter(item => typeof item === 'object' && item !== null && typeof item.name === 'string');
          }
        } else if (Array.isArray(rawSelUndo)) {
          selections = rawSelUndo.filter((item: any) => typeof item === 'object' && item !== null && typeof item.name === 'string') as { name: string; menuItemId?: string }[];
        }
        const menuItemIds = selections.filter((s) => s.menuItemId).map((s) => s.menuItemId!);
        if (menuItemIds.length > 0) {
          const { orderProcessingService } = await import("./orderProcessingService");
          await orderProcessingService.reverseInventoryForMealDelivery(
            menuItemIds, restaurantId, req.params.id, mealTime
          );
        }
      }

      const deliveryCost = parseFloat((deliveryEntry as any)?.cost || "0");
      const currentCredit = parseFloat(sub.creditBalance || "0");
      const restoredCredit = currentCredit + deliveryCost;

      const updatedLog = existingLog.filter((entry) => {
        const e = entry as { date: string; mealTime: string };
        return !(e.date === todayStr && e.mealTime === mealTime);
      });
      const updated = await storage.updateMealSubscription(req.params.id, restaurantId, { deliveryLog: updatedLog, creditBalance: restoredCredit.toFixed(2) });
      res.json(updated);
    } catch (error: any) {
      console.error("Error undoing delivery:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/meal-subscriptions/:id", requireAuth, requireRestaurant, requireAction('mealSubscriptions', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const deleted = await storage.deleteMealSubscription(req.params.id, restaurantId);
      if (!deleted) return res.status(404).json({ message: "Subscription not found" });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting meal subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CATERING CONTRACTS ====================
  app.get("/api/catering-contracts", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const contracts = await storage.getCateringContracts(restaurantId);
      res.json(contracts);
    } catch (error: any) {
      console.error("Error fetching catering contracts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // NOTE: /today must come BEFORE /:id so it's not captured as an id
  app.get("/api/catering-contracts/today", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const all = await storage.getCateringContracts(restaurantId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][today.getDay()];
      const active = all.filter((c) => {
        if (c.status !== 'active') return false;
        const start = new Date(c.startDate); start.setHours(0,0,0,0);
        const end = new Date(c.endDate); end.setHours(0,0,0,0);
        if (today < start || today > end) return false;
        const days = (c.deliveryDays || []).map((d: string) => d.toLowerCase());
        if (days.length === 0) return true;
        return days.includes(dayName);
      });
      res.json(active);
    } catch (error: any) {
      console.error("Error fetching today's catering deliveries:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catering-contracts/:id", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const contract = await storage.getCateringContract(req.params.id, restaurantId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/catering-contracts", requireAuth, requireRestaurant, requireAction('catering', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { id, createdAt, restaurantId: _rid, ...body } = req.body;
      if (body.startDate && typeof body.startDate === 'string') body.startDate = new Date(body.startDate);
      if (body.endDate && typeof body.endDate === 'string') body.endDate = new Date(body.endDate);
      const contract = await storage.createCateringContract({ ...body, restaurantId });
      res.json(contract);
    } catch (error: any) {
      console.error("Error creating catering contract:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/catering-contracts/:id", requireAuth, requireRestaurant, requireAction('catering', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const { id, createdAt, restaurantId: _rid, ...body } = req.body;
      if (body.startDate && typeof body.startDate === 'string') body.startDate = new Date(body.startDate);
      if (body.endDate && typeof body.endDate === 'string') body.endDate = new Date(body.endDate);
      const contract = await storage.updateCateringContract(req.params.id, restaurantId, body);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/catering-contracts/:id", requireAuth, requireRestaurant, requireAction('catering', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const ok = await storage.deleteCateringContract(req.params.id, restaurantId);
      if (!ok) return res.status(404).json({ message: "Contract not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Catering Contract Templates
  app.get("/api/catering-contract-templates", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const templates = await storage.getCateringContractTemplates(restaurantId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const RESERVED_CATERING_PH_KEYS = new Set([
    "my_restaurant_name","client_name","phone","email","delivery_location",
    "meals_list","number_of_meals","delivery_days","delivery_time",
    "total_value","discount_percentage","final_value","payment_schedule",
    "start_date","end_date",
  ]);
  const customPhSchema = z.array(z.object({
    key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/i, "Invalid placeholder key"),
    label: z.string().max(120).optional().default(""),
    value: z.string().max(5000).optional().default(""),
  })).max(50).superRefine((arr, ctx) => {
    const seen = new Set<string>();
    arr.forEach((p, i) => {
      const k = p.key.toLowerCase();
      if (RESERVED_CATERING_PH_KEYS.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, "key"], message: "Reserved placeholder key" });
      }
      if (seen.has(k)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, "key"], message: "Duplicate placeholder key" });
      }
      seen.add(k);
    });
  });
  const templateBodySchema = z.object({
    name: z.string().trim().min(1).max(200),
    content: z.string().max(50000).optional().default(""),
    isDefault: z.boolean().optional().default(false),
    customPlaceholders: customPhSchema.optional().default([]),
  });

  app.post("/api/catering-contract-templates", requireAuth, requireRestaurant, requireAction('catering', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const parsed = templateBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid template", errors: parsed.error.flatten() });
      const template = await storage.createCateringContractTemplate({ ...parsed.data, restaurantId } as any);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/catering-contract-templates/:id", requireAuth, requireRestaurant, requireAction('catering', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const parsed = templateBodySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid template", errors: parsed.error.flatten() });
      const template = await storage.updateCateringContractTemplate(req.params.id, restaurantId, parsed.data as any);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/catering-contract-templates/:id", requireAuth, requireRestaurant, requireAction('catering', 'delete'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const ok = await storage.deleteCateringContractTemplate(req.params.id, restaurantId);
      if (!ok) return res.status(404).json({ message: "Template not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Render contract HTML (template + data substitution)
  async function buildCateringContractHtml(restaurantId: string, contractId: string): Promise<string> {
    const contract = await storage.getCateringContract(contractId, restaurantId);
    if (!contract) throw new Error("Contract not found");
    const restaurant = await storage.getRestaurant(restaurantId);
    const templates = await storage.getCateringContractTemplates(restaurantId);
    const defaultTpl = templates.find(t => t.isDefault) || templates[0];
    const tplContent = defaultTpl?.content || '';

    const meals = Array.isArray(contract.mealSelections) ? contract.mealSelections as Array<any> : [];
    const installments = Array.isArray(contract.paymentInstallments) ? contract.paymentInstallments as Array<any> : [];
    const days = Array.isArray(contract.deliveryDays) ? contract.deliveryDays : [];

    const mealsListHtml = meals.length
      ? `<ul style="margin:6px 0;padding-${'inline-start'}:20px;">${meals.map(m => `<li>${escapeHtml(m.name)} — ${parseFloat(m.price || 0).toFixed(2)} SAR</li>`).join('')}</ul>`
      : '—';
    const paymentScheduleHtml = installments.length
      ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:11px;">
          <thead><tr style="background:#1a365d;color:#fff;">
            <th style="padding:8px;text-align:left;">#</th>
            <th style="padding:8px;text-align:left;">Description</th>
            <th style="padding:8px;text-align:right;">%</th>
            <th style="padding:8px;text-align:right;">Amount (SAR)</th>
            <th style="padding:8px;text-align:left;">Due Date</th>
          </tr></thead>
          <tbody>${installments.map((it: any, i: number) => `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px;">${i + 1}</td>
              <td style="padding:8px;">${escapeHtml(it.label || '')}</td>
              <td style="padding:8px;text-align:right;">${parseFloat(it.percent || 0).toFixed(2)}</td>
              <td style="padding:8px;text-align:right;">${parseFloat(it.amount || 0).toFixed(2)}</td>
              <td style="padding:8px;">${it.dueDate ? new Date(it.dueDate).toLocaleDateString('en-GB') : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      : '—';

    const placeholders: Record<string, string> = {
      my_restaurant_name: restaurant?.name || '',
      client_name: contract.clientName || '',
      phone: contract.clientPhone || '',
      email: contract.clientEmail || '',
      delivery_location: contract.deliveryLocation || '',
      meals_list: mealsListHtml,
      number_of_meals: String(contract.mealsPerDay || 0),
      delivery_days: days.join(', '),
      delivery_time: contract.deliveryTime || '',
      total_value: parseFloat(contract.totalValue || '0').toFixed(2) + ' SAR',
      discount_percentage: parseFloat(contract.discountPercent || '0').toFixed(2) + '%',
      final_value: parseFloat(contract.finalValue || '0').toFixed(2) + ' SAR',
      payment_schedule: paymentScheduleHtml,
      start_date: contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-GB') : '',
      end_date: contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-GB') : '',
    };

    // If the template is plain text (no HTML tags), escape user text first
    // and convert newlines to <br/>, then inject placeholders (which may
    // legitimately contain HTML fragments such as meals_list / payment_schedule).
    // For HTML templates, trust the author's markup and just substitute.
    const isHtmlTemplate = /<[a-z][^>]*>/i.test(tplContent);
    let body: string;
    if (isHtmlTemplate) {
      body = tplContent;
    } else {
      body = tplContent.split('\n').map(line => escapeHtml(line)).join('<br/>');
    }
    for (const [k, v] of Object.entries(placeholders)) {
      body = body.split(`{{${k}}}`).join(v);
    }

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
      body { font-family: 'Amiri', Arial, sans-serif; padding: 40px; font-size: 12px; color: #333; }
      .header { text-align:center; border-bottom: 3px solid #1a365d; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { color: #1a365d; margin: 0; font-size: 22px; }
      .meta { display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:6px; margin-bottom:20px; font-size:11px; }
      h2 { color:#1a365d; font-size:16px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-top:24px; }
      .footer { text-align:center; margin-top:40px; padding-top:12px; border-top:1px solid #e2e8f0; color:#999; font-size:10px; }
    </style></head><body>
      <div class="header">
        <h1>${escapeHtml(restaurant?.name || '')}</h1>
        <div style="color:#666;font-size:11px;margin-top:4px;">Catering Supply Contract — عقد توريد تموين</div>
      </div>
      <div class="meta">
        <div><strong>Contract #:</strong> ${escapeHtml(contract.contractNumber)}</div>
        <div><strong>Date:</strong> ${new Date(contract.createdAt).toLocaleDateString('en-GB')}</div>
        <div><strong>Status:</strong> ${escapeHtml(contract.status)}</div>
      </div>
      ${body}
      <div class="footer">Generated by BlindSpot System (BSS) — kinbss.org</div>
    </body></html>`;
  }

  // Puppeteer-based PDF builder. Renders the contract as HTML and prints it
  // via headless Chromium so Arabic text shaping & bidirectional ordering are
  // handled natively by the browser (no manual reshaping needed).
  async function buildCateringContractPdfBuffer(restaurantId: string, contractId: string, lang: string = 'en', mode: 'contract' | 'quotation' = 'contract'): Promise<Buffer> {
    const contract = await storage.getCateringContract(contractId, restaurantId);
    if (!contract) throw new Error("Contract not found");
    const restaurant = await storage.getRestaurant(restaurantId);
    const templates = await storage.getCateringContractTemplates(restaurantId);
    const defaultTpl = templates.find(t => t.isDefault) || templates[0];
    const tplContent = defaultTpl?.content || '';
    const isAr = lang === 'ar' || lang === 'Arabic' || lang === 'Urdu' || lang === 'ur';
    const L = (en: string, ar: string) => isAr ? ar : en;
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';

    const meals = Array.isArray(contract.mealSelections) ? contract.mealSelections as Array<any> : [];
    const installments = Array.isArray(contract.paymentInstallments) ? contract.paymentInstallments as Array<any> : [];
    const days = Array.isArray(contract.deliveryDays) ? contract.deliveryDays : [];

    const dayMap: Record<string, string> = isAr
      ? { sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' }
      : { sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
    const daysStr = days.map((d: string) => dayMap[String(d).toLowerCase()] || d).join(isAr ? '، ' : ', ');
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : '—';
    const SAR = L('SAR', 'ر.س');

    const statusLabels: Record<string, string> = isAr
      ? { active: 'نشط', completed: 'مكتمل', cancelled: 'ملغى' }
      : { active: 'Active', completed: 'Completed', cancelled: 'Cancelled' };
    const statusVal = statusLabels[String(contract.status || '')] || String(contract.status || '');

    const mealsListHtml = meals.length
      ? `<ul class="meals">${meals.map(m => `<li><span>${escapeHtml(m.name || '')}</span><span class="price">${parseFloat(m.price || 0).toFixed(2)} ${SAR}</span></li>`).join('')}</ul>`
      : '<p>—</p>';

    const mealsTableHtml = meals.length
      ? `<table class="data-table">
          <thead><tr>
            <th>${L('Meal', 'الوجبة')}</th>
            <th class="num">${L('Qty/Day', 'كمية/يوم')}</th>
            <th class="num">${L('Price', 'السعر')} (${SAR})</th>
            <th class="num">${L('Daily', 'يومياً')} (${SAR})</th>
          </tr></thead>
          <tbody>${meals.map((m: any) => {
            const price = parseFloat(m.price || 0);
            const qty = Math.max(1, parseInt(m.qtyPerDay || 1) || 1);
            return `<tr>
              <td>${escapeHtml(m.name || '')}</td>
              <td class="num">${qty}</td>
              <td class="num">${price.toFixed(2)}</td>
              <td class="num">${(price * qty).toFixed(2)}</td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>`
      : '<p>—</p>';
    const totalMealsCount = meals.reduce((s: number, m: any) => s + (Math.max(1, parseInt(m.qtyPerDay || 1) || 1)), 0);

    const paymentScheduleHtml = installments.length
      ? `<table class="data-table">
          <thead><tr>
            <th>#</th>
            <th>${L('Description', 'الوصف')}</th>
            <th class="num">%</th>
            <th class="num">${L('Amount', 'المبلغ')} (${SAR})</th>
            <th>${L('Due Date', 'تاريخ الاستحقاق')}</th>
          </tr></thead>
          <tbody>${installments.map((it: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(it.label || '')}</td>
              <td class="num">${parseFloat(it.percent || 0).toFixed(2)}</td>
              <td class="num">${parseFloat(it.amount || 0).toFixed(2)}</td>
              <td>${fmtDate(it.dueDate)}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      : '';

    const placeholders: Record<string, string> = {
      my_restaurant_name: escapeHtml(restaurant?.name || ''),
      restaurant_cr: escapeHtml((restaurant as any)?.commercialRegistration || ''),
      restaurant_tax_number: escapeHtml((restaurant as any)?.taxNumber || ''),
      restaurant_national_id: escapeHtml((restaurant as any)?.nationalId || ''),
      contract_number: escapeHtml(contract.contractNumber || ''),
      contract_date: escapeHtml(fmtDate(contract.createdAt)),
      status: escapeHtml(statusVal),
      notes: escapeHtml((contract as any).notes || ''),
      client_name: escapeHtml(contract.clientName || ''),
      phone: escapeHtml(contract.clientPhone || ''),
      email: escapeHtml(contract.clientEmail || ''),
      delivery_location: escapeHtml(contract.deliveryLocation || ''),
      meals_list: mealsListHtml,
      meals_table: mealsTableHtml,
      total_meals_count: String(totalMealsCount),
      number_of_meals: String(contract.mealsPerDay || 0),
      delivery_days: escapeHtml(daysStr),
      delivery_time: escapeHtml(contract.deliveryTime || ''),
      total_value: escapeHtml(parseFloat(contract.totalValue || '0').toFixed(2) + ' ' + SAR),
      discount_percentage: escapeHtml(parseFloat(contract.discountPercent || '0').toFixed(2) + '%'),
      final_value: escapeHtml(parseFloat(contract.finalValue || '0').toFixed(2) + ' ' + SAR),
      payment_schedule: paymentScheduleHtml,
      start_date: escapeHtml(fmtDate(contract.startDate)),
      end_date: escapeHtml(fmtDate(contract.endDate)),
    };
    const customPhs = Array.isArray((defaultTpl as any)?.customPlaceholders)
      ? (defaultTpl as any).customPlaceholders as Array<{ key: string; value: string }>
      : [];
    for (const cp of customPhs) {
      if (cp && typeof cp.key === 'string' && cp.key.trim()) {
        placeholders[cp.key.trim()] = escapeHtml(String(cp.value ?? ''));
      }
    }

    // Render the Terms & Conditions template. If the template is plain text,
    // escape it and convert newlines to <br/>; if it contains HTML, trust the
    // author's markup. In both cases, substitute placeholders afterwards so
    // values like meals_list / payment_schedule keep their HTML fragments.
    const isHtmlTemplate = /<[a-z][^>]*>/i.test(tplContent);
    let termsBody = '';
    if (tplContent) {
      termsBody = isHtmlTemplate
        ? tplContent
        : tplContent.split('\n').map(line => escapeHtml(line)).join('<br/>');
      for (const [k, v] of Object.entries(placeholders)) {
        termsBody = termsBody.split(`{{${k}}}`).join(v);
      }
    }

    const labelValue = (label: string, value: string) =>
      `<div class="lv"><div class="lv-lbl">${escapeHtml(label)}</div><div class="lv-val">${escapeHtml(value || '—')}</div></div>`;

    const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${mode === 'quotation' ? 'Catering Quotation' : 'Catering Contract'} ${escapeHtml(contract.contractNumber || '')}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: ${isAr ? "'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"};
      color: #222;
      font-size: 12px;
      line-height: 1.55;
      direction: ${dir};
      text-align: ${align};
      margin: 0;
    }
    .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 12px; margin-bottom: 18px; }
    .header h1 { color: #1a365d; margin: 0; font-size: 22px; }
    .header .subtitle { color: #666; font-size: 11px; margin-top: 4px; }
    .meta {
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
      background: #f8fafc; padding: 10px 14px; border-radius: 6px;
      margin-bottom: 16px; font-size: 11px;
    }
    .meta .item { display: flex; gap: 6px; }
    .meta .item .lbl { color: #555; font-weight: 600; }
    h2.section {
      color: #1a365d; font-size: 14px; margin: 18px 0 8px 0;
      border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;
    }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; }
    .lv { display: flex; gap: 8px; padding: 3px 0; font-size: 11.5px; }
    .lv-lbl { color: #555; font-weight: 600; min-width: 120px; }
    .lv-val { color: #222; flex: 1; }
    ul.meals { list-style: none; padding: 0; margin: 4px 0; }
    ul.meals li {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 5px 8px; border-bottom: 1px dashed #e2e8f0;
    }
    ul.meals li .price { color: #1a365d; font-weight: 600; }
    .totals {
      margin-top: 8px; background: #f8fafc; padding: 10px 14px;
      border-radius: 6px; font-size: 12px;
    }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .totals .row.grand { font-weight: 700; color: #1a365d; border-top: 1px solid #cbd5e0; margin-top: 4px; padding-top: 6px; font-size: 13px; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    table.data-table th { background: #1a365d; color: #fff; padding: 8px 10px; text-align: ${align}; font-weight: 600; }
    table.data-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    table.data-table .num { text-align: ${isAr ? 'left' : 'right'}; font-variant-numeric: tabular-nums; }
    .terms { font-size: 11.5px; line-height: 1.7; }
    .terms p { margin: 6px 0; }
    .footer {
      position: fixed; bottom: 6mm; ${isAr ? 'right' : 'left'}: 14mm; ${isAr ? 'left' : 'right'}: 14mm;
      text-align: center; color: #999; font-size: 9.5px;
      border-top: 1px solid #e2e8f0; padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(restaurant?.name || '')}</h1>
    <div class="subtitle">${mode === 'quotation' ? L('Catering Quotation', 'عرض سعر تموين') : L('Catering Supply Contract', 'عقد توريد وجبات')}</div>
  </div>

  <div class="meta">
    <div class="item"><span class="lbl">${mode === 'quotation' ? L('Quotation #:', 'رقم العرض:') : L('Contract #:', 'رقم العقد:')}</span><span>${escapeHtml(contract.contractNumber || '')}</span></div>
    <div class="item"><span class="lbl">${L('Date:', 'التاريخ:')}</span><span>${escapeHtml(new Date(contract.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'))}</span></div>
    ${mode === 'quotation'
      ? `<div class="item"><span class="lbl">${L('Valid Until:', 'صالح حتى:')}</span><span>${escapeHtml(new Date(new Date(contract.createdAt).getTime() + 30 * 86400000).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'))}</span></div>`
      : `<div class="item"><span class="lbl">${L('Status:', 'الحالة:')}</span><span>${escapeHtml(statusVal)}</span></div>`}
  </div>

  <h2 class="section">${L('Client Information', 'بيانات العميل')}</h2>
  <div class="grid2">
    ${labelValue(L('Client Name:', 'اسم العميل:'), contract.clientName || '')}
    ${labelValue(L('Phone:', 'الهاتف:'), contract.clientPhone || '')}
    ${labelValue(L('Email:', 'البريد الإلكتروني:'), contract.clientEmail || '')}
    ${labelValue(L('Delivery Location:', 'موقع التوصيل:'), contract.deliveryLocation || '')}
  </div>

  <h2 class="section">${L('Delivery Details', 'تفاصيل التوصيل')}</h2>
  <div class="grid2">
    ${labelValue(L('Meals per Day:', 'الوجبات يومياً:'), String(contract.mealsPerDay || 0))}
    ${labelValue(L('Delivery Days:', 'أيام التوصيل:'), daysStr || '—')}
    ${labelValue(L('Delivery Time:', 'وقت التوصيل:'), contract.deliveryTime || '—')}
    ${labelValue(L('Start Date:', 'تاريخ البداية:'), fmtDate(contract.startDate))}
    ${labelValue(L('End Date:', 'تاريخ النهاية:'), fmtDate(contract.endDate))}
  </div>

  <h2 class="section">${L('Meals', 'الوجبات')}</h2>
  ${mealsListHtml}

  <h2 class="section">${L('Financial Summary', 'الملخص المالي')}</h2>
  <div class="totals">
    <div class="row"><span>${L('Total Value', 'القيمة الإجمالية')}</span><span>${escapeHtml(parseFloat(contract.totalValue || '0').toFixed(2) + ' ' + SAR)}</span></div>
    <div class="row"><span>${L('Discount', 'الخصم')}</span><span>${escapeHtml(parseFloat(contract.discountPercent || '0').toFixed(2) + ' %')}</span></div>
    <div class="row grand"><span>${L('Final Value', 'القيمة النهائية')}</span><span>${escapeHtml(parseFloat(contract.finalValue || '0').toFixed(2) + ' ' + SAR)}</span></div>
  </div>

  ${installments.length ? `<h2 class="section">${L('Payment Schedule', 'جدول السداد')}</h2>${paymentScheduleHtml}` : ''}

  ${mode === 'quotation' ? `<h2 class="section">${L('Quotation Notes', 'ملاحظات العرض')}</h2>
  <div class="terms">
    <p>${L('This quotation is valid for 30 days from the date of issue.', 'هذا العرض ساري لمدة 30 يوماً من تاريخ الإصدار.')}</p>
    <p>${L('Prices are inclusive of applicable VAT unless stated otherwise.', 'الأسعار شاملة ضريبة القيمة المضافة المطبقة ما لم يُذكر خلاف ذلك.')}</p>
    <p>${L('Final contract terms will be confirmed upon acceptance.', 'سيتم تأكيد الشروط النهائية للعقد عند القبول.')}</p>
  </div>` : ''}

  <h2 class="section">${L('Terms & Conditions', 'الشروط والأحكام')}</h2>
  <div class="terms">
    ${termsBody || `<p style="color:#888;">${L('No terms & conditions template configured.', 'لا يوجد قالب شروط وأحكام مُهيأ.')}</p>`}
  </div>

  <div class="footer">${L('Generated by BlindSpot System (BSS) — kinbss.org', 'تم الإنشاء بواسطة نظام بلايند سبوت (BSS) — kinbss.org')}</div>
</body>
</html>`;

    const puppeteer = await import("puppeteer");
    const { execSync } = await import("child_process");
    const { existsSync } = await import("fs");

    let chromiumPath: string | undefined = undefined;
    try {
      chromiumPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
      if (!chromiumPath || !existsSync(chromiumPath)) chromiumPath = undefined;
    } catch (e) {}

    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      });
      return Buffer.from(pdfData);
    } finally {
      await browser.close();
    }
  }

  app.get("/api/catering-contracts/:id/pdf", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const lang = String(req.query.lang || 'en');
      const mode = String(req.query.mode || 'contract') === 'quotation' ? 'quotation' : 'contract';
      const pdfBuffer = await buildCateringContractPdfBuffer(restaurantId, req.params.id, lang, mode);
      const filePrefix = mode === 'quotation' ? 'catering-quotation' : 'catering-contract';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}-${req.params.id}.pdf"`);
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating catering contract PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate/return a public share token + URL for WhatsApp PDF sharing
  app.post("/api/catering-contracts/:id/share-link", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const contract = await storage.getCateringContract(req.params.id, restaurantId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      let token = contract.shareToken;
      if (!token) {
        token = (await import('crypto')).randomBytes(24).toString('hex');
        await storage.updateCateringContract(contract.id, restaurantId, { shareToken: token } as any);
      }
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const url = `${proto}://${host}/api/public/catering-contracts/${token}/pdf`;
      res.json({ token, url });
    } catch (error: any) {
      console.error("Error creating share link:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // Catering installment invoice — bilingual ZATCA-style PDF
  // ---------------------------------------------------------------------------
  function buildZatcaPhase1QrTlv(sellerName: string, vatNumber: string, isoTimestamp: string, totalInclVat: string, vatAmount: string): string {
    const enc = (tag: number, value: string) => {
      const buf = Buffer.from(value, 'utf8');
      return Buffer.concat([Buffer.from([tag, buf.length]), buf]);
    };
    const tlv = Buffer.concat([
      enc(1, sellerName),
      enc(2, vatNumber),
      enc(3, isoTimestamp),
      enc(4, totalInclVat),
      enc(5, vatAmount),
    ]);
    return tlv.toString('base64');
  }

  async function buildCateringInstallmentInvoicePdfBuffer(
    restaurantId: string,
    contractId: string,
    installmentIndex: number,
    lang: string = 'en',
  ): Promise<Buffer> {
    const contract = await storage.getCateringContract(contractId, restaurantId);
    if (!contract) throw new Error("Contract not found");
    const installments = Array.isArray(contract.paymentInstallments) ? contract.paymentInstallments as Array<any> : [];
    const inst = installments[installmentIndex];
    if (!inst) throw new Error("Installment not found");
    const restaurant = await storage.getRestaurant(restaurantId);
    const settings = await storage.getSettings(restaurantId);

    const isAr = lang === 'ar' || lang === 'Arabic' || lang === 'Urdu' || lang === 'ur';
    const L = (en: string, ar: string) => isAr ? ar : en;
    const dir = isAr ? 'rtl' : 'ltr';
    const align = isAr ? 'right' : 'left';
    const SAR = L('SAR', 'ر.س');

    const totalInclVat = parseFloat(inst.amount || 0);
    const baseAmount = totalInclVat / 1.15;
    const vatAmount = totalInclVat - baseAmount;
    const fmt = (n: number) => n.toFixed(2);

    const invoiceNumber = `CAT-${contract.contractNumber}-${installmentIndex + 1}`;
    const issuedAt = inst.issuedAt ? new Date(inst.issuedAt) : new Date();
    const sellerName = settings?.restaurantName || restaurant?.name || 'Restaurant';
    const vatNumber = settings?.vatNumber || (restaurant as any)?.taxNumber || '';
    const qrTlv = buildZatcaPhase1QrTlv(sellerName, vatNumber, issuedAt.toISOString(), fmt(totalInclVat), fmt(vatAmount));
    const QR = (await import('qrcode')).default;
    const qrDataUrl = await QR.toDataURL(qrTlv, { width: 140, margin: 1 });

    const html = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(invoiceNumber)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: ${isAr ? "'Noto Naskh Arabic','Amiri',Arial,sans-serif" : "'Segoe UI',Arial,sans-serif"}; color:#222; font-size:12px; direction:${dir}; text-align:${align}; margin:0; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1a365d; padding-bottom:10px; margin-bottom:14px; gap:14px; }
  .head .co h1 { color:#1a365d; margin:0 0 4px; font-size:20px; }
  .head .co p { margin:1px 0; font-size:11px; color:#555; }
  .head .ttl { text-align:${isAr ? 'left' : 'right'}; }
  .head .ttl h2 { color:#1a365d; margin:0; font-size:18px; }
  .head .ttl p { margin:2px 0; font-size:11px; color:#555; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6px 18px; margin:8px 0 16px; }
  .lv { display:flex; gap:8px; padding:3px 0; font-size:11.5px; }
  .lv .l { color:#555; font-weight:600; min-width:120px; }
  table.t { width:100%; border-collapse:collapse; font-size:11.5px; margin:6px 0; }
  table.t th { background:#1a365d; color:#fff; padding:8px 10px; text-align:${align}; }
  table.t td { padding:8px 10px; border-bottom:1px solid #e2e8f0; }
  table.t .num { text-align:${isAr ? 'left' : 'right'}; font-variant-numeric: tabular-nums; }
  .totals { margin-top:8px; background:#f8fafc; padding:10px 14px; border-radius:6px; max-width:340px; ${isAr ? 'margin-right:auto;' : 'margin-left:auto;'} }
  .totals .row { display:flex; justify-content:space-between; padding:3px 0; }
  .totals .row.grand { font-weight:700; color:#1a365d; border-top:1px solid #cbd5e0; margin-top:4px; padding-top:6px; font-size:13px; }
  .qrbox { text-align:center; margin-top:14px; }
  .qrbox img { width:140px; height:140px; }
  .qrbox p { font-size:10px; color:#666; margin:4px 0 0; }
  .footer { text-align:center; color:#999; font-size:10px; margin-top:18px; border-top:1px solid #e2e8f0; padding-top:6px; }
  .badge { display:inline-block; padding:2px 8px; background:#1a365d; color:#fff; border-radius:4px; font-size:10px; }
</style>
</head>
<body>
  <div class="head">
    <div class="co">
      <h1>${escapeHtml(sellerName)}</h1>
      ${vatNumber ? `<p><strong>${L('VAT #', 'الرقم الضريبي')}:</strong> ${escapeHtml(vatNumber)}</p>` : ''}
      ${settings?.address ? `<p>${escapeHtml(settings.address)}</p>` : ''}
      ${settings?.phone ? `<p>${escapeHtml(settings.phone)}</p>` : ''}
    </div>
    <div class="ttl">
      <h2>${L('Tax Invoice', 'فاتورة ضريبية')}</h2>
      <p><strong>#</strong> ${escapeHtml(invoiceNumber)}</p>
      <p>${escapeHtml(issuedAt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'))} ${escapeHtml(issuedAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-GB'))}</p>
      <p><span class="badge">${L('Simplified', 'مبسطة')}</span></p>
    </div>
  </div>

  <div class="grid2">
    <div class="lv"><span class="l">${L('Customer', 'العميل')}:</span><span>${escapeHtml(contract.clientName || '—')}</span></div>
    <div class="lv"><span class="l">${L('Phone', 'الهاتف')}:</span><span>${escapeHtml(contract.clientPhone || '—')}</span></div>
    <div class="lv"><span class="l">${L('Contract #', 'رقم العقد')}:</span><span>${escapeHtml(contract.contractNumber || '—')}</span></div>
    <div class="lv"><span class="l">${L('Installment', 'القسط')}:</span><span>${installmentIndex + 1} ${L('of', 'من')} ${installments.length}</span></div>
  </div>

  <table class="t">
    <thead><tr>
      <th>${L('Description', 'الوصف')}</th>
      <th class="num">${L('Qty', 'الكمية')}</th>
      <th class="num">${L('Net', 'الصافي')} (${SAR})</th>
      <th class="num">${L('VAT 15%', 'ضريبة 15%')} (${SAR})</th>
      <th class="num">${L('Total', 'الإجمالي')} (${SAR})</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>${L('Catering Contract Installment', 'قسط عقد تموين')}${inst.label ? ` — ${escapeHtml(inst.label)}` : ''}</td>
        <td class="num">1</td>
        <td class="num">${fmt(baseAmount)}</td>
        <td class="num">${fmt(vatAmount)}</td>
        <td class="num">${fmt(totalInclVat)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>${L('Subtotal', 'المجموع الفرعي')}</span><span>${fmt(baseAmount)} ${SAR}</span></div>
    <div class="row"><span>${L('VAT 15%', 'ضريبة القيمة المضافة 15%')}</span><span>${fmt(vatAmount)} ${SAR}</span></div>
    <div class="row grand"><span>${L('Total', 'الإجمالي')}</span><span>${fmt(totalInclVat)} ${SAR}</span></div>
  </div>

  <div class="qrbox">
    <img src="${qrDataUrl}" alt="ZATCA QR" />
    <p>${L('ZATCA Compliant E-Invoice', 'فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك')}</p>
  </div>

  <div class="footer">${L('Generated by BlindSpot System (BSS) — kinbss.org', 'تم الإنشاء بواسطة نظام بلايند سبوت (BSS) — kinbss.org')}</div>
</body>
</html>`;

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      });
      return Buffer.from(pdfData);
    } finally {
      await page.close().catch(() => {});
    }
  }

  // POST /api/catering-contracts/:id/installments/:index/issue
  // Marks an installment as issued, creates a Transaction (revenue record)
  // tagged to the contract, eagerly generates the invoice PDF, and mints a
  // public invoice token. Atomic + idempotent via a DB transaction with row
  // locking — concurrent calls cannot double-count revenue.
  app.post("/api/catering-contracts/:id/installments/:index/issue", requireAuth, requireRestaurant, requireAction('catering', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const index = parseInt(req.params.index, 10);
      const contractId = req.params.id;

      const buildPublicUrl = (token: string) => {
        const base = (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
        if (base) return `${base}/api/public/catering-invoices/${token}/pdf`;
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        return `${proto}://${host}/api/public/catering-invoices/${token}/pdf`;
      };

      const { cateringContracts, transactions } = await import('@shared/schema');
      const { and: andOp, eq: eqOp } = await import('drizzle-orm');

      const result = await db.transaction(async (tx) => {
        // Lock the contract row for the duration of the transaction so
        // concurrent issue requests are serialized.
        const locked = await tx
          .select()
          .from(cateringContracts)
          .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)))
          .for('update');
        const contract = locked[0];
        if (!contract) {
          const err: any = new Error("Contract not found"); err.code = 404; throw err;
        }
        const installments = Array.isArray(contract.paymentInstallments)
          ? [...(contract.paymentInstallments as Array<any>)]
          : [];
        if (!Number.isFinite(index) || index < 0 || index >= installments.length) {
          const err: any = new Error("Installment not found"); err.code = 404; throw err;
        }
        const current = installments[index] || {};
        const amount = parseFloat(current.amount || 0);
        if (!(amount > 0)) {
          const err: any = new Error("Installment amount must be > 0"); err.code = 400; throw err;
        }

        // Idempotent: already issued → return existing token (regenerate if missing).
        if (current.status === 'issued') {
          let token = current.invoiceToken;
          if (!token) {
            token = (await import('crypto')).randomBytes(24).toString('hex');
            installments[index] = { ...current, invoiceToken: token };
            await tx.update(cateringContracts)
              .set({ paymentInstallments: installments as any })
              .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)));
          }
          return { alreadyIssued: true, token, installment: installments[index] };
        }

        const subtotal = amount / 1.15;
        const tax = amount - subtotal;
        const issuedAtIso = new Date().toISOString();
        const token = (await import('crypto')).randomBytes(24).toString('hex');

        // Mark installment first inside the txn so the PDF builder (which reads
        // the contract from storage) sees the issued state, then we create the
        // revenue transaction. If anything throws, the whole txn rolls back.
        installments[index] = {
          ...current,
          status: 'issued',
          issuedAt: issuedAtIso,
          invoiceToken: token,
        };
        await tx.update(cateringContracts)
          .set({ paymentInstallments: installments as any })
          .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)));

        // Eagerly generate the bilingual ZATCA PDF (issuance triggers
        // invoice generation, per task spec). If this throws, the txn rolls
        // back and no revenue is recorded.
        const lang = String(req.query.lang || 'en');
        const pdfBuffer = await buildCateringInstallmentInvoicePdfBuffer(restaurantId, contractId, index, lang);

        // Insert the revenue transaction inside the same DB txn.
        const inserted = await tx.insert(transactions).values({
          restaurantId,
          transactionId: `CATER-${contractId.substring(0, 8)}-${index + 1}-${Date.now()}`,
          itemCount: 1,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: amount.toFixed(2),
          paymentMethod: 'Catering Installment',
        }).returning();
        const txn = inserted[0];

        // Persist the cached PDF + revenueOrderId on the installment.
        installments[index] = {
          ...installments[index],
          revenueOrderId: txn.id,
          invoicePdfB64: pdfBuffer.toString('base64'),
        };
        await tx.update(cateringContracts)
          .set({ paymentInstallments: installments as any })
          .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)));

        return { alreadyIssued: false, token, installment: installments[index] };
      });

      // Strip the heavy base64 PDF from the response payload.
      const { invoicePdfB64, ...installmentForClient } = result.installment as any;
      res.json({
        alreadyIssued: result.alreadyIssued,
        token: result.token,
        url: buildPublicUrl(result.token),
        installment: installmentForClient,
      });
    } catch (error: any) {
      console.error("Error issuing catering installment:", error);
      const code = error?.code === 404 ? 404 : error?.code === 400 ? 400 : 500;
      res.status(code).json({ message: error.message });
    }
  });

  // POST /api/catering-contracts/:id/installments/:index/undo
  // Reverses an issued installment atomically: deletes the revenue
  // transaction and clears status/issuedAt/revenueOrderId/invoiceToken in a
  // single DB transaction. Fails hard if deletion fails (no orphaned revenue).
  app.post("/api/catering-contracts/:id/installments/:index/undo", requireAuth, requireRestaurant, requireAction('catering', 'edit'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const contractId = req.params.id;
      const index = parseInt(req.params.index, 10);
      const { cateringContracts, transactions } = await import('@shared/schema');
      const { and: andOp, eq: eqOp } = await import('drizzle-orm');

      const installmentForClient = await db.transaction(async (tx) => {
        const locked = await tx
          .select()
          .from(cateringContracts)
          .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)))
          .for('update');
        const contract = locked[0];
        if (!contract) { const err: any = new Error("Contract not found"); err.code = 404; throw err; }
        const installments = Array.isArray(contract.paymentInstallments)
          ? [...(contract.paymentInstallments as Array<any>)]
          : [];
        if (!Number.isFinite(index) || index < 0 || index >= installments.length) {
          const err: any = new Error("Installment not found"); err.code = 404; throw err;
        }
        const current = installments[index] || {};
        if (current.status !== 'issued') {
          const err: any = new Error("Installment is not issued"); err.code = 400; throw err;
        }
        if (current.revenueOrderId) {
          const deleted = await tx.delete(transactions)
            .where(andOp(eqOp(transactions.id, current.revenueOrderId), eqOp(transactions.restaurantId, restaurantId)))
            .returning({ id: transactions.id });
          if (deleted.length === 0) {
            // Hard fail: revenue row could not be removed (missing or
            // cross-tenant). Roll back so installment state stays 'issued'
            // and no inconsistent state is committed.
            const err: any = new Error("Revenue transaction could not be reversed; refusing to clear installment state");
            err.code = 409;
            throw err;
          }
        }
        installments[index] = {
          label: current.label,
          percent: current.percent,
          amount: current.amount,
          dueDate: current.dueDate,
        };
        await tx.update(cateringContracts)
          .set({ paymentInstallments: installments as any })
          .where(andOp(eqOp(cateringContracts.id, contractId), eqOp(cateringContracts.restaurantId, restaurantId)));
        return installments[index];
      });

      res.json({ success: true, installment: installmentForClient });
    } catch (error: any) {
      console.error("Error undoing catering installment:", error);
      const code = error?.code === 404 ? 404 : error?.code === 400 ? 400 : 500;
      res.status(code).json({ message: error.message });
    }
  });

  // Public installment invoice PDF (no auth — token-gated)
  app.get("/api/public/catering-invoices/:token/pdf", async (req, res) => {
    try {
      const token = req.params.token;
      if (!token) return res.status(404).send('Not found');
      const { db } = await import('./db');
      const { cateringContracts } = await import('@shared/schema');
      const { sql: sqlOp } = await import('drizzle-orm');
      // Find contract whose paymentInstallments contains an object with this invoiceToken
      const rows = await db.select().from(cateringContracts)
        .where(sqlOp`${cateringContracts.paymentInstallments} @> ${JSON.stringify([{ invoiceToken: token }])}::jsonb`);
      const contract = rows[0];
      if (!contract) return res.status(404).send('Not found');
      const installments = Array.isArray(contract.paymentInstallments) ? contract.paymentInstallments as Array<any> : [];
      const index = installments.findIndex(it => it && it.invoiceToken === token);
      if (index < 0) return res.status(404).send('Not found');
      const lang = String(req.query.lang || 'en');
      const inst = installments[index] || {};
      // Serve cached PDF if eagerly generated at issuance; otherwise render now.
      let pdfBuffer: Buffer;
      if (inst.invoicePdfB64 && typeof inst.invoicePdfB64 === 'string' && lang === 'en') {
        pdfBuffer = Buffer.from(inst.invoicePdfB64, 'base64');
      } else {
        pdfBuffer = await buildCateringInstallmentInvoicePdfBuffer(contract.restaurantId, contract.id, index, lang);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('Content-Disposition', `inline; filename="catering-invoice-${contract.contractNumber}-${index + 1}.pdf"`);
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating public catering invoice PDF:", error);
      res.status(500).send('Error generating PDF');
    }
  });

  // Public PDF download by share token (no auth) — for WhatsApp recipients
  app.get("/api/public/catering-contracts/:token/pdf", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { cateringContracts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [contract] = await db.select().from(cateringContracts).where(eq(cateringContracts.shareToken, req.params.token));
      if (!contract) return res.status(404).send('Not found');
      const lang = String(req.query.lang || 'en');
      const mode = String(req.query.mode || 'contract') === 'quotation' ? 'quotation' : 'contract';
      const pdfBuffer = await buildCateringContractPdfBuffer(contract.restaurantId, contract.id, lang, mode);
      const filePrefix = mode === 'quotation' ? 'catering-quotation' : 'catering-contract';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('Content-Disposition', `inline; filename="${filePrefix}-${contract.contractNumber}.pdf"`);
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating public catering PDF:", error);
      res.status(500).send('Error generating PDF');
    }
  });

  app.post("/api/catering-contracts/:id/send-email", requireAuth, requireRestaurant, requirePermission('catering'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const contract = await storage.getCateringContract(req.params.id, restaurantId);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      if (!contract.clientEmail) return res.status(400).json({ message: "Client email not set" });

      const lang = String(req.query.lang || 'en');
      const pdfBuffer = await buildCateringContractPdfBuffer(restaurantId, req.params.id, lang);

      // Try Resend integration first (supports attachments natively)
      let sent = false;
      let sendError: string | undefined;
      try {
        const { Resend } = await import('resend');
        let apiKey: string | undefined;
        let fromEmail: string | undefined;
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY
          ? 'repl ' + process.env.REPL_IDENTITY
          : process.env.WEB_REPL_RENEWAL
          ? 'depl ' + process.env.WEB_REPL_RENEWAL
          : null;
        if (xReplitToken && hostname) {
          const r = await fetch(
            'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
            { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
          );
          const data = await r.json();
          const s = data.items?.[0]?.settings;
          if (s?.api_key) { apiKey = s.api_key; fromEmail = s.from_email; }
        }
        if (!apiKey) apiKey = process.env.RESEND_API_KEY;
        if (!fromEmail) fromEmail = process.env.EMAIL_FROM || process.env.IT_EMAIL || 'IT@kinbss.org';
        if (apiKey) {
          const resend = new Resend(apiKey);
          const data: any = await resend.emails.send({
            from: fromEmail!,
            to: contract.clientEmail,
            subject: `Catering Contract ${contract.contractNumber}`,
            html: `<p>Dear ${escapeHtml(contract.clientName)},</p><p>Please find attached your catering supply contract <strong>${escapeHtml(contract.contractNumber)}</strong>.</p><p>Thank you.</p>`,
            text: `Catering Contract ${contract.contractNumber}\n\nPlease find attached.`,
            attachments: [{
              filename: `catering-contract-${contract.contractNumber}.pdf`,
              content: Buffer.from(pdfBuffer),
            }],
          });
          if (data?.error) { sendError = data.error.message; }
          else { sent = true; }
        }
      } catch (e: any) {
        sendError = e.message;
      }
      // Fallback to SMTP if Resend not available
      if (!sent) {
        const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        if (!hasSmtp) {
          const detail = sendError
            ? `Resend error: ${sendError}`
            : 'No email provider is configured. Please ask your administrator to set RESEND_API_KEY (or SMTP_HOST/SMTP_USER/SMTP_PASSWORD) on the server.';
          return res.status(500).json({ message: detail });
        }
        const { sendGenericEmail } = await import('./emailService');
        const result = await sendGenericEmail({
          to: contract.clientEmail,
          subject: `Catering Contract ${contract.contractNumber}`,
          html: `<p>Dear ${escapeHtml(contract.clientName)},</p><p>Please find attached your catering supply contract <strong>${escapeHtml(contract.contractNumber)}</strong>.</p><p>Thank you.</p>`,
          text: `Catering Contract ${contract.contractNumber}\n\nPlease find attached.`,
          attachments: [{ filename: `catering-contract-${contract.contractNumber}.pdf`, content: Buffer.from(pdfBuffer), contentType: 'application/pdf' }],
        });
        if (!result.ok) return res.status(500).json({ message: sendError || result.error || 'Failed to send email' });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error emailing catering contract:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============== COMPANY PROFILE ==============
  app.get("/api/company-profile", requireAuth, requireRestaurant, async (req: any, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.session.user.restaurantId);
      res.json(profile || null);
    } catch (error: any) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/company-profile", requireAuth, requireRestaurant, async (req: any, res) => {
    try {
      const parsed = insertCompanyProfileSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", errors: parsed.error.errors });
      }
      const { restaurantId: _ignored, ...data } = parsed.data as any;
      const profile = await storage.upsertCompanyProfile(req.session.user.restaurantId, data);
      res.json(profile);
    } catch (error: any) {
      console.error("Error saving company profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/company-profile/pdf", requireAuth, requireRestaurant, async (req: any, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.session.user.restaurantId);
      if (!profile) return res.status(404).json({ message: "Company profile not found. Save it first." });
      const pdf = await generateCompanyProfilePDF(profile);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="company-profile.pdf"`);
      res.send(pdf);
    } catch (error: any) {
      console.error("Error generating company profile PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/company-profile/business-card/pdf", requireAuth, requireRestaurant, async (req: any, res) => {
    try {
      const profile = await storage.getCompanyProfile(req.session.user.restaurantId);
      if (!profile) return res.status(404).json({ message: "Company profile not found. Save it first." });
      const pdf = await generateBusinessCardPDF(profile);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="business-card.pdf"`);
      res.send(pdf);
    } catch (error: any) {
      console.error("Error generating business card PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============== IT INSPECTION TOOLS ==============
  app.get("/api/it/inspection/health", requireAuth, requireITAccount, async (req, res) => {
    const start = Date.now();
    const memUsage = process.memoryUsage();
    let dbStatus = "unknown";
    let dbLatencyMs = 0;
    let dbVersion = "";
    try {
      const dbStart = Date.now();
      const { pool } = await import("./db");
      const r = await pool.query("SELECT version()");
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "ok";
      dbVersion = String(r.rows?.[0]?.version || "").split(" ").slice(0, 2).join(" ");
    } catch (e: any) {
      dbStatus = "error: " + (e?.message || String(e));
    }
    res.json({
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024),
      },
      database: { status: dbStatus, latencyMs: dbLatencyMs, version: dbVersion },
      responseTimeMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/it/inspection/schema", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { pool } = await import("./db");
      const r = await pool.query(`
        SELECT table_name, 
          (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      const counts = await Promise.all(
        r.rows.map(async (row: any) => {
          try {
            const c = await pool.query(`SELECT COUNT(*)::int AS n FROM "${row.table_name}"`);
            return { table: row.table_name, columns: Number(row.column_count), rows: c.rows[0].n };
          } catch {
            return { table: row.table_name, columns: Number(row.column_count), rows: -1 };
          }
        })
      );
      res.json({ tables: counts, totalTables: counts.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  app.get("/api/it/inspection/sessions", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { pool } = await import("./db");
      const r = await pool.query(`
        SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE expire > NOW())::int AS active,
          COUNT(*) FILTER (WHERE expire <= NOW())::int AS expired
        FROM session
      `).catch(() => ({ rows: [{ total: 0, active: 0, expired: 0 }] }));
      res.json(r.rows[0]);
    } catch (e: any) {
      res.json({ total: 0, active: 0, expired: 0, error: e?.message });
    }
  });

  app.get("/api/it/inspection/routes", requireAuth, requireITAccount, async (req, res) => {
    const routes: any[] = [];
    const stack = (app as any)._router?.stack || [];
    for (const layer of stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        routes.push({ path: layer.route.path, methods });
      }
    }
    res.json({ total: routes.length, routes });
  });

  // JSON graph of the real app: pages -> routes -> storage -> tables -> external.
  // Curated map (shared/appGraph.ts) augmented with a live route count from Express.
  // Walk Express _router.stack and extract every (method, path) route. Handles
  // routes registered directly on app as well as inside any sub-routers.
  function collectLiveRoutes(): { method: string; path: string }[] {
    const out: { method: string; path: string }[] = [];
    const visit = (stack: any[], prefix = "") => {
      for (const layer of stack || []) {
        if (layer?.route?.path) {
          const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);
          const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
          for (const p of paths) {
            for (const m of methods) out.push({ method: m.toUpperCase(), path: prefix + p });
          }
        } else if (layer?.name === "router" && layer?.handle?.stack) {
          visit(layer.handle.stack, prefix);
        }
      }
    };
    try { visit((app as any)?._router?.stack || []); } catch {}
    return out;
  }

  app.get("/api/it/app-diagram/graph", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { buildAppGraph } = await import("@shared/appGraph");
      const liveRoutes = collectLiveRoutes();
      res.json(buildAppGraph(liveRoutes.length, liveRoutes));
    } catch (e: any) {
      console.error("[AppDiagram graph] error:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  app.get("/api/it/app-diagram/pdf", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { buildAppGraph, renderAppDiagramHtml } = await import("@shared/appGraph");
      const { getBrowser } = await import("./invoice");
      const liveRoutes = collectLiveRoutes();
      const html = renderAppDiagramHtml(buildAppGraph(liveRoutes.length, liveRoutes));
      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({ format: "A3", landscape: true, printBackground: true, margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" } });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="bss-app-diagram-${new Date().toISOString().slice(0, 10)}.pdf"`);
        res.send(Buffer.from(pdf));
      } finally {
        await page.close();
      }
    } catch (e: any) {
      console.error("[AppDiagram PDF] error:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  app.post("/api/it/inspection/test-endpoint", requireAuth, requireITAccount, async (req, res) => {
    const { method, path: testPath } = req.body || {};
    if (!method || !testPath) return res.status(400).json({ error: "method and path required" });
    const start = Date.now();
    try {
      const port = process.env.PORT || 5000;
      const url = `http://localhost:${port}${testPath}`;
      const r = await fetch(url, { method: String(method).toUpperCase(), headers: { Cookie: req.headers.cookie || "" } });
      const text = await r.text();
      res.json({
        status: r.status,
        ok: r.ok,
        latencyMs: Date.now() - start,
        bodyPreview: text.slice(0, 500),
        contentType: r.headers.get("content-type"),
      });
    } catch (e: any) {
      res.json({ status: 0, ok: false, latencyMs: Date.now() - start, error: e?.message });
    }
  });

  // ====================== Marketing Tools (Multi-tenant) ======================
  // Discount Codes
  app.get("/api/marketing/discount-codes", requireAuth, requireRestaurant, requirePermission('marketing'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const codes = await storage.getMarketingDiscountCodes(restaurantId);
      res.json(codes);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to fetch discount codes" });
    }
  });

  app.post("/api/marketing/discount-codes", requireAuth, requireRestaurant, requireAction('marketing', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const body = {
        ...req.body,
        restaurantId,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      };
      const data = insertMarketingDiscountCodeSchema.parse(body);
      const created = await storage.createMarketingDiscountCode(data);
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid discount code data", details: e.errors });
      }
      res.status(500).json({ error: e?.message || "Failed to create discount code" });
    }
  });

  app.delete("/api/marketing/discount-codes/:id", requireAuth, requireRestaurant, requireAction('marketing', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const ok = await storage.deleteMarketingDiscountCode(req.params.id, restaurantId);
    if (!ok) return res.status(404).json({ error: "Discount code not found" });
    res.status(204).send();
  });

  // Broadcast Templates
  app.get("/api/marketing/broadcast-templates", requireAuth, requireRestaurant, requirePermission('marketing'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const templates = await storage.getMarketingBroadcastTemplates(restaurantId);
      res.json(templates);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to fetch broadcast templates" });
    }
  });

  app.post("/api/marketing/broadcast-templates", requireAuth, requireRestaurant, requireAction('marketing', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const data = insertMarketingBroadcastTemplateSchema.parse({ ...req.body, restaurantId });
      const created = await storage.createMarketingBroadcastTemplate(data);
      res.status(201).json(created);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid broadcast template data", details: e.errors });
      }
      res.status(500).json({ error: e?.message || "Failed to create broadcast template" });
    }
  });

  app.delete("/api/marketing/broadcast-templates/:id", requireAuth, requireRestaurant, requireAction('marketing', 'delete'), async (req, res) => {
    const restaurantId = req.session.user!.restaurantId!;
    const ok = await storage.deleteMarketingBroadcastTemplate(req.params.id, restaurantId);
    if (!ok) return res.status(404).json({ error: "Broadcast template not found" });
    res.status(204).send();
  });

  // Promo Poster PDF (A4) generated via Puppeteer
  app.post("/api/marketing/poster-pdf", requireAuth, requireRestaurant, requireAction('marketing', 'add'), async (req, res) => {
    try {
      const restaurantId = req.session.user!.restaurantId!;
      const rawTitle = String(req.body?.title || "").slice(0, 200);
      const rawBody = String(req.body?.body || "").slice(0, 2000);
      const rawPrice = String(req.body?.price || "").slice(0, 50);
      const rawImage = String(req.body?.imageDataUrl || "");
      const rawAccent = String(req.body?.accentColor || "#7c3aed");

      // Strict validation to prevent SSRF / resource exhaustion
      const accentColor = /^#[0-9a-fA-F]{6}$/.test(rawAccent) ? rawAccent : "#7c3aed";
      // Allow only inline data URIs (image/png|jpeg|webp|gif) up to ~6MB encoded
      const imageDataUrl = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(rawImage) && rawImage.length < 6 * 1024 * 1024
        ? rawImage
        : "";
      const title = rawTitle;
      const body = rawBody;
      const price = rawPrice;

      // Load business info — accept inline data URIs OR resolve same-origin
      // uploaded logo paths (/uploads/logos/*) safely from local disk to embed
      // as data URI. No arbitrary remote URLs are fetched (SSRF safe).
      let logoUrl = "";
      let businessName = "";
      try {
        const settings = await storage.getSettings(restaurantId);
        const candidate = String((settings as any)?.logoUrl || "");
        if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/.test(candidate)) {
          logoUrl = candidate;
        } else if (/^\/uploads\/logos\/[A-Za-z0-9._-]+$/.test(candidate)) {
          try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const safeName = candidate.replace(/^\/uploads\/logos\//, "");
            const filePath = path.join(process.cwd(), "public", "uploads", "logos", safeName);
            const buf = await fs.readFile(filePath);
            if (buf.length < 4 * 1024 * 1024) {
              const ext = safeName.split(".").pop()?.toLowerCase() || "";
              const mime =
                ext === "png" ? "image/png" :
                ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
                ext === "webp" ? "image/webp" :
                ext === "gif" ? "image/gif" :
                ext === "svg" ? "image/svg+xml" : "";
              if (mime) logoUrl = `data:${mime};base64,${buf.toString("base64")}`;
            }
          } catch {}
        }
        businessName = (settings as any)?.restaurantName || "";
      } catch {}

      const escapeHtml = (s: string) =>
        String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

      const html = `<!doctype html>
<html><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif; }
  .poster { width: 210mm; height: 297mm; background: linear-gradient(135deg, ${accentColor}22, #ffffff 60%); display: flex; flex-direction: column; position: relative; padding: 18mm; box-sizing: border-box; }
  .header { display: flex; align-items: center; gap: 12mm; }
  .logo { width: 28mm; height: 28mm; object-fit: contain; border-radius: 6mm; background: #fff; padding: 2mm; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .biz { font-size: 14pt; color: #555; }
  .title { margin-top: 12mm; font-size: 44pt; font-weight: 800; color: #111; line-height: 1.1; }
  .image-wrap { margin-top: 10mm; flex: 1; display: flex; align-items: center; justify-content: center; background: #fafafa; border-radius: 6mm; overflow: hidden; max-height: 140mm; }
  .image-wrap img { max-width: 100%; max-height: 140mm; object-fit: contain; }
  .body { margin-top: 8mm; font-size: 16pt; color: #333; line-height: 1.4; white-space: pre-wrap; }
  .price-bar { margin-top: 8mm; display: flex; align-items: center; justify-content: space-between; padding: 8mm 10mm; border-radius: 5mm; background: ${accentColor}; color: #fff; }
  .price-label { font-size: 14pt; opacity: 0.9; }
  .price-value { font-size: 30pt; font-weight: 800; }
  .footer { margin-top: 6mm; font-size: 10pt; color: #888; text-align: center; }
</style></head>
<body>
  <div class="poster">
    <div class="header">
      ${logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}"/>` : ''}
      <div class="biz">${escapeHtml(businessName)}</div>
    </div>
    <div class="title">${escapeHtml(title)}</div>
    ${imageDataUrl ? `<div class="image-wrap"><img src="${escapeHtml(imageDataUrl)}"/></div>` : ''}
    ${body ? `<div class="body">${escapeHtml(body)}</div>` : ''}
    ${price ? `<div class="price-bar"><div class="price-label">Price</div><div class="price-value">${escapeHtml(String(price))}</div></div>` : ''}
    <div class="footer">${escapeHtml(businessName)} &middot; ${new Date().toLocaleDateString()}</div>
  </div>
</body></html>`;

      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await page.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="promo-poster.pdf"');
      res.send(Buffer.from(pdf));
    } catch (e: any) {
      console.error('[Marketing] Poster PDF error:', e);
      res.status(500).json({ error: e?.message || 'Failed to generate poster' });
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
        
        const { restaurantId: rawRestaurantId, id: userId } = session.user;
        // IT accounts have null/undefined restaurantId - mark them with sentinel value
        const restaurantId = rawRestaurantId || 'IT_ACCOUNT';
        const isITAccount = !rawRestaurantId;
        
        wss.handleUpgrade(request, socket, head, async (ws) => {
          // Fetch user's conversations to enable participant-only message delivery
          // Skip for IT accounts as they don't have restaurant-specific conversations
          let conversationIds = new Set<string>();
          if (!isITAccount) {
            try {
              const conversations = await storage.getConversations(rawRestaurantId, userId);
              conversationIds = new Set(conversations.map((c: any) => c.id));
            } catch (error) {
              console.error('[WebSocket] Failed to load conversations:', error);
            }
          }
          
          const client: WSClient = {
            socket: ws,
            restaurantId,
            userId,
            conversationIds,
          };
          
          console.log(`[WebSocket] Client connected: user=${userId}, restaurant=${restaurantId}${isITAccount ? ' (IT Account)' : ''}, conversations=${conversationIds.size}`);
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
