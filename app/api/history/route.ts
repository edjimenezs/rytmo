import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 14);
    since.setUTCHours(0, 0, 0, 0);

    const [activities, plans] = await Promise.all([
      prisma.trainingActivity.findMany({
        where: { userId, startDate: { gte: since } },
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
        take: 30,
      }),
      prisma.dailyRecommendation.findMany({
        where: { userId, date: { gte: since } },
        select: {
          id: true,
          date: true,
          aiHeadline: true,
          summary: true,
          dayType: true,
        },
        orderBy: { date: 'desc' },
        take: 14,
      }),
    ]);

    // Group activities by date (UTC date string)
    const actsByDate: Record<string, typeof activities> = {};
    for (const a of activities) {
      const key = a.startDate.toISOString().split('T')[0]!;
      if (!actsByDate[key]) actsByDate[key] = [];
      actsByDate[key].push(a);
    }

    // Build unified day records for last 14 days
    const days: {
      date: string;
      activities: typeof activities;
      plan: (typeof plans)[0] | null;
    }[] = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0]!;
      const dayActivities = actsByDate[key] ?? [];
      const dayPlan = plans.find((p) => p.date.toISOString().split('T')[0] === key) ?? null;
      if (dayActivities.length > 0 || dayPlan) {
        days.push({ date: key, activities: dayActivities, plan: dayPlan });
      }
    }

    return NextResponse.json({ days });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
