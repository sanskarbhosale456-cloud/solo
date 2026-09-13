import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const g = globalThis as typeof globalThis & {
  __pgPool?: Pool;
  __pgDb?: NodePgDatabase;
};

/** Only called at request-time, never at build/import time */
function getDb(): NodePgDatabase {
  if (g.__pgDb) return g.__pgDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const pool = g.__pgPool ?? new Pool({ connectionString: url });
  const db = drizzle(pool);

  if (process.env.NODE_ENV !== "production") {
    g.__pgPool = pool;
    g.__pgDb = db;
  }

  return db;
}

/**
 * Lazy proxy — drizzle() is never called during module initialisation / Next.js
 * static build. It is only invoked the first time a route actually executes a
 * query, at which point DATABASE_URL must already be present in the environment.
 */
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
  apply(_target, thisArg, args) {
    return Reflect.apply(getDb() as unknown as Function, thisArg, args);
  },
});

/** Convenience for the rare case where you need the raw Pool */
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    // Access pool lazily through getDb which initialises it
    getDb();
    return Reflect.get(g.__pgPool!, prop);
  },
});
