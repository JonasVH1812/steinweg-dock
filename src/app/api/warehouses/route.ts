import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const warehouses = await db.warehouse.findMany({ where: { active: true }, include: { storageLocations: true }, orderBy: { code: 'asc' } });
  return NextResponse.json(warehouses);
}
