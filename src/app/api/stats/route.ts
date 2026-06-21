import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const [activeShifts, pendingCargo, inProgressCargo, completedCargo, expectedTrucks, atDockTrucks, pendingDocs, activeSafetyChecks, unreadNotifications, warehouses] = await Promise.all([
    db.shift.count({ where: { status: 'active' } }),
    db.cargoOperation.count({ where: { status: 'pending' } }),
    db.cargoOperation.count({ where: { status: 'in_progress' } }),
    db.cargoOperation.count({ where: { status: 'completed' } }),
    db.truckVisit.count({ where: { status: 'expected' } }),
    db.truckVisit.count({ where: { status: 'at_dock' } }),
    db.document.count({ where: { status: { in: ['draft', 'pending_review'] } } }),
    db.safetyChecklist.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
    db.notification.count({ where: { read: false } }),
    db.warehouse.findMany({ where: { active: true }, include: { _count: { select: { storageLocations: { where: { occupied: true } } } }, storageLocations: true } }),
  ]);

  const totalWorkers = await db.user.count({ where: { role: 'dock_worker', active: true } });
  const totalChauffeurs = await db.user.count({ where: { role: 'chauffeur', active: true } });

  return NextResponse.json({
    activeShifts,
    pendingCargo,
    inProgressCargo,
    completedCargo,
    expectedTrucks,
    atDockTrucks,
    pendingDocs,
    activeSafetyChecks,
    unreadNotifications,
    totalWorkers,
    totalChauffeurs,
    warehouses: warehouses.map(w => ({ id: w.id, name: w.name, code: w.code, type: w.type, capacity: w.capacity, area: w.area, occupiedSlots: w._count.storageLocations, totalSlots: w.storageLocations.length }))
  });
}
