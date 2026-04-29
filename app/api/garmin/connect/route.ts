import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { GarminAuth } from '@/lib/garmin/auth';
import { GarminClient } from '@/lib/garmin/client';
import { encryptPassword } from '@/lib/garmin/encryption';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';
import { syncGarminDailyHealth } from '@/lib/garmin/health-sync';
import type { GarminTokenData } from '@/lib/garmin/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    const integration = await prisma.garminIntegration.findUnique({ where: { userId: user.id } });

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      displayName: integration.displayName,
      email: integration.garminEmail ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password son requeridos' }, { status: 400 });
    }

    let savedDisplayName = '';
    const encryptedPassword = encryptPassword(password);

    const auth = new GarminAuth(email, password, null, async (data: GarminTokenData) => {
      savedDisplayName = data.profile.displayName;
      await prisma.garminIntegration.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: data.profile.displayName,
          profileId: data.profile.profileId,
          oauth1Token: data.oauth1Token,
          oauth2Token: data.oauth2Token,
          garminEmail: email,
          garminPassword: encryptedPassword,
        },
        update: {
          displayName: data.profile.displayName,
          profileId: data.profile.profileId,
          oauth1Token: data.oauth1Token,
          oauth2Token: data.oauth2Token,
          garminEmail: email,
          garminPassword: encryptedPassword,
        },
      });
    });

    const client = new GarminClient(auth);
    // trigger auth flow — this calls the persist callback above
    await client.getDailySummary();

    void Promise.all([
      syncRecentGarminActivities(user.id, 30).catch(() => null),
      syncGarminDailyHealth(user.id).catch(() => null),
    ]);

    return NextResponse.json({ ok: true, displayName: savedDisplayName || email });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    await prisma.garminIntegration.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
