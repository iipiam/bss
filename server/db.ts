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
  // Production-ready SSL configuration with proper certificate validation
  sslConfig = {
    rejectUnauthorized: true,
    ca: ca
  };
} catch (error) {
  console.warn('⚠️  AWS RDS CA bundle not found, falling back to basic SSL');
  // Fallback for development/testing - still use SSL but without CA validation
  sslConfig = {
    rejectUnauthorized: false
  };
}

// Configure connection pool for AWS RDS PostgreSQL with SSL
// The pg library automatically parses DATABASE_URL connection string
// Format: postgresql://username:password@host:port/database
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
