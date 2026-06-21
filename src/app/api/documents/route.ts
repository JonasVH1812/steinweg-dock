import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const docType = req.nextUrl.searchParams.get('docType');
  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (docType) where.docType = docType;
  if (status) where.status = status;
  const documents = await db.document.findMany({ where, include: { signatures: { include: { signer: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const document = await db.document.create({ data, include: { signatures: true } });
  return NextResponse.json(document);
}

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const { id, ...updateData } = data;
  const document = await db.document.update({ where: { id }, data: updateData, include: { signatures: { include: { signer: true } } } });
  return NextResponse.json(document);
}
