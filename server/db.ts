import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure connection pool for AWS RDS PostgreSQL with SSL
const certPath = resolve(__dirname, '..', 'aws-rds-ca-bundle.pem');
let sslConfig;

if (existsSync(certPath)) {
  // Use AWS RDS CA bundle for proper SSL certificate validation
  sslConfig = {
    rejectUnauthorized: true,
    ca: readFileSync(certPath).toString()
  };
} else {
  // Fallback: SSL enabled but certificate validation disabled
  // This still encrypts the connection but doesn't validate the certificate chain
  sslConfig = {
    rejectUnauthorized: false
  };
  console.warn('AWS RDS CA bundle not found. SSL certificate validation disabled.');
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
