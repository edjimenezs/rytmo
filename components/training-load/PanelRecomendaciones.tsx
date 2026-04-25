"use client";

import React from "react";
import { useLoadContext } from "./LoadContext";

/**
 * Panel con KPIs de carga y recomendación de ajuste.
 */
export default function PanelRecomendaciones() {
  const { metricas } = useLoadContext();

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Estado de forma y recomendaciones</h3>
        <p className="text-xs text-gray-500">Guía rápida: ATL es lo reciente (última semana, fatiga), CTL es tu base (6 semanas) y ACWR compara ambos para avisar si subes demasiado rápido.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <Kpi label="ATL (últimos 7 días)" value={metricas.atl} suffix=" AU" hint="Trabajo de la última semana; si es alto, prioriza descanso o sesiones suaves." />
        <Kpi label="CTL (6 semanas)" value={metricas.ctl} suffix=" AU" hint="Base construida con constancia; sube despacio y baja si paras varios días." />
        <Kpi label="ACWR" value={metricas.acwr} hint="Relación entre la última semana y tu base. >1.3: riesgo de fatiga/lesión; 0.8-1.3: ritmo recomendado." />
        <Kpi label="Forma (CTL - ATL)" value={metricas.estadoForma} suffix=" AU" hint="Positivo = más fresco; negativo = vienes cargando volumen." />
        <Kpi label="Eficiencia (EF)" value={metricas.ef} hint="Cuánto avanzas por cada latido; más alto significa que haces más con menos esfuerzo." />
      </div>
      <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded p-3 text-sm">
        {metricas.recomendacion}
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix, hint }: { label: string; value: number | null; suffix?: string; hint?: string }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">
        {value !== null ? value.toFixed(2) : "-"}
        {value !== null && suffix ? ` ${suffix}` : ""}
      </p>
      {hint && <p className="text-[11px] text-gray-500 mt-1 leading-tight">{hint}</p>}
    </div>
  );
}
