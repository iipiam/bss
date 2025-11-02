import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateZATCAInvoice } from "./invoice";
import {
  insertBranchSchema,
  insertInventoryItemSchema,
  insertMenuItemSchema,
  insertRecipeSchema,
  insertOrderSchema,
  insertTransactionSchema,
  insertSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Branches
  app.get("/api/branches", async (_req, res) => {
    const branches = await storage.getBranches();
    res.json(branches);
  });

  app.get("/api/branches/:id", async (req, res) => {
    const branch = await storage.getBranch(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json(branch);
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const data = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.patch("/api/branches/:id", async (req, res) => {
    try {
      const branch = await storage.updateBranch(req.params.id, req.body);
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const items = await storage.getInventoryItems(branchId);
    res.json(items);
  });

  app.get("/api/inventory/:id", async (req, res) => {
    const item = await storage.getInventoryItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const data = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    const success = await storage.deleteInventoryItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  });

  // Menu
  app.get("/api/menu", async (_req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.get("/api/menu/:id", async (req, res) => {
    const item = await storage.getMenuItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(item);
  });

  app.post("/api/menu", async (req, res) => {
    try {
      const data = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(data);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });

  app.patch("/api/menu/:id", async (req, res) => {
    try {
      const item = await storage.updateMenuItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    const success = await storage.deleteMenuItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.status(204).send();
  });

  // Recipes
  app.get("/api/recipes", async (_req, res) => {
    const recipes = await storage.getRecipes();
    res.json(recipes);
  });

  app.get("/api/recipes/:id", async (req, res) => {
    const recipe = await storage.getRecipe(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const data = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.patch("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.updateRecipe(req.params.id, req.body);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    const success = await storage.deleteRecipe(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(204).send();
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const status = req.query.status as string | undefined;
    const orders = await storage.getOrders(branchId, status);
    res.json(orders);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const data = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(data);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  // Transactions (Sales)
  app.get("/api/transactions", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const transactions = await storage.getTransactions(branchId, startDate, endDate);
    res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/dashboard", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const orders = await storage.getOrders(branchId);
    const transactions = await storage.getTransactions(branchId);
    const inventory = await storage.getInventoryItems(branchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysTransactions = transactions.filter(t => new Date(t.createdAt) >= today);

    const todaysSales = todaysTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const activeOrders = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").length;
    const lowStockItems = inventory.filter(i => i.status === "Low Stock").length;

    res.json({
      todaysSales: todaysSales.toFixed(2),
      activeOrders,
      lowStockItems,
      recentOrders: orders.slice(0, 4),
    });
  });

  app.get("/api/analytics/sales", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const transactions = await storage.getTransactions(branchId);

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

  // Settings
  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const data = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(data);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // POS - Generate Invoice
  app.post("/api/pos/generate-invoice", async (req, res) => {
    try {
      const { orderId } = req.body;
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const settings = await storage.getSettings();
      const branch = order.branchId ? await storage.getBranch(order.branchId) : null;

      const invoiceData = {
        order,
        companyName: settings?.restaurantName || "Restaurant Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location, Riyadh",
        companyEmail: settings?.email || "info@restaurant.sa",
        companyPhone: settings?.phone || "+966 11 234 5678",
        invoiceNumber: `INV-${order.orderNumber}`,
        invoiceDate: new Date(),
      };

      const pdfBuffer = await generateZATCAInvoice(invoiceData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
