import { prisma } from '@/lib/prisma';
import { buildNutritionPlan } from '@/lib/nutrition/engine';
import type { FoodOption } from '@/lib/nutrition/catalog';
import { findTrainingPlanEntryForDate } from '@/lib/training/plan';
import { getDailyLoads, calcularAtlCtlAcwr } from '@/lib/training/load';

type ActionDue = 'before' | 'during' | 'after' | 'anytime';

export type ActionTask = {
  id: string;
  type: 'training' | 'nutrition' | 'recovery';
  priority: 'high' | 'medium' | 'low';
  text: string;
  due: ActionDue;
  link?: { label: string; href: string };
  foods?: FoodOption[];
  meta?: { tss?: number | null; durationMinutes?: number | null };
};

export type IntegrationSummary = {
  connected: boolean;
  lastSyncAt?: string | null;
};

export type ActionPlanMetrics = {
  atl: number | null;
  ctl: number | null;
  acwr: number | null;
  trainingTss?: number | null;
};

export type ActionPlanResponse = {
  date: string;
  summary: string;
  planEntry?: {
    sessionType: string;
    title: string;
    durationMinutes?: number | null;
    tss?: number | null;
    matchedActivityName?: string | null;
  };
  metrics: ActionPlanMetrics;
  tasks: ActionTask[];
  integrations: {
    strava: IntegrationSummary;
    trainingPeaks: IntegrationSummary;
    garmin: IntegrationSummary;
  };
  checkin?: {
    fatigue?: number | null;
    hunger?: number | null;
    sleepHours?: number | null;
  };
};

function normalizeDate(date?: string | Date) {
  const candidate = date ? new Date(date) : new Date();
  candidate.setUTCHours(0, 0, 0, 0);
  return candidate;
}

function integrationSummaryFromRecord(record: { lastSyncAt?: Date | null } | null): IntegrationSummary {
  return {
    connected: Boolean(record),
    lastSyncAt: record?.lastSyncAt ? record.lastSyncAt.toISOString() : null,
  };
}

export async function buildActionPlan(userId: string, date?: string | Date): Promise<ActionPlanResponse> {
  const normalizedDate = normalizeDate(date);
  const [planEntry, checkin, stravaIntegration, tpIntegration, garminIntegration, profile] = await Promise.all([
    findTrainingPlanEntryForDate(userId, normalizedDate),
    prisma.dailyCheckin.findUnique({ where: { userId_date: { userId, date: normalizedDate } } }),
    prisma.stravaIntegration.findUnique({ where: { userId } }),
    prisma.trainingPeaksIntegration.findUnique({ where: { userId } }),
    prisma.garminIntegration.findUnique({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId }, select: { weight: true } }),
  ]);

  const loads = await getDailyLoads(userId, 60);
  const { atl, ctl, acwr } = calcularAtlCtlAcwr(loads);
  const nutritionPlan = buildNutritionPlan({
    planEntry: planEntry ?? undefined,
    loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
    checkin: checkin ? {
      fatigue: checkin.fatigue,
      sleepHours: checkin.sleepHours,
      intensity: checkin.intensity,
      trainingType: checkin.trainingType,
      durationMin: checkin.durationMin,
    } : undefined,
    userWeightKg: profile?.weight ?? null,
  });

  const tasks: ActionTask[] = [];

  if (planEntry) {
    tasks.push({
      id: 'training-session',
      type: 'training',
      priority: 'high',
      text: `Ejecutar: ${planEntry.sessionType} · ${planEntry.title}${planEntry.durationMinutes ? ` · ${Math.round(planEntry.durationMinutes)} min` : ''}${planEntry.tss ? ` · ${Math.round(planEntry.tss)} TSS` : ''}`,
      due: 'before',
      link: { label: 'Ver plan', href: '/dashboard/training-plan' },
      meta: {
        tss: planEntry.tss,
        durationMinutes: planEntry.durationMinutes,
      },
    });
  } else {
    tasks.push({
      id: 'rest-day',
      type: 'recovery',
      priority: 'medium',
      text: 'Hoy no hay sesión planificada. Prioriza movilidad suave, hidratación y comidas fáciles.',
      due: 'anytime',
      link: { label: 'Ver nutrición ligera', href: '/dashboard/nutrition-plan' },
    });
  }

  const momentConfigs: Array<{
    moment: keyof typeof nutritionPlan.moments;
    label: string;
    due: ActionDue;
    priority: 'high' | 'medium' | 'low';
  }> = [
    { moment: 'preWorkout', label: 'Antes de entrenar', due: 'before', priority: 'high' },
    { moment: 'intraWorkout', label: 'Durante la sesión', due: 'during', priority: 'high' },
    { moment: 'postWorkout', label: 'Después de entrenar', due: 'after', priority: 'medium' },
    { moment: 'snack', label: 'Snack / Merienda', due: 'anytime', priority: 'low' },
    { moment: 'dinner', label: 'Cena', due: 'after', priority: 'medium' },
  ];

  for (const config of momentConfigs) {
    const momentPlan = nutritionPlan.moments[config.moment as keyof typeof nutritionPlan.moments];
    if (config.moment === 'intraWorkout' && !momentPlan.foods.length) {
      continue;
    }
    tasks.push({
      id: `nutrition-${config.moment}`,
      type: 'nutrition',
      priority: config.priority,
      text: `${config.label}: ${momentPlan.text}`,
      due: config.due,
      link: { label: 'Ver menú', href: '/dashboard/nutrition-plan' },
      foods: momentPlan.foods,
    });
  }

  if (!checkin) {
    tasks.push({
      id: 'log-checkin',
      type: 'recovery',
      priority: 'medium',
      text: 'Registra tu check-in (sueño, fatiga, hambre) para afinar el plan del día.',
      due: 'anytime',
      link: { label: 'Registrar check-in', href: '/checkin' },
    });
  } else if (checkin.fatigue && checkin.fatigue >= 4) {
    tasks.push({
      id: 'fatigue-watch',
      type: 'recovery',
      priority: 'medium',
      text: 'Fatiga alta registrada: baja la intensidad, enfócate en hidratación y sueño.',
      due: 'anytime',
      link: { label: 'Ver plan de recuperación', href: '/dashboard/nutrition-plan' },
    });
  } else {
    tasks.push({
      id: 'recovery-check',
      type: 'recovery',
      priority: 'low',
      text: 'Revisá el plan de recuperación: dormí bien, hidratá y ajustá las comidas si lo sentís.',
      due: 'anytime',
      link: { label: 'Revisar nutrición', href: '/dashboard/nutrition-plan' },
    });
  }

  return {
    date: normalizedDate.toISOString(),
    summary: nutritionPlan.summary,
    planEntry: planEntry
      ? {
          sessionType: planEntry.sessionType,
          title: planEntry.title,
          durationMinutes: planEntry.durationMinutes,
          tss: planEntry.tss,
          matchedActivityName: planEntry.matchedActivity?.name ?? null,
        }
      : undefined,
    metrics: {
      atl: Number.isFinite(atl) ? atl : null,
      ctl: Number.isFinite(ctl) ? ctl : null,
      acwr: Number.isFinite(acwr) ? acwr : null,
      trainingTss: planEntry?.tss ?? null,
    },
    tasks,
    integrations: {
      strava: integrationSummaryFromRecord(stravaIntegration),
      trainingPeaks: integrationSummaryFromRecord(tpIntegration),
      garmin: integrationSummaryFromRecord(garminIntegration),
    },
    checkin: checkin
      ? {
          fatigue: checkin.fatigue,
          hunger: checkin.hunger,
          sleepHours: checkin.sleepHours,
        }
      : undefined,
  };
}
