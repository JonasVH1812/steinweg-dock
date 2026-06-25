import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`s."userId" = $${paramIndex++}`);
      params.push(userId);
    }
    if (status) {
      conditions.push(`s."status" = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT s.*, u."name" as "userName", u."email" as "userEmail", u."role" as "userRole"
      FROM "Shift" s
      LEFT JOIN "User" u ON s."userId" = u."id"
      ${whereClause}
      ORDER BY s."checkIn" DESC
      LIMIT 50
    `;
    const result = await query(sql, params);
    const shifts = result.rows.map(row => ({
      ...row,
      user: row.userName ? { id: row.userId, name: row.userName, email: row.userEmail, role: row.userRole } : null,
      userName: undefined, userEmail: undefined, userRole: undefined,
    }));
    return NextResponse.json(shifts);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = generateId();
    const result = await query(
      `INSERT INTO "Shift" ("id", "userId", "type", "status", "checkIn", "checkOut", "location", "notes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, data.userId, data.type || 'day', data.status || 'active', data.checkIn || new Date().toISOString(), data.checkOut || null, data.location || null, data.notes || null]
    );
    return NextResponse.json(result.rows[0]);
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
    setClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    params.push(id);

    const sql = `UPDATE "Shift" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
