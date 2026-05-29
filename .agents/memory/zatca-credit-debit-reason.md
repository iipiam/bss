---
name: ZATCA credit/debit note reason (KSA-10)
description: Where the credit/debit note reason MUST live in the UBL XML so ZATCA's validator accepts it.
---

# ZATCA credit/debit note reason placement (KSA-10 / BR-KSA-17)

For credit notes (BT-3 = 381) and debit notes (BT-3 = 383), ZATCA requires the
"reason for issuance" (KSA-10). It must be emitted as a **header-level `cbc:Note`**
placed immediately **after `cbc:InvoiceTypeCode` and before `cbc:DocumentCurrencyCode`**.
This matches ZATCA's official SDK sample credit/debit notes. Always emit a non-empty
value (default to "Adjustment" when the user left the reason blank).

**Do NOT** put the reason inside `cac:PaymentMeans` (e.g. `cbc:InstructionNote`) or any
other block. That placement causes ZATCA to fail with:
"Debit and credit note (invoice type code (BT-3) is equal to 383 or 381) must
contain the reason (KSA-10) for this invoice type issuing."

**Why:** This bug has bounced back and forth. The reason was once moved into
`cac:PaymentMeans/cbc:InstructionNote`, which the validator does NOT count as KSA-10,
producing the error above. The correct, validator-accepted location is the header
`cbc:Note` between `InvoiceTypeCode` and `DocumentCurrencyCode`.

**How to apply:** The XML is built in one shared generator covering both the live
invoice path and the compliance-test path, so the note appears everywhere once. The
real-invoice entry params must actually carry the document type and reason for the note
to render. A guarding comment marks the header spot — keep the note there. Trust the
live ZATCA validator over any spec doc that suggests a different location.
