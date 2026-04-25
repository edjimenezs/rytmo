import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getStartDateFromRange } from "@/lib/utils/range";

type HeartRateActivity = Prisma.TrainingActivityGetPayload<{
  select: {
    averageHeartRate: true;
    duration: true;
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(request.url);

    const startDate = getStartDateFromRange(searchParams.get("range"));

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { dateOfBirth: true },
    });

    let maxHR = 190;
    if (profile?.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear();
      maxHR = 220 - age;
    }

    const activities: HeartRateActivity[] = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: { gte: startDate },
        averageHeartRate: { not: null },
      },
      select: {
        averageHeartRate: true,
        duration: true,
      },
    });

    const zones: Record<string, { minutes: number; range: string }> = {
      "Zone 1": { minutes: 0, range: "50-60% HR" },
      "Zone 2": { minutes: 0, range: "60-70% HR" },
      "Zone 3": { minutes: 0, range: "70-80% HR" },
      "Zone 4": { minutes: 0, range: "80-90% HR" },
      "Zone 5": { minutes: 0, range: "90-100% HR" },
    } as const;

    let totalMinutes = 0;

    activities.forEach((activity) => {
      if (!activity.averageHeartRate || !activity.duration) return;

      const durationMinutes = activity.duration / 60;
      const hrPercent = (activity.averageHeartRate / maxHR) * 100;
      totalMinutes += durationMinutes;

      if (hrPercent < 60) {
        zones["Zone 1"].minutes += durationMinutes;
      } else if (hrPercent < 70) {
        zones["Zone 2"].minutes += durationMinutes;
      } else if (hrPercent < 80) {
        zones["Zone 3"].minutes += durationMinutes;
      } else if (hrPercent < 90) {
        zones["Zone 4"].minutes += durationMinutes;
      } else {
        zones["Zone 5"].minutes += durationMinutes;
      }
    });

    const result = Object.entries(zones).map(([zone, data]) => ({
      zone,
      minutes: Math.round(data.minutes),
      percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
      range: data.range,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching heart rate zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch heart rate zones data" },
      { status: 500 }
    );
  }
}
