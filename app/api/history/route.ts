import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const [activities, plans] = await Promise.all([
      prisma.trainingActivity.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          source: true,
          duration: true,
          distance: true,
          averageHeartRate: true,
          startDate: true,
        },
        orderBy: { startDate: 'desc' },
        take: 60,
      }),
      prisma.dailyRecommendation.findMany({
        where: { userId },
        select: {
          id: true,
          date: true,
          aiHeadline: true,
          summary: true,
          dayType: true,
        },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    // Group activities by date (UTC date string)
    const actsByDate: Record<string, typeof activities> = {};
    for (const a of activities) {
      const key = a.startDate.toISOString().split('T')[0]!;
      if (!actsByDate[key]) actsByDate[key] = [];
      actsByDate[key].push(a);
    }

    // Build day records from actual activity/plan dates (not a fixed window)
    const allKeys = new Set<string>([
      ...Object.keys(actsByDate),
      ...plans.map((p) => p.date.toISOString().split('T')[0]!),
    ]);

    const days: {
      date: string;
      activities: typeof activities;
      plan: (typeof plans)[0] | null;
    }[] = [];

    for (const key of [...allKeys].sort().reverse().slice(0, 30)) {
      const dayActivities = actsByDate[key] ?? [];
      const dayPlan = plans.find((p) => p.date.toISOString().split('T')[0] === key) ?? null;
      days.push({ date: key, activities: dayActivities, plan: dayPlan });
    }

    return NextResponse.json({ days });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
