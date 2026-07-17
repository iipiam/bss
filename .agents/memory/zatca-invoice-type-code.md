---
name: ZATCA InvoiceTypeCode @name + credit/debit note reason
description: KSA-2 transaction-code length (7 chars per official SDK samples) and KSA-10 reason placement
---

# ZATCA InvoiceTypeCode @name (KSA-2) and note reason (KSA-10)

## KSA-2 — the @name attribute is 7 characters (NNPNESB)
Ground truth: EVERY sample in the official ZATCA SDK R3.4.7
(`Data/Samples/**`) uses a 7-char `name` — `0100000` standard, `0200000`
simplified, `0110000` 3rd-party, `0100100` export, `0100010` summary,
`0100001` self-billed, `0201000` nominal simplified.
- NN (pos 1-2) = subtype: `01` standard, `02` simplified
- P(3)=3rd-party, N(4)=nominal, E(5)=exports, S(6)=summary, B(7)=self-billed.
The document type (388/381/383, BT-3) goes ONLY in the element VALUE, never
in `@name`. Credit/debit notes keep the same subtype name as their invoice.

**Why:** An earlier version of this memory claimed the live validator required
a 9-char `NNPNESBCG` form — that was WRONG (misattributed error). The official
SDK samples, which the SDK validator passes, all use 7 chars. Verified
July 2026 against SDK R3.4.7. Trust SDK samples as ground truth.

**How to apply:** `generateInvoiceTypeCodeName()` in
`server/zatca/xml-generator.ts` returns `${nn}00000` (7 chars).

## KSA-10 — credit/debit note reason goes in PaymentMeans/InstructionNote
BR-KSA-17: when BT-3 is 381 or 383, the issuance reason must be present as
`cac:PaymentMeans/cbc:InstructionNote`, placed right after
`cbc:PaymentMeansCode` (UBL 2.1 order). NOT a header-level `cbc:Note`.
Sourced from `adjustmentReason` (already collected/stored), 1-1000 chars.

**How to apply:** emit `<cbc:InstructionNote>` inside `<cac:PaymentMeans>` only
for credit/debit notes. Both KSA-2 and KSA-10 live in the canonicalized body,
so they affect the invoice hash (expected).
