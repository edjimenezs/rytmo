import { NextRequest, NextResponse } from 'next/server';
import { syncRecentStravaActivities } from '@/lib/strava/utils';
import { requireAuth } from '@/lib/auth/utils';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const daysParam = request.nextUrl.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const synced = await syncRecentStravaActivities(userId, days);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error('Error syncing Strava activities:', error);
    return NextResponse.json({ error: 'Failed to sync Strava' }, { status: 500 });
  }
}
