---
name: ZATCA QR tag 6 (invoice hash) encoding
description: How the invoice hash must be encoded in the Phase-2 QR TLV, and why simplified-only hash mismatches happen
---

ZATCA Phase-2 QR TLV **tag 6 (invoice hash) must carry the base64 STRING of the
SHA-256 digest** (the 44-char text, UTF-8 encoded → 44 bytes), NOT the base64-
decoded 32 raw digest bytes. Tags 7/8/9 (signature, public key, cert signature)
DO use the decoded binary bytes.

**Why:** ZATCA recomputes the hash from the canonical XML as that same 44-char
base64 string and compares it byte-for-byte to tag 6. Storing the decoded 32
bytes triggers the validator error "Invoice xml hash does not match with qr code
invoice xml hash".

**Why it shows up on simplified invoices only:** standard (B2B) invoices are
*cleared* and ZATCA replaces our QR with its own stamp, so our tag-6 encoding is
never judged. Simplified (B2C) invoices are only *reported*, so our QR is the
final one ZATCA checks — the bug surfaces there (and on simplified debit/credit
notes) exclusively.

**How to apply:** in the Phase-2 QR builder, pass the invoiceHash string straight
into the TLV helper (it UTF-8-encodes strings). Do not `Buffer.from(hash,
"base64")` for tag 6. The invoice hash itself = base64 of SHA-256 of the
canonicalized XML (UBLExtensions/cac:Signature/QR AdditionalDocumentReference
stripped) — the same value also goes into ds:DigestValue.
