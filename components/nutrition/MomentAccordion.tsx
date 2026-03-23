'use client';

type MomentAccordionProps = {
  mealName: string;
  aiText: string | null;
  foods: { name: string; portion: string }[];
  isOpen: boolean;
  onToggle: () => void;
  icon: 'sun' | 'bolt' | 'fork' | 'moon' | 'snack';
};

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="2" y1="10" x2="4" y2="10" />
      <line x1="16" y1="10" x2="18" y2="10" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="14.36" y1="14.36" x2="15.78" y2="15.78" />
      <line x1="4.22" y1="15.78" x2="5.64" y2="14.36" />
      <line x1="14.36" y1="5.64" x2="15.78" y2="4.22" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M11.5 2L4 11h6l-1.5 7L16 9h-6L11.5 2z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v4a2 2 0 002 2h0a2 2 0 002-2V2" />
      <line x1="8" y1="8" x2="8" y2="18" />
      <line x1="14" y1="2" x2="14" y2="7" />
      <path d="M12 7c0 1.1.9 2 2 2s2-.9 2-2V2" />
      <line x1="14" y1="9" x2="14" y2="18" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}

function SnackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="5 8 10 13 15 8" />
    </svg>
  );
}

const iconComponents = {
  sun: SunIcon,
  bolt: BoltIcon,
  fork: ForkIcon,
  moon: MoonIcon,
  snack: SnackIcon,
};

export default function MomentAccordion({
  mealName,
  aiText,
  foods,
  isOpen,
  onToggle,
  icon,
}: MomentAccordionProps) {
  const IconComponent = iconComponents[icon];
  const displayFoods = foods.slice(0, 3);

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <span className="text-gray-400">
            <IconComponent />
          </span>
          <span className="text-xl font-semibold text-gray-900 ml-3">{mealName}</span>
        </div>
        <span className="text-gray-400">
          <ChevronIcon open={isOpen} />
        </span>
      </div>

      {/* Closed preview */}
      {!isOpen && displayFoods[0] && (
        <p className="px-5 pb-3 text-sm text-gray-500 truncate">{displayFoods[0].name}</p>
      )}

      {/* Open content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        {aiText && (
          <p className="px-5 text-sm text-gray-700 mb-3">{aiText}</p>
        )}

        {displayFoods.length > 0 && (
          <div className="px-5 pb-5 space-y-2">
            {displayFoods.map((food, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-semibold text-gray-900">{food.name}</span>
                <span className="text-gray-500"> · {food.portion}</span>
              </div>
            ))}
          </div>
        )}

        {displayFoods.length === 0 && aiText && (
          <div className="pb-5" />
        )}
      </div>
    </div>
  );
}
