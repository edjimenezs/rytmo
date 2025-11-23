import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { stravaClient } from '@/lib/strava/client';

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
    const authUrl = stravaClient.getAuthorizationUrl(userId);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Strava auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Strava authorization' },
      { status: 500 }
    );
  }
}
