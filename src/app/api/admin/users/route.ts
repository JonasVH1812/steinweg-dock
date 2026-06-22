import { NextRequest, NextResponse } from 'next/server';
import { query, generateId } from '@/lib/pg-db';
import { requireAdmin } from '@/lib/auth-middleware';
import { logAudit } from '@/lib/audit';

// GET /api/admin/users - List all users (admin only)
export async function GET() {
  try {
    await requireAdmin();
    const result = await query('SELECT "id", "email", "name", "role", "badge", "phone", "active", "createdAt", "updatedAt" FROM "User" ORDER BY "name" ASC');
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: msg.includes('Admin') ? 403 : 500 });
  }
}

// POST /api/admin/users - Create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await req.json();

    if (!data.email || !data.name || !data.role) {
      return NextResponse.json({ error: 'Email, name, and role are required' }, { status: 400 });
    }
    if (!['dock_worker', 'chauffeur', 'admin'].includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await query('SELECT "id" FROM "User" WHERE "email" = $1', [data.email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const id = generateId();
    const password = data.password || 'changeme';
    const result = await query(
      `INSERT INTO "User" ("id", "email", "name", "password", "role", "badge", "phone", "active") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "id", "email", "name", "role", "badge", "phone", "active"`,
      [id, data.email, data.name, password, data.role, data.badge || null, data.phone || null, data.active !== false]
    );

    await logAudit({
      action: 'CREATE_USER', tableName: 'User', recordId: id, performedBy: admin.id,
      newValue: JSON.stringify(result.rows[0]), ip: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ ...result.rows[0], tempPassword: password }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: msg.includes('Admin') ? 403 : 500 });
  }
}

// PATCH /api/admin/users - Update a user (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const oldResult = await query('SELECT * FROM "User" WHERE "id" = $1', [id]);
    if (oldResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Prevent last admin deactivation
    if (updateData.active === false && oldResult.rows[0].role === 'admin') {
      const adminCount = await query('SELECT COUNT(*) as count FROM "User" WHERE "role" = $1 AND "active" = true', ['admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return NextResponse.json({ error: 'Cannot deactivate the last admin' }, { status: 400 });
      }
    }

    const allowedFields = ['name', 'role', 'badge', 'phone', 'active'];
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const key of allowedFields) {
      if (key in updateData) {
        setClauses.push(`"${key}" = $${paramIndex++}`);
        params.push(updateData[key]);
      }
    }
    if (updateData.password) {
      setClauses.push(`"password" = $${paramIndex++}`);
      params.push(updateData.password);
    }

    if (setClauses.length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    setClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    params.push(id);

    const sql = `UPDATE "User" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING "id", "email", "name", "role", "badge", "phone", "active"`;
    const result = await query(sql, params);

    await logAudit({
      action: 'UPDATE_USER', tableName: 'User', recordId: id, performedBy: admin.id,
      oldValue: JSON.stringify(oldResult.rows[0]), newValue: JSON.stringify(result.rows[0]),
      ip: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: msg.includes('Admin') ? 403 : 500 });
  }
}
