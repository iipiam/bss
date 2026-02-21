import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const pgUser = process.env.PGUSER;
  const pgPassword = process.env.PGPASSWORD;
  const pgHost = process.env.PGHOST;
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE;

  if (pgUser && pgPassword && pgHost && pgDatabase) {
    return `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require`;
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const databaseUrl = rawUrl.replace(/^[\s\\n]+/, '').replace(/\\n/g, '').trim();

  if (databaseUrl) {
    return databaseUrl;
  }

  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({ connectionString: databaseUrl });

const parsedUrl = new URL(databaseUrl);
console.log(`✅ Database connected to ${parsedUrl.hostname}`);

export const db = drizzle(pool, { schema });
