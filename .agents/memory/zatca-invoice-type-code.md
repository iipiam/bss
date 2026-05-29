---
name: ZATCA InvoiceTypeCode @name + credit/debit note reason
description: KSA-2 transaction-code length and KSA-10 reason placement that ZATCA's live validator actually enforces
---

# ZATCA InvoiceTypeCode @name (KSA-2) and note reason (KSA-10)

## KSA-2 — the @name attribute must be 9 characters (NNPNESBCG)
ZATCA's current/live validator rejects the older 7-char `NNPNESB` form. It
requires the 9-char `NNPNESBCG` structure:
- NN (pos 1-2) = invoice subtype: `01` standard tax invoice, `02` simplified
- P(3)=3rd-party, N(4)=nominal, E(5)=exports, S(6)=summary, B(7)=self-billed,
  C(8)=continuous supply, G(9)=B2G — all default to `0`.
So a plain standard invoice is `010000000` and simplified is `020000000`.
The document type (388 invoice / 381 credit / 383 debit, BT-3) goes ONLY in
the InvoiceTypeCode element VALUE, never in `@name`. Credit/debit notes keep
the same `01.../02...` subtype name as their underlying invoice.

**Why:** A generic web search returns the OLD 7-char spec and the original
task description also said 7 chars (`0100000`). Both are wrong for the
validator this project targets — the actual validator error explicitly spelled
out `NNPNESBCG` with 9 positions. Trust the live validator error over docs.

**How to apply:** In `server/zatca/xml-generator.ts`,
`generateInvoiceTypeCodeName()` returns `${nn}0000000` (9 chars). Do not
"correct" it back to 7.

## KSA-10 — credit/debit note reason goes in PaymentMeans/InstructionNote
BR-KSA-17: when BT-3 is 381 or 383, the issuance reason must be present as
`cac:PaymentMeans/cbc:InstructionNote`, placed right after
`cbc:PaymentMeansCode` (UBL 2.1 order). NOT a header-level `cbc:Note`.
Sourced from `adjustmentReason` (already collected/stored), 1-1000 chars.

**How to apply:** emit `<cbc:InstructionNote>` inside `<cac:PaymentMeans>` only
for credit/debit notes. Both KSA-2 and KSA-10 live in the canonicalized body,
so they affect the invoice hash (expected).
