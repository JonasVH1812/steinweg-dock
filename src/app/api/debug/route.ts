import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const results: Record<string, any> = {};
  
  // Check env vars
  results.databaseUrlSet = !!process.env.DATABASE_URL;
  results.databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 40) + '...' || 'NOT SET';
  results.nodeEnv = process.env.NODE_ENV;

  if (!process.env.DATABASE_URL) {
    results.error = 'DATABASE_URL is not set!';
    return NextResponse.json(results, { status: 200 });
  }

  // Try connecting with pg directly
  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    results.connected = true;
    
    // Check if tables exist
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' LIMIT 10
    `);
    results.tables = tableCheck.rows.map((r: any) => r.table_name);
    results.tablesExist = tableCheck.rows.length > 0;
    
    client.release();
  } catch (err: any) {
    results.connected = false;
    results.error = err.message;
  } finally {
    if (pool) await pool.end();
  }

  return NextResponse.json(results, { status: 200 });
}
