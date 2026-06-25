import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const docType = req.nextUrl.searchParams.get('docType');
    const status = req.nextUrl.searchParams.get('status');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (docType) {
      conditions.push(`d."docType" = $${paramIndex++}`);
      params.push(docType);
    }
    if (status) {
      conditions.push(`d."status" = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT d.*,
        (SELECT json_agg(json_build_object('id', s."id", 'signedBy', s."signedBy", 'signerRole', s."signerRole", 'signedAt', s."signedAt",
          'signerName', u."name", 'signerEmail', u."email"))
        FROM "Signature" s LEFT JOIN "User" u ON s."signedBy" = u."id"
        WHERE s."documentId" = d."id") as signatures
      FROM "Document" d
      ${whereClause}
      ORDER BY d."createdAt" DESC
      LIMIT 50
    `;
    const result = await query(sql, params);
    const documents = result.rows.map(row => ({
      ...row,
      signatures: (row.signatures || []).map((s: Record<string, unknown>) => ({
        ...s,
        signer: s.signerName ? { id: s.signedBy, name: s.signerName, email: s.signerEmail } : null,
        signerName: undefined, signerEmail: undefined,
      })),
    }));
    return NextResponse.json(documents);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = generateId();
    // Try with new columns first, fall back to basic columns if they don't exist yet
    try {
      const result = await query(
        `INSERT INTO "Document" ("id", "docType", "reference", "status", "cargoOpId", "truckVisitId", "content", "photos", "notes", "lotNumber", "grossWeight", "netWeight", "preparedBy", "checkedBy", "orderNumber", "customerName", "transportCode", "instructions", "barcode") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
        [id, data.docType, data.reference, data.status || 'draft', data.cargoOpId || null, data.truckVisitId || null, data.content || null, data.photos || null, data.notes || null, data.lotNumber || null, data.grossWeight || null, data.netWeight || null, data.preparedBy || null, data.checkedBy || null, data.orderNumber || null, data.customerName || null, data.transportCode || null, data.instructions || null, data.barcode || null]
      );
      return NextResponse.json({ ...result.rows[0], signatures: [] });
    } catch {
      // New columns don't exist yet - use basic insert
      const result = await query(
        `INSERT INTO "Document" ("id", "docType", "reference", "status", "cargoOpId", "truckVisitId", "content", "photos", "notes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [id, data.docType, data.reference, data.status || 'draft', data.cargoOpId || null, data.truckVisitId || null, data.content || null, data.photos || null, data.notes || null]
      );
      return NextResponse.json({ ...result.rows[0], signatures: [] });
    }
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

    const sql = `UPDATE "Document" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
