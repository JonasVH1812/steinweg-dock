import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create demo users
    const admin = await db.user.create({ data: { email: 'admin@steinweg.be', name: 'Jan De Smedt', password: 'demo123', role: 'admin', badge: 'ADM-001', phone: '+32 470 00 00 01' }});
    const worker1 = await db.user.create({ data: { email: 'worker1@steinweg.be', name: 'Pieter Van Dijk', password: 'demo123', role: 'dock_worker', badge: 'DW-042', phone: '+32 470 00 00 02' }});
    const worker2 = await db.user.create({ data: { email: 'worker2@steinweg.be', name: 'Mohamed El Amrani', password: 'demo123', role: 'dock_worker', badge: 'DW-078', phone: '+32 470 00 00 03' }});
    const chauffeur1 = await db.user.create({ data: { email: 'driver1@steinweg.be', name: 'Luk Peeters', password: 'demo123', role: 'chauffeur', badge: 'CH-015', phone: '+32 470 00 00 04' }});
    const chauffeur2 = await db.user.create({ data: { email: 'driver2@steinweg.be', name: 'Tom Janssen', password: 'demo123', role: 'chauffeur', badge: 'CH-023', phone: '+32 470 00 00 05' }});

    // Create warehouses
    const wh1 = await db.warehouse.create({ data: { name: 'Vrieskaai Main Warehouse', code: 'VK-A', location: 'Quai 125-133', type: 'general', capacity: 5000, area: 15000 }});
    const wh2 = await db.warehouse.create({ data: { name: 'Vrieskaai Cold Storage', code: 'VK-C', location: 'Quai 127', type: 'cold', capacity: 2000, area: 5000 }});
    const wh3 = await db.warehouse.create({ data: { name: 'Drybulk Silo Complex', code: 'SIL-01', location: 'Quai 129', type: 'bulk', capacity: 8000, area: 8000 }});
    const wh4 = await db.warehouse.create({ data: { name: 'Hazardous Goods Store', code: 'HZ-01', location: 'Quai 133', type: 'hazardous', capacity: 1000, area: 3000 }});

    // Create storage locations for warehouse 1
    for (const zone of ['A', 'B', 'C']) {
      for (let row = 1; row <= 5; row++) {
        for (let bay = 1; bay <= 4; bay++) {
          await db.storageLocation.create({ data: { warehouseId: wh1.id, zone, row: `R${row}`, bay: `B${bay}`, level: 'G', occupied: Math.random() > 0.6, cargoRef: Math.random() > 0.6 ? `REF-${zone}${row}${bay}` : null }});
        }
      }
    }

    // Create an active shift for worker1
    await db.shift.create({ data: { userId: worker1.id, type: 'day', status: 'active', checkIn: new Date(Date.now() - 3 * 3600000), location: 'Quai 125' }});

    // Create cargo operations
    const cargo1 = await db.cargoOperation.create({ data: { operationType: 'unloading', status: 'in_progress', vesselName: 'MV ATLANTIC STAR', voyageNumber: 'ATL-2026-0142', berthNumber: '125', warehouseId: wh1.id, cargoType: 'breakbulk', reference: 'BL-ANT-2026-5521', weight: 45000, unitCount: 180, description: 'Steel coils and machinery parts from Hamburg', assignedTo: worker1.id, startedAt: new Date(Date.now() - 2 * 3600000) }});

    // Create cargo items for the operation
    const itemTypes = ['pallet', 'bundle', 'drum', 'pallet', 'bundle'];
    const conditions = ['good', 'good', 'good', 'damaged', 'good'];
    for (let i = 0; i < 5; i++) {
      await db.cargoItem.create({ data: { cargoOpId: cargo1.id, itemType: itemTypes[i], markOrNumber: `SW-BE-${String(i + 1).padStart(4, '0')}`, description: i === 3 ? 'Steel coil - slightly dented' : `Cargo item ${i + 1}`, quantity: [20, 15, 30, 10, 25][i], weight: [5000, 8000, 3000, 4000, 6000][i], condition: conditions[i], damageNotes: i === 3 ? 'Minor dent on outer wrap' : null, checked: i < 3 }});
    }

    const cargo2 = await db.cargoOperation.create({ data: { operationType: 'loading', status: 'pending', vesselName: 'MV PORTO NOVO', voyageNumber: 'PN-2026-0087', berthNumber: '129', warehouseId: wh3.id, cargoType: 'bulk', reference: 'BL-ANT-2026-5535', weight: 120000, unitCount: 1, description: 'Drybulk grain shipment to Lisbon', assignedTo: worker2.id }});

    const cargo3 = await db.cargoOperation.create({ data: { operationType: 'tally', status: 'completed', vesselName: 'MV NORDIC WAVE', voyageNumber: 'NW-2026-0211', berthNumber: '127', warehouseId: wh2.id, cargoType: 'container', reference: 'BL-ANT-2026-5508', weight: 28000, unitCount: 42, description: 'Reefer containers - frozen goods', completedAt: new Date(Date.now() - 1 * 3600000) }});

    // Create truck visits
    const truck1 = await db.truckVisit.create({ data: { driverName: 'Luk Peeters', driverLicense: 'B-1234567', company: 'Transport Peeters NV', truckPlate: '1-ABC-123', trailerPlate: '1-XYZ-456', purpose: 'pickup', status: 'at_dock', dockNumber: 'D3', expectedArrival: new Date(Date.now() - 1 * 3600000), arrivedAt: new Date(Date.now() - 0.5 * 3600000), dockAssignedAt: new Date(Date.now() - 0.4 * 3600000), cargoDescription: 'Steel coils - 12 pallets', blReference: 'BL-ANT-2026-5521', bookingRef: 'BK-2026-0891' }});

    const truck2 = await db.truckVisit.create({ data: { driverName: 'Tom Janssen', driverLicense: 'B-7654321', company: 'Janssen Logistics', truckPlate: '1-DEF-789', trailerPlate: '1-QWE-012', purpose: 'delivery', status: 'expected', expectedArrival: new Date(Date.now() + 1 * 3600000), cargoDescription: 'Machinery parts ex-Hamburg', bookingRef: 'BK-2026-0895' }});

    // Create documents
    await db.document.create({ data: { docType: 'bill_of_lading', reference: 'BL-ANT-2026-5521', status: 'approved', cargoOpId: cargo1.id, content: JSON.stringify({ shipper: 'Hamburg Steel GmbH', consignee: 'C. Steinweg Belgium NV', portOfLoading: 'Hamburg', portOfDischarge: 'Antwerp', vessel: 'MV ATLANTIC STAR', voyage: 'ATL-2026-0142', goods: 'Steel coils and machinery parts', weight: '45,000 kg', packages: 180 }), notes: 'Original B/L received from agent' }});

    await db.document.create({ data: { docType: 'delivery_note', reference: 'DN-2026-0891', status: 'signed', truckVisitId: truck1.id, content: JSON.stringify({ from: 'C. Steinweg Belgium NV', to: 'Transport Peeters NV', items: 'Steel coils - 12 pallets', weight: '6,000 kg', truckPlate: '1-ABC-123' }) }});

    await db.document.create({ data: { docType: 'damage_report', reference: 'DR-2026-0023', status: 'pending_review', cargoOpId: cargo1.id, content: JSON.stringify({ itemRef: 'SW-BE-0004', damage: 'Minor dent on outer wrap', reportedBy: 'Pieter Van Dijk', photoNeeded: true }), notes: 'Damage noted during tally check' }});

    // Create safety checklist with items
    const safety = await db.safetyChecklist.create({ data: { userId: worker1.id, checkType: 'pre_shift', status: 'in_progress', location: 'Quai 125' }});
    const safetyItems = [
      { category: 'Personal Protective Equipment', question: 'Hard hat worn and in good condition?', passed: true },
      { category: 'Personal Protective Equipment', question: 'Safety boots worn?', passed: true },
      { category: 'Personal Protective Equipment', question: 'High-visibility vest worn?', passed: true },
      { category: 'Personal Protective Equipment', question: 'Safety glasses available?', passed: null },
      { category: 'Equipment', question: 'Crane pre-use inspection completed?', passed: true },
      { category: 'Equipment', question: 'Slings and chains inspected?', passed: true },
      { category: 'Equipment', question: 'Forklift daily check done?', passed: null },
      { category: 'Work Area', question: 'Dock area clear of obstructions?', passed: true },
      { category: 'Work Area', question: 'Warning signs and barriers in place?', passed: true },
      { category: 'Work Area', question: 'Adequate lighting for operations?', passed: true },
      { category: 'Emergency', question: 'Fire extinguishers accessible?', passed: true },
      { category: 'Emergency', question: 'Emergency exits clear?', passed: true },
      { category: 'Emergency', question: 'First aid kit available and stocked?', passed: null },
    ];
    for (let i = 0; i < safetyItems.length; i++) {
      await db.safetyCheckItem.create({ data: { checklistId: safety.id, category: safetyItems[i].category, question: safetyItems[i].question, passed: safetyItems[i].passed, orderIndex: i }});
    }

    // Create notifications
    await db.notification.createMany({ data: [
      { type: 'urgent', title: 'Safety Inspection Due', message: 'Pre-shift safety checklist must be completed before cargo operations at Quai 125', category: 'safety' },
      { type: 'info', title: 'Vessel Arriving', message: 'MV ATLANTIC STAR arrived at Berth 125. Unloading operations in progress.', category: 'cargo' },
      { type: 'task', title: 'Truck Expected', message: 'Tom Janssen (Janssen Logistics) expected at 14:30 for delivery at Dock D5.', category: 'truck' },
      { type: 'warning', title: 'Damage Reported', message: 'Item SW-BE-0004 has damage noted. Supervisor review required.', category: 'cargo' },
      { type: 'info', title: 'Document Ready for Signature', message: 'Delivery Note DN-2026-0891 is ready for driver signature.', category: 'document' },
    ]});

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
