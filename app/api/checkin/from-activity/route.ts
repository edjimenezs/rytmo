import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';
import { ActivityType } from '@prisma/client';
import { syncRecentGarminActivities } from '@/lib/garmin/utils';
import { syncGarminDailyHealth } from '@/lib/garmin/health-sync';
import { syncRecentStravaActivities } from '@/lib/strava/utils';

const SYNC_STALE_MS = 15 * 60 * 1000; // 15 minutes

async function syncIntegrationsIfStale(userId: string): Promise<void> {
  const [garmin, strava] = await Promise.all([
    prisma.garminIntegration.findUnique({ where: { userId }, select: { lastSyncAt: true } }),
    prisma.stravaIntegration.findUnique({ where: { userId }, select: { lastSyncAt: true } }),
  ]);

  const now = Date.now();
  // Garmin: sync if creds configured and (no record yet OR record is stale)
  const hasGarminCreds = !!(process.env.GARMIN_EMAIL && process.env.GARMIN_PASSWORD);
  const garminStale = hasGarminCreds && (!garmin || !garmin.lastSyncAt || now - garmin.lastSyncAt.getTime() > SYNC_STALE_MS);
  // Strava: only sync if OAuth record exists (needs stored tokens)
  const stravaStale = strava && (!strava.lastSyncAt || now - strava.lastSyncAt.getTime() > SYNC_STALE_MS);

  const jobs: Promise<unknown>[] = [];
  if (garminStale) {
    jobs.push(syncRecentGarminActivities(userId, 30));
    jobs.push(syncGarminDailyHealth(userId).catch(() => {}));
  }
  if (stravaStale) {
    jobs.push(syncRecentStravaActivities(userId, 30).catch(() => {}));
  }
  if (jobs.length > 0) await Promise.all(jobs);
}


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

    await syncIntegrationsIfStale(userId).catch(() => {});

    const [activities, garminHealth] = await Promise.all([
      prisma.trainingActivity.findMany({
        where: { userId, startDate: { gte: base, lt: next } },
        select: { type: true, duration: true, averageHeartRate: true, source: true, startDate: true },
        orderBy: { startDate: 'asc' },
      }),
      prisma.garminDailyHealth.findUnique({
        where: { userId_date: { userId, date: base } },
      }),
    ]);

    // Derive training fields from activities
    let trainingType: string | null = null;
    let durationMin: number | null = null;
    let intensity = 'Moderate';
    let sources: string[] = [];

    if (activities.length > 0) {
      const types = [...new Set(activities.map((a) => a.type))];
      trainingType = activityTypeToTrainingType(types);
      const totalDurationSec = activities.reduce((s, a) => s + (a.duration ?? 0), 0);
      durationMin = totalDurationSec > 0 ? Math.round(totalDurationSec / 60) : null;
      const validHr = activities.filter((a) => a.averageHeartRate != null);
      const avgHr =
        validHr.length > 0
          ? Math.round(validHr.reduce((s, a) => s + (a.averageHeartRate ?? 0), 0) / validHr.length)
          : null;
      intensity = heartRateToIntensity(avgHr);
      sources = [...new Set(activities.map((a) => a.source))];
    }

    const hasActivity = activities.length > 0;
    const hasHealth = !!garminHealth;

    if (!hasActivity && !hasHealth) {
      return NextResponse.json({ activity: null });
    }

    // Derive sleep hours from Garmin health
    const sleepHours = garminHealth?.sleepMinutes
      ? Math.round((garminHealth.sleepMinutes / 60) * 10) / 10
      : null;

    // Derive fatigue from body battery (higher battery = lower fatigue)
    let fatigue: number | null = null;
    const battery = garminHealth?.bodyBatteryCharged;
    if (battery != null) {
      if (battery >= 80) fatigue = 1;
      else if (battery >= 60) fatigue = 2;
      else if (battery >= 40) fatigue = 3;
      else if (battery >= 20) fatigue = 4;
      else fatigue = 5;
    }

    // Derive stress (1-5 scale from 0-100)
    let stress: number | null = null;
    const stressScore = garminHealth?.stressAvg;
    if (stressScore != null) {
      if (stressScore <= 25) stress = 1;
      else if (stressScore <= 50) stress = 2;
      else if (stressScore <= 65) stress = 3;
      else if (stressScore <= 80) stress = 4;
      else stress = 5;
    }

    return NextResponse.json({
      activity: {
        trainingType,
        durationMin,
        intensity,
        sources,
        // Garmin health data
        sleepHours,
        sleepQuality: garminHealth?.sleepQuality ?? null,
        fatigue,
        stress,
        bodyBatteryCharged: garminHealth?.bodyBatteryCharged ?? null,
        bodyBatteryDrained: garminHealth?.bodyBatteryDrained ?? null,
        trainingReadiness: garminHealth?.trainingReadiness ?? null,
        restingHeartRate: garminHealth?.restingHeartRate ?? null,
        hrv: garminHealth?.hrvLastNight ?? garminHealth?.hrvWeeklyAvg ?? null,
        hrvStatus: garminHealth?.hrvStatus ?? null,
        vo2Max: garminHealth?.vo2Max ?? null,
        steps: garminHealth?.steps ?? null,
        respirationAvg: garminHealth?.respirationAvg ?? null,
        spO2Avg: garminHealth?.spO2Avg ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
