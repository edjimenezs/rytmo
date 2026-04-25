import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const integration = await prisma.trainingPeaksIntegration.findUnique({
      where: { userId: user.id },
      select: {
        externalUserId: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });
    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      externalUserId: integration.externalUserId,
      lastSyncAt: integration.lastSyncAt,
      connectedAt: integration.createdAt,
    });
  } catch (error) {
    console.error('Error fetching TrainingPeaks status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TrainingPeaks status' },
      { status: 500 }
    );
  }
}
