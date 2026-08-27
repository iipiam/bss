---
name: Delivery provider contracts
description: Rules for safely extending delivery-platform adapters when vendor API contracts vary or are unavailable
---

- Delivery providers are configuration-driven, but every endpoint, credential header, signature convention, event-ID header, and payload path must come from verified vendor documentation.

**Why:** HungerStation and Jahez contract details were not supplied, and guessed API behavior would create false connection success, broken ingestion, or unsafe outbound requests.

**How to apply:** add provider registry metadata and documented defaults only after obtaining the official merchant API contract. Keep outbound destinations HTTPS/public-only, preserve signed-event idempotency, and keep delivery retries/errors separate from ZATCA state.