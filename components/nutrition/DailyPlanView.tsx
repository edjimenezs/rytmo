'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MomentAccordion from '@/components/nutrition/MomentAccordion';

type FoodItem = {
  name: string;
  portion: string;
};

type MomentData = {
  text: string;
  foods: FoodItem[];
};

type PlanData = {
  summary: string;
  aiHeadline: string | null;
  aiMomentTexts: Record<string, string> | null;
  momentMealNames: Record<string, string>;
  moments: Record<string, MomentData>;
  date: string;
};

const momentOrder = ['preWorkout', 'intraWorkout', 'postWorkout', 'dinner'] as const;
const iconMap = {
  preWorkout: 'sun',
  intraWorkout: 'bolt',
  postWorkout: 'fork',
  dinner: 'moon',
} as const;

export default function DailyPlanView() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckin, setHasCheckin] = useState<boolean>(true);
  const [openMoment, setOpenMoment] = useState<string>('preWorkout');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // Check if check-in exists
        const checkinRes = await fetch('/api/checkin');
        if (!active) return;

        if (checkinRes.status === 404 || !checkinRes.ok) {
          const checkinData = await checkinRes.json().catch(() => ({}));
          if (!checkinData?.checkin) {
            setHasCheckin(false);
            setLoading(false);
            return;
          }
        } else {
          const checkinData = await checkinRes.json();
          if (!checkinData?.checkin) {
            setHasCheckin(false);
            setLoading(false);
            return;
          }
        }

        // Fetch plan
        const planRes = await fetch('/api/daily-plan');
        if (!active) return;

        if (!planRes.ok) {
          throw new Error('fetch-failed');
        }

        const data = await planRes.json();
        if (!active) return;

        setPlan(data.plan);
      } catch {
        if (active) setError('No pudimos cargar tu plan.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`rounded-2xl bg-gray-100 animate-pulse ${
              i === 1 ? 'h-24' : i === 4 ? 'h-16' : 'h-20'
            }`}
          />
        ))}
        <p className="text-sm text-gray-500 text-center">Cargando tu plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-5 space-y-2">
        <p className="text-sm font-semibold text-red-800">No pudimos cargar tu plan.</p>
        <p className="text-sm text-red-700">Revisa tu conexion y recarga la pagina.</p>
      </div>
    );
  }

  if (!hasCheckin) {
    return (
      <div className="text-center space-y-4 py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Aun no registraste tu dia</h2>
        <p className="text-sm text-gray-500">
          Completa el check-in para ver tus recomendaciones de hoy.
        </p>
        <Link
          href="/checkin"
          className="inline-block w-full min-h-[52px] leading-[52px] text-center rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          Hacer check-in
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-2xl bg-red-50 p-5 space-y-2">
        <p className="text-sm font-semibold text-red-800">No pudimos cargar tu plan.</p>
        <p className="text-sm text-red-700">Revisa tu conexion y recarga la pagina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {plan.aiHeadline ?? plan.summary}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(plan.date).toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <div className="space-y-3">
        {momentOrder.map((m) => {
          const mealName = plan.momentMealNames?.[m] ?? m;
          if (mealName === '(incluido en cena)') return null;

          const momentData = plan.moments?.[m];
          if (!momentData) return null;

          return (
            <MomentAccordion
              key={m}
              mealName={mealName}
              aiText={plan.aiMomentTexts?.[m] ?? null}
              foods={momentData.foods.map((f) => ({ name: f.name, portion: f.portion }))}
              isOpen={openMoment === m}
              onToggle={() => setOpenMoment((prev) => (prev === m ? '' : m))}
              icon={iconMap[m]}
            />
          );
        })}
      </div>

      <Link
        href="/feedback"
        className="block w-full min-h-[52px] leading-[52px] text-center rounded-2xl border border-blue-600 text-blue-600 text-base font-semibold hover:bg-blue-50 transition-colors"
      >
        Como te fue?
      </Link>
    </div>
  );
}
