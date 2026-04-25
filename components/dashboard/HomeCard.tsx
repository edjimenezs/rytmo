'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomeCard() {
  const [state, setState] = useState<'loading' | 'activity' | 'checkin' | 'empty'>('loading');
  const [headline, setHeadline] = useState<string | null>(null);
  const [hasCheckin, setHasCheckin] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [checkinRes, activityRes] = await Promise.all([
          fetch('/api/checkin'),
          fetch('/api/checkin/from-activity'),
        ]);
        if (!active) return;

        const checkinData = await checkinRes.json().catch(() => ({}));
        const activityData = await activityRes.json().catch(() => ({}));

        const checkin = !!checkinData?.checkin;
        const hasActivity = !!activityData?.activity;
        setHasCheckin(checkin);

        if (!checkin && !hasActivity) {
          setState('empty');
          return;
        }

        setState(checkin ? 'checkin' : 'activity');

        try {
          const planRes = await fetch('/api/daily-plan');
          if (!active) return;
          if (planRes.ok) {
            const planData = await planRes.json();
            if (active) setHeadline(planData?.plan?.aiHeadline ?? planData?.plan?.summary ?? null);
          }
        } catch { /* non-critical */ }
      } catch {
        if (active) setState('empty');
      }
    }

    load();
    return () => { active = false; };
  }, []);

  if (state === 'loading') {
    return <div className="rounded-2xl bg-gray-100 animate-pulse h-32" />;
  }

  if (state === 'empty') {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <p className="text-base text-gray-700">Sin actividad ni check-in por hoy</p>
        <Link
          href="/checkin"
          className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          Registrar día
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
      {!hasCheckin && (
        <Link
          href="/checkin"
          className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Agregar sueño y fatiga →
        </Link>
      )}
    </div>
  );
}
