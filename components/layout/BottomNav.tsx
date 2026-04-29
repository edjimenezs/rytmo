'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' as const },
  { href: '/dashboard/activities', label: 'Actividades', icon: 'list' as const },
  { href: '/plan', label: 'Plan', icon: 'calendar' as const },
  { href: '/dashboard/settings', label: 'Yo', icon: 'person' as const },
];

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const iconComponents = {
  home: HomeIcon,
  list: ListIcon,
  calendar: CalendarIcon,
  person: PersonIcon,
};

const HIDDEN_PATHS = ['/', '/auth/login', '/auth/register'];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname ?? '')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 z-50 flex pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(tab.href) ?? false;

        const IconComponent = iconComponents[tab.icon];

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-[44px] ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <IconComponent />
            <span className="text-[11px] font-normal">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
