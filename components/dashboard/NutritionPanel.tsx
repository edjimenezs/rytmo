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

type MomentLog = { foodName?: string; customFood?: string };

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
  const [foodLogs, setFoodLogs] = useState<Partial<Record<NutritionMoment, MomentLog>>>({});
  const [customInputs, setCustomInputs] = useState<Partial<Record<NutritionMoment, string>>>({});
  const [showCustom, setShowCustom] = useState<Partial<Record<NutritionMoment, boolean>>>({});
  const [saving, setSaving] = useState<Partial<Record<NutritionMoment, boolean>>>({});

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

  // Load today's food logs after plan is fetched
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/food-log');
        if (!res.ok) return;
        const data = await res.json();
        const mapped: Partial<Record<NutritionMoment, MomentLog>> = {};
        for (const log of data.logs as { moment: string; foodName?: string; customFood?: string }[]) {
          mapped[log.moment as NutritionMoment] = { foodName: log.foodName ?? undefined, customFood: log.customFood ?? undefined };
        }
        setFoodLogs(mapped);
      } catch {
        // non-critical
      }
    };
    fetchLogs();
  }, []);

  const logFood = async (moment: NutritionMoment, foodName: string) => {
    setSaving((s) => ({ ...s, [moment]: true }));
    try {
      await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment,
          foodName,
          wasRecommended: true,
          recommendationId: plan?.id,
        }),
      });
      setFoodLogs((prev) => ({ ...prev, [moment]: { foodName } }));
      setShowCustom((s) => ({ ...s, [moment]: false }));
    } finally {
      setSaving((s) => ({ ...s, [moment]: false }));
    }
  };

  const logCustomFood = async (moment: NutritionMoment) => {
    const customFood = customInputs[moment]?.trim();
    if (!customFood) return;
    setSaving((s) => ({ ...s, [moment]: true }));
    try {
      await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment,
          customFood,
          wasRecommended: false,
          recommendationId: plan?.id,
        }),
      });
      setFoodLogs((prev) => ({ ...prev, [moment]: { customFood } }));
      setShowCustom((s) => ({ ...s, [moment]: false }));
    } finally {
      setSaving((s) => ({ ...s, [moment]: false }));
    }
  };

  const momentum = useMemo(() => plan?.dayType ?? 'rest', [plan]);

  const renderFoods = (moment: NutritionMoment, foods: FoodOption[]) => {
    const log = foodLogs[moment];
    const isSaving = saving[moment];

    if (!foods.length) {
      return <p className="text-xs text-slate-500">Sin sugerencias específicas.</p>;
    }

    return (
      <div className="space-y-3">
        <ul className="space-y-2">
          {foods.map((food) => {
            const isLogged = log?.foodName === food.name;
            return (
              <li key={food.name} className={`flex justify-between items-start gap-3 p-2 rounded-xl transition-colors ${isLogged ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{food.name}</p>
                  <p className="text-xs text-slate-500">{food.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {food.carbs}g C · {food.protein}g P · {food.fat}g G
                  </p>
                </div>
                {isLogged ? (
                  <span className="text-xs font-semibold text-emerald-600 shrink-0 mt-0.5">✓ Comido</span>
                ) : log ? null : (
                  <button
                    onClick={() => logFood(moment, food.name)}
                    disabled={isSaving}
                    className="text-xs shrink-0 px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Comí esto
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Custom food already logged */}
        {log?.customFood && (
          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
            <span className="font-semibold">✓ Comiste:</span> {log.customFood}
          </p>
        )}

        {/* Comí otra cosa section */}
        {!log && (
          showCustom[moment] ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="¿Qué comiste?"
                value={customInputs[moment] ?? ''}
                onChange={(e) => setCustomInputs((s) => ({ ...s, [moment]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && logCustomFood(moment)}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
                autoFocus
              />
              <button
                onClick={() => logCustomFood(moment)}
                disabled={isSaving || !customInputs[moment]?.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowCustom((s) => ({ ...s, [moment]: false }))}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustom((s) => ({ ...s, [moment]: true }))}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Comí otra cosa
            </button>
          )
        )}
      </div>
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
              const isLogged = !!foodLogs[moment.key];
              return (
                <div key={moment.key} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                      <p className="text-xs text-slate-500">{moment.description}</p>
                    </div>
                    {isLogged && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">✓ Registrado</span>
                    )}
                    {!isLogged && (
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">Momento</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{momentPlan.text}</p>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">Opciones sugeridas</h4>
                    {renderFoods(moment.key, momentPlan.foods)}
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
