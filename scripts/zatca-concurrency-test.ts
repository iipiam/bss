import { storage } from "../server/storage";
import { processInvoiceForZatca } from "../server/zatca/service";
import { db } from "../server/db";
import { restaurants, zatcaSettings, invoiceZatcaStatus, invoices } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rest = await storage.createRestaurant({
    name: "ZATCA-CONC-TEST",
    nationalId: "1234567890",
    taxNumber: "300000000000003",
    commercialRegistration: "1010101010",
    businessType: "restaurant",
    type: "Restaurant",
    subscriptionPlan: "monthly",
  } as any);
  const rid = rest.id;
  console.log("Test restaurant:", rid);

  try {
    await storage.createZatcaSettings({
      restaurantId: rid,
      isEnabled: true,
      environment: "sandbox",
      csrOrganizationName: "Test Org",
      csrOrganizationIdentifier: "300000000000003",
      csrCountryName: "SA",
    } as any);

    const invRows = await db.insert(invoices).values([1, 2].map((n) => ({
      restaurantId: rid,
      invoiceNumber: `CONC-${n}-${Date.now()}`,
      items: [{ name: "Item", quantity: 1, basePrice: 100, vatAmount: 15, total: 115 }],
      subtotal: "100.00",
      vatAmount: "15.00",
      total: "115.00",
    }))).returning();

    const mkParams = (n: number) => ({
      restaurantId: rid,
      invoiceId: invRows[n - 1].id,
      invoiceNumber: invRows[n - 1].invoiceNumber,
      invoiceType: "simplified" as const,
      documentType: "invoice" as const,
      paymentMethod: "cash",
      subtotal: 100,
      vatAmount: 15,
      total: 115,
      items: [{ name: "Item", quantity: 1, unitPrice: 100, vatRate: 15, vatAmount: 15, total: 115 }],
    });

    // Fire two invoices CONCURRENTLY
    const [r1, r2] = await Promise.all([
      processInvoiceForZatca(mkParams(1) as any),
      processInvoiceForZatca(mkParams(2) as any),
    ]);

    console.log("Invoice 1 hashHex:", (r1 as any).invoiceHash?.slice(0, 16), "status:", r1.submissionStatus);
    console.log("Invoice 2 hashHex:", (r2 as any).invoiceHash?.slice(0, 16), "status:", r2.submissionStatus);

    const settings = await storage.getZatcaSettings(rid);
    console.log("Final counter:", settings?.lastInvoiceCounter, "(expected 2)");

    // Check chain: second-signed invoice's PIH must equal first invoice's hash
    const h1 = Buffer.from(r1.invoiceHash, "base64").toString("hex");
    const h2 = Buffer.from(r2.invoiceHash, "base64").toString("hex");
    const pih1 = extractPih((r1 as any).signedXml || "");
    const pih2 = extractPih((r2 as any).signedXml || "");
    console.log("PIH of inv1:", pih1?.slice(0, 16));
    console.log("PIH of inv2:", pih2?.slice(0, 16));
    // PIH is stored as base64(hex-string) in the XML
    const pih1Hex = pih1 ? Buffer.from(pih1, "base64").toString("utf8") : "";
    const pih2Hex = pih2 ? Buffer.from(pih2, "base64").toString("utf8") : "";
    const chainOk = pih2Hex === h1 || pih1Hex === h2;
    console.log("Counter consecutive:", settings?.lastInvoiceCounter === 2 ? "PASS" : "FAIL");
    console.log("Hash chain linked:", chainOk ? "PASS" : "FAIL");
    console.log("lastInvoiceHash matches one of the two:", [h1, h2].includes(settings?.lastInvoiceHash || "") ? "PASS" : "FAIL");
    if (settings?.lastInvoiceCounter !== 2 || !chainOk) process.exitCode = 1;
  } finally {
    await db.delete(invoiceZatcaStatus).where(eq(invoiceZatcaStatus.restaurantId, rid)).catch(() => {});
    await db.delete(invoices).where(eq(invoices.restaurantId, rid)).catch(() => {});
    await db.delete(zatcaSettings).where(eq(zatcaSettings.restaurantId, rid));
    await db.delete(restaurants).where(eq(restaurants.id, rid));
    console.log("Cleanup done");
  }
}

function extractPih(xml: string): string | null {
  const m = xml.match(/PIH<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)</);
  return m ? m[1].trim() : null;
}

main().then(() => process.exit(process.exitCode || 0)).catch((e) => { console.error(e); process.exit(1); });
