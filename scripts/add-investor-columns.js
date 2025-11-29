// Run this script on your production server to add missing investor columns
// Usage: node add-investor-columns.js
// Make sure DATABASE_URL environment variable is set, or edit the connection string below

const { Client } = require('pg');

async function addInvestorColumns() {
  // Use DATABASE_URL from environment, or set your connection string here
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('Set it with: export DATABASE_URL="postgresql://user:password@host:port/database"');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Add investor_type column
    console.log('Adding investor_type column...');
    await client.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS investor_type text NOT NULL DEFAULT 'money'
    `);
    console.log('investor_type column added successfully');

    // Add recipe_id column
    console.log('Adding recipe_id column...');
    await client.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS recipe_id character varying
    `);
    console.log('recipe_id column added successfully');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'investors'
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent investors table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\nDone! Investor creation should now work.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

addInvestorColumns();
