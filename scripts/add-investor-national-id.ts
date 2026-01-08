/**
 * One-time migration script to add national_id column to investors table
 * Run with: NODE_ENV=production tsx scripts/add-investor-national-id.ts
 */
import { pool } from '../server/db';

async function migrate() {
  console.log('Adding national_id column to investors table...');
  
  try {
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS national_id TEXT;
    `);
    console.log('✅ Successfully added national_id column to investors table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
