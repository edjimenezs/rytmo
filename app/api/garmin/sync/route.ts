import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';

export async function POST() {
  try {
    const user = await requireAuth();
    const synced = await syncRecentGarminActivities(user.id, 30);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error('Error syncing Garmin activities:', error);
    return NextResponse.json(
      { error: 'Failed to sync Garmin activities' },
      { status: 500 }
    );
  }
}
