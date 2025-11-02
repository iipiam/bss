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
}

export class MemStorage implements IStorage {
  private branches: Map<string, Branch>;
  private inventoryItems: Map<string, InventoryItem>;
  private menuItems: Map<string, MenuItem>;
  private recipes: Map<string, Recipe>;
  private orders: Map<string, Order>;
  private transactions: Map<string, Transaction>;
  private orderCounter: number;
  private transactionCounter: number;

  constructor() {
    this.branches = new Map();
    this.inventoryItems = new Map();
    this.menuItems = new Map();
    this.recipes = new Map();
    this.orders = new Map();
    this.transactions = new Map();
    this.orderCounter = 12840;
    this.transactionCounter = 12840;
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

    // Seed menu items
    const menuData: MenuItem[] = [
      { id: "menu-1", name: "Margherita Pizza", category: "Pizza", price: "50", description: "Classic tomato and mozzarella", available: true, imageUrl: null },
      { id: "menu-2", name: "Pepperoni Pizza", category: "Pizza", price: "65", description: "Tomato, mozzarella, and pepperoni", available: true, imageUrl: null },
      { id: "menu-3", name: "Chicken Shawarma", category: "Sandwiches", price: "40", description: "Grilled chicken with tahini", available: true, imageUrl: null },
      { id: "menu-4", name: "Beef Burger", category: "Burgers", price: "60", description: "Angus beef with cheese", available: true, imageUrl: null },
      { id: "menu-5", name: "Caesar Salad", category: "Salads", price: "40", description: "Fresh romaine with Caesar dressing", available: true, imageUrl: null },
    ];
    menuData.forEach(item => this.menuItems.set(item.id, item));
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
}

export const storage = new MemStorage();
