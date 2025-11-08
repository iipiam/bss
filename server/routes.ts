import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateZATCAInvoice, generateSubscriptionInvoice, generateMonthlyVatReport } from "./invoice";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import {
  insertBranchSchema,
  insertInventoryItemSchema,
  insertMenuItemSchema,
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

  app.delete("/api/branches/:id", async (req, res) => {
    const success = await storage.deleteBranch(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.status(204).send();
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const items = await storage.getInventoryItems(branchId);
    res.json(items);
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

  app.patch("/api/inventory/sort", async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      await storage.updateInventoryItemsSortOrder(updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    const item = await storage.getInventoryItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
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

  // Menu Stock (based on inventory and recipes) - MUST be before /:id route
  app.get("/api/menu/stock", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const stock = await storage.getMenuItemsStock(branchId);
    res.json(stock);
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

  // Add-ons
  app.get("/api/addons", async (req, res) => {
    const menuItemId = req.query.menuItemId as string | undefined;
    const addons = await storage.getAddons(menuItemId);
    res.json(addons);
  });

  app.get("/api/addons/:id", async (req, res) => {
    const addon = await storage.getAddon(req.params.id);
    if (!addon) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.json(addon);
  });

  app.post("/api/addons", async (req, res) => {
    try {
      const data = insertAddonSchema.parse(req.body);
      const addon = await storage.createAddon(data);
      res.status(201).json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });

  app.patch("/api/addons/:id", async (req, res) => {
    try {
      const addon = await storage.updateAddon(req.params.id, req.body);
      if (!addon) {
        return res.status(404).json({ error: "Add-on not found" });
      }
      res.json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });

  app.delete("/api/addons/:id", async (req, res) => {
    const success = await storage.deleteAddon(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/addons/sort-order", async (req, res) => {
    try {
      await storage.updateAddonsSortOrder(req.body);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Invalid sort order data" });
    }
  });

  // Customers
  app.get("/api/customers", async (_req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const success = await storage.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  });

  // Shop Salaries
  app.get("/api/shop/salaries", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const salaries = await storage.getSalaries(branchId, startDate, endDate);
    res.json(salaries);
  });

  app.get("/api/shop/salaries/:id", async (req, res) => {
    const salary = await storage.getSalary(req.params.id);
    if (!salary) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.json(salary);
  });

  app.post("/api/shop/salaries", async (req, res) => {
    try {
      console.log("[SALARY] Request body:", JSON.stringify(req.body, null, 2));
      // Convert ISO date string to Date object
      const bodyWithDate = {
        ...req.body,
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

  app.patch("/api/shop/salaries/:id", async (req, res) => {
    try {
      const salary = await storage.updateSalary(req.params.id, req.body);
      if (!salary) {
        return res.status(404).json({ error: "Salary not found" });
      }
      res.json(salary);
    } catch (error) {
      res.status(400).json({ error: "Invalid salary data" });
    }
  });

  app.delete("/api/shop/salaries/:id", async (req, res) => {
    const success = await storage.deleteSalary(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.status(204).send();
  });

  // Shop Bills
  app.get("/api/shop/bills", async (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const bills = await storage.getShopBills(branchId, startDate, endDate);
    res.json(bills);
  });

  app.get("/api/shop/bills/:id", async (req, res) => {
    const bill = await storage.getShopBill(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json(bill);
  });

  app.post("/api/shop/bills", async (req, res) => {
    try {
      // Convert ISO date string to Date object
      const bodyWithDate = {
        ...req.body,
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

  app.patch("/api/shop/bills/:id", async (req, res) => {
    try {
      const bill = await storage.updateShopBill(req.params.id, req.body);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Invalid bill data" });
    }
  });

  app.delete("/api/shop/bills/:id", async (req, res) => {
    const success = await storage.deleteShopBill(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/shop/bills/:id/archive", async (req, res) => {
    try {
      const { archived } = req.body;
      const bill = await storage.archiveShopBill(req.params.id, archived);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Failed to archive bill" });
    }
  });

  // Delivery Apps
  app.get("/api/delivery-apps", async (_req, res) => {
    const apps = await storage.getDeliveryApps();
    res.json(apps);
  });

  app.patch("/api/delivery-apps/sort", async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      await storage.updateDeliveryAppsSortOrder(updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/delivery-apps/:id", async (req, res) => {
    const app = await storage.getDeliveryApp(req.params.id);
    if (!app) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.json(app);
  });

  app.post("/api/delivery-apps", async (req, res) => {
    try {
      const data = insertDeliveryAppSchema.parse(req.body);
      const deliveryApp = await storage.createDeliveryApp(data);
      res.status(201).json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/delivery-apps/:id", async (req, res) => {
    try {
      const data = insertDeliveryAppSchema.partial().parse(req.body);
      const deliveryApp = await storage.updateDeliveryApp(req.params.id, data);
      if (!deliveryApp) {
        return res.status(404).json({ error: "Delivery app not found" });
      }
      res.json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/delivery-apps/:id", async (req, res) => {
    const success = await storage.deleteDeliveryApp(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.status(204).send();
  });

  app.get("/api/delivery-apps/analytics/profitability", async (_req, res) => {
    try {
      const profitability = await storage.getDeliveryAppProfitability();
      res.json(profitability);
    } catch (error) {
      console.error("[DELIVERY_APP] Profitability error:", error);
      res.status(500).json({ error: "Failed to calculate profitability" });
    }
  });

  app.get("/api/analytics/sales-comparison", async (_req, res) => {
    try {
      const comparison = await storage.getSalesComparison();
      res.json(comparison);
    } catch (error) {
      console.error("[ANALYTICS] Sales comparison error:", error);
      res.status(500).json({ error: "Failed to get sales comparison data" });
    }
  });

  // Investors
  app.get("/api/investors", async (_req, res) => {
    try {
      const investors = await storage.getInvestors();
      res.json(investors);
    } catch (error) {
      console.error("[INVESTORS] Get investors error:", error);
      res.status(500).json({ error: "Failed to get investors" });
    }
  });

  app.get("/api/investors/:id", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.id);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Get investor error:", error);
      res.status(500).json({ error: "Failed to get investor" });
    }
  });

  app.post("/api/investors", async (req, res) => {
    try {
      const data = insertInvestorSchema.parse(req.body);
      const investor = await storage.createInvestor(data);
      res.status(201).json(investor);
    } catch (error) {
      console.error("[INVESTORS] Create investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/investors/:id", async (req, res) => {
    try {
      const data = updateInvestorSchema.parse(req.body);
      const investor = await storage.updateInvestor(req.params.id, data);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Update investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/investors/:id", async (req, res) => {
    try {
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

  app.patch("/api/recipes/sort", async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      await storage.updateRecipesSortOrder(updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
        res.status(201).json(order);
      } catch (deductionError) {
        console.error("Inventory deduction failed, attempting to delete order:", order.id);
        try {
          await storage.deleteOrder(order.id);
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

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("[ORDER] Update error:", error);
      res.status(400).json({ 
        error: "Invalid order data", 
        details: error instanceof Error ? error.message : String(error) 
      });
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
      if (previous === 0) return current > 0 ? 100 : 0;
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

  app.get("/api/analytics/peak-hours/:hour", async (req, res) => {
    const hour = parseInt(req.params.hour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ error: "Invalid hour parameter (must be 0-23)" });
    }

    const branchId = req.query.branchId as string | undefined;
    const transactions = await storage.getTransactions(branchId);
    const orders = await storage.getOrders(branchId);

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

  // Procurement
  app.get("/api/procurement", async (req, res) => {
    const { type, status, branchId } = req.query;
    const procurements = await storage.getProcurements(
      type as string | undefined,
      status as string | undefined,
      branchId as string | undefined
    );
    res.json(procurements);
  });

  app.get("/api/procurement/:id", async (req, res) => {
    const procurement = await storage.getProcurement(req.params.id);
    if (!procurement) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.json(procurement);
  });

  app.post("/api/procurement", async (req, res) => {
    try {
      const data = insertProcurementSchema.parse(req.body);
      const procurement = await storage.createProcurement(data);
      res.status(201).json(procurement);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.patch("/api/procurement/:id", async (req, res) => {
    try {
      const data = insertProcurementSchema.partial().parse(req.body);
      const procurement = await storage.updateProcurement(req.params.id, data);
      if (!procurement) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      res.json(procurement);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });

  app.delete("/api/procurement/:id", async (req, res) => {
    const success = await storage.deleteProcurement(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.status(204).send();
  });

  // POS - Generate Invoice (redirects to main invoice creation endpoint)
  app.post("/api/pos/generate-invoice", async (req, res) => {
    // This endpoint now redirects to the main invoice creation endpoint
    // which properly saves the invoice and generates QR code with URL
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const settings = await storage.getSettings();
      const branch = order.branchId ? await storage.getBranch(order.branchId) : null;

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
      };

      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);

      // Ensure invoices directory exists
      const invoicesDir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Save PDF to filesystem
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Update invoice record with QR code and PDF path
      await storage.updateInvoice(createdInvoice.id, {
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

  // Public endpoint to check if any users exist (for first-run setup)
  app.get("/api/auth/check-first-run", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json({ firstRun: users.length === 0 });
    } catch (error) {
      console.error("First-run check error:", error);
      res.status(500).json({ error: "Failed to check first-run status" });
    }
  });

  // Public endpoint for user signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, name, email, commercialRegistration, restaurantName, nationalId, taxNumber, restaurantType, subscriptionPlan, branchesCount } = req.body;
      
      if (!username || !password || !name || !email || !commercialRegistration || !restaurantName || !nationalId || !taxNumber || !restaurantType || !subscriptionPlan || !branchesCount) {
        return res.status(400).json({ error: "All fields are required including Restaurant Name, National ID, Tax Number, Restaurant Type, Commercial Registration, subscription plan, and number of branches" });
      }

      // Validate restaurant type
      if (!['Cloud Kitchen', 'Restaurant'].includes(restaurantType)) {
        return res.status(400).json({ error: "Invalid restaurant type. Must be 'Cloud Kitchen' or 'Restaurant'" });
      }

      // Validate subscription plan
      if (!['weekly', 'monthly', 'yearly'].includes(subscriptionPlan)) {
        return res.status(400).json({ error: "Invalid subscription plan" });
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

      // Create admin user with full permissions (each signup = restaurant owner)
      const userData = {
        username,
        password, // Will be hashed in storage
        fullName: name,
        email,
        commercialRegistration,
        restaurantName,
        nationalId,
        taxNumber,
        restaurantType,
        subscriptionPlan,
        branchesCount: branches,
        subscriptionStatus: "inactive" as const, // Will be activated after payment
        role: "admin" as const,
        active: true,
        permissions: {
          dashboard: true,
          inventory: true,
          menu: true,
          recipes: true,
          branches: true,
          procurement: true,
          pos: true,
          orders: true,
          kitchen: true,
          sales: true,
          reports: true,
          forecasting: true,
          analysis: true,
          settings: true,
          financial: true,
          employees: true,
        },
      };

      const user = await storage.createUser(userData);

      // Generate subscription invoice
      try {
        // Calculate subscription prices based on plan
        const planPrices: Record<string, { base: number; perBranch: number }> = {
          weekly: { base: 39.90, perBranch: 7 },
          monthly: { base: 119.75, perBranch: 20 },
          yearly: { base: 1197.50, perBranch: 240 },
        };

        const prices = planPrices[subscriptionPlan];
        const basePlanPrice = prices.base;
        const additionalBranchesCount = Math.max(0, branches - 1);
        const additionalBranchesPrice = additionalBranchesCount * prices.perBranch;
        const subtotal = basePlanPrice + additionalBranchesPrice;
        const vatAmount = subtotal * 0.15; // 15% VAT
        const total = subtotal + vatAmount;

        // Generate serial number
        const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();

        // Generate subscription invoice PDF
        const pdfBuffer = await generateSubscriptionInvoice({
          serialNumber,
          userFullName: user.fullName,
          userEmail: user.email,
          restaurantName: user.restaurantName!,
          nationalId: user.nationalId!,
          taxNumber: user.taxNumber!,
          commercialRegistration: user.commercialRegistration,
          subscriptionPlan: user.subscriptionPlan,
          branchesCount: user.branchesCount,
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
          subscriptionPlan: user.subscriptionPlan,
          branchesCount: user.branchesCount,
          basePlanPrice: basePlanPrice.toString(),
          additionalBranchesPrice: additionalBranchesPrice.toString(),
          subtotal: subtotal.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
          pdfPath: `/subscription-invoices/${pdfFilename}`,
          qrCode,
        });

        console.log(`[SIGNUP] Subscription invoice generated: ${serialNumber}`);
      } catch (invoiceError) {
        console.error("[SIGNUP] Failed to generate subscription invoice:", invoiceError);
        // Don't fail signup if invoice generation fails
      }

      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        role: user.role,
        restaurantName: user.restaurantName,
        nationalId: user.nationalId,
        taxNumber: user.taxNumber,
        restaurantType: user.restaurantType,
        subscriptionPlan: user.subscriptionPlan,
        branchesCount: user.branchesCount,
        subscriptionStatus: user.subscriptionStatus
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("[AUTH] Login attempt for username:", username);
      
      if (!username || !password) {
        console.log("[AUTH] Missing username or password");
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      
      console.log("[AUTH] User found:", user ? `Yes (id: ${user.id}, active: ${user.active})` : "No");
      
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

      // Store user in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.role = user.role;
        console.log("[AUTH] Session created for user:", user.id);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log("[AUTH] Login successful");
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
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

      // TODO: In production, send email with reset link
      // For now, we'll just log the token (in production this would be sent via email)
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: ${req.headers.origin}/reset-password?token=${resetToken}`);

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

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    
    if (!user || !user.active) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { devicePreference } = req.body;
      
      // Validate device preference
      if (devicePreference && !['laptop', 'ipad', 'iphone'].includes(devicePreference)) {
        return res.status(400).json({ error: "Invalid device preference. Must be 'laptop', 'ipad', or 'iphone'" });
      }

      const updatedUser = await storage.updateUser(req.session.userId, { devicePreference });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user preference error:", error);
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  // Users Management (Admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const currentUser = await storage.getUser(req.session.userId);
    if (currentUser?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await storage.getUsers();
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const currentUser = await storage.getUser(req.session.userId);
    if (currentUser?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/users", async (req, res) => {
    try {
      // Check if this is the first user (setup mode)
      const allUsers = await storage.getUsers();
      const isFirstUser = allUsers.length === 0;

      // If not first user, require admin authentication
      if (!isFirstUser) {
        if (!req.session?.userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        const currentUser = await storage.getUser(req.session.userId);
        if (currentUser?.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }
      }

      const { monthlySalary, ...userData } = req.body;
      const data = insertUserSchema.parse(userData);
      
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
          await storage.deleteUser(user.id);
          return res.status(400).json({ error: "Failed to create employee salary entry" });
        }
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { password, ...updateData } = req.body;
      
      // If password is being updated, hash it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const currentUser = await storage.getUser(req.session.userId);
    if (currentUser?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Prevent deleting own account
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  });

  // User Profile Management
  app.get("/api/profile", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUserProfile(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { email, phone } = req.body;
      const profileUpdate: { email?: string; phone?: string } = {};

      if (email !== undefined) profileUpdate.email = email;
      if (phone !== undefined) profileUpdate.phone = phone;

      const updatedUser = await storage.updateUserProfile(req.session.userId, profileUpdate);
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
  app.post("/api/subscription/cancel", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.subscriptionStatus !== 'active') {
        return res.status(400).json({ error: "No active subscription to cancel" });
      }

      const updatedUser = await storage.cancelSubscription(req.session.userId);
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
  app.get("/api/analytics/financial", async (req, res) => {
    const { period, year } = req.query;
    
    const transactions = await storage.getTransactions();
    const invoices = await storage.getInvoices();
    
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

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    const { branchId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    
    const invoices = await storage.getInvoices(
      branchId as string | undefined,
      start,
      end
    );
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(data);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Public invoice viewer (no auth required) - accessible via QR code
  app.get("/public/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
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

      const settings = await storage.getSettings();
      const order = invoice.orderId ? await storage.getOrder(invoice.orderId) : null;
      
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
  app.post("/api/invoices/create-and-generate", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const settings = await storage.getSettings();
      const branch = order.branchId ? await storage.getBranch(order.branchId) : null;

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
      };

      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);

      // Ensure invoices directory exists
      const invoicesDir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Save PDF to filesystem
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Update invoice record with QR code and PDF path
      await storage.updateInvoice(createdInvoice.id, {
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
  app.get("/api/export/inventory", async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const items = await storage.getInventoryItems(branchId);
      
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
  app.get("/api/export/menu", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      
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
  app.get("/api/export/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      
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
  app.get("/api/export/orders", async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const status = req.query.status as string | undefined;
      const orders = await storage.getOrders(branchId, status);
      
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
  app.get("/api/export/transactions", async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const transactions = await storage.getTransactions(branchId, startDate, endDate);
      
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
  app.get("/api/export/procurement", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const branchId = req.query.branchId as string | undefined;
      const procurements = await storage.getProcurements(type, status, branchId);
      
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
  app.get("/api/export/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      
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
  app.get("/api/export/branches", async (req, res) => {
    try {
      const branches = await storage.getBranches();
      
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
  app.get("/api/export/profitability", async (req, res) => {
    try {
      const period = req.query.period as string || 'month';
      
      // Get menu items, recipes, and orders
      const menuItems = await storage.getMenuItems();
      const recipes = await storage.getRecipes();
      const orders = await storage.getOrders();
      
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
  app.get("/api/export/financial", async (req, res) => {
    try {
      const year = req.query.year as string || new Date().getFullYear().toString();
      const period = req.query.period as string || 'monthly';
      
      // Fetch financial data using same logic as the analytics endpoint
      const transactions = await storage.getTransactions();
      const invoices = await storage.getInvoices();
      
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
  app.get("/api/export/financial-pdf", async (req, res) => {
    try {
      const year = req.query.year as string || new Date().getFullYear().toString();
      const period = (req.query.period as "monthly" | "yearly") || 'monthly';
      
      const settings = await storage.getSettings();
      
      // Fetch financial data
      const transactions = await storage.getTransactions();
      const invoices = await storage.getInvoices();
      
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
        companyName: settings?.restaurantName || "RestoPOS",
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
  app.get("/api/invoices/:id/download", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // If pdfPath exists, serve the file
      if (invoice.pdfPath) {
        const filePath = path.join(process.cwd(), invoice.pdfPath);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
          return res.sendFile(filePath);
        }
      }
      
      // If PDF doesn't exist, return error (PDF should be generated during invoice creation)
      res.status(404).json({ error: "Invoice PDF not found" });
    } catch (error) {
      console.error("Invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });

  // Import routes with file upload
  const multer = await import('multer');
  const upload = multer.default({ storage: multer.default.memoryStorage() });

  // Configure multer for menu image uploads (disk storage)
  const menuImageStorage = multer.default.diskStorage({
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

  const uploadMenuImage = multer.default({
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
  app.post("/api/menu/upload-image", uploadMenuImage.single('image'), async (req, res) => {
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

  // Import Inventory from Excel
  app.post("/api/import/inventory", upload.single('file'), async (req, res) => {
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
  app.post("/api/import/menu", upload.single('file'), async (req, res) => {
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
  app.post("/api/import/recipes", upload.single('file'), async (req, res) => {
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
  app.post("/api/import/branches", upload.single('file'), async (req, res) => {
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
  app.get("/api/vat-reports", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const reports = await storage.getMonthlyVatReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching VAT reports:", error);
      res.status(500).json({ error: "Failed to fetch VAT reports" });
    }
  });

  // Generate monthly VAT report
  app.post("/api/vat-reports/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = (req.user as any).id;
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
      const user = await storage.getUserProfile(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate sales data for the month (from transactions/orders)
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await storage.getTransactions(undefined, startDate, endDate);
      
      // Calculate total sales (sum of all transaction totals)
      const totalSales = transactions.reduce((sum, tx) => sum + parseFloat(tx.total), 0);
      const totalSalesBaseAmount = totalSales / 1.15; // Remove 15% VAT
      const totalSalesVat = totalSales - totalSalesBaseAmount;

      // Calculate total purchases (from procurement)
      const procurements = await storage.getProcurements(undefined, undefined, undefined);
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

      // Generate PDF invoice
      const pdfBuffer = await generateMonthlyVatReport({
        serialNumber,
        reportMonth: month,
        reportYear: year,
        restaurantName: user.restaurantName || user.username,
        taxNumber: user.taxNumber || 'N/A',
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
  app.get("/api/vat-reports/:id/download", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = (req.user as any).id;
      const reportId = req.params.id;

      const reports = await storage.getMonthlyVatReports(userId);
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (!report.pdfPath) {
        return res.status(404).json({ error: "PDF not available" });
      }

      const pdfFullPath = path.join(process.cwd(), 'public', report.pdfPath);
      
      if (!fs.existsSync(pdfFullPath)) {
        return res.status(404).json({ error: "PDF file not found" });
      }

      res.download(pdfFullPath, path.basename(pdfFullPath));
    } catch (error) {
      console.error("Error downloading VAT report:", error);
      res.status(500).json({ error: "Failed to download VAT report" });
    }
  });

  // Support Tickets
  app.get("/api/tickets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      
      // Regular users can only see their own tickets
      // Admin users can see all tickets
      const user = req.user as any;
      const filterUserId = user.role === 'admin' ? userId : user.id;
      
      const tickets = await storage.getSupportTickets(filterUserId, status);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization
      const user = req.user as any;
      if (user.role !== 'admin' && ticket.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = req.user as any;
      const ticket = await storage.createSupportTicket({
        userId: user.id,
        subject: req.body.subject,
        category: req.body.category,
        priority: req.body.priority || 'medium',
        description: req.body.description,
        status: 'open',
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  app.patch("/api/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization - only admin can update tickets or ticket owner
      const user = req.user as any;
      if (user.role !== 'admin' && ticket.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Only admin can change status
      if (req.body.status && user.role !== 'admin') {
        return res.status(403).json({ error: "Only admin can change ticket status" });
      }

      const updated = await storage.updateSupportTicket(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // Ticket Messages
  app.get("/api/tickets/:ticketId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const ticket = await storage.getSupportTicket(req.params.ticketId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization
      const user = req.user as any;
      if (user.role !== 'admin' && ticket.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const messages = await storage.getTicketMessages(req.params.ticketId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(req.params.ticketId, user.id);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/tickets/:ticketId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const ticket = await storage.getSupportTicket(req.params.ticketId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization
      const user = req.user as any;
      if (user.role !== 'admin' && ticket.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const message = await storage.createTicketMessage({
        ticketId: req.params.ticketId,
        senderId: user.id,
        senderName: user.username || 'User',
        senderRole: user.role || 'employee',
        message: req.body.message,
        isRead: false,
      });

      // Auto-change ticket status based on sender
      if (ticket.status === 'open' && user.role === 'admin') {
        // Admin replied, set to in-progress
        await storage.updateSupportTicket(ticket.id, { status: 'in-progress' });
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.get("/api/tickets/unread/count", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = req.user as any;
      const count = await storage.getUnreadMessageCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Employee Activity Log
  app.get("/api/employee-activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = req.user as any;
      
      // Only admin can view all activities
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin only" });
      }

      const employeeId = req.query.employeeId as string | undefined;
      const category = req.query.category as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const activities = await storage.getEmployeeActivities(employeeId, category, startDate, endDate);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/employee-activities/stats/:employeeId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = req.user as any;
      
      // Only admin can view activity stats
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin only" });
      }

      const stats = await storage.getEmployeeActivityStats(req.params.employeeId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ error: "Failed to fetch activity stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
