import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';
import { syncGarminDailyHealth } from '@/lib/garmin/health-sync';

export async function POST() {
  try {
    const user = await requireAuth();
    const [synced] = await Promise.all([
      syncRecentGarminActivities(user.id, 30),
      syncGarminDailyHealth(user.id).catch(() => {}),
    ]);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error('Error syncing Garmin:', error);
    return NextResponse.json({ error: 'Failed to sync Garmin' }, { status: 500 });
  }
}
