import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role');
    let sql = 'SELECT * FROM "User"';
    const params: string[] = [];
    if (role) {
      params.push(role);
      sql += ` WHERE "role" = $1`;
    }
    sql += ' ORDER BY "name" ASC';
    const result = await query(sql, params);
    return NextResponse.json(result.rows);
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
      `INSERT INTO "User" ("id", "email", "name", "password", "role", "badge", "phone", "active") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, data.email, data.name, data.password || 'demo123', data.role || 'dock_worker', data.badge || null, data.phone || null, data.active !== false]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
