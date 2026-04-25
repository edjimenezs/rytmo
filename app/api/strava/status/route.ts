import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const integration = await prisma.stravaIntegration.findUnique({
      where: { userId },
      select: {
        stravaUserId: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: true,
      stravaUserId: integration.stravaUserId,
      lastSyncAt: integration.lastSyncAt,
      connectedAt: integration.createdAt,
    });
  } catch (error) {
    console.error('Error fetching Strava status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Strava status' },
      { status: 500 }
    );
  }
}
