'use client';

export type MomentKey = 'preWorkout' | 'intraWorkout' | 'postWorkout' | 'snack' | 'dinner';

export type MomentFoodItem = {
  name: string;
  portion: string;
  carbs: number;
  protein: number;
  fat: number;
  kcal: number;
};

type MomentCardProps = {
  momentKey: MomentKey;
  mealName: string;
  timingHint: string;
  aiText: string | null;
  foods: MomentFoodItem[];
};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SnackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

const iconComponents = { sun: SunIcon, bolt: BoltIcon, fork: ForkIcon, moon: MoonIcon, snack: SnackIcon };

function MacroPill({ momentKey, food }: { momentKey: MomentKey; food: MomentFoodItem }) {
  if (momentKey === 'intraWorkout') {
    return (
      <span className="text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
        {food.carbs}g CHO
      </span>
    );
  }
  if (momentKey === 'postWorkout') {
    return (
      <span className="text-xs text-gray-500">
        {food.protein}g PRO · {food.carbs}g CHO
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-500">
      {food.carbs}g CHO · {food.protein}g PRO · {food.kcal} kcal
    </span>
  );
}

export default function MomentCard({
  momentKey,
  mealName,
  timingHint,
  aiText,
  foods,
}: MomentCardProps) {
  const IconComponent = iconComponents[_iconKey(momentKey)];

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-blue-500">
            <IconComponent />
          </span>
          <span className="text-base font-semibold text-gray-900">{mealName}</span>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
          {timingHint}
        </span>
      </div>

      {/* AI text */}
      {aiText && (
        <p className="px-5 pb-3 text-sm text-gray-500 italic leading-relaxed">{aiText}</p>
      )}

      {/* Food list */}
      {foods.length > 0 ? (
        <div className="px-5 pb-5 space-y-3">
          {foods.map((food, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="border-t border-gray-100 mb-3" />}
              <p className="text-sm font-semibold text-gray-900">{food.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{food.portion}</span>
                <MacroPill momentKey={momentKey} food={food} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 pb-5 text-sm text-gray-400">Sin sugerencias para este momento.</p>
      )}
    </div>
  );
}

function _iconKey(momentKey: MomentKey): 'sun' | 'bolt' | 'fork' | 'moon' | 'snack' {
  const map: Record<MomentKey, 'sun' | 'bolt' | 'fork' | 'moon' | 'snack'> = {
    preWorkout: 'sun',
    intraWorkout: 'bolt',
    postWorkout: 'fork',
    snack: 'snack',
    dinner: 'moon',
  };
  return map[momentKey];
}
