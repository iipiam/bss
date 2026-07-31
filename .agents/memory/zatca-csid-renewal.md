---
name: ZATCA production CSID renewal
description: Correct ZATCA renewal API shape and key-rotation rule for renewing production CSIDs.
---

- The renewal endpoint is `PATCH /production/csids` with Basic auth = CURRENT production CSID:secret, header `OTP`, body `{"csr": "<fresh CSR>"}`. There is NO `POST /production/csids/renew` — ZATCA returns 404 for it.
- **Why:** discovered via a sandbox dry run; the original guess-path 404'd and would have failed exactly at real expiry time.
- **How to apply:** renewal must generate a fresh keypair + CSR first, but only persist the new privateKey/csr together with the new CSID/secret AFTER ZATCA accepts — the renewed cert certifies the NEW key, and a partial write breaks invoice signing.
- Sandbox accepts OTP `123456` for both onboarding and renewal; simulation/production reject bad OTPs with 401 (map to a friendly message).
