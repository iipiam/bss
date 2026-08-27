---
name: Promotion transaction ordering
description: Defines race semantics between authoritative checkout pricing and admin promotion changes.
---

Promotion previews are advisory only. Authoritative restaurant checkout evaluation and every promotion mutation must share tenant-scoped transaction serialization, with pricing, usage checks, order persistence, payment linking, inventory, and audit snapshots committed atomically.

**Why:** A server-side quote performed before the order transaction can become stale if an admin pauses, archives, edits, retargets, or creates a promotion before checkout commits. Version checks alone do not prevent new-promotion or link-change phantoms.

**How to apply:** Capture one server timestamp after acquiring the tenant transaction lock, load all current promotion and pricing inputs through that transaction, then evaluate and persist. If checkout acquires the lock first, it may finish under the prior rule; if the mutation acquires it first, checkout must use the new state.