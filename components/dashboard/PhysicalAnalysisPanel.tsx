'use client';

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Summary {
  totalActivities: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  avgPace: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

interface HrZone {
  zone: string;
  minutes: number;
  percentage: number;
  range: string;
}

interface PaceBand {
  label: string;
  emoji: string;
  count: number;
  distanceKm: number;
}

interface WeeklyLoad {
  week: string;
  distanceKm: number;
  durationHours: number;
}

interface LastActivity {
  id: string;
  name: string;
  type: "RUNNING" | "CYCLING" | "SWIMMING" | "WALKING" | "WEIGHTLIFTING" | "YOGA" | "OTHER";
  startDate: string;
  distanceKm: number | null;
  durationMin: number | null;
  avgPace: number | null;
  avgHR: number | null;
}

interface PhysicalAnalysisResponse {
  summary: Summary;
  hrZones: HrZone[];
  paceBands: PaceBand[];
  weeklyLoad: WeeklyLoad[];
  lastActivities: LastActivity[];
  message?: string;
}

function formatPace(pace: number | null) {
  if (!pace) return "—";
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds} min/km`;
}

function formatDisciplinePace(activity: LastActivity) {
  if (!activity.distanceKm || !activity.durationMin) {
    return activity.avgPace ? formatPace(activity.avgPace) : "—";
  }

  // Convert duration to hours for cycling speed, minutes for swim speed.
  if (activity.type === "CYCLING") {
    const hours = activity.durationMin / 60;
    if (hours <= 0) return "—";
    const speed = activity.distanceKm / hours;
    return `${speed.toFixed(1)} km/h`;
  }

  if (activity.type === "SWIMMING") {
    const meters = activity.distanceKm * 1000;
    const seconds = activity.durationMin * 60;
    if (meters <= 0 || seconds <= 0) return "—";
    const pacePer100Sec = seconds / (meters / 100);
    const paceMin = Math.floor(pacePer100Sec / 60);
    const paceSec = Math.round(pacePer100Sec % 60)
      .toString()
      .padStart(2, "0");
    return `${paceMin}:${paceSec} min/100m`;
  }

  // Default: running/walking -> min/km
  const paceFromDistance = activity.durationMin / activity.distanceKm;
  const minutes = Math.floor(paceFromDistance);
  const seconds = Math.round((paceFromDistance - minutes) * 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds} min/km`;
}

function buildInsights(data: PhysicalAnalysisResponse) {
  const insights: { title: string; body: string; tone: "coach" | "ai" }[] = [];
  const { hrZones, paceBands, weeklyLoad, summary } = data;

  const totalMinutes = hrZones.reduce((sum, z) => sum + z.minutes, 0);
  const topZone = hrZones.slice().sort((a, b) => b.minutes - a.minutes)[0];
  if (topZone && totalMinutes > 0) {
    const share = Math.round((topZone.minutes / totalMinutes) * 100);
    insights.push({
      title: "Zona donde rindes más",
      body: `Tu mayor volumen está en ${topZone.zone} (${share}% del tiempo). Mantén sesiones clave ahí y combina con 1-2 toques en zonas altas para progresar.`,
      tone: "coach",
    });
  }

  const highIntensity = hrZones
    .filter((z) => z.zone === "Zone 4" || z.zone === "Zone 5")
    .reduce((sum, z) => sum + z.minutes, 0);
  if (highIntensity > 0 && totalMinutes > 0) {
    const hiShare = Math.round((highIntensity / totalMinutes) * 100);
    if (hiShare > 25) {
      insights.push({
        title: "Mucho tiempo en intensidad alta",
        body: `Estás dedicando ${hiShare}% a Z4/Z5. Reduce a 10-20% semanal para evitar fatiga y mejorar consistencia.`,
        tone: "ai",
      });
    }
  }

  const tempoBand = paceBands.find((p) => p.label === "Tempo");
  if (tempoBand && tempoBand.distanceKm > 0) {
    insights.push({
      title: "Tempo = eficiencia",
      body: `Tienes ${tempoBand.distanceKm.toFixed(1)} km en Tempo. Mantén 1-2 sesiones/semana ahí: mejora economía sin castigar la recuperación.`,
      tone: "coach",
    });
  }

  if (weeklyLoad.length >= 2) {
    const last = weeklyLoad[weeklyLoad.length - 1];
    const prev = weeklyLoad[weeklyLoad.length - 2];
    if (prev.distanceKm > 0) {
      const jump = Math.round(((last.distanceKm - prev.distanceKm) / prev.distanceKm) * 100);
      if (jump > 20) {
        insights.push({
          title: "Carga subió rápido",
          body: `Incrementaste la carga semanal ~${jump}% (de ${prev.distanceKm} km a ${last.distanceKm} km). Mantén incrementos <10-15% para minimizar riesgo.`,
          tone: "ai",
        });
      }
    }
  }

  if (summary.avgHeartRate && summary.maxHeartRate) {
    const reserve = summary.maxHeartRate - summary.avgHeartRate;
    if (reserve < 35) {
      insights.push({
        title: "Fatiga posible",
        body: "Tu FC media está cerca de la máxima estimada. Si notas fatiga, añade un día de Z1-Z2 y sueño extra.",
        tone: "ai",
      });
    }
  }

  return insights.slice(0, 4);
}

export default function PhysicalAnalysisPanel() {
  const [data, setData] = useState<PhysicalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/physical-analysis");
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) {
          throw new Error(body?.error || "No se pudo cargar el análisis físico.");
        }
        if (!body.summary) {
          throw new Error("Sin datos de análisis disponibles.");
        }
        setData(body);
      } catch (err: any) {
        setError(err.message || "No se pudo cargar el análisis físico.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  useEffect(() => {
    // Ajusta tema según preferencia del sistema si está disponible
    if (typeof window !== "undefined" && window.matchMedia) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        {error || "No se pudo cargar el análisis físico."}
      </div>
    );
  }

  if (data.summary.totalActivities === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Análisis físico</h2>
        <p className="text-sm text-gray-600">
          Aún no hay actividades para analizar. Sincroniza Strava o registra entrenamientos para ver zonas, ritmos y carga.
        </p>
      </div>
    );
  }

  const hrZones = Array.isArray(data.hrZones) ? data.hrZones.filter((z) => z.minutes > 0) : [];
  const paceBands = Array.isArray(data.paceBands)
    ? data.paceBands.filter((b) => b.count > 0 || b.distanceKm > 0)
    : [];
  const insights = (() => {
    try {
      return buildInsights(data);
    } catch {
      return [];
    }
  })();

  const isDark = theme === "dark";
  const palette = isDark
    ? {
        bg: "#0b1220",
        text: "#e2e8f0",
        subtext: "#cbd5e1",
        card: "#111827",
        border: "#1f2937",
        accent: "#3b82f6",
      }
    : {
        bg: "#ffffff",
        text: "#0f172a",
        subtext: "#475569",
        card: "#ffffff",
        border: "#cbd5e1",
        accent: "#1d4ed8",
      };
  const containerClasses = isDark
    ? "bg-slate-900 text-slate-100 border border-slate-700"
    : "bg-white text-slate-900 border border-slate-200";

  return (
    <div
      data-physical-panel
      className={`${containerClasses} shadow-lg rounded-2xl p-6 space-y-8 opacity-100`}
      style={{
        opacity: 1,
        filter: "none",
        backgroundColor: palette.bg,
        color: palette.text,
      }}
    >
      <style jsx global>{`
        [data-physical-panel] * {
          opacity: 1 !important;
          filter: none !important;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Análisis físico</h2>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Carga, zonas de pulso, ritmos y recomendaciones accionables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`px-3 py-1 rounded-md text-xs font-semibold border ${
              isDark ? "border-slate-600 text-slate-200" : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            Claro
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-3 py-1 rounded-md text-xs font-semibold border ${
              isDark ? "border-blue-400 bg-blue-500/20 text-blue-100" : "border-slate-200 text-slate-600"
            }`}
          >
            Oscuro
          </button>
          <div className="text-2xl">📊</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`border rounded-xl p-4 ${
            isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
          }`}
          style={{ color: palette.text, borderColor: palette.border }}
        >
          <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Actividades
          </p>
          <p className="text-2xl font-bold">{data.summary.totalActivities}</p>
        </div>
        <div
          className={`border rounded-xl p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
          style={{ color: palette.text, borderColor: palette.border }}
        >
          <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Distancia
          </p>
          <p className="text-2xl font-bold">{data.summary.totalDistanceKm} km</p>
        </div>
        <div
          className={`border rounded-xl p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
          style={{ color: palette.text, borderColor: palette.border }}
        >
          <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Duración
          </p>
          <p className="text-2xl font-bold">{data.summary.totalDurationMin} min</p>
        </div>
        <div
          className={`border rounded-xl p-4 ${
            isDark ? "border-blue-500 bg-blue-900/30" : "border-blue-200 bg-blue-50"
          }`}
          style={{ color: isDark ? "#dbeafe" : palette.text }}
        >
          <p className={`text-xs uppercase tracking-wide font-semibold ${isDark ? "text-blue-100" : "text-blue-700"}`}>
            FC media
          </p>
          <p className={`text-2xl font-bold ${isDark ? "text-blue-100" : "text-blue-700"}`}>
            {data.summary.avgHeartRate ? `${data.summary.avgHeartRate} bpm` : "—"}
          </p>
        </div>
      </div>

      {/* Heart rate zones */}
      {hrZones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Zonas de entrenamiento (FC)</h3>
          <div className="space-y-2">
            {hrZones.map((zone) => (
              <div key={zone.zone} className="flex items-center gap-3">
                <div className="w-28 text-sm font-semibold">{zone.zone}</div>
                <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div
                    className={`h-3 ${isDark ? "bg-gradient-to-r from-blue-400 to-indigo-400" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`}
                    style={{ width: `${Math.min(zone.percentage, 100)}%` }}
                  />
                </div>
                <div className={`w-32 text-xs text-right font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {zone.minutes} min · {zone.range}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pace visualizer por disciplina */}
      {data.lastActivities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Ritmo/velocidad por disciplina</h3>
          <div className="space-y-2">
            {Object.entries(
              data.lastActivities.reduce((acc: Record<string, { totalPace: number; count: number; icon: string }>, act) => {
                // pace for running/walking (min/km), for cycling (km/h), swimming (min/100m)
                let metric = "";
                let value = 0;
                if (act.type === "CYCLING" && act.distanceKm && act.durationMin) {
                  const hours = act.durationMin / 60;
                  if (hours > 0) {
                    value = act.distanceKm / hours; // km/h
                    metric = `${value.toFixed(1)} km/h`;
                  }
                } else if (act.type === "SWIMMING" && act.distanceKm && act.durationMin) {
                  const meters = act.distanceKm * 1000;
                  const seconds = act.durationMin * 60;
                  if (meters > 0 && seconds > 0) {
                    const pacePer100Sec = seconds / (meters / 100);
                    const paceMin = Math.floor(pacePer100Sec / 60);
                    const paceSec = Math.round(pacePer100Sec % 60)
                      .toString()
                      .padStart(2, "0");
                    metric = `${paceMin}:${paceSec} min/100m`;
                    value = pacePer100Sec; // smaller is better
                  }
                } else if (act.distanceKm && act.durationMin) {
                  const pace = act.durationMin / act.distanceKm;
                  const minutes = Math.floor(pace);
                  const seconds = Math.round((pace - minutes) * 60)
                    .toString()
                    .padStart(2, "0");
                  metric = `${minutes}:${seconds} min/km`;
                  value = pace;
                }

                const icon =
                  act.type === "CYCLING" ? "🚴" : act.type === "SWIMMING" ? "🏊" : act.type === "RUNNING" ? "🏃" : "🏋️";

                if (!metric) return acc;
                if (!acc[act.type]) acc[act.type] = { totalPace: 0, count: 0, icon };
                acc[act.type].totalPace += value;
                acc[act.type].count += 1;
                return acc;
              }, {})
            ).map(([type, info]) => {
              const avgMetric =
                type === "CYCLING"
                  ? `${(info.totalPace / info.count).toFixed(1)} km/h`
                  : type === "SWIMMING"
                  ? (() => {
                      const pacePer100Sec = info.totalPace / info.count;
                      const paceMin = Math.floor(pacePer100Sec / 60);
                      const paceSec = Math.round(pacePer100Sec % 60)
                        .toString()
                        .padStart(2, "0");
                      return `${paceMin}:${paceSec} min/100m`;
                    })()
                  : (() => {
                      const pace = info.totalPace / info.count;
                      const minutes = Math.floor(pace);
                      const seconds = Math.round((pace - minutes) * 60)
                        .toString()
                        .padStart(2, "0");
                      return `${minutes}:${seconds} min/km`;
                    })();

              return (
                <div
                  key={type}
                  className="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-white shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{type}</p>
                      <p className="text-xs text-slate-600">Promedio reciente</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-700 animate-pulse-slow">{avgMetric}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pace bands */}
      {paceBands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Ritmos por objetivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paceBands.map((band) => (
              <div
                key={band.label}
                className={`border rounded-xl p-3 flex items-center justify-between shadow-sm ${
                  isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <span>{band.emoji}</span> {band.label}
                  </div>
                  <div className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {band.count} sesiones · {band.distanceKm} km
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly load */}
      {data.weeklyLoad.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Carga semanal</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {data.weeklyLoad.map((week) => (
              <div
                key={week.week}
                className={`border rounded-xl p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
              >
                <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {format(new Date(week.week), "d MMM", { locale: es })}
                </p>
                <p className={`text-sm font-bold ${isDark ? "text-slate-50" : "text-slate-900"}`}>{week.distanceKm} km</p>
                <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{week.durationHours} h</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI / Coach insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Recomendaciones del agente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 border ${
                  insight.tone === "coach"
                    ? isDark
                      ? "border-blue-500 bg-blue-900/30 text-blue-100"
                      : "border-blue-200 bg-blue-50 text-blue-900"
                    : isDark
                    ? "border-amber-500 bg-amber-900/30 text-amber-100"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{insight.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last activities */}
      {data.lastActivities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Últimas sesiones</h3>
          <div className="space-y-2">
            {data.lastActivities.map((act) => (
              <div
                key={act.id}
                className={`border rounded-xl p-3 flex items-center justify-between shadow ${
                  isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{act.name}</p>
                  <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {format(new Date(act.startDate), "d MMM, HH:mm", { locale: es })} · {act.type}
                  </p>
                </div>
                <div className={`text-xs flex items-center gap-4 font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {act.distanceKm !== null && <span>{act.distanceKm} km</span>}
                  {act.durationMin !== null && <span>{act.durationMin} min</span>}
                  <span>{formatDisciplinePace(act)}</span>
                  {act.avgHR !== null && <span>{act.avgHR} bpm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
