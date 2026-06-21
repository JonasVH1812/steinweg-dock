import { NextResponse } from 'next/server';
import { getClient } from '@/lib/pg-db';

export async function GET() {
  const results: Record<string, unknown> = {};

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;
  results.databaseUrlSet = !!connectionString;
  results.usingUrl = process.env.POSTGRES_URL_NON_POOLING
    ? 'POSTGRES_URL_NON_POOLING'
    : process.env.POSTGRES_URL
      ? 'POSTGRES_URL'
      : process.env.DATABASE_URL
        ? 'DATABASE_URL'
        : 'NONE';
  results.databaseUrlPrefix = connectionString?.substring(0, 50) + '...' || 'NOT SET';
  results.nodeEnv = process.env.NODE_ENV;
  results.nextauthSecretSet = !!process.env.NEXTAUTH_SECRET;
  results.postgresUrlNonPoolingSet = !!process.env.POSTGRES_URL_NON_POOLING;
  results.postgresUrlSet = !!process.env.POSTGRES_URL;

  if (!connectionString) {
    results.error = 'No database URL found! Set POSTGRES_URL or DATABASE_URL in Vercel Settings > Environment Variables.';
    return NextResponse.json(results, { status: 200 });
  }

  let client;
  try {
    client = await getClient();
  } catch (err: unknown) {
    results.connected = false;
    results.error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(results, { status: 200 });
  }

  try {
    results.connected = true;

    const tableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 20`
    );
    results.tables = tableCheck.rows.map((r: { table_name: string }) => r.table_name);
    results.tablesExist = tableCheck.rows.length > 0;

    if (tableCheck.rows.length > 0) {
      const userCount = await client.query('SELECT COUNT(*) as count FROM "User"');
      results.userCount = parseInt(userCount.rows[0].count);
    }
  } catch (err: unknown) {
    results.queryError = err instanceof Error ? err.message : String(err);
  } finally {
    client.release();
  }

  return NextResponse.json(results, { status: 200 });
}
