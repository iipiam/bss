interface ZatcaConfig {
  environment: "sandbox" | "simulation" | "production";
  csid: string;
  csidSecret: string;
  privateKey: string;
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
  validationResults?: {
    infoMessages?: Array<{ code: string; message: string }>;
    warningMessages?: Array<{ code: string; message: string }>;
    errorMessages?: Array<{ code: string; message: string }>;
  };
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

  constructor(config: ZatcaConfig) {
    this.baseUrl = ZATCA_URLS[config.environment];
    this.csid = config.csid;
    this.csidSecret = config.csidSecret;
    this.privateKey = config.privateKey;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.csid}:${this.csidSecret}`).toString("base64");
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
        "Accept-Language": "en",
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

      console.log(`[ZATCA API] Response status: ${response.status} ${response.statusText}`);

      const text = await response.text();
      let data: any = null;
      
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`[ZATCA API] Non-JSON response (${response.status}):`, text.substring(0, 1000));
          const snippet = text.substring(0, 300).replace(/<[^>]*>/g, "").trim();
          let friendlyMessage = snippet || "The server may be temporarily unavailable.";
          if (snippet.toLowerCase().includes("invalid csr") || snippet.toLowerCase().includes("pkcs10")) {
            friendlyMessage = "The CSR is invalid or was not accepted by ZATCA. Please regenerate the CSR from the Settings tab and try again. If the issue persists, verify your ZATCA settings (VAT number, serial number, common name) are correct.";
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
        const errorMsg = data?.message 
          || data?.errors?.[0]?.message 
          || data?.validationResults?.errorMessages?.[0]?.message
          || `ZATCA API request failed with status ${response.status}`;
        console.error(`[ZATCA API] Error response:`, JSON.stringify(data, null, 2));
        return {
          success: false,
          error: {
            code: data?.code || response.status.toString(),
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
    return this.request<CSIDResponse>(
      "/production/csids",
      "POST",
      { compliance_request_id: complianceRequestId }
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
      }
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

  return {
    success: true,
    status: data.status.toLowerCase(),
    zatcaUuid: uuid,
    clearedAt: data.status === "CLEARED" ? now : undefined,
    reportedAt: data.status === "REPORTED" ? now : undefined,
    errors: data.validationResults?.errorMessages,
    warnings: data.validationResults?.warningMessages || response.warnings
  };
}

export type { ZatcaConfig, ZatcaResponse, CSIDResponse, InvoiceResponse };
