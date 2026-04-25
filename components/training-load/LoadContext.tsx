"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TrainingPlanEntryResponse } from "@/lib/training/plan";

type SessionPayload = {
  fecha: string;
  tipo: string;
  duracionMin: number;
  distanciaKm?: number;
  potenciaMedia?: number;
  fcMedia?: number;
  fcReposo?: number;
  fcMax?: number;
  sRPE?: number;
};

export type SessionWithLoad = SessionPayload & {
  id: string;
  tss?: number;
  trimp?: number;
  ef?: number;
};

export type AthleteProfile = {
  nombre: string;
  fcReposo: number;
  fcMax: number;
  ftp?: number;
  vt1?: number;
  vt2?: number;
};

export type TrendPoint = {
  date: string;
  load: number;
  atl: number;
  ctl: number;
  acwr: number | null;
};

type PlanEntry = TrainingPlanEntryResponse;

type ActivityApiItem = {
  id: string;
  startDate?: string | null;
  type?: string;
  duration?: number | null;
  distance?: number | null;
  averageHeartRate?: number | null;
  tss?: number | null;
  trimp?: number | null;
  ef?: number | null;
  durationMinutes?: number | null;
  distanceKm?: number | null;
};

type ActivityApiResponse = {
  activities?: ActivityApiItem[];
};

type MetricsState = {
  atl: number | null;
  ctl: number | null;
  acwr: number | null;
  ef: number | null;
  estadoForma: number | null;
  recomendacion: string;
  tendencia: TrendPoint[];
};

type LoadContextValue = {
  atleta: AthleteProfile | null;
  sesiones: SessionWithLoad[];
  metricas: MetricsState;
  planEntries: PlanEntry[];
  planLoading: boolean;
  refreshPlanEntries: () => Promise<void>;
  agregarSesion: (payload: SessionPayload) => Promise<void>;
  recargar: () => Promise<void>;
};

const LoadContext = createContext<LoadContextValue | undefined>(undefined);

/**
 * Hook para acceder al contexto de cargas.
 */
export function useLoadContext() {
  const ctx = useContext(LoadContext);
  if (!ctx) throw new Error("useLoadContext debe usarse dentro de LoadProvider");
  return ctx;
}

function calcularTssEstimado(payload: SessionPayload, ftp?: number) {
  if (!payload.potenciaMedia || !ftp || ftp <= 0) return undefined;
  const intensidadRel = payload.potenciaMedia / ftp;
  return (payload.duracionMin / 60) * Math.pow(intensidadRel, 2) * 100;
}

function calcularEf(payload: SessionPayload) {
  if (!payload.fcMedia || payload.fcMedia <= 0) return undefined;
  if (payload.potenciaMedia) {
    return payload.potenciaMedia / payload.fcMedia;
  }
  if (payload.distanciaKm) {
    const velocidad = (payload.distanciaKm * 1000) / payload.duracionMin;
    return velocidad / payload.fcMedia;
  }
  return undefined;
}

function calcularTrimpAproximado(payload: SessionPayload) {
  if (!payload.fcMedia || !payload.fcReposo || !payload.fcMax) return payload.sRPE ? payload.sRPE * payload.duracionMin : undefined;
  if (payload.fcMax <= payload.fcReposo) return undefined;
  const hrr = (payload.fcMedia - payload.fcReposo) / (payload.fcMax - payload.fcReposo);
  const a = 0.64;
  const b = 1.92;
  return payload.duracionMin * hrr * Math.exp(b * hrr) * a;
}

function construirSerieCarga(sesiones: SessionWithLoad[]) {
  if (!sesiones.length) return [];
  const mapa = new Map<string, number>();
  sesiones.forEach((s) => {
    const load = s.tss ?? s.trimp ?? 0;
    const fecha = s.fecha;
    mapa.set(fecha, (mapa.get(fecha) || 0) + load);
  });

  const fechas = Array.from(mapa.keys()).sort();
  const start = new Date(fechas[0]);
  const end = new Date(fechas[fechas.length - 1]);
  const serie: TrendPoint[] = [];
  const cursor = new Date(start);

  const alphaAtl = 1 - Math.exp(-1 / 7);
  const alphaCtl = 1 - Math.exp(-1 / 42);
  let atl = 0;
  let ctl = 0;

  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    const carga = mapa.get(iso) || 0;
    atl = atl + alphaAtl * (carga - atl);
    ctl = ctl + alphaCtl * (carga - ctl);
    const acwr = ctl > 0 ? atl / ctl : null;
    serie.push({ date: iso, load: carga, atl, ctl, acwr });
    cursor.setDate(cursor.getDate() + 1);
  }

  return serie;
}

function construirMetricas(sesiones: SessionWithLoad[]): MetricsState {
  const tendencia = construirSerieCarga(sesiones);
  const ultima = tendencia[tendencia.length - 1];
  const efValores = sesiones.map((s) => s.ef).filter((v): v is number => v !== undefined);
  const ef = efValores.length ? Number((efValores.reduce((a, b) => a + b, 0) / efValores.length).toFixed(2)) : null;
  const estadoForma = ultima ? Number((ultima.ctl - ultima.atl).toFixed(2)) : null;

  let recomendacion = "Sin datos suficientes.";
  if (ultima && ultima.acwr !== null) {
    if (ultima.acwr > 1.3 || (ultima.atl > ultima.ctl * 1.1)) {
      recomendacion = "Carga alta: reduce volumen o intensidad y prioriza recuperación.";
    } else if (ultima.acwr < 0.8) {
      recomendacion = "Carga baja: puedes incrementar progresivamente el volumen o añadir calidad.";
    } else {
      recomendacion = "Estado estable: mantener progresión controlada.";
    }
  }

  return {
    atl: ultima ? Number(ultima.atl.toFixed(1)) : null,
    ctl: ultima ? Number(ultima.ctl.toFixed(1)) : null,
    acwr: ultima && ultima.acwr !== null ? Number(ultima.acwr.toFixed(2)) : null,
    ef,
    estadoForma,
    recomendacion,
    tendencia,
  };
}

async function fetchPerfil(): Promise<AthleteProfile | null> {
  try {
    const res = await fetch("/api/training/profile");
    if (!res.ok) return null;
    return (await res.json()) as AthleteProfile;
  } catch (e) {
    console.warn("No se pudo obtener perfil remoto, usando mock.", e);
    return null;
  }
}

async function fetchSesiones(): Promise<SessionWithLoad[] | null> {
  try {
    const res = await fetch("/api/activities?limit=90");
    if (!res.ok) return null;
    const data = (await res.json()) as ActivityApiResponse;
    const activities = data.activities || [];
    return activities.map((a) => {
      const fecha = a.startDate?.slice(0, 10) || "";
      const base: SessionWithLoad = {
        id: a.id,
        fecha,
        tipo: a.type || "Sesión",
        duracionMin: a.durationMinutes ?? (a.duration ? a.duration / 60 : 0),
        distanciaKm: a.distanceKm ?? (a.distance ? a.distance / 1000 : undefined),
        fcMedia: a.averageHeartRate ?? undefined,
        fcReposo: undefined,
        fcMax: undefined,
        sRPE: undefined,
        tss: a.tss ?? undefined,
        trimp: a.trimp ?? undefined,
        ef: a.ef ?? undefined,
      };
      if (!base.tss) base.tss = calcularTssEstimado(base, undefined);
      if (!base.trimp) base.trimp = calcularTrimpAproximado(base);
      if (!base.ef) base.ef = calcularEf(base);
      return base;
    });
  } catch (e) {
    console.warn("No se pudieron obtener sesiones remotas.", e);
    return null;
  }
}

async function crearSesionBackend(payload: SessionPayload, ftp?: number): Promise<SessionWithLoad | null> {
  try {
    // Reemplazado por sync con Strava; dejamos la ruta lista si se necesita alta manual.
    const res = await fetch("/api/training/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const creada = (await res.json()) as SessionWithLoad;
    if (!creada.tss) creada.tss = calcularTssEstimado(payload, ftp);
    if (!creada.trimp) creada.trimp = calcularTrimpAproximado(payload);
    if (!creada.ef) creada.ef = calcularEf(payload);
    return creada;
  } catch (e) {
    console.warn("No se pudo crear sesión en backend.", e);
    return null;
  }
}

export function LoadProvider({ children }: { children: React.ReactNode }) {
  const [atleta, setAtleta] = useState<AthleteProfile | null>(null);
  const [sesiones, setSesiones] = useState<SessionWithLoad[]>([]);
  const [planEntries, setPlanEntries] = useState<PlanEntry[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  const metricas = useMemo(() => construirMetricas(sesiones), [sesiones]);

  const fetchPlanEntries = useCallback(async () => {
    setPlanLoading(true);
    try {
      const res = await fetch("/api/training-plan/entries");
      if (!res.ok) {
        throw new Error("No se pudieron cargar los planes");
      }
      const data = (await res.json()) as { entries?: PlanEntry[] };
      setPlanEntries(data.entries || []);
    } catch (error) {
      console.warn("No se pudo cargar el plan de entrenamiento", error);
      setPlanEntries([]);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const recargar = useCallback(async () => {
    const [remotoAtleta, remotoSesiones] = await Promise.all([fetchPerfil(), fetchSesiones()]);
    setAtleta(
      remotoAtleta || {
        nombre: "Atleta",
        fcReposo: 50,
        fcMax: 185,
        ftp: 250,
      }
    );
    setSesiones(remotoSesiones || []);
    await fetchPlanEntries();
  }, [fetchPlanEntries]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const agregarSesion = async (payload: SessionPayload) => {
    const creada = await crearSesionBackend(payload, atleta?.ftp);
    if (creada) {
      setSesiones((prev) => [...prev, creada]);
      return;
    }
    const fallback: SessionWithLoad = {
      ...payload,
      id: `local-${Date.now()}`,
      tss: calcularTssEstimado(payload, atleta?.ftp),
      trimp: calcularTrimpAproximado(payload),
      ef: calcularEf(payload),
    };
    setSesiones((prev) => [...prev, fallback]);
  };

  const refreshPlanEntries = useCallback(async () => {
    await fetchPlanEntries();
  }, [fetchPlanEntries]);

  const value: LoadContextValue = {
    atleta,
    sesiones,
    metricas,
    planEntries,
    planLoading,
    refreshPlanEntries,
    agregarSesion,
    recargar,
  };

  return <LoadContext.Provider value={value}>{children}</LoadContext.Provider>;
}
