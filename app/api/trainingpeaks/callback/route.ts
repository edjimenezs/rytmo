import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trainingPeaksClient } from '@/lib/trainingpeaks/client';
import { syncRecentTrainingPeaksActivities } from '@/lib/trainingpeaks/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('TrainingPeaks authorization error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?trainingpeaks_error=denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    const userId = state;
    const token = await trainingPeaksClient.exchangeToken(code);

    await prisma.trainingPeaksIntegration.upsert({
      where: { userId },
      update: {
        externalUserId: token.athlete_external_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(Date.now() + token.expires_in * 1000),
      },
      create: {
        userId,
        externalUserId: token.athlete_external_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(Date.now() + token.expires_in * 1000),
      },
    });

    try {
      await syncRecentTrainingPeaksActivities(userId, 30);
    } catch (syncError) {
      console.error('Error syncing TrainingPeaks activities:', syncError);
    }

    return NextResponse.redirect(
      new URL('/dashboard?trainingpeaks_connected=true', request.url)
    );
  } catch (error) {
    console.error('TrainingPeaks callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?trainingpeaks_error=failed', request.url)
    );
  }
}
