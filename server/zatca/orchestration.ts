import { sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { processInvoiceForZatca } from "./service";
import { orchestrateZatcaInvoice } from "./idempotency";

/** The single cross-process ZATCA entry point for every invoice source. */
export async function processInvoiceZatcaIdempotently(params: any) {
  return db.transaction(async (tx) => {
    // The PIH/ICV chain is tenant-wide, so the cross-process lock must be
    // tenant-wide too. An invoice-scoped lock would still allow two different
    // invoices for the same EGS unit to allocate/sign concurrently.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`zatca-restaurant:${params.restaurantId}`}, 0))`);
    const existing = await storage.getInvoiceZatcaStatus(params.invoiceId, params.restaurantId);
    return orchestrateZatcaInvoice(existing, () => processInvoiceForZatca(params),
      () => import("./service").then(({ retryPendingInvoice }) => retryPendingInvoice(params.restaurantId, params.invoiceId)));
  });
}