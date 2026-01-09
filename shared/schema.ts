import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { PermissionSet } from "./permissions";

// Restaurants (Multi-tenant isolation)
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nationalId: text("national_id").notNull(), // National ID or Company Name (10 digits)
  hasVatRegistration: boolean("has_vat_registration").notNull().default(true), // Whether client has VAT registration
  taxNumber: text("tax_number"), // Unified Tax Number (nullable - only required if hasVatRegistration is true)
  commercialRegistration: text("commercial_registration").notNull(), // Commercial Registration (10 digits)
  businessType: text("business_type").notNull().default("restaurant"), // "restaurant" or "factory"
  type: text("type").notNull(), // Business subtype (e.g., "Cloud Kitchen", "Restaurant", "Coffee Shop" for restaurant; "Manufacturing", "Production" for factory)
  subscriptionPlan: text("subscription_plan").notNull(), // "weekly", "monthly", "yearly"
  branchesCount: integer("branches_count").notNull().default(1),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"), // "inactive", "active", "cancelled", "expired"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
  cancellationReason: text("cancellation_reason"), // "mistake" or "client_request"
  setupComplete: boolean("setup_complete").notNull().default(false), // SECURITY: Prevents post-setup cross-tenant user creation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Explicit enum validation for businessType and subscriptionPlan to ensure type safety
export const insertRestaurantSchema = createInsertSchema(restaurants)
  .omit({ id: true, createdAt: true })
  .extend({
    businessType: z.enum(["restaurant", "factory"]),
    subscriptionPlan: z.enum(["weekly", "monthly", "yearly"]),
  });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

// Branches
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  phone: text("phone").notNull(),
  manager: text("manager").notNull(),
  staff: integer("staff").notNull().default(0),
  status: text("status").notNull().default("Active"),
});

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  referenceQuantity: decimal("reference_quantity", { precision: 10, scale: 2 }).notNull().default("1"), // Reference quantity for cost calculation (e.g., 1 kg)
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"), // Total price for the entire quantity in SAR
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0"), // Price per unit - stays fixed once entered
  supplier: text("supplier").notNull(),
  status: text("status").notNull().default("In Stock"),
  branchId: varchar("branch_id").references(() => branches.id),
  sortOrder: integer("sort_order").default(0),
  expirationDays: integer("expiration_days"), // Number of days until expiration from purchase date
  purchaseDate: timestamp("purchase_date").defaultNow(), // Date when item was added/purchased
}, (table) => ({
  restaurantIdx: index("inventory_items_restaurant_idx").on(table.restaurantId),
}));

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Recipes (must be defined before menuItems for foreign key reference)
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  prepTime: text("prep_time").notNull(),
  cookTime: text("cook_time").notNull(),
  servings: integer("servings").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  ingredients: jsonb("ingredients").notNull().$type<Array<{ inventoryItemId: string; name: string; quantity: number; unit: string; unitPrice: number }>>(),
  steps: jsonb("steps").notNull().$type<string[]>(),
  sortOrder: integer("sort_order").default(0),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Factory Products (for factory business type only)
export const factoryProducts = pgTable("factory_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  weight: text("weight"), // e.g., "10kg", "500g"
  length: text("length"), // e.g., "100cm", "5m"
  productType: text("product_type"), // Type of product (e.g., "Steel", "Wood", "Plastic")
  colour: text("colour"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  thickness: text("thickness"), // e.g., "2mm", "5cm"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // VAT-inclusive price (15% Saudi VAT)
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // VAT amount (15%)
  description: text("description"),
  available: boolean("available").notNull().default(true),
  imageUrl: text("image_url"),
});

export const insertFactoryProductSchema = createInsertSchema(factoryProducts).omit({ id: true });
export type InsertFactoryProduct = z.infer<typeof insertFactoryProductSchema>;
export type FactoryProduct = typeof factoryProducts.$inferSelect;

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  recipeId: varchar("recipe_id").references(() => recipes.id), // Optional: menu item can have a recipe
  inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id), // Optional: for simple items without recipes
  portionSize: decimal("portion_size", { precision: 5, scale: 2 }).default("1.00"), // Multiplier for recipe (1.0=whole, 0.5=half, 0.25=quarter)
  stockNo: decimal("stock_no", { precision: 10, scale: 2 }), // Quantity per item when inventoryItemId is set
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // VAT-inclusive price (15% Saudi VAT)
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // VAT amount (15%)
  discount: decimal("discount", { precision: 5, scale: 2 }).notNull().default("0"), // Discount percentage (0-100)
  description: text("description"),
  available: boolean("available").notNull().default(true),
  imageUrl: text("image_url"),
  displaySize: text("display_size").notNull().default("medium"), // Display size in POS/Menu: small, medium, large
});

// Base menu item schema (before refinements) - reusable for insert and update
const baseMenuItemSchema = createInsertSchema(menuItems)
  .omit({ id: true })
  .extend({
    recipeId: z.string().nullable().optional(), // Allow null to clear recipe
    inventoryItemId: z.string().nullable().optional(), // Allow null, for simple items
    portionSize: z.string().nullable().optional(), // Portion multiplier (1.0, 0.5, 0.25) - nullable when no recipe
    stockNo: z.string().nullable().optional(), // Stock quantity per item (nullable)
    displaySize: z.enum(["small", "medium", "large"]).optional().default("medium"), // Display size for POS grid
  });

// Insert schema with full validations
export const insertMenuItemSchema = baseMenuItemSchema
  .refine(
    (data) => {
      const discount = parseFloat(data.discount || "0");
      return discount >= 0 && discount <= 100;
    },
    { message: "Discount must be between 0 and 100" }
  )
  .refine(
    (data) => {
      // If stockNo is provided, it must be a valid positive number
      if (data.stockNo && data.stockNo.trim() !== "") {
        const stockNum = parseFloat(data.stockNo);
        return !isNaN(stockNum) && stockNum > 0;
      }
      return true;
    },
    { message: "Stock quantity must be a positive number", path: ["stockNo"] }
  );

// Update schema - partial with update-safe validations
export const updateMenuItemSchema = baseMenuItemSchema.partial().superRefine((data, ctx) => {
  // Only validate discount if it's being updated
  if (data.discount !== undefined) {
    const discount = parseFloat(data.discount || "0");
    if (discount < 0 || discount > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount must be between 0 and 100",
        path: ["discount"],
      });
    }
  }
  
  // If stockNo is provided during update, validate it's a positive number
  if (data.stockNo !== undefined && data.stockNo !== null && data.stockNo.trim() !== "") {
    const stockNum = parseFloat(data.stockNo);
    if (isNaN(stockNum) || stockNum <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stock quantity must be a positive number",
        path: ["stockNo"],
      });
    }
  }
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type UpdateMenuItem = z.infer<typeof updateMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Menu Categories (custom categories that persist across sessions)
export const menuCategories = pgTable("menu_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({ id: true });
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuCategory = typeof menuCategories.$inferSelect;

// Add-ons
export const addons = pgTable("addons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., "Toppings", "Sides", "Sauces", "Extras"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // VAT-inclusive price
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // VAT amount (15%)
  menuItemIds: varchar("menu_item_ids").array(), // Optional: link to multiple menu items (null means "All items")
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }), // Optional: link to inventory item for stock tracking
});

export const insertAddonSchema = createInsertSchema(addons)
  .omit({ id: true })
  .extend({
    menuItemIds: z.array(z.string()).nullable().optional(),
    inventoryItemId: z.string().nullable().optional(),
  });
export type InsertAddon = z.infer<typeof insertAddonSchema>;
export type Addon = typeof addons.$inferSelect;

// Orders
export const orders = pgTable("orders", {
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
  earningsDecreaseApplied: boolean("earnings_decrease_applied").notNull().default(false), // Track if 2 SAR decrease applied
  items: jsonb("items").notNull().$type<Array<{ id: string; name: string; quantity: number; price: number; addons?: Array<{ id: string; name: string; price: number }> }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  paymentStatus: text("payment_status").default("Unpaid"), // Track payment status separately: Unpaid, Paid, Refunded
  moyasarPaymentId: text("moyasar_payment_id"), // Link to Moyasar payment if applicable
  status: text("status").notNull().default("Pending"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }), // Nullable: tracks which user created the order
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  restaurantCreatedAtIdx: index("orders_restaurant_created_at_idx").on(table.restaurantId, table.createdAt),
  restaurantStatusIdx: index("orders_restaurant_status_idx").on(table.restaurantId, table.status),
}));

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Inventory Transactions (audit trail for all inventory movements) - Must be after orders
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id), // Optional: links to orders table
  type: text("type").notNull(), // "sale", "procurement", "adjustment", "wastage"
  quantityChange: decimal("quantity_change", { precision: 10, scale: 2 }).notNull(), // Negative for deductions, positive for additions
  quantityBefore: decimal("quantity_before", { precision: 10, scale: 2 }).notNull(),
  quantityAfter: decimal("quantity_after", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"), // Additional details (e.g., "Sold in Order ORD-123", "Procurement PO-456")
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  restaurantInventoryIdx: index("inv_trans_restaurant_inventory_idx").on(table.restaurantId, table.inventoryItemId),
  restaurantCreatedAtIdx: index("inv_trans_restaurant_created_at_idx").on(table.restaurantId, table.createdAt),
}));

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({ id: true, createdAt: true });
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// Transactions (Sales)
export const transactions = pgTable("transactions", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  restaurantCreatedAtIdx: index("transactions_restaurant_created_at_idx").on(table.restaurantId, table.createdAt),
  restaurantOrderIdx: index("transactions_restaurant_order_idx").on(table.restaurantId, table.orderId),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Moyasar Payments (Payment Gateway Integration)
export const moyasarPayments = pgTable("moyasar_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  moyasarId: text("moyasar_id").notNull().unique(), // Moyasar payment ID from their API
  orderId: varchar("order_id").references(() => orders.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount in SAR
  amountHalalas: integer("amount_halalas").notNull(), // Amount in halalas (1 SAR = 100 halalas)
  currency: text("currency").notNull().default("SAR"),
  status: text("status").notNull(), // "initiated", "paid", "failed", "refunded", "authorized"
  paymentMethod: text("payment_method"), // "creditcard", "mada", "applepay", "stcpay"
  cardBrand: text("card_brand"), // "visa", "mastercard", "mada", etc.
  cardLast4: text("card_last4"), // Last 4 digits of card
  fee: decimal("fee", { precision: 10, scale: 2 }), // Moyasar transaction fee
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  callbackUrl: text("callback_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional data
  errorMessage: text("error_message"), // Error details if payment failed
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMoyasarPaymentSchema = createInsertSchema(moyasarPayments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertMoyasarPayment = z.infer<typeof insertMoyasarPaymentSchema>;
export type MoyasarPayment = typeof moyasarPayments.$inferSelect;

// Settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull().unique(), // One settings per restaurant
  restaurantName: text("restaurant_name").notNull(),
  vatNumber: text("vat_number").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  language: text("language").notNull().default("English"),
  openingTime: text("opening_time"),
  closingTime: text("closing_time"),
  // Shift 2 fields - require db:push on AWS server to enable
  // openingTime2: text("opening_time_2"),
  // closingTime2: text("closing_time_2"),
  logoPath: text("logo_path"), // Path to uploaded logo for invoices (e.g., "uploads/logos/abc123.png")
  notificationTone: text("notification_tone").notNull().default("tone1"), // Admin-selected notification tone (tone1-tone15)
  // Weekly schedule with per-day shift configuration
  weeklySchedule: jsonb("weekly_schedule").$type<{
    sunday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    monday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    tuesday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    wednesday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    thursday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    friday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
    saturday: { enabled: boolean; shift1: { open: string; close: string }; shift2: { enabled: boolean; open: string; close: string } };
  }>(),
  chatNotificationDefaults: jsonb("chat_notification_defaults").$type<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
    notifyScope: 'all' | 'mentions' | 'direct'; // all messages, @mentions only, or direct messages only
    quietHours?: {
      enabled: boolean;
      start: string; // "22:00" format
      end: string; // "08:00" format
      timezone: string; // "Asia/Riyadh"
    };
  }>(),
  b2bInvoiceSequence: integer("b2b_invoice_sequence").notNull().default(0), // Separate sequence counter for B2B (Standard) invoices
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Procurement
export const procurement = pgTable("procurement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  type: text("type").notNull(), // "inventory", "maintenance", "installation", "equipment"
  title: text("title").notNull(),
  description: text("description"),
  supplier: text("supplier"),
  category: text("category"),
  quantity: integer("quantity"),
  unitPrice: text("unit_price"),
  totalCost: text("total_cost").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "ordered", "received", "completed", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  branchId: varchar("branch_id"),
  orderDate: timestamp("order_date"),
  expectedDelivery: timestamp("expected_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  notes: text("notes"),
  invoiceImage: text("invoice_image"), // Path to uploaded invoice image
  billId: varchar("bill_id"), // Link to shop_bills for cost tracking sync
  inventoryItemId: varchar("inventory_item_id"), // Link to auto-created inventory item (for type="inventory")
  originalProcurementId: varchar("original_procurement_id"), // Link to original procurement for reorders
  unit: text("unit"), // Unit of measurement (kg, g, l, ml, pcs)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProcurementSchema = createInsertSchema(procurement).omit({ id: true, createdAt: true, updatedAt: true, billId: true });
// Note: inventoryItemId and originalProcurementId are now allowed in insert to enable reorder linking
export type InsertProcurement = z.infer<typeof insertProcurementSchema>;
export type Procurement = typeof procurement.$inferSelect;

// Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id), // Links user to their restaurant (null for IT accounts)
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed password
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("employee"), // "admin" or "employee"
  permissions: jsonb("permissions").notNull().$type<PermissionSet>(),
  branchId: varchar("branch_id").references(() => branches.id), // Default branch for this user
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  devicePreference: text("device_preference").default("laptop"), // "laptop", "ipad", or "iphone"
  active: boolean("active").notNull().default(true),
  
  // Recruitment Data
  employeeNumber: text("employee_number"),
  hireDate: timestamp("hire_date"),
  recruitmentSource: text("recruitment_source"), // "referral", "job_board", "agency", "walk_in", "other"
  probationEndDate: timestamp("probation_end_date"),
  contractType: text("contract_type"), // "full_time", "part_time", "contract", "temporary"
  
  // Vacation Days Tracking
  vacationDaysTotal: integer("vacation_days_total").default(0),
  vacationDaysUsed: integer("vacation_days_used").default(0),
  
  // Visa Information
  visaNumber: text("visa_number"),
  visaFees: decimal("visa_fees", { precision: 10, scale: 2 }),
  visaExpiryDate: timestamp("visa_expiry_date"),
  visaStatus: text("visa_status"), // "valid", "expired", "pending", "not_applicable"
  
  // Ticket Information
  ticketAmount: decimal("ticket_amount", { precision: 10, scale: 2 }),
  ticketDestination: text("ticket_destination"),
  ticketDate: timestamp("ticket_date"),
  ticketStatus: text("ticket_status"), // "pending", "booked", "used", "not_applicable"
  
  // Performance Tracking
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }), // 0.00 to 5.00
  lastReviewDate: timestamp("last_review_date"),
  performanceNotes: text("performance_notes"),
  
  // Salary Information
  salary: decimal("salary", { precision: 10, scale: 2 }), // Monthly salary amount
  position: text("position"), // Job position/title
  
  // Compliance
  documents: jsonb("documents").$type<Array<{
    name: string;
    type: string; // "iqama", "passport", "contract", "medical", "other"
    expiryDate: string | null;
    status: string; // "valid", "expired", "pending"
  }>>(),
  certifications: text("certifications").array(),
  trainingCompleted: text("training_completed").array(),
  
  // Weekly Schedule (days off tracking)
  weeklySchedule: jsonb("weekly_schedule").$type<{
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
  }>(),
  
  // Chat notification settings (user-level overrides for restaurant defaults)
  chatNotificationSettings: jsonb("chat_notification_settings").$type<{
    notificationsEnabled?: boolean; // Override restaurant default
    soundEnabled?: boolean; // Override restaurant default
    toneId?: string; // Override restaurant default
    notifyScope?: 'all' | 'mentions' | 'direct'; // Override restaurant default
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  }>(),
  
  // Activity Tracking (for IT Dashboard real-time monitoring)
  lastActivityAt: timestamp("last_activity_at"), // Last API request timestamp
  lastLoginAt: timestamp("last_login_at"), // Last successful login timestamp
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
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
  vacationDaysUsed: z.union([z.string().transform((val) => val ? parseInt(val) : 0), z.number()]).optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Invoices (ZATCA-compliant)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceType: text("invoice_type").notNull().default("simplified"), // "standard" (B2B), "simplified" (B2C)
  transactionId: varchar("transaction_id").references(() => transactions.id),
  orderId: varchar("order_id").references(() => orders.id),
  procurementId: varchar("procurement_id"), // Link to procurement for reorder invoices
  branchId: varchar("branch_id").references(() => branches.id),
  customerName: text("customer_name"),
  customerVatNumber: text("customer_vat_number"), // VAT number for B2B invoices
  items: jsonb("items").notNull().$type<Array<{ name: string; quantity: number; basePrice: number; vatAmount: number; total: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  qrCode: text("qr_code"), // Base64 encoded QR code
  pdfPath: text("pdf_path"), // Path to generated PDF
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  restaurantCreatedAtIdx: index("invoices_restaurant_created_at_idx").on(table.restaurantId, table.createdAt),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Shop Salaries
export const salaries = pgTable("salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  employeeName: text("employee_name").notNull(),
  position: text("position").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "paid"
  notes: text("notes"),
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSalarySchema = createInsertSchema(salaries).omit({ id: true, createdAt: true });
export type InsertSalary = z.infer<typeof insertSalarySchema>;
export type Salary = typeof salaries.$inferSelect;

// Shop Bills
export const shopBills = pgTable("shop_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  billType: text("bill_type").notNull(), // "rent", "electricity", "water", "gas", "internet", "maintenance", "foundational", "salary", "other"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentPeriod: text("payment_period").notNull().default("monthly"), // "one-time", "weekly", "monthly", "quarterly", "semi-annually", "yearly"
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue"
  description: text("description"),
  employeeId: varchar("employee_id").references(() => users.id), // Links bill to employee for salary bills
  employeeName: text("employee_name"), // Cached employee name for salary bills
  paymentMonth: text("payment_month"), // Format: "YYYY-MM" for tracking salary payment months
  archived: boolean("archived").notNull().default(false), // For archiving old bills
  invoiceImage: text("invoice_image"), // Path to uploaded invoice image/PDF
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  restaurantStatusIdx: index("shop_bills_restaurant_status_idx").on(table.restaurantId, table.status),
}));

export const insertShopBillSchema = createInsertSchema(shopBills).omit({ id: true, createdAt: true });
export type InsertShopBill = z.infer<typeof insertShopBillSchema>;
export type ShopBill = typeof shopBills.$inferSelect;

// Delivery Apps
export const deliveryApps = pgTable("delivery_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(), // Manually entered delivery app name (e.g., "HungerStation", "Jahez", "Mrsool")
  commission: decimal("commission", { precision: 5, scale: 2 }).notNull(), // VAT-inclusive commission percentage (e.g., 20.00 for 20%)
  bankingFees: decimal("banking_fees", { precision: 5, scale: 2 }).notNull(), // VAT-inclusive banking fees percentage (e.g., 2.50 for 2.5%)
  markUp: decimal("mark_up", { precision: 5, scale: 2 }).notNull().default("0"), // Price mark-up percentage for delivery (e.g., 30.00 for 30%)
  subsidyTiers: jsonb("subsidy_tiers").notNull().default(sql`'[]'`).$type<Array<{ minAmount: number; maxAmount: number | null; subsidy: number }>>(), // Tiered subsidy: array of {minAmount: min order, maxAmount: max order (null = unlimited), subsidy: subsidy in SAR}, max 3 tiers
  posFees: decimal("pos_fees", { precision: 10, scale: 2 }).notNull().default("0"), // VAT-inclusive POS fees amount in SAR
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const subsidyTierSchema = z.object({
  minAmount: z.number().min(0, "Minimum amount must be 0 or higher"),
  maxAmount: z.number().nullable(),
  subsidy: z.number().min(0, "Subsidy must be 0 or higher"),
}).refine(
  (data) => data.maxAmount === null || data.maxAmount > data.minAmount,
  {
    message: "Maximum amount must be greater than minimum amount",
    path: ["maxAmount"],
  }
);

export const insertDeliveryAppSchema = createInsertSchema(deliveryApps)
  .omit({ id: true, createdAt: true })
  .extend({
    subsidyTiers: z.array(subsidyTierSchema),
  });
export type InsertDeliveryApp = z.infer<typeof insertDeliveryAppSchema>;
export type DeliveryApp = typeof deliveryApps.$inferSelect;

// Delivery Profitability - Manual entries for tracking delivery app financial performance
export const deliveryProfitability = pgTable("delivery_profitability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  deliveryAppId: varchar("delivery_app_id").references(() => deliveryApps.id, { onDelete: "cascade" }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  orders: integer("orders").notNull().default(0),
  sales: decimal("sales", { precision: 12, scale: 2 }).notNull().default("0"),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull().default("0"),
  banking: decimal("banking", { precision: 12, scale: 2 }).notNull().default("0"),
  subsidy: decimal("subsidy", { precision: 12, scale: 2 }).notNull().default("0"),
  vat: decimal("vat", { precision: 12, scale: 2 }).notNull().default("0"), // VAT amount
  posFees: decimal("pos_fees", { precision: 12, scale: 2 }).notNull().default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull().default("0"), // Net profit after all deductions
  netEarnings: decimal("net_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  restaurantDeliveryAppIdx: index("delivery_profitability_restaurant_app_idx").on(table.restaurantId, table.deliveryAppId),
}));

export const insertDeliveryProfitabilitySchema = createInsertSchema(deliveryProfitability)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeliveryProfitability = z.infer<typeof insertDeliveryProfitabilitySchema>;
export type DeliveryProfitability = typeof deliveryProfitability.$inferSelect;

// Investors
export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  nationalId: text("national_id"), // National ID or Iqama number
  contactNumber: text("contact_number"), // Phone number with +966 prefix
  investorType: text("investor_type").notNull().default("money"), // "money" for cash investor, "recipe" for recipe owner
  recipeId: varchar("recipe_id").references(() => recipes.id), // Only used when investorType is "recipe"
  amountInvested: decimal("amount_invested", { precision: 12, scale: 2 }).notNull(), // Amount invested in SAR (0 for recipe owners)
  interestPercentage: decimal("interest_percentage", { precision: 5, scale: 2 }).notNull(), // Percentage of net profit (e.g., 10.00 for 10%)
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  documentPath: text("document_path"), // Path to uploaded PDF document
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const baseInvestorSchema = createInsertSchema(investors)
  .omit({ id: true, createdAt: true })
  .extend({
    investorType: z.enum(["money", "recipe"]),
  });

export const insertInvestorSchema = baseInvestorSchema
  .refine(
    (data) => {
      const percentage = parseFloat(data.interestPercentage || "0");
      return percentage >= 0 && percentage <= 100;
    },
    { message: "Interest percentage must be between 0 and 100" }
  )
  .refine(
    (data) => {
      if (data.investorType === "recipe") {
        return data.recipeId != null && data.recipeId.trim() !== "";
      }
      return true;
    },
    { message: "Recipe ID is required for recipe investors", path: ["recipeId"] }
  )
  .refine(
    (data) => {
      if (data.investorType === "money") {
        const amount = parseFloat(data.amountInvested || "0");
        return amount > 0;
      }
      return true;
    },
    { message: "Amount invested must be a positive number for money investors", path: ["amountInvested"] }
  );

export const updateInvestorSchema = baseInvestorSchema.partial().superRefine((data, ctx) => {
  if (data.interestPercentage !== undefined) {
    const percentage = parseFloat(data.interestPercentage || "0");
    if (percentage < 0 || percentage > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Interest percentage must be between 0 and 100",
        path: ["interestPercentage"],
      });
    }
  }
  
  if (data.investorType === "recipe") {
    if (data.recipeId === undefined || data.recipeId === null || data.recipeId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipe ID is required when setting investor type to recipe",
        path: ["recipeId"],
      });
    }
  }
  
  if (data.investorType === "money") {
    if (data.amountInvested !== undefined) {
      const amount = parseFloat(data.amountInvested || "0");
      if (amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Amount invested must be a positive number for money investors",
          path: ["amountInvested"],
        });
      }
    }
  }
});

export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type UpdateInvestor = z.infer<typeof updateInvestorSchema>;
export type Investor = typeof investors.$inferSelect;

// Subscription Invoices
// Note: These are generated AFTER successful payment (post-transaction receipts)
// All records in this table represent completed payments - no status field needed
export const subscriptionInvoices = pgTable("subscription_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  serialNumber: text("serial_number").notNull().unique(), // Format: 0001-YYYYMMDD-HHMMSS
  subscriptionPlan: text("subscription_plan").notNull(), // weekly, monthly, yearly
  branchesCount: integer("branches_count").notNull(),
  basePlanPrice: decimal("base_plan_price", { precision: 10, scale: 2 }).notNull(), // Base price without VAT
  additionalBranchesPrice: decimal("additional_branches_price", { precision: 10, scale: 2 }).notNull(), // Extra branches price without VAT
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Base + additional branches (before VAT)
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // 15% VAT
  total: decimal("total", { precision: 10, scale: 2 }).notNull(), // Final amount with VAT
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  pdfPath: text("pdf_path"), // Path to generated PDF invoice
  qrCode: text("qr_code"), // QR code data URL for ZATCA compliance
});

export const insertSubscriptionInvoiceSchema = createInsertSchema(subscriptionInvoices).omit({ id: true, invoiceDate: true });
export type InsertSubscriptionInvoice = z.infer<typeof insertSubscriptionInvoiceSchema>;
export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;

// Refund Clearance Invoices (for cancelled subscriptions)
export const refundInvoices = pgTable("refund_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  serialNumber: text("serial_number").notNull().unique(), // Format: RC-YYYY-XXXXXX
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  subscriptionPlan: text("subscription_plan").notNull(),
  subscriptionStartDate: timestamp("subscription_start_date").notNull(),
  cancellationDate: timestamp("cancellation_date").notNull(),
  monthsUsed: integer("months_used").notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }).notNull(),
  chargedAmount: decimal("charged_amount", { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  pdfData: text("pdf_data"), // Base64 encoded PDF data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRefundInvoiceSchema = createInsertSchema(refundInvoices).omit({ id: true, createdAt: true });
export type InsertRefundInvoice = z.infer<typeof insertRefundInvoiceSchema>;
export type RefundInvoice = typeof refundInvoices.$inferSelect;

// Monthly VAT Reports
export const monthlyVatReports = pgTable("monthly_vat_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  reportMonth: integer("report_month").notNull(), // 1-12
  reportYear: integer("report_year").notNull(), // e.g., 2025
  serialNumber: text("serial_number").notNull().unique(), // Format: VAT-YYYY-MM-XXXX
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).notNull().default("0"), // Total sales (including VAT)
  totalSalesBaseAmount: decimal("total_sales_base_amount", { precision: 12, scale: 2 }).notNull().default("0"), // Sales before VAT
  totalSalesVat: decimal("total_sales_vat", { precision: 12, scale: 2 }).notNull().default("0"), // Sales VAT (15%)
  totalPurchases: decimal("total_purchases", { precision: 12, scale: 2 }).notNull().default("0"), // Total purchases/costs (including VAT)
  totalPurchasesBaseAmount: decimal("total_purchases_base_amount", { precision: 12, scale: 2 }).notNull().default("0"), // Purchases before VAT
  totalPurchasesVat: decimal("total_purchases_vat", { precision: 12, scale: 2 }).notNull().default("0"), // Purchases VAT (15%)
  netVatPayable: decimal("net_vat_payable", { precision: 12, scale: 2 }).notNull().default("0"), // Sales VAT - Purchases VAT
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  pdfPath: text("pdf_path"), // Path to generated PDF report
  qrCode: text("qr_code"), // QR code data URL for ZATCA compliance
});

export const insertMonthlyVatReportSchema = createInsertSchema(monthlyVatReports).omit({ id: true, generatedAt: true });
export type InsertMonthlyVatReport = z.infer<typeof insertMonthlyVatReportSchema>;
export type MonthlyVatReport = typeof monthlyVatReports.$inferSelect;

// Support Tickets (IT Help System)
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  ticketNumber: text("ticket_number").notNull().unique(), // Format: TKT-YYYYMMDD-XXXX
  subject: text("subject").notNull(),
  category: text("category").notNull(), // 'technical', 'billing', 'feature_request', 'bug_report', 'other'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  assignedToIt: boolean("assigned_to_it").notNull().default(true), // Always assign to IT by default
  assignedTo: varchar("assigned_to").references(() => users.id), // IT staff member assigned to this ticket
  assignedBy: varchar("assigned_by").references(() => users.id), // Who made the assignment
  assignedAt: timestamp("assigned_at"), // When the ticket was assigned
}, (table) => ({
  restaurantStatusIdx: index("support_tickets_restaurant_status_idx").on(table.restaurantId, table.status),
}));

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ 
  id: true, 
  ticketNumber: true, 
  createdAt: true, 
  updatedAt: true, 
  resolvedAt: true, 
  closedAt: true,
  assignedAt: true
});
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// Ticket Messages (Chat between user and IT)
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  senderName: text("sender_name").notNull(), // Store name for display
  senderRole: text("sender_role").notNull(), // 'user' or 'it_support'
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"), // Optional file attachment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;

// Employee Activity Log (Track all actions by sub-accounts)
export const employeeActivityLog = pgTable("employee_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  employeeId: varchar("employee_id").notNull().references(() => users.id),
  employeeName: text("employee_name").notNull(), // Store for quick display
  action: text("action").notNull(), // e.g., 'created_order', 'updated_inventory', 'modified_menu_item', etc.
  actionCategory: text("action_category").notNull(), // 'orders', 'inventory', 'menu', 'customers', 'settings', etc.
  description: text("description").notNull(), // Human-readable description
  entityType: text("entity_type"), // e.g., 'order', 'inventory_item', 'menu_item'
  entityId: text("entity_id"), // ID of the affected entity
  previousData: jsonb("previous_data").$type<Record<string, any>>(), // Before state (for updates/deletes)
  newData: jsonb("new_data").$type<Record<string, any>>(), // After state (for creates/updates)
  ipAddress: text("ip_address"),
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmployeeActivityLogSchema = createInsertSchema(employeeActivityLog).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertEmployeeActivityLog = z.infer<typeof insertEmployeeActivityLogSchema>;
export type EmployeeActivityLog = typeof employeeActivityLog.$inferSelect;

// Bootstrap Reset Tokens (One-time emergency admin password reset)
export const bootstrapResetTokens = pgTable("bootstrap_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenHash: text("token_hash").notNull(), // Bcrypt hash of the reset token
  consumed: boolean("consumed").notNull().default(false), // One-time use flag
  consumedAt: timestamp("consumed_at"),
  consumedBy: text("consumed_by"), // Username of admin that was reset
  ipAddress: text("ip_address"), // IP that consumed the token
  expiresAt: timestamp("expires_at").notNull(), // Token expiration time (15-30 minutes recommended)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBootstrapResetTokenSchema = createInsertSchema(bootstrapResetTokens).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertBootstrapResetToken = z.infer<typeof insertBootstrapResetTokenSchema>;
export type BootstrapResetToken = typeof bootstrapResetTokens.$inferSelect;

// Team Chat - Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "direct" | "channel"
  name: text("name"), // null for DMs, required for channels (e.g., "#general", "#kitchen")
  scope: text("scope").notNull(), // "branch" | "restaurant"
  branchId: varchar("branch_id").references(() => branches.id, { onDelete: "cascade" }), // null if scope="restaurant"
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  participantHash: text("participant_hash"), // Computed hash of sorted participant IDs for DM deduplication (null for channels)
  lastMessageAt: timestamp("last_message_at"), // Denormalized for fast sorting
  lastMessagePreview: text("last_message_preview"), // Denormalized for quick display
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations)
  .omit({ id: true, createdAt: true, lastMessageAt: true, lastMessagePreview: true, participantHash: true })
  .extend({
    type: z.enum(["direct", "channel"]),
    scope: z.enum(["branch", "restaurant"]),
  })
  .refine(
    (data) => data.type === "channel" ? !!data.name : true,
    { message: "Channel conversations must have a name" }
  )
  .refine(
    (data) => data.scope === "branch" ? !!data.branchId : true,
    { message: "Branch-scoped conversations must have a branchId" }
  );

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Team Chat - Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }),
  senderName: text("sender_name").notNull(), // Denormalized for display even if user deleted
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Chat conversation preferences (per-user, per-conversation settings)
export const chatConversationPreferences = pgTable("chat_conversation_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  isMuted: boolean("is_muted").notNull().default(false), // Mute notifications for this conversation
  priority: text("priority").default("normal"), // "high", "normal", "low" - future use for smart notifications
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatConversationPreferenceSchema = createInsertSchema(chatConversationPreferences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertChatConversationPreference = z.infer<typeof insertChatConversationPreferenceSchema>;
export type ChatConversationPreference = typeof chatConversationPreferences.$inferSelect;

// Team Chat - Conversation Members (Junction table)
export const conversationMembers = pgTable("conversation_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({ 
  id: true, 
  joinedAt: true 
});
export type InsertConversationMember = z.infer<typeof insertConversationMemberSchema>;
export type ConversationMember = typeof conversationMembers.$inferSelect;

// Team Chat - Message Reads (Track what each user has read)
export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }).notNull(),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastReadMessageId: varchar("last_read_message_id").references(() => chatMessages.id, { onDelete: "set null" }),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
});

export const insertMessageReadSchema = createInsertSchema(messageReads).omit({ 
  id: true 
});
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;
export type MessageRead = typeof messageReads.$inferSelect;

// Licenses (for both restaurant and factory accounts)
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  licenseType: text("license_type").notNull(), // trade, health, fire_safety, municipal, vat, custom
  licenseNumber: text("license_number").notNull(),
  licenseName: text("license_name").notNull(),
  issuingAuthority: text("issuing_authority").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").default("active"), // active, expired, pending_renewal, suspended
  renewalReminderDays: integer("renewal_reminder_days").default(30),
  fee: decimal("fee", { precision: 10, scale: 2 }), // License fee/cost amount
  documentUrl: text("document_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertLicenseSchema = createInsertSchema(licenses)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    licenseType: z.enum(["trade", "health", "fire_safety", "municipal", "vat", "food_safety", "environmental", "labor", "custom"]),
    status: z.enum(["active", "expired", "pending_renewal", "suspended"]).optional().default("active"),
    issueDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]),
    expiryDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]),
  });
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

// Company Bills - Kinzhal LTD Co. (BSS Provider) internal expenses
export const companyBills = pgTable("company_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billType: text("bill_type").notNull(), // "salaries", "rent", "utilities", "software", "marketing", "equipment", "internet", "maintenance", "legal", "insurance", "other"
  vendor: text("vendor").notNull(), // Vendor/Supplier name
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull().default("0"), // VAT amount (15%)
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Total with VAT
  billDate: timestamp("bill_date").notNull(), // Date of the bill
  dueDate: timestamp("due_date"), // Payment due date
  paidDate: timestamp("paid_date"), // When it was paid
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue"
  paymentPeriod: text("payment_period").notNull().default("monthly"), // "one-time", "weekly", "monthly", "quarterly", "yearly"
  description: text("description"),
  referenceNumber: text("reference_number"), // Invoice/Reference number from vendor
  attachmentPath: text("attachment_path"), // Path to uploaded bill document
  createdBy: varchar("created_by").references(() => users.id).notNull(), // IT user who created the bill
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyBillSchema = createInsertSchema(companyBills)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    billType: z.enum(["salaries", "rent", "utilities", "software", "marketing", "equipment", "internet", "maintenance", "legal", "insurance", "other"]),
    status: z.enum(["pending", "paid", "overdue"]).optional().default("pending"),
    paymentPeriod: z.enum(["one-time", "weekly", "monthly", "quarterly", "yearly"]).optional().default("monthly"),
    billDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]),
    dueDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]).optional().nullable(),
    paidDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]).optional().nullable(),
  });
export type InsertCompanyBill = z.infer<typeof insertCompanyBillSchema>;
export type CompanyBill = typeof companyBills.$inferSelect;

// Business Info - Kinzhal LTD Co. (BSS Provider) company details for invoices
export const businessInfo = pgTable("business_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyNameEn: text("company_name_en").notNull().default("BlindSpot System (BSS)"), // English company name
  companyNameAr: text("company_name_ar").notNull().default("نظام بلايند سبوت"), // Arabic company name
  vatNumber: text("vat_number").notNull().default(""), // VAT Registration Number (15 digits)
  crNumber: text("cr_number").notNull().default(""), // Commercial Registration Number
  nationalId: text("national_id").notNull().default(""), // National ID / Unified Number
  email: text("email").notNull().default("IT@kinbss.com"),
  phone: text("phone").notNull().default(""),
  website: text("website").notNull().default(""),
  addressEn: text("address_en").notNull().default("Saudi Arabia"),
  addressAr: text("address_ar").notNull().default("المملكة العربية السعودية"),
  city: text("city").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankAccountName: text("bank_account_name").notNull().default(""),
  bankAccountNumber: text("bank_account_number").notNull().default(""),
  bankIban: text("bank_iban").notNull().default(""),
  logoUrl: text("logo_url"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBusinessInfoSchema = createInsertSchema(businessInfo)
  .omit({ id: true, updatedAt: true });
export type InsertBusinessInfo = z.infer<typeof insertBusinessInfoSchema>;
export type BusinessInfo = typeof businessInfo.$inferSelect;

// BEP (Break-Even Point) Analytics Metrics - not a table, just a type for API responses
export type BepMetrics = {
  fixedCosts: number;
  fixedCostsBreakdown: Array<{ category: string; amount: number }>;
  cogsTotal: number;
  revenue: number;
  unitsSold: number;
  avgSellingPrice: number;
  avgVariableCostPerUnit: number;
  contributionMarginPerUnit: number;
  contributionMarginRatio: number;
  bepUnits: number;
  bepRevenue: number;
  marginOfSafety: number;
  isProfitable: boolean;
};

// Violations - Client store violations from authorities
export const violations = pgTable("violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
  title: text("title").notNull(),
  description: text("description"),
  authority: text("authority").notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  violationDate: timestamp("violation_date").notNull(),
  resolvedDate: timestamp("resolved_date"),
  documentPath: text("document_path"),
  linkedBillId: varchar("linked_bill_id").references(() => shopBills.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertViolationSchema = createInsertSchema(violations)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    authority: z.enum(["municipality", "zatca", "police", "ministry_of_commerce"]),
    status: z.enum(["pending", "paid", "disputed"]).optional().default("pending"),
    violationDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]),
    resolvedDate: z.union([
      z.string().transform(val => new Date(val)),
      z.date(),
    ]).optional().nullable(),
  });
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violations.$inferSelect;

export type ViolationStats = {
  totalViolations: number;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  disputedFees: number;
  paidCount: number;
  pendingCount: number;
  disputedCount: number;
  byAuthority: Array<{ authority: string; count: number; totalFees: number }>;
  byStatus: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number; totalFees: number }>;
};

// Printers - Client-configured printers for receipt/invoice printing
export const printers = pgTable("printers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  branchId: varchar("branch_id").references(() => branches.id), // Optional: assign to specific branch
  name: text("name").notNull(), // e.g., "Kitchen Printer", "Receipt Printer"
  printerType: text("printer_type").notNull(), // "thermal", "inkjet", "laser"
  connectionType: text("connection_type").notNull(), // "network", "usb", "bluetooth"
  ipAddress: text("ip_address"), // For network printers
  port: integer("port").default(9100), // Default ESC/POS port
  deviceName: text("device_name"), // For USB/Bluetooth printers
  brand: text("brand"), // "epson", "star", "bixolon", "generic"
  model: text("model"), // Specific model number
  paperWidth: integer("paper_width").default(80), // Paper width in mm (58, 80)
  isDefault: boolean("is_default").notNull().default(false), // Default printer for this branch/restaurant
  isActive: boolean("is_active").notNull().default(true), // Enable/disable printer
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPrinterSchema = createInsertSchema(printers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    printerType: z.enum(["thermal", "inkjet", "laser"]),
    connectionType: z.enum(["network", "usb", "bluetooth"]),
    brand: z.enum(["epson", "star", "bixolon", "citizen", "generic"]).optional().nullable(),
    paperWidth: z.number().min(58).max(80).optional().default(80),
  });
export type InsertPrinter = z.infer<typeof insertPrinterSchema>;
export type Printer = typeof printers.$inferSelect;

// Violation References - Reference PDF documents for each authority type
export const violationReferences = pgTable("violation_references", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  authority: text("authority").notNull(), // "municipality", "zatca", "police", "ministry_of_commerce"
  title: text("title").notNull(), // Document title/name
  description: text("description"), // Optional description
  documentPath: text("document_path").notNull(), // Path to uploaded PDF file
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertViolationReferenceSchema = createInsertSchema(violationReferences)
  .omit({ id: true, uploadedAt: true })
  .extend({
    authority: z.enum(["municipality", "zatca", "police", "ministry_of_commerce"]),
  });
export type InsertViolationReference = z.infer<typeof insertViolationReferenceSchema>;
export type ViolationReference = typeof violationReferences.$inferSelect;

// ZATCA Settings - Store ZATCA e-invoicing configuration per restaurant
export const zatcaSettings = pgTable("zatca_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull().unique(),
  // Environment
  environment: text("environment").notNull().default("sandbox"), // "sandbox", "simulation", "production"
  isEnabled: boolean("is_enabled").notNull().default(false),
  // CSR Configuration
  csrCommonName: text("csr_common_name"), // EGS unit identifier
  csrSerialNumber: text("csr_serial_number"), // EGS serial number format: 1-xxx|2-xxx|3-uuid
  csrOrganizationIdentifier: text("csr_organization_identifier"), // VAT number (15 digits)
  csrOrganizationUnitName: text("csr_organization_unit_name"), // Branch name
  csrOrganizationName: text("csr_organization_name"), // Company name
  csrCountryName: text("csr_country_name").default("SA"),
  csrInvoiceType: text("csr_invoice_type").default("1100"), // 1100 = both B2B and B2C
  csrLocationAddress: text("csr_location_address"),
  csrIndustryBusinessCategory: text("csr_industry_business_category"),
  // Seller Address (for UBL XML)
  sellerStreetName: text("seller_street_name"),
  sellerBuildingNumber: text("seller_building_number"),
  sellerCitySubdivision: text("seller_city_subdivision"),
  sellerCity: text("seller_city"),
  sellerPostalZone: text("seller_postal_zone"),
  sellerCrNumber: text("seller_cr_number"), // Commercial Registration Number
  // Cryptographic Keys (stored encrypted)
  privateKey: text("private_key"), // PEM-encoded private key
  csr: text("csr"), // PEM-encoded CSR
  // CSID (Cryptographic Stamp Identifier)
  complianceCsid: text("compliance_csid"), // Compliance CSID for testing
  complianceCsidSecret: text("compliance_csid_secret"), // Compliance CSID secret
  productionCsid: text("production_csid"), // Production CSID
  productionCsidSecret: text("production_csid_secret"), // Production CSID secret
  csidExpiresAt: timestamp("csid_expires_at"),
  // Onboarding status tracking
  onboardingStatus: text("onboarding_status").default("not_started"), // "not_started", "csr_generated", "compliance_received", "compliance_passed", "production_ready"
  // Certificate chain
  certificate: text("certificate"), // X.509 certificate from ZATCA
  // Invoice counters
  lastInvoiceCounter: integer("last_invoice_counter").notNull().default(0),
  lastInvoiceHash: text("last_invoice_hash"), // Previous invoice hash for chaining
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertZatcaSettingsSchema = createInsertSchema(zatcaSettings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    environment: z.enum(["sandbox", "simulation", "production"]).default("sandbox"),
  });
export type InsertZatcaSettings = z.infer<typeof insertZatcaSettingsSchema>;
export type ZatcaSettings = typeof zatcaSettings.$inferSelect;

// ZATCA Invoice Status - Track ZATCA submission status for each invoice
export const invoiceZatcaStatus = pgTable("invoice_zatca_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  // Invoice identification
  invoiceType: text("invoice_type").notNull(), // "standard" (B2B), "simplified" (B2C)
  invoiceSubType: text("invoice_sub_type").notNull(), // "01" debit, "02" credit
  uuid: text("uuid").notNull(), // ZATCA invoice UUID
  invoiceHash: text("invoice_hash").notNull(), // SHA256 hash of the invoice
  invoiceCounter: integer("invoice_counter").notNull(), // Sequential counter
  // Submission details
  submissionType: text("submission_type").notNull(), // "clearance" (B2B), "reporting" (B2C)
  submissionStatus: text("submission_status").notNull().default("pending"), // "pending", "submitted", "cleared", "reported", "rejected", "warning"
  // ZATCA response
  zatcaRequestId: text("zatca_request_id"), // Request ID from ZATCA
  zatcaResponseCode: text("zatca_response_code"), // Response code
  zatcaResponseMessage: text("zatca_response_message"), // Response message
  zatcaWarnings: jsonb("zatca_warnings").$type<Array<{ code: string; message: string }>>(), // Validation warnings
  zatcaErrors: jsonb("zatca_errors").$type<Array<{ code: string; message: string }>>(), // Validation errors
  // Signed invoice data
  signedXml: text("signed_xml"), // Full signed XML
  qrCode: text("qr_code"), // Base64-encoded QR code with cryptographic stamp
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  clearedAt: timestamp("cleared_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index("invoice_zatca_status_invoice_idx").on(table.invoiceId),
  restaurantIdx: index("invoice_zatca_status_restaurant_idx").on(table.restaurantId),
  statusIdx: index("invoice_zatca_status_status_idx").on(table.submissionStatus),
}));

export const insertInvoiceZatcaStatusSchema = createInsertSchema(invoiceZatcaStatus)
  .omit({ id: true, createdAt: true })
  .extend({
    invoiceType: z.enum(["standard", "simplified"]),
    invoiceSubType: z.enum(["01", "02"]), // 01=debit/invoice, 02=credit note
    submissionType: z.enum(["clearance", "reporting"]),
    submissionStatus: z.enum(["pending", "submitted", "cleared", "reported", "rejected", "warning"]).default("pending"),
  });
export type InsertInvoiceZatcaStatus = z.infer<typeof insertInvoiceZatcaStatusSchema>;
export type InvoiceZatcaStatus = typeof invoiceZatcaStatus.$inferSelect;

// Shop Files - Client account document storage (CR, VAT, IBAN, National Address certificates)
export const shopFiles = pgTable("shop_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id).notNull(),
  fileType: text("file_type").notNull(), // "cr_certificate", "vat_certificate", "iban_certificate", "national_address"
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  restaurantIdx: index("shop_files_restaurant_idx").on(table.restaurantId),
  typeIdx: index("shop_files_type_idx").on(table.fileType),
}));

export const insertShopFileSchema = createInsertSchema(shopFiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    fileType: z.enum(["cr_certificate", "vat_certificate", "iban_certificate", "national_address"]),
  });
export type InsertShopFile = z.infer<typeof insertShopFileSchema>;
export type ShopFile = typeof shopFiles.$inferSelect;

// Company Files - IT account document storage for Kinzhal LTD Co. (CR, VAT, Licenses, IBAN, National Address)
export const companyFiles = pgTable("company_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileType: text("file_type").notNull(), // "cr_certificate", "vat_certificate", "license", "iban_certificate", "national_address"
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  description: text("description"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyFileSchema = createInsertSchema(companyFiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    fileType: z.enum(["cr_certificate", "vat_certificate", "license", "iban_certificate", "national_address"]),
  });
export type InsertCompanyFile = z.infer<typeof insertCompanyFileSchema>;
export type CompanyFile = typeof companyFiles.$inferSelect;

// Pending Signups - Temporary storage for signup data during Geidea payment
export const pendingSignups = pgTable("pending_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  geideaSessionId: text("geidea_session_id").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  nationalId: text("national_id").notNull(),
  taxNumber: text("tax_number").notNull(),
  commercialRegistration: text("commercial_registration").notNull(),
  businessType: text("business_type").notNull(),
  restaurantType: text("restaurant_type").notNull(),
  subscriptionPlan: text("subscription_plan").notNull(),
  branchesCount: integer("branches_count").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, expired
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertPendingSignupSchema = createInsertSchema(pendingSignups)
  .omit({ id: true, createdAt: true })
  .extend({
    businessType: z.enum(["restaurant", "factory"]),
    subscriptionPlan: z.enum(["weekly", "monthly", "yearly"]),
    status: z.enum(["pending", "paid", "failed", "expired"]).default("pending"),
  });
export type InsertPendingSignup = z.infer<typeof insertPendingSignupSchema>;
export type PendingSignup = typeof pendingSignups.$inferSelect;
