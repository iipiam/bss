import crypto from "crypto";
import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import type { Express, RequestHandler } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  deliveryApps, deliveryIntegrationEvents, deliveryIntegrationFees, deliveryIntegrations,
  deliveryStatusSyncs, deliveryIntegrationAlerts, invoices, orders,
} from "@shared/schema";
import { processInvoiceZatcaIdempotently } from "./zatca/orchestration";

export const DELIVERY_PROVIDERS = {
  hungerstation: { name: "HungerStation", credentialFields: ["apiKey", "apiSecret", "webhookSecret", "merchantId"] },
  jahez: { name: "Jahez", credentialFields: ["apiKey", "apiSecret", "webhookSecret", "merchantId"] },
} as const;
type DeliveryProviderMetadata = { name: string; credentialFields: readonly string[] };

export function normalizeDeliveryProviderKey(name: string) {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

async function deliveryProviderCatalog(restaurantId: string): Promise<Record<string, DeliveryProviderMetadata>> {
  const catalog: Record<string, DeliveryProviderMetadata> = { ...DELIVERY_PROVIDERS };
  const apps = await db.select({ name: deliveryApps.name }).from(deliveryApps)
    .where(eq(deliveryApps.restaurantId, restaurantId));
  for (const app of apps) {
    const key = normalizeDeliveryProviderKey(app.name);
    if (!key) continue;
    catalog[key] ??= {
      name: app.name.trim(),
      credentialFields: ["apiKey", "apiSecret", "webhookSecret", "merchantId"],
    };
  }
  return catalog;
}

const mappingSchema = z.object({
  eventId: z.string().default("eventId"), eventType: z.string().default("eventType"),
  orderId: z.string().default("order.id"), status: z.string().default("order.status"),
  items: z.string().default("order.items"), itemId: z.string().default("id"),
  itemName: z.string().default("name"), itemQuantity: z.string().default("quantity"),
  itemUnitPrice: z.string().default("unitPrice"), subtotal: z.string().default("order.subtotal"),
  vat: z.string().default("order.vat"), total: z.string().default("order.total"),
  customerName: z.string().default("order.customer.name"), customerPhone: z.string().default("order.customer.phone"),
  address: z.string().default("order.customer.address"), fee: z.string().default("order.fee"),
  commission: z.string().default("order.commission"), net: z.string().default("order.net"),
}).strict();

const configSchema = z.object({
  apiBaseUrl: z.string().url().optional(), testPath: z.string().startsWith("/").optional(),
  statusPathTemplate: z.string().startsWith("/").optional(),
  apiKeyHeader: z.string().min(1).default("authorization"),
  apiKeyPrefix: z.string().default("Bearer "),
  apiSecretHeader: z.string().min(1).default("x-api-secret"),
  merchantIdHeader: z.string().min(1).default("x-merchant-id"),
  signatureHeader: z.string().default("x-delivery-signature"),
  eventIdHeader: z.string().default("x-delivery-event-id"),
  signatureEncoding: z.enum(["hex", "base64"]).default("hex"),
  signaturePrefix: z.string().optional(), silentAfterMinutes: z.number().int().min(5).max(10080).default(120),
  mapping: mappingSchema.optional(),
}).strict();
const credentialsSchema = z.object({
  apiKey: z.string().min(1).optional(), apiSecret: z.string().min(1).optional(),
  webhookSecret: z.string().min(16), merchantId: z.string().min(1).optional(),
}).strict();
const createSchema = z.object({
  provider: z.string().trim().min(1).max(120),
  accountName: z.string().trim().min(1).max(120).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  externalAccountId: z.string().trim().min(1).max(255).optional(),
  storeId: z.string().trim().min(1).max(255).optional(),
  enabled: z.boolean(), credentials: credentialsSchema, config: configSchema,
}).strict().refine(value => !!(value.accountName || value.displayName), {
  message: "accountName (or displayName) is required",
}).refine(value => !value.accountName || !value.displayName || value.accountName === value.displayName, {
  message: "accountName and displayName must match when both are supplied",
}).refine(value => !!(value.externalAccountId || value.storeId), {
  message: "externalAccountId (or storeId) is required",
}).refine(value => !value.externalAccountId || !value.storeId || value.externalAccountId === value.storeId, {
  message: "externalAccountId and storeId must match when both are supplied",
});
const updateSchema = z.object({
  accountName: z.string().trim().min(1).max(120).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  externalAccountId: z.string().trim().min(1).max(255).optional(),
  storeId: z.string().trim().min(1).max(255).optional(),
  enabled: z.boolean().optional(), credentials: credentialsSchema.optional(), config: configSchema.optional(),
}).strict().refine(value => !value.accountName || !value.displayName || value.accountName === value.displayName, {
  message: "accountName and displayName must match when both are supplied",
}).refine(value => !value.externalAccountId || !value.storeId || value.externalAccountId === value.storeId, {
  message: "externalAccountId and storeId must match when both are supplied",
});

function privateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113);
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  const first = Number.parseInt(v.split(":")[0] || "0", 16);
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") ||
    (first >= 0xfe80 && first <= 0xfebf) || first >= 0xff00 ||
    v.startsWith("2001:db8:") || first < 0x2000 || first > 0x3fff;
}
/** Reject SSRF destinations on both persistence and every outbound request. */
export async function assertSafeProviderBaseUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Provider API URL must be an HTTPS public host without credentials or a custom port");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || net.isIP(host) && privateIp(host)) throw new Error("Provider API URL cannot target localhost or a private address");
  const addresses = await dns.lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(a => privateIp(a.address))) throw new Error("Provider API host must resolve only to public IP addresses");
  return url;
}
async function safeProviderUrl(base: string, path: string) {
  const validated = await assertSafeProviderBaseUrl(base);
  const target = new URL(path, validated);
  if (target.origin !== validated.origin) throw new Error("Provider path must not change the configured API origin");
  const addresses = await dns.lookup(target.hostname, { all: true, verbatim: true });
  const address = addresses.find(candidate => !privateIp(candidate.address));
  if (!address || addresses.some(candidate => privateIp(candidate.address))) {
    throw new Error("Provider API host must resolve only to public IP addresses");
  }
  return { target, address: address.address, family: address.family };
}
async function providerRequest(
  base: string,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  const { target, address, family } = await safeProviderUrl(base, path);
  return new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
    const request = https.request({
      protocol: "https:",
      hostname: address,
      family,
      port: 443,
      path: `${target.pathname}${target.search}`,
      method: options.method || "GET",
      servername: target.hostname,
      headers: { host: target.host, ...(options.headers || {}) },
      timeout: 10_000,
      // Connecting to the already-validated address prevents DNS rebinding.
      lookup: (_hostname, _options, callback) => callback(null, address, family),
    }, response => {
      response.resume();
      resolve({ ok: !!response.statusCode && response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode || 0 });
    });
    request.on("timeout", () => request.destroy(new Error("Provider request timed out")));
    request.on("error", reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}
function providerHeaders(config: any, credentials: Record<string, string>) {
  return {
    ...(credentials.apiKey ? { [config.apiKeyHeader || "authorization"]: `${config.apiKeyPrefix ?? "Bearer "}${credentials.apiKey}` } : {}),
    ...(credentials.apiSecret ? { [config.apiSecretHeader || "x-api-secret"]: credentials.apiSecret } : {}),
    ...(credentials.merchantId ? { [config.merchantIdHeader || "x-merchant-id"]: credentials.merchantId } : {}),
  };
}
function retryAt(attempts: number) { return new Date(Date.now() + Math.min(3600, 2 ** attempts * 30) * 1000); }
export function newInternalDeliveryNumber(prefix: "DLV" | "INV" = "DLV") {
  return `${prefix}-${crypto.randomUUID()}`;
}

let workerTimer: NodeJS.Timeout | undefined;
let workerRunning = false;
async function backfillDecryptedExternalAccountIds() {
  const legacy = await db.select().from(deliveryIntegrations).where(
    sql`${deliveryIntegrations.externalAccountId} = ${deliveryIntegrations.provider} || ':legacy:' || ${deliveryIntegrations.id}`,
  );
  for (const integration of legacy) {
    try {
      const merchantId = decryptDeliveryCredentials(integration.credentialsEncrypted).merchantId?.trim();
      if (!merchantId) continue;
      await db.update(deliveryIntegrations).set({ externalAccountId: merchantId, updatedAt: new Date() }).where(and(
        eq(deliveryIntegrations.id, integration.id),
        eq(deliveryIntegrations.restaurantId, integration.restaurantId),
        eq(deliveryIntegrations.externalAccountId, integration.externalAccountId),
      ));
    } catch {
      // Keep the deterministic migration fallback when old credentials cannot
      // be decrypted; never log or return credential material.
    }
  }
}
async function upsertAlert(integration: any, kind: string, message: string, active: boolean) {
  if (active) {
    await db.insert(deliveryIntegrationAlerts).values({ restaurantId: integration.restaurantId, integrationId: integration.id, kind, message })
      .onConflictDoUpdate({ target: [deliveryIntegrationAlerts.integrationId, deliveryIntegrationAlerts.kind], set: { active: true, message, lastDetectedAt: new Date(), resolvedAt: null } });
  } else {
    await db.update(deliveryIntegrationAlerts).set({ active: false, resolvedAt: new Date(), lastDetectedAt: new Date() })
      .where(and(eq(deliveryIntegrationAlerts.integrationId, integration.id), eq(deliveryIntegrationAlerts.kind, kind), eq(deliveryIntegrationAlerts.active, true)));
  }
}
async function deliveryWorkerSweep() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    const integrations = await db.select().from(deliveryIntegrations).where(eq(deliveryIntegrations.enabled, true));
    for (const integration of integrations) {
      const silent = !integration.lastReceivedAt || Date.now() - new Date(integration.lastReceivedAt).getTime() > Number((integration.config as any)?.silentAfterMinutes || 120) * 60000;
      await upsertAlert(integration, "silent_webhook", "No webhook received within configured health window", silent);
      const [deadInbound] = await db.select({ id: deliveryIntegrationEvents.id }).from(deliveryIntegrationEvents)
        .where(and(eq(deliveryIntegrationEvents.integrationId, integration.id), eq(deliveryIntegrationEvents.status, "dead_letter"))).limit(1);
      await upsertAlert(integration, "inbound_dead_letter", "One or more inbound delivery events require attention", !!deadInbound);
      const [deadOutbound] = await db.select({ id: deliveryStatusSyncs.id }).from(deliveryStatusSyncs)
        .where(and(eq(deliveryStatusSyncs.integrationId, integration.id), eq(deliveryStatusSyncs.state, "dead_letter"))).limit(1);
      await upsertAlert(integration, "outbound_dead_letter", "One or more outbound delivery status syncs require attention", !!deadOutbound);
    }
    // Atomically claim outbound work so multiple app processes never send the
    // same status update concurrently. The endpoint remains configured by the
    // tenant; this code does not assume a provider route.
    const claims = await db.execute(sql`WITH due AS (
      SELECT s.id FROM delivery_status_syncs s WHERE
        (s.state='failed' AND s.next_retry_at <= now()) OR
        (s.state='processing' AND s.processing_started_at < now() - interval '5 minutes')
      ORDER BY s.created_at FOR UPDATE SKIP LOCKED LIMIT 25
    ) UPDATE delivery_status_syncs s SET state='processing', processing_started_at=now() FROM due WHERE s.id=due.id
       RETURNING s.*, (SELECT row_to_json(i) FROM delivery_integrations i
         WHERE i.id=s.integration_id AND i.restaurant_id=s.restaurant_id) AS integration,
       (SELECT external_order_id FROM orders o WHERE o.id=s.order_id
         AND o.restaurant_id=s.restaurant_id AND o.delivery_integration_id=s.integration_id) AS "externalOrderId"`);
    for (const sync of (claims as any).rows || []) {
      try {
        if (!sync.integration || !sync.externalOrderId) throw new Error("Delivery sync tenant/integration ownership mismatch");
        const config: any = sync.integration.config; const creds = decryptDeliveryCredentials(sync.integration.credentials_encrypted);
        if (!config.apiBaseUrl || !config.statusPathTemplate) throw new Error("Outbound status endpoint is not configured");
        const response = await providerRequest(config.apiBaseUrl, config.statusPathTemplate.replace("{orderId}", encodeURIComponent(sync.externalOrderId)), {
          method: "POST", headers: { "content-type": "application/json", ...providerHeaders(config, creds) }, body: JSON.stringify({ status: sync.status }),
        });
        if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
        await db.update(deliveryStatusSyncs).set({ state: "sent", sentAt: new Date(), processingStartedAt: null }).where(eq(deliveryStatusSyncs.id, sync.id));
        await db.update(orders).set({ status: inboundStatuses[sync.status] }).where(and(
          eq(orders.id, sync.order_id),
          eq(orders.restaurantId, sync.restaurant_id),
           eq(orders.deliveryIntegrationId, sync.integration_id),
        ));
      } catch (error: any) {
        const attempts = Number(sync.attempts) + 1;
        await db.update(deliveryStatusSyncs).set({ state: attempts >= 5 ? "dead_letter" : "failed", attempts, error: error.message, nextRetryAt: attempts >= 5 ? null : retryAt(attempts), processingStartedAt: null }).where(eq(deliveryStatusSyncs.id, sync.id));
      }
    }
    const dueInbound = await db.execute(sql`WITH due AS (
      SELECT id FROM delivery_integration_events WHERE
        (status='failed' AND next_retry_at <= now()) OR
        (status='processing' AND processing_started_at < now() - interval '5 minutes')
      ORDER BY received_at FOR UPDATE SKIP LOCKED LIMIT 25
    ) UPDATE delivery_integration_events e SET status='processing', processing_started_at=now() FROM due WHERE e.id=due.id RETURNING e.*`);
    for (const event of (dueInbound as any).rows || []) {
       const [integration] = await db.select().from(deliveryIntegrations).where(and(
         eq(deliveryIntegrations.id, event.integration_id),
         eq(deliveryIntegrations.restaurantId, event.restaurant_id),
       )).limit(1);
      if (!integration) continue;
      try {
        const config: any = integration.config;
        if (!config.mapping) throw new Error("Payload mapping is not configured");
        const envelope = normalizeDeliveryEnvelope(event.raw_payload, config.mapping);
        if (!envelope.externalOrderId) throw new Error("Mapped external order ID is required");
        if (envelope.eventType.includes("status")) {
          const inboundStatus = inboundStatuses[String(envelope.status).toLowerCase()];
          if (!inboundStatus) throw new Error("Unsupported inbound delivery status");
          const [updated] = await db.update(orders).set({ status: inboundStatus }).where(and(
            eq(orders.restaurantId, integration.restaurantId),
             eq(orders.deliveryIntegrationId, integration.id),
            eq(orders.externalOrderId, envelope.externalOrderId),
          )).returning();
          if (!updated) throw new Error("Status event references an unknown delivery order");
          await db.update(deliveryIntegrationEvents).set({
            status: "processed", processedAt: new Date(), orderId: updated.id, error: null, processingStartedAt: null,
          }).where(eq(deliveryIntegrationEvents.id, event.id));
          continue;
        }
        const n = normalizeMappedPayload(event.raw_payload, config.mapping);
        const result = await db.transaction(async tx => {
          await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`delivery:${integration.id}:${n.externalOrderId}`}, 0))`);
           const [existing] = await tx.select().from(orders).where(and(eq(orders.restaurantId, integration.restaurantId), eq(orders.deliveryIntegrationId, integration.id), eq(orders.externalOrderId, n.externalOrderId))).limit(1);
          if (existing) return { order: existing, invoice: null };
           const [order] = await tx.insert(orders).values({ restaurantId: integration.restaurantId, orderNumber: newInternalDeliveryNumber(), orderType: "Delivery", customerName: n.customerName, customerPhone: n.customerPhone, address: n.address, sourcePlatform: integration.provider, deliveryIntegrationId: integration.id, externalOrderId: n.externalOrderId, items: n.items, subtotal: n.subtotal.toFixed(2), tax: n.vat.toFixed(2), total: n.total.toFixed(2), paymentMethod: "Online", paymentStatus: "Paid", status: inboundStatuses[String(n.status || "pending").toLowerCase()] || "Pending" }).returning();
          const [invoice] = await tx.insert(invoices).values({ restaurantId: integration.restaurantId, invoiceNumber: newInternalDeliveryNumber("INV"), invoiceType: "simplified", orderId: order.id, sourcePlatform: integration.provider, customerName: n.customerName, items: n.items.map(i => ({ name: i.name, quantity: i.quantity, basePrice: i.lineFinalSubtotal, vatAmount: n.subtotal ? n.vat * i.lineFinalSubtotal / n.subtotal : 0, total: i.lineFinalSubtotal + (n.subtotal ? n.vat * i.lineFinalSubtotal / n.subtotal : 0) })), subtotal: n.subtotal.toFixed(2), vatAmount: n.vat.toFixed(2), total: n.total.toFixed(2) }).returning();
          if (Math.abs(n.total - n.fee - n.commission - n.net) > .02) throw new Error("Gross value does not reconcile to fee + commission + net");
          await tx.insert(deliveryIntegrationFees).values({ restaurantId: integration.restaurantId, integrationId: integration.id, orderId: order.id, provider: integration.provider, gross: n.total.toFixed(2), fee: n.fee.toFixed(2), commission: n.commission.toFixed(2), net: n.net.toFixed(2), sourceEventId: event.id });
          return { order, invoice };
        });
        await db.update(deliveryIntegrationEvents).set({ status: "processed", processedAt: new Date(), orderId: result.order.id, error: null, processingStartedAt: null }).where(eq(deliveryIntegrationEvents.id, event.id));
        await db.update(deliveryIntegrations).set({ lastSuccessAt: new Date(), lastReceivedAt: new Date(), lastError: null }).where(eq(deliveryIntegrations.id, integration.id));
        if (result.invoice) void submitZatcaForDelivery(result.invoice, result.order);
      } catch (error: any) {
        const attempts = Number(event.attempts) + 1;
        await db.update(deliveryIntegrationEvents).set({ status: attempts >= 5 ? "dead_letter" : "failed", attempts, error: error.message, nextRetryAt: attempts >= 5 ? null : retryAt(attempts), processingStartedAt: null }).where(eq(deliveryIntegrationEvents.id, event.id));
      }
    }
  } finally { workerRunning = false; }
}
export function startDeliveryIntegrationWorker() {
  if (workerTimer) return;
  void backfillDecryptedExternalAccountIds()
    .then(() => deliveryWorkerSweep())
    .catch(error => console.error("[Delivery] worker sweep failed:", error));
  workerTimer = setInterval(() => void deliveryWorkerSweep().catch(error => console.error("[Delivery] worker sweep failed:", error)), 60_000);
  workerTimer.unref();
}

/**
 * Queue a supported local delivery-order status change for provider sync.
 * Local order updates never fail because a provider is unavailable; delivery
 * sync failures stay in the independent retry/dead-letter queue.
 */
export async function queueDeliveryOrderStatusSync(restaurantId: string, orderId: string, localStatus: string) {
  const status = outboundStatuses[localStatus];
  if (!status) return { queued: false, reason: "unsupported_status" };
  const [order] = await db.select().from(orders).where(and(
    eq(orders.id, orderId),
    eq(orders.restaurantId, restaurantId),
  )).limit(1);
  if (!order?.deliveryIntegrationId || !order.externalOrderId) return { queued: false, reason: "not_delivery_order" };
  const [integration] = await db.select().from(deliveryIntegrations).where(and(
    eq(deliveryIntegrations.id, order.deliveryIntegrationId),
    eq(deliveryIntegrations.restaurantId, restaurantId),
    eq(deliveryIntegrations.enabled, true),
  )).limit(1);
  const config: any = integration?.config;
  if (!integration || !config.apiBaseUrl || !config.statusPathTemplate) {
    return { queued: false, reason: "status_sync_not_configured" };
  }
  const [sync] = await db.insert(deliveryStatusSyncs).values({
    restaurantId, integrationId: integration.id, orderId, status,
    direction: "outbound", state: "failed", nextRetryAt: new Date(),
  }).returning();
  return { queued: true, syncId: sync.id };
}

function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for delivery credential encryption");
  return crypto.scryptSync(secret, "delivery-integrations-v1", 32);
}
export function encryptDeliveryCredentials(value: Record<string, string>) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}
export function decryptDeliveryCredentials(value: string): Record<string, string> {
  const [version, iv, tag, data] = value.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unsupported encrypted delivery credential format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8"));
}
function mask(value?: string) {
  return value ? `${"•".repeat(8)}${value.slice(-4)}` : undefined;
}
function safeIntegration(row: any, baseUrl: string) {
  let credentials: Record<string, string> = {};
  try { credentials = decryptDeliveryCredentials(row.credentialsEncrypted); } catch { /* expose status, never secret */ }
  return {
    id: row.id, provider: row.provider, accountName: row.accountName, externalAccountId: row.externalAccountId,
    enabled: row.enabled, connectionStatus: row.connectionStatus,
    connectionMessage: row.connectionMessage, config: row.config, lastReceivedAt: row.lastReceivedAt,
    lastSuccessAt: row.lastSuccessAt, lastErrorAt: row.lastErrorAt, lastError: row.lastError,
    credentials: Object.fromEntries(Object.entries(credentials).map(([k, v]) => [k, mask(v)])),
    webhookUrl: `${baseUrl}/api/webhooks/delivery/${row.webhookToken}`,
  };
}
function getPath(value: any, path: string): any {
  return path.split(".").reduce((current, key) => current == null ? undefined : current[key], value);
}
export function normalizeMappedPayload(payload: any, mappingInput: unknown) {
  const m = mappingSchema.parse(mappingInput);
  const rawItems = getPath(payload, m.items);
  if (!Array.isArray(rawItems) || !rawItems.length) throw new Error("Mapped items must be a non-empty array");
  const items = rawItems.map((item, index) => {
    const quantity = Number(getPath(item, m.itemQuantity));
    const unitPrice = Number(getPath(item, m.itemUnitPrice));
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Invalid quantity or unit price at item ${index}`);
    }
    return { id: String(getPath(item, m.itemId) ?? `external-${index}`), name: String(getPath(item, m.itemName) ?? ""),
      quantity, price: unitPrice, lineFinalSubtotal: quantity * unitPrice };
  });
  const subtotal = Number(getPath(payload, m.subtotal));
  const vat = Number(getPath(payload, m.vat));
  const total = Number(getPath(payload, m.total));
  if (![subtotal, vat, total].every(Number.isFinite) || subtotal < 0 || vat < 0 || total < 0 ||
      Math.abs(subtotal + vat - total) > .02) throw new Error("Invalid or unreconciled mapped totals");
  const itemSubtotal = items.reduce((sum, item) => sum + item.lineFinalSubtotal, 0);
  if (Math.abs(itemSubtotal - subtotal) > .02) {
    throw new Error("Mapped item totals do not reconcile to the declared subtotal");
  }
  return {
    eventId: String(getPath(payload, m.eventId) ?? ""), eventType: String(getPath(payload, m.eventType) ?? "order.created"),
    externalOrderId: String(getPath(payload, m.orderId) ?? ""), status: getPath(payload, m.status),
    customerName: getPath(payload, m.customerName), customerPhone: getPath(payload, m.customerPhone),
    address: getPath(payload, m.address), items, subtotal, vat, total,
    fee: Number(getPath(payload, m.fee) ?? 0), commission: Number(getPath(payload, m.commission) ?? 0),
    net: Number(getPath(payload, m.net) ?? total - Number(getPath(payload, m.fee) ?? 0) - Number(getPath(payload, m.commission) ?? 0)),
  };
}
export function normalizeDeliveryEnvelope(payload: any, mappingInput: unknown) {
  const mapping = mappingSchema.parse(mappingInput);
  return {
    eventType: String(getPath(payload, mapping.eventType) ?? "order.created").toLowerCase(),
    externalOrderId: String(getPath(payload, mapping.orderId) ?? ""),
    status: getPath(payload, mapping.status),
  };
}
export function verifyDeliverySignature(raw: Buffer, secret: string, supplied: string, encoding: "hex" | "base64", prefix?: string) {
  const expected = crypto.createHmac("sha256", secret).update(raw).digest(encoding);
  const actual = prefix && supplied.startsWith(prefix) ? supplied.slice(prefix.length) : supplied;
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const outboundStatuses: Record<string, string> = {
  Accepted: "accepted", Preparing: "preparing", Ready: "ready", "Out for Delivery": "out_for_delivery",
  accepted: "accepted", preparing: "preparing", ready: "ready", out_for_delivery: "out_for_delivery",
};
const inboundStatuses: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", preparing: "Preparing", ready: "Ready",
  out_for_delivery: "Out for Delivery", delivered: "Completed", cancelled: "Cancelled",
};

async function submitZatcaForDelivery(invoice: any, order: any) {
  try {
    await processInvoiceZatcaIdempotently({
      restaurantId: order.restaurantId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber,
      invoiceType: "simplified", paymentMethod: "card", subtotal: Number(order.subtotal),
      vatAmount: Number(order.tax), total: Number(order.total), discount: Number(order.discountAmount || 0),
      items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.price, totalAmount: i.lineFinalSubtotal })),
      customerName: order.customerName || undefined,
    });
  } catch (error) {
    // Deliberately only ZATCA's own flow records this. Delivery event remains successfully ingested.
    console.error("[ZATCA] Delivery invoice submission deferred:", error);
  }
}

export function registerDeliveryIntegrationRoutes(app: Express, requireAuth: RequestHandler, requireRestaurant: RequestHandler) {
  const admin: RequestHandler = (req: any, res, next) => req.session?.user?.role === "admin" ? next() : res.status(403).json({ error: "Admin access required" });
  app.get("/api/delivery-integrations/providers", requireAuth, requireRestaurant, async (req: any, res) => {
    res.json(await deliveryProviderCatalog(req.session.user.restaurantId));
  });
  app.get("/api/delivery-integrations", requireAuth, requireRestaurant, async (req: any, res) => {
    await backfillDecryptedExternalAccountIds();
    const rows = await db.select().from(deliveryIntegrations).where(eq(deliveryIntegrations.restaurantId, req.session.user.restaurantId));
    const base = `${req.protocol}://${req.get("host")}`;
    res.json(rows.map(row => safeIntegration(row, base)));
  });
  app.post("/api/delivery-integrations", requireAuth, requireRestaurant, admin, async (req: any, res) => {
    try {
      const input = createSchema.parse(req.body);
      const providers = await deliveryProviderCatalog(req.session.user.restaurantId);
      if (!providers[input.provider]) {
        return res.status(400).json({ error: "Select a delivery app configured in Delivery Apps" });
      }
      if (input.config.apiBaseUrl) await assertSafeProviderBaseUrl(input.config.apiBaseUrl);
      const [saved] = await db.insert(deliveryIntegrations).values({
        restaurantId: req.session.user.restaurantId, provider: input.provider,
        accountName: input.accountName || input.displayName!, externalAccountId: input.externalAccountId || input.storeId!,
        enabled: input.enabled, credentialsEncrypted: encryptDeliveryCredentials(input.credentials),
        config: input.config, webhookToken: crypto.randomBytes(24).toString("base64url"),
        connectionStatus: "untested", connectionMessage: "Connection has not been tested",
      }).returning();
      res.status(201).json(safeIntegration(saved, `${req.protocol}://${req.get("host")}`));
    } catch (error: any) {
      res.status(error?.code === "23505" ? 409 : 400).json({ error: error?.code === "23505" ? "That provider account already exists" : error.message || "Invalid integration configuration" });
    }
  });
  const updateIntegration: RequestHandler = async (req: any, res) => {
    try {
      const input = updateSchema.parse(req.body);
      const [existing] = await db.select().from(deliveryIntegrations).where(and(
        eq(deliveryIntegrations.id, req.params.id),
        eq(deliveryIntegrations.restaurantId, req.session.user.restaurantId),
      )).limit(1);
      if (!existing) return res.status(404).json({ error: "Integration not found" });
      if (input.config?.apiBaseUrl) await assertSafeProviderBaseUrl(input.config.apiBaseUrl);
      const externalAccountId = input.externalAccountId || input.storeId;
      const [saved] = await db.update(deliveryIntegrations).set({
        ...(input.accountName !== undefined || input.displayName !== undefined ? { accountName: input.accountName || input.displayName! } : {}),
        ...(externalAccountId !== undefined ? { externalAccountId } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.credentials ? { credentialsEncrypted: encryptDeliveryCredentials(input.credentials) } : {}),
        ...(input.config ? { config: input.config } : {}),
        connectionStatus: "untested", connectionMessage: "Connection has not been tested", updatedAt: new Date(),
      }).where(and(eq(deliveryIntegrations.id, existing.id), eq(deliveryIntegrations.restaurantId, existing.restaurantId))).returning();
      res.json(safeIntegration(saved, `${req.protocol}://${req.get("host")}`));
    } catch (error: any) {
      res.status(error?.code === "23505" ? 409 : 400).json({ error: error?.code === "23505" ? "That provider account already exists" : error.message || "Invalid integration configuration" });
    }
  };
  app.patch("/api/delivery-integrations/:id", requireAuth, requireRestaurant, admin, updateIntegration);
  app.put("/api/delivery-integrations/:id", requireAuth, requireRestaurant, admin, updateIntegration);
  app.delete("/api/delivery-integrations/:id", requireAuth, requireRestaurant, admin, async (req: any, res) => {
    const restaurantId = req.session.user.restaurantId;
    const [row] = await db.select().from(deliveryIntegrations).where(and(
      eq(deliveryIntegrations.id, req.params.id), eq(deliveryIntegrations.restaurantId, restaurantId),
    )).limit(1);
    if (!row) return res.status(404).json({ error: "Integration not found" });
    const referenced = await db.execute(sql`SELECT EXISTS (
      SELECT 1 FROM orders WHERE restaurant_id=${restaurantId} AND delivery_integration_id=${row.id}
      UNION ALL SELECT 1 FROM delivery_integration_events WHERE restaurant_id=${restaurantId} AND integration_id=${row.id}
      UNION ALL SELECT 1 FROM delivery_status_syncs WHERE restaurant_id=${restaurantId} AND integration_id=${row.id}
      UNION ALL SELECT 1 FROM delivery_integration_fees WHERE restaurant_id=${restaurantId} AND integration_id=${row.id}
    ) AS referenced`);
    if ((referenced as any).rows?.[0]?.referenced) {
      await db.update(deliveryIntegrations).set({ enabled: false, updatedAt: new Date() }).where(and(
        eq(deliveryIntegrations.id, row.id), eq(deliveryIntegrations.restaurantId, restaurantId),
      ));
      return res.status(409).json({ error: "Integration is referenced by delivery records and was disabled instead", disabled: true });
    }
    await db.delete(deliveryIntegrations).where(and(eq(deliveryIntegrations.id, row.id), eq(deliveryIntegrations.restaurantId, restaurantId)));
    res.status(204).send();
  });
  app.post("/api/delivery-integrations/:id/test", requireAuth, requireRestaurant, admin, async (req: any, res) => {
    const [row] = await db.select().from(deliveryIntegrations).where(and(eq(deliveryIntegrations.restaurantId, req.session.user.restaurantId), eq(deliveryIntegrations.id, req.params.id))).limit(1);
    if (!row) return res.status(404).json({ error: "Integration not configured" });
    const config: any = row.config;
    if (!config.apiBaseUrl || !config.testPath) {
      const message = "Connection test unavailable: provider API base URL/test path have not been supplied and no undocumented endpoint will be assumed";
      await db.update(deliveryIntegrations).set({ connectionStatus: "unavailable", connectionMessage: message, updatedAt: new Date() }).where(eq(deliveryIntegrations.id, row.id));
      return res.status(422).json({ success: false, status: "unavailable", message });
    }
    try {
      const c = decryptDeliveryCredentials(row.credentialsEncrypted);
       const response = await providerRequest(config.apiBaseUrl, config.testPath, { headers: providerHeaders(config, c) });
      const success = response.ok; const message = success ? "Provider accepted the connection test" : `Provider returned HTTP ${response.status}`;
      await db.update(deliveryIntegrations).set({ connectionStatus: success ? "connected" : "error", connectionMessage: message, lastErrorAt: success ? null : new Date(), lastError: success ? null : message }).where(eq(deliveryIntegrations.id, row.id));
      res.status(success ? 200 : 502).json({ success, status: success ? "connected" : "error", message });
    } catch (error: any) {
      const message = `Connection test failed: ${error.message}`;
      await db.update(deliveryIntegrations).set({ connectionStatus: "error", connectionMessage: message, lastErrorAt: new Date(), lastError: message }).where(eq(deliveryIntegrations.id, row.id));
      res.status(502).json({ success: false, status: "error", message });
    }
  });
  app.post("/api/webhooks/delivery/:token", async (req: any, res) => {
    if (!Buffer.isBuffer(req.rawBody)) return res.status(400).json({ error: "Raw request body unavailable for signature verification" });
    const raw = req.rawBody;
    const [integration] = await db.select().from(deliveryIntegrations).where(eq(deliveryIntegrations.webhookToken, req.params.token)).limit(1);
    if (!integration || !integration.enabled) return res.status(404).json({ error: "Webhook not found" });
    const config: any = integration.config;
    let credentials: Record<string, string>;
    try { credentials = decryptDeliveryCredentials(integration.credentialsEncrypted); }
    catch { return res.status(503).json({ error: "Integration credentials cannot be decrypted" }); }
    const signature = String(req.get(config.signatureHeader || "x-delivery-signature") || "");
    if (!signature || !verifyDeliverySignature(raw, credentials.webhookSecret, signature, config.signatureEncoding || "hex", config.signaturePrefix)) {
      await db.update(deliveryIntegrations).set({ lastErrorAt: new Date(), lastError: "Webhook signature mismatch" }).where(eq(deliveryIntegrations.id, integration.id));
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
    const eventId = String(req.get(config.eventIdHeader || "x-delivery-event-id") || getPath(req.body, config.mapping?.eventId || "eventId") || "");
    if (!eventId) return res.status(400).json({ error: "Provider event ID is required for replay protection" });
    const digest = crypto.createHash("sha256").update(raw).digest("hex");
    let [event] = await db.insert(deliveryIntegrationEvents).values({
      restaurantId: integration.restaurantId, integrationId: integration.id, provider: integration.provider,
      providerEventId: eventId, payloadHash: digest, rawPayload: req.body, signature, status: "processing", processingStartedAt: new Date(),
    }).onConflictDoNothing().returning();
    if (!event) {
      const [existing] = await db.select().from(deliveryIntegrationEvents).where(and(
        eq(deliveryIntegrationEvents.integrationId, integration.id),
        eq(deliveryIntegrationEvents.providerEventId, eventId),
      )).limit(1);
      // Successful/processing events are acknowledged idempotently. A failed
      // event may be retried only after its independent backoff has elapsed;
      // the same durable event row is reused, never a second order.
      if (!existing || !["failed"].includes(existing.status) ||
          (existing.nextRetryAt && existing.nextRetryAt > new Date())) {
        return res.status(200).json({ accepted: true, duplicate: true });
      }
      const [claimed] = await db.update(deliveryIntegrationEvents).set({ status: "processing", error: null, processingStartedAt: new Date() })
        .where(and(eq(deliveryIntegrationEvents.id, existing.id), eq(deliveryIntegrationEvents.status, "failed"))).returning();
      if (!claimed) return res.status(200).json({ accepted: true, duplicate: true });
      event = claimed;
    }
    try {
      if (!config.mapping) throw new Error("Payload mapping is not configured; provider-specific field names are not assumed");
      const envelope = normalizeDeliveryEnvelope(req.body, config.mapping);
      if (!envelope.externalOrderId) throw new Error("Mapped external order ID is required");
      if (envelope.eventType.includes("status")) {
        const inboundStatus = inboundStatuses[String(envelope.status).toLowerCase()];
        if (!inboundStatus) throw new Error("Unsupported inbound delivery status");
        const [updated] = await db.update(orders).set({ status: inboundStatus })
          .where(and(eq(orders.restaurantId, integration.restaurantId), eq(orders.deliveryIntegrationId, integration.id), eq(orders.externalOrderId, envelope.externalOrderId))).returning();
        if (!updated) throw new Error("Status event references an unknown delivery order");
        await db.update(deliveryIntegrationEvents).set({ status: "processed", processedAt: new Date(), orderId: updated.id, processingStartedAt: null }).where(eq(deliveryIntegrationEvents.id, event.id));
        await db.update(deliveryIntegrations).set({
          lastReceivedAt: new Date(), lastSuccessAt: new Date(), lastError: null, connectionStatus: "connected",
        }).where(eq(deliveryIntegrations.id, integration.id));
        return res.status(202).json({ accepted: true, orderId: updated.id });
      }
      const normalized = normalizeMappedPayload(req.body, config.mapping);
      const result = await db.transaction(async tx => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`delivery:${integration.id}:${normalized.externalOrderId}`}, 0))`);
        const [duplicate] = await tx.select().from(orders).where(and(eq(orders.restaurantId, integration.restaurantId), eq(orders.deliveryIntegrationId, integration.id), eq(orders.externalOrderId, normalized.externalOrderId))).limit(1);
        if (duplicate) return { order: duplicate, invoice: null, duplicate: true };
        // The provider ID stays in the tenant/provider idempotency key. The
        // internal number gets a random global suffix, avoiding cross-tenant
        // collisions and leaking no provider identifier as its sole key.
        const orderNumber = newInternalDeliveryNumber();
        const [order] = await tx.insert(orders).values({
          restaurantId: integration.restaurantId, orderNumber, orderType: "Delivery", customerName: normalized.customerName,
          customerPhone: normalized.customerPhone, address: normalized.address, sourcePlatform: integration.provider,
          deliveryIntegrationId: integration.id, externalOrderId: normalized.externalOrderId,
          items: normalized.items, subtotal: normalized.subtotal.toFixed(2),
          tax: normalized.vat.toFixed(2), total: normalized.total.toFixed(2), paymentMethod: "Online", paymentStatus: "Paid",
          status: inboundStatuses[String(normalized.status || "pending").toLowerCase()] || "Pending",
        }).returning();
        const invoiceItems = normalized.items.map(i => ({ name: i.name, quantity: i.quantity, basePrice: i.lineFinalSubtotal,
          vatAmount: normalized.subtotal ? normalized.vat * i.lineFinalSubtotal / normalized.subtotal : 0,
          total: i.lineFinalSubtotal + (normalized.subtotal ? normalized.vat * i.lineFinalSubtotal / normalized.subtotal : 0) }));
        const [invoice] = await tx.insert(invoices).values({ restaurantId: integration.restaurantId,
          invoiceNumber: newInternalDeliveryNumber("INV"), invoiceType: "simplified", orderId: order.id,
          sourcePlatform: integration.provider, customerName: normalized.customerName,
          items: invoiceItems, subtotal: normalized.subtotal.toFixed(2), vatAmount: normalized.vat.toFixed(2), total: normalized.total.toFixed(2),
        }).returning();
        if (![normalized.fee, normalized.commission, normalized.net].every(Number.isFinite) || Math.abs(normalized.total - normalized.fee - normalized.commission - normalized.net) > .02) {
          throw new Error("Gross value does not reconcile to fee + commission + net");
        }
        await tx.insert(deliveryIntegrationFees).values({ restaurantId: integration.restaurantId, integrationId: integration.id,
          orderId: order.id, provider: integration.provider, gross: normalized.total.toFixed(2), fee: normalized.fee.toFixed(2),
          commission: normalized.commission.toFixed(2), net: normalized.net.toFixed(2), sourceEventId: event.id });
        await tx.update(deliveryIntegrationEvents).set({ status: "processed", processedAt: new Date(), orderId: order.id, processingStartedAt: null }).where(eq(deliveryIntegrationEvents.id, event.id));
        return { order, invoice, duplicate: false };
      });
      await db.update(deliveryIntegrations).set({ lastReceivedAt: new Date(), lastSuccessAt: new Date(), lastError: null, connectionStatus: "connected" }).where(eq(deliveryIntegrations.id, integration.id));
      if (result.invoice) void submitZatcaForDelivery(result.invoice, result.order);
      res.status(202).json({ accepted: true, duplicate: result.duplicate, orderId: result.order.id });
    } catch (error: any) {
      const attempts = event.attempts + 1; const dead = attempts >= 5;
      await db.update(deliveryIntegrationEvents).set({ status: dead ? "dead_letter" : "failed", attempts,
        error: error.message, nextRetryAt: dead ? null : retryAt(attempts), processingStartedAt: null }).where(eq(deliveryIntegrationEvents.id, event.id));
      await db.update(deliveryIntegrations).set({ lastReceivedAt: new Date(), lastErrorAt: new Date(), lastError: error.message }).where(eq(deliveryIntegrations.id, integration.id));
      res.status(422).json({ accepted: false, error: error.message });
    }
  });
  app.get("/api/delivery-integrations/events", requireAuth, requireRestaurant, async (req: any, res) => {
    const conditions: any[] = [eq(deliveryIntegrationEvents.restaurantId, req.session.user.restaurantId)];
    if (req.query.provider) conditions.push(eq(deliveryIntegrationEvents.provider, String(req.query.provider)));
    if (req.query.integrationId) conditions.push(eq(deliveryIntegrationEvents.integrationId, String(req.query.integrationId)));
    if (req.query.status) conditions.push(eq(deliveryIntegrationEvents.status, String(req.query.status)));
    // Raw signed bodies and signatures are retained for audit/retry but never
    // returned by the settings/log API (they can contain customer PII).
    res.json(await db.select({
      id: deliveryIntegrationEvents.id, provider: deliveryIntegrationEvents.provider,
      integrationId: deliveryIntegrationEvents.integrationId, accountName: deliveryIntegrations.accountName,
      providerEventId: deliveryIntegrationEvents.providerEventId, status: deliveryIntegrationEvents.status,
      attempts: deliveryIntegrationEvents.attempts, error: deliveryIntegrationEvents.error,
      orderId: deliveryIntegrationEvents.orderId, receivedAt: deliveryIntegrationEvents.receivedAt,
      processedAt: deliveryIntegrationEvents.processedAt, nextRetryAt: deliveryIntegrationEvents.nextRetryAt,
    }).from(deliveryIntegrationEvents).innerJoin(deliveryIntegrations, and(
      eq(deliveryIntegrations.id, deliveryIntegrationEvents.integrationId),
      eq(deliveryIntegrations.restaurantId, deliveryIntegrationEvents.restaurantId),
    )).where(and(...conditions)).orderBy(desc(deliveryIntegrationEvents.receivedAt)).limit(200));
  });
  app.get("/api/delivery-integrations/health", requireAuth, requireRestaurant, async (req: any, res) => {
    const conditions = [eq(deliveryIntegrations.restaurantId, req.session.user.restaurantId), eq(deliveryIntegrations.enabled, true)];
    if (req.query.integrationId) conditions.push(eq(deliveryIntegrations.id, String(req.query.integrationId)));
    const rows = await db.select().from(deliveryIntegrations).where(and(...conditions));
    const now = Date.now();
    res.json(rows.map((row: any) => { const threshold = Number(row.config?.silentAfterMinutes || 120) * 60000;
      const silent = !row.lastReceivedAt || now - new Date(row.lastReceivedAt).getTime() > threshold;
      return { integrationId: row.id, accountName: row.accountName, provider: row.provider, healthy: !silent, alert: silent ? "No webhook received within configured health window" : null, lastReceivedAt: row.lastReceivedAt };
    }));
  });
  app.get("/api/delivery-integrations/alerts", requireAuth, requireRestaurant, async (req: any, res) => {
    const conditions = [eq(deliveryIntegrationAlerts.restaurantId, req.session.user.restaurantId), eq(deliveryIntegrationAlerts.active, true)];
    if (req.query.integrationId) conditions.push(eq(deliveryIntegrationAlerts.integrationId, String(req.query.integrationId)));
    res.json(await db.select({
      id: deliveryIntegrationAlerts.id, restaurantId: deliveryIntegrationAlerts.restaurantId,
      integrationId: deliveryIntegrationAlerts.integrationId, accountName: deliveryIntegrations.accountName,
      kind: deliveryIntegrationAlerts.kind, message: deliveryIntegrationAlerts.message,
      active: deliveryIntegrationAlerts.active, firstDetectedAt: deliveryIntegrationAlerts.firstDetectedAt,
      lastDetectedAt: deliveryIntegrationAlerts.lastDetectedAt, resolvedAt: deliveryIntegrationAlerts.resolvedAt,
    }).from(deliveryIntegrationAlerts).innerJoin(deliveryIntegrations, and(
      eq(deliveryIntegrations.id, deliveryIntegrationAlerts.integrationId),
      eq(deliveryIntegrations.restaurantId, deliveryIntegrationAlerts.restaurantId),
    )).where(and(
      ...conditions,
    )).orderBy(desc(deliveryIntegrationAlerts.lastDetectedAt)));
  });
  app.get("/api/delivery-integrations/reconciliation", requireAuth, requireRestaurant, async (req: any, res) => {
    const start = req.query.start ? new Date(String(req.query.start)) : new Date(0);
    const end = req.query.end ? new Date(String(req.query.end)) : new Date();
    const provider = req.query.provider ? String(req.query.provider) : null;
    const integrationId = req.query.integrationId ? String(req.query.integrationId) : null;
    const result = await db.execute(sql`SELECT f.integration_id AS "integrationId", i.account_name AS "accountName",
      f.provider, count(*)::int AS orders,
      sum(gross)::numeric(14,2) AS gross, sum(fee)::numeric(14,2) AS fee,
      sum(commission)::numeric(14,2) AS commission, sum(net)::numeric(14,2) AS net
      FROM delivery_integration_fees f JOIN delivery_integrations i
        ON i.id=f.integration_id AND i.restaurant_id=f.restaurant_id
      WHERE f.restaurant_id=${req.session.user.restaurantId}
      AND f.captured_at >= ${start} AND f.captured_at <= ${end}
      AND (${provider}::text IS NULL OR f.provider=${provider})
      AND (${integrationId}::text IS NULL OR f.integration_id=${integrationId})
      GROUP BY f.integration_id, i.account_name, f.provider ORDER BY f.provider, i.account_name`);
    res.json((result as any).rows || []);
  });
  app.post("/api/orders/:id/delivery-status", requireAuth, requireRestaurant, admin, async (req: any, res) => {
    const status = outboundStatuses[String(req.body?.status)];
    if (!status) return res.status(400).json({ error: "Unsupported outbound delivery status" });
    const [order] = await db.select().from(orders).where(and(eq(orders.id, req.params.id), eq(orders.restaurantId, req.session.user.restaurantId))).limit(1);
    if (!order?.deliveryIntegrationId || !order.externalOrderId) return res.status(404).json({ error: "Delivery order not found" });
    const [integration] = await db.select().from(deliveryIntegrations).where(and(
      eq(deliveryIntegrations.id, order.deliveryIntegrationId),
      eq(deliveryIntegrations.restaurantId, order.restaurantId),
      eq(deliveryIntegrations.enabled, true),
    )).limit(1);
    const config: any = integration?.config;
    if (!integration || !config.apiBaseUrl || !config.statusPathTemplate) return res.status(422).json({ error: "Outbound status sync unavailable: provider endpoint is not configured" });
    const [sync] = await db.insert(deliveryStatusSyncs).values({ restaurantId: order.restaurantId, integrationId: integration.id, orderId: order.id, status, direction: "outbound", state: "pending" }).returning();
    try {
      const c = decryptDeliveryCredentials(integration.credentialsEncrypted);
      const path = config.statusPathTemplate.replace("{orderId}", encodeURIComponent(order.externalOrderId));
      const response = await providerRequest(config.apiBaseUrl, path, {
        method: "POST", headers: { "content-type": "application/json", ...providerHeaders(config, c) }, body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
       await db.update(deliveryStatusSyncs).set({ state: "sent", sentAt: new Date(), processingStartedAt: null }).where(eq(deliveryStatusSyncs.id, sync.id));
      await db.update(orders).set({ status: inboundStatuses[status] }).where(and(
        eq(orders.id, order.id), eq(orders.restaurantId, order.restaurantId),
        eq(orders.deliveryIntegrationId, integration.id),
      ));
      res.json({ success: true, status });
    } catch (error: any) {
       await db.update(deliveryStatusSyncs).set({ state: "failed", error: error.message, attempts: 1, nextRetryAt: retryAt(1), processingStartedAt: null }).where(eq(deliveryStatusSyncs.id, sync.id));
      res.status(502).json({ success: false, error: error.message });
    }
  });
}