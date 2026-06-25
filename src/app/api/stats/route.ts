import { query } from '@/lib/pg-db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [activeShiftsRes, pendingCargoRes, inProgressCargoRes, completedCargoRes, expectedTrucksRes, atDockTrucksRes, pendingDocsRes, activeSafetyRes, unreadNotifsRes, workersRes, chauffeursRes, warehousesRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM "Shift" WHERE "status" = $1', ['active']),
      query('SELECT COUNT(*) as count FROM "CargoOperation" WHERE "status" = $1', ['pending']),
      query('SELECT COUNT(*) as count FROM "CargoOperation" WHERE "status" = $1', ['in_progress']),
      query('SELECT COUNT(*) as count FROM "CargoOperation" WHERE "status" = $1', ['completed']),
      query('SELECT COUNT(*) as count FROM "TruckVisit" WHERE "status" = $1', ['expected']),
      query('SELECT COUNT(*) as count FROM "TruckVisit" WHERE "status" = $1', ['at_dock']),
      query('SELECT COUNT(*) as count FROM "Document" WHERE "status" IN ($1, $2)', ['draft', 'pending_review']),
      query('SELECT COUNT(*) as count FROM "SafetyChecklist" WHERE "status" IN ($1, $2)', ['pending', 'in_progress']),
      query('SELECT COUNT(*) as count FROM "Notification" WHERE "read" = false'),
      query('SELECT COUNT(*) as count FROM "User" WHERE "role" = $1 AND "active" = true', ['dock_worker']),
      query('SELECT COUNT(*) as count FROM "User" WHERE "role" = $1 AND "active" = true', ['chauffeur']),
      query(`
        SELECT w.*,
          (SELECT COUNT(*) FROM "StorageLocation" sl WHERE sl."warehouseId" = w."id" AND sl."occupied" = true) as "occupiedSlots",
          (SELECT COUNT(*) FROM "StorageLocation" sl WHERE sl."warehouseId" = w."id") as "totalSlots"
        FROM "Warehouse" w WHERE w."active" = true ORDER BY w."code" ASC
      `),
    ]);

    return NextResponse.json({
      activeShifts: parseInt(activeShiftsRes.rows[0].count),
      pendingCargo: parseInt(pendingCargoRes.rows[0].count),
      inProgressCargo: parseInt(inProgressCargoRes.rows[0].count),
      completedCargo: parseInt(completedCargoRes.rows[0].count),
      expectedTrucks: parseInt(expectedTrucksRes.rows[0].count),
      atDockTrucks: parseInt(atDockTrucksRes.rows[0].count),
      pendingDocs: parseInt(pendingDocsRes.rows[0].count),
      activeSafetyChecks: parseInt(activeSafetyRes.rows[0].count),
      unreadNotifications: parseInt(unreadNotifsRes.rows[0].count),
      totalWorkers: parseInt(workersRes.rows[0].count),
      totalChauffeurs: parseInt(chauffeursRes.rows[0].count),
      warehouses: warehousesRes.rows.map(w => ({
        id: w.id, name: w.name, code: w.code, type: w.type,
        capacity: w.capacity, area: w.area,
        occupiedSlots: parseInt(w.occupiedSlots),
        totalSlots: parseInt(w.totalSlots),
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
