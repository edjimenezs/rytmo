/**
 * Evidence-based fueling thresholds for endurance athletes.
 *
 * Sources:
 * - Vitale & Getzin (2019) — Nutrition and Supplement Update for the Endurance Athlete, PMC6628334
 * - Beck et al. (2015) — Role of Nutrition in Performance Enhancement, PMC4540168
 * - Barrero et al. (2015) — Energy Balance in Ultra-Endurance Triathlon, PMC4303834
 * - Miguel-Ortega et al. (2025) — Triathlon Ergo Nutrition, PMC12157197
 */

export type DurationBucket = 'under60' | '60to150' | 'over150';

export function getDurationBucket(durationMin: number): DurationBucket {
  if (durationMin < 60) return 'under60';
  if (durationMin < 150) return '60to150';
  return 'over150';
}

/**
 * Carbohydrate intake targets during exercise (g/hour).
 * For >150min, multiple CHO sources (glucose+fructose) are needed to reach upper range.
 */
export const INTRA_CARBS_TARGET: Record<DurationBucket, { min: number; max: number; label: string }> = {
  under60:  { min: 0,  max: 0,  label: 'No se necesitan carbohidratos intra (sesión <60 min)' },
  '60to150':  { min: 30, max: 60, label: '30–60 g/hora' },
  over150: { min: 60, max: 90, label: '60–90 g/hora (fuentes múltiples)' },
};

/** Sessions over this duration require active intra-workout fueling. */
export const INTRA_FUEL_THRESHOLD_MIN = 60;

/**
 * Post-exercise protein target.
 * 0.25–0.3 g/kg of high-quality protein within 2h maximizes muscle protein synthesis.
 */
export const POST_PROTEIN_G_PER_KG = { min: 0.25, max: 0.3 };
export const POST_PROTEIN_WINDOW_H = 2;

/**
 * Post-exercise CHO for glycogen repletion (high-intensity or long sessions).
 * 1.0–1.2 g/kg in the first 3–5h post-exercise.
 */
export const POST_CARBS_G_PER_KG = { min: 1.0, max: 1.2 };
export const POST_CARBS_WINDOW_H = 5;

/**
 * Sodium targets during exercise.
 * Activate when session >2h or high sweat conditions.
 */
export const SODIUM_THRESHOLD_MIN = 120;
export const SODIUM_TARGET_MG_PER_H = { min: 300, max: 600 };

/**
 * Day-type thresholds derived from duration and intensity.
 * Aligns with Vitale 2019 daily CHO recommendations by exercise load.
 */
export const DAY_TYPE_THRESHOLDS = {
  highDurationMin: 90,
  moderateDurationMin: 45,
} as const;

/**
 * Returns a human-readable reasoning string based on session parameters.
 */
export function buildIntraReasoning(durationMin: number, requiresIntra: boolean): string {
  if (!requiresIntra) {
    return 'La sesión no requiere intra-fueling (duración <60 min o descanso).';
  }
  const bucket = getDurationBucket(durationMin);
  const target = INTRA_CARBS_TARGET[bucket];
  return `Sesión de ${durationMin} min → objetivo intra: ${target.label}.`;
}

/**
 * Returns a reasoning string for post-workout nutrition.
 */
export function buildPostReasoning(dayType: string): string {
  if (dayType === 'rest') {
    return 'Día de descanso: mantén ingestas equilibradas, sin urgencia de ventana post-entreno.';
  }
  const intensity = dayType === 'high'
    ? 'Sesión intensa'
    : dayType === 'moderate'
    ? 'Sesión moderada'
    : 'Sesión ligera';
  return `${intensity}: consumí proteína de calidad dentro de ${POST_PROTEIN_WINDOW_H}h post-entreno para maximizar síntesis muscular.`;
}

/**
 * Personalized post-workout reasoning using athlete weight.
 * Falls back to generic targets when weight is unavailable.
 */
export function buildPersonalizedPostReasoning(dayType: string, weightKg: number | null): string {
  if (dayType === 'rest') {
    return 'Día de descanso: mantén ingestas equilibradas, sin urgencia de ventana post-entreno.';
  }
  const intensity = dayType === 'high'
    ? 'Sesión intensa'
    : dayType === 'moderate'
    ? 'Sesión moderada'
    : 'Sesión ligera';

  if (!weightKg) {
    return `${intensity}: consumí proteína de calidad dentro de ${POST_PROTEIN_WINDOW_H}h post-entreno para maximizar síntesis muscular.`;
  }

  const proteinMin = Math.round(weightKg * POST_PROTEIN_G_PER_KG.min);
  const proteinMax = Math.round(weightKg * POST_PROTEIN_G_PER_KG.max);

  if (dayType === 'high') {
    const carbsMin = Math.round(weightKg * POST_CARBS_G_PER_KG.min);
    const carbsMax = Math.round(weightKg * POST_CARBS_G_PER_KG.max);
    return `${intensity}: ${proteinMin}–${proteinMax} g proteína + ${carbsMin}–${carbsMax} g CHO dentro de ${POST_PROTEIN_WINDOW_H}h para reponer glucógeno y maximizar síntesis muscular.`;
  }

  return `${intensity}: ${proteinMin}–${proteinMax} g proteína de calidad dentro de ${POST_PROTEIN_WINDOW_H}h post-entreno.`;
}
