import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

function normalizeDate(dateString?: string | null) {
  const d = dateString ? new Date(dateString) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const date = normalizeDate(req.nextUrl.searchParams.get('date'));
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const logs = await prisma.foodLog.findMany({
      where: { userId: user.id, date: { gte: date, lt: nextDate } },
      select: { moment: true, foodName: true, customFood: true, wasRecommended: true },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { date, moment, foodName, customFood, wasRecommended, recommendationId } = body as {
      date?: string;
      moment: string;
      foodName?: string;
      customFood?: string;
      wasRecommended?: boolean;
      recommendationId?: string;
    };

    if (!moment) return NextResponse.json({ error: 'moment requerido' }, { status: 400 });

    const normalizedDate = normalizeDate(date);

    const log = await prisma.foodLog.upsert({
      where: { userId_date_moment: { userId: user.id, date: normalizedDate, moment } },
      update: {
        foodName: foodName ?? null,
        customFood: customFood ?? null,
        wasRecommended: wasRecommended ?? true,
        recommendationId: recommendationId ?? null,
      },
      create: {
        userId: user.id,
        date: normalizedDate,
        moment,
        foodName: foodName ?? null,
        customFood: customFood ?? null,
        wasRecommended: wasRecommended ?? true,
        recommendationId: recommendationId ?? null,
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}
