import { prisma } from "@/lib/prisma";

type DailyLoad = {
  date: string;
  load: number;
};

const DEFAULT_FC_REPOSO = 50;
const DEFAULT_FC_MAX = 185;

function calcularRatioReserva(fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!fcMedia || fcMax <= fcReposo) return null;
  const ratio = (fcMedia - fcReposo) / (fcMax - fcReposo);
  return Math.max(0, Math.min(1, ratio));
}

export function estimarTrimpBannister(duracionSeg?: number | null, fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!duracionSeg) return 0;
  const ratio = calcularRatioReserva(fcMedia, fcReposo, fcMax) ?? 0.7;
  const a = 0.64;
  const b = 1.92;
  const durMin = duracionSeg / 60;
  return durMin * ratio * Math.exp(b * ratio) * a;
}

export function estimarTssDesdeFc(duracionSeg?: number | null, fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!duracionSeg) return 0;
  const ratio = calcularRatioReserva(fcMedia, fcReposo, fcMax) ?? 0.7;
  const durHoras = duracionSeg / 3600;
  return durHoras * Math.pow(ratio, 2) * 100;
}

/**
 * Obtiene cargas diarias (TSS estimado) para el usuario.
 */
export async function getDailyLoads(userId: string, days: number = 60): Promise<DailyLoad[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const activities = await prisma.trainingActivity.findMany({
    where: { userId, startDate: { gte: since } },
    orderBy: { startDate: "asc" },
    select: {
      startDate: true,
      duration: true,
      averageHeartRate: true,
    },
  });

  const map = new Map<string, number>();
  activities.forEach((a) => {
    const date = a.startDate.toISOString().slice(0, 10);
    const load = estimarTssDesdeFc(a.duration, a.averageHeartRate);
    map.set(date, (map.get(date) || 0) + load);
  });

  const dates = Array.from(map.keys()).sort();
  return dates.map((d) => ({ date: d, load: map.get(d) || 0 }));
}

/**
 * Calcula ATL/CTL/ACWR usando medias móviles exponenciales.
 */
export function calcularAtlCtlAcwr(loads: DailyLoad[], tauAtl = 7, tauCtl = 42) {
  if (!loads.length) return { atl: 0, ctl: 0, acwr: 0 };
  const alphaAtl = 1 - Math.exp(-1 / tauAtl);
  const alphaCtl = 1 - Math.exp(-1 / tauCtl);
  let atl = 0;
  let ctl = 0;
  let lastDate = loads[0].date;

  // Asegurar continuidad diaria
  const sorted = loads.slice().sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date);
  const end = new Date(sorted[sorted.length - 1].date);
  const daily: DailyLoad[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const entry = sorted.find((x) => x.date === iso);
    daily.push({ date: iso, load: entry?.load || 0 });
  }

  daily.forEach((p) => {
    atl = atl + alphaAtl * (p.load - atl);
    ctl = ctl + alphaCtl * (p.load - ctl);
    lastDate = p.date;
  });

  return { atl, ctl, acwr: ctl > 0 ? atl / ctl : 0, lastDate };
}
