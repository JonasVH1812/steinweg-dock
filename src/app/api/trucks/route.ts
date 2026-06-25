import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`"status" = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await query(`SELECT * FROM "TruckVisit" ${whereClause} ORDER BY "createdAt" DESC LIMIT 50`, params);
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
      `INSERT INTO "TruckVisit" ("id", "driverName", "driverLicense", "company", "truckPlate", "trailerPlate", "purpose", "status", "dockNumber", "expectedArrival", "arrivedAt", "dockAssignedAt", "completedAt", "cargoDescription", "blReference", "bookingRef", "notes", "lotNumber", "grossWeight", "netWeight", "transportCode", "instructions") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
      [id, data.driverName, data.driverLicense || null, data.company || null, data.truckPlate, data.trailerPlate || null, data.purpose, data.status || 'expected', data.dockNumber || null, data.expectedArrival || null, data.arrivedAt || null, data.dockAssignedAt || null, data.completedAt || null, data.cargoDescription || null, data.blReference || null, data.bookingRef || null, data.notes || null, data.lotNumber || null, data.grossWeight || null, data.netWeight || null, data.transportCode || null, data.instructions || null]
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

    const sql = `UPDATE "TruckVisit" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
