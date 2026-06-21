import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cargoOpId = req.nextUrl.searchParams.get('cargoOpId');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (cargoOpId) {
      conditions.push(`"cargoOpId" = $${paramIndex++}`);
      params.push(cargoOpId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await query(`SELECT * FROM "CargoItem" ${whereClause} ORDER BY "createdAt" ASC`, params);
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
      `INSERT INTO "CargoItem" ("id", "cargoOpId", "itemType", "markOrNumber", "description", "quantity", "weight", "condition", "damageNotes", "storageLocation", "checked") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, data.cargoOpId, data.itemType, data.markOrNumber || null, data.description || null, data.quantity || 1, data.weight || null, data.condition || 'good', data.damageNotes || null, data.storageLocation || null, data.checked || false]
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

    const sql = `UPDATE "CargoItem" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
