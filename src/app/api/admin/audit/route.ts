import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/pg-db';
import { requireAdmin } from '@/lib/auth-middleware';

// GET /api/admin/audit - Get audit log entries (admin only)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100'), 500);
    const tableName = req.nextUrl.searchParams.get('table');
    const userId = req.nextUrl.searchParams.get('userId');

    let sql = 'SELECT a.*, u."name" as "performerName", u."role" as "performerRole" FROM "AuditLog" a LEFT JOIN "User" u ON a."performedBy" = u."id"';
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (tableName) {
      conditions.push(`a."tableName" = $${paramIndex++}`);
      params.push(tableName);
    }
    if (userId) {
      conditions.push(`a."performedBy" = $${paramIndex++}`);
      params.push(userId);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY a."createdAt" DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: msg.includes('Admin') ? 403 : 500 });
  }
}
