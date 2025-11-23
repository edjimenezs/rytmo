import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { stravaClient } from '@/lib/strava/client';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken } from '@/lib/strava/utils';

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

    try {
      const accessToken = await getValidAccessToken(userId);
      if (accessToken) {
        await stravaClient.deauthorize(accessToken);
      }
    } catch (error) {
      console.error('Error revoking Strava access:', error);
    }

    await prisma.stravaIntegration.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Strava disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Strava:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Strava' },
      { status: 500 }
    );
  }
}
