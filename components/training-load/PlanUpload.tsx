"use client";

import React, { useState } from "react";
import { useLoadContext } from "./LoadContext";

export default function PlanUpload() {
  const { refreshPlanEntries } = useLoadContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("Selecciona un archivo CSV.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("plan", selectedFile);
      const res = await fetch("/api/training-plan/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error ?? "No fue posible subir el plan.");
      }
      const data = await res.json();
      setStatus(`Plan importado (${data.imported || 0} filas, ${data.matched || 0} coincidencias).`);
      await refreshPlanEntries();
    } catch (error) {
      console.error(error);
      setStatus("Error al subir el plan. Verifica el formato CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Importar plan semanal</h3>
      <p className="text-sm text-gray-500">Sube un CSV con las sesiones planificadas (fecha, tipo, título, duración, distancia, TSS).</p>
      <input
        type="file"
        accept=".csv"
        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        className="text-sm text-slate-600"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleUpload}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Importando..." : "Subir plan"}
        </button>
        <a
          href="/training-plans/2026-03-16-week.csv"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-blue-600 underline"
        >
          Descargar plantilla
        </a>
      </div>
      {status && <p className="text-xs text-slate-500">{status}</p>}
    </div>
  );
}
