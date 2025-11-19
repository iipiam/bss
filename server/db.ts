import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for AWS RDS PostgreSQL
// Check if URL already has sslmode=disable parameter
const url = process.env.DATABASE_URL;
const hasSSLMode = url.includes('sslmode=');

export const pool = new Pool({ 
  connectionString: url,
  ...(hasSSLMode ? {} : {
    ssl: {
      rejectUnauthorized: false // Allow AWS RDS self-signed certificates
    }
  })
});

export const db = drizzle(pool, { schema });
