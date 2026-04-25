"use client";

import React, { useMemo } from "react";
import { useLoadContext } from "./LoadContext";

/**
 * Calendario simple que muestra sesiones realizadas y sugiere ajustes futuros.
 */
export default function CalendarioEntrenamiento() {
  const { sesiones, metricas, planEntries } = useLoadContext();

  const eventos = useMemo(() => {
    const futuros: { fecha: string; nota: string }[] = [];
    const hoy = new Date();
    const baseNota =
      metricas.acwr && metricas.acwr > 1.3
        ? "Día ligero/recuperación"
        : metricas.acwr && metricas.acwr < 0.8
        ? "Día de carga progresiva"
        : "Sesión moderada";
    for (let i = 1; i <= 5; i++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() + i);
      futuros.push({ fecha: d.toISOString().slice(0, 10), nota: baseNota });
    }
    return futuros;
  }, [metricas.acwr]);

  const sesionesMap = new Map<string, number>();
  sesiones.forEach((s) => sesionesMap.set(s.fecha, (sesionesMap.get(s.fecha) || 0) + (s.tss ?? s.trimp ?? 0)));

  const planMap = useMemo(() => {
    const map = new Map<string, typeof planEntries>();
    planEntries.forEach((entry) => {
      const fecha = entry.date.slice(0, 10);
      map.set(fecha, [...(map.get(fecha) ?? []), entry]);
    });
    return map;
  }, [planEntries]);

  const dias = buildMonthDays();

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendario de entrenamiento</h3>
      <div className="grid grid-cols-7 gap-2 text-sm">
        {dias.map((dia) => {
          const carga = sesionesMap.get(dia.iso);
          const futuro = eventos.find((e) => e.fecha === dia.iso);
          const planForDay = planMap.get(dia.iso) ?? [];
          return (
            <div
              key={dia.iso}
              className={`border rounded p-2 h-24 flex flex-col justify-between ${
                carga ? "border-blue-300 bg-blue-50" : futuro ? "border-green-200 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{dia.dia}</span>
                <span className="text-[10px] text-gray-400">{dia.iso.slice(5)}</span>
              </div>
              {carga && <p className="text-xs font-semibold text-blue-800">Carga: {Math.round(carga)}</p>}
              {futuro && <p className="text-[11px] text-green-800">{futuro.nota}</p>}
              {planForDay.length > 0 && (
                <div className="text-[10px] text-slate-600 leading-tight">
                  {planForDay.slice(0, 2).map((entry) => (
                    <p key={entry.id}>
                      Plan: {entry.sessionType} · {entry.matchedActivity ? "Ejecutado" : "Pendiente"}
                    </p>
                  ))}
                  {planForDay.length > 2 && (
                    <p>+{planForDay.length - 2} plan{planForDay.length - 2 > 1 ? "es" : ""}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthDays() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 1; i <= lastDay; i++) {
    const d = new Date(year, month, i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      dia: d.getDate(),
    });
  }
  return days;
}
