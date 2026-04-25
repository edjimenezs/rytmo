import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { garminClient } from '@/lib/garmin/client';

export async function GET() {
  try {
    const user = await requireAuth();
    const authUrl = garminClient.getAuthorizationUrl(user.id);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Garmin auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Garmin authorization' },
      { status: 500 }
    );
  }
}
