'use client';

import { useEffect, useState } from "react";

type PlanSession = {
  day: string;
  session: string;
  durationMin: number;
  intensity: string;
  notes: string;
};

export default function TrainingPlanPanel() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanSession[]>([]);
  const [weekLabel, setWeekLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/training/plan");
        if (!res.ok) throw new Error("No se pudo cargar el plan");
        const data = await res.json();
        setPlan(data.sessions || []);
        setWeekLabel(data.weekLabel || "");
        setError(null);
      } catch (error) {
        console.error("Error loading training plan:", error);
        setError("No se pudo obtener el plan. Revisa tu conexión o carga de datos.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Training Plan</h3>
          <p className="text-sm text-slate-600">Semana en curso · {weekLabel || "—"}</p>
        </div>
        <div className="text-2xl">📅</div>
      </div>

      {loading && <p className="text-sm text-slate-500">Calculando plan según tu carga reciente...</p>}
      {error && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plan.map((item) => (
          <div key={item.day} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.day}</p>
              <p className="text-xs text-slate-600">{item.session}</p>
              <p className="text-xs text-slate-500">
                {item.durationMin ? `${item.durationMin} min` : "Descanso"} · {item.intensity} · {item.notes}
              </p>
            </div>
            <button className="text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100">
              Ajustar
            </button>
          </div>
        ))}
        {!loading && !plan.length && (
          <div className="text-sm text-slate-500">
            Sin datos de carga suficientes para generar plan. Sincroniza Strava y vuelve a intentarlo.
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600">
        Plan generado con heurística según ATL/CTL/ACWR. Ajusta con tu coach y marca sesiones completadas para refinar.
      </div>
    </div>
  );
}
