import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

const rawUrl = process.env.DATABASE_URL || '';
const databaseUrl = rawUrl.replace(/^[\s\\n]+/, '').replace(/\\n/g, '').trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let parsedUrl: URL;
try {
  parsedUrl = new URL(databaseUrl);
} catch (error) {
  throw new Error(`Invalid database URL format: ${error instanceof Error ? error.message : 'Unable to parse URL'}`);
}

const user = parsedUrl.username;
const password = decodeURIComponent(parsedUrl.password);
const host = parsedUrl.hostname;
const port = parsedUrl.port ? parseInt(parsedUrl.port) : 5432;
const database = parsedUrl.pathname.slice(1);

if (!user || !password || !host || !database) {
  throw new Error(`Missing required DATABASE_URL parameters. Found: user=${!!user}, password=${!!password}, host=${!!host}, database=${!!database}`);
}

const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

export const pool = new Pool({ 
  user,
  password,
  host,
  port,
  database,
  ssl: isLocalhost ? false : { rejectUnauthorized: false }
});

console.log(`✅ Database connected to ${host}`);

export const db = drizzle(pool, { schema });
