const KEYWORD_MAP: Array<{ re: RegExp; icon: string }> = [
  { re: /rodillo|ride|cycling|bike|bicicleta|ciclismo|virtual.?ride|indoor.?cycling|spinning|rouvy/i, icon: '🚴' },
  { re: /run|running|fartlek|trote|maratón|marathon|trail|carrera|jog/i, icon: '🏃' },
  { re: /swim|natación|piscina|pool|lake.?lap|ocean|aguas.?abiertas/i, icon: '🏊' },
  { re: /walk|caminata|hiking|hike/i, icon: '🚶' },
  { re: /weight|gym|strength|fuerza|crossfit/i, icon: '🏋️' },
  { re: /yoga|pilates/i, icon: '🧘' },
];

const TYPE_FALLBACK: Record<string, string> = {
  RUNNING: '🏃',
  CYCLING: '🚴',
  SWIMMING: '🏊',
  WALKING: '🚶',
  WEIGHTLIFTING: '🏋️',
  YOGA: '🧘',
  OTHER: '⚡',
};

export function getActivityIcon(type: string, name?: string | null): string {
  if (name) {
    for (const { re, icon } of KEYWORD_MAP) {
      if (re.test(name)) return icon;
    }
  }
  return TYPE_FALLBACK[type] ?? '⚡';
}

export function isCyclingActivity(type: string, name?: string | null): boolean {
  if (type === 'CYCLING') return true;
  if (name && /rodillo|ride|cycling|bike|bicicleta|virtual.?ride|indoor.?cycling|spinning|rouvy/i.test(name)) return true;
  return false;
}

export function isSwimmingActivity(type: string, name?: string | null): boolean {
  if (type === 'SWIMMING') return true;
  if (name && /swim|natación|piscina|pool|lake.?lap|ocean|aguas.?abiertas/i.test(name)) return true;
  return false;
}
