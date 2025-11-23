'use client';

import { useEffect, useState } from "react";

interface Suggestion {
  title: string;
  body: string;
}

interface AgentResponse {
  summary: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    trainingHours: number;
  };
  suggestions: Suggestion[];
}

export default function NutritionAgentPanel() {
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agents/nutrition-plan");
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) throw new Error(body?.error || "No se pudo obtener asistencia nutricional.");
        setData(body);
      } catch (err: any) {
        setError(err.message || "No se pudo obtener asistencia nutricional.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="animate-pulse space-y-2">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800">
        {error || "No se pudo cargar el agente de nutrición."}
      </div>
    );
  }

  const { calories, protein, carbs, fat, trainingHours } = data.summary;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agente de Nutrición</h3>
          <p className="text-sm text-slate-600">
            Recomendaciones a partir de tu carga semanal (~{trainingHours} h) y macros sugeridos.
          </p>
        </div>
        <span className="text-xl">🧠</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Calorías</p>
          <p className="text-base font-bold text-slate-900">{calories} kcal</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Proteína</p>
          <p className="text-base font-bold text-slate-900">{protein} g</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Carbohidratos</p>
          <p className="text-base font-bold text-slate-900">{carbs} g</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Grasas</p>
          <p className="text-base font-bold text-slate-900">{fat} g</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.suggestions.map((s, idx) => (
          <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">{s.title}</p>
            <p className="text-xs text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">
          Enviar al nutriólogo para aprobación
        </button>
        <button className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
          Pedir menú ajustado a la semana
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Integración IA pendiente: conectar con OpenAI/Claude en backend y usar datos 5componentes del usuario.
      </p>
    </div>
  );
}
