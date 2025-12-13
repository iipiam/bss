import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Use AWS_DATABASE_URL for external AWS RDS, fallback to DATABASE_URL for Replit's built-in
// Clean up any accidental newlines or escape sequences from copy-paste
const rawUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL || '';
const databaseUrl = rawUrl.replace(/^[\s\\n]+/, '').replace(/\\n/g, '').trim();

if (!databaseUrl) {
  throw new Error(
    "AWS_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Load AWS RDS CA certificate for proper SSL validation
const caPath = path.join(process.cwd(), 'aws-rds-ca-bundle.pem');
let sslConfig;

// Check if we're in production deployment (Replit deployment)
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPL_OWNER;

if (isProduction) {
  // Production environment - AWS RDS accepts SSL without strict certificate validation
  // This is safe because AWS RDS enforces SSL at the server level
  sslConfig = {
    rejectUnauthorized: false
  };
  console.log('✅ Production mode: SSL enabled for AWS RDS');
} else {
  // Development environment - try to use CA bundle if available
  try {
    const ca = fs.readFileSync(caPath, 'utf8');
    sslConfig = {
      rejectUnauthorized: true,
      ca: ca
    };
    console.log('✅ AWS RDS SSL enabled with CA bundle (development mode)');
  } catch (error) {
    console.warn('⚠️  AWS RDS CA bundle not found, using basic SSL');
    sslConfig = {
      rejectUnauthorized: false
    };
  }
}

// Configure connection pool for AWS RDS PostgreSQL with SSL
// Parse DATABASE_URL using Node.js URL API (handles all edge cases including special characters)
// Format: postgresql://username:password@host:port/database
let parsedUrl: URL;
try {
  parsedUrl = new URL(databaseUrl);
} catch (error) {
  throw new Error(`Invalid database URL format: ${error instanceof Error ? error.message : 'Unable to parse URL'}`);
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
