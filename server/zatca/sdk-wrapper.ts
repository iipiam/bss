import { execSync, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const SDK_BASE_PATH = path.join(process.cwd(), "zatca-sdk", "zatca-einvoicing-sdk-Java-238-R3.4.7");
const SDK_APPS_PATH = path.join(SDK_BASE_PATH, "Apps");
const SDK_CONFIG_PATH = path.join(SDK_BASE_PATH, "Configuration", "config.json");
const SDK_JAR = path.join(SDK_APPS_PATH, "zatca-einvoicing-sdk-238-R3.4.7.jar");
const SDK_VERSION = "238-R3.4.7";

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

function runFatooraCommand(args: string[], workDir?: string, customConfig?: string): { stdout: string; stderr: string; success: boolean } {
  const env = {
    ...process.env,
    FATOORA_HOME: SDK_BASE_PATH,
    SDK_CONFIG: customConfig || SDK_CONFIG_PATH,
  };
  
  const javaArgs = [
    "-Djdk.module.illegalAccess=deny",
    "-Djdk.sunec.disableNative=false",
    "-jar",
    SDK_JAR,
    "--globalVersion",
    SDK_VERSION,
    ...args
  ];
  
  const command = `java ${javaArgs.join(" ")}`;
  
  try {
    const stdout = execSync(command, {
      env,
      cwd: workDir || SDK_APPS_PATH,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000
    });
    return { stdout, stderr: "", success: true };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      success: false
    };
  }
}

export async function generateCSRWithSDK(config: CSRConfig, isProduction: boolean = false): Promise<GenerateCSRResult> {
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
      "-pem"
    ];
    
    if (!isProduction) {
      args.push("-nonprod");
    }
    
    const result = runFatooraCommand(args, tempDir);
    
    if (!result.success) {
      return { success: false, error: result.stderr || "Failed to generate CSR" };
    }
    
    const csr = fs.existsSync(csrPath) ? fs.readFileSync(csrPath, "utf8") : undefined;
    const privateKey = fs.existsSync(privateKeyPath) ? fs.readFileSync(privateKeyPath, "utf8") : undefined;
    
    if (!csr || !privateKey) {
      return { success: false, error: "CSR or private key file not generated" };
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-sign-"));
  
  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    const signedInvoicePath = path.join(tempDir, "signed-invoice.xml");
    const certPath = path.join(tempDir, "certificate.pem");
    const keyPath = path.join(tempDir, "private-key.pem");
    const pihPath = path.join(tempDir, "pih.txt");
    
    fs.writeFileSync(invoicePath, invoiceXml);
    fs.writeFileSync(certPath, certificatePem);
    fs.writeFileSync(keyPath, privateKeyPem);
    
    if (previousInvoiceHash) {
      fs.writeFileSync(pihPath, previousInvoiceHash);
    } else {
      fs.writeFileSync(pihPath, "0".repeat(64));
    }
    
    const configContent = JSON.stringify({
      xsdPath: SDK_PATHS.xsd,
      enSchematron: SDK_PATHS.enSchematron,
      zatcaSchematron: SDK_PATHS.zatcaSchematron,
      certPath: certPath,
      privateKeyPath: keyPath,
      pihPath: pihPath,
      inputPath: tempDir,
      usagePathFile: SDK_PATHS.usagePath
    });
    
    const tempConfigPath = path.join(tempDir, "config.json");
    fs.writeFileSync(tempConfigPath, configContent);
    
    const env = {
      ...process.env,
      FATOORA_HOME: SDK_BASE_PATH,
      SDK_CONFIG: tempConfigPath,
    };
    
    const signArgs = [
      "-Djdk.module.illegalAccess=deny",
      "-Djdk.sunec.disableNative=false",
      "-jar", SDK_JAR,
      "--globalVersion", SDK_VERSION,
      "-sign",
      "-invoice", invoicePath,
      "-signedInvoice", signedInvoicePath
    ];
    
    try {
      execSync(`java ${signArgs.join(" ")}`, {
        env,
        cwd: tempDir,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000
      });
    } catch (error: any) {
      return { success: false, error: error.stderr?.toString() || error.message };
    }
    
    if (!fs.existsSync(signedInvoicePath)) {
      return { success: false, error: "Signed invoice file not generated" };
    }
    
    const signedInvoice = fs.readFileSync(signedInvoicePath, "utf8");
    
    const hashArgs = [
      "-Djdk.module.illegalAccess=deny",
      "-Djdk.sunec.disableNative=false",
      "-jar", SDK_JAR,
      "--globalVersion", SDK_VERSION,
      "-generateHash",
      "-invoice", signedInvoicePath
    ];
    
    let invoiceHash: string | undefined;
    try {
      const hashResult = execSync(`java ${hashArgs.join(" ")}`, {
        env,
        cwd: tempDir,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000
      });
      const hashMatch = hashResult.match(/INVOICE HASH = (.+)/);
      if (hashMatch) {
        invoiceHash = hashMatch[1].trim();
      }
    } catch (e) {
    }
    
    const qrArgs = [
      "-Djdk.module.illegalAccess=deny",
      "-Djdk.sunec.disableNative=false",
      "-jar", SDK_JAR,
      "--globalVersion", SDK_VERSION,
      "-qr",
      "-invoice", signedInvoicePath
    ];
    
    let qrCode: string | undefined;
    try {
      const qrResult = execSync(`java ${qrArgs.join(" ")}`, {
        env,
        cwd: tempDir,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000
      });
      const qrMatch = qrResult.match(/QR Code = (.+)/);
      if (qrMatch) {
        qrCode = qrMatch[1].trim();
      }
    } catch (e) {
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-validate-"));
  
  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);
    
    const args = ["-validate", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const lines = result.stdout.split("\n");
    for (const line of lines) {
      if (line.includes("[ERROR]") || line.includes("error")) {
        errors.push(line.trim());
      } else if (line.includes("[WARNING]") || line.includes("warning")) {
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-hash-"));
  
  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);
    
    const args = ["-generateHash", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);
    
    const hashMatch = result.stdout.match(/INVOICE HASH = (.+)/);
    if (hashMatch) {
      return { success: true, hash: hashMatch[1].trim() };
    }
    
    return { success: false, error: "Could not extract invoice hash from output" };
    
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export async function generateQRCodeWithSDK(invoiceXml: string): Promise<GenerateQRResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-qr-"));
  
  try {
    const invoicePath = path.join(tempDir, "invoice.xml");
    fs.writeFileSync(invoicePath, invoiceXml);
    
    const args = ["-qr", "-invoice", invoicePath];
    const result = runFatooraCommand(args, tempDir);
    
    const qrMatch = result.stdout.match(/QR Code = (.+)/);
    if (qrMatch) {
      return { success: true, qrCode: qrMatch[1].trim() };
    }
    
    return { success: false, error: "Could not extract QR code from output" };
    
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
    const result = runFatooraCommand(["-help"]);
    return result.success;
  } catch (e) {
    return false;
  }
}
