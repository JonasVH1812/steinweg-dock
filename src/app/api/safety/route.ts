import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const checkType = req.nextUrl.searchParams.get('checkType');
  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (checkType) where.checkType = checkType;
  if (status) where.status = status;
  const checklists = await db.safetyChecklist.findMany({ where, include: { user: true, items: { orderBy: { orderIndex: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json(checklists);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { items, ...checklistData } = data;
  const checklist = await db.safetyChecklist.create({ data: checklistData, include: { items: true } });
  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      await db.safetyCheckItem.create({ data: { checklistId: checklist.id, category: items[i].category, question: items[i].question, orderIndex: i } });
    }
  }
  const result = await db.safetyChecklist.findUnique({ where: { id: checklist.id }, include: { user: true, items: { orderBy: { orderIndex: 'asc' } } } });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, items, ...updateData } = data;
  if (items) {
    for (const item of items) {
      if (item.id) {
        await db.safetyCheckItem.update({ where: { id: item.id }, data: { passed: item.passed, notes: item.notes } });
      }
    }
  }
  const checklist = await db.safetyChecklist.update({ where: { id }, data: updateData, include: { user: true, items: { orderBy: { orderIndex: 'asc' } } } });
  return NextResponse.json(checklist);
}
