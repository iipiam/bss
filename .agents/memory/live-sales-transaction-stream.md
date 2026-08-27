---
name: Live sales transaction stream
description: The consistency rule for making every revenue source appear in dashboard analytics without double counting.
---

Every revenue-producing flow must create its authoritative transaction atomically with its order/payment records and broadcast `sales:updated` after commit. Dashboard performance reads transactions and order status; it must not infer revenue by summing orders.

**Why:** Delivery ingestion originally created paid orders and invoices without transactions, so its revenue never appeared in live Performance Analysis. Legacy POS data also contains some unlinked orders and standalone transactions that cannot be safely paired by a broad backfill without double counting.

**How to apply:** For any new sales source, persist a transaction with the exact order ID in the same database transaction, make creation idempotent, and emit a tenant-scoped sales update. Backfill only sources whose missing relationship is deterministic.