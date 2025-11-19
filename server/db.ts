import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Manual parsing to handle passwords with special characters like @ symbol
// Format: postgresql://username:password@host:port/database?params
const dbUrl = process.env.DATABASE_URL;

// Extract components - parse from right to left to handle @ in password
// First extract the host/port/database part
const hostMatch = dbUrl.match(/@([^:@]+):(\d+)\/([^?]+)/);
if (!hostMatch) {
  throw new Error('Invalid DATABASE_URL format - cannot parse host/port/database');
}

const host = hostMatch[1];
const port = hostMatch[2];
const database = hostMatch[3];

// Then extract username and password from the beginning
// Everything between :// and the LAST @ is "username:password"
const credMatch = dbUrl.match(/^postgresql:\/\/(.+)@[^@]+:\d+\//);
if (!credMatch) {
  throw new Error('Invalid DATABASE_URL format - cannot parse credentials');
}

const credentials = credMatch[1];
const colonIndex = credentials.indexOf(':');
if (colonIndex === -1) {
  throw new Error('Invalid DATABASE_URL format - no password separator found');
}

const user = credentials.substring(0, colonIndex);
const password = credentials.substring(colonIndex + 1);

// Configure connection pool for AWS RDS PostgreSQL with SSL
// SSL encryption is enabled but certificate validation is disabled
// This is required for AWS RDS which uses self-signed certificates
export const pool = new Pool({ 
  user,
  password,
  host,
  port: parseInt(port),
  database,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
