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
  supplier: text("supplier").notNull(),
  status: text("status").notNull().default("In Stock"),
  branchId: varchar("branch_id").references(() => branches.id),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // VAT-inclusive price (15% Saudi VAT)
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before VAT
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(), // VAT amount (15%)
  description: text("description"),
  available: boolean("available").notNull().default(true),
  imageUrl: text("image_url"),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Recipes
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").references(() => menuItems.id),
  name: text("name").notNull(),
  prepTime: text("prep_time").notNull(),
  cookTime: text("cook_time").notNull(),
  servings: integer("servings").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  ingredients: jsonb("ingredients").notNull().$type<Array<{ name: string; quantity: number; unit: string }>>(),
  steps: jsonb("steps").notNull().$type<string[]>(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  branchId: varchar("branch_id").references(() => branches.id),
  customerName: text("customer_name"),
  orderType: text("order_type").notNull(),
  table: text("table"),
  address: text("address"),
  items: jsonb("items").notNull().$type<Array<{ id: string; name: string; quantity: number; price: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

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

// Settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantName: text("restaurant_name").notNull(),
  vatNumber: text("vat_number").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  language: text("language").notNull().default("English"),
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
  subscriptionPlan: text("subscription_plan"), // "monthly" or "yearly"
  subscriptionStatus: text("subscription_status").default("inactive"), // "inactive", "active", "cancelled", "expired"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
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
