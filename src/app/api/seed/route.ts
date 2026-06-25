import { NextResponse } from 'next/server';

// Seed route is now handled by /api/setup
// Keeping this for compatibility - it just redirects to setup
export async function POST() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
