import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL and remove sslmode parameter to avoid conflicts
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode'); // Remove sslmode to use our custom SSL config

// Configure connection pool for AWS RDS PostgreSQL with SSL
// SSL encryption is enabled but certificate validation is disabled
// This is required for AWS RDS which uses self-signed certificates
export const pool = new Pool({ 
  connectionString: url.toString(),
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
