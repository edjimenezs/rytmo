import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { syncRecentTrainingPeaksActivities } from '@/lib/trainingpeaks/utils';

export async function POST() {
  try {
    const user = await requireAuth();
    const synced = await syncRecentTrainingPeaksActivities(user.id, 30);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error('Error syncing TrainingPeaks activities:', error);
    return NextResponse.json(
      { error: 'Failed to sync TrainingPeaks activities' },
      { status: 500 }
    );
  }
}
