import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Fail fast with a clear, actionable message so the process exits cleanly
  // instead of crash-looping on every request inside PM2.
  console.error(
    "\n[FATAL] DATABASE_URL is not set.\n" +
      "  Set it in the canonical .env file on the server (see DEPLOYMENT.md)\n" +
      "  and restart with: pm2 restart BSS --update-env\n"
  );
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Startup migrations. These are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT
// EXISTS) so the production server boots cleanly after a deploy that adds new
// tables/columns, even if `drizzle-kit push` has not been run yet. Each block
// is wrapped in its own try/catch so a single failure cannot prevent boot.
(async () => {
  const steps: Array<[string, string]> = [
    [
      "company_profiles.partners",
      `ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS partners jsonb DEFAULT '[]'::jsonb`,
    ],
    [
      "service_products",
      `CREATE TABLE IF NOT EXISTS service_products (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         name text NOT NULL,
         description text,
         category text,
         status text NOT NULL DEFAULT 'active',
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "product_items",
      `CREATE TABLE IF NOT EXISTS product_items (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         product_id varchar NOT NULL REFERENCES service_products(id) ON DELETE CASCADE,
         name text NOT NULL,
         cost numeric(12,2) NOT NULL DEFAULT 0,
         selling_price numeric(12,2) NOT NULL DEFAULT 0,
         percentage numeric(6,2) NOT NULL DEFAULT 0,
         sort_order integer NOT NULL DEFAULT 0
       )`,
    ],
    [
      "product_service_links",
      `CREATE TABLE IF NOT EXISTS product_service_links (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         product_id varchar NOT NULL REFERENCES service_products(id) ON DELETE CASCADE,
         service_catalog_id varchar,
         name text,
         unit_price numeric(12,2),
         quantity numeric(12,2) NOT NULL DEFAULT 1,
         sort_order integer NOT NULL DEFAULT 0
       )`,
    ],
    [
      "product_tasks",
      `CREATE TABLE IF NOT EXISTS product_tasks (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         product_id varchar NOT NULL REFERENCES service_products(id) ON DELETE CASCADE,
         name text NOT NULL,
         description text,
         duration integer NOT NULL DEFAULT 1,
         sort_order integer NOT NULL DEFAULT 0
       )`,
    ],
    [
      "project_items",
      `CREATE TABLE IF NOT EXISTS project_items (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         project_id varchar NOT NULL,
         source_product_id varchar,
         name text NOT NULL,
         cost numeric(12,2) NOT NULL DEFAULT 0,
         selling_price numeric(12,2) NOT NULL DEFAULT 0,
         percentage numeric(6,2) NOT NULL DEFAULT 0,
         sort_order integer NOT NULL DEFAULT 0,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "catering_contracts",
      `CREATE TABLE IF NOT EXISTS catering_contracts (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         contract_number text NOT NULL,
         client_name text NOT NULL,
         client_phone text NOT NULL,
         client_email text,
         delivery_location text,
         meal_selections jsonb NOT NULL DEFAULT '[]'::jsonb,
         meals_per_day integer NOT NULL DEFAULT 1,
         delivery_days text[] NOT NULL DEFAULT ARRAY[]::text[],
         delivery_time text,
         start_date timestamp NOT NULL,
         end_date timestamp NOT NULL,
         total_value numeric(12,2) NOT NULL DEFAULT 0,
         discount_percent numeric(5,2) NOT NULL DEFAULT 0,
         final_value numeric(12,2) NOT NULL DEFAULT 0,
         payment_installments jsonb NOT NULL DEFAULT '[]'::jsonb,
         notes text,
         status text NOT NULL DEFAULT 'active',
         share_token text,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "catering_contracts.payment_installments",
      `ALTER TABLE catering_contracts ADD COLUMN IF NOT EXISTS payment_installments jsonb NOT NULL DEFAULT '[]'::jsonb`,
    ],
    [
      "catering_contracts.share_token",
      `ALTER TABLE catering_contracts ADD COLUMN IF NOT EXISTS share_token text`,
    ],
    [
      "catering_contract_templates",
      `CREATE TABLE IF NOT EXISTS catering_contract_templates (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         name text NOT NULL,
         content text NOT NULL DEFAULT '',
         is_default boolean NOT NULL DEFAULT false,
         custom_placeholders jsonb NOT NULL DEFAULT '[]'::jsonb,
         created_at timestamp NOT NULL DEFAULT now(),
         updated_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "investment_agreement_templates",
      `CREATE TABLE IF NOT EXISTS investment_agreement_templates (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         name text NOT NULL,
         content text NOT NULL DEFAULT '',
         is_default boolean NOT NULL DEFAULT false,
         custom_placeholders jsonb NOT NULL DEFAULT '[]'::jsonb,
         created_at timestamp NOT NULL DEFAULT now(),
         updated_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "marketing_discount_codes",
      `CREATE TABLE IF NOT EXISTS marketing_discount_codes (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         code text NOT NULL,
         discount_type text NOT NULL,
         discount_value numeric(12,2) NOT NULL,
         expires_at timestamp,
         usage_cap integer,
         usage_count integer NOT NULL DEFAULT 0,
         active boolean NOT NULL DEFAULT true,
         notes text,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "marketing_broadcast_templates",
      `CREATE TABLE IF NOT EXISTS marketing_broadcast_templates (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         name text NOT NULL,
         segment text NOT NULL DEFAULT 'all',
         message text NOT NULL,
         menu_pdf_url text,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "meal_subscriptions.credit_balance",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS credit_balance numeric(10,2) NOT NULL DEFAULT 0`,
    ],
    [
      "meal_subscriptions.number_of_days",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS number_of_days integer`,
    ],
    [
      "meal_subscriptions.delivery_hours",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS delivery_hours jsonb NOT NULL DEFAULT '{}'::jsonb`,
    ],
    [
      "meal_subscriptions.discount_type",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent'`,
    ],
    [
      "meal_subscriptions.discount_value",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS discount_value numeric(10,2) NOT NULL DEFAULT 0`,
    ],
    [
      "meal_subscriptions.delivery_log",
      `ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS delivery_log jsonb NOT NULL DEFAULT '[]'::jsonb`,
    ],
    [
      "marketing_fin_snapshots",
      `CREATE TABLE IF NOT EXISTS marketing_fin_snapshots (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         product_name text NOT NULL,
         gross_margin_pct numeric(8,2) NOT NULL DEFAULT 0,
         break_even_units numeric(12,2) NOT NULL DEFAULT 0,
         break_even_revenue numeric(14,2) NOT NULL DEFAULT 0,
         monthly_profit numeric(14,2) NOT NULL DEFAULT 0,
         roi_pct numeric(10,2) NOT NULL DEFAULT 0,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "idx_mkt_fin_snapshots_restaurant",
      `CREATE INDEX IF NOT EXISTS idx_mkt_fin_snapshots_restaurant ON marketing_fin_snapshots (restaurant_id)`,
    ],
    [
      "marketing_fin_scenarios",
      `CREATE TABLE IF NOT EXISTS marketing_fin_scenarios (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         name text NOT NULL,
         data jsonb NOT NULL DEFAULT '[]'::jsonb,
         created_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "idx_mkt_fin_scenarios_restaurant",
      `CREATE INDEX IF NOT EXISTS idx_mkt_fin_scenarios_restaurant ON marketing_fin_scenarios (restaurant_id)`,
    ],
    [
      "marketing_fin_settings",
      `CREATE TABLE IF NOT EXISTS marketing_fin_settings (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL UNIQUE REFERENCES restaurants(id),
         min_margin_pct numeric(5,2) NOT NULL DEFAULT 20,
         max_break_even_units numeric(12,2) NOT NULL DEFAULT 1000,
         alerts_enabled boolean NOT NULL DEFAULT true
       )`,
    ],
  ];

  for (const [label, ddl] of steps) {
    try {
      await pool.query(ddl);
    } catch (err) {
      console.warn(`[Migration] ${label}:`, (err as Error).message);
    }
  }
})();
