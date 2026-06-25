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

    try {
      await query(
        'UPDATE "User" SET "language" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
        [data.language, user.id]
      );
    } catch {
      // Language column may not exist yet - add it first then retry
      try {
        await query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT \'en\'');
        await query(
          'UPDATE "User" SET "language" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
          [data.language, user.id]
        );
      } catch (innerError: unknown) {
        const innerMsg = innerError instanceof Error ? innerError.message : String(innerError);
        return NextResponse.json({ error: innerMsg }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, language: data.language });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
