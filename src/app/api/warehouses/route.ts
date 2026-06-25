import { query } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const sql = `
      SELECT w.*,
        (SELECT json_agg(sl.*) FROM "StorageLocation" sl WHERE sl."warehouseId" = w."id") as "storageLocations",
        (SELECT COUNT(*) FROM "StorageLocation" sl WHERE sl."warehouseId" = w."id" AND sl."occupied" = true) as "occupiedCount"
      FROM "Warehouse" w
      WHERE w."active" = true
      ORDER BY w."code" ASC
    `;
    const result = await query(sql);
    const warehouses = result.rows.map(row => ({
      ...row,
      storageLocations: row.storageLocations || [],
      _count: { storageLocations: { where: { occupied: true } } },
    }));
    return NextResponse.json(warehouses);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
