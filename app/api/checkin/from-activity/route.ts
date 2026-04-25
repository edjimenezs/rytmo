import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';
import { ActivityType } from '@prisma/client';

function activityTypeToTrainingType(types: ActivityType[]): string | null {
  const has = (t: ActivityType) => types.includes(t);
  if (has(ActivityType.CYCLING) && has(ActivityType.RUNNING)) return 'tri';
  if (has(ActivityType.CYCLING) && has(ActivityType.SWIMMING)) return 'tri';
  if (has(ActivityType.RUNNING) && has(ActivityType.SWIMMING)) return 'tri';
  if (has(ActivityType.CYCLING)) return 'bike';
  if (has(ActivityType.RUNNING)) return 'run';
  if (has(ActivityType.SWIMMING)) return 'swim';
  return null;
}

function heartRateToIntensity(avgHr: number | null): string {
  if (!avgHr) return 'Moderate';
  if (avgHr < 130) return 'Low';
  if (avgHr <= 155) return 'Moderate';
  return 'High';
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const dateParam = req.nextUrl.searchParams.get('date');
    const base = dateParam ? new Date(dateParam) : new Date();
    base.setUTCHours(0, 0, 0, 0);
    const next = new Date(base);
    next.setUTCDate(next.getUTCDate() + 1);

    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: { gte: base, lt: next },
      },
      select: {
        type: true,
        duration: true,
        averageHeartRate: true,
        source: true,
        startDate: true,
      },
      orderBy: { startDate: 'asc' },
    });

    if (!activities.length) {
      return NextResponse.json({ activity: null });
    }

    const types = [...new Set(activities.map((a) => a.type))];
    const trainingType = activityTypeToTrainingType(types);
    const totalDurationSec = activities.reduce((s, a) => s + (a.duration ?? 0), 0);
    const durationMin = totalDurationSec > 0 ? Math.round(totalDurationSec / 60) : null;

    const validHr = activities.filter((a) => a.averageHeartRate != null);
    const avgHr =
      validHr.length > 0
        ? Math.round(validHr.reduce((s, a) => s + (a.averageHeartRate ?? 0), 0) / validHr.length)
        : null;
    const intensity = heartRateToIntensity(avgHr);

    const sources = [...new Set(activities.map((a) => a.source))];

    return NextResponse.json({
      activity: {
        trainingType,
        durationMin,
        intensity,
        sources,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
