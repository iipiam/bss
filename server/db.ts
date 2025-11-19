import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { readFileSync } from 'fs';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for AWS RDS PostgreSQL with SSL certificate
const url = process.env.DATABASE_URL;

export const pool = new Pool({ 
  connectionString: url,
  ssl: {
    rejectUnauthorized: true, // Enable proper SSL validation
    ca: readFileSync('/tmp/global-bundle.pem').toString() // AWS RDS certificate bundle
  }
});

export const db = drizzle(pool, { schema });
