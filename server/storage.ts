import {
  type Branch,
  type InsertBranch,
  type InventoryItem,
  type InsertInventoryItem,
  type MenuItem,
  type InsertMenuItem,
  type Recipe,
  type InsertRecipe,
  type Order,
  type InsertOrder,
  type Transaction,
  type InsertTransaction,
  type Settings,
  type InsertSettings,
  type Procurement,
  type InsertProcurement,
  type User,
  type InsertUser,
  type Invoice,
  type InsertInvoice,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Branches
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;

  // Inventory
  getInventoryItems(branchId?: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Menu
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<boolean>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;

  // Orders
  getOrders(branchId?: string, status?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Transactions
  getTransactions(branchId?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Procurement
  getProcurements(type?: string, status?: string, branchId?: string): Promise<Procurement[]>;
  getProcurement(id: string): Promise<Procurement | undefined>;
  createProcurement(procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined>;
  deleteProcurement(id: string): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Invoices
  getInvoices(branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
}

export class MemStorage implements IStorage {
  private branches: Map<string, Branch>;
  private inventoryItems: Map<string, InventoryItem>;
  private menuItems: Map<string, MenuItem>;
  private recipes: Map<string, Recipe>;
  private orders: Map<string, Order>;
  private transactions: Map<string, Transaction>;
  private settings: Settings | undefined;
  private procurements: Map<string, Procurement>;
  private users: Map<string, User>;
  private invoices: Map<string, Invoice>;
  private orderCounter: number;
  private transactionCounter: number;
  private invoiceCounter: number;

  constructor() {
    this.branches = new Map();
    this.inventoryItems = new Map();
    this.menuItems = new Map();
    this.recipes = new Map();
    this.orders = new Map();
    this.transactions = new Map();
    this.settings = undefined;
    this.procurements = new Map();
    this.users = new Map();
    this.invoices = new Map();
    this.orderCounter = 12840;
    this.transactionCounter = 12840;
    this.invoiceCounter = 10000;
    this.seedData();
  }

  private seedData() {
    // Seed branches
    const branches: Branch[] = [
      {
        id: "1",
        name: "Main Branch - Riyadh",
        location: "King Fahd Road, Riyadh",
        phone: "+966 11 234 5678",
        manager: "Ahmed Al-Rashid",
        staff: 24,
        status: "Active",
      },
      {
        id: "2",
        name: "Al Khobar Branch",
        location: "Corniche Road, Al Khobar",
        phone: "+966 13 345 6789",
        manager: "Mohammed Al-Qahtani",
        staff: 18,
        status: "Active",
      },
      {
        id: "3",
        name: "Jeddah Branch",
        location: "Tahlia Street, Jeddah",
        phone: "+966 12 456 7890",
        manager: "Khalid Al-Maliki",
        staff: 20,
        status: "Active",
      },
    ];
    branches.forEach(branch => this.branches.set(branch.id, branch));

    // Seed inventory items
    const inventoryData: InventoryItem[] = [
      { id: "inv-1", name: "Tomatoes", category: "Vegetables", quantity: "25", unit: "kg", supplier: "Fresh Farm Co.", status: "In Stock", branchId: "1" },
      { id: "inv-2", name: "Mozzarella Cheese", category: "Dairy", quantity: "15", unit: "kg", supplier: "Dairy Delight", status: "In Stock", branchId: "1" },
      { id: "inv-3", name: "Chicken Breast", category: "Meat", quantity: "30", unit: "kg", supplier: "Meat Masters", status: "In Stock", branchId: "1" },
      { id: "inv-4", name: "Flour", category: "Grains", quantity: "50", unit: "kg", supplier: "Grain Supply", status: "In Stock", branchId: "1" },
      { id: "inv-5", name: "Olive Oil", category: "Oils", quantity: "8", unit: "L", supplier: "Mediterranean Imports", status: "Low Stock", branchId: "1" },
    ];
    inventoryData.forEach(item => this.inventoryItems.set(item.id, item));

    // Seed menu items (prices include 15% Saudi VAT)
    const menuData: MenuItem[] = [
      { id: "menu-1", name: "Margherita Pizza", category: "Pizza", price: "57.50", basePrice: "50.00", vatAmount: "7.50", description: "Classic tomato and mozzarella", available: true, imageUrl: null },
      { id: "menu-2", name: "Pepperoni Pizza", category: "Pizza", price: "74.75", basePrice: "65.00", vatAmount: "9.75", description: "Tomato, mozzarella, and pepperoni", available: true, imageUrl: null },
      { id: "menu-3", name: "Chicken Shawarma", category: "Sandwiches", price: "46.00", basePrice: "40.00", vatAmount: "6.00", description: "Grilled chicken with tahini", available: true, imageUrl: null },
      { id: "menu-4", name: "Beef Burger", category: "Burgers", price: "69.00", basePrice: "60.00", vatAmount: "9.00", description: "Angus beef with cheese", available: true, imageUrl: null },
      { id: "menu-5", name: "Caesar Salad", category: "Salads", price: "46.00", basePrice: "40.00", vatAmount: "6.00", description: "Fresh romaine with Caesar dressing", available: true, imageUrl: null },
    ];
    menuData.forEach(item => this.menuItems.set(item.id, item));

    // Seed settings
    this.settings = {
      id: "1",
      restaurantName: "Restaurant Management System",
      vatNumber: "300123456789003",
      address: "King Fahd Road, Riyadh, Saudi Arabia",
      email: "info@restaurant.sa",
      phone: "+966 11 234 5678",
      language: "English",
    };

    // Seed procurement
    const procurementData: Procurement[] = [
      {
        id: "proc-1",
        type: "inventory",
        title: "Fresh Vegetables - Weekly Supply",
        description: "Mixed vegetables for kitchen operations",
        supplier: "Al Khair Vegetables",
        category: "Food & Beverage",
        quantity: 150,
        unitPrice: "5",
        totalCost: "750",
        status: "ordered",
        priority: "high",
        requestedBy: "Kitchen Manager",
        approvedBy: "GM",
        branchId: "branch-1",
        orderDate: new Date("2025-10-28"),
        expectedDelivery: new Date("2025-11-02"),
        actualDelivery: null,
        notes: "Quality check required upon delivery",
        createdAt: new Date("2025-10-25"),
        updatedAt: new Date("2025-10-28"),
      },
      {
        id: "proc-2",
        type: "equipment",
        title: "Commercial Refrigerator",
        description: "Double-door commercial refrigerator for main kitchen",
        supplier: "Saudi Kitchen Equipment Co.",
        category: "Kitchen Equipment",
        quantity: 1,
        unitPrice: "8500",
        totalCost: "8500",
        status: "approved",
        priority: "medium",
        requestedBy: "Operations Manager",
        approvedBy: "GM",
        branchId: "branch-1",
        orderDate: null,
        expectedDelivery: new Date("2025-11-15"),
        actualDelivery: null,
        notes: "Installation included in price",
        createdAt: new Date("2025-10-20"),
        updatedAt: new Date("2025-10-26"),
      },
      {
        id: "proc-3",
        type: "maintenance",
        title: "HVAC System Maintenance",
        description: "Quarterly maintenance for all air conditioning units",
        supplier: "Riyadh Climate Control",
        category: "Facility Maintenance",
        quantity: null,
        unitPrice: null,
        totalCost: "2500",
        status: "completed",
        priority: "medium",
        requestedBy: "Facility Manager",
        approvedBy: "GM",
        branchId: "branch-1",
        orderDate: new Date("2025-10-15"),
        expectedDelivery: new Date("2025-10-20"),
        actualDelivery: new Date("2025-10-19"),
        notes: "All units serviced and filters replaced",
        createdAt: new Date("2025-10-10"),
        updatedAt: new Date("2025-10-20"),
      },
      {
        id: "proc-4",
        type: "installation",
        title: "POS Terminal Installation - Branch 2",
        description: "Install 3 new POS terminals in Jeddah branch",
        supplier: "TechPos Solutions",
        category: "Technology",
        quantity: 3,
        unitPrice: "1200",
        totalCost: "3600",
        status: "pending",
        priority: "high",
        requestedBy: "IT Manager",
        approvedBy: null,
        branchId: "branch-2",
        orderDate: null,
        expectedDelivery: null,
        actualDelivery: null,
        notes: "Includes training for staff",
        createdAt: new Date("2025-10-29"),
        updatedAt: new Date("2025-10-29"),
      },
      {
        id: "proc-5",
        type: "inventory",
        title: "Cleaning Supplies - Monthly Stock",
        description: "Complete cleaning supplies for all branches",
        supplier: "Clean Pro Supplies",
        category: "Cleaning & Sanitation",
        quantity: 200,
        unitPrice: "3",
        totalCost: "600",
        status: "received",
        priority: "low",
        requestedBy: "Operations Manager",
        approvedBy: "Branch Manager",
        branchId: null,
        orderDate: new Date("2025-10-18"),
        expectedDelivery: new Date("2025-10-25"),
        actualDelivery: new Date("2025-10-24"),
        notes: "Distributed across all branches",
        createdAt: new Date("2025-10-15"),
        updatedAt: new Date("2025-10-25"),
      },
    ];
    procurementData.forEach(item => this.procurements.set(item.id, item));

    // NOTE: Admin user will be seeded via API or first-run setup to ensure password is properly hashed
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    return this.branches.get(id);
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const id = randomUUID();
    const newBranch: Branch = { id, ...branch };
    this.branches.set(id, newBranch);
    return newBranch;
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    const existing = this.branches.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...branch };
    this.branches.set(id, updated);
    return updated;
  }

  // Inventory
  async getInventoryItems(branchId?: string): Promise<InventoryItem[]> {
    const items = Array.from(this.inventoryItems.values());
    if (branchId) {
      return items.filter(item => item.branchId === branchId);
    }
    return items;
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const newItem: InventoryItem = { id, ...item };
    this.inventoryItems.set(id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existing = this.inventoryItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.inventoryItems.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Menu
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = randomUUID();
    const newItem: MenuItem = { id, ...item };
    this.menuItems.set(id, newItem);
    return newItem;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existing = this.menuItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const newRecipe: Recipe = {
      id,
      menuItemId: recipe.menuItemId ?? null,
      name: recipe.name,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      cost: recipe.cost,
      ingredients: recipe.ingredients as Array<{ name: string; quantity: number; unit: string }>,
      steps: recipe.steps as string[],
    };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existing = this.recipes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...recipe };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.recipes.delete(id);
  }

  // Orders
  async getOrders(branchId?: string, status?: string): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    if (branchId) {
      orders = orders.filter(order => order.branchId === branchId);
    }
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = {
      id,
      orderNumber: order.orderNumber,
      branchId: order.branchId ?? null,
      customerName: order.customerName ?? null,
      orderType: order.orderType,
      table: order.table ?? null,
      address: order.address ?? null,
      items: order.items as Array<{ id: string; name: string; quantity: number; price: number }>,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: order.status ?? "Pending",
      createdAt: new Date(),
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...order };
    this.orders.set(id, updated);
    return updated;
  }

  // Transactions
  async getTransactions(branchId?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());
    if (branchId) {
      transactions = transactions.filter(t => t.branchId === branchId);
    }
    if (startDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) <= endDate);
    }
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction: Transaction = {
      id,
      transactionId: transaction.transactionId,
      orderId: transaction.orderId ?? null,
      branchId: transaction.branchId ?? null,
      itemCount: transaction.itemCount,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      createdAt: new Date(),
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settings: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      const id = randomUUID();
      this.settings = {
        id,
        restaurantName: settings.restaurantName || "",
        vatNumber: settings.vatNumber || "",
        address: settings.address || "",
        email: settings.email || "",
        phone: settings.phone || "",
        language: settings.language || "English",
      };
    } else {
      this.settings = { ...this.settings, ...settings };
    }
    return this.settings;
  }

  // Procurement
  async getProcurements(type?: string, status?: string, branchId?: string): Promise<Procurement[]> {
    let procurements = Array.from(this.procurements.values());
    
    if (type) {
      procurements = procurements.filter(p => p.type === type);
    }
    
    if (status) {
      procurements = procurements.filter(p => p.status === status);
    }
    
    if (branchId) {
      procurements = procurements.filter(p => p.branchId === branchId);
    }
    
    return procurements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProcurement(id: string): Promise<Procurement | undefined> {
    return this.procurements.get(id);
  }

  async createProcurement(procurement: InsertProcurement): Promise<Procurement> {
    const id = randomUUID();
    const newProcurement: Procurement = {
      id,
      type: procurement.type,
      title: procurement.title,
      description: procurement.description || null,
      supplier: procurement.supplier || null,
      category: procurement.category || null,
      quantity: procurement.quantity || null,
      unitPrice: procurement.unitPrice || null,
      totalCost: procurement.totalCost,
      status: procurement.status || "pending",
      priority: procurement.priority || "medium",
      requestedBy: procurement.requestedBy || null,
      approvedBy: procurement.approvedBy || null,
      branchId: procurement.branchId || null,
      orderDate: procurement.orderDate || null,
      expectedDelivery: procurement.expectedDelivery || null,
      actualDelivery: procurement.actualDelivery || null,
      notes: procurement.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.procurements.set(id, newProcurement);
    return newProcurement;
  }

  async updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const existing = this.procurements.get(id);
    if (!existing) return undefined;

    const updated: Procurement = {
      ...existing,
      ...procurement,
      updatedAt: new Date(),
    };
    this.procurements.set(id, updated);
    return updated;
  }

  async deleteProcurement(id: string): Promise<boolean> {
    return this.procurements.delete(id);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role || "employee",
      permissions: user.permissions,
      branchId: user.branchId || null,
      active: user.active ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...user,
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Invoices
  async getInvoices(branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]> {
    let invoices = Array.from(this.invoices.values());
    
    if (branchId) {
      invoices = invoices.filter(i => i.branchId === branchId);
    }
    
    if (startDate || endDate) {
      invoices = invoices.filter(i => {
        const invoiceDate = i.createdAt;
        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      });
    }
    
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    this.invoiceCounter++;
    const invoiceNumber = `INV-${String(this.invoiceCounter).padStart(6, '0')}`;
    
    const newInvoice: Invoice = {
      id,
      invoiceNumber,
      transactionId: invoice.transactionId || null,
      orderId: invoice.orderId || null,
      branchId: invoice.branchId || null,
      customerName: invoice.customerName || null,
      items: invoice.items,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      total: invoice.total,
      qrCode: invoice.qrCode || null,
      pdfPath: invoice.pdfPath || null,
      createdAt: new Date(),
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
}

export const storage = new MemStorage();
