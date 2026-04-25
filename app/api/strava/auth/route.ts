import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { stravaClient } from '@/lib/strava/client';

export async function GET() {
  try {
    const user = await requireAuth();
    const authUrl = stravaClient.getAuthorizationUrl(user.id);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Strava auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Strava authorization' },
      { status: 500 }
    );
  }
}
