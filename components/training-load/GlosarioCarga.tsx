"use client";

import React from "react";

/**
 * Bloque explicativo para que cualquier usuario entienda las métricas de carga.
 */
export default function GlosarioCarga() {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 text-lg">ℹ️</div>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="text-base font-semibold text-gray-900">Cómo leer la carga de entrenamiento</p>
          <p>
            Sumamos el esfuerzo de cada sesión (TSS si hay potencia, TRIMP si solo hay pulso) para estimar fatiga y progreso.
            Los números no son médicos, solo una guía para ajustar volumen e intensidad.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Carga diaria:</strong> esfuerzo total del día; números altos = sesión exigente.
            </li>
            <li>
              <strong>ATL (última semana):</strong> mide lo reciente; si sube rápido, notarás más cansancio.
            </li>
            <li>
              <strong>CTL (6 semanas):</strong> tu base acumulada; sube con constancia, baja si paras.
            </li>
            <li>
              <strong>ACWR:</strong> compara ATL vs CTL. 0.8-1.3 suele ser zona segura; &gt;1.3 alerta de fatiga, &lt;0.8 puede faltar estímulo.
            </li>
            <li>
              <strong>Forma (CTL - ATL):</strong> positivo = más fresco; negativo = vienes cargando volumen.
            </li>
            <li>
              <strong>Eficiencia (EF):</strong> cuánto avanzas por cada latido. Más alto = haces más con menos esfuerzo.
            </li>
          </ul>
          <p className="text-xs text-gray-500">
            Usa estas pistas junto a cómo te sientes y tus señales de recuperación (sueño, apetito, molestias).
          </p>
        </div>
      </div>
    </div>
  );
}
