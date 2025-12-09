interface ZatcaInvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface ZatcaInvoiceData {
  invoiceNumber: string;
  invoiceType: "standard" | "simplified";
  invoiceSubType: "01" | "02";
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

const ZATCA_XML_NAMESPACE = {
  xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  "xmlns:ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
};

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

export function generateInvoiceTypeCode(invoiceType: "standard" | "simplified", invoiceSubType: "01" | "02"): string {
  const typeCode = invoiceType === "standard" ? "388" : "388";
  return typeCode;
}

export function generateInvoiceTypeCodeName(invoiceSubType: "01" | "02"): string {
  return invoiceSubType === "01" ? "0100000" : "0200000";
}

export function generatePartyTaxScheme(vatNumber: string): string {
  return `
    <cac:PartyTaxScheme>
      <cbc:CompanyID>${escapeXml(vatNumber)}</cbc:CompanyID>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:PartyTaxScheme>`;
}

export function generatePostalAddress(
  streetName: string,
  buildingNumber: string,
  citySubdivision: string,
  city: string,
  postalZone: string,
  countryCode: string
): string {
  return `
    <cac:PostalAddress>
      <cbc:StreetName>${escapeXml(streetName)}</cbc:StreetName>
      <cbc:BuildingNumber>${escapeXml(buildingNumber)}</cbc:BuildingNumber>
      <cbc:CitySubdivisionName>${escapeXml(citySubdivision)}</cbc:CitySubdivisionName>
      <cbc:CityName>${escapeXml(city)}</cbc:CityName>
      <cbc:PostalZone>${escapeXml(postalZone)}</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode>${escapeXml(countryCode)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>`;
}

export function generateAccountingSupplierParty(seller: ZatcaInvoiceData["sellerInfo"]): string {
  return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(seller.crNumber)}</cbc:ID>
      </cac:PartyIdentification>
      ${generatePostalAddress(
        seller.streetName,
        seller.buildingNumber,
        seller.citySubdivision,
        seller.city,
        seller.postalZone,
        seller.countryCode
      )}
      ${generatePartyTaxScheme(seller.vatNumber)}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(seller.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>`;
}

export function generateAccountingCustomerParty(buyer: NonNullable<ZatcaInvoiceData["buyerInfo"]>): string {
  return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${buyer.vatNumber ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="VAT">${escapeXml(buyer.vatNumber)}</cbc:ID>
      </cac:PartyIdentification>` : ""}
      ${buyer.streetName && buyer.buildingNumber && buyer.city && buyer.postalZone && buyer.countryCode ? 
        generatePostalAddress(
          buyer.streetName,
          buyer.buildingNumber,
          buyer.citySubdivision || "",
          buyer.city,
          buyer.postalZone,
          buyer.countryCode
        ) : ""}
      ${buyer.vatNumber ? generatePartyTaxScheme(buyer.vatNumber) : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(buyer.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;
}

export function generateInvoiceLine(
  item: ZatcaInvoiceLineItem,
  lineIndex: number,
  vatRate: number = 15
): string {
  const lineExtensionAmount = item.totalAmount;
  const taxAmount = lineExtensionAmount * (vatRate / 100);
  const roundingAmount = lineExtensionAmount + taxAmount;
  
  return `
  <cac:InvoiceLine>
    <cbc:ID>${lineIndex}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtensionAmount)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="SAR">${formatDecimal(roundingAmount)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(item.name)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${formatDecimal(vatRate)}</cbc:Percent>
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

export function generateTaxTotal(
  taxableAmount: number,
  taxAmount: number,
  vatRate: number = 15
): string {
  return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${formatDecimal(taxableAmount)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${formatDecimal(vatRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
}

export function generateLegalMonetaryTotal(
  lineExtensionAmount: number,
  taxExclusiveAmount: number,
  taxInclusiveAmount: number,
  payableAmount: number,
  allowanceTotalAmount: number = 0
): string {
  return `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtensionAmount)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${formatDecimal(taxExclusiveAmount)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${formatDecimal(taxInclusiveAmount)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${formatDecimal(allowanceTotalAmount)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${formatDecimal(payableAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
}

export function generateUBLExtensions(
  signedXml?: string,
  qrCode?: string
): string {
  if (!signedXml && !qrCode) return "";
  
  return `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        ${signedXml || "<!-- Signature placeholder -->"}
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`;
}

export function generateAdditionalDocumentReference(
  id: string,
  uuid: string,
  previousInvoiceHash: string | null
): string {
  let references = `
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  </cac:AdditionalDocumentReference>`;
  
  if (previousInvoiceHash) {
    references += `
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${escapeXml(previousInvoiceHash)}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`;
  }
  
  return references;
}

export function generateZatcaInvoiceXml(data: ZatcaInvoiceData): string {
  const { invoice, items, invoiceCounter, previousInvoiceHash, uuid, issueDate, issueTime, sellerInfo, buyerInfo } = data;
  
  const invoiceType = invoice.invoiceType === "b2b" ? "standard" : "simplified";
  const invoiceSubType = invoice.invoiceType === "b2b" ? "01" : "02";
  
  const subtotal = Number(invoice.subtotal);
  const vatAmount = Number(invoice.vatAmount);
  const total = Number(invoice.total);
  const discount = Number(invoice.discount);
  
  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceSubType);
  
  const invoiceLines = items.map((item, index) => 
    generateInvoiceLine(item, index + 1)
  ).join("\n");
  
  const taxTotal = generateTaxTotal(subtotal, vatAmount);
  const legalMonetaryTotal = generateLegalMonetaryTotal(subtotal, subtotal, total, total, discount);
  const additionalDocRefs = generateAdditionalDocumentReference(invoice.invoiceNumber, uuid, previousInvoiceHash);
  const supplierParty = generateAccountingSupplierParty(sellerInfo);
  const customerParty = buyerInfo ? generateAccountingCustomerParty(buyerInfo) : "";
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${ZATCA_XML_NAMESPACE.xmlns}"
         xmlns:cac="${ZATCA_XML_NAMESPACE["xmlns:cac"]}"
         xmlns:cbc="${ZATCA_XML_NAMESPACE["xmlns:cbc"]}"
         xmlns:ext="${ZATCA_XML_NAMESPACE["xmlns:ext"]}">
  ${generateUBLExtensions()}
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${invoiceCounter}</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  ${additionalDocRefs}
  ${supplierParty}
  ${customerParty}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${invoice.paymentMethod === "cash" ? "10" : invoice.paymentMethod === "card" ? "48" : "30"}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  ${taxTotal}
  ${legalMonetaryTotal}
  ${invoiceLines}
</Invoice>`;

  return xml;
}

export function generateInvoiceHash(xmlContent: string): Promise<string> {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256");
  hash.update(xmlContent, "utf8");
  return hash.digest("base64");
}

export type { ZatcaInvoiceData };
