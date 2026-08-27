---
name: Branch deletion preserves records
description: Durable rules for safely deleting non-main branches without losing linked operational or historical data.
---

Deleting a non-main branch is a merge into Main Branch, not a cascade or direct parent-row deletion. Reassign all branch-linked records atomically, resolve branch-inclusive uniqueness collisions, update orders before transactions, and delete the branch only after preservation succeeds. Main Branch cannot be renamed or deleted.

**Why:** PostgreSQL correctly blocks direct branch deletion when linked records exist. A catalog-discovered generic reassignment proved unreliable in an end-to-end test, while an explicit reviewed list preserved a linked inventory row and allowed deletion. Cascading would risk losing financial and operational history.

**How to apply:** Whenever a table adds a foreign key to a branch, add it to the explicit preservation list and determine whether duplicate Main/source rows should merge, retain Main, or deduplicate before reassignment. Keep the whole operation in one transaction so any conflict rolls back.