\set ON_ERROR_STOP on

-- Required psql variables:
--   restaurant_id  Restaurant whose unused branch data must be repaired
--   source_name    Unused branch currently holding misattributed sales
--   target_name    Correct destination branch
--
-- This repair is intentionally narrow:
--   * moves orders and sales transactions only
--   * never changes amounts, dates, statuses, or invoice records
--   * aborts unless source and target names each resolve to exactly one branch
--   * runs atomically and is safe to re-run

BEGIN;

CREATE TEMP TABLE branch_sales_repair_scope ON COMMIT DROP AS
SELECT
  :'restaurant_id'::varchar AS restaurant_id,
  count(*) FILTER (WHERE name = :'source_name')::integer AS source_count,
  min(id) FILTER (WHERE name = :'source_name') AS source_branch_id,
  count(*) FILTER (WHERE name = :'target_name')::integer AS target_count,
  min(id) FILTER (WHERE name = :'target_name') AS target_branch_id
FROM branches
WHERE restaurant_id = :'restaurant_id';

DO $repair$
DECLARE
  scope_record record;
BEGIN
  SELECT * INTO scope_record FROM branch_sales_repair_scope;

  IF scope_record.source_count <> 1 OR scope_record.source_branch_id IS NULL THEN
    RAISE EXCEPTION
      'Repair aborted: expected exactly one source branch, found %',
      scope_record.source_count;
  END IF;

  IF scope_record.target_count <> 1 OR scope_record.target_branch_id IS NULL THEN
    RAISE EXCEPTION
      'Repair aborted: expected exactly one target branch, found %',
      scope_record.target_count;
  END IF;

  IF scope_record.source_branch_id = scope_record.target_branch_id THEN
    RAISE EXCEPTION 'Repair aborted: source and target branches are identical';
  END IF;
END;
$repair$;

\echo '=== REPAIR SCOPE ==='
SELECT
  restaurant_id,
  source_branch_id,
  target_branch_id
FROM branch_sales_repair_scope;

\echo '=== BEFORE ==='
SELECT
  'orders' AS record_type,
  count(*) AS record_count,
  coalesce(sum(total), 0)::numeric(14,2) AS total
FROM orders
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope)
UNION ALL
SELECT
  'transactions',
  count(*),
  coalesce(sum(total), 0)::numeric(14,2)
FROM transactions
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope);

UPDATE orders
SET branch_id = (SELECT target_branch_id FROM branch_sales_repair_scope)
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope);

UPDATE transactions
SET branch_id = (SELECT target_branch_id FROM branch_sales_repair_scope)
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope);

\echo '=== AFTER: SOURCE BRANCH MUST BE EMPTY ==='
SELECT
  'orders' AS record_type,
  count(*) AS remaining_records,
  coalesce(sum(total), 0)::numeric(14,2) AS remaining_total
FROM orders
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope)
UNION ALL
SELECT
  'transactions',
  count(*),
  coalesce(sum(total), 0)::numeric(14,2)
FROM transactions
WHERE restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND branch_id = (SELECT source_branch_id FROM branch_sales_repair_scope);

\echo '=== ORDER/TRANSACTION BRANCH MISMATCHES MUST BE ZERO ==='
SELECT count(*) AS remaining_mismatches
FROM transactions t
JOIN orders o
  ON o.id = t.order_id
 AND o.restaurant_id = t.restaurant_id
WHERE t.restaurant_id = (SELECT restaurant_id FROM branch_sales_repair_scope)
  AND t.branch_id IS DISTINCT FROM o.branch_id;

COMMIT;