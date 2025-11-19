import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for AWS RDS PostgreSQL with SSL
const certPath = '/tmp/global-bundle.pem';
const sslConfig = existsSync(certPath) 
  ? {
      rejectUnauthorized: true,
      ca: readFileSync(certPath).toString()
    }
  : {
      rejectUnauthorized: false // Fallback if certificate not found
    };

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
