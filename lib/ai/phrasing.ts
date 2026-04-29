import { askLLM } from '@/lib/ai/llm';
import { NutritionMoment, NutritionPlanResponse } from '@/lib/nutrition/engine';

// Local type to avoid circular dependency with Prisma DailyCheckin
type CheckinInput = {
  fatigue?: number | null;
  sleepHours?: number | null;
  intensity?: string | null;
  trainingType?: string | null;
  durationMin?: number | null;
  timeOfDay?: string | null;
};

export const MOMENT_MEAL_NAMES: Record<
  NutritionMoment,
  Record<'morning' | 'midday' | 'evening', string>
> = {
  preWorkout:   { morning: 'Desayuno',           midday: 'Snack media manana', evening: 'Snack de tarde' },
  intraWorkout: { morning: 'Durante el entreno', midday: 'Durante el entreno', evening: 'Durante el entreno' },
  postWorkout:  { morning: 'Snack post-entreno', midday: 'Almuerzo',           evening: 'Cena post-entreno' },
  dinner:       { morning: 'Cena',               midday: 'Cena',               evening: '(incluido en cena)' },
  snack:        { morning: 'Snack tarde',        midday: 'Snack tarde',        evening: 'Snack tarde' },
};

export function mapMomentToMealName(
  moment: NutritionMoment,
  trainingTime: 'morning' | 'midday' | 'evening'
): string {
  return MOMENT_MEAL_NAMES[moment][trainingTime];
}

export function deterministicFallback(
  plan: NutritionPlanResponse,
  trainingTime: 'morning' | 'midday' | 'evening'
): { headline: string; moments: Record<NutritionMoment, string> } {
  const dayLabels: Record<string, string> = {
    rest:     'descanso',
    high:     'alta carga',
    moderate: 'carga moderada',
    low:      'carga baja',
  };
  const dayLabel = dayLabels[plan.dayType] ?? plan.dayType;

  const headlineMap: Record<string, string> = {
    rest:     'Dia de descanso. El plan apoya recuperacion activa.',
    high:     'Dia de alta carga. El plan prioriza energia y recuperacion.',
    moderate: 'Dia de carga moderada. El plan balancea energia y nutricion.',
  };
  const headline = headlineMap[plan.dayType] ?? 'Dia liviano. El plan apoya activacion sin sobrecargar.';

  const moments = {} as Record<NutritionMoment, string>;
  const momentKeys: NutritionMoment[] = ['preWorkout', 'intraWorkout', 'postWorkout', 'snack', 'dinner'];

  for (const moment of momentKeys) {
    const mealName = mapMomentToMealName(moment, trainingTime);
    const foods = plan.moments[moment]?.foods ?? [];

    if (foods.length === 0) {
      moments[moment] = `${mealName}: no se requiere para esta sesion.`;
    } else {
      const foodList = foods
        .slice(0, 2)
        .map((f) => `${f.name} (${f.portion})`)
        .join(' o ');
      moments[moment] = `${mealName}: dia de ${dayLabel}. Opciones: ${foodList}.`;
    }
  }

  return { headline, moments };
}

const PHRASING_SYSTEM_PROMPT = `Eres un coach de nutricion deportiva cercano. Hablas en espanol chileno informal con tuteo. Tu respuesta debe ser un JSON con estructura: { "headline": string, "moments": { "preWorkout": string, "intraWorkout": string, "postWorkout": string, "dinner": string, "snack": string } }. Cada campo de momento tiene 1-2 frases. El headline tiene 1 frase. No menciones macros ni gramos. Refierete a los alimentos por su nombre. Incluye el 'por que' conectado al check-in del dia. Responde SOLO con el JSON, sin texto adicional.`;

export async function generateMomentPhrasing(
  plan: NutritionPlanResponse,
  checkin: CheckinInput | null,
  trainingTime: 'morning' | 'midday' | 'evening',
  isTestUser: boolean = false
): Promise<{ headline: string; moments: Record<NutritionMoment, string> } | null> {
  try {
    const momentKeys: NutritionMoment[] = ['preWorkout', 'intraWorkout', 'postWorkout', 'snack', 'dinner'];

    const momentsSummary = momentKeys
      .map((m) => {
        const mealName = mapMomentToMealName(m, trainingTime);
        const foods = plan.moments[m]?.foods ?? [];
        const foodList = foods.map((f) => `${f.name} (${f.portion})`).join(', ');
        return `- ${mealName} (${m}): ${foodList || 'sin alimentos'}`;
      })
      .join('\n');

    const checkinSummary = checkin
      ? [
          checkin.fatigue != null ? `fatiga: ${checkin.fatigue}/5` : null,
          checkin.sleepHours != null ? `sueno: ${checkin.sleepHours}h` : null,
          checkin.trainingType ? `tipo entreno: ${checkin.trainingType}` : null,
          checkin.intensity ? `intensidad: ${checkin.intensity}` : null,
        ]
          .filter(Boolean)
          .join(', ')
      : 'sin check-in del dia';

    const prompt = `Genera el texto del plan nutricional de hoy.

Resumen del dia: ${plan.summary}
Tipo de dia: ${plan.dayType}
Foco: ${plan.focus ?? 'general'}
Hora de entrenamiento: ${trainingTime}
Razonamiento cientifico: ${plan.reasoning}

Alimentos por momento:
${momentsSummary}

Check-in del atleta: ${checkinSummary}

Responde SOLO con el JSON pedido.`;

    // AI_TIER=test or isTestUser flag → haiku (4× cheaper); production → sonnet
    const isTestTier = process.env.AI_TIER === 'test' || isTestUser;
    const model = isTestTier ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6-20250514';

    const result = await askLLM(prompt, {
      provider: 'anthropic',
      model,
      system: PHRASING_SYSTEM_PROMPT,
    });

    if (!result) return null;

    // Strip markdown code blocks if present
    const cleaned = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.moments !== 'object' ||
      parsed.moments === null
    ) {
      return null;
    }

    return {
      headline: parsed.headline,
      moments: parsed.moments as Record<NutritionMoment, string>,
    };
  } catch (error) {
    console.error('AI phrasing failed:', error);
    return null;
  }
}
