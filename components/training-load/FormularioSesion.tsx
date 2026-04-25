"use client";

import React, { useState } from "react";
import { useLoadContext } from "./LoadContext";

/**
 * Acción principal: sincronizar con Strava y recargar la UI.
 * Se deja un pequeño fallback para registrar manualmente si no hay conexión.
 */
export default function FormularioSesion() {
  const { recargar } = useLoadContext();
  const [estado, setEstado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncStrava = async () => {
    setLoading(true);
    setEstado(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      if (!res.ok) throw new Error("sync failed");
      await fetch("/api/training-plan/match", { method: "POST" });
      await recargar();
      setEstado("Sincronización completada");
    } catch (e) {
      setEstado("No se pudo sincronizar con Strava");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sincronizar sesiones</h3>
        {estado && <span className="text-sm text-blue-700">{estado}</span>}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Las sesiones se traen desde Strava. Pulsa sincronizar para actualizar y recalcular cargas y recomendaciones.
      </p>
      <button
        onClick={syncStrava}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Sincronizando..." : "Sincronizar Strava"}
      </button>
    </div>
  );
}
