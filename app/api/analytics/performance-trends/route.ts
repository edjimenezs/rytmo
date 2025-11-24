import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const activityType = searchParams.get("activityType");

    // Calculate date range
    let daysToSubtract = 30;
    if (range === "7d") daysToSubtract = 7;
    else if (range === "90d") daysToSubtract = 90;
    else if (range === "1y") daysToSubtract = 365;

    const startDate = startOfDay(subDays(new Date(), daysToSubtract));

    // Build where clause
    const where: any = {
      userId,
      startDate: {
        gte: startDate,
      },
    };

    if (activityType) {
      where.type = activityType;
    }

    // Fetch training activities
    const activities = await prisma.trainingActivity.findMany({
      where,
      orderBy: {
        startDate: "asc",
      },
      select: {
        startDate: true,
        averagePace: true,
        distance: true,
        duration: true,
      },
    });

    // Group by week to reduce noise
    const groupedData = new Map<string, { paceSum: number; distanceSum: number; durationSum: number; count: number }>();

    activities.forEach((activity: { startDate: string | Date; averagePace: number | null; distance: number | null; duration: number | null }) => {
      const dateKey = new Intl.DateTimeFormat("en-CA").format(new Date(activity.startDate));
      const existing = groupedData.get(dateKey) || { paceSum: 0, distanceSum: 0, durationSum: 0, count: 0 };

      groupedData.set(dateKey, {
        paceSum: existing.paceSum + (activity.averagePace || 0),
        distanceSum: existing.distanceSum + (activity.distance ? activity.distance / 1000 : 0), // Convert to km
        durationSum: existing.durationSum + (activity.duration ? activity.duration / 60 : 0), // Convert to minutes
        count: existing.count + 1,
      });
    });

    // Calculate averages and format for response
    const result = Array.from(groupedData.entries())
      .map(([date, data]) => ({
        date: new Intl.DateTimeFormat("es-ES", {
          month: "short",
          day: "2-digit",
        }).format(new Date(date)),
        averagePace: data.count > 0 ? Math.round((data.paceSum / data.count) * 100) / 100 : 0,
        averageSpeed: data.count > 0 && data.paceSum > 0 ? Math.round((60 / (data.paceSum / data.count)) * 10) / 10 : 0,
        distance: Math.round(data.distanceSum * 10) / 10,
      }))
      .filter(item => item.averagePace > 0 || item.distance > 0); // Only include days with data

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance trends data" },
      { status: 500 }
    );
  }
}
