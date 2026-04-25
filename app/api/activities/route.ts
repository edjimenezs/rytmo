import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";

type ActivitySourceValue = "MANUAL" | "STRAVA" | "GARMIN" | "TRAINING_PEAKS" | "OTHER_APP";

const DEFAULT_FC_REPOSO = 50;
const DEFAULT_FC_MAX = 185;

function isActivitySourceValue(value: string | null): value is ActivitySourceValue {
  return value !== null && ["MANUAL", "STRAVA", "GARMIN", "TRAINING_PEAKS", "OTHER_APP"].includes(value);
}

function parseLimit(value: string | null): number {
  if (!value) return 20;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(Math.floor(parsed), 200));
}

function calcularRatioReserva(fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!fcMedia || fcMax <= fcReposo) return null;
  const ratio = (fcMedia - fcReposo) / (fcMax - fcReposo);
  return Math.max(0, Math.min(1, ratio));
}

function estimarTrimpBannister(duracionSeg?: number | null, fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!duracionSeg) return null;
  const ratio = calcularRatioReserva(fcMedia, fcReposo, fcMax);
  if (ratio === null) return null;
  const a = 0.64;
  const b = 1.92;
  const durMin = duracionSeg / 60;
  return durMin * ratio * Math.exp(b * ratio) * a;
}

function estimarTss(duracionSeg?: number | null, fcMedia?: number | null, fcReposo: number = DEFAULT_FC_REPOSO, fcMax: number = DEFAULT_FC_MAX) {
  if (!duracionSeg) return null;
  const ratio = calcularRatioReserva(fcMedia, fcReposo, fcMax) ?? 0.7;
  const ifactor = ratio;
  const durHoras = duracionSeg / 3600;
  return durHoras * Math.pow(ifactor, 2) * 100;
}

function estimarEf(distanciaM?: number | null, duracionSeg?: number | null, fcMedia?: number | null, potenciaMedia?: number | null) {
  if (!fcMedia || fcMedia <= 0) return null;
  if (potenciaMedia) return potenciaMedia / fcMedia;
  if (distanciaM && duracionSeg) {
    const velocidadMMin = distanciaM / (duracionSeg / 60);
    return velocidadMMin / fcMedia;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const searchParams = request.nextUrl.searchParams;
    const sourceParam = searchParams.get("source");
    const limitParam = searchParams.get("limit");

    const source = isActivitySourceValue(sourceParam) ? sourceParam : undefined;
    const limit = parseLimit(limitParam);

    const where: Prisma.TrainingActivityWhereInput = { userId };
    if (source) {
      where.source = source;
    }

    const activities = await prisma.trainingActivity.findMany({
      where,
      orderBy: { startDate: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        source: true,
        distance: true,
        duration: true,
        elevation: true,
        calories: true,
        averageHeartRate: true,
        maxHeartRate: true,
        averagePace: true,
        startDate: true,
        endDate: true,
      },
    });

    const totalCount = await prisma.trainingActivity.count({ where });

    const withDerived = activities.map((a) => {
      const tss = estimarTss(a.duration, a.averageHeartRate);
      const trimp = estimarTrimpBannister(a.duration, a.averageHeartRate);
      const ef = estimarEf(a.distance, a.duration, a.averageHeartRate, null);
      return {
        ...a,
        durationMinutes: a.duration ? a.duration / 60 : null,
        distanceKm: a.distance ? a.distance / 1000 : null,
        tss,
        trimp,
        ef,
      };
    });

    return NextResponse.json({ activities: withDerived, total: totalCount });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
