import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface TLVData {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash?: string;
  signature?: string;
  publicKey?: string;
}

function encodeTLVLength(length: number): Buffer {
  if (length < 128) {
    return Buffer.from([length]);
  } else if (length < 256) {
    return Buffer.from([0x81, length]);
  } else if (length < 65536) {
    return Buffer.from([0x82, (length >> 8) & 0xff, length & 0xff]);
  } else {
    return Buffer.from([0x83, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff]);
  }
}

function toTLV(tag: number, value: string | Buffer): Buffer {
  const valueBytes = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  const lengthBytes = encodeTLVLength(valueBytes.length);
  return Buffer.concat([
    Buffer.from([tag]),
    lengthBytes,
    valueBytes
  ]);
}

export function generateZatcaQRCode(data: TLVData): string {
  const tlvBuffers: Buffer[] = [];
  
  tlvBuffers.push(toTLV(1, data.sellerName));
  tlvBuffers.push(toTLV(2, data.vatNumber));
  tlvBuffers.push(toTLV(3, data.timestamp));
  tlvBuffers.push(toTLV(4, data.invoiceTotal));
  tlvBuffers.push(toTLV(5, data.vatTotal));
  
  if (data.invoiceHash) {
    tlvBuffers.push(toTLV(6, data.invoiceHash));
  }
  if (data.signature) {
    tlvBuffers.push(toTLV(7, data.signature));
  }
  if (data.publicKey) {
    tlvBuffers.push(toTLV(8, data.publicKey));
  }
  
  const combinedBuffer = Buffer.concat(tlvBuffers);
  return combinedBuffer.toString("base64");
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function hashSHA256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("base64");
}

export function hashSHA256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

export function hashSHA256Binary(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

interface CSRConfig {
  commonName: string;
  organizationName: string;
  organizationalUnit: string;
  countryCode: string;
  serialNumber: string;
  vatNumber: string;
  invoiceType: "1000" | "0100" | "1100";
  egsUnitSerialNumber: string;
  branchName: string;
  solutionName?: string;
}

function createCSRConfigFile(config: CSRConfig, configPath: string): void {
  let egsSerial: string;
  const sn = config.serialNumber || config.egsUnitSerialNumber || "";
  if (/^\d+-[^|]+\|\d+-[^|]+\|\d+-.+/.test(sn)) {
    egsSerial = sn;
  } else {
    egsSerial = `1-${config.solutionName || "BSS"}|2-${config.solutionName || "BSS"}|3-${sn}`;
  }
  
  console.log(`[ZATCA CSR Config] EGS Serial: ${egsSerial}`);
  console.log(`[ZATCA CSR Config] Subject: C=${config.countryCode}, O=${config.organizationName}, OU=${config.organizationalUnit}, CN=${config.commonName}`);
  console.log(`[ZATCA CSR Config] VAT: ${config.vatNumber}, InvoiceType: ${config.invoiceType}, Branch: ${config.branchName}`);

  const configContent = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = req_distinguished_name

[req_distinguished_name]
C = ${config.countryCode}
OU = ${config.organizationalUnit}
O = ${config.organizationName}
CN = ${config.commonName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment
1.3.6.1.4.1.311.20.2 = ASN1:PRINTABLESTRING:ZATCA-Code-Signing
2.5.4.4 = ASN1:UTF8STRING:${egsSerial}
2.5.4.12 = ASN1:UTF8STRING:${config.invoiceType}
2.5.4.26 = ASN1:UTF8STRING:${config.branchName}
2.5.4.15 = ASN1:UTF8STRING:${egsSerial}
subjectAltName = dirName:dir_sect

[dir_sect]
SN = ${config.vatNumber}
UID = ${config.vatNumber}
title = ${config.invoiceType}
registeredAddress = ${config.branchName}
businessCategory = ${egsSerial}
`.trim();

  fs.writeFileSync(configPath, configContent);
}

export function generateCSR(
  commonName: string,
  organizationName: string,
  organizationalUnit: string,
  countryCode: string,
  serialNumber: string,
  vatNumber: string,
  invoiceType: "1000" | "0100" | "1100",
  egsUnitSerialNumber: string,
  branchName: string,
  solutionName: string = "BSS"
): { csr: string; privateKey: string } {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zatca-csr-"));
  const keyPath = path.join(tempDir, "private.key");
  const csrPath = path.join(tempDir, "request.csr");
  const configPath = path.join(tempDir, "csr.conf");

  try {
    createCSRConfigFile({
      commonName,
      organizationName,
      organizationalUnit,
      countryCode,
      serialNumber,
      vatNumber,
      invoiceType,
      egsUnitSerialNumber,
      branchName,
      solutionName
    }, configPath);

    execSync(`openssl ecparam -name secp256k1 -genkey -noout -out "${keyPath}"`, {
      stdio: "pipe"
    });

    execSync(`openssl req -new -sha256 -key "${keyPath}" -out "${csrPath}" -config "${configPath}"`, {
      stdio: "pipe"
    });

    const privateKeyPem = fs.readFileSync(keyPath, "utf8");
    const csrPem = fs.readFileSync(csrPath, "utf8");

    try {
      const verifyResult = execSync(`openssl req -in "${csrPath}" -verify -noout 2>&1`, { encoding: "utf8" }).trim();
      console.log(`[ZATCA CSR] Verification: ${verifyResult}`);
    } catch (verifyErr: any) {
      console.error(`[ZATCA CSR] Verification failed:`, verifyErr.stdout || verifyErr.message);
    }

    const csrBase64 = csrPem
      .replace(/-----BEGIN [A-Z ]+-----/g, "")
      .replace(/-----END [A-Z ]+-----/g, "")
      .replace(/\s+/g, "")
      .trim();
    
    console.log(`[ZATCA CSR] Generated CSR base64 length: ${csrBase64.length}, first 60 chars: ${csrBase64.substring(0, 60)}...`);
    
    return {
      csr: csrBase64,
      privateKey: privateKeyPem
    };

  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
    }
  }
}

export function signWithECDSA(
  privateKeyPem: string, 
  data: string
): string {
  try {
    const sign = crypto.createSign("SHA256");
    sign.update(data);
    sign.end();
    
    const signature = sign.sign(privateKeyPem);
    
    return signature.toString("base64");
  } catch (error) {
    console.error("ECDSA signing error:", error);
    throw new Error("Failed to sign invoice with ECDSA");
  }
}

export function signWithECDSADER(
  privateKeyPem: string, 
  data: Buffer
): Buffer {
  try {
    const sign = crypto.createSign("SHA256");
    sign.update(data);
    sign.end();
    
    return sign.sign(privateKeyPem);
  } catch (error) {
    console.error("ECDSA signing error:", error);
    throw new Error("Failed to sign invoice with ECDSA");
  }
}

export function signCanonicalXML(
  privateKeyPem: string,
  xmlContent: string
): { signature: string; signedXml: string } {
  const canonicalXml = canonicalizeXML(xmlContent);
  const hash = hashSHA256Hex(canonicalXml);
  const signature = signWithECDSA(privateKeyPem, canonicalXml);
  
  return {
    signature,
    signedXml: canonicalXml
  };
}

export function extractPublicKeyFromCertificate(certificatePem: string): string {
  try {
    const certContent = certificatePem.includes("-----BEGIN")
      ? certificatePem
      : `-----BEGIN CERTIFICATE-----\n${certificatePem}\n-----END CERTIFICATE-----`;
    
    const x509 = new crypto.X509Certificate(certContent);
    const publicKey = x509.publicKey.export({ type: "spki", format: "pem" }) as string;
    return publicKey;
  } catch (error) {
    console.error("Certificate parsing error:", error);
    throw new Error("Failed to extract public key from certificate");
  }
}

export function extractPublicKeyBase64(certificatePem: string): string {
  try {
    const certContent = certificatePem.includes("-----BEGIN")
      ? certificatePem
      : `-----BEGIN CERTIFICATE-----\n${certificatePem}\n-----END CERTIFICATE-----`;
    
    const x509 = new crypto.X509Certificate(certContent);
    const publicKeyDer = x509.publicKey.export({ type: "spki", format: "der" }) as Buffer;
    return publicKeyDer.toString("base64");
  } catch (error) {
    console.error("Certificate parsing error:", error);
    throw new Error("Failed to extract public key from certificate");
  }
}

export function getCertificateInfo(certificatePem: string): {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
} {
  try {
    const certContent = certificatePem.includes("-----BEGIN")
      ? certificatePem
      : `-----BEGIN CERTIFICATE-----\n${certificatePem}\n-----END CERTIFICATE-----`;
    
    const x509 = new crypto.X509Certificate(certContent);
    return {
      subject: x509.subject,
      issuer: x509.issuer,
      validFrom: new Date(x509.validFrom),
      validTo: new Date(x509.validTo),
      serialNumber: x509.serialNumber
    };
  } catch (error) {
    console.error("Certificate parsing error:", error);
    throw new Error("Failed to parse certificate");
  }
}

export function verifySignature(
  publicKeyPem: string,
  data: string,
  signatureBase64: string
): boolean {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(data);
    verify.end();
    
    return verify.verify(
      { key: publicKeyPem, dsaEncoding: "ieee-p1363" },
      Buffer.from(signatureBase64, "base64")
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace("Z", "");
}

export function formatIssueDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function formatIssueTime(date: Date = new Date()): string {
  const timeStr = date.toISOString().split("T")[1];
  return timeStr.substring(0, 8);
}

export function canonicalizeXML(xmlString: string): string {
  const xmlDeclaration = xmlString.match(/<\?xml[^?]*\?>/)?.[0] || "";
  
  let content = xmlString.replace(/<\?xml[^?]*\?>\s*/g, "");
  
  content = content.replace(/<!--[\s\S]*?-->/g, "");
  
  content = content.replace(/>\s+</g, "><");
  
  content = content.replace(/\s+/g, " ");
  
  content = content.replace(/\s+\/>/g, "/>");
  content = content.replace(/\s+>/g, ">");
  content = content.replace(/<\s+/g, "<");
  
  content = content.replace(/(<[^\/][^>]*[^\/])(\s+)>/g, "$1>");
  
  content = content.replace(/^\s+|\s+$/g, "");
  
  return content;
}

export function removeXMLDeclarationAndExtensions(xmlString: string): string {
  let content = xmlString.replace(/<\?xml[^?]*\?>\s*/g, "");
  
  content = content.replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/g, "");
  
  content = content.replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/g, "");
  
  return content.trim();
}

export function computeInvoiceHash(xmlContent: string): string {
  const cleanedXml = removeXMLDeclarationAndExtensions(xmlContent);
  const canonicalXml = canonicalizeXML(cleanedXml);
  return hashSHA256Hex(canonicalXml);
}

export function computePreviousInvoiceHash(previousHash: string | null): string {
  if (!previousHash) {
    return "0".repeat(64);
  }
  return previousHash;
}

export function generateInvoiceCounter(): number {
  return Date.now();
}

export function encodeBase64(data: string): string {
  return Buffer.from(data, "utf8").toString("base64");
}

export function decodeBase64(data: string): string {
  return Buffer.from(data, "base64").toString("utf8");
}

export type { TLVData, CSRConfig };
