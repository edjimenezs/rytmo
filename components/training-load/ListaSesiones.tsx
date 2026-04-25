"use client";

import React from "react";
import { useLoadContext } from "./LoadContext";

/**
 * Lista de sesiones con métricas de carga por sesión.
 */
export default function ListaSesiones() {
  const { sesiones } = useLoadContext();

  if (!sesiones.length) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-sm text-gray-500">
        No hay sesiones registradas.
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Sesiones recientes</h3>
      </div>
      <ul className="divide-y">
        {sesiones
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha) * -1)
          .map((sesion) => (
            <li key={sesion.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm text-gray-500">{sesion.fecha} • {sesion.tipo}</p>
                <p className="text-base font-semibold text-gray-900">
                  {sesion.duracionMin} min
                  {sesion.distanciaKm ? ` · ${sesion.distanciaKm} km` : ""}
                  {sesion.potenciaMedia ? ` · ${sesion.potenciaMedia} W` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  FC media: {sesion.fcMedia ?? "-"} | sRPE: {sesion.sRPE ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  Esfuerzo (TSS): {sesion.tss ? Math.round(sesion.tss) : "-"}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                  Carga cardíaca (TRIMP): {sesion.trimp ? Math.round(sesion.trimp) : "-"}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                  Eficiencia: {sesion.ef ? sesion.ef.toFixed(2) : "-"}
                </span>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
