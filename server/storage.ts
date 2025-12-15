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
  type DeliveryProfitability,
  type InsertDeliveryProfitability,
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
  type Conversation,
  type InsertConversation,
  type ChatMessage,
  type InsertChatMessage,
  type ConversationMember,
  type InsertConversationMember,
  type MessageRead,
  type InsertMessageRead,
  type License,
  type InsertLicense,
  type BusinessInfo,
  type Violation,
  type InsertViolation,
  type ViolationStats,
  type ViolationReference,
  type InsertViolationReference,
  type Printer,
  type InsertPrinter,
  type ZatcaSettings,
  type InsertZatcaSettings,
  type InvoiceZatcaStatus,
  type InsertInvoiceZatcaStatus,
  type ShopFile,
  type InsertShopFile,
  type CompanyFile,
  type InsertCompanyFile,
  type PendingSignup,
  type InsertPendingSignup,
  restaurants,
  pendingSignups,
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
  deliveryProfitability,
  investors,
  subscriptionInvoices,
  monthlyVatReports,
  supportTickets,
  ticketMessages,
  employeeActivityLog,
  conversations,
  chatMessages,
  conversationMembers,
  messageReads,
  moyasarPayments,
  type MoyasarPayment,
  type InsertMoyasarPayment,
  bootstrapResetTokens,
  type BootstrapResetToken,
  type InsertBootstrapResetToken,
  type BepMetrics,
  licenses,
  businessInfo,
  violations,
  violationReferences,
  printers,
  zatcaSettings,
  invoiceZatcaStatus,
  shopFiles,
  companyFiles,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, sql, or, isNull, isNotNull, desc } from "drizzle-orm";
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
  updateRecipeCostsForInventoryItem(inventoryItemId: string, restaurantId: string, newPrice: number): Promise<Recipe[]>;
  updateRecipeUnitsForInventoryItem(inventoryItemId: string, restaurantId: string, newUnit: string): Promise<Recipe[]>;

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
  updateSettingsLogoPath(restaurantId: string, logoPath: string | null): Promise<void>;
  getNextB2BInvoiceNumber(restaurantId: string): Promise<string>; // Get and increment B2B invoice sequence

  // Procurement (MULTI-TENANT: requires restaurantId for all operations)
  getProcurements(filter: {
    restaurantId: string;
    type?: string;
    status?: string;
    branchId?: string;
  }): Promise<Procurement[]>;
  getProcurement(id: string, restaurantId: string): Promise<Procurement | undefined>;
  createProcurement(procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(id: string, restaurantId: string, procurement: Partial<InsertProcurement> & { billId?: string | null }): Promise<Procurement | undefined>;
  deleteProcurement(id: string, restaurantId: string): Promise<boolean>;

  // Users (MULTI-TENANT: requires restaurantId for all operations)
  getAllUsers(): Promise<User[]>; // SPECIAL: For first-run check only, returns ALL users across ALL restaurants
  getUsers(restaurantId: string): Promise<User[]>;
  getUser(id: string, restaurantId: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>; // SPECIAL: Used for IT accounts, no restaurantId filter
  getUserByUsername(username: string): Promise<User | undefined>; // SPECIAL: Used for login, no restaurantId filter
  getUserByEmail(email: string): Promise<User | undefined>; // SPECIAL: Used for password reset, no restaurantId filter
  createUser(user: InsertUser): Promise<User>;
  createUserWithHashedPassword(user: {
    restaurantId: string;
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    role: string;
    isOwner?: boolean;
    permissions?: any;
  }): Promise<User>;
  updateUser(id: string, restaurantId: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserById(id: string, user: Partial<InsertUser>): Promise<User | undefined>; // SPECIAL: Used for IT accounts, no restaurantId filter
  deleteUser(id: string, restaurantId: string): Promise<boolean>;
  setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>; // SPECIAL: Password reset flow, no restaurantId filter
  updatePassword(userId: string, newPassword: string): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  getUserProfile(userId: string, restaurantId: string): Promise<User | undefined>;
  updateUserProfile(userId: string, restaurantId: string, profile: { email?: string; phone?: string }): Promise<User | undefined>;
  cancelSubscription(userId: string, restaurantId: string, reason?: "mistake" | "client_request"): Promise<User | undefined>;
  
  // Activity Tracking (for IT Dashboard monitoring)
  updateUserActivity(userId: string): Promise<void>; // Update lastActivityAt timestamp
  updateUserLogin(userId: string): Promise<void>; // Update lastLoginAt timestamp
  getClientAccountsActivity(): Promise<Array<{ 
    userId: string; 
    username: string; 
    fullName: string; 
    restaurantId: string; 
    restaurantName: string;
    lastActivityAt: Date | null; 
    lastLoginAt: Date | null;
    isOnline: boolean;
  }>>; // SPECIAL: IT-only, returns activity data across all restaurants
  
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
  findCustomerByPhone(restaurantId: string, phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, restaurantId: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string, restaurantId: string): Promise<boolean>;
  upsertCustomer(restaurantId: string, data: { name: string; phone: string }): Promise<Customer>;

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
  updateShopBill(id: string, restaurantId: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined>;
  deleteShopBill(id: string, restaurantId: string): Promise<boolean>;
  archiveShopBill(id: string, archived: boolean): Promise<ShopBill | undefined>;
  generateSalaryBills(restaurantId: string, paymentMonth: string): Promise<{ created: number; skipped: number; bills: ShopBill[] }>;

  // Violations (MULTI-TENANT: requires restaurantId)
  getViolations(restaurantId: string, branchId?: string, authority?: string, status?: string): Promise<Violation[]>;
  getViolation(id: string, restaurantId: string): Promise<Violation | undefined>;
  createViolation(violation: InsertViolation): Promise<Violation>;
  updateViolation(id: string, restaurantId: string, violation: Partial<InsertViolation>): Promise<Violation | undefined>;
  deleteViolation(id: string, restaurantId: string): Promise<boolean>;
  getViolationStats(restaurantId: string): Promise<ViolationStats>;

  // Violation References (MULTI-TENANT: requires restaurantId)
  getViolationReferences(restaurantId: string, authority?: string): Promise<ViolationReference[]>;
  getViolationReference(id: string, restaurantId: string): Promise<ViolationReference | undefined>;
  createViolationReference(reference: InsertViolationReference): Promise<ViolationReference>;
  deleteViolationReference(id: string, restaurantId: string): Promise<boolean>;

  // Delivery Apps (MULTI-TENANT: requires restaurantId)
  getDeliveryApps(restaurantId: string): Promise<DeliveryApp[]>;
  getDeliveryApp(id: string): Promise<DeliveryApp | undefined>;
  createDeliveryApp(app: InsertDeliveryApp): Promise<DeliveryApp>;
  updateDeliveryApp(id: string, app: Partial<InsertDeliveryApp>): Promise<DeliveryApp | undefined>;
  deleteDeliveryApp(id: string): Promise<boolean>;
  updateDeliveryAppsSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void>;
  getDeliveryAppProfitability(restaurantId: string): Promise<any>;

  // Delivery Profitability (MULTI-TENANT: manual entries per delivery app)
  getDeliveryProfitability(restaurantId: string, year?: number): Promise<DeliveryProfitability[]>;
  getDeliveryProfitabilityEntry(id: string): Promise<DeliveryProfitability | undefined>;
  createDeliveryProfitability(entry: InsertDeliveryProfitability): Promise<DeliveryProfitability>;
  updateDeliveryProfitability(id: string, entry: Partial<InsertDeliveryProfitability>): Promise<DeliveryProfitability | undefined>;
  deleteDeliveryProfitability(id: string): Promise<boolean>;
  upsertDeliveryProfitability(entry: InsertDeliveryProfitability): Promise<DeliveryProfitability>;

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

  // IT Management (CROSS-TENANT for IT accounts: restaurantId optional)
  getITAnalytics(restaurantId?: string): Promise<any>;
  getITStaff(restaurantId?: string): Promise<User[]>;
  getWorkloadDistribution(restaurantId?: string): Promise<any[]>;
  getCategoryBreakdown(restaurantId?: string): Promise<any[]>;
  getTicketTrends(restaurantId?: string): Promise<any[]>;
  assignTicket(ticketId: string, restaurantId: string | null, assignedTo: string | null, assignedBy: string): Promise<SupportTicket | undefined>;
  getAllActiveTicketsForIT(): Promise<SupportTicket[]>;
  getAllSupportTicketsForIT(userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicketForIT(id: string): Promise<SupportTicket | undefined>;
  getTicketMessagesForIT(ticketId: string): Promise<TicketMessage[]>;
  updateSupportTicketForIT(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;

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

  // Pending Signups (for Geidea payment flow)
  createPendingSignup(signup: InsertPendingSignup): Promise<PendingSignup>;
  getPendingSignupBySessionId(geideaSessionId: string): Promise<PendingSignup | undefined>;
  updatePendingSignupStatus(id: string, status: string): Promise<void>;
  deletePendingSignup(id: string): Promise<void>;

  // Analytics (MULTI-TENANT: requires restaurantId)
  getSalesComparison(restaurantId: string): Promise<any>;
  getBepMetrics(restaurantId: string, year: number): Promise<BepMetrics>;

  // Team Chat - Conversations (MULTI-TENANT: SQL-level restaurantId filtering)
  getConversations(restaurantId: string, userId: string, branchId?: string): Promise<any[]>; // Returns conversations with unread count
  getConversation(id: string, restaurantId: string): Promise<any | undefined>;
  createConversation(conversation: any): Promise<any>; // Uses InsertConversation
  getOrCreateDirectConversation(restaurantId: string, userId1: string, userId2: string): Promise<any>;
  updateConversationLastMessage(conversationId: string, preview: string): Promise<void>;

  // Team Chat - Messages (MULTI-TENANT: SQL-level restaurantId filtering)
  getChatMessages(conversationId: string, restaurantId: string, limit?: number): Promise<any[]>;
  createChatMessage(message: any): Promise<any>; // Uses InsertChatMessage
  
  // Team Chat - Members (MULTI-TENANT: SQL-level restaurantId filtering)
  getConversationMembers(conversationId: string, restaurantId: string): Promise<any[]>;
  addConversationMember(member: any): Promise<any>; // Uses InsertConversationMember
  removeConversationMember(conversationId: string, userId: string, restaurantId: string): Promise<boolean>;
  isUserInConversation(conversationId: string, userId: string, restaurantId: string): Promise<boolean>;

  // Team Chat - Read Tracking (MULTI-TENANT: SQL-level restaurantId filtering)
  updateMessageRead(read: any): Promise<void>; // Uses InsertMessageRead (upsert)
  getUnreadChatCount(restaurantId: string, userId: string): Promise<number>;
  
  // Team Chat - Default Channels
  createDefaultChannels(restaurantId: string, createdBy: string): Promise<void>;
  
  // Team Chat - Notification Settings (MULTI-TENANT: SQL-level restaurantId filtering)
  getChatNotificationDefaults(restaurantId: string): Promise<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
  } | undefined>; // Get restaurant default chat notification settings
  updateChatNotificationDefaults(restaurantId: string, defaults: {
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
    toneId?: string;
  }): Promise<void>; // Admin only - update restaurant chat notification defaults

  // Licenses (MULTI-TENANT: requires restaurantId for all operations)
  getLicenses(restaurantId: string): Promise<License[]>;
  getLicense(id: string, restaurantId: string): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, restaurantId: string, license: Partial<InsertLicense>): Promise<License | undefined>;
  deleteLicense(id: string, restaurantId: string): Promise<boolean>;
  getExpiringLicenses(restaurantId: string, daysAhead: number): Promise<License[]>;

  // Business Info (IT Account - singleton for BSS provider company details)
  getBusinessInfo(): Promise<BusinessInfo | null>;

  // Printers (MULTI-TENANT: requires restaurantId for all operations)
  getPrinters(restaurantId: string, branchId?: string): Promise<Printer[]>;
  getPrinter(id: string, restaurantId: string): Promise<Printer | undefined>;
  createPrinter(printer: InsertPrinter): Promise<Printer>;
  updatePrinter(id: string, restaurantId: string, printer: Partial<InsertPrinter>): Promise<Printer | undefined>;
  deletePrinter(id: string, restaurantId: string): Promise<boolean>;
  setDefaultPrinter(id: string, restaurantId: string, branchId?: string): Promise<Printer | undefined>;

  // ZATCA Settings (MULTI-TENANT: requires restaurantId for all operations)
  getZatcaSettings(restaurantId: string): Promise<ZatcaSettings | undefined>;
  createZatcaSettings(settings: InsertZatcaSettings): Promise<ZatcaSettings>;
  updateZatcaSettings(restaurantId: string, settings: Partial<InsertZatcaSettings>): Promise<ZatcaSettings | undefined>;
  incrementInvoiceCounter(restaurantId: string, lastHash: string): Promise<{ counter: number; previousHash: string | null }>;

  // ZATCA Invoice Status (MULTI-TENANT: requires restaurantId for all operations)
  getInvoiceZatcaStatuses(restaurantId: string, status?: string): Promise<InvoiceZatcaStatus[]>;
  getInvoiceZatcaStatus(invoiceId: string, restaurantId: string): Promise<InvoiceZatcaStatus | undefined>;
  createInvoiceZatcaStatus(status: InsertInvoiceZatcaStatus): Promise<InvoiceZatcaStatus>;
  updateInvoiceZatcaStatus(invoiceId: string, restaurantId: string, status: Partial<InsertInvoiceZatcaStatus>): Promise<InvoiceZatcaStatus | undefined>;

  // Shop Files (MULTI-TENANT: requires restaurantId for all operations)
  getShopFiles(restaurantId: string): Promise<ShopFile[]>;
  getShopFile(id: string, restaurantId: string): Promise<ShopFile | undefined>;
  getShopFileByType(restaurantId: string, fileType: string): Promise<ShopFile | undefined>;
  createShopFile(file: InsertShopFile): Promise<ShopFile>;
  deleteShopFile(id: string, restaurantId: string): Promise<boolean>;

  // Company Files (IT Account only - global company documents)
  getCompanyFiles(): Promise<CompanyFile[]>;
  getCompanyFile(id: string): Promise<CompanyFile | undefined>;
  getCompanyFilesByType(fileType: string): Promise<CompanyFile[]>;
  createCompanyFile(file: InsertCompanyFile): Promise<CompanyFile>;
  deleteCompanyFile(id: string): Promise<boolean>;
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
    try {
      if (branchId) {
        return await db.select().from(inventoryItems).where(
          and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.branchId, branchId))
        );
      }
      return await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, restaurantId));
    } catch (error: any) {
      // Handle case where unit_price column doesn't exist yet (pre-migration)
      if (error.message?.includes('unit_price')) {
        console.warn('[Inventory] unit_price column not found, using fallback query with calculated unitPrice');
        const query = branchId 
          ? sql`SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit, reference_quantity as "referenceQuantity", price, 
                CASE WHEN CAST(quantity AS NUMERIC) > 0 THEN CAST(CAST(price AS NUMERIC) / CAST(quantity AS NUMERIC) AS DECIMAL(10,2))::text ELSE '0' END as "unitPrice", 
                supplier, status, branch_id as "branchId", sort_order as "sortOrder", expiration_days as "expirationDays", purchase_date as "purchaseDate" 
                FROM inventory_items WHERE restaurant_id = ${restaurantId} AND branch_id = ${branchId}`
          : sql`SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit, reference_quantity as "referenceQuantity", price, 
                CASE WHEN CAST(quantity AS NUMERIC) > 0 THEN CAST(CAST(price AS NUMERIC) / CAST(quantity AS NUMERIC) AS DECIMAL(10,2))::text ELSE '0' END as "unitPrice", 
                supplier, status, branch_id as "branchId", sort_order as "sortOrder", expiration_days as "expirationDays", purchase_date as "purchaseDate" 
                FROM inventory_items WHERE restaurant_id = ${restaurantId}`;
        const result = await db.execute(query);
        return result.rows as InventoryItem[];
      }
      throw error;
    }
  }

  async getInventoryItem(id: string, restaurantId: string): Promise<InventoryItem | undefined> {
    try {
      const [item] = await db.select().from(inventoryItems)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
      return item;
    } catch (error: any) {
      if (error.message?.includes('unit_price')) {
        console.log('[Inventory] getInventoryItem: unit_price column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit, 
            reference_quantity as "referenceQuantity", price,
            CASE WHEN CAST(quantity AS NUMERIC) > 0 THEN CAST(CAST(price AS NUMERIC) / CAST(quantity AS NUMERIC) AS DECIMAL(10,2))::text ELSE '0' END as "unitPrice",
            supplier, status, branch_id as "branchId", sort_order as "sortOrder", 
            expiration_days as "expirationDays", purchase_date as "purchaseDate"
          FROM inventory_items WHERE id = ${id} AND restaurant_id = ${restaurantId}
        `);
        return (result as any).rows?.[0];
      }
      throw error;
    }
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async updateInventoryItem(id: string, restaurantId: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, unitPrice: _unitPrice, ...safeData } = item as any;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInventoryItem(id, restaurantId);
    }
    try {
      const [updated] = await db.update(inventoryItems).set(updateData)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)))
        .returning();
      return updated;
    } catch (error: any) {
      if (error.message?.includes('unit_price')) {
        console.log('[Inventory] updateInventoryItem: unit_price column not found, using fallback update');
        
        // Build SET clause dynamically - only include fields that exist in updateData
        const fieldMappings: Record<string, string> = {
          name: 'name',
          category: 'category',
          quantity: 'quantity',
          unit: 'unit',
          referenceQuantity: 'reference_quantity',
          price: 'price',
          supplier: 'supplier',
          status: 'status',
          branchId: 'branch_id',
          sortOrder: 'sort_order',
          expirationDays: 'expiration_days',
          purchaseDate: 'purchase_date',
        };
        
        const setClauses: string[] = [];
        const values: any[] = [];
        
        for (const [jsKey, dbColumn] of Object.entries(fieldMappings)) {
          if (updateData[jsKey] !== undefined) {
            setClauses.push(`${dbColumn} = $${values.length + 1}`);
            values.push(updateData[jsKey]);
          }
        }
        
        if (setClauses.length === 0) {
          return this.getInventoryItem(id, restaurantId);
        }
        
        const setClause = setClauses.join(', ');
        values.push(id, restaurantId);
        
        const queryText = `
          UPDATE inventory_items SET ${setClause}
          WHERE id = $${values.length - 1} AND restaurant_id = $${values.length}
          RETURNING id, restaurant_id as "restaurantId", name, category, quantity, unit, 
            reference_quantity as "referenceQuantity", price,
            CASE WHEN CAST(quantity AS NUMERIC) > 0 THEN CAST(CAST(price AS NUMERIC) / CAST(quantity AS NUMERIC) AS DECIMAL(10,2))::text ELSE '0' END as "unitPrice",
            supplier, status, branch_id as "branchId", sort_order as "sortOrder", 
            expiration_days as "expirationDays", purchase_date as "purchaseDate"
        `;
        
        const result = await pool.query(queryText, values);
        return result.rows?.[0];
      }
      throw error;
    }
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
      // If minServings is still Infinity (no ingredients in recipe), treat as unlimited
      stock[menuItem.id] = minServings === Infinity ? 999999 : minServings;
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

  async updateRecipeCostsForInventoryItem(inventoryItemId: string, restaurantId: string, newPrice: number): Promise<Recipe[]> {
    const allRecipes = await this.getRecipes(restaurantId);
    const updatedRecipes: Recipe[] = [];
    
    for (const recipe of allRecipes) {
      const ingredients = recipe.ingredients as Array<{ inventoryItemId: string; name: string; quantity: number; unit: string; unitPrice: number }>;
      
      let hasMatchingIngredient = false;
      const updatedIngredients = ingredients.map(ing => {
        if (ing.inventoryItemId === inventoryItemId) {
          hasMatchingIngredient = true;
          return { ...ing, unitPrice: newPrice };
        }
        return ing;
      });
      
      if (hasMatchingIngredient) {
        const newCost = updatedIngredients.reduce((sum, ing) => sum + (ing.quantity * ing.unitPrice), 0);
        
        const [updated] = await db.update(recipes)
          .set({ 
            ingredients: updatedIngredients,
            cost: newCost.toFixed(2)
          })
          .where(and(eq(recipes.id, recipe.id), eq(recipes.restaurantId, restaurantId)))
          .returning();
        
        if (updated) {
          updatedRecipes.push(updated);
        }
      }
    }
    
    return updatedRecipes;
  }

  async updateRecipeUnitsForInventoryItem(inventoryItemId: string, restaurantId: string, newUnit: string): Promise<Recipe[]> {
    const allRecipes = await this.getRecipes(restaurantId);
    const updatedRecipes: Recipe[] = [];
    
    for (const recipe of allRecipes) {
      const ingredients = recipe.ingredients as Array<{ inventoryItemId: string; name: string; quantity: number; unit: string; unitPrice: number }>;
      
      let hasMatchingIngredient = false;
      const updatedIngredients = ingredients.map(ing => {
        if (ing.inventoryItemId === inventoryItemId) {
          hasMatchingIngredient = true;
          return { ...ing, unit: newUnit };
        }
        return ing;
      });
      
      if (hasMatchingIngredient) {
        const [updated] = await db.update(recipes)
          .set({ ingredients: updatedIngredients })
          .where(and(eq(recipes.id, recipe.id), eq(recipes.restaurantId, restaurantId)))
          .returning();
        
        if (updated) {
          updatedRecipes.push(updated);
        }
      }
    }
    
    return updatedRecipes;
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
    try {
      const [setting] = await db.select().from(settings).where(eq(settings.restaurantId, restaurantId));
      return setting;
    } catch (error: any) {
      // Handle case where b2b_invoice_sequence column doesn't exist yet (pre-migration)
      if (error.message?.includes('b2b_invoice_sequence')) {
        console.warn('[Settings] b2b_invoice_sequence column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", restaurant_name as "restaurantName", 
                 vat_number as "vatNumber", address, email, phone, language, 
                 opening_time as "openingTime", closing_time as "closingTime", 
                 logo_path as "logoPath", notification_tone as "notificationTone",
                 chat_notification_defaults as "chatNotificationDefaults",
                 0 as "b2bInvoiceSequence"
          FROM settings WHERE restaurant_id = ${restaurantId}
        `);
        return result.rows[0] as Settings | undefined;
      }
      throw error;
    }
  }

  async updateSettings(restaurantId: string, settingsData: Partial<InsertSettings>): Promise<Settings> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant modification
    const { restaurantId: _, ...safeData } = settingsData;
    
    // Get existing settings for this restaurant
    const existing = await this.getSettings(restaurantId);
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set(safeData as any)
        .where(and(eq(settings.id, existing.id), eq(settings.restaurantId, restaurantId)))
        .returning();
      return updated;
    } else {
      // Create new settings for this restaurant
      const [created] = await db.insert(settings)
        .values([{ ...safeData, restaurantId } as any])
        .returning();
      return created;
    }
  }

  async updateSettingsLogoPath(restaurantId: string, logoPath: string | null): Promise<void> {
    // Get existing settings for this restaurant
    const existing = await this.getSettings(restaurantId);
    
    if (existing) {
      await db.update(settings)
        .set({ logoPath })
        .where(and(eq(settings.id, existing.id), eq(settings.restaurantId, restaurantId)));
    } else {
      // Create new settings with logo path
      await db.insert(settings)
        .values({ restaurantId, logoPath } as any);
    }
  }

  async getNextB2BInvoiceNumber(restaurantId: string): Promise<string> {
    try {
      // Atomic increment using UPDATE ... RETURNING to prevent race conditions
      const result = await db.transaction(async (tx) => {
        // Try to increment existing settings row
        const [updated] = await tx.update(settings)
          .set({ b2bInvoiceSequence: sql`COALESCE(${settings.b2bInvoiceSequence}, 0) + 1` })
          .where(eq(settings.restaurantId, restaurantId))
          .returning({ sequence: settings.b2bInvoiceSequence });
        
        if (updated) {
          return updated.sequence;
        }
        
        // If no settings row exists, this shouldn't happen in normal flow
        // but handle it defensively by returning 1
        return 1;
      });
      
      // Format: B2B-INV-XXXX (padded to 4 digits minimum)
      const paddedSeq = String(result).padStart(4, '0');
      return `B2B-INV-${paddedSeq}`;
    } catch (error: any) {
      // Handle case where b2b_invoice_sequence column doesn't exist yet (pre-migration)
      // Generate a unique invoice number based on timestamp
      if (error.message?.includes('b2b_invoice_sequence')) {
        console.warn('[B2B Invoice] b2b_invoice_sequence column not found, using timestamp-based fallback');
        const timestamp = Date.now().toString().slice(-6);
        return `B2B-INV-${timestamp}`;
      }
      throw error;
    }
  }

  // Procurement
  async getProcurements(filter: {
    restaurantId: string;
    type?: string;
    status?: string;
    branchId?: string;
  }): Promise<Procurement[]> {
    try {
      const conditions = [eq(procurement.restaurantId, filter.restaurantId)];
      if (filter.type) conditions.push(eq(procurement.type, filter.type));
      if (filter.status) conditions.push(eq(procurement.status, filter.status));
      if (filter.branchId) conditions.push(eq(procurement.branchId, filter.branchId));
      
      return await db.select().from(procurement).where(and(...conditions));
    } catch (error: any) {
      // Fallback if new columns (inventory_item_id, original_procurement_id) don't exist yet
      if (error.message?.includes('inventory_item_id') || error.message?.includes('original_procurement_id')) {
        console.log('[Procurement] New columns not found, using fallback query');
        // Build SQL with template literals for proper parameter handling
        const baseQuery = sql`SELECT id, restaurant_id as "restaurantId", type, title, description, supplier, category, 
          quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority, 
          requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId", 
          order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery", 
          notes, invoice_image as "invoiceImage", bill_id as "billId", 
          NULL as "inventoryItemId", NULL as "originalProcurementId",
          created_at as "createdAt", updated_at as "updatedAt"
          FROM procurement WHERE restaurant_id = ${filter.restaurantId}`;
        
        let finalQuery = baseQuery;
        if (filter.type) {
          finalQuery = sql`${finalQuery} AND type = ${filter.type}`;
        }
        if (filter.status) {
          finalQuery = sql`${finalQuery} AND status = ${filter.status}`;
        }
        if (filter.branchId) {
          finalQuery = sql`${finalQuery} AND branch_id = ${filter.branchId}`;
        }
        
        const result = await db.execute(finalQuery);
        return (result as any).rows || [];
      }
      throw error;
    }
  }

  async getProcurement(id: string, restaurantId: string): Promise<Procurement | undefined> {
    try {
      const [item] = await db.select().from(procurement)
        .where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)));
      return item;
    } catch (error: any) {
      if (error.message?.includes('inventory_item_id') || error.message?.includes('original_procurement_id')) {
        console.log('[Procurement] getProcurement: New columns not found, using fallback query');
        const result = await db.execute(sql`SELECT id, restaurant_id as "restaurantId", type, title, description, supplier, category, 
          quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority, 
          requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId", 
          order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery", 
          notes, invoice_image as "invoiceImage", bill_id as "billId", 
          NULL as "inventoryItemId", NULL as "originalProcurementId",
          created_at as "createdAt", updated_at as "updatedAt"
          FROM procurement WHERE id = ${id} AND restaurant_id = ${restaurantId}`);
        return (result as any).rows?.[0];
      }
      throw error;
    }
  }

  async createProcurement(procurementData: InsertProcurement): Promise<Procurement> {
    try {
      const [created] = await db.insert(procurement).values(procurementData).returning();
      return created;
    } catch (error: any) {
      if (error.message?.includes('inventory_item_id') || error.message?.includes('original_procurement_id')) {
        console.log('[Procurement] createProcurement: New columns not found, using fallback insert');
        // Strip new columns that don't exist in AWS database
        const { inventoryItemId: _inv, originalProcurementId: _orig, ...safeData } = procurementData as any;
        
        const result = await pool.query(`
          INSERT INTO procurement (
            id, restaurant_id, type, title, description, supplier, category,
            quantity, unit_price, total_cost, status, priority,
            requested_by, approved_by, branch_id,
            order_date, expected_delivery, actual_delivery,
            notes, invoice_image, bill_id
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14,
            $15, $16, $17,
            $18, $19, $20
          )
          RETURNING id, restaurant_id as "restaurantId", type, title, description, supplier, category,
            quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority,
            requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId",
            order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery",
            notes, invoice_image as "invoiceImage", bill_id as "billId",
            NULL as "inventoryItemId", NULL as "originalProcurementId",
            created_at as "createdAt", updated_at as "updatedAt"
        `, [
          safeData.restaurantId,
          safeData.type,
          safeData.title,
          safeData.description || null,
          safeData.supplier || null,
          safeData.category || null,
          safeData.quantity || null,
          safeData.unitPrice || null,
          safeData.totalCost || null,
          safeData.status || 'pending',
          safeData.priority || 'medium',
          safeData.requestedBy || null,
          safeData.approvedBy || null,
          safeData.branchId || null,
          safeData.orderDate || null,
          safeData.expectedDelivery || null,
          safeData.actualDelivery || null,
          safeData.notes || null,
          safeData.invoiceImage || null,
          safeData.billId || null,
        ]);
        return result.rows[0];
      }
      throw error;
    }
  }

  async updateProcurement(id: string, restaurantId: string, procurementData: Partial<InsertProcurement> & { billId?: string | null }): Promise<Procurement | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, inventoryItemId: _inv, originalProcurementId: _orig, ...safeData } = procurementData as any;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([key, value]) => value !== undefined || key === 'billId')
    );
    if (Object.keys(updateData).length === 0) {
      return this.getProcurement(id, restaurantId);
    }
    try {
      const [updated] = await db.update(procurement)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)))
        .returning();
      return updated;
    } catch (error: any) {
      if (error.message?.includes('inventory_item_id') || error.message?.includes('original_procurement_id')) {
        console.log('[Procurement] updateProcurement: New columns not found, using fallback update');
        // Use simple SQL update without the new columns
        const result = await db.execute(sql`
          UPDATE procurement SET
            type = COALESCE(${updateData.type}, type),
            title = COALESCE(${updateData.title}, title),
            description = COALESCE(${updateData.description}, description),
            supplier = COALESCE(${updateData.supplier}, supplier),
            category = COALESCE(${updateData.category}, category),
            quantity = COALESCE(${updateData.quantity}, quantity),
            unit_price = COALESCE(${updateData.unitPrice}, unit_price),
            total_cost = COALESCE(${updateData.totalCost}, total_cost),
            status = COALESCE(${updateData.status}, status),
            priority = COALESCE(${updateData.priority}, priority),
            requested_by = COALESCE(${updateData.requestedBy}, requested_by),
            approved_by = COALESCE(${updateData.approvedBy}, approved_by),
            notes = COALESCE(${updateData.notes}, notes),
            invoice_image = COALESCE(${updateData.invoiceImage}, invoice_image),
            bill_id = COALESCE(${updateData.billId}, bill_id),
            updated_at = NOW()
          WHERE id = ${id} AND restaurant_id = ${restaurantId}
          RETURNING id, restaurant_id as "restaurantId", type, title, description, supplier, category,
            quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority,
            requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId",
            order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery",
            notes, invoice_image as "invoiceImage", bill_id as "billId",
            NULL as "inventoryItemId", NULL as "originalProcurementId",
            created_at as "createdAt", updated_at as "updatedAt"
        `);
        return (result as any).rows?.[0];
      }
      throw error;
    }
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async createUserWithHashedPassword(user: {
    restaurantId: string;
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    role: string;
    isOwner?: boolean;
    permissions?: any;
  }): Promise<User> {
    // Insert user with pre-hashed password (used for signup flow where password is hashed before payment)
    const [created] = await db.insert(users)
      .values({
        restaurantId: user.restaurantId,
        username: user.username,
        password: user.passwordHash, // Already hashed
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isOwner: user.isOwner ?? false,
        permissions: user.permissions ?? null,
      } as any)
      .returning();
    return created;
  }

  async updateUser(id: string, restaurantId: string, user: Partial<InsertUser>): Promise<User | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = user;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined && value !== null)
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

  async updateUserById(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, ...safeData } = user;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined && value !== null)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUserById(id);
    }
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 10);
    }
    
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    
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

  async cancelSubscription(userId: string, restaurantId: string, reason?: "mistake" | "client_request"): Promise<User | undefined> {
    // Get user to find their restaurantId
    const user = await this.getUser(userId, restaurantId);
    if (!user || !user.restaurantId) return undefined;

    // Update restaurant subscription status with cancellation reason
    await db.update(restaurants)
      .set({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date(),
        cancellationReason: reason || 'mistake'
      })
      .where(eq(restaurants.id, user.restaurantId));

    // Return updated user
    return user;
  }

  // Activity Tracking (for IT Dashboard monitoring)
  async updateUserActivity(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserLogin(userId: string): Promise<void> {
    const now = new Date();
    await db.update(users)
      .set({ 
        lastLoginAt: now,
        lastActivityAt: now
      })
      .where(eq(users.id, userId));
  }

  async getClientAccountsActivity(): Promise<Array<{ 
    userId: string; 
    username: string; 
    fullName: string; 
    restaurantId: string; 
    restaurantName: string;
    lastActivityAt: Date | null; 
    lastLoginAt: Date | null;
    isOnline: boolean;
  }>> {
    // Get all users with their restaurant information (filter out IT accounts)
    const result = await db
      .select({
        userId: users.id,
        username: users.username,
        fullName: users.fullName,
        restaurantId: users.restaurantId,
        restaurantName: restaurants.name,
        lastActivityAt: users.lastActivityAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
      .where(isNotNull(users.restaurantId)) // Filter out IT accounts (restaurantId = null)
      .orderBy(desc(users.lastActivityAt));

    // Calculate isOnline based on lastActivityAt (online if activity within last 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    return result.map(row => ({
      userId: row.userId,
      username: row.username,
      fullName: row.fullName,
      restaurantId: row.restaurantId!, // Safe after isNotNull filter
      restaurantName: row.restaurantName || 'Unknown',
      lastActivityAt: row.lastActivityAt,
      lastLoginAt: row.lastLoginAt,
      isOnline: row.lastActivityAt ? row.lastActivityAt >= fiveMinutesAgo : false,
    }));
  }

  // Invoices
  async getInvoices(filter: {
    restaurantId: string;
    branchId?: string;
    dateRange?: { start?: Date; end?: Date };
  }): Promise<Invoice[]> {
    try {
      const conditions = [eq(invoices.restaurantId, filter.restaurantId)];
      if (filter.branchId) conditions.push(eq(invoices.branchId, filter.branchId));
      if (filter.dateRange?.start) conditions.push(gte(invoices.createdAt, filter.dateRange.start));
      if (filter.dateRange?.end) conditions.push(lte(invoices.createdAt, filter.dateRange.end));
      
      return await db.select().from(invoices).where(and(...conditions));
    } catch (error: any) {
      // Handle case where procurement_id column doesn't exist yet (pre-migration)
      if (error.message?.includes('procurement_id')) {
        console.warn('[Invoices] procurement_id column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", transaction_id as "transactionId",
                 order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                 customer_name as "customerName", customer_vat_number as "customerVatNumber",
                 items, subtotal, vat_amount as "vatAmount", total,
                 qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
          FROM invoices WHERE restaurant_id = ${filter.restaurantId}
          ORDER BY created_at DESC
        `);
        return (result as any).rows as Invoice[];
      }
      throw error;
    }
  }

  async getInvoice(id: string, restaurantId: string): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.select().from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId)));
      return invoice;
    } catch (error: any) {
      if (error.message?.includes('procurement_id')) {
        console.warn('[Invoices] procurement_id column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", transaction_id as "transactionId",
                 order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                 customer_name as "customerName", customer_vat_number as "customerVatNumber",
                 items, subtotal, vat_amount as "vatAmount", total,
                 qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
          FROM invoices WHERE id = ${id} AND restaurant_id = ${restaurantId}
        `);
        return (result as any).rows[0] as Invoice | undefined;
      }
      throw error;
    }
  }

  async getInvoicePublic(orderIdOrInvoiceId: string): Promise<Invoice | undefined> {
    // PUBLIC: For QR code and WhatsApp links, bypasses restaurantId check
    try {
      // Try to find by orderId first (for WhatsApp links), then by invoice id (for QR codes)
      const [invoiceByOrderId] = await db.select().from(invoices).where(eq(invoices.orderId, orderIdOrInvoiceId));
      if (invoiceByOrderId) {
        return invoiceByOrderId;
      }
      const [invoiceById] = await db.select().from(invoices).where(eq(invoices.id, orderIdOrInvoiceId));
      return invoiceById;
    } catch (error: any) {
      if (error.message?.includes('procurement_id')) {
        console.warn('[Invoices] procurement_id column not found, using fallback query for public access');
        // Try by orderId first
        let result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", transaction_id as "transactionId",
                 order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                 customer_name as "customerName", customer_vat_number as "customerVatNumber",
                 items, subtotal, vat_amount as "vatAmount", total,
                 qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
          FROM invoices WHERE order_id = ${orderIdOrInvoiceId}
        `);
        if ((result as any).rows.length > 0) {
          return (result as any).rows[0] as Invoice;
        }
        // Try by invoice id
        result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", transaction_id as "transactionId",
                 order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                 customer_name as "customerName", customer_vat_number as "customerVatNumber",
                 items, subtotal, vat_amount as "vatAmount", total,
                 qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
          FROM invoices WHERE id = ${orderIdOrInvoiceId}
        `);
        return (result as any).rows[0] as Invoice | undefined;
      }
      throw error;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [created] = await db.insert(invoices).values(invoice as any).returning();
      return created;
    } catch (error: any) {
      // Handle case where procurement_id column doesn't exist yet
      if (error.message?.includes('procurement_id')) {
        console.warn('[Invoices] procurement_id column not found, using fallback INSERT');
        const { procurementId, ...invoiceWithoutProcurement } = invoice as any;
        const result = await db.execute(sql`
          INSERT INTO invoices (restaurant_id, invoice_number, invoice_type, transaction_id, order_id, branch_id,
                               customer_name, customer_vat_number, items, subtotal, vat_amount, total, qr_code, pdf_path)
          VALUES (${invoiceWithoutProcurement.restaurantId}, ${invoiceWithoutProcurement.invoiceNumber}, 
                  ${invoiceWithoutProcurement.invoiceType || 'simplified'}, ${invoiceWithoutProcurement.transactionId || null},
                  ${invoiceWithoutProcurement.orderId || null}, ${invoiceWithoutProcurement.branchId || null},
                  ${invoiceWithoutProcurement.customerName || null}, ${invoiceWithoutProcurement.customerVatNumber || null},
                  ${JSON.stringify(invoiceWithoutProcurement.items)}, ${invoiceWithoutProcurement.subtotal},
                  ${invoiceWithoutProcurement.vatAmount}, ${invoiceWithoutProcurement.total},
                  ${invoiceWithoutProcurement.qrCode || ''}, ${invoiceWithoutProcurement.pdfPath || ''})
          RETURNING id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                    invoice_type as "invoiceType", transaction_id as "transactionId",
                    order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                    customer_name as "customerName", customer_vat_number as "customerVatNumber",
                    items, subtotal, vat_amount as "vatAmount", total,
                    qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
        `);
        return (result as any).rows[0] as Invoice;
      }
      throw error;
    }
  }

  async updateInvoice(id: string, restaurantId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, procurementId: __, ...safeData } = invoice as any;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvoice(id, restaurantId);
    }
    try {
      const [updated] = await db.update(invoices)
        .set(updateData as any)
        .where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId)))
        .returning();
      return updated;
    } catch (error: any) {
      // Handle case where procurement_id column doesn't exist yet
      if (error.message?.includes('procurement_id')) {
        console.warn('[Invoices] procurement_id column not found, using fallback UPDATE');
        // Build dynamic UPDATE query for only the fields we have
        const setClauses: string[] = [];
        const values: any[] = [];
        if (updateData.qrCode !== undefined) { setClauses.push('qr_code = $' + (values.push(updateData.qrCode))); }
        if (updateData.pdfPath !== undefined) { setClauses.push('pdf_path = $' + (values.push(updateData.pdfPath))); }
        if (updateData.customerName !== undefined) { setClauses.push('customer_name = $' + (values.push(updateData.customerName))); }
        if (updateData.customerVatNumber !== undefined) { setClauses.push('customer_vat_number = $' + (values.push(updateData.customerVatNumber))); }
        
        if (setClauses.length === 0) {
          return this.getInvoice(id, restaurantId);
        }
        
        // Simple update for common fields
        const result = await db.execute(sql`
          UPDATE invoices SET qr_code = ${updateData.qrCode || null}, pdf_path = ${updateData.pdfPath || null}
          WHERE id = ${id} AND restaurant_id = ${restaurantId}
          RETURNING id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                    invoice_type as "invoiceType", transaction_id as "transactionId",
                    order_id as "orderId", NULL as "procurementId", branch_id as "branchId",
                    customer_name as "customerName", customer_vat_number as "customerVatNumber",
                    items, subtotal, vat_amount as "vatAmount", total,
                    qr_code as "qrCode", pdf_path as "pdfPath", created_at as "createdAt"
        `);
        return (result as any).rows[0] as Invoice | undefined;
      }
      throw error;
    }
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

  async findCustomerByPhone(restaurantId: string, phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.restaurantId, restaurantId), eq(customers.phone, phone)));
    return customer;
  }

  async upsertCustomer(restaurantId: string, data: { name: string; phone: string }): Promise<Customer> {
    // Find existing customer by phone
    const existing = await this.findCustomerByPhone(restaurantId, data.phone);
    
    if (existing) {
      // Update existing customer
      const [updated] = await db.update(customers)
        .set({ name: data.name })
        .where(and(eq(customers.id, existing.id), eq(customers.restaurantId, restaurantId)))
        .returning();
      return updated;
    } else {
      // Create new customer
      const [created] = await db.insert(customers)
        .values({ restaurantId, name: data.name, phone: data.phone })
        .returning();
      return created;
    }
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
    
    try {
      return await db.select().from(shopBills).where(and(...conditions));
    } catch (error: any) {
      // Handle missing columns (backward compatibility for schema migrations)
      if (error.message?.includes('does not exist')) {
        console.log('[ShopBills] Column not found, using minimal fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id, branch_id, bill_type, description, amount, 
                 payment_date, payment_period, status, employee_id, employee_name, 
                 created_at, payment_month, archived
          FROM shop_bills 
          WHERE restaurant_id = ${restaurantId}
          ${branchId ? sql`AND branch_id = ${branchId}` : sql``}
          ${startDate ? sql`AND payment_date >= ${startDate}` : sql``}
          ${endDate ? sql`AND payment_date <= ${endDate}` : sql``}
          ${!includeArchived ? sql`AND archived = false` : sql``}
        `);
        return (result.rows || []).map((row: any) => ({
          id: row.id,
          restaurantId: row.restaurant_id,
          branchId: row.branch_id,
          billType: row.bill_type,
          description: row.description,
          amount: row.amount,
          paymentDate: row.payment_date,
          paymentPeriod: row.payment_period,
          status: row.status,
          employeeId: row.employee_id,
          employeeName: row.employee_name,
          createdAt: row.created_at,
          paymentMonth: row.payment_month,
          archived: row.archived,
          procurementId: null, // Column may not exist yet
          violationId: null, // Column may not exist yet
          notes: null, // Column may not exist yet
          invoiceImage: null, // Column may not exist yet
        })) as ShopBill[];
      }
      throw error;
    }
  }

  async getShopBill(id: string): Promise<ShopBill | undefined> {
    try {
      const [bill] = await db.select().from(shopBills).where(eq(shopBills.id, id));
      return bill;
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('[ShopBills] getShopBill: Column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", branch_id as "branchId", bill_type as "billType", 
                 description, amount, payment_date as "paymentDate", payment_period as "paymentPeriod", 
                 status, employee_id as "employeeId", employee_name as "employeeName", 
                 created_at as "createdAt", payment_month as "paymentMonth", archived,
                 NULL as "invoiceImage", NULL as "procurementId"
          FROM shop_bills WHERE id = ${id}
        `);
        return (result as any).rows?.[0];
      }
      throw error;
    }
  }

  async createShopBill(bill: InsertShopBill): Promise<ShopBill> {
    try {
      const [created] = await db.insert(shopBills).values(bill).returning();
      return created;
    } catch (error: any) {
      if (error.message?.includes('invoice_image') || error.message?.includes('does not exist')) {
        console.log('[ShopBills] createShopBill: New columns not found, using fallback insert');
        const result = await db.execute(sql`
          INSERT INTO shop_bills (
            id, restaurant_id, branch_id, bill_type, description, amount, 
            payment_date, payment_period, status, employee_id, employee_name, 
            created_at, payment_month, archived
          ) VALUES (
            gen_random_uuid(), ${bill.restaurantId}, ${bill.branchId || null}, ${bill.billType},
            ${bill.description || null}, ${bill.amount}, ${bill.paymentDate || new Date()}, 
            ${bill.paymentPeriod || null}, ${bill.status || 'pending'}, ${bill.employeeId || null}, 
            ${bill.employeeName || null}, NOW(), ${bill.paymentMonth || null}, ${bill.archived || false}
          )
          RETURNING id, restaurant_id as "restaurantId", branch_id as "branchId", bill_type as "billType",
                    description, amount, payment_date as "paymentDate", payment_period as "paymentPeriod",
                    status, employee_id as "employeeId", employee_name as "employeeName",
                    created_at as "createdAt", payment_month as "paymentMonth", archived
        `);
        const row = (result as any).rows?.[0];
        return {
          ...row,
          procurementId: null,
          violationId: null,
          notes: null,
          invoiceImage: null,
        } as ShopBill;
      }
      throw error;
    }
  }

  async updateShopBill(id: string, restaurantId: string, bill: Partial<InsertShopBill>): Promise<ShopBill | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(bill).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getShopBill(id);
    }
    // SECURITY: Enforce tenant isolation at database level
    const [updated] = await db.update(shopBills)
      .set(updateData)
      .where(and(eq(shopBills.id, id), eq(shopBills.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteShopBill(id: string, restaurantId: string): Promise<boolean> {
    // SECURITY: Enforce tenant isolation at database level
    const result = await db.delete(shopBills).where(and(eq(shopBills.id, id), eq(shopBills.restaurantId, restaurantId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async archiveShopBill(id: string, archived: boolean): Promise<ShopBill | undefined> {
    const [updated] = await db.update(shopBills)
      .set({ archived })
      .where(eq(shopBills.id, id))
      .returning();
    return updated;
  }

  async generateSalaryBills(restaurantId: string, paymentMonth: string): Promise<{ created: number; skipped: number; bills: ShopBill[] }> {
    // Get all active employees with a salary for this restaurant
    const employees = await db.select().from(users).where(
      and(
        eq(users.restaurantId, restaurantId),
        eq(users.active, true),
        isNotNull(users.salary)
      )
    );

    // Check for existing salary bills for this month
    const existingBills = await db.select().from(shopBills).where(
      and(
        eq(shopBills.restaurantId, restaurantId),
        eq(shopBills.billType, "salary"),
        eq(shopBills.paymentMonth, paymentMonth)
      )
    );

    const existingEmployeeIds = new Set(existingBills.map(bill => bill.employeeId).filter(Boolean));

    let created = 0;
    let skipped = 0;
    const createdBills: ShopBill[] = [];

    // Create salary bills for employees who don't have one yet
    for (const employee of employees) {
      if (existingEmployeeIds.has(employee.id)) {
        skipped++;
        continue;
      }

      if (!employee.salary || parseFloat(employee.salary) <= 0) {
        skipped++;
        continue;
      }

      // Create first day of the month as payment date
      const [year, month] = paymentMonth.split('-');
      const paymentDate = new Date(parseInt(year), parseInt(month) - 1, 1);

      const billData: InsertShopBill = {
        restaurantId,
        billType: "salary",
        amount: employee.salary,
        paymentDate,
        paymentPeriod: "monthly",
        status: "pending",
        employeeId: employee.id,
        employeeName: employee.fullName,
        paymentMonth,
        description: `Monthly salary for ${employee.fullName}${employee.position ? ` (${employee.position})` : ''}`,
        branchId: employee.branchId || null,
        archived: false,
      };

      const [bill] = await db.insert(shopBills).values(billData).returning();
      createdBills.push(bill);
      created++;
    }

    return { created, skipped, bills: createdBills };
  }

  // Violations (MULTI-TENANT: filters by restaurantId)
  async getViolations(restaurantId: string, branchId?: string, authority?: string, status?: string): Promise<Violation[]> {
    const conditions = [eq(violations.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(violations.branchId, branchId));
    if (authority) conditions.push(eq(violations.authority, authority));
    if (status) conditions.push(eq(violations.status, status));
    
    return await db.select().from(violations).where(and(...conditions)).orderBy(desc(violations.violationDate));
  }

  async getViolation(id: string, restaurantId: string): Promise<Violation | undefined> {
    const [violation] = await db.select().from(violations).where(
      and(eq(violations.id, id), eq(violations.restaurantId, restaurantId))
    );
    return violation;
  }

  async createViolation(violation: InsertViolation): Promise<Violation> {
    const [created] = await db.insert(violations).values(violation).returning();
    return created;
  }

  async updateViolation(id: string, restaurantId: string, violation: Partial<InsertViolation>): Promise<Violation | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(violation).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getViolation(id, restaurantId);
    }
    // SECURITY: Enforce tenant isolation at database level
    const [updated] = await db.update(violations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(violations.id, id), eq(violations.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deleteViolation(id: string, restaurantId: string): Promise<boolean> {
    // SECURITY: Enforce tenant isolation at database level
    const result = await db.delete(violations).where(and(eq(violations.id, id), eq(violations.restaurantId, restaurantId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getViolationStats(restaurantId: string): Promise<ViolationStats> {
    const allViolations = await this.getViolations(restaurantId);
    
    const totalViolations = allViolations.length;
    const totalFees = allViolations.reduce((sum, v) => sum + parseFloat(v.feeAmount || '0'), 0);
    
    // Calculate fees and counts by status
    const paidViolations = allViolations.filter(v => v.status === 'paid');
    const pendingViolations = allViolations.filter(v => v.status === 'pending');
    const disputedViolations = allViolations.filter(v => v.status === 'disputed');
    
    const paidFees = paidViolations.reduce((sum, v) => sum + parseFloat(v.feeAmount || '0'), 0);
    const pendingFees = pendingViolations.reduce((sum, v) => sum + parseFloat(v.feeAmount || '0'), 0);
    const disputedFees = disputedViolations.reduce((sum, v) => sum + parseFloat(v.feeAmount || '0'), 0);
    
    const paidCount = paidViolations.length;
    const pendingCount = pendingViolations.length;
    const disputedCount = disputedViolations.length;
    
    // Group by authority
    const authorityMap = new Map<string, { count: number; totalFees: number }>();
    allViolations.forEach(v => {
      const existing = authorityMap.get(v.authority) || { count: 0, totalFees: 0 };
      authorityMap.set(v.authority, {
        count: existing.count + 1,
        totalFees: existing.totalFees + parseFloat(v.feeAmount || '0'),
      });
    });
    const byAuthority = Array.from(authorityMap.entries()).map(([authority, data]) => ({
      authority,
      count: data.count,
      totalFees: data.totalFees,
    }));
    
    // Group by status
    const statusMap = new Map<string, number>();
    allViolations.forEach(v => {
      statusMap.set(v.status, (statusMap.get(v.status) || 0) + 1);
    });
    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
    
    // Monthly trend (last 12 months)
    const monthlyMap = new Map<string, { count: number; totalFees: number }>();
    allViolations.forEach(v => {
      const month = new Date(v.violationDate).toISOString().slice(0, 7);
      const existing = monthlyMap.get(month) || { count: 0, totalFees: 0 };
      monthlyMap.set(month, {
        count: existing.count + 1,
        totalFees: existing.totalFees + parseFloat(v.feeAmount || '0'),
      });
    });
    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, count: data.count, totalFees: data.totalFees }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
    
    return {
      totalViolations,
      totalFees,
      paidFees,
      pendingFees,
      disputedFees,
      paidCount,
      pendingCount,
      disputedCount,
      byAuthority,
      byStatus,
      monthlyTrend,
    };
  }

  // Violation References (MULTI-TENANT: filters by restaurantId)
  async getViolationReferences(restaurantId: string, authority?: string): Promise<ViolationReference[]> {
    if (authority) {
      return await db.select().from(violationReferences).where(
        and(
          eq(violationReferences.restaurantId, restaurantId),
          eq(violationReferences.authority, authority)
        )
      ).orderBy(desc(violationReferences.uploadedAt));
    }
    return await db.select().from(violationReferences).where(
      eq(violationReferences.restaurantId, restaurantId)
    ).orderBy(desc(violationReferences.uploadedAt));
  }

  async getViolationReference(id: string, restaurantId: string): Promise<ViolationReference | undefined> {
    const [ref] = await db.select().from(violationReferences).where(
      and(eq(violationReferences.id, id), eq(violationReferences.restaurantId, restaurantId))
    );
    return ref;
  }

  async createViolationReference(reference: InsertViolationReference): Promise<ViolationReference> {
    const [created] = await db.insert(violationReferences).values(reference as any).returning();
    return created;
  }

  async deleteViolationReference(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(violationReferences).where(
      and(eq(violationReferences.id, id), eq(violationReferences.restaurantId, restaurantId))
    );
    return (result as any).rowCount > 0;
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

  // Delivery Profitability Manual Entries
  async getDeliveryProfitability(restaurantId: string, year?: number): Promise<DeliveryProfitability[]> {
    try {
      if (year) {
        return await db.select().from(deliveryProfitability).where(
          and(eq(deliveryProfitability.restaurantId, restaurantId), eq(deliveryProfitability.year, year))
        ).orderBy(desc(deliveryProfitability.year), desc(deliveryProfitability.month));
      }
      return await db.select().from(deliveryProfitability).where(
        eq(deliveryProfitability.restaurantId, restaurantId)
      ).orderBy(desc(deliveryProfitability.year), desc(deliveryProfitability.month));
    } catch (error: any) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log('[DeliveryProfitability] Column not found, using fallback query');
        const yearCondition = year ? `AND year = ${year}` : '';
        const result = await pool.query(`
          SELECT id, restaurant_id as "restaurantId", delivery_app_id as "deliveryAppId",
                 year, month, orders, sales, revenue, commission, banking, subsidy,
                 COALESCE(net_earnings, '0') as "netEarnings", notes, created_at as "createdAt", updated_at as "updatedAt",
                 '0' as vat, '0' as "posFees", '0' as profit
          FROM delivery_profitability
          WHERE restaurant_id = $1 ${yearCondition}
          ORDER BY year DESC, month DESC
        `, [restaurantId]);
        return result.rows as DeliveryProfitability[];
      }
      throw error;
    }
  }

  async getDeliveryProfitabilityEntry(id: string): Promise<DeliveryProfitability | undefined> {
    const result = await db.select().from(deliveryProfitability).where(eq(deliveryProfitability.id, id));
    return result[0];
  }

  async createDeliveryProfitability(entry: InsertDeliveryProfitability): Promise<DeliveryProfitability> {
    const result = await db.insert(deliveryProfitability).values(entry).returning();
    return result[0];
  }

  async updateDeliveryProfitability(id: string, entry: Partial<InsertDeliveryProfitability>): Promise<DeliveryProfitability | undefined> {
    const result = await db.update(deliveryProfitability)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(deliveryProfitability.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryProfitability(id: string): Promise<boolean> {
    const result = await db.delete(deliveryProfitability).where(eq(deliveryProfitability.id, id)).returning();
    return result.length > 0;
  }

  async upsertDeliveryProfitability(entry: InsertDeliveryProfitability): Promise<DeliveryProfitability> {
    // Check if entry exists for this app/year/month
    const existing = await db.select().from(deliveryProfitability).where(
      and(
        eq(deliveryProfitability.restaurantId, entry.restaurantId),
        eq(deliveryProfitability.deliveryAppId, entry.deliveryAppId),
        eq(deliveryProfitability.year, entry.year),
        eq(deliveryProfitability.month, entry.month)
      )
    );
    
    if (existing.length > 0) {
      const result = await db.update(deliveryProfitability)
        .set({ ...entry, updatedAt: new Date() })
        .where(eq(deliveryProfitability.id, existing[0].id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(deliveryProfitability).values(entry).returning();
    return result[0];
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

  async getBepMetrics(restaurantId: string, year: number): Promise<BepMetrics> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // 1. Get fixed costs from shop bills
    // Exclude foundational bills (not operational costs) AND one-time bills (not recurring)
    let allBills: any[];
    try {
      allBills = await db.select().from(shopBills).where(
        and(
          eq(shopBills.restaurantId, restaurantId),
          gte(shopBills.paymentDate, yearStart),
          lte(shopBills.paymentDate, yearEnd)
        )
      );
    } catch (error: any) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log('[BepMetrics] ShopBills column not found, using fallback query');
        const result = await pool.query(`
          SELECT id, restaurant_id as "restaurantId", bill_type as "billType", amount,
                 payment_date as "paymentDate", payment_period as "paymentPeriod", status,
                 description, employee_id as "employeeId", employee_name as "employeeName",
                 payment_month as "paymentMonth", archived, branch_id as "branchId",
                 created_at as "createdAt", NULL as "invoiceImage"
          FROM shop_bills
          WHERE restaurant_id = $1 AND payment_date >= $2 AND payment_date <= $3
        `, [restaurantId, yearStart, yearEnd]);
        allBills = result.rows;
      } else {
        throw error;
      }
    }

    // Filter out foundational bills AND one-time bills (fixed costs = recurring operational expenses only)
    // Note: paymentPeriod can be 'one-time' or 'oneTime' depending on when data was created
    const recurringBills = allBills.filter(bill => 
      bill.billType !== 'foundational' && 
      bill.paymentPeriod !== 'one-time' && 
      bill.paymentPeriod !== 'oneTime'
    );

    // Calculate total fixed costs and breakdown by category
    const fixedCostsMap = new Map<string, number>();
    let fixedCosts = 0;
    
    for (const bill of recurringBills) {
      const amount = parseFloat(bill.amount) || 0;
      fixedCosts += amount;
      
      const category = bill.billType || 'other';
      fixedCostsMap.set(category, (fixedCostsMap.get(category) || 0) + amount);
    }

    const fixedCostsBreakdown = Array.from(fixedCostsMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    // 2. Get invoices for the year
    let yearInvoices: any[];
    try {
      yearInvoices = await db.select().from(invoices).where(
        and(
          eq(invoices.restaurantId, restaurantId),
          gte(invoices.createdAt, yearStart),
          lte(invoices.createdAt, yearEnd)
        )
      );
    } catch (error: any) {
      // Handle case where procurement_id or other new columns don't exist yet
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log('[BepMetrics] Invoices column not found, using fallback query');
        const result = await pool.query(`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", transaction_id as "transactionId",
                 order_id as "orderId", branch_id as "branchId",
                 customer_name as "customerName", customer_vat_number as "customerVatNumber",
                 items, subtotal, vat_amount as "vatAmount", total, qr_code as "qrCode",
                 pdf_path as "pdfPath", created_at as "createdAt"
          FROM invoices
          WHERE restaurant_id = $1 AND created_at >= $2 AND created_at <= $3
        `, [restaurantId, yearStart, yearEnd]);
        yearInvoices = result.rows;
      } else {
        throw error;
      }
    }

    // 3. Calculate revenue and units sold
    let revenue = 0;
    let unitsSold = 0;
    
    for (const invoice of yearInvoices) {
      revenue += parseFloat(invoice.total) || 0;
      
      // Count units sold from items
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          unitsSold += (item.quantity || 0);
        }
      }
    }

    // 4. Calculate COGS from orders linked to invoices
    // Get all menu items and recipes for cost lookup
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
    const allRecipes = await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
    
    // Get inventory items with fallback for missing unit_price column
    let allInventory: any[];
    try {
      allInventory = await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, restaurantId));
    } catch (error: any) {
      if (error.message?.includes('unit_price')) {
        console.log('[BepMetrics] Inventory unit_price column not found, using fallback query');
        const result = await pool.query(`
          SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit, 
            reference_quantity as "referenceQuantity", price,
            CASE WHEN CAST(quantity AS NUMERIC) > 0 THEN CAST(CAST(price AS NUMERIC) / CAST(quantity AS NUMERIC) AS DECIMAL(10,2))::text ELSE '0' END as "unitPrice",
            supplier, status, branch_id as "branchId", sort_order as "sortOrder", 
            expiration_days as "expirationDays", purchase_date as "purchaseDate"
          FROM inventory_items WHERE restaurant_id = $1
        `, [restaurantId]);
        allInventory = result.rows;
      } else {
        throw error;
      }
    }
    
    // Create lookup maps
    const menuItemMap = new Map(allMenuItems.map(mi => [mi.id, mi]));
    const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
    const inventoryMap = new Map(allInventory.map(inv => [inv.id, inv]));

    let cogsTotal = 0;

    // Get orders linked to invoices and calculate COGS
    for (const invoice of yearInvoices) {
      if (!invoice.orderId) {
        // Manual invoice without order - skip COGS calculation
        continue;
      }

      // Get the order
      const [order] = await db.select().from(orders).where(
        and(
          eq(orders.id, invoice.orderId),
          eq(orders.restaurantId, restaurantId)
        )
      );

      if (!order || !order.items || !Array.isArray(order.items)) {
        continue;
      }

      // Calculate COGS for each item in the order
      for (const orderItem of order.items) {
        const menuItemId = orderItem.id;
        const quantity = orderItem.quantity || 0;
        
        const menuItem = menuItemMap.get(menuItemId);
        if (!menuItem) {
          continue;
        }

        if (menuItem.recipeId) {
          // Menu item has a recipe - use recipe cost × portionSize × quantity
          const recipe = recipeMap.get(menuItem.recipeId);
          if (recipe) {
            const recipeCost = parseFloat(recipe.cost) || 0;
            const portionSize = parseFloat(menuItem.portionSize || "1.0") || 1.0;
            cogsTotal += recipeCost * portionSize * quantity;
          }
        } else if (menuItem.inventoryItemId) {
          // Menu item is direct from inventory - use inventory price × quantity
          const inventoryItem = inventoryMap.get(menuItem.inventoryItemId);
          if (inventoryItem) {
            const inventoryPrice = parseFloat(inventoryItem.price) || 0;
            cogsTotal += inventoryPrice * quantity;
          }
        }
        // Else: no cost data, COGS += 0
      }
    }

    // 5. Calculate BEP metrics
    const avgSellingPrice = unitsSold > 0 ? revenue / unitsSold : 0;
    const avgVariableCostPerUnit = unitsSold > 0 ? cogsTotal / unitsSold : 0;
    const contributionMarginPerUnit = avgSellingPrice - avgVariableCostPerUnit;
    const contributionMarginRatio = revenue > 0 ? (revenue - cogsTotal) / revenue : 0;
    
    // BEP calculations with safety for division by zero or negative margins
    const bepUnits = contributionMarginPerUnit > 0 
      ? fixedCosts / contributionMarginPerUnit 
      : 0;
    const bepRevenue = contributionMarginRatio > 0 
      ? fixedCosts / contributionMarginRatio 
      : 0;
    
    // Margin of safety: (Actual Revenue - BEP Revenue) / Actual Revenue × 100
    const marginOfSafety = revenue > 0 && bepRevenue > 0 
      ? ((revenue - bepRevenue) / revenue) * 100 
      : 0;
    
    // Is the business profitable? (Revenue > BEP Revenue)
    const isProfitable = revenue > bepRevenue && bepRevenue > 0;

    return {
      fixedCosts,
      fixedCostsBreakdown,
      cogsTotal,
      revenue,
      unitsSold,
      avgSellingPrice,
      avgVariableCostPerUnit,
      contributionMarginPerUnit,
      contributionMarginRatio,
      bepUnits,
      bepRevenue,
      marginOfSafety,
      isProfitable,
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

  // IT Management Functions
  async assignTicket(ticketId: string, restaurantId: string | null, assignedTo: string | null, assignedBy: string): Promise<SupportTicket | undefined> {
    const updateData: any = {
      assignedTo,
      assignedBy,
      assignedAt: assignedTo ? new Date() : null,
      updatedAt: new Date()
    };

    const conditions = [eq(supportTickets.id, ticketId)];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }

    const [updated] = await db.update(supportTickets)
      .set(updateData)
      .where(and(...conditions))
      .returning();
    
    return updated;
  }

  async getITStaff(restaurantId?: string): Promise<any[]> {
    // IT Staff are users with restaurantId = null (IT accounts only)
    // These are the only users who can be assigned to support tickets
    // The restaurantId parameter is ignored - we always return IT accounts only
    
    const itStaff = await db.select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(sql`${users.restaurantId} IS NULL`);
    
    return itStaff;
  }

  async getITAnalytics(restaurantId?: string): Promise<{
    totalOpen: number;
    totalInProgress: number;
    totalResolved: number;
    totalClosed: number;
    urgentCount: number;
    highPriorityCount: number;
    avgResponseTimeHours: number;
    avgResolutionTimeHours: number;
    ticketsClosedToday: number;
    ticketsClosedThisWeek: number;
    ticketsClosedThisMonth: number;
    statusDistribution: { name: string; value: number }[];
    priorityBreakdown: { name: string; value: number }[];
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all tickets (for this restaurant if provided, or all restaurants)
    const tickets = restaurantId 
      ? await db.select().from(supportTickets).where(eq(supportTickets.restaurantId, restaurantId))
      : await db.select().from(supportTickets);

    // Calculate metrics
    const totalOpen = tickets.filter(t => t.status === 'open').length;
    const totalInProgress = tickets.filter(t => t.status === 'in-progress').length;
    const totalResolved = tickets.filter(t => t.status === 'resolved').length;
    const totalClosed = tickets.filter(t => t.status === 'closed').length;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;
    const highPriorityCount = tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length;

    // Calculate response time (time from creation to first message by IT)
    const messagesData = restaurantId
      ? await db.select({
          ticketId: ticketMessages.ticketId,
          createdAt: ticketMessages.createdAt,
          senderRole: ticketMessages.senderRole
        })
        .from(ticketMessages)
        .where(eq(ticketMessages.restaurantId, restaurantId))
        .orderBy(ticketMessages.createdAt)
      : await db.select({
          ticketId: ticketMessages.ticketId,
          createdAt: ticketMessages.createdAt,
          senderRole: ticketMessages.senderRole
        })
        .from(ticketMessages)
        .orderBy(ticketMessages.createdAt);

    const responseTimesMs: number[] = [];
    const ticketsWithResponse = new Set<string>();

    // IT support roles that count as responses
    const itSupportRoles = ['it_support', 'admin', 'it', 'support'];
    
    for (const msg of messagesData) {
      if (itSupportRoles.includes(msg.senderRole) && !ticketsWithResponse.has(msg.ticketId)) {
        const ticket = tickets.find(t => t.id === msg.ticketId);
        if (ticket) {
          const responseTime = new Date(msg.createdAt).getTime() - new Date(ticket.createdAt).getTime();
          responseTimesMs.push(responseTime);
          ticketsWithResponse.add(msg.ticketId);
        }
      }
    }

    const avgResponseTimeHours = responseTimesMs.length > 0
      ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length / (1000 * 60 * 60)
      : 0;

    // Calculate resolution time
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    const resolutionTimesMs = resolvedTickets.map(t => 
      new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()
    );
    const avgResolutionTimeHours = resolutionTimesMs.length > 0
      ? resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length / (1000 * 60 * 60)
      : 0;

    // Count tickets closed in different periods
    const ticketsClosedToday = tickets.filter(t => 
      t.closedAt && new Date(t.closedAt) >= todayStart
    ).length;

    const ticketsClosedThisWeek = tickets.filter(t => 
      t.closedAt && new Date(t.closedAt) >= weekStart
    ).length;

    const ticketsClosedThisMonth = tickets.filter(t => 
      t.closedAt && new Date(t.closedAt) >= monthStart
    ).length;

    // Calculate openTrend (percentage change from yesterday)
    const yesterdayEnd = todayStart; // Today at 00:00:00

    // Count tickets that were open at yesterday's end (today at 00:00:00)
    const totalOpenYesterday = tickets.filter(t => {
      const createdAt = new Date(t.createdAt);
      const closedAt = t.closedAt ? new Date(t.closedAt) : null;
      
      // Ticket was created before yesterday end AND was NOT closed before yesterday end
      return createdAt < yesterdayEnd && (!closedAt || closedAt >= yesterdayEnd);
    }).length;

    const openTrend = totalOpenYesterday > 0 
      ? Math.round(((totalOpen - totalOpenYesterday) / totalOpenYesterday) * 100)
      : 0;

    // Build statusDistribution array for pie chart
    const statusDistribution = [
      { name: 'Open', value: totalOpen },
      { name: 'In Progress', value: totalInProgress },
      { name: 'Resolved', value: totalResolved },
      { name: 'Closed', value: totalClosed },
    ].filter(s => s.value > 0); // Only include statuses with tickets

    // Build priorityBreakdown array for bar chart (count ALL tickets including closed)
    const lowPriorityCount = tickets.filter(t => t.priority === 'low').length;
    const mediumPriorityCount = tickets.filter(t => t.priority === 'medium').length;
    const allHighPriorityCount = tickets.filter(t => t.priority === 'high').length;
    const allUrgentCount = tickets.filter(t => t.priority === 'urgent').length;
    const priorityBreakdown = [
      { name: 'Low', value: lowPriorityCount },
      { name: 'Medium', value: mediumPriorityCount },
      { name: 'High', value: allHighPriorityCount },
      { name: 'Urgent', value: allUrgentCount },
    ].filter(p => p.value > 0); // Only include priorities with tickets

    return {
      totalOpen,
      totalInProgress,
      totalResolved,
      totalClosed,
      urgentCount,
      highPriorityCount,
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
      avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
      ticketsClosedToday,
      ticketsClosedThisWeek,
      ticketsClosedThisMonth,
      statusDistribution,
      priorityBreakdown,
    };
  }

  async getWorkloadDistribution(restaurantId?: string): Promise<any[]> {
    const itStaff = await this.getITStaff(restaurantId);
    
    const workload = await Promise.all(itStaff.map(async (staff) => {
      const activeConditions = [
        eq(supportTickets.assignedTo, staff.id),
        sql`${supportTickets.status} != 'closed'`
      ];
      if (restaurantId) {
        activeConditions.push(eq(supportTickets.restaurantId, restaurantId));
      }
      
      const activeTickets = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(and(...activeConditions));

      const resolvedConditions = [
        eq(supportTickets.assignedTo, staff.id),
        eq(supportTickets.status, 'resolved')
      ];
      if (restaurantId) {
        resolvedConditions.push(eq(supportTickets.restaurantId, restaurantId));
      }
      
      const resolvedTickets = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(and(...resolvedConditions));

      return {
        ...staff,
        activeTickets: activeTickets[0]?.count || 0,
        resolvedTickets: resolvedTickets[0]?.count || 0
      };
    }));

    return workload;
  }

  async getCategoryBreakdown(restaurantId?: string): Promise<{ category: string; count: number }[]> {
    // Include ALL tickets (including closed) for complete category breakdown
    const conditions: any[] = [];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }
    
    const result = conditions.length > 0
      ? await db.select({
          category: supportTickets.category,
          count: sql<number>`count(*)`
        })
        .from(supportTickets)
        .where(and(...conditions))
        .groupBy(supportTickets.category)
      : await db.select({
          category: supportTickets.category,
          count: sql<number>`count(*)`
        })
        .from(supportTickets)
        .groupBy(supportTickets.category);

    return result.map(r => ({ category: r.category, count: Number(r.count) || 0 }));
  }

  async getTicketTrends(restaurantId?: string, days: number = 30): Promise<{
    date: string;
    created: number;
    resolved: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const conditions = [gte(supportTickets.createdAt, startDate)];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }

    const tickets = await db.select()
      .from(supportTickets)
      .where(and(...conditions));

    // Group by date
    const trendMap = new Map<string, { created: number; resolved: number }>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { created: 0, resolved: 0 });
    }

    tickets.forEach(ticket => {
      const createdDate = new Date(ticket.createdAt).toISOString().split('T')[0];
      if (trendMap.has(createdDate)) {
        trendMap.get(createdDate)!.created++;
      }

      if (ticket.resolvedAt) {
        const resolvedDate = new Date(ticket.resolvedAt).toISOString().split('T')[0];
        if (trendMap.has(resolvedDate)) {
          trendMap.get(resolvedDate)!.resolved++;
        }
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAllActiveTicketsForIT(): Promise<SupportTicket[]> {
    // Get all active tickets across all restaurants for IT accounts
    const tickets = await db.select()
      .from(supportTickets)
      .where(
        or(
          eq(supportTickets.status, 'open'),
          eq(supportTickets.status, 'in-progress'),
          eq(supportTickets.status, 'pending')
        )
      )
      .orderBy(sql`${supportTickets.createdAt} DESC`);
    
    return tickets;
  }

  async getAllSupportTicketsForIT(userId?: string, status?: string): Promise<SupportTicket[]> {
    // Get all tickets across all restaurants for IT accounts (with optional filters)
    let query = db.select().from(supportTickets);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(supportTickets.userId, userId));
    }
    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    
    if (conditions.length === 1) {
      query = query.where(conditions[0]) as any;
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(sql`${supportTickets.createdAt} DESC`);
  }

  async getSupportTicketForIT(id: string): Promise<SupportTicket | undefined> {
    // Get a single ticket without restaurantId filtering (for IT cross-tenant access)
    const [ticket] = await db.select().from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async getTicketMessagesForIT(ticketId: string): Promise<TicketMessage[]> {
    // Get ticket messages without restaurantId filtering (for IT cross-tenant access)
    // SECURITY: First verify the ticket exists to prevent orphaned message access
    const ticket = await this.getSupportTicketForIT(ticketId);
    if (!ticket) {
      return [];
    }
    
    // Fetch messages only for existing tickets, filtered by ticket's restaurantId to prevent orphans
    return await db.select().from(ticketMessages)
      .where(and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.restaurantId, ticket.restaurantId)))
      .orderBy(sql`${ticketMessages.createdAt} ASC`);
  }

  async updateSupportTicketForIT(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    // Update a ticket without restaurantId filtering (for IT cross-tenant access)
    // SECURITY: Strip restaurantId to prevent cross-tenant reassignment
    const { restaurantId: _, userId: __, ...safeData } = ticket;
    
    const updateData: any = Object.fromEntries(
      Object.entries(safeData).filter(([_, value]) => value !== undefined)
    );
    
    // Set timestamps for status changes
    updateData.updatedAt = new Date();
    if (ticket.status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (ticket.status === 'closed' && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }
    
    if (Object.keys(updateData).length === 0) {
      return this.getSupportTicketForIT(id);
    }
    const [updated] = await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, id)).returning();
    return updated;
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

  // Team Chat - Conversations
  async getConversations(restaurantId: string, userId: string, branchId?: string): Promise<any[]> {
    // Get all conversations where user is a member
    const userConversations = await db
      .select({
        conversation: conversations,
        member: conversationMembers,
      })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id))
      .where(
        and(
          eq(conversationMembers.userId, userId),
          eq(conversationMembers.restaurantId, restaurantId)
        )
      )
      .orderBy(sql`${conversations.lastMessageAt} DESC NULLS LAST`);

    // For each conversation, get unread count
    const conversationsWithUnread = await Promise.all(
      userConversations.map(async ({ conversation }) => {
        // Get user's last read info
        const [readInfo] = await db
          .select()
          .from(messageReads)
          .where(
            and(
              eq(messageReads.conversationId, conversation.id),
              eq(messageReads.userId, userId),
              eq(messageReads.restaurantId, restaurantId)
            )
          );

        // Count unread messages
        let unreadCount = 0;
        if (readInfo?.lastReadAt) {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.conversationId, conversation.id),
                eq(chatMessages.restaurantId, restaurantId),
                sql`${chatMessages.createdAt} > ${readInfo.lastReadAt}`
              )
            );
          unreadCount = Number(result?.count || 0);
        } else {
          // User never read, count all messages
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.conversationId, conversation.id),
                eq(chatMessages.restaurantId, restaurantId)
              )
            );
          unreadCount = Number(result?.count || 0);
        }

        // Get member count for channels
        const [memberCountResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(conversationMembers)
          .where(
            and(
              eq(conversationMembers.conversationId, conversation.id),
              eq(conversationMembers.restaurantId, restaurantId)
            )
          );
        const memberCount = Number(memberCountResult?.count || 0);

        return {
          ...conversation,
          unreadCount,
          memberCount,
        };
      })
    );

    // Filter by branch if provided
    if (branchId) {
      return conversationsWithUnread.filter(
        (c) => c.scope === "restaurant" || c.branchId === branchId
      );
    }

    return conversationsWithUnread;
  }

  async getConversation(id: string, restaurantId: string): Promise<any | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.restaurantId, restaurantId)));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation as any).returning();
    return created;
  }

  async getOrCreateDirectConversation(restaurantId: string, userId1: string, userId2: string): Promise<any> {
    // Compute deterministic participant hash (sorted user IDs joined)
    const participantHash = [userId1, userId2].sort().join(':');

    // Try to find existing DM with this participant hash
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.restaurantId, restaurantId),
          eq(conversations.type, "direct"),
          eq(conversations.participantHash, participantHash)
        )
      );

    if (existing) {
      return existing;
    }

    // Create new DM conversation with transaction safety
    // The unique index on (restaurantId, participantHash) prevents race condition duplicates
    try {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          restaurantId,
          type: "direct",
          scope: "restaurant", // DMs are always restaurant-wide
          createdBy: userId1,
          participantHash, // Store for deduplication
        } as any)
        .returning();

      // Add both users as members
      await db.insert(conversationMembers).values([
        { restaurantId, conversationId: newConversation.id, userId: userId1 } as any,
        { restaurantId, conversationId: newConversation.id, userId: userId2 } as any,
      ]);

      return newConversation;
    } catch (error: any) {
      // If unique constraint violation, another request created it concurrently
      if (error.code === '23505') { // PostgreSQL unique violation
        const [concurrent] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.restaurantId, restaurantId),
              eq(conversations.type, "direct"),
              eq(conversations.participantHash, participantHash)
            )
          );
        return concurrent;
      }
      throw error;
    }
  }

  async updateConversationLastMessage(conversationId: string, preview: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: preview.substring(0, 100),
      })
      .where(eq(conversations.id, conversationId));
  }

  // Team Chat - Messages
  async getChatMessages(conversationId: string, restaurantId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          eq(chatMessages.restaurantId, restaurantId)
        )
      )
      .orderBy(sql`${chatMessages.createdAt} DESC`)
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message as any).returning();
    
    // Update conversation's last message
    await this.updateConversationLastMessage(message.conversationId, message.content);
    
    return created;
  }

  // Team Chat - Members
  async getConversationMembers(conversationId: string, restaurantId: string): Promise<any[]> {
    return await db
      .select({
        member: conversationMembers,
        user: users,
      })
      .from(conversationMembers)
      .leftJoin(users, eq(conversationMembers.userId, users.id))
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.restaurantId, restaurantId)
        )
      );
  }

  async addConversationMember(member: InsertConversationMember): Promise<ConversationMember> {
    const [created] = await db.insert(conversationMembers).values(member as any).returning();
    return created;
  }

  async removeConversationMember(conversationId: string, userId: string, restaurantId: string): Promise<boolean> {
    const result = await db
      .delete(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
          eq(conversationMembers.restaurantId, restaurantId)
        )
      );
    return true;
  }

  async isUserInConversation(conversationId: string, userId: string, restaurantId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
          eq(conversationMembers.restaurantId, restaurantId)
        )
      );
    return !!member;
  }

  // Team Chat - Read Tracking
  async updateMessageRead(read: InsertMessageRead): Promise<void> {
    // SECURITY: Validate that the message belongs to this conversation and restaurant
    if (read.lastReadMessageId) {
      const [message] = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.id, read.lastReadMessageId),
            eq(chatMessages.conversationId, read.conversationId),
            eq(chatMessages.restaurantId, read.restaurantId)
          )
        );

      if (!message) {
        throw new Error('Message does not belong to this conversation or restaurant');
      }
    }

    // Upsert: update if exists, insert if not
    const existing = await db
      .select()
      .from(messageReads)
      .where(
        and(
          eq(messageReads.conversationId, read.conversationId),
          eq(messageReads.userId, read.userId),
          eq(messageReads.restaurantId, read.restaurantId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(messageReads)
        .set({
          lastReadMessageId: read.lastReadMessageId,
          lastReadAt: new Date(),
        })
        .where(
          and(
            eq(messageReads.conversationId, read.conversationId),
            eq(messageReads.userId, read.userId),
            eq(messageReads.restaurantId, read.restaurantId)
          )
        );
    } else {
      await db.insert(messageReads).values(read as any);
    }
  }

  async getUnreadChatCount(restaurantId: string, userId: string): Promise<number> {
    // Optimized single-query approach using SQL aggregation
    // Count all messages in user's conversations that are newer than their last read timestamp
    const [result] = await db
      .select({ totalUnread: sql<number>`COUNT(*)` })
      .from(chatMessages)
      .innerJoin(
        conversationMembers,
        and(
          eq(chatMessages.conversationId, conversationMembers.conversationId),
          eq(conversationMembers.userId, userId),
          eq(conversationMembers.restaurantId, restaurantId)
        )
      )
      .leftJoin(
        messageReads,
        and(
          eq(chatMessages.conversationId, messageReads.conversationId),
          eq(messageReads.userId, userId),
          eq(messageReads.restaurantId, restaurantId)
        )
      )
      .where(
        and(
          eq(chatMessages.restaurantId, restaurantId),
          // Message is unread if: no read record exists OR message is newer than last read time
          or(
            isNull(messageReads.lastReadAt),
            sql`${chatMessages.createdAt} > ${messageReads.lastReadAt}`
          )
        )
      );

    return Number(result?.totalUnread || 0);
  }

  // Team Chat - Default Channels
  async createDefaultChannels(restaurantId: string, createdBy: string): Promise<void> {
    const defaultChannels = [
      { name: "#general", scope: "restaurant" as const, branchId: null },
      { name: "#kitchen", scope: "restaurant" as const, branchId: null },
      { name: "#front-desk", scope: "restaurant" as const, branchId: null },
      { name: "#it-support", scope: "restaurant" as const, branchId: null },
    ];

    for (const channel of defaultChannels) {
      // Check if channel already exists
      const [existing] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.restaurantId, restaurantId),
            eq(conversations.type, "channel"),
            eq(conversations.name, channel.name)
          )
        );

      if (!existing) {
        const [newChannel] = await db
          .insert(conversations)
          .values({
            restaurantId,
            type: "channel",
            name: channel.name,
            scope: channel.scope,
            branchId: channel.branchId,
            createdBy,
          } as any)
          .returning();

        // Add creator as member
        await db.insert(conversationMembers).values({
          restaurantId,
          conversationId: newChannel.id,
          userId: createdBy,
        } as any);
      }
    }
  }

  // Team Chat - Notification Settings
  async getChatNotificationDefaults(restaurantId: string): Promise<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
  } | undefined> {
    const [result] = await db
      .select({
        chatNotificationDefaults: settings.chatNotificationDefaults,
      })
      .from(settings)
      .where(eq(settings.restaurantId, restaurantId));
    
    if (!result?.chatNotificationDefaults) {
      // Return defaults if not configured
      return {
        notificationsEnabled: true,
        soundEnabled: true,
        toneId: 'tone1',
      };
    }
    
    return {
      notificationsEnabled: result.chatNotificationDefaults.notificationsEnabled,
      soundEnabled: result.chatNotificationDefaults.soundEnabled,
      toneId: result.chatNotificationDefaults.toneId,
    };
  }

  async updateChatNotificationDefaults(restaurantId: string, defaults: {
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
    toneId?: string;
  }): Promise<void> {
    // Get existing settings
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.restaurantId, restaurantId));
    
    const currentDefaults = existing?.chatNotificationDefaults || {
      notificationsEnabled: true,
      soundEnabled: true,
      toneId: 'tone1',
      notifyScope: 'all' as const,
    };
    
    // Merge with new values
    const updated = {
      ...currentDefaults,
      ...defaults,
    };
    
    await db
      .update(settings)
      .set({
        chatNotificationDefaults: updated,
      })
      .where(eq(settings.restaurantId, restaurantId));
  }

  // Licenses implementation
  async getLicenses(restaurantId: string): Promise<License[]> {
    return await db
      .select()
      .from(licenses)
      .where(eq(licenses.restaurantId, restaurantId))
      .orderBy(desc(licenses.expiryDate));
  }

  async getLicense(id: string, restaurantId: string): Promise<License | undefined> {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.id, id),
          eq(licenses.restaurantId, restaurantId)
        )
      );
    return license;
  }

  async createLicense(license: InsertLicense): Promise<License> {
    const [created] = await db.insert(licenses).values(license).returning();
    return created;
  }

  async updateLicense(id: string, restaurantId: string, license: Partial<InsertLicense>): Promise<License | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(license).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getLicense(id, restaurantId);
    }
    const [updated] = await db
      .update(licenses)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(licenses.id, id),
          eq(licenses.restaurantId, restaurantId)
        )
      )
      .returning();
    return updated;
  }

  async deleteLicense(id: string, restaurantId: string): Promise<boolean> {
    const result = await db
      .delete(licenses)
      .where(
        and(
          eq(licenses.id, id),
          eq(licenses.restaurantId, restaurantId)
        )
      );
    return !!result;
  }

  async getExpiringLicenses(restaurantId: string, daysAhead: number): Promise<License[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.restaurantId, restaurantId),
          lte(licenses.expiryDate, futureDate),
          gte(licenses.expiryDate, new Date())
        )
      )
      .orderBy(licenses.expiryDate);
  }

  // Business Info (IT Account - singleton for BSS provider company details)
  async getBusinessInfo(): Promise<BusinessInfo | null> {
    const [info] = await db.select().from(businessInfo).limit(1);
    return info || null;
  }

  // Printers (MULTI-TENANT: SQL-level restaurantId filtering)
  async getPrinters(restaurantId: string, branchId?: string): Promise<Printer[]> {
    const conditions = [eq(printers.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(printers.branchId, branchId));
    }
    return await db
      .select()
      .from(printers)
      .where(and(...conditions))
      .orderBy(desc(printers.isDefault), printers.name);
  }

  async getPrinter(id: string, restaurantId: string): Promise<Printer | undefined> {
    const [printer] = await db
      .select()
      .from(printers)
      .where(and(eq(printers.id, id), eq(printers.restaurantId, restaurantId)));
    return printer;
  }

  async createPrinter(printer: InsertPrinter): Promise<Printer> {
    const [created] = await db.insert(printers).values(printer).returning();
    return created;
  }

  async updatePrinter(id: string, restaurantId: string, printer: Partial<InsertPrinter>): Promise<Printer | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(printer).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getPrinter(id, restaurantId);
    }
    const [updated] = await db
      .update(printers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(printers.id, id), eq(printers.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  async deletePrinter(id: string, restaurantId: string): Promise<boolean> {
    const result = await db
      .delete(printers)
      .where(and(eq(printers.id, id), eq(printers.restaurantId, restaurantId)));
    return !!result;
  }

  async setDefaultPrinter(id: string, restaurantId: string, branchId?: string): Promise<Printer | undefined> {
    // First, unset all defaults for this restaurant/branch
    const unsetConditions = [eq(printers.restaurantId, restaurantId)];
    if (branchId) {
      unsetConditions.push(eq(printers.branchId, branchId));
    }
    await db
      .update(printers)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(...unsetConditions));

    // Then set the specified printer as default
    const [updated] = await db
      .update(printers)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(printers.id, id), eq(printers.restaurantId, restaurantId)))
      .returning();
    return updated;
  }

  // ZATCA Settings
  async getZatcaSettings(restaurantId: string): Promise<ZatcaSettings | undefined> {
    const [settings] = await db
      .select()
      .from(zatcaSettings)
      .where(eq(zatcaSettings.restaurantId, restaurantId));
    return settings;
  }

  async createZatcaSettings(settings: InsertZatcaSettings): Promise<ZatcaSettings> {
    const [created] = await db.insert(zatcaSettings).values(settings).returning();
    return created;
  }

  async updateZatcaSettings(restaurantId: string, settings: Partial<InsertZatcaSettings>): Promise<ZatcaSettings | undefined> {
    const [updated] = await db
      .update(zatcaSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(zatcaSettings.restaurantId, restaurantId))
      .returning();
    return updated;
  }

  async incrementInvoiceCounter(restaurantId: string, lastHash: string): Promise<{ counter: number; previousHash: string | null }> {
    // Get current settings
    const current = await this.getZatcaSettings(restaurantId);
    if (!current) {
      throw new Error("ZATCA settings not found for restaurant");
    }
    
    const previousHash = current.lastInvoiceHash;
    const newCounter = current.lastInvoiceCounter + 1;
    
    // Update counter and hash atomically
    await db
      .update(zatcaSettings)
      .set({ 
        lastInvoiceCounter: newCounter, 
        lastInvoiceHash: lastHash,
        updatedAt: new Date() 
      })
      .where(eq(zatcaSettings.restaurantId, restaurantId));
    
    return { counter: newCounter, previousHash };
  }

  // ZATCA Invoice Status
  async getInvoiceZatcaStatuses(restaurantId: string, status?: string): Promise<InvoiceZatcaStatus[]> {
    const conditions = [eq(invoiceZatcaStatus.restaurantId, restaurantId)];
    if (status) {
      conditions.push(eq(invoiceZatcaStatus.submissionStatus, status));
    }
    return db
      .select()
      .from(invoiceZatcaStatus)
      .where(and(...conditions))
      .orderBy(desc(invoiceZatcaStatus.createdAt));
  }

  async getInvoiceZatcaStatus(invoiceId: string, restaurantId: string): Promise<InvoiceZatcaStatus | undefined> {
    const [status] = await db
      .select()
      .from(invoiceZatcaStatus)
      .where(and(
        eq(invoiceZatcaStatus.invoiceId, invoiceId),
        eq(invoiceZatcaStatus.restaurantId, restaurantId)
      ));
    return status;
  }

  async createInvoiceZatcaStatus(status: InsertInvoiceZatcaStatus): Promise<InvoiceZatcaStatus> {
    const [created] = await db.insert(invoiceZatcaStatus).values(status as any).returning();
    return created;
  }

  async updateInvoiceZatcaStatus(invoiceId: string, restaurantId: string, status: Partial<InsertInvoiceZatcaStatus>): Promise<InvoiceZatcaStatus | undefined> {
    const [updated] = await db
      .update(invoiceZatcaStatus)
      .set(status as any)
      .where(and(
        eq(invoiceZatcaStatus.invoiceId, invoiceId),
        eq(invoiceZatcaStatus.restaurantId, restaurantId)
      ))
      .returning();
    return updated;
  }

  // Shop Files (MULTI-TENANT: requires restaurantId)
  async getShopFiles(restaurantId: string): Promise<ShopFile[]> {
    return db
      .select()
      .from(shopFiles)
      .where(eq(shopFiles.restaurantId, restaurantId))
      .orderBy(desc(shopFiles.createdAt));
  }

  async getShopFile(id: string, restaurantId: string): Promise<ShopFile | undefined> {
    const [file] = await db
      .select()
      .from(shopFiles)
      .where(and(eq(shopFiles.id, id), eq(shopFiles.restaurantId, restaurantId)));
    return file;
  }

  async getShopFileByType(restaurantId: string, fileType: string): Promise<ShopFile | undefined> {
    const [file] = await db
      .select()
      .from(shopFiles)
      .where(and(eq(shopFiles.restaurantId, restaurantId), eq(shopFiles.fileType, fileType)));
    return file;
  }

  async createShopFile(file: InsertShopFile): Promise<ShopFile> {
    const [created] = await db.insert(shopFiles).values(file).returning();
    return created;
  }

  async deleteShopFile(id: string, restaurantId: string): Promise<boolean> {
    const result = await db
      .delete(shopFiles)
      .where(and(eq(shopFiles.id, id), eq(shopFiles.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Company Files (IT Account only - global company documents)
  async getCompanyFiles(): Promise<CompanyFile[]> {
    return db
      .select()
      .from(companyFiles)
      .orderBy(desc(companyFiles.createdAt));
  }

  async getCompanyFile(id: string): Promise<CompanyFile | undefined> {
    const [file] = await db
      .select()
      .from(companyFiles)
      .where(eq(companyFiles.id, id));
    return file;
  }

  async getCompanyFilesByType(fileType: string): Promise<CompanyFile[]> {
    return db
      .select()
      .from(companyFiles)
      .where(eq(companyFiles.fileType, fileType))
      .orderBy(desc(companyFiles.createdAt));
  }

  async createCompanyFile(file: InsertCompanyFile): Promise<CompanyFile> {
    const [created] = await db.insert(companyFiles).values(file).returning();
    return created;
  }

  async deleteCompanyFile(id: string): Promise<boolean> {
    const result = await db
      .delete(companyFiles)
      .where(eq(companyFiles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pending Signups (for Geidea payment flow)
  async createPendingSignup(signup: InsertPendingSignup): Promise<PendingSignup> {
    const [result] = await db.insert(pendingSignups).values(signup).returning();
    return result;
  }

  async getPendingSignupBySessionId(geideaSessionId: string): Promise<PendingSignup | undefined> {
    const [result] = await db.select().from(pendingSignups).where(eq(pendingSignups.geideaSessionId, geideaSessionId));
    return result;
  }

  async updatePendingSignupStatus(id: string, status: string): Promise<void> {
    await db.update(pendingSignups).set({ status }).where(eq(pendingSignups.id, id));
  }

  async deletePendingSignup(id: string): Promise<void> {
    await db.delete(pendingSignups).where(eq(pendingSignups.id, id));
  }
}

export const storage = new DatabaseStorage();
