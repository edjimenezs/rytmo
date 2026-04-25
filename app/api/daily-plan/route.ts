import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildNutritionPlan } from '@/lib/nutrition/engine';
import { requireAuth } from '@/lib/auth/utils';
import { getDailyLoads, calcularAtlCtlAcwr } from '@/lib/training/load';
import { findTrainingPlanEntryForDate } from '@/lib/training/plan';
import { generateMomentPhrasing, deterministicFallback, mapMomentToMealName } from '@/lib/ai/phrasing';
import type { NutritionMoment } from '@/lib/nutrition/engine';

function normalizeDate(dateString?: string) {
  const candidate = dateString ? new Date(dateString) : new Date();
  if (Number.isNaN(candidate.getTime())) {
    throw new Error('Invalid date format');
  }
  candidate.setUTCHours(0, 0, 0, 0);
  return candidate;
}

type DailyPlanPayload = {
  date?: string;
  summary?: string;
  breakfast?: string | null;
  preWorkout?: string | null;
  intraWorkout?: string | null;
  postWorkout?: string | null;
  lunch?: string | null;
  snack?: string | null;
  dinner?: string | null;
  rationale?: string | null;
  foodReferences?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const dateParam = req.nextUrl.searchParams.get('date');
    const normalizedDate = normalizeDate(dateParam ?? undefined);

    const loads = await getDailyLoads(userId, 60);
    const { atl, ctl, acwr } = calcularAtlCtlAcwr(loads);
    const planEntry = await findTrainingPlanEntryForDate(userId, normalizedDate);
    const checkin = await prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: normalizedDate } },
      select: {
        fatigue: true,
        sleepHours: true,
        intensity: true,
        trainingType: true,
        durationMin: true,
        timeOfDay: true,
      },
    });

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { defaultTrainingTime: true, weight: true },
    });
    const trainingTime: 'morning' | 'midday' | 'evening' =
      (checkin?.timeOfDay as 'morning' | 'midday' | 'evening' | null) ??
      (profile?.defaultTrainingTime as 'morning' | 'midday' | 'evening' | null) ??
      'morning';

    const planResponse = buildNutritionPlan({
      planEntry: planEntry ?? undefined,
      loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
      checkin: checkin ?? undefined,
      userWeightKg: profile?.weight ?? null,
    });

    const payload = {
      summary: planResponse.summary,
      rationale: planResponse.summary,
      preWorkout: planResponse.moments.preWorkout.text,
      preWorkoutFoods: planResponse.moments.preWorkout.foods,
      intraWorkout: planResponse.moments.intraWorkout.text,
      intraWorkoutFoods: planResponse.moments.intraWorkout.foods,
      postWorkout: planResponse.moments.postWorkout.text,
      postWorkoutFoods: planResponse.moments.postWorkout.foods,
      dinner: planResponse.moments.dinner.text,
      dinnerFoods: planResponse.moments.dinner.foods,
      dayType: planResponse.dayType,
      focus: planResponse.focus,
      reasoning: planResponse.reasoning,
      atl: Number.isFinite(planResponse.loads.atl) ? planResponse.loads.atl : null,
      ctl: Number.isFinite(planResponse.loads.ctl) ? planResponse.loads.ctl : null,
      acwr: Number.isFinite(planResponse.loads.acwr || 0) ? planResponse.loads.acwr : null,
      planEntryId: planEntry?.id ?? null,
      trainingActivityId: planEntry?.matchedActivity?.id ?? null,
      foodReferences: planEntry?.title ?? null,
    };

    const plan = await prisma.dailyRecommendation.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: { ...payload, aiHeadline: null, aiMomentTexts: null },
      create: {
        userId,
        date: normalizedDate,
        ...payload,
      },
    });

    // AI phrasing: always regenerate (cleared on update above)
    let aiHeadline = plan.aiHeadline;
    let aiMomentTexts = plan.aiMomentTexts as Record<string, string> | null;

    if (!aiHeadline) {
      const aiResult = await generateMomentPhrasing(planResponse, checkin ?? null, trainingTime);
      const phrasing = aiResult ?? deterministicFallback(planResponse, trainingTime);

      aiHeadline = phrasing.headline;
      aiMomentTexts = phrasing.moments as Record<string, string>;

      await prisma.dailyRecommendation.update({
        where: { id: plan.id },
        data: { aiHeadline, aiMomentTexts },
      });
    }

    const momentMealNames = Object.fromEntries(
      (Object.keys(planResponse.moments) as NutritionMoment[]).map((m) => [
        m,
        mapMomentToMealName(m, trainingTime),
      ])
    );

    return NextResponse.json({
      plan: {
        ...planResponse,
        id: plan.id,
        date: plan.date.toISOString(),
        aiHeadline,
        aiMomentTexts,
        trainingTime,
        momentMealNames,
        planEntryId: planEntry?.id ?? null,
        trainingActivityId: planEntry?.matchedActivity?.id ?? null,
        createdAt: plan.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[daily-plan] GET error:', error);
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
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }
    const payload = rawPayload as DailyPlanPayload;
    if (!payload.summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    const userId = user.id;
    let normalizedDate;

    try {
      normalizedDate = normalizeDate(payload.date);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const data = {
      summary: payload.summary,
      breakfast: payload.breakfast ?? null,
      preWorkout: payload.preWorkout ?? null,
      intraWorkout: payload.intraWorkout ?? null,
      postWorkout: payload.postWorkout ?? null,
      lunch: payload.lunch ?? null,
      snack: payload.snack ?? null,
      dinner: payload.dinner ?? null,
      rationale: payload.rationale ?? null,
      foodReferences: payload.foodReferences ?? null,
    };

    const plan = await prisma.dailyRecommendation.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: data,
      create: {
        userId,
        date: normalizedDate,
        ...data,
      },
    });

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error('Failed to save plan', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}
