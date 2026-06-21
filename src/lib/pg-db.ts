import { Pool, PoolConfig } from 'pg';

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

let _pool: Pool | undefined;

function getPool(): Pool {
  if (_pool) return _pool;

  // Reuse cached pool in development to avoid connection exhaustion
  if (process.env.NODE_ENV !== 'production' && globalForPg.pgPool) {
    _pool = globalForPg.pgPool;
    return _pool;
  }

  // Prefer POSTGRES_URL_NON_POOLING (direct connection, proper SSL cert)
  // Then POSTGRES_URL (pooler, self-signed cert)
  // Then DATABASE_URL (user-set)
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'No database connection string found! Set POSTGRES_URL or DATABASE_URL in Vercel Environment Variables.'
    );
  }

  const config: PoolConfig = {
    connectionString,
    // Supabase pooler uses self-signed certs — bypass certificate verification
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  _pool = new Pool(config);

  if (process.env.NODE_ENV !== 'production') {
    globalForPg.pgPool = _pool;
  }

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
