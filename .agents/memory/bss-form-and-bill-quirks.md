---
name: BSS form & bill quirks
description: Silent form-submit failures from tenant fields in zod schemas; shop_bills paymentPeriod naming inconsistency.
---

- Client forms using zodResolver with `createInsertSchema(table)` must `.omit({ restaurantId: true })` — the server injects it from the session, and leaving it required makes validation fail silently so submit buttons appear dead (confirmed fix on branches form).
  **How to apply:** any new tenant-scoped form; if a submit button "does nothing", log `form.formState.errors` first.
- `shop_bills.paymentPeriod` values in real data are camelCase (`oneTime`, possibly `semiAnnually`) while schema enum/UI elsewhere uses kebab-case (`one-time`, `semi-annually`). Any factor/lookup map keyed on period must include both spellings; one-time bills must have factor 0 in monthly fixed-cost math.
