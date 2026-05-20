import { storage } from "../storage";
import { generateZatcaInvoiceXml, generateUnsignedInvoiceXml, generateInvoiceHash, generateInvoiceHashHex, canonicalizeInvoiceXml, type ZatcaInvoiceData } from "./xml-generator";
import { generateZatcaQRCode, generateUUID, signWithECDSA, formatIssueDate, formatIssueTime, formatTimestamp, hashSHA256Hex, extractPublicKeyBase64, getCertificateIssuerSerial, extractCertificateSignatureBytes, normalizeCertificateToPem, extractCertificateBase64Body } from "./crypto";
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
  const certificate = settings.productionCsid || settings.complianceCsid;

  // Delegate to the canonical XML generator so the embedded DigestValue,
  // QR Tag 6 and SignatureValue are all derived from the SAME canonical
  // bytes. Previously this function built its own signedXml and let the
  // generator overwrite it with a placeholder-stamped one — guaranteeing the
  // mismatch ZATCA was rejecting.
  const signedXml = generateZatcaInvoiceXml(
    baseInvoiceData,
    settings.privateKey && certificate
      ? { privateKey: settings.privateKey, certificate }
      : undefined
  );

  const invoiceHash = generateInvoiceHash(signedXml);
  const invoiceHashHex = generateInvoiceHashHex(signedXml);

  // Pull the QR code that was embedded in the signed XML (single source of
  // truth for whatever ZATCA verifies against).
  let qrCodeBase64 = "";
  const qrMatch = signedXml.match(
    /<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/
  );
  if (qrMatch) qrCodeBase64 = qrMatch[1];

  let certificateBase64: string | undefined;
  let publicKeyBase64: string | undefined;
  if (certificate) {
    try {
      certificateBase64 = extractCertificateBase64Body(certificate);
    } catch (e) {
      console.error("[ZATCA] Failed to extract cert body:", e);
    }
    try {
      publicKeyBase64 = extractPublicKeyBase64(certificate);
    } catch (e) {
      publicKeyBase64 = certificateBase64;
    }
  }

  return {
    signedXml,
    invoiceHash,
    invoiceHashHex,
    qrCodeBase64,
    certificateBase64,
    publicKeyBase64,
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
  
  // Track whether the SDK produced the signed XML. If it did, we MUST trust
  // the SDK's invoice hash and QR code byte-for-byte — recomputing them with
  // our local fallback canonicalizer would silently corrupt them.
  let usedSdk = false;

  if (USE_SDK && settings.privateKey && certificate) {
    console.log("[ZATCA] Using SDK for invoice signing");
    try {
      const certPem = normalizeCertificateToPem(certificate);

      const sdkResult = await signInvoiceWithSDK(
        unsignedXml,
        certPem,
        settings.privateKey,
        previousHash || undefined
      );
      
      if (sdkResult.success && sdkResult.signedInvoice) {
        signedXml = sdkResult.signedInvoice;
        invoiceHash = sdkResult.invoiceHash || generateInvoiceHash(signedXml);
        // Hex form of the SDK-returned (base64) hash, when available.
        invoiceHashHex = sdkResult.invoiceHash
          ? Buffer.from(sdkResult.invoiceHash, "base64").toString("hex")
          : generateInvoiceHashHex(signedXml);
        qrCodeBase64 = sdkResult.qrCode || "";
        usedSdk = true;
        
        certificateBase64 = extractCertificateBase64Body(certificate);
        
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

  // Only recompute hash with the local fallback canonicalizer when the SDK
  // wasn't used. The SDK's own hash is the canonical, ZATCA-accepted value.
  if (!usedSdk) {
    invoiceHash = generateInvoiceHash(signedXml);
    invoiceHashHex = generateInvoiceHashHex(signedXml);
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
      // Map "<status>_with_warnings" → keep the status as cleared/reported
      // but mark as "warning" so the UI surfaces the warnings explicitly.
      const baseStatus = result.status.replace(/_with_warnings$/, "");
      if (result.status.endsWith("_with_warnings")) {
        submissionStatus = "warning" as any;
      } else {
        submissionStatus = baseStatus === "cleared" ? "cleared" :
                          baseStatus === "reported" ? "reported" : "pending";
      }
    } else {
      submissionStatus = "rejected";
      errors = result.errors || [];
    }

    // For standard (B2B) invoices ZATCA returns the authoritative cleared
    // XML — this is what must be sent to the buyer and stored. Re-extract
    // the QR from the cleared XML so PDF receipts use ZATCA's stamp.
    let finalSignedXml = signedXml;
    let finalQrCode = qrCodeBase64;
    if (result.clearedXml) {
      finalSignedXml = result.clearedXml;
      const qrMatch = result.clearedXml.match(
        /<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/
      );
      if (qrMatch) {
        finalQrCode = qrMatch[1];
        try {
          qrCodeImage = await QRCode.toDataURL(finalQrCode, {
            errorCorrectionLevel: "M",
            type: "image/png",
            width: 200,
            margin: 1
          });
        } catch (error) {
          console.error("Failed to regenerate QR code image from cleared XML:", error);
        }
      }
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
      qrCode: finalQrCode,
      signedXml: finalSignedXml,
      clearedAt: result.clearedAt,
      submittedAt: result.reportedAt || (result.success ? new Date() : undefined),
      zatcaErrors: errors.length > 0 ? errors : null,
      zatcaWarnings: result.warnings || null
    });

    // Update the local refs so the function return reflects what was stored.
    signedXml = finalSignedXml;
    qrCodeBase64 = finalQrCode;
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

    const recomputedHash = generateInvoiceHash(invoice.signedXml);
    const result = await submitInvoiceToZatca(
      config,
      invoice.signedXml,
      recomputedHash,
      invoice.uuid,
      invoice.invoiceType as "standard" | "simplified"
    );

    if (result.success) {
      succeeded++;
      const isWarning = result.status.endsWith("_with_warnings");
      const baseStatus = result.status.replace(/_with_warnings$/, "");
      const newStatus: "cleared" | "reported" | "pending" | "warning" =
        isWarning ? "warning" :
        baseStatus === "cleared" ? "cleared" :
        baseStatus === "reported" ? "reported" : "pending";

      // For standard invoices, prefer ZATCA's returned cleared XML (and QR)
      // as the authoritative version stored locally — matches main path.
      let updatedXml: string | undefined;
      let updatedQr: string | undefined;
      if (result.clearedXml) {
        updatedXml = result.clearedXml;
        const qrMatch = result.clearedXml.match(
          /<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/
        );
        if (qrMatch) updatedQr = qrMatch[1];
      }

      await storage.updateInvoiceZatcaStatus(invoice.invoiceId, restaurantId, {
        submissionStatus: newStatus,
        clearedAt: result.clearedAt,
        submittedAt: result.reportedAt || new Date(),
        zatcaWarnings: result.warnings || null,
        ...(updatedXml ? { signedXml: updatedXml } : {}),
        ...(updatedQr ? { qrCode: updatedQr } : {}),
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

  console.log(`[ZATCA Service] CSR from DB length: ${settings.csr.length}, first 60 chars: ${settings.csr.substring(0, 60)}...`);

  const cleanCsr = settings.csr.trim();

  if (!cleanCsr) {
    return { success: false, message: "CSR is empty. Please regenerate CSR." };
  }

  const isValidBase64 = /^[A-Za-z0-9+/=\s]+$/.test(cleanCsr);
  if (!isValidBase64) {
    console.error(`[ZATCA Service] CSR contains invalid base64 characters`);
    return { success: false, message: "CSR contains invalid characters. Please regenerate CSR." };
  }

  const decoded = Buffer.from(cleanCsr, "base64").toString("utf8");
  const isPemWrapped = decoded.includes("-----BEGIN CERTIFICATE REQUEST-----") || decoded.includes("-----BEGIN NEW CERTIFICATE REQUEST-----");
  console.log(`[ZATCA Service] CSR format: ${isPemWrapped ? "base64(PEM) ✓" : "raw base64 (legacy)"}, decoded length: ${decoded.length}`);

  let csrToSend = cleanCsr;
  if (!isPemWrapped) {
    console.log(`[ZATCA Service] Converting legacy raw base64 CSR to base64(PEM) format...`);
    const pemLines = cleanCsr.match(/.{1,64}/g) || [];
    const pem = `-----BEGIN CERTIFICATE REQUEST-----\n${pemLines.join("\n")}\n-----END CERTIFICATE REQUEST-----`;
    csrToSend = Buffer.from(pem).toString("base64");
    console.log(`[ZATCA Service] Converted CSR length: ${csrToSend.length}`);
  }

  console.log(`[ZATCA Service] CSR to send length: ${csrToSend.length}, first 40 chars: ${csrToSend.substring(0, 40)}...`);

  const config: ZatcaConfig = {
    environment: settings.environment as "sandbox" | "simulation" | "production",
    csid: "",
    csidSecret: "",
    privateKey: settings.privateKey || ""
  };

  const client = new ZatcaApiClient(config);
  console.log(`[ZATCA Service] Requesting compliance CSID for restaurant ${restaurantId}, env: ${settings.environment}`);
  const response = await client.requestComplianceCSID(csrToSend, otp);

  if (!response.success) {
    console.error(`[ZATCA Service] Compliance CSID request failed:`, response.error);
    return { 
      success: false, 
      message: response.error?.message || "Failed to request compliance CSID",
      details: response.error?.details
    } as any;
  }

  const data = response.data!;

  console.log(`[ZATCA Service] Compliance CSID received. Token length: ${data.binarySecurityToken?.length || 0}, Secret length: ${data.secret?.length || 0}, RequestID: ${data.requestID}`);
  
  await storage.updateZatcaSettings(restaurantId, {
    complianceCsid: data.binarySecurityToken,
    complianceCsidSecret: data.secret,
    complianceRequestId: data.requestID,
    complianceCsidReceivedAt: new Date(),
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
    return { success: false, message: "Compliance CSID not found. Please complete Step 2 first." };
  }

  if (csid === "[CONFIGURED]" || csidSecret === "[CONFIGURED]" || (settings.privateKey && settings.privateKey === "[CONFIGURED]")) {
    return { success: false, message: "ZATCA credentials are corrupted (contain placeholder values). Please use the 'Reset Onboarding' button and re-run Step 2 to get fresh credentials." };
  }

  if (complianceRequestId === "[CONFIGURED]") {
    return { success: false, message: "Compliance Request ID is corrupted. Please use the 'Reset Onboarding' button and re-run Step 2." };
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

  // Parse the certificate's notAfter so the UI can warn the user before
  // the production CSID expires (typically 1 year, sometimes 3 years).
  let csidExpiresAt: Date | undefined;
  try {
    const certPem = normalizeCertificateToPem(data.binarySecurityToken);
    const x509 = new (await import("crypto")).X509Certificate(certPem);
    csidExpiresAt = new Date(x509.validTo);
    if (isNaN(csidExpiresAt.getTime())) csidExpiresAt = undefined;
  } catch (e) {
    console.error("[ZATCA Service] Failed to parse production CSID validity:", e);
  }

  await storage.updateZatcaSettings(restaurantId, {
    productionCsid: data.binarySecurityToken,
    productionCsidSecret: data.secret,
    csidExpiresAt: csidExpiresAt,
    isEnabled: true,
    onboardingStatus: "production_ready"
  });

  return {
    success: true,
    message: csidExpiresAt
      ? `Production CSID obtained successfully. Valid until ${csidExpiresAt.toISOString().slice(0, 10)}. ZATCA integration is now active.`
      : "Production CSID obtained successfully. ZATCA integration is now active."
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
      results: [{ invoiceType: "all", passed: false, errors: [{ code: "NO_CSID", message: "Compliance CSID not found. Please complete Step 2 first." }] }]
    };
  }

  if (csid === "[CONFIGURED]" || csidSecret === "[CONFIGURED]" || (settings.privateKey && settings.privateKey === "[CONFIGURED]")) {
    return {
      success: false,
      results: [{ invoiceType: "all", passed: false, errors: [{ code: "CORRUPTED_CREDENTIALS", message: "ZATCA credentials are corrupted (contain placeholder values). Please use the 'Reset Onboarding' button and re-run Step 2 to get fresh credentials." }] }]
    };
  }

  const csidReceivedAt = settings.complianceCsidReceivedAt ? new Date(settings.complianceCsidReceivedAt) : null;
  const csidAgeMinutes = csidReceivedAt ? (Date.now() - csidReceivedAt.getTime()) / 60000 : null;
  
  console.log(`[ZATCA Compliance] Environment: ${settings.environment}, CSID length: ${csid.length}, Secret length: ${csidSecret.length}, Has private key: ${!!settings.privateKey}, CSID age: ${csidAgeMinutes ? csidAgeMinutes.toFixed(1) + " min" : "unknown"}`);

  if (csidAgeMinutes && csidAgeMinutes > 55) {
    console.warn(`[ZATCA Compliance] WARNING: Compliance CSID is ${csidAgeMinutes.toFixed(1)} minutes old. It expires after ~60 minutes. Consider re-running Step 2.`);
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

  // Per ZATCA tutorial (https://youtu.be/IugzfwPlAgo) compliance checks
  // must exercise EVERY invoice type the EGS will issue:
  //   - csrInvoiceType "1000" → standard B2B only (3 docs)
  //   - csrInvoiceType "0100" → simplified B2C only (3 docs)
  //   - csrInvoiceType "1100" → both (6 docs)
  // The 3 docs per category are: tax invoice (388), debit note (383),
  // credit note (381). Skipping any of these is a frequent cause of
  // production CSID rejection at Step 4 even though Step 3 "passed".
  const csrInvoiceType = settings.csrInvoiceType || "1100";
  const standardEnabled = csrInvoiceType[0] === "1";
  const simplifiedEnabled = csrInvoiceType[1] === "1";

  type TestDocType = { type: "standard" | "simplified"; subType: "01" | "02"; documentType?: "credit_note" | "debit_note"; label: string };
  const testInvoiceTypes: TestDocType[] = [];
  if (standardEnabled) {
    testInvoiceTypes.push({ type: "standard", subType: "01", label: "standard-invoice" });
    testInvoiceTypes.push({ type: "standard", subType: "01", documentType: "debit_note", label: "standard-debit-note" });
    testInvoiceTypes.push({ type: "standard", subType: "02", documentType: "credit_note", label: "standard-credit-note" });
  }
  if (simplifiedEnabled) {
    testInvoiceTypes.push({ type: "simplified", subType: "01", label: "simplified-invoice" });
    testInvoiceTypes.push({ type: "simplified", subType: "01", documentType: "debit_note", label: "simplified-debit-note" });
    testInvoiceTypes.push({ type: "simplified", subType: "02", documentType: "credit_note", label: "simplified-credit-note" });
  }
  // Fallback: if the CSR didn't declare any (legacy data), test all 6.
  if (testInvoiceTypes.length === 0) {
    testInvoiceTypes.push(
      { type: "standard", subType: "01", label: "standard-invoice" },
      { type: "standard", subType: "01", documentType: "debit_note", label: "standard-debit-note" },
      { type: "standard", subType: "02", documentType: "credit_note", label: "standard-credit-note" },
      { type: "simplified", subType: "01", label: "simplified-invoice" },
      { type: "simplified", subType: "01", documentType: "debit_note", label: "simplified-debit-note" },
      { type: "simplified", subType: "02", documentType: "credit_note", label: "simplified-credit-note" },
    );
  }
  console.log(`[ZATCA Compliance] csrInvoiceType=${csrInvoiceType} → testing ${testInvoiceTypes.length} doc types: ${testInvoiceTypes.map(t => t.label).join(", ")}`);

  let has401Error = false;

  for (const testType of testInvoiceTypes) {
    const testUuid = generateUUID();
    const now = new Date();
    
    const certForSigning = settings.complianceCsid || "";
    let decodedCert = certForSigning;
    try {
      decodedCert = normalizeCertificateToPem(certForSigning);
    } catch (e) {
      console.error(`[ZATCA Compliance] Failed to normalize CSID, using raw value:`, e);
    }

    const testBuyerInfo = testType.type === "standard" 
      ? {
          name: "Test Buyer Company",
          vatNumber: "300000000000003",
          streetName: "Buyer Street",
          buildingNumber: "5678",
          citySubdivision: "Buyer District",
          city: "Jeddah",
          postalZone: "23456",
          countryCode: "SA"
        }
      : {
          name: "Walk-in Customer",
          streetName: "-",
          buildingNumber: "0000",
          citySubdivision: "-",
          city: "Riyadh",
          postalZone: "00000",
          countryCode: "SA"
        };

    const testData: ZatcaInvoiceData = {
      invoiceNumber: `TEST-${testType.label}-${Date.now()}`,
      invoiceType: testType.type,
      invoiceSubType: testType.subType,
      documentType: testType.documentType,
      referencedInvoiceNumber: testType.documentType ? `TEST-REF-${Date.now()}` : undefined,
      adjustmentReason: testType.documentType === "credit_note" ? "Goods returned"
                       : testType.documentType === "debit_note" ? "Additional charges"
                       : undefined,
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
      },
      buyerInfo: testBuyerInfo
    };

    const signingCredentials = settings.privateKey 
      ? { 
          privateKey: settings.privateKey, 
          certificate: decodedCert
        }
      : undefined;

    console.log(`[ZATCA Compliance] Generating ${testType.type} invoice with ${signingCredentials ? "real credentials (cert length: " + decodedCert.length + ")" : "NO credentials (will use dummy)"}`);

    // Prefer the official ZATCA SDK for signing/hash/QR. The manual path
    // produces a QR > 1000 chars which trips KSA-14 during compliance.
    let testXml: string;
    let testHash: string;
    let usedSdkForCompliance = false;

    if (USE_SDK && signingCredentials?.privateKey && decodedCert) {
      try {
        const unsignedXml = generateUnsignedInvoiceXml(testData);
        const sdkResult = await signInvoiceWithSDK(
          unsignedXml,
          decodedCert,
          signingCredentials.privateKey,
          undefined
        );
        if (sdkResult.success && sdkResult.signedInvoice) {
          testXml = sdkResult.signedInvoice;
          testHash = sdkResult.invoiceHash || generateInvoiceHash(testXml);
          usedSdkForCompliance = true;
          console.log(`[ZATCA Compliance] ${testType.type} signed via SDK; hash=${testHash.substring(0, 20)}..., qrLen=${(sdkResult.qrCode || "").length}`);
        } else {
          console.error(`[ZATCA Compliance] SDK signing failed for ${testType.type}: ${sdkResult.error}. Falling back to manual.`);
          testXml = generateZatcaInvoiceXml(testData, signingCredentials);
          testHash = generateInvoiceHash(testXml);
        }
      } catch (e: any) {
        console.error(`[ZATCA Compliance] SDK threw for ${testType.type}: ${e?.message}. Falling back to manual.`);
        testXml = generateZatcaInvoiceXml(testData, signingCredentials);
        testHash = generateInvoiceHash(testXml);
      }
    } else {
      testXml = generateZatcaInvoiceXml(testData, signingCredentials);
      testHash = generateInvoiceHash(testXml);
    }

    const testInvoiceBase64 = Buffer.from(testXml, "utf8").toString("base64");

    if (!usedSdkForCompliance) {
      const canonicalForm = canonicalizeInvoiceXml(testXml);
      console.log(`[ZATCA Debug] ${testType.type} canonical form first 300 chars: ${canonicalForm.substring(0, 300)}`);
      console.log(`[ZATCA Debug] ${testType.type} canonical form length: ${canonicalForm.length}, hash: ${testHash}`);
      const digestMatch = testXml.match(/<ds:DigestValue>([^<]+)<\/ds:DigestValue>/);
      console.log(`[ZATCA Debug] ${testType.type} DigestValue in XML: ${digestMatch ? digestMatch[1] : "NOT FOUND"}`);
      console.log(`[ZATCA Debug] ${testType.type} hash == DigestValue: ${digestMatch ? (testHash === digestMatch[1]) : "N/A"}`);
    }

    const response = await client.complianceCheck(testHash, testUuid, testInvoiceBase64);
    
    console.log(`[ZATCA Compliance] ${testType.type} response: success=${response.success}, status=${response.data?.status || "N/A"}, error: ${response.error?.message || "none"}`);
    if (response.data?.validationResults) {
      const vr = response.data.validationResults;
      console.log(`[ZATCA Compliance] Errors: ${vr.errorMessages?.length || 0}, Warnings: ${vr.warningMessages?.length || 0}`);
      if (vr.errorMessages?.length) {
        console.log(`[ZATCA Compliance] Error details:`, JSON.stringify(vr.errorMessages));
      }
    }

    const is401 = response.error?.code === "401" || response.error?.message?.includes("status 401");
    if (is401) has401Error = true;

    let errorMessage = response.error?.message || "";
    if (is401) {
      const ageInfo = csidAgeMinutes 
        ? ` (CSID is ${Math.round(csidAgeMinutes)} minutes old${csidAgeMinutes > 55 ? " - LIKELY EXPIRED" : ""})`
        : " (CSID age unknown)";
      errorMessage = `Authentication failed${ageInfo}. Your Compliance CSID may have expired. Please go back to Step 2, generate a new OTP, and request a new Compliance CSID. Then re-run compliance checks within 1 hour.`;
    }

    results.push({
      invoiceType: testType.label,
      passed: response.success && response.data?.status !== "REJECTED",
      errors: is401 ? [{ code: "AUTH_EXPIRED", message: errorMessage }] :
              response.error ? [{ code: response.error.code, message: response.error.message }] : 
              response.data?.validationResults?.errorMessages,
      warnings: response.data?.validationResults?.warningMessages || response.warnings
    });

    if (is401) break;
  }

  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    await storage.updateZatcaSettings(restaurantId, {
      onboardingStatus: "compliance_passed"
    });
  } else if (has401Error) {
    await storage.updateZatcaSettings(restaurantId, {
      onboardingStatus: "compliance_received"
    });
  }

  return { success: allPassed, results };
}
