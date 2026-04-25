"use client";

import React from "react";
import PerfilAtleta from "./PerfilAtleta";
import FormularioSesion from "./FormularioSesion";
import ListaSesiones from "./ListaSesiones";
import GraficoCargas from "./GraficoCargas";
import PanelRecomendaciones from "./PanelRecomendaciones";
import CalendarioEntrenamiento from "./CalendarioEntrenamiento";
import { LoadProvider } from "./LoadContext";
import GlosarioCarga from "./GlosarioCarga";
import PlanMatchList from "./PlanMatchList";
import PlanUpload from "./PlanUpload";
import { Session } from "next-auth";

/**
 * Página principal de la carga de entrenamiento.
 * Contiene el formulario, métricas, gráficos y recomendaciones.
 */
export default function TrainingLoadPage({ user }: { user?: Session["user"] }) {
  return (
    <LoadProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Carga de entrenamiento</p>
              <h1 className="text-3xl font-bold text-gray-900">Panel de rendimiento</h1>
              <p className="text-xs text-gray-500 mt-1">Datos sincronizados desde Strava con cálculos de carga y recomendaciones.</p>
            </div>
            <a
              href="#form-sesion"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Registrar sesión
            </a>
          </header>

          <GlosarioCarga />

          <PerfilAtleta />
          <PanelRecomendaciones />
          <GraficoCargas />

          <div id="form-sesion" className="grid gap-6 lg:grid-cols-2">
            <FormularioSesion />
            <PlanUpload />
          </div>

          <ListaSesiones />
          <PlanMatchList />
          <CalendarioEntrenamiento />
        </div>
      </div>
    </LoadProvider>
  );
}
