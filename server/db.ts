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
export const startupMigrationReady: Promise<void> = (async () => {
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
      "marketing_qr_scans",
      `CREATE TABLE IF NOT EXISTS marketing_qr_scans (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         target_type text NOT NULL,
         target_id varchar NOT NULL,
         source text NOT NULL DEFAULT 'camera',
         order_id varchar,
         scanned_at timestamp NOT NULL DEFAULT now()
       )`,
    ],
    [
      "marketing_qr_scans_restaurant_target_idx",
      `CREATE INDEX IF NOT EXISTS marketing_qr_scans_restaurant_target_idx ON marketing_qr_scans(restaurant_id, target_type, target_id)`,
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
      "zatca_xml_archive",
      `CREATE TABLE IF NOT EXISTS zatca_xml_archive (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         invoice_id varchar NOT NULL REFERENCES invoices(id),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id),
         invoice_number text NOT NULL,
         invoice_hash text NOT NULL,
         signed_xml text NOT NULL,
         submission_status text NOT NULL,
         submitted_at timestamp,
         archived_at timestamp NOT NULL DEFAULT now(),
         retention_expires_at timestamp NOT NULL
       )`,
    ],
    [
      // Reconciliation for databases where schema-sync created the table without FKs
      "zatca_xml_archive_invoice_fk",
      `DO $$ BEGIN
         ALTER TABLE zatca_xml_archive ADD CONSTRAINT zatca_xml_archive_invoice_fk FOREIGN KEY (invoice_id) REFERENCES invoices(id);
       EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`,
    ],
    [
      "zatca_xml_archive_restaurant_fk",
      `DO $$ BEGIN
         ALTER TABLE zatca_xml_archive ADD CONSTRAINT zatca_xml_archive_restaurant_fk FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);
       EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`,
    ],
    [
      // DB-level append-only enforcement: no UPDATE ever; DELETE only after the 6-year retention window
      "zatca_archive_protect_fn",
      `CREATE OR REPLACE FUNCTION zatca_archive_protect() RETURNS trigger AS $fn$
       BEGIN
         IF TG_OP = 'UPDATE' THEN
           RAISE EXCEPTION 'zatca_xml_archive is append-only (ZATCA 6-year retention, Article 59)';
         ELSIF TG_OP = 'DELETE' THEN
           IF OLD.retention_expires_at > now() THEN
             RAISE EXCEPTION 'zatca_xml_archive row is within its 6-year retention window and cannot be deleted';
           END IF;
           RETURN OLD;
         END IF;
         RETURN NULL;
       END $fn$ LANGUAGE plpgsql`,
    ],
    [
      "zatca_archive_guard_trigger",
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'zatca_archive_guard') THEN
           CREATE TRIGGER zatca_archive_guard BEFORE UPDATE OR DELETE ON zatca_xml_archive
           FOR EACH ROW EXECUTE FUNCTION zatca_archive_protect();
         END IF;
       END $$`,
    ],
    [
       // DB-level invoice finality: accepted-with-warning is final too.
      // (only derived artifacts qr_code/pdf_path may change) and the invoice cannot be deleted.
      "zatca_invoice_finality_fn",
      `CREATE OR REPLACE FUNCTION zatca_invoice_finality() RETURNS trigger AS $fn$
       DECLARE final_status text;
       BEGIN
         SELECT submission_status INTO final_status FROM invoice_zatca_status
           WHERE invoice_id = OLD.id AND restaurant_id = OLD.restaurant_id
              AND submission_status IN ('cleared','reported','warning') LIMIT 1;
         IF final_status IS NULL THEN
           IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
         END IF;
         IF TG_OP = 'DELETE' THEN
           RAISE EXCEPTION 'Invoice % is % by ZATCA and cannot be deleted (6-year retention). Issue a credit note.', OLD.id, final_status;
         END IF;
         IF (to_jsonb(NEW) - 'qr_code' - 'pdf_path') IS DISTINCT FROM (to_jsonb(OLD) - 'qr_code' - 'pdf_path') THEN
           RAISE EXCEPTION 'Invoice % is % by ZATCA; business fields are immutable. Issue a credit/debit note.', OLD.id, final_status;
         END IF;
         RETURN NEW;
       END $fn$ LANGUAGE plpgsql`,
    ],
    [
      "zatca_invoice_finality_trigger",
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'zatca_invoice_finality_guard') THEN
           CREATE TRIGGER zatca_invoice_finality_guard BEFORE UPDATE OR DELETE ON invoices
           FOR EACH ROW EXECUTE FUNCTION zatca_invoice_finality();
         END IF;
       END $$`,
    ],
    [
       // Final ZATCA status rows (including accepted-with-warning) are immutable.
      "zatca_status_finality_fn",
      `CREATE OR REPLACE FUNCTION zatca_status_finality() RETURNS trigger AS $fn$
       BEGIN
          IF OLD.submission_status IN ('cleared','reported','warning') THEN
           RAISE EXCEPTION 'invoice_zatca_status row for invoice % is final (%) and cannot be % ', OLD.invoice_id, OLD.submission_status, lower(TG_OP);
         END IF;
         IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
       END $fn$ LANGUAGE plpgsql`,
    ],
    [
      "zatca_status_finality_trigger",
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'zatca_status_finality_guard') THEN
           CREATE TRIGGER zatca_status_finality_guard BEFORE UPDATE OR DELETE ON invoice_zatca_status
           FOR EACH ROW EXECUTE FUNCTION zatca_status_finality();
         END IF;
       END $$`,
    ],
    [
      "zatca_xml_archive_invoice_unique",
      `CREATE UNIQUE INDEX IF NOT EXISTS zatca_xml_archive_invoice_unique ON zatca_xml_archive (invoice_id, restaurant_id)`,
    ],
    [
      "zatca_xml_archive_restaurant_idx",
      `CREATE INDEX IF NOT EXISTS zatca_xml_archive_restaurant_idx ON zatca_xml_archive (restaurant_id)`,
    ],
    [
      "zatca_xml_archive_retention_idx",
      `CREATE INDEX IF NOT EXISTS zatca_xml_archive_retention_idx ON zatca_xml_archive (retention_expires_at)`,
    ],
    [
      "zatca_settings_csid_alert",
      `ALTER TABLE zatca_settings ADD COLUMN IF NOT EXISTS csid_expiry_alert_level text`,
    ],
    [
      // One authoritative ZATCA status row per invoice
      "invoice_zatca_status_invoice_unique",
      `CREATE UNIQUE INDEX IF NOT EXISTS invoice_zatca_status_invoice_unique ON invoice_zatca_status (invoice_id, restaurant_id)`,
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
    [
      "general_overview_tables",
      `CREATE TABLE IF NOT EXISTS overview_settings (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), food_cost_threshold numeric(5,2) NOT NULL DEFAULT 35, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(), UNIQUE(restaurant_id, branch_id));
       CREATE TABLE IF NOT EXISTS waste_logs (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), inventory_item_id varchar REFERENCES inventory_items(id), item_name text NOT NULL, waste_kind text NOT NULL DEFAULT 'ingredient', quantity numeric(12,2) NOT NULL, unit text NOT NULL, cost numeric(12,2) NOT NULL DEFAULT 0, reason text NOT NULL, actor_id varchar REFERENCES users(id) ON DELETE SET NULL, occurred_at timestamp NOT NULL DEFAULT now(), created_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS cash_accounts (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), name text NOT NULL, opening_balance numeric(14,2) NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS cash_ledger_entries (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), account_id varchar NOT NULL REFERENCES cash_accounts(id), direction text NOT NULL, amount numeric(14,2) NOT NULL, category text NOT NULL, description text, occurred_at timestamp NOT NULL DEFAULT now(), actor_id varchar REFERENCES users(id) ON DELETE SET NULL, created_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS cash_obligations (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), kind text NOT NULL, amount numeric(14,2) NOT NULL, due_date date NOT NULL, status text NOT NULL DEFAULT 'open', description text, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS work_schedules (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), employee_id varchar NOT NULL REFERENCES users(id), scheduled_date date NOT NULL, scheduled_hours numeric(6,2) NOT NULL, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS work_time_entries (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), employee_id varchar NOT NULL REFERENCES users(id), started_at timestamp NOT NULL, ended_at timestamp, hours numeric(6,2), created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS employment_exits (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), employee_id varchar NOT NULL REFERENCES users(id), exit_date date NOT NULL, reason text, created_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS loyalty_accounts (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), customer_id varchar NOT NULL REFERENCES customers(id), points_balance numeric(12,2) NOT NULL DEFAULT 0, enrolled_at timestamp NOT NULL DEFAULT now(), created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(), UNIQUE(restaurant_id, customer_id));
       CREATE TABLE IF NOT EXISTS loyalty_transactions (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), loyalty_account_id varchar NOT NULL REFERENCES loyalty_accounts(id), order_id varchar REFERENCES orders(id), type text NOT NULL, points numeric(12,2) NOT NULL, value numeric(12,2) NOT NULL DEFAULT 0, occurred_at timestamp NOT NULL DEFAULT now(), created_at timestamp NOT NULL DEFAULT now());
       CREATE TABLE IF NOT EXISTS zatca_retry_attempts (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), invoice_id varchar NOT NULL REFERENCES invoices(id), actor_id varchar REFERENCES users(id) ON DELETE SET NULL, idempotency_key text NOT NULL, outcome text NOT NULL, error_message text, created_at timestamp NOT NULL DEFAULT now(), UNIQUE(restaurant_id, invoice_id, idempotency_key));
        CREATE TABLE IF NOT EXISTS overview_daily_snapshots (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id), branch_id varchar NOT NULL REFERENCES branches(id), snapshot_date date NOT NULL, revenue numeric(14,2) NOT NULL DEFAULT 0, order_count integer NOT NULL DEFAULT 0, calculated_at timestamp NOT NULL DEFAULT now(), UNIQUE(restaurant_id, branch_id, snapshot_date));
       CREATE INDEX IF NOT EXISTS waste_logs_branch_occurred_idx ON waste_logs(restaurant_id, branch_id, occurred_at);
       CREATE INDEX IF NOT EXISTS cash_ledger_account_occurred_idx ON cash_ledger_entries(restaurant_id, branch_id, account_id, occurred_at);
       CREATE INDEX IF NOT EXISTS cash_obligations_due_idx ON cash_obligations(restaurant_id, branch_id, due_date);
       CREATE UNIQUE INDEX IF NOT EXISTS work_schedules_employee_date_unique ON work_schedules(restaurant_id, branch_id, employee_id, scheduled_date);
       CREATE INDEX IF NOT EXISTS work_time_employee_started_idx ON work_time_entries(restaurant_id, branch_id, employee_id, started_at);
       CREATE INDEX IF NOT EXISTS employment_exits_branch_date_idx ON employment_exits(restaurant_id, branch_id, exit_date);
       CREATE INDEX IF NOT EXISTS loyalty_transactions_account_occurred_idx ON loyalty_transactions(restaurant_id, branch_id, loyalty_account_id, occurred_at)`,
    ],
    [
      "scheduled_promotions",
      `CREATE TABLE IF NOT EXISTS promotions (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
         restaurant_id varchar NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
         name text NOT NULL, description text, enabled boolean NOT NULL DEFAULT false,
         paused boolean NOT NULL DEFAULT false, discount_type text NOT NULL,
         discount_value numeric(12,2) NOT NULL, priority integer NOT NULL DEFAULT 0,
         start_date date NOT NULL, end_date date NOT NULL, start_time text NOT NULL DEFAULT '00:00',
         end_time text NOT NULL DEFAULT '23:59', timezone text NOT NULL DEFAULT 'Asia/Riyadh',
         weekdays integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::integer[],
         all_branches boolean NOT NULL DEFAULT true, stacking_policy text NOT NULL DEFAULT 'priority_only',
         max_total_discount numeric(12,2), usage_limit integer, created_by varchar REFERENCES users(id) ON DELETE SET NULL,
         created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
         archived_at timestamp, version integer NOT NULL DEFAULT 1,
         CONSTRAINT promotions_discount_type_check CHECK (discount_type IN ('percentage','fixed_product','special_price','fixed_order')),
         CONSTRAINT promotions_stacking_policy_check CHECK (stacking_policy='priority_only'),
         CONSTRAINT promotions_date_range_check CHECK (end_date >= start_date),
         CONSTRAINT promotions_value_check CHECK (discount_value >= 0),
         CONSTRAINT promotions_usage_limit_check CHECK (usage_limit IS NULL OR usage_limit > 0)
       );
       CREATE TABLE IF NOT EXISTS promotion_branches (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
         promotion_id varchar NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
         branch_id varchar NOT NULL REFERENCES branches(id) ON DELETE CASCADE
       );
       CREATE TABLE IF NOT EXISTS promotion_targets (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
         promotion_id varchar NOT NULL REFERENCES promotions(id) ON DELETE CASCADE, target_type text NOT NULL,
         menu_item_id varchar REFERENCES menu_items(id) ON DELETE CASCADE, category text,
         CONSTRAINT promotion_targets_discriminant_check CHECK (
           (target_type='menu_item' AND menu_item_id IS NOT NULL AND category IS NULL) OR
           (target_type='category' AND menu_item_id IS NULL AND category IS NOT NULL))
       );
       CREATE TABLE IF NOT EXISTS order_promotion_applications (
         id varchar PRIMARY KEY DEFAULT gen_random_uuid(), restaurant_id varchar NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
         order_id varchar NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
         promotion_id varchar REFERENCES promotions(id) ON DELETE SET NULL,
         branch_id varchar NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
         snapshot jsonb NOT NULL, original_subtotal numeric(12,2) NOT NULL,
         discount_amount numeric(12,2) NOT NULL, final_subtotal numeric(12,2) NOT NULL,
         applied_at timestamp NOT NULL DEFAULT now(),
         CONSTRAINT order_promotion_applications_amount_check CHECK (discount_amount >= 0 AND final_subtotal >= 0)
       );
       CREATE INDEX IF NOT EXISTS promotions_tenant_schedule_idx ON promotions(restaurant_id, enabled, start_date, end_date);
       CREATE INDEX IF NOT EXISTS promotions_tenant_priority_idx ON promotions(restaurant_id, priority);
       CREATE UNIQUE INDEX IF NOT EXISTS promotion_branches_unique ON promotion_branches(restaurant_id, promotion_id, branch_id);
       CREATE INDEX IF NOT EXISTS promotion_branches_tenant_branch_idx ON promotion_branches(restaurant_id, branch_id);
       CREATE INDEX IF NOT EXISTS promotion_targets_tenant_promotion_idx ON promotion_targets(restaurant_id, promotion_id);
       CREATE UNIQUE INDEX IF NOT EXISTS promotion_targets_item_unique ON promotion_targets(restaurant_id, promotion_id, menu_item_id);
       CREATE UNIQUE INDEX IF NOT EXISTS promotion_targets_category_unique ON promotion_targets(restaurant_id, promotion_id, category);
       CREATE UNIQUE INDEX IF NOT EXISTS order_promotion_applications_order_promotion_unique ON order_promotion_applications(restaurant_id, order_id, promotion_id);
       CREATE INDEX IF NOT EXISTS order_promotion_applications_tenant_applied_idx ON order_promotion_applications(restaurant_id, applied_at);
       CREATE INDEX IF NOT EXISTS order_promotion_applications_branch_applied_idx ON order_promotion_applications(restaurant_id, branch_id, applied_at);
       CREATE OR REPLACE FUNCTION promotion_application_immutable() RETURNS trigger AS $fn$
       BEGIN RAISE EXCEPTION 'order promotion applications are immutable'; END $fn$ LANGUAGE plpgsql;
       DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='order_promotion_applications_immutable') THEN
         CREATE TRIGGER order_promotion_applications_immutable BEFORE UPDATE OR DELETE ON order_promotion_applications
         FOR EACH ROW EXECUTE FUNCTION promotion_application_immutable();
       END IF; END $$`,
    ],
    [
      "orders.delivery_breakdown",
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_breakdown jsonb`,
    ],
  ];

  // ZATCA compliance-critical migrations: a failure here must NOT be silently
  // swallowed — the app would run without its retention/finality guarantees.
  const ZATCA_CRITICAL = new Set([
    "zatca_xml_archive",
    "zatca_xml_archive_invoice_fk",
    "zatca_xml_archive_restaurant_fk",
    "zatca_archive_protect_fn",
    "zatca_archive_guard_trigger",
    "zatca_invoice_finality_fn",
    "zatca_invoice_finality_trigger",
    "zatca_status_finality_fn",
    "zatca_status_finality_trigger",
    "zatca_xml_archive_invoice_unique",
    "invoice_zatca_status_invoice_unique",
    "zatca_settings_csid_alert",
    "general_overview_tables",
    "scheduled_promotions",
  ]);
  const zatcaFailures: string[] = [];
  for (const [label, ddl] of steps) {
    try {
      await pool.query(ddl);
    } catch (err) {
      if (ZATCA_CRITICAL.has(label)) zatcaFailures.push(`${label}: ${(err as Error).message}`);
      console.warn(`[Migration] ${label}:`, (err as Error).message);
    }
  }

  // Verify the ZATCA compliance controls actually exist before serving traffic.
  try {
    const trg = await pool.query(
      `SELECT tgname FROM pg_trigger WHERE tgname IN ('zatca_archive_guard','zatca_invoice_finality_guard','zatca_status_finality_guard','order_promotion_applications_immutable')`
    );
    const found = new Set(trg.rows.map((r: any) => r.tgname));
    for (const required of ["zatca_archive_guard", "zatca_invoice_finality_guard", "zatca_status_finality_guard", "order_promotion_applications_immutable"]) {
      if (!found.has(required)) zatcaFailures.push(`missing trigger: ${required}`);
    }
    const idx = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE indexname IN ('zatca_xml_archive_invoice_unique','invoice_zatca_status_invoice_unique')`
    );
    const foundIdx = new Set(idx.rows.map((r: any) => r.indexname));
    for (const required of ["zatca_xml_archive_invoice_unique", "invoice_zatca_status_invoice_unique"]) {
      if (!foundIdx.has(required)) zatcaFailures.push(`missing unique index: ${required}`);
    }
  } catch (err) {
    zatcaFailures.push(`verification query failed: ${(err as Error).message}`);
  }
  if (zatcaFailures.length > 0) {
    throw new Error("Critical overview/ZATCA migrations could not be installed/verified:\n  " + zatcaFailures.join("\n  "));
  }
  console.log("[Migration] ZATCA compliance controls verified: finality triggers + unique constraints present");

  // Full schema sync: server/schema-sync.sql is auto-generated from the
  // development database and contains only idempotent statements
  // (CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS for every table
  // and column). This keeps production aligned with the code schema even
  // when a feature's hand-written migration was missed.
  try {
    const fsMod = await import("fs");
    const pathMod = await import("path");
    const syncPath = pathMod.join(process.cwd(), "server", "schema-sync.sql");
    if (fsMod.existsSync(syncPath)) {
      const sql = fsMod.readFileSync(syncPath, "utf8");
      const statements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
      let failed = 0;
      const criticalSyncFailures: string[] = [];
       const criticalOverviewTables = /\b(overview_settings|waste_logs|cash_accounts|cash_ledger_entries|cash_obligations|work_schedules|work_time_entries|employment_exits|loyalty_accounts|loyalty_transactions|zatca_retry_attempts|overview_daily_snapshots|invoice_zatca_status|zatca_xml_archive|promotions|promotion_branches|promotion_targets|order_promotion_applications)\b/;
      for (const stmt of statements) {
        try {
          await pool.query(stmt);
        } catch (err) {
          failed++;
          if (criticalOverviewTables.test(stmt)) criticalSyncFailures.push((err as Error).message);
          console.warn(`[SchemaSync] ${(err as Error).message} -- ${stmt.slice(0, 80)}`);
        }
      }
      if (criticalSyncFailures.length) {
        const criticalError = new Error(`Critical Overview/ZATCA schema sync failed:\n  ${criticalSyncFailures.join("\n  ")}`);
        (criticalError as any).critical = true;
        throw criticalError;
      }
      console.log(`[SchemaSync] ${statements.length} statements applied (${failed} skipped)`);
    } else {
      console.warn("[SchemaSync] server/schema-sync.sql not found; skipping full schema sync");
    }
  } catch (err) {
    if ((err as any).critical) throw err;
    console.warn("[SchemaSync] failed:", (err as Error).message);
  }
})();
