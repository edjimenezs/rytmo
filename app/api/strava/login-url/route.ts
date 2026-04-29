import { NextResponse } from 'next/server';
import { stravaClient } from '@/lib/strava/client';

export async function GET() {
  try {
    const url = stravaClient.getAuthorizationUrl('login');
    return NextResponse.redirect(url);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.redirect(`/auth/login?error=${encodeURIComponent(msg)}`);
  }
}
