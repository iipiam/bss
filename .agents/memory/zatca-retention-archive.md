---
name: ZATCA retention & lifecycle design rules
description: Durable compliance/design rationale for XML retention, invoice finality, and scheduler alert dedup.
---

# ZATCA retention & lifecycle design rules

- ZATCA Article 59 (VAT Implementing Regulations) mandates 6-year retention of signed invoice XML — archival must be append-only and immune to app-level deletes; the only correction path after clearance/reporting is a credit or debit note.
- **Why append-only + DB unique constraint:** overlapping scheduler sweeps race; read-then-insert produces duplicates. Enforce idempotency at the DB level (unique + ON CONFLICT), never in application logic alone.
- **Why claim-before-send for recurring alerts:** a 15-min sweep re-fires alerts forever unless a dedup marker is claimed atomically (conditional UPDATE, escalation-only) *before* sending; reset the marker on certificate renewal.
- **Why DB-level (trigger) immutability:** storage-method guards can be bypassed by any other code path or raw SQL; compliance-critical append-only guarantees must live in the database (reject UPDATE always, DELETE only after retention expiry).
- Scheduler sweeps must not share an early-return: an "if nothing pending, return" guard silently starves every sweep added after it. Each sweep gets its own try/catch, none may return early for the others.
- The prod schema-sync mechanism carries no indexes/FKs/uniques/triggers — any table whose correctness depends on constraints also needs a hand-written migration step (see prod-schema-sync.md).
