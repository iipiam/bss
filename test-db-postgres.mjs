import pg from 'pg';
const { Pool } = pg;

// Parse the DATABASE_URL manually
const url = new URL(process.env.DATABASE_URL);

// Try connecting to the default 'postgres' database instead of 'bss_production'
const pool = new Pool({ 
  host: url.hostname,
  port: url.port || 5432,
  database: 'postgres',  // Try default database
  user: url.username,
  password: url.password,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  console.log('Testing connection to default "postgres" database...');
  const client = await pool.connect();
  console.log('✅ Connection successful to postgres database!');
  
  // Check if bss_production database exists
  const dbCheck = await client.query(
    "SELECT datname FROM pg_database WHERE datname = 'bss_production'"
  );
  
  if (dbCheck.rows.length > 0) {
    console.log('✅ Database "bss_production" exists');
  } else {
    console.log('⚠️  Database "bss_production" does NOT exist - need to create it');
  }
  
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Error code:', error.code);
  process.exit(1);
}
