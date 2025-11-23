import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

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

    // Fetch training activities
    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // Group by date and calculate totals
    const groupedData = new Map<string, { duration: number; distance: number }>();

    activities.forEach((activity) => {
      const dateKey = format(new Date(activity.startDate), "yyyy-MM-dd");
      const existing = groupedData.get(dateKey) || { duration: 0, distance: 0 };

      groupedData.set(dateKey, {
        duration: existing.duration + (activity.duration ? activity.duration / 60 : 0), // Convert to minutes
        distance: existing.distance + (activity.distance ? activity.distance / 1000 : 0), // Convert to km
      });
    });

    // Fill in missing dates with zeros and format for response
    const result = [];
    for (let i = daysToSubtract - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, "yyyy-MM-dd");
      const data = groupedData.get(dateKey) || { duration: 0, distance: 0 };

      result.push({
        date: format(date, "MMM dd"),
        duration: Math.round(data.duration),
        distance: Math.round(data.distance * 10) / 10,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching training volume:", error);
    return NextResponse.json(
      { error: "Failed to fetch training volume data" },
      { status: 500 }
    );
  }
}
