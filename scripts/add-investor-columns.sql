-- Run this SQL on your production database to add missing investor columns
-- Connect with: psql -h YOUR_RDS_ENDPOINT -U postgres -d YOUR_DATABASE -f add-investor-columns.sql

ALTER TABLE investors ADD COLUMN IF NOT EXISTS investor_type text NOT NULL DEFAULT 'money';
ALTER TABLE investors ADD COLUMN IF NOT EXISTS recipe_id character varying;

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'investors';
