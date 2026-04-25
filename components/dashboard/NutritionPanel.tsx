'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NutritionMoment, NutritionPlanResponse } from '@/lib/nutrition/engine';
import type { FoodOption } from '@/lib/nutrition/catalog';

type NutritionApiResponse = {
  plan: NutritionPlanResponse & {
    id: string;
    date: string;
  };
};

const momentDefinitions: Array<{ key: NutritionMoment; title: string; description: string }> = [
  { key: 'preWorkout', title: 'Antes de entrenar', description: 'Carga de energía lenta' },
  { key: 'intraWorkout', title: 'Durante la sesión', description: 'Mantener ritmo e hidratación' },
  { key: 'postWorkout', title: 'Inmediatamente después', description: 'Recuperación rápida' },
  { key: 'dinner', title: 'Cena / Regeneración', description: 'Carga suave + proteínas' },
];

const formatLoadValue = (value?: number | null) => (value !== null && value !== undefined ? value.toFixed(1) : '-');

export default function NutritionPanel() {
  const [plan, setPlan] = useState<NutritionPlanResponse & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/daily-plan');
        if (!res.ok) throw new Error('No se pudo cargar el plan de nutrición');
        const payload: NutritionApiResponse = await res.json();
        setPlan(payload.plan);
      } catch (err) {
        console.error('Daily nutrition plan failed', err);
        setError('No se pudo calcular el plan. Intenta de nuevo o sincroniza tus sesiones.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const momentum = useMemo(() => plan?.dayType ?? 'rest', [plan]);

  const renderFoods = (foods: FoodOption[]) => {
    if (!foods.length) {
      return <p className="text-xs text-slate-500">Sin sugerencias específicas.</p>;
    }
    return (
      <ul className="space-y-2">
        {foods.map((food) => (
          <li key={food.name} className="flex justify-between items-start gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{food.name}</p>
              <p className="text-xs text-slate-500">{food.description}</p>
            </div>
            <p className="text-[10px] text-slate-500">
              {food.carbs}g C · {food.protein}g P · {food.fat}g G
            </p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Plan nutricional inteligente</h3>
          <p className="text-sm text-slate-500">
            Combina tu TrainingPeaks/Strava, ATL/CTL y alimentación para sugerir qué comer antes, durante y después.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100">
            CTL {formatLoadValue(plan?.loads.ctl)} AU
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100">
            ATL {formatLoadValue(plan?.loads.atl)} AU
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100">
            ACWR {formatLoadValue(plan?.loads.acwr)}
          </span>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-slate-600">Analizando la sesión del día y los datos de carga ...</p>
      )}
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!loading && plan && (
        <>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 text-sm text-slate-500">
            <p>
              Hoy el foco es <strong className="text-slate-900">{momentum}</strong> y tu razón es:{' '}
              <span className="text-slate-900">{plan.reasoning}</span>
            </p>
            <p>Resumen: {plan.summary}</p>
            <p>
              Sesión: {plan.planEntry ? `${plan.planEntry.sessionType} · ${plan.planEntry.title}` : 'Descanso planificado'}
            </p>
            {plan.planEntry && (
              <p>
                Duración {plan.planEntry.durationMinutes ?? '—'} min · {plan.planEntry.tss ?? '—'} TSS · Actividad real:{' '}
                {plan.planEntry.matchedActivityName ?? 'pendiente'}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {momentDefinitions.map((moment) => {
              const momentPlan = plan.moments[moment.key];
              return (
                <div key={moment.key} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                      <p className="text-xs text-slate-500">{moment.description}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Momento</span>
                  </div>
                  <p className="text-sm text-slate-600">{momentPlan.text}</p>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">Opciones sugeridas</h4>
                    <div className="space-y-2">{renderFoods(momentPlan.foods)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
