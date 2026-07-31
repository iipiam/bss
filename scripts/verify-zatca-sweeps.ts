// One-off verification: archive sweep + CSID alert claim work with NO pending invoices.
// Run: npx tsx scripts/verify-zatca-sweeps.ts
import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

async function main() {
  const rid = "verify-zatca-rest-" + Date.now();
  const iid = "verify-zatca-inv-" + Date.now();
  let failures = 0;
  const check = (name: string, ok: boolean, extra?: string) => {
    console.log(`${ok ? "PASS" : "FAIL"} - ${name}${extra ? ` (${extra})` : ""}`);
    if (!ok) failures++;
  };

  try {
    // Fixtures: restaurant + cleared invoice with signed XML, NO pending rows anywhere for this tenant
    await db.execute(sql`INSERT INTO restaurants (id, name, national_id, commercial_registration, business_type, type, subscription_plan)
      VALUES (${rid}, 'Verify Co', '1234567890', '1234567890', 'restaurant', 'Restaurant', 'monthly')`);
    await db.execute(sql`INSERT INTO invoices (id, restaurant_id, invoice_number, invoice_type, items, subtotal, vat_amount, total)
      VALUES (${iid}, ${rid}, 'VER-001', 'simplified', '[]', 100, 15, 115)`);
    await db.execute(sql`INSERT INTO invoice_zatca_status (invoice_id, restaurant_id, invoice_type, invoice_sub_type, uuid, invoice_hash, invoice_counter, submission_type, signed_xml, submission_status, cleared_at)
      VALUES (${iid}, ${rid}, 'simplified', '0200000', 'ver-uuid', 'ver-hash', 1, 'reporting', '<Invoice>signed</Invoice>', 'cleared', now())`);

    // (a) Archive sweep path with no pending rows
    const pending = await storage.getRestaurantsWithPendingZatcaInvoices();
    check("no pending rows for fixture tenant", !pending.includes(rid));
    const unarchived = await storage.getUnarchivedZatcaInvoices(rid);
    check("cleared invoice found by archive sweep despite no pending rows", unarchived.length === 1);

    const rec1 = await storage.archiveZatcaXml({
      invoiceId: iid, restaurantId: rid, invoiceNumber: "VER-001", invoiceHash: "ver-hash",
      signedXml: "<Invoice>signed</Invoice>", submissionStatus: "cleared",
      submittedAt: new Date(), retentionExpiresAt: new Date(Date.now() + 6 * 365 * 24 * 3600 * 1000),
    });
    const rec2 = await storage.archiveZatcaXml({
      invoiceId: iid, restaurantId: rid, invoiceNumber: "VER-001", invoiceHash: "ver-hash",
      signedXml: "<Invoice>signed</Invoice>", submissionStatus: "cleared",
      submittedAt: new Date(), retentionExpiresAt: new Date(Date.now() + 6 * 365 * 24 * 3600 * 1000),
    });
    check("archive insert idempotent (same row on duplicate)", rec1.id === rec2.id);
    const after = await storage.getUnarchivedZatcaInvoices(rid);
    check("archived invoice no longer reported as unarchived", after.length === 0);

    // Immutability + deletion guards on the cleared invoice
    let updateBlocked = false;
    try { await storage.updateInvoice(iid, rid, { total: "999" } as any); } catch { updateBlocked = true; }
    check("update of business field blocked after clearance", updateBlocked);
    let deleteBlocked = false;
    try { await storage.deleteInvoice(iid, rid); } catch { deleteBlocked = true; }
    check("delete blocked after clearance", deleteBlocked);

    // (b) CSID expiry alert claim with no pending rows
    await db.execute(sql`INSERT INTO zatca_settings (restaurant_id, is_enabled, onboarding_status, environment, csid_expires_at)
      VALUES (${rid}, true, 'production_ready', 'sandbox', now() + interval '5 days')`);
    const enabled = await storage.getAllEnabledZatcaSettings();
    check("expiring CSID visible to sweep despite no pending rows", enabled.some((s) => s.restaurantId === rid));
    const c1 = await storage.claimCsidExpiryAlert(rid, "7d");
    const c2 = await storage.claimCsidExpiryAlert(rid, "7d");
    const c3 = await storage.claimCsidExpiryAlert(rid, "30d"); // downgrade must be refused
    check("first 7d claim succeeds", c1 === true);
    check("duplicate 7d claim refused", c2 === false);
    check("downgrade to 30d refused after 7d", c3 === false);

    // (c) DB-level append-only enforcement on the archive itself
    let archUpdateBlocked = false;
    try { await db.execute(sql`UPDATE zatca_xml_archive SET signed_xml = 'tampered' WHERE restaurant_id = ${rid}`); }
    catch { archUpdateBlocked = true; }
    check("direct UPDATE on archive row rejected by DB trigger", archUpdateBlocked);
    let archDeleteBlocked = false;
    try { await db.execute(sql`DELETE FROM zatca_xml_archive WHERE restaurant_id = ${rid}`); }
    catch { archDeleteBlocked = true; }
    check("direct DELETE on archive row within retention rejected by DB trigger", archDeleteBlocked);

    // (d) DB-level invoice finality: direct SQL cannot mutate/delete a cleared invoice
    let invUpdateBlocked = false;
    try { await db.execute(sql`UPDATE invoices SET total = 999 WHERE id = ${iid}`); }
    catch { invUpdateBlocked = true; }
    check("direct SQL UPDATE of business field on cleared invoice rejected by DB trigger", invUpdateBlocked);
    let qrAllowed = true;
    try { await db.execute(sql`UPDATE invoices SET qr_code = 'regenerated-qr' WHERE id = ${iid}`); }
    catch { qrAllowed = false; }
    check("derived artifact (qr_code) update still allowed on cleared invoice", qrAllowed);
    let invDeleteBlocked = false;
    try { await db.execute(sql`DELETE FROM invoices WHERE id = ${iid}`); }
    catch { invDeleteBlocked = true; }
    check("direct SQL DELETE of cleared invoice rejected by DB trigger", invDeleteBlocked);
    let statusUpdateBlocked = false;
    try { await db.execute(sql`UPDATE invoice_zatca_status SET submission_status = 'pending' WHERE invoice_id = ${iid}`); }
    catch { statusUpdateBlocked = true; }
    check("final ZATCA status row cannot be reverted/updated", statusUpdateBlocked);
    let statusDeleteBlocked = false;
    try { await db.execute(sql`DELETE FROM invoice_zatca_status WHERE invoice_id = ${iid}`); }
    catch { statusDeleteBlocked = true; }
    check("final ZATCA status row cannot be deleted", statusDeleteBlocked);

    // (e) Clearance-vs-update race: session A reads pending, session B clears and commits,
    // then session A's business update must still be rejected (by lock + DB trigger).
    const iid2 = iid + "-race";
    await db.execute(sql`INSERT INTO invoices (id, restaurant_id, invoice_number, invoice_type, items, subtotal, vat_amount, total)
      VALUES (${iid2}, ${rid}, 'VER-002', 'simplified', '[]', 100, 15, 115)`);
    await db.execute(sql`INSERT INTO invoice_zatca_status (invoice_id, restaurant_id, invoice_type, invoice_sub_type, uuid, invoice_hash, invoice_counter, submission_type, submission_status)
      VALUES (${iid2}, ${rid}, 'simplified', '0200000', 'ver-uuid-2', 'ver-hash-2', 2, 'reporting', 'pending')`);
    const clientA = await pool.connect();
    let raceBlocked = false;
    try {
      await clientA.query("BEGIN");
      await clientA.query(`SELECT submission_status FROM invoice_zatca_status WHERE invoice_id = $1`, [iid2]); // reads 'pending' (no lock — simulates naive check)
      // Session B clears the invoice and commits while A's transaction is open
      await db.execute(sql`UPDATE invoice_zatca_status SET submission_status = 'cleared', cleared_at = now() WHERE invoice_id = ${iid2}`);
      try {
        await clientA.query(`UPDATE invoices SET total = 500 WHERE id = $1`, [iid2]);
        await clientA.query("COMMIT");
      } catch {
        raceBlocked = true;
        await clientA.query("ROLLBACK");
      }
    } finally {
      clientA.release();
    }
    check("business update racing a concurrent clearance rejected at DB layer", raceBlocked);

    // (f) One authoritative status row per invoice (unique constraint)
    let dupStatusBlocked = false;
    try {
      await db.execute(sql`INSERT INTO invoice_zatca_status (invoice_id, restaurant_id, invoice_type, invoice_sub_type, uuid, invoice_hash, invoice_counter, submission_type, submission_status)
        VALUES (${iid2}, ${rid}, 'simplified', '0200000', 'ver-uuid-2b', 'ver-hash-2b', 3, 'reporting', 'pending')`);
    } catch { dupStatusBlocked = true; }
    check("second status row for same invoice rejected by unique constraint", dupStatusBlocked);

    // (g) First-final-status insert serializes on the invoice row lock:
    // session A holds the invoice row lock (as updateInvoice/deleteInvoice do),
    // a concurrent createInvoiceZatcaStatus must block until A commits.
    const iid3 = iid + "-race2";
    await db.execute(sql`INSERT INTO invoices (id, restaurant_id, invoice_number, invoice_type, items, subtotal, vat_amount, total)
      VALUES (${iid3}, ${rid}, 'VER-003', 'simplified', '[]', 100, 15, 115)`);
    const clientC = await pool.connect();
    let blockedWhileLocked = false;
    try {
      await clientC.query("BEGIN");
      await clientC.query(`SELECT id FROM invoices WHERE id = $1 FOR UPDATE`, [iid3]);
      let statusInserted = false;
      const insertPromise = storage.createInvoiceZatcaStatus({
        invoiceId: iid3, restaurantId: rid, invoiceType: "simplified", invoiceSubType: "02" as any,
        uuid: "ver-uuid-3", invoiceHash: "ver-hash-3", invoiceCounter: 4,
        submissionType: "reporting", submissionStatus: "cleared",
      } as any).then(() => { statusInserted = true; });
      await new Promise((r) => setTimeout(r, 400));
      blockedWhileLocked = !statusInserted;
      await clientC.query("COMMIT");
      await insertPromise;
    } finally {
      clientC.release();
    }
    check("first final-status insert blocks while invoice row lock is held", blockedWhileLocked);
    let postFinalUpdateBlocked = false;
    try { await storage.updateInvoice(iid3, rid, { total: "777" } as any); } catch { postFinalUpdateBlocked = true; }
    check("business update after first-final-status insert rejected", postFinalUpdateBlocked);
  } finally {
    // Cleanup: fixtures only — temporarily disable the guard triggers
    await db.execute(sql`ALTER TABLE zatca_xml_archive DISABLE TRIGGER zatca_archive_guard`);
    await db.execute(sql`ALTER TABLE invoices DISABLE TRIGGER zatca_invoice_finality_guard`);
    await db.execute(sql`ALTER TABLE invoice_zatca_status DISABLE TRIGGER zatca_status_finality_guard`);
    await db.execute(sql`DELETE FROM zatca_xml_archive WHERE restaurant_id = ${rid}`);
    await db.execute(sql`DELETE FROM invoice_zatca_status WHERE restaurant_id = ${rid}`);
    await db.execute(sql`DELETE FROM zatca_settings WHERE restaurant_id = ${rid}`);
    await db.execute(sql`DELETE FROM invoices WHERE restaurant_id = ${rid}`);
    await db.execute(sql`DELETE FROM restaurants WHERE id = ${rid}`);
    await db.execute(sql`ALTER TABLE zatca_xml_archive ENABLE TRIGGER zatca_archive_guard`);
    await db.execute(sql`ALTER TABLE invoices ENABLE TRIGGER zatca_invoice_finality_guard`);
    await db.execute(sql`ALTER TABLE invoice_zatca_status ENABLE TRIGGER zatca_status_finality_guard`);
    await pool.end();
  }
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
