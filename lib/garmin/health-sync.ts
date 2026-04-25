import { prisma } from '@/lib/prisma';
import { createGarminClient } from './client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

function safeInt(val: unknown): number | null {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function safeFloat(val: unknown): number | null {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
}

function parseSleep(data: AnyData) {
  const dto = data?.dailySleepDTO ?? data;
  return {
    sleepMinutes: dto?.sleepTimeSeconds ? Math.round(dto.sleepTimeSeconds / 60) : null,
    sleepQuality: safeInt(dto?.sleepScorePVO ?? dto?.sleepScore ?? dto?.overallScore),
  };
}

function parseBodyBattery(data: AnyData) {
  const entry = Array.isArray(data) ? data[0] : data;
  return {
    bodyBatteryCharged: safeInt(entry?.charged ?? entry?.highValue),
    bodyBatteryDrained: safeInt(entry?.drained ?? entry?.lowValue),
  };
}

function parseStress(data: AnyData) {
  return {
    stressAvg: safeInt(data?.averageStressLevel ?? data?.avgStressLevel),
  };
}

function parseHrv(data: AnyData) {
  const summary = data?.hrvSummary ?? data;
  return {
    hrvWeeklyAvg: safeFloat(summary?.weeklyAvg),
    hrvLastNight: safeFloat(summary?.lastNight),
    hrvStatus: typeof summary?.status === 'string' ? (summary.status as string) : null,
  };
}

function parseTrainingReadiness(data: AnyData) {
  const entry = Array.isArray(data) ? data[0] : data;
  return { trainingReadiness: safeInt(entry?.score) };
}

function parseRhr(data: AnyData) {
  const values = data?.allMetrics?.metricsMap?.WELLNESS_RESTING_HEART_RATE;
  const entry = Array.isArray(values) ? values[0] : null;
  return { restingHeartRate: safeInt(entry?.value) };
}

function parseVo2Max(data: AnyData) {
  const entry = Array.isArray(data) ? data[0] : data;
  return { vo2Max: safeFloat(entry?.generic ?? entry?.vo2MaxValue ?? entry?.vo2Max) };
}

function parseSteps(data: AnyData) {
  if (!data) return { steps: null };
  const list = data?.dataList ?? [];
  if (Array.isArray(list) && list.length > 0) {
    const total = list.reduce((s: number, r: AnyData) => s + (Number(r?.steps) || 0), 0);
    return { steps: total > 0 ? total : null };
  }
  return { steps: safeInt(data?.totalSteps ?? data?.steps) };
}

function parseRespiration(data: AnyData) {
  return {
    respirationAvg: safeFloat(
      data?.avgWakingRespirationValue ?? data?.averageRespirationValue ?? data?.respirationValue,
    ),
  };
}

function parseSpo2(data: AnyData) {
  return {
    spO2Avg: safeFloat(
      data?.dailyAverageSPO2 ?? data?.averageDaySPO2 ?? data?.currentDaySPO2,
    ),
  };
}

export async function syncGarminDailyHealth(userId: string, dateStr?: string): Promise<void> {
  const client = await createGarminClient(userId);
  const d = dateStr ?? new Date().toISOString().split('T')[0]!;

  const results = await Promise.allSettled([
    client.getSleepData(d),
    client.getBodyBattery(d, d),
    client.getStress(d),
    client.getHRV(d),
    client.getTrainingReadiness(d),
    client.getRestingHeartRate(d),
    client.getVO2Max(d),
    client.getStepsChart(d),
    client.getRespiration(d),
    client.getSpO2(d),
  ]);

  const get = (r: PromiseSettledResult<unknown>) =>
    r.status === 'fulfilled' ? r.value : null;

  const [sleep, bodyBattery, stress, hrv, readiness, rhr, vo2, steps, respiration, spo2] = results;

  const targetDate = new Date(`${d}T00:00:00.000Z`);

  const fields = {
    ...parseSleep(get(sleep)),
    ...parseBodyBattery(get(bodyBattery)),
    ...parseStress(get(stress)),
    ...parseHrv(get(hrv)),
    ...parseTrainingReadiness(get(readiness)),
    ...parseRhr(get(rhr)),
    ...parseVo2Max(get(vo2)),
    ...parseSteps(get(steps)),
    ...parseRespiration(get(respiration)),
    ...parseSpo2(get(spo2)),
    updatedAt: new Date(),
  };

  await prisma.garminDailyHealth.upsert({
    where: { userId_date: { userId, date: targetDate } },
    create: { userId, date: targetDate, ...fields },
    update: fields,
  });
}
