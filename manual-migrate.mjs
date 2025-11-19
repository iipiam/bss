import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;

// Parse DATABASE_URL to remove sslmode parameter and construct our own SSL config
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');  // Remove sslmode parameter

console.log('Connecting to AWS RDS PostgreSQL...');
console.log('Host:', url.hostname);
console.log('Database:', url.pathname.substring(1));

const pool = new Pool({ 
  connectionString: url.toString(),
  ssl: {
    rejectUnauthorized: false  // Allow self-signed certificates
  }
});

try {
  const client = await pool.connect();
  console.log('✅ Connected to AWS RDS');
  
  // Check if tables already exist
  const tablesCheck = await client.query(`
    SELECT COUNT(*) as count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  
  if (parseInt(tablesCheck.rows[0].count) > 0) {
    console.log(`\n⚠️  Database already has ${tablesCheck.rows[0].count} tables. Skipping migration.`);
    
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Existing tables:');
    existingTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
  } else {
    // Read and execute the migration SQL
    const migrationSQL = readFileSync('migrations/0000_legal_greymalkin.sql', 'utf8');
    console.log('\n📋 Executing migration to create database schema...\n');
    
    await client.query(migrationSQL);
    
    console.log('✅ Database schema created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Created ${result.rows.length} tables:`);
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
  }
  
  client.release();
  await pool.end();
  console.log('\n✅ Migration complete!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
