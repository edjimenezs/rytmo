import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';
import { subDays, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale/es';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const daysParam = req.nextUrl.searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam ?? '7', 10), 3), 14);

    const since = startOfDay(subDays(new Date(), days));

    const feedbacks = await prisma.dailyFeedback.findMany({
      where: {
        userId: user.id,
        date: { gte: since },
        energy: { not: null },
      },
      orderBy: { date: 'asc' },
      select: { date: true, energy: true, performance: true },
    });

    const trends = feedbacks.map((f) => ({
      date: format(new Date(f.date), 'EEE d', { locale: es }),
      energia: f.energy,
      performance: f.performance,
    }));

    return NextResponse.json({ trends, count: trends.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
