/**
 * ZATCA invoice immutability guard tests (Task: confirm invoices can never be
 * changed or deleted after ZATCA clearance).
 *
 * Runs against the real database via the storage layer, verifying:
 *  1. updateInvoice rejects ALL business-field changes on cleared/reported invoices
 *  2. updateInvoice still allows internal artifacts (qrCode, pdfPath)
 *  3. deleteInvoice rejects cleared/reported/archived invoices
 *  4. deleteInvoice allows non-submitted (no status / pending) invoices
 *  5. archiveZatcaXml is idempotent (double archive -> one row, same id)
 *  6. The DB trigger layer independently blocks direct SQL tampering
 *
 * All test data is namespaced and cleaned up at the end (triggers are
 * temporarily disabled for cleanup only, since the guards are intentionally
 * undeletable in normal operation).
 *
 * Run: npx tsx scripts/test-invoice-immutability.ts
 * Exits 0 on success, 1 on any failure.
 */
import { storage } from "../server/storage";
import { db, pool } from "../server/db";
import {
  restaurants,
  invoices,
  invoiceZatcaStatus,
  zatcaXmlArchive,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

const TAG = `IMMUT-TEST-${Date.now()}`;
let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(name + (detail ? ` — ${detail}` : ""));
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function expectReject(name: string, fn: () => Promise<any>, msgPart: string) {
  try {
    await fn();
    ok(name, false, "expected rejection but call succeeded");
  } catch (e: any) {
    ok(name, e.message?.includes(msgPart), `unexpected error: ${e.message}`);
  }
}

async function main() {
  // Wait for db.ts startup migrations to settle
  await new Promise((r) => setTimeout(r, 3000));

  // ---- Setup: test restaurant ----
  const [rest] = await db
    .insert(restaurants)
    .values({
      name: TAG,
      nationalId: "1234567890",
      commercialRegistration: "1010101010",
      businessType: "restaurant",
      type: "Restaurant",
      subscriptionPlan: "monthly",
    } as any)
    .returning();
  const rid = rest.id;

  const mkInvoice = async (suffix: string) => {
    const [inv] = await db
      .insert(invoices)
      .values({
        restaurantId: rid,
        invoiceNumber: `${TAG}-${suffix}`,
        items: [{ name: "Item", quantity: 1, basePrice: 100, vatAmount: 15, total: 115 }],
        subtotal: "100.00",
        vatAmount: "15.00",
        total: "115.00",
        customerName: "Original Customer",
      } as any)
      .returning();
    return inv;
  };

  const mkStatus = (invoiceId: string, submissionStatus: string, counter: number) =>
    storage.createInvoiceZatcaStatus({
      invoiceId,
      restaurantId: rid,
      invoiceType: "simplified",
      invoiceSubType: "01",
      uuid: `${TAG}-uuid-${counter}`,
      invoiceHash: "hash" + counter,
      invoiceCounter: counter,
      submissionType: "reporting",
      submissionStatus,
    } as any);

  const cleared = await mkInvoice("CLEARED");
  const reported = await mkInvoice("REPORTED");
  const pendingInv = await mkInvoice("PENDING");
  const noStatusInv = await mkInvoice("NOSTATUS");
  const archivedInv = await mkInvoice("ARCHIVED");

  await mkStatus(cleared.id, "cleared", 1);
  await mkStatus(reported.id, "reported", 2);
  await mkStatus(pendingInv.id, "pending", 3);
  await mkStatus(archivedInv.id, "reported", 4);

  console.log("\n[1] updateInvoice rejects business fields on cleared/reported invoices");
  await expectReject(
    "financial field (total) rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { total: "999.00" } as any),
    "already been cleared"
  );
  await expectReject(
    "financial fields (subtotal+vatAmount) rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { subtotal: "1.00", vatAmount: "0.15" } as any),
    "already been cleared"
  );
  await expectReject(
    "identity field (invoiceNumber) rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { invoiceNumber: `${TAG}-TAMPERED` } as any),
    "already been cleared"
  );
  await expectReject(
    "identity field (customerName) rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { customerName: "Someone Else" } as any),
    "already been cleared"
  );
  await expectReject(
    "items rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { items: [] } as any),
    "already been cleared"
  );
  await expectReject(
    "mixed update (qrCode + total) rejected on cleared",
    () => storage.updateInvoice(cleared.id, rid, { qrCode: "qr", total: "1.00" } as any),
    "already been cleared"
  );
  await expectReject(
    "financial field (total) rejected on reported",
    () => storage.updateInvoice(reported.id, rid, { total: "999.00" } as any),
    "already been reported"
  );
  await expectReject(
    "customerVatNumber rejected on reported",
    () => storage.updateInvoice(reported.id, rid, { customerVatNumber: "300000000000003" } as any),
    "already been reported"
  );

  // Verify nothing actually changed
  const clearedAfter = await storage.getInvoice(cleared.id, rid);
  ok(
    "cleared invoice unchanged after rejected updates",
    clearedAfter?.total === "115.00" &&
      clearedAfter?.customerName === "Original Customer" &&
      clearedAfter?.invoiceNumber === `${TAG}-CLEARED`
  );

  console.log("\n[2] qrCode/pdfPath still allowed on cleared/reported invoices");
  const qrUpd = await storage.updateInvoice(cleared.id, rid, { qrCode: "base64qr==" } as any);
  ok("qrCode update allowed on cleared", qrUpd?.qrCode === "base64qr==");
  const pdfUpd = await storage.updateInvoice(reported.id, rid, { pdfPath: "/pdfs/x.pdf" } as any);
  ok("pdfPath update allowed on reported", pdfUpd?.pdfPath === "/pdfs/x.pdf");
  const bothUpd = await storage.updateInvoice(cleared.id, rid, { qrCode: "qr2", pdfPath: "/p2.pdf" } as any);
  ok("qrCode+pdfPath together allowed on cleared", bothUpd?.qrCode === "qr2" && bothUpd?.pdfPath === "/p2.pdf");

  console.log("\n[3] deleteInvoice rejects cleared/reported/archived invoices");
  await expectReject(
    "delete rejected on cleared",
    () => storage.deleteInvoice(cleared.id, rid),
    "retained for 6 years"
  );
  await expectReject(
    "delete rejected on reported",
    () => storage.deleteInvoice(reported.id, rid),
    "retained for 6 years"
  );

  console.log("\n[4] archiveZatcaXml idempotency (double archive -> one row)");
  const archiveData = {
    invoiceId: archivedInv.id,
    restaurantId: rid,
    invoiceNumber: archivedInv.invoiceNumber,
    invoiceHash: "archive-hash",
    signedXml: "<Invoice>signed</Invoice>",
    submissionStatus: "reported",
    submittedAt: new Date(),
    // Past retention so cleanup can delete this row (archive guard allows delete after expiry)
    retentionExpiresAt: new Date(Date.now() - 24 * 3600 * 1000),
  } as any;
  const first = await storage.archiveZatcaXml(archiveData);
  const second = await storage.archiveZatcaXml(archiveData);
  ok("double archive returns same row id", first.id === second.id);
  const archRows = await db
    .select({ id: zatcaXmlArchive.id })
    .from(zatcaXmlArchive)
    .where(and(eq(zatcaXmlArchive.invoiceId, archivedInv.id), eq(zatcaXmlArchive.restaurantId, rid)));
  ok("exactly one archive row exists", archRows.length === 1, `found ${archRows.length}`);

  await expectReject(
    "delete rejected on archived invoice",
    () => storage.deleteInvoice(archivedInv.id, rid),
    "retained for 6 years" // reported status guard fires first; archive guard is belt-and-suspenders
  );

  // Archive-only invoice (no final status) to prove the archive check alone blocks deletion
  const archOnly = await mkInvoice("ARCHONLY");
  await storage.archiveZatcaXml({
    ...archiveData,
    invoiceId: archOnly.id,
    invoiceNumber: archOnly.invoiceNumber,
  });
  await expectReject(
    "delete rejected on archive-only invoice (no final status)",
    () => storage.deleteInvoice(archOnly.id, rid),
    "6-year retention archive"
  );

  console.log("\n[5] deleteInvoice allows non-submitted invoices");
  ok("delete allowed with no ZATCA status", (await storage.deleteInvoice(noStatusInv.id, rid)) === true);
  ok("delete allowed with pending status", (await storage.deleteInvoice(pendingInv.id, rid)) === true);
  ok(
    "no-status invoice actually gone",
    (await storage.getInvoice(noStatusInv.id, rid)) === undefined
  );

  console.log("\n[6] DB trigger layer blocks direct SQL tampering (defense in depth)");
  await expectReject(
    "direct SQL UPDATE of total blocked by trigger",
    () => pool.query(`UPDATE invoices SET total = '1.00' WHERE id = $1`, [cleared.id]),
    "immutable"
  );
  await expectReject(
    "direct SQL DELETE blocked by trigger",
    () => pool.query(`DELETE FROM invoices WHERE id = $1`, [cleared.id]),
    "cannot be deleted"
  );
  await expectReject(
    "direct SQL UPDATE of final status row blocked by trigger",
    () => pool.query(`UPDATE invoice_zatca_status SET submission_status = 'pending' WHERE invoice_id = $1`, [cleared.id]),
    "final"
  );
  await expectReject(
    "direct SQL UPDATE of archive row blocked by trigger",
    () => pool.query(`UPDATE zatca_xml_archive SET signed_xml = 'tampered' WHERE invoice_id = $1`, [archivedInv.id]),
    "append-only"
  );

  // ---- Cleanup (test-only: temporarily disable guards to remove fixtures) ----
  console.log("\nCleaning up test data...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`ALTER TABLE zatca_xml_archive DISABLE TRIGGER USER`);
    await client.query(`ALTER TABLE invoice_zatca_status DISABLE TRIGGER USER`);
    await client.query(`ALTER TABLE invoices DISABLE TRIGGER USER`);
    await client.query(`DELETE FROM zatca_xml_archive WHERE restaurant_id = $1`, [rid]);
    await client.query(`DELETE FROM invoice_zatca_status WHERE restaurant_id = $1`, [rid]);
    await client.query(`DELETE FROM invoices WHERE restaurant_id = $1`, [rid]);
    await client.query(`ALTER TABLE zatca_xml_archive ENABLE TRIGGER USER`);
    await client.query(`ALTER TABLE invoice_zatca_status ENABLE TRIGGER USER`);
    await client.query(`ALTER TABLE invoices ENABLE TRIGGER USER`);
    await client.query(`DELETE FROM restaurants WHERE id = $1`, [rid]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Cleanup failed:", (e as Error).message);
  } finally {
    client.release();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("Failures:\n  " + failures.join("\n  "));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Test run crashed:", e);
  process.exit(1);
});
