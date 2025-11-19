import pg from 'pg';
const { Pool } = pg;

// Parse the DATABASE_URL manually
const url = new URL(process.env.DATABASE_URL);
console.log('Connection details:');
console.log('- Host:', url.hostname);
console.log('- Port:', url.port);
console.log('- Database:', url.pathname.substring(1));
console.log('- Username:', url.username);
console.log('- SSL mode:', url.searchParams.get('sslmode'));

// Try with explicit SSL configuration
const pool = new Pool({ 
  host: url.hostname,
  port: url.port || 5432,
  database: url.pathname.substring(1),
  user: url.username,
  password: url.password,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  console.log('\nAttempting connection...');
  const client = await pool.connect();
  console.log('✅ Connection successful!');
  const result = await client.query('SELECT version()');
  console.log('PostgreSQL version:', result.rows[0].version);
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Error code:', error.code);
  process.exit(1);
}
