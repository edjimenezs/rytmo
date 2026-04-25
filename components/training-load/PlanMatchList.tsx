"use client";

import React, { useMemo } from "react";
import { useLoadContext } from "./LoadContext";

export default function PlanMatchList() {
  const { planEntries } = useLoadContext();

  const upcoming = useMemo(() => {
    return planEntries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [planEntries]);

  if (!planEntries.length) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900">Plan semanal</h3>
        <p className="text-sm text-slate-500">Importa un CSV para ver el plan y cómo coincide con Strava.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Plan vs. ejecución</h3>
        <p className="text-xs text-slate-500">Mostramos los últimos siete entrenamientos planificados.</p>
      </div>
      <ul className="space-y-3">
        {upcoming.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{new Date(entry.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}</span>
              <span className="font-semibold text-slate-700">{entry.sessionType}</span>
            </div>
            <p className="text-base font-semibold text-slate-900">{entry.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {entry.durationMinutes && <span>Duración: {entry.durationMinutes} min</span>}
              {entry.distanceKm && <span>Distancia: {entry.distanceKm} km</span>}
              {entry.tss && <span>TSS: {Math.round(entry.tss)}</span>}
              {entry.matchedActivity ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Ejecutado</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Pendiente</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">{entry.notes}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
