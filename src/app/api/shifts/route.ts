import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;
  const shifts = await db.shift.findMany({ where, include: { user: true }, orderBy: { checkIn: 'desc' }, take: 50 });
  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const shift = await db.shift.create({ data, include: { user: true } });
  return NextResponse.json(shift);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const shift = await db.shift.update({ where: { id }, data: updateData, include: { user: true } });
  return NextResponse.json(shift);
}
