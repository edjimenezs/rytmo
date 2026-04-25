import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, subDays } from "date-fns";

const PACE_BANDS = [
  { label: "Recuperación", min: 7.0, max: 99, emoji: "🧘" }, // min/km slower than 7:00
  { label: "Aeróbico", min: 5.5, max: 7.0, emoji: "🏃" }, // 5:30 - 7:00
  { label: "Tempo", min: 4.5, max: 5.5, emoji: "⚡️" }, // 4:30 - 5:30
  { label: "Umbral", min: 4.0, max: 4.5, emoji: "🚀" }, // 4:00 - 4:30
  { label: "Intervalos", min: 0, max: 4.0, emoji: "🔥" }, // faster than 4:00
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "90d";

    let daysToSubtract = 90;
    if (range === "30d") daysToSubtract = 30;
    if (range === "7d") daysToSubtract = 7;

    const startDate = startOfDay(subDays(new Date(), daysToSubtract));

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { dateOfBirth: true },
    });

    let maxHR = 190;
    if (profile?.dateOfBirth) {
      const age =
        new Date().getFullYear() -
        new Date(profile.dateOfBirth).getFullYear();
      maxHR = 220 - age;
    }

    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: { gte: startDate },
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        distance: true,
        duration: true,
        averageHeartRate: true,
        maxHeartRate: true,
        averagePace: true,
      },
    });

    if (activities.length === 0) {
      return NextResponse.json({
        summary: {
          totalActivities: 0,
          totalDistanceKm: 0,
          totalDurationMin: 0,
          avgPace: null,
          avgHeartRate: null,
          maxHeartRate: null,
        },
        hrZones: [],
        paceBands: [],
        weeklyLoad: [],
        lastActivities: [],
        message: "No activities found in selected range.",
      });
    }

    let totalDistance = 0;
    let totalDuration = 0;
    let heartRateSum = 0;
    let heartRateCount = 0;
    let maxHeartRateObserved: number | null = null;
    let paceSum = 0;
    let paceCount = 0;

    const hrZones = {
      "Zone 1": { minutes: 0, range: "50-60% HR" },
      "Zone 2": { minutes: 0, range: "60-70% HR" },
      "Zone 3": { minutes: 0, range: "70-80% HR" },
      "Zone 4": { minutes: 0, range: "80-90% HR" },
      "Zone 5": { minutes: 0, range: "90-100% HR" },
    };

    const paceBandsCount = PACE_BANDS.map((band) => ({
      ...band,
      count: 0,
      distanceKm: 0,
    }));

    const weeklyBuckets: Record<
      string,
      { distance: number; duration: number }
    > = {};

    for (const activity of activities) {
      if (activity.distance) totalDistance += activity.distance;
      if (activity.duration) totalDuration += activity.duration;

      if (activity.averageHeartRate) {
        heartRateSum += activity.averageHeartRate;
        heartRateCount += 1;
      }
      if (activity.maxHeartRate) {
        maxHeartRateObserved =
          maxHeartRateObserved === null
            ? activity.maxHeartRate
            : Math.max(maxHeartRateObserved, activity.maxHeartRate);
      }
      if (activity.averagePace && activity.averagePace > 0) {
        paceSum += activity.averagePace;
        paceCount += 1;
      }

      // HR zones (simple bucket using average HR)
      if (activity.averageHeartRate && activity.duration) {
        const hrPercent = (activity.averageHeartRate / maxHR) * 100;
        const minutes = activity.duration / 60;
        if (hrPercent < 60) hrZones["Zone 1"].minutes += minutes;
        else if (hrPercent < 70) hrZones["Zone 2"].minutes += minutes;
        else if (hrPercent < 80) hrZones["Zone 3"].minutes += minutes;
        else if (hrPercent < 90) hrZones["Zone 4"].minutes += minutes;
        else hrZones["Zone 5"].minutes += minutes;
      }

      // Pace distribution
      if (activity.averagePace && activity.averagePace > 0) {
        const paceMinPerKm = activity.averagePace;
        const band = paceBandsCount.find(
          (b) => paceMinPerKm >= b.min && paceMinPerKm < b.max
        );
        if (band) {
          band.count += 1;
          band.distanceKm += (activity.distance || 0) / 1000;
        }
      }

      // Weekly load
      const weekKey = startOfWeek(activity.startDate, {
        weekStartsOn: 1,
      }).toISOString();
      if (!weeklyBuckets[weekKey]) {
        weeklyBuckets[weekKey] = { distance: 0, duration: 0 };
      }
      weeklyBuckets[weekKey].distance += activity.distance || 0;
      weeklyBuckets[weekKey].duration += activity.duration || 0;
    }

    const weeklyLoad = Object.entries(weeklyBuckets)
      .map(([week, data]) => ({
        week,
        distanceKm: Number((data.distance / 1000).toFixed(1)),
        durationHours: Number((data.duration / 3600).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-5);

    const hrZoneArr = Object.entries(hrZones).map(([zone, data]) => ({
      zone,
      minutes: Math.round(data.minutes),
      percentage:
        totalDuration > 0
          ? Math.round((data.minutes * 60) / totalDuration * 100)
          : 0,
      range: data.range,
    }));

    const paceBandArr = paceBandsCount.map((band) => ({
      label: band.label,
      emoji: band.emoji,
      count: band.count,
      distanceKm: Number(band.distanceKm.toFixed(1)),
    }));

    const lastActivities = activities.slice(0, 5).map((a: (typeof activities)[0]) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      startDate: a.startDate,
      distanceKm: a.distance ? Number((a.distance / 1000).toFixed(2)) : null,
      durationMin: a.duration ? Math.round(a.duration / 60) : null,
      avgPace: a.averagePace,
      avgHR: a.averageHeartRate,
    }));

    return NextResponse.json({
      summary: {
        totalActivities: activities.length,
        totalDistanceKm: Number((totalDistance / 1000).toFixed(1)),
        totalDurationMin: Math.round(totalDuration / 60),
        avgPace:
          paceCount > 0 ? Number((paceSum / paceCount).toFixed(2)) : null,
        avgHeartRate:
          heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : null,
        maxHeartRate: maxHeartRateObserved,
      },
      hrZones: hrZoneArr,
      paceBands: paceBandArr,
      weeklyLoad,
      lastActivities,
    });
  } catch (error) {
    console.error("Error fetching physical analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch physical analysis" },
      { status: 500 }
    );
  }
}
