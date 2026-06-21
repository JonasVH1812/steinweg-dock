import { query, generateId } from '@/lib/pg-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const checkType = req.nextUrl.searchParams.get('checkType');
    const status = req.nextUrl.searchParams.get('status');
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (checkType) {
      conditions.push(`sc."checkType" = $${paramIndex++}`);
      params.push(checkType);
    }
    if (status) {
      conditions.push(`sc."status" = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT sc.*,
        u."name" as "userName", u."email" as "userEmail", u."role" as "userRole",
        (SELECT json_agg(sci.* ORDER BY sci."orderIndex" ASC) FROM "SafetyCheckItem" sci WHERE sci."checklistId" = sc."id") as items
      FROM "SafetyChecklist" sc
      LEFT JOIN "User" u ON sc."userId" = u."id"
      ${whereClause}
      ORDER BY sc."createdAt" DESC
      LIMIT 20
    `;
    const result = await query(sql, params);
    const checklists = result.rows.map(row => ({
      ...row,
      user: row.userName ? { id: row.userId, name: row.userName, email: row.userEmail, role: row.userRole } : null,
      items: row.items || [],
      userName: undefined, userEmail: undefined, userRole: undefined,
    }));
    return NextResponse.json(checklists);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { items, ...checklistData } = data;
    const id = generateId();

    const result = await query(
      `INSERT INTO "SafetyChecklist" ("id", "userId", "checkType", "status", "location", "notes") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, checklistData.userId, checklistData.checkType, checklistData.status || 'pending', checklistData.location || null, checklistData.notes || null]
    );

    const createdItems: Record<string, unknown>[] = [];
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const itemId = generateId();
        const itemResult = await query(
          `INSERT INTO "SafetyCheckItem" ("id", "checklistId", "category", "question", "passed", "notes", "orderIndex") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [itemId, id, items[i].category, items[i].question, items[i].passed ?? null, items[i].notes || null, i]
        );
        createdItems.push(itemResult.rows[0]);
      }
    }

    return NextResponse.json({ ...result.rows[0], items: createdItems, user: null });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, items, ...updateData } = data;

    // Update checklist items if provided
    if (items) {
      for (const item of items) {
        if (item.id) {
          await query(
            `UPDATE "SafetyCheckItem" SET "passed" = $1, "notes" = $2 WHERE "id" = $3`,
            [item.passed ?? null, item.notes || null, item.id]
          );
        }
      }
    }

    // Update the checklist itself
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`"${key}" = $${paramIndex++}`);
      params.push(value);
    }
    setClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    params.push(id);

    const sql = `UPDATE "SafetyChecklist" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
