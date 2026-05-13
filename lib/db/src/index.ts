import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Warn but do NOT throw — let Express start so health checks pass.
  // DB queries will fail until DATABASE_URL is set in the environment.
  console.error("[DB] WARNING: DATABASE_URL is not set. Database queries will fail. Set DATABASE_URL in your environment variables.");
}

export const pool = new Pool({
  connectionString: connectionString || "postgres://localhost/placeholder",
  max: 10,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

pool.on("error", (err) => {
  console.error("[DB] Pool error:", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
