import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cargoOpId = req.nextUrl.searchParams.get('cargoOpId');
  const where: any = {};
  if (cargoOpId) where.cargoOpId = cargoOpId;
  const items = await db.cargoItem.findMany({ where, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const item = await db.cargoItem.create({ data });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const item = await db.cargoItem.update({ where: { id }, data: updateData });
  return NextResponse.json(item);
}
