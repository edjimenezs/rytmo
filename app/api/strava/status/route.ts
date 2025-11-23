import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
