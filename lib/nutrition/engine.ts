import { foodCatalog, FoodOption } from "./catalog";
import type { TrainingActivity } from "@prisma/client";

type CheckinInput = {
  fatigue?: number | null;
  sleepHours?: number | null;
  intensity?: string | null;
  trainingType?: string | null;
  durationMin?: number | null;
};

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

  // High fatigue: downgrade perceived intensity
  if (checkin.fatigue != null && checkin.fatigue >= 4) {
    if (dayType === 'high') dayType = 'moderate';
    requiresIntraFuel = false;
  }

  // Poor sleep: force recovery focus on dinner
  const recoveryFocus = checkin.sleepHours != null && checkin.sleepHours < 6;

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

const canonicalDayType = (planEntry?: NutritionPlanEntry): string => {
  if (!planEntry) return "rest";
  return planEntry.dayType ?? "moderate";
};

const pickFoods = (moment: NutritionMoment, focus: string | null): FoodOption[] => {
  const candidates = foodCatalog.filter((option) => {
    if (option.moment !== moment) return false;
    if (focus && !option.focus.includes(focus)) return false;
    return true;
  });
  if (candidates.length === 0) {
    return foodCatalog.filter((option) => option.moment === moment).slice(0, 2);
  }
  return candidates.slice(0, 2);
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
}) {
  const { planEntry, loads } = params;

  const baseDayType = canonicalDayType(planEntry);
  const baseFocus = planEntry?.focus ?? (baseDayType === "rest" ? "maintenance" : null);
  const baseRequiresIntra = !!planEntry?.requiresIntraFuel || baseDayType === "high";

  const { dayType, requiresIntraFuel: requiresIntra, recoveryFocus } = resolveCheckinModifiers(
    baseDayType, baseRequiresIntra, params.checkin
  );
  const focus = recoveryFocus ? "recovery" : baseFocus;

  const entryLabel = sessionLabel(planEntry);

  const preFoods = pickFoods("preWorkout", focus);
  const intraFoods = requiresIntra ? pickFoods("intraWorkout", focus) : [];
  const postFoods = pickFoods("postWorkout", focus);
  const dinnerFoods = pickFoods("dinner", focus);

  const summary = planEntry
    ? `Hoy la sesión es ${entryLabel} con una carga ${dayType}.`
    : `Hoy no hay sesión planificada; el foco es mantenimiento y recuperación.`;
  const reasoning = planEntry
    ? requiresIntra
      ? `Según la carga ${dayType}, necesitás intra para sostener la intensidad y luego recuperar con carbs + proteína.`
      : `La sesión es moderada; priorizá comidas suaves para mantener energía y apoyar la recuperación.`
    : `Cargas bajas y descanso. Mantén ingestas ligeras, balanceadas y prioriza sueño + hidratación.`;

  const buildMoment = (moment: NutritionMoment, foods: FoodOption[]) => ({
    text: moment === "intraWorkout" && !requiresIntra
      ? "No se requiere intra fueling para esta sesión."
      : `Sugiero: ${describeFoods(foods)}.`,
    foods,
  });

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
      snack: buildMoment("snack", pickFoods("snack", focus)),
      dinner: buildMoment("dinner", dinnerFoods),
    },
  };

  return plan;
}
