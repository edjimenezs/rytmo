import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';

function normalizeDate(dateString?: string) {
  const candidate = dateString ? new Date(dateString) : new Date();
  if (Number.isNaN(candidate.getTime())) {
    throw new Error('Invalid date format');
  }
  candidate.setUTCHours(0, 0, 0, 0);
  return candidate;
}

type FeedbackPayload = {
  date?: string;
  energy?: number | null;
  hunger?: number | null;
  performance?: number | null;
  digestion?: number | null;
  notes?: string | null;
  recommendationId?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const dateParam = req.nextUrl.searchParams.get('date');
    const normalizedDate = normalizeDate(dateParam ?? undefined);

    const feedback = await prisma.dailyFeedback.findUnique({
      where: { userId_date: { userId, date: normalizedDate } },
    });

    return NextResponse.json({ feedback: feedback ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const rawPayload = await req.json();
    if (!rawPayload || typeof rawPayload !== "object") {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }
    const payload = rawPayload as FeedbackPayload;

    const userId = user.id;
    let normalizedDate;

    try {
      normalizedDate = normalizeDate(payload.date);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const feedback = await prisma.dailyFeedback.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        energy: payload.energy ?? null,
        hunger: payload.hunger ?? null,
        performance: payload.performance ?? null,
        digestion: payload.digestion ?? null,
        notes: payload.notes ?? null,
        recommendationId: payload.recommendationId ?? null,
      },
      create: {
        userId,
        date: normalizedDate,
        energy: payload.energy ?? null,
        hunger: payload.hunger ?? null,
        performance: payload.performance ?? null,
        digestion: payload.digestion ?? null,
        notes: payload.notes ?? null,
        recommendationId: payload.recommendationId ?? null,
      },
    });

    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error('Failed to save feedback', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
