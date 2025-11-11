import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Branches
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"), // Price per unit in SAR
  supplier: text("supplier").notNull(),
  status: text("status").notNull().default("In Stock"),
  branchId: varchar("branch_id").references(() => branches.id),
  sortOrder: integer("sort_order").default(0),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Recipes (must be defined before menuItems for foreign key reference)
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export const insertMenuItemSchema = createInsertSchema(menuItems)
  .omit({ id: true })
  .extend({
    recipeId: z.string().nullable().optional(), // Allow null to clear recipe
    inventoryItemId: z.string().nullable().optional(), // Allow null, for simple items
    portionSize: z.string().optional(), // Portion multiplier (1.0, 0.5, 0.25)
    stockNo: z.string().optional(), // Stock quantity per item
  })
  .refine(
    (data) => {
      const discount = parseFloat(data.discount || "0");
      return discount >= 0 && discount <= 100;
    },
    { message: "Discount must be between 0 and 100" }
  )
  .refine(
    (data) => {
      // If linked to inventory item (not recipe), stockNo is required
      const hasInventoryItem = data.inventoryItemId && data.inventoryItemId !== "none";
      const hasRecipe = data.recipeId && data.recipeId !== "none";
      if (hasInventoryItem && !hasRecipe) {
        return !!data.stockNo && data.stockNo.trim() !== "";
      }
      return true;
    },
    { message: "Stock quantity is required for non-recipe items", path: ["stockNo"] }
  );
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Add-ons
export const addons = pgTable("addons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., "Toppings", "Sides", "Sauces", "Extras"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // VAT-inclusive price
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // VAT amount (15%)
  menuItemIds: varchar("menu_item_ids").array(), // Optional: link to multiple menu items (null means "All items")
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
});

export const insertAddonSchema = createInsertSchema(addons)
  .omit({ id: true })
  .extend({
    menuItemIds: z.array(z.string()).nullable().optional(),
  });
export type InsertAddon = z.infer<typeof insertAddonSchema>;
export type Addon = typeof addons.$inferSelect;

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Inventory Transactions (audit trail for all inventory movements) - Must be after orders
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inventoryItemId: varchar("inventory_item_id").references(() => inventoryItems.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id), // Optional: links to orders table
  type: text("type").notNull(), // "sale", "procurement", "adjustment", "wastage"
  quantityChange: decimal("quantity_change", { precision: 10, scale: 2 }).notNull(), // Negative for deductions, positive for additions
  quantityBefore: decimal("quantity_before", { precision: 10, scale: 2 }).notNull(),
  quantityAfter: decimal("quantity_after", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"), // Additional details (e.g., "Sold in Order ORD-123", "Procurement PO-456")
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({ id: true, createdAt: true });
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// Transactions (Sales)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull().unique(),
  orderId: varchar("order_id").references(() => orders.id),
  branchId: varchar("branch_id").references(() => branches.id),
  itemCount: integer("item_count").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Moyasar Payments (Payment Gateway Integration)
export const moyasarPayments = pgTable("moyasar_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  restaurantName: text("restaurant_name").notNull(),
  vatNumber: text("vat_number").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  language: text("language").notNull().default("English"),
  openingTime: text("opening_time"),
  closingTime: text("closing_time"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Procurement
export const procurement = pgTable("procurement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProcurementSchema = createInsertSchema(procurement).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProcurement = z.infer<typeof insertProcurementSchema>;
export type Procurement = typeof procurement.$inferSelect;

// Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed password
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("employee"), // "admin" or "employee"
  permissions: jsonb("permissions").notNull().$type<{
    dashboard: boolean;
    inventory: boolean;
    menu: boolean;
    recipes: boolean;
    branches: boolean;
    procurement: boolean;
    pos: boolean;
    orders: boolean;
    kitchen: boolean;
    sales: boolean;
    reports: boolean;
    forecasting: boolean;
    analysis: boolean;
    settings: boolean;
    financial: boolean;
    employees: boolean;
  }>(),
  branchId: varchar("branch_id").references(() => branches.id),
  commercialRegistration: text("commercial_registration"), // Saudi Arabia Commercial Registration number (mandatory for signup)
  restaurantName: text("restaurant_name"), // Restaurant name (mandatory for signup)
  nationalId: text("national_id"), // National ID or Company Name (mandatory for signup)
  taxNumber: text("tax_number"), // Unified Tax Number (mandatory for signup)
  restaurantType: text("restaurant_type"), // "Cloud Kitchen", "Restaurant", "Coffee Shop", "Tea Shop", "Sweets", "Bakery" (mandatory for signup)
  subscriptionPlan: text("subscription_plan"), // "weekly", "monthly" or "yearly"
  branchesCount: integer("branches_count").notNull().default(1), // Number of branches (minimum 1, affects pricing)
  subscriptionStatus: text("subscription_status").default("inactive"), // "inactive", "active", "cancelled", "expired"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"), // When user cancelled subscription
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
  
  // Compliance
  documents: jsonb("documents").$type<Array<{
    name: string;
    type: string; // "iqama", "passport", "contract", "medical", "other"
    expiryDate: string | null;
    status: string; // "valid", "expired", "pending"
  }>>(),
  certifications: text("certifications").array(),
  trainingCompleted: text("training_completed").array(),
  
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
  vacationDaysTotal: z.union([z.string().transform((val) => val ? parseInt(val) : 0), z.number()]).optional(),
  vacationDaysUsed: z.union([z.string().transform((val) => val ? parseInt(val) : 0), z.number()]).optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Invoices (ZATCA-compliant)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  orderId: varchar("order_id").references(() => orders.id),
  branchId: varchar("branch_id").references(() => branches.id),
  customerName: text("customer_name"),
  items: jsonb("items").notNull().$type<Array<{ name: string; quantity: number; basePrice: number; vatAmount: number; total: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  qrCode: text("qr_code"), // Base64 encoded QR code
  pdfPath: text("pdf_path"), // Path to generated PDF
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Shop Salaries
export const salaries = pgTable("salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  billType: text("bill_type").notNull(), // "rent", "electricity", "water", "gas", "internet", "maintenance", "foundational", "other"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentPeriod: text("payment_period").notNull().default("monthly"), // "one-time", "weekly", "monthly", "quarterly", "semi-annually", "yearly"
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue"
  description: text("description"),
  archived: boolean("archived").notNull().default(false), // For archiving old bills
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShopBillSchema = createInsertSchema(shopBills).omit({ id: true, createdAt: true });
export type InsertShopBill = z.infer<typeof insertShopBillSchema>;
export type ShopBill = typeof shopBills.$inferSelect;

// Delivery Apps
export const deliveryApps = pgTable("delivery_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Manually entered delivery app name (e.g., "HungerStation", "Jahez", "Mrsool")
  commission: decimal("commission", { precision: 5, scale: 2 }).notNull(), // VAT-inclusive commission percentage (e.g., 20.00 for 20%)
  bankingFees: decimal("banking_fees", { precision: 5, scale: 2 }).notNull(), // VAT-inclusive banking fees percentage (e.g., 2.50 for 2.5%)
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
    subsidyTiers: z.array(subsidyTierSchema).max(3, "Maximum 3 subsidy tiers allowed"),
  });
export type InsertDeliveryApp = z.infer<typeof insertDeliveryAppSchema>;
export type DeliveryApp = typeof deliveryApps.$inferSelect;

// Investors
export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amountInvested: decimal("amount_invested", { precision: 12, scale: 2 }).notNull(), // Amount invested in SAR
  interestPercentage: decimal("interest_percentage", { precision: 5, scale: 2 }).notNull(), // Percentage of net profit (e.g., 10.00 for 10%)
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const baseInvestorSchema = createInsertSchema(investors).omit({ id: true, createdAt: true });

export const insertInvestorSchema = baseInvestorSchema.refine(
  (data) => {
    const percentage = parseFloat(data.interestPercentage || "0");
    return percentage >= 0 && percentage <= 100;
  },
  { message: "Interest percentage must be between 0 and 100" }
);

export const updateInvestorSchema = baseInvestorSchema.partial().refine(
  (data) => {
    if (data.interestPercentage !== undefined) {
      const percentage = parseFloat(data.interestPercentage || "0");
      return percentage >= 0 && percentage <= 100;
    }
    return true;
  },
  { message: "Interest percentage must be between 0 and 100" }
);

export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type UpdateInvestor = z.infer<typeof updateInvestorSchema>;
export type Investor = typeof investors.$inferSelect;

// Subscription Invoices
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
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ 
  id: true, 
  ticketNumber: true, 
  createdAt: true, 
  updatedAt: true, 
  resolvedAt: true, 
  closedAt: true 
});
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// Ticket Messages (Chat between user and IT)
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
