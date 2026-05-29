---
name: ZATCA credit/debit note reason (KSA-10)
description: Where the credit/debit note reason MUST live in the UBL XML so ZATCA's validator accepts it.
---

# ZATCA credit/debit note reason placement (KSA-10 / BR-KSA-17)

For credit notes (BT-3 = 381) and debit notes (BT-3 = 383), ZATCA requires the
"reason for issuance" (KSA-10). It MUST be emitted as `cbc:InstructionNote`
**inside `cac:PaymentMeans`**, right after `cbc:PaymentMeansCode`. Always emit a
non-empty value (default to "Adjustment" when the user left the reason blank).

A header-level `cbc:Note` (between `InvoiceTypeCode` and `DocumentCurrencyCode`)
does NOT satisfy KSA-10 and the validator rejects it with:
"Debit and credit note (invoice type code (BT-3) is equal to 383 or 381) must
contain the reason (KSA-10) for this invoice type issuing."

**Why:** This is the placement in ZATCA's own official SDK samples. Confirmed in
`zatca-sdk/.../Data/Samples/Standard/Credit/Standard_Credit_Note.xml` and the
matching Debit/Simplified samples — the reason text sits in
`cac:PaymentMeans/cbc:InstructionNote`. The schematron rule BR-KSA-17 in
`Data/Rules/Schematrons/20210819_ZATCA_E-invoice_Validation_Rules.xsl` asserts
`exists(//cac:PaymentMeans/cbc:InstructionNote)`. An earlier memory claimed the
header `cbc:Note` was the accepted spot — that was wrong and caused a real
validation failure; trust the SDK samples + schematron over any prose doc.

**How to apply:** The XML is built in one shared generator covering both the
signed (live) and unsigned (compliance-test) paths, so the note appears in both
once it is in the shared `PaymentMeans` block. The real-invoice entry params must
actually carry the document type and reason for the note to render (routes ->
service `adjustmentReason` -> generator).

**WARNING — tool-output display artifact:** When you `rg`/`grep`/`cat` ZATCA UBL
in this repo, long UBL tag names get visually shortened in the tool output, e.g.
`PaymentMeans`->`n`, `PaymentMeansCode`->`nCode`, `InstructionNote`->`l`,
`BR-KSA-17`->`BR-l`. The files on disk are correct; do NOT "fix" these — verify
real structure with the `read` tool / B-A context grep and trust nesting, not the
shortened tag text.
