import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { createGarminClient } from '@/lib/garmin/client';

export async function GET() {
  try {
    const user = await requireAuth();

    if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Garmin credentials not configured. Set GARMIN_EMAIL and GARMIN_PASSWORD.' },
        { status: 500 },
      );
    }

    // Trigger authentication — saves tokens to DB on first call
    const client = await createGarminClient(user.id);
    await client.getDailySummary();

    return NextResponse.json({ connected: true, message: 'Garmin connected successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'MFA_REQUIRED') {
      return NextResponse.json(
        { error: 'Your Garmin account has MFA enabled. Disable it temporarily to connect.' },
        { status: 400 },
      );
    }
    console.error('Garmin auth error:', error);
    return NextResponse.json({ error: 'Failed to connect Garmin: ' + message }, { status: 500 });
  }
}
