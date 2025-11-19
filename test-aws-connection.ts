import { Pool } from '@neondatabase/serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log('Testing AWS RDS connection...');
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 30) + '...');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query result:', result.rows[0]);
    
    client.release();
    console.log('✅ Connection test passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);
