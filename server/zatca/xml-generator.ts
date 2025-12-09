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
 * According to ZATCA specifications for Phase 1 (5 tags)
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

export function generateInvoiceTypeCodeName(invoiceType: "standard" | "simplified"): string {
  return invoiceType === "standard" ? "0100000" : "0200000";
}

/**
 * Generate Phase 1 simplified invoice XML (unsigned, with QR code)
 * Matches ZATCA official sample format exactly
 */
export function generateUnsignedInvoiceXml(data: Omit<ZatcaInvoiceData, 'qrCode' | 'signatureValue' | 'signedPropertiesHash' | 'invoiceHash' | 'certificateBase64'>): string {
  const { 
    invoiceNumber, invoiceType, invoiceSubType, paymentMethod,
    subtotal, vatAmount, total, discount,
    items, invoiceCounter, previousInvoiceHash, uuid, 
    issueDate, issueTime, sellerInfo, buyerInfo
  } = data;
  
  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceType);
  const formattedVat = formatVatNumber(sellerInfo.vatNumber);
  
  const timestamp = `${issueDate}T${issueTime}`;
  const qrCode = generateZatcaTlvQrCode(
    sellerInfo.name,
    sellerInfo.vatNumber,
    timestamp,
    total,
    vatAmount
  );
  
  const defaultPIH = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";
  const pihValue = previousInvoiceHash || defaultPIH;
  
  let invoiceLinesXml = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemVatRate = item.taxPercent ?? 15;
    const lineExtension = item.quantity * item.unitPrice;
    const lineTax = lineExtension * (itemVatRate / 100);
    const lineTotal = lineExtension + lineTax;
    
    invoiceLinesXml += `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtension)}</cbc:LineExtensionAmount>
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

  let customerPartyXml = "";
  if (buyerInfo) {
    const buyerVat = buyerInfo.vatNumber ? formatVatNumber(buyerInfo.vatNumber) : "";
    customerPartyXml = `
  <cac:AccountingCustomerParty>
    <cac:Party>${buyerInfo.vatNumber ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="VAT">${buyerVat}</cbc:ID>
      </cac:PartyIdentification>` : ""}
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(buyerInfo.streetName || "-")}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(buyerInfo.buildingNumber || "0000")}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(buyerInfo.citySubdivision || "-")}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(buyerInfo.city || "Riyadh")}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(buyerInfo.postalZone || "00000")}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(buyerInfo.countryCode || "SA")}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>${buyerInfo.vatNumber ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${buyerVat}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(buyerInfo.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${invoiceCounter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pihValue}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrCode}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
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
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${formatDecimal(total)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${formatDecimal(discount)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${formatDecimal(total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${invoiceLinesXml}
</Invoice>`;

  return xml;
}

/**
 * Generate signed invoice XML for Phase 2 (with digital signature)
 */
export function generateZatcaInvoiceXml(data: ZatcaInvoiceData): string {
  const { 
    invoiceNumber, invoiceType, invoiceSubType, paymentMethod,
    subtotal, vatAmount, total, discount,
    items, invoiceCounter, previousInvoiceHash, uuid, 
    issueDate, issueTime, sellerInfo, buyerInfo,
    qrCode, signatureValue, signedPropertiesHash, invoiceHash, certificateBase64
  } = data;
  
  const invoiceTypeCode = generateInvoiceTypeCode(invoiceType, invoiceSubType);
  const invoiceTypeCodeName = generateInvoiceTypeCodeName(invoiceType);
  const formattedVat = formatVatNumber(sellerInfo.vatNumber);
  
  const defaultPIH = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";
  const pihValue = previousInvoiceHash || defaultPIH;
  const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  
  let invoiceLinesXml = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemVatRate = item.taxPercent ?? 15;
    const lineExtension = item.quantity * item.unitPrice;
    const lineTax = lineExtension * (itemVatRate / 100);
    const lineTotal = lineExtension + lineTax;
    
    invoiceLinesXml += `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(lineExtension)}</cbc:LineExtensionAmount>
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

  let customerPartyXml = "";
  if (buyerInfo) {
    const buyerVat = buyerInfo.vatNumber ? formatVatNumber(buyerInfo.vatNumber) : "";
    customerPartyXml = `
  <cac:AccountingCustomerParty>
    <cac:Party>${buyerInfo.vatNumber ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="VAT">${buyerVat}</cbc:ID>
      </cac:PartyIdentification>` : ""}
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(buyerInfo.streetName || "-")}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(buyerInfo.buildingNumber || "0000")}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(buyerInfo.citySubdivision || "-")}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(buyerInfo.city || "Riyadh")}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(buyerInfo.postalZone || "00000")}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(buyerInfo.countryCode || "SA")}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>${buyerInfo.vatNumber ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${buyerVat}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(buyerInfo.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
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
                  <ds:DigestValue>${invoiceHash || ""}</ds:DigestValue>
                </ds:Reference>
                <ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">
                  <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
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
                <xades:QualifyingProperties Target="signature" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#">
                  <xades:SignedProperties Id="xadesSignedProperties">
                    <xades:SignedSignatureProperties>
                      <xades:SigningTime>${signingTime}</xades:SigningTime>
                      <xades:SigningCertificate>
                        <xades:Cert>
                          <xades:CertDigest>
                            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
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
  </ext:UBLExtensions>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${escapeXml(uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${invoiceCounter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pihValue}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrCode || ""}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>
  <cac:AccountingSupplierParty>
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
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${formatDecimal(vatAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${formatDecimal(subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${formatDecimal(total)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${formatDecimal(discount)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${formatDecimal(total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${invoiceLinesXml}
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
