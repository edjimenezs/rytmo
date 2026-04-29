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

    const nextDate = new Date(normalizedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const sixtyDaysAgo = new Date(normalizedDate);
    sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 60);

    const [loadsRaw, planEntry, checkin, garminHealth, profile, todayActivities, existingRec, foodHistory] = await Promise.all([
      getDailyLoads(userId, 60),
      findTrainingPlanEntryForDate(userId, normalizedDate),
      prisma.dailyCheckin.findUnique({
        where: { userId_date: { userId, date: normalizedDate } },
        select: { fatigue: true, sleepHours: true, intensity: true, trainingType: true, durationMin: true, timeOfDay: true },
      }),
      prisma.garminDailyHealth.findUnique({
        where: { userId_date: { userId, date: normalizedDate } },
        select: { bodyBatteryCharged: true, trainingReadiness: true, hrvStatus: true, sleepMinutes: true, stressAvg: true },
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: { defaultTrainingTime: true, weight: true, isTestUser: true, likedFoods: true, dislikedFoods: true },
      }),
      prisma.trainingActivity.findMany({
        where: { userId, startDate: { gte: normalizedDate, lt: nextDate } },
        select: { id: true, name: true, type: true, duration: true, distance: true, source: true, averageHeartRate: true, startDate: true },
        orderBy: { startDate: 'asc' },
      }),
      prisma.dailyRecommendation.findUnique({
        where: { userId_date: { userId, date: normalizedDate } },
        select: { aiHeadline: true, aiMomentTexts: true, dayType: true, focus: true },
      }),
      prisma.foodLog.groupBy({
        by: ['foodName', 'moment'],
        where: { userId, wasRecommended: true, foodName: { not: null }, date: { gte: sixtyDaysAgo } },
        _count: { foodName: true },
      }),
    ]);

    // Build preference score map: foodName → times confirmed eaten
    const preferenceScores = new Map<string, number>();
    for (const row of foodHistory) {
      if (row.foodName) preferenceScores.set(row.foodName, row._count.foodName);
    }

    const { atl, ctl, acwr } = calcularAtlCtlAcwr(loadsRaw);

    let activityTrainingTime: 'morning' | 'midday' | 'evening' | null = null;
    if (todayActivities.length > 0) {
      const hour = new Date(todayActivities[0].startDate).getUTCHours();
      activityTrainingTime = hour < 12 ? 'morning' : hour < 17 ? 'midday' : 'evening';
    }

    const trainingTime: 'morning' | 'midday' | 'evening' =
      (checkin?.timeOfDay as 'morning' | 'midday' | 'evening' | null) ??
      activityTrainingTime ??
      (profile?.defaultTrainingTime as 'morning' | 'midday' | 'evening' | null) ??
      'morning';

    // Derive training info from actual activities when no manual checkin
    let activityTrainingType: string | null = null;
    let activityDurationMin: number | null = null;
    let activityIntensity: string | null = null;
    if (todayActivities.length > 0 && !checkin?.trainingType) {
      const typeMap: Record<string, string> = {
        RUNNING: 'run', CYCLING: 'bike', SWIMMING: 'swim',
        WALKING: 'run', WEIGHTLIFTING: 'strength', YOGA: 'strength', OTHER: 'strength',
      };
      activityTrainingType = typeMap[todayActivities[0].type] ?? 'strength';
      const totalSec = todayActivities.reduce((s, a) => s + (a.duration ?? 0), 0);
      activityDurationMin = totalSec > 0 ? Math.round(totalSec / 60) : null;
      const validHr = todayActivities.filter(a => a.averageHeartRate != null);
      const avgHr = validHr.length > 0
        ? validHr.reduce((s, a) => s + (a.averageHeartRate ?? 0), 0) / validHr.length
        : null;
      activityIntensity = avgHr == null ? 'Moderate' : avgHr < 130 ? 'Low' : avgHr <= 155 ? 'Moderate' : 'High';
    }

    // Average HR from today's activities (for kcal estimation)
    const activityAvgHr = (() => {
      const validHr = todayActivities.filter(a => a.averageHeartRate != null);
      return validHr.length > 0
        ? validHr.reduce((s, a) => s + (a.averageHeartRate ?? 0), 0) / validHr.length
        : null;
    })();

    // Merge: manual checkin > derived from activities > Garmin health
    const mergedCheckin = {
      ...checkin,
      trainingType: checkin?.trainingType ?? activityTrainingType,
      durationMin: checkin?.durationMin ?? activityDurationMin,
      intensity: checkin?.intensity ?? activityIntensity,
      sleepHours: checkin?.sleepHours ?? (garminHealth?.sleepMinutes ? garminHealth.sleepMinutes / 60 : null),
      bodyBattery: garminHealth?.bodyBatteryCharged ?? null,
      trainingReadiness: garminHealth?.trainingReadiness ?? null,
      hrvStatus: garminHealth?.hrvStatus ?? null,
      averageHR: activityAvgHr,
    };

    // When no training info available, use ACWR to infer a reasonable default day type
    let defaultDayType: string | undefined;
    if (!mergedCheckin.trainingType) {
      if (Number.isFinite(acwr) && acwr > 0) {
        defaultDayType = acwr > 1.3 ? 'rest' : acwr >= 0.8 ? 'moderate' : 'low';
      } else if (loadsRaw.length > 0) {
        defaultDayType = 'low';
      }
    }

    const planResponse = buildNutritionPlan({
      planEntry: planEntry ?? undefined,
      loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
      checkin: mergedCheckin,
      userWeightKg: profile?.weight ?? null,
      defaultDayType,
      preferenceScores,
      likedFoods: profile?.likedFoods ?? [],
      dislikedFoods: profile?.dislikedFoods ?? [],
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

    // Only clear AI phrasing if the underlying plan changed (dayType or focus differs)
    const phrasingKey = `${planResponse.dayType}|${planResponse.focus ?? ''}|${mergedCheckin.fatigue ?? ''}|${mergedCheckin.sleepHours ?? ''}|${mergedCheckin.trainingType ?? ''}|${mergedCheckin.intensity ?? ''}`;
    const existingPhrKey = `${existingRec?.dayType ?? ''}|${existingRec?.focus ?? ''}|${mergedCheckin.fatigue ?? ''}|${mergedCheckin.sleepHours ?? ''}|${mergedCheckin.trainingType ?? ''}|${mergedCheckin.intensity ?? ''}`;
    const phrasingStale = !existingRec?.aiHeadline || phrasingKey !== existingPhrKey;

    const plan = await prisma.dailyRecommendation.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: phrasingStale
        ? { ...payload, aiHeadline: null, aiMomentTexts: Prisma.JsonNull }
        : { ...payload },
      create: {
        userId,
        date: normalizedDate,
        ...payload,
      },
    });

    // AI phrasing: regenerate only when stale or missing
    let aiHeadline = phrasingStale ? null : (existingRec?.aiHeadline ?? null);
    let aiMomentTexts = phrasingStale ? null : (existingRec?.aiMomentTexts as Record<string, string> | null);

    if (!aiHeadline) {
      const isTestUser = profile?.isTestUser ?? false;
      const aiResult = await generateMomentPhrasing(planResponse, checkin ?? null, trainingTime, isTestUser);
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
        hasGarminHealth: !!(garminHealth?.sleepMinutes || garminHealth?.bodyBatteryCharged),
        garminSleep: garminHealth?.sleepMinutes ? Math.round(garminHealth.sleepMinutes / 60 * 10) / 10 : null,
        garminBodyBattery: garminHealth?.bodyBatteryCharged ?? null,
        todayActivity: todayActivities.length > 0 ? {
          id: todayActivities[0].id,
          name: todayActivities[0].name,
          type: todayActivities[0].type,
          duration: todayActivities[0].duration ?? null,
          distance: todayActivities[0].distance ?? null,
          source: todayActivities[0].source,
          startDate: todayActivities[0].startDate.toISOString(),
        } : null,
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
