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
      // DB-level invoice finality: once cleared/reported by ZATCA, business fields are frozen
      // (only derived artifacts qr_code/pdf_path may change) and the invoice cannot be deleted.
      "zatca_invoice_finality_fn",
      `CREATE OR REPLACE FUNCTION zatca_invoice_finality() RETURNS trigger AS $fn$
       DECLARE final_status text;
       BEGIN
         SELECT submission_status INTO final_status FROM invoice_zatca_status
           WHERE invoice_id = OLD.id AND restaurant_id = OLD.restaurant_id
             AND submission_status IN ('cleared','reported') LIMIT 1;
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
      // Final ZATCA status rows (cleared/reported) are themselves immutable and undeletable
      "zatca_status_finality_fn",
      `CREATE OR REPLACE FUNCTION zatca_status_finality() RETURNS trigger AS $fn$
       BEGIN
         IF OLD.submission_status IN ('cleared','reported') THEN
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
      `SELECT tgname FROM pg_trigger WHERE tgname IN ('zatca_archive_guard','zatca_invoice_finality_guard','zatca_status_finality_guard')`
    );
    const found = new Set(trg.rows.map((r: any) => r.tgname));
    for (const required of ["zatca_archive_guard", "zatca_invoice_finality_guard", "zatca_status_finality_guard"]) {
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
    console.error("[FATAL] ZATCA compliance controls could not be installed/verified:\n  " + zatcaFailures.join("\n  "));
    process.exit(1);
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
      for (const stmt of statements) {
        try {
          await pool.query(stmt);
        } catch (err) {
          failed++;
          console.warn(`[SchemaSync] ${(err as Error).message} -- ${stmt.slice(0, 80)}`);
        }
      }
      console.log(`[SchemaSync] ${statements.length} statements applied (${failed} skipped)`);
    } else {
      console.warn("[SchemaSync] server/schema-sync.sql not found; skipping full schema sync");
    }
  } catch (err) {
    console.warn("[SchemaSync] failed:", (err as Error).message);
  }
})();
