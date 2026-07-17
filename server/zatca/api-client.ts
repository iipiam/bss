interface ZatcaConfig {
  environment: "sandbox" | "simulation" | "production";
  csid: string;
  csidSecret: string;
  privateKey: string;
  acceptLanguage?: string;
}

interface ComplianceCSIDRequest {
  csr: string;
  otp: string;
}

interface ProductionCSIDRequest {
  complianceRequestId: string;
}

interface InvoiceSubmissionRequest {
  invoiceHash: string;
  uuid: string;
  invoice: string;
}

interface ZatcaResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

interface CSIDResponse {
  requestID: string;
  dispositionMessage: string;
  binarySecurityToken: string;
  secret: string;
  errors?: Array<{ code: string; message: string }>;
}

interface InvoiceResponse {
  invoiceHash: string;
  status: "CLEARED" | "REPORTED" | "REJECTED" | "PENDING";
  clearanceStatus?: string;
  reportingStatus?: string;
  // Cleared standard invoice (ZATCA returns base64-encoded signed XML on
  // successful clearance). Reporting API does NOT return this.
  clearedInvoice?: string;
  validationResults?: {
    infoMessages?: Array<{ code: string; message: string }>;
    warningMessages?: Array<{ code: string; message: string }>;
    errorMessages?: Array<{ code: string; message: string }>;
  };
}

// ZATCA responses carry the invoice status in different fields depending on
// the endpoint: `clearanceStatus` (clearance API for standard invoices),
// `reportingStatus` (reporting API for simplified invoices), or a generic
// `status`. Return a single lowercase canonical value, or undefined.
export function extractZatcaStatus(data: Partial<InvoiceResponse> | undefined | null): string | undefined {
  if (!data) return undefined;
  const raw = data.clearanceStatus || data.reportingStatus || data.status;
  return typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : undefined;
}

const ZATCA_URLS = {
  sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core"
};

export class ZatcaApiClient {
  private baseUrl: string;
  private csid: string;
  private csidSecret: string;
  private privateKey: string;
  private acceptLanguage: string;

  constructor(config: ZatcaConfig) {
    this.baseUrl = ZATCA_URLS[config.environment];
    this.csid = config.csid;
    this.csidSecret = config.csidSecret;
    this.privateKey = config.privateKey;
    this.acceptLanguage = config.acceptLanguage || "en";
  }

  private getAuthHeader(): string {
    const cleanCsid = this.csid.replace(/[\r\n\s]/g, '');
    const cleanSecret = this.csidSecret.replace(/[\r\n\s]/g, '');
    console.log(`[ZATCA Auth] CSID length: ${cleanCsid.length}, first 20: ${cleanCsid.substring(0, 20)}..., Secret length: ${cleanSecret.length}`);
    const credentials = Buffer.from(`${cleanCsid}:${cleanSecret}`).toString("base64");
    return `Basic ${credentials}`;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST",
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<ZatcaResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": this.acceptLanguage,
        "Accept-Version": "V2",
        ...customHeaders
      };

      if (this.csid && this.csidSecret) {
        headers["Authorization"] = this.getAuthHeader();
      }

      const url = `${this.baseUrl}${endpoint}`;
      const bodyStr = body ? JSON.stringify(body) : undefined;
      console.log(`[ZATCA API] ${method} ${url}`);
      if (bodyStr && endpoint === "/compliance") {
        const bodyObj = body as Record<string, string>;
        console.log(`[ZATCA API] CSR field length: ${bodyObj.csr?.length || 0}, first 60: ${bodyObj.csr?.substring(0, 60)}...`);
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: bodyStr
      });

      console.log(`[ZATCA API] Response status: ${response.status} ${response.statusText} for ${endpoint}`);

      const text = await response.text();
      if (response.status === 401) {
        console.error(`[ZATCA API] 401 Unauthorized for ${endpoint}. Response body: ${text.substring(0, 500)}`);
        console.error(`[ZATCA API] Auth was ${this.csid ? "provided" : "NOT provided"}, CSID length: ${this.csid?.length || 0}`);
      }
      let data: any = null;
      
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`[ZATCA API] Non-JSON response (${response.status}):`, text.substring(0, 1000));
          const snippet = text.substring(0, 300).replace(/<[^>]*>/g, "").trim();
          let friendlyMessage = snippet || "The server may be temporarily unavailable.";
          if (snippet.toLowerCase().includes("invalid csr") || snippet.toLowerCase().includes("pkcs10")) {
            friendlyMessage = "ZATCA rejected the CSR. Please verify: (1) Your ZATCA environment setting matches where your EGS is registered (Sandbox/Simulation/Production). (2) The OTP was generated from the correct ZATCA portal for this environment. (3) Your VAT number, serial number, and company name exactly match your ZATCA portal registration. (4) The OTP has not expired (OTPs are valid for a limited time).";
          }
          if (snippet.toLowerCase().includes("invalid request")) {
            friendlyMessage = "ZATCA returned 'Invalid Request'. The Sandbox environment may be unavailable. Try switching to 'Simulation' environment in the Settings tab, then generate a new OTP from fatoora.zatca.gov.sa and try again.";
          }
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: friendlyMessage,
              details: snippet
            }
          };
        }
      }

      if (!response.ok) {
        const errorMsg = data?.errorMessage
          || data?.message 
          || data?.errors?.[0]?.message 
          || data?.validationResults?.errorMessages?.[0]?.message
          || `ZATCA API request failed with status ${response.status}`;
        const errorCode = data?.errorCode || data?.errors?.[0]?.code || data?.code || response.status.toString();
        console.error(`[ZATCA API] Error response:`, JSON.stringify(data, null, 2));
        return {
          success: false,
          error: {
            code: errorCode,
            message: errorMsg,
            details: data ? JSON.stringify(data) : `HTTP ${response.status}`
          }
        };
      }

      if (!data) {
        return {
          success: false,
          error: {
            code: "EMPTY_RESPONSE",
            message: "ZATCA API returned an empty response",
            details: "No data received from ZATCA"
          }
        };
      }

      return {
        success: true,
        data,
        warnings: data.validationResults?.warningMessages
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error.message || "Failed to connect to ZATCA API",
          details: error.stack
        }
      };
    }
  }

  async requestComplianceCSID(csr: string, otp: string): Promise<ZatcaResponse<CSIDResponse>> {
    return this.request<CSIDResponse>(
      "/compliance",
      "POST",
      { csr: csr },
      { 
        "OTP": otp,
        "Accept-Version": "V2"
      }
    );
  }

  async requestProductionCSID(complianceRequestId: string): Promise<ZatcaResponse<CSIDResponse>> {
    // ZATCA requires compliance_request_id to be a string in the request body.
    // Coerce defensively in case it was stored/passed as a number.
    return this.request<CSIDResponse>(
      "/production/csids",
      "POST",
      { compliance_request_id: String(complianceRequestId) }
    );
  }

  async complianceCheck(
    invoiceHash: string,
    uuid: string,
    invoiceBase64: string
  ): Promise<ZatcaResponse<InvoiceResponse>> {
    return this.request<InvoiceResponse>(
      "/compliance/invoices",
      "POST",
      {
        invoiceHash,
        uuid,
        invoice: invoiceBase64
      }
    );
  }

  async clearanceInvoice(
    invoiceHash: string,
    uuid: string,
    invoiceBase64: string
  ): Promise<ZatcaResponse<InvoiceResponse>> {
    return this.request<InvoiceResponse>(
      "/invoices/clearance/single",
      "POST",
      {
        invoiceHash,
        uuid,
        invoice: invoiceBase64
      },
      { "Clearance-Status": "1" }
    );
  }

  async reportInvoice(
    invoiceHash: string,
    uuid: string,
    invoiceBase64: string
  ): Promise<ZatcaResponse<InvoiceResponse>> {
    return this.request<InvoiceResponse>(
      "/invoices/reporting/single",
      "POST",
      {
        invoiceHash,
        uuid,
        invoice: invoiceBase64
      },
      // ZATCA expects Clearance-Status=0 on the reporting endpoint to
      // indicate the invoice is being reported (simplified) rather than
      // cleared. Omitting it is a frequent cause of 400 rejections.
      { "Clearance-Status": "0" }
    );
  }

  async renewProductionCSID(otp: string): Promise<ZatcaResponse<CSIDResponse>> {
    return this.request<CSIDResponse>(
      "/production/csids/renew",
      "POST",
      {},
      { "OTP": otp }
    );
  }
}

export async function submitInvoiceToZatca(
  config: ZatcaConfig,
  invoiceXml: string,
  invoiceHash: string,
  uuid: string,
  invoiceType: "standard" | "simplified"
): Promise<{
  success: boolean;
  status: string;
  zatcaUuid?: string;
  clearedAt?: Date;
  reportedAt?: Date;
  // For standard invoices: the authoritative signed XML returned by ZATCA
  // on successful clearance (decoded from base64). For simplified invoices
  // this is always undefined (reporting API does not return XML).
  clearedXml?: string;
  errors?: Array<{ code: string; message: string }>;
  warnings?: Array<{ code: string; message: string }>;
}> {
  const client = new ZatcaApiClient(config);
  const invoiceBase64 = Buffer.from(invoiceXml, "utf8").toString("base64");

  let response;
  if (invoiceType === "standard") {
    response = await client.clearanceInvoice(invoiceHash, uuid, invoiceBase64);
  } else {
    response = await client.reportInvoice(invoiceHash, uuid, invoiceBase64);
  }

  if (!response.success) {
    return {
      success: false,
      status: "failed",
      errors: response.error ? [{ code: response.error.code, message: response.error.message }] : []
    };
  }

  const data = response.data!;
  const now = new Date();

  let clearedXml: string | undefined;
  if (invoiceType === "standard" && data.clearedInvoice) {
    try {
      clearedXml = Buffer.from(data.clearedInvoice, "base64").toString("utf8");
    } catch (e) {
      console.error("[ZATCA] Failed to decode clearedInvoice base64:", e);
    }
  }

  // ZATCA returns the status with capital letters: "Cleared", "Reported",
  // "Not Cleared", "Not Reported", "Accepted with Warnings". Depending on the
  // endpoint the field is `clearanceStatus` (clearance API), `reportingStatus`
  // (reporting API), or `status`. Extract one canonical value and normalize
  // to lowercase before comparing.
  const rawStatus = extractZatcaStatus(data) || "pending";

  // ZATCA returns HTTP 202 with the invoice cleared/reported "with warnings".
  // The response body still contains validationResults; surface as warning
  // state so the UI can display the warnings rather than a hard success.
  const hasWarnings =
    (data.validationResults?.warningMessages?.length || 0) > 0 ||
    (response.warnings?.length || 0) > 0;

  const isCleared = rawStatus === "cleared";
  const isReported = rawStatus === "reported";
  // "Accepted with Warnings" (HTTP 202) means the invoice WAS accepted on the
  // reporting path — it is a success, not a failure.
  const isAcceptedWithWarnings = rawStatus === "accepted with warnings";
  // "Not Cleared" / "Not Reported" are explicit rejections from ZATCA.
  const isRejected = rawStatus === "not cleared" || rawStatus === "not reported";

  if (isRejected) {
    return {
      success: false,
      status: "rejected",
      errors: data.validationResults?.errorMessages
        || (response.error ? [{ code: response.error.code, message: response.error.message }] : []),
      warnings: data.validationResults?.warningMessages || response.warnings
    };
  }

  let normalizedStatus: string;
  if (isAcceptedWithWarnings) {
    normalizedStatus = "warning";
  } else if (isCleared || isReported) {
    normalizedStatus = hasWarnings ? `${rawStatus}_with_warnings` : rawStatus;
  } else {
    normalizedStatus = rawStatus;
  }

  return {
    success: true,
    status: normalizedStatus,
    zatcaUuid: uuid,
    clearedAt: isCleared ? now : undefined,
    // "Accepted with Warnings" is a reporting-path success, so record it as
    // reported as well.
    reportedAt: (isReported || isAcceptedWithWarnings) ? now : undefined,
    clearedXml,
    errors: data.validationResults?.errorMessages,
    warnings: data.validationResults?.warningMessages || response.warnings
  };
}

export type { ZatcaConfig, ZatcaResponse, CSIDResponse, InvoiceResponse };
