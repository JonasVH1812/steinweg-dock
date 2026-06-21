import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const notifications = await db.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const notification = await db.notification.update({ where: { id }, data: updateData });
  return NextResponse.json(notification);
}
