/**
 * Railway PostgreSQL connection pool.
 * Uses the DATABASE_URL environment variable provided by Railway.
 * All services import `db` from this module instead of the Supabase client.
 */
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Convenience wrapper — runs a parameterised query and returns all rows.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<T[]> {
  const result = await db.query<T>(text, values);
  return result.rows;
}

/**
 * Convenience wrapper — runs a parameterised query and returns the first row.
 */
export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<T | null> {
  const result = await db.query<T>(text, values);
  return result.rows[0] ?? null;
}
