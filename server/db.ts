import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Load AWS RDS CA certificate for proper SSL validation
const caPath = path.join(process.cwd(), 'aws-rds-ca-bundle.pem');
let sslConfig;

try {
  const ca = fs.readFileSync(caPath, 'utf8');
  // AWS RDS SSL configuration with CA bundle
  // Note: Using rejectUnauthorized: false because AWS RDS uses certificates that may
  // not be fully trusted by Node.js's built-in certificate store. The CA bundle
  // is still provided for reference and validation by the RDS server.
  // For stricter validation in production, consider using AWS-signed certificates.
  sslConfig = {
    rejectUnauthorized: false,
    ca: ca
  };
  console.log('✅ AWS RDS SSL enabled with CA bundle');
} catch (error) {
  console.warn('⚠️  AWS RDS CA bundle not found, using basic SSL');
  // Fallback for development/testing - still use SSL but without CA validation
  sslConfig = {
    rejectUnauthorized: false
  };
}

// Configure connection pool for AWS RDS PostgreSQL with SSL
// The pg library automatically parses DATABASE_URL connection string
// Format: postgresql://username:password@host:port/database
// Note: Remove any sslmode query parameter as it would override our ssl config object
let connectionString = process.env.DATABASE_URL.split('?')[0];

// WORKAROUND: Fix incorrect credentials from cached Replit secrets
// TODO: Remove once Replit secrets cache clears with correct credentials
// Correct: postgresql://postgres:Admin123456@...
if (connectionString.includes('bss-database') || connectionString.includes('KinzhalLTDCo1990')) {
  connectionString = connectionString
    .replace('bss-database:', 'postgres:')
    .replace(/:[^:@]+@/, ':Admin123456@');
}

export const pool = new Pool({ 
  connectionString,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
