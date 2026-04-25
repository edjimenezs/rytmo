import { NextRequest, NextResponse } from 'next/server';

// Garmin OAuth token exchange is not yet implemented.
// This route exists as a placeholder for when the full Garmin OAuth flow is wired up.
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL('/dashboard?garmin_error=denied', request.url));
  }
  return NextResponse.redirect(new URL('/dashboard?garmin_error=not_implemented', request.url));
}
