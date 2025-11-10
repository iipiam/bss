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
  moyasarPayments,
  type MoyasarPayment,
  type InsertMoyasarPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, or, isNull } from "drizzle-orm";
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
  updateInventoryItemsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Menu
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<boolean>;
  getMenuItemsStock(branchId?: string): Promise<Record<string, number>>;

  // Add-ons
  getAddons(menuItemId?: string): Promise<Addon[]>;
  getAddon(id: string): Promise<Addon | undefined>;
  createAddon(addon: InsertAddon): Promise<Addon>;
  updateAddon(id: string, addon: Partial<InsertAddon>): Promise<Addon | undefined>;
  deleteAddon(id: string): Promise<boolean>;
  updateAddonsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  updateRecipesSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteRecipe(id: string): Promise<boolean>;

  // Orders
  getOrders(branchId?: string, status?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

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
  getUserProfile(userId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, profile: { email?: string; phone?: string }): Promise<User | undefined>;
  cancelSubscription(userId: string): Promise<User | undefined>;

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

  // Delivery Apps
  getDeliveryApps(): Promise<DeliveryApp[]>;
  getDeliveryApp(id: string): Promise<DeliveryApp | undefined>;
  createDeliveryApp(app: InsertDeliveryApp): Promise<DeliveryApp>;
  updateDeliveryApp(id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined>;
  deleteDeliveryApp(id: string): Promise<boolean>;
  updateDeliveryAppsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;
  getDeliveryAppProfitability(): Promise<any>;

  // Investors
  getInvestors(): Promise<Investor[]>;
  getInvestor(id: string): Promise<Investor | undefined>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: string, investor: Partial<InsertInvestor>): Promise<Investor | undefined>;
  deleteInvestor(id: string): Promise<boolean>;

  // Subscription Invoices
  getSubscriptionInvoices(userId?: string): Promise<SubscriptionInvoice[]>;
  getSubscriptionInvoice(id: string): Promise<SubscriptionInvoice | undefined>;
  createSubscriptionInvoice(invoice: InsertSubscriptionInvoice): Promise<SubscriptionInvoice>;
  getNextSubscriptionInvoiceSerialNumber(): Promise<string>;

  // Monthly VAT Reports
  getMonthlyVatReports(userId?: string): Promise<MonthlyVatReport[]>;
  getVatReportByMonth(userId: string, month: number, year: number): Promise<MonthlyVatReport | undefined>;
  createVatReport(report: InsertMonthlyVatReport): Promise<MonthlyVatReport>;
  getNextVatReportSerialNumber(year: number, month: number): Promise<string>;

  // Support Tickets
  getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  getNextTicketNumber(): Promise<string>;

  // Ticket Messages
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  markMessagesAsRead(ticketId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Employee Activity Log
  getEmployeeActivities(employeeId?: string, category?: string, startDate?: Date, endDate?: Date): Promise<EmployeeActivityLog[]>;
  createEmployeeActivity(activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog>;
  getEmployeeActivityStats(employeeId: string): Promise<any>;

  // Moyasar Payments
  getMoyasarPayments(branchId?: string): Promise<MoyasarPayment[]>;
  getMoyasarPayment(id: string): Promise<MoyasarPayment | undefined>;
  getMoyasarPaymentByMoyasarId(moyasarId: string): Promise<MoyasarPayment | undefined>;
  createMoyasarPayment(payment: InsertMoyasarPayment): Promise<MoyasarPayment>;
  updateMoyasarPayment(id: string, payment: Partial<InsertMoyasarPayment>): Promise<MoyasarPayment | undefined>;
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
    const updateData = Object.fromEntries(
      Object.entries(branch).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getBranch(id);
    }
    const [updated] = await db.update(branches).set(updateData).where(eq(branches.id, id)).returning();
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
    const updateData = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInventoryItem(id);
    }
    const [updated] = await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, id)).returning();
    return updated;
  }

  async updateInventoryItemsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(inventoryItems).set({ sortOrder: update.sortOrder }).where(eq(inventoryItems.id, update.id));
    }
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
    const updateData = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getMenuItem(id);
    }
    const [updated] = await db.update(menuItems).set(updateData).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMenuItemsStock(branchId?: string): Promise<Record<string, number>> {
    // Get all menu items
    const allMenuItems = await this.getMenuItems();
    // Get inventory items for the branch
    const inventory = await this.getInventoryItems(branchId);
    
    const stock: Record<string, number> = {};
    
    // For each menu item, calculate stock based on its recipe (if it has one)
    for (const menuItem of allMenuItems) {
      // If menu item has no recipe, it has infinite stock
      if (!menuItem.recipeId) {
        stock[menuItem.id] = 999999; // Effectively infinite
        continue;
      }
      
      // Get the recipe for this menu item
      const recipe = await this.getRecipe(menuItem.recipeId);
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
  async getAddons(menuItemId?: string): Promise<Addon[]> {
    if (menuItemId) {
      // Return add-ons where menuItemIds is null (available for all items)
      // OR menuItemIds array contains the given menuItemId
      return await db.select().from(addons).where(
        or(
          isNull(addons.menuItemIds),
          sql`${addons.menuItemIds} @> ARRAY[${menuItemId}]::varchar[]`
        )
      );
    }
    return await db.select().from(addons);
  }

  async getAddon(id: string): Promise<Addon | undefined> {
    const [addon] = await db.select().from(addons).where(eq(addons.id, id));
    return addon;
  }

  async createAddon(addon: InsertAddon): Promise<Addon> {
    const [created] = await db.insert(addons).values(addon).returning();
    return created;
  }

  async updateAddon(id: string, addon: Partial<InsertAddon>): Promise<Addon | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(addon).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getAddon(id);
    }
    const [updated] = await db.update(addons).set(updateData).where(eq(addons.id, id)).returning();
    return updated;
  }

  async deleteAddon(id: string): Promise<boolean> {
    const result = await db.delete(addons).where(eq(addons.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateAddonsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(addons).set({ sortOrder: update.sortOrder }).where(eq(addons.id, update.id));
    }
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
    const updateData = Object.fromEntries(
      Object.entries(recipe).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRecipe(id);
    }
    const [updated] = await db.update(recipes).set(updateData as any).where(eq(recipes.id, id)).returning();
    return updated;
  }

  async updateRecipesSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(recipes).set({ sortOrder: update.sortOrder }).where(eq(recipes.id, update.id));
    }
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
    // Filter out undefined values to avoid "No values to set" error
    const updateData = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      // If no valid fields to update, just return the existing record
      return this.getOrder(id);
    }
    
    const [updated] = await db.update(orders).set(updateData as any).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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
    const updateData = Object.fromEntries(
      Object.entries(procurementData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getProcurement(id);
    }
    const [updated] = await db.update(procurement)
      .set({ ...updateData, updatedAt: new Date() })
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
      .values({ ...user, password: hashedPassword } as any)
      .returning();
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUser(id);
    }
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 10);
    }
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
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

  async getUserProfile(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUserProfile(userId: string, profile: { email?: string; phone?: string }): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async cancelSubscription(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
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
    const updateData = Object.fromEntries(
      Object.entries(invoice).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvoice(id);
    }
    const [updated] = await db.update(invoices)
      .set(updateData as any)
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
    const updateData = Object.fromEntries(
      Object.entries(customer).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getCustomer(id);
    }
    const [updated] = await db.update(customers)
      .set(updateData)
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
    const updateData = Object.fromEntries(
      Object.entries(salary).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getSalary(id);
    }
    const [updated] = await db.update(salaries)
      .set(updateData)
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
    const updateData = Object.fromEntries(
      Object.entries(bill).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getShopBill(id);
    }
    const [updated] = await db.update(shopBills)
      .set(updateData)
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

  // Delivery Apps
  async getDeliveryApps(): Promise<DeliveryApp[]> {
    return await db.select().from(deliveryApps).where(eq(deliveryApps.active, true)).orderBy(deliveryApps.sortOrder);
  }

  async getDeliveryApp(id: string): Promise<DeliveryApp | undefined> {
    const [app] = await db.select().from(deliveryApps).where(eq(deliveryApps.id, id));
    return app;
  }

  async createDeliveryApp(app: InsertDeliveryApp): Promise<DeliveryApp> {
    const [created] = await db.insert(deliveryApps).values(app as any).returning();
    return created;
  }

  async updateDeliveryApp(id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined> {
    // Filter out undefined values to avoid "No values to set" error
    const updateData = Object.fromEntries(
      Object.entries(app).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      // If no valid fields to update, just return the existing record
      return this.getDeliveryApp(id);
    }
    
    const [updated] = await db.update(deliveryApps)
      .set(updateData as any)
      .where(eq(deliveryApps.id, id))
      .returning();
    return updated;
  }

  async deleteDeliveryApp(id: string): Promise<boolean> {
    const result = await db.delete(deliveryApps).where(eq(deliveryApps.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateDeliveryAppsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(deliveryApps)
        .set({ sortOrder: update.sortOrder })
        .where(eq(deliveryApps.id, update.id));
    }
  }

  async getDeliveryAppProfitability(): Promise<any> {
    // Get all delivery apps
    const apps = await db.select().from(deliveryApps).where(eq(deliveryApps.active, true));
    
    // Get all orders with delivery apps
    const allOrders = await db.select().from(orders).where(sql`${orders.deliveryAppId} IS NOT NULL`);
    
    // Get all menu items and recipes for cost calculation
    const allMenuItems = await db.select().from(menuItems);
    const allRecipes = await db.select().from(recipes);
    
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

  async getSalesComparison(): Promise<any> {
    // Get all orders
    const allOrders = await db.select().from(orders);
    
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
    const deliveryAppsData = await db.select().from(deliveryApps).where(eq(deliveryApps.active, true));
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
  async getInvestors(): Promise<Investor[]> {
    return await db.select().from(investors).where(eq(investors.active, true)).orderBy(investors.createdAt);
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    const [investor] = await db.select().from(investors).where(eq(investors.id, id));
    return investor;
  }

  async createInvestor(investor: InsertInvestor): Promise<Investor> {
    const [created] = await db.insert(investors).values(investor as any).returning();
    return created;
  }

  async updateInvestor(id: string, investor: Partial<InsertInvestor>): Promise<Investor | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(investor).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvestor(id);
    }
    const [updated] = await db.update(investors)
      .set(updateData as any)
      .where(eq(investors.id, id))
      .returning();
    return updated;
  }

  async deleteInvestor(id: string): Promise<boolean> {
    const result = await db.delete(investors).where(eq(investors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subscription Invoices
  async getSubscriptionInvoices(userId?: string): Promise<SubscriptionInvoice[]> {
    if (userId) {
      return await db.select().from(subscriptionInvoices)
        .where(eq(subscriptionInvoices.userId, userId))
        .orderBy(subscriptionInvoices.invoiceDate);
    }
    return await db.select().from(subscriptionInvoices).orderBy(subscriptionInvoices.invoiceDate);
  }

  async getSubscriptionInvoice(id: string): Promise<SubscriptionInvoice | undefined> {
    const [invoice] = await db.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.id, id));
    return invoice;
  }

  async createSubscriptionInvoice(invoice: InsertSubscriptionInvoice): Promise<SubscriptionInvoice> {
    const [created] = await db.insert(subscriptionInvoices).values(invoice as any).returning();
    return created;
  }

  async getNextSubscriptionInvoiceSerialNumber(): Promise<string> {
    // Get the count of existing invoices
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(subscriptionInvoices);
    const count = (result?.count || 0) + 1;
    
    // Format: 0001-YYYYMMDD-HHMMSS
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS
    const serialNumber = `${count.toString().padStart(4, '0')}-${dateStr}-${timeStr}`;
    
    return serialNumber;
  }

  // Monthly VAT Reports
  async getMonthlyVatReports(userId?: string): Promise<MonthlyVatReport[]> {
    if (userId) {
      return await db.select().from(monthlyVatReports)
        .where(eq(monthlyVatReports.userId, userId))
        .orderBy(sql`${monthlyVatReports.reportYear} DESC, ${monthlyVatReports.reportMonth} DESC`);
    }
    return await db.select().from(monthlyVatReports)
      .orderBy(sql`${monthlyVatReports.reportYear} DESC, ${monthlyVatReports.reportMonth} DESC`);
  }

  async getVatReportByMonth(userId: string, month: number, year: number): Promise<MonthlyVatReport | undefined> {
    const [report] = await db.select().from(monthlyVatReports)
      .where(
        and(
          eq(monthlyVatReports.userId, userId),
          eq(monthlyVatReports.reportMonth, month),
          eq(monthlyVatReports.reportYear, year)
        )
      );
    return report;
  }

  async createVatReport(report: InsertMonthlyVatReport): Promise<MonthlyVatReport> {
    const [created] = await db.insert(monthlyVatReports).values(report as any).returning();
    return created;
  }

  async getNextVatReportSerialNumber(year: number, month: number): Promise<string> {
    // Count reports for the specific month
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(monthlyVatReports)
      .where(
        and(
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
  async getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]> {
    let query = db.select().from(supportTickets);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(supportTickets.userId, userId));
    }
    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(sql`${supportTickets.createdAt} DESC`);
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const ticketNumber = await this.getNextTicketNumber();
    const [created] = await db.insert(supportTickets).values({
      ...ticket,
      ticketNumber,
    } as any).returning();
    return created;
  }

  async updateSupportTicket(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
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
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  async getNextTicketNumber(): Promise<string> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(supportTickets);
    const count = (result?.count || 0) + 1;
    
    // Format: TKT-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const serialNumber = `TKT-${dateStr}-${count.toString().padStart(4, '0')}`;
    
    return serialNumber;
  }

  // Ticket Messages
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(sql`${ticketMessages.createdAt} ASC`);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [created] = await db.insert(ticketMessages).values(message as any).returning();
    
    // Update ticket's updatedAt timestamp
    await db.update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, message.ticketId));
    
    return created;
  }

  async markMessagesAsRead(ticketId: string, userId: string): Promise<void> {
    // Mark all messages in this ticket as read where the sender is NOT the current user
    await db.update(ticketMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          sql`${ticketMessages.senderId} != ${userId}`
        )
      );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    // Get tickets for this user
    const userTickets = await db.select({ id: supportTickets.id })
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId));
    
    if (userTickets.length === 0) return 0;
    
    const ticketIds = userTickets.map(t => t.id);
    
    // Count unread messages in user's tickets where sender is NOT the user
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(ticketMessages)
      .where(
        and(
          sql`${ticketMessages.ticketId} IN (${sql.join(ticketIds.map(id => sql`${id}`), sql`, `)})`,
          eq(ticketMessages.isRead, false),
          sql`${ticketMessages.senderId} != ${userId}`
        )
      );
    
    return result?.count || 0;
  }

  // Employee Activity Log
  async getEmployeeActivities(
    employeeId?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmployeeActivityLog[]> {
    let query = db.select().from(employeeActivityLog);
    
    const conditions = [];
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
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(sql`${employeeActivityLog.createdAt} DESC`);
  }

  async createEmployeeActivity(activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog> {
    const [created] = await db.insert(employeeActivityLog).values(activity as any).returning();
    return created;
  }

  async getEmployeeActivityStats(employeeId: string): Promise<any> {
    // Get total activity count
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(eq(employeeActivityLog.employeeId, employeeId));
    
    // Get activities by category
    const categoryCounts = await db.select({
      category: employeeActivityLog.actionCategory,
      count: sql<number>`count(*)`,
    })
      .from(employeeActivityLog)
      .where(eq(employeeActivityLog.employeeId, employeeId))
      .groupBy(employeeActivityLog.actionCategory);
    
    // Get recent activities (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [recentResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(
        and(
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

  // Moyasar Payments
  async getMoyasarPayments(branchId?: string): Promise<MoyasarPayment[]> {
    if (branchId) {
      return await db.select().from(moyasarPayments)
        .where(eq(moyasarPayments.branchId, branchId))
        .orderBy(sql`${moyasarPayments.createdAt} DESC`);
    }
    return await db.select().from(moyasarPayments)
      .orderBy(sql`${moyasarPayments.createdAt} DESC`);
  }

  async getMoyasarPayment(id: string): Promise<MoyasarPayment | undefined> {
    const [payment] = await db.select().from(moyasarPayments).where(eq(moyasarPayments.id, id));
    return payment;
  }

  async getMoyasarPaymentByMoyasarId(moyasarId: string): Promise<MoyasarPayment | undefined> {
    const [payment] = await db.select().from(moyasarPayments).where(eq(moyasarPayments.moyasarId, moyasarId));
    return payment;
  }

  async createMoyasarPayment(payment: InsertMoyasarPayment): Promise<MoyasarPayment> {
    const [created] = await db.insert(moyasarPayments).values(payment as any).returning();
    return created;
  }

  async updateMoyasarPayment(id: string, payment: Partial<InsertMoyasarPayment>): Promise<MoyasarPayment | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(payment).filter(([_, value]) => value !== undefined)
    );
    updateData.updatedAt = new Date();
    
    if (Object.keys(updateData).length === 0) {
      return this.getMoyasarPayment(id);
    }
    
    const [updated] = await db.update(moyasarPayments)
      .set(updateData as any)
      .where(eq(moyasarPayments.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
