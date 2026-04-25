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

type CheckinPayload = {
  date?: string;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  fatigue?: number | null;
  hunger?: number | null;
  stress?: number | null;
  trainingType?: string | null;
  durationMin?: number | null;
  intensity?: string | null;
  timeOfDay?: string | null;
  notes?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const dateParam = req.nextUrl.searchParams.get('date');
    const normalizedDate = normalizeDate(dateParam ?? undefined);

    const checkin = await prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: normalizedDate } },
    });

    return NextResponse.json({ checkin: checkin ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const dateParam = req.nextUrl.searchParams.get('date');
    const normalizedDate = normalizeDate(dateParam ?? undefined);

    await prisma.dailyCheckin.deleteMany({
      where: { userId, date: normalizedDate },
    });

    return NextResponse.json({ deleted: true });
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
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }
    const payload = rawPayload as CheckinPayload;

    const userId = user.id;
    let normalizedDate;

    try {
      normalizedDate = normalizeDate(payload.date);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const checkin = await prisma.dailyCheckin.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        sleepHours: payload.sleepHours ?? null,
        sleepQuality: payload.sleepQuality ?? null,
        fatigue: payload.fatigue ?? null,
        hunger: payload.hunger ?? null,
        stress: payload.stress ?? null,
        trainingType: payload.trainingType ?? null,
        durationMin: payload.durationMin ?? null,
        intensity: payload.intensity ?? null,
        timeOfDay: payload.timeOfDay ?? null,
        notes: payload.notes ?? null,
      },
      create: {
        userId,
        date: normalizedDate,
        sleepHours: payload.sleepHours ?? null,
        sleepQuality: payload.sleepQuality ?? null,
        fatigue: payload.fatigue ?? null,
        hunger: payload.hunger ?? null,
        stress: payload.stress ?? null,
        trainingType: payload.trainingType ?? null,
        durationMin: payload.durationMin ?? null,
        intensity: payload.intensity ?? null,
        timeOfDay: payload.timeOfDay ?? null,
        notes: payload.notes ?? null,
      },
    });

    return NextResponse.json({ checkin }, { status: 200 });
  } catch (error) {
    console.error('Failed to write check-in', error);
    const message = error instanceof Error ? error.message : 'Failed to save check-in';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
