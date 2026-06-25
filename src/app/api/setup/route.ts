import { NextResponse } from 'next/server';
import { getClient, generateId } from '@/lib/pg-db';
import { auditTableSQL } from '@/lib/audit';

// GET handler so you can trigger setup from the browser URL bar
export async function GET() {
  return doSetup();
}

async function doSetup() {
  let client;
  try {
    client = await getClient();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to connect to database: ' + msg }, { status: 500 });
  }
  
  try {
    await client.query('BEGIN');

    // Check if tables already exist and have data
    const tableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User'`
    );

    if (tableCheck.rows.length > 0) {
      const userCount = await client.query('SELECT COUNT(*) as count FROM "User"');
      if (parseInt(userCount.rows[0].count) > 0) {
        await client.query('COMMIT');
        return NextResponse.json({ status: 'already_setup', users: parseInt(userCount.rows[0].count) });
      }
    }

    // Create all tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'dock_worker',
        "badge" TEXT,
        "phone" TEXT,
        "language" TEXT DEFAULT 'en',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);

    // Add language column if it doesn't exist (for existing databases)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en'`).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Shift" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'day',
        "status" TEXT NOT NULL DEFAULT 'active',
        "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "checkOut" TIMESTAMP(3),
        "location" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Warehouse" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "location" TEXT,
        "type" TEXT NOT NULL DEFAULT 'general',
        "capacity" INTEGER,
        "area" DOUBLE PRECISION,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_code_key" ON "Warehouse"("code");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "CargoOperation" (
        "id" TEXT NOT NULL,
        "operationType" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "vesselName" TEXT,
        "voyageNumber" TEXT,
        "berthNumber" TEXT,
        "warehouseId" TEXT,
        "cargoType" TEXT,
        "reference" TEXT,
        "weight" DOUBLE PRECISION,
        "unitCount" INTEGER,
        "description" TEXT,
        "assignedTo" TEXT,
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CargoOperation_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "CargoItem" (
        "id" TEXT NOT NULL,
        "cargoOpId" TEXT NOT NULL,
        "itemType" TEXT NOT NULL,
        "markOrNumber" TEXT,
        "description" TEXT,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "weight" DOUBLE PRECISION,
        "condition" TEXT NOT NULL DEFAULT 'good',
        "damageNotes" TEXT,
        "storageLocation" TEXT,
        "checked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CargoItem_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "StorageLocation" (
        "id" TEXT NOT NULL,
        "warehouseId" TEXT NOT NULL,
        "zone" TEXT NOT NULL,
        "row" TEXT,
        "bay" TEXT,
        "level" TEXT,
        "occupied" BOOLEAN NOT NULL DEFAULT false,
        "cargoRef" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "TruckVisit" (
        "id" TEXT NOT NULL,
        "driverName" TEXT NOT NULL,
        "driverLicense" TEXT,
        "company" TEXT,
        "truckPlate" TEXT NOT NULL,
        "trailerPlate" TEXT,
        "purpose" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'expected',
        "dockNumber" TEXT,
        "expectedArrival" TIMESTAMP(3),
        "arrivedAt" TIMESTAMP(3),
        "dockAssignedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "cargoDescription" TEXT,
        "blReference" TEXT,
        "bookingRef" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TruckVisit_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL,
        "docType" TEXT NOT NULL,
        "reference" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "cargoOpId" TEXT,
        "truckVisitId" TEXT,
        "content" TEXT,
        "photos" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Signature" (
        "id" TEXT NOT NULL,
        "documentId" TEXT NOT NULL,
        "signedBy" TEXT NOT NULL,
        "signerRole" TEXT,
        "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SafetyChecklist" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "checkType" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "location" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SafetyChecklist_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SafetyCheckItem" (
        "id" TEXT NOT NULL,
        "checklistId" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "question" TEXT NOT NULL,
        "passed" BOOLEAN,
        "notes" TEXT,
        "orderIndex" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "SafetyCheckItem_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "category" TEXT,
        "linkId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create audit log table
    await client.query(auditTableSQL);

    // Add foreign keys (ignore if already exist)
    const fkStatements = [
      `ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "CargoOperation" ADD CONSTRAINT "CargoOperation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "CargoOperation" ADD CONSTRAINT "CargoOperation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "CargoItem" ADD CONSTRAINT "CargoItem_cargoOpId_fkey" FOREIGN KEY ("cargoOpId") REFERENCES "CargoOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Document" ADD CONSTRAINT "Document_cargoOpId_fkey" FOREIGN KEY ("cargoOpId") REFERENCES "CargoOperation"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "Document" ADD CONSTRAINT "Document_truckVisitId_fkey" FOREIGN KEY ("truckVisitId") REFERENCES "TruckVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "Signature" ADD CONSTRAINT "Signature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Signature" ADD CONSTRAINT "Signature_signedBy_fkey" FOREIGN KEY ("signedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "SafetyChecklist" ADD CONSTRAINT "SafetyChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "SafetyCheckItem" ADD CONSTRAINT "SafetyCheckItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "SafetyChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ];
    for (const fk of fkStatements) {
      await client.query(fk).catch(() => {});
    }

    // Check if already seeded
    const userCheck = await client.query('SELECT COUNT(*) as count FROM "User"');
    if (parseInt(userCheck.rows[0].count) > 0) {
      await client.query('COMMIT');
      return NextResponse.json({ status: 'already_setup' });
    }

    // Seed data
    const adminId = generateId();
    const worker1Id = generateId();
    const worker2Id = generateId();
    const chauffeur1Id = generateId();
    const chauffeur2Id = generateId();

    await client.query(`
      INSERT INTO "User" ("id", "email", "name", "password", "role", "badge", "phone") VALUES
      ($1, 'admin@steinweg.be', 'Jan De Smedt', 'demo123', 'admin', 'ADM-001', '+32 470 00 00 01'),
      ($2, 'worker1@steinweg.be', 'Pieter Van Dijk', 'demo123', 'dock_worker', 'DW-042', '+32 470 00 00 02'),
      ($3, 'worker2@steinweg.be', 'Mohamed El Amrani', 'demo123', 'dock_worker', 'DW-078', '+32 470 00 00 03'),
      ($4, 'driver1@steinweg.be', 'Luk Peeters', 'demo123', 'chauffeur', 'CH-015', '+32 470 00 00 04'),
      ($5, 'driver2@steinweg.be', 'Tom Janssen', 'demo123', 'chauffeur', 'CH-023', '+32 470 00 00 05')
    `, [adminId, worker1Id, worker2Id, chauffeur1Id, chauffeur2Id]);

    const wh1Id = generateId();
    const wh2Id = generateId();
    const wh3Id = generateId();
    const wh4Id = generateId();

    await client.query(`
      INSERT INTO "Warehouse" ("id", "name", "code", "location", "type", "capacity", "area") VALUES
      ($1, 'Vrieskaai Main Warehouse', 'VK-A', 'Quai 125-133', 'general', 5000, 15000),
      ($2, 'Vrieskaai Cold Storage', 'VK-C', 'Quai 127', 'cold', 2000, 5000),
      ($3, 'Drybulk Silo Complex', 'SIL-01', 'Quai 129', 'bulk', 8000, 8000),
      ($4, 'Hazardous Goods Store', 'HZ-01', 'Quai 133', 'hazardous', 1000, 3000)
    `, [wh1Id, wh2Id, wh3Id, wh4Id]);

    // Storage locations for warehouse 1
    for (const zone of ['A', 'B', 'C']) {
      for (let row = 1; row <= 5; row++) {
        for (let bay = 1; bay <= 4; bay++) {
          const occupied = Math.random() > 0.6;
          await client.query(
            `INSERT INTO "StorageLocation" ("id", "warehouseId", "zone", "row", "bay", "level", "occupied", "cargoRef") VALUES ($1, $2, $3, $4, $5, 'G', $6, $7)`,
            [generateId(), wh1Id, zone, `R${row}`, `B${bay}`, occupied, occupied ? `REF-${zone}${row}${bay}` : null]
          );
        }
      }
    }

    // Shifts
    await client.query(
      `INSERT INTO "Shift" ("id", "userId", "type", "status", "checkIn", "location") VALUES ($1, $2, 'day', 'active', NOW() - INTERVAL '3 hours', 'Quai 125')`,
      [generateId(), worker1Id]
    );

    // Cargo operations
    const cargo1Id = generateId();
    const cargo2Id = generateId();
    const cargo3Id = generateId();

    await client.query(`
      INSERT INTO "CargoOperation" ("id", "operationType", "status", "vesselName", "voyageNumber", "berthNumber", "warehouseId", "cargoType", "reference", "weight", "unitCount", "description", "assignedTo", "startedAt") VALUES
      ($1, 'unloading', 'in_progress', 'MV ATLANTIC STAR', 'ATL-2026-0142', '125', $2, 'breakbulk', 'BL-ANT-2026-5521', 45000, 180, 'Steel coils and machinery parts from Hamburg', $3, NOW() - INTERVAL '2 hours'),
      ($4, 'loading', 'pending', 'MV PORTO NOVO', 'PN-2026-0087', '129', $5, 'bulk', 'BL-ANT-2026-5535', 120000, 1, 'Drybulk grain shipment to Lisbon', $6, NULL),
      ($7, 'tally', 'completed', 'MV NORDIC WAVE', 'NW-2026-0211', '127', $8, 'container', 'BL-ANT-2026-5508', 28000, 42, 'Reefer containers - frozen goods', NULL, NULL)
    `, [cargo1Id, wh1Id, worker1Id, cargo2Id, wh3Id, worker2Id, cargo3Id, wh2Id]);

    // Update completedAt for cargo3
    await client.query(`UPDATE "CargoOperation" SET "completedAt" = NOW() - INTERVAL '1 hour' WHERE "id" = $1`, [cargo3Id]);

    // Cargo items
    const itemTypes = ['pallet', 'bundle', 'drum', 'pallet', 'bundle'];
    const conditions = ['good', 'good', 'good', 'damaged', 'good'];
    const quantities = [20, 15, 30, 10, 25];
    const weights = [5000, 8000, 3000, 4000, 6000];
    for (let i = 0; i < 5; i++) {
      await client.query(
        `INSERT INTO "CargoItem" ("id", "cargoOpId", "itemType", "markOrNumber", "description", "quantity", "weight", "condition", "damageNotes", "checked") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          generateId(), cargo1Id, itemTypes[i], `SW-BE-${String(i + 1).padStart(4, '0')}`,
          i === 3 ? 'Steel coil - slightly dented' : `Cargo item ${i + 1}`,
          quantities[i], weights[i], conditions[i],
          i === 3 ? 'Minor dent on outer wrap' : null, i < 3
        ]
      );
    }

    // Truck visits
    const truck1Id = generateId();
    const truck2Id = generateId();
    await client.query(`
      INSERT INTO "TruckVisit" ("id", "driverName", "driverLicense", "company", "truckPlate", "trailerPlate", "purpose", "status", "dockNumber", "expectedArrival", "arrivedAt", "dockAssignedAt", "cargoDescription", "blReference", "bookingRef") VALUES
      ($1, 'Luk Peeters', 'B-1234567', 'Transport Peeters NV', '1-ABC-123', '1-XYZ-456', 'pickup', 'at_dock', 'D3', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '24 minutes', 'Steel coils - 12 pallets', 'BL-ANT-2026-5521', 'BK-2026-0891'),
      ($2, 'Tom Janssen', 'B-7654321', 'Janssen Logistics', '1-DEF-789', '1-QWE-012', 'delivery', 'expected', NULL, NOW() + INTERVAL '1 hour', NULL, NULL, 'Machinery parts ex-Hamburg', NULL, 'BK-2026-0895')
    `, [truck1Id, truck2Id]);

    // Documents
    await client.query(
      `INSERT INTO "Document" ("id", "docType", "reference", "status", "cargoOpId", "content", "notes") VALUES ($1, 'bill_of_lading', 'BL-ANT-2026-5521', 'approved', $2, $3, 'Original B/L received from agent')`,
      [generateId(), cargo1Id, JSON.stringify({ shipper: 'Hamburg Steel GmbH', consignee: 'C. Steinweg Belgium NV', portOfLoading: 'Hamburg', portOfDischarge: 'Antwerp', vessel: 'MV ATLANTIC STAR', voyage: 'ATL-2026-0142', goods: 'Steel coils and machinery parts', weight: '45,000 kg', packages: 180 })]
    );
    await client.query(
      `INSERT INTO "Document" ("id", "docType", "reference", "status", "truckVisitId", "content") VALUES ($1, 'delivery_note', 'DN-2026-0891', 'signed', $2, $3)`,
      [generateId(), truck1Id, JSON.stringify({ from: 'C. Steinweg Belgium NV', to: 'Transport Peeters NV', items: 'Steel coils - 12 pallets', weight: '6,000 kg', truckPlate: '1-ABC-123' })]
    );
    await client.query(
      `INSERT INTO "Document" ("id", "docType", "reference", "status", "cargoOpId", "content", "notes") VALUES ($1, 'damage_report', 'DR-2026-0023', 'pending_review', $2, $3, 'Damage noted during tally check')`,
      [generateId(), cargo1Id, JSON.stringify({ itemRef: 'SW-BE-0004', damage: 'Minor dent on outer wrap', reportedBy: 'Pieter Van Dijk', photoNeeded: true })]
    );

    // Safety checklist
    const safetyId = generateId();
    await client.query(
      `INSERT INTO "SafetyChecklist" ("id", "userId", "checkType", "status", "location") VALUES ($1, $2, 'pre_shift', 'in_progress', 'Quai 125')`,
      [safetyId, worker1Id]
    );
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
      await client.query(
        `INSERT INTO "SafetyCheckItem" ("id", "checklistId", "category", "question", "passed", "orderIndex") VALUES ($1, $2, $3, $4, $5, $6)`,
        [generateId(), safetyId, safetyItems[i].category, safetyItems[i].question, safetyItems[i].passed, i]
      );
    }

    // Notifications
    await client.query(`
      INSERT INTO "Notification" ("id", "type", "title", "message", "category") VALUES
      ($1, 'urgent', 'Safety Inspection Due', 'Pre-shift safety checklist must be completed before cargo operations at Quai 125', 'safety'),
      ($2, 'info', 'Vessel Arriving', 'MV ATLANTIC STAR arrived at Berth 125. Unloading operations in progress.', 'cargo'),
      ($3, 'task', 'Truck Expected', 'Tom Janssen (Janssen Logistics) expected at 14:30 for delivery at Dock D5.', 'truck'),
      ($4, 'warning', 'Damage Reported', 'Item SW-BE-0004 has damage noted. Supervisor review required.', 'cargo'),
      ($5, 'info', 'Document Ready for Signature', 'Delivery Note DN-2026-0891 is ready for driver signature.', 'document')
    `, [generateId(), generateId(), generateId(), generateId(), generateId()]);

    await client.query('COMMIT');
    return NextResponse.json({ status: 'seeded', message: 'Database setup complete with demo data' });
  } catch (error: unknown) {
    try { await client?.query('ROLLBACK'); } catch {}
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Setup error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST handler calls doSetup
export async function POST() {
  return doSetup();
}
