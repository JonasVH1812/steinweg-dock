import { NextResponse } from 'next/server';
import { getClient } from '@/lib/pg-db';

export async function GET() {
  const results: Record<string, unknown> = {};

  results.databaseUrlSet = !!process.env.DATABASE_URL;
  results.databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 40) + '...' || 'NOT SET';
  results.nodeEnv = process.env.NODE_ENV;
  results.nextauthSecretSet = !!process.env.NEXTAUTH_SECRET;

  if (!process.env.DATABASE_URL) {
    results.error = 'DATABASE_URL is not set! Add it in Vercel Settings > Environment Variables.';
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
