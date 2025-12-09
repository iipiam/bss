import { storage } from "../storage";
import { generateZatcaInvoiceXml, generateInvoiceHash, type ZatcaInvoiceData } from "./xml-generator";
import { generateZatcaQRCode, generateUUID, signWithECDSA, formatIssueDate, formatIssueTime, formatTimestamp } from "./crypto";
import { ZatcaApiClient, submitInvoiceToZatca, type ZatcaConfig } from "./api-client";
import QRCode from "qrcode";

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

  const { counter, previousHash } = await storage.incrementInvoiceCounter(
    params.restaurantId,
    ""
  );

  const invoiceSubType = params.invoiceType === "standard" ? "01" : "02";

  const invoiceData: ZatcaInvoiceData = {
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
    previousInvoiceHash: previousHash,
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

  const xmlContent = generateZatcaInvoiceXml(invoiceData);
  const invoiceHash = generateInvoiceHash(xmlContent);

  let signature: string | undefined;
  if (settings.privateKey) {
    try {
      signature = signWithECDSA(settings.privateKey, invoiceHash);
    } catch (error) {
      console.error("Failed to sign invoice:", error);
    }
  }

  const qrTlvData = {
    sellerName: settings.csrOrganizationName || "",
    vatNumber: settings.csrOrganizationIdentifier || "",
    timestamp: timestamp,
    invoiceTotal: params.total.toFixed(2),
    vatTotal: params.vatAmount.toFixed(2),
    invoiceHash: invoiceHash,
    signature: signature
  };
  const qrCodeBase64 = generateZatcaQRCode(qrTlvData);

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
    lastInvoiceHash: invoiceHash
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
      xmlContent,
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
      signedXml: xmlContent,
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
      signedXml: xmlContent
    });
  }

  return {
    success: submissionStatus !== "rejected",
    uuid,
    invoiceHash,
    qrCode: qrCodeBase64,
    qrCodeImage,
    signedXml: xmlContent,
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
    complianceCsidSecret: data.secret
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
    isEnabled: true
  });

  return {
    success: true,
    message: "Production CSID obtained successfully. ZATCA integration is now active."
  };
}
