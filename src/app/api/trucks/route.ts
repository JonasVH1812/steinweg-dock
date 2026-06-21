import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (status) where.status = status;
  const visits = await db.truckVisit.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json(visits);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const visit = await db.truckVisit.create({ data });
  return NextResponse.json(visit);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const visit = await db.truckVisit.update({ where: { id }, data: updateData });
  return NextResponse.json(visit);
}
