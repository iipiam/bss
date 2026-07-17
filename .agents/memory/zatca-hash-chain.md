---
name: ZATCA hash chain & signing lock
description: ICV/PIH chain serialization rules and PIH encoding gotcha
---

- The ICV counter, PIH read, signing, lastInvoiceHash write, and ZATCA submission must run under a per-restaurant async lock (promise-chain mutex in server/zatca/service.ts, `withSignLock`). Retries reuse the stored signed XML and never touch the counter.
- **Why:** counter increment is read-then-write in storage; concurrent invoices otherwise get duplicate ICVs and both link to the same previous hash, breaking the chain ZATCA validates.
- **Gotcha:** the PIH `EmbeddedDocumentBinaryObject` in the XML is base64 of the *hex string* of the previous hash (matching how lastInvoiceHash is stored as hex), NOT base64 of raw bytes. Decode with utf8, not hex, when verifying the chain.
- Promise-chain mutex cleanup: store the exact tail promise put in the Map and compare against that same reference before deleting, or entries leak forever.
- Repeatable proof: `scripts/zatca-concurrency-test.ts` (creates temp restaurant, fires 2 concurrent invoices, asserts consecutive ICVs + linked PIH, cleans up).
- Invoice timestamps (IssueDate/IssueTime) must be Asia/Riyadh (fixed UTC+3); crypto.ts formatters shift before toISOString.
