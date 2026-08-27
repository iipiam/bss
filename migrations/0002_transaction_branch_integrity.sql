-- Repair order-linked transactions that were attributed to a different branch.
-- The persisted order is authoritative; standalone transactions are untouched.
UPDATE transactions t
SET branch_id = o.branch_id
FROM orders o
WHERE t.order_id = o.id
  AND t.restaurant_id = o.restaurant_id
  AND t.branch_id IS DISTINCT FROM o.branch_id;

CREATE OR REPLACE FUNCTION transaction_order_branch_guard()
RETURNS trigger AS $$
DECLARE
  order_restaurant varchar;
  order_branch varchar;
BEGIN
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT restaurant_id, branch_id
  INTO order_restaurant, order_branch
  FROM orders
  WHERE id = NEW.order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction order does not exist';
  END IF;

  IF NEW.restaurant_id IS DISTINCT FROM order_restaurant THEN
    RAISE EXCEPTION 'transaction restaurant does not match its order';
  END IF;

  NEW.branch_id := order_branch;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'transaction_order_branch_guard'
  ) THEN
    CREATE TRIGGER transaction_order_branch_guard
      BEFORE INSERT OR UPDATE OF order_id, restaurant_id, branch_id
      ON transactions
      FOR EACH ROW
      EXECUTE FUNCTION transaction_order_branch_guard();
  END IF;
END;
$$;