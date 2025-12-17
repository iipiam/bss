-- ============================================
-- Performance Optimization: Database Indexes
-- ============================================
-- Run this SQL on production database:
-- PGSSLMODE=verify-full PGSSLROOTCERT=./aws-rds-ca-bundle.pem psql -f sql/add_performance_indexes.sql
-- ============================================

-- Index for menu items by restaurant (for filtering)
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant 
ON menu_items(restaurant_id);

-- Index for inventory items by branch (for branch-specific queries)
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch 
ON inventory_items(branch_id);

-- Index for inventory items by restaurant
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant 
ON inventory_items(restaurant_id);

-- Composite index for branch-specific inventory with status filtering
CREATE INDEX IF NOT EXISTS idx_inventory_branch_status 
ON inventory_items(branch_id, status);

-- Index for recipe by restaurant
CREATE INDEX IF NOT EXISTS idx_recipes_restaurant 
ON recipes(restaurant_id);

-- Index for orders by restaurant (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant 
ON orders(restaurant_id);

-- Index for orders by status (for active orders count)
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Composite index for orders by restaurant and date (for analytics)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_date 
ON orders(restaurant_id, created_at DESC);

-- Index for inventory transactions by order (for audit trail)
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order 
ON inventory_transactions(order_id);

-- Index for inventory transactions by inventory item (for history)
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item 
ON inventory_transactions(inventory_item_id);

-- Update query planner statistics
ANALYZE menu_items;
ANALYZE inventory_items;
ANALYZE recipes;
ANALYZE orders;
ANALYZE inventory_transactions;

-- Verify indexes were created:
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
