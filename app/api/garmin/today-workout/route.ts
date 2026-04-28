import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { getTodayScheduledWorkouts } from '@/lib/garmin/calendar';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const date = req.nextUrl.searchParams.get('date') ?? undefined;
    const workouts = await getTodayScheduledWorkouts(user.id, date);
    return NextResponse.json({ workouts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ workouts: [], error: msg }, { status: 200 });
  }
}
