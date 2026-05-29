import crypto from "crypto";
import { extractPublicKeyBase64, getCertificateIssuerSerial, extractCertificateSignatureBytes, extractCertificateBase64Body } from "./crypto";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import * as xpath from "xpath";
import xmlCrypto from "xml-crypto";
const { C14nCanonicalization } = xmlCrypto as any;

interface ZatcaInvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxCategory?: "S" | "Z" | "E" | "O";
  taxPercent?: number;
}

interface ZatcaInvoiceData {
  invoiceNumber: string;
  invoiceType: "standard" | "simplified";
  invoiceSubType: "01" | "02";
  documentType?: "invoice" | "credit_note" | "debit_note";
  referencedInvoiceNumber?: string;
  adjustmentReason?: string;
  paymentMethod: "cash" | "card" | "bank_transfer";
  subtotal: number;
  vatAmount: number;
  total: number;
  discount: number;
  items: ZatcaInvoiceLineItem[];
  invoiceCounter: number;
  previousInvoiceHash: string | null;
  uuid: string;
  issueDate: string;
  issueTime: string;
  sellerInfo: {
    name: string;
    vatNumber: string;
    streetName: string;
    buildingNumber: string;
    citySubdivision: string;
    city: string;
    postalZone: string;
    countryCode: string;
    crNumber: string;
  };
  buyerInfo?: {
    name: string;
    vatNumber?: string;
    streetName?: string;
    buildingNumber?: string;
    citySubdivision?: string;
    city?: string;
    postalZone?: string;
    countryCode?: string;
  };
}

interface SigningCredentials {
  privateKey: string;
  certificate: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatVatNumber(vatNumber: string): string {
  const digitsOnly = vatNumber.replace(/\D/g, "");
  if (digitsOnly.length === 15 && digitsOnly.startsWith("3") && digitsOnly.endsWith("3")) return digitsOnly;
  if (digitsOnly.length === 10) return "3" + digitsOnly + "0003";
  if (digitsOnly.length > 0 && digitsOnly.length < 13) {
    return "3" + digitsOnly.padStart(13, "0") + "3";
  }
  return "300000000000003";
}

function generateTlvData(tag: number, value: string | Buffer): Buffer {
  const valueBuffer = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  const tagBuffer = Buffer.from([tag]);
  let lengthBuffer: Buffer;
  if (valueBuffer.length <= 0xff) {
    lengthBuffer = Buffer.from([valueBuffer.length]);
  } else {
    lengthBuffer = Buffer.from([0x82, (valueBuffer.length >> 8) & 0xff, valueBuffer.length & 0xff]);
  }
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

export function generatePhase2QrCode(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: number,
  vatAmount: number,
  invoiceHash: string,
  signature: string,
  publicKey: string,
  certificateSignature: string
): string {
  const formattedVat = formatVatNumber(vatNumber);
  const pubBuf = Buffer.from(publicKey, "base64");
  const certSigBuf = Buffer.from(certificateSignature, "base64");
  return Buffer.concat([
    generateTlvData(1, sellerName),
    generateTlvData(2, formattedVat),
    generateTlvData(3, timestamp),
    generateTlvData(4, formatDecimal(totalWithVat)),
    generateTlvData(5, formatDecimal(vatAmount)),
    // Tag 6 (invoice hash) must carry the base64 *text* of the digest — the
    // same 44-char string ZATCA recomputes from the canonical XML and compares
    // against. generateTlvData UTF-8-encodes the string, producing 44 bytes.
    // Passing the base64-decoded 32 raw bytes here makes ZATCA report
    // "Invoice xml hash does not match with qr code invoice xml hash" for
    // simplified invoices (which keep our QR, unlike cleared standard ones).
    generateTlvData(6, invoiceHash),
    // Tag 7 (ECDSA invoice signature) follows the SAME rule as Tag 6: it must
    // carry the base64 *text* of the signature — the exact string ZATCA reads
    // from <ds:SignatureValue> in the XML and compares against. Passing the
    // base64-decoded raw signature bytes here makes ZATCA report "invoice
    // signature value does not match with qr invoice signature value" for
    // simplified invoices. Tags 8/9 (public key, cert signature) DO use the
    // raw decoded bytes — only tags 6 and 7 are base64 text.
    generateTlvData(7, signature),
    generateTlvData(8, pubBuf),
    generateTlvData(9, certSigBuf),
  ]).toString("base64");
}

export function generatePhase1QrCode(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: number,
  vatAmount: number
): string {
  const formattedVat = formatVatNumber(vatNumber);
  return Buffer.concat([
    generateTlvData(1, sellerName),
    generateTlvData(2, formattedVat),
    generateTlvData(3, timestamp),
    generateTlvData(4, formatDecimal(totalWithVat)),
    generateTlvData(5, formatDecimal(vatAmount)),
  ]).toString("base64");
}

export function generateInvoiceTypeCode(
  invoiceType: "standard" | "simplified",
  invoiceSubType: "01" | "02",
  documentType?: "invoice" | "credit_note" | "debit_note"
): string {
  // ZATCA invoice type codes (BT-3): 388 = Tax Invoice, 381 = Credit Note,
  // 383 = Debit Note. The code is determined solely by documentType.
  // invoiceSubType is a separate document-level flag and must not change it.
  if (documentType === "credit_note") return "381";
  if (documentType === "debit_note") return "383";
  return "388";
}

export function generateInvoiceTypeCodeName(
  invoiceType: "standard" | "simplified",
  documentType?: "invoice" | "credit_note" | "debit_note"
): string {
  // KSA-2 invoice transaction code, 9 characters (NNPNESBCG) — required by
  // ZATCA's current validator:
  //   positions 1-2 (NN) = invoice subtype — "01" for standard tax invoice,
  //   "02" for simplified tax invoice.
  //   position 3 (P) = 3rd-party, 4 (N) = nominal, 5 (E) = exports,
  //   6 (S) = summary, 7 (B) = self-billed, 8 (C) = continuous supply,
  //   9 (G) = B2G; all default to "0".
  // The document type (388/381/383) is BT-3 and is encoded ONLY in the
  // element value, never in this @name attribute — credit/debit notes keep
  // the same subtype prefix as their underlying invoice.
  const nn = invoiceType === "standard" ? "01" : "02";
  return `${nn}0000000`; // 9 characters total: NN + PNESBCG
}

/**
 * ZATCA invoice canonical hash: parse the (signed or unsigned) Invoice XML,
 * remove the three excluded subtrees (UBLExtensions, cac:Signature, the QR
 * AdditionalDocumentReference) — exactly the XPath transforms declared in the
 * ds:Reference — then run XML-C14N 1.0 over the remaining Invoice element.
 *
 * This matches what ZATCA's validator does, so the hash a verifier computes
 * from the final signed XML equals the DigestValue we embed.
 *
 * Important property: the contents of the *removed* subtrees do not affect the
 * canonical bytes. That's what lets us hash a "shell" XML containing
 * placeholder values for invoiceHash/signature/QR before we know the real
 * ones, then string-substitute the real values later without invalidating the
 * hash.
 */
export function canonicalizeInvoiceXml(xmlContent: string): string {
  const cleaned = xmlContent.replace(/^\uFEFF/, "");
  const doc = new DOMParser({
    onError: (level: string, msg: string) => { if (level === "fatalError") throw new Error(msg); },
  }).parseFromString(cleaned, "text/xml");

  const select = xpath.useNamespaces({
    inv: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  });

  const toRemove: any[] = [];
  for (const n of select("//ext:UBLExtensions", doc) as any[]) toRemove.push(n);
  for (const n of select("//cac:Signature", doc) as any[]) toRemove.push(n);
  for (const n of select("//cac:AdditionalDocumentReference[cbc:ID='QR']", doc) as any[]) toRemove.push(n);
  for (const n of toRemove) {
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  const invoiceEl = (select("/inv:Invoice", doc) as any[])[0]
    || (select("/*[local-name()='Invoice']", doc) as any[])[0];
  if (!invoiceEl) throw new Error("Invoice root element not found");

  const c14n = new C14nCanonicalization();
  return c14n.process(invoiceEl, {
    ancestorNamespaces: [],
    defaultNs: "",
    defaultNsForPrefix: {},
    inclusiveNamespacesPrefixList: [],
  });
}

/**
 * ZATCA invoice hash: SHA-256 of the canonical XML, expressed as base64 of
 * the raw 32-byte digest (44 characters). This matches ZATCA's Java SDK
 * convention. QR Tag 6 must receive this 44-character base64 *string* (UTF-8
 * encoded), NOT the decoded 32 raw bytes — ZATCA recomputes the hash from the
 * XML as this same base64 string and compares it byte-for-byte to Tag 6.
 *
 * History: an earlier version of this function emitted the 88-char form
 * (base64 of the lowercase hex string). The SDK-compliant 44-char form is
 * the canonical one; switch back if a specific ZATCA environment rejects it.
 */
export function generateInvoiceHash(xmlContent: string): string {
  return crypto.createHash("sha256").update(canonicalizeInvoiceXml(xmlContent), "utf8").digest("base64");
}

export function generateInvoiceHashHex(xmlContent: string): string {
  return crypto.createHash("sha256").update(canonicalizeInvoiceXml(xmlContent), "utf8").digest("hex");
}

/**
 * Canonicalize an arbitrary XML fragment (used for SignedInfo).
 */
function canonicalizeXmlFragment(xmlFragment: string): string {
  const doc = new DOMParser({
    onError: (level: string, msg: string) => { if (level === "fatalError") throw new Error(msg); },
  }).parseFromString(xmlFragment, "text/xml");
  const c14n = new C14nCanonicalization();
  return c14n.process(doc.documentElement, {
    ancestorNamespaces: [],
    defaultNs: "",
    defaultNsForPrefix: {},
    inclusiveNamespacesPrefixList: [],
  });
}

/**
 * Sign canonical SignedInfo bytes with ECDSA-SHA256. Node's `crypto.sign`
 * already selects ECDSA when the private key is an EC key.
 */
function signEcdsaSha256(privateKeyPem: string, data: string): string {
  const sign = crypto.createSign("SHA256");
  sign.update(data, "utf8");
  sign.end();
  return sign.sign(privateKeyPem).toString("base64");
}

export function signInvoice(xmlContent: string, privateKey: string): string {
  try {
    return signEcdsaSha256(privateKey, xmlContent);
  } catch (error) {
    console.error("Signature generation failed:", error);
    return "";
  }
}

/**
 * ZATCA certificate hash: same base64-of-hex convention as the invoice
 * hash. SHA-256 over the DER-encoded certificate bytes.
 */
export function generateCertificateHash(certificate: string): string {
  const cleanCert = extractCertificateBase64Body(certificate);
  const hex = crypto.createHash("sha256").update(Buffer.from(cleanCert, "base64")).digest("hex");
  return Buffer.from(hex, "utf8").toString("base64");
}

/**
 * Build the body parts of the invoice that are common to both the unsigned
 * and signed representations. These are the elements that LIVE inside the
 * canonical (post-strip) document — i.e. they are the bytes ZATCA hashes.
 */
function buildInvoiceBodyParts(data: ZatcaInvoiceData) {
  const {
    invoiceNumber, invoiceType, invoiceSubType, documentType,
    referencedInvoiceNumber, adjustmentReason,
    paymentMethod, discount,
    items, invoiceCounter, previousInvoiceHash, uuid,
    issueDate, issueTime, sellerInfo, buyerInfo
  } = data;

  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType, documentType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceType, documentType);
  const isCreditOrDebitNote = documentType === "credit_note" || documentType === "debit_note";
  const formattedVat = formatVatNumber(sellerInfo.vatNumber);

  const defaultPIH = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";
  const pihValue = previousInvoiceHash || defaultPIH;

  let invoiceLinesXml = "";
  let calculatedSubtotal = 0;
  let calculatedVat = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemVatRate = item.taxPercent ?? 15;
    const itemDiscount = Number((item as any).discount) || 0;
    const grossExtension = item.quantity * item.unitPrice;
    const lineExtension = Math.max(0, grossExtension - itemDiscount);
    const lineTax = lineExtension * (itemVatRate / 100);
    const lineTotal = lineExtension + lineTax;
    calculatedSubtotal += lineExtension;
    calculatedVat += lineTax;
    const lineDiscountXml = itemDiscount > 0 ? `
    <cac:AllowanceCharge>
      <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
      <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>
      <cbc:Amount currencyID="SAR">${formatDecimal(itemDiscount)}</cbc:Amount>
    </cac:AllowanceCharge>` : "";
    invoiceLinesXml += `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtension)}</cbc:LineExtensionAmount>${lineDiscountXml}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(lineTax)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="SAR">${formatDecimal(lineTotal)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(item.name)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${item.taxCategory || "S"}</cbc:ID>
        <cbc:Percent>${itemVatRate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${formatDecimal(item.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  const finalSubtotal = formatDecimal(calculatedSubtotal);
  const finalVat = formatDecimal(calculatedVat);
  const finalTotal = formatDecimal(calculatedSubtotal + calculatedVat);

  const buyerName = buyerInfo?.name || "NA";
  const buyerStreet = buyerInfo?.streetName || "-";
  const buyerBuilding = buyerInfo?.buildingNumber || "0000";
  const buyerDistrict = buyerInfo?.citySubdivision || "-";
  const buyerCity = buyerInfo?.city || "Riyadh";
  const buyerPostal = buyerInfo?.postalZone || "00000";
  const buyerCountry = buyerInfo?.countryCode || "SA";
  const buyerVat = buyerInfo?.vatNumber ? formatVatNumber(buyerInfo.vatNumber) : "";
  const buyerOtherIdScheme = (buyerInfo as any)?.otherIdScheme || "NAT";
  const buyerOtherIdValue = (buyerInfo as any)?.otherIdValue || "";
  const includeBuyerPartyId = !buyerVat && buyerOtherIdValue;

  const customerPartyXml = `
  <cac:AccountingCustomerParty>
    <cac:Party>${includeBuyerPartyId ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${escapeXml(buyerOtherIdScheme)}">${escapeXml(buyerOtherIdValue)}</cbc:ID>
      </cac:PartyIdentification>` : ""}
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(buyerStreet)}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(buyerBuilding)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(buyerDistrict)}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(buyerCity)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(buyerPostal)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(buyerCountry)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>${buyerVat ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${buyerVat}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(buyerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;

  let billingReferenceXml = "";
  if (isCreditOrDebitNote && referencedInvoiceNumber) {
    billingReferenceXml = `
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${escapeXml(referencedInvoiceNumber)}</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`;
  }

  // Header (everything before the QR / Signature / Supplier blocks). Used in
  // the unsigned variant directly. The signed variant uses the same content
  // but inserts UBLExtensions immediately before <cbc:ProfileID> and adds the
  // QR / cac:Signature blocks.
  const headerCommon = `<cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">${invoiceTypeCode}</cbc:InvoiceTypeCode>${
    isCreditOrDebitNote
      ? `
  <cbc:Note>${escapeXml((adjustmentReason && adjustmentReason.trim()) || "Adjustment")}</cbc:Note>`
      : ""
  }
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>${billingReferenceXml}
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${invoiceCounter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pihValue}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`;

  const supplierAndAfter = `<cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(sellerInfo.crNumber)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(sellerInfo.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(sellerInfo.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(sellerInfo.citySubdivision)}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(sellerInfo.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(sellerInfo.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(sellerInfo.countryCode)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${formattedVat}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(sellerInfo.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>${customerPartyXml}
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${escapeXml(issueDate)}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${paymentMethod === "cash" ? "10" : paymentMethod === "card" ? "48" : "30"}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${finalVat}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${finalSubtotal}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${finalVat}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${finalSubtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${finalSubtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${finalTotal}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${formatDecimal(discount)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${finalTotal}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${invoiceLinesXml}`;

  return {
    headerCommon,
    supplierAndAfter,
    calculatedSubtotal,
    calculatedVat,
  };
}

const INVOICE_NS_DECL =
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"' +
  ' xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"' +
  ' xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"' +
  ' xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"' +
  ' xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2"' +
  ' xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2"' +
  ' xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2"';

function buildSignedInvoiceXmlString(
  parts: { headerCommon: string; supplierAndAfter: string },
  signing: {
    invoiceHash: string;
    signedPropertiesHash: string;
    signatureValue: string;
    qrCode: string;
    certificateBase64: string;
    certificateHash: string;
    signingTime: string;
    issuerName: string;
    serialNumber: string;
  }
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${INVOICE_NS_DECL}>
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <sig:UBLDocumentSignatures>
          <sac:SignatureInformation>
            <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
            <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
            <ds:Signature Id="signature" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
              <ds:SignedInfo>
                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11" />
                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256" />
                <ds:Reference Id="invoiceSignedData" URI="">
                  <ds:Transforms>
                    <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                      <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
                    </ds:Transform>
                    <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                      <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
                    </ds:Transform>
                    <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                      <ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath>
                    </ds:Transform>
                    <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11" />
                  </ds:Transforms>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                  <ds:DigestValue>${signing.invoiceHash}</ds:DigestValue>
                </ds:Reference>
                <ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                  <ds:DigestValue>${signing.signedPropertiesHash}</ds:DigestValue>
                </ds:Reference>
              </ds:SignedInfo>
              <ds:SignatureValue>${signing.signatureValue}</ds:SignatureValue>
              <ds:KeyInfo>
                <ds:X509Data>
                  <ds:X509Certificate>${signing.certificateBase64}</ds:X509Certificate>
                </ds:X509Data>
              </ds:KeyInfo>
              <ds:Object>
                <xades:QualifyingProperties Target="signature" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#">
                  <xades:SignedProperties Id="xadesSignedProperties">
                    <xades:SignedSignatureProperties>
                      <xades:SigningTime>${signing.signingTime}</xades:SigningTime>
                      <xades:SigningCertificate>
                        <xades:Cert>
                          <xades:CertDigest>
                            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" />
                            <ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${signing.certificateHash}</ds:DigestValue>
                          </xades:CertDigest>
                          <xades:IssuerSerial>
                            <ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${escapeXml(signing.issuerName)}</ds:X509IssuerName>
                            <ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${escapeXml(signing.serialNumber)}</ds:X509SerialNumber>
                          </xades:IssuerSerial>
                        </xades:Cert>
                      </xades:SigningCertificate>
                    </xades:SignedSignatureProperties>
                  </xades:SignedProperties>
                </xades:QualifyingProperties>
              </ds:Object>
            </ds:Signature>
          </sac:SignatureInformation>
        </sig:UBLDocumentSignatures>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  ${parts.headerCommon}
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${signing.qrCode}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>
  ${parts.supplierAndAfter}
</Invoice>`;
}

function buildSignedPropertiesXml(signingTime: string, certificateHash: string, issuerName: string, serialNumber: string): string {
  // Single-line, with explicit ds: namespace decls on every ds:* element.
  // Hashed verbatim — must match what ZATCA recomputes when verifying the
  // second ds:Reference (URI="#xadesSignedProperties").
  return `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certificateHash}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${escapeXml(issuerName)}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${escapeXml(serialNumber)}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;
}

function buildSignedInfoXml(invoiceHash: string, signedPropertiesHash: string): string {
  return `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/><ds:Reference Id="invoiceSignedData" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${invoiceHash}</ds:DigestValue></ds:Reference><ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${signedPropertiesHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
}

/**
 * Generate ZATCA Phase 2 compliant invoice XML.
 *
 * When `credentials` are supplied, the result is a fully-signed invoice whose
 * embedded ds:DigestValue equals SHA-256(c14n(invoice without
 * UBLExtensions/cac:Signature/QR)) and whose embedded QR Tag 6 carries the
 * same hash bytes — i.e. ZATCA's "xml hash matches qr code hash" precondition
 * is satisfied by construction.
 *
 * When omitted, a Phase-1 unsigned shell is returned (no signing performed,
 * dummy placeholders inside the to-be-stripped blocks).
 */
export function generateSignedInvoiceXml(
  data: ZatcaInvoiceData,
  credentials?: SigningCredentials
): string {
  const parts = buildInvoiceBodyParts(data);
  const timestamp = `${data.issueDate}T${data.issueTime}Z`;
  const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, "");

  // --- Cert info (real values when credentials are provided) -------------
  let certificateBase64: string;
  let certificateHash: string;
  let publicKeyBase64: string;
  let certificateSignatureBase64: string;
  let issuerName = "CN=ZATCA-Code-Signing-CA, DC=zatca, DC=gov, DC=sa";
  let serialNumber = "0";

  const dummyHash = crypto.createHash("sha256").update("placeholder").digest("base64");
  const dummyB64 = Buffer.from("PLACEHOLDER").toString("base64");

  if (credentials?.privateKey && credentials?.certificate) {
    certificateBase64 = extractCertificateBase64Body(credentials.certificate);
    certificateHash = generateCertificateHash(credentials.certificate);
    try {
      publicKeyBase64 = extractPublicKeyBase64(credentials.certificate);
    } catch (e) {
      console.error("[ZATCA] Failed to extract public key, falling back:", e);
      publicKeyBase64 = certificateBase64;
    }
    try {
      certificateSignatureBase64 = extractCertificateSignatureBytes(credentials.certificate).toString("base64");
    } catch (e) {
      console.error("[ZATCA] Failed to extract certificate signature for QR Tag 9:", e);
      certificateSignatureBase64 = certificateHash;
    }
    try {
      const issuerSerial = getCertificateIssuerSerial(credentials.certificate);
      issuerName = issuerSerial.issuerName;
      serialNumber = issuerSerial.serialNumber;
    } catch (e) {
      console.error("[ZATCA] Failed to extract IssuerSerial, using defaults:", e);
    }
  } else {
    certificateBase64 = dummyB64;
    certificateHash = dummyHash;
    publicKeyBase64 = dummyB64;
    certificateSignatureBase64 = dummyHash;
  }

  // --- Step 1: Build a SHELL signedXml with placeholder hash/sig/QR. ----
  // The XPath transforms strip the UBLExtensions / cac:Signature / QR
  // AdditionalDocumentReference blocks before hashing, so the placeholder
  // contents inside those blocks DO NOT affect the canonical hash.
  const PLACEHOLDER_INV_HASH = "__INVOICE_HASH_PLACEHOLDER__";
  const PLACEHOLDER_SIGNED_PROPS_HASH = "__SIGNED_PROPS_HASH_PLACEHOLDER__";
  const PLACEHOLDER_SIGNATURE = "__SIGNATURE_VALUE_PLACEHOLDER__";
  const PLACEHOLDER_QR = "__QR_CODE_PLACEHOLDER__";

  const shellXml = buildSignedInvoiceXmlString(parts, {
    invoiceHash: PLACEHOLDER_INV_HASH,
    signedPropertiesHash: PLACEHOLDER_SIGNED_PROPS_HASH,
    signatureValue: PLACEHOLDER_SIGNATURE,
    qrCode: PLACEHOLDER_QR,
    certificateBase64,
    certificateHash,
    signingTime,
    issuerName,
    serialNumber,
  });

  // --- Step 2: Compute the canonical invoice hash from the shell. -------
  // This is the value that goes into <ds:DigestValue> AND into QR Tag 6.
  // ZATCA recomputes the same value from the final signed XML and compares.
  const invoiceHash = generateInvoiceHash(shellXml);

  // --- Step 3: Compute SignedProperties hash. ---------------------------
  // Same base64-of-hex convention as the invoice hash.
  const signedPropertiesXml = buildSignedPropertiesXml(signingTime, certificateHash, issuerName, serialNumber);
  const signedPropertiesHashHex = crypto.createHash("sha256").update(signedPropertiesXml, "utf8").digest("hex");
  const signedPropertiesHash = Buffer.from(signedPropertiesHashHex, "utf8").toString("base64");

  // --- Step 4: Build SignedInfo with the real hashes, canonicalize it,
  // and ECDSA-SHA256-sign the canonical bytes. ---------------------------
  let signatureValue = "";
  if (credentials?.privateKey) {
    const signedInfoXml = buildSignedInfoXml(invoiceHash, signedPropertiesHash);
    let canonicalSignedInfo: string;
    try {
      canonicalSignedInfo = canonicalizeXmlFragment(signedInfoXml);
    } catch (e) {
      console.error("[ZATCA] Failed to canonicalize SignedInfo, signing raw:", e);
      canonicalSignedInfo = signedInfoXml;
    }
    signatureValue = signEcdsaSha256(credentials.privateKey, canonicalSignedInfo);
  }

  // --- Step 5: Build the QR (Phase 2 if signed, Phase 1 otherwise). -----
  const qrCode = credentials?.privateKey
    ? generatePhase2QrCode(
        data.sellerInfo.name,
        data.sellerInfo.vatNumber,
        timestamp,
        parts.calculatedSubtotal + parts.calculatedVat,
        parts.calculatedVat,
        invoiceHash,
        signatureValue,
        publicKeyBase64,
        certificateSignatureBase64
      )
    : generatePhase1QrCode(
        data.sellerInfo.name,
        data.sellerInfo.vatNumber,
        timestamp,
        parts.calculatedSubtotal + parts.calculatedVat,
        parts.calculatedVat
      );

  // --- Step 6: Substitute the real values into the shell. ---------------
  // String replacement is safe here because every placeholder lives strictly
  // inside one of the to-be-stripped subtrees, so the canonical hash of the
  // resulting document is unchanged from step 2.
  let signedXml = shellXml
    .replace(PLACEHOLDER_INV_HASH, invoiceHash)
    .replace(PLACEHOLDER_SIGNED_PROPS_HASH, signedPropertiesHash)
    .replace(PLACEHOLDER_SIGNATURE, signatureValue)
    .replace(PLACEHOLDER_QR, qrCode);

  // Defensive sanity check: recompute the canonical hash from the final
  // document and verify it matches what we embedded. If this ever drifts we
  // want a loud, immediate failure rather than another silent submission
  // rejected by ZATCA.
  if (credentials?.privateKey) {
    const verifyHash = generateInvoiceHash(signedXml);
    if (verifyHash !== invoiceHash) {
      throw new Error(
        `[ZATCA] Internal hash mismatch after substitution: shell=${invoiceHash} final=${verifyHash}. This is a bug in xml-generator.ts.`
      );
    }
  }

  return signedXml;
}

export function generateUnsignedInvoiceXml(data: ZatcaInvoiceData): string {
  return generateSignedInvoiceXml(data, undefined);
}

// Alias for backward compatibility
export const generateZatcaInvoiceXml = generateSignedInvoiceXml;

export type { ZatcaInvoiceData, ZatcaInvoiceLineItem, SigningCredentials };
