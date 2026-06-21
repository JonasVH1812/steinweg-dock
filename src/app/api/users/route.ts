import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  const where = role ? { role } : {};
  const users = await db.user.findMany({ where, orderBy: { name: 'asc' } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const user = await db.user.create({ data });
  return NextResponse.json(user);
}
