var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addons: () => addons,
  bootstrapResetTokens: () => bootstrapResetTokens,
  branches: () => branches,
  chatConversationPreferences: () => chatConversationPreferences,
  chatMessages: () => chatMessages,
  conversationMembers: () => conversationMembers,
  conversations: () => conversations,
  customers: () => customers,
  deliveryApps: () => deliveryApps,
  employeeActivityLog: () => employeeActivityLog,
  factoryProducts: () => factoryProducts,
  insertAddonSchema: () => insertAddonSchema,
  insertBootstrapResetTokenSchema: () => insertBootstrapResetTokenSchema,
  insertBranchSchema: () => insertBranchSchema,
  insertChatConversationPreferenceSchema: () => insertChatConversationPreferenceSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertConversationMemberSchema: () => insertConversationMemberSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertDeliveryAppSchema: () => insertDeliveryAppSchema,
  insertEmployeeActivityLogSchema: () => insertEmployeeActivityLogSchema,
  insertFactoryProductSchema: () => insertFactoryProductSchema,
  insertInventoryItemSchema: () => insertInventoryItemSchema,
  insertInventoryTransactionSchema: () => insertInventoryTransactionSchema,
  insertInvestorSchema: () => insertInvestorSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertLicenseSchema: () => insertLicenseSchema,
  insertMenuItemSchema: () => insertMenuItemSchema,
  insertMessageReadSchema: () => insertMessageReadSchema,
  insertMonthlyVatReportSchema: () => insertMonthlyVatReportSchema,
  insertMoyasarPaymentSchema: () => insertMoyasarPaymentSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProcurementSchema: () => insertProcurementSchema,
  insertRecipeSchema: () => insertRecipeSchema,
  insertRestaurantSchema: () => insertRestaurantSchema,
  insertSalarySchema: () => insertSalarySchema,
  insertSettingsSchema: () => insertSettingsSchema,
  insertShopBillSchema: () => insertShopBillSchema,
  insertSubscriptionInvoiceSchema: () => insertSubscriptionInvoiceSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertTicketMessageSchema: () => insertTicketMessageSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  inventoryItems: () => inventoryItems,
  inventoryTransactions: () => inventoryTransactions,
  investors: () => investors,
  invoices: () => invoices,
  licenses: () => licenses,
  menuItems: () => menuItems,
  messageReads: () => messageReads,
  monthlyVatReports: () => monthlyVatReports,
  moyasarPayments: () => moyasarPayments,
  orders: () => orders,
  procurement: () => procurement,
  recipes: () => recipes,
  restaurants: () => restaurants,
  salaries: () => salaries,
  settings: () => settings,
  shopBills: () => shopBills,
  subscriptionInvoices: () => subscriptionInvoices,
  supportTickets: () => supportTickets,
  ticketMessages: () => ticketMessages,
  transactions: () => transactions,
  updateInvestorSchema: () => updateInvestorSchema,
  updateMenuItemSchema: () => updateMenuItemSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var restaurants, insertRestaurantSchema, branches, insertBranchSchema, inventoryItems, insertInventoryItemSchema, recipes, insertRecipeSchema, factoryProducts, insertFactoryProductSchema, menuItems, baseMenuItemSchema, insertMenuItemSchema, updateMenuItemSchema, addons, insertAddonSchema, orders, insertOrderSchema, inventoryTransactions, insertInventoryTransactionSchema, transactions, insertTransactionSchema, moyasarPayments, insertMoyasarPaymentSchema, settings, insertSettingsSchema, procurement, insertProcurementSchema, customers, insertCustomerSchema, users, insertUserSchema, invoices, insertInvoiceSchema, salaries, insertSalarySchema, shopBills, insertShopBillSchema, deliveryApps, subsidyTierSchema, insertDeliveryAppSchema, investors, baseInvestorSchema, insertInvestorSchema, updateInvestorSchema, subscriptionInvoices, insertSubscriptionInvoiceSchema, monthlyVatReports, insertMonthlyVatReportSchema, supportTickets, insertSupportTicketSchema, ticketMessages, insertTicketMessageSchema, employeeActivityLog, insertEmployeeActivityLogSchema, bootstrapResetTokens, insertBootstrapResetTokenSchema, conversations, insertConversationSchema, chatMessages, insertChatMessageSchema, chatConversationPreferences, insertChatConversationPreferenceSchema, conversationMembers, insertConversationMemberSchema, messageReads, insertMessageReadSchema, licenses, insertLicenseSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    restaurants = pgTable("restaurants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      nationalId: text("national_id").notNull(),
      // National ID or Company Name (10 digits)
      taxNumber: text("tax_number").notNull(),
      // Unified Tax Number
      commercialRegistration: text("commercial_registration").notNull(),
      // Commercial Registration (10 digits)
      businessType: text("business_type").notNull().default("restaurant"),
      // "restaurant" or "factory"
      type: text("type").notNull(),
      // Business subtype (e.g., "Cloud Kitchen", "Restaurant", "Coffee Shop" for restaurant; "Manufacturing", "Production" for factory)
      subscriptionPlan: text("subscription_plan").notNull(),
      // "weekly", "monthly", "yearly"
      branchesCount: integer("branches_count").notNull().default(1),
      subscriptionStatus: text("subscription_status").notNull().default("inactive"),
      // "inactive", "active", "cancelled", "expired"
      subscriptionStartDate: timestamp("subscription_start_date"),
      subscriptionEndDate: timestamp("subscription_end_date"),
      subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
      setupComplete: boolean("setup_complete").notNull().default(false),
      // SECURITY: Prevents post-setup cross-tenant user creation
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, createdAt: true }).extend({
      businessType: z.enum(["restaurant", "factory"]),
      subscriptionPlan: z.enum(["weekly", "monthly", "yearly"])
    });
    branches = pgTable("branches", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      location: text("location").notNull(),
      phone: text("phone").notNull(),
      manager: text("manager").notNull(),
      staff: integer("staff").notNull().default(0),
      status: text("status").notNull().default("Active")
    });
    insertBranchSchema = createInsertSchema(branches).omit({ id: true });
    inventoryItems = pgTable("inventory_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
      unit: text("unit").notNull(),
      price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
      // Price per unit in SAR
      supplier: text("supplier").notNull(),
      status: text("status").notNull().default("In Stock"),
      branchId: varchar("branch_id").references(() => branches.id),
      sortOrder: integer("sort_order").default(0)
    });
    insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
    recipes = pgTable("recipes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      prepTime: text("prep_time").notNull(),
      cookTime: text("cook_time").notNull(),
      servings: integer("servings").notNull(),
      cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
      ingredients: jsonb("ingredients").notNull().$type(),
      steps: jsonb("steps").notNull().$type(),
      sortOrder: integer("sort_order").default(0)
    });
    insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
    factoryProducts = pgTable("factory_products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      weight: text("weight"),
      // e.g., "10kg", "500g"
      length: text("length"),
      // e.g., "100cm", "5m"
      productType: text("product_type"),
      // Type of product (e.g., "Steel", "Wood", "Plastic")
      colour: text("colour"),
      quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
      thickness: text("thickness"),
      // e.g., "2mm", "5cm"
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      // VAT-inclusive price (15% Saudi VAT)
      basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      // Price before VAT
      vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
      // VAT amount (15%)
      description: text("description"),
      available: boolean("available").notNull().default(true),
      imageUrl: text("image_url")
    });
    insertFactoryProductSchema = createInsertSchema(factoryProducts).omit({ id: true });
    menuItems = pgTable("menu_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      recipeId: varchar("recipe_id").references(() => recipes.id),
      // Optional: menu item can have a recipe
      inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id),
      // Optional: for simple items without recipes
      portionSize: decimal("portion_size", { precision: 5, scale: 2 }).default("1.00"),
      // Multiplier for recipe (1.0=whole, 0.5=half, 0.25=quarter)
      stockNo: decimal("stock_no", { precision: 10, scale: 2 }),
      // Quantity per item when inventoryItemId is set
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      // VAT-inclusive price (15% Saudi VAT)
      basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      // Price before VAT
      vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
      // VAT amount (15%)
      discount: decimal("discount", { precision: 5, scale: 2 }).notNull().default("0"),
      // Discount percentage (0-100)
      description: text("description"),
      available: boolean("available").notNull().default(true),
      imageUrl: text("image_url")
    });
    baseMenuItemSchema = createInsertSchema(menuItems).omit({ id: true }).extend({
      recipeId: z.string().nullable().optional(),
      // Allow null to clear recipe
      inventoryItemId: z.string().nullable().optional(),
      // Allow null, for simple items
      portionSize: z.string().nullable().optional(),
      // Portion multiplier (1.0, 0.5, 0.25) - nullable when no recipe
      stockNo: z.string().nullable().optional()
      // Stock quantity per item (nullable)
    });
    insertMenuItemSchema = baseMenuItemSchema.refine(
      (data) => {
        const discount = parseFloat(data.discount || "0");
        return discount >= 0 && discount <= 100;
      },
      { message: "Discount must be between 0 and 100" }
    ).refine(
      (data) => {
        if (data.stockNo && data.stockNo.trim() !== "") {
          const stockNum = parseFloat(data.stockNo);
          return !isNaN(stockNum) && stockNum > 0;
        }
        return true;
      },
      { message: "Stock quantity must be a positive number", path: ["stockNo"] }
    );
    updateMenuItemSchema = baseMenuItemSchema.partial().superRefine((data, ctx) => {
      if (data.discount !== void 0) {
        const discount = parseFloat(data.discount || "0");
        if (discount < 0 || discount > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Discount must be between 0 and 100",
            path: ["discount"]
          });
        }
      }
      if (data.stockNo !== void 0 && data.stockNo !== null && data.stockNo.trim() !== "") {
        const stockNum = parseFloat(data.stockNo);
        if (isNaN(stockNum) || stockNum <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Stock quantity must be a positive number",
            path: ["stockNo"]
          });
        }
      }
    });
    addons = pgTable("addons", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      // e.g., "Toppings", "Sides", "Sauces", "Extras"
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      // VAT-inclusive price
      basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      // Price before VAT
      vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
      // VAT amount (15%)
      menuItemIds: varchar("menu_item_ids").array(),
      // Optional: link to multiple menu items (null means "All items")
      available: boolean("available").notNull().default(true),
      sortOrder: integer("sort_order").default(0)
    });
    insertAddonSchema = createInsertSchema(addons).omit({ id: true }).extend({
      menuItemIds: z.array(z.string()).nullable().optional()
    });
    orders = pgTable("orders", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      orderNumber: text("order_number").notNull().unique(),
      branchId: varchar("branch_id").references(() => branches.id),
      customerId: varchar("customer_id").references(() => customers.id),
      customerName: text("customer_name"),
      customerPhone: text("customer_phone"),
      orderType: text("order_type").notNull(),
      table: text("table"),
      address: text("address"),
      deliveryAppId: varchar("delivery_app_id").references(() => deliveryApps.id),
      earningsDecreaseApplied: boolean("earnings_decrease_applied").notNull().default(false),
      // Track if 2 SAR decrease applied
      items: jsonb("items").notNull().$type(),
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
      total: decimal("total", { precision: 10, scale: 2 }).notNull(),
      paymentMethod: text("payment_method").notNull().default("Cash"),
      paymentStatus: text("payment_status").default("Unpaid"),
      // Track payment status separately: Unpaid, Paid, Refunded
      moyasarPaymentId: text("moyasar_payment_id"),
      // Link to Moyasar payment if applicable
      status: text("status").notNull().default("Pending"),
      createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
      // Nullable: tracks which user created the order
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
    inventoryTransactions = pgTable("inventory_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id).notNull(),
      orderId: varchar("order_id").references(() => orders.id),
      // Optional: links to orders table
      type: text("type").notNull(),
      // "sale", "procurement", "adjustment", "wastage"
      quantityChange: decimal("quantity_change", { precision: 10, scale: 2 }).notNull(),
      // Negative for deductions, positive for additions
      quantityBefore: decimal("quantity_before", { precision: 10, scale: 2 }).notNull(),
      quantityAfter: decimal("quantity_after", { precision: 10, scale: 2 }).notNull(),
      notes: text("notes"),
      // Additional details (e.g., "Sold in Order ORD-123", "Procurement PO-456")
      branchId: varchar("branch_id").references(() => branches.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({ id: true, createdAt: true });
    transactions = pgTable("transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      transactionId: text("transaction_id").notNull().unique(),
      orderId: varchar("order_id").references(() => orders.id),
      branchId: varchar("branch_id").references(() => branches.id),
      itemCount: integer("item_count").notNull(),
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
      total: decimal("total", { precision: 10, scale: 2 }).notNull(),
      paymentMethod: text("payment_method").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
    moyasarPayments = pgTable("moyasar_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      moyasarId: text("moyasar_id").notNull().unique(),
      // Moyasar payment ID from their API
      orderId: varchar("order_id").references(() => orders.id),
      transactionId: varchar("transaction_id").references(() => transactions.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      // Amount in SAR
      amountHalalas: integer("amount_halalas").notNull(),
      // Amount in halalas (1 SAR = 100 halalas)
      currency: text("currency").notNull().default("SAR"),
      status: text("status").notNull(),
      // "initiated", "paid", "failed", "refunded", "authorized"
      paymentMethod: text("payment_method"),
      // "creditcard", "mada", "applepay", "stcpay"
      cardBrand: text("card_brand"),
      // "visa", "mastercard", "mada", etc.
      cardLast4: text("card_last4"),
      // Last 4 digits of card
      fee: decimal("fee", { precision: 10, scale: 2 }),
      // Moyasar transaction fee
      refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0"),
      description: text("description"),
      customerName: text("customer_name"),
      customerEmail: text("customer_email"),
      customerPhone: text("customer_phone"),
      callbackUrl: text("callback_url"),
      metadata: jsonb("metadata").$type(),
      // Additional data
      errorMessage: text("error_message"),
      // Error details if payment failed
      branchId: varchar("branch_id").references(() => branches.id),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertMoyasarPaymentSchema = createInsertSchema(moyasarPayments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    settings = pgTable("settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull().unique(),
      // One settings per restaurant
      restaurantName: text("restaurant_name").notNull(),
      vatNumber: text("vat_number").notNull(),
      address: text("address").notNull(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      language: text("language").notNull().default("English"),
      openingTime: text("opening_time"),
      closingTime: text("closing_time"),
      logoPath: text("logo_path"),
      // Path to uploaded logo for invoices (e.g., "uploads/logos/abc123.png")
      notificationTone: text("notification_tone").notNull().default("tone1"),
      // Admin-selected notification tone (tone1-tone15)
      chatNotificationDefaults: jsonb("chat_notification_defaults").$type()
    });
    insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
    procurement = pgTable("procurement", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      type: text("type").notNull(),
      // "inventory", "maintenance", "installation", "equipment"
      title: text("title").notNull(),
      description: text("description"),
      supplier: text("supplier"),
      category: text("category"),
      quantity: integer("quantity"),
      unitPrice: text("unit_price"),
      totalCost: text("total_cost").notNull(),
      status: text("status").notNull().default("pending"),
      // "pending", "approved", "ordered", "received", "completed", "cancelled"
      priority: text("priority").notNull().default("medium"),
      // "low", "medium", "high", "urgent"
      requestedBy: text("requested_by"),
      approvedBy: text("approved_by"),
      branchId: varchar("branch_id"),
      orderDate: timestamp("order_date"),
      expectedDelivery: timestamp("expected_delivery"),
      actualDelivery: timestamp("actual_delivery"),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertProcurementSchema = createInsertSchema(procurement).omit({ id: true, createdAt: true, updatedAt: true });
    customers = pgTable("customers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      phone: text("phone").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id),
      // Links user to their restaurant (null for IT accounts)
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      // hashed password
      fullName: text("full_name").notNull(),
      email: text("email"),
      phone: text("phone"),
      role: text("role").notNull().default("employee"),
      // "admin" or "employee"
      permissions: jsonb("permissions").notNull().$type(),
      branchId: varchar("branch_id").references(() => branches.id),
      // Default branch for this user
      passwordResetToken: text("password_reset_token"),
      passwordResetExpiry: timestamp("password_reset_expiry"),
      devicePreference: text("device_preference").default("laptop"),
      // "laptop", "ipad", or "iphone"
      active: boolean("active").notNull().default(true),
      // Recruitment Data
      employeeNumber: text("employee_number"),
      hireDate: timestamp("hire_date"),
      recruitmentSource: text("recruitment_source"),
      // "referral", "job_board", "agency", "walk_in", "other"
      probationEndDate: timestamp("probation_end_date"),
      contractType: text("contract_type"),
      // "full_time", "part_time", "contract", "temporary"
      // Vacation Days Tracking
      vacationDaysTotal: integer("vacation_days_total").default(0),
      vacationDaysUsed: integer("vacation_days_used").default(0),
      // Visa Information
      visaNumber: text("visa_number"),
      visaFees: decimal("visa_fees", { precision: 10, scale: 2 }),
      visaExpiryDate: timestamp("visa_expiry_date"),
      visaStatus: text("visa_status"),
      // "valid", "expired", "pending", "not_applicable"
      // Ticket Information
      ticketAmount: decimal("ticket_amount", { precision: 10, scale: 2 }),
      ticketDestination: text("ticket_destination"),
      ticketDate: timestamp("ticket_date"),
      ticketStatus: text("ticket_status"),
      // "pending", "booked", "used", "not_applicable"
      // Performance Tracking
      performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }),
      // 0.00 to 5.00
      lastReviewDate: timestamp("last_review_date"),
      performanceNotes: text("performance_notes"),
      // Salary Information
      salary: decimal("salary", { precision: 10, scale: 2 }),
      // Monthly salary amount
      position: text("position"),
      // Job position/title
      // Compliance
      documents: jsonb("documents").$type(),
      certifications: text("certifications").array(),
      trainingCompleted: text("training_completed").array(),
      // Chat notification settings (user-level overrides for restaurant defaults)
      chatNotificationSettings: jsonb("chat_notification_settings").$type(),
      // Activity Tracking (for IT Dashboard real-time monitoring)
      lastActivityAt: timestamp("last_activity_at"),
      // Last API request timestamp
      lastLoginAt: timestamp("last_login_at"),
      // Last successful login timestamp
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
      // Transform empty date strings to null for optional date fields
      hireDate: z.union([z.string().transform((val) => val ? new Date(val) : null), z.date(), z.null()]).optional(),
      probationEndDate: z.union([z.string().transform((val) => val ? new Date(val) : null), z.date(), z.null()]).optional(),
      visaExpiryDate: z.union([z.string().transform((val) => val ? new Date(val) : null), z.date(), z.null()]).optional(),
      ticketDate: z.union([z.string().transform((val) => val ? new Date(val) : null), z.date(), z.null()]).optional(),
      lastReviewDate: z.union([z.string().transform((val) => val ? new Date(val) : null), z.date(), z.null()]).optional(),
      // Transform empty numeric strings to null for optional numeric fields
      visaFees: z.union([z.string().transform((val) => val ? parseFloat(val) : null), z.number(), z.null()]).optional(),
      ticketAmount: z.union([z.string().transform((val) => val ? parseFloat(val) : null), z.number(), z.null()]).optional(),
      performanceRating: z.union([z.string().transform((val) => val ? parseFloat(val) : null), z.number(), z.null()]).optional(),
      salary: z.union([z.string().transform((val) => val ? parseFloat(val) : null), z.number(), z.null()]).optional(),
      vacationDaysTotal: z.union([z.string().transform((val) => val ? parseInt(val) : 0), z.number()]).optional(),
      vacationDaysUsed: z.union([z.string().transform((val) => val ? parseInt(val) : 0), z.number()]).optional()
    });
    invoices = pgTable("invoices", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      invoiceNumber: text("invoice_number").notNull().unique(),
      transactionId: varchar("transaction_id").references(() => transactions.id),
      orderId: varchar("order_id").references(() => orders.id),
      branchId: varchar("branch_id").references(() => branches.id),
      customerName: text("customer_name"),
      items: jsonb("items").notNull().$type(),
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
      total: decimal("total", { precision: 10, scale: 2 }).notNull(),
      qrCode: text("qr_code"),
      // Base64 encoded QR code
      pdfPath: text("pdf_path"),
      // Path to generated PDF
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
    salaries = pgTable("salaries", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      employeeName: text("employee_name").notNull(),
      position: text("position").notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paymentDate: timestamp("payment_date").notNull(),
      status: text("status").notNull().default("pending"),
      // "pending", "paid"
      notes: text("notes"),
      branchId: varchar("branch_id").references(() => branches.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertSalarySchema = createInsertSchema(salaries).omit({ id: true, createdAt: true });
    shopBills = pgTable("shop_bills", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      billType: text("bill_type").notNull(),
      // "rent", "electricity", "water", "gas", "internet", "maintenance", "foundational", "salary", "other"
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paymentDate: timestamp("payment_date").notNull(),
      paymentPeriod: text("payment_period").notNull().default("monthly"),
      // "one-time", "weekly", "monthly", "quarterly", "semi-annually", "yearly"
      status: text("status").notNull().default("pending"),
      // "pending", "paid", "overdue"
      description: text("description"),
      employeeId: varchar("employee_id").references(() => users.id),
      // Links bill to employee for salary bills
      employeeName: text("employee_name"),
      // Cached employee name for salary bills
      paymentMonth: text("payment_month"),
      // Format: "YYYY-MM" for tracking salary payment months
      archived: boolean("archived").notNull().default(false),
      // For archiving old bills
      branchId: varchar("branch_id").references(() => branches.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertShopBillSchema = createInsertSchema(shopBills).omit({ id: true, createdAt: true });
    deliveryApps = pgTable("delivery_apps", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      // Manually entered delivery app name (e.g., "HungerStation", "Jahez", "Mrsool")
      commission: decimal("commission", { precision: 5, scale: 2 }).notNull(),
      // VAT-inclusive commission percentage (e.g., 20.00 for 20%)
      bankingFees: decimal("banking_fees", { precision: 5, scale: 2 }).notNull(),
      // VAT-inclusive banking fees percentage (e.g., 2.50 for 2.5%)
      markUp: decimal("mark_up", { precision: 5, scale: 2 }).notNull().default("0"),
      // Price mark-up percentage for delivery (e.g., 30.00 for 30%)
      subsidyTiers: jsonb("subsidy_tiers").notNull().default(sql`'[]'`).$type(),
      // Tiered subsidy: array of {minAmount: min order, maxAmount: max order (null = unlimited), subsidy: subsidy in SAR}, max 3 tiers
      posFees: decimal("pos_fees", { precision: 10, scale: 2 }).notNull().default("0"),
      // VAT-inclusive POS fees amount in SAR
      active: boolean("active").notNull().default(true),
      sortOrder: integer("sort_order").default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    subsidyTierSchema = z.object({
      minAmount: z.number().min(0, "Minimum amount must be 0 or higher"),
      maxAmount: z.number().nullable(),
      subsidy: z.number().min(0, "Subsidy must be 0 or higher")
    }).refine(
      (data) => data.maxAmount === null || data.maxAmount > data.minAmount,
      {
        message: "Maximum amount must be greater than minimum amount",
        path: ["maxAmount"]
      }
    );
    insertDeliveryAppSchema = createInsertSchema(deliveryApps).omit({ id: true, createdAt: true }).extend({
      subsidyTiers: z.array(subsidyTierSchema)
    });
    investors = pgTable("investors", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      name: text("name").notNull(),
      investorType: text("investor_type").notNull().default("money"),
      // "money" for cash investor, "recipe" for recipe owner
      recipeId: varchar("recipe_id").references(() => recipes.id),
      // Only used when investorType is "recipe"
      amountInvested: decimal("amount_invested", { precision: 12, scale: 2 }).notNull(),
      // Amount invested in SAR (0 for recipe owners)
      interestPercentage: decimal("interest_percentage", { precision: 5, scale: 2 }).notNull(),
      // Percentage of net profit (e.g., 10.00 for 10%)
      active: boolean("active").notNull().default(true),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    baseInvestorSchema = createInsertSchema(investors).omit({ id: true, createdAt: true }).extend({
      investorType: z.enum(["money", "recipe"])
    });
    insertInvestorSchema = baseInvestorSchema.refine(
      (data) => {
        const percentage = parseFloat(data.interestPercentage || "0");
        return percentage >= 0 && percentage <= 100;
      },
      { message: "Interest percentage must be between 0 and 100" }
    ).refine(
      (data) => {
        if (data.investorType === "recipe") {
          return data.recipeId != null && data.recipeId.trim() !== "";
        }
        return true;
      },
      { message: "Recipe ID is required for recipe investors", path: ["recipeId"] }
    ).refine(
      (data) => {
        if (data.investorType === "money") {
          const amount = parseFloat(data.amountInvested || "0");
          return amount > 0;
        }
        return true;
      },
      { message: "Amount invested must be a positive number for money investors", path: ["amountInvested"] }
    );
    updateInvestorSchema = baseInvestorSchema.partial().superRefine((data, ctx) => {
      if (data.interestPercentage !== void 0) {
        const percentage = parseFloat(data.interestPercentage || "0");
        if (percentage < 0 || percentage > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Interest percentage must be between 0 and 100",
            path: ["interestPercentage"]
          });
        }
      }
      if (data.investorType === "recipe") {
        if (data.recipeId === void 0 || data.recipeId === null || data.recipeId.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Recipe ID is required when setting investor type to recipe",
            path: ["recipeId"]
          });
        }
      }
      if (data.investorType === "money") {
        if (data.amountInvested !== void 0) {
          const amount = parseFloat(data.amountInvested || "0");
          if (amount <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Amount invested must be a positive number for money investors",
              path: ["amountInvested"]
            });
          }
        }
      }
    });
    subscriptionInvoices = pgTable("subscription_invoices", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      serialNumber: text("serial_number").notNull().unique(),
      // Format: 0001-YYYYMMDD-HHMMSS
      subscriptionPlan: text("subscription_plan").notNull(),
      // weekly, monthly, yearly
      branchesCount: integer("branches_count").notNull(),
      basePlanPrice: decimal("base_plan_price", { precision: 10, scale: 2 }).notNull(),
      // Base price without VAT
      additionalBranchesPrice: decimal("additional_branches_price", { precision: 10, scale: 2 }).notNull(),
      // Extra branches price without VAT
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      // Base + additional branches (before VAT)
      vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
      // 15% VAT
      total: decimal("total", { precision: 10, scale: 2 }).notNull(),
      // Final amount with VAT
      invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
      pdfPath: text("pdf_path"),
      // Path to generated PDF invoice
      qrCode: text("qr_code")
      // QR code data URL for ZATCA compliance
    });
    insertSubscriptionInvoiceSchema = createInsertSchema(subscriptionInvoices).omit({ id: true, invoiceDate: true });
    monthlyVatReports = pgTable("monthly_vat_reports", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      reportMonth: integer("report_month").notNull(),
      // 1-12
      reportYear: integer("report_year").notNull(),
      // e.g., 2025
      serialNumber: text("serial_number").notNull().unique(),
      // Format: VAT-YYYY-MM-XXXX
      totalSales: decimal("total_sales", { precision: 12, scale: 2 }).notNull().default("0"),
      // Total sales (including VAT)
      totalSalesBaseAmount: decimal("total_sales_base_amount", { precision: 12, scale: 2 }).notNull().default("0"),
      // Sales before VAT
      totalSalesVat: decimal("total_sales_vat", { precision: 12, scale: 2 }).notNull().default("0"),
      // Sales VAT (15%)
      totalPurchases: decimal("total_purchases", { precision: 12, scale: 2 }).notNull().default("0"),
      // Total purchases/costs (including VAT)
      totalPurchasesBaseAmount: decimal("total_purchases_base_amount", { precision: 12, scale: 2 }).notNull().default("0"),
      // Purchases before VAT
      totalPurchasesVat: decimal("total_purchases_vat", { precision: 12, scale: 2 }).notNull().default("0"),
      // Purchases VAT (15%)
      netVatPayable: decimal("net_vat_payable", { precision: 12, scale: 2 }).notNull().default("0"),
      // Sales VAT - Purchases VAT
      generatedAt: timestamp("generated_at").notNull().defaultNow(),
      pdfPath: text("pdf_path"),
      // Path to generated PDF report
      qrCode: text("qr_code")
      // QR code data URL for ZATCA compliance
    });
    insertMonthlyVatReportSchema = createInsertSchema(monthlyVatReports).omit({ id: true, generatedAt: true });
    supportTickets = pgTable("support_tickets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      userId: varchar("user_id").notNull().references(() => users.id),
      ticketNumber: text("ticket_number").notNull().unique(),
      // Format: TKT-YYYYMMDD-XXXX
      subject: text("subject").notNull(),
      category: text("category").notNull(),
      // 'technical', 'billing', 'feature_request', 'bug_report', 'other'
      priority: text("priority").notNull().default("medium"),
      // 'low', 'medium', 'high', 'urgent'
      status: text("status").notNull().default("open"),
      // 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
      description: text("description").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
      resolvedAt: timestamp("resolved_at"),
      closedAt: timestamp("closed_at"),
      assignedToIt: boolean("assigned_to_it").notNull().default(true),
      // Always assign to IT by default
      assignedTo: varchar("assigned_to").references(() => users.id),
      // IT staff member assigned to this ticket
      assignedBy: varchar("assigned_by").references(() => users.id),
      // Who made the assignment
      assignedAt: timestamp("assigned_at")
      // When the ticket was assigned
    });
    insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
      id: true,
      ticketNumber: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      closedAt: true,
      assignedAt: true
    });
    ticketMessages = pgTable("ticket_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
      senderId: varchar("sender_id").notNull().references(() => users.id),
      senderName: text("sender_name").notNull(),
      // Store name for display
      senderRole: text("sender_role").notNull(),
      // 'user' or 'it_support'
      message: text("message").notNull(),
      attachmentUrl: text("attachment_url"),
      // Optional file attachment
      createdAt: timestamp("created_at").notNull().defaultNow(),
      isRead: boolean("is_read").notNull().default(false)
    });
    insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
      id: true,
      createdAt: true
    });
    employeeActivityLog = pgTable("employee_activity_log", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      employeeId: varchar("employee_id").notNull().references(() => users.id),
      employeeName: text("employee_name").notNull(),
      // Store for quick display
      action: text("action").notNull(),
      // e.g., 'created_order', 'updated_inventory', 'modified_menu_item', etc.
      actionCategory: text("action_category").notNull(),
      // 'orders', 'inventory', 'menu', 'customers', 'settings', etc.
      description: text("description").notNull(),
      // Human-readable description
      entityType: text("entity_type"),
      // e.g., 'order', 'inventory_item', 'menu_item'
      entityId: text("entity_id"),
      // ID of the affected entity
      previousData: jsonb("previous_data").$type(),
      // Before state (for updates/deletes)
      newData: jsonb("new_data").$type(),
      // After state (for creates/updates)
      ipAddress: text("ip_address"),
      branchId: varchar("branch_id").references(() => branches.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertEmployeeActivityLogSchema = createInsertSchema(employeeActivityLog).omit({
      id: true,
      createdAt: true
    });
    bootstrapResetTokens = pgTable("bootstrap_reset_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      tokenHash: text("token_hash").notNull(),
      // Bcrypt hash of the reset token
      consumed: boolean("consumed").notNull().default(false),
      // One-time use flag
      consumedAt: timestamp("consumed_at"),
      consumedBy: text("consumed_by"),
      // Username of admin that was reset
      ipAddress: text("ip_address"),
      // IP that consumed the token
      expiresAt: timestamp("expires_at").notNull(),
      // Token expiration time (15-30 minutes recommended)
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertBootstrapResetTokenSchema = createInsertSchema(bootstrapResetTokens).omit({
      id: true,
      createdAt: true
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
      type: text("type").notNull(),
      // "direct" | "channel"
      name: text("name"),
      // null for DMs, required for channels (e.g., "#general", "#kitchen")
      scope: text("scope").notNull(),
      // "branch" | "restaurant"
      branchId: varchar("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      // null if scope="restaurant"
      createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
      participantHash: text("participant_hash"),
      // Computed hash of sorted participant IDs for DM deduplication (null for channels)
      lastMessageAt: timestamp("last_message_at"),
      // Denormalized for fast sorting
      lastMessagePreview: text("last_message_preview"),
      // Denormalized for quick display
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, lastMessageAt: true, lastMessagePreview: true, participantHash: true }).extend({
      type: z.enum(["direct", "channel"]),
      scope: z.enum(["branch", "restaurant"])
    }).refine(
      (data) => data.type === "channel" ? !!data.name : true,
      { message: "Channel conversations must have a name" }
    ).refine(
      (data) => data.scope === "branch" ? !!data.branchId : true,
      { message: "Branch-scoped conversations must have a branchId" }
    );
    chatMessages = pgTable("chat_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
      conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
      senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }),
      senderName: text("sender_name").notNull(),
      // Denormalized for display even if user deleted
      content: text("content").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).omit({
      id: true,
      createdAt: true
    });
    chatConversationPreferences = pgTable("chat_conversation_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
      isMuted: boolean("is_muted").notNull().default(false),
      // Mute notifications for this conversation
      priority: text("priority").default("normal"),
      // "high", "normal", "low" - future use for smart notifications
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertChatConversationPreferenceSchema = createInsertSchema(chatConversationPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    conversationMembers = pgTable("conversation_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
      conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      joinedAt: timestamp("joined_at").notNull().defaultNow()
    });
    insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({
      id: true,
      joinedAt: true
    });
    messageReads = pgTable("message_reads", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
      conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      lastReadMessageId: varchar("last_read_message_id").references(() => chatMessages.id, { onDelete: "set null" }),
      lastReadAt: timestamp("last_read_at").notNull().defaultNow()
    });
    insertMessageReadSchema = createInsertSchema(messageReads).omit({
      id: true
    });
    licenses = pgTable("licenses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
      licenseType: text("license_type").notNull(),
      // trade, health, fire_safety, municipal, vat, custom
      licenseNumber: text("license_number").notNull(),
      licenseName: text("license_name").notNull(),
      issuingAuthority: text("issuing_authority").notNull(),
      issueDate: timestamp("issue_date").notNull(),
      expiryDate: timestamp("expiry_date").notNull(),
      status: text("status").default("active"),
      // active, expired, pending_renewal, suspended
      renewalReminderDays: integer("renewal_reminder_days").default(30),
      fee: decimal("fee", { precision: 10, scale: 2 }),
      // License fee/cost amount
      documentUrl: text("document_url"),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      createdBy: varchar("created_by").references(() => users.id),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
      updatedBy: varchar("updated_by").references(() => users.id)
    });
    insertLicenseSchema = createInsertSchema(licenses).omit({ id: true, createdAt: true, updatedAt: true }).extend({
      licenseType: z.enum(["trade", "health", "fire_safety", "municipal", "vat", "food_safety", "environmental", "labor", "custom"]),
      status: z.enum(["active", "expired", "pending_renewal", "suspended"]).optional().default("active"),
      issueDate: z.union([
        z.string().transform((val) => new Date(val)),
        z.date()
      ]),
      expiryDate: z.union([
        z.string().transform((val) => new Date(val)),
        z.date()
      ])
    });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import fs from "fs";
import path from "path";
var Pool, caPath, sslConfig, isProduction, parsedUrl, user, password, host, port, database, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    caPath = path.join(process.cwd(), "aws-rds-ca-bundle.pem");
    isProduction = process.env.NODE_ENV === "production" || process.env.REPL_OWNER;
    if (isProduction) {
      sslConfig = {
        rejectUnauthorized: false
      };
      console.log("\u2705 Production mode: SSL enabled for AWS RDS");
    } else {
      try {
        const ca = fs.readFileSync(caPath, "utf8");
        sslConfig = {
          rejectUnauthorized: true,
          ca
        };
        console.log("\u2705 AWS RDS SSL enabled with CA bundle (development mode)");
      } catch (error) {
        console.warn("\u26A0\uFE0F  AWS RDS CA bundle not found, using basic SSL");
        sslConfig = {
          rejectUnauthorized: false
        };
      }
    }
    try {
      parsedUrl = new URL(process.env.DATABASE_URL);
    } catch (error) {
      throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : "Unable to parse URL"}`);
    }
    user = parsedUrl.username;
    password = decodeURIComponent(parsedUrl.password);
    host = parsedUrl.hostname;
    port = parsedUrl.port ? parseInt(parsedUrl.port) : 5432;
    database = parsedUrl.pathname.slice(1);
    if (!user || !password || !host || !database) {
      throw new Error(`Missing required DATABASE_URL parameters. Found: user=${!!user}, password=${!!password}, host=${!!host}, database=${!!database}`);
    }
    pool = new Pool({
      user,
      password,
      host,
      port,
      database,
      ssl: sslConfig
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/invoice.ts
var invoice_exports = {};
__export(invoice_exports, {
  closeBrowser: () => closeBrowser,
  generateFinancialStatementPDF: () => generateFinancialStatementPDF,
  generateInvestorStatementPDF: () => generateInvestorStatementPDF,
  generateMonthlyVatReport: () => generateMonthlyVatReport,
  generateSubscriptionInvoice: () => generateSubscriptionInvoice,
  generateZATCAInvoice: () => generateZATCAInvoice
});
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import * as path2 from "path";
function escapeHtml(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text2.replace(/[&<>"']/g, (m) => map[m]);
}
function getChromiumPath() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    console.log(`[Invoice] Using Chromium from env: ${process.env.CHROMIUM_PATH}`);
    return process.env.CHROMIUM_PATH;
  }
  try {
    const chromiumPath = execSync("which chromium 2>/dev/null || which chromium-browser 2>/dev/null", { encoding: "utf8" }).trim();
    if (chromiumPath && existsSync(chromiumPath)) {
      console.log(`[Invoice] Found Chromium via which: ${chromiumPath}`);
      return chromiumPath;
    }
  } catch (e) {
  }
  const nixPaths = [
    "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium"
    // Add more common paths as needed
  ];
  for (const path7 of nixPaths) {
    if (existsSync(path7)) {
      console.log(`[Invoice] Using Nix Chromium: ${path7}`);
      return path7;
    }
  }
  console.warn("[Invoice] No Chromium executable found, falling back to Puppeteer default");
  return void 0;
}
async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    try {
      const pages = await browserInstance.pages();
      return browserInstance;
    } catch (e) {
      console.log("[Invoice] Browser connection test failed, will recreate");
      browserInstance = null;
    }
  }
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }
  browserLaunchPromise = (async () => {
    try {
      const chromiumPath = getChromiumPath();
      if (!chromiumPath) {
        throw new Error("Chromium executable not found. Please install Chromium or set CHROMIUM_PATH environment variable.");
      }
      console.log("[Invoice] Launching new browser instance");
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromiumPath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--single-process",
          "--no-zygote"
        ]
      });
      browserInstance = browser;
      console.log("[Invoice] Browser launched successfully");
      return browser;
    } finally {
      browserLaunchPromise = null;
    }
  })();
  return browserLaunchPromise;
}
function generateBilingualInvoiceHTML(data, qrCodeDataURL) {
  const { order, companyName, companyVAT, branchAddress, companyEmail, companyPhone, invoiceNumber, invoiceDate } = data;
  const escapedCompanyName = escapeHtml(companyName);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedBranchAddress = escapeHtml(branchAddress);
  const escapedCompanyEmail = escapeHtml(companyEmail);
  const escapedCompanyPhone = escapeHtml(companyPhone);
  const escapedInvoiceNumber = escapeHtml(invoiceNumber);
  const escapedOrderNumber = escapeHtml(order.orderNumber);
  const escapedOrderType = escapeHtml(order.orderType);
  const subtotal = parseFloat(order.subtotal);
  const tax = parseFloat(order.tax);
  const total = parseFloat(order.total);
  let logoHTML = "";
  if (data.logoPath) {
    try {
      const logoFullPath = path2.join(process.cwd(), data.logoPath);
      if (existsSync(logoFullPath)) {
        const logoBuffer = readFileSync(logoFullPath);
        const logoExt = path2.extname(data.logoPath).substring(1);
        const logoMimeType = logoExt === "svg" ? "svg+xml" : logoExt;
        const logoBase64 = logoBuffer.toString("base64");
        const logoDataURL = `data:image/${logoMimeType};base64,${logoBase64}`;
        logoHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoDataURL}" alt="Business Logo" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
        </div>
      `;
      }
    } catch (error) {
      console.error("[Invoice] Failed to load logo:", error);
    }
  }
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm;
    }
    
    .header {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
      border-radius: 6px 6px 0 0;
      margin-bottom: 12px;
    }
    
    .company-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    
    .invoice-badge {
      display: inline-block;
      background: white;
      color: #2962ff;
      padding: 4px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 10px;
      margin-top: 4px;
    }
    
    .bilingual-section {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
    }
    
    .section-left, .section-right {
      flex: 1;
      padding: 10px 12px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .section-left {
      background: #f8f9fa;
    }
    
    .section-right {
      background: #e3f2fd;
      direction: rtl;
      text-align: right;
    }
    
    .section-title {
      font-weight: 700;
      font-size: 9px;
      color: #1e40af;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 4px;
      font-size: 9px;
      line-height: 1.3;
    }
    
    .section-right .info-row {
      flex-direction: row-reverse;
      text-align: right;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 80px;
      color: #374151;
    }
    
    .info-value {
      color: #1a1a1a;
      word-break: break-word;
    }
    
    .customer-section {
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
    }
    
    .customer-grid {
      display: flex;
      gap: 20px;
    }
    
    .customer-col {
      flex: 1;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .items-table thead {
      background: #2962ff;
      color: white;
    }
    
    .items-table th {
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .items-table th.rtl {
      text-align: right;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 5px 8px;
      font-size: 9px;
      word-break: break-word;
      line-height: 1.3;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      max-width: 300px;
      margin-left: auto;
      margin-bottom: 10px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 10px;
      font-size: 10px;
    }
    
    .totals-row.total {
      background: #2962ff;
      color: white;
      font-weight: 700;
      font-size: 13px;
      border-radius: 4px;
      padding: 8px 12px;
      margin-top: 6px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .qr-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      background: #f8f9fa;
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      border: 2px solid #e5e7eb;
      border-radius: 4px;
      padding: 4px;
      flex-shrink: 0;
    }
    
    .footer-content {
      flex: 1;
    }
    
    .zatca-badge {
      color: #2962ff;
      font-weight: 700;
      font-size: 10px;
      margin-bottom: 4px;
    }
    
    .footer-text {
      font-size: 8px;
      color: #6b7280;
      margin-bottom: 2px;
      line-height: 1.3;
    }
    
    .arabic {
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .english {
      font-family: 'Inter', sans-serif;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    @page {
      size: A4;
      margin: 8mm;
    }
    
    .header, .totals-section, .qr-footer {
      page-break-inside: avoid;
    }
    
    .items-table tbody tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      ${logoHTML}
      <div class="company-name english">${escapedCompanyName}</div>
      <div class="invoice-badge">TAX INVOICE | \u0641\u0627\u062A\u0648\u0631\u0629 \u0636\u0631\u064A\u0628\u064A\u0629</div>
    </div>
    
    <!-- Company Information - Bilingual -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Company Information</div>
        <div class="info-row">
          <div class="info-label">VAT Number:</div>
          <div class="info-value">${escapedCompanyVAT}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone:</div>
          <div class="info-value">${escapedCompanyPhone}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${escapedCompanyEmail}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Address:</div>
          <div class="info-value">${escapedBranchAddress}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629</div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyVAT}</div>
          <div class="info-label">:\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064A\u0628\u064A</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyPhone}</div>
          <div class="info-label">:\u0627\u0644\u0647\u0627\u062A\u0641</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedCompanyEmail}</div>
          <div class="info-label">:\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedBranchAddress}</div>
          <div class="info-label">:\u0627\u0644\u0639\u0646\u0648\u0627\u0646</div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Details - Bilingual -->
    <div class="bilingual-section">
      <!-- English Left -->
      <div class="section-left english">
        <div class="section-title">Invoice Details</div>
        <div class="info-row">
          <div class="info-label">Invoice No:</div>
          <div class="info-value">${escapedInvoiceNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date:</div>
          <div class="info-value">${invoiceDate.toLocaleDateString("en-GB")}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Order No:</div>
          <div class="info-value">${escapedOrderNumber}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Type:</div>
          <div class="info-value">${escapedOrderType}</div>
        </div>
      </div>
      
      <!-- Arabic Right -->
      <div class="section-right arabic">
        <div class="section-title">\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629</div>
        <div class="info-row">
          <div class="info-value">${escapedInvoiceNumber}</div>
          <div class="info-label">:\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629</div>
        </div>
        <div class="info-row">
          <div class="info-value">${invoiceDate.toLocaleDateString("ar-SA")}</div>
          <div class="info-label">:\u0627\u0644\u062A\u0627\u0631\u064A\u062E</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedOrderNumber}</div>
          <div class="info-label">:\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628</div>
        </div>
        <div class="info-row">
          <div class="info-value">${escapedOrderType}</div>
          <div class="info-label">:\u0627\u0644\u0646\u0648\u0639</div>
        </div>
      </div>
    </div>
    
    ${order.customerName || order.table || order.address ? `
    <!-- Customer Information -->
    <div class="customer-section">
      <div class="customer-grid">
        <div class="customer-col english">
          <div class="section-title">Customer Information</div>
          ${order.customerName ? `<div class="info-row"><div class="info-label">Customer:</div><div class="info-value">${escapeHtml(order.customerName)}</div></div>` : ""}
          ${order.table ? `<div class="info-row"><div class="info-label">Table:</div><div class="info-value">${escapeHtml(order.table)}</div></div>` : ""}
          ${order.address ? `<div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(order.address)}</div></div>` : ""}
        </div>
        <div class="customer-col arabic" style="direction: rtl; text-align: right;">
          <div class="section-title">\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644</div>
          ${order.customerName ? `<div class="info-row"><div class="info-value">${escapeHtml(order.customerName)}</div><div class="info-label">:\u0627\u0644\u0639\u0645\u064A\u0644</div></div>` : ""}
          ${order.table ? `<div class="info-row"><div class="info-value">${escapeHtml(order.table)}</div><div class="info-label">:\u0627\u0644\u0637\u0627\u0648\u0644\u0629</div></div>` : ""}
          ${order.address ? `<div class="info-row"><div class="info-value">${escapeHtml(order.address)}</div><div class="info-label">:\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0648\u0635\u064A\u0644</div></div>` : ""}
        </div>
      </div>
    </div>
    ` : ""}
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="english">ITEM NAME</th>
          <th class="rtl arabic">\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u0641</th>
          <th class="text-center english">QTY</th>
          <th class="text-center english">PRICE</th>
          <th class="text-center english">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item) => `
          <tr>
            <td class="english">${escapeHtml(item.name)}</td>
            <td class="text-right arabic">${escapeHtml(item.name)}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">${parseFloat(item.price.toString()).toFixed(2)}</td>
            <td class="text-center">${(item.quantity * parseFloat(item.price.toString())).toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-row subtotal">
        <span class="english">Subtotal | \u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0641\u0631\u0639\u064A</span>
        <span>${subtotal.toFixed(2)} SAR</span>
      </div>
      <div class="totals-row">
        <span class="english">VAT (15%) | \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629</span>
        <span>${tax.toFixed(2)} SAR</span>
      </div>
      <div class="totals-row total">
        <span class="english">TOTAL | \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</span>
        <span>${total.toFixed(2)} SAR</span>
      </div>
    </div>
    
    <!-- QR Code & Footer -->
    <div class="qr-footer">
      <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code">
      <div class="footer-content">
        <div class="zatca-badge">ZATCA COMPLIANT E-INVOICE | \u0641\u0627\u062A\u0648\u0631\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0645\u062A\u0648\u0627\u0641\u0642\u0629</div>
        <div class="footer-text english">Scan QR code to view and verify this invoice online</div>
        <div class="footer-text arabic">\u0627\u0645\u0633\u062D \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646\u0647\u0627</div>
        <div class="footer-text english">Saudi Tax Authority (ZATCA) Approved Electronic Invoice</div>
        <div class="footer-text arabic">\u0641\u0627\u062A\u0648\u0631\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u0646 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0631\u0643</div>
        <div class="footer-text english" style="margin-top: 4px;">Thank you for your business | \u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0639\u0627\u0645\u0644\u0643\u0645 \u0645\u0639\u0646\u0627</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
async function generateZATCAInvoice(data) {
  const invoiceUrl = `${data.baseUrl}/public/invoice/${data.invoiceId}`;
  const qrCodeDataURL = await QRCode.toDataURL(invoiceUrl, { width: 150, margin: 1 });
  const html = generateBilingualInvoiceHTML(data, qrCodeDataURL);
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "8mm",
            right: "8mm",
            bottom: "8mm",
            left: "8mm"
          }
        });
        return { pdfBuffer: Buffer.from(pdfBuffer), qrCode: qrCodeDataURL };
      } finally {
        await page.close().catch((e) => console.log("[Invoice] Page close error:", e.message));
      }
    } catch (error) {
      lastError = error;
      const isConnectionError = error.message?.includes("Connection closed") || error.message?.includes("Target closed") || error.message?.includes("Session closed");
      if (isConnectionError && attempt < 3) {
        console.log(`[Invoice] Attempt ${attempt} failed with connection error, retrying... Error: ${error.message}`);
        browserInstance = null;
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      console.error(`[Invoice] Error generating PDF (attempt ${attempt}):`, error);
      throw error;
    }
  }
  throw lastError || new Error("Failed to generate invoice after 3 attempts");
}
async function generateFinancialStatementPDF(data) {
  const { companyName, companyVAT, year, period, yearlyData, monthlyData } = data;
  const escapedCompanyName = escapeHtml(companyName);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedYear = escapeHtml(year);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2962ff;
      padding-bottom: 20px;
    }
    
    .company-name {
      font-size: 32px;
      font-weight: 700;
      color: #2962ff;
      margin-bottom: 10px;
    }
    
    .document-title {
      font-size: 24px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .year {
      font-size: 18px;
      color: #6b7280;
    }
    
    .meta-info {
      margin-bottom: 30px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #2962ff 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    
    .summary-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .summary-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 6px;
    }
    
    .summary-label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    
    .summary-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .data-table thead {
      background: #f3f4f6;
    }
    
    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .data-table th.text-right {
      text-align: right;
    }
    
    .data-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      word-break: break-word;
    }
    
    .data-table td.text-right {
      text-align: right;
    }
    
    .data-table tfoot {
      font-weight: 700;
      background: #f3f4f6;
    }
    
    .data-table tfoot td {
      padding: 12px;
      border-top: 2px solid #2962ff;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${escapedCompanyName}</div>
    <div class="document-title">Financial Statement</div>
    <div class="year">Year ${escapedYear}</div>
  </div>
  
  <div class="meta-info">
    <div>VAT Number: ${escapedCompanyVAT}</div>
    <div>Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-GB")}</div>
  </div>
  
  <div class="summary-box">
    <div class="summary-title">Annual Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Revenue</div>
        <div class="summary-value">${parseFloat(yearlyData.revenue).toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">VAT Collected</div>
        <div class="summary-value">${parseFloat(yearlyData.vat).toFixed(2)} SAR</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Transactions</div>
        <div class="summary-value">${yearlyData.transactions}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Invoices Generated</div>
        <div class="summary-value">${yearlyData.invoices}</div>
      </div>
    </div>
  </div>
  
  ${period === "monthly" && monthlyData && monthlyData.length > 0 ? `
    <div class="section-title">Monthly Breakdown</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th class="text-right">Revenue (SAR)</th>
          <th class="text-right">VAT (SAR)</th>
          <th class="text-right">Transactions</th>
        </tr>
      </thead>
      <tbody>
        ${monthlyData.map((month) => `
          <tr>
            <td>${escapeHtml(month.month)}</td>
            <td class="text-right">${parseFloat(month.revenue).toFixed(2)}</td>
            <td class="text-right">${parseFloat(month.vat).toFixed(2)}</td>
            <td class="text-right">${month.transactions}</td>
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td>TOTAL</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + parseFloat(m.revenue), 0).toFixed(2)}</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + parseFloat(m.vat), 0).toFixed(2)}</td>
          <td class="text-right">${monthlyData.reduce((sum, m) => sum + m.transactions, 0)}</td>
        </tr>
      </tfoot>
    </table>
  ` : ""}
  
  <div class="footer">
    <div>BlindSpot System (BSS) Financial Statement</div>
    <div>VAT Compliant - Saudi Arabia</div>
  </div>
</body>
</html>
  `;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
      }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
async function generateSubscriptionInvoice(data) {
  const qrData = `Invoice: ${data.serialNumber}
Date: ${data.invoiceDate.toLocaleDateString("en-GB")}
Total: ${data.total.toFixed(2)} SAR
VAT: ${data.vatAmount.toFixed(2)} SAR`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);
  const planNames = {
    weekly: { en: "Weekly Plan", ar: "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629" },
    monthly: { en: "Monthly Plan", ar: "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629" },
    yearly: { en: "Annual Plan", ar: "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0633\u0646\u0648\u064A\u0629" }
  };
  const planName = planNames[data.subscriptionPlan] || { en: data.subscriptionPlan, ar: data.subscriptionPlan };
  const securityClause = {
    en: "I acknowledge that all the information, data and numbers entered by me are correct, as they will appear in my tax invoices and subscription invoice, and I take full responsibility if there is anything to the contrary, and the company owning the application has the right to dispose of the account to preserve its legal right before the authorities considered competent in fraud, tax evasion, forgery and forgery.",
    ar: "\u0623\u0642\u0631 \u0628\u0623\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u062A\u064A \u0623\u062F\u062E\u0644\u062A\u0647\u0627 \u0635\u062D\u064A\u062D\u0629\u060C \u062D\u064A\u062B \u0633\u062A\u0638\u0647\u0631 \u0641\u064A \u0641\u0648\u0627\u062A\u064A\u0631\u064A \u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629 \u0648\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u060C \u0648\u0623\u062A\u062D\u0645\u0644 \u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u0641\u064A \u062D\u0627\u0644\u0629 \u0648\u062C\u0648\u062F \u0623\u064A \u0634\u064A\u0621 \u0645\u062E\u0627\u0644\u0641\u060C \u0648\u064A\u062D\u0642 \u0644\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0645\u0627\u0644\u0643\u0629 \u0644\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0635\u0631\u0641 \u0641\u064A \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u062D\u0642\u0647\u0627 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A \u0623\u0645\u0627\u0645 \u0627\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u062E\u062A\u0635\u0629 \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0628\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0644 \u0648\u0627\u0644\u062A\u0647\u0631\u0628 \u0627\u0644\u0636\u0631\u064A\u0628\u064A \u0648\u0627\u0644\u062A\u0632\u0648\u064A\u0631 \u0648\u0627\u0644\u062A\u0632\u064A\u064A\u0641."
  };
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 40px;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .company-name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .invoice-title {
      font-size: 20px;
      opacity: 0.95;
      margin-top: 16px;
    }

    .content {
      padding: 40px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 30px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .info-block p {
      margin: 6px 0;
      font-size: 14px;
      color: #374151;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: 14px;
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }

    .summary-row.total {
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
    }

    .qr-section {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }

    .qr-code {
      width: 150px;
      height: 150px;
      margin: 20px auto;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }

    .bilingual {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .en { text-align: left; }
    .ar {
      text-align: right;
      font-family: 'Noto Naskh Arabic', serif;
      direction: rtl;
    }

    .security-clause {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .security-clause h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .security-clause-content {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .security-clause-content .en,
    .security-clause-content .ar {
      flex: 1;
      font-size: 10px;
      line-height: 1.6;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-name">BlindSpot System (BSS)</div>
      <div class="bilingual">
        <div class="en invoice-title">Subscription Invoice</div>
        <div class="ar invoice-title">\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643</div>
      </div>
    </div>

    <div class="content">
      <div class="invoice-details">
        <div class="invoice-details-grid">
          <div class="detail-row">
            <span class="detail-label">Invoice Number / \u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629:</span>
            <span class="detail-value">${escapeHtml(data.serialNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date / \u0627\u0644\u062A\u0627\u0631\u064A\u062E:</span>
            <span class="detail-value">${data.invoiceDate.toLocaleDateString("en-GB")}</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Bill To / \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0625\u0644\u0649</h3>
          <p><strong>${escapeHtml(data.restaurantName)}</strong></p>
          <p>${escapeHtml(data.userFullName)}</p>
          <p>${escapeHtml(data.userEmail)}</p>
          <p>National ID: ${escapeHtml(data.nationalId)}</p>
          <p>Tax Number: ${escapeHtml(data.taxNumber)}</p>
          <p>CR: ${escapeHtml(data.commercialRegistration)}</p>
        </div>
        <div class="info-block">
          <h3>From / \u0645\u0646</h3>
          <p><strong>BlindSpot System (BSS)</strong></p>
          <p>Business Management Platform</p>
          <p>IT@SaudiKinzhal.org</p>
          <!-- TODO: Update sender email domain when new domain is available -->
          <p>Saudi Arabia</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description / \u0627\u0644\u0648\u0635\u0641</th>
            <th class="text-right">Quantity / \u0627\u0644\u0643\u0645\u064A\u0629</th>
            <th class="text-right">Unit Price / \u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629</th>
            <th class="text-right">Total / \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${planName.en} / ${planName.ar}</strong><br/>
              <small>(Includes 1 branch)</small>
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${data.basePlanPrice.toFixed(2)} SAR</td>
            <td class="text-right">${data.basePlanPrice.toFixed(2)} SAR</td>
          </tr>
          ${data.branchesCount > 1 ? `
          <tr>
            <td>
              <strong>Additional Branches / \u0641\u0631\u0648\u0639 \u0625\u0636\u0627\u0641\u064A\u0629</strong><br/>
              <small>(${data.branchesCount - 1} branches)</small>
            </td>
            <td class="text-right">${data.branchesCount - 1}</td>
            <td class="text-right">${(data.additionalBranchesPrice / (data.branchesCount - 1)).toFixed(2)} SAR</td>
            <td class="text-right">${data.additionalBranchesPrice.toFixed(2)} SAR</td>
          </tr>
          ` : ""}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Subtotal / \u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0641\u0631\u0639\u064A:</span>
          <span>${data.subtotal.toFixed(2)} SAR</span>
        </div>
        <div class="summary-row">
          <span>VAT (15%) / \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629:</span>
          <span>${data.vatAmount.toFixed(2)} SAR</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount / \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A:</span>
          <span>${data.total.toFixed(2)} SAR</span>
        </div>
      </div>

      <div class="qr-section">
        <p style="color: #6b7280; margin-bottom: 10px;">Scan for ZATCA Verification / \u0627\u0645\u0633\u062D \u0644\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629</p>
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code"/>
      </div>

      <div class="security-clause">
        <h3 style="text-align: center;">Security & Confidentiality Agreement / \u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u0633\u0631\u064A\u0629</h3>
        <div class="security-clause-content">
          <div class="en">
            ${escapeHtml(securityClause.en)}
          </div>
          <div class="ar">
            ${escapeHtml(securityClause.ar)}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is a ZATCA-compliant tax invoice / \u0647\u0630\u0647 \u0641\u0627\u062A\u0648\u0631\u0629 \u0636\u0631\u064A\u0628\u064A\u0629 \u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629</p>
        <p>Thank you for your business / \u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0639\u0627\u0645\u0644\u0643\u0645 \u0645\u0639\u0646\u0627</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
async function generateMonthlyVatReport(data) {
  const monthNames = [
    { en: "January", ar: "\u064A\u0646\u0627\u064A\u0631" },
    { en: "February", ar: "\u0641\u0628\u0631\u0627\u064A\u0631" },
    { en: "March", ar: "\u0645\u0627\u0631\u0633" },
    { en: "April", ar: "\u0623\u0628\u0631\u064A\u0644" },
    { en: "May", ar: "\u0645\u0627\u064A\u0648" },
    { en: "June", ar: "\u064A\u0648\u0646\u064A\u0648" },
    { en: "July", ar: "\u064A\u0648\u0644\u064A\u0648" },
    { en: "August", ar: "\u0623\u063A\u0633\u0637\u0633" },
    { en: "September", ar: "\u0633\u0628\u062A\u0645\u0628\u0631" },
    { en: "October", ar: "\u0623\u0643\u062A\u0648\u0628\u0631" },
    { en: "November", ar: "\u0646\u0648\u0641\u0645\u0628\u0631" },
    { en: "December", ar: "\u062F\u064A\u0633\u0645\u0628\u0631" }
  ];
  const monthName = monthNames[data.reportMonth - 1];
  const qrData = `VAT Report: ${data.serialNumber}
Period: ${monthName.en} ${data.reportYear}
Net VAT: ${data.netVatPayable.toFixed(2)} SAR
Tax Number: ${data.taxNumber}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.3;
      padding: 15px;
      font-size: 11px;
    }

    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
    }

    .company-name {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .invoice-title {
      font-size: 13px;
      opacity: 0.95;
      margin-top: 6px;
    }

    .content {
      padding: 15px 20px;
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 15px;
    }

    .info-block {
      flex: 1;
    }

    .info-block h3 {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
    }

    .info-block p {
      margin: 3px 0;
      font-size: 11px;
      color: #374151;
    }

    .info-block strong {
      color: #1f2937;
    }

    .invoice-details {
      background: #f0fdf4;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #bbf7d0;
    }

    .invoice-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }

    .detail-label {
      color: #6b7280;
      font-size: 10px;
    }

    .detail-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 10px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    .items-table th {
      background: #f3f4f6;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
      color: #374151;
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .summary {
      background: #f0fdf4;
      padding: 10px 12px;
      border-radius: 6px;
      margin-top: 12px;
      border: 1px solid #bbf7d0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 11px;
    }

    .summary-row.highlight {
      background: #dcfce7;
      padding: 6px 8px;
      border-radius: 4px;
      margin: 4px 0;
    }

    .summary-row.total {
      border-top: 2px solid #16a34a;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #16a34a;
    }

    .qr-section {
      text-align: center;
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .qr-code {
      width: 80px;
      height: 80px;
      margin: 8px auto;
    }

    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #6b7280;
    }

    .footer p {
      margin: 2px 0;
    }

    .zatca-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 8px 10px;
      border-radius: 4px;
      margin: 10px 0;
      text-align: center;
      font-size: 10px;
      color: #92400e;
    }

    .bilingual {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .en { text-align: left; }
    .ar {
      text-align: right;
      font-family: 'Noto Naskh Arabic', serif;
      direction: rtl;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-name">BlindSpot System (BSS)</div>
      <div class="bilingual">
        <div class="en invoice-title">Monthly VAT Report</div>
        <div class="ar invoice-title">\u062A\u0642\u0631\u064A\u0631 \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0634\u0647\u0631\u064A</div>
      </div>
    </div>

    <div class="content">
      <div class="invoice-details">
        <div class="invoice-details-grid">
          <div class="detail-row">
            <span class="detail-label">Report Number / \u0631\u0642\u0645 \u0627\u0644\u062A\u0642\u0631\u064A\u0631:</span>
            <span class="detail-value">${escapeHtml(data.serialNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Period / \u0627\u0644\u0641\u062A\u0631\u0629:</span>
            <span class="detail-value">${monthName.en} ${data.reportYear} / ${monthName.ar} ${data.reportYear}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Generated / \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621:</span>
            <span class="detail-value">${data.generatedDate.toLocaleDateString("en-GB")}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tax Number / \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064A\u0628\u064A:</span>
            <span class="detail-value">${escapeHtml(data.taxNumber)}</span>
          </div>
        </div>
      </div>

      <div class="zatca-notice">
        <strong>\u26A0\uFE0F ZATCA Compliance Notice / \u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629</strong><br/>
        This report is prepared for VAT return submission to ZATCA<br/>
        \u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0645\u0639\u062F \u0644\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0625\u0642\u0631\u0627\u0631 \u0627\u0644\u0636\u0631\u064A\u0628\u064A \u0625\u0644\u0649 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0631\u0643
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Taxpayer Information / \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062F\u0627\u0641\u0639 \u0627\u0644\u0636\u0631\u0627\u0626\u0628</h3>
          <p><strong>${escapeHtml(data.restaurantName)}</strong></p>
          <p>Tax Number / \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064A\u0628\u064A: ${escapeHtml(data.taxNumber)}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description / \u0627\u0644\u0648\u0635\u0641</th>
            <th class="text-right">Base Amount / \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0623\u0633\u0627\u0633\u064A</th>
            <th class="text-right">VAT (15%) / \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629</th>
            <th class="text-right">Total / \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Total Sales / \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A</strong><br/>
              <small>Sales subject to VAT / \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u062E\u0627\u0636\u0639\u0629 \u0644\u0644\u0636\u0631\u064A\u0628\u0629</small>
            </td>
            <td class="text-right">${data.totalSalesBaseAmount.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalSalesVat.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalSales.toFixed(2)} SAR</td>
          </tr>
          <tr>
            <td>
              <strong>Total Purchases / \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A</strong><br/>
              <small>Purchases subject to VAT / \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u062E\u0627\u0636\u0639\u0629 \u0644\u0644\u0636\u0631\u064A\u0628\u0629</small>
            </td>
            <td class="text-right">${data.totalPurchasesBaseAmount.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalPurchasesVat.toFixed(2)} SAR</td>
            <td class="text-right">${data.totalPurchases.toFixed(2)} SAR</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row highlight">
          <span><strong>Output VAT (Sales) / \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A (\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A):</strong></span>
          <span><strong>${data.totalSalesVat.toFixed(2)} SAR</strong></span>
        </div>
        <div class="summary-row highlight">
          <span><strong>Input VAT (Purchases) / \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A (\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A):</strong></span>
          <span><strong>(${data.totalPurchasesVat.toFixed(2)}) SAR</strong></span>
        </div>
        <div class="summary-row total">
          <span>Net VAT Payable / \u0635\u0627\u0641\u064A \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0629:</span>
          <span>${data.netVatPayable.toFixed(2)} SAR</span>
        </div>
      </div>

      <div class="qr-section">
        <p style="color: #6b7280; margin-bottom: 10px;">Scan for ZATCA Verification / \u0627\u0645\u0633\u062D \u0644\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629</p>
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code"/>
      </div>

      <div class="footer">
        <p><strong>Instructions / \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A:</strong></p>
        <p>Submit this report to ZATCA through their portal within the prescribed deadline</p>
        <p>\u0642\u0645 \u0628\u062A\u0642\u062F\u064A\u0645 \u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0625\u0644\u0649 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0631\u0643 \u0639\u0628\u0631 \u0628\u0648\u0627\u0628\u062A\u0647\u0645 \u0636\u0645\u0646 \u0627\u0644\u0645\u0647\u0644\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629</p>
        <p style="margin-top: 15px;">This is a ZATCA-compliant VAT return certificate / \u0647\u0630\u0647 \u0634\u0647\u0627\u062F\u0629 \u0625\u0642\u0631\u0627\u0631 \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0647\u064A\u0626\u0629 \u0627\u0644\u0632\u0643\u0627\u0629</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
function generateInvestorStatementHTML(data) {
  const {
    investor,
    companyName,
    companyVAT,
    companyAddress,
    companyPhone,
    companyEmail,
    netProfit,
    monthlyEarnings,
    totalRevenue,
    totalCOGS,
    totalSalaries,
    totalBills,
    statementDate,
    periodStart,
    periodEnd
  } = data;
  const escapedCompanyName = escapeHtml(companyName);
  const escapedInvestorName = escapeHtml(investor.name);
  const escapedCompanyVAT = escapeHtml(companyVAT);
  const escapedCompanyAddress = escapeHtml(companyAddress);
  const escapedCompanyPhone = escapeHtml(companyPhone);
  const escapedCompanyEmail = escapeHtml(companyEmail);
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-SA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  const formatCurrency = (amount) => {
    return amount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  let logoHTML = "";
  if (data.logoPath) {
    try {
      const logoFullPath = path2.join(process.cwd(), data.logoPath);
      if (existsSync(logoFullPath)) {
        const logoBuffer = readFileSync(logoFullPath);
        const logoExt = path2.extname(data.logoPath).substring(1);
        const logoMimeType = logoExt === "svg" ? "svg+xml" : logoExt;
        const logoBase64 = logoBuffer.toString("base64");
        const logoDataURL = `data:image/${logoMimeType};base64,${logoBase64}`;
        logoHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${logoDataURL}" alt="Business Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" />
        </div>
      `;
      }
    } catch (error) {
      console.error("[InvestorStatement] Failed to load logo:", error);
    }
  }
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Noto Naskh Arabic', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }
    
    .statement-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }
    
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 20px 25px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .statement-badge {
      display: inline-block;
      background: white;
      color: #059669;
      padding: 5px 18px;
      border-radius: 15px;
      font-weight: 700;
      font-size: 11px;
      margin-top: 5px;
    }
    
    .section {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .section-title {
      font-weight: 700;
      font-size: 12px;
      color: #059669;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #059669;
      padding-bottom: 6px;
    }
    
    .bilingual-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .bilingual-header .ar {
      direction: rtl;
      text-align: right;
      font-family: 'Noto Naskh Arabic', sans-serif;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #374151;
    }
    
    .info-value {
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .highlight-value {
      color: #059669;
      font-weight: 700;
      font-size: 14px;
    }
    
    .earnings-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .earnings-table thead {
      background: #059669;
      color: white;
    }
    
    .earnings-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .earnings-table th.rtl {
      text-align: right;
    }
    
    .earnings-table th.text-right {
      text-align: right;
    }
    
    .earnings-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .earnings-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .earnings-table td {
      padding: 10px 12px;
      font-size: 10px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 15px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .summary-row:last-child {
      border-bottom: none;
      padding-top: 12px;
    }
    
    .summary-label {
      font-weight: 500;
    }
    
    .summary-value {
      font-weight: 700;
      font-size: 16px;
    }
    
    .total-row {
      font-size: 18px;
    }
    
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 9px;
    }
    
    .footer p {
      margin: 3px 0;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 20px;
    }
    
    .signature-box {
      width: 45%;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #374151;
      margin-bottom: 8px;
      height: 50px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="statement-container">
    ${logoHTML}
    <div class="header">
      <div class="company-name">${escapedCompanyName}</div>
      <div class="statement-badge">INVESTOR STATEMENT / \u0643\u0634\u0641 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631</div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Company Information</span>
        <span class="ar">\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629</span>
      </div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">VAT Number:</span>
            <span class="info-value">${escapedCompanyVAT}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${escapedCompanyPhone}</span>
          </div>
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${escapedCompanyAddress}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${escapedCompanyEmail}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Investor Details / \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631</span>
      </div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">Investor Name / \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631:</span>
            <span class="info-value">${escapedInvestorName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Investor Type / \u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631:</span>
            <span class="info-value">${investor.investorType === "recipe" ? "Recipe Owner / \u0635\u0627\u062D\u0628 \u0648\u0635\u0641\u0629" : "Money Investor / \u0645\u0633\u062A\u062B\u0645\u0631 \u0645\u0627\u0644\u064A"}</span>
          </div>
          ${investor.investorType === "recipe" && investor.recipeName ? `
          <div class="info-row">
            <span class="info-label">Recipe / \u0627\u0644\u0648\u0635\u0641\u0629:</span>
            <span class="info-value highlight-value">${escapeHtml(investor.recipeName)}</span>
          </div>
          ` : `
          <div class="info-row">
            <span class="info-label">Amount Invested / \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631:</span>
            <span class="info-value highlight-value">${formatCurrency(parseFloat(investor.amountInvested))} SAR</span>
          </div>
          `}
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Interest Percentage / \u0646\u0633\u0628\u0629 \u0627\u0644\u0641\u0627\u0626\u062F\u0629:</span>
            <span class="info-value">${investor.interestPercentage}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Investment Date / \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631:</span>
            <span class="info-value">${formatDate(investor.createdAt)}</span>
          </div>
        </div>
      </div>
      ${investor.notes ? `
      <div class="info-row" style="margin-top: 10px;">
        <span class="info-label">Notes / \u0645\u0644\u0627\u062D\u0638\u0627\u062A:</span>
        <span class="info-value">${escapeHtml(investor.notes)}</span>
      </div>
      ` : ""}
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Statement Period / \u0641\u062A\u0631\u0629 \u0643\u0634\u0641 \u0627\u0644\u062D\u0633\u0627\u0628</span>
      </div>
      <div class="info-row">
        <span class="info-label">Statement Date / \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0643\u0634\u0641:</span>
        <span class="info-value">${formatDate(statementDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Period / \u0627\u0644\u0641\u062A\u0631\u0629:</span>
        <span class="info-value">${formatDate(periodStart)} - ${formatDate(periodEnd)}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title bilingual-header">
        <span>Earnings Breakdown / \u062A\u0641\u0635\u064A\u0644 \u0627\u0644\u0623\u0631\u0628\u0627\u062D</span>
      </div>
      <table class="earnings-table">
        <thead>
          <tr>
            <th>Description / \u0627\u0644\u0648\u0635\u0641</th>
            <th class="text-right">Amount (SAR) / \u0627\u0644\u0645\u0628\u0644\u063A (\u0631\u064A\u0627\u0644)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total Revenue / \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A</strong></td>
            <td class="text-right">${formatCurrency(totalRevenue)}</td>
          </tr>
          <tr>
            <td>Less: Cost of Goods Sold / \u0646\u0627\u0642\u0635: \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0626\u0639 \u0627\u0644\u0645\u0628\u0627\u0639\u0629</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalCOGS)})</td>
          </tr>
          <tr>
            <td>Less: Salaries & Wages / \u0646\u0627\u0642\u0635: \u0627\u0644\u0631\u0648\u0627\u062A\u0628 \u0648\u0627\u0644\u0623\u062C\u0648\u0631</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalSalaries)})</td>
          </tr>
          <tr>
            <td>Less: Operating Expenses / \u0646\u0627\u0642\u0635: \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(totalBills)})</td>
          </tr>
          <tr style="background: #ecfdf5;">
            <td><strong>Net Profit / \u0635\u0627\u0641\u064A \u0627\u0644\u0631\u0628\u062D</strong></td>
            <td class="text-right" style="color: #059669; font-weight: 700;">${formatCurrency(netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Net Profit for Period / \u0635\u0627\u0641\u064A \u0627\u0644\u0631\u0628\u062D \u0644\u0644\u0641\u062A\u0631\u0629</span>
        <span class="summary-value">${formatCurrency(netProfit)} SAR</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Your Share (${investor.interestPercentage}%) / \u062D\u0635\u062A\u0643</span>
        <span class="summary-value">${formatCurrency(monthlyEarnings)} SAR</span>
      </div>
      <div class="summary-row total-row">
        <span class="summary-label"><strong>Total Receivable / \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0633\u062A\u062D\u0642</strong></span>
        <span class="summary-value">${formatCurrency(monthlyEarnings)} SAR</span>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Authorized Signature / \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0645\u0639\u062A\u0645\u062F</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Investor Signature / \u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This statement is generated electronically and is valid without signature for informational purposes.</p>
      <p>\u0647\u0630\u0627 \u0627\u0644\u0643\u0634\u0641 \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u064B \u0648\u0647\u0648 \u0635\u0627\u0644\u062D \u0628\u062F\u0648\u0646 \u062A\u0648\u0642\u064A\u0639 \u0644\u0623\u063A\u0631\u0627\u0636 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A.</p>
      <p style="margin-top: 8px;">Generated on ${formatDate(/* @__PURE__ */ new Date())} | ${escapedCompanyName}</p>
    </div>
  </div>
</body>
</html>
  `;
}
async function generateInvestorStatementPDF(data) {
  console.log("[InvestorStatement] Generating PDF for investor:", data.investor.name);
  const html = generateInvestorStatementHTML(data);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });
    console.log("[InvestorStatement] PDF generated successfully");
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
var browserInstance, browserLaunchPromise;
var init_invoice = __esm({
  "server/invoice.ts"() {
    "use strict";
    browserInstance = null;
    browserLaunchPromise = null;
  }
});

// server/orderProcessingService.ts
var orderProcessingService_exports = {};
__export(orderProcessingService_exports, {
  OrderProcessingService: () => OrderProcessingService,
  orderProcessingService: () => orderProcessingService
});
import { eq as eq2 } from "drizzle-orm";
var OrderProcessingService, orderProcessingService;
var init_orderProcessingService = __esm({
  "server/orderProcessingService.ts"() {
    "use strict";
    init_db();
    init_schema();
    OrderProcessingService = class {
      async prepareOrderStock(orderItems, branchId) {
        try {
          const stockRequirements = /* @__PURE__ */ new Map();
          for (const orderItem of orderItems) {
            const menuItem = await db.select().from(menuItems).where(eq2(menuItems.id, orderItem.id)).limit(1);
            if (!menuItem || menuItem.length === 0) {
              continue;
            }
            const item = menuItem[0];
            if (item.recipeId) {
              await this.processRecipeBasedItem(
                item,
                orderItem.quantity,
                stockRequirements,
                branchId
              );
            } else if (item.stockNo) {
              await this.processSimpleItem(
                item,
                orderItem.quantity,
                stockRequirements,
                branchId
              );
            }
          }
          const validationResult = await this.validateStock(stockRequirements);
          if (!validationResult.isValid) {
            return validationResult;
          }
          return { isValid: true, stockRequirements };
        } catch (error) {
          console.error("Error in prepareOrderStock:", error);
          throw error;
        }
      }
      async createOrderWithInventoryDeduction(orderData, stockRequirements, branchId) {
        return await db.transaction(async (tx) => {
          const { orders: orders2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const [order] = await tx.insert(orders2).values(orderData).returning();
          await this.deductInventoryInTransaction(tx, stockRequirements, order.id, branchId);
          return order;
        });
      }
      async finalizeOrderWithInventory(orderData, stockRequirements, orderId, branchId) {
        try {
          await this.deductInventory(stockRequirements, orderId, branchId);
        } catch (error) {
          console.error("Error in finalizeOrderWithInventory:", error);
          throw error;
        }
      }
      async deductInventoryInTransaction(tx, stockRequirements, orderId, branchId) {
        for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
          const currentItem = await tx.select().from(inventoryItems).where(eq2(inventoryItems.id, inventoryItemId)).limit(1);
          if (!currentItem || currentItem.length === 0) continue;
          const quantityBefore = parseFloat(currentItem[0].quantity);
          const quantityAfter = quantityBefore - requirement.requiredQuantity;
          if (quantityAfter < 0) {
            throw new Error(
              `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
            );
          }
          await tx.update(inventoryItems).set({
            quantity: quantityAfter.toString(),
            status: quantityAfter === 0 ? "Out of Stock" : quantityAfter < 10 ? "Low Stock" : "In Stock"
          }).where(eq2(inventoryItems.id, inventoryItemId));
          const transactionRecord = {
            restaurantId: currentItem[0].restaurantId,
            inventoryItemId,
            orderId,
            type: "sale",
            quantityChange: (-requirement.requiredQuantity).toString(),
            quantityBefore: quantityBefore.toString(),
            quantityAfter: quantityAfter.toString(),
            notes: `Deducted for order`,
            branchId
          };
          await tx.insert(inventoryTransactions).values(transactionRecord);
        }
      }
      async processRecipeBasedItem(menuItem, quantity, stockRequirements, branchId) {
        if (!menuItem.recipeId) return;
        const recipeResult = await db.select().from(recipes).where(eq2(recipes.id, menuItem.recipeId)).limit(1);
        if (!recipeResult || recipeResult.length === 0) return;
        const recipe = recipeResult[0];
        const portionMultiplier = parseFloat(menuItem.portionSize || "1.00");
        for (const ingredient of recipe.ingredients) {
          const requiredQty = ingredient.quantity * portionMultiplier * quantity;
          const existing = stockRequirements.get(ingredient.inventoryItemId);
          if (existing) {
            existing.requiredQuantity += requiredQty;
          } else {
            const invItem = await db.select().from(inventoryItems).where(eq2(inventoryItems.id, ingredient.inventoryItemId)).limit(1);
            if (invItem && invItem.length > 0) {
              if (branchId && invItem[0].branchId && invItem[0].branchId !== branchId) {
                throw new Error(`Inventory item ${invItem[0].id} (${invItem[0].name}) belongs to branch ${invItem[0].branchId} but order is for branch ${branchId}`);
              }
              stockRequirements.set(ingredient.inventoryItemId, {
                inventoryItemId: ingredient.inventoryItemId,
                inventoryItemName: ingredient.name,
                requiredQuantity: requiredQty,
                availableQuantity: parseFloat(invItem[0].quantity),
                unit: ingredient.unit
              });
            }
          }
        }
      }
      async processSimpleItem(menuItem, quantity, stockRequirements, branchId) {
        if (!menuItem.inventoryItemId || !menuItem.stockNo) {
          console.warn(`Menu item "${menuItem.name}" is missing inventoryItemId or stockNo for inventory deduction`);
          return;
        }
        const invItems = await db.select().from(inventoryItems).where(eq2(inventoryItems.id, menuItem.inventoryItemId)).limit(1);
        if (!invItems || invItems.length === 0) {
          console.warn(`Inventory item ${menuItem.inventoryItemId} not found for menu item "${menuItem.name}"`);
          return;
        }
        const invItem = invItems[0];
        if (branchId && invItem.branchId && invItem.branchId !== branchId) {
          throw new Error(`Inventory item ${invItem.id} (${invItem.name}) belongs to branch ${invItem.branchId} but order is for branch ${branchId}`);
        }
        const requiredQty = parseFloat(menuItem.stockNo.toString()) * quantity;
        const existing = stockRequirements.get(invItem.id);
        if (existing) {
          existing.requiredQuantity += requiredQty;
        } else {
          stockRequirements.set(invItem.id, {
            inventoryItemId: invItem.id,
            inventoryItemName: invItem.name,
            requiredQuantity: requiredQty,
            availableQuantity: parseFloat(invItem.quantity),
            unit: invItem.unit
          });
        }
      }
      async validateStock(stockRequirements) {
        const insufficientItems = [];
        for (const [_, requirement] of Array.from(stockRequirements.entries())) {
          if (requirement.availableQuantity < requirement.requiredQuantity) {
            insufficientItems.push(requirement);
          }
        }
        if (insufficientItems.length > 0) {
          const itemsList = insufficientItems.map(
            (item) => `${item.inventoryItemName}: need ${item.requiredQuantity.toFixed(2)} ${item.unit}, have ${item.availableQuantity.toFixed(2)} ${item.unit}`
          ).join("; ");
          return {
            isValid: false,
            insufficientItems,
            message: `Insufficient inventory: ${itemsList}`
          };
        }
        return { isValid: true };
      }
      async deductInventory(stockRequirements, orderId, branchId) {
        await db.transaction(async (tx) => {
          for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
            const currentItem = await tx.select().from(inventoryItems).where(eq2(inventoryItems.id, inventoryItemId)).limit(1);
            if (!currentItem || currentItem.length === 0) continue;
            const quantityBefore = parseFloat(currentItem[0].quantity);
            const quantityAfter = quantityBefore - requirement.requiredQuantity;
            if (quantityAfter < 0) {
              throw new Error(
                `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
              );
            }
            await tx.update(inventoryItems).set({
              quantity: quantityAfter.toString(),
              status: quantityAfter === 0 ? "Out of Stock" : quantityAfter < 10 ? "Low Stock" : "In Stock"
            }).where(eq2(inventoryItems.id, inventoryItemId));
            const transactionRecord = {
              restaurantId: currentItem[0].restaurantId,
              inventoryItemId,
              orderId,
              type: "sale",
              quantityChange: (-requirement.requiredQuantity).toString(),
              quantityBefore: quantityBefore.toString(),
              quantityAfter: quantityAfter.toString(),
              notes: `Deducted for order`,
              branchId
            };
            await tx.insert(inventoryTransactions).values(transactionRecord);
          }
        });
      }
    };
    orderProcessingService = new OrderProcessingService();
  }
});

// server/moyasarService.ts
var moyasarService_exports = {};
__export(moyasarService_exports, {
  capturePayment: () => capturePayment,
  createInvoice: () => createInvoice,
  createPayment: () => createPayment,
  default: () => moyasarService_default,
  fetchPayment: () => fetchPayment,
  getPublishableKey: () => getPublishableKey,
  refundPayment: () => refundPayment,
  verifyWebhookPayment: () => verifyWebhookPayment
});
import Moyasar from "moyasar";
async function createPayment(params) {
  try {
    const amountHalalas = Math.round(params.amount * 100);
    const paymentData = {
      amount: amountHalalas,
      currency: params.currency || "SAR",
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {}
    };
    if (params.source) {
      paymentData.source = params.source;
    }
    const payment = await Moyasar.payment.create(paymentData);
    return payment;
  } catch (error) {
    console.error("Moyasar payment creation failed:", error);
    throw new Error(error.message || "Payment creation failed");
  }
}
async function fetchPayment(paymentId) {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Failed to fetch Moyasar payment:", error);
    throw new Error(error.message || "Failed to fetch payment");
  }
}
async function refundPayment(paymentId, amount) {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    const refundData = {};
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }
    const refundedPayment = await payment.refund(refundData);
    return refundedPayment;
  } catch (error) {
    console.error("Moyasar refund failed:", error);
    throw new Error(error.message || "Refund failed");
  }
}
async function capturePayment(paymentId, amount) {
  try {
    const payment = await Moyasar.payment.fetch(paymentId);
    const captureData = {};
    if (amount) {
      captureData.amount = Math.round(amount * 100);
    }
    const capturedPayment = await payment.capture(captureData);
    return capturedPayment;
  } catch (error) {
    console.error("Moyasar capture failed:", error);
    throw new Error(error.message || "Capture failed");
  }
}
async function createInvoice(params) {
  try {
    const amountHalalas = Math.round(params.amount * 100);
    const invoiceData = {
      amount: amountHalalas,
      currency: params.currency || "SAR",
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {}
    };
    if (params.expiredAt) {
      invoiceData.expired_at = params.expiredAt;
    }
    const invoice = await Moyasar.invoice.create(invoiceData);
    return invoice;
  } catch (error) {
    console.error("Moyasar invoice creation failed:", error);
    throw new Error(error.message || "Invoice creation failed");
  }
}
function getPublishableKey() {
  return moyasarPublishableKey;
}
async function verifyWebhookPayment(paymentId) {
  try {
    const payment = await fetchPayment(paymentId);
    return payment.status === "paid";
  } catch (error) {
    return false;
  }
}
var moyasarSecretKey, moyasarPublishableKey, moyasarService_default;
var init_moyasarService = __esm({
  "server/moyasarService.ts"() {
    "use strict";
    moyasarSecretKey = process.env.MOYASAR_SECRET_KEY || "";
    moyasarPublishableKey = process.env.MOYASAR_PUBLISHABLE_KEY || "";
    if (!moyasarSecretKey) {
      console.warn("\u26A0\uFE0F  MOYASAR_SECRET_KEY not configured. Payment processing will not work.");
    }
    if (!moyasarPublishableKey) {
      console.warn("\u26A0\uFE0F  MOYASAR_PUBLISHABLE_KEY not configured. Payment form will not work.");
    }
    Moyasar.setApiKey(moyasarSecretKey);
    moyasarService_default = {
      createPayment,
      fetchPayment,
      refundPayment,
      capturePayment,
      createInvoice,
      getPublishableKey,
      verifyWebhookPayment
    };
  }
});

// server/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  sendTicketNotificationEmail: () => sendTicketNotificationEmail
});
import nodemailer2 from "nodemailer";
async function sendTicketNotificationEmail(ticketData) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || smtpUser;
  const itEmail = process.env.IT_EMAIL || "IT@saudikinzhal.org";
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("Email configuration missing. Skipping email notification.");
    return;
  }
  const transporter = nodemailer2.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #667eea; }
        .priority-badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .priority-urgent { background: #fee2e2; color: #dc2626; }
        .priority-high { background: #fef3c7; color: #d97706; }
        .priority-medium { background: #dbeafe; color: #2563eb; }
        .priority-low { background: #f3f4f6; color: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Support Ticket Created</h1>
          <p style="margin: 0; opacity: 0.9;">Ticket #${ticketData.ticketNumber}</p>
        </div>
        <div class="content">
          <div class="ticket-info">
            <div class="info-row">
              <span class="info-label">Ticket Number:</span>
              <span>${ticketData.ticketNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Subject:</span>
              <span>${ticketData.subject}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Category:</span>
              <span>${ticketData.category}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Priority:</span>
              <span class="priority-badge priority-${ticketData.priority}">${ticketData.priority.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created By:</span>
              <span>${ticketData.userName || ticketData.userId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created At:</span>
              <span>${new Date(ticketData.createdAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  })}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Description:</h3>
            <p style="white-space: pre-wrap; line-height: 1.8;">${ticketData.description}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 15px;">Please log in to the BlindSpot System (BSS) to respond to this ticket.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from BlindSpot System (BSS) Support</p>
          <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} BlindSpot System - Business Management Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const mailOptions = {
    from: `"BSS Support" <${emailFrom}>`,
    to: itEmail,
    subject: `[New Ticket] ${ticketData.ticketNumber} - ${ticketData.subject}`,
    html: emailHtml,
    text: `
New Support Ticket Created

Ticket Number: ${ticketData.ticketNumber}
Subject: ${ticketData.subject}
Category: ${ticketData.category}
Priority: ${ticketData.priority}
Created By: ${ticketData.userName || ticketData.userId}
Created At: ${new Date(ticketData.createdAt).toLocaleString()}

Description:
${ticketData.description}

Please log in to the BlindSpot System (BSS) to respond to this ticket.
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent for ticket ${ticketData.ticketNumber}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}
var init_emailService = __esm({
  "server/emailService.ts"() {
    "use strict";
  }
});

// server/index.ts
init_db();
import express2 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path6 from "path";
import fs4 from "fs";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
init_schema();
init_db();
import { eq, and, gte, lte, sql as sql2, or, isNull, isNotNull, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
var DatabaseStorage = class {
  // Restaurants (Multi-tenant isolation)
  async createRestaurant(restaurant) {
    const [created] = await db.insert(restaurants).values(restaurant).returning();
    return created;
  }
  async getRestaurant(id) {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }
  async updateRestaurant(id, restaurant) {
    const updateData = Object.fromEntries(
      Object.entries(restaurant).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRestaurant(id);
    }
    const [updated] = await db.update(restaurants).set(updateData).where(eq(restaurants.id, id)).returning();
    return updated;
  }
  // Branches (MULTI-TENANT: SQL-level restaurantId filtering)
  async getBranches(restaurantId) {
    return await db.select().from(branches).where(eq(branches.restaurantId, restaurantId));
  }
  async getBranch(id, restaurantId) {
    const [branch] = await db.select().from(branches).where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId)));
    return branch;
  }
  async createBranch(branch) {
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }
  async updateBranch(id, restaurantId, branch) {
    const { restaurantId: _, ...safeData } = branch;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getBranch(id, restaurantId);
    }
    const [updated] = await db.update(branches).set(updateData).where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteBranch(id, restaurantId) {
    const result = await db.delete(branches).where(and(eq(branches.id, id), eq(branches.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Inventory (MULTI-TENANT: filters by restaurantId)
  async getInventoryItems(restaurantId, branchId) {
    if (branchId) {
      return await db.select().from(inventoryItems).where(
        and(eq(inventoryItems.restaurantId, restaurantId), eq(inventoryItems.branchId, branchId))
      );
    }
    return await db.select().from(inventoryItems).where(eq(inventoryItems.restaurantId, restaurantId));
  }
  async getInventoryItem(id, restaurantId) {
    const [item] = await db.select().from(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
    return item;
  }
  async createInventoryItem(item) {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }
  async updateInventoryItem(id, restaurantId, item) {
    const { restaurantId: _, ...safeData } = item;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInventoryItem(id, restaurantId);
    }
    const [updated] = await db.update(inventoryItems).set(updateData).where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId))).returning();
    return updated;
  }
  async updateInventoryItemsSortOrder(restaurantId, updates) {
    for (const update of updates) {
      await db.update(inventoryItems).set({ sortOrder: update.sortOrder }).where(and(eq(inventoryItems.id, update.id), eq(inventoryItems.restaurantId, restaurantId)));
    }
  }
  async deleteInventoryItem(id, restaurantId) {
    const result = await db.delete(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Menu (MULTI-TENANT: SQL-level restaurantId filtering)
  async getMenuItems(restaurantId) {
    return await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }
  async getMenuItem(id, restaurantId) {
    const [item] = await db.select().from(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
    return item;
  }
  async createMenuItem(item) {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }
  async updateMenuItem(id, restaurantId, item) {
    const { restaurantId: _, ...safeData } = item;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getMenuItem(id, restaurantId);
    }
    const [updated] = await db.update(menuItems).set(updateData).where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteMenuItem(id, restaurantId) {
    const result = await db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async getMenuItemsStock(restaurantId, branchId) {
    const allMenuItems = await this.getMenuItems(restaurantId);
    const inventory = await this.getInventoryItems(restaurantId, branchId);
    const stock = {};
    for (const menuItem of allMenuItems) {
      if (!menuItem.recipeId) {
        stock[menuItem.id] = 999999;
        continue;
      }
      const recipe = await this.getRecipe(menuItem.recipeId, restaurantId);
      if (!recipe) {
        stock[menuItem.id] = 999999;
        continue;
      }
      let minServings = Infinity;
      for (const ingredient of recipe.ingredients) {
        const inventoryItem = inventory.find((item) => item.id === ingredient.inventoryItemId);
        if (!inventoryItem) {
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
      stock[menuItem.id] = minServings === Infinity ? 0 : minServings;
    }
    return stock;
  }
  // Add-ons (MULTI-TENANT: SQL-level restaurantId filtering)
  async getAddons(restaurantId, menuItemId) {
    if (menuItemId) {
      return await db.select().from(addons).where(
        and(
          eq(addons.restaurantId, restaurantId),
          or(
            isNull(addons.menuItemIds),
            sql2`${addons.menuItemIds} @> ARRAY[${menuItemId}]::varchar[]`
          )
        )
      );
    }
    return await db.select().from(addons).where(eq(addons.restaurantId, restaurantId));
  }
  async getAddon(id, restaurantId) {
    const [addon] = await db.select().from(addons).where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId)));
    return addon;
  }
  async createAddon(addon) {
    const [created] = await db.insert(addons).values(addon).returning();
    return created;
  }
  async updateAddon(id, restaurantId, addon) {
    const { restaurantId: _, ...safeData } = addon;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getAddon(id, restaurantId);
    }
    const [updated] = await db.update(addons).set(updateData).where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteAddon(id, restaurantId) {
    const result = await db.delete(addons).where(and(eq(addons.id, id), eq(addons.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async updateAddonsSortOrder(restaurantId, updates) {
    for (const update of updates) {
      await db.update(addons).set({ sortOrder: update.sortOrder }).where(and(eq(addons.id, update.id), eq(addons.restaurantId, restaurantId)));
    }
  }
  // Recipes (MULTI-TENANT: SQL-level restaurantId filtering)
  async getRecipes(restaurantId) {
    return await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
  }
  async getRecipe(id, restaurantId) {
    const [recipe] = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId)));
    return recipe;
  }
  async createRecipe(recipe) {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }
  async updateRecipe(id, restaurantId, recipe) {
    const { restaurantId: _, ...safeData } = recipe;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getRecipe(id, restaurantId);
    }
    const [updated] = await db.update(recipes).set(updateData).where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId))).returning();
    return updated;
  }
  async updateRecipesSortOrder(restaurantId, updates) {
    for (const update of updates) {
      await db.update(recipes).set({ sortOrder: update.sortOrder }).where(and(eq(recipes.id, update.id), eq(recipes.restaurantId, restaurantId)));
    }
  }
  async deleteRecipe(id, restaurantId) {
    const result = await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async updateRecipeCostsForInventoryItem(inventoryItemId, restaurantId, newPrice) {
    const allRecipes = await this.getRecipes(restaurantId);
    const updatedRecipes = [];
    for (const recipe of allRecipes) {
      const ingredients = recipe.ingredients;
      let hasMatchingIngredient = false;
      const updatedIngredients = ingredients.map((ing) => {
        if (ing.inventoryItemId === inventoryItemId) {
          hasMatchingIngredient = true;
          return { ...ing, unitPrice: newPrice };
        }
        return ing;
      });
      if (hasMatchingIngredient) {
        const newCost = updatedIngredients.reduce((sum, ing) => sum + ing.quantity * ing.unitPrice, 0);
        const [updated] = await db.update(recipes).set({
          ingredients: updatedIngredients,
          cost: newCost.toFixed(2)
        }).where(and(eq(recipes.id, recipe.id), eq(recipes.restaurantId, restaurantId))).returning();
        if (updated) {
          updatedRecipes.push(updated);
        }
      }
    }
    return updatedRecipes;
  }
  // Orders (MULTI-TENANT: enforce restaurantId at SQL layer)
  async getOrders(filter) {
    const conditions = [eq(orders.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(orders.branchId, filter.branchId));
    if (filter.status) conditions.push(eq(orders.status, filter.status));
    if (filter.dateRange?.start) conditions.push(gte(orders.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(orders.createdAt, filter.dateRange.end));
    return await db.select().from(orders).where(and(...conditions));
  }
  async getOrder(id, restaurantId) {
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    return order;
  }
  async createOrder(order) {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }
  async updateOrder(id, restaurantId, order) {
    const { restaurantId: _, ...safeData } = order;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getOrder(id, restaurantId);
    }
    const [updated] = await db.update(orders).set(updateData).where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteOrder(id, restaurantId) {
    const result = await db.delete(orders).where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Transactions (MULTI-TENANT: enforce restaurantId at SQL layer)
  async getTransactions(filter) {
    const conditions = [eq(transactions.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(transactions.branchId, filter.branchId));
    if (filter.dateRange?.start) conditions.push(gte(transactions.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(transactions.createdAt, filter.dateRange.end));
    return await db.select().from(transactions).where(and(...conditions));
  }
  async getTransaction(id, restaurantId) {
    const [transaction] = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.restaurantId, restaurantId)));
    return transaction;
  }
  async createTransaction(transaction) {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }
  // Settings (MULTI-TENANT: SQL-level restaurantId filtering)
  async getSettings(restaurantId) {
    const [setting] = await db.select().from(settings).where(eq(settings.restaurantId, restaurantId));
    return setting;
  }
  async updateSettings(restaurantId, settingsData) {
    const { restaurantId: _, ...safeData } = settingsData;
    const existing = await this.getSettings(restaurantId);
    if (existing) {
      const [updated] = await db.update(settings).set(safeData).where(and(eq(settings.id, existing.id), eq(settings.restaurantId, restaurantId))).returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values([{ ...safeData, restaurantId }]).returning();
      return created;
    }
  }
  async updateSettingsLogoPath(restaurantId, logoPath) {
    const existing = await this.getSettings(restaurantId);
    if (existing) {
      await db.update(settings).set({ logoPath }).where(and(eq(settings.id, existing.id), eq(settings.restaurantId, restaurantId)));
    } else {
      await db.insert(settings).values({ restaurantId, logoPath });
    }
  }
  // Procurement
  async getProcurements(filter) {
    const conditions = [eq(procurement.restaurantId, filter.restaurantId)];
    if (filter.type) conditions.push(eq(procurement.type, filter.type));
    if (filter.status) conditions.push(eq(procurement.status, filter.status));
    if (filter.branchId) conditions.push(eq(procurement.branchId, filter.branchId));
    return await db.select().from(procurement).where(and(...conditions));
  }
  async getProcurement(id, restaurantId) {
    const [item] = await db.select().from(procurement).where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)));
    return item;
  }
  async createProcurement(procurementData) {
    const [created] = await db.insert(procurement).values(procurementData).returning();
    return created;
  }
  async updateProcurement(id, restaurantId, procurementData) {
    const { restaurantId: _, ...safeData } = procurementData;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getProcurement(id, restaurantId);
    }
    const [updated] = await db.update(procurement).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteProcurement(id, restaurantId) {
    const result = await db.delete(procurement).where(and(eq(procurement.id, id), eq(procurement.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Users (MULTI-TENANT: SQL-level restaurantId filtering)
  async getAllUsers() {
    return await db.select().from(users);
  }
  async getUsers(restaurantId) {
    return await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  }
  async getUser(id, restaurantId) {
    const [user2] = await db.select().from(users).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));
    return user2;
  }
  async getUserByUsername(username) {
    const [user2] = await db.select().from(users).where(eq(users.username, username));
    return user2;
  }
  async getUserById(id) {
    const [user2] = await db.select().from(users).where(eq(users.id, id));
    return user2;
  }
  async getUserByEmail(email) {
    const [user2] = await db.select().from(users).where(eq(users.email, email));
    return user2;
  }
  async createUser(user2) {
    const hashedPassword = await bcrypt.hash(user2.password, 10);
    const [created] = await db.insert(users).values({ ...user2, password: hashedPassword }).returning();
    return created;
  }
  async updateUser(id, restaurantId, user2) {
    const { restaurantId: _, ...safeData } = user2;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0 && value !== null)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUser(id, restaurantId);
    }
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const [updated] = await db.update(users).set(updateData).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId))).returning();
    return updated;
  }
  async updateUserById(id, user2) {
    const { restaurantId: _, ...safeData } = user2;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0 && value !== null)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getUserById(id);
    }
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id, restaurantId) {
    const result = await db.delete(users).where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async setPasswordResetToken(userId, token, expiry) {
    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpiry: expiry
    }).where(eq(users.id, userId));
  }
  async getUserByResetToken(token) {
    const [user2] = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gte(users.passwordResetExpiry, /* @__PURE__ */ new Date())
        // Check token not expired
      )
    );
    return user2;
  }
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
  async clearPasswordResetToken(userId) {
    await db.update(users).set({
      passwordResetToken: null,
      passwordResetExpiry: null
    }).where(eq(users.id, userId));
  }
  async getValidBootstrapToken(plainToken) {
    const tokens = await db.select().from(bootstrapResetTokens).where(
      and(
        eq(bootstrapResetTokens.consumed, false),
        gte(bootstrapResetTokens.expiresAt, /* @__PURE__ */ new Date())
        // Check token not expired
      )
    );
    for (const token of tokens) {
      const isValid = await bcrypt.compare(plainToken, token.tokenHash);
      if (isValid) {
        return { id: token.id, tokenHash: token.tokenHash };
      }
    }
    return void 0;
  }
  async consumeBootstrapToken(tokenId, username, ipAddress) {
    await db.update(bootstrapResetTokens).set({
      consumed: true,
      consumedAt: /* @__PURE__ */ new Date(),
      consumedBy: username,
      ipAddress
    }).where(eq(bootstrapResetTokens.id, tokenId));
  }
  async getUserProfile(userId, restaurantId) {
    const [user2] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.restaurantId, restaurantId)));
    return user2;
  }
  async updateUserProfile(userId, restaurantId, profile) {
    const [updated] = await db.update(users).set(profile).where(and(eq(users.id, userId), eq(users.restaurantId, restaurantId))).returning();
    return updated;
  }
  async cancelSubscription(userId, restaurantId) {
    const user2 = await this.getUser(userId, restaurantId);
    if (!user2 || !user2.restaurantId) return void 0;
    await db.update(restaurants).set({
      subscriptionStatus: "cancelled",
      subscriptionCancelledAt: /* @__PURE__ */ new Date()
    }).where(eq(restaurants.id, user2.restaurantId));
    return user2;
  }
  // Activity Tracking (for IT Dashboard monitoring)
  async updateUserActivity(userId) {
    await db.update(users).set({ lastActivityAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  }
  async updateUserLogin(userId) {
    const now = /* @__PURE__ */ new Date();
    await db.update(users).set({
      lastLoginAt: now,
      lastActivityAt: now
    }).where(eq(users.id, userId));
  }
  async getClientAccountsActivity() {
    const result = await db.select({
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      restaurantId: users.restaurantId,
      restaurantName: restaurants.name,
      lastActivityAt: users.lastActivityAt,
      lastLoginAt: users.lastLoginAt
    }).from(users).leftJoin(restaurants, eq(users.restaurantId, restaurants.id)).where(isNotNull(users.restaurantId)).orderBy(desc(users.lastActivityAt));
    const now = /* @__PURE__ */ new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1e3);
    return result.map((row) => ({
      userId: row.userId,
      username: row.username,
      fullName: row.fullName,
      restaurantId: row.restaurantId,
      // Safe after isNotNull filter
      restaurantName: row.restaurantName || "Unknown",
      lastActivityAt: row.lastActivityAt,
      lastLoginAt: row.lastLoginAt,
      isOnline: row.lastActivityAt ? row.lastActivityAt >= fiveMinutesAgo : false
    }));
  }
  // Invoices
  async getInvoices(filter) {
    const conditions = [eq(invoices.restaurantId, filter.restaurantId)];
    if (filter.branchId) conditions.push(eq(invoices.branchId, filter.branchId));
    if (filter.dateRange?.start) conditions.push(gte(invoices.createdAt, filter.dateRange.start));
    if (filter.dateRange?.end) conditions.push(lte(invoices.createdAt, filter.dateRange.end));
    return await db.select().from(invoices).where(and(...conditions));
  }
  async getInvoice(id, restaurantId) {
    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId)));
    return invoice;
  }
  async getInvoicePublic(orderIdOrInvoiceId) {
    const [invoiceByOrderId] = await db.select().from(invoices).where(eq(invoices.orderId, orderIdOrInvoiceId));
    if (invoiceByOrderId) {
      return invoiceByOrderId;
    }
    const [invoiceById] = await db.select().from(invoices).where(eq(invoices.id, orderIdOrInvoiceId));
    return invoiceById;
  }
  async createInvoice(invoice) {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }
  async updateInvoice(id, restaurantId, invoice) {
    const { restaurantId: _, ...safeData } = invoice;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvoice(id, restaurantId);
    }
    const [updated] = await db.update(invoices).set(updateData).where(and(eq(invoices.id, id), eq(invoices.restaurantId, restaurantId))).returning();
    return updated;
  }
  // Customers (MULTI-TENANT: filters by restaurantId)
  async getCustomers(restaurantId) {
    return await db.select().from(customers).where(eq(customers.restaurantId, restaurantId));
  }
  async getCustomer(id, restaurantId) {
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId)));
    return customer;
  }
  async createCustomer(customer) {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }
  async updateCustomer(id, restaurantId, customer) {
    const { restaurantId: _, ...safeData } = customer;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getCustomer(id, restaurantId);
    }
    const [updated] = await db.update(customers).set(updateData).where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId))).returning();
    return updated;
  }
  async deleteCustomer(id, restaurantId) {
    const result = await db.delete(customers).where(and(eq(customers.id, id), eq(customers.restaurantId, restaurantId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async findCustomerByPhone(restaurantId, phone) {
    const [customer] = await db.select().from(customers).where(and(eq(customers.restaurantId, restaurantId), eq(customers.phone, phone)));
    return customer;
  }
  async upsertCustomer(restaurantId, data) {
    const existing = await this.findCustomerByPhone(restaurantId, data.phone);
    if (existing) {
      const [updated] = await db.update(customers).set({ name: data.name }).where(and(eq(customers.id, existing.id), eq(customers.restaurantId, restaurantId))).returning();
      return updated;
    } else {
      const [created] = await db.insert(customers).values({ restaurantId, name: data.name, phone: data.phone }).returning();
      return created;
    }
  }
  // Shop Salaries (MULTI-TENANT: filters by restaurantId)
  async getSalaries(restaurantId, branchId, startDate, endDate) {
    const conditions = [eq(salaries.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(salaries.branchId, branchId));
    if (startDate) conditions.push(gte(salaries.paymentDate, startDate));
    if (endDate) conditions.push(lte(salaries.paymentDate, endDate));
    return await db.select().from(salaries).where(and(...conditions));
  }
  async getSalary(id) {
    const [salary] = await db.select().from(salaries).where(eq(salaries.id, id));
    return salary;
  }
  async createSalary(salary) {
    const [created] = await db.insert(salaries).values(salary).returning();
    return created;
  }
  async updateSalary(id, salary) {
    const updateData = Object.fromEntries(
      Object.entries(salary).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getSalary(id);
    }
    const [updated] = await db.update(salaries).set(updateData).where(eq(salaries.id, id)).returning();
    return updated;
  }
  async deleteSalary(id) {
    const result = await db.delete(salaries).where(eq(salaries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Shop Bills (MULTI-TENANT: filters by restaurantId)
  async getShopBills(restaurantId, branchId, startDate, endDate, includeArchived = false) {
    const conditions = [eq(shopBills.restaurantId, restaurantId)];
    if (branchId) conditions.push(eq(shopBills.branchId, branchId));
    if (startDate) conditions.push(gte(shopBills.paymentDate, startDate));
    if (endDate) conditions.push(lte(shopBills.paymentDate, endDate));
    if (!includeArchived) conditions.push(eq(shopBills.archived, false));
    return await db.select().from(shopBills).where(and(...conditions));
  }
  async getShopBill(id) {
    const [bill] = await db.select().from(shopBills).where(eq(shopBills.id, id));
    return bill;
  }
  async createShopBill(bill) {
    const [created] = await db.insert(shopBills).values(bill).returning();
    return created;
  }
  async updateShopBill(id, bill) {
    const updateData = Object.fromEntries(
      Object.entries(bill).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getShopBill(id);
    }
    const [updated] = await db.update(shopBills).set(updateData).where(eq(shopBills.id, id)).returning();
    return updated;
  }
  async deleteShopBill(id) {
    const result = await db.delete(shopBills).where(eq(shopBills.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async archiveShopBill(id, archived) {
    const [updated] = await db.update(shopBills).set({ archived }).where(eq(shopBills.id, id)).returning();
    return updated;
  }
  async generateSalaryBills(restaurantId, paymentMonth) {
    const employees = await db.select().from(users).where(
      and(
        eq(users.restaurantId, restaurantId),
        eq(users.active, true),
        isNotNull(users.salary)
      )
    );
    const existingBills = await db.select().from(shopBills).where(
      and(
        eq(shopBills.restaurantId, restaurantId),
        eq(shopBills.billType, "salary"),
        eq(shopBills.paymentMonth, paymentMonth)
      )
    );
    const existingEmployeeIds = new Set(existingBills.map((bill) => bill.employeeId).filter(Boolean));
    let created = 0;
    let skipped = 0;
    const createdBills = [];
    for (const employee of employees) {
      if (existingEmployeeIds.has(employee.id)) {
        skipped++;
        continue;
      }
      if (!employee.salary || parseFloat(employee.salary) <= 0) {
        skipped++;
        continue;
      }
      const [year, month] = paymentMonth.split("-");
      const paymentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const billData = {
        restaurantId,
        billType: "salary",
        amount: employee.salary,
        paymentDate,
        paymentPeriod: "monthly",
        status: "pending",
        employeeId: employee.id,
        employeeName: employee.fullName,
        paymentMonth,
        description: `Monthly salary for ${employee.fullName}${employee.position ? ` (${employee.position})` : ""}`,
        branchId: employee.branchId || null,
        archived: false
      };
      const [bill] = await db.insert(shopBills).values(billData).returning();
      createdBills.push(bill);
      created++;
    }
    return { created, skipped, bills: createdBills };
  }
  // Delivery Apps (MULTI-TENANT: filters by restaurantId)
  async getDeliveryApps(restaurantId) {
    return await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    ).orderBy(deliveryApps.sortOrder);
  }
  async getDeliveryApp(id) {
    const [app2] = await db.select().from(deliveryApps).where(eq(deliveryApps.id, id));
    return app2;
  }
  async createDeliveryApp(app2) {
    const [created] = await db.insert(deliveryApps).values(app2).returning();
    return created;
  }
  async updateDeliveryApp(id, app2) {
    const updateData = Object.fromEntries(
      Object.entries(app2).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getDeliveryApp(id);
    }
    const [updated] = await db.update(deliveryApps).set(updateData).where(eq(deliveryApps.id, id)).returning();
    return updated;
  }
  async deleteDeliveryApp(id) {
    const result = await db.delete(deliveryApps).where(eq(deliveryApps.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async updateDeliveryAppsSortOrder(updates) {
    for (const update of updates) {
      await db.update(deliveryApps).set({ sortOrder: update.sortOrder }).where(eq(deliveryApps.id, update.id));
    }
  }
  async getDeliveryAppProfitability(restaurantId) {
    const apps = await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    );
    const allOrders = await db.select().from(orders).where(
      and(eq(orders.restaurantId, restaurantId), sql2`${orders.deliveryAppId} IS NOT NULL`)
    );
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
    const allRecipes = await db.select().from(recipes).where(eq(recipes.restaurantId, restaurantId));
    const itemCostMap = /* @__PURE__ */ new Map();
    for (const item of allMenuItems) {
      if (item.recipeId) {
        const recipe = allRecipes.find((r) => r.id === item.recipeId);
        if (recipe) {
          const recipeCost = parseFloat(recipe.cost);
          const portionSize = parseFloat(item.portionSize || "1.00");
          itemCostMap.set(item.id, recipeCost * portionSize);
        }
      }
    }
    const profitabilityData = apps.map((app2) => {
      const appOrders = allOrders.filter((order) => order.deliveryAppId === app2.id);
      let totalGrossRevenue2 = 0;
      let totalCommissionCost2 = 0;
      let totalBankingFeesCost2 = 0;
      let totalSubsidy2 = 0;
      let totalPosFees2 = 0;
      let totalVat2 = 0;
      let totalItemCosts2 = 0;
      appOrders.forEach((order) => {
        const orderTotal = parseFloat(order.total);
        totalGrossRevenue2 += orderTotal;
        const commissionPercent = parseFloat(app2.commission);
        const bankingFeesPercent = parseFloat(app2.bankingFees);
        const posFees = parseFloat(app2.posFees);
        const tiers = Array.isArray(app2.subsidyTiers) ? app2.subsidyTiers : [];
        const applicableTier = tiers.find((tier) => {
          const isAboveMin = orderTotal >= tier.minAmount;
          const isBelowMax = tier.maxAmount === null || orderTotal <= tier.maxAmount;
          return isAboveMin && isBelowMax;
        });
        const subsidy = applicableTier ? applicableTier.subsidy : 0;
        const subsidizedPrice = orderTotal - subsidy;
        const commissionAmount = subsidizedPrice * (commissionPercent / 100);
        const bankingFeesAmount = orderTotal * (bankingFeesPercent / 100);
        const vatBase = commissionAmount + subsidy + bankingFeesAmount;
        const vatAmount = vatBase * 0.15;
        totalCommissionCost2 += commissionAmount;
        totalBankingFeesCost2 += bankingFeesAmount;
        totalSubsidy2 += subsidy;
        totalPosFees2 += posFees;
        totalVat2 += vatAmount;
        const orderItems = Array.isArray(order.items) ? order.items : [];
        orderItems.forEach((item) => {
          const itemCost = itemCostMap.get(item.id) || 0;
          totalItemCosts2 += itemCost * item.quantity;
        });
      });
      const netRevenue2 = totalGrossRevenue2 - totalCommissionCost2 - totalSubsidy2 - totalBankingFeesCost2 - totalVat2 - totalPosFees2;
      const profit2 = netRevenue2 - totalItemCosts2;
      const profitMargin2 = totalGrossRevenue2 > 0 ? profit2 / totalGrossRevenue2 * 100 : 0;
      return {
        deliveryAppId: app2.id,
        deliveryAppName: app2.name,
        totalOrders: appOrders.length,
        totalGrossRevenue: totalGrossRevenue2,
        totalCommissionCost: totalCommissionCost2,
        totalBankingFeesCost: totalBankingFeesCost2,
        totalSubsidy: totalSubsidy2,
        totalVat: totalVat2,
        totalPosFees: totalPosFees2,
        netRevenue: netRevenue2,
        totalItemCosts: totalItemCosts2,
        profit: profit2,
        profitMargin: profitMargin2,
        commissionPercent: parseFloat(app2.commission),
        bankingFeesPercent: parseFloat(app2.bankingFees)
      };
    });
    const totalOrders = profitabilityData.reduce((sum, app2) => sum + app2.totalOrders, 0);
    const totalGrossRevenue = profitabilityData.reduce((sum, app2) => sum + app2.totalGrossRevenue, 0);
    const totalCommissionCost = profitabilityData.reduce((sum, app2) => sum + app2.totalCommissionCost, 0);
    const totalBankingFeesCost = profitabilityData.reduce((sum, app2) => sum + app2.totalBankingFeesCost, 0);
    const totalSubsidy = profitabilityData.reduce((sum, app2) => sum + app2.totalSubsidy, 0);
    const totalVat = profitabilityData.reduce((sum, app2) => sum + app2.totalVat, 0);
    const totalPosFees = profitabilityData.reduce((sum, app2) => sum + app2.totalPosFees, 0);
    const netRevenue = profitabilityData.reduce((sum, app2) => sum + app2.netRevenue, 0);
    const totalItemCosts = profitabilityData.reduce((sum, app2) => sum + app2.totalItemCosts, 0);
    const profit = profitabilityData.reduce((sum, app2) => sum + app2.profit, 0);
    const profitMargin = totalGrossRevenue > 0 ? profit / totalGrossRevenue * 100 : 0;
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
      profitMargin
    };
    return {
      apps: profitabilityData,
      summary
    };
  }
  async getSalesComparison(restaurantId) {
    const allOrders = await db.select().from(orders).where(eq(orders.restaurantId, restaurantId));
    const dineInOrders = allOrders.filter((o) => o.orderType === "Dine-in" && !o.deliveryAppId);
    const takeAwayOrders = allOrders.filter((o) => o.orderType === "Take-away" && !o.deliveryAppId);
    const deliveryAppOrders = allOrders.filter((o) => o.deliveryAppId !== null);
    const calculateMetrics = (orderList) => {
      const totalOrders2 = orderList.length;
      const totalRevenue2 = orderList.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const avgOrderValue = totalOrders2 > 0 ? totalRevenue2 / totalOrders2 : 0;
      return {
        totalOrders: totalOrders2,
        totalRevenue: totalRevenue2,
        avgOrderValue
      };
    };
    const dineInMetrics = calculateMetrics(dineInOrders);
    const takeAwayMetrics = calculateMetrics(takeAwayOrders);
    const deliveryAppMetrics = calculateMetrics(deliveryAppOrders);
    const totalOrders = dineInMetrics.totalOrders + takeAwayMetrics.totalOrders + deliveryAppMetrics.totalOrders;
    const totalRevenue = dineInMetrics.totalRevenue + takeAwayMetrics.totalRevenue + deliveryAppMetrics.totalRevenue;
    const deliveryAppsData = await db.select().from(deliveryApps).where(
      and(eq(deliveryApps.restaurantId, restaurantId), eq(deliveryApps.active, true))
    );
    const deliveryAppBreakdown = deliveryAppsData.map((app2) => {
      const appOrders = deliveryAppOrders.filter((o) => o.deliveryAppId === app2.id);
      const metrics = calculateMetrics(appOrders);
      return {
        appId: app2.id,
        appName: app2.name,
        ...metrics
      };
    });
    return {
      summary: {
        totalOrders,
        totalRevenue
      },
      dineIn: {
        ...dineInMetrics,
        percentage: totalOrders > 0 ? dineInMetrics.totalOrders / totalOrders * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? dineInMetrics.totalRevenue / totalRevenue * 100 : 0
      },
      takeAway: {
        ...takeAwayMetrics,
        percentage: totalOrders > 0 ? takeAwayMetrics.totalOrders / totalOrders * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? takeAwayMetrics.totalRevenue / totalRevenue * 100 : 0
      },
      deliveryApps: {
        ...deliveryAppMetrics,
        percentage: totalOrders > 0 ? deliveryAppMetrics.totalOrders / totalOrders * 100 : 0,
        revenuePercentage: totalRevenue > 0 ? deliveryAppMetrics.totalRevenue / totalRevenue * 100 : 0,
        breakdown: deliveryAppBreakdown
      }
    };
  }
  // Investors (MULTI-TENANT: filters by restaurantId)
  async getInvestors(restaurantId) {
    return await db.select().from(investors).where(
      and(eq(investors.restaurantId, restaurantId), eq(investors.active, true))
    ).orderBy(investors.createdAt);
  }
  async getInvestor(id) {
    const [investor] = await db.select().from(investors).where(eq(investors.id, id));
    return investor;
  }
  async createInvestor(investor) {
    const [created] = await db.insert(investors).values(investor).returning();
    return created;
  }
  async updateInvestor(id, investor) {
    const updateData = Object.fromEntries(
      Object.entries(investor).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getInvestor(id);
    }
    const [updated] = await db.update(investors).set(updateData).where(eq(investors.id, id)).returning();
    return updated;
  }
  async deleteInvestor(id) {
    const result = await db.delete(investors).where(eq(investors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Subscription Invoices
  async getSubscriptionInvoices(userId) {
    if (userId) {
      return await db.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.userId, userId)).orderBy(subscriptionInvoices.invoiceDate);
    }
    return await db.select().from(subscriptionInvoices).orderBy(subscriptionInvoices.invoiceDate);
  }
  async getSubscriptionInvoice(id) {
    const [invoice] = await db.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.id, id));
    return invoice;
  }
  async getSubscriptionInvoiceBySerialNumber(serialNumber, restaurantId) {
    const [invoice] = await db.select({
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
      qrCode: subscriptionInvoices.qrCode
    }).from(subscriptionInvoices).innerJoin(users, eq(subscriptionInvoices.userId, users.id)).where(and(
      eq(subscriptionInvoices.serialNumber, serialNumber),
      eq(users.restaurantId, restaurantId)
    ));
    return invoice;
  }
  async createSubscriptionInvoice(invoice) {
    const [created] = await db.insert(subscriptionInvoices).values(invoice).returning();
    return created;
  }
  async getNextSubscriptionInvoiceSerialNumber() {
    const [result] = await db.select({ count: sql2`count(*)` }).from(subscriptionInvoices);
    const count = (result?.count || 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "");
    const serialNumber = `${count.toString().padStart(4, "0")}-${dateStr}-${timeStr}`;
    return serialNumber;
  }
  // Monthly VAT Reports
  async getMonthlyVatReports(userId) {
    if (userId) {
      return await db.select().from(monthlyVatReports).where(eq(monthlyVatReports.userId, userId)).orderBy(sql2`${monthlyVatReports.reportYear} DESC, ${monthlyVatReports.reportMonth} DESC`);
    }
    return await db.select().from(monthlyVatReports).orderBy(sql2`${monthlyVatReports.reportYear} DESC, ${monthlyVatReports.reportMonth} DESC`);
  }
  async getVatReportByMonth(userId, month, year) {
    const [report] = await db.select().from(monthlyVatReports).where(
      and(
        eq(monthlyVatReports.userId, userId),
        eq(monthlyVatReports.reportMonth, month),
        eq(monthlyVatReports.reportYear, year)
      )
    );
    return report;
  }
  async createVatReport(report) {
    const [created] = await db.insert(monthlyVatReports).values(report).returning();
    return created;
  }
  async getNextVatReportSerialNumber(year, month) {
    const [result] = await db.select({ count: sql2`count(*)` }).from(monthlyVatReports).where(
      and(
        eq(monthlyVatReports.reportYear, year),
        eq(monthlyVatReports.reportMonth, month)
      )
    );
    const count = (result?.count || 0) + 1;
    const serialNumber = `VAT-${year}-${month.toString().padStart(2, "0")}-${count.toString().padStart(4, "0")}`;
    return serialNumber;
  }
  // Support Tickets
  async getSupportTickets(restaurantId, userId, status) {
    let query = db.select().from(supportTickets);
    const conditions = [eq(supportTickets.restaurantId, restaurantId)];
    if (userId) {
      conditions.push(eq(supportTickets.userId, userId));
    }
    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    query = query.where(and(...conditions));
    return await query.orderBy(sql2`${supportTickets.createdAt} DESC`);
  }
  async getSupportTicket(id, restaurantId) {
    const [ticket] = await db.select().from(supportTickets).where(and(eq(supportTickets.id, id), eq(supportTickets.restaurantId, restaurantId)));
    return ticket;
  }
  async createSupportTicket(ticket) {
    const ticketNumber = await this.getNextTicketNumber();
    const [created] = await db.insert(supportTickets).values({
      ...ticket,
      ticketNumber
    }).returning();
    return created;
  }
  async updateSupportTicket(id, restaurantId, ticket) {
    const { restaurantId: _, userId: __, ...safeTicket } = ticket;
    const updateData = { ...safeTicket, updatedAt: /* @__PURE__ */ new Date() };
    if (ticket.status === "resolved" && !updateData.resolvedAt) {
      updateData.resolvedAt = /* @__PURE__ */ new Date();
    }
    if (ticket.status === "closed" && !updateData.closedAt) {
      updateData.closedAt = /* @__PURE__ */ new Date();
    }
    const [updated] = await db.update(supportTickets).set(updateData).where(and(eq(supportTickets.id, id), eq(supportTickets.restaurantId, restaurantId))).returning();
    return updated;
  }
  async getNextTicketNumber() {
    const [result] = await db.select({ count: sql2`count(*)` }).from(supportTickets);
    const count = (result?.count || 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const serialNumber = `TKT-${dateStr}-${count.toString().padStart(4, "0")}`;
    return serialNumber;
  }
  // Ticket Messages
  async getTicketMessages(ticketId, restaurantId) {
    return await db.select().from(ticketMessages).where(and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.restaurantId, restaurantId))).orderBy(sql2`${ticketMessages.createdAt} ASC`);
  }
  async createTicketMessage(message) {
    const [created] = await db.insert(ticketMessages).values(message).returning();
    await db.update(supportTickets).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, message.ticketId));
    return created;
  }
  async markMessagesAsRead(ticketId, restaurantId, userId) {
    await db.update(ticketMessages).set({ isRead: true }).where(
      and(
        eq(ticketMessages.ticketId, ticketId),
        eq(ticketMessages.restaurantId, restaurantId),
        sql2`${ticketMessages.senderId} != ${userId}`
      )
    );
  }
  async getUnreadMessageCount(restaurantId, userId) {
    const userTickets = await db.select({ id: supportTickets.id }).from(supportTickets).where(and(eq(supportTickets.restaurantId, restaurantId), eq(supportTickets.userId, userId)));
    if (userTickets.length === 0) return 0;
    const ticketIds = userTickets.map((t) => t.id);
    const [result] = await db.select({ count: sql2`count(*)` }).from(ticketMessages).where(
      and(
        eq(ticketMessages.restaurantId, restaurantId),
        sql2`${ticketMessages.ticketId} IN (${sql2.join(ticketIds.map((id) => sql2`${id}`), sql2`, `)})`,
        eq(ticketMessages.isRead, false),
        sql2`${ticketMessages.senderId} != ${userId}`
      )
    );
    return result?.count || 0;
  }
  // IT Management Functions
  async assignTicket(ticketId, restaurantId, assignedTo, assignedBy) {
    const updateData = {
      assignedTo,
      assignedBy,
      assignedAt: assignedTo ? /* @__PURE__ */ new Date() : null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const conditions = [eq(supportTickets.id, ticketId)];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }
    const [updated] = await db.update(supportTickets).set(updateData).where(and(...conditions)).returning();
    return updated;
  }
  async getITStaff(restaurantId) {
    const conditions = [
      or(
        eq(users.role, "admin"),
        sql2`${users.permissions} ? 'support'`
      )
    ];
    if (restaurantId) {
      conditions.push(eq(users.restaurantId, restaurantId));
    }
    const itStaff = await db.select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      role: users.role
    }).from(users).where(and(...conditions));
    return itStaff;
  }
  async getITAnalytics(restaurantId) {
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const tickets = restaurantId ? await db.select().from(supportTickets).where(eq(supportTickets.restaurantId, restaurantId)) : await db.select().from(supportTickets);
    const totalOpen = tickets.filter((t) => t.status === "open").length;
    const totalInProgress = tickets.filter((t) => t.status === "in-progress").length;
    const totalResolved = tickets.filter((t) => t.status === "resolved").length;
    const totalClosed = tickets.filter((t) => t.status === "closed").length;
    const urgentCount = tickets.filter((t) => t.priority === "urgent" && t.status !== "closed").length;
    const highPriorityCount = tickets.filter((t) => t.priority === "high" && t.status !== "closed").length;
    const messagesData = restaurantId ? await db.select({
      ticketId: ticketMessages.ticketId,
      createdAt: ticketMessages.createdAt,
      senderRole: ticketMessages.senderRole
    }).from(ticketMessages).where(eq(ticketMessages.restaurantId, restaurantId)).orderBy(ticketMessages.createdAt) : await db.select({
      ticketId: ticketMessages.ticketId,
      createdAt: ticketMessages.createdAt,
      senderRole: ticketMessages.senderRole
    }).from(ticketMessages).orderBy(ticketMessages.createdAt);
    const responseTimesMs = [];
    const ticketsWithResponse = /* @__PURE__ */ new Set();
    for (const msg of messagesData) {
      if (msg.senderRole === "it_support" && !ticketsWithResponse.has(msg.ticketId)) {
        const ticket = tickets.find((t) => t.id === msg.ticketId);
        if (ticket) {
          const responseTime = new Date(msg.createdAt).getTime() - new Date(ticket.createdAt).getTime();
          responseTimesMs.push(responseTime);
          ticketsWithResponse.add(msg.ticketId);
        }
      }
    }
    const avgResponseTimeHours = responseTimesMs.length > 0 ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length / (1e3 * 60 * 60) : 0;
    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    const resolutionTimesMs = resolvedTickets.map(
      (t) => new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()
    );
    const avgResolutionTimeHours = resolutionTimesMs.length > 0 ? resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length / (1e3 * 60 * 60) : 0;
    const ticketsClosedToday = tickets.filter(
      (t) => t.closedAt && new Date(t.closedAt) >= todayStart
    ).length;
    const ticketsClosedThisWeek = tickets.filter(
      (t) => t.closedAt && new Date(t.closedAt) >= weekStart
    ).length;
    const ticketsClosedThisMonth = tickets.filter(
      (t) => t.closedAt && new Date(t.closedAt) >= monthStart
    ).length;
    const yesterdayEnd = todayStart;
    const totalOpenYesterday = tickets.filter((t) => {
      const createdAt = new Date(t.createdAt);
      const closedAt = t.closedAt ? new Date(t.closedAt) : null;
      return createdAt < yesterdayEnd && (!closedAt || closedAt >= yesterdayEnd);
    }).length;
    const openTrend = totalOpenYesterday > 0 ? Math.round((totalOpen - totalOpenYesterday) / totalOpenYesterday * 100) : 0;
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
      ticketsClosedThisMonth
    };
  }
  async getWorkloadDistribution(restaurantId) {
    const itStaff = await this.getITStaff(restaurantId);
    const workload = await Promise.all(itStaff.map(async (staff) => {
      const activeConditions = [
        eq(supportTickets.assignedTo, staff.id),
        sql2`${supportTickets.status} != 'closed'`
      ];
      if (restaurantId) {
        activeConditions.push(eq(supportTickets.restaurantId, restaurantId));
      }
      const activeTickets = await db.select({ count: sql2`count(*)` }).from(supportTickets).where(and(...activeConditions));
      const resolvedConditions = [
        eq(supportTickets.assignedTo, staff.id),
        eq(supportTickets.status, "resolved")
      ];
      if (restaurantId) {
        resolvedConditions.push(eq(supportTickets.restaurantId, restaurantId));
      }
      const resolvedTickets = await db.select({ count: sql2`count(*)` }).from(supportTickets).where(and(...resolvedConditions));
      return {
        ...staff,
        activeTickets: activeTickets[0]?.count || 0,
        resolvedTickets: resolvedTickets[0]?.count || 0
      };
    }));
    return workload;
  }
  async getCategoryBreakdown(restaurantId) {
    const conditions = [sql2`${supportTickets.status} != 'closed'`];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }
    const result = await db.select({
      category: supportTickets.category,
      count: sql2`count(*)`
    }).from(supportTickets).where(and(...conditions)).groupBy(supportTickets.category);
    return result.map((r) => ({ category: r.category, count: r.count || 0 }));
  }
  async getTicketTrends(restaurantId, days = 30) {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const conditions = [gte(supportTickets.createdAt, startDate)];
    if (restaurantId) {
      conditions.push(eq(supportTickets.restaurantId, restaurantId));
    }
    const tickets = await db.select().from(supportTickets).where(and(...conditions));
    const trendMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < days; i++) {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trendMap.set(dateStr, { created: 0, resolved: 0 });
    }
    tickets.forEach((ticket) => {
      const createdDate = new Date(ticket.createdAt).toISOString().split("T")[0];
      if (trendMap.has(createdDate)) {
        trendMap.get(createdDate).created++;
      }
      if (ticket.resolvedAt) {
        const resolvedDate = new Date(ticket.resolvedAt).toISOString().split("T")[0];
        if (trendMap.has(resolvedDate)) {
          trendMap.get(resolvedDate).resolved++;
        }
      }
    });
    return Array.from(trendMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));
  }
  async getAllActiveTicketsForIT() {
    const tickets = await db.select().from(supportTickets).where(
      or(
        eq(supportTickets.status, "open"),
        eq(supportTickets.status, "in-progress"),
        eq(supportTickets.status, "pending")
      )
    ).orderBy(sql2`${supportTickets.createdAt} DESC`);
    return tickets;
  }
  async getSupportTicketForIT(id) {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }
  async getTicketMessagesForIT(ticketId) {
    const ticket = await this.getSupportTicketForIT(ticketId);
    if (!ticket) {
      return [];
    }
    return await db.select().from(ticketMessages).where(and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.restaurantId, ticket.restaurantId))).orderBy(sql2`${ticketMessages.createdAt} ASC`);
  }
  async updateSupportTicketForIT(id, ticket) {
    const { restaurantId: _, userId: __, ...safeData } = ticket;
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([_2, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getSupportTicketForIT(id);
    }
    const [updated] = await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, id)).returning();
    return updated;
  }
  // Employee Activity Log
  async getEmployeeActivities(restaurantId, employeeId, category, startDate, endDate) {
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
    query = query.where(and(...conditions));
    return await query.orderBy(sql2`${employeeActivityLog.createdAt} DESC`);
  }
  async createEmployeeActivity(activity) {
    const [created] = await db.insert(employeeActivityLog).values(activity).returning();
    return created;
  }
  async getEmployeeActivityStats(employeeId, restaurantId) {
    const [totalResult] = await db.select({ count: sql2`count(*)` }).from(employeeActivityLog).where(and(eq(employeeActivityLog.employeeId, employeeId), eq(employeeActivityLog.restaurantId, restaurantId)));
    const categoryCounts = await db.select({
      category: employeeActivityLog.actionCategory,
      count: sql2`count(*)`
    }).from(employeeActivityLog).where(and(eq(employeeActivityLog.employeeId, employeeId), eq(employeeActivityLog.restaurantId, restaurantId))).groupBy(employeeActivityLog.actionCategory);
    const yesterday = /* @__PURE__ */ new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const [recentResult] = await db.select({ count: sql2`count(*)` }).from(employeeActivityLog).where(
      and(
        eq(employeeActivityLog.employeeId, employeeId),
        eq(employeeActivityLog.restaurantId, restaurantId),
        gte(employeeActivityLog.createdAt, yesterday)
      )
    );
    return {
      totalActivities: totalResult?.count || 0,
      categoryCounts: categoryCounts.map((c) => ({ category: c.category, count: c.count })),
      recentActivities24h: recentResult?.count || 0
    };
  }
  // Moyasar Payments
  async getMoyasarPayments(restaurantId, branchId) {
    const conditions = [eq(moyasarPayments.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(moyasarPayments.branchId, branchId));
    }
    return await db.select().from(moyasarPayments).where(and(...conditions)).orderBy(sql2`${moyasarPayments.createdAt} DESC`);
  }
  async getMoyasarPayment(id) {
    const [payment] = await db.select().from(moyasarPayments).where(eq(moyasarPayments.id, id));
    return payment;
  }
  async getMoyasarPaymentByMoyasarId(moyasarId, restaurantId) {
    const [payment] = await db.select().from(moyasarPayments).where(and(eq(moyasarPayments.moyasarId, moyasarId), eq(moyasarPayments.restaurantId, restaurantId)));
    return payment;
  }
  async createMoyasarPayment(payment) {
    const [created] = await db.insert(moyasarPayments).values(payment).returning();
    return created;
  }
  async getMoyasarPaymentByMoyasarIdAnyTenant(moyasarId) {
    const [payment] = await db.select().from(moyasarPayments).where(eq(moyasarPayments.moyasarId, moyasarId));
    return payment;
  }
  async updateMoyasarPayment(id, restaurantId, payment) {
    const { restaurantId: _, ...safePayment } = payment;
    const updateData = Object.fromEntries(
      Object.entries(safePayment).filter(([_2, value]) => value !== void 0)
    );
    updateData.updatedAt = /* @__PURE__ */ new Date();
    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return this.getMoyasarPayment(id);
    }
    const [updated] = await db.update(moyasarPayments).set(updateData).where(and(eq(moyasarPayments.id, id), eq(moyasarPayments.restaurantId, restaurantId))).returning();
    return updated;
  }
  // Team Chat - Conversations
  async getConversations(restaurantId, userId, branchId) {
    const userConversations = await db.select({
      conversation: conversations,
      member: conversationMembers
    }).from(conversationMembers).innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id)).where(
      and(
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.restaurantId, restaurantId)
      )
    ).orderBy(sql2`${conversations.lastMessageAt} DESC NULLS LAST`);
    const conversationsWithUnread = await Promise.all(
      userConversations.map(async ({ conversation }) => {
        const [readInfo] = await db.select().from(messageReads).where(
          and(
            eq(messageReads.conversationId, conversation.id),
            eq(messageReads.userId, userId),
            eq(messageReads.restaurantId, restaurantId)
          )
        );
        let unreadCount = 0;
        if (readInfo?.lastReadAt) {
          const [result] = await db.select({ count: sql2`count(*)` }).from(chatMessages).where(
            and(
              eq(chatMessages.conversationId, conversation.id),
              eq(chatMessages.restaurantId, restaurantId),
              sql2`${chatMessages.createdAt} > ${readInfo.lastReadAt}`
            )
          );
          unreadCount = Number(result?.count || 0);
        } else {
          const [result] = await db.select({ count: sql2`count(*)` }).from(chatMessages).where(
            and(
              eq(chatMessages.conversationId, conversation.id),
              eq(chatMessages.restaurantId, restaurantId)
            )
          );
          unreadCount = Number(result?.count || 0);
        }
        const [memberCountResult] = await db.select({ count: sql2`count(*)` }).from(conversationMembers).where(
          and(
            eq(conversationMembers.conversationId, conversation.id),
            eq(conversationMembers.restaurantId, restaurantId)
          )
        );
        const memberCount = Number(memberCountResult?.count || 0);
        return {
          ...conversation,
          unreadCount,
          memberCount
        };
      })
    );
    if (branchId) {
      return conversationsWithUnread.filter(
        (c) => c.scope === "restaurant" || c.branchId === branchId
      );
    }
    return conversationsWithUnread;
  }
  async getConversation(id, restaurantId) {
    const [conversation] = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.restaurantId, restaurantId)));
    return conversation;
  }
  async createConversation(conversation) {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }
  async getOrCreateDirectConversation(restaurantId, userId1, userId2) {
    const participantHash = [userId1, userId2].sort().join(":");
    const [existing] = await db.select().from(conversations).where(
      and(
        eq(conversations.restaurantId, restaurantId),
        eq(conversations.type, "direct"),
        eq(conversations.participantHash, participantHash)
      )
    );
    if (existing) {
      return existing;
    }
    try {
      const [newConversation] = await db.insert(conversations).values({
        restaurantId,
        type: "direct",
        scope: "restaurant",
        // DMs are always restaurant-wide
        createdBy: userId1,
        participantHash
        // Store for deduplication
      }).returning();
      await db.insert(conversationMembers).values([
        { restaurantId, conversationId: newConversation.id, userId: userId1 },
        { restaurantId, conversationId: newConversation.id, userId: userId2 }
      ]);
      return newConversation;
    } catch (error) {
      if (error.code === "23505") {
        const [concurrent] = await db.select().from(conversations).where(
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
  async updateConversationLastMessage(conversationId, preview) {
    await db.update(conversations).set({
      lastMessageAt: /* @__PURE__ */ new Date(),
      lastMessagePreview: preview.substring(0, 100)
    }).where(eq(conversations.id, conversationId));
  }
  // Team Chat - Messages
  async getChatMessages(conversationId, restaurantId, limit = 50) {
    return await db.select().from(chatMessages).where(
      and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.restaurantId, restaurantId)
      )
    ).orderBy(sql2`${chatMessages.createdAt} DESC`).limit(limit);
  }
  async createChatMessage(message) {
    const [created] = await db.insert(chatMessages).values(message).returning();
    await this.updateConversationLastMessage(message.conversationId, message.content);
    return created;
  }
  // Team Chat - Members
  async getConversationMembers(conversationId, restaurantId) {
    return await db.select({
      member: conversationMembers,
      user: users
    }).from(conversationMembers).leftJoin(users, eq(conversationMembers.userId, users.id)).where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.restaurantId, restaurantId)
      )
    );
  }
  async addConversationMember(member) {
    const [created] = await db.insert(conversationMembers).values(member).returning();
    return created;
  }
  async removeConversationMember(conversationId, userId, restaurantId) {
    const result = await db.delete(conversationMembers).where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.restaurantId, restaurantId)
      )
    );
    return true;
  }
  async isUserInConversation(conversationId, userId, restaurantId) {
    const [member] = await db.select().from(conversationMembers).where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.restaurantId, restaurantId)
      )
    );
    return !!member;
  }
  // Team Chat - Read Tracking
  async updateMessageRead(read) {
    if (read.lastReadMessageId) {
      const [message] = await db.select().from(chatMessages).where(
        and(
          eq(chatMessages.id, read.lastReadMessageId),
          eq(chatMessages.conversationId, read.conversationId),
          eq(chatMessages.restaurantId, read.restaurantId)
        )
      );
      if (!message) {
        throw new Error("Message does not belong to this conversation or restaurant");
      }
    }
    const existing = await db.select().from(messageReads).where(
      and(
        eq(messageReads.conversationId, read.conversationId),
        eq(messageReads.userId, read.userId),
        eq(messageReads.restaurantId, read.restaurantId)
      )
    );
    if (existing.length > 0) {
      await db.update(messageReads).set({
        lastReadMessageId: read.lastReadMessageId,
        lastReadAt: /* @__PURE__ */ new Date()
      }).where(
        and(
          eq(messageReads.conversationId, read.conversationId),
          eq(messageReads.userId, read.userId),
          eq(messageReads.restaurantId, read.restaurantId)
        )
      );
    } else {
      await db.insert(messageReads).values(read);
    }
  }
  async getUnreadChatCount(restaurantId, userId) {
    const [result] = await db.select({ totalUnread: sql2`COUNT(*)` }).from(chatMessages).innerJoin(
      conversationMembers,
      and(
        eq(chatMessages.conversationId, conversationMembers.conversationId),
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.restaurantId, restaurantId)
      )
    ).leftJoin(
      messageReads,
      and(
        eq(chatMessages.conversationId, messageReads.conversationId),
        eq(messageReads.userId, userId),
        eq(messageReads.restaurantId, restaurantId)
      )
    ).where(
      and(
        eq(chatMessages.restaurantId, restaurantId),
        // Message is unread if: no read record exists OR message is newer than last read time
        or(
          isNull(messageReads.lastReadAt),
          sql2`${chatMessages.createdAt} > ${messageReads.lastReadAt}`
        )
      )
    );
    return Number(result?.totalUnread || 0);
  }
  // Team Chat - Default Channels
  async createDefaultChannels(restaurantId, createdBy) {
    const defaultChannels = [
      { name: "#general", scope: "restaurant", branchId: null },
      { name: "#kitchen", scope: "restaurant", branchId: null },
      { name: "#front-desk", scope: "restaurant", branchId: null },
      { name: "#it-support", scope: "restaurant", branchId: null }
    ];
    for (const channel of defaultChannels) {
      const [existing] = await db.select().from(conversations).where(
        and(
          eq(conversations.restaurantId, restaurantId),
          eq(conversations.type, "channel"),
          eq(conversations.name, channel.name)
        )
      );
      if (!existing) {
        const [newChannel] = await db.insert(conversations).values({
          restaurantId,
          type: "channel",
          name: channel.name,
          scope: channel.scope,
          branchId: channel.branchId,
          createdBy
        }).returning();
        await db.insert(conversationMembers).values({
          restaurantId,
          conversationId: newChannel.id,
          userId: createdBy
        });
      }
    }
  }
  // Team Chat - Notification Settings
  async getChatNotificationDefaults(restaurantId) {
    const [result] = await db.select({
      chatNotificationDefaults: settings.chatNotificationDefaults
    }).from(settings).where(eq(settings.restaurantId, restaurantId));
    if (!result?.chatNotificationDefaults) {
      return {
        notificationsEnabled: true,
        soundEnabled: true,
        toneId: "tone1"
      };
    }
    return {
      notificationsEnabled: result.chatNotificationDefaults.notificationsEnabled,
      soundEnabled: result.chatNotificationDefaults.soundEnabled,
      toneId: result.chatNotificationDefaults.toneId
    };
  }
  async updateChatNotificationDefaults(restaurantId, defaults) {
    const [existing] = await db.select().from(settings).where(eq(settings.restaurantId, restaurantId));
    const currentDefaults = existing?.chatNotificationDefaults || {
      notificationsEnabled: true,
      soundEnabled: true,
      toneId: "tone1",
      notifyScope: "all"
    };
    const updated = {
      ...currentDefaults,
      ...defaults
    };
    await db.update(settings).set({
      chatNotificationDefaults: updated
    }).where(eq(settings.restaurantId, restaurantId));
  }
  // Licenses implementation
  async getLicenses(restaurantId) {
    return await db.select().from(licenses).where(eq(licenses.restaurantId, restaurantId)).orderBy(desc(licenses.expiryDate));
  }
  async getLicense(id, restaurantId) {
    const [license] = await db.select().from(licenses).where(
      and(
        eq(licenses.id, id),
        eq(licenses.restaurantId, restaurantId)
      )
    );
    return license;
  }
  async createLicense(license) {
    const [created] = await db.insert(licenses).values(license).returning();
    return created;
  }
  async updateLicense(id, restaurantId, license) {
    const updateData = Object.fromEntries(
      Object.entries(license).filter(([_, value]) => value !== void 0)
    );
    if (Object.keys(updateData).length === 0) {
      return this.getLicense(id, restaurantId);
    }
    const [updated] = await db.update(licenses).set({
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and(
        eq(licenses.id, id),
        eq(licenses.restaurantId, restaurantId)
      )
    ).returning();
    return updated;
  }
  async deleteLicense(id, restaurantId) {
    const result = await db.delete(licenses).where(
      and(
        eq(licenses.id, id),
        eq(licenses.restaurantId, restaurantId)
      )
    );
    return !!result;
  }
  async getExpiringLicenses(restaurantId, daysAhead) {
    const futureDate = /* @__PURE__ */ new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return await db.select().from(licenses).where(
      and(
        eq(licenses.restaurantId, restaurantId),
        lte(licenses.expiryDate, futureDate),
        gte(licenses.expiryDate, /* @__PURE__ */ new Date())
      )
    ).orderBy(licenses.expiryDate);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_db();
init_invoice();

// server/email.ts
import nodemailer from "nodemailer";
import { Resend } from "resend";
async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) {
    return null;
  }
  try {
    const response = await fetch(
      "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
      {
        headers: {
          "Accept": "application/json",
          "X_REPLIT_TOKEN": xReplitToken
        }
      }
    );
    const data = await response.json();
    const connectionSettings = data.items?.[0];
    if (!connectionSettings || !connectionSettings.settings?.api_key) {
      return null;
    }
    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email
    };
  } catch (error) {
    console.error("[Resend Integration] Failed to fetch credentials:", error);
    return null;
  }
}
var ResendIntegrationAdapter = class {
  async sendEmail(params) {
    try {
      const credentials = await getResendCredentials();
      if (!credentials) {
        return {
          success: false,
          error: "Resend integration not configured"
        };
      }
      const resend = new Resend(credentials.apiKey);
      const data = await resend.emails.send({
        from: credentials.fromEmail || params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text
      });
      if (data.error) {
        console.error("[Resend Integration] Failed to send email:", data.error);
        return {
          success: false,
          error: data.error.message
        };
      }
      return {
        success: true,
        messageId: data.data?.id
      };
    } catch (error) {
      console.error("[Resend Integration] Exception:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async getFromEmail() {
    const credentials = await getResendCredentials();
    return credentials?.fromEmail || null;
  }
};
var ResendAdapter = class {
  apiKey;
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async sendEmail(params) {
    try {
      const resend = new Resend(this.apiKey);
      const data = await resend.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text
      });
      if (data.error) {
        console.error("[Resend] Failed to send email:", data.error);
        return {
          success: false,
          error: data.error.message
        };
      }
      return {
        success: true,
        messageId: data.data?.id
      };
    } catch (error) {
      console.error("[Resend] Exception:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
var SMTPAdapter = class {
  transporter;
  constructor(config) {
    this.transporter = nodemailer.createTransport(config);
  }
  async sendEmail(params) {
    try {
      const info = await this.transporter.sendMail({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text
      });
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error("[SMTP] Failed to send email:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
async function createEmailProvider() {
  const credentials = await getResendCredentials();
  if (credentials) {
    console.log("[Email] Using Resend integration provider");
    return new ResendIntegrationAdapter();
  }
  const provider = process.env.EMAIL_PROVIDER || "resend";
  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not configured and no Resend integration found");
      return null;
    }
    console.log("[Email] Using Resend provider with manual API key");
    return new ResendAdapter(apiKey);
  }
  if (provider === "smtp") {
    const host2 = process.env.SMTP_HOST;
    const port2 = parseInt(process.env.SMTP_PORT || "587");
    const user2 = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host2 || !user2 || !pass) {
      console.warn("[Email] SMTP configuration incomplete");
      return null;
    }
    console.log("[Email] Using SMTP provider");
    return new SMTPAdapter({
      host: host2,
      port: port2,
      secure: port2 === 465,
      auth: { user: user2, pass }
    });
  }
  console.warn(`[Email] Unknown provider: ${provider}`);
  return null;
}
function generatePasswordResetEmail(data) {
  const { resetLink, expiryHours } = data;
  const html = `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset / \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .content {
      margin: 30px 0;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .arabic {
      direction: rtl;
      text-align: right;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning.arabic {
      border-left: none;
      border-right: 4px solid #ffc107;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .link {
      color: #667eea;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">BlindSpot System (BSS)</div>
      <div class="subtitle">Business Management System</div>
    </div>

    <!-- English Section -->
    <div class="content">
      <div class="section">
        <div class="section-title">Password Reset Request</div>
        <p>We received a request to reset your password for your BSS account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">${resetLink}</p>
      </div>

      <div class="warning">
        <strong>\u26A0\uFE0F Important Security Information:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This link will expire in ${expiryHours} hour${expiryHours > 1 ? "s" : ""}</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will not change until you click the link above</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <div class="section">
        <div class="section-title">\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</div>
        <p>\u062A\u0644\u0642\u064A\u0646\u0627 \u0637\u0644\u0628\u064B\u0627 \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u062D\u0633\u0627\u0628 BSS \u0627\u0644\u062E\u0627\u0635 \u0628\u0643.</p>
        <p>\u0627\u0646\u0642\u0631 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647 \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</a>
        </div>
        <p>\u0623\u0648 \u0627\u0646\u0633\u062E \u0648\u0627\u0644\u0635\u0642 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0641\u064A \u0645\u062A\u0635\u0641\u062D\u0643:</p>
        <p class="link">${resetLink}</p>
      </div>

      <div class="warning arabic">
        <strong>\u26A0\uFE0F \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0623\u0645\u0646\u064A\u0629 \u0645\u0647\u0645\u0629:</strong>
        <ul style="margin: 10px 0; padding-right: 20px; padding-left: 0;">
          <li>\u0633\u062A\u0646\u062A\u0647\u064A \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u062E\u0644\u0627\u0644 ${expiryHours === 1 ? "\u0633\u0627\u0639\u0629 \u0648\u0627\u062D\u062F\u0629" : `${expiryHours} \u0633\u0627\u0639\u0627\u062A`}</li>
          <li>\u0625\u0630\u0627 \u0644\u0645 \u062A\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u0647\u0630\u0647\u060C \u064A\u0631\u062C\u0649 \u062A\u062C\u0627\u0647\u0644 \u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</li>
          <li>\u0644\u0646 \u062A\u062A\u063A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062D\u062A\u0649 \u062A\u0646\u0642\u0631 \u0639\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637 \u0623\u0639\u0644\u0627\u0647</li>
          <li>\u0644\u0627 \u062A\u0634\u0627\u0631\u0643 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0639 \u0623\u064A \u0634\u062E\u0635</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>BlindSpot System (BSS) - Business Management Platform</p>
      <p>IT@SaudiKinzhal.org</p>
      <!-- TODO: Update sender email domain when new domain is available -->
      <p>This is an automated email, please do not reply / \u0647\u0630\u0627 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u062A\u0644\u0642\u0627\u0626\u064A\u060C \u064A\u0631\u062C\u0649 \u0639\u062F\u0645 \u0627\u0644\u0631\u062F</p>
    </div>
  </div>
</body>
</html>
  `;
  const text2 = `
Password Reset Request / \u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631

BlindSpot System (BSS) - Business Management System

ENGLISH:
We received a request to reset your password for your BSS account.

Reset your password by visiting this link:
${resetLink}

IMPORTANT SECURITY INFORMATION:
- This link will expire in ${expiryHours} hour${expiryHours > 1 ? "s" : ""}
- If you didn't request this reset, please ignore this email
- Your password will not change until you click the link above
- Never share this link with anyone

---

\u0627\u0644\u0639\u0631\u0628\u064A\u0629:
\u062A\u0644\u0642\u064A\u0646\u0627 \u0637\u0644\u0628\u064B\u0627 \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u062D\u0633\u0627\u0628 BSS \u0627\u0644\u062E\u0627\u0635 \u0628\u0643.

\u0623\u0639\u062F \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0632\u064A\u0627\u0631\u0629 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637:
${resetLink}

\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0623\u0645\u0646\u064A\u0629 \u0645\u0647\u0645\u0629:
- \u0633\u062A\u0646\u062A\u0647\u064A \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u062E\u0644\u0627\u0644 ${expiryHours === 1 ? "\u0633\u0627\u0639\u0629 \u0648\u0627\u062D\u062F\u0629" : `${expiryHours} \u0633\u0627\u0639\u0627\u062A`}
- \u0625\u0630\u0627 \u0644\u0645 \u062A\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u0647\u0630\u0647\u060C \u064A\u0631\u062C\u0649 \u062A\u062C\u0627\u0647\u0644 \u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A
- \u0644\u0646 \u062A\u062A\u063A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062D\u062A\u0649 \u062A\u0646\u0642\u0631 \u0639\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637 \u0623\u0639\u0644\u0627\u0647
- \u0644\u0627 \u062A\u0634\u0627\u0631\u0643 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0639 \u0623\u064A \u0634\u062E\u0635

---

BlindSpot System (BSS) - Business Management Platform
IT@SaudiKinzhal.org

This is an automated email, please do not reply.
\u0647\u0630\u0627 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u062A\u0644\u0642\u0627\u0626\u064A\u060C \u064A\u0631\u062C\u0649 \u0639\u062F\u0645 \u0627\u0644\u0631\u062F.
  `;
  return { html, text: text2 };
}
var PasswordResetMailer = class {
  async getProvider() {
    return await createEmailProvider();
  }
  async getFromEmail() {
    const credentials = await getResendCredentials();
    if (credentials?.fromEmail) {
      return credentials.fromEmail;
    }
    return process.env.EMAIL_FROM || process.env.IT_EMAIL || "IT@SaudiKinzhal.org";
  }
  async sendPasswordResetEmail(toEmail, resetToken, baseUrl) {
    const provider = await this.getProvider();
    if (!provider) {
      console.error("[PasswordResetMailer] No email provider configured");
      return {
        success: false,
        error: "Email service not configured"
      };
    }
    const fromEmail = await this.getFromEmail();
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const { html, text: text2 } = generatePasswordResetEmail({
      userEmail: toEmail,
      resetLink,
      expiryHours: 1
    });
    const result = await provider.sendEmail({
      to: toEmail,
      from: fromEmail,
      subject: "Password Reset Request / \u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 - BSS",
      html,
      text: text2
    });
    if (result.success) {
      console.log(`[PasswordResetMailer] Password reset email sent to ${toEmail} (ID: ${result.messageId})`);
    } else {
      console.error(`[PasswordResetMailer] Failed to send email to ${toEmail}: ${result.error}`);
    }
    return result;
  }
};

// server/utils.ts
var PROTECTED_TENANT_FIELDS = [
  "restaurantId"
  // Multi-tenant isolation - NEVER allow changes
];
function sanitizePatchBody(body, schema, additionalProtectedFields = []) {
  if (!body || typeof body !== "object") {
    return schema.parse(body);
  }
  const allProtectedFields = [
    ...PROTECTED_TENANT_FIELDS,
    ...additionalProtectedFields
  ];
  const sanitized = Object.keys(body).reduce((acc, key) => {
    if (!allProtectedFields.includes(key)) {
      acc[key] = body[key];
    }
    return acc;
  }, {});
  return schema.parse(sanitized);
}

// shared/permissions.ts
var FULL_GRANULAR_PERMISSION = {
  view: true,
  add: true,
  edit: true,
  delete: true
};
var NO_PERMISSION = {
  view: false,
  add: false,
  edit: false,
  delete: false
};
function normalizePermission(value) {
  if (value === void 0 || value === false) {
    return { ...NO_PERMISSION };
  }
  if (value === true) {
    return { ...FULL_GRANULAR_PERMISSION };
  }
  return value;
}
function hasPermissionAction(value, action) {
  const normalized = normalizePermission(value);
  return normalized[action] === true;
}
var ADMIN_PERMISSIONS = {
  dashboard: true,
  inventory: true,
  menu: true,
  recipes: true,
  branches: true,
  procurement: true,
  pos: true,
  orders: true,
  kitchen: true,
  sales: true,
  reports: true,
  customers: true,
  settings: true,
  users: true,
  workingHours: true,
  bills: true,
  deliveryApps: true,
  licenses: true,
  investors: true
};
function hasPermission(userPermissions, userRole, permission) {
  if (userRole === "admin") return true;
  if (!userPermissions) return false;
  const value = userPermissions[permission];
  if (value === true) return true;
  if (value === false || value === void 0) return false;
  return value.view === true;
}
function canPerformAction(userPermissions, userRole, permission, action) {
  if (userRole === "admin") return true;
  if (!userPermissions) return false;
  const value = userPermissions[permission];
  return hasPermissionAction(value, action);
}
function hasAnyPermission(userPermissions, userRole, ...permissions) {
  if (userRole === "admin") return true;
  if (!userPermissions) return false;
  return permissions.some((p) => hasPermission(userPermissions, "employee", p));
}

// server/middleware/requirePermission.ts
function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user2 = req.session.user;
    if (!hasAnyPermission(user2.permissions, user2.role, ...permissions)) {
      console.log(`[AUTH] Permission denied for user ${user2.id}: required ${permissions.join(" OR ")}`);
      return res.status(403).json({
        error: "Permission denied",
        required: permissions
      });
    }
    next();
  };
}
function requireAction(permission, action) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user2 = req.session.user;
    if (!canPerformAction(user2.permissions, user2.role, permission, action)) {
      console.log(`[AUTH] Action denied for user ${user2.id}: required ${action} on ${permission}`);
      return res.status(403).json({
        error: `Permission denied - cannot ${action}`,
        required: { permission, action }
      });
    }
    next();
  };
}

// server/routes.ts
init_schema();
import bcrypt2 from "bcrypt";
import QRCode2 from "qrcode";
import rateLimit from "express-rate-limit";
import multer from "multer";
import * as fs2 from "fs";
import * as path3 from "path";
import { z as z2 } from "zod";
import { sql as sql4, eq as eq3, and as and3, gte as gte2, lte as lte2, isNotNull as isNotNull2, desc as desc2 } from "drizzle-orm";

// shared/subscriptionPricing.ts
var VAT_RATE = 0.15;
var GROSS_BASE_PRICES_RESTAURANT = {
  weekly: 66.33,
  monthly: 199,
  yearly: 1990
};
var GROSS_PER_BRANCH_PRICES_RESTAURANT = {
  weekly: 13.37,
  // Calculated to maintain pricing consistency
  monthly: 38.21,
  // Calculated to maintain pricing consistency
  yearly: 398
  // Calculated to maintain pricing consistency
};
var GROSS_BASE_PRICES_FACTORY = {
  weekly: 0,
  // Not available for factory
  monthly: 15e3,
  yearly: 15e4
};
var FACTORY_MONTHLY_PER_BRANCH = 2400;
var GROSS_PER_BRANCH_PRICES_FACTORY = {
  weekly: 0,
  // Not available for factory - must be blocked in signup validation
  monthly: FACTORY_MONTHLY_PER_BRANCH,
  // +2,400 SAR/month per branch (VAT included)
  yearly: FACTORY_MONTHLY_PER_BRANCH * 12
  // Auto-calculated: 2,400 × 12 = 28,800 SAR/year per branch
};
function getPlanPricing(plan, branchesCount = 1, businessType = "restaurant") {
  const GROSS_BASE_PRICES = businessType === "factory" ? GROSS_BASE_PRICES_FACTORY : GROSS_BASE_PRICES_RESTAURANT;
  const GROSS_PER_BRANCH_PRICES = businessType === "factory" ? GROSS_PER_BRANCH_PRICES_FACTORY : GROSS_PER_BRANCH_PRICES_RESTAURANT;
  const grossBasePrice = GROSS_BASE_PRICES[plan];
  const grossPerBranchPrice = GROSS_PER_BRANCH_PRICES[plan];
  const additionalBranches = Math.max(0, branchesCount - 1);
  const grossAmount = grossBasePrice + grossPerBranchPrice * additionalBranches;
  const netAmount = grossAmount / (1 + VAT_RATE);
  const vatAmount = grossAmount - netAmount;
  const basePrice = grossBasePrice / (1 + VAT_RATE);
  const perBranchPrice = grossPerBranchPrice / (1 + VAT_RATE);
  return {
    basePrice,
    perBranchPrice,
    netAmount,
    vatAmount,
    grossAmount,
    branches: branchesCount
  };
}

// server/routes.ts
var wsClients = null;
function broadcastNotification(event) {
  if (!wsClients) return;
  const message = JSON.stringify(event);
  let sentCount = 0;
  wsClients.forEach((client) => {
    if (client.restaurantId !== event.restaurantId || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    if (event.type === "chat:message" && event.conversationId) {
      if (!client.conversationIds.has(event.conversationId)) {
        return;
      }
    }
    if (event.type === "permissions:updated" && event.targetUserId) {
      if (client.userId !== event.targetUserId) {
        return;
      }
    }
    client.socket.send(message);
    sentCount++;
  });
  console.log(`[WebSocket] Broadcast ${event.type} to ${sentCount} clients in restaurant ${event.restaurantId}`);
}
function addUserToConversation(userId, restaurantId, conversationId) {
  if (!wsClients) return;
  let updatedCount = 0;
  wsClients.forEach((client) => {
    if (client.userId === userId && client.restaurantId === restaurantId && client.socket.readyState === WebSocket.OPEN) {
      client.conversationIds.add(conversationId);
      updatedCount++;
    }
  });
  if (updatedCount > 0) {
    console.log(`[WebSocket] Added conversation ${conversationId} to ${updatedCount} client(s) for user ${userId}`);
  }
}
var requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.user.id) {
    storage.updateUserActivity(req.session.user.id).catch((error) => {
      console.error("[Activity Tracking] Failed to update activity:", error);
    });
  }
  next();
};
var requireITAccount = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.accountType !== "it") {
    return res.status(403).json({ error: "Access denied. IT account required." });
  }
  next();
};
var requireRestaurant = (req, res, next) => {
  if (!req.session.user?.restaurantId) {
    return res.status(403).json({ error: "This endpoint requires a restaurant account" });
  }
  next();
};
async function registerRoutes(app2, sessionParser2) {
  const bootstrapResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 10,
    // Limit each IP to 10 attempts per 15 minutes
    message: { error: "Too many reset attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.log(`[BOOTSTRAP] Rate limit exceeded from IP: ${req.ip || req.socket.remoteAddress}`);
      res.status(429).json({ error: "Too many reset attempts. Please try again in 15 minutes." });
    }
  });
  const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "public/uploads/logos";
      if (!fs2.existsSync(dir)) {
        fs2.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const restaurantId = req.session?.user?.restaurantId;
      const ext = path3.extname(file.originalname);
      cb(null, `logo-${restaurantId}-${Date.now()}${ext}`);
    }
  });
  const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    // 2MB
    fileFilter: (req, file, cb) => {
      const allowed = [".png", ".jpg", ".jpeg", ".svg"];
      const ext = path3.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only PNG, JPG, and SVG allowed."));
      }
    }
  });
  app2.get("/api/branches", requireAuth, requireRestaurant, requirePermission("branches"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branches2 = await storage.getBranches(restaurantId);
    res.json(branches2);
  });
  app2.get("/api/branches/:id", requireAuth, requireRestaurant, requirePermission("branches"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branch = await storage.getBranch(req.params.id, restaurantId);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json(branch);
  });
  app2.post("/api/branches", requireAuth, requireRestaurant, requireAction("branches", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertBranchSchema.parse({ ...req.body, restaurantId });
      const branch = await storage.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });
  app2.patch("/api/branches/:id", requireAuth, requireRestaurant, requireAction("branches", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertBranchSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const branch = await storage.updateBranch(req.params.id, restaurantId, safeData);
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });
  app2.delete("/api/branches/:id", requireAuth, requireRestaurant, requireAction("branches", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteBranch(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/inventory", requireAuth, requireRestaurant, requirePermission("inventory"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const items = await storage.getInventoryItems(restaurantId, branchId);
    res.json(items);
  });
  app2.post("/api/inventory", requireAuth, requireRestaurant, requireAction("inventory", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertInventoryItemSchema.parse({ ...req.body, restaurantId });
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inventory item:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid inventory data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });
  app2.patch("/api/inventory/sort", requireAuth, requireRestaurant, requireAction("inventory", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      const itemIds = updates.map((u) => u.id);
      const allItems = await storage.getInventoryItems(restaurantId);
      const validIds = new Set(allItems.map((i) => i.id));
      const invalidIds = itemIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some inventory IDs do not belong to your restaurant" });
      }
      await storage.updateInventoryItemsSortOrder(restaurantId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/inventory/:id", requireAuth, requireRestaurant, requirePermission("inventory"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const item = await storage.getInventoryItem(req.params.id, restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  });
  app2.patch("/api/inventory/:id", requireAuth, requireRestaurant, requireAction("inventory", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertInventoryItemSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const priceChanged = safeData.price !== void 0;
      let oldItem = null;
      if (priceChanged) {
        oldItem = await storage.getInventoryItem(req.params.id, restaurantId);
      }
      const item = await storage.updateInventoryItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (priceChanged && oldItem && parseFloat(oldItem.price) !== parseFloat(item.price)) {
        const newPrice = parseFloat(item.price);
        const updatedRecipes = await storage.updateRecipeCostsForInventoryItem(req.params.id, restaurantId, newPrice);
        if (updatedRecipes.length > 0) {
          broadcastNotification({
            type: "recipe:costUpdated",
            restaurantId,
            updatedRecipeIds: updatedRecipes.map((r) => r.id)
          });
        }
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });
  app2.delete("/api/inventory/:id", requireAuth, requireRestaurant, requireAction("inventory", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteInventoryItem(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/menu", requireAuth, requireRestaurant, requirePermission("menu"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const items = await storage.getMenuItems(restaurantId);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(items);
  });
  app2.get("/api/menu/stock", requireAuth, requireRestaurant, requirePermission("menu"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const stock = await storage.getMenuItemsStock(restaurantId, branchId);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(stock);
  });
  app2.get("/api/menu/:id", requireAuth, requireRestaurant, requirePermission("menu"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const item = await storage.getMenuItem(req.params.id, restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(item);
  });
  app2.post("/api/menu", requireAuth, requireRestaurant, requireAction("menu", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertMenuItemSchema.parse({ ...req.body, restaurantId });
      const item = await storage.createMenuItem(data);
      broadcastNotification({
        type: "menu:updated",
        restaurantId,
        data: { action: "created", item }
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Menu creation validation error:", error);
      res.status(400).json({ error: "Invalid menu data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/menu/:id", requireAuth, requireRestaurant, requireAction("menu", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, updateMenuItemSchema);
      const { restaurantId: _, ...safeData } = data;
      const item = await storage.updateMenuItem(req.params.id, restaurantId, safeData);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      broadcastNotification({
        type: "menu:updated",
        restaurantId,
        data: { action: "updated", item }
      });
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid menu data" });
    }
  });
  app2.delete("/api/menu/:id", requireAuth, requireRestaurant, requireAction("menu", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const menuItemId = req.params.id;
    const success = await storage.deleteMenuItem(menuItemId, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    broadcastNotification({
      type: "menu:updated",
      restaurantId,
      data: { action: "deleted", itemId: menuItemId }
    });
    res.status(204).send();
  });
  app2.get("/api/addons", requireAuth, requireRestaurant, requirePermission("menu"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const menuItemId = req.query.menuItemId;
    const addons2 = await storage.getAddons(restaurantId, menuItemId);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(addons2);
  });
  app2.get("/api/addons/:id", requireAuth, requireRestaurant, requirePermission("menu"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const addon = await storage.getAddon(req.params.id, restaurantId);
    if (!addon) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(addon);
  });
  app2.post("/api/addons", requireAuth, requireRestaurant, requireAction("menu", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertAddonSchema.parse({ ...req.body, restaurantId });
      const addon = await storage.createAddon(data);
      res.status(201).json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });
  app2.patch("/api/addons/:id", requireAuth, requireRestaurant, requireAction("menu", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertAddonSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const addon = await storage.updateAddon(req.params.id, restaurantId, safeData);
      if (!addon) {
        return res.status(404).json({ error: "Add-on not found" });
      }
      res.json(addon);
    } catch (error) {
      res.status(400).json({ error: "Invalid add-on data" });
    }
  });
  app2.delete("/api/addons/:id", requireAuth, requireRestaurant, requireAction("menu", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteAddon(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Add-on not found" });
    }
    res.status(204).send();
  });
  app2.patch("/api/addons/sort-order", requireAuth, requireRestaurant, requireAction("menu", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      const addonIds = req.body.map((u) => u.id);
      const allAddons = await storage.getAddons(restaurantId);
      const validIds = new Set(allAddons.map((a) => a.id));
      const invalidIds = addonIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some addon IDs do not belong to your restaurant" });
      }
      await storage.updateAddonsSortOrder(restaurantId, req.body);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Invalid sort order data" });
    }
  });
  app2.get("/api/customers", requireAuth, requireRestaurant, requirePermission("customers"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const customers2 = await storage.getCustomers(restaurantId);
    res.json(customers2);
  });
  app2.get("/api/customers/:id", requireAuth, requireRestaurant, requirePermission("customers"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const customer = await storage.getCustomer(req.params.id, restaurantId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });
  app2.post("/api/customers", requireAuth, requireRestaurant, requireAction("customers", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const upsert = req.query.upsert === "true";
      if (upsert) {
        const { name, phone } = req.body;
        if (!name || !phone) {
          return res.status(400).json({ error: "Name and phone are required for upsert" });
        }
        const customer2 = await storage.upsertCustomer(restaurantId, { name, phone });
        console.log(`[POS Customer Auto-Save] Upserted customer: ${customer2.id}, name: ${customer2.name}, phone: ${customer2.phone}`);
        return res.status(200).json(customer2);
      }
      const data = insertCustomerSchema.parse({ ...req.body, restaurantId });
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      console.error("[Customer API] Error:", error);
      res.status(400).json({ error: "Invalid customer data" });
    }
  });
  app2.patch("/api/customers/:id", requireAuth, requireRestaurant, requireAction("customers", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertCustomerSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const customer = await storage.updateCustomer(req.params.id, restaurantId, safeData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });
  app2.delete("/api/customers/:id", requireAuth, requireRestaurant, requireAction("customers", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteCustomer(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/licenses", requireAuth, requireRestaurant, requirePermission("licenses"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const licenses2 = await storage.getLicenses(restaurantId);
      res.json(licenses2);
    } catch (error) {
      console.error("Failed to get licenses:", error);
      res.status(500).json({ error: "Failed to get licenses" });
    }
  });
  app2.get("/api/licenses/expiring", requireAuth, requireRestaurant, requirePermission("licenses"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const daysAhead = parseInt(req.query.daysAhead) || 30;
      const licenses2 = await storage.getExpiringLicenses(restaurantId, daysAhead);
      res.json(licenses2);
    } catch (error) {
      console.error("Failed to get expiring licenses:", error);
      res.status(500).json({ error: "Failed to get expiring licenses" });
    }
  });
  app2.get("/api/licenses/:id", requireAuth, requireRestaurant, requirePermission("licenses"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const license = await storage.getLicense(req.params.id, restaurantId);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      console.error("Failed to get license:", error);
      res.status(500).json({ error: "Failed to get license" });
    }
  });
  app2.post("/api/licenses", requireAuth, requireRestaurant, requireAction("licenses", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const bodyWithDates = {
        ...req.body,
        restaurantId,
        createdBy: userId,
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate
      };
      const data = insertLicenseSchema.parse(bodyWithDates);
      const license = await storage.createLicense(data);
      res.status(201).json(license);
    } catch (error) {
      console.error("Failed to create license:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid license data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid license data" });
    }
  });
  app2.patch("/api/licenses/:id", requireAuth, requireRestaurant, requireAction("licenses", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const processedBody = { ...req.body, updatedBy: userId };
      const data = sanitizePatchBody(processedBody, insertLicenseSchema.partial());
      const { restaurantId: _, createdBy: __, issueDate, expiryDate, ...rest } = data;
      const safeData = { ...rest };
      if (issueDate) {
        safeData.issueDate = new Date(issueDate);
      }
      if (expiryDate) {
        safeData.expiryDate = new Date(expiryDate);
      }
      const license = await storage.updateLicense(req.params.id, restaurantId, safeData);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      console.error("Failed to update license:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid license data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid license data" });
    }
  });
  app2.delete("/api/licenses/:id", requireAuth, requireRestaurant, requireAction("licenses", "delete"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const success = await storage.deleteLicense(req.params.id, restaurantId);
      if (!success) {
        return res.status(404).json({ error: "License not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete license:", error);
      res.status(500).json({ error: "Failed to delete license" });
    }
  });
  app2.get("/api/shop/salaries", requireAuth, requireRestaurant, requirePermission("bills"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
    const salaries2 = await storage.getSalaries(restaurantId, branchId, startDate, endDate);
    res.json(salaries2);
  });
  app2.get("/api/shop/salaries/:id", requireAuth, requireRestaurant, requirePermission("bills"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const salary = await storage.getSalary(req.params.id);
    if (!salary || salary.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.json(salary);
  });
  app2.post("/api/shop/salaries", requireAuth, requireRestaurant, requireAction("bills", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      console.log("[SALARY] Request body:", JSON.stringify(req.body, null, 2));
      const bodyWithDate = {
        ...req.body,
        restaurantId,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : void 0
      };
      const data = insertSalarySchema.parse(bodyWithDate);
      console.log("[SALARY] Parsed data:", JSON.stringify(data, null, 2));
      const salary = await storage.createSalary(data);
      res.status(201).json(salary);
    } catch (error) {
      console.error("[SALARY] Validation error:", error);
      if (error instanceof Error) {
        console.error("[SALARY] Error message:", error.message);
      }
      res.status(400).json({ error: "Invalid salary data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/shop/salaries/:id", requireAuth, requireRestaurant, requireAction("bills", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getSalary(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Salary not found" });
      }
      const data = sanitizePatchBody(req.body, insertSalarySchema.partial());
      const salary = await storage.updateSalary(req.params.id, data);
      res.json(salary);
    } catch (error) {
      res.status(400).json({ error: "Invalid salary data" });
    }
  });
  app2.delete("/api/shop/salaries/:id", requireAuth, requireRestaurant, requireAction("bills", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const existing = await storage.getSalary(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Salary not found" });
    }
    const success = await storage.deleteSalary(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Salary not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/shop/bills", requireAuth, requireRestaurant, requirePermission("bills"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
    const bills = await storage.getShopBills(restaurantId, branchId, startDate, endDate);
    res.json(bills);
  });
  app2.get("/api/shop/bills/:id", requireAuth, requireRestaurant, requirePermission("bills"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const bill = await storage.getShopBill(req.params.id);
    if (!bill || bill.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json(bill);
  });
  app2.post("/api/shop/bills", requireAuth, requireRestaurant, requireAction("bills", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const bodyWithDate = {
        ...req.body,
        restaurantId,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : void 0
      };
      const data = insertShopBillSchema.parse(bodyWithDate);
      const bill = await storage.createShopBill(data);
      res.status(201).json(bill);
    } catch (error) {
      console.error("[SHOP] Bill validation error:", error);
      res.status(400).json({ error: "Invalid bill data" });
    }
  });
  app2.patch("/api/shop/bills/:id", requireAuth, requireRestaurant, requireAction("bills", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getShopBill(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }
      const bodyWithDate = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : void 0
      };
      if (bodyWithDate.paymentDate === void 0) {
        delete bodyWithDate.paymentDate;
      }
      const data = sanitizePatchBody(bodyWithDate, insertShopBillSchema.partial());
      const bill = await storage.updateShopBill(req.params.id, data);
      res.json(bill);
    } catch (error) {
      console.error("[SHOP] Bill update error:", error);
      res.status(400).json({ error: "Invalid bill data" });
    }
  });
  app2.delete("/api/shop/bills/:id", requireAuth, requireRestaurant, requireAction("bills", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const existing = await storage.getShopBill(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Bill not found" });
    }
    const success = await storage.deleteShopBill(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.status(204).send();
  });
  app2.patch("/api/shop/bills/:id/archive", requireAuth, requireRestaurant, requireAction("bills", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getShopBill(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Bill not found" });
      }
      const { archived } = req.body;
      const bill = await storage.archiveShopBill(req.params.id, archived);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Failed to archive bill" });
    }
  });
  app2.post("/api/shop/bills/generate-salaries", requireAuth, requireRestaurant, requireAction("bills", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { paymentMonth } = req.body;
      if (!paymentMonth) {
        return res.status(400).json({ error: "Payment month is required (format: YYYY-MM)" });
      }
      if (!/^\d{4}-\d{2}$/.test(paymentMonth)) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
      }
      const result = await storage.generateSalaryBills(restaurantId, paymentMonth);
      res.json(result);
    } catch (error) {
      console.error("Failed to generate salary bills:", error);
      res.status(500).json({ error: "Failed to generate salary bills" });
    }
  });
  app2.get("/api/delivery-apps", requireAuth, requireRestaurant, requirePermission("deliveryApps"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const apps = await storage.getDeliveryApps(restaurantId);
    res.json(apps);
  });
  app2.patch("/api/delivery-apps/sort", requireAuth, requireRestaurant, requireAction("deliveryApps", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      for (const update of updates) {
        const app3 = await storage.getDeliveryApp(update.id);
        if (!app3 || app3.restaurantId !== restaurantId) {
          return res.status(403).json({ error: "Unauthorized" });
        }
      }
      await storage.updateDeliveryAppsSortOrder(updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/delivery-apps/:id", requireAuth, requireRestaurant, requirePermission("deliveryApps"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const app3 = await storage.getDeliveryApp(req.params.id);
    if (!app3 || app3.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.json(app3);
  });
  app2.post("/api/delivery-apps", requireAuth, requireRestaurant, requireAction("deliveryApps", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertDeliveryAppSchema.parse({ ...req.body, restaurantId });
      const deliveryApp = await storage.createDeliveryApp(data);
      res.status(201).json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/delivery-apps/:id", requireAuth, requireRestaurant, requireAction("deliveryApps", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getDeliveryApp(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Delivery app not found" });
      }
      const data = sanitizePatchBody(req.body, insertDeliveryAppSchema.partial());
      const deliveryApp = await storage.updateDeliveryApp(req.params.id, data);
      res.json(deliveryApp);
    } catch (error) {
      console.error("[DELIVERY_APP] Validation error:", error);
      res.status(400).json({ error: "Invalid delivery app data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.delete("/api/delivery-apps/:id", requireAuth, requireRestaurant, requireAction("deliveryApps", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const existing = await storage.getDeliveryApp(req.params.id);
    if (!existing || existing.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    const success = await storage.deleteDeliveryApp(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Delivery app not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/delivery-apps/analytics/profitability", requireAuth, requireRestaurant, requirePermission("deliveryApps"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const profitability = await storage.getDeliveryAppProfitability(restaurantId);
      res.json(profitability);
    } catch (error) {
      console.error("[DELIVERY_APP] Profitability error:", error);
      res.status(500).json({ error: "Failed to calculate profitability" });
    }
  });
  app2.get("/api/analytics/sales-comparison", requireAuth, requireRestaurant, requirePermission("sales"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const comparison = await storage.getSalesComparison(restaurantId);
      res.json(comparison);
    } catch (error) {
      console.error("[ANALYTICS] Sales comparison error:", error);
      res.status(500).json({ error: "Failed to get sales comparison data" });
    }
  });
  app2.get("/api/investors", requireAuth, requireRestaurant, requirePermission("investors"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const investors2 = await storage.getInvestors(restaurantId);
      res.json(investors2);
    } catch (error) {
      console.error("[INVESTORS] Get investors error:", error);
      res.status(500).json({ error: "Failed to get investors" });
    }
  });
  app2.get("/api/investors/:id", requireAuth, requireRestaurant, requirePermission("investors"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Get investor error:", error);
      res.status(500).json({ error: "Failed to get investor" });
    }
  });
  app2.post("/api/investors", requireAuth, requireRestaurant, requireAction("investors", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertInvestorSchema.parse({ ...req.body, restaurantId });
      const investor = await storage.createInvestor(data);
      res.status(201).json(investor);
    } catch (error) {
      console.error("[INVESTORS] Create investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/investors/:id", requireAuth, requireRestaurant, requireAction("investors", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getInvestor(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const data = sanitizePatchBody(req.body, updateInvestorSchema);
      const investor = await storage.updateInvestor(req.params.id, data);
      res.json(investor);
    } catch (error) {
      console.error("[INVESTORS] Update investor error:", error);
      res.status(400).json({ error: "Invalid investor data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.delete("/api/investors/:id", requireAuth, requireRestaurant, requireAction("investors", "delete"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existing = await storage.getInvestor(req.params.id);
      if (!existing || existing.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const success = await storage.deleteInvestor(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("[INVESTORS] Delete investor error:", error);
      res.status(500).json({ error: "Failed to delete investor" });
    }
  });
  app2.get("/api/investors/:id/statement", requireAuth, requireRestaurant, requirePermission("investors"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const investor = await storage.getInvestor(req.params.id);
      if (!investor || investor.restaurantId !== restaurantId) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const settings2 = await storage.getSettings(restaurantId);
      if (!settings2) {
        return res.status(400).json({ error: "Restaurant settings not found" });
      }
      const transactions2 = await storage.getTransactions({ restaurantId });
      const orders2 = await storage.getOrders({ restaurantId });
      const menuItems2 = await storage.getMenuItems(restaurantId);
      const recipes2 = await storage.getRecipes(restaurantId);
      const salaries2 = await storage.getSalaries(restaurantId);
      const shopBills2 = await storage.getShopBills(restaurantId);
      let totalRevenue = 0;
      let totalCOGS = 0;
      let totalSalaries = 0;
      let totalBills = 0;
      let recipeName = "";
      const validOrderStatuses = ["Completed", "Ready", "Preparing", "Paid"];
      const finalizedOrders = orders2.filter((order) => validOrderStatuses.includes(order.status));
      if (investor.investorType === "recipe" && investor.recipeId) {
        const investorRecipe = recipes2.find((r) => r.id === investor.recipeId);
        recipeName = investorRecipe?.name || "";
        const recipeMenuItems = menuItems2.filter((m) => m.recipeId === investor.recipeId);
        const recipeMenuItemIds = recipeMenuItems.map((m) => m.id);
        finalizedOrders.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (recipeMenuItemIds.includes(item.id)) {
                const menuItem = recipeMenuItems.find((m) => m.id === item.id);
                if (menuItem) {
                  totalRevenue += parseFloat(menuItem.basePrice || "0") * (item.quantity || 1);
                  if (investorRecipe) {
                    const recipeCost = parseFloat(investorRecipe.cost || "0");
                    const portionSize = parseFloat(menuItem.portionSize || "1");
                    const itemCost = recipeCost * portionSize;
                    totalCOGS += itemCost * (item.quantity || 1);
                  }
                }
              }
            });
          }
        });
        totalSalaries = 0;
        totalBills = 0;
      } else {
        totalRevenue = transactions2.reduce((sum, t) => sum + parseFloat(t.total || "0"), 0);
        finalizedOrders.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              const menuItem = menuItems2.find((m) => m.id === item.id);
              if (menuItem && menuItem.recipeId) {
                const recipe = recipes2.find((r) => r.id === menuItem.recipeId);
                if (recipe) {
                  const recipeCost = parseFloat(recipe.cost || "0");
                  const portionSize = parseFloat(menuItem.portionSize || "1");
                  const itemCost = recipeCost * portionSize;
                  totalCOGS += itemCost * (item.quantity || 1);
                }
              }
            });
          }
        });
        totalSalaries = salaries2.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);
        totalBills = shopBills2.reduce((sum, b) => sum + parseFloat(b.amount || "0"), 0);
      }
      const netProfit = totalRevenue - totalCOGS - totalSalaries - totalBills;
      const interestPercentage = parseFloat(investor.interestPercentage || "0");
      const calculatedEarnings = netProfit * interestPercentage / 100;
      const monthlyEarnings = Math.max(0, calculatedEarnings);
      const now = /* @__PURE__ */ new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const pdfBuffer = await generateInvestorStatementPDF({
        investor: {
          id: investor.id,
          name: investor.name,
          amountInvested: investor.amountInvested,
          interestPercentage: investor.interestPercentage,
          notes: investor.notes,
          createdAt: investor.createdAt,
          investorType: investor.investorType || "money",
          recipeName
        },
        companyName: settings2.restaurantName || "Company",
        companyVAT: settings2.vatNumber || "",
        companyAddress: settings2.address || "",
        companyPhone: settings2.phone || "",
        companyEmail: settings2.email || "",
        netProfit,
        monthlyEarnings,
        totalRevenue,
        totalCOGS,
        totalSalaries,
        totalBills,
        statementDate: now,
        periodStart,
        periodEnd,
        logoPath: settings2.logoPath || void 0
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="investor-statement-${investor.name.replace(/\s+/g, "-")}-${now.toISOString().split("T")[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[INVESTORS] Statement generation error:", error);
      res.status(500).json({ error: "Failed to generate investor statement" });
    }
  });
  app2.get("/api/recipes", requireAuth, requireRestaurant, requirePermission("recipes"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const recipes2 = await storage.getRecipes(restaurantId);
    res.json(recipes2);
  });
  app2.get("/api/recipes/:id", requireAuth, requireRestaurant, requirePermission("recipes"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const recipe = await storage.getRecipe(req.params.id, restaurantId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  });
  app2.post("/api/recipes", requireAuth, requireRestaurant, requireAction("recipes", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertRecipeSchema.parse({ ...req.body, restaurantId });
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });
  app2.patch("/api/recipes/:id", requireAuth, requireRestaurant, requireAction("recipes", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertRecipeSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const recipe = await storage.updateRecipe(req.params.id, restaurantId, safeData);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(400).json({ error: "Invalid recipe data" });
    }
  });
  app2.patch("/api/recipes/sort", requireAuth, requireRestaurant, requireAction("recipes", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }
      const recipeIds = updates.map((u) => u.id);
      const allRecipes = await storage.getRecipes(restaurantId);
      const validIds = new Set(allRecipes.map((r) => r.id));
      const invalidIds = recipeIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: "Some recipe IDs do not belong to your restaurant" });
      }
      await storage.updateRecipesSortOrder(restaurantId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/recipes/:id", requireAuth, requireRestaurant, requireAction("recipes", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteRecipe(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/orders", requireAuth, requireRestaurant, requirePermission("orders"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const status = req.query.status;
    const orders2 = await storage.getOrders({ restaurantId, branchId, status });
    res.json(orders2);
  });
  app2.get("/api/it/orders", requireAuth, requireITAccount, async (req, res) => {
    const restaurantId = req.query.restaurantId;
    const branchId = req.query.branchId;
    const status = req.query.status;
    const orders2 = await storage.getOrders({ restaurantId: restaurantId || "", branchId, status });
    res.json(orders2);
  });
  app2.patch("/api/it/orders/:id", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { status } = req.body;
      const allOrders = await storage.getOrders({ restaurantId: "" });
      const order = allOrders.find((o) => o.id === req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const updatedOrder = await storage.updateOrder(req.params.id, order.restaurantId, { status });
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      const branch = order.branchId ? await storage.getBranch(order.branchId, order.restaurantId) : null;
      broadcastNotification({
        type: "order:statusUpdated",
        restaurantId: order.restaurantId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: updatedOrder.status,
        branchId: order.branchId ?? void 0,
        branchName: branch?.name
      });
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order status" });
    }
  });
  app2.get("/api/orders/:id", requireAuth, requireRestaurant, requirePermission("orders"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const order = await storage.getOrder(req.params.id, restaurantId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });
  app2.post("/api/orders", requireAuth, requireRestaurant, requireAction("orders", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const createdBy = req.session.user.id;
      const data = insertOrderSchema.parse({ ...req.body, restaurantId, createdBy });
      const { orderProcessingService: orderProcessingService2 } = await Promise.resolve().then(() => (init_orderProcessingService(), orderProcessingService_exports));
      const orderItems = Array.isArray(data.items) ? data.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        addons: item.addons
      })) : [];
      const prepResult = await orderProcessingService2.prepareOrderStock(
        orderItems,
        data.branchId || ""
      );
      if (!prepResult.isValid) {
        return res.status(409).json({
          error: "Insufficient inventory",
          message: prepResult.message,
          insufficientItems: prepResult.insufficientItems
        });
      }
      const order = await storage.createOrder(data);
      try {
        if (prepResult.stockRequirements) {
          await orderProcessingService2.finalizeOrderWithInventory(
            data,
            prepResult.stockRequirements,
            order.id,
            data.branchId || ""
          );
        }
        const branch = data.branchId ? await storage.getBranch(data.branchId, data.restaurantId) : null;
        const itemsSummary = orderItems.length > 0 ? orderItems.slice(0, 3).map((item) => item.name).join(", ") + (orderItems.length > 3 ? "..." : "") : "No items";
        broadcastNotification({
          type: "order:created",
          restaurantId: data.restaurantId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          branchId: data.branchId ?? void 0,
          branchName: branch?.name,
          itemsSummary
        });
        res.status(201).json(order);
      } catch (deductionError) {
        console.error("Inventory deduction failed, attempting to delete order:", order.id);
        try {
          await storage.deleteOrder(order.id, order.restaurantId);
        } catch (deleteError) {
          console.error("Failed to delete order after inventory deduction failure:", deleteError);
        }
        throw deductionError;
      }
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: "Failed to create order", details: error.message });
      } else {
        res.status(400).json({ error: "Failed to create order" });
      }
    }
  });
  app2.patch("/api/orders/:id", requireAuth, requireRestaurant, requireAction("orders", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertOrderSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const order = await storage.updateOrder(req.params.id, restaurantId, safeData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = items.length > 0 ? items.slice(0, 3).map((item) => item.name).join(", ") + (items.length > 3 ? "..." : "") : "No items";
      broadcastNotification({
        type: "order:statusUpdated",
        restaurantId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        branchId: order.branchId ?? void 0,
        branchName: branch?.name,
        itemsSummary
      });
      res.json(order);
    } catch (error) {
      console.error("[ORDER] Update error:", error);
      res.status(400).json({
        error: "Invalid order data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/transactions", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
    const dateRange = startDate || endDate ? { start: startDate, end: endDate } : void 0;
    const transactions2 = await storage.getTransactions({ restaurantId, branchId, dateRange });
    res.json(transactions2);
  });
  app2.get("/api/transactions/:id", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const transaction = await storage.getTransaction(req.params.id, restaurantId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });
  app2.post("/api/transactions", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const bodySchema = insertTransactionSchema.omit({ restaurantId: true });
      const data = bodySchema.parse(req.body);
      const transaction = await storage.createTransaction({ ...data, restaurantId });
      res.status(201).json(transaction);
    } catch (error) {
      console.error("[Transactions] Creation error:", error);
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });
  app2.get("/api/analytics/dashboard", requireAuth, requireRestaurant, requirePermission("dashboard"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const orders2 = await storage.getOrders({ restaurantId, branchId });
    const transactions2 = await storage.getTransactions({ restaurantId, branchId });
    const inventory = await storage.getInventoryItems(restaurantId, branchId);
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const todaysSales = transactions2.filter((t) => new Date(t.createdAt) >= today).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const yesterdaysSales = transactions2.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= yesterday && date < today;
    }).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const thisWeekSales = transactions2.filter((t) => new Date(t.createdAt) >= weekAgo).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const lastWeekSales = transactions2.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= twoWeeksAgo && date < weekAgo;
    }).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const thisMonthSales = transactions2.filter((t) => new Date(t.createdAt) >= monthStart).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const lastMonthSales = transactions2.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const thisYearSales = transactions2.filter((t) => new Date(t.createdAt) >= yearStart).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const lastYearSales = transactions2.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= lastYearStart && date <= lastYearEnd;
    }).reduce((sum, t) => sum + parseFloat(t.total), 0);
    const calculateChange = (current, previous) => {
      if (previous === 0) return 0;
      return (current - previous) / previous * 100;
    };
    const activeOrders = orders2.filter((o) => o.status !== "Completed" && o.status !== "Cancelled").length;
    const lowStockItems = inventory.filter((i) => i.status === "Low Stock").length;
    const salesByHour = {};
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0;
    }
    transactions2.forEach((t) => {
      const date = new Date(t.createdAt);
      const hour = date.getHours();
      salesByHour[hour] += parseFloat(t.total);
    });
    const peakHoursData = Object.entries(salesByHour).map(([hour, sales]) => ({
      hour: parseInt(hour),
      sales: parseFloat(sales.toFixed(2))
    })).sort((a, b) => a.hour - b.hour);
    const peakHour = peakHoursData.reduce(
      (max, current) => current.sales > max.sales ? current : max,
      peakHoursData[0]
    );
    res.json({
      todaysSales: todaysSales.toFixed(2),
      activeOrders,
      lowStockItems,
      recentOrders: orders2.slice(0, 4),
      performance: {
        dod: {
          current: todaysSales,
          previous: yesterdaysSales,
          change: calculateChange(todaysSales, yesterdaysSales)
        },
        wow: {
          current: thisWeekSales,
          previous: lastWeekSales,
          change: calculateChange(thisWeekSales, lastWeekSales)
        },
        mom: {
          current: thisMonthSales,
          previous: lastMonthSales,
          change: calculateChange(thisMonthSales, lastMonthSales)
        },
        yoy: {
          current: thisYearSales,
          previous: lastYearSales,
          change: calculateChange(thisYearSales, lastYearSales)
        }
      },
      peakHours: {
        hourlyData: peakHoursData,
        peakHour: peakHour.hour,
        peakSales: peakHour.sales
      }
    });
  });
  app2.get("/api/analytics/peak-hours/:hour", requireAuth, requireRestaurant, requirePermission("sales"), async (req, res) => {
    const hour = parseInt(req.params.hour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ error: "Invalid hour parameter (must be 0-23)" });
    }
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const transactions2 = await storage.getTransactions({ restaurantId, branchId });
    const orders2 = await storage.getOrders({ restaurantId, branchId });
    const transactionsInHour = transactions2.filter((t) => {
      const date = new Date(t.createdAt);
      return date.getHours() === hour;
    });
    const orderMap = new Map(orders2.map((o) => [o.id, o]));
    const results = transactionsInHour.map((transaction) => {
      const order = transaction.orderId ? orderMap.get(transaction.orderId) : null;
      return {
        transactionId: transaction.transactionId,
        customerName: order?.customerName || null,
        customerPhone: order?.customerPhone || "",
        total: parseFloat(transaction.total),
        itemCount: transaction.itemCount,
        paymentMethod: transaction.paymentMethod,
        orderType: order?.orderType || "",
        createdAt: transaction.createdAt
      };
    });
    res.json(results);
  });
  app2.get("/api/analytics/sales", requireAuth, requireRestaurant, requirePermission("sales"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const branchId = req.query.branchId;
    const transactions2 = await storage.getTransactions({ restaurantId, branchId });
    const salesByDay = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    transactions2.forEach((t) => {
      const date = new Date(t.createdAt);
      const dayName = days[date.getDay()];
      salesByDay[dayName] = (salesByDay[dayName] || 0) + parseFloat(t.total);
    });
    const chartData = days.map((day) => ({
      date: day,
      sales: Math.round(salesByDay[day] || 0)
    }));
    res.json(chartData);
  });
  app2.get("/api/settings", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const settings2 = await storage.getSettings(restaurantId);
    const settingsWithKeys = {
      ...settings2,
      moyasarPublishableKey: process.env.MOYASAR_PUBLISHABLE_KEY || null
    };
    res.json(settingsWithKeys);
  });
  app2.patch("/api/settings", requireAuth, requireRestaurant, requireAction("settings", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertSettingsSchema.partial().parse(req.body);
      const { restaurantId: _, ...safeData } = data;
      const settings2 = await storage.updateSettings(restaurantId, safeData);
      broadcastNotification({
        type: "settings:updated",
        restaurantId
      });
      res.json(settings2);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });
  app2.post("/api/settings/logo", requireAuth, requireRestaurant, requireAction("settings", "edit"), uploadLogo.single("logo"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const existingSettings = await storage.getSettings(restaurantId);
      if (existingSettings?.logoPath) {
        const relativePath = existingSettings.logoPath.replace(/^\/+/, "");
        const oldLogoPath = path3.join(process.cwd(), "public", relativePath);
        if (fs2.existsSync(oldLogoPath)) {
          fs2.unlinkSync(oldLogoPath);
        }
      }
      const logoPath = `/uploads/logos/${req.file.filename}`;
      await storage.updateSettingsLogoPath(restaurantId, logoPath);
      res.json({ success: true, logoPath });
    } catch (error) {
      if (req.file) {
        const filePath = req.file.path;
        if (fs2.existsSync(filePath)) {
          fs2.unlinkSync(filePath);
        }
      }
      res.status(400).json({ error: error.message || "Failed to upload logo" });
    }
  });
  app2.delete("/api/settings/logo", requireAuth, requireRestaurant, requireAction("settings", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const existingSettings = await storage.getSettings(restaurantId);
      if (!existingSettings?.logoPath) {
        return res.status(404).json({ error: "No logo found" });
      }
      const relativePath = existingSettings.logoPath.replace(/^\/+/, "");
      const logoPath = path3.join(process.cwd(), "public", relativePath);
      if (fs2.existsSync(logoPath)) {
        fs2.unlinkSync(logoPath);
      }
      await storage.updateSettingsLogoPath(restaurantId, null);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to remove logo" });
    }
  });
  app2.get("/api/procurement", requireAuth, requireRestaurant, requirePermission("procurement"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const { type, status, branchId } = req.query;
    const procurements = await storage.getProcurements({
      restaurantId,
      type,
      status,
      branchId
    });
    res.json(procurements);
  });
  app2.get("/api/procurement/:id", requireAuth, requireRestaurant, requirePermission("procurement"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const procurement2 = await storage.getProcurement(req.params.id, restaurantId);
    if (!procurement2) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.json(procurement2);
  });
  app2.post("/api/procurement", requireAuth, requireRestaurant, requireAction("procurement", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertProcurementSchema.omit({ restaurantId: true }).parse(req.body);
      const procurement2 = await storage.createProcurement({ ...data, restaurantId });
      res.status(201).json(procurement2);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });
  app2.patch("/api/procurement/:id", requireAuth, requireRestaurant, requireAction("procurement", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = sanitizePatchBody(req.body, insertProcurementSchema.partial());
      const { restaurantId: _, ...safeData } = data;
      const procurement2 = await storage.updateProcurement(req.params.id, restaurantId, safeData);
      if (!procurement2) {
        return res.status(404).json({ error: "Procurement not found" });
      }
      res.json(procurement2);
    } catch (error) {
      res.status(400).json({ error: "Invalid procurement data" });
    }
  });
  app2.delete("/api/procurement/:id", requireAuth, requireRestaurant, requireAction("procurement", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const success = await storage.deleteProcurement(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "Procurement not found" });
    }
    res.status(204).send();
  });
  app2.post("/api/pos/generate-invoice", requireAuth, requireRestaurant, requireAction("pos", "add"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
      }
      const order = await storage.getOrder(orderId, restaurantId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const settings2 = await storage.getSettings(restaurantId);
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;
      const invoiceNumber = `INV-${order.orderNumber}`;
      const invoiceItems = order.items.map((item) => {
        const totalPrice = item.quantity * item.price;
        const basePrice = totalPrice / 1.15;
        const vatAmount = totalPrice - basePrice;
        return {
          name: item.name,
          quantity: item.quantity,
          basePrice: parseFloat(basePrice.toFixed(2)),
          vatAmount: parseFloat(vatAmount.toFixed(2)),
          total: parseFloat(totalPrice.toFixed(2))
        };
      });
      const invoiceData = {
        restaurantId: req.session.user.restaurantId,
        invoiceNumber,
        orderId: order.id,
        branchId: order.branchId,
        customerName: order.customerName || "Walk-in Customer",
        items: invoiceItems,
        subtotal: order.subtotal,
        vatAmount: order.tax,
        total: order.total,
        qrCode: "",
        pdfPath: ""
      };
      const createdInvoice = await storage.createInvoice(invoiceData);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const pdfData = {
        order,
        companyName: settings2?.restaurantName || "Restaurant Management System",
        companyVAT: settings2?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings2?.address || "Main Location, Riyadh",
        companyEmail: settings2?.email || "info@restaurant.sa",
        companyPhone: settings2?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: /* @__PURE__ */ new Date(),
        invoiceId: createdInvoice.id,
        baseUrl,
        logoPath: settings2?.logoPath || void 0
      };
      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);
      const invoicesDir = path3.join(process.cwd(), "public", "invoices");
      if (!fs2.existsSync(invoicesDir)) {
        fs2.mkdirSync(invoicesDir, { recursive: true });
      }
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path3.join(invoicesDir, pdfFilename);
      fs2.writeFileSync(pdfPath, pdfBuffer);
      await storage.updateInvoice(createdInvoice.id, restaurantId, {
        qrCode,
        pdfPath: `/invoices/${pdfFilename}`
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password: password2, name, email, commercialRegistration, restaurantName, nationalId, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount } = req.body;
      console.log("[SIGNUP] Received signup request for username:", username);
      console.log("[SIGNUP] Request body:", { username, name, email, restaurantName, nationalId, taxNumber, businessType, restaurantType, subscriptionPlan, branchesCount });
      if (!username || !password2 || !name || !email || !commercialRegistration || !restaurantName || !nationalId || !taxNumber || !businessType || !restaurantType || !subscriptionPlan || !branchesCount) {
        console.log("[SIGNUP] Missing required fields");
        return res.status(400).json({ error: "All fields are required including Restaurant Name, National ID, Tax Number, Business Type, Restaurant Type, Commercial Registration, subscription plan, and number of branches" });
      }
      if (businessType === "factory" && subscriptionPlan === "weekly") {
        return res.status(400).json({ error: "Factory businesses can only have monthly or yearly subscription plans" });
      }
      const branches2 = parseInt(branchesCount);
      if (isNaN(branches2) || branches2 < 1) {
        return res.status(400).json({ error: "Number of branches must be at least 1" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const restaurantData = insertRestaurantSchema.parse({
        name: restaurantName,
        nationalId,
        taxNumber,
        commercialRegistration,
        businessType,
        // Will be validated by z.enum(["restaurant", "factory"])
        type: restaurantType,
        // Specific subtype (e.g., "Cloud Kitchen", "Manufacturing")
        subscriptionPlan,
        branchesCount: branches2,
        subscriptionStatus: "inactive"
        // Will be activated after payment
      });
      const restaurant = await storage.createRestaurant(restaurantData);
      const userData = {
        restaurantId: restaurant.id,
        // Link to restaurant for multi-tenant isolation
        username,
        password: password2,
        // Will be hashed in storage
        fullName: name,
        email,
        role: "admin",
        active: true,
        permissions: ADMIN_PERMISSIONS
      };
      const user2 = await storage.createUser(userData);
      try {
        const pricing = getPlanPricing(subscriptionPlan, branches2, businessType);
        const basePlanPricing = getPlanPricing(subscriptionPlan, 1, businessType);
        const basePlanPrice = basePlanPricing.netAmount;
        const additionalBranchesCount = Math.max(0, branches2 - 1);
        const additionalBranchesPrice = additionalBranchesCount > 0 ? pricing.netAmount - basePlanPrice : 0;
        const subtotal = pricing.netAmount;
        const vatAmount = pricing.vatAmount;
        const total = pricing.grossAmount;
        const serialNumber = await storage.getNextSubscriptionInvoiceSerialNumber();
        const pdfBuffer = await generateSubscriptionInvoice({
          serialNumber,
          userFullName: user2.fullName,
          userEmail: user2.email ?? "",
          restaurantName: restaurant.name,
          nationalId: restaurant.nationalId,
          taxNumber: restaurant.taxNumber,
          commercialRegistration: restaurant.commercialRegistration,
          subscriptionPlan: restaurant.subscriptionPlan,
          branchesCount: restaurant.branchesCount,
          basePlanPrice,
          additionalBranchesPrice,
          subtotal,
          vatAmount,
          total,
          invoiceDate: /* @__PURE__ */ new Date()
        });
        const invoicesDir = path3.join(process.cwd(), "public", "subscription-invoices");
        if (!fs2.existsSync(invoicesDir)) {
          fs2.mkdirSync(invoicesDir, { recursive: true });
        }
        const pdfFilename = `subscription-${serialNumber}.pdf`;
        const pdfPath = path3.join(invoicesDir, pdfFilename);
        fs2.writeFileSync(pdfPath, pdfBuffer);
        const QRCode3 = await import("qrcode");
        const qrData = `Invoice: ${serialNumber}
Date: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-GB")}
Total: ${total.toFixed(2)} SAR
VAT: ${vatAmount.toFixed(2)} SAR`;
        const qrCode = await QRCode3.toDataURL(qrData);
        await storage.createSubscriptionInvoice({
          userId: user2.id,
          serialNumber,
          subscriptionPlan: restaurant.subscriptionPlan ?? "",
          branchesCount: restaurant.branchesCount,
          basePlanPrice: basePlanPrice.toString(),
          additionalBranchesPrice: additionalBranchesPrice.toString(),
          subtotal: subtotal.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
          pdfPath: `/subscription-invoices/${pdfFilename}`,
          qrCode
        });
        console.log(`[SIGNUP] Subscription invoice generated: ${serialNumber}`);
        res.status(201).json({
          id: user2.id,
          username: user2.username,
          fullName: user2.fullName,
          role: user2.role,
          restaurantId: user2.restaurantId,
          invoiceFilename: pdfFilename
          // Frontend will download via authenticated endpoint after auto-login
        });
      } catch (invoiceError) {
        console.error("[SIGNUP] Failed to generate subscription invoice:", invoiceError);
        res.status(201).json({
          id: user2.id,
          username: user2.username,
          fullName: user2.fullName,
          role: user2.role,
          restaurantId: user2.restaurantId
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  app2.post("/api/auth/it-signup", async (req, res) => {
    try {
      const { username, password: password2, fullName, email, secretKey } = req.body;
      console.log("[IT-SIGNUP] Received IT signup request for username:", username);
      if (!username || !password2 || !fullName || !email || !secretKey) {
        console.log("[IT-SIGNUP] Missing required fields");
        return res.status(400).json({ error: "All fields are required including secret key" });
      }
      const VALID_SECRET_KEY = "KinzhalLTDCo@1990";
      if (secretKey !== VALID_SECRET_KEY) {
        console.log("[IT-SIGNUP] Invalid secret key provided");
        return res.status(403).json({ error: "Invalid secret key" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("[IT-SIGNUP] Username already exists");
        return res.status(400).json({ error: "Username already exists" });
      }
      const IT_PERMISSIONS = {
        pos: true,
        menu: true,
        bills: true,
        sales: true,
        users: true,
        orders: true,
        kitchen: true,
        recipes: true,
        reports: true,
        branches: true,
        licenses: true,
        settings: true,
        customers: true,
        dashboard: true,
        inventory: true,
        procurement: true,
        deliveryApps: true,
        workingHours: true,
        investors: true
      };
      const userData = {
        restaurantId: null,
        // IT accounts don't belong to any restaurant
        username,
        password: password2,
        // Pass plain password - storage.createUser will hash it
        fullName,
        email,
        role: "admin",
        active: true,
        permissions: IT_PERMISSIONS,
        devicePreference: "laptop"
      };
      const user2 = await storage.createUser(userData);
      console.log("[IT-SIGNUP] IT account created successfully for username:", username);
      res.status(201).json({
        success: true,
        message: "IT account created successfully",
        user: {
          id: user2.id,
          username: user2.username,
          fullName: user2.fullName,
          email: user2.email,
          role: user2.role
        }
      });
    } catch (error) {
      console.error("[IT-SIGNUP] Error creating IT account:", error);
      res.status(500).json({ error: "Failed to create IT account" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password: password2, accountType } = req.body;
      console.log("[AUTH] Login attempt for username:", username, "accountType:", accountType);
      if (!username || !password2) {
        console.log("[AUTH] Missing username or password");
        return res.status(400).json({ error: "Username and password required" });
      }
      const user2 = await storage.getUserByUsername(username);
      console.log("[AUTH] User found:", user2 ? `Yes (id: ${user2.id}, active: ${user2.active}, restaurantId: ${user2.restaurantId})` : "No");
      if (!user2) {
        console.log("[AUTH] User not found in database");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user2.active) {
        console.log("[AUTH] User is inactive");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.log("[AUTH] Comparing password hash");
      const passwordMatch = await bcrypt2.compare(password2, user2.password);
      console.log("[AUTH] Password match:", passwordMatch);
      if (!passwordMatch) {
        console.log("[AUTH] Password mismatch");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const validAccountType = user2.restaurantId === null ? "it" : "client";
      console.log("[AUTH] Auto-detected accountType:", validAccountType, "(based on restaurantId:", user2.restaurantId, ")");
      if (req.session) {
        req.session.userId = user2.id;
        req.session.role = user2.role;
        req.session.accountType = validAccountType;
        req.session.user = {
          id: user2.id,
          username: user2.username,
          restaurantId: user2.restaurantId || void 0,
          // CRITICAL: Keep null/undefined for IT accounts, not empty string
          role: user2.role,
          email: user2.email || "",
          fullName: user2.fullName,
          branchId: user2.branchId || "",
          isMainAccount: user2.role === "admin",
          devicePreference: user2.devicePreference || "laptop",
          permissions: user2.permissions
        };
        console.log("[AUTH] Session created for user:", user2.id, "restaurant:", user2.restaurantId, "accountType:", validAccountType);
      }
      await storage.updateUserLogin(user2.id);
      let restaurant = null;
      if (validAccountType === "client" && user2.restaurantId) {
        restaurant = await storage.getRestaurant(user2.restaurantId);
        if (!restaurant) {
          return res.status(500).json({ error: "Restaurant not found" });
        }
      }
      const { password: _, ...userWithoutPassword } = user2;
      console.log("[AUTH] Login successful");
      res.json({ user: userWithoutPassword, restaurant, accountType: validAccountType });
    } catch (error) {
      console.error("[AUTH] Login error - Full details:", error);
      console.error("[AUTH] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.error("[AUTH] Error message:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const user2 = await storage.getUserByEmail(email);
      if (!user2) {
        return res.json({ message: "If an account with that email exists, we've sent a password reset link" });
      }
      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpiry = new Date(Date.now() + 36e5);
      await storage.setPasswordResetToken(user2.id, resetToken, resetExpiry);
      const mailer = new PasswordResetMailer();
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const emailResult = await mailer.sendPasswordResetEmail(email, resetToken, baseUrl);
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
        console.log(`[DEV] Reset link: ${baseUrl}/reset-password?token=${resetToken}`);
        if (!emailResult.success) {
          console.log(`[DEV] Email failed: ${emailResult.error} - Token logged above for testing`);
        }
      }
      res.json({ message: "If an account with that email exists, we've sent a password reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password: password2 } = req.body;
      if (!token || !password2) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      if (password2.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const user2 = await storage.getUserByResetToken(token);
      if (!user2) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      await storage.updatePassword(user2.id, password2);
      await storage.clearPasswordResetToken(user2.id);
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/bootstrap-reset", bootstrapResetLimiter, async (req, res) => {
    try {
      const { token, username, password: password2 } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!token || !username || !password2) {
        console.log(`[BOOTSTRAP] Invalid request - missing fields from IP: ${clientIp}`);
        return res.status(400).json({ error: "Token, username, and password are required" });
      }
      if (password2.length < 6) {
        console.log(`[BOOTSTRAP] Password too short from IP: ${clientIp}`);
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const validToken = await storage.getValidBootstrapToken(token);
      if (!validToken) {
        console.log(`[BOOTSTRAP] Invalid or consumed token attempted from IP: ${clientIp}`);
        return res.status(401).json({ error: "Invalid or already used reset token" });
      }
      const user2 = await storage.getUserByUsername(username);
      if (!user2) {
        console.log(`[BOOTSTRAP] User not found: ${username} from IP: ${clientIp}`);
        return res.status(404).json({ error: "User not found" });
      }
      if (user2.role !== "admin") {
        console.log(`[BOOTSTRAP] Attempted reset of non-admin account: ${username} from IP: ${clientIp}`);
        return res.status(403).json({ error: "Can only reset admin accounts via bootstrap" });
      }
      await storage.updatePassword(user2.id, password2);
      await storage.consumeBootstrapToken(validToken.id, username, clientIp);
      console.log(`[BOOTSTRAP] Successfully reset password for admin: ${username} from IP: ${clientIp}`);
      res.json({
        message: "Admin password reset successful. You can now log in with your new password.",
        username
      });
    } catch (error) {
      console.error("[BOOTSTRAP] Reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    const accountType = req.session.accountType || "client";
    const restaurantId = req.session.user.restaurantId;
    const user2 = restaurantId ? await storage.getUser(req.session.userId, restaurantId) : await storage.getUserById(req.session.userId);
    if (!user2 || !user2.active) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    let restaurant = null;
    if (accountType === "client" && restaurantId) {
      restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(500).json({ error: "Restaurant not found" });
      }
    }
    const { password: _, ...userWithoutPassword } = user2;
    res.json({ user: userWithoutPassword, restaurant, accountType });
  });
  app2.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType || "client";
      const restaurantId = req.session.user.restaurantId;
      const { devicePreference } = req.body;
      if (devicePreference && !["laptop", "ipad", "iphone"].includes(devicePreference)) {
        return res.status(400).json({ error: "Invalid device preference. Must be 'laptop', 'ipad', or 'iphone'" });
      }
      const updatedUser = restaurantId ? await storage.updateUser(req.session.userId, restaurantId, { devicePreference }) : await storage.updateUserById(req.session.userId, { devicePreference });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let restaurant = null;
      if (accountType === "client" && restaurantId) {
        restaurant = await storage.getRestaurant(restaurantId);
        if (!restaurant) {
          return res.status(500).json({ error: "Restaurant not found" });
        }
      }
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, restaurant });
    } catch (error) {
      console.error("Update user preference error:", error);
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });
  app2.get("/api/users", requireAuth, requireRestaurant, requirePermission("users"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const users2 = await storage.getUsers(restaurantId);
    const usersWithoutPasswords = users2.map(({ password: _, ...user2 }) => user2);
    res.json(usersWithoutPasswords);
  });
  app2.get("/api/users/:id", requireAuth, requireRestaurant, requirePermission("users"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const user2 = await storage.getUser(req.params.id, restaurantId);
    if (!user2) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user2;
    res.json(userWithoutPassword);
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const { monthlySalary, ...userData } = req.body;
      let restaurantId;
      let isSetupMode = false;
      if (req.session?.userId && req.session?.user) {
        if (req.session.user.role !== "admin") {
          return res.status(403).json({ error: "Admin access required" });
        }
        restaurantId = req.session.user.restaurantId;
      } else {
        if (!userData.restaurantId) {
          return res.status(400).json({ error: "Restaurant ID required for setup" });
        }
        const restaurant = await storage.getRestaurant(userData.restaurantId);
        if (!restaurant) {
          return res.status(400).json({ error: "Invalid restaurant ID" });
        }
        if (restaurant.setupComplete) {
          return res.status(403).json({ error: "Restaurant setup already complete. Please log in to create users." });
        }
        restaurantId = userData.restaurantId;
        isSetupMode = true;
      }
      const data = insertUserSchema.parse({ ...userData, restaurantId });
      if (monthlySalary) {
        const salaryValue = parseFloat(monthlySalary);
        if (isNaN(salaryValue) || salaryValue <= 0) {
          return res.status(400).json({ error: "Invalid monthly salary amount" });
        }
      }
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user2 = await storage.createUser(data);
      if (monthlySalary && parseFloat(monthlySalary) > 0) {
        try {
          const today = /* @__PURE__ */ new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          await storage.createSalary({
            restaurantId,
            employeeName: user2.fullName,
            position: user2.role,
            amount: monthlySalary,
            paymentDate: nextMonth,
            status: "pending",
            branchId: user2.branchId || void 0
          });
        } catch (salaryError) {
          console.error("Failed to create salary entry:", salaryError);
          await storage.deleteUser(user2.id, restaurantId);
          return res.status(400).json({ error: "Failed to create employee salary entry" });
        }
      }
      if (isSetupMode && user2.role === "admin") {
        await storage.createDefaultChannels(restaurantId, user2.id);
        console.log(`[SETUP] Created default chat channels for restaurant ${restaurantId}`);
        await storage.updateRestaurant(restaurantId, { setupComplete: true });
        console.log(`[SETUP] Restaurant ${restaurantId} setup completed with admin user ${user2.username}`);
      }
      const { password: _, ...userWithoutPassword } = user2;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  app2.patch("/api/users/:id", requireAuth, requireRestaurant, requireAction("users", "edit"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { password: password2, restaurantId: _, role: __, ...updateData } = req.body;
      console.log("[USER UPDATE] Updating user:", req.params.id);
      console.log("[USER UPDATE] Update data received:", JSON.stringify(updateData, null, 2));
      if (password2) {
        const hashedPassword = await bcrypt2.hash(password2, 10);
        updateData.password = hashedPassword;
      }
      const dateFields = ["hireDate", "probationEndDate", "visaExpiryDate", "ticketDate", "lastReviewDate"];
      for (const field of dateFields) {
        if (updateData[field] !== void 0) {
          if (updateData[field] === null || updateData[field] === "") {
            updateData[field] = null;
          } else if (typeof updateData[field] === "string") {
            updateData[field] = new Date(updateData[field]);
          }
        }
      }
      const user2 = await storage.updateUser(req.params.id, restaurantId, updateData);
      if (!user2) {
        console.log("[USER UPDATE] User not found after update");
        return res.status(404).json({ error: "User not found" });
      }
      console.log("[USER UPDATE] User updated successfully. New permissions:", JSON.stringify(user2.permissions, null, 2));
      broadcastNotification({
        type: "permissions:updated",
        restaurantId,
        targetUserId: req.params.id
      });
      const { password: _p, ...userWithoutPassword } = user2;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  app2.delete("/api/users/:id", requireAuth, requireRestaurant, requireAction("users", "delete"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const success = await storage.deleteUser(req.params.id, restaurantId);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/profile", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    try {
      const user2 = await storage.getUserProfile(req.session.userId, restaurantId);
      if (!user2 || !user2.active) {
        return res.status(404).json({ error: "User not found" });
      }
      const restaurant = await storage.getRestaurant(user2.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = user2;
      res.json({ user: userProfile, restaurant });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });
  app2.put("/api/profile", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    try {
      const { email, phone } = req.body;
      const profileUpdate = {};
      if (email !== void 0) profileUpdate.email = email;
      if (phone !== void 0) profileUpdate.phone = phone;
      const updatedUser = await storage.updateUserProfile(req.session.user.id, restaurantId, profileUpdate);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.post("/api/subscription/cancel", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    try {
      const user2 = await storage.getUser(req.session.user.id, restaurantId);
      if (!user2) {
        return res.status(404).json({ error: "User not found" });
      }
      const restaurant = await storage.getRestaurant(user2.restaurantId);
      if (!restaurant || restaurant.subscriptionStatus !== "active") {
        return res.status(400).json({ error: "No active subscription to cancel" });
      }
      const updatedUser = await storage.cancelSubscription(req.session.user.id, restaurantId);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to cancel subscription" });
      }
      const { password: _, passwordResetToken, passwordResetExpiry, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
  app2.get("/api/analytics/financial", requireAuth, requireRestaurant, requirePermission("reports"), async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const { period, year } = req.query;
    const transactions2 = await storage.getTransactions({ restaurantId });
    const invoices2 = await storage.getInvoices({ restaurantId });
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Number(year) || (/* @__PURE__ */ new Date()).getFullYear(), i, 1);
      const monthTransactions = transactions2.filter((t) => {
        const txDate = t.createdAt;
        return txDate.getMonth() === i && txDate.getFullYear() === month.getFullYear();
      });
      const totalRevenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
      const vatCollected = monthTransactions.reduce((sum, t) => sum + parseFloat(t.tax), 0);
      return {
        month: month.toLocaleString("en-US", { month: "short" }),
        revenue: totalRevenue.toFixed(2),
        vat: vatCollected.toFixed(2),
        transactions: monthTransactions.length
      };
    });
    const yearlyRevenue = transactions2.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const yearlyVAT = transactions2.reduce((sum, t) => sum + parseFloat(t.tax), 0);
    res.json({
      monthly: monthlyData,
      yearly: {
        revenue: yearlyRevenue.toFixed(2),
        vat: yearlyVAT.toFixed(2),
        transactions: transactions2.length,
        invoices: invoices2.length
      }
    });
  });
  app2.get("/api/invoices", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const { branchId, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : void 0;
    const end = endDate ? new Date(endDate) : void 0;
    const dateRange = start || end ? { start, end } : void 0;
    const invoices2 = await storage.getInvoices({
      restaurantId,
      branchId,
      dateRange
    });
    res.json(invoices2);
  });
  app2.get("/api/invoices/:id", requireAuth, requireRestaurant, async (req, res) => {
    const restaurantId = req.session.user.restaurantId;
    const invoice = await storage.getInvoice(req.params.id, restaurantId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });
  app2.post("/api/invoices", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const data = insertInvoiceSchema.parse(req.body);
      const { restaurantId: _, ...safeData } = data;
      const invoice = await storage.createInvoice({ ...safeData, restaurantId });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });
  app2.get("/public/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoicePublic(req.params.id);
      if (!invoice) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Invoice Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
                h1 { color: #e74c3c; }
              </style>
            </head>
            <body>
              <h1>Invoice Not Found</h1>
              <p>The requested invoice does not exist.</p>
            </body>
          </html>
        `);
      }
      const settings2 = await storage.getSettings(invoice.restaurantId);
      const order = invoice.orderId ? await storage.getOrder(invoice.orderId, invoice.restaurantId) : null;
      const html = `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: #f5f5f5; 
                padding: 20px;
                color: #333;
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 40px; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border-radius: 8px;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #2c3e50; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .header h1 { 
                font-size: 28px; 
                color: #2c3e50; 
                margin-bottom: 10px; 
              }
              .header .subtitle { 
                font-size: 18px; 
                color: #7f8c8d; 
                font-weight: normal; 
              }
              .company-info { 
                background: #ecf0f1; 
                padding: 15px; 
                border-radius: 6px; 
                margin-bottom: 25px; 
              }
              .company-info p { 
                margin: 5px 0; 
                font-size: 14px; 
              }
              .invoice-details { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin-bottom: 30px; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 6px; 
              }
              .detail-group h3 { 
                font-size: 14px; 
                color: #7f8c8d; 
                margin-bottom: 8px; 
                text-transform: uppercase; 
              }
              .detail-group p { 
                font-size: 16px; 
                font-weight: 600; 
                color: #2c3e50; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px; 
              }
              th { 
                background: #34495e; 
                color: white; 
                padding: 12px; 
                text-align: left; 
                font-weight: 600; 
              }
              td { 
                padding: 12px; 
                border-bottom: 1px solid #ecf0f1; 
              }
              tr:nth-child(even) { 
                background: #f8f9fa; 
              }
              .totals { 
                margin-left: auto; 
                width: 350px; 
                margin-top: 20px; 
              }
              .totals .row { 
                display: flex; 
                justify-content: space-between; 
                padding: 10px; 
                border-bottom: 1px solid #ecf0f1; 
              }
              .totals .row.total { 
                background: #2c3e50; 
                color: white; 
                font-weight: bold; 
                font-size: 18px; 
                border-radius: 6px; 
                margin-top: 5px; 
              }
              .footer { 
                text-align: center; 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #ecf0f1; 
                color: #7f8c8d; 
                font-size: 14px; 
              }
              .download-btn { 
                display: inline-block; 
                background: #3498db; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin-top: 20px; 
                font-weight: 600; 
                transition: background 0.3s; 
              }
              .download-btn:hover { 
                background: #2980b9; 
              }
              @media print {
                body { background: white; padding: 0; }
                .container { box-shadow: none; padding: 20px; }
                .download-btn { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${settings2?.restaurantName || "Restaurant Management System"}</h1>
                <p class="subtitle">Tax Invoice / \u0641\u0627\u062A\u0648\u0631\u0629 \u0636\u0631\u064A\u0628\u064A\u0629</p>
              </div>

              <div class="company-info">
                <p><strong>VAT Number:</strong> ${settings2?.vatNumber || "N/A"}</p>
                <p><strong>Address:</strong> ${settings2?.address || "Riyadh, Saudi Arabia"}</p>
                <p><strong>Email:</strong> ${settings2?.email || "info@restaurant.sa"}</p>
                <p><strong>Phone:</strong> ${settings2?.phone || "+966 11 234 5678"}</p>
              </div>

              <div class="invoice-details">
                <div class="detail-group">
                  <h3>Invoice Number</h3>
                  <p>${invoice.invoiceNumber}</p>
                </div>
                <div class="detail-group">
                  <h3>Date</h3>
                  <p>${new Date(invoice.createdAt).toLocaleDateString("en-SA", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}</p>
                </div>
                ${invoice.customerName ? `
                <div class="detail-group">
                  <h3>Customer</h3>
                  <p>${invoice.customerName}</p>
                </div>
                ` : ""}
                ${order?.orderNumber ? `
                <div class="detail-group">
                  <h3>Order Number</h3>
                  <p>${order.orderNumber}</p>
                </div>
                ` : ""}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">${(item.total / item.quantity).toFixed(2)} SAR</td>
                      <td style="text-align: right;">${item.total.toFixed(2)} SAR</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>

              <div class="totals">
                <div class="row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal).toFixed(2)} SAR</span>
                </div>
                <div class="row">
                  <span>VAT (15%):</span>
                  <span>${parseFloat(invoice.vatAmount).toFixed(2)} SAR</span>
                </div>
                <div class="row total">
                  <span>Total Amount:</span>
                  <span>${parseFloat(invoice.total).toFixed(2)} SAR</span>
                </div>
              </div>

              ${invoice.qrCode ? `
                <div style="text-align: center; margin: 30px 0;">
                  <h3 style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">ZATCA QR Code</h3>
                  <img src="${invoice.qrCode}" alt="ZATCA QR Code" style="width: 200px; height: 200px; border: 2px solid #ecf0f1; padding: 10px; border-radius: 6px;" />
                </div>
              ` : ""}

              ${invoice.pdfPath ? `
                <div style="text-align: center;">
                  <a href="${invoice.pdfPath}" class="download-btn" download>Download PDF</a>
                </div>
              ` : ""}

              <div class="footer">
                <p><strong>ZATCA Compliant Invoice</strong></p>
                <p>This is an official tax invoice issued in accordance with Saudi Arabia VAT regulations.</p>
                <p style="margin-top: 10px;">Thank you for your business!</p>
              </div>
            </div>
          </body>
        </html>
      `;
      res.send(html);
    } catch (error) {
      console.error("[PUBLIC INVOICE] Error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>Error Loading Invoice</h1>
            <p>An error occurred while loading the invoice. Please try again later.</p>
          </body>
        </html>
      `);
    }
  });
  app2.use("/invoices", (req, res, next) => {
    const filePath = path3.join(process.cwd(), "invoices", req.path);
    if (fs2.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Invoice not found" });
    }
  });
  app2.post("/api/invoices/create-and-generate", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      console.log("[Invoice Generate] Request body:", JSON.stringify(req.body));
      const { orderId } = req.body;
      if (!orderId) {
        console.error("[Invoice Generate] Missing orderId in request body");
        return res.status(400).json({ error: "Order ID required" });
      }
      console.log("[Invoice Generate] Processing orderId:", orderId);
      const order = await storage.getOrder(orderId, restaurantId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const settings2 = await storage.getSettings(restaurantId);
      const branch = order.branchId ? await storage.getBranch(order.branchId, restaurantId) : null;
      const invoiceNumber = `INV-${order.orderNumber}`;
      const invoiceItems = order.items.map((item) => {
        const totalPrice = item.quantity * item.price;
        const basePrice = totalPrice / 1.15;
        const vatAmount = totalPrice - basePrice;
        return {
          name: item.name,
          quantity: item.quantity,
          basePrice: parseFloat(basePrice.toFixed(2)),
          vatAmount: parseFloat(vatAmount.toFixed(2)),
          total: parseFloat(totalPrice.toFixed(2))
        };
      });
      const invoiceData = {
        restaurantId: req.session.user.restaurantId,
        invoiceNumber,
        orderId: order.id,
        branchId: order.branchId,
        customerName: order.customerName || "Walk-in Customer",
        items: invoiceItems,
        subtotal: order.subtotal,
        vatAmount: order.tax,
        total: order.total,
        qrCode: "",
        // Will be updated after PDF generation
        pdfPath: ""
        // Will be updated after PDF generation
      };
      const createdInvoice = await storage.createInvoice(invoiceData);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const pdfData = {
        order,
        companyName: settings2?.restaurantName || "Restaurant Management System",
        companyVAT: settings2?.vatNumber || "300123456789003",
        branchAddress: branch?.location || settings2?.address || "Main Location, Riyadh",
        companyEmail: settings2?.email || "info@restaurant.sa",
        companyPhone: settings2?.phone || "+966 11 234 5678",
        invoiceNumber,
        invoiceDate: /* @__PURE__ */ new Date(),
        invoiceId: createdInvoice.id,
        baseUrl,
        logoPath: settings2?.logoPath || void 0
      };
      const { pdfBuffer, qrCode } = await generateZATCAInvoice(pdfData);
      const invoicesDir = path3.join(process.cwd(), "public", "invoices");
      if (!fs2.existsSync(invoicesDir)) {
        fs2.mkdirSync(invoicesDir, { recursive: true });
      }
      const pdfFilename = `${invoiceNumber}.pdf`;
      const pdfPath = path3.join(invoicesDir, pdfFilename);
      fs2.writeFileSync(pdfPath, pdfBuffer);
      await storage.updateInvoice(createdInvoice.id, restaurantId, {
        qrCode,
        pdfPath: `/invoices/${pdfFilename}`
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  const XLSX = await import("xlsx");
  app2.get("/api/templates/inventory", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Item",
        category: "Sample Category",
        quantity: 100,
        unit: "kg",
        supplier: "Sample Supplier",
        status: "In Stock",
        branchId: ""
      }];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Template");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=inventory_template.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  app2.get("/api/templates/menu", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Dish",
        category: "Main Course",
        basePrice: 50,
        price: 57.5,
        vatAmount: 7.5,
        discount: 0,
        description: "Sample description",
        available: true,
        imageUrl: ""
      }];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=menu_template.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  app2.get("/api/templates/recipes", async (req, res) => {
    try {
      const templateData = [{
        name: "Sample Recipe",
        menuItemId: "",
        prepTime: "15 min",
        cookTime: "30 min",
        servings: 4,
        cost: 25,
        ingredients: JSON.stringify([
          { inventoryItemId: "", name: "Sample Ingredient", quantity: 2, unit: "kg" }
        ]),
        steps: JSON.stringify([
          "Step 1: Sample preparation step",
          "Step 2: Sample cooking step"
        ])
      }];
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recipes Template");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=recipes_template.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });
  app2.get("/api/export/inventory", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const branchId = req.query.branchId;
      const items = await storage.getInventoryItems(restaurantId, branchId);
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Inventory export error:", error);
      res.status(500).json({ error: "Failed to export inventory" });
    }
  });
  app2.get("/api/export/menu", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const items = await storage.getMenuItems(restaurantId);
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menu");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=menu.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Menu export error:", error);
      res.status(500).json({ error: "Failed to export menu" });
    }
  });
  app2.get("/api/export/recipes", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const recipes2 = await storage.getRecipes(restaurantId);
      const flattenedRecipes = recipes2.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        cost: recipe.cost,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps)
      }));
      const worksheet = XLSX.utils.json_to_sheet(flattenedRecipes);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recipes");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=recipes.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Recipes export error:", error);
      res.status(500).json({ error: "Failed to export recipes" });
    }
  });
  app2.get("/api/export/orders", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const branchId = req.query.branchId;
      const status = req.query.status;
      const orders2 = await storage.getOrders({ restaurantId, branchId, status });
      const flattenedOrders = orders2.map((order) => ({
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
        createdAt: order.createdAt
      }));
      const worksheet = XLSX.utils.json_to_sheet(flattenedOrders);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Orders export error:", error);
      res.status(500).json({ error: "Failed to export orders" });
    }
  });
  app2.get("/api/export/transactions", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const branchId = req.query.branchId;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const dateRange = startDate || endDate ? { start: startDate, end: endDate } : void 0;
      const transactions2 = await storage.getTransactions({ restaurantId, branchId, dateRange });
      const worksheet = XLSX.utils.json_to_sheet(transactions2);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=transactions.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Transactions export error:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });
  app2.get("/api/export/procurement", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const type = req.query.type;
      const status = req.query.status;
      const branchId = req.query.branchId;
      const procurements = await storage.getProcurements({
        restaurantId,
        type,
        status,
        branchId
      });
      const worksheet = XLSX.utils.json_to_sheet(procurements);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Procurement");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=procurement.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Procurement export error:", error);
      res.status(500).json({ error: "Failed to export procurement" });
    }
  });
  app2.get("/api/export/customers", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const customers2 = await storage.getCustomers(restaurantId);
      const worksheet = XLSX.utils.json_to_sheet(customers2);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Customers export error:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  });
  app2.get("/api/export/branches", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const branches2 = await storage.getBranches(restaurantId);
      const worksheet = XLSX.utils.json_to_sheet(branches2);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=branches.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Branches export error:", error);
      res.status(500).json({ error: "Failed to export branches" });
    }
  });
  app2.get("/api/export/profitability", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const period = req.query.period || "month";
      const menuItems2 = await storage.getMenuItems(restaurantId);
      const recipes2 = await storage.getRecipes(restaurantId);
      const orders2 = await storage.getOrders({ restaurantId });
      const now = /* @__PURE__ */ new Date();
      const cutoffDate = /* @__PURE__ */ new Date();
      switch (period) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      const filteredOrders = orders2.filter((order) => new Date(order.createdAt) >= cutoffDate);
      const profitabilityData = menuItems2.map((item) => {
        const recipe = item.recipeId ? recipes2.find((r) => r.id === item.recipeId) : null;
        const cost = recipe ? parseFloat(recipe.cost) : 0;
        const basePrice = parseFloat(item.basePrice);
        const profit = basePrice - cost;
        const margin = basePrice > 0 ? profit / basePrice * 100 : 0;
        const itemSales = filteredOrders.filter(
          (order) => order.items?.some((orderItem) => orderItem.id === item.id)
        );
        const salesVolume = itemSales.reduce((sum, order) => {
          const orderItem = order.items?.find((oi) => oi.id === item.id);
          return sum + (orderItem?.quantity || 0);
        }, 0);
        const totalRevenue = salesVolume * basePrice;
        const totalProfit = salesVolume * profit;
        return {
          "Item Name": item.name,
          "Category": item.category,
          "Base Price (SAR)": basePrice.toFixed(2),
          "Cost (SAR)": cost.toFixed(2),
          "Profit per Unit (SAR)": profit.toFixed(2),
          "Margin (%)": margin.toFixed(2),
          "Sales Volume": salesVolume,
          "Total Revenue (SAR)": totalRevenue.toFixed(2),
          "Total Profit (SAR)": totalProfit.toFixed(2)
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(profitabilityData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Profitability");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=profitability-${period}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Profitability export error:", error);
      res.status(500).json({ error: "Failed to export profitability data" });
    }
  });
  app2.get("/api/export/financial", requireAuth, requireRestaurant, requirePermission("reports"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const year = req.query.year || (/* @__PURE__ */ new Date()).getFullYear().toString();
      const period = req.query.period || "monthly";
      const transactions2 = await storage.getTransactions({ restaurantId });
      const invoices2 = await storage.getInvoices({ restaurantId });
      const yearTransactions = transactions2.filter(
        (t) => new Date(t.createdAt).getFullYear() === parseInt(year)
      );
      if (period === "monthly") {
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthTransactions = yearTransactions.filter(
            (t) => new Date(t.createdAt).getMonth() === i
          );
          const revenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
          const vat = revenue * 0.15;
          return {
            "Month": new Date(parseInt(year), i).toLocaleString("default", { month: "long" }),
            "Revenue (SAR)": revenue.toFixed(2),
            "VAT (SAR)": vat.toFixed(2),
            "Total (SAR)": (revenue + vat).toFixed(2),
            "Transactions": monthTransactions.length
          };
        });
        const worksheet = XLSX.utils.json_to_sheet(monthlyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Financial");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=financial-${year}-monthly.xlsx`);
        res.send(buffer);
      } else {
        const revenue = yearTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
        const vat = revenue * 0.15;
        const yearInvoices = invoices2.filter(
          (inv) => new Date(inv.createdAt).getFullYear() === parseInt(year)
        );
        const yearlyData = [{
          "Year": year,
          "Total Revenue (SAR)": revenue.toFixed(2),
          "Total VAT (SAR)": vat.toFixed(2),
          "Total (SAR)": (revenue + vat).toFixed(2),
          "Total Transactions": yearTransactions.length,
          "Total Invoices": yearInvoices.length
        }];
        const worksheet = XLSX.utils.json_to_sheet(yearlyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Yearly Financial");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=financial-${year}-yearly.xlsx`);
        res.send(buffer);
      }
    } catch (error) {
      console.error("Financial export error:", error);
      res.status(500).json({ error: "Failed to export financial data" });
    }
  });
  app2.get("/api/export/financial-pdf", requireAuth, requireRestaurant, requirePermission("reports"), async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const year = req.query.year || (/* @__PURE__ */ new Date()).getFullYear().toString();
      const period = req.query.period || "monthly";
      const settings2 = await storage.getSettings(restaurantId);
      const transactions2 = await storage.getTransactions({ restaurantId });
      const invoices2 = await storage.getInvoices({ restaurantId });
      const yearTransactions = transactions2.filter(
        (t) => new Date(t.createdAt).getFullYear() === parseInt(year)
      );
      const yearInvoices = invoices2.filter(
        (inv) => new Date(inv.createdAt).getFullYear() === parseInt(year)
      );
      const revenue = yearTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
      const vat = revenue * 0.15;
      const yearlyData = {
        revenue: revenue.toFixed(2),
        vat: vat.toFixed(2),
        transactions: yearTransactions.length,
        invoices: yearInvoices.length
      };
      let monthlyData;
      if (period === "monthly") {
        monthlyData = Array.from({ length: 12 }, (_, i) => {
          const monthTransactions = yearTransactions.filter(
            (t) => new Date(t.createdAt).getMonth() === i
          );
          const monthRevenue = monthTransactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
          const monthVat = monthRevenue * 0.15;
          return {
            month: new Date(parseInt(year), i).toLocaleString("default", { month: "long" }),
            revenue: monthRevenue.toFixed(2),
            vat: monthVat.toFixed(2),
            transactions: monthTransactions.length
          };
        });
      }
      const { generateFinancialStatementPDF: generateFinancialStatementPDF2 } = await Promise.resolve().then(() => (init_invoice(), invoice_exports));
      const pdfBuffer = await generateFinancialStatementPDF2({
        companyName: settings2?.restaurantName || "BlindSpot System (BSS)",
        companyVAT: settings2?.vatNumber || "",
        year,
        period,
        yearlyData,
        monthlyData
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=financial-statement-${year}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Financial PDF export error:", error);
      res.status(500).json({ error: "Failed to export financial statement" });
    }
  });
  app2.get("/api/invoices/:id/download", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const invoice = await storage.getInvoice(req.params.id, restaurantId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      if (invoice.pdfPath) {
        const relativePath = invoice.pdfPath.replace(/^\/+/, "");
        const filePath = path3.normalize(path3.join(process.cwd(), "public", relativePath));
        console.log("[Invoice Download] Looking for file at:", filePath);
        if (fs2.existsSync(filePath)) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
          return res.sendFile(filePath);
        } else {
          console.error("[Invoice Download] PDF file not found at:", filePath);
        }
      }
      res.status(404).json({ error: "Invoice PDF not found" });
    } catch (error) {
      console.error("Invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });
  const upload = multer({ storage: multer.memoryStorage() });
  const menuImageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadPath = path3.join(process.cwd(), "uploads", "menu-images");
      if (!fs2.existsSync(uploadPath)) {
        fs2.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path3.extname(file.originalname);
      cb(null, "menu-" + uniqueSuffix + ext);
    }
  });
  const uploadMenuImage = multer({
    storage: menuImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: function(req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname3 = allowedTypes.test(path3.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname3) {
        return cb(null, true);
      }
      cb(new Error("Only image files are allowed!"));
    }
  });
  app2.post("/api/menu/upload-image", requireAuth, requireRestaurant, requireAction("menu", "edit"), uploadMenuImage.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      const imageUrl = `/uploads/menu-images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.use("/uploads/menu-images", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app2.use("/uploads/menu-images", (await import("express")).static(path3.join(process.cwd(), "uploads", "menu-images")));
  const licenseFileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadPath = path3.join(process.cwd(), "uploads", "license-files");
      if (!fs2.existsSync(uploadPath)) {
        fs2.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path3.extname(file.originalname);
      cb(null, "license-" + uniqueSuffix + ext);
    }
  });
  const uploadLicenseFile = multer({
    storage: licenseFileStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    // 10MB limit for license documents
    fileFilter: function(req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname3 = allowedTypes.test(path3.extname(file.originalname).toLowerCase());
      const allowedMimetypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"];
      const mimetype = allowedMimetypes.includes(file.mimetype);
      if (mimetype && extname3) {
        return cb(null, true);
      }
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) and PDF documents are allowed!"));
    }
  });
  app2.post("/api/licenses/upload-file", requireAuth, requireRestaurant, requireAction("licenses", "add"), uploadLicenseFile.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/api/licenses/files/${req.file.filename}`;
      const originalName = req.file.originalname;
      res.json({ fileUrl, originalName });
    } catch (error) {
      console.error("License file upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  app2.get("/api/licenses/files/:filename", requireAuth, requireRestaurant, requireAction("licenses", "view"), async (req, res) => {
    try {
      const filename = req.params.filename;
      if (!/^license-[\w-]+\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return res.status(400).json({ error: "Invalid filename format" });
      }
      const filePath = path3.join(process.cwd(), "uploads", "license-files", filename);
      if (!fs2.existsSync(filePath)) {
        return res.status(404).json({ error: "License file not found" });
      }
      const ext = path3.extname(filename).toLowerCase();
      const contentTypes = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
      };
      const contentType = contentTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.sendFile(filePath);
    } catch (error) {
      console.error("License file download error:", error);
      res.status(500).json({ error: "Failed to download license file" });
    }
  });
  app2.get("/api/subscription-invoices/:filename", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const filename = req.params.filename;
      const restaurantId = req.session.user.restaurantId;
      const match = filename.match(/^subscription-(\d{4}-\d{8}-\d{6})\.pdf$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid filename format" });
      }
      const serialNumber = match[1];
      const invoice = await storage.getSubscriptionInvoiceBySerialNumber(serialNumber, restaurantId);
      if (!invoice) {
        return res.status(403).json({ error: "Access denied - invoice does not belong to your restaurant" });
      }
      const filePath = path3.join(process.cwd(), "public", "subscription-invoices", filename);
      if (!fs2.existsSync(filePath)) {
        return res.status(404).json({ error: "Invoice PDF file not found" });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.sendFile(filePath);
    } catch (error) {
      console.error("Subscription invoice download error:", error);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });
  app2.get("/api/subscription-invoices", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const invoices2 = await storage.getSubscriptionInvoices(userId);
      res.json(invoices2);
    } catch (error) {
      console.error("Get subscription invoices error:", error);
      res.status(500).json({ error: "Failed to fetch subscription invoices" });
    }
  });
  app2.get("/api/chat/conversations", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const branchId = req.query.branchId;
      const conversations2 = await storage.getConversations(restaurantId, userId, branchId);
      res.json(conversations2);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/chat/conversations/:id", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      const conversation = await storage.getConversation(conversationId, restaurantId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  app2.post("/api/chat/channels", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const { name, scope, branchId } = req.body;
      if (!name || !scope) {
        return res.status(400).json({ error: "Name and scope are required" });
      }
      if (scope === "branch" && !branchId) {
        return res.status(400).json({ error: "Branch ID required for branch-scoped channels" });
      }
      const conversation = await storage.createConversation({
        restaurantId,
        type: "channel",
        name,
        scope,
        branchId: scope === "branch" ? branchId : null,
        createdBy: userId
      });
      await storage.addConversationMember({
        restaurantId,
        conversationId: conversation.id,
        userId
      });
      addUserToConversation(userId, restaurantId, conversation.id);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Create channel error:", error);
      res.status(500).json({ error: "Failed to create channel" });
    }
  });
  app2.post("/api/chat/direct", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const { otherUserId } = req.body;
      if (!otherUserId) {
        return res.status(400).json({ error: "Other user ID is required" });
      }
      if (otherUserId === userId) {
        return res.status(400).json({ error: "Cannot create DM with yourself" });
      }
      const otherUser = await storage.getUser(otherUserId, restaurantId);
      if (!otherUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const conversation = await storage.getOrCreateDirectConversation(restaurantId, userId, otherUserId);
      addUserToConversation(userId, restaurantId, conversation.id);
      addUserToConversation(otherUserId, restaurantId, conversation.id);
      res.json(conversation);
    } catch (error) {
      console.error("Get/create DM error:", error);
      res.status(500).json({ error: "Failed to get or create direct conversation" });
    }
  });
  app2.get("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      const messages = await storage.getChatMessages(conversationId, restaurantId, limit);
      res.json(messages.reverse());
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/chat/conversations/:id/messages", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const { content } = req.body;
      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Message content is required" });
      }
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      const user2 = await storage.getUser(userId, restaurantId);
      if (!user2) {
        return res.status(404).json({ error: "User not found" });
      }
      const message = await storage.createChatMessage({
        restaurantId,
        conversationId,
        senderId: userId,
        senderName: user2.fullName,
        content: content.trim()
      });
      broadcastNotification({
        type: "chat:message",
        restaurantId,
        conversationId,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          createdAt: message.createdAt.toISOString()
        }
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.get("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      const members = await storage.getConversationMembers(conversationId, restaurantId);
      res.json(members);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });
  app2.get("/api/chat/notification-settings", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const settings2 = await storage.getChatNotificationDefaults(restaurantId);
      res.json(settings2);
    } catch (error) {
      console.error("Get chat notification settings error:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });
  app2.patch("/api/chat/notification-settings", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userRole = req.session.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Only administrators can update notification settings" });
      }
      const schema = z2.object({
        notificationsEnabled: z2.boolean().optional(),
        soundEnabled: z2.boolean().optional(),
        toneId: z2.string().optional()
      });
      const data = schema.parse(req.body);
      await storage.updateChatNotificationDefaults(restaurantId, data);
      broadcastNotification({
        type: "settings:updated",
        restaurantId
      });
      const updated = await storage.getChatNotificationDefaults(restaurantId);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid notification settings data", details: error.errors });
      }
      console.error("Update chat notification settings error:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });
  app2.post("/api/chat/conversations/:id/members", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const { userId: newUserId } = req.body;
      if (!newUserId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      const conversation = await storage.getConversation(conversationId, restaurantId);
      if (!conversation || conversation.type !== "channel") {
        return res.status(400).json({ error: "Can only add members to channels" });
      }
      const newUser = await storage.getUser(newUserId, restaurantId);
      if (!newUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const alreadyMember = await storage.isUserInConversation(conversationId, newUserId, restaurantId);
      if (alreadyMember) {
        return res.status(400).json({ error: "User is already a member" });
      }
      const member = await storage.addConversationMember({
        restaurantId,
        conversationId,
        userId: newUserId
      });
      addUserToConversation(newUserId, restaurantId, conversationId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  });
  app2.post("/api/chat/conversations/:id/read", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const conversationId = req.params.id;
      const { lastReadMessageId } = req.body;
      const isMember = await storage.isUserInConversation(conversationId, userId, restaurantId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this conversation" });
      }
      await storage.updateMessageRead({
        restaurantId,
        conversationId,
        userId,
        lastReadMessageId: lastReadMessageId || null,
        lastReadAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });
  app2.get("/api/chat/unread-count", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const count = await storage.getUnreadChatCount(restaurantId, userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  app2.get("/api/chat/users", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const users2 = await storage.getUsers(restaurantId);
      const employees = users2.filter((u) => u.role === "employee" && u.active);
      const safeUsers = employees.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        role: u.role
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.post("/api/import/inventory", requireAuth, requireRestaurant, requireAction("inventory", "add"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      let imported = 0;
      let errors = 0;
      for (const row of data) {
        try {
          const name = row.name || row.Name || row["Item Name"] || row["item name"];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          await storage.createInventoryItem({
            restaurantId: req.session.user.restaurantId,
            name,
            category: row.category || row.Category || "",
            quantity: String(row.quantity || row.Quantity || 0),
            unit: row.unit || row.Unit || "",
            supplier: row.supplier || row.Supplier || "",
            status: row.status || row.Status || "In Stock",
            branchId: row.branchId || row.BranchId || null
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
  app2.post("/api/import/menu", requireAuth, requireRestaurant, requireAction("menu", "add"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      let imported = 0;
      let errors = 0;
      for (const row of data) {
        try {
          const name = row.name || row.Name || row["Item Name"] || row["item name"];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          const category = row.category || row.Category || "";
          const basePrice = row.basePrice || row.BasePrice || row["Base Price"] || row["base_price"] || "0";
          const price = row.price || row.Price || row["Price (SAR)"] || "0";
          const vatAmount = row.vatAmount || row.VatAmount || row["VAT Amount"] || row["vat_amount"] || "0";
          const description = row.description || row.Description || "";
          const available = row.available !== void 0 ? Boolean(row.available) : row.Available !== void 0 ? Boolean(row.Available) : true;
          const imageUrl = row.imageUrl || row.ImageUrl || row["Image URL"] || null;
          const discount = row.discount || row.Discount || "0";
          await storage.createMenuItem({
            restaurantId: req.session.user.restaurantId,
            name,
            category,
            basePrice: String(basePrice),
            price: String(price),
            vatAmount: String(vatAmount),
            description,
            available,
            imageUrl,
            discount: String(discount)
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
  app2.post("/api/import/recipes", requireAuth, requireRestaurant, requireAction("recipes", "add"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      let imported = 0;
      let errors = 0;
      for (const row of data) {
        try {
          const name = row.name || row.Name || row["Recipe Name"] || row["recipe name"];
          if (!name) {
            console.error("Error importing row: missing name field", row);
            errors++;
            continue;
          }
          const prepTime = row.prepTime || row.PrepTime || row["Prep Time"] || row["prep_time"] || row["Preparation Time"] || "";
          const cookTime = row.cookTime || row.CookTime || row["Cook Time"] || row["cook_time"] || row["Cooking Time"] || "";
          const servings = row.servings || row.Servings || row["Servings"] || row["Number of Servings"] || 1;
          const cost = row.cost || row.Cost || row["Cost"] || row["Recipe Cost"] || "0";
          let ingredients = [];
          const rawIngredients = row.ingredients || row.Ingredients || row["Ingredients"];
          if (rawIngredients) {
            if (typeof rawIngredients === "string") {
              try {
                ingredients = JSON.parse(rawIngredients);
              } catch {
                ingredients = rawIngredients.split(",").map((i) => i.trim()).filter(Boolean);
              }
            } else if (Array.isArray(rawIngredients)) {
              ingredients = rawIngredients;
            }
          }
          let steps = [];
          const rawSteps = row.steps || row.Steps || row["Steps"] || row["Instructions"];
          if (rawSteps) {
            if (typeof rawSteps === "string") {
              try {
                steps = JSON.parse(rawSteps);
              } catch {
                steps = rawSteps.split(/\n|\d+\.\s*/).map((s) => s.trim()).filter(Boolean);
              }
            } else if (Array.isArray(rawSteps)) {
              steps = rawSteps;
            }
          }
          await storage.createRecipe({
            restaurantId: req.session.user.restaurantId,
            name,
            prepTime: String(prepTime),
            cookTime: String(cookTime),
            servings: Number(servings),
            cost: String(cost),
            ingredients,
            steps
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
  app2.post("/api/import/branches", requireAuth, requireRestaurant, requireAction("branches", "add"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      let imported = 0;
      let errors = 0;
      for (const row of data) {
        try {
          await storage.createBranch({
            restaurantId: req.session.user.restaurantId,
            name: row.name,
            location: row.location || row.address,
            phone: row.phone,
            manager: row.manager,
            staff: Number(row.staff) || void 0,
            status: row.status || void 0
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
  app2.get("/api/vat-reports", requireAuth, requireRestaurant, requirePermission("reports"), async (req, res) => {
    try {
      const authUser = req.session.user;
      const userId = authUser.id;
      const reports = await storage.getMonthlyVatReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching VAT reports:", error);
      res.status(500).json({ error: "Failed to fetch VAT reports" });
    }
  });
  app2.post("/api/vat-reports/generate", requireAuth, requireRestaurant, requireAction("reports", "add"), async (req, res) => {
    try {
      const authUser = req.session.user;
      const userId = authUser.id;
      const restaurantId = authUser.restaurantId;
      const { month, year } = req.body;
      if (!month || !year || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid month or year" });
      }
      const existingReport = await storage.getVatReportByMonth(userId, month, year);
      if (existingReport) {
        return res.status(400).json({ error: "Report for this month already exists" });
      }
      const user2 = await storage.getUserProfile(userId, restaurantId);
      if (!user2) {
        return res.status(404).json({ error: "User not found" });
      }
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      const transactions2 = await storage.getTransactions({
        restaurantId: user2.restaurantId,
        dateRange: { start: startDate, end: endDate }
      });
      const totalSales = transactions2.reduce((sum, tx) => sum + parseFloat(tx.total), 0);
      const totalSalesBaseAmount = totalSales / 1.15;
      const totalSalesVat = totalSales - totalSalesBaseAmount;
      const procurements = await storage.getProcurements({ restaurantId: user2.restaurantId });
      const monthProcurements = procurements.filter((p) => {
        if (!p.orderDate) return false;
        const procDate = new Date(p.orderDate);
        return procDate >= startDate && procDate <= endDate;
      });
      const totalPurchases = monthProcurements.reduce((sum, p) => {
        const amount = parseFloat(p.totalCost);
        return sum + amount;
      }, 0);
      const totalPurchasesBaseAmount = totalPurchases / 1.15;
      const totalPurchasesVat = totalPurchases - totalPurchasesBaseAmount;
      const netVatPayable = totalSalesVat - totalPurchasesVat;
      const serialNumber = await storage.getNextVatReportSerialNumber(year, month);
      const restaurant = await storage.getRestaurant(user2.restaurantId);
      const pdfBuffer = await generateMonthlyVatReport({
        serialNumber,
        reportMonth: month,
        reportYear: year,
        restaurantName: restaurant?.name || user2.username,
        taxNumber: restaurant?.taxNumber || "N/A",
        totalSales,
        totalSalesBaseAmount,
        totalSalesVat,
        totalPurchases,
        totalPurchasesBaseAmount,
        totalPurchasesVat,
        netVatPayable,
        generatedDate: /* @__PURE__ */ new Date()
      });
      const pdfDir = path3.join(process.cwd(), "public", "vat-reports");
      if (!fs2.existsSync(pdfDir)) {
        fs2.mkdirSync(pdfDir, { recursive: true });
      }
      const pdfFilename = `VAT-${year}-${month.toString().padStart(2, "0")}-${serialNumber.replace(/\//g, "-")}.pdf`;
      const pdfPath = path3.join(pdfDir, pdfFilename);
      fs2.writeFileSync(pdfPath, pdfBuffer);
      const qrData = `VAT Report: ${serialNumber}
Period: ${month}/${year}
Net VAT: ${netVatPayable.toFixed(2)} SAR`;
      const qrCode = await QRCode2.toDataURL(qrData);
      const report = await storage.createVatReport({
        userId,
        reportMonth: month,
        reportYear: year,
        serialNumber,
        totalSales: totalSales.toFixed(2),
        totalSalesBaseAmount: totalSalesBaseAmount.toFixed(2),
        totalSalesVat: totalSalesVat.toFixed(2),
        totalPurchases: totalPurchases.toFixed(2),
        totalPurchasesBaseAmount: totalPurchasesBaseAmount.toFixed(2),
        totalPurchasesVat: totalPurchasesVat.toFixed(2),
        netVatPayable: netVatPayable.toFixed(2),
        pdfPath: `/vat-reports/${pdfFilename}`,
        qrCode
      });
      res.json(report);
    } catch (error) {
      console.error("Error generating VAT report:", error);
      res.status(500).json({ error: "Failed to generate VAT report" });
    }
  });
  app2.get("/api/vat-reports/:id/download", requireAuth, requireRestaurant, requirePermission("reports"), async (req, res) => {
    try {
      const authUser = req.session.user;
      const userId = authUser.id;
      const reportId = req.params.id;
      const reports = await storage.getMonthlyVatReports(userId);
      const report = reports.find((r) => r.id === reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (!report.pdfPath) {
        return res.status(404).json({ error: "PDF not available" });
      }
      const relativePath = report.pdfPath.replace(/^\/+/, "");
      const pdfFullPath = path3.normalize(path3.join(process.cwd(), "public", relativePath));
      if (!fs2.existsSync(pdfFullPath)) {
        console.error("[VAT Report Download] PDF file not found at:", pdfFullPath);
        return res.status(404).json({ error: "PDF file not found" });
      }
      res.download(pdfFullPath, path3.basename(pdfFullPath));
    } catch (error) {
      console.error("Error downloading VAT report:", error);
      res.status(500).json({ error: "Failed to download VAT report" });
    }
  });
  app2.get("/api/moyasar/config", (_req, res) => {
    try {
      const { getPublishableKey: getPublishableKey2 } = (init_moyasarService(), __toCommonJS(moyasarService_exports));
      res.json({
        publishableKey: getPublishableKey2(),
        currency: "SAR"
      });
    } catch (error) {
      console.error("Error getting Moyasar config:", error);
      res.status(500).json({ error: "Failed to get payment configuration" });
    }
  });
  app2.post("/api/moyasar/create-payment", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { orderId, amount, description, token, customerName, customerEmail, customerPhone } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const { createPayment: createPayment2 } = (init_moyasarService(), __toCommonJS(moyasarService_exports));
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/moyasar/callback`;
      const payment = await createPayment2({
        amount: parseFloat(amount),
        description: description || `Order Payment`,
        callbackUrl,
        source: token ? {
          type: "token",
          token
        } : void 0,
        metadata: {
          orderId,
          customerName,
          customerEmail,
          customerPhone
        }
      });
      const amountSar = payment.amount / 100;
      const moyasarPayment = await storage.createMoyasarPayment({
        restaurantId,
        moyasarId: payment.id,
        orderId: orderId || null,
        transactionId: null,
        amount: amountSar.toString(),
        amountHalalas: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.source?.type || null,
        cardBrand: payment.source?.company || null,
        cardLast4: payment.source?.number ? payment.source.number.slice(-4) : null,
        fee: payment.fee ? (payment.fee / 100).toString() : null,
        refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : "0",
        description: payment.description,
        customerName,
        customerEmail,
        customerPhone,
        callbackUrl: payment.callback_url,
        metadata: payment.metadata,
        errorMessage: payment.source?.message || null,
        branchId: req.body.branchId || null
      });
      res.json({
        success: true,
        payment: moyasarPayment,
        moyasarPayment: payment
      });
    } catch (error) {
      console.error("Error creating Moyasar payment:", error);
      res.status(500).json({
        error: "Payment creation failed",
        message: error.message
      });
    }
  });
  app2.get("/api/moyasar/payment/:paymentId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { fetchPayment: fetchPayment2 } = (init_moyasarService(), __toCommonJS(moyasarService_exports));
      const payment = await fetchPayment2(req.params.paymentId);
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarId(req.params.paymentId, restaurantId);
      if (moyasarPayment) {
        await storage.updateMoyasarPayment(moyasarPayment.id, restaurantId, {
          status: payment.status,
          paymentMethod: payment.source?.type || moyasarPayment.paymentMethod,
          cardBrand: payment.source?.company || moyasarPayment.cardBrand,
          cardLast4: payment.source?.number ? payment.source.number.slice(-4) : moyasarPayment.cardLast4,
          fee: payment.fee ? (payment.fee / 100).toString() : moyasarPayment.fee,
          refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount,
          errorMessage: payment.source?.message || moyasarPayment.errorMessage
        });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching Moyasar payment:", error);
      res.status(500).json({
        error: "Failed to fetch payment",
        message: error.message
      });
    }
  });
  app2.post("/api/moyasar/refund/:paymentId", requireAuth, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const { amount } = req.body;
      const { refundPayment: refundPayment2 } = (init_moyasarService(), __toCommonJS(moyasarService_exports));
      const payment = await refundPayment2(
        req.params.paymentId,
        amount ? parseFloat(amount) : void 0
      );
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarId(req.params.paymentId, restaurantId);
      if (moyasarPayment) {
        await storage.updateMoyasarPayment(moyasarPayment.id, restaurantId, {
          status: payment.status,
          refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount
        });
      }
      res.json({
        success: true,
        payment
      });
    } catch (error) {
      console.error("Error refunding Moyasar payment:", error);
      res.status(500).json({
        error: "Refund failed",
        message: error.message
      });
    }
  });
  app2.post("/api/moyasar/callback", async (req, res) => {
    try {
      const { id: paymentId, status, amount, source } = req.body;
      const signature = req.headers["x-moyasar-signature"];
      const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;
      if (webhookSecret) {
        if (!signature) {
          console.warn("[Moyasar Webhook] Missing signature header");
          return res.status(401).json({ error: "Unauthorized: Missing signature" });
        }
        const crypto = __require("crypto");
        const rawBody = req.rawBody;
        if (!rawBody) {
          console.error("[Moyasar Webhook] Raw body not available for signature verification");
          return res.status(500).json({ error: "Server configuration error" });
        }
        const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
          console.warn("[Moyasar Webhook] Invalid signature");
          return res.status(401).json({ error: "Unauthorized: Invalid signature" });
        }
      } else {
        console.warn("[Moyasar Webhook] MOYASAR_WEBHOOK_SECRET not configured - signature verification disabled");
      }
      const { fetchPayment: fetchPayment2 } = (init_moyasarService(), __toCommonJS(moyasarService_exports));
      const payment = await fetchPayment2(paymentId);
      const moyasarPayment = await storage.getMoyasarPaymentByMoyasarIdAnyTenant(paymentId);
      if (!moyasarPayment) {
        console.warn(`[Moyasar Webhook] Payment not found: ${paymentId}`);
        return res.status(404).json({ error: "Payment not found" });
      }
      await storage.updateMoyasarPayment(moyasarPayment.id, moyasarPayment.restaurantId, {
        status: payment.status,
        paymentMethod: payment.source?.type || moyasarPayment.paymentMethod,
        cardBrand: payment.source?.company || moyasarPayment.cardBrand,
        cardLast4: payment.source?.number ? payment.source.number.slice(-4) : moyasarPayment.cardLast4,
        fee: payment.fee ? (payment.fee / 100).toString() : moyasarPayment.fee,
        refundedAmount: payment.refunded ? (payment.refunded / 100).toString() : moyasarPayment.refundedAmount,
        errorMessage: payment.source?.message || moyasarPayment.errorMessage
      });
      if (payment.status === "paid" && moyasarPayment.orderId) {
        await storage.updateOrder(moyasarPayment.orderId, moyasarPayment.restaurantId, {
          status: "paid",
          paymentMethod: "Moyasar - " + (payment.source?.company || payment.source?.type || "Online")
        });
      }
      console.log(`[Moyasar Webhook] Payment ${paymentId} updated successfully (restaurant: ${moyasarPayment.restaurantId})`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Moyasar callback:", error);
      res.status(500).json({
        error: "Callback processing failed",
        message: error.message
      });
    }
  });
  app2.get("/api/moyasar/payments", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const branchId = req.query.branchId;
      const payments = await storage.getMoyasarPayments(restaurantId, branchId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.get("/api/tickets", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.query.userId;
      const status = req.query.status;
      const tickets = await storage.getSupportTickets(restaurantId, userId, status);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });
  app2.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      let ticket;
      if (accountType === "it") {
        ticket = await storage.getSupportTicketForIT(req.params.id);
      } else {
        const restaurantId = req.session.user.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.id, restaurantId);
      }
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });
  app2.post("/api/tickets", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const ticket = await storage.createSupportTicket({
        restaurantId,
        userId,
        subject: req.body.subject,
        category: req.body.category,
        priority: req.body.priority || "medium",
        description: req.body.description,
        status: "open"
      });
      const { sendTicketNotificationEmail: sendTicketNotificationEmail2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      sendTicketNotificationEmail2({
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        description: ticket.description,
        userId: ticket.userId,
        userName: req.body.userName,
        createdAt: ticket.createdAt.toISOString()
      }).catch((err) => {
        console.error("Failed to send email notification:", err);
      });
      broadcastNotification({
        type: "ticket:created",
        restaurantId,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        ticketStatus: ticket.status
      });
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });
  app2.patch("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      const { restaurantId: _, userId: __, ...safeData } = req.body;
      const restrictedStatuses = ["in-progress", "resolved", "closed"];
      if (safeData.status && restrictedStatuses.includes(safeData.status)) {
        if (accountType !== "it") {
          return res.status(403).json({
            error: "Only IT support can set ticket status to In Progress, Resolved, or Closed"
          });
        }
      }
      let updated;
      if (accountType === "it") {
        updated = await storage.updateSupportTicketForIT(req.params.id, safeData);
      } else {
        const restaurantId = req.session.user.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        updated = await storage.updateSupportTicket(req.params.id, restaurantId, safeData);
      }
      if (!updated) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      broadcastNotification({
        type: "ticket:updated",
        restaurantId: updated.restaurantId,
        ticketId: updated.id,
        ticketNumber: updated.ticketNumber,
        subject: updated.subject,
        category: updated.category,
        priority: updated.priority,
        ticketStatus: updated.status
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });
  app2.get("/api/tickets/:ticketId/messages", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      let ticket;
      let messages;
      if (accountType === "it") {
        ticket = await storage.getSupportTicketForIT(req.params.ticketId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        messages = await storage.getTicketMessagesForIT(req.params.ticketId);
      } else {
        const restaurantId = req.session.user.restaurantId;
        if (!restaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.ticketId, restaurantId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        messages = await storage.getTicketMessages(req.params.ticketId, restaurantId);
      }
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/tickets/:ticketId/messages", requireAuth, async (req, res) => {
    try {
      const accountType = req.session.accountType;
      const userId = req.session.user.id;
      let ticket;
      let restaurantId;
      if (accountType === "it") {
        ticket = await storage.getSupportTicketForIT(req.params.ticketId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        restaurantId = ticket.restaurantId;
      } else {
        const userRestaurantId = req.session.user.restaurantId;
        if (!userRestaurantId) {
          return res.status(403).json({ error: "This endpoint requires a restaurant account" });
        }
        ticket = await storage.getSupportTicket(req.params.ticketId, userRestaurantId);
        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }
        restaurantId = userRestaurantId;
      }
      const message = await storage.createTicketMessage({
        restaurantId,
        ticketId: req.params.ticketId,
        senderId: userId,
        senderName: req.body.senderName || "User",
        senderRole: req.body.senderRole || "employee",
        message: req.body.message,
        isRead: false
      });
      broadcastNotification({
        type: "ticket:message",
        restaurantId,
        ticketId: req.params.ticketId,
        ticketNumber: ticket.ticketNumber,
        ticketMessage: {
          id: message.id,
          ticketId: message.ticketId,
          senderId: message.senderId,
          senderName: message.senderName,
          senderRole: message.senderRole,
          message: message.message,
          createdAt: message.createdAt.toISOString()
        }
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });
  app2.get("/api/tickets/unread/count", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const userId = req.session.user.id;
      const count = await storage.getUnreadMessageCount(restaurantId, userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  app2.get("/api/employee-activities", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const employeeId = req.query.employeeId;
      const category = req.query.category;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const activities = await storage.getEmployeeActivities(restaurantId, employeeId, category, startDate, endDate);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });
  app2.get("/api/employee-activities/stats/:employeeId", requireAuth, requireRestaurant, async (req, res) => {
    try {
      const restaurantId = req.session.user.restaurantId;
      const stats = await storage.getEmployeeActivityStats(req.params.employeeId, restaurantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ error: "Failed to fetch activity stats" });
    }
  });
  app2.get("/api/it/analytics", requireAuth, requireITAccount, async (req, res) => {
    try {
      const analytics = await storage.getITAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching IT analytics:", error);
      res.status(500).json({ error: "Failed to fetch IT analytics" });
    }
  });
  app2.get("/api/it/staff", requireAuth, requireITAccount, async (req, res) => {
    try {
      const staff = await storage.getITStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching IT staff:", error);
      res.status(500).json({ error: "Failed to fetch IT staff" });
    }
  });
  app2.get("/api/it/workload", requireAuth, requireITAccount, async (req, res) => {
    try {
      const staff = await storage.getWorkloadDistribution();
      res.json({ staff });
    } catch (error) {
      console.error("Error fetching workload distribution:", error);
      res.status(500).json({ error: "Failed to fetch workload distribution" });
    }
  });
  app2.get("/api/it/category-breakdown", requireAuth, requireITAccount, async (req, res) => {
    try {
      const breakdown = await storage.getCategoryBreakdown();
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  });
  app2.get("/api/it/trends", requireAuth, requireITAccount, async (req, res) => {
    try {
      const trends = await storage.getTicketTrends();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching ticket trends:", error);
      res.status(500).json({ error: "Failed to fetch ticket trends" });
    }
  });
  app2.post("/api/it/assign", requireAuth, requireITAccount, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { ticketId, assignedTo } = req.body;
      if (!ticketId) {
        return res.status(400).json({ error: "ticketId is required" });
      }
      const ticket = await storage.assignTicket(ticketId, null, assignedTo, userId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });
  app2.get("/api/it/active-tickets", requireAuth, requireITAccount, async (req, res) => {
    try {
      const activeTickets = await storage.getAllActiveTicketsForIT();
      res.json(activeTickets);
    } catch (error) {
      console.error("Error fetching active tickets:", error);
      res.status(500).json({ error: "Failed to fetch active tickets" });
    }
  });
  app2.patch("/api/it/tickets/:id/assign", requireAuth, requireITAccount, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const ticketId = req.params.id;
      const { staffId } = req.body;
      const ticket = await storage.assignTicket(ticketId, null, staffId, userId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      broadcastNotification({
        type: "ticket:updated",
        restaurantId: ticket.restaurantId,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        ticketStatus: ticket.status
      });
      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });
  app2.get("/api/it/client-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      const clientAccounts = await storage.getClientAccountsActivity();
      res.json(clientAccounts);
    } catch (error) {
      console.error("Error fetching client accounts activity:", error);
      res.status(500).json({ error: "Failed to fetch client accounts activity" });
    }
  });
  app2.get("/api/it/performance", requireAuth, requireITAccount, async (req, res) => {
    try {
      const dateRange = req.query.dateRange;
      let startDate;
      let endDate = /* @__PURE__ */ new Date();
      if (dateRange) {
        const daysAgo = parseInt(dateRange, 10);
        startDate = /* @__PURE__ */ new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
      } else {
        startDate = /* @__PURE__ */ new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      const performanceData = await db.select({
        userId: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        restaurantId: restaurants.id,
        restaurantName: restaurants.name,
        businessType: restaurants.businessType,
        totalSales: sql4`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
        totalOrders: sql4`COUNT(${orders.id})`,
        lastActivityAt: sql4`MAX(${orders.createdAt})`
      }).from(users).innerJoin(orders, eq3(orders.createdBy, users.id)).innerJoin(restaurants, eq3(restaurants.id, users.restaurantId)).where(and3(
        eq3(users.active, true),
        gte2(orders.createdAt, startDate),
        lte2(orders.createdAt, endDate)
      )).groupBy(users.id, users.username, users.fullName, users.role, restaurants.id, restaurants.name, restaurants.businessType).orderBy(desc2(sql4`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`));
      const results = performanceData.map((row) => {
        const totalSales = parseFloat(row.totalSales || "0");
        const totalOrders = parseInt(row.totalOrders || "0", 10);
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        let lastActivityAtISO = null;
        if (row.lastActivityAt) {
          if (row.lastActivityAt instanceof Date) {
            lastActivityAtISO = row.lastActivityAt.toISOString();
          } else {
            lastActivityAtISO = new Date(row.lastActivityAt).toISOString();
          }
        }
        return {
          userId: row.userId || "",
          username: row.username || "N/A",
          fullName: row.fullName || "N/A",
          role: row.role || "employee",
          restaurantId: row.restaurantId || "",
          restaurantName: row.restaurantName || "N/A",
          businessType: row.businessType || "restaurant",
          totalSales: totalSales.toFixed(2),
          totalOrders,
          avgOrderValue: avgOrderValue.toFixed(2),
          lastActivityAt: lastActivityAtISO
        };
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching IT performance data:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });
  app2.get("/api/it/all-accounts", requireAuth, requireITAccount, async (req, res) => {
    try {
      const allAccounts = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        active: users.active,
        restaurantId: users.restaurantId,
        restaurantName: restaurants.name,
        businessType: restaurants.businessType,
        lastLoginAt: users.lastLoginAt,
        lastActivityAt: users.lastActivityAt,
        createdAt: users.createdAt
      }).from(users).leftJoin(restaurants, eq3(users.restaurantId, restaurants.id)).where(isNotNull2(users.restaurantId)).orderBy(desc2(users.lastActivityAt));
      res.json(allAccounts);
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });
  app2.get("/api/it/accounts/:id/password", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const [account] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password
      }).from(users).where(eq3(users.id, id));
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({
        id: account.id,
        username: account.username,
        hashedPassword: account.password,
        note: "This is the bcrypt-hashed password. Use the change password feature to set a new password."
      });
    } catch (error) {
      console.error("Error fetching account password:", error);
      res.status(500).json({ error: "Failed to fetch account password" });
    }
  });
  app2.patch("/api/it/accounts/:id/password", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      const [updatedUser] = await db.update(users).set({ password: hashedPassword }).where(eq3(users.id, id)).returning({ id: users.id, username: users.username });
      if (!updatedUser) {
        return res.status(404).json({ error: "Account not found" });
      }
      console.log(`[IT] Password changed for user ${updatedUser.username} by IT account`);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing account password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  app2.patch("/api/it/accounts/:id/status", requireAuth, requireITAccount, async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "Active status must be a boolean" });
      }
      const [updatedUser] = await db.update(users).set({ active }).where(eq3(users.id, id)).returning({ id: users.id, username: users.username, active: users.active });
      if (!updatedUser) {
        return res.status(404).json({ error: "Account not found" });
      }
      console.log(`[IT] Account ${updatedUser.username} ${active ? "enabled" : "disabled"} by IT account`);
      res.json({ success: true, user: updatedUser, message: `Account ${active ? "enabled" : "disabled"} successfully` });
    } catch (error) {
      console.error("Error updating account status:", error);
      res.status(500).json({ error: "Failed to update account status" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({
    noServer: true
    // We'll handle the upgrade ourselves to access session
  });
  wsClients = /* @__PURE__ */ new Set();
  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws/notifications") {
      sessionParser2(request, {}, () => {
        const session2 = request.session;
        if (!session2 || !session2.user) {
          console.log("[WebSocket] Upgrade rejected: No valid session");
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        const { restaurantId, id: userId } = session2.user;
        wss.handleUpgrade(request, socket, head, async (ws) => {
          let conversationIds = /* @__PURE__ */ new Set();
          try {
            const conversations2 = await storage.getConversations(restaurantId, userId);
            conversationIds = new Set(conversations2.map((c) => c.id));
          } catch (error) {
            console.error("[WebSocket] Failed to load conversations:", error);
          }
          const client = {
            socket: ws,
            restaurantId,
            userId,
            conversationIds
          };
          console.log(`[WebSocket] Client connected: user=${userId}, restaurant=${restaurantId}, conversations=${conversationIds.size}`);
          wsClients.add(client);
          ws.on("close", () => {
            console.log("[WebSocket] Client disconnected from notifications");
            wsClients?.delete(client);
          });
          ws.on("error", (error) => {
            console.error("[WebSocket] Error:", error);
            wsClients?.delete(client);
          });
          wss.emit("connection", ws, request);
        });
      });
    } else {
      socket.destroy();
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
var uploadsPath = path6.resolve(import.meta.dirname, "..", "public", "uploads");
if (!fs4.existsSync(uploadsPath)) {
  fs4.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express2.static(uploadsPath));
var PgStore = connectPgSimple(session);
app.set("trust proxy", 1);
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("\u26A0\uFE0F  WARNING: Using default SESSION_SECRET in production. Set SESSION_SECRET environment variable for security.");
}
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
var sessionParser = session({
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "resto-pos-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
});
app.use(sessionParser);
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app, sessionParser);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port2 = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port: port2,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port2}`);
  });
})();
export {
  sessionParser
};
