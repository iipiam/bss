import pg from 'pg';
import * as fs from 'fs';

const { Client } = pg;

async function migrateITAccounts() {
  console.log('🔧 Starting IT accounts migration...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(databaseUrl);
  const config = {
    user: url.username,
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('./aws-rds-ca-bundle.pem').toString(),
    },
  };

  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📝 Altering users table to make restaurantId nullable...');
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN restaurant_id DROP NOT NULL;
    `);
    console.log('✅ Column altered successfully');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

migrateITAccounts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
