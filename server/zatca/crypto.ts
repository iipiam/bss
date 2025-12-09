import crypto from "crypto";

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

function toTLV(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, "utf8");
  const length = valueBytes.length;
  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([length]),
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

export function signWithECDSA(
  privateKeyPem: string, 
  data: string
): string {
  try {
    const sign = crypto.createSign("SHA256");
    sign.update(data);
    sign.end();
    
    const signature = sign.sign({
      key: privateKeyPem,
      dsaEncoding: "ieee-p1363"
    });
    
    return signature.toString("base64");
  } catch (error) {
    console.error("ECDSA signing error:", error);
    throw new Error("Failed to sign invoice with ECDSA");
  }
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
  branchName: string
): { csr: string; privateKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1"
  });

  const privateKeyPem = privateKey.export({ type: "sec1", format: "pem" }) as string;
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }) as string;

  const csrFields = {
    CN: commonName,
    O: organizationName,
    OU: organizationalUnit,
    C: countryCode,
    SN: serialNumber,
    UID: vatNumber,
    title: invoiceType,
    registeredAddress: branchName,
    businessCategory: egsUnitSerialNumber
  };

  const csrBase64 = Buffer.from(JSON.stringify({
    fields: csrFields,
    publicKey: publicKeyPem,
    algorithm: "secp256k1"
  })).toString("base64");

  return {
    csr: csrBase64,
    privateKey: privateKeyPem
  };
}

export function extractPublicKeyFromCertificate(certificatePem: string): string {
  try {
    const x509 = new crypto.X509Certificate(certificatePem);
    const publicKey = x509.publicKey.export({ type: "spki", format: "pem" }) as string;
    return publicKey;
  } catch (error) {
    console.error("Certificate parsing error:", error);
    throw new Error("Failed to extract public key from certificate");
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
  return date.toISOString().replace("Z", "+03:00");
}

export function formatIssueDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function formatIssueTime(date: Date = new Date()): string {
  const timeStr = date.toISOString().split("T")[1];
  return timeStr.substring(0, 8);
}

export type { TLVData };
