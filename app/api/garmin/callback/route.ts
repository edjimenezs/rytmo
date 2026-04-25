import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { garminClient } from '@/lib/garmin/client';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Garmin authorization error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?garmin_error=denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    const userId = state;
    const token = await garminClient.exchangeToken(code);
    await prisma.garminIntegration.upsert({
      where: { userId },
      update: {
        externalUserId: token.user_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(Date.now() + token.expires_in * 1000),
      },
      create: {
        userId,
        externalUserId: token.user_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(Date.now() + token.expires_in * 1000),
      },
    });

    try {
      await syncRecentGarminActivities(userId, 30);
    } catch (syncError) {
      console.error('Error syncing Garmin activities:', syncError);
    }

    return NextResponse.redirect(
      new URL('/dashboard?garmin_connected=true', request.url)
    );
  } catch (error) {
    console.error('Garmin callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?garmin_error=failed', request.url)
    );
  }
}
