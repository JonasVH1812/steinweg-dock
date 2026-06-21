import { query } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const result = await query('SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 30');
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`"${key}" = $${paramIndex++}`);
      params.push(value);
    }
    params.push(id);

    const sql = `UPDATE "Notification" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
