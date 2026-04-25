import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { trainingPeaksClient } from '@/lib/trainingpeaks/client';

export async function POST() {
  try {
    const user = await requireAuth();
    const integration = await prisma.trainingPeaksIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'TrainingPeaks not connected' }, { status: 400 });
    }

    try {
      await trainingPeaksClient.deauthorize(integration.accessToken);
    } catch (error) {
      console.warn('TrainingPeaks revoke failed, continuing with disconnect', error);
    }

    await prisma.trainingPeaksIntegration.delete({ where: { userId: user.id } });

    return NextResponse.json({ message: 'TrainingPeaks disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting TrainingPeaks:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect TrainingPeaks' },
      { status: 500 }
    );
  }
}
