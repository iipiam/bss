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
  branches,
  inventoryItems,
  menuItems,
  recipes,
  orders,
  transactions,
  settings,
  procurement,
  users,
  invoices,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

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

export class DatabaseStorage implements IStorage {
  // Branches
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [updated] = await db.update(branches).set(branch).where(eq(branches.id, id)).returning();
    return updated;
  }

  // Inventory
  async getInventoryItems(branchId?: string): Promise<InventoryItem[]> {
    if (branchId) {
      return await db.select().from(inventoryItems).where(eq(inventoryItems.branchId, branchId));
    }
    return await db.select().from(inventoryItems);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db.update(inventoryItems).set(item).where(eq(inventoryItems.id, id)).returning();
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Menu
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(item).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe as any).returning();
    return created;
  }

  async updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes).set(recipe as any).where(eq(recipes.id, id)).returning();
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Orders
  async getOrders(branchId?: string, status?: string): Promise<Order[]> {
    const conditions = [];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    if (status) conditions.push(eq(orders.status, status));
    
    if (conditions.length > 0) {
      return await db.select().from(orders).where(and(...conditions));
    }
    return await db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order as any).returning();
    return created;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(order as any).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Transactions
  async getTransactions(branchId?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    const conditions = [];
    if (branchId) conditions.push(eq(transactions.branchId, branchId));
    if (startDate) conditions.push(gte(transactions.createdAt, startDate));
    if (endDate) conditions.push(lte(transactions.createdAt, endDate));
    
    if (conditions.length > 0) {
      return await db.select().from(transactions).where(and(...conditions));
    }
    return await db.select().from(transactions);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting;
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    // Get existing settings
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set(settingsData)
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db.insert(settings)
        .values(settingsData as InsertSettings)
        .returning();
      return created;
    }
  }

  // Procurement
  async getProcurements(type?: string, status?: string, branchId?: string): Promise<Procurement[]> {
    const conditions = [];
    if (type) conditions.push(eq(procurement.type, type));
    if (status) conditions.push(eq(procurement.status, status));
    if (branchId) conditions.push(eq(procurement.branchId, branchId));
    
    if (conditions.length > 0) {
      return await db.select().from(procurement).where(and(...conditions));
    }
    return await db.select().from(procurement);
  }

  async getProcurement(id: string): Promise<Procurement | undefined> {
    const [item] = await db.select().from(procurement).where(eq(procurement.id, id));
    return item;
  }

  async createProcurement(procurementData: InsertProcurement): Promise<Procurement> {
    const [created] = await db.insert(procurement).values(procurementData).returning();
    return created;
  }

  async updateProcurement(id: string, procurementData: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const [updated] = await db.update(procurement)
      .set({ ...procurementData, updatedAt: new Date() })
      .where(eq(procurement.id, id))
      .returning();
    return updated;
  }

  async deleteProcurement(id: string): Promise<boolean> {
    const result = await db.delete(procurement).where(eq(procurement.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [created] = await db.insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if it's being updated
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Invoices
  async getInvoices(branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]> {
    const conditions = [];
    if (branchId) conditions.push(eq(invoices.branchId, branchId));
    if (startDate) conditions.push(gte(invoices.createdAt, startDate));
    if (endDate) conditions.push(lte(invoices.createdAt, endDate));
    
    if (conditions.length > 0) {
      return await db.select().from(invoices).where(and(...conditions));
    }
    return await db.select().from(invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice as any).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
