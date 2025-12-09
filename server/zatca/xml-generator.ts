import crypto from "crypto";

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
  qrCode?: string;
  signatureValue?: string;
  signedPropertiesHash?: string;
  invoiceHash?: string;
  certificateBase64?: string;
}

const ZATCA_XML_NAMESPACE = {
  xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  "xmlns:ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  "xmlns:sig": "urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2",
  "xmlns:sac": "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
  "xmlns:sbc": "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
  "xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
  "xmlns:xades": "http://uri.etsi.org/01903/v1.3.2#",
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

/**
 * Validates and formats VAT number to ZATCA requirements
 * VAT number must be exactly 15 digits, starting and ending with "3"
 */
export function formatVatNumber(vatNumber: string): string {
  const digitsOnly = vatNumber.replace(/\D/g, "");
  
  if (digitsOnly.length === 15 && digitsOnly.startsWith("3") && digitsOnly.endsWith("3")) {
    return digitsOnly;
  }
  
  if (digitsOnly.length === 10) {
    return "3" + digitsOnly + "0003";
  }
  
  if (digitsOnly.length > 0 && digitsOnly.length < 13) {
    const paddedNumber = digitsOnly.padStart(13, "0");
    return "3" + paddedNumber + "3";
  }
  
  return "300000000000003";
}

/**
 * Generates ZATCA TLV (Tag-Length-Value) QR code data
 * According to ZATCA specifications for Phase 1
 */
export function generateZatcaTlvQrCode(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: number,
  vatAmount: number
): string {
  const formattedVat = formatVatNumber(vatNumber);
  
  const tlvData: Buffer[] = [];
  
  const addTlv = (tag: number, value: string) => {
    const valueBuffer = Buffer.from(value, "utf8");
    const tagBuffer = Buffer.from([tag]);
    const lengthBuffer = Buffer.from([valueBuffer.length]);
    tlvData.push(Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]));
  };
  
  addTlv(1, sellerName);
  addTlv(2, formattedVat);
  addTlv(3, timestamp);
  addTlv(4, formatDecimal(totalWithVat));
  addTlv(5, formatDecimal(vatAmount));
  
  const combinedBuffer = Buffer.concat(tlvData);
  return combinedBuffer.toString("base64");
}

export function generateInvoiceTypeCode(invoiceType: "standard" | "simplified", invoiceSubType: "01" | "02"): string {
  if (invoiceSubType === "02") {
    return invoiceType === "standard" ? "383" : "381";
  }
  return "388";
}

export function generateInvoiceTypeCodeName(invoiceType: "standard" | "simplified", invoiceSubType: "01" | "02"): string {
  const base = invoiceType === "standard" ? "0100000" : "0200000";
  return base;
}

export function generatePartyTaxScheme(vatNumber: string): string {
  const formattedVat = formatVatNumber(vatNumber);
  return `
    <cac:PartyTaxScheme>
      <cbc:CompanyID>${escapeXml(formattedVat)}</cbc:CompanyID>
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
        <cbc:ID schemeID="VAT">${escapeXml(formatVatNumber(buyer.vatNumber))}</cbc:ID>
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
  const itemVatRate = item.taxPercent ?? vatRate;
  const taxCategory = item.taxCategory ?? "S";
  
  const lineExtensionAmount = item.quantity * item.unitPrice;
  const taxAmount = lineExtensionAmount * (itemVatRate / 100);
  const roundingAmount = lineExtensionAmount + taxAmount;
  
  return `
  <cac:InvoiceLine>
    <cbc:ID>${lineIndex}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${formatDecimal(item.quantity, 0)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtensionAmount)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="SAR">${formatDecimal(roundingAmount)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(item.name)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">${taxCategory}</cbc:ID>
        <cbc:Percent>${formatDecimal(itemVatRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${formatDecimal(item.unitPrice)}</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="PCE">1</cbc:BaseQuantity>
    </cac:Price>
  </cac:InvoiceLine>`;
}

export function generateTaxTotal(
  taxableAmount: number,
  taxAmount: number,
  vatRate: number = 15,
  taxCategory: string = "S"
): string {
  return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${formatDecimal(taxableAmount)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">${taxCategory}</cbc:ID>
        <cbc:Percent>${formatDecimal(vatRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
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
  invoiceHash?: string,
  signatureValue?: string,
  certificateBase64?: string,
  signedPropertiesHash?: string
): string {
  const signingTime = new Date().toISOString();
  
  return `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <sig:UBLDocumentSignatures xmlns:sig="${ZATCA_XML_NAMESPACE["xmlns:sig"]}"
                                   xmlns:sac="${ZATCA_XML_NAMESPACE["xmlns:sac"]}"
                                   xmlns:sbc="${ZATCA_XML_NAMESPACE["xmlns:sbc"]}">
          <sac:SignatureInformation>
            <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
            <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
            <ds:Signature xmlns:ds="${ZATCA_XML_NAMESPACE["xmlns:ds"]}" Id="signature">
              <ds:SignedInfo>
                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
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
                    <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                  </ds:Transforms>
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                  <ds:DigestValue>${invoiceHash || ""}</ds:DigestValue>
                </ds:Reference>
                <ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                  <ds:DigestValue>${signedPropertiesHash || ""}</ds:DigestValue>
                </ds:Reference>
              </ds:SignedInfo>
              <ds:SignatureValue>${signatureValue || ""}</ds:SignatureValue>
              <ds:KeyInfo>
                <ds:X509Data>
                  <ds:X509Certificate>${certificateBase64 || ""}</ds:X509Certificate>
                </ds:X509Data>
              </ds:KeyInfo>
              <ds:Object>
                <xades:QualifyingProperties xmlns:xades="${ZATCA_XML_NAMESPACE["xmlns:xades"]}" Target="signature">
                  <xades:SignedProperties Id="xadesSignedProperties">
                    <xades:SignedSignatureProperties>
                      <xades:SigningTime>${signingTime}</xades:SigningTime>
                      <xades:SigningCertificate>
                        <xades:Cert>
                          <xades:CertDigest>
                            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                            <ds:DigestValue>${certificateBase64 ? crypto.createHash("sha256").update(Buffer.from(certificateBase64, "base64")).digest("base64") : ""}</ds:DigestValue>
                          </xades:CertDigest>
                          <xades:IssuerSerial>
                            <ds:X509IssuerName>CN=ZATCA-Code-Signing-CA</ds:X509IssuerName>
                            <ds:X509SerialNumber>0</ds:X509SerialNumber>
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
  </ext:UBLExtensions>`;
}

export function generateSignature(): string {
  return `
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>`;
}

export function generateAdditionalDocumentReference(
  invoiceCounter: number,
  uuid: string,
  previousInvoiceHash: string | null,
  qrCode?: string
): string {
  const defaultPIH = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";
  const pihValue = previousInvoiceHash || defaultPIH;
  
  let references = `
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
  
  if (qrCode) {
    references += `
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${escapeXml(qrCode)}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`;
  }
  
  return references;
}

export function generateZatcaInvoiceXml(data: ZatcaInvoiceData): string {
  const { 
    invoiceNumber, invoiceType, invoiceSubType, paymentMethod,
    subtotal, vatAmount, total, discount,
    items, invoiceCounter, previousInvoiceHash, uuid, 
    issueDate, issueTime, sellerInfo, buyerInfo,
    qrCode, signatureValue, signedPropertiesHash, invoiceHash, certificateBase64
  } = data;
  
  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceType, invoiceSubType);
  
  const invoiceLines = items.map((item, index) => 
    generateInvoiceLine(item, index + 1)
  ).join("\n");
  
  const taxTotal = generateTaxTotal(subtotal, vatAmount);
  const legalMonetaryTotal = generateLegalMonetaryTotal(subtotal, subtotal, total, total, discount);
  const additionalDocRefs = generateAdditionalDocumentReference(invoiceCounter, uuid, previousInvoiceHash, qrCode);
  const supplierParty = generateAccountingSupplierParty(sellerInfo);
  const customerParty = buyerInfo ? generateAccountingCustomerParty(buyerInfo) : "";
  const ublExtensions = generateUBLExtensions(invoiceHash, signatureValue, certificateBase64, signedPropertiesHash);
  const signature = generateSignature();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${ZATCA_XML_NAMESPACE.xmlns}"
         xmlns:cac="${ZATCA_XML_NAMESPACE["xmlns:cac"]}"
         xmlns:cbc="${ZATCA_XML_NAMESPACE["xmlns:cbc"]}"
         xmlns:ext="${ZATCA_XML_NAMESPACE["xmlns:ext"]}">
  ${ublExtensions}
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
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
  ${signature}
  ${supplierParty}
  ${customerParty}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${paymentMethod === "cash" ? "10" : paymentMethod === "card" ? "48" : "30"}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  ${taxTotal}
  ${legalMonetaryTotal}
  ${invoiceLines}
</Invoice>`;

  return xml;
}

/**
 * Generate unsigned invoice XML for Phase 1 simplified invoices
 * This version includes proper QR code but no digital signature
 */
export function generateUnsignedInvoiceXml(data: Omit<ZatcaInvoiceData, 'qrCode' | 'signatureValue' | 'signedPropertiesHash' | 'invoiceHash' | 'certificateBase64'>): string {
  const { 
    invoiceNumber, invoiceType, invoiceSubType, paymentMethod,
    subtotal, vatAmount, total, discount,
    items, invoiceCounter, previousInvoiceHash, uuid, 
    issueDate, issueTime, sellerInfo, buyerInfo
  } = data;
  
  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceType, invoiceSubType);
  
  const timestamp = `${issueDate}T${issueTime}`;
  const qrCode = generateZatcaTlvQrCode(
    sellerInfo.name,
    sellerInfo.vatNumber,
    timestamp,
    total,
    vatAmount
  );
  
  const invoiceLines = items.map((item, index) => 
    generateInvoiceLine(item, index + 1)
  ).join("\n");
  
  const taxTotal = generateTaxTotal(subtotal, vatAmount);
  const legalMonetaryTotal = generateLegalMonetaryTotal(subtotal, subtotal, total, total, discount);
  const additionalDocRefs = generateAdditionalDocumentReference(invoiceCounter, uuid, previousInvoiceHash, qrCode);
  const supplierParty = generateAccountingSupplierParty(sellerInfo);
  const customerParty = buyerInfo ? generateAccountingCustomerParty(buyerInfo) : "";
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${ZATCA_XML_NAMESPACE.xmlns}"
         xmlns:cac="${ZATCA_XML_NAMESPACE["xmlns:cac"]}"
         xmlns:cbc="${ZATCA_XML_NAMESPACE["xmlns:cbc"]}"
         xmlns:ext="${ZATCA_XML_NAMESPACE["xmlns:ext"]}">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  ${additionalDocRefs}
  ${supplierParty}
  ${customerParty}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${paymentMethod === "cash" ? "10" : paymentMethod === "card" ? "48" : "30"}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  ${taxTotal}
  ${legalMonetaryTotal}
  ${invoiceLines}
</Invoice>`;

  return xml;
}

export function generateInvoiceHash(xmlContent: string): string {
  let cleanedXml = xmlContent.replace(/<\?xml[^?]*\?>\s*/g, "");
  cleanedXml = cleanedXml.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/g, "");
  cleanedXml = cleanedXml.replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/g, "");
  cleanedXml = cleanedXml.replace(/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/g, "");
  
  cleanedXml = cleanedXml.replace(/>\s+</g, "><").trim();
  
  const hash = crypto.createHash("sha256");
  hash.update(cleanedXml, "utf8");
  return hash.digest("base64");
}

export function generateInvoiceHashHex(xmlContent: string): string {
  let cleanedXml = xmlContent.replace(/<\?xml[^?]*\?>\s*/g, "");
  cleanedXml = cleanedXml.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/g, "");
  cleanedXml = cleanedXml.replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/g, "");
  cleanedXml = cleanedXml.replace(/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/g, "");
  
  cleanedXml = cleanedXml.replace(/>\s+</g, "><").trim();
  
  const hash = crypto.createHash("sha256");
  hash.update(cleanedXml, "utf8");
  return hash.digest("hex");
}

export type { ZatcaInvoiceData, ZatcaInvoiceLineItem };
