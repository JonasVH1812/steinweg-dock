import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const results: Record<string, any> = {};

  // Check if DATABASE_URL is set
  results.databaseUrlSet = !!process.env.DATABASE_URL;
  results.databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + '...' || 'NOT SET';
  results.directUrlSet = !!process.env.DIRECT_URL;

  // Try connecting
  const db = new PrismaClient({ log: ['error'] });
  try {
    await db.$connect();
    results.connected = true;

    // Try a simple query
    try {
      const count = await db.user.count();
      results.userCount = count;
      results.tablesExist = true;
    } catch (queryError: any) {
      results.tablesExist = false;
      results.queryError = queryError.message;
    }
  } catch (connectError: any) {
    results.connected = false;
    results.connectError = connectError.message;
  } finally {
    await db.$disconnect();
  }

  return NextResponse.json(results, { status: 200 });
}
