// Supabase uses self-signed certificates that Node.js rejects by default.
// This must be set BEFORE any TLS connection is made.
// Safe for this app: only used for database connections, not user-facing HTTPS.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool, PoolConfig } from 'pg';

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

let _pool: Pool | undefined;

function getPool(): Pool {
  if (_pool) return _pool;

  // Reuse cached pool globally to avoid connection exhaustion on serverless
  if (globalForPg.pgPool) {
    _pool = globalForPg.pgPool;
    return _pool;
  }

  // Use POSTGRES_URL (Supabase pooler) - it handles connection pooling server-side
  // POSTGRES_URL_NON_POOLING is for direct connections which exhaust the pool limit
  // Fallback order: pooler URL → non-pooling → user-set DATABASE_URL
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'No database connection string found! Set POSTGRES_URL or DATABASE_URL in Vercel Environment Variables.'
    );
  }

  const config: PoolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,             // Very small pool for Vercel serverless (each function = 1 instance)
    idleTimeoutMillis: 5000,   // Release idle connections quickly
    connectionTimeoutMillis: 10000,
  };

  _pool = new Pool(config);

  // Cache pool globally so it persists across function invocations
  globalForPg.pgPool = _pool;

  return _pool;
}

// Helper: query with error handling — pool is created lazily on first call
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }
  return result;
}

// Helper: get a single row
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper: generate a CUID-like ID
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `cl${timestamp}${randomPart}`;
}

// For routes that need a dedicated client (transactions)
export async function getClient() {
  const pool = getPool();
  return pool.connect();
}
