import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { stravaClient } from '@/lib/strava/client';
import { prisma } from '@/lib/prisma';
import { syncRecentStravaActivities } from '@/lib/strava/utils';
import type { UserRole } from '@prisma/client';

async function handleLoginFlow(request: NextRequest, code: string): Promise<NextResponse> {
  const tokenResponse = await stravaClient.exchangeToken(code);
  const athlete = tokenResponse.athlete;
  const stravaUserId = athlete.id.toString();

  // Find existing user by Strava ID, or create a new one
  const existingIntegration = await prisma.stravaIntegration.findFirst({
    where: { stravaUserId },
    include: { user: { select: { id: true, email: true, name: true, role: true, image: true } } },
  });

  let userId: string;
  let userEmail: string;
  let userName: string;
  let userRole: string;
  let userImage: string | null;

  if (existingIntegration) {
    userId = existingIntegration.userId;
    userEmail = existingIntegration.user.email;
    userName = existingIntegration.user.name ?? '';
    userRole = existingIntegration.user.role;
    userImage = existingIntegration.user.image;
    // Update tokens
    await prisma.stravaIntegration.update({
      where: { userId },
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
      },
    });
  } else {
    // New user — create account
    const syntheticEmail = `strava_${stravaUserId}@noreply.rytmo.app`;
    userName = `${athlete.firstname ?? ''} ${athlete.lastname ?? ''}`.trim() || 'Atleta';
    userEmail = syntheticEmail;
    userRole = 'ATHLETE';
    userImage = (athlete.profile_medium ?? athlete.profile) || null;

    const newUser = await prisma.user.create({
      data: { email: syntheticEmail, name: userName, image: userImage, role: 'ATHLETE' },
    });
    userId = newUser.id;

    await prisma.profile.create({ data: { userId } });
    await prisma.stravaIntegration.create({
      data: {
        userId,
        stravaUserId,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
        scope: 'read,activity:read_all',
      },
    });
  }

  // Sync activities in the background
  syncRecentStravaActivities(userId, 30).catch(console.error);

  // Create NextAuth JWT session
  const sessionToken = await encode({
    token: { sub: userId, id: userId, email: userEmail, name: userName, role: userRole as UserRole, picture: userImage },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Strava authorization error:', error);
      const redirectBase = state === 'login' ? '/auth/login' : '/dashboard';
      return NextResponse.redirect(new URL(`${redirectBase}?strava_error=denied`, request.url));
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing authorization code or state' }, { status: 400 });
    }

    // Login flow: create or find user, set session
    if (state === 'login') {
      return handleLoginFlow(request, code);
    }

    // Connect flow: link Strava to existing logged-in user
    const userId = state;
    const tokenResponse = await stravaClient.exchangeToken(code);

    await prisma.stravaIntegration.upsert({
      where: { userId },
      create: {
        userId,
        stravaUserId: tokenResponse.athlete.id.toString(),
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
        scope: tokenResponse.athlete.resource_state.toString(),
      },
      update: {
        stravaUserId: tokenResponse.athlete.id.toString(),
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
        scope: tokenResponse.athlete.resource_state.toString(),
      },
    });

    try {
      await syncRecentStravaActivities(userId, 30);
    } catch (syncError) {
      console.error('Error syncing initial activities:', syncError);
    }

    return NextResponse.redirect(new URL('/dashboard?strava_connected=true', request.url));
  } catch (error) {
    console.error('Error in Strava callback:', error);
    const isLogin = request.nextUrl.searchParams.get('state') === 'login';
    return NextResponse.redirect(
      new URL(`${isLogin ? '/auth/login' : '/dashboard'}?strava_error=failed`, request.url)
    );
  }
}
