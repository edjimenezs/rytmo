import { NextResponse } from 'next/server';
import { stravaClient } from '@/lib/strava/client';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken } from '@/lib/strava/utils';
import { requireAuth } from '@/lib/auth/utils';

export async function POST() {
  try {
    const user = await requireAuth();
    const userId = user.id;

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
