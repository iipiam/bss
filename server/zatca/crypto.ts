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
  environment?: "sandbox" | "simulation" | "production";
}

function truncateToAsn1Max(value: string, maxBytes: number = 64): string {
  let result = value;
  while (Buffer.byteLength(result, "utf8") > maxBytes) {
    result = result.slice(0, -1);
  }
  return result;
}

function createCSRConfigFile(config: CSRConfig, configPath: string): void {
  let egsSerial: string;
  const sn = config.serialNumber || config.egsUnitSerialNumber || "";
  if (/^\d+-[^|]+\|\d+-[^|]+\|\d+-.+/.test(sn)) {
    egsSerial = sn;
  } else {
    egsSerial = `1-${config.solutionName || "BSS"}|2-${config.solutionName || "BSS"}|3-${sn}`;
  }
  
  const certTemplateName = config.environment === "production" 
    ? "ZATCA-Code-Signing" 
    : "TSTZATCA-Code-Signing";

  const safeOrgName = truncateToAsn1Max(config.organizationName);
  const safeOrgUnit = truncateToAsn1Max(config.organizationalUnit);
  const safeCommonName = truncateToAsn1Max(config.commonName);
  const safeBranchName = truncateToAsn1Max(config.branchName);
  const safeEgsSerial = truncateToAsn1Max(egsSerial);
  
  if (safeOrgName !== config.organizationName) {
    console.log(`[ZATCA CSR Config] Organization name truncated from ${Buffer.byteLength(config.organizationName, "utf8")} to ${Buffer.byteLength(safeOrgName, "utf8")} bytes: "${safeOrgName}"`);
  }
  
  console.log(`[ZATCA CSR Config] Environment: ${config.environment}, CertTemplate: ${certTemplateName}`);
  console.log(`[ZATCA CSR Config] EGS Serial: ${safeEgsSerial}`);
  console.log(`[ZATCA CSR Config] Subject: C=${config.countryCode}, O=${safeOrgName}, OU=${safeOrgUnit}, CN=${safeCommonName}`);
  console.log(`[ZATCA CSR Config] VAT: ${config.vatNumber}, InvoiceType: ${config.invoiceType}, Branch: ${safeBranchName}`);

  const configContent = `
oid_section = OIDs

[OIDs]
certificateTemplateName = 1.3.6.1.4.1.311.20.2

[req]
default_bits = 2048
default_md = sha256
prompt = no
req_extensions = v3_req
distinguished_name = req_distinguished_name
string_mask = utf8only

[req_distinguished_name]
C = ${config.countryCode}
OU = ${safeOrgUnit}
O = ${safeOrgName}
CN = ${safeCommonName}

[v3_req]
certificateTemplateName = ASN1:PRINTABLESTRING:${certTemplateName}
subjectAltName = dirName:alt_names

[alt_names]
SN = ${safeEgsSerial}
UID = ${config.vatNumber}
title = ${config.invoiceType}
registeredAddress = ${safeBranchName}
businessCategory = ${safeEgsSerial}
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
  solutionName: string = "BSS",
  environment: "sandbox" | "simulation" | "production" = "sandbox"
): { csr: string; privateKey: string } {
  const cleanVat = (vatNumber || "").trim();
  if (!cleanVat || !/^\d{15}$/.test(cleanVat)) {
    throw new Error(`Invalid VAT number "${cleanVat}": must be exactly 15 digits`);
  }
  if (!cleanVat.startsWith("3") || !cleanVat.endsWith("3")) {
    throw new Error(`Invalid VAT number "${cleanVat}": must start and end with digit 3`);
  }
  if (!commonName?.trim()) throw new Error("Common Name (EGS Unit) is required");
  if (!organizationName?.trim()) throw new Error("Organization Name is required");
  if (!organizationalUnit?.trim()) throw new Error("Organization Unit (Branch Name) is required");
  if (!serialNumber?.trim()) throw new Error("Serial Number is required");

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
      solutionName,
      environment
    }, configPath);

    execSync(`openssl ecparam -name secp256k1 -genkey -noout -out "${keyPath}"`, {
      stdio: "pipe"
    });

    execSync(`openssl req -new -sha256 -key "${keyPath}" -out "${csrPath}" -config "${configPath}"`, {
      stdio: "pipe"
    });

    const privateKeyPem = fs.readFileSync(keyPath, "utf8");
    const csrPem = fs.readFileSync(csrPath, "utf8").trim();

    try {
      const verifyResult = execSync(`openssl req -in "${csrPath}" -verify -noout 2>&1`, { encoding: "utf8" }).trim();
      console.log(`[ZATCA CSR] Verification: ${verifyResult}`);
    } catch (verifyErr: any) {
      console.error(`[ZATCA CSR] Verification failed:`, verifyErr.stdout || verifyErr.message);
    }

    const csrBase64 = Buffer.from(csrPem).toString("base64");
    
    console.log(`[ZATCA CSR] PEM length: ${csrPem.length}, base64(PEM) length: ${csrBase64.length}`);
    console.log(`[ZATCA CSR] First 60 chars: ${csrBase64.substring(0, 60)}...`);
    
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

/**
 * Normalize whatever ZATCA gives us into a valid PEM certificate string.
 *
 * ZATCA's `binarySecurityToken` (the CSID) is delivered as
 *   base64( base64(DER) )
 * — i.e. the inner string already lacks PEM headers. Most legacy callers in
 * this codebase blindly wrapped the raw stored string in BEGIN/END headers,
 * which produced an invalid PEM (double-base64 inside the body) and made every
 * downstream X509 parse fail with "wrong tag".
 *
 * This helper accepts:
 *   - A full PEM string (returns it as-is, normalized line breaks).
 *   - The single-base64 form (`MIIC...`) — wraps it in PEM headers.
 *   - The double-base64 form (`TUlJ...`, what ZATCA actually returns) — decodes
 *     once, then wraps the inner base64 in PEM headers.
 *   - Raw DER bytes as a Buffer — base64-encodes and wraps.
 *
 * Always returns a PEM string with the body broken into 64-character lines
 * (some strict parsers, including OpenSSL on certain Linux builds, reject
 * un-broken PEM bodies).
 */
export function normalizeCertificateToPem(input: string | Buffer): string {
  // Accept raw DER directly.
  if (Buffer.isBuffer(input)) {
    const b64 = input.toString("base64");
    return wrapBase64AsPem(b64);
  }

  const trimmed = (input || "").toString().trim();
  if (!trimmed) {
    throw new Error("Empty certificate input");
  }

  // Already a PEM block — re-emit with normalized line breaks.
  if (trimmed.includes("-----BEGIN CERTIFICATE-----")) {
    const body = trimmed
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s+/g, "");
    return wrapBase64AsPem(body);
  }

  // Otherwise we have base64. ZATCA's CSID is base64(base64(DER)). We detect
  // the double-encoded case by:
  //   1. base64-decoding once -> if the result is itself valid base64 whose
  //      decoded bytes look like an ASN.1 SEQUENCE (first byte 0x30), peel a
  //      layer.
  // Otherwise treat the input as single-base64 (raw DER body).
  let bodyBase64 = trimmed.replace(/\s+/g, "");
  try {
    const onceDecoded = Buffer.from(bodyBase64, "base64").toString("utf8").trim();
    // Inner string must look like base64 (only base64 chars + optional padding).
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(onceDecoded.replace(/\s+/g, ""))) {
      const innerDer = Buffer.from(onceDecoded, "base64");
      // X.509 cert DER must start with ASN.1 SEQUENCE tag (0x30).
      if (innerDer.length > 4 && innerDer[0] === 0x30) {
        bodyBase64 = onceDecoded.replace(/\s+/g, "");
      }
    }
  } catch {
    // Ignore and treat as single-base64.
  }

  return wrapBase64AsPem(bodyBase64);
}

/**
 * Strip PEM headers/whitespace from any cert input, returning the pure
 * single-base64 DER body. Safe to feed into Buffer.from(..., "base64") to get
 * the raw DER bytes — needed for cert hashing, QR Tag 9 cert payload, and the
 * <ds:X509Certificate> element body in the signed XML.
 */
export function extractCertificateBase64Body(input: string | Buffer): string {
  const pem = normalizeCertificateToPem(input);
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
}

function wrapBase64AsPem(base64Body: string): string {
  const cleaned = base64Body.replace(/\s+/g, "");
  const lines: string[] = [];
  for (let i = 0; i < cleaned.length; i += 64) {
    lines.push(cleaned.slice(i, i + 64));
  }
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

export function extractPublicKeyFromCertificate(certificatePem: string): string {
  try {
    const certContent = normalizeCertificateToPem(certificatePem);
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
    const certContent = normalizeCertificateToPem(certificatePem);
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
    const certContent = normalizeCertificateToPem(certificatePem);
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

/**
 * Convert a Node X509Certificate `issuer` (multi-line `CN=...\nO=...`) into
 * the RFC2253-style single-line LDAP form ZATCA / XAdES expects, with the
 * RDNs in reverse order (least-significant first):
 *   "CN=ZATCA-Code-Signing-CA, DC=zatca, DC=gov, DC=sa"
 */
export function formatIssuerNameRFC2253(issuerMultiline: string): string {
  if (!issuerMultiline) return "";
  const lines = issuerMultiline
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  // Node lists RDNs from most-significant (root) → least-significant (leaf).
  // RFC2253 / XAdES wants least-significant first.
  return lines.reverse().join(", ");
}

/**
 * Convert a hex serial-number string (Node's X509Certificate.serialNumber) to
 * its decimal representation, as required by `<ds:X509SerialNumber>`.
 */
export function serialNumberHexToDecimal(hex: string): string {
  if (!hex) return "0";
  const cleaned = hex.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length === 0) return "0";
  try {
    return BigInt("0x" + cleaned).toString(10);
  } catch {
    return "0";
  }
}

/**
 * Extract real issuer/serial from a CSID certificate for `<xades:IssuerSerial>`.
 * Falls back to the legacy ZATCA dummy values if parsing fails so signing never
 * crashes hard.
 */
export function getCertificateIssuerSerial(certificatePem: string): {
  issuerName: string;
  serialNumber: string;
} {
  try {
    const info = getCertificateInfo(certificatePem);
    return {
      issuerName: formatIssuerNameRFC2253(info.issuer),
      serialNumber: serialNumberHexToDecimal(info.serialNumber),
    };
  } catch (e) {
    console.error("[ZATCA] Failed to extract IssuerSerial, using fallback:", e);
    return {
      issuerName: "CN=ZATCA-Code-Signing-CA, DC=zatca, DC=gov, DC=sa",
      serialNumber: "0",
    };
  }
}

/**
 * Minimal DER walker that extracts the `signatureValue` BIT STRING from an
 * X.509 certificate.
 *
 * X.509 structure:
 *   Certificate ::= SEQUENCE {
 *     tbsCertificate       SEQUENCE,
 *     signatureAlgorithm   SEQUENCE,
 *     signatureValue       BIT STRING
 *   }
 *
 * Returns the raw signature bytes (without the leading "unused-bits" byte
 * of the BIT STRING). For ECDSA certs this is the DER-encoded ECDSA-Sig.
 */
export function extractCertificateSignatureBytes(certificatePem: string): Buffer {
  const certContent = normalizeCertificateToPem(certificatePem);
  const x509 = new crypto.X509Certificate(certContent);
  const der: Buffer = (x509 as any).raw;
  if (!der || der.length < 4) {
    throw new Error("Certificate has no DER payload");
  }

  // readLen returns { length, headerSize } at offset
  const readLen = (buf: Buffer, off: number) => {
    const first = buf[off];
    if ((first & 0x80) === 0) {
      return { length: first, headerSize: 1 };
    }
    const numBytes = first & 0x7f;
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | buf[off + 1 + i];
    }
    return { length, headerSize: 1 + numBytes };
  };

  // Outer SEQUENCE
  if (der[0] !== 0x30) throw new Error("Cert: expected outer SEQUENCE");
  const outer = readLen(der, 1);
  let cursor = 1 + outer.headerSize;
  const outerEnd = cursor + outer.length;

  // tbsCertificate (SEQUENCE) — skip
  if (der[cursor] !== 0x30) throw new Error("Cert: expected tbsCertificate SEQUENCE");
  const tbs = readLen(der, cursor + 1);
  cursor += 1 + tbs.headerSize + tbs.length;

  // signatureAlgorithm (SEQUENCE) — skip
  if (der[cursor] !== 0x30) throw new Error("Cert: expected signatureAlgorithm SEQUENCE");
  const sigAlg = readLen(der, cursor + 1);
  cursor += 1 + sigAlg.headerSize + sigAlg.length;

  // signatureValue (BIT STRING)
  if (der[cursor] !== 0x03) throw new Error("Cert: expected BIT STRING for signatureValue");
  const bitStr = readLen(der, cursor + 1);
  const bitStart = cursor + 1 + bitStr.headerSize;
  // First byte of BIT STRING contents is the "unused bits" count, drop it.
  const sigBytes = der.subarray(bitStart + 1, bitStart + bitStr.length);
  if (bitStart + bitStr.length > outerEnd) {
    throw new Error("Cert: signatureValue overruns outer SEQUENCE");
  }
  return Buffer.from(sigBytes);
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
