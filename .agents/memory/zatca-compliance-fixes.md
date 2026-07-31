---
name: ZATCA Phase 2 compliance fixes applied
description: Summary of compliance gaps found and fixes applied to reach Phase 2 readiness.
---

# ZATCA Phase 2 Compliance Fixes (July 2026)

## Fixes Applied

### Critical
- **B2B clearance gate** (`server/routes.ts`): B2B invoice endpoint now blocks PDF delivery until
  ZATCA confirms clearance. Returns 422 on rejection, 202 on pending. Non-configured tenants
  (NO_SETTINGS/ZATCA_DISABLED) are allowed through so unregistered tenants are unaffected.

- **24-hour B2C reporting scheduler** (`server/index.ts`): `setInterval` runs every 15 minutes,
  calls `storage.getRestaurantsWithPendingZatcaInvoices()` then `retryPendingInvoices()` per tenant.

### High
- **Private key AES-256-GCM encryption at rest** (`server/zatca/crypto.ts`):
  `encryptPrivateKey(pem)` / `decryptPrivateKey(stored)` use `SESSION_SECRET`-derived key.
  Format: `v1:<ivHex>:<tagHex>:<cipherHex>`. Legacy plaintext keys pass through unchanged.
  Applied transparently in `storage.getZatcaSettings` (decrypt) and `updateZatcaSettings` (encrypt).

- **Signed XML download** (`server/routes.ts` `/api/invoices/:id/download-xml`):
  Returns `invoiceZatcaStatus.signedXml` when available; falls back to unsigned XML only for
  invoices predating Phase 2 or where ZATCA is disabled.

- **Invoice immutability guard** (`server/storage.ts` `updateInvoice`):
  Checks `invoiceZatcaStatus.submissionStatus` before allowing changes to financial fields
  (subtotal, vatAmount, total, discount, items). Throws if status is "cleared" or "reported".

### Medium
- **CSID renewal route** (`server/routes.ts` `POST /api/zatca/renew-csid`): IT-only endpoint.
  Calls `ZatcaApiClient.renewProductionCSID(otp)`, stores new CSID and parses new expiry.

- **Buyer VAT warning for B2B** (`server/zatca/service.ts`): Logs a warning when
  `customerVat` is absent for standard (B2B) invoices, referencing BR-KSA-44.

- **Storage helper** (`server/storage.ts`): Added `getRestaurantsWithPendingZatcaInvoices()`.

## Still Outstanding (infrastructure/policy decisions needed)
- M6: 6-year archival enforcement — signed XMLs are in DB but no object-storage backup or
  hard-delete prevention configured. Needs S3/object lock or equivalent.
- Medium-3: signedPropertiesHash uses base64(hex) not base64(raw) — matches ZATCA SDK convention,
  leave unless ZATCA rejects it.
- Deprecated functions in crypto.ts left in place with @deprecated markers.

**Why:** These decisions require infrastructure access (object storage, backup policy) outside
the application code, so they cannot be fully implemented without operator input.
