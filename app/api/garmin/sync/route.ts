import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';
import { syncGarminDailyHealth } from '@/lib/garmin/health-sync';

export async function POST() {
  try {
    const user = await requireAuth();
    let healthError: string | null = null;

    const [synced] = await Promise.all([
      syncRecentGarminActivities(user.id, 30),
      syncGarminDailyHealth(user.id).catch((e: unknown) => {
        healthError = e instanceof Error ? e.message : String(e);
      }),
    ]);

    return NextResponse.json({ synced, healthError });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error syncing Garmin:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
