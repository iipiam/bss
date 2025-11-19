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
// Parse DATABASE_URL using Node.js URL API (handles all edge cases including special characters)
// Format: postgresql://username:password@host:port/database
let parsedUrl: URL;
try {
  parsedUrl = new URL(process.env.DATABASE_URL);
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unable to parse URL'}`);
}

// Extract connection parameters from parsed URL
const user = parsedUrl.username;
const password = decodeURIComponent(parsedUrl.password); // Decode URL-encoded characters
const host = parsedUrl.hostname;
const port = parsedUrl.port ? parseInt(parsedUrl.port) : 5432;
const database = parsedUrl.pathname.slice(1); // Remove leading '/'

// Validate required parameters
if (!user || !password || !host || !database) {
  throw new Error(`Missing required DATABASE_URL parameters. Found: user=${!!user}, password=${!!password}, host=${!!host}, database=${!!database}`);
}

export const pool = new Pool({ 
  user,
  password,
  host,
  port,
  database,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
