"use client";

import React from "react";
import { useLoadContext } from "./LoadContext";

/**
 * Muestra datos básicos del atleta y umbrales usados en los cálculos.
 */
export default function PerfilAtleta() {
  const { atleta } = useLoadContext();

  if (!atleta) {
    return (
      <div className="bg-white shadow rounded-lg p-4 text-sm text-gray-500">
        Cargando perfil de atleta...
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Perfil de {atleta.nombre}</h3>
        <span className="text-xs text-gray-500">Umbrales y FC de referencia (para cálculos de carga)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Dato label="FC reposo" value={`${atleta.fcReposo} bpm`} />
        <Dato label="FC máxima" value={`${atleta.fcMax} bpm`} />
        <Dato label="FTP" value={atleta.ftp ? `${atleta.ftp} W` : "-"} />
        <Dato label="VT1" value={atleta.vt1 ? `${atleta.vt1} bpm` : "-"} />
        <Dato label="VT2" value={atleta.vt2 ? `${atleta.vt2} bpm` : "-"} />
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-3 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
