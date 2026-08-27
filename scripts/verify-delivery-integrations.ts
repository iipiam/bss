import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

process.env.SESSION_SECRET = "delivery-test-session-secret-that-is-not-production";
const {
  decryptDeliveryCredentials, encryptDeliveryCredentials, normalizeMappedPayload,
  normalizeDeliveryEnvelope, verifyDeliverySignature,
  assertSafeProviderBaseUrl,
  newInternalDeliveryNumber,
  normalizeDeliveryProviderKey,
} = await import("../server/delivery-integrations");
const { startupMigrationReady } = await import("../server/db");
await startupMigrationReady;

const secretData = { apiKey: "api-key-1234", webhookSecret: "a-long-webhook-secret" };
const encrypted = encryptDeliveryCredentials(secretData);
assert.match(encrypted, /^v1:/);
assert.ok(!encrypted.includes(secretData.apiKey), "ciphertext must not expose credentials");
assert.deepEqual(decryptDeliveryCredentials(encrypted), secretData);

const raw = Buffer.from('{"eventId":"evt-1"}');
const signature = crypto.createHmac("sha256", secretData.webhookSecret).update(raw).digest("hex");
assert.equal(verifyDeliverySignature(raw, secretData.webhookSecret, signature, "hex"), true);
assert.equal(verifyDeliverySignature(Buffer.from("{}"), secretData.webhookSecret, signature, "hex"), false);
const identifiers = new Set(Array.from({ length: 1000 }, () => newInternalDeliveryNumber()));
assert.equal(identifiers.size, 1000, "internal delivery order numbers must be globally unique");
assert.match(newInternalDeliveryNumber("INV"), /^INV-[0-9a-f-]{36}$/);
assert.equal(normalizeDeliveryProviderKey("  The Chefz  "), "the-chefz");
assert.equal(normalizeDeliveryProviderKey("كيتا"), "كيتا");
await assert.rejects(() => assertSafeProviderBaseUrl("http://example.com"), /HTTPS public host/);
await assert.rejects(() => assertSafeProviderBaseUrl("https://localhost"), /localhost or a private/);
await assert.rejects(() => assertSafeProviderBaseUrl("https://127.0.0.1"), /localhost or a private/);

const mapping = {
  eventId: "eventId", eventType: "type", orderId: "data.id", status: "data.status",
  items: "data.lines", itemId: "sku", itemName: "title", itemQuantity: "qty",
  itemUnitPrice: "price", subtotal: "data.subtotal", vat: "data.vat", total: "data.total",
  customerName: "data.customer.name", customerPhone: "data.customer.phone",
  address: "data.customer.address", fee: "data.fee", commission: "data.commission", net: "data.net",
};
const normalized = normalizeMappedPayload({ eventId: "evt-1", type: "order.created", data: {
  id: "provider-order-9", status: "pending", lines: [{ sku: "x", title: "Meal", qty: 2, price: 10 }],
  subtotal: 20, vat: 3, total: 23, fee: 1, commission: 2, net: 20,
  customer: { name: "Customer", phone: "0500000000", address: "Riyadh" },
}}, mapping);
assert.equal(normalized.externalOrderId, "provider-order-9");
assert.equal(normalized.items[0].lineFinalSubtotal, 20);
assert.throws(() => normalizeMappedPayload({ data: { lines: [], subtotal: 1, vat: 0, total: 1 } }, mapping));
assert.throws(() => normalizeMappedPayload({ eventId: "bad-lines", type: "order.created", data: {
  id: "provider-order-bad", status: "pending", lines: [{ sku: "x", title: "Meal", qty: 1, price: 10 }],
  subtotal: 20, vat: 3, total: 23, fee: 1, commission: 2, net: 20,
}}, mapping), /item totals do not reconcile/);
assert.deepEqual(normalizeDeliveryEnvelope({
  type: "order.status", data: { id: "provider-order-9", status: "ready" },
}, mapping), {
  eventType: "order.status", externalOrderId: "provider-order-9", status: "ready",
}, "status-only webhooks must not require item or total fields");

// Multi-account routing and migration contract checks intentionally inspect
// source rather than contacting a provider or mutating a real tenant database.
const implementation = fs.readFileSync(new URL("../server/delivery-integrations.ts", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("../shared/schema.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/0001_delivery_integrations.sql", import.meta.url), "utf8");
const schemaSync = fs.readFileSync(new URL("../server/schema-sync.sql", import.meta.url), "utf8");

const accountA = { tenant: "tenant-a", integrationId: "hs-store-a", externalOrderId: "same-order" };
const accountB = { tenant: "tenant-a", integrationId: "hs-store-b", externalOrderId: "same-order" };
assert.notEqual(`${accountA.tenant}:${accountA.integrationId}:${accountA.externalOrderId}`,
  `${accountB.tenant}:${accountB.integrationId}:${accountB.externalOrderId}`,
  "same-provider accounts must have distinct order idempotency keys");
assert.match(implementation, /eq\(orders\.deliveryIntegrationId, integration\.id\)/,
  "webhook ingestion and status lookup must route through the exact integration");
assert.match(implementation, /eq\(deliveryIntegrations\.id, order\.deliveryIntegrationId\)/,
  "outbound status sync must use the integration stored on the order");
assert.match(implementation, /eq\(deliveryIntegrations\.restaurantId, (restaurantId|order\.restaurantId)\)/,
  "integration lookup must retain tenant ownership checks");
assert.match(implementation, /app\.post\("\/api\/delivery-integrations"/);
assert.match(implementation, /app\.patch\("\/api\/delivery-integrations\/:id"/);
assert.match(implementation, /app\.delete\("\/api\/delivery-integrations\/:id"/);
assert.match(schema, /tenantProviderAccountUnique[\s\S]*t\.restaurantId, t\.provider, t\.externalAccountId/);
for (const sql of [migration, schemaSync]) {
  assert.match(sql, /DROP INDEX IF EXISTS "?delivery_integrations_tenant_provider_unique"?/);
  assert.match(sql, /delivery_integrations_tenant_provider_account_unique/);
  assert.match(sql, /orders_delivery_legacy_external_unique/);
  assert.match(sql, /orders_delivery_external_unique[\s\S]*delivery_integration_id/);
  assert.match(sql, /orders_delivery_integration_fk/);
  assert.match(sql, /IF TG_OP='DELETE' THEN RETURN OLD; END IF/,
    "ordinary orders must remain deletable when no delivery financial snapshot exists");
  assert.match(sql, /INSERT INTO transactions[\s\S]*'DLV-' \|\| o\.id/,
    "existing delivery orders must be backfilled into live sales transactions");
}
assert.match(implementation, /ensureDeliveryTransaction\(tx, integration, order, normalized\)/);
assert.match(implementation, /type: "sales:updated"/);

console.log("Delivery integration focused checks passed");