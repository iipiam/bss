import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const SDK_BASE_PATH = path.join(process.cwd(), "zatca-sdk", "zatca-einvoicing-sdk-Java-238-R3.4.7");
const SDK_APPS_PATH = path.join(SDK_BASE_PATH, "Apps");
const SDK_CONFIG_PATH = path.join(SDK_BASE_PATH, "Configuration", "config.json");
const SDK_JAR = path.join(SDK_APPS_PATH, "zatca-einvoicing-sdk-238-R3.4.7.jar");

// Official first-invoice previous-invoice-hash (ZATCA rule BR-KSA-26):
// base64 of the lowercase hex string of SHA-256("0").
export const FIRST_INVOICE_PIH =
  "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";

export type ZatcaEnvironment = "sandbox" | "simulation" | "production";

const SDK_PATHS = {
  xsd: path.join(SDK_BASE_PATH, "Data", "Schemas", "xsds", "UBL2.1", "xsd", "maindoc", "UBL-Invoice-2.1.xsd"),
  enSchematron: path.join(SDK_BASE_PATH, "Data", "Rules", "Schematrons", "CEN-EN16931-UBL.xsl"),
  zatcaSchematron: path.join(SDK_BASE_PATH, "Data", "Rules", "Schematrons", "20210819_ZATCA_E-invoice_Validation_Rules.xsl"),
  certificates: path.join(SDK_BASE_PATH, "Data", "Certificates"),
  pih: path.join(SDK_BASE_PATH, "Data", "PIH", "pih.txt"),
  usagePath: path.join(SDK_BASE_PATH, "Configuration", "usage.txt")
};

interface CSRConfig {
  commonName: string;
  serialNumber: string;
  organizationIdentifier: string;
  organizationUnitName: string;
  organizationName: string;
  countryName: string;
  invoiceType: string;
  location: string;
  industry: string;
}

interface SignInvoiceResult {
  success: boolean;
  signedInvoice?: string;
  invoiceHash?: string;
  qrCode?: string;
  error?: string;
}

interface ValidateInvoiceResult {
  success: boolean;
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

interface GenerateCSRResult {
  success: boolean;
  csr?: string;
  privateKey?: string;
  error?: string;
}

interface GenerateHashResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface GenerateQRResult {
  success: boolean;
  qrCode?: string;
  error?: string;
}

let javaAvailableCache: boolean | null = null;

function isJavaAvailable(): boolean {
  if (javaAvailableCache !== null) return javaAvailableCache;
  try {
    execFileSync("java", ["-version"], { stdio: "pipe", timeout: 15000 });
    javaAvailableCache = true;
  } catch {
    javaAvailableCache = false;
  }
  return javaAvailableCache;
}

const JAVA_MISSING_ERROR =
  "Java runtime not found on PATH. The ZATCA SDK requires a Java 11-17 JDK/JRE. Install Java and restart the application.";

/**
 * Combine stdout + stderr into a single error message. The ZATCA SDK prints
 * most of its errors to STDOUT (not stderr), so error reporting must include
 * both streams.
 */
function combineOutput(stdout: string, stderr: string, fallback: string): string {
  const parts = [stdout?.trim(), stderr?.trim()].filter(Boolean);
  return parts.length ? parts.join("\n") : fallback;
}

/**
 * Tolerant extraction of "LABEL = value" / "LABEL: value" lines from SDK
 * output (any case, "=" or ":").
 */
function extractLabeledValue(output: string, label: string): string | undefined {
  const re = new RegExp(`${label}\\s*[=:]\\s*(.+)`, "i");
  const m = output.match(re);
  return m ? m[1].trim() : undefined;
}

/**
 * Extract the Phase-2 QR base64 from a signed invoice XML: the
 * EmbeddedDocumentBinaryObject inside the AdditionalDocumentReference whose
 * cbc:ID is QR.
 */
function extractQrFromSignedXml(signedXml: string): string | undefined {
  const m = signedXml.match(
    /<cbc:ID>\s*QR\s*<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([\s\S]*?)<\/cbc:EmbeddedDocumentBinaryObject>/
  );
  return m ? m[1].replace(/\s+/g, "") : undefined;
}

function runFatooraCommand(
  args: string[],
  workDir?: string,
  customConfig?: string
): { stdout: string; stderr: string; success: boolean } {
  if (!isJavaAvailable()) {
    return { stdout: "", stderr: JAVA_MISSING_ERROR, success: false };
  }

  const env = {
    ...process.env,
    FATOORA_HOME: SDK_BASE_PATH,
    SDK_CONFIG: customConfig || SDK_CONFIG_PATH,
  };

  // NOTE: no shell is involved (execFileSync with an args array), so paths
  // containing spaces are safe. "--globalVersion" is NOT a valid fatoora CLI
  // option and must never be passed — the jar exits on unknown options.
  const javaArgs = [
    "-Djdk.module.illegalAccess=deny",
    "-Djdk.sunec.disableNative=false",
    "-jar",
    SDK_JAR,
    ...args,
  ];

  try {
    const stdout = execFileSync("java", javaArgs, {
      env,
      cwd: workDir || SDK_APPS_PATH,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
    });
    return { stdout: stdout ?? "", stderr: "", success: true };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      success: false,
    };
  }
}

export async function generateCSRWithSDK(
  config: CSRConfig,
  environment: ZatcaEnvironment | boolean = "sandbox"
): Promise<GenerateCSRResult> {
  // Backwards compatibility: older callers passed `isProduction: boolean`.
  const envName: ZatcaEnvironment =
    typeof environment === "boolean" ? (environment ? "production" : "sandbox") : environment;

  if (!isJavaAvailable()) {
    return { success: false, error: JAVA_MISSING_ERROR };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-csr-"));

  try {
    const csrConfigContent = `csr.common.name=${config.commonName}
csr.serial.number=${config.serialNumber}
csr.organization.identifier=${config.organizationIdentifier}
csr.organization.unit.name=${config.organizationUnitName}
csr.organization.name=${config.organizationName}
csr.country.name=${config.countryName}
csr.invoice.type=${config.invoiceType}
csr.location.address=${config.location}
csr.industry.business.category=${config.industry}`;

    const csrConfigPath = path.join(tempDir, "csr-config.properties");
    const privateKeyPath = path.join(tempDir, "private-key.pem");
    const csrPath = path.join(tempDir, "csr.pem");

    fs.writeFileSync(csrConfigPath, csrConfigContent);

    const args = [
      "-csr",
      "-csrConfig", csrConfigPath,
      "-privateKey", privateKeyPath,
      "-generatedCsr", csrPath,
      "-pem",
    ];

    // Official fatoora CLI environment flags:
    //   sandbox (developer portal) -> -nonprod
    //   simulation                 -> -sim
    //   production                 -> (no flag)
    if (envName === "sandbox") {
      args.push("-nonprod");
    } else if (envName === "simulation") {
      args.push("-sim");
    }

    const result = runFatooraCommand(args, tempDir);

    if (!result.success) {
      return {
        success: false,
        error: combineOutput(result.stdout, result.stderr, "Failed to generate CSR"),
      };
    }

    const csr = fs.existsSync(csrPath) ? fs.readFileSync(csrPath, "utf8") : undefined;
    const privateKey = fs.existsSync(privateKeyPath) ? fs.readFileSync(privateKeyPath, "utf8") : undefined;

    if (!csr || !privateKey) {
      return {
        success: false,
        error: combineOutput(result.stdout, result.stderr, "CSR or private key file not generated"),
      };
    }

    return { success: true, csr, privateKey };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export async function signInvoiceWithSDK(
  invoiceXml: string,
  certificatePem: string,
  privateKeyPem: string,
  previousInvoiceHash?: string
): Promise<SignInvoiceResult> {
  if (!isJavaAvailable()) {
    return { success: false, error: JAVA_MISSING_ERROR };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-sign-"));

  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    const signedInvoicePath = path.join(tempDir, "signed-invoice.xml");
    const certPath = path.join(tempDir, "certificate.pem");
    const keyPath = path.join(tempDir, "private-key.pem");
    const pihPath = path.join(tempDir, "pih.txt");

    fs.writeFileSync(invoicePath, invoiceXml);
    fs.writeFileSync(certPath, certificatePem);
    fs.writeFileSync(keyPath, privateKeyPem, { mode: 0o600 });
    fs.writeFileSync(pihPath, previousInvoiceHash || FIRST_INVOICE_PIH);

    const configContent = JSON.stringify({
      xsdPath: SDK_PATHS.xsd,
      enSchematron: SDK_PATHS.enSchematron,
      zatcaSchematron: SDK_PATHS.zatcaSchematron,
      certPath: certPath,
      privateKeyPath: keyPath,
      pihPath: pihPath,
      inputPath: tempDir,
      usagePathFile: SDK_PATHS.usagePath,
    });

    const tempConfigPath = path.join(tempDir, "config.json");
    fs.writeFileSync(tempConfigPath, configContent);

    const signResult = runFatooraCommand(
      ["-sign", "-invoice", invoicePath, "-signedInvoice", signedInvoicePath],
      tempDir,
      tempConfigPath
    );

    if (!signResult.success) {
      return {
        success: false,
        error: combineOutput(signResult.stdout, signResult.stderr, "SDK signing failed"),
      };
    }

    if (!fs.existsSync(signedInvoicePath)) {
      return {
        success: false,
        error: combineOutput(signResult.stdout, signResult.stderr, "Signed invoice file not generated"),
      };
    }

    const signedInvoice = fs.readFileSync(signedInvoicePath, "utf8");

    let invoiceHash: string | undefined;
    const hashResult = runFatooraCommand(
      ["-generateHash", "-invoice", signedInvoicePath],
      tempDir,
      tempConfigPath
    );
    invoiceHash = extractLabeledValue(hashResult.stdout, "INVOICE HASH");

    // Prefer the QR embedded by the SDK in the signed XML; fall back to the
    // -qr command output.
    let qrCode = extractQrFromSignedXml(signedInvoice);
    if (!qrCode) {
      const qrResult = runFatooraCommand(
        ["-qr", "-invoice", signedInvoicePath],
        tempDir,
        tempConfigPath
      );
      qrCode = extractLabeledValue(qrResult.stdout, "QR Code");
    }

    return { success: true, signedInvoice, invoiceHash, qrCode };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export async function validateInvoiceWithSDK(invoiceXml: string): Promise<ValidateInvoiceResult> {
  if (!isJavaAvailable()) {
    return { success: false, isValid: false, errors: [JAVA_MISSING_ERROR] };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-validate-"));

  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);

    const args = ["-validate", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);

    const errors: string[] = [];
    const warnings: string[] = [];

    const combined = `${result.stdout}\n${result.stderr}`;
    const lines = combined.split("\n");
    for (const line of lines) {
      if (/\[ERROR\]/i.test(line) || /\berror\b/i.test(line)) {
        errors.push(line.trim());
      } else if (/\[WARNING\]/i.test(line) || /\bwarning\b/i.test(line)) {
        warnings.push(line.trim());
      }
    }

    const isValid = result.success && errors.length === 0;

    return { success: true, isValid, errors, warnings };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export async function generateInvoiceHashWithSDK(invoiceXml: string): Promise<GenerateHashResult> {
  if (!isJavaAvailable()) {
    return { success: false, error: JAVA_MISSING_ERROR };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-hash-"));

  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);

    const args = ["-generateHash", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);

    const hash = extractLabeledValue(result.stdout, "INVOICE HASH");
    if (hash) {
      return { success: true, hash };
    }

    return {
      success: false,
      error: combineOutput(result.stdout, result.stderr, "Could not extract invoice hash from output"),
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export async function generateQRCodeWithSDK(invoiceXml: string): Promise<GenerateQRResult> {
  if (!isJavaAvailable()) {
    return { success: false, error: JAVA_MISSING_ERROR };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-qr-"));

  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);

    const args = ["-qr", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);

    const qrCode = extractLabeledValue(result.stdout, "QR Code") || extractQrFromSignedXml(invoiceXml);
    if (qrCode) {
      return { success: true, qrCode };
    }

    return {
      success: false,
      error: combineOutput(result.stdout, result.stderr, "Could not extract QR code from output"),
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export function isSDKAvailable(): boolean {
  try {
    if (!fs.existsSync(SDK_JAR)) {
      return false;
    }
    if (!isJavaAvailable()) {
      return false;
    }
    // The fatoora jar prints its usage text but exits with a non-zero code
    // for -help, so treat "usage text present" as available.
    const result = runFatooraCommand(["-help"]);
    if (result.success) return true;
    const combined = `${result.stdout}\n${result.stderr}`;
    return /flag used to/i.test(combined);
  } catch (e) {
    return false;
  }
}
