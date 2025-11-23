import { NextRequest, NextResponse } from 'next/server';
import { stravaClient } from '@/lib/strava/client';
import { prisma } from '@/lib/prisma';
import { syncRecentStravaActivities } from '@/lib/strava/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Strava authorization error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?strava_error=denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    const userId = state;

    const tokenResponse = await stravaClient.exchangeToken(code);

    const existingIntegration = await prisma.stravaIntegration.findUnique({
      where: { userId },
    });

    if (existingIntegration) {
      await prisma.stravaIntegration.update({
        where: { userId },
        data: {
          stravaUserId: tokenResponse.athlete.id.toString(),
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(tokenResponse.expires_at * 1000),
          scope: tokenResponse.athlete.resource_state.toString(),
        },
      });
    } else {
      await prisma.stravaIntegration.create({
        data: {
          userId,
          stravaUserId: tokenResponse.athlete.id.toString(),
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(tokenResponse.expires_at * 1000),
          scope: tokenResponse.athlete.resource_state.toString(),
        },
      });
    }

    try {
      await syncRecentStravaActivities(userId, 30);
    } catch (syncError) {
      console.error('Error syncing initial activities:', syncError);
    }

    return NextResponse.redirect(
      new URL('/dashboard?strava_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in Strava callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard?strava_error=failed', request.url)
    );
  }
}
