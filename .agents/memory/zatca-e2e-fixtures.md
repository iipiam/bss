---
name: ZATCA E2E fixture cleanup
description: How to keep browser-test fixtures compatible with immutable ZATCA retention controls.
---

Ordinary browser tests must not seed invoices in `cleared`, `reported`, or accepted-with-warning states unless the fixture is created inside a transaction that is guaranteed to roll back.

**Why:** Finalized ZATCA invoices are intentionally protected by database retention and finality guards. Cleanup that tries to delete them will fail, leaving test tenants behind and potentially obscuring later test results.

**How to apply:** For dashboard and access-control E2E tests, use no ZATCA rows or only non-final retryable rows with external submission disabled. Test finalized-state behavior in the transactional verifier.