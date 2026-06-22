import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/pg-db';
import { requireAuth } from '@/lib/auth-middleware';
import { logAudit } from '@/lib/audit';

// POST /api/auth/password - Change own password
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }
    if (data.newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Verify current password
    const userResult = await query('SELECT "password" FROM "User" WHERE "id" = $1', [user.id]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (userResult.rows[0].password !== data.currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Update password
    await query('UPDATE "User" SET "password" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2', [data.newPassword, user.id]);

    await logAudit({
      action: 'CHANGE_PASSWORD',
      tableName: 'User',
      recordId: user.id,
      performedBy: user.id,
      ip: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: msg.includes('Authentication') ? 401 : 500 });
  }
}
