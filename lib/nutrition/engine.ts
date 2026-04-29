import { foodCatalog, FoodOption } from "./catalog";
import {
  INTRA_FUEL_THRESHOLD_MIN,
  DAY_TYPE_THRESHOLDS,
  INTRA_CARBS_TARGET,
  getDurationBucket,
  SODIUM_THRESHOLD_MIN,
  SODIUM_TARGET_MG_PER_H,
  POST_PROTEIN_G_PER_KG,
  POST_CARBS_G_PER_KG,
  buildIntraReasoning,
  buildPersonalizedPostReasoning,
} from "./fueling-rules";
import type { TrainingActivity } from "@prisma/client";

type CheckinInput = {
  fatigue?: number | null;
  sleepHours?: number | null;
  intensity?: string | null;
  trainingType?: string | null;
  durationMin?: number | null;
  bodyBattery?: number | null;       // 0–100 Garmin body battery (charged)
  trainingReadiness?: number | null; // 0–100 Garmin training readiness
  hrvStatus?: string | null;         // BALANCED | LOW | UNBALANCED
};

function downgradeDayType(dt: string): string {
  if (dt === 'high') return 'moderate';
  if (dt === 'moderate') return 'low';
  return 'rest';
}

function resolveCheckinModifiers(
  baseDayType: string,
  baseRequiresIntra: boolean,
  checkin?: CheckinInput
): { dayType: string; requiresIntraFuel: boolean; recoveryFocus: boolean } {
  if (!checkin) {
    return { dayType: baseDayType, requiresIntraFuel: baseRequiresIntra, recoveryFocus: false };
  }

  let dayType = baseDayType;
  let requiresIntraFuel = baseRequiresIntra;
  let recoveryFocus = false;

  // Very low body battery → force recovery regardless of session
  if (checkin.bodyBattery != null && checkin.bodyBattery < 20) {
    dayType = 'rest';
    requiresIntraFuel = false;
    recoveryFocus = true;
  }

  // Low training readiness → downgrade one level
  if (checkin.trainingReadiness != null && checkin.trainingReadiness < 40) {
    dayType = downgradeDayType(dayType);
    if (dayType === 'rest' || dayType === 'low') requiresIntraFuel = false;
    recoveryFocus = true;
  }

  // HRV suppressed → add recovery focus
  if (checkin.hrvStatus === 'LOW' || checkin.hrvStatus === 'UNBALANCED') {
    recoveryFocus = true;
    if (dayType === 'high') dayType = 'moderate';
  }

  // High fatigue: downgrade perceived intensity
  if (checkin.fatigue != null && checkin.fatigue >= 4) {
    dayType = downgradeDayType(dayType);
    requiresIntraFuel = false;
  }

  // Poor sleep: force recovery focus on dinner
  if (!recoveryFocus && checkin.sleepHours != null && checkin.sleepHours < 6) {
    recoveryFocus = true;
  }

  return { dayType, requiresIntraFuel, recoveryFocus };
}

export type NutritionMoment = "preWorkout" | "intraWorkout" | "postWorkout" | "snack" | "dinner";

export type NutritionMomentPlan = {
  text: string;
  foods: FoodOption[];
};

type NutritionPlanEntry = {
  id: string;
  sessionType: string;
  title: string;
  durationMinutes?: number | null;
  tss?: number | null;
  dayType?: string | null;
  focus?: string | null;
  requiresIntraFuel?: boolean | null;
  matchedActivity?: {
    id: string;
    name: string;
    source: TrainingActivity["source"];
    startDate: string | Date;
    duration?: number | null;
  } | null;
};

export type NutritionPlanResponse = {
  summary: string;
  reasoning: string;
  dayType: string;
  focus: string | null;
  loads: {
    atl: number | null;
    ctl: number | null;
    acwr: number | null;
  };
  planEntry?: {
    id: string;
    title: string;
    sessionType: string;
    durationMinutes?: number | null;
    tss?: number | null;
    matchedActivityName?: string;
    matchedActivity?: {
      id: string;
      name: string;
      source: TrainingActivity["source"];
      startDate: string;
      duration?: number | null;
    } | null;
  } | null;
  moments: Record<NutritionMoment, NutritionMomentPlan>;
};

function dayTypeFromCheckin(checkin?: CheckinInput): string {
  if (!checkin?.trainingType || checkin.trainingType === 'rest') return 'rest';
  const dur = checkin.durationMin ?? 0;
  const intensity = (checkin.intensity ?? '').toLowerCase();
  if (intensity === 'high' || dur >= DAY_TYPE_THRESHOLDS.highDurationMin) return 'high';
  if (intensity === 'moderate' || dur >= DAY_TYPE_THRESHOLDS.moderateDurationMin) return 'moderate';
  if (dur > 0) return 'low';
  return 'rest';
}

const canonicalDayType = (planEntry?: NutritionPlanEntry, checkin?: CheckinInput, defaultDayType?: string): string => {
  if (planEntry) return planEntry.dayType ?? "moderate";
  const fromCheckin = dayTypeFromCheckin(checkin);
  // When no training data at all, fall back to ACWR-based inference if provided
  if (fromCheckin === "rest" && !checkin?.trainingType && defaultDayType) return defaultDayType;
  return fromCheckin;
};

const pickFoods = (moment: NutritionMoment, focus: string | null, daySeed: number = 0): FoodOption[] => {
  const candidates = foodCatalog.filter((option) => {
    if (option.moment !== moment) return false;
    if (focus && !option.focus.includes(focus)) return false;
    return true;
  });
  const pool = candidates.length > 0
    ? candidates
    : foodCatalog.filter((option) => option.moment === moment);
  if (pool.length <= 3) return pool;
  // Rotate selection based on day seed so different days get different foods
  const offset = daySeed % pool.length;
  const picked: FoodOption[] = [];
  for (let i = 0; i < 3; i++) {
    picked.push(pool[(offset + i) % pool.length]);
  }
  return picked;
};

const describeFoods = (foods: FoodOption[]) =>
  foods.map((food) => `${food.name} (${food.portion})`).join(" o ") || "Opciones no disponibles";

const sessionLabel = (entry?: NutritionPlanEntry) => {
  if (!entry) return "día de carga ligera";
  const duration = entry.durationMinutes ? `${Math.round(entry.durationMinutes)} min` : "";
  const tssPart = entry.tss ? ` · ${Math.round(entry.tss)} TSS` : "";
  return `${entry.sessionType} • ${entry.title}${duration ? ` · ${duration}` : ""}${tssPart}`;
};

export function buildNutritionPlan(params: {
  planEntry?: NutritionPlanEntry;
  loads: { atl: number | null; ctl: number | null; acwr: number | null };
  checkin?: CheckinInput;
  userWeightKg?: number | null;
  defaultDayType?: string;
}) {
  const { planEntry, loads } = params;

  const baseDayType = canonicalDayType(planEntry, params.checkin, params.defaultDayType);
  const baseFocus = planEntry?.focus ?? (baseDayType === "rest" ? "maintenance" : null);
  const durationMin = planEntry?.durationMinutes ?? params.checkin?.durationMin ?? 0;
  const baseRequiresIntra = !!planEntry?.requiresIntraFuel || durationMin >= INTRA_FUEL_THRESHOLD_MIN;

  const { dayType, requiresIntraFuel: requiresIntra, recoveryFocus } = resolveCheckinModifiers(
    baseDayType, baseRequiresIntra, params.checkin
  );
  const focus = recoveryFocus ? "recovery" : baseFocus;

  const entryLabel = sessionLabel(planEntry);

  // Day-based seed for food rotation (different foods each day)
  const today = new Date();
  const daySeed = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate();

  const preFoods = pickFoods("preWorkout", focus, daySeed);
  const intraFoods = requiresIntra ? pickFoods("intraWorkout", focus, daySeed) : [];
  const postFoods = pickFoods("postWorkout", focus, daySeed);
  const dinnerFoods = pickFoods("dinner", focus, daySeed);

  const summary = planEntry
    ? `Hoy la sesión es ${entryLabel} con una carga ${dayType}.`
    : `Hoy no hay sesión planificada; el foco es mantenimiento y recuperación.`;
  const sodiumNote = durationMin >= SODIUM_THRESHOLD_MIN
    ? ` Sesión larga (${durationMin} min): incluí ${SODIUM_TARGET_MG_PER_H.min}–${SODIUM_TARGET_MG_PER_H.max} mg de sodio/hora para prevenir fatiga por electrolitos.`
    : '';
  const reasoning = planEntry
    ? `${buildIntraReasoning(durationMin, requiresIntra)} ${buildPersonalizedPostReasoning(dayType, params.userWeightKg ?? null)}${sodiumNote}`
    : buildPersonalizedPostReasoning('rest', null);

  const buildMoment = (moment: NutritionMoment, foods: FoodOption[]) => {
    if (moment === "intraWorkout" && !requiresIntra) {
      return { text: "No se requiere intra fueling para esta sesión.", foods };
    }
    if (foods.length === 0) {
      return { text: "Opciones no disponibles.", foods };
    }

    const weightKg = params.userWeightKg ?? null;
    const parts: string[] = [];

    if (moment === "intraWorkout" && requiresIntra) {
      const target = INTRA_CARBS_TARGET[getDurationBucket(durationMin)];
      for (const food of foods) {
        if (food.carbs > 0 && target.max > 0) {
          const n = Math.ceil(target.min / food.carbs);
          const m = Math.ceil(target.max / food.carbs);
          parts.push(`${food.name} (${food.carbs} g CHO/${food.portion}): ${n}–${m} por hora`);
        } else {
          parts.push(`${food.name} (${food.portion})`);
        }
      }
      parts.push(`Objetivo: ${target.label}`);
      return { text: parts.join('. '), foods };
    }

    if (moment === "postWorkout") {
      for (const food of foods) {
        if (weightKg) {
          const pMin = Math.round(weightKg * POST_PROTEIN_G_PER_KG.min);
          const pMax = Math.round(weightKg * POST_PROTEIN_G_PER_KG.max);
          if (dayType === 'high') {
            const cMin = Math.round(weightKg * POST_CARBS_G_PER_KG.min);
            const cMax = Math.round(weightKg * POST_CARBS_G_PER_KG.max);
            parts.push(`${food.name}: ${food.protein} g PRO (necesitás ${pMin}–${pMax} g), ${food.carbs} g CHO (necesitás ${cMin}–${cMax} g)`);
          } else {
            parts.push(`${food.name}: ${food.protein} g PRO (necesitás ${pMin}–${pMax} g), ${food.carbs} g CHO`);
          }
        } else {
          parts.push(`${food.name}: ${food.protein} g PRO, ${food.carbs} g CHO (${food.kcal} kcal)`);
        }
      }
      return { text: parts.join('. O: '), foods };
    }

    // preWorkout, snack, dinner
    for (const food of foods) {
      parts.push(`${food.name}: ${food.carbs} g CHO, ${food.protein} g PRO (${food.kcal} kcal)`);
    }
    return { text: parts.join('. O: '), foods };
  };

  const plan: NutritionPlanResponse = {
    summary,
    reasoning,
    dayType,
    focus,
    loads,
    planEntry: planEntry
      ? {
          id: planEntry.id,
          title: planEntry.title,
          sessionType: planEntry.sessionType,
          durationMinutes: planEntry.durationMinutes,
          tss: planEntry.tss,
          matchedActivityName: planEntry.matchedActivity?.name ?? undefined,
          matchedActivity: planEntry.matchedActivity
            ? {
                id: planEntry.matchedActivity.id,
                name: planEntry.matchedActivity.name,
                source: planEntry.matchedActivity.source,
                startDate:
                  typeof planEntry.matchedActivity.startDate === "string"
                    ? planEntry.matchedActivity.startDate
                    : planEntry.matchedActivity.startDate.toISOString(),
                duration: planEntry.matchedActivity.duration,
              }
            : null,
        }
      : null,
    moments: {
      preWorkout: buildMoment("preWorkout", preFoods),
      intraWorkout: buildMoment("intraWorkout", intraFoods),
      postWorkout: buildMoment("postWorkout", postFoods),
      snack: buildMoment("snack", pickFoods("snack", focus, daySeed)),
      dinner: buildMoment("dinner", dinnerFoods),
    },
  };

  return plan;
}
