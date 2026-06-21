import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const type = req.nextUrl.searchParams.get('type');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`co."status" = $${paramIndex++}`);
      params.push(status);
    }
    if (type) {
      conditions.push(`co."operationType" = $${paramIndex++}`);
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT co.*,
        w."name" as "warehouseName", w."code" as "warehouseCode",
        u."name" as "assigneeName", u."role" as "assigneeRole",
        (SELECT json_agg(ci.*) FROM "CargoItem" ci WHERE ci."cargoOpId" = co."id") as items
      FROM "CargoOperation" co
      LEFT JOIN "Warehouse" w ON co."warehouseId" = w."id"
      LEFT JOIN "User" u ON co."assignedTo" = u."id"
      ${whereClause}
      ORDER BY co."createdAt" DESC
      LIMIT 50
    `;
    const result = await query(sql, params);
    const operations = result.rows.map(row => ({
      ...row,
      warehouse: row.warehouseName ? { id: row.warehouseId, name: row.warehouseName, code: row.warehouseCode } : null,
      assignee: row.assigneeName ? { id: row.assignedTo, name: row.assigneeName, role: row.assigneeRole } : null,
      items: row.items || [],
      warehouseName: undefined, warehouseCode: undefined, assigneeName: undefined, assigneeRole: undefined,
    }));
    return NextResponse.json(operations);
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
      `INSERT INTO "CargoOperation" ("id", "operationType", "status", "vesselName", "voyageNumber", "berthNumber", "warehouseId", "cargoType", "reference", "weight", "unitCount", "description", "assignedTo", "startedAt", "completedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [id, data.operationType, data.status || 'pending', data.vesselName || null, data.voyageNumber || null, data.berthNumber || null, data.warehouseId || null, data.cargoType || null, data.reference || null, data.weight || null, data.unitCount || null, data.description || null, data.assignedTo || null, data.startedAt || null, data.completedAt || null]
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

    const sql = `UPDATE "CargoOperation" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
