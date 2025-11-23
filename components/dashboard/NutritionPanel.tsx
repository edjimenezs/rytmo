'use client';

import { useState } from "react";

const sampleDay = [
  { name: "Desayuno", calories: 450, carbs: 50, protein: 30, fat: 15 },
  { name: "Almuerzo", calories: 650, carbs: 70, protein: 40, fat: 22 },
  { name: "Cena", calories: 550, carbs: 55, protein: 35, fat: 18 },
  { name: "Snacks", calories: 200, carbs: 20, protein: 10, fat: 8 },
];

const sampleTargets = { calories: 1900, protein: 120, carbs: 210, fat: 70 };

export default function NutritionPanel() {
  const [plan] = useState(sampleDay);
  const [targets] = useState(sampleTargets);

  const totals = plan.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.carbs += meal.carbs;
      acc.protein += meal.protein;
      acc.fat += meal.fat;
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  const badge = (value: number, target: number) => {
    const pct = target ? Math.round((value / target) * 100) : 0;
    const color =
      pct < 90 ? "text-amber-700 bg-amber-100" : pct > 110 ? "text-red-700 bg-red-100" : "text-green-700 bg-green-100";
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${color}`}>
        {pct}% del objetivo
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Nutrición</h3>
          <p className="text-sm text-slate-600">Plan diario y macros objetivo (editable próximamente).</p>
        </div>
        <div className="text-2xl">🍎</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 uppercase font-semibold">Calorías</p>
          <p className="text-xl font-bold text-slate-900">{totals.calories} / {targets.calories} kcal</p>
          {badge(totals.calories, targets.calories)}
        </div>
        <div className="p-3 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Proteína</p>
          <p className="text-xl font-bold text-slate-900">{totals.protein} g</p>
          {badge(totals.protein, targets.protein)}
        </div>
        <div className="p-3 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Carbohidratos</p>
          <p className="text-xl font-bold text-slate-900">{totals.carbs} g</p>
          {badge(totals.carbs, targets.carbs)}
        </div>
        <div className="p-3 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Grasas</p>
          <p className="text-xl font-bold text-slate-900">{totals.fat} g</p>
          {badge(totals.fat, targets.fat)}
        </div>
      </div>

      <div className="space-y-2">
        {plan.map((meal) => (
          <div key={meal.name} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{meal.name}</p>
              <p className="text-xs text-slate-500">
                {meal.calories} kcal · {meal.carbs}g C · {meal.protein}g P · {meal.fat}g G
              </p>
            </div>
            <button className="text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100">
              Ajustar
            </button>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-600">
        Próximo paso: conectar con un coach/nutriólogo para personalizar objetivos y registrar ingesta real.
      </div>
    </div>
  );
}
