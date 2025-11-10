import {
  type Branch,
  type InsertBranch,
  type InventoryItem,
  type InsertInventoryItem,
  type MenuItem,
  type InsertMenuItem,
  type Addon,
  type InsertAddon,
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
  type DeliveryApp,
  type InsertDeliveryApp,
  type Investor,
  type InsertInvestor,
  type SubscriptionInvoice,
  type InsertSubscriptionInvoice,
  type MonthlyVatReport,
  type InsertMonthlyVatReport,
  type SupportTicket,
  type InsertSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type EmployeeActivityLog,
  type InsertEmployeeActivityLog,
  branches,
  inventoryItems,
  menuItems,
  addons,
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
  deliveryApps,
  investors,
  subscriptionInvoices,
  monthlyVatReports,
  supportTickets,
  ticketMessages,
  employeeActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, or, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Branches
  getBranches(restaurantId: string): Promise<Branch[]>;
  getBranch(restaurantId: string, id: string): Promise<Branch | undefined>;
  createBranch(restaurantId: string, branch: InsertBranch): Promise<Branch>;
  updateBranch(restaurantId: string, id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(restaurantId: string, id: string): Promise<boolean>;

  // Inventory
  getInventoryItems(restaurantId: string, branchId?: string): Promise<InventoryItem[]>;
  getInventoryItem(restaurantId: string, id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(restaurantId: string, item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(restaurantId: string, id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryItemsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteInventoryItem(restaurantId: string, id: string): Promise<boolean>;

  // Menu
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getMenuItem(restaurantId: string, id: string): Promise<MenuItem | undefined>;
  createMenuItem(restaurantId: string, item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(restaurantId: string, id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(restaurantId: string, id: string): Promise<boolean>;
  getMenuItemsStock(restaurantId: string, branchId?: string): Promise<Record<string, number>>;

  // Add-ons
  getAddons(restaurantId: string, menuItemId?: string): Promise<Addon[]>;
  getAddon(restaurantId: string, id: string): Promise<Addon | undefined>;
  createAddon(restaurantId: string, addon: InsertAddon): Promise<Addon>;
  updateAddon(restaurantId: string, id: string, addon: Partial<InsertAddon>): Promise<Addon | undefined>;
  deleteAddon(restaurantId: string, id: string): Promise<boolean>;
  updateAddonsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;

  // Recipes
  getRecipes(restaurantId: string): Promise<Recipe[]>;
  getRecipe(restaurantId: string, id: string): Promise<Recipe | undefined>;
  createRecipe(restaurantId: string, recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(restaurantId: string, id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  updateRecipesSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteRecipe(restaurantId: string, id: string): Promise<boolean>;

  // Orders
  getOrders(restaurantId: string, branchId?: string, status?: string): Promise<Order[]>;
  getOrder(restaurantId: string, id: string): Promise<Order | undefined>;
  createOrder(restaurantId: string, order: InsertOrder): Promise<Order>;
  updateOrder(restaurantId: string, id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(restaurantId: string, id: string): Promise<boolean>;

  // Transactions
  getTransactions(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]>;
  getTransaction(restaurantId: string, id: string): Promise<Transaction | undefined>;
  createTransaction(restaurantId: string, transaction: InsertTransaction): Promise<Transaction>;

  // Settings
  getSettings(restaurantId: string): Promise<Settings | undefined>;
  updateSettings(restaurantId: string, settings: Partial<InsertSettings>): Promise<Settings>;

  // Procurement
  getProcurements(restaurantId: string, type?: string, status?: string, branchId?: string): Promise<Procurement[]>;
  getProcurement(restaurantId: string, id: string): Promise<Procurement | undefined>;
  createProcurement(restaurantId: string, procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(restaurantId: string, id: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined>;
  deleteProcurement(restaurantId: string, id: string): Promise<boolean>;

  // Users
  getUsers(restaurantId: string): Promise<User[]>;
  getUser(restaurantId: string, id: string): Promise<User | undefined>;
  getUserByUsername(restaurantId: string, username: string): Promise<User | undefined>;
  getUserByEmail(restaurantId: string, email: string): Promise<User | undefined>;
  createUser(restaurantId: string, user: InsertUser): Promise<User>;
  updateUser(restaurantId: string, id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(restaurantId: string, id: string): Promise<boolean>;
  setPasswordResetToken(restaurantId: string, userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(restaurantId: string, token: string): Promise<User | undefined>;
  updatePassword(restaurantId: string, userId: string, newPassword: string): Promise<void>;
  clearPasswordResetToken(restaurantId: string, userId: string): Promise<void>;
  getUserProfile(restaurantId: string, userId: string): Promise<User | undefined>;
  updateUserProfile(restaurantId: string, userId: string, profile: { email?: string; phone?: string }): Promise<User | undefined>;
  cancelSubscription(restaurantId: string, userId: string): Promise<User | undefined>;
  
  // Global user methods (for pre-authentication flows)
  getUserByUsernameGlobal(username: string): Promise<User | undefined>;
  getUserByEmailGlobal(email: string): Promise<User | undefined>;
  getUserByResetTokenGlobal(token: string): Promise<User | undefined>;
  anyUsersExist(): Promise<boolean>;

  // Invoices
  getInvoices(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]>;
  getInvoice(restaurantId: string, id: string): Promise<Invoice | undefined>;
  createInvoice(restaurantId: string, invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(restaurantId: string, id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Customers
  getCustomers(restaurantId: string): Promise<Customer[]>;
  getCustomer(restaurantId: string, id: string): Promise<Customer | undefined>;
  createCustomer(restaurantId: string, customer: InsertCustomer): Promise<Customer>;
  updateCustomer(restaurantId: string, id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(restaurantId: string, id: string): Promise<boolean>;

  // Shop Salaries
  getSalaries(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]>;
  getSalary(restaurantId: string, id: string): Promise<Salary | undefined>;
  createSalary(restaurantId: string, salary: InsertSalary): Promise<Salary>;
  updateSalary(restaurantId: string, id: string, salary: Partial<InsertSalary>): Promise<Salary | undefined>;
  deleteSalary(restaurantId: string, id: string): Promise<boolean>;

  // Shop Bills
  getShopBills(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date, includeArchived?: boolean): Promise<ShopBill[]>;
  getShopBill(restaurantId: string, id: string): Promise<ShopBill | undefined>;
  createShopBill(restaurantId: string, bill: InsertShopBill): Promise<ShopBill>;
  updateShopBill(restaurantId: string, id: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined>;
  deleteShopBill(restaurantId: string, id: string): Promise<boolean>;
  archiveShopBill(restaurantId: string, id: string, archived: boolean): Promise<ShopBill | undefined>;

  // Delivery Apps
  getDeliveryApps(restaurantId: string): Promise<DeliveryApp[]>;
  getDeliveryApp(restaurantId: string, id: string): Promise<DeliveryApp | undefined>;
  createDeliveryApp(restaurantId: string, app: InsertDeliveryApp): Promise<DeliveryApp>;
  updateDeliveryApp(restaurantId: string, id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined>;
  deleteDeliveryApp(restaurantId: string, id: string): Promise<boolean>;
  updateDeliveryAppsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;
  getDeliveryAppProfitability(restaurantId: string): Promise<any>;

  // Investors
  getInvestors(restaurantId: string): Promise<Investor[]>;
  getInvestor(restaurantId: string, id: string): Promise<Investor | undefined>;
  createInvestor(restaurantId: string, investor: InsertInvestor): Promise<Investor>;
  updateInvestor(restaurantId: string, id: string, investor: Partial<InsertInvestor>): Promise<Investor | undefined>;
  deleteInvestor(restaurantId: string, id: string): Promise<boolean>;

  // Subscription Invoices
  getSubscriptionInvoices(restaurantId: string, userId?: string): Promise<SubscriptionInvoice[]>;
  getSubscriptionInvoice(restaurantId: string, id: string): Promise<SubscriptionInvoice | undefined>;
  createSubscriptionInvoice(restaurantId: string, invoice: InsertSubscriptionInvoice): Promise<SubscriptionInvoice>;
  getNextSubscriptionInvoiceSerialNumber(restaurantId: string): Promise<string>;

  // Monthly VAT Reports
  getMonthlyVatReports(restaurantId: string, userId?: string): Promise<MonthlyVatReport[]>;
  getVatReportByMonth(restaurantId: string, userId: string, month: number, year: number): Promise<MonthlyVatReport | undefined>;
  createVatReport(restaurantId: string, report: InsertMonthlyVatReport): Promise<MonthlyVatReport>;
  getNextVatReportSerialNumber(restaurantId: string, year: number, month: number): Promise<string>;

  // Support Tickets
  getSupportTickets(restaurantId: string, userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicket(restaurantId: string, id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(restaurantId: string, ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(restaurantId: string, id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  getNextTicketNumber(restaurantId: string): Promise<string>;

  // Ticket Messages
  getTicketMessages(restaurantId: string, ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(restaurantId: string, message: InsertTicketMessage): Promise<TicketMessage>;
  markMessagesAsRead(restaurantId: string, ticketId: string, userId: string): Promise<void>;
  getUnreadMessageCount(restaurantId: string, userId: string): Promise<number>;

  // Employee Activity Log
  getEmployeeActivities(restaurantId: string, employeeId?: string, category?: string, startDate?: Date, endDate?: Date): Promise<EmployeeActivityLog[]>;
  createEmployeeActivity(restaurantId: string, activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog>;
  getEmployeeActivityStats(restaurantId: string, employeeId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Branches
  async getBranches(restaurantId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.restaurantId, restaurantId));
  }

  async getBranch(restaurantId: string, id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(and(eq(branches.restaurantId, restaurantId), eq(branches.id, id)));
    return branch;
  }

  async createBranch(restaurantId: string, branch: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values({ ...branch, restaurantId }).returning();
    return created;
  }

  async updateBranch(restaurantId: string, id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(branch).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getBranch(restaurantId, id);
    }
    const [updated] = await db.update(branches).set(updateData).where(and(eq(branches.restaurantId, restaurantId), eq(branches.id, id))).returning();
    return updated;
  }

  async deleteBranch(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(branches).where(and(eq(branches.restaurantId, restaurantId), eq(branches.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Inventory
  async getInventoryItems(restaurantId: string, branchId?: string): Promise<InventoryItem[]> {
    const filters = [eq(inventoryItems.restaurantId, restaurantId)];
    if (branchId) filters.push(eq(inventoryItems.branchId, branchId));
    return await db.select().from(inventoryItems).where(and(...filters));
  }

  async getInventoryItem(restaurantId: string, id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.id, id)));
    return item;
  }

  async createInventoryItem(restaurantId: string, item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values({ ...item, restaurantId }).returning();
    return created;
  }

  async updateInventoryItem(restaurantId: string, id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInventoryItem(restaurantId, id);
    }
    const [updated] = await db.update(inventoryItems).set(updateData).where(and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.id, id))).returning();
    return updated;
  }

  async updateInventoryItemsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(inventoryItems).set({ sortOrder: update.sortOrder }).where(and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.id, update.id)));
    }
  }

  async deleteInventoryItem(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Menu
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async getMenuItem(restaurantId: string, id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id)));
    return item;
  }

  async createMenuItem(restaurantId: string, item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values({ ...item, restaurantId }).returning();
    return created;
  }

  async updateMenuItem(restaurantId: string, id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getMenuItem(restaurantId, id);
    }
    const [updated] = await db.update(menuItems).set(updateData).where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id))).returning();
    return updated;
  }

  async deleteMenuItem(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(menuItems).where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMenuItemsStock(restaurantId: string, branchId?: string): Promise<Record<string, number>> {
    // Get all menu items
    const allMenuItems = await this.getMenuItems(restaurantId);
    // Get inventory items for the branch
    const inventory = await this.getInventoryItems(restaurantId, branchId);
    
    const stock: Record<string, number> = {};
    
    // For each menu item, calculate stock based on its recipe (if it has one)
    for (const menuItem of allMenuItems) {
      // If menu item has no recipe, it has infinite stock
      if (!menuItem.recipeId) {
        stock[menuItem.id] = 999999; // Effectively infinite
        continue;
      }
      
      // Get the recipe for this menu item
      const recipe = await this.getRecipe(restaurantId, menuItem.recipeId);
      if (!recipe) {
        stock[menuItem.id] = 999999; // No recipe found, treat as infinite
        continue;
      }
      
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
      stock[menuItem.id] = minServings === Infinity ? 0 : minServings;
    }
    
    return stock;
  }

  // Add-ons
  async getAddons(restaurantId: string, menuItemId?: string): Promise<Addon[]> {
    if (menuItemId) {
      // Return add-ons where menuItemIds is null (available for all items)
      // OR menuItemIds array contains the given menuItemId
      return await db.select().from(addons).where(
        and(
          eq(addons.restaurantId, restaurantId),
          or(
            isNull(addons.menuItemIds),
            sql`${addons.menuItemIds} @> ARRAY[${menuItemId}]::varchar[]`
          )
        )
      );
    }
    return await db.select().from(addons).where(eq(addons.restaurantId, restaurantId));
  }

  async getAddon(restaurantId: string, id: string): Promise<Addon | undefined> {
    const [addon] = await db.select().from(addons).where(and(eq(addons.restaurantId, restaurantId), eq(addons.id, id)));
    return addon;
  }

  async createAddon(restaurantId: string, addon: InsertAddon): Promise<Addon> {
    const [created] = await db.insert(addons).values({ ...addon, restaurantId }).returning();
    return created;
  }

  async updateAddon(restaurantId: string, id: string, addon: Partial<InsertAddon>): Promise<Addon | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(addon).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getAddon(restaurantId, id);
    }
    const [updated] = await db.update(addons).set(updateData).where(and(eq(addons.restaurantId, restaurantId), eq(addons.id, id))).returning();
    return updated;
  }

  async deleteAddon(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(addons).where(and(eq(addons.restaurantId, restaurantId), eq(addons.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateAddonsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(addons).set({ sortOrder: update.sortOrder }).where(and(eq(addons.restaurantId, restaurantId), eq(addons.id, update.id)));
    }
  }

  // Recipes
  async getRecipes(restaurantId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
  }

  async getRecipe(restaurantId: string, id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(and(eq(recipes.restaurantId, restaurantId), eq(recipes.id, id)));
    return recipe;
  }

  async createRecipe(restaurantId: string, recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values({ ...recipe, restaurantId } as any).returning();
    return created;
  }

  async updateRecipe(restaurantId: string, id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(recipe).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRecipe(restaurantId, id);
    }
    const [updated] = await db.update(recipes).set(updateData as any).where(and(eq(recipes.restaurantId, restaurantId), eq(recipes.id, id))).returning();
    return updated;
  }

  async updateRecipesSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(recipes).set({ sortOrder: update.sortOrder }).where(and(eq(recipes.restaurantId, restaurantId), eq(recipes.id, update.id)));
    }
  }

  async deleteRecipe(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(and(eq(recipes.restaurantId, restaurantId), eq(recipes.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Orders
  async getOrders(restaurantId: string, branchId?: string, status?: string): Promise<Order[]> {
    const conditions = [eq(orders.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    if (status) conditions.push(eq(orders.status, status));
    
    return await db.select().from(orders).where(and(...conditions));
  }

  async getOrder(restaurantId: string, id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(and(eq(orders.restaurantId, restaurantId), eq(orders.id, id)));
    return order;
  }

  async createOrder(restaurantId: string, order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values({ ...order, restaurantId } as any).returning();
    return created;
  }

  async updateOrder(restaurantId: string, id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    // Filter out undefined values to avoid "No values to set" error
    const updateData = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      // If no valid fields to update, just return the existing record
      return this.getOrder(restaurantId, id);
    }
    
    const [updated] = await db.update(orders).set(updateData as any).where(and(eq(orders.restaurantId, restaurantId), eq(orders.id, id))).returning();
    return updated;
  }

  async deleteOrder(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(orders).where(and(eq(orders.restaurantId, restaurantId), eq(orders.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transactions
  async getTransactions(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    const conditions = [eq(transactions.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(transactions.branchId, branchId));
    if (startDate) conditions.push(gte(transactions.createdAt, startDate));
    if (endDate) conditions.push(lte(transactions.createdAt, endDate));
    
    return await db.select().from(transactions).where(and(...conditions));
  }

  async getTransaction(restaurantId: string, id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(and(eq(transactions.restaurantId, restaurantId), eq(transactions.id, id)));
    return transaction;
  }

  async createTransaction(restaurantId: string, transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values({ ...transaction, restaurantId }).returning();
    return created;
  }

  // Settings
  async getSettings(restaurantId: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.restaurantId, restaurantId)).limit(1);
    return setting;
  }

  async updateSettings(restaurantId: string, settingsData: Partial<InsertSettings>): Promise<Settings> {
    // Get existing settings
    const existing = await this.getSettings(restaurantId);
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set(settingsData)
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db.insert(settings)
        .values({ ...settingsData, restaurantId } as InsertSettings)
        .returning();
      return created;
    }
  }

  // Procurement
  async getProcurements(restaurantId: string, type?: string, status?: string, branchId?: string): Promise<Procurement[]> {
    const conditions = [eq(procurement.restaurantId, restaurantId)];
    if (type) conditions.push(eq(procurement.type, type));
    if (status) conditions.push(eq(procurement.status, status));
    if (branchId) conditions.push(eq(procurement.branchId, branchId));
    
    return await db.select().from(procurement).where(and(...conditions));
  }

  async getProcurement(restaurantId: string, id: string): Promise<Procurement | undefined> {
    const [item] = await db.select().from(procurement).where(and(eq(procurement.restaurantId, restaurantId), eq(procurement.id, id)));
    return item;
  }

  async createProcurement(restaurantId: string, procurementData: InsertProcurement): Promise<Procurement> {
    const [created] = await db.insert(procurement).values({ ...procurementData, restaurantId }).returning();
    return created;
  }

  async updateProcurement(restaurantId: string, id: string, procurementData: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(procurementData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getProcurement(restaurantId, id);
    }
    const [updated] = await db.update(procurement)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(procurement.restaurantId, restaurantId), eq(procurement.id, id)))
      .returning();
    return updated;
  }

  async deleteProcurement(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(procurement).where(and(eq(procurement.restaurantId, restaurantId), eq(procurement.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Users
  async getUsers(restaurantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  }

  async getUser(restaurantId: string, id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.id, id)));
    return user;
  }

  async getUserByUsername(restaurantId: string, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.username, username)));
    return user;
  }

  async getUserByEmail(restaurantId: string, email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.email, email)));
    return user;
  }

  async createUser(restaurantId: string, user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [created] = await db.insert(users)
      .values({ ...user, password: hashedPassword, restaurantId } as any)
      .returning();
    return created;
  }

  async updateUser(restaurantId: string, id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUser(restaurantId, id);
    }
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 10);
    }
    const [updated] = await db.update(users).set(updateData).where(and(eq(users.restaurantId, restaurantId), eq(users.id, id))).returning();
    return updated;
  }

  async deleteUser(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(users).where(and(eq(users.restaurantId, restaurantId), eq(users.id, id)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setPasswordResetToken(restaurantId: string, userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ 
        passwordResetToken: token,
        passwordResetExpiry: expiry
      })
      .where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)));
  }

  async getUserByResetToken(restaurantId: string, token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.restaurantId, restaurantId),
        eq(users.passwordResetToken, token),
        gte(users.passwordResetExpiry, new Date()) // Check token not expired
      )
    );
    return user;
  }

  async updatePassword(restaurantId: string, userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)));
  }

  async clearPasswordResetToken(restaurantId: string, userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        passwordResetToken: null,
        passwordResetExpiry: null
      })
      .where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)));
  }

  async getUserProfile(restaurantId: string, userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)));
    return user;
  }

  async updateUserProfile(restaurantId: string, userId: string, profile: { email?: string; phone?: string }): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(profile)
      .where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)))
      .returning();
    return updated;
  }

  async cancelSubscription(restaurantId: string, userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date()
      })
      .where(and(eq(users.restaurantId, restaurantId), eq(users.id, userId)))
      .returning();
    return updated;
  }

  // Global user methods (for pre-authentication flows)
  async getUserByUsernameGlobal(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmailGlobal(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetTokenGlobal(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gte(users.passwordResetExpiry, new Date()) // Check token not expired
      )
    );
    return user;
  }

  async anyUsersExist(): Promise<boolean> {
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  }

  // Invoices
  async getInvoices(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Invoice[]> {
    const conditions = [eq(invoices.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(invoices.branchId, branchId));
    if (startDate) conditions.push(gte(invoices.createdAt, startDate));
    if (endDate) conditions.push(lte(invoices.createdAt, endDate));
    
    return await db.select().from(invoices).where(and(...conditions));
  }

  async getInvoice(restaurantId: string, id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.restaurantId, restaurantId), eq(invoices.id, id)));
    return invoice;
  }

  async createInvoice(restaurantId: string, invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values({ ...invoice, restaurantId } as any).returning();
    return created;
  }

  async updateInvoice(restaurantId: string, id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(invoice).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvoice(restaurantId, id);
    }
    const [updated] = await db.update(invoices)
      .set(updateData as any)
      .where(and(eq(invoices.restaurantId, restaurantId), eq(invoices.id, id)))
      .returning();
    return updated;
  }

  // Customers
  async getCustomers(restaurantId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.restaurantId, restaurantId));
  }

  async getCustomer(restaurantId: string, id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(and(eq(customers.restaurantId, restaurantId), eq(customers.id, id)));
    return customer;
  }

  async createCustomer(restaurantId: string, customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values({ ...customer, restaurantId }).returning();
    return created;
  }

  async updateCustomer(restaurantId: string, id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(customer).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getCustomer(restaurantId, id);
    }
    const [updated] = await db.update(customers)
      .set(updateData)
      .where(and(eq(customers.restaurantId, restaurantId), eq(customers.id, id)))
      .returning();
    return updated;
  }

  async deleteCustomer(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(customers).where(and(eq(customers.restaurantId, restaurantId), eq(customers.id, id)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shop Salaries
  async getSalaries(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]> {
    const conditions = [eq(salaries.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(salaries.branchId, branchId));
    if (startDate) conditions.push(gte(salaries.paymentDate, startDate));
    if (endDate) conditions.push(lte(salaries.paymentDate, endDate));
    
    return await db.select().from(salaries).where(and(...conditions));
  }

  async getSalary(restaurantId: string, id: string): Promise<Salary | undefined> {
    const [salary] = await db.select().from(salaries).where(and(eq(salaries.restaurantId, restaurantId), eq(salaries.id, id)));
    return salary;
  }

  async createSalary(restaurantId: string, salary: InsertSalary): Promise<Salary> {
    const [created] = await db.insert(salaries).values({ ...salary, restaurantId }).returning();
    return created;
  }

  async updateSalary(restaurantId: string, id: string, salary: Partial<InsertSalary>): Promise<Salary | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(salary).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getSalary(restaurantId, id);
    }
    const [updated] = await db.update(salaries)
      .set(updateData)
      .where(and(eq(salaries.restaurantId, restaurantId), eq(salaries.id, id)))
      .returning();
    return updated;
  }

  async deleteSalary(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(salaries).where(and(eq(salaries.restaurantId, restaurantId), eq(salaries.id, id)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shop Bills
  async getShopBills(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date, includeArchived: boolean = false): Promise<ShopBill[]> {
    const conditions = [eq(shopBills.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(shopBills.branchId, branchId));
    if (startDate) conditions.push(gte(shopBills.paymentDate, startDate));
    if (endDate) conditions.push(lte(shopBills.paymentDate, endDate));
    if (!includeArchived) conditions.push(eq(shopBills.archived, false));
    
    return await db.select().from(shopBills).where(and(...conditions));
  }

  async getShopBill(restaurantId: string, id: string): Promise<ShopBill | undefined> {
    const [bill] = await db.select().from(shopBills).where(and(eq(shopBills.restaurantId, restaurantId), eq(shopBills.id, id)));
    return bill;
  }

  async createShopBill(restaurantId: string, bill: InsertShopBill): Promise<ShopBill> {
    const [created] = await db.insert(shopBills).values({ ...bill, restaurantId }).returning();
    return created;
  }

  async updateShopBill(restaurantId: string, id: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(bill).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getShopBill(restaurantId, id);
    }
    const [updated] = await db.update(shopBills)
      .set(updateData)
      .where(and(eq(shopBills.restaurantId, restaurantId), eq(shopBills.id, id)))
      .returning();
    return updated;
  }

  async deleteShopBill(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(shopBills).where(and(eq(shopBills.restaurantId, restaurantId), eq(shopBills.id, id)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async archiveShopBill(restaurantId: string, id: string, archived: boolean): Promise<ShopBill | undefined> {
    const [updated] = await db.update(shopBills)
      .set({ archived })
      .where(and(eq(shopBills.restaurantId, restaurantId), eq(shopBills.id, id)))
      .returning();
    return updated;
  }

  // Delivery Apps
  async getDeliveryApps(restaurantId: string): Promise<DeliveryApp[]> {
    return await db.select().from(deliveryApps).where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))).orderBy(deliveryApps.sortOrder);
  }

  async getDeliveryApp(restaurantId: string, id: string): Promise<DeliveryApp | undefined> {
    const [app] = await db.select().from(deliveryApps).where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.id, id)));
    return app;
  }

  async createDeliveryApp(restaurantId: string, app: InsertDeliveryApp): Promise<DeliveryApp> {
    const [created] = await db.insert(deliveryApps).values({ ...app, restaurantId } as any).returning();
    return created;
  }

  async updateDeliveryApp(restaurantId: string, id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined> {
    // Filter out undefined values to avoid "No values to set" error
    const updateData = Object.fromEntries(
      Object.entries(app).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      // If no valid fields to update, just return the existing record
      return this.getDeliveryApp(restaurantId, id);
    }
    
    const [updated] = await db.update(deliveryApps)
      .set(updateData as any)
      .where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.id, id)))
      .returning();
    return updated;
  }

  async deleteDeliveryApp(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(deliveryApps).where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.id, id)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateDeliveryAppsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(deliveryApps)
        .set({ sortOrder: update.sortOrder })
        .where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.id, update.id)));
    }
  }

  async getDeliveryAppProfitability(restaurantId: string): Promise<any> {
    // Get all delivery apps
    const apps = await db.select().from(deliveryApps).where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true)));
    
    // Get all orders with delivery apps
    const allOrders = await db.select().from(orders).where(and(eq(orders.restaurantId, restaurantId), sql`${orders.deliveryAppId} IS NOT NULL`));
    
    // Get all menu items and recipes for cost calculation
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
    const allRecipes = await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
    
    // Create a map of menu item ID to cost (from recipe)
    const itemCostMap = new Map<string, number>();
    for (const item of allMenuItems) {
      if (item.recipeId) {
        const recipe = allRecipes.find(r => r.id === item.recipeId);
        if (recipe) {
          // Cost per item = recipe cost * portion size
          const recipeCost = parseFloat(recipe.cost);
          const portionSize = parseFloat(item.portionSize || "1.00");
          itemCostMap.set(item.id, recipeCost * portionSize);
        }
      }
    }
    
    // Calculate profitability for each delivery app
    const profitabilityData = apps.map(app => {
      const appOrders = allOrders.filter(order => order.deliveryAppId === app.id);
      
      let totalGrossRevenue = 0;
      let totalCommissionCost = 0;
      let totalBankingFeesCost = 0;
      let totalSubsidy = 0;
      let totalPosFees = 0;
      let totalVat = 0;
      let totalItemCosts = 0;
      
      appOrders.forEach(order => {
        const orderTotal = parseFloat(order.total);
        totalGrossRevenue += orderTotal;
        
        // Calculate fees using the new formula
        const commissionPercent = parseFloat(app.commission);
        const bankingFeesPercent = parseFloat(app.bankingFees);
        const posFees = parseFloat(app.posFees);
        
        // Find applicable subsidy tier (safely handle null/undefined tiers)
        const tiers = Array.isArray(app.subsidyTiers) ? app.subsidyTiers : [];
        const applicableTier = tiers.find(tier => {
          const isAboveMin = orderTotal >= tier.minAmount;
          const isBelowMax = tier.maxAmount === null || orderTotal <= tier.maxAmount;
          return isAboveMin && isBelowMax;
        });
        const subsidy = applicableTier ? applicableTier.subsidy : 0;
        
        // Final formula per user requirements:
        // Commission = (Item Price - Subsidy) × Commission%
        // Banking Fees = Item Price × Banking%
        // VAT = (Commission + Subsidy + Banking Fees) × 0.15
        // Total Cost = Commission + Subsidy + Banking Fees + VAT + POS Fees
        // Net Income = Item Price - Total Cost
        
        const subsidizedPrice = orderTotal - subsidy;
        const commissionAmount = subsidizedPrice * (commissionPercent / 100);
        const bankingFeesAmount = orderTotal * (bankingFeesPercent / 100);
        
        // Calculate VAT as 15% of (Commission + Subsidy + Banking Fees)
        const vatBase = commissionAmount + subsidy + bankingFeesAmount;
        const vatAmount = vatBase * 0.15;
        
        // Track totals (Commission, Banking, Subsidy are base amounts; VAT is tracked separately)
        totalCommissionCost += commissionAmount;
        totalBankingFeesCost += bankingFeesAmount;
        totalSubsidy += subsidy;
        totalPosFees += posFees; // POS fees have no VAT
        totalVat += vatAmount; // VAT calculated on Commission + Subsidy + Banking Fees
        
        // Calculate item costs (safely handle null/empty items)
        const orderItems = Array.isArray(order.items) ? order.items : [];
        orderItems.forEach((item: any) => {
          const itemCost = itemCostMap.get(item.id) || 0;
          totalItemCosts += itemCost * item.quantity;
        });
      });
      
      // Net revenue calculation per user formula:
      // Net Income = Item Price - Commission - Subsidy - Banking Fees - VAT - POS Fees
      const netRevenue = totalGrossRevenue - totalCommissionCost - totalSubsidy - totalBankingFeesCost - totalVat - totalPosFees;
      const profit = netRevenue - totalItemCosts;
      const profitMargin = totalGrossRevenue > 0 ? (profit / totalGrossRevenue) * 100 : 0;
      
      return {
        deliveryAppId: app.id,
        deliveryAppName: app.name,
        totalOrders: appOrders.length,
        totalGrossRevenue,
        totalCommissionCost,
        totalBankingFeesCost,
        totalSubsidy,
        totalVat,
        totalPosFees,
        netRevenue,
        totalItemCosts,
        profit,
        profitMargin,
        commissionPercent: parseFloat(app.commission),
        bankingFeesPercent: parseFloat(app.bankingFees),
      };
    });
    
    // Add a summary with totals
    const totalOrders = profitabilityData.reduce((sum, app) => sum + app.totalOrders, 0);
    const totalGrossRevenue = profitabilityData.reduce((sum, app) => sum + app.totalGrossRevenue, 0);
    const totalCommissionCost = profitabilityData.reduce((sum, app) => sum + app.totalCommissionCost, 0);
    const totalBankingFeesCost = profitabilityData.reduce((sum, app) => sum + app.totalBankingFeesCost, 0);
    const totalSubsidy = profitabilityData.reduce((sum, app) => sum + app.totalSubsidy, 0);
    const totalVat = profitabilityData.reduce((sum, app) => sum + app.totalVat, 0);
    const totalPosFees = profitabilityData.reduce((sum, app) => sum + app.totalPosFees, 0);
    const netRevenue = profitabilityData.reduce((sum, app) => sum + app.netRevenue, 0);
    const totalItemCosts = profitabilityData.reduce((sum, app) => sum + app.totalItemCosts, 0);
    const profit = profitabilityData.reduce((sum, app) => sum + app.profit, 0);
    const profitMargin = totalGrossRevenue > 0 ? (profit / totalGrossRevenue) * 100 : 0;
    
    const summary = {
      totalOrders,
      totalGrossRevenue,
      totalCommissionCost,
      totalBankingFeesCost,
      totalSubsidy,
      totalVat,
      totalPosFees,
      netRevenue,
      totalItemCosts,
      profit,
      profitMargin,
    };
    
    return {
      apps: profitabilityData,
      summary,
    };
  }

  async getSalesComparison(restaurantId: string): Promise<any> {
    // Get all orders
    const allOrders = await db.select().from(orders).where(eq(orders.restaurantId, restaurantId));
    
    // Categorize orders by type
    const dineInOrders = allOrders.filter(o => o.orderType === 'Dine-in' && !o.deliveryAppId);
    const takeAwayOrders = allOrders.filter(o => o.orderType === 'Take-away' && !o.deliveryAppId);
    const deliveryAppOrders = allOrders.filter(o => o.deliveryAppId !== null);
    
    // Calculate metrics for each category
    const calculateMetrics = (orderList: any[]) => {
      const totalOrders = orderList.length;
      const totalRevenue = orderList.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      return {
        totalOrders,
        totalRevenue,
        avgOrderValue,
      };
    };
    
    const dineInMetrics = calculateMetrics(dineInOrders);
    const takeAwayMetrics = calculateMetrics(takeAwayOrders);
    const deliveryAppMetrics = calculateMetrics(deliveryAppOrders);
    
    // Calculate percentages
    const totalOrders = dineInMetrics.totalOrders + takeAwayMetrics.totalOrders + deliveryAppMetrics.totalOrders;
    const totalRevenue = dineInMetrics.totalRevenue + takeAwayMetrics.totalRevenue + deliveryAppMetrics.totalRevenue;
    
    // Get delivery app breakdown
    const deliveryAppsData = await db.select().from(deliveryApps).where(and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true)));
    const deliveryAppBreakdown = deliveryAppsData.map(app => {
      const appOrders = deliveryAppOrders.filter(o => o.deliveryAppId === app.id);
      const metrics = calculateMetrics(appOrders);
      return {
        appId: app.id,
        appName: app.name,
        ...metrics,
      };
    });
    
    return {
      summary: {
        totalOrders,
        totalRevenue,
      },
      dineIn: {
        ...dineInMetrics,
        percentage: totalOrders > 0 ? (dineInMetrics.totalOrders / totalOrders) * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? (dineInMetrics.totalRevenue / totalRevenue) * 100 : 0,
      },
      takeAway: {
        ...takeAwayMetrics,
        percentage: totalOrders > 0 ? (takeAwayMetrics.totalOrders / totalOrders) * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? (takeAwayMetrics.totalRevenue / totalRevenue) * 100 : 0,
      },
      deliveryApps: {
        ...deliveryAppMetrics,
        percentage: totalOrders > 0 ? (deliveryAppMetrics.totalOrders / totalOrders) * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? (deliveryAppMetrics.totalRevenue / totalRevenue) * 100 : 0,
        breakdown: deliveryAppBreakdown,
      },
    };
  }

  // Investors
  async getInvestors(restaurantId: string): Promise<Investor[]> {
    return await db.select().from(investors).where(and(eq(investors.restaurantId, restaurantId), eq(investors.active, true))).orderBy(investors.createdAt);
  }

  async getInvestor(restaurantId: string, id: string): Promise<Investor | undefined> {
    const [investor] = await db.select().from(investors).where(and(eq(investors.restaurantId, restaurantId), eq(investors.id, id)));
    return investor;
  }

  async createInvestor(restaurantId: string, investor: InsertInvestor): Promise<Investor> {
    const [created] = await db.insert(investors).values({ ...investor, restaurantId } as any).returning();
    return created;
  }

  async updateInvestor(restaurantId: string, id: string, investor: Partial<InsertInvestor>): Promise<Investor | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(investor).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvestor(restaurantId, id);
    }
    const [updated] = await db.update(investors)
      .set(updateData as any)
      .where(and(eq(investors.restaurantId, restaurantId), eq(investors.id, id)))
      .returning();
    return updated;
  }

  async deleteInvestor(restaurantId: string, id: string): Promise<boolean> {
    const result = await db.delete(investors).where(and(eq(investors.restaurantId, restaurantId), eq(investors.id, id)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subscription Invoices
  async getSubscriptionInvoices(restaurantId: string, userId?: string): Promise<SubscriptionInvoice[]> {
    const conditions = [eq(subscriptionInvoices.restaurantId, restaurantId)];
    if (userId) {
      conditions.push(eq(subscriptionInvoices.userId, userId));
    }
    return await db.select().from(subscriptionInvoices)
      .where(and(...conditions))
      .orderBy(subscriptionInvoices.invoiceDate);
  }

  async getSubscriptionInvoice(restaurantId: string, id: string): Promise<SubscriptionInvoice | undefined> {
    const [invoice] = await db.select().from(subscriptionInvoices).where(and(eq(subscriptionInvoices.restaurantId, restaurantId), eq(subscriptionInvoices.id, id)));
    return invoice;
  }

  async createSubscriptionInvoice(restaurantId: string, invoice: InsertSubscriptionInvoice): Promise<SubscriptionInvoice> {
    const [created] = await db.insert(subscriptionInvoices).values({ ...invoice, restaurantId } as any).returning();
    return created;
  }

  async getNextSubscriptionInvoiceSerialNumber(restaurantId: string): Promise<string> {
    // Get the count of existing invoices for this restaurant
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(subscriptionInvoices).where(eq(subscriptionInvoices.restaurantId, restaurantId));
    const count = (result?.count || 0) + 1;
    
    // Format: 0001-YYYYMMDD-HHMMSS
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS
    const serialNumber = `${count.toString().padStart(4, '0')}-${dateStr}-${timeStr}`;
    
    return serialNumber;
  }

  // Monthly VAT Reports
  async getMonthlyVatReports(restaurantId: string, userId?: string): Promise<MonthlyVatReport[]> {
    const conditions = [eq(monthlyVatReports.restaurantId, restaurantId)];
    if (userId) {
      conditions.push(eq(monthlyVatReports.userId, userId));
    }
    return await db.select().from(monthlyVatReports)
      .where(and(...conditions))
      .orderBy(sql`${monthlyVatReports.reportYear} DESC, ${monthlyVatReports.reportMonth} DESC`);
  }

  async getVatReportByMonth(restaurantId: string, userId: string, month: number, year: number): Promise<MonthlyVatReport | undefined> {
    const [report] = await db.select().from(monthlyVatReports)
      .where(
        and(
          eq(monthlyVatReports.restaurantId, restaurantId),
          eq(monthlyVatReports.userId, userId),
          eq(monthlyVatReports.reportMonth, month),
          eq(monthlyVatReports.reportYear, year)
        )
      );
    return report;
  }

  async createVatReport(restaurantId: string, report: InsertMonthlyVatReport): Promise<MonthlyVatReport> {
    const [created] = await db.insert(monthlyVatReports).values({ ...report, restaurantId } as any).returning();
    return created;
  }

  async getNextVatReportSerialNumber(restaurantId: string, year: number, month: number): Promise<string> {
    // Count reports for the specific month and restaurant
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(monthlyVatReports)
      .where(
        and(
          eq(monthlyVatReports.restaurantId, restaurantId),
          eq(monthlyVatReports.reportYear, year),
          eq(monthlyVatReports.reportMonth, month)
        )
      );
    const count = (result?.count || 0) + 1;
    
    // Format: VAT-YYYY-MM-XXXX
    const serialNumber = `VAT-${year}-${month.toString().padStart(2, '0')}-${count.toString().padStart(4, '0')}`;
    
    return serialNumber;
  }

  // Support Tickets
  async getSupportTickets(restaurantId: string, userId?: string, status?: string): Promise<SupportTicket[]> {
    let query = db.select().from(supportTickets);
    
    const conditions = [eq(supportTickets.restaurantId, restaurantId)];
    if (userId) {
      conditions.push(eq(supportTickets.userId, userId));
    }
    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    
    query = query.where(and(...conditions)) as any;
    
    return await query.orderBy(sql`${supportTickets.createdAt} DESC`);
  }

  async getSupportTicket(restaurantId: string, id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(and(eq(supportTickets.restaurantId, restaurantId), eq(supportTickets.id, id)));
    return ticket;
  }

  async createSupportTicket(restaurantId: string, ticket: InsertSupportTicket): Promise<SupportTicket> {
    const ticketNumber = await this.getNextTicketNumber(restaurantId);
    const [created] = await db.insert(supportTickets).values({
      ...ticket,
      restaurantId,
      ticketNumber,
    } as any).returning();
    return created;
  }

  async updateSupportTicket(restaurantId: string, id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const updateData: any = { ...ticket, updatedAt: new Date() };
    
    // Set resolved/closed timestamps
    if (ticket.status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (ticket.status === 'closed' && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }
    
    const [updated] = await db.update(supportTickets)
      .set(updateData)
      .where(and(eq(supportTickets.restaurantId, restaurantId), eq(supportTickets.id, id)))
      .returning();
    return updated;
  }

  async getNextTicketNumber(restaurantId: string): Promise<string> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.restaurantId, restaurantId));
    const count = (result?.count || 0) + 1;
    
    // Format: TKT-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const serialNumber = `TKT-${dateStr}-${count.toString().padStart(4, '0')}`;
    
    return serialNumber;
  }

  // Ticket Messages
  async getTicketMessages(restaurantId: string, ticketId: string): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(and(eq(ticketMessages.restaurantId, restaurantId), eq(ticketMessages.ticketId, ticketId)))
      .orderBy(sql`${ticketMessages.createdAt} ASC`);
  }

  async createTicketMessage(restaurantId: string, message: InsertTicketMessage): Promise<TicketMessage> {
    const [created] = await db.insert(ticketMessages).values({ ...message, restaurantId } as any).returning();
    
    // Update ticket's updatedAt timestamp - no need to filter by restaurantId here as we already know the ticketId
    await db.update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, message.ticketId));
    
    return created;
  }

  async markMessagesAsRead(restaurantId: string, ticketId: string, userId: string): Promise<void> {
    // Mark all messages in this ticket as read where the sender is NOT the current user
    await db.update(ticketMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(ticketMessages.restaurantId, restaurantId),
          eq(ticketMessages.ticketId, ticketId),
          sql`${ticketMessages.senderId} != ${userId}`
        )
      );
  }

  async getUnreadMessageCount(restaurantId: string, userId: string): Promise<number> {
    // Get tickets for this user
    const userTickets = await db.select({ id: supportTickets.id })
      .from(supportTickets)
      .where(and(eq(supportTickets.restaurantId, restaurantId), eq(supportTickets.userId, userId)));
    
    if (userTickets.length === 0) return 0;
    
    const ticketIds = userTickets.map(t => t.id);
    
    // Count unread messages in user's tickets where sender is NOT the user
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(ticketMessages)
      .where(
        and(
          eq(ticketMessages.restaurantId, restaurantId),
          sql`${ticketMessages.ticketId} IN (${sql.join(ticketIds.map(id => sql`${id}`), sql`, `)})`,
          eq(ticketMessages.isRead, false),
          sql`${ticketMessages.senderId} != ${userId}`
        )
      );
    
    return result?.count || 0;
  }

  // Employee Activity Log
  async getEmployeeActivities(
    restaurantId: string,
    employeeId?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmployeeActivityLog[]> {
    let query = db.select().from(employeeActivityLog);
    
    const conditions = [eq(employeeActivityLog.restaurantId, restaurantId)];
    if (employeeId) {
      conditions.push(eq(employeeActivityLog.employeeId, employeeId));
    }
    if (category) {
      conditions.push(eq(employeeActivityLog.actionCategory, category));
    }
    if (startDate) {
      conditions.push(gte(employeeActivityLog.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(employeeActivityLog.createdAt, endDate));
    }
    
    query = query.where(and(...conditions)) as any;
    
    return await query.orderBy(sql`${employeeActivityLog.createdAt} DESC`);
  }

  async createEmployeeActivity(restaurantId: string, activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog> {
    const [created] = await db.insert(employeeActivityLog).values({ ...activity, restaurantId } as any).returning();
    return created;
  }

  async getEmployeeActivityStats(restaurantId: string, employeeId: string): Promise<any> {
    // Get total activity count
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(and(eq(employeeActivityLog.restaurantId, restaurantId), eq(employeeActivityLog.employeeId, employeeId)));
    
    // Get activities by category
    const categoryCounts = await db.select({
      category: employeeActivityLog.actionCategory,
      count: sql<number>`count(*)`,
    })
      .from(employeeActivityLog)
      .where(and(eq(employeeActivityLog.restaurantId, restaurantId), eq(employeeActivityLog.employeeId, employeeId)))
      .groupBy(employeeActivityLog.actionCategory);
    
    // Get recent activities (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [recentResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(
        and(
          eq(employeeActivityLog.restaurantId, restaurantId),
          eq(employeeActivityLog.employeeId, employeeId),
          gte(employeeActivityLog.createdAt, yesterday)
        )
      );
    
    return {
      totalActivities: totalResult?.count || 0,
      categoryCounts: categoryCounts.map(c => ({ category: c.category, count: c.count })),
      recentActivities24h: recentResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
