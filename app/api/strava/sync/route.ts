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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error syncing Strava:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
