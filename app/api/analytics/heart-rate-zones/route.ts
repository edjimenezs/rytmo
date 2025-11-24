import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

// Heart rate zones based on % of max HR (estimated as 220 - age)
// Zone 1: 50-60% - Recovery
// Zone 2: 60-70% - Aerobic
// Zone 3: 70-80% - Tempo
// Zone 4: 80-90% - Threshold
// Zone 5: 90-100% - Maximum

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    // Calculate date range
    let daysToSubtract = 30;
    if (range === "7d") daysToSubtract = 7;
    else if (range === "90d") daysToSubtract = 90;
    else if (range === "1y") daysToSubtract = 365;

    const startDate = startOfDay(subDays(new Date(), daysToSubtract));

    // Fetch user profile for age calculation
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { dateOfBirth: true },
    });

    // Calculate max heart rate (simplified formula: 220 - age)
    let maxHR = 190; // Default if age not available
    if (profile?.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear();
      maxHR = 220 - age;
    }

    // Fetch activities with heart rate data
    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
        },
        averageHeartRate: {
          not: null,
        },
      },
      select: {
        averageHeartRate: true,
        duration: true,
      },
    });

    // Initialize zone counters (in minutes)
    const zones = {
      "Zone 1": { minutes: 0, percentage: 0, range: "50-60% HR" },
      "Zone 2": { minutes: 0, percentage: 0, range: "60-70% HR" },
      "Zone 3": { minutes: 0, percentage: 0, range: "70-80% HR" },
      "Zone 4": { minutes: 0, percentage: 0, range: "80-90% HR" },
      "Zone 5": { minutes: 0, percentage: 0, range: "90-100% HR" },
    };

    let totalMinutes = 0;

    activities.forEach((activity: { averageHeartRate: number | null; duration: number | null }) => {
      if (!activity.averageHeartRate || !activity.duration) return;

      const duration = activity.duration / 60; // Convert to minutes
      const hrPercent = (activity.averageHeartRate / maxHR) * 100;

      totalMinutes += duration;

      // Categorize into zones
      if (hrPercent < 60) {
        zones["Zone 1"].minutes += duration;
      } else if (hrPercent < 70) {
        zones["Zone 2"].minutes += duration;
      } else if (hrPercent < 80) {
        zones["Zone 3"].minutes += duration;
      } else if (hrPercent < 90) {
        zones["Zone 4"].minutes += duration;
      } else {
        zones["Zone 5"].minutes += duration;
      }
    });

    // Calculate percentages
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
