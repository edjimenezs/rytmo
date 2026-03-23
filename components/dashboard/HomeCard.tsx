'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomeCard() {
  const [hasCheckin, setHasCheckin] = useState<boolean | null>(null);
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const checkinRes = await fetch('/api/checkin');
        if (!active) return;

        const checkinData = await checkinRes.json().catch(() => ({}));

        if (!checkinData?.checkin) {
          setHasCheckin(false);
          return;
        }

        setHasCheckin(true);

        // Fetch plan to get headline
        try {
          const planRes = await fetch('/api/daily-plan');
          if (!active) return;
          if (planRes.ok) {
            const planData = await planRes.json();
            if (active) {
              setHeadline(planData?.plan?.aiHeadline ?? planData?.plan?.summary ?? null);
            }
          }
        } catch {
          // Plan fetch failure is non-critical — HomeCard still shows CTA
        }
      } catch {
        if (active) setHasCheckin(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (hasCheckin === null) {
    return <div className="rounded-2xl bg-gray-100 animate-pulse h-32" />;
  }

  if (!hasCheckin) {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <p className="text-base text-gray-700">Aun no registraste tu dia</p>
        <Link
          href="/checkin"
          className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          Hacer check-in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900">{headline ?? 'Plan listo'}</h2>
      <Link
        href="/plan"
        className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
      >
        Ver tu plan
      </Link>
    </div>
  );
}
