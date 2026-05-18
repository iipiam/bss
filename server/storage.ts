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
  type MenuCategory,
  type InsertMenuCategory,
  type DeviceSerialNumber,
  type InsertDeviceSerialNumber,
  type Contract,
  type InsertContract,
  type Valuation,
  type InsertValuation,
  restaurants,
  deviceSerialNumbers,
  pendingSignups,
  branches,
  inventoryItems,
  menuItems,
  menuCategories,
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
  inventoryTransactions,
  contracts,
  valuations,
  type ServiceCatalogItem,
  type InsertServiceCatalogItem,
  serviceCatalog,
  type Contractor,
  type InsertContractor,
  contractors,
  type ServiceProject,
  type InsertServiceProject,
  serviceProjects,
  type Quotation,
  type InsertQuotation,
  quotations,
  type PaymentSchedule,
  type InsertPaymentSchedule,
  paymentSchedules,
  type ProjectService,
  type InsertProjectService,
  projectServices,
  type ProjectBill,
  type InsertProjectBill,
  projectBills,
  type ProjectProcurement,
  type InsertProjectProcurement,
  projectProcurements,
  type ProjectTask,
  type InsertProjectTask,
  projectTasks,
  type QuotationDecision,
  type InsertQuotationDecision,
  quotationDecisions,
  type CompanySettings,
  type InsertCompanySettings,
  companySettings,
  type MealSubscription,
  type InsertMealSubscription,
  mealSubscriptions,
  type CateringContract,
  type InsertCateringContract,
  cateringContracts,
  type CateringContractTemplate,
  type InsertCateringContractTemplate,
  cateringContractTemplates,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, lt, sql, or, isNull, isNotNull, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

  // Device Serial Numbers (EGS for ZATCA)
  getDeviceSerialNumbers(restaurantId: string): Promise<DeviceSerialNumber[]>;
  getDeviceSerialNumber(id: string, restaurantId: string): Promise<DeviceSerialNumber | undefined>;
  createDeviceSerialNumber(serial: InsertDeviceSerialNumber): Promise<DeviceSerialNumber>;
  generateDeviceSerialNumbers(restaurantId: string, branchesCount: number, commercialRegistration: string): Promise<DeviceSerialNumber[]>;

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

  // Menu Categories (MULTI-TENANT: requires restaurantId for all operations)
  getMenuCategories(restaurantId: string): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: string, restaurantId: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined>;
  deleteMenuCategory(id: string, restaurantId: string): Promise<boolean>;

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
  syncSalariesFromEmployees(restaurantId: string): Promise<{ synced: number; created: number; updated: number }>;

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
  getPendingSignupById(id: string): Promise<PendingSignup | undefined>;
  updatePendingSignupStatus(id: string, status: string): Promise<void>;
  deletePendingSignup(id: string): Promise<void>;
  
  // Subscription status management
  getExpiredSubscriptions(): Promise<Restaurant[]>;
  updateRestaurantSubscriptionStatus(id: string, status: string): Promise<void>;

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

  // Contracts (MULTI-TENANT: requires restaurantId for all operations)
  getContracts(restaurantId: string): Promise<Contract[]>;
  getContract(id: string, restaurantId: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, restaurantId: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string, restaurantId: string): Promise<boolean>;

  // Valuations (MULTI-TENANT: requires restaurantId for all operations)
  getValuations(restaurantId: string): Promise<Valuation[]>;
  getValuation(id: string, restaurantId: string): Promise<Valuation | undefined>;
  createValuation(valuation: InsertValuation): Promise<Valuation>;
  updateValuation(id: string, restaurantId: string, valuation: Partial<InsertValuation>): Promise<Valuation | undefined>;
  deleteValuation(id: string, restaurantId: string): Promise<boolean>;

  // Service Catalog (MULTI-TENANT: requires restaurantId for all operations)
  getServiceCatalogItems(restaurantId: string): Promise<ServiceCatalogItem[]>;
  getServiceCatalogItem(id: string, restaurantId: string): Promise<ServiceCatalogItem | undefined>;
  createServiceCatalogItem(item: InsertServiceCatalogItem): Promise<ServiceCatalogItem>;
  updateServiceCatalogItem(id: string, restaurantId: string, item: Partial<InsertServiceCatalogItem>): Promise<ServiceCatalogItem | undefined>;
  deleteServiceCatalogItem(id: string, restaurantId: string): Promise<boolean>;

  // Contractors (MULTI-TENANT: requires restaurantId for all operations)
  getContractors(restaurantId: string): Promise<Contractor[]>;
  getContractor(id: string, restaurantId: string): Promise<Contractor | undefined>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: string, restaurantId: string, contractor: Partial<InsertContractor>): Promise<Contractor | undefined>;
  deleteContractor(id: string, restaurantId: string): Promise<boolean>;

  // Service Projects (MULTI-TENANT: requires restaurantId for all operations)
  getServiceProjects(restaurantId: string): Promise<ServiceProject[]>;
  getServiceProject(id: string, restaurantId: string): Promise<ServiceProject | undefined>;
  createServiceProject(project: InsertServiceProject): Promise<ServiceProject>;
  updateServiceProject(id: string, restaurantId: string, project: Partial<InsertServiceProject>): Promise<ServiceProject | undefined>;
  deleteServiceProject(id: string, restaurantId: string): Promise<boolean>;

  // Quotations (MULTI-TENANT: requires restaurantId for all operations)
  getQuotations(restaurantId: string): Promise<Quotation[]>;
  getQuotation(id: string, restaurantId: string): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, restaurantId: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: string, restaurantId: string): Promise<boolean>;

  // Payment Schedules (MULTI-TENANT: requires restaurantId for all operations)
  getPaymentSchedules(restaurantId: string, projectId?: string): Promise<PaymentSchedule[]>;
  getPaymentSchedule(id: string, restaurantId: string): Promise<PaymentSchedule | undefined>;
  createPaymentSchedule(schedule: InsertPaymentSchedule): Promise<PaymentSchedule>;
  updatePaymentSchedule(id: string, restaurantId: string, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule | undefined>;
  deletePaymentSchedule(id: string, restaurantId: string): Promise<boolean>;

  // Project Services
  getProjectServices(restaurantId: string, projectId: string): Promise<ProjectService[]>;
  createProjectService(service: InsertProjectService): Promise<ProjectService>;
  updateProjectService(id: string, restaurantId: string, data: Partial<InsertProjectService>): Promise<ProjectService | undefined>;
  deleteProjectService(id: string, restaurantId: string): Promise<boolean>;

  // Project Bills
  getProjectBills(restaurantId: string, projectId: string): Promise<ProjectBill[]>;
  createProjectBill(bill: InsertProjectBill): Promise<ProjectBill>;
  updateProjectBill(id: string, restaurantId: string, data: Partial<InsertProjectBill>): Promise<ProjectBill | undefined>;
  deleteProjectBill(id: string, restaurantId: string): Promise<boolean>;

  // Project Procurements
  getProjectProcurements(restaurantId: string, projectId: string): Promise<ProjectProcurement[]>;
  createProjectProcurement(procurement: InsertProjectProcurement): Promise<ProjectProcurement>;
  updateProjectProcurement(id: string, restaurantId: string, data: Partial<InsertProjectProcurement>): Promise<ProjectProcurement | undefined>;
  deleteProjectProcurement(id: string, restaurantId: string): Promise<boolean>;

  // Project Tasks
  getProjectTasks(restaurantId: string, projectId: string): Promise<ProjectTask[]>;
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: string, restaurantId: string, data: Partial<InsertProjectTask>): Promise<ProjectTask | undefined>;
  deleteProjectTask(id: string, restaurantId: string): Promise<boolean>;

  // Quotation Decisions
  getQuotationDecisions(restaurantId: string, quotationId: string): Promise<QuotationDecision[]>;
  createQuotationDecision(decision: InsertQuotationDecision): Promise<QuotationDecision>;

  // Company Settings
  getCompanySettings(restaurantId: string): Promise<CompanySettings | undefined>;
  upsertCompanySettings(restaurantId: string, data: Partial<InsertCompanySettings>): Promise<CompanySettings>;

  // Meal Subscriptions (MULTI-TENANT: requires restaurantId)
  getMealSubscriptions(restaurantId: string, status?: string): Promise<MealSubscription[]>;
  getMealSubscription(id: string, restaurantId: string): Promise<MealSubscription | undefined>;
  getTodaysMealDeliveries(restaurantId: string): Promise<MealSubscription[]>;
  createMealSubscription(subscription: InsertMealSubscription): Promise<MealSubscription>;
  updateMealSubscription(id: string, restaurantId: string, subscription: Partial<InsertMealSubscription> & { deliveryLog?: unknown[] }): Promise<MealSubscription | undefined>;
  deleteMealSubscription(id: string, restaurantId: string): Promise<boolean>;

  // Catering Contracts (MULTI-TENANT)
  getCateringContracts(restaurantId: string): Promise<CateringContract[]>;
  getCateringContract(id: string, restaurantId: string): Promise<CateringContract | undefined>;
  createCateringContract(contract: InsertCateringContract): Promise<CateringContract>;
  updateCateringContract(id: string, restaurantId: string, contract: Partial<InsertCateringContract>): Promise<CateringContract | undefined>;
  deleteCateringContract(id: string, restaurantId: string): Promise<boolean>;

  // Catering Contract Templates (MULTI-TENANT)
  getCateringContractTemplates(restaurantId: string): Promise<CateringContractTemplate[]>;
  getCateringContractTemplate(id: string, restaurantId: string): Promise<CateringContractTemplate | undefined>;
  createCateringContractTemplate(template: InsertCateringContractTemplate): Promise<CateringContractTemplate>;
  updateCateringContractTemplate(id: string, restaurantId: string, template: Partial<InsertCateringContractTemplate>): Promise<CateringContractTemplate | undefined>;
  deleteCateringContractTemplate(id: string, restaurantId: string): Promise<boolean>;
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

  // Device Serial Numbers (EGS for ZATCA)
  async getDeviceSerialNumbers(restaurantId: string): Promise<DeviceSerialNumber[]> {
    return await db.select().from(deviceSerialNumbers).where(eq(deviceSerialNumbers.restaurantId, restaurantId)).orderBy(deviceSerialNumbers.branchNumber);
  }

  async getDeviceSerialNumber(id: string, restaurantId: string): Promise<DeviceSerialNumber | undefined> {
    const [serial] = await db.select().from(deviceSerialNumbers).where(and(eq(deviceSerialNumbers.id, id), eq(deviceSerialNumbers.restaurantId, restaurantId)));
    return serial;
  }

  async createDeviceSerialNumber(serial: InsertDeviceSerialNumber): Promise<DeviceSerialNumber> {
    const [created] = await db.insert(deviceSerialNumbers).values(serial).returning();
    return created;
  }

  async generateDeviceSerialNumbers(restaurantId: string, branchesCount: number, commercialRegistration: string): Promise<DeviceSerialNumber[]> {
    // Generate all serial numbers according to ZATCA EGS specification
    // Format: 1-{CR}|2-{Model-Version}|3-{UUID}
    // - Segment 1: Commercial Registration number (identifies the taxpayer)
    // - Segment 2: Certified device model/version (fixed for all branches)
    // - Segment 3: Unique UUID for each device instance
    // Branch association is stored in branchNumber column, NOT in the serial
    
    const certifiedModel = "Standard";
    const certifiedVersion = "1.0";
    const solutionName = "BSS-POS"; // Certified product name
    
    const serialsToInsert = [];
    
    for (let i = 1; i <= branchesCount; i++) {
      const uuid = crypto.randomUUID();
      // ZATCA compliant EGS Serial Number format
      const serialNumber = `1-${commercialRegistration}|2-${certifiedModel}-${certifiedVersion}|3-${uuid}`;
      
      serialsToInsert.push({
        restaurantId,
        branchId: null, // Will be linked when branch is created
        branchNumber: i,
        serialNumber,
        solutionName,
        model: certifiedModel,
        version: certifiedVersion,
        isActive: true,
      });
    }
    
    // Bulk insert all serial numbers in a single statement (atomic operation)
    const created = await db.insert(deviceSerialNumbers).values(serialsToInsert).returning();
    return created;
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
    try {
      const [created] = await db.insert(inventoryItems).values(item).returning();
      return created;
    } catch (error: any) {
      if (error.message?.includes('unit_price')) {
        console.log('[Inventory] createInventoryItem: unit_price column not found, using fallback insert');
        
        // Calculate unit price from price and quantity
        const quantity = parseFloat(item.quantity || '0');
        const price = parseFloat(item.price || '0');
        const calculatedUnitPrice = quantity > 0 ? (price / quantity).toFixed(2) : '0';
        
        // Insert without unit_price column
        const newId = crypto.randomUUID();
        const result = await db.execute(sql`
          INSERT INTO inventory_items (
            id, restaurant_id, name, category, quantity, unit, 
            reference_quantity, price, supplier, status, branch_id, 
            sort_order, expiration_days, purchase_date
          ) VALUES (
            ${newId}, ${item.restaurantId}, ${item.name}, ${item.category || null},
            ${item.quantity || '0'}, ${item.unit || null}, ${item.referenceQuantity || null}, 
            ${item.price || '0'}, ${item.supplier || null}, ${item.status || 'in_stock'}, 
            ${item.branchId || null}, ${item.sortOrder || 0}, ${item.expirationDays || null}, 
            ${item.purchaseDate || null}
          )
          RETURNING id, restaurant_id as "restaurantId", name, category, quantity, unit, 
            reference_quantity as "referenceQuantity", price, supplier, status, 
            branch_id as "branchId", sort_order as "sortOrder", 
            expiration_days as "expirationDays", purchase_date as "purchaseDate"
        `);
        
        const created = (result as any).rows?.[0];
        if (created) {
          created.unitPrice = calculatedUnitPrice;
        }
        return created;
      }
      throw error;
    }
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
    // First delete related inventory transactions to avoid FK constraint violation
    await db.delete(inventoryTransactions)
      .where(and(eq(inventoryTransactions.inventoryItemId, id), eq(inventoryTransactions.restaurantId, restaurantId)));
    
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
    // OPTIMIZATION: Batch fetch all data upfront to avoid N+1 queries
    const [allMenuItems, inventory, allRecipes] = await Promise.all([
      this.getMenuItems(restaurantId),
      this.getInventoryItems(restaurantId, branchId),
      this.getRecipes(restaurantId)
    ]);
    
    // Create lookup maps for O(1) access instead of O(n) find() calls
    const inventoryMap = new Map(inventory.map(item => [item.id, item]));
    // Create name-based lookup for fallback when ID doesn't match (handles recreated inventory)
    const inventoryByNameMap = new Map(inventory.map(item => [item.name.toLowerCase(), item]));
    const recipeMap = new Map(allRecipes.map(recipe => [recipe.id, recipe]));
    
    const stock: Record<string, number> = {};
    
    // For each menu item, calculate stock based on its recipe OR direct inventory link
    for (const menuItem of allMenuItems) {
      // CASE 1: Menu item has a direct inventory link (no recipe needed)
      if (menuItem.inventoryItemId && !menuItem.recipeId) {
        const inventoryItem = inventoryMap.get(menuItem.inventoryItemId);
        
        if (!inventoryItem) {
          stock[menuItem.id] = 0;
          continue;
        }
        
        const availableQuantity = parseFloat(String(inventoryItem.quantity || '0')) || 0;
        const quantityPerSale = parseFloat(String(menuItem.stockNo || '1')) || 1;
        
        if (quantityPerSale > 0) {
          stock[menuItem.id] = Math.max(0, Math.floor(availableQuantity / quantityPerSale));
        } else {
          stock[menuItem.id] = 999999;
        }
        continue;
      }
      
      // CASE 2: Menu item has no recipe and no inventory link - infinite stock
      if (!menuItem.recipeId) {
        stock[menuItem.id] = 999999;
        continue;
      }
      
      // CASE 3: Menu item has a recipe - calculate based on recipe ingredients
      const recipe = recipeMap.get(menuItem.recipeId);
      if (!recipe) {
        stock[menuItem.id] = 999999;
        continue;
      }
      
      // Calculate how many servings we can make based on available inventory
      let minServings = Infinity;
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      
      // CRITICAL: Apply portion size multiplier (e.g., 0.25 for 1/4 portion)
      const portionMultiplier = parseFloat(String(menuItem.portionSize || '1.00')) || 1;
      
      for (const ingredient of ingredients as any[]) {
        if (!ingredient || !ingredient.inventoryItemId) continue;
        
        // First try by ID, then fallback to name (handles recreated inventory items)
        let inventoryItem = inventoryMap.get(ingredient.inventoryItemId);
        if (!inventoryItem && ingredient.name) {
          inventoryItem = inventoryByNameMap.get(ingredient.name.toLowerCase());
        }
        
        if (!inventoryItem) {
          minServings = 0;
          break;
        }
        
        const availableQuantity = parseFloat(String(inventoryItem.quantity || '0')) || 0;
        const baseRequiredQuantity = parseFloat(String(ingredient.quantity || '0')) || 0;
        // Apply portion size multiplier to get actual required quantity per serving
        const requiredQuantity = baseRequiredQuantity * portionMultiplier;
        
        if (requiredQuantity > 0 && !isNaN(availableQuantity)) {
          const possibleServings = Math.floor(availableQuantity / requiredQuantity);
          if (!isNaN(possibleServings) && possibleServings >= 0) {
            minServings = Math.min(minServings, possibleServings);
          } else {
            minServings = 0;
          }
        }
      }
      
      stock[menuItem.id] = minServings === Infinity ? 999999 : (isNaN(minServings) || minServings < 0 ? 0 : minServings);
    }
    
    return stock;
  }

  // Menu Categories (MULTI-TENANT: SQL-level restaurantId filtering)
  // Note: Fallback handling for when menu_categories table doesn't exist (pre-migration)
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    try {
      return await db.select().from(menuCategories).where(eq(menuCategories.restaurantId, restaurantId));
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('menu_categories')) {
        console.warn('[MenuCategories] Table does not exist, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    try {
      const [created] = await db.insert(menuCategories).values(category).returning();
      return created;
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('menu_categories')) {
        console.warn('[MenuCategories] Table does not exist, cannot create category');
        throw new Error('Menu categories feature requires database migration. Please run npm run db:push on production.');
      }
      throw error;
    }
  }

  async updateMenuCategory(id: string, restaurantId: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    try {
      const { restaurantId: _, ...safeData } = category;
      const updateData = Object.fromEntries(
        Object.entries(safeData).filter(([_, value]) => value !== undefined)
      );
      if (Object.keys(updateData).length === 0) {
        const [existing] = await db.select().from(menuCategories)
          .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)));
        return existing;
      }
      const [updated] = await db.update(menuCategories).set(updateData)
        .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)))
        .returning();
      return updated;
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('menu_categories')) {
        console.warn('[MenuCategories] Table does not exist, cannot update category');
        return undefined;
      }
      throw error;
    }
  }

  async deleteMenuCategory(id: string, restaurantId: string): Promise<boolean> {
    try {
      const result = await db.delete(menuCategories)
        .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('menu_categories')) {
        console.warn('[MenuCategories] Table does not exist, cannot delete category');
        return false;
      }
      throw error;
    }
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
    
    try {
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
    } catch (error: any) {
      // Handle case where b2b_invoice_sequence column doesn't exist yet (pre-migration)
      if (error.message?.includes('b2b_invoice_sequence')) {
        console.warn('[Settings] b2b_invoice_sequence column not found, using fallback update');
        
        if (existing) {
          // Build dynamic UPDATE for columns that exist in production
          const updateParts: string[] = [];
          const columnMap: Record<string, string> = {
            restaurantName: 'restaurant_name',
            vatNumber: 'vat_number',
            address: 'address',
            email: 'email',
            phone: 'phone',
            language: 'language',
            openingTime: 'opening_time',
            closingTime: 'closing_time',
            logoPath: 'logo_path',
            notificationTone: 'notification_tone',
            chatNotificationDefaults: 'chat_notification_defaults',
          };
          
          Object.entries(safeData).forEach(([key, value]) => {
            if (value !== undefined && columnMap[key]) {
              const colName = columnMap[key];
              const escapedValue = typeof value === 'string' 
                ? `'${value.replace(/'/g, "''")}'` 
                : value === null ? 'NULL' : JSON.stringify(value);
              updateParts.push(`${colName} = ${escapedValue}`);
            }
          });
          
          if (updateParts.length > 0) {
            await db.execute(sql.raw(
              `UPDATE settings SET ${updateParts.join(', ')} WHERE id = '${existing.id}' AND restaurant_id = '${restaurantId}'`
            ));
          }
        }
        
        // Return updated settings using the fallback getSettings
        const updated = await this.getSettings(restaurantId);
        return updated!;
      }
      throw error;
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
      if (error.message?.includes('column "inventory_item_id"') || error.message?.includes('column "original_procurement_id"') || error.message?.includes('column "unit" does not exist')) {
        console.log('[Procurement] New columns not found, using fallback query (add columns with ALTER TABLE)');
        // Build SQL with template literals for proper parameter handling
        // Note: Returns NULL for inventoryItemId/originalProcurementId/unit for backward compatibility
        const baseQuery = sql`SELECT id, restaurant_id as "restaurantId", type, title, description, supplier, category, 
          quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority, 
          requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId", 
          order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery", 
          notes, invoice_image as "invoiceImage", bill_id as "billId", 
          NULL as "inventoryItemId", NULL as "originalProcurementId", NULL as "unit",
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
      if (error.message?.includes('column "inventory_item_id"') || error.message?.includes('column "original_procurement_id"') || error.message?.includes('column "unit" does not exist')) {
        console.log('[Procurement] getProcurement: New columns not found, using fallback query (add columns with ALTER TABLE)');
        // Note: Returns NULL for inventoryItemId/originalProcurementId/unit for backward compatibility
        const result = await db.execute(sql`SELECT id, restaurant_id as "restaurantId", type, title, description, supplier, category, 
          quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority, 
          requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId", 
          order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery", 
          notes, invoice_image as "invoiceImage", bill_id as "billId", 
          NULL as "inventoryItemId", NULL as "originalProcurementId", NULL as "unit",
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

  async updateProcurement(id: string, restaurantId: string, procurementData: Partial<InsertProcurement> & { billId?: string | null; inventoryItemId?: string | null; originalProcurementId?: string | null }): Promise<Procurement | undefined> {
    // SECURITY: Defensively strip restaurantId to prevent cross-tenant reassignment
    // Note: inventoryItemId and originalProcurementId are now allowed for linking
    const { restaurantId: _, ...safeData } = procurementData as any;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([key, value]) => value !== undefined || key === 'billId' || key === 'inventoryItemId')
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
      if (error.message?.includes('column "inventory_item_id"') || error.message?.includes('column "original_procurement_id"') || error.message?.includes('column "unit" does not exist')) {
        console.log('[Procurement] updateProcurement: New columns not found, using fallback update');
        // Build dynamic SET clause only for fields that are defined
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (updateData.type !== undefined) { setClauses.push(`type = $${paramIndex++}`); values.push(updateData.type); }
        if (updateData.title !== undefined) { setClauses.push(`title = $${paramIndex++}`); values.push(updateData.title); }
        if (updateData.description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(updateData.description); }
        if (updateData.supplier !== undefined) { setClauses.push(`supplier = $${paramIndex++}`); values.push(updateData.supplier); }
        if (updateData.category !== undefined) { setClauses.push(`category = $${paramIndex++}`); values.push(updateData.category); }
        if (updateData.quantity !== undefined) { setClauses.push(`quantity = $${paramIndex++}`); values.push(updateData.quantity); }
        if (updateData.unitPrice !== undefined) { setClauses.push(`unit_price = $${paramIndex++}`); values.push(updateData.unitPrice); }
        if (updateData.totalCost !== undefined) { setClauses.push(`total_cost = $${paramIndex++}`); values.push(updateData.totalCost); }
        if (updateData.status !== undefined) { setClauses.push(`status = $${paramIndex++}`); values.push(updateData.status); }
        if (updateData.priority !== undefined) { setClauses.push(`priority = $${paramIndex++}`); values.push(updateData.priority); }
        if (updateData.requestedBy !== undefined) { setClauses.push(`requested_by = $${paramIndex++}`); values.push(updateData.requestedBy); }
        if (updateData.approvedBy !== undefined) { setClauses.push(`approved_by = $${paramIndex++}`); values.push(updateData.approvedBy); }
        if (updateData.notes !== undefined) { setClauses.push(`notes = $${paramIndex++}`); values.push(updateData.notes); }
        if (updateData.invoiceImage !== undefined) { setClauses.push(`invoice_image = $${paramIndex++}`); values.push(updateData.invoiceImage); }
        if ('billId' in updateData) { setClauses.push(`bill_id = $${paramIndex++}`); values.push(updateData.billId); }
        
        setClauses.push(`updated_at = NOW()`);
        
        const setClause = setClauses.join(', ');
        values.push(id, restaurantId);
        
        const result = await pool.query(`
          UPDATE procurement SET ${setClause}
          WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex}
          RETURNING id, restaurant_id as "restaurantId", type, title, description, supplier, category,
            quantity, unit_price as "unitPrice", total_cost as "totalCost", status, priority,
            requested_by as "requestedBy", approved_by as "approvedBy", branch_id as "branchId",
            order_date as "orderDate", expected_delivery as "expectedDelivery", actual_delivery as "actualDelivery",
            notes, invoice_image as "invoiceImage", bill_id as "billId",
            NULL as "inventoryItemId", NULL as "originalProcurementId",
            created_at as "createdAt", updated_at as "updatedAt"
        `, values);
        return result.rows?.[0];
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
      // Handle case where columns don't exist yet (pre-migration)
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[Invoices] Column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", NULL as "documentType",
                 NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                 transaction_id as "transactionId",
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
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[Invoices] Column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", NULL as "documentType",
                 NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                 transaction_id as "transactionId",
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
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[Invoices] Column not found, using fallback query for public access');
        // Try by orderId first
        let result = await db.execute(sql`
          SELECT id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                 invoice_type as "invoiceType", 'invoice' as "documentType",
                 NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                 transaction_id as "transactionId",
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
                 invoice_type as "invoiceType", 'invoice' as "documentType",
                 NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                 transaction_id as "transactionId",
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
      // Handle case where columns don't exist yet (pre-migration)
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[Invoices] Column not found, using fallback INSERT');
        const { procurementId, documentType, referencedInvoiceId, adjustmentReason, ...invoiceBase } = invoice as any;
        const result = await db.execute(sql`
          INSERT INTO invoices (restaurant_id, invoice_number, invoice_type, transaction_id, order_id, branch_id,
                               customer_name, customer_vat_number, items, subtotal, vat_amount, total, qr_code, pdf_path)
          VALUES (${invoiceBase.restaurantId}, ${invoiceBase.invoiceNumber}, 
                  ${invoiceBase.invoiceType || 'simplified'}, ${invoiceBase.transactionId || null},
                  ${invoiceBase.orderId || null}, ${invoiceBase.branchId || null},
                  ${invoiceBase.customerName || null}, ${invoiceBase.customerVatNumber || null},
                  ${JSON.stringify(invoiceBase.items)}, ${invoiceBase.subtotal},
                  ${invoiceBase.vatAmount}, ${invoiceBase.total},
                  ${invoiceBase.qrCode || ''}, ${invoiceBase.pdfPath || ''})
          RETURNING id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                    invoice_type as "invoiceType", 'invoice' as "documentType",
                    NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                    transaction_id as "transactionId",
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
      // Handle case where columns don't exist yet (pre-migration)
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[Invoices] Column not found, using fallback UPDATE');
        // Simple update for common fields
        const result = await db.execute(sql`
          UPDATE invoices SET qr_code = ${updateData.qrCode || null}, pdf_path = ${updateData.pdfPath || null}
          WHERE id = ${id} AND restaurant_id = ${restaurantId}
          RETURNING id, restaurant_id as "restaurantId", invoice_number as "invoiceNumber",
                    invoice_type as "invoiceType", 'invoice' as "documentType",
                    NULL as "referencedInvoiceId", NULL as "adjustmentReason",
                    transaction_id as "transactionId",
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
    try {
      const [updated] = await db.update(salaries)
        .set(updateData)
        .where(eq(salaries.id, id))
        .returning();
      return updated;
    } catch (error: any) {
      // Handle missing columns with raw SQL fallback
      if (error.message?.includes('does not exist') || error.code === '42703') {
        console.log('[Salary] Column not found, using fallback update');
        // Use simple SQL update with core columns only
        const result = await db.execute(sql`
          UPDATE salaries 
          SET employee_name = COALESCE(${updateData.employeeName}, employee_name),
              position = COALESCE(${updateData.position}, position),
              amount = COALESCE(${updateData.amount}, amount),
              payment_date = COALESCE(${updateData.paymentDate}, payment_date),
              status = COALESCE(${updateData.status}, status),
              branch_id = COALESCE(${updateData.branchId}, branch_id)
          WHERE id = ${id}
          RETURNING id, restaurant_id as "restaurantId", employee_name as "employeeName", 
                    position, amount, payment_date as "paymentDate", status, 
                    branch_id as "branchId", created_at as "createdAt"
        `);
        
        return result.rows[0] as Salary;
      }
      throw error;
    }
  }

  async deleteSalary(id: string): Promise<boolean> {
    const result = await db.delete(salaries).where(eq(salaries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async syncSalariesFromEmployees(restaurantId: string): Promise<{ synced: number; created: number; updated: number }> {
    try {
      // Get all active employees with a salary for this restaurant
      const employees = await db.select().from(users).where(
        and(
          eq(users.restaurantId, restaurantId),
          eq(users.active, true),
          isNotNull(users.salary)
        )
      );

      // Get existing salary records
      const existingSalaries = await this.getSalaries(restaurantId);
      
      // Create a map of existing salaries by employee name
      const salaryMap = new Map<string, Salary>();
      for (const sal of existingSalaries) {
        salaryMap.set(sal.employeeName, sal);
      }

      let created = 0;
      let updated = 0;
      const today = new Date();

      for (const employee of employees) {
        if (!employee.salary || parseFloat(employee.salary) <= 0) {
          continue;
        }

        const existing = salaryMap.get(employee.fullName);
        
        if (existing) {
          // Update existing salary record if amount changed
          if (existing.amount !== employee.salary) {
            await this.updateSalary(existing.id, {
              amount: employee.salary,
              position: employee.position || 'Employee',
              branchId: employee.branchId || undefined,
            });
            updated++;
          }
        } else {
          // Create new salary record
          await this.createSalary({
            restaurantId,
            employeeName: employee.fullName,
            position: employee.position || 'Employee',
            amount: employee.salary,
            paymentDate: today,
            status: 'pending',
            branchId: employee.branchId || undefined,
          });
          created++;
        }
      }

      return { synced: employees.length, created, updated };
    } catch (error: any) {
      console.error('[SyncSalaries] Error:', error);
      throw error;
    }
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
    
    try {
      // SECURITY: Enforce tenant isolation at database level
      const [updated] = await db.update(shopBills)
        .set(updateData)
        .where(and(eq(shopBills.id, id), eq(shopBills.restaurantId, restaurantId)))
        .returning();
      return updated;
    } catch (error: any) {
      // Handle case where invoiceImage or other new columns don't exist in database
      if (error.message?.includes('invoice_image') || error.message?.includes('does not exist')) {
        console.log('[ShopBills] updateShopBill: Column not found, using fallback query');
        
        // Build dynamic SET clause excluding invoiceImage and other new columns
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 3; // Start at 3 because $1=id, $2=restaurantId
        
        // Map of allowed fields to column names (excluding columns that may not exist)
        const fieldMapping: Record<string, string> = {
          billType: 'bill_type',
          amount: 'amount',
          paymentDate: 'payment_date',
          paymentPeriod: 'payment_period',
          status: 'status',
          description: 'description',
          employeeId: 'employee_id',
          employeeName: 'employee_name',
          paymentMonth: 'payment_month',
          archived: 'archived',
          branchId: 'branch_id',
        };
        
        for (const [key, value] of Object.entries(updateData)) {
          const columnName = fieldMapping[key];
          if (columnName && value !== undefined) {
            setClauses.push(`${columnName} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        if (setClauses.length === 0) {
          return this.getShopBill(id);
        }
        
        const query = `
          UPDATE shop_bills 
          SET ${setClauses.join(', ')}
          WHERE id = $1 AND restaurant_id = $2
          RETURNING id, restaurant_id as "restaurantId", branch_id as "branchId", bill_type as "billType",
                    description, amount, payment_date as "paymentDate", payment_period as "paymentPeriod",
                    status, employee_id as "employeeId", employee_name as "employeeName",
                    created_at as "createdAt", payment_month as "paymentMonth", archived
        `;
        
        const result = await pool.query(query, [id, restaurantId, ...values]);
        const row = result.rows?.[0];
        if (!row) return undefined;
        
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
    try {
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
    } catch (error: any) {
      // Check if error is due to missing columns - use fallback SQL
      if (error.message?.includes('column') || error.code === '42703') {
        console.log('[SalaryBills] Column not found, using fallback query');
        
        try {
          // Fallback: Use raw SQL that only references core columns that definitely exist
          const employeesResult = await db.execute(sql`
            SELECT id, full_name as "fullName", salary, position, branch_id as "branchId"
            FROM users 
            WHERE restaurant_id = ${restaurantId} 
            AND active = true 
            AND salary IS NOT NULL
          `);
          const employees = employeesResult.rows as any[];
          
          // Get existing salary bills - check if payment_month column exists
          let existingEmployeeIds = new Set<string>();
          try {
            const existingResult = await db.execute(sql`
              SELECT employee_id as "employeeId" FROM shop_bills 
              WHERE restaurant_id = ${restaurantId} 
              AND bill_type = 'salary' 
              AND payment_month = ${paymentMonth}
            `);
            existingEmployeeIds = new Set((existingResult.rows as any[]).map(r => r.employeeId).filter(Boolean));
          } catch {
            // payment_month column might not exist, check by date range instead
            const [year, month] = paymentMonth.split('-');
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0);
            const existingResult = await db.execute(sql`
              SELECT employee_id as "employeeId" FROM shop_bills 
              WHERE restaurant_id = ${restaurantId} 
              AND bill_type = 'salary' 
              AND payment_date >= ${startDate}
              AND payment_date <= ${endDate}
            `);
            existingEmployeeIds = new Set((existingResult.rows as any[]).map(r => r.employeeId).filter(Boolean));
          }
          
          let created = 0;
          let skipped = 0;
          const createdBills: ShopBill[] = [];
          
          for (const employee of employees) {
            if (existingEmployeeIds.has(employee.id)) {
              skipped++;
              continue;
            }
            
            const salaryVal = parseFloat(employee.salary);
            if (!salaryVal || salaryVal <= 0) {
              skipped++;
              continue;
            }
            
            const [year, month] = paymentMonth.split('-');
            const paymentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const description = `Monthly salary for ${employee.fullName}${employee.position ? ` (${employee.position})` : ''}`;
            
            // Insert with only columns guaranteed to exist in base schema
            try {
              // Try full insert first
              const insertResult = await db.execute(sql`
                INSERT INTO shop_bills (
                  id, restaurant_id, bill_type, amount, payment_date, 
                  payment_period, status, employee_id, employee_name, 
                  payment_month, description, branch_id, archived, created_at
                ) VALUES (
                  gen_random_uuid(), ${restaurantId}, 'salary', ${employee.salary}, ${paymentDate},
                  'monthly', 'pending', ${employee.id}, ${employee.fullName},
                  ${paymentMonth}, ${description}, ${employee.branchId || null}, false, NOW()
                ) RETURNING 
                  id, 
                  restaurant_id as "restaurantId", 
                  bill_type as "billType", 
                  amount, 
                  payment_date as "paymentDate",
                  payment_period as "paymentPeriod", 
                  status, 
                  employee_id as "employeeId", 
                  employee_name as "employeeName",
                  payment_month as "paymentMonth", 
                  description, 
                  branch_id as "branchId", 
                  archived, 
                  created_at as "createdAt"
              `);
              
              if (insertResult.rows[0]) {
                createdBills.push(insertResult.rows[0] as ShopBill);
                created++;
              }
            } catch {
              // Minimal insert with only core columns
              const insertResult = await db.execute(sql`
                INSERT INTO shop_bills (
                  id, restaurant_id, bill_type, amount, payment_date, 
                  payment_period, status, description, created_at
                ) VALUES (
                  gen_random_uuid(), ${restaurantId}, 'salary', ${employee.salary}, ${paymentDate},
                  'monthly', 'pending', ${description}, NOW()
                ) RETURNING 
                  id, 
                  restaurant_id as "restaurantId", 
                  bill_type as "billType", 
                  amount, 
                  payment_date as "paymentDate",
                  payment_period as "paymentPeriod", 
                  status, 
                  description, 
                  created_at as "createdAt"
              `);
              
              if (insertResult.rows[0]) {
                createdBills.push(insertResult.rows[0] as ShopBill);
                created++;
              }
            }
          }
          
          return { created, skipped, bills: createdBills };
        } catch (fallbackError: any) {
          console.error('[SalaryBills] Fallback also failed:', fallbackError.message);
          throw new Error(`Failed to generate salary bills: Database schema may need updating. Run 'npm run db:push' on the server.`);
        }
      }
      throw error;
    }
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
    
    // Categorize orders by type (case-insensitive comparison)
    const dineInOrders = allOrders.filter(o => o.orderType?.toLowerCase() === 'dine-in' && !o.deliveryAppId);
    const takeAwayOrders = allOrders.filter(o => o.orderType?.toLowerCase() === 'take-away' && !o.deliveryAppId);
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
    // IMPORTANT: Prorate amounts based on payment period for monthly calculations
    // Quarterly bills should be divided by 3, semi-annual by 6, yearly by 12
    const fixedCostsMap = new Map<string, number>();
    let fixedCosts = 0;
    
    // Helper function to get monthly amount from bill based on payment period
    const getMonthlyAmount = (amount: number, paymentPeriod: string): number => {
      const period = String(paymentPeriod || 'monthly').toLowerCase();
      switch (period) {
        case 'weekly':
          return amount * 4.33; // Average weeks per month
        case 'monthly':
          return amount;
        case 'quarterly':
          return amount / 3; // Divide by 3 months
        case 'semi-annually':
        case 'semiannually':
        case 'semi-annual':
          return amount / 6; // Divide by 6 months
        case 'yearly':
        case 'annually':
          return amount / 12; // Divide by 12 months
        default:
          return amount; // Default to monthly
      }
    };
    
    for (const bill of recurringBills) {
      const rawAmount = parseFloat(bill.amount) || 0;
      const monthlyAmount = getMonthlyAmount(rawAmount, bill.paymentPeriod);
      fixedCosts += monthlyAmount;
      
      const category = bill.billType || 'other';
      fixedCostsMap.set(category, (fixedCostsMap.get(category) || 0) + monthlyAmount);
    }

    // Add salaries to fixed costs (Fixed Costs = Rent + Salaries)
    // Get ALL salaries for this restaurant to calculate average monthly salary
    // This ensures salaries are included even if they don't have payments in the selected year
    const allSalaries = await db.select().from(salaries).where(
      eq(salaries.restaurantId, restaurantId)
    );
    
    console.log(`[BepMetrics] Found ${allSalaries.length} salaries for restaurant ${restaurantId}`);
    
    // Group salaries by month to calculate average monthly salary expense
    const salaryByMonth = new Map<string, number>();
    for (const salary of allSalaries) {
      const amount = parseFloat(salary.amount) || 0;
      const monthKey = salary.paymentDate ? 
        `${new Date(salary.paymentDate).getFullYear()}-${new Date(salary.paymentDate).getMonth()}` :
        'unknown';
      salaryByMonth.set(monthKey, (salaryByMonth.get(monthKey) || 0) + amount);
    }
    
    console.log(`[BepMetrics] Salary months: ${salaryByMonth.size}, Total: ${Array.from(salaryByMonth.values()).reduce((sum, amt) => sum + amt, 0)}`);
    
    // Calculate average monthly salary (total / number of months with salary data)
    const monthsWithSalaryData = salaryByMonth.size || 1;
    const totalYearlySalaries = Array.from(salaryByMonth.values()).reduce((sum, amt) => sum + amt, 0);
    const avgMonthlySalaries = totalYearlySalaries / monthsWithSalaryData;
    
    console.log(`[BepMetrics] Average monthly salary: ${avgMonthlySalaries}`);
    
    // Add average monthly salaries to fixed costs and breakdown
    if (avgMonthlySalaries > 0) {
      fixedCosts += avgMonthlySalaries;
      fixedCostsMap.set('salaries', (fixedCostsMap.get('salaries') || 0) + avgMonthlySalaries);
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

    // 5. Add delivery profitability data
    // Delivery revenue counts toward total revenue, delivery costs (commission, banking, vat, posFees) count as variable costs
    const deliveryEntries = await this.getDeliveryProfitability(restaurantId, year);
    
    let deliveryRevenue = 0;
    let deliveryVariableCosts = 0;
    
    for (const entry of deliveryEntries) {
      // Revenue from delivery apps (sales figure)
      deliveryRevenue += parseFloat(String(entry.sales || '0'));
      
      // Variable costs: commission, banking, VAT, POS fees
      deliveryVariableCosts += parseFloat(String(entry.commission || '0'));
      deliveryVariableCosts += parseFloat(String(entry.banking || '0'));
      deliveryVariableCosts += parseFloat(String(entry.vat || '0'));
      deliveryVariableCosts += parseFloat(String(entry.posFees || '0'));
    }
    
    // 6. Calculate BEP metrics (POS-only basis for consistency)
    // Per-unit metrics based on POS/dine-in data only
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
    
    // Margin of safety based on POS revenue only (for consistency)
    const marginOfSafety = revenue > 0 && bepRevenue > 0 
      ? ((revenue - bepRevenue) / revenue) * 100 
      : 0;
    
    // Is the business profitable? (POS Revenue > BEP Revenue)
    const isProfitable = revenue > bepRevenue && bepRevenue > 0;
    
    // Calculate combined totals for reference (POS + Delivery)
    const totalRevenue = revenue + deliveryRevenue;

    // Delivery profit = revenue - variable costs (net contribution from delivery apps)
    const deliveryNetProfit = deliveryRevenue - deliveryVariableCosts;

    return {
      fixedCosts,
      fixedCostsBreakdown,
      cogsTotal, // COGS from menu items/recipes (POS orders)
      revenue, // POS revenue only (for BEP consistency)
      unitsSold, // POS/dine-in units only
      avgSellingPrice,
      avgVariableCostPerUnit,
      contributionMarginPerUnit,
      contributionMarginRatio,
      bepUnits,
      bepRevenue,
      marginOfSafety,
      isProfitable,
      // Delivery app breakdown (tracked separately from POS)
      deliveryRevenue,
      deliveryVariableCosts,
      deliveryNetProfit,
    };
  }

  // Investors (MULTI-TENANT: filters by restaurantId)
  async getInvestors(restaurantId: string): Promise<Investor[]> {
    try {
      return await db.select().from(investors).where(
        and(eq(investors.restaurantId, restaurantId), eq(investors.active, true))
      ).orderBy(investors.createdAt);
    } catch (error: any) {
      // Handle missing columns (backward compatibility for schema migrations)
      if (error.message?.includes('does not exist')) {
        console.log('[Investors] Column not found, using fallback query');
        const result = await db.execute(sql`
          SELECT id, restaurant_id, name, national_id, contact_number, investor_type,
                 recipe_id, amount_invested, interest_percentage, notes, active,
                 document_path, document_content, document_filename, created_at
          FROM investors 
          WHERE restaurant_id = ${restaurantId} AND active = true
          ORDER BY created_at
        `);
        return (result.rows || []).map((row: any) => ({
          id: row.id,
          restaurantId: row.restaurant_id,
          name: row.name,
          nationalId: row.national_id,
          contactNumber: row.contact_number,
          investorType: row.investor_type,
          recipeId: row.recipe_id,
          amountInvested: row.amount_invested,
          interestPercentage: row.interest_percentage,
          notes: row.notes,
          active: row.active,
          documentPath: row.document_path,
          documentContent: row.document_content,
          documentFilename: row.document_filename,
          createdAt: row.created_at,
          iban: null, // Column may not exist yet
          bankName: null, // Column may not exist yet
          ibanCertificateContent: null, // Column may not exist yet
          ibanCertificateFilename: null, // Column may not exist yet
        })) as Investor[];
      }
      throw error;
    }
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    try {
      const [investor] = await db.select().from(investors).where(eq(investors.id, id));
      return investor;
    } catch (error: any) {
      // Handle missing columns (backward compatibility for schema migrations)
      if (error.message?.includes('does not exist')) {
        console.log('[Investors] Column not found, using fallback query for single investor');
        const result = await db.execute(sql`
          SELECT id, restaurant_id, name, national_id, contact_number, investor_type,
                 recipe_id, amount_invested, interest_percentage, notes, active,
                 document_path, document_content, document_filename, created_at
          FROM investors 
          WHERE id = ${id}
          LIMIT 1
        `);
        if (!result.rows || result.rows.length === 0) return undefined;
        const row = result.rows[0] as any;
        return {
          id: row.id,
          restaurantId: row.restaurant_id,
          name: row.name,
          nationalId: row.national_id,
          contactNumber: row.contact_number,
          investorType: row.investor_type,
          recipeId: row.recipe_id,
          amountInvested: row.amount_invested,
          interestPercentage: row.interest_percentage,
          notes: row.notes,
          active: row.active,
          documentPath: row.document_path,
          documentContent: row.document_content,
          documentFilename: row.document_filename,
          createdAt: row.created_at,
          iban: null, // Column may not exist yet
          bankName: null, // Column may not exist yet
          ibanCertificateContent: null, // Column may not exist yet
          ibanCertificateFilename: null, // Column may not exist yet
        } as Investor;
      }
      throw error;
    }
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
  
  async getPendingSignupById(id: string): Promise<PendingSignup | undefined> {
    const [result] = await db.select().from(pendingSignups).where(eq(pendingSignups.id, id));
    return result;
  }

  async updatePendingSignupStatus(id: string, status: string): Promise<void> {
    await db.update(pendingSignups).set({ status }).where(eq(pendingSignups.id, id));
  }
  
  // Subscription status management
  async getExpiredSubscriptions(): Promise<Restaurant[]> {
    const now = new Date();
    return await db.select().from(restaurants).where(
      and(
        eq(restaurants.subscriptionStatus, 'active'),
        lt(restaurants.subscriptionEndDate, now)
      )
    );
  }
  
  async updateRestaurantSubscriptionStatus(id: string, status: string): Promise<void> {
    await db.update(restaurants).set({ subscriptionStatus: status }).where(eq(restaurants.id, id));
  }

  async deletePendingSignup(id: string): Promise<void> {
    await db.delete(pendingSignups).where(eq(pendingSignups.id, id));
  }

  // Get all pending signups for IT management
  async getAllPendingSignups(): Promise<PendingSignup[]> {
    return await db.select().from(pendingSignups).orderBy(desc(pendingSignups.createdAt));
  }

  // Delete expired pending signups (older than expiry date)
  async deleteExpiredPendingSignups(): Promise<number> {
    const now = new Date();
    const result = await db.delete(pendingSignups).where(
      and(
        eq(pendingSignups.status, 'pending'),
        lt(pendingSignups.expiresAt, now)
      )
    );
    return result.rowCount || 0;
  }

  // Contracts
  async getContracts(restaurantId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.restaurantId, restaurantId)).orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string, restaurantId: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.restaurantId, restaurantId)));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [created] = await db.insert(contracts).values(contract).returning();
    return created;
  }

  async updateContract(id: string, restaurantId: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db.update(contracts).set(contract).where(and(eq(contracts.id, id), eq(contracts.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteContract(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(contracts).where(and(eq(contracts.id, id), eq(contracts.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Valuations
  async getValuations(restaurantId: string): Promise<Valuation[]> {
    return await db.select().from(valuations).where(eq(valuations.restaurantId, restaurantId)).orderBy(desc(valuations.createdAt));
  }

  async getValuation(id: string, restaurantId: string): Promise<Valuation | undefined> {
    const [valuation] = await db.select().from(valuations).where(and(eq(valuations.id, id), eq(valuations.restaurantId, restaurantId)));
    return valuation;
  }

  async createValuation(valuation: InsertValuation): Promise<Valuation> {
    const [created] = await db.insert(valuations).values(valuation).returning();
    return created;
  }

  async updateValuation(id: string, restaurantId: string, valuation: Partial<InsertValuation>): Promise<Valuation | undefined> {
    const [updated] = await db.update(valuations).set(valuation).where(and(eq(valuations.id, id), eq(valuations.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteValuation(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(valuations).where(and(eq(valuations.id, id), eq(valuations.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Service Catalog
  async getServiceCatalogItems(restaurantId: string): Promise<ServiceCatalogItem[]> {
    return await db.select().from(serviceCatalog).where(eq(serviceCatalog.restaurantId, restaurantId)).orderBy(desc(serviceCatalog.createdAt));
  }

  async getServiceCatalogItem(id: string, restaurantId: string): Promise<ServiceCatalogItem | undefined> {
    const [item] = await db.select().from(serviceCatalog).where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.restaurantId, restaurantId)));
    return item;
  }

  async createServiceCatalogItem(item: InsertServiceCatalogItem): Promise<ServiceCatalogItem> {
    const [created] = await db.insert(serviceCatalog).values(item).returning();
    return created;
  }

  async updateServiceCatalogItem(id: string, restaurantId: string, item: Partial<InsertServiceCatalogItem>): Promise<ServiceCatalogItem | undefined> {
    const [updated] = await db.update(serviceCatalog).set(item).where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteServiceCatalogItem(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(serviceCatalog).where(and(eq(serviceCatalog.id, id), eq(serviceCatalog.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Contractors
  async getContractors(restaurantId: string): Promise<Contractor[]> {
    return await db.select().from(contractors).where(eq(contractors.restaurantId, restaurantId)).orderBy(desc(contractors.createdAt));
  }

  async getContractor(id: string, restaurantId: string): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(and(eq(contractors.id, id), eq(contractors.restaurantId, restaurantId)));
    return contractor;
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const [created] = await db.insert(contractors).values(contractor).returning();
    return created;
  }

  async updateContractor(id: string, restaurantId: string, contractor: Partial<InsertContractor>): Promise<Contractor | undefined> {
    const [updated] = await db.update(contractors).set(contractor).where(and(eq(contractors.id, id), eq(contractors.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteContractor(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(contractors).where(and(eq(contractors.id, id), eq(contractors.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Service Projects
  async getServiceProjects(restaurantId: string): Promise<ServiceProject[]> {
    return await db.select().from(serviceProjects).where(eq(serviceProjects.restaurantId, restaurantId)).orderBy(desc(serviceProjects.createdAt));
  }

  async getServiceProject(id: string, restaurantId: string): Promise<ServiceProject | undefined> {
    const [project] = await db.select().from(serviceProjects).where(and(eq(serviceProjects.id, id), eq(serviceProjects.restaurantId, restaurantId)));
    return project;
  }

  async createServiceProject(project: InsertServiceProject): Promise<ServiceProject> {
    const [created] = await db.insert(serviceProjects).values(project).returning();
    return created;
  }

  async updateServiceProject(id: string, restaurantId: string, project: Partial<InsertServiceProject>): Promise<ServiceProject | undefined> {
    const [updated] = await db.update(serviceProjects).set(project).where(and(eq(serviceProjects.id, id), eq(serviceProjects.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteServiceProject(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(serviceProjects).where(and(eq(serviceProjects.id, id), eq(serviceProjects.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Quotations
  async getQuotations(restaurantId: string): Promise<Quotation[]> {
    return await db.select().from(quotations).where(eq(quotations.restaurantId, restaurantId)).orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: string, restaurantId: string): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.restaurantId, restaurantId)));
    return quotation;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [created] = await db.insert(quotations).values(quotation).returning();
    return created;
  }

  async updateQuotation(id: string, restaurantId: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [updated] = await db.update(quotations).set(quotation).where(and(eq(quotations.id, id), eq(quotations.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteQuotation(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(quotations).where(and(eq(quotations.id, id), eq(quotations.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Payment Schedules
  async getPaymentSchedules(restaurantId: string, projectId?: string): Promise<PaymentSchedule[]> {
    if (projectId) {
      return await db.select().from(paymentSchedules).where(and(eq(paymentSchedules.restaurantId, restaurantId), eq(paymentSchedules.projectId, projectId))).orderBy(desc(paymentSchedules.createdAt));
    }
    return await db.select().from(paymentSchedules).where(eq(paymentSchedules.restaurantId, restaurantId)).orderBy(desc(paymentSchedules.createdAt));
  }

  async getPaymentSchedule(id: string, restaurantId: string): Promise<PaymentSchedule | undefined> {
    const [schedule] = await db.select().from(paymentSchedules).where(and(eq(paymentSchedules.id, id), eq(paymentSchedules.restaurantId, restaurantId)));
    return schedule;
  }

  async createPaymentSchedule(schedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    const [created] = await db.insert(paymentSchedules).values(schedule).returning();
    return created;
  }

  async updatePaymentSchedule(id: string, restaurantId: string, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule | undefined> {
    const [updated] = await db.update(paymentSchedules).set(schedule).where(and(eq(paymentSchedules.id, id), eq(paymentSchedules.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deletePaymentSchedule(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(paymentSchedules).where(and(eq(paymentSchedules.id, id), eq(paymentSchedules.restaurantId, restaurantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Project Services
  async getProjectServices(restaurantId: string, projectId: string): Promise<ProjectService[]> {
    return db.select().from(projectServices).where(and(eq(projectServices.restaurantId, restaurantId), eq(projectServices.projectId, projectId))).orderBy(projectServices.createdAt);
  }

  async createProjectService(service: InsertProjectService): Promise<ProjectService> {
    const [result] = await db.insert(projectServices).values(service).returning();
    return result;
  }

  async updateProjectService(id: string, restaurantId: string, data: Partial<InsertProjectService>): Promise<ProjectService | undefined> {
    const [result] = await db.update(projectServices).set(data).where(and(eq(projectServices.id, id), eq(projectServices.restaurantId, restaurantId))).returning();
    return result;
  }

  async deleteProjectService(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(projectServices).where(and(eq(projectServices.id, id), eq(projectServices.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Project Bills
  async getProjectBills(restaurantId: string, projectId: string): Promise<ProjectBill[]> {
    return db.select().from(projectBills).where(and(eq(projectBills.restaurantId, restaurantId), eq(projectBills.projectId, projectId))).orderBy(projectBills.createdAt);
  }

  async createProjectBill(bill: InsertProjectBill): Promise<ProjectBill> {
    const [result] = await db.insert(projectBills).values(bill).returning();
    return result;
  }

  async updateProjectBill(id: string, restaurantId: string, data: Partial<InsertProjectBill>): Promise<ProjectBill | undefined> {
    const [result] = await db.update(projectBills).set(data).where(and(eq(projectBills.id, id), eq(projectBills.restaurantId, restaurantId))).returning();
    return result;
  }

  async deleteProjectBill(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(projectBills).where(and(eq(projectBills.id, id), eq(projectBills.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Project Procurements
  async getProjectProcurements(restaurantId: string, projectId: string): Promise<ProjectProcurement[]> {
    return db.select().from(projectProcurements).where(and(eq(projectProcurements.restaurantId, restaurantId), eq(projectProcurements.projectId, projectId))).orderBy(projectProcurements.createdAt);
  }

  async createProjectProcurement(procurement: InsertProjectProcurement): Promise<ProjectProcurement> {
    const [result] = await db.insert(projectProcurements).values(procurement).returning();
    return result;
  }

  async updateProjectProcurement(id: string, restaurantId: string, data: Partial<InsertProjectProcurement>): Promise<ProjectProcurement | undefined> {
    const [result] = await db.update(projectProcurements).set(data).where(and(eq(projectProcurements.id, id), eq(projectProcurements.restaurantId, restaurantId))).returning();
    return result;
  }

  async deleteProjectProcurement(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(projectProcurements).where(and(eq(projectProcurements.id, id), eq(projectProcurements.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Project Tasks
  async getProjectTasks(restaurantId: string, projectId: string): Promise<ProjectTask[]> {
    return db.select().from(projectTasks).where(and(eq(projectTasks.restaurantId, restaurantId), eq(projectTasks.projectId, projectId))).orderBy(projectTasks.createdAt);
  }

  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [result] = await db.insert(projectTasks).values(task).returning();
    return result;
  }

  async updateProjectTask(id: string, restaurantId: string, data: Partial<InsertProjectTask>): Promise<ProjectTask | undefined> {
    const [result] = await db.update(projectTasks).set(data).where(and(eq(projectTasks.id, id), eq(projectTasks.restaurantId, restaurantId))).returning();
    return result;
  }

  async deleteProjectTask(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(projectTasks).where(and(eq(projectTasks.id, id), eq(projectTasks.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Quotation Decisions
  async getQuotationDecisions(restaurantId: string, quotationId: string): Promise<QuotationDecision[]> {
    return db.select().from(quotationDecisions).where(and(eq(quotationDecisions.restaurantId, restaurantId), eq(quotationDecisions.quotationId, quotationId))).orderBy(quotationDecisions.decidedAt);
  }

  async createQuotationDecision(decision: InsertQuotationDecision): Promise<QuotationDecision> {
    const [result] = await db.insert(quotationDecisions).values(decision).returning();
    return result;
  }

  async getCompanySettings(restaurantId: string): Promise<CompanySettings | undefined> {
    const [result] = await db.select().from(companySettings).where(eq(companySettings.restaurantId, restaurantId));
    return result;
  }

  async upsertCompanySettings(restaurantId: string, data: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(restaurantId);
    if (existing) {
      const [result] = await db.update(companySettings).set({ ...data, updatedAt: new Date() }).where(eq(companySettings.restaurantId, restaurantId)).returning();
      return result;
    }
    const [result] = await db.insert(companySettings).values({ ...data, restaurantId }).returning();
    return result;
  }
  // Meal Subscriptions (MULTI-TENANT: SQL-level restaurantId filtering)
  async getMealSubscriptions(restaurantId: string, status?: string): Promise<MealSubscription[]> {
    const conditions = [eq(mealSubscriptions.restaurantId, restaurantId)];
    if (status) {
      conditions.push(eq(mealSubscriptions.status, status));
    }
    return db.select().from(mealSubscriptions).where(and(...conditions)).orderBy(desc(mealSubscriptions.createdAt));
  }

  async getMealSubscription(id: string, restaurantId: string): Promise<MealSubscription | undefined> {
    const [sub] = await db.select().from(mealSubscriptions).where(and(eq(mealSubscriptions.id, id), eq(mealSubscriptions.restaurantId, restaurantId)));
    return sub;
  }

  async getTodaysMealDeliveries(restaurantId: string): Promise<MealSubscription[]> {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayDayName = dayNames[new Date().getDay()];
    const activeSubscriptions = await db
      .select()
      .from(mealSubscriptions)
      .where(
        and(
          eq(mealSubscriptions.restaurantId, restaurantId),
          eq(mealSubscriptions.status, "active")
        )
      )
      .orderBy(desc(mealSubscriptions.createdAt));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activeSubscriptions.filter((sub) => {
      if (sub.startDate) {
        const start = new Date(sub.startDate);
        start.setHours(0, 0, 0, 0);
        if (start > today) return false;
      }
      if (sub.endDate) {
        const end = new Date(sub.endDate);
        end.setHours(0, 0, 0, 0);
        if (end < today) return false;
      }
      const days = Array.isArray(sub.scheduleDays) ? sub.scheduleDays : [];
      if (days.length === 0) return true;
      return days.includes(todayDayName);
    });
  }

  async createMealSubscription(subscription: InsertMealSubscription): Promise<MealSubscription> {
    const [created] = await db.insert(mealSubscriptions).values(subscription).returning();
    return created;
  }

  async updateMealSubscription(id: string, restaurantId: string, subscription: Partial<InsertMealSubscription> & { deliveryLog?: unknown[] }): Promise<MealSubscription | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(subscription).filter(([_, value]) => value !== undefined)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getMealSubscription(id, restaurantId);
    }
    const [updated] = await db.update(mealSubscriptions).set(updateData).where(and(eq(mealSubscriptions.id, id), eq(mealSubscriptions.restaurantId, restaurantId))).returning();
    return updated;
  }

  async deleteMealSubscription(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(mealSubscriptions).where(and(eq(mealSubscriptions.id, id), eq(mealSubscriptions.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Catering Contracts (MULTI-TENANT)
  async getCateringContracts(restaurantId: string): Promise<CateringContract[]> {
    return db.select().from(cateringContracts).where(eq(cateringContracts.restaurantId, restaurantId)).orderBy(desc(cateringContracts.createdAt));
  }
  async getCateringContract(id: string, restaurantId: string): Promise<CateringContract | undefined> {
    const [c] = await db.select().from(cateringContracts).where(and(eq(cateringContracts.id, id), eq(cateringContracts.restaurantId, restaurantId)));
    return c;
  }
  async createCateringContract(contract: InsertCateringContract): Promise<CateringContract> {
    const [created] = await db.insert(cateringContracts).values(contract).returning();
    return created;
  }
  async updateCateringContract(id: string, restaurantId: string, contract: Partial<InsertCateringContract>): Promise<CateringContract | undefined> {
    const updateData = Object.fromEntries(Object.entries(contract).filter(([_, v]) => v !== undefined));
    if (Object.keys(updateData).length === 0) return this.getCateringContract(id, restaurantId);
    const [updated] = await db.update(cateringContracts).set(updateData).where(and(eq(cateringContracts.id, id), eq(cateringContracts.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteCateringContract(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(cateringContracts).where(and(eq(cateringContracts.id, id), eq(cateringContracts.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }

  // Catering Contract Templates (MULTI-TENANT)
  async getCateringContractTemplates(restaurantId: string): Promise<CateringContractTemplate[]> {
    return db.select().from(cateringContractTemplates).where(eq(cateringContractTemplates.restaurantId, restaurantId)).orderBy(desc(cateringContractTemplates.updatedAt));
  }
  async getCateringContractTemplate(id: string, restaurantId: string): Promise<CateringContractTemplate | undefined> {
    const [t] = await db.select().from(cateringContractTemplates).where(and(eq(cateringContractTemplates.id, id), eq(cateringContractTemplates.restaurantId, restaurantId)));
    return t;
  }
  async createCateringContractTemplate(template: InsertCateringContractTemplate): Promise<CateringContractTemplate> {
    // If marking as default, clear other defaults first
    if (template.isDefault) {
      await db.update(cateringContractTemplates).set({ isDefault: false }).where(eq(cateringContractTemplates.restaurantId, template.restaurantId));
    }
    const [created] = await db.insert(cateringContractTemplates).values(template).returning();
    return created;
  }
  async updateCateringContractTemplate(id: string, restaurantId: string, template: Partial<InsertCateringContractTemplate>): Promise<CateringContractTemplate | undefined> {
    const updateData: Record<string, unknown> = Object.fromEntries(Object.entries(template).filter(([_, v]) => v !== undefined));
    if (Object.keys(updateData).length === 0) return this.getCateringContractTemplate(id, restaurantId);
    updateData.updatedAt = new Date();
    if (template.isDefault) {
      await db.update(cateringContractTemplates).set({ isDefault: false }).where(eq(cateringContractTemplates.restaurantId, restaurantId));
    }
    const [updated] = await db.update(cateringContractTemplates).set(updateData).where(and(eq(cateringContractTemplates.id, id), eq(cateringContractTemplates.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteCateringContractTemplate(id: string, restaurantId: string): Promise<boolean> {
    const result = await db.delete(cateringContractTemplates).where(and(eq(cateringContractTemplates.id, id), eq(cateringContractTemplates.restaurantId, restaurantId))).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();

// Run database migrations for missing columns on startup
(async function runMigrations() {
  try {
    // Add has_vat_registration column to restaurants table if missing
    await pool.query(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS has_vat_registration BOOLEAN DEFAULT true
    `);
    // Make tax_number nullable (not all businesses have VAT registration)
    await pool.query(`
      ALTER TABLE restaurants 
      ALTER COLUMN tax_number DROP NOT NULL
    `);
    console.log('[Migration] Restaurants column verified/added: has_vat_registration, tax_number made nullable');
    
    // Add inventory_item_id, original_procurement_id, and unit columns to procurement table if missing
    await pool.query(`
      ALTER TABLE procurement 
      ADD COLUMN IF NOT EXISTS inventory_item_id VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE procurement 
      ADD COLUMN IF NOT EXISTS original_procurement_id VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE procurement 
      ADD COLUMN IF NOT EXISTS unit TEXT
    `);
    console.log('[Migration] Procurement columns verified/added: inventory_item_id, original_procurement_id, unit');
    
    // Add missing columns to investors table
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS national_id TEXT
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS contact_number TEXT
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS investor_type TEXT DEFAULT 'money'
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS recipe_id VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS document_path TEXT
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS document_content TEXT
    `);
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS document_filename TEXT
    `);
    console.log('[Migration] Investors columns verified/added: national_id, contact_number, investor_type, recipe_id, document_path, document_content, document_filename');
    
    // Add weekly_schedule column to settings table for per-day shift configuration
    await pool.query(`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS weekly_schedule JSONB
    `);
    console.log('[Migration] Settings column verified/added: weekly_schedule');
    
    // Create device_serial_numbers table if it doesn't exist (for ZATCA compliance)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_serial_numbers (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        branch_id VARCHAR(255) REFERENCES branches(id),
        branch_number INTEGER NOT NULL,
        serial_number TEXT NOT NULL UNIQUE,
        solution_name TEXT NOT NULL DEFAULT 'BSS-POS',
        model TEXT NOT NULL DEFAULT 'Standard',
        version TEXT NOT NULL DEFAULT '1.0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: device_serial_numbers');
    
    // Create pending_signups table for Geidea payment flow
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_signups (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        geidea_session_id TEXT NOT NULL UNIQUE,
        merchant_reference_id TEXT NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        restaurant_name TEXT NOT NULL,
        national_id TEXT NOT NULL,
        has_vat_registration BOOLEAN NOT NULL DEFAULT true,
        tax_number TEXT,
        commercial_registration TEXT NOT NULL,
        business_type TEXT NOT NULL,
        restaurant_type TEXT NOT NULL,
        subscription_plan TEXT NOT NULL,
        branches_count INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        uploaded_files JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `);
    // Add missing columns to pending_signups if table already exists
    await pool.query(`ALTER TABLE pending_signups ALTER COLUMN tax_number DROP NOT NULL`);
    await pool.query(`ALTER TABLE pending_signups ADD COLUMN IF NOT EXISTS has_vat_registration BOOLEAN DEFAULT true`);
    await pool.query(`ALTER TABLE pending_signups ADD COLUMN IF NOT EXISTS uploaded_files JSONB`);
    await pool.query(`ALTER TABLE pending_signups ADD COLUMN IF NOT EXISTS merchant_reference_id TEXT`);
    console.log('[Migration] Table verified/created: pending_signups');
    
    // Add credit/debit note columns to invoices table for ZATCA compliance
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice'`);
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS referenced_invoice_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adjustment_reason TEXT`);
    console.log('[Migration] Invoices columns verified/added: document_type, referenced_invoice_id, adjustment_reason');
    
    // Add ZATCA compliance columns if not exists
    await pool.query(`ALTER TABLE zatca_settings ADD COLUMN IF NOT EXISTS compliance_request_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE zatca_settings ADD COLUMN IF NOT EXISTS compliance_csid_received_at TIMESTAMP`).catch(() => {});
    
    // BizFlow Manager: Create service_projects table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_projects (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_number TEXT NOT NULL,
        name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        client_cr_number TEXT,
        client_vat_number TEXT,
        client_address TEXT,
        client_legal_representative TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        priority TEXT NOT NULL DEFAULT 'medium',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        estimated_budget DECIMAL(12, 2),
        actual_cost DECIMAL(12, 2),
        contractor_id VARCHAR(255),
        location TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Backfill missing columns on pre-existing service_projects tables
    // (CREATE TABLE IF NOT EXISTS won't add columns to an existing table).
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2)`);
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS client_cr_number TEXT`);
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS client_vat_number TEXT`);
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS client_address TEXT`);
    await pool.query(`ALTER TABLE service_projects ADD COLUMN IF NOT EXISTS client_legal_representative TEXT`);
    console.log('[Migration] service_projects columns verified/added: actual_cost, contractor_id, client_cr_number, client_vat_number, client_address, client_legal_representative');

    // BizFlow Manager: Create quotations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        quotation_number TEXT NOT NULL,
        project_id VARCHAR(255) REFERENCES service_projects(id),
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        description TEXT,
        items JSONB DEFAULT '[]',
        subtotal DECIMAL(12, 2) NOT NULL,
        vat_rate DECIMAL(5, 2) DEFAULT 15,
        vat_amount DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        valid_until TIMESTAMP,
        notes TEXT,
        decline_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Add decline_reason column if table already exists but column is missing
    await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS decline_reason TEXT`);

    // BizFlow Manager: Create payment_schedules table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_schedules (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_id VARCHAR(255) NOT NULL REFERENCES service_projects(id),
        milestone_name TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        percentage DECIMAL(5, 2),
        due_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        paid_date TIMESTAMP,
        notes TEXT,
        invoice_id VARCHAR(255),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE payment_schedules ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE payment_schedules ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)`);

    // BizFlow Manager: Create project_services table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_services (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_id VARCHAR(255) NOT NULL REFERENCES service_projects(id),
        service_catalog_id VARCHAR(255),
        name TEXT NOT NULL,
        description TEXT,
        pricing_method TEXT NOT NULL DEFAULT 'lump_sum',
        unit_price DECIMAL(12, 2) NOT NULL,
        quantity DECIMAL(12, 2) NOT NULL DEFAULT 1,
        unit TEXT,
        total_price DECIMAL(12, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // BizFlow Manager: Create project_bills table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_bills (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_id VARCHAR(255) NOT NULL REFERENCES service_projects(id),
        description TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category TEXT,
        vendor TEXT,
        bill_date TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        paid_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // BizFlow Manager: Create project_procurements table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_procurements (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_id VARCHAR(255) NOT NULL REFERENCES service_projects(id),
        item_name TEXT NOT NULL,
        description TEXT,
        quantity DECIMAL(12, 2) NOT NULL DEFAULT 1,
        unit_price DECIMAL(12, 2) NOT NULL,
        total_price DECIMAL(12, 2) NOT NULL,
        vendor TEXT,
        purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
        delivery_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'ordered',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // BizFlow Manager: Create project_tasks table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        project_id VARCHAR(255) NOT NULL REFERENCES service_projects(id),
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 1,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        dependencies TEXT[],
        status TEXT NOT NULL DEFAULT 'pending',
        is_critical BOOLEAN DEFAULT false,
        early_start INTEGER,
        early_finish INTEGER,
        late_start INTEGER,
        late_finish INTEGER,
        slack INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // BizFlow Manager: Create quotation_decisions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotation_decisions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        quotation_id VARCHAR(255) NOT NULL REFERENCES quotations(id),
        decision TEXT NOT NULL,
        reason TEXT,
        decided_by TEXT,
        decided_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // BizFlow Manager: Create company_settings table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        company_name TEXT,
        company_email TEXT,
        company_phone TEXT,
        company_address TEXT,
        company_logo TEXT,
        agreement_template TEXT,
        agreement_placeholders JSONB,
        terms_and_conditions TEXT,
        company_documents JSONB DEFAULT '[]',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_documents JSONB DEFAULT '[]'`);

    // Real Estate: Create contracts table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        contract_number TEXT NOT NULL,
        property_id VARCHAR(255),
        property_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        contract_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        value DECIMAL(12, 2) NOT NULL,
        commission DECIMAL(10, 2),
        commission_rate DECIMAL(5, 2),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: contracts');

    // Real Estate: Create valuations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS valuations (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        property_id VARCHAR(255),
        property_name TEXT NOT NULL,
        property_type TEXT NOT NULL,
        location TEXT NOT NULL,
        area DECIMAL(10, 2),
        area_unit TEXT DEFAULT 'sqm',
        estimated_value DECIMAL(12, 2) NOT NULL,
        market_value DECIMAL(12, 2),
        assessment_date TIMESTAMP NOT NULL DEFAULT NOW(),
        valuation_type TEXT NOT NULL DEFAULT 'market',
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: valuations');

    // Meal Subscriptions: Create meal_subscriptions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meal_subscriptions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        subscriber_name TEXT NOT NULL,
        subscriber_phone TEXT NOT NULL,
        subscriber_email TEXT,
        delivery_address TEXT,
        dietary_notes TEXT,
        meal_selections JSONB NOT NULL DEFAULT '[]',
        plan_type TEXT NOT NULL DEFAULT 'daily',
        schedule_days TEXT[] NOT NULL DEFAULT '{}',
        meal_time TEXT NOT NULL DEFAULT 'lunch',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: meal_subscriptions');

    await pool.query(`
      ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS delivery_log JSONB NOT NULL DEFAULT '[]'
    `);
    await pool.query(`
      ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS delivery_hours JSONB NOT NULL DEFAULT '{}'
    `);
    await pool.query(`
      ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0
    `);
    await pool.query(`
      ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS number_of_days INTEGER
    `);
    console.log('[Migration] Meal subscriptions columns verified/added: delivery_log, delivery_hours, credit_balance, number_of_days');

    // Service Catalog (for service business types)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_catalog (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        pricing_method TEXT NOT NULL DEFAULT 'lump_sum',
        unit_price DECIMAL(12,2) NOT NULL,
        unit TEXT,
        estimated_duration TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: service_catalog');

    // Contractors (for service business types)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        email TEXT,
        specialization TEXT,
        license_number TEXT,
        rating DECIMAL(3,1),
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Table verified/created: contractors');

    // Catering Contracts (Restaurant business type)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE catering_contracts ADD COLUMN IF NOT EXISTS share_token text;
      EXCEPTION WHEN undefined_table THEN NULL; END $$;
      CREATE TABLE IF NOT EXISTS catering_contracts (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        contract_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        client_email TEXT,
        delivery_location TEXT,
        meal_selections JSONB NOT NULL DEFAULT '[]',
        meals_per_day INTEGER NOT NULL DEFAULT 1,
        delivery_days TEXT[] NOT NULL DEFAULT '{}',
        delivery_time TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
        final_value DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_installments JSONB NOT NULL DEFAULT '[]',
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        share_token TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_contract_templates (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id VARCHAR(255) NOT NULL REFERENCES restaurants(id),
        name TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[Migration] Tables verified/created: catering_contracts, catering_contract_templates');

    console.log('[Migration] BizFlow Manager tables verified/created: service_projects, quotations, payment_schedules, project_services, project_bills, project_procurements, project_tasks, quotation_decisions, company_settings');
  } catch (error: any) {
    // Only log if not a duplicate column error (which means columns already exist)
    if (!error.message?.includes('already exists')) {
      console.error('[Migration] Error adding columns:', error.message);
    }
  }
})();
