import { storage } from "../storage";
import { generateZatcaInvoiceXml, generateUnsignedInvoiceXml, generateInvoiceHash, generateInvoiceHashHex, type ZatcaInvoiceData } from "./xml-generator";
import { generateZatcaQRCode, generateUUID, signWithECDSA, formatIssueDate, formatIssueTime, formatTimestamp, hashSHA256Hex, extractPublicKeyBase64 } from "./crypto";
import { ZatcaApiClient, submitInvoiceToZatca, type ZatcaConfig } from "./api-client";
import { signInvoiceWithSDK, generateCSRWithSDK, validateInvoiceWithSDK, isSDKAvailable } from "./sdk-wrapper";
import QRCode from "qrcode";

const USE_SDK = isSDKAvailable();
console.log(`[ZATCA] SDK available: ${USE_SDK}`);

interface ManualSigningResult {
  signedXml: string;
  invoiceHash: string;
  invoiceHashHex: string;
  qrCodeBase64: string;
  certificateBase64?: string;
  publicKeyBase64?: string;
}

async function signInvoiceManually(
  unsignedXml: string,
  baseInvoiceData: any,
  settings: any,
  now: Date,
  previousHash: string | null,
  timestamp: string
): Promise<ManualSigningResult> {
  const invoiceHash = generateInvoiceHash(unsignedXml);
  const invoiceHashHex = generateInvoiceHashHex(unsignedXml);
  
  let signature: string | undefined;
  let signedPropertiesHash: string | undefined;
  let certificateBase64: string | undefined;
  let publicKeyBase64: string | undefined;
  
  const certificate = settings.productionCsid || settings.complianceCsid;
  
  if (settings.privateKey && certificate) {
    try {
      certificateBase64 = certificate.replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '');
      
      const certHash = require("crypto").createHash("sha256")
        .update(Buffer.from(certificateBase64!, "base64"))
        .digest("base64");
      
      const signingTime = now.toISOString();
      const signedPropertiesXml = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certHash}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">CN=ZATCA-Code-Signing-CA</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">0</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;
      
      signedPropertiesHash = require("crypto").createHash("sha256")
        .update(signedPropertiesXml, "utf8")
        .digest("base64");
      
      const signedInfoXml = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/><ds:Reference Id="invoiceSignedData" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${invoiceHash}</ds:DigestValue></ds:Reference><ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${signedPropertiesHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
      
      signature = signWithECDSA(settings.privateKey, signedInfoXml);
      
      try {
        publicKeyBase64 = extractPublicKeyBase64(certificate);
      } catch (e) {
        publicKeyBase64 = certificateBase64;
      }
    } catch (error) {
      console.error("Failed to sign invoice:", error);
    }
  }
  
  const qrTlvData = {
    sellerName: settings.csrOrganizationName || "",
    vatNumber: settings.csrOrganizationIdentifier || "",
    timestamp: timestamp,
    invoiceTotal: baseInvoiceData.total.toFixed(2),
    vatTotal: baseInvoiceData.vatAmount.toFixed(2),
    invoiceHash: invoiceHashHex,
    signature: signature,
    publicKey: publicKeyBase64
  };
  const qrCodeBase64 = generateZatcaQRCode(qrTlvData);
  
  const signedInvoiceData = {
    ...baseInvoiceData,
    qrCode: qrCodeBase64,
    signatureValue: signature,
    signedPropertiesHash: signedPropertiesHash,
    invoiceHash: invoiceHash,
    certificateBase64: certificateBase64
  };
  
  const signedXml = generateZatcaInvoiceXml(signedInvoiceData);
  
  return {
    signedXml,
    invoiceHash,
    invoiceHashHex,
    qrCodeBase64,
    certificateBase64,
    publicKeyBase64
  };
}

interface ProcessInvoiceParams {
  restaurantId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceType: "standard" | "simplified";
  paymentMethod: "cash" | "card" | "bank_transfer";
  subtotal: number;
  vatAmount: number;
  total: number;
  discount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  customerName?: string;
  customerVat?: string;
}

interface ZatcaProcessResult {
  success: boolean;
  uuid: string;
  invoiceHash: string;
  qrCode: string;
  qrCodeImage: string;
  signedXml?: string;
  submissionStatus: "pending" | "cleared" | "reported" | "rejected";
  zatcaResponse?: any;
  errors?: Array<{ code: string; message: string }>;
}

export async function processInvoiceForZatca(
  params: ProcessInvoiceParams
): Promise<ZatcaProcessResult> {
  const settings = await storage.getZatcaSettings(params.restaurantId);
  
  if (!settings) {
    return {
      success: false,
      uuid: "",
      invoiceHash: "",
      qrCode: "",
      qrCodeImage: "",
      submissionStatus: "rejected",
      errors: [{ code: "NO_SETTINGS", message: "ZATCA settings not configured for this restaurant" }]
    };
  }

  if (!settings.isEnabled) {
    return {
      success: false,
      uuid: "",
      invoiceHash: "",
      qrCode: "",
      qrCodeImage: "",
      submissionStatus: "rejected",
      errors: [{ code: "ZATCA_DISABLED", message: "ZATCA integration is not enabled" }]
    };
  }

  const uuid = generateUUID();
  const now = new Date();
  const issueDate = formatIssueDate(now);
  const issueTime = formatIssueTime(now);
  const timestamp = formatTimestamp(now);

  const previousHashHex = settings.lastInvoiceHash || null;

  const { counter, previousHash } = await storage.incrementInvoiceCounter(
    params.restaurantId,
    previousHashHex || ""
  );

  const invoiceSubType = params.invoiceType === "standard" ? "01" : "02";

  const baseInvoiceData = {
    invoiceNumber: params.invoiceNumber,
    invoiceType: params.invoiceType,
    invoiceSubType: invoiceSubType as "01" | "02",
    paymentMethod: params.paymentMethod,
    subtotal: params.subtotal,
    vatAmount: params.vatAmount,
    total: params.total,
    discount: params.discount,
    items: params.items,
    invoiceCounter: counter,
    previousInvoiceHash: previousHash || null,
    uuid,
    issueDate,
    issueTime,
    sellerInfo: {
      name: settings.csrOrganizationName || "",
      vatNumber: settings.csrOrganizationIdentifier || "",
      streetName: settings.sellerStreetName || "",
      buildingNumber: settings.sellerBuildingNumber || "",
      citySubdivision: settings.sellerCitySubdivision || "",
      city: settings.sellerCity || "",
      postalZone: settings.sellerPostalZone || "",
      countryCode: settings.csrCountryName || "SA",
      crNumber: settings.sellerCrNumber || ""
    },
    buyerInfo: params.customerName ? {
      name: params.customerName,
      vatNumber: params.customerVat
    } : undefined
  };

  const unsignedXml = generateUnsignedInvoiceXml(baseInvoiceData);
  
  let signedXml: string;
  let invoiceHash: string;
  let invoiceHashHex: string;
  let qrCodeBase64: string;
  let certificateBase64: string | undefined;
  let publicKeyBase64: string | undefined;
  
  const certificate = settings.productionCsid || settings.complianceCsid;
  
  if (USE_SDK && settings.privateKey && certificate) {
    console.log("[ZATCA] Using SDK for invoice signing");
    try {
      const certPem = certificate.includes("-----BEGIN") 
        ? certificate 
        : `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----`;
      
      const sdkResult = await signInvoiceWithSDK(
        unsignedXml,
        certPem,
        settings.privateKey,
        previousHash || undefined
      );
      
      if (sdkResult.success && sdkResult.signedInvoice) {
        signedXml = sdkResult.signedInvoice;
        invoiceHash = sdkResult.invoiceHash || generateInvoiceHash(signedXml);
        invoiceHashHex = generateInvoiceHashHex(signedXml);
        qrCodeBase64 = sdkResult.qrCode || "";
        
        certificateBase64 = certificate.replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/\s/g, '');
        
        try {
          publicKeyBase64 = extractPublicKeyBase64(certificate);
        } catch (e) {
          publicKeyBase64 = certificateBase64;
        }
      } else {
        console.error("[ZATCA] SDK signing failed:", sdkResult.error);
        throw new Error(sdkResult.error || "SDK signing failed");
      }
    } catch (error) {
      console.error("[ZATCA] SDK error, falling back to manual signing:", error);
      const fallbackResult = await signInvoiceManually(unsignedXml, baseInvoiceData, settings, now, previousHash, timestamp);
      signedXml = fallbackResult.signedXml;
      invoiceHash = fallbackResult.invoiceHash;
      invoiceHashHex = fallbackResult.invoiceHashHex;
      qrCodeBase64 = fallbackResult.qrCodeBase64;
      certificateBase64 = fallbackResult.certificateBase64;
      publicKeyBase64 = fallbackResult.publicKeyBase64;
    }
  } else {
    console.log("[ZATCA] Using manual signing (SDK not available or no credentials)");
    const fallbackResult = await signInvoiceManually(unsignedXml, baseInvoiceData, settings, now, previousHash, timestamp);
    signedXml = fallbackResult.signedXml;
    invoiceHash = fallbackResult.invoiceHash;
    invoiceHashHex = fallbackResult.invoiceHashHex;
    qrCodeBase64 = fallbackResult.qrCodeBase64;
    certificateBase64 = fallbackResult.certificateBase64;
    publicKeyBase64 = fallbackResult.publicKeyBase64;
  }

  let qrCodeImage = "";
  try {
    qrCodeImage = await QRCode.toDataURL(qrCodeBase64, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 200,
      margin: 1
    });
  } catch (error) {
    console.error("Failed to generate QR code image:", error);
  }

  await storage.updateZatcaSettings(params.restaurantId, {
    lastInvoiceHash: invoiceHashHex
  });

  let submissionStatus: "pending" | "cleared" | "reported" | "rejected" = "pending";
  let zatcaResponse: any;
  let errors: Array<{ code: string; message: string }> = [];

  const csid = settings.productionCsid || settings.complianceCsid;
  const csidSecret = settings.productionCsidSecret || settings.complianceCsidSecret;

  if (csid && csidSecret) {
    const config: ZatcaConfig = {
      environment: settings.environment as "sandbox" | "simulation" | "production",
      csid: csid,
      csidSecret: csidSecret,
      privateKey: settings.privateKey || ""
    };

    const result = await submitInvoiceToZatca(
      config,
      signedXml,
      invoiceHash,
      uuid,
      params.invoiceType
    );

    zatcaResponse = result;

    if (result.success) {
      submissionStatus = result.status === "cleared" ? "cleared" : 
                        result.status === "reported" ? "reported" : "pending";
    } else {
      submissionStatus = "rejected";
      errors = result.errors || [];
    }

    await storage.createInvoiceZatcaStatus({
      restaurantId: params.restaurantId,
      invoiceId: params.invoiceId,
      invoiceType: params.invoiceType,
      invoiceSubType: invoiceSubType as "01" | "02",
      uuid: uuid,
      invoiceHash: invoiceHash,
      invoiceCounter: counter,
      submissionType: params.invoiceType === "standard" ? "clearance" : "reporting",
      submissionStatus: submissionStatus,
      qrCode: qrCodeBase64,
      signedXml: signedXml,
      clearedAt: result.clearedAt,
      submittedAt: result.reportedAt || (result.success ? new Date() : undefined),
      zatcaErrors: errors.length > 0 ? errors : null,
      zatcaWarnings: result.warnings || null
    });
  } else {
    await storage.createInvoiceZatcaStatus({
      restaurantId: params.restaurantId,
      invoiceId: params.invoiceId,
      invoiceType: params.invoiceType,
      invoiceSubType: invoiceSubType as "01" | "02",
      uuid: uuid,
      invoiceHash: invoiceHash,
      invoiceCounter: counter,
      submissionType: params.invoiceType === "standard" ? "clearance" : "reporting",
      submissionStatus: "pending",
      qrCode: qrCodeBase64,
      signedXml: signedXml
    });
  }

  return {
    success: submissionStatus !== "rejected",
    uuid,
    invoiceHash,
    qrCode: qrCodeBase64,
    qrCodeImage,
    signedXml: signedXml,
    submissionStatus,
    zatcaResponse,
    errors: errors.length > 0 ? errors : undefined
  };
}

export async function retryPendingInvoices(restaurantId: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const settings = await storage.getZatcaSettings(restaurantId);
  const csid = settings?.productionCsid || settings?.complianceCsid;
  const csidSecret = settings?.productionCsidSecret || settings?.complianceCsidSecret;
  
  if (!settings || !csid || !csidSecret) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const pendingInvoices = await storage.getInvoiceZatcaStatuses(restaurantId, "pending");
  
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  const config: ZatcaConfig = {
    environment: settings.environment as "sandbox" | "simulation" | "production",
    csid: csid,
    csidSecret: csidSecret,
    privateKey: settings.privateKey || ""
  };

  for (const invoice of pendingInvoices) {
    if (!invoice.signedXml) continue;

    processed++;

    const result = await submitInvoiceToZatca(
      config,
      invoice.signedXml,
      invoice.invoiceHash,
      invoice.uuid,
      invoice.invoiceType as "standard" | "simplified"
    );

    if (result.success) {
      succeeded++;
      await storage.updateInvoiceZatcaStatus(invoice.invoiceId, restaurantId, {
        submissionStatus: result.status === "cleared" ? "cleared" : 
                         result.status === "reported" ? "reported" : "pending",
        clearedAt: result.clearedAt,
        submittedAt: result.reportedAt || new Date(),
        zatcaWarnings: result.warnings || null
      });
    } else {
      failed++;
      await storage.updateInvoiceZatcaStatus(invoice.invoiceId, restaurantId, {
        submissionStatus: "rejected",
        zatcaErrors: result.errors || null
      });
    }
  }

  return { processed, succeeded, failed };
}

export async function onboardToZatca(
  restaurantId: string,
  otp: string
): Promise<{
  success: boolean;
  message: string;
  requestId?: string;
}> {
  const settings = await storage.getZatcaSettings(restaurantId);
  if (!settings) {
    return { success: false, message: "ZATCA settings not found" };
  }

  if (!settings.csr) {
    return { success: false, message: "CSR not generated. Please generate CSR first." };
  }

  const config: ZatcaConfig = {
    environment: settings.environment as "sandbox" | "simulation" | "production",
    csid: "",
    csidSecret: "",
    privateKey: settings.privateKey || ""
  };

  const client = new ZatcaApiClient(config);
  const response = await client.requestComplianceCSID(settings.csr, otp);

  if (!response.success) {
    return { 
      success: false, 
      message: response.error?.message || "Failed to request compliance CSID" 
    };
  }

  const data = response.data!;

  await storage.updateZatcaSettings(restaurantId, {
    complianceCsid: data.binarySecurityToken,
    complianceCsidSecret: data.secret,
    onboardingStatus: "compliance_received"
  });

  return {
    success: true,
    message: "Compliance CSID obtained successfully",
    requestId: data.requestID
  };
}

export async function getProductionCSID(
  restaurantId: string,
  complianceRequestId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const settings = await storage.getZatcaSettings(restaurantId);
  const csid = settings?.complianceCsid;
  const csidSecret = settings?.complianceCsidSecret;
  
  if (!settings || !csid || !csidSecret) {
    return { success: false, message: "Compliance CSID not found" };
  }

  const config: ZatcaConfig = {
    environment: settings.environment as "sandbox" | "simulation" | "production",
    csid: csid,
    csidSecret: csidSecret,
    privateKey: settings.privateKey || ""
  };

  const client = new ZatcaApiClient(config);
  const response = await client.requestProductionCSID(complianceRequestId);

  if (!response.success) {
    return { 
      success: false, 
      message: response.error?.message || "Failed to request production CSID" 
    };
  }

  const data = response.data!;

  await storage.updateZatcaSettings(restaurantId, {
    productionCsid: data.binarySecurityToken,
    productionCsidSecret: data.secret,
    isEnabled: true,
    onboardingStatus: "production_ready"
  });

  return {
    success: true,
    message: "Production CSID obtained successfully. ZATCA integration is now active."
  };
}

export async function runComplianceChecks(
  restaurantId: string
): Promise<{
  success: boolean;
  results: Array<{
    invoiceType: string;
    passed: boolean;
    errors?: Array<{ code: string; message: string }>;
    warnings?: Array<{ code: string; message: string }>;
  }>;
}> {
  const settings = await storage.getZatcaSettings(restaurantId);
  const csid = settings?.complianceCsid;
  const csidSecret = settings?.complianceCsidSecret;
  
  if (!settings || !csid || !csidSecret) {
    return { 
      success: false, 
      results: [{ invoiceType: "all", passed: false, errors: [{ code: "NO_CSID", message: "Compliance CSID not found" }] }]
    };
  }

  const config: ZatcaConfig = {
    environment: settings.environment as "sandbox" | "simulation" | "production",
    csid: csid,
    csidSecret: csidSecret,
    privateKey: settings.privateKey || ""
  };

  const client = new ZatcaApiClient(config);
  const results: Array<{
    invoiceType: string;
    passed: boolean;
    errors?: Array<{ code: string; message: string }>;
    warnings?: Array<{ code: string; message: string }>;
  }> = [];

  const testInvoiceTypes = [
    { type: "simplified" as const, subType: "01" as const },
    { type: "standard" as const, subType: "01" as const }
  ];

  for (const testType of testInvoiceTypes) {
    const testUuid = generateUUID();
    const now = new Date();
    const testData: ZatcaInvoiceData = {
      invoiceNumber: `TEST-${Date.now()}`,
      invoiceType: testType.type,
      invoiceSubType: testType.subType,
      paymentMethod: "cash",
      subtotal: 100.00,
      vatAmount: 15.00,
      total: 115.00,
      discount: 0,
      items: [{
        name: "Test Item",
        quantity: 1,
        unitPrice: 100.00,
        totalAmount: 100.00
      }],
      invoiceCounter: 1,
      previousInvoiceHash: null,
      uuid: testUuid,
      issueDate: formatIssueDate(now),
      issueTime: formatIssueTime(now),
      sellerInfo: {
        name: settings.csrOrganizationName || "Test Company",
        vatNumber: settings.csrOrganizationIdentifier || "300000000000003",
        streetName: settings.sellerStreetName || "Test Street",
        buildingNumber: settings.sellerBuildingNumber || "1234",
        citySubdivision: settings.sellerCitySubdivision || "Test District",
        city: settings.sellerCity || "Riyadh",
        postalZone: settings.sellerPostalZone || "12345",
        countryCode: "SA",
        crNumber: settings.sellerCrNumber || "1234567890"
      }
    };

    const testXml = generateZatcaInvoiceXml(testData);
    const testHash = generateInvoiceHash(testXml);
    const testInvoiceBase64 = Buffer.from(testXml, "utf8").toString("base64");

    const response = await client.complianceCheck(testHash, testUuid, testInvoiceBase64);

    results.push({
      invoiceType: `${testType.type}-${testType.subType}`,
      passed: response.success && response.data?.status !== "REJECTED",
      errors: response.error ? [{ code: response.error.code, message: response.error.message }] : 
              response.data?.validationResults?.errorMessages,
      warnings: response.data?.validationResults?.warningMessages || response.warnings
    });
  }

  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    await storage.updateZatcaSettings(restaurantId, {
      onboardingStatus: "compliance_received"
    });
  }

  return { success: allPassed, results };
}
