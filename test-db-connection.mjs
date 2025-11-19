import pg from 'pg';
const { Pool } = pg;

const url = process.env.DATABASE_URL;
console.log('Testing connection...');
console.log('URL format:', url.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({ 
  connectionString: url
});

try {
  const client = await pool.connect();
  console.log('✅ Connection successful!');
  const result = await client.query('SELECT version()');
  console.log('PostgreSQL version:', result.rows[0].version);
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Error code:', error.code);
  console.error('Full error:', error);
  process.exit(1);
}
