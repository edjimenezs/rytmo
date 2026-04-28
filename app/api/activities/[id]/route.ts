import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const activity = await prisma.trainingActivity.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        source: true,
        externalId: true,
        distance: true,
        duration: true,
        elevation: true,
        calories: true,
        averageHeartRate: true,
        maxHeartRate: true,
        averagePace: true,
        startDate: true,
        endDate: true,
        description: true,
        notes: true,
        userId: true,
      },
    });

    if (!activity || activity.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
