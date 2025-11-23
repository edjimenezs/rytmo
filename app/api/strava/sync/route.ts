import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { syncRecentStravaActivities } from '@/lib/strava/utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const integration = await prisma.stravaIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Strava not connected' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const daysBack = body.daysBack || 30;

    const activitiesCount = await syncRecentStravaActivities(userId, daysBack);

    return NextResponse.json({
      success: true,
      message: 'Activities synced successfully',
      count: activitiesCount,
    });
  } catch (error) {
    console.error('Error syncing Strava activities:', error);
    return NextResponse.json(
      { error: 'Failed to sync Strava activities' },
      { status: 500 }
    );
  }
}
