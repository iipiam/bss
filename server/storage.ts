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
  type Customer,
  type InsertCustomer,
  type Salary,
  type InsertSalary,
  type ShopBill,
  type InsertShopBill,
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
  customers,
  salaries,
  shopBills,
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
  deleteBranch(id: string): Promise<boolean>;

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
  getMenuItemsStock(branchId?: string): Promise<Record<string, number>>;

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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;

  // Invoices
  getInvoices(branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Shop Salaries
  getSalaries(branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]>;
  getSalary(id: string): Promise<Salary | undefined>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(id: string, salary: Partial<InsertSalary>): Promise<Salary | undefined>;
  deleteSalary(id: string): Promise<boolean>;

  // Shop Bills
  getShopBills(branchId?: string, startDate?: Date, endDate?: Date, includeArchived?: boolean): Promise<ShopBill[]>;
  getShopBill(id: string): Promise<ShopBill | undefined>;
  createShopBill(bill: InsertShopBill): Promise<ShopBill>;
  updateShopBill(id: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined>;
  deleteShopBill(id: string): Promise<boolean>;
  archiveShopBill(id: string, archived: boolean): Promise<ShopBill | undefined>;
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

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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

  async getMenuItemsStock(branchId?: string): Promise<Record<string, number>> {
    // Get all recipes
    const allRecipes = await this.getRecipes();
    // Get inventory items for the branch
    const inventory = await this.getInventoryItems(branchId);
    
    const stock: Record<string, number> = {};
    
    for (const recipe of allRecipes) {
      if (!recipe.menuItemId) continue;
      
      // Calculate how many servings we can make based on available inventory
      let minServings = Infinity;
      
      for (const ingredient of recipe.ingredients as any[]) {
        const inventoryItem = inventory.find(item => item.id === ingredient.inventoryItemId);
        
        if (!inventoryItem) {
          // If any ingredient is missing, we can't make this item
          minServings = 0;
          break;
        }
        
        const availableQuantity = parseFloat(inventoryItem.quantity);
        const requiredQuantity = ingredient.quantity;
        
        if (requiredQuantity > 0) {
          const possibleServings = Math.floor(availableQuantity / requiredQuantity);
          minServings = Math.min(minServings, possibleServings);
        }
      }
      
      // Store the stock for this menu item
      stock[recipe.menuItemId] = minServings === Infinity ? 0 : minServings;
    }
    
    return stock;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ 
        passwordResetToken: token,
        passwordResetExpiry: expiry
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gte(users.passwordResetExpiry, new Date()) // Check token not expired
      )
    );
    return user;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        passwordResetToken: null,
        passwordResetExpiry: null
      })
      .where(eq(users.id, userId));
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

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices)
      .set(invoice as any)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shop Salaries
  async getSalaries(branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]> {
    const conditions = [];
    if (branchId) conditions.push(eq(salaries.branchId, branchId));
    if (startDate) conditions.push(gte(salaries.paymentDate, startDate));
    if (endDate) conditions.push(lte(salaries.paymentDate, endDate));
    
    if (conditions.length > 0) {
      return await db.select().from(salaries).where(and(...conditions));
    }
    return await db.select().from(salaries);
  }

  async getSalary(id: string): Promise<Salary | undefined> {
    const [salary] = await db.select().from(salaries).where(eq(salaries.id, id));
    return salary;
  }

  async createSalary(salary: InsertSalary): Promise<Salary> {
    const [created] = await db.insert(salaries).values(salary).returning();
    return created;
  }

  async updateSalary(id: string, salary: Partial<InsertSalary>): Promise<Salary | undefined> {
    const [updated] = await db.update(salaries)
      .set(salary)
      .where(eq(salaries.id, id))
      .returning();
    return updated;
  }

  async deleteSalary(id: string): Promise<boolean> {
    const result = await db.delete(salaries).where(eq(salaries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shop Bills
  async getShopBills(branchId?: string, startDate?: Date, endDate?: Date, includeArchived: boolean = false): Promise<ShopBill[]> {
    const conditions = [];
    if (branchId) conditions.push(eq(shopBills.branchId, branchId));
    if (startDate) conditions.push(gte(shopBills.paymentDate, startDate));
    if (endDate) conditions.push(lte(shopBills.paymentDate, endDate));
    if (!includeArchived) conditions.push(eq(shopBills.archived, false));
    
    if (conditions.length > 0) {
      return await db.select().from(shopBills).where(and(...conditions));
    }
    return await db.select().from(shopBills);
  }

  async getShopBill(id: string): Promise<ShopBill | undefined> {
    const [bill] = await db.select().from(shopBills).where(eq(shopBills.id, id));
    return bill;
  }

  async createShopBill(bill: InsertShopBill): Promise<ShopBill> {
    const [created] = await db.insert(shopBills).values(bill).returning();
    return created;
  }

  async updateShopBill(id: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined> {
    const [updated] = await db.update(shopBills)
      .set(bill)
      .where(eq(shopBills.id, id))
      .returning();
    return updated;
  }

  async deleteShopBill(id: string): Promise<boolean> {
    const result = await db.delete(shopBills).where(eq(shopBills.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async archiveShopBill(id: string, archived: boolean): Promise<ShopBill | undefined> {
    const [updated] = await db.update(shopBills)
      .set({ archived })
      .where(eq(shopBills.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
