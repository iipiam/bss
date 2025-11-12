import {
  type Restaurant,
  type InsertRestaurant,
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
  restaurants,
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
  bootstrapResetTokens,
  type BootstrapResetToken,
  type InsertBootstrapResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, or, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Restaurants (Multi-tenant isolation)
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;

  // Branches (MULTI-TENANT: requires restaurantId for all operations)
  getBranches(restaurantId: string): Promise<Branch[]>;
  getBranch(id: string, restaurantId: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, restaurantId: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string, restaurantId: string): Promise<boolean>;

  // Inventory (MULTI-TENANT: requires restaurantId for all operations)
  getInventoryItems(restaurantId: string, branchId?: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string, restaurantId: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, restaurantId: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryItemsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteInventoryItem(id: string, restaurantId: string): Promise<boolean>;

  // Menu (MULTI-TENANT: requires restaurantId for all operations)
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getMenuItem(id: string, restaurantId: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, restaurantId: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string, restaurantId: string): Promise<boolean>;
  getMenuItemsStock(restaurantId: string, branchId?: string): Promise<Record<string, number>>;

  // Add-ons (MULTI-TENANT: requires restaurantId for all operations)
  getAddons(restaurantId: string, menuItemId?: string): Promise<Addon[]>;
  getAddon(id: string, restaurantId: string): Promise<Addon | undefined>;
  createAddon(addon: InsertAddon): Promise<Addon>;
  updateAddon(id: string, restaurantId: string, addon: Partial<InsertAddon>): Promise<Addon | undefined>;
  deleteAddon(id: string, restaurantId: string): Promise<boolean>;
  updateAddonsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;

  // Recipes (MULTI-TENANT: requires restaurantId for all operations)
  getRecipes(restaurantId: string): Promise<Recipe[]>;
  getRecipe(id: string, restaurantId: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, restaurantId: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  updateRecipesSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void>;
  deleteRecipe(id: string, restaurantId: string): Promise<boolean>;

  // Orders (MULTI-TENANT: requires restaurantId for all operations)
  getOrders(filter: {
    restaurantId: string;
    branchId?: string;
    status?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Order[]>;
  getOrder(id: string, restaurantId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, restaurantId: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string, restaurantId: string): Promise<boolean>;

  // Transactions (MULTI-TENANT: requires restaurantId for all operations)
  getTransactions(filter: {
    restaurantId: string;
    branchId?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Transaction[]>;
  getTransaction(id: string, restaurantId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Settings
  getSettings(restaurantId: string): Promise<Settings | undefined>;
  updateSettings(restaurantId: string, settings: Partial<InsertSettings>): Promise<Settings>;

  // Procurement (MULTI-TENANT: requires restaurantId for all operations)
  getProcurements(filter: {
    restaurantId: string;
    type?: string;
    status?: string;
    branchId?: string;
  }): Promise<Procurement[]>;
  getProcurement(id: string, restaurantId: string): Promise<Procurement | undefined>;
  createProcurement(procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(id: string, restaurantId: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined>;
  deleteProcurement(id: string, restaurantId: string): Promise<boolean>;

  // Users (MULTI-TENANT: requires restaurantId for all operations)
  getAllUsers(): Promise<User[]>; // SPECIAL: For first-run check only, returns ALL users across ALL restaurants
  getUsers(restaurantId: string): Promise<User[]>;
  getUser(id: string, restaurantId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // SPECIAL: Used for login, no restaurantId filter
  getUserByEmail(email: string): Promise<User | undefined>; // SPECIAL: Used for password reset, no restaurantId filter
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, restaurantId: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string, restaurantId: string): Promise<boolean>;
  setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>; // SPECIAL: Password reset flow, no restaurantId filter
  updatePassword(userId: string, newPassword: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  getUserProfile(userId: string, restaurantId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, restaurantId: string, profile: { email?: string; phone?: string }): Promise<User | undefined>;
  cancelSubscription(userId: string, restaurantId: string): Promise<User | undefined>;
  
  // Bootstrap Reset Tokens
  getValidBootstrapToken(plainToken: string): Promise<{ id: string; tokenHash: string } | undefined>;
  consumeBootstrapToken(tokenId: string, username: string, ipAddress: string): Promise<void>;

  // Invoices (MULTI-TENANT: requires restaurantId for all operations)
  getInvoices(filter: {
    restaurantId: string;
    branchId?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Invoice[]>;
  getInvoice(id: string, restaurantId: string): Promise<Invoice | undefined>;
  getInvoicePublic(id: string): Promise<Invoice | undefined>; // PUBLIC: For QR code access, bypasses restaurantId check
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, restaurantId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Customers (MULTI-TENANT: requires restaurantId for all operations)
  getCustomers(restaurantId: string): Promise<Customer[]>;
  getCustomer(id: string, restaurantId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, restaurantId: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string, restaurantId: string): Promise<boolean>;

  // Shop Salaries (MULTI-TENANT: requires restaurantId)
  getSalaries(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]>;
  getSalary(id: string): Promise<Salary | undefined>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(id: string, salary: Partial<InsertSalary>): Promise<Salary | undefined>;
  deleteSalary(id: string): Promise<boolean>;

  // Shop Bills (MULTI-TENANT: requires restaurantId)
  getShopBills(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date, includeArchived?: boolean): Promise<ShopBill[]>;
  getShopBill(id: string): Promise<ShopBill | undefined>;
  createShopBill(bill: InsertShopBill): Promise<ShopBill>;
  updateShopBill(id: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined>;
  deleteShopBill(id: string): Promise<boolean>;
  archiveShopBill(id: string, archived: boolean): Promise<ShopBill | undefined>;

  // Delivery Apps (MULTI-TENANT: requires restaurantId)
  getDeliveryApps(restaurantId: string): Promise<DeliveryApp[]>;
  getDeliveryApp(id: string): Promise<DeliveryApp | undefined>;
  createDeliveryApp(app: InsertDeliveryApp): Promise<DeliveryApp>;
  updateDeliveryApp(id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined>;
  deleteDeliveryApp(id: string): Promise<boolean>;
  updateDeliveryAppsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;
  getDeliveryAppProfitability(restaurantId: string): Promise<any>;

  // Investors (MULTI-TENANT: requires restaurantId)
  getInvestors(restaurantId: string): Promise<Investor[]>;
  getInvestor(id: string): Promise<Investor | undefined>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: string, investor: Partial<InsertInvestor>): Promise<Investor | undefined>;
  deleteInvestor(id: string): Promise<boolean>;

  // Subscription Invoices
  getSubscriptionInvoices(userId?: string): Promise<SubscriptionInvoice[]>;
  getSubscriptionInvoice(id: string): Promise<SubscriptionInvoice | undefined>;
  getSubscriptionInvoiceBySerialNumber(serialNumber: string, restaurantId: string): Promise<SubscriptionInvoice | undefined>;
  createSubscriptionInvoice(invoice: InsertSubscriptionInvoice): Promise<SubscriptionInvoice>;
  getNextSubscriptionInvoiceSerialNumber(): Promise<string>;

  // Monthly VAT Reports
  getMonthlyVatReports(userId?: string): Promise<MonthlyVatReport[]>;
  getVatReportByMonth(userId: string, month: number, year: number): Promise<MonthlyVatReport | undefined>;
  createVatReport(report: InsertMonthlyVatReport): Promise<MonthlyVatReport>;
  getNextVatReportSerialNumber(year: number, month: number): Promise<string>;

  // Support Tickets (MULTI-TENANT: SQL-level restaurantId filtering)
  getSupportTickets(restaurantId: string, userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string, restaurantId: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, restaurantId: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  getNextTicketNumber(): Promise<string>;

  // Ticket Messages (MULTI-TENANT: SQL-level restaurantId filtering)
  getTicketMessages(ticketId: string, restaurantId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  markMessagesAsRead(ticketId: string, restaurantId: string, userId: string): Promise<void>;
  getUnreadMessageCount(restaurantId: string, userId: string): Promise<number>;

  // Employee Activity Log (MULTI-TENANT: SQL-level restaurantId filtering)
  getEmployeeActivities(restaurantId: string, employeeId?: string, category?: string, startDate?: Date, endDate?: Date): Promise<EmployeeActivityLog[]>;
  createEmployeeActivity(activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog>;
  getEmployeeActivityStats(employeeId: string, restaurantId: string): Promise<any>;

  // Moyasar Payments (MULTI-TENANT: SQL-level restaurantId filtering)
  getMoyasarPayments(restaurantId: string, branchId?: string): Promise<MoyasarPayment[]>;
  getMoyasarPayment(id: string): Promise<MoyasarPayment | undefined>;
  getMoyasarPaymentByMoyasarId(moyasarId: string, restaurantId: string): Promise<MoyasarPayment | undefined>;
  getMoyasarPaymentByMoyasarIdAnyTenant(moyasarId: string): Promise<MoyasarPayment | undefined>; // Webhook use only
  createMoyasarPayment(payment: InsertMoyasarPayment): Promise<MoyasarPayment>;
  updateMoyasarPayment(id: string, restaurantId: string, payment: Partial<InsertMoyasarPayment>): Promise<MoyasarPayment | undefined>;

  // Analytics (MULTI-TENANT: requires restaurantId)
  getSalesComparison(restaurantId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Restaurants (Multi-tenant isolation)
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [created] = await db.insert(restaurants).values(restaurant).returning();
    return created;
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(restaurant).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRestaurant(id);
    }
    const [updated] = await db.update(restaurants).set(updateData).where(eq(restaurants.id, id)).returning();
    return updated;
  }

  // Branches (MULTI-TENANT: SQL-level restaurantId filtering)
  async getBranches(restaurantId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.restaurantId, restaurantId));
  }

  async getBranch(id: string, restaurantId: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches)
      .where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId)));
    return branch;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }

  async updateBranch(id: string, restaurantId: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = branch;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getBranch(id, restaurantId);
    }
    const [updated] = await db.update(branches).set(updateData)
      .where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteBranch(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(branches)
      .where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Inventory (MULTI-TENANT: filters by restaurantId)
  async getInventoryItems(restaurantId: string, branchId?: string): Promise<InventoryItem[]> {
    if (branchId) {
      return await db.select().from(inventoryItems).where(
        and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.branchId, branchId))
      );
    }
    return await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, restaurantId));
  }

  async getInventoryItem(id: string, restaurantId: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async updateInventoryItem(id: string, restaurantId: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = item;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInventoryItem(id, restaurantId);
    }
    const [updated] = await db.update(inventoryItems).set(updateData)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async updateInventoryItemsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(inventoryItems).set({ sortOrder: update.sortOrder })
        .where(and(eq(inventoryItems.id, update.id), eq(inventoryItems.restaurantId, restaurantId)));
    }
  }

  async deleteInventoryItem(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Menu (MULTI-TENANT: SQL-level restaurantId filtering)
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async getMenuItem(id: string, restaurantId: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: string, restaurantId: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = item;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getMenuItem(id, restaurantId);
    }
    const [updated] = await db.update(menuItems).set(updateData)
      .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteMenuItem(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
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
      const recipe = await this.getRecipe(menuItem.recipeId, restaurantId);
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

  // Add-ons (MULTI-TENANT: SQL-level restaurantId filtering)
  async getAddons(restaurantId: string, menuItemId?: string): Promise<Addon[]> {
    if (menuItemId) {
      // Return add-ons where menuItemIds is null (available for all items)
      // OR menuItemIds array contains the given menuItemId
      // AND belongs to the restaurant
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

  async getAddon(id: string, restaurantId: string): Promise<Addon | undefined> {
    const [addon] = await db.select().from(addons)
      .where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId)));
    return addon;
  }

  async createAddon(addon: InsertAddon): Promise<Addon> {
    const [created] = await db.insert(addons).values(addon).returning();
    return created;
  }

  async updateAddon(id: string, restaurantId: string, addon: Partial<InsertAddon>): Promise<Addon | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = addon;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getAddon(id, restaurantId);
    }
    const [updated] = await db.update(addons).set(updateData)
      .where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteAddon(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(addons)
      .where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateAddonsSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(addons).set({ sortOrder: update.sortOrder })
        .where(and(eq(addons.id, update.id), eq(addons.restaurantId, restaurantId)));
    }
  }

  // Recipes (MULTI-TENANT: SQL-level restaurantId filtering)
  async getRecipes(restaurantId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
  }

  async getRecipe(id: string, restaurantId: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId)));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe as any).returning();
    return created;
  }

  async updateRecipe(id: string, restaurantId: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = recipe;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRecipe(id, restaurantId);
    }
    const [updated] = await db.update(recipes).set(updateData as any)
      .where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async updateRecipesSortOrder(restaurantId: string, updates: { id: string; sortOrder: number }[]): Promise<void> {
    for (const update of updates) {
      await db.update(recipes).set({ sortOrder: update.sortOrder })
        .where(and(eq(recipes.id, update.id), eq(recipes.restaurantId, restaurantId)));
    }
  }

  async deleteRecipe(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Orders (MULTI-TENANT: enforce restaurantId at SQL layer)
  async getOrders(filter: {
    restaurantId: string;
    branchId?: string;
    status?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Order[]> {
    const conditions = [eq(orders.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(orders.branchId, filter.branchId));
    if (filter.status) conditions.push(eq(orders.status, filter.status));
    if (filter.dateRange?.start) conditions.push(gte(orders.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(orders.createdAt, filter.dateRange.end));
    
    return await db.select().from(orders).where(and(...conditions));
  }

  async getOrder(id: string, restaurantId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order as any).returning();
    return created;
  }

  async updateOrder(id: string, restaurantId: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = order;
    // Filter out undefined values to avoid "No values to set" error
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      // If no valid fields to update, just return the existing record
      return this.getOrder(id, restaurantId);
    }
    
    const [updated] = await db.update(orders)
      .set(updateData as any)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteOrder(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transactions (MULTI-TENANT: enforce restaurantId at SQL layer)
  async getTransactions(filter: {
    restaurantId: string;
    branchId?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Transaction[]> {
    const conditions = [eq(transactions.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(transactions.branchId, filter.branchId));
    if (filter.dateRange?.start) conditions.push(gte(transactions.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(transactions.createdAt, filter.dateRange.end));
    
    return await db.select().from(transactions).where(and(...conditions));
  }

  async getTransaction(id: string, restaurantId: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.restaurantId, restaurantId)));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  // Settings (MULTI-TENANT: SQL-level restaurantId filtering)
  async getSettings(restaurantId: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.restaurantId, restaurantId));
    return setting;
  }

  async updateSettings(restaurantId: string, settingsData: Partial<InsertSettings>): Promise<Settings> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant modification
    const { restaurantId: _, ...safeData } = settingsData;
    
    // Get existing settings for this restaurant
    const existing = await this.getSettings(restaurantId);
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set(safeData)
        .where(and(eq(settings.id, existing.id), eq(settings.restaurantId, restaurantId)))
        .returning();
      return updated;
    } else {
      // Create new settings for this restaurant
      const [created] = await db.insert(settings)
        .values({ ...safeData, restaurantId } as InsertSettings)
        .returning();
      return created;
    }
  }

  // Procurement
  async getProcurements(filter: {
    restaurantId: string;
    type?: string;
    status?: string;
    branchId?: string;
  }): Promise<Procurement[]> {
    const conditions = [eq(procurement.restaurantId, filter.restaurantId)];
    if (filter.type) conditions.push(eq(procurement.type, filter.type));
    if (filter.status) conditions.push(eq(procurement.status, filter.status));
    if (filter.branchId) conditions.push(eq(procurement.branchId, filter.branchId));
    
    return await db.select().from(procurement).where(and(...conditions));
  }

  async getProcurement(id: string, restaurantId: string): Promise<Procurement | undefined> {
    const [item] = await db.select().from(procurement)
      .where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)));
    return item;
  }

  async createProcurement(procurementData: InsertProcurement): Promise<Procurement> {
    const [created] = await db.insert(procurement).values(procurementData).returning();
    return created;
  }

  async updateProcurement(id: string, restaurantId: string, procurementData: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = procurementData;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getProcurement(id, restaurantId);
    }
    const [updated] = await db.update(procurement)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteProcurement(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(procurement)
      .where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Users (MULTI-TENANT: SQL-level restaurantId filtering)
  async getAllUsers(): Promise<User[]> {
    // SPECIAL: For first-run check only - returns ALL users across ALL restaurants
    return await db.select().from(users);
  }

  async getUsers(restaurantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  }

  async getUser(id: string, restaurantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));
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

  async updateUser(id: string, restaurantId: string, user: Partial<InsertUser>): Promise<User | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = user;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUser(id, restaurantId);
    }
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 10);
    }
    const [updated] = await db.update(users).set(updateData).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteUser(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(users).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));
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

  async getValidBootstrapToken(plainToken: string): Promise<{ id: string; tokenHash: string } | undefined> {
    const tokens = await db.select().from(bootstrapResetTokens).where(
      and(
        eq(bootstrapResetTokens.consumed, false),
        gte(bootstrapResetTokens.expiresAt, new Date()) // Check token not expired
      )
    );
    
    for (const token of tokens) {
      const isValid = await bcrypt.compare(plainToken, token.tokenHash);
      if (isValid) {
        return { id: token.id, tokenHash: token.tokenHash };
      }
    }
    
    return undefined;
  }

  async consumeBootstrapToken(tokenId: string, username: string, ipAddress: string): Promise<void> {
    await db.update(bootstrapResetTokens)
      .set({ 
        consumed: true,
        consumedAt: new Date(),
        consumedBy: username,
        ipAddress: ipAddress
      })
      .where(eq(bootstrapResetTokens.id, tokenId));
  }

  async getUserProfile(userId: string, restaurantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.restaurantId, restaurantId)));
    return user;
  }

  async updateUserProfile(userId: string, restaurantId: string, profile: { email?: string; phone?: string }): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(profile)
      .where(and(eq(users.id, userId), eq(users.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async cancelSubscription(userId: string, restaurantId: string): Promise<User | undefined> {
    // Get user to find their restaurantId
    const user = await this.getUser(userId, restaurantId);
    if (!user) return undefined;

    // Update restaurant subscription status
    await db.update(restaurants)
      .set({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date()
      })
      .where(eq(restaurants.id, user.restaurantId));

    // Return updated user
    return user;
  }

  // Invoices
  async getInvoices(filter: {
    restaurantId: string;
    branchId?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Invoice[]> {
    const conditions = [eq(invoices.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(invoices.branchId, filter.branchId));
    if (filter.dateRange?.start) conditions.push(gte(invoices.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(invoices.createdAt, filter.dateRange.end));
    
    return await db.select().from(invoices).where(and(...conditions));
  }

  async getInvoice(id: string, restaurantId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId)));
    return invoice;
  }

  async getInvoicePublic(id: string): Promise<Invoice | undefined> {
    // PUBLIC: For QR code access only, bypasses restaurantId check
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice as any).returning();
    return created;
  }

  async updateInvoice(id: string, restaurantId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = invoice;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvoice(id, restaurantId);
    }
    const [updated] = await db.update(invoices)
      .set(updateData as any)
      .where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  // Customers (MULTI-TENANT: filters by restaurantId)
  async getCustomers(restaurantId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.restaurantId, restaurantId));
  }

  async getCustomer(id: string, restaurantId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId)));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, restaurantId: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = customer;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getCustomer(id, restaurantId);
    }
    const [updated] = await db.update(customers)
      .set(updateData)
      .where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(customers)
      .where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shop Salaries (MULTI-TENANT: filters by restaurantId)
  async getSalaries(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<Salary[]> {
    const conditions = [eq(salaries.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(salaries.branchId, branchId));
    if (startDate) conditions.push(gte(salaries.paymentDate, startDate));
    if (endDate) conditions.push(lte(salaries.paymentDate, endDate));
    
    return await db.select().from(salaries).where(and(...conditions));
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

  // Shop Bills (MULTI-TENANT: filters by restaurantId)
  async getShopBills(restaurantId: string, branchId?: string, startDate?: Date, endDate?: Date, includeArchived: boolean = false): Promise<ShopBill[]> {
    const conditions = [eq(shopBills.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(shopBills.branchId, branchId));
    if (startDate) conditions.push(gte(shopBills.paymentDate, startDate));
    if (endDate) conditions.push(lte(shopBills.paymentDate, endDate));
    if (!includeArchived) conditions.push(eq(shopBills.archived, false));
    
    return await db.select().from(shopBills).where(and(...conditions));
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

  // Delivery Apps (MULTI-TENANT: filters by restaurantId)
  async getDeliveryApps(restaurantId: string): Promise<DeliveryApp[]> {
    return await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    ).orderBy(deliveryApps.sortOrder);
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

  async getDeliveryAppProfitability(restaurantId: string): Promise<any> {
    // Get all delivery apps
    const apps = await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    );
    
    // Get all orders with delivery apps
    const allOrders = await db.select().from(orders).where(
      and(eq(orders.restaurantId, restaurantId), sql`${orders.deliveryAppId} IS NOT NULL`)
    );
    
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
    const deliveryAppsData = await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    );
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

  // Investors (MULTI-TENANT: filters by restaurantId)
  async getInvestors(restaurantId: string): Promise<Investor[]> {
    return await db.select().from(investors).where(
      and(eq(investors.restaurantId, restaurantId), eq(investors.active, true))
    ).orderBy(investors.createdAt);
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

  async getSubscriptionInvoiceBySerialNumber(serialNumber: string, restaurantId: string): Promise<SubscriptionInvoice | undefined> {
    // SECURITY: Join with users table to verify restaurantId ownership
    const [invoice] = await db
      .select({
        id: subscriptionInvoices.id,
        userId: subscriptionInvoices.userId,
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
        qrCode: subscriptionInvoices.qrCode,
      })
      .from(subscriptionInvoices)
      .innerJoin(users, eq(subscriptionInvoices.userId, users.id))
      .where(and(
        eq(subscriptionInvoices.serialNumber, serialNumber),
        eq(users.restaurantId, restaurantId)
      ));
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

  async getSupportTicket(id: string, restaurantId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.restaurantId, restaurantId)));
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

  async updateSupportTicket(id: string, restaurantId: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    // SECURITY: Defense-in-depth - strip restaurantId from update data to prevent cross-tenant reassignment
    const { restaurantId: _, userId: __, ...safeTicket } = ticket;
    const updateData: any = { ...safeTicket, updatedAt: new Date() };
    
    // Set resolved/closed timestamps
    if (ticket.status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (ticket.status === 'closed' && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }
    
    const [updated] = await db.update(supportTickets)
      .set(updateData)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.restaurantId, restaurantId)))
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
  async getTicketMessages(ticketId: string, restaurantId: string): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.restaurantId, restaurantId)))
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

  async markMessagesAsRead(ticketId: string, restaurantId: string, userId: string): Promise<void> {
    // SECURITY: Mark messages as read only if ticket belongs to this restaurant
    // Mark all messages in this ticket as read where the sender is NOT the current user
    await db.update(ticketMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          eq(ticketMessages.restaurantId, restaurantId),
          sql`${ticketMessages.senderId} != ${userId}`
        )
      );
  }

  async getUnreadMessageCount(restaurantId: string, userId: string): Promise<number> {
    // Get tickets for this user in this restaurant
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

  async createEmployeeActivity(activity: InsertEmployeeActivityLog): Promise<EmployeeActivityLog> {
    const [created] = await db.insert(employeeActivityLog).values(activity as any).returning();
    return created;
  }

  async getEmployeeActivityStats(employeeId: string, restaurantId: string): Promise<any> {
    // Get total activity count
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(and(eq(employeeActivityLog.employeeId, employeeId), eq(employeeActivityLog.restaurantId, restaurantId)));
    
    // Get activities by category
    const categoryCounts = await db.select({
      category: employeeActivityLog.actionCategory,
      count: sql<number>`count(*)`,
    })
      .from(employeeActivityLog)
      .where(and(eq(employeeActivityLog.employeeId, employeeId), eq(employeeActivityLog.restaurantId, restaurantId)))
      .groupBy(employeeActivityLog.actionCategory);
    
    // Get recent activities (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [recentResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employeeActivityLog)
      .where(
        and(
          eq(employeeActivityLog.employeeId, employeeId),
          eq(employeeActivityLog.restaurantId, restaurantId),
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
  async getMoyasarPayments(restaurantId: string, branchId?: string): Promise<MoyasarPayment[]> {
    const conditions = [eq(moyasarPayments.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(moyasarPayments.branchId, branchId));
    }
    return await db.select().from(moyasarPayments)
      .where(and(...conditions))
      .orderBy(sql`${moyasarPayments.createdAt} DESC`);
  }

  async getMoyasarPayment(id: string): Promise<MoyasarPayment | undefined> {
    const [payment] = await db.select().from(moyasarPayments).where(eq(moyasarPayments.id, id));
    return payment;
  }

  async getMoyasarPaymentByMoyasarId(moyasarId: string, restaurantId: string): Promise<MoyasarPayment | undefined> {
    const [payment] = await db.select().from(moyasarPayments)
      .where(and(eq(moyasarPayments.moyasarId, moyasarId), eq(moyasarPayments.restaurantId, restaurantId)));
    return payment;
  }

  async createMoyasarPayment(payment: InsertMoyasarPayment): Promise<MoyasarPayment> {
    const [created] = await db.insert(moyasarPayments).values(payment as any).returning();
    return created;
  }

  async getMoyasarPaymentByMoyasarIdAnyTenant(moyasarId: string): Promise<MoyasarPayment | undefined> {
    // ⚠️  WARNING: WEBHOOK USE ONLY - This method bypasses tenant scoping!
    // This should ONLY be called from authenticated webhook handlers that verify request signatures
    // DO NOT use this method in regular API routes - use getMoyasarPaymentByMoyasarId instead
    const [payment] = await db.select().from(moyasarPayments)
      .where(eq(moyasarPayments.moyasarId, moyasarId));
    return payment;
  }

  async updateMoyasarPayment(id: string, restaurantId: string, payment: Partial<InsertMoyasarPayment>): Promise<MoyasarPayment | undefined> {
    // SECURITY: Defense-in-depth - strip restaurantId from update data to prevent cross-tenant reassignment
    const { restaurantId: _, ...safePayment } = payment;
    const updateData: any = Object.fromEntries(
      Object.entries(safePayment).filter(([_, value]) => value !== undefined)
    );
    updateData.updatedAt = new Date();
    
    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return this.getMoyasarPayment(id);
    }
    
    const [updated] = await db.update(moyasarPayments)
      .set(updateData)
      .where(and(eq(moyasarPayments.id, id), eq(moyasarPayments.restaurantId, restaurantId)))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
