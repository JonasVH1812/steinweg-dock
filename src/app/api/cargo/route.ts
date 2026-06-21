import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const type = req.nextUrl.searchParams.get('type');
  const where: any = {};
  if (status) where.status = status;
  if (type) where.operationType = type;
  const operations = await db.cargoOperation.findMany({ where, include: { warehouse: true, assignee: true, items: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json(operations);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const operation = await db.cargoOperation.create({ data, include: { warehouse: true, assignee: true } });
  return NextResponse.json(operation);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const operation = await db.cargoOperation.update({ where: { id }, data: updateData, include: { warehouse: true, assignee: true } });
  return NextResponse.json(operation);
}
