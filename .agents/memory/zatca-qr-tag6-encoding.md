---
name: ZATCA QR tags 6 & 7 (hash & signature) encoding
description: How invoice hash and signature must be encoded in the Phase-2 QR TLV, and why simplified-only mismatches happen
---

ZATCA Phase-2 QR TLV encoding rule for `generatePhase2QrCode`
(server/zatca/xml-generator.ts):

- **Tag 6 (invoice hash)** = the base64 STRING of the SHA-256 digest (the
  44-char text, UTF-8 encoded → 44 bytes). NOT the decoded 32 raw bytes.
- **Tag 7 (ECDSA invoice signature)** = the base64 STRING of the signature
  (the ~96-char text, UTF-8 encoded). NOT the decoded ~70 raw signature bytes.
- **Tags 8 (public key) and 9 (cert signature)** = the raw DECODED bytes
  (`Buffer.from(value, "base64")`).

So tags 6 & 7 are base64 *text*; tags 8 & 9 are raw bytes. This matches the
ZATCA Java SDK QRCodeGenerator (Tag(int, String) stores `value.getBytes()`;
Tag(int, byte[]) stores raw bytes).

**Why:** ZATCA's validator does a STRING comparison. For tag 6 it recomputes
the hash from the canonical XML as the base64 string and compares to tag 6; for
tag 7 it reads `<ds:SignatureValue>` (a base64 string) from the XML and compares
to tag 7. Storing decoded bytes triggers:
- tag 6 wrong → "Invoice xml hash does not match with qr code invoice xml hash"
- tag 7 wrong → "invoice signature value does not match with qr invoice
  signature value"

**Why simplified invoices only:** standard (B2B) invoices are *cleared* and
ZATCA replaces our QR with its own stamp, so our tag encoding is never judged.
Simplified (B2C) invoices are only *reported*, so our QR is the final one ZATCA
checks — both bugs surface there (and on simplified debit/credit notes) only.

**How to apply:** in the Phase-2 QR builder, pass the hash string and the
signature string straight into the TLV helper (it UTF-8-encodes strings). Do NOT
`Buffer.from(..., "base64")` for tags 6 or 7. Keep tags 8/9 as decoded bytes.
The signature value must be the SAME one embedded in `<ds:SignatureValue>` —
sign SignedInfo once and reuse it for both (ECDSA is non-deterministic, so
signing twice would never match).
