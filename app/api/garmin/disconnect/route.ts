import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { garminClient } from '@/lib/garmin/client';

export async function POST() {
  try {
    const user = await requireAuth();
    const integration = await prisma.garminIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Garmin not connected' }, { status: 400 });
    }

    try {
      await garminClient.deauthorize(integration.accessToken);
    } catch (error) {
      console.warn('Garmin revoke failed, continuing with disconnect', error);
    }

    await prisma.garminIntegration.delete({ where: { userId: user.id } });

    return NextResponse.json({ message: 'Garmin disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Garmin:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Garmin' },
      { status: 500 }
    );
  }
}
