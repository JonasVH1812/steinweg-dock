import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/pg-db';
import { requireAuth } from '@/lib/auth-middleware';

// PATCH /api/user/language - Save user's language preference
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    if (!data.language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    await query(
      'UPDATE "User" SET "language" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
      [data.language, user.id]
    );

    return NextResponse.json({ success: true, language: data.language });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
