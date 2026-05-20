import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Startup migrations for columns added after initial schema deploy
(async () => {
  try {
    await pool.query(`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS partners jsonb DEFAULT '[]'::jsonb`);
  } catch (err) {
    console.warn('[Migration] company_profiles.partners:', (err as Error).message);
  }
})();
