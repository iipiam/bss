---
name: ZATCA credit/debit note reason (KSA-10)
description: Where the credit/debit note reason MUST live in the UBL XML so ZATCA's validator accepts it.
---

# ZATCA credit/debit note reason placement (KSA-10 / BR-KSA-17)

For credit notes (BT-3 = 381) and debit notes (BT-3 = 383), ZATCA requires the
"reason for issuance". The validator accepts it **only** as
`cac:PaymentMeans/cbc:InstructionNote`. Always emit a non-empty value (default to
"Adjustment" when the user left the reason blank).

**Why:** This bug has recurred repeatedly. A spec document once described the reason
as a header-level `cbc:Note` placed right after `cbc:InvoiceTypeCode`. Implementing
that caused ZATCA compliance checks to fail with:
"Debit and credit note (invoice type code (BT-3) is equal to 383 or 381) must
contain the reason (KSA-10) for this invoice type issuing." The validator does NOT
recognise a header `cbc:Note` as KSA-10 — only `InstructionNote` inside
`PaymentMeans`.

**How to apply:** In `server/zatca/xml-generator.ts` (shared `buildInvoiceBodyParts`,
used by both the live invoice path and the compliance-test path), keep the reason in
`cac:PaymentMeans/cbc:InstructionNote`. Do not move it to a header `cbc:Note`. There
is an inline comment guarding this spot — do not "fix" it back. If a spec doc says
otherwise, trust the live ZATCA validator over the doc.
