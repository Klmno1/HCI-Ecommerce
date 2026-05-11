import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __youdePostgresPool: Pool | undefined;
}

export function getPostgresPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__youdePostgresPool) {
    global.__youdePostgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined
    });
  }

  return global.__youdePostgresPool;
}
