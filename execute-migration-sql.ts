import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log('Connecting to AWS RDS PostgreSQL...');
  
  // Check if URL already has sslmode=disable parameter
  const url = process.env.DATABASE_URL;
  const hasSSLMode = url.includes('sslmode=');
  
  const pool = new Pool({ 
    connectionString: url,
    ...(hasSSLMode ? {} : {
      ssl: {
        rejectUnauthorized: false // Allow AWS RDS self-signed certificates
      }
    })
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Read migration SQL file
    console.log('\nReading migration file...');
    const migrationSQL = readFileSync('./migrations/0000_legal_greymalkin.sql', 'utf-8');
    
    console.log('\nExecuting migration SQL...');
    await client.query(migrationSQL);
    
    console.log('✅ All tables created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log(`\n✅ Created ${result.rows.length} tables:`);
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.tablename}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
