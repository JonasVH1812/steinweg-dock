// Database configuration for Steinweg Dock Management
// Local dev: SQLite (file-based, no setup needed)
// Production (Vercel): PostgreSQL (Vercel Postgres, Supabase, Neon, etc.)

export function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const isPostgres =
    databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://');
  const isSQLite = databaseUrl.startsWith('file:');

  return {
    isPostgres,
    isSQLite,
    url: databaseUrl,
  };
}

// Instructions for setting up production database:
//
// Option 1: Vercel Postgres (recommended, free tier: 256MB)
// - Go to vercel.com dashboard → Storage → Create Database → Postgres
// - Copy the connection string to DATABASE_URL env var
// - Run: npx prisma migrate deploy
//
// Option 2: Supabase (free tier: 500MB)
// - Create project at supabase.com
// - Get connection string from Settings → Database
// - Set DATABASE_URL env var
// - Run: npx prisma migrate deploy
//
// Option 3: Neon (free tier: 512MB)
// - Create project at neon.tech
// - Get connection string from dashboard
// - Set DATABASE_URL env var
// - Run: npx prisma migrate deploy
//
// Option 4: Turso (free tier: 9GB, SQLite-compatible)
// - Create database at turso.tech
// - Requires libsql client instead of Prisma
// - See: https://docs.turso.tech/sdk/ts/quickstart
