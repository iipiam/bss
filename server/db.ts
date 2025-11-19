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
  // AWS RDS SSL configuration with CA bundle for production-grade security
  // Using rejectUnauthorized: true with AWS RDS CA bundle ensures proper certificate validation
  sslConfig = {
    rejectUnauthorized: true,
    ca: ca
  };
  console.log('✅ AWS RDS SSL enabled with CA bundle (production mode)');
} catch (error) {
  console.warn('⚠️  AWS RDS CA bundle not found, using basic SSL');
  // Fallback for development/testing - still use SSL but without strict validation
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
const user = credentials.substring(0, colonIndex);
const password = credentials.substring(colonIndex + 1);

export const pool = new Pool({ 
  user,
  password,
  host,
  port: parseInt(port),
  database,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
