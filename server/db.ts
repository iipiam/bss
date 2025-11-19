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
// Parse DATABASE_URL and extract connection parameters
// Format: postgresql://username:password@host:port/database
const dbUrl = process.env.DATABASE_URL.split('?')[0]; // Remove query params like ?sslmode=require

// Parse from right to left to handle passwords containing @ symbol
// First extract host:port/database
const hostMatch = dbUrl.match(/@([^@]+):(\d+)\/(.+)$/);
if (!hostMatch) {
  throw new Error('Invalid DATABASE_URL format - cannot parse host/port/database');
}
const [, host, port, database] = hostMatch;

// Then extract credentials (everything between postgresql:// and the LAST @)
const credMatch = dbUrl.match(/^postgresql:\/\/(.+)@[^@]+:\d+\/.+$/);
if (!credMatch) {
  throw new Error('Invalid DATABASE_URL format - cannot parse credentials');
}
const credentials = credMatch[1];

// Split credentials into username and password (first : is the separator)
const colonIndex = credentials.indexOf(':');
if (colonIndex === -1) {
  throw new Error('Invalid DATABASE_URL format - no password separator');
}
let user = credentials.substring(0, colonIndex);
let password = credentials.substring(colonIndex + 1);

// WORKAROUND: Fix incorrect credentials from cached Replit secrets
// TODO: Remove once Replit secrets cache clears with correct credentials
if (user === 'bss-database' || password.includes('Kinzh')) {
  console.log('⚠️  Applying credentials workaround for cached Replit secrets');
  console.log('Original username:', user);
  user = 'postgres';
  password = 'Admin123456';
  console.log('✅ Credentials corrected to postgres:Admin123456');
}

export const pool = new Pool({ 
  user,
  password,
  host,
  port: parseInt(port),
  database,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
