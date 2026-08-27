ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_platform" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "external_order_id" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "source_platform" text;
CREATE INDEX IF NOT EXISTS "orders_delivery_source_idx" ON "orders" ("restaurant_id","source_platform","created_at");
CREATE INDEX IF NOT EXISTS "invoices_delivery_source_idx" ON "invoices" ("restaurant_id","source_platform","created_at");

CREATE TABLE IF NOT EXISTS "delivery_integrations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "provider" text NOT NULL, "account_name" text NOT NULL, "external_account_id" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT false, "credentials_encrypted" text NOT NULL,
  "config" jsonb NOT NULL, "webhook_token" text NOT NULL, "connection_status" text NOT NULL DEFAULT 'untested',
  "connection_message" text, "last_received_at" timestamp, "last_success_at" timestamp, "last_error_at" timestamp,
  "last_error" text, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now()
);
ALTER TABLE "delivery_integrations" ADD COLUMN IF NOT EXISTS "account_name" text;
ALTER TABLE "delivery_integrations" ADD COLUMN IF NOT EXISTS "external_account_id" text;
UPDATE "delivery_integrations" SET "account_name"=provider || ' (default)' WHERE "account_name" IS NULL OR btrim("account_name")='';
UPDATE "delivery_integrations" SET "external_account_id"=provider || ':legacy:' || id WHERE "external_account_id" IS NULL OR btrim("external_account_id")='';
ALTER TABLE "delivery_integrations" ALTER COLUMN "account_name" SET NOT NULL;
ALTER TABLE "delivery_integrations" ALTER COLUMN "external_account_id" SET NOT NULL;
DROP INDEX IF EXISTS "delivery_integrations_tenant_provider_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_integrations_tenant_provider_account_unique" ON "delivery_integrations" ("restaurant_id","provider","external_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_integrations_webhook_token_unique" ON "delivery_integrations" ("webhook_token");
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_integration_id" varchar;
UPDATE "orders" o SET "delivery_integration_id"=i.id FROM (
 SELECT restaurant_id, provider, min(id) AS id FROM "delivery_integrations"
 GROUP BY restaurant_id, provider HAVING count(*)=1
) i WHERE o.delivery_integration_id IS NULL AND o.restaurant_id=i.restaurant_id
 AND o.source_platform=i.provider AND o.external_order_id IS NOT NULL;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
 WHERE c.contype='f' AND c.conrelid='orders'::regclass AND c.confrelid='delivery_integrations'::regclass AND a.attname='delivery_integration_id') THEN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_integration_fk" FOREIGN KEY ("delivery_integration_id") REFERENCES "delivery_integrations"("id") ON DELETE RESTRICT;
END IF; END $$;
DROP INDEX IF EXISTS "orders_delivery_external_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "orders_delivery_external_unique" ON "orders" ("restaurant_id","delivery_integration_id","external_order_id") WHERE delivery_integration_id IS NOT NULL AND external_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_delivery_legacy_external_unique" ON "orders" ("restaurant_id","source_platform","external_order_id") WHERE delivery_integration_id IS NULL AND source_platform IS NOT NULL AND external_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS "orders_delivery_integration_idx" ON "orders" ("restaurant_id","delivery_integration_id","created_at");

CREATE TABLE IF NOT EXISTS "delivery_integration_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "integration_id" varchar NOT NULL REFERENCES "delivery_integrations"("id") ON DELETE CASCADE, "provider" text NOT NULL,
  "provider_event_id" text NOT NULL, "payload_hash" text NOT NULL, "raw_payload" jsonb NOT NULL, "signature" text NOT NULL,
  "status" text NOT NULL, "attempts" integer NOT NULL DEFAULT 0, "error" text, "order_id" varchar REFERENCES "orders"("id") ON DELETE SET NULL,
  "received_at" timestamp NOT NULL DEFAULT now(), "processed_at" timestamp, "next_retry_at" timestamp, "processing_started_at" timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_events_provider_event_unique" ON "delivery_integration_events" ("integration_id","provider_event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_events_payload_replay_unique" ON "delivery_integration_events" ("integration_id","payload_hash");
CREATE INDEX IF NOT EXISTS "delivery_events_tenant_status_idx" ON "delivery_integration_events" ("restaurant_id","status","received_at");

CREATE TABLE IF NOT EXISTS "delivery_integration_fees" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE RESTRICT,
  "integration_id" varchar NOT NULL REFERENCES "delivery_integrations"("id") ON DELETE RESTRICT,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT, "provider" text NOT NULL,
  "gross" numeric(12,2) NOT NULL, "fee" numeric(12,2) NOT NULL, "commission" numeric(12,2) NOT NULL,
  "net" numeric(12,2) NOT NULL, "source_event_id" varchar NOT NULL REFERENCES "delivery_integration_events"("id") ON DELETE RESTRICT,
  "captured_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "delivery_fees_reconciliation_check" CHECK ("gross" = "fee" + "commission" + "net")
);
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_fees_order_unique" ON "delivery_integration_fees" ("order_id");
CREATE INDEX IF NOT EXISTS "delivery_fees_tenant_provider_date_idx" ON "delivery_integration_fees" ("restaurant_id","provider","captured_at");
CREATE OR REPLACE FUNCTION delivery_financial_snapshot_immutable() RETURNS trigger AS $fn$
BEGIN RAISE EXCEPTION 'delivery financial snapshots are immutable; issue a correction document'; END $fn$ LANGUAGE plpgsql;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='delivery_fees_immutable') THEN
  CREATE TRIGGER delivery_fees_immutable BEFORE UPDATE OR DELETE ON delivery_integration_fees
  FOR EACH ROW EXECUTE FUNCTION delivery_financial_snapshot_immutable();
END IF; END $$;
CREATE OR REPLACE FUNCTION delivery_order_snapshot_guard() RETURNS trigger AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM delivery_integration_fees WHERE order_id=OLD.id) THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'delivery order financial snapshot is immutable; issue a correction document'; END IF;
    IF NEW.items IS DISTINCT FROM OLD.items OR NEW.subtotal IS DISTINCT FROM OLD.subtotal OR
       NEW.tax IS DISTINCT FROM OLD.tax OR NEW.total IS DISTINCT FROM OLD.total OR
       NEW.delivery_integration_id IS DISTINCT FROM OLD.delivery_integration_id OR
       NEW.source_platform IS DISTINCT FROM OLD.source_platform OR NEW.external_order_id IS DISTINCT FROM OLD.external_order_id THEN
      RAISE EXCEPTION 'delivery order financial fields are immutable; issue a correction document';
    END IF;
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='delivery_order_snapshot_guard') THEN
  CREATE TRIGGER delivery_order_snapshot_guard BEFORE UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION delivery_order_snapshot_guard();
END IF; END $$;

CREATE TABLE IF NOT EXISTS "delivery_status_syncs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "integration_id" varchar NOT NULL REFERENCES "delivery_integrations"("id") ON DELETE CASCADE,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE, "status" text NOT NULL, "direction" text NOT NULL,
  "state" text NOT NULL, "attempts" integer NOT NULL DEFAULT 0, "error" text, "created_at" timestamp NOT NULL DEFAULT now(), "sent_at" timestamp, "next_retry_at" timestamp, "processing_started_at" timestamp
);
ALTER TABLE "delivery_status_syncs" ADD COLUMN IF NOT EXISTS "next_retry_at" timestamp;
ALTER TABLE "delivery_status_syncs" ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp;
ALTER TABLE "delivery_integration_events" ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp;
CREATE INDEX IF NOT EXISTS "delivery_status_sync_tenant_order_idx" ON "delivery_status_syncs" ("restaurant_id","order_id","created_at");
CREATE TABLE IF NOT EXISTS "delivery_integration_alerts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "integration_id" varchar NOT NULL REFERENCES "delivery_integrations"("id") ON DELETE CASCADE, "kind" text NOT NULL,
  "message" text NOT NULL, "active" boolean NOT NULL DEFAULT true, "first_detected_at" timestamp NOT NULL DEFAULT now(),
  "last_detected_at" timestamp NOT NULL DEFAULT now(), "resolved_at" timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_alert_active_unique" ON "delivery_integration_alerts" ("integration_id","kind");
CREATE INDEX IF NOT EXISTS "delivery_alert_tenant_active_idx" ON "delivery_integration_alerts" ("restaurant_id","active","last_detected_at");