import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateZATCAInvoice } from "./invoice";
import bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import {
  insertBranchSchema,
  insertInventoryItemSchema,
  insertMenuItemSchema,
  insertRecipeSchema,
  insertOrderSchema,
  insertTransactionSchema,
  insertSettingsSchema,
  insertProcurementSchema,
  insertUserSchema,
  insertInvoiceSchema,
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
      console.error("Order validation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: "Invalid order data", details: error.message });
      } else {
        res.status(400).json({ error: "Invalid order data" });
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

      const { pdfBuffer } = await generateZATCAInvoice(invoiceData);

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
      const { username, password, name, email, commercialRegistration, subscriptionPlan } = req.body;
      
      if (!username || !password || !name || !email || !commercialRegistration || !subscriptionPlan) {
        return res.status(400).json({ error: "All fields are required including Commercial Registration and subscription plan" });
      }

      // Validate subscription plan
      if (!['monthly', 'yearly'].includes(subscriptionPlan)) {
        return res.status(400).json({ error: "Invalid subscription plan" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create employee user with default permissions
      const userData = {
        username,
        password, // Will be hashed in storage
        fullName: name,
        email,
        commercialRegistration,
        subscriptionPlan,
        subscriptionStatus: "inactive" as const, // Will be activated after payment
        role: "employee" as const,
        active: true,
        permissions: {
          dashboard: true,
          inventory: false,
          menu: false,
          recipes: false,
          branches: false,
          procurement: false,
          pos: true,
          orders: true,
          kitchen: true,
          sales: false,
          reports: false,
          forecasting: false,
          analysis: false,
          settings: false,
          financial: false,
          employees: false,
        },
      };

      const user = await storage.createUser(userData);
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
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

      const data = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // storage.createUser handles password hashing
      const user = await storage.createUser(data);
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

      // Generate PDF and QR code
      const pdfData = {
        order,
        companyName: settings?.restaurantName || "Restaurant Management System",
        companyVAT: settings?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings?.address || "Main Location, Riyadh",
        companyEmail: settings?.email || "info@restaurant.sa",
        companyPhone: settings?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: new Date(),
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

      // Create invoice record in database with QR code
      const invoiceData = {
        invoiceNumber,
        orderId: order.id,
        branchId: order.branchId,
        customerName: order.customerName || "Walk-in Customer",
        items: invoiceItems,
        subtotal: order.subtotal,
        vatAmount: order.tax, // VAT amount (same as tax)
        total: order.total,
        qrCode, // ZATCA-compliant QR code
        pdfPath: `/invoices/${pdfFilename}`,
      };

      await storage.createInvoice(invoiceData);

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
        menuItemId: recipe.menuItemId,
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

  // Import routes with file upload
  const multer = await import('multer');
  const upload = multer.default({ storage: multer.default.memoryStorage() });

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
            menuItemId: row.menuItemId,
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

  const httpServer = createServer(app);

  return httpServer;
}
