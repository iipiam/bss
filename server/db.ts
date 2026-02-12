import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || '';
  const databaseUrl = rawUrl.replace(/^[\s\\n]+/, '').replace(/\\n/g, '').trim();

  if (databaseUrl && !databaseUrl.includes('rds.amazonaws.com')) {
    return databaseUrl;
  }

  const pgUser = process.env.PGUSER;
  const pgPassword = process.env.PGPASSWORD;
  const pgHost = process.env.PGHOST;
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE;

  if (pgUser && pgPassword && pgHost && pgDatabase) {
    console.log('⚠️ Skipping AWS DATABASE_URL, using Replit PG variables instead');
    return `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
  }

  if (databaseUrl) {
    return databaseUrl;
  }

  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const databaseUrl = getDatabaseUrl();

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
