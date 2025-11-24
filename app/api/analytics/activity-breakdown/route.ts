import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

type ActivityTypeValue =
  | "RUNNING"
  | "CYCLING"
  | "SWIMMING"
  | "WALKING"
  | "WEIGHTLIFTING"
  | "YOGA"
  | "OTHER";

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

    // Fetch activities grouped by type
    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
        },
      },
      select: {
        type: true,
        distance: true,
      },
    });

    // Group by activity type
    const groupedData = new Map<ActivityTypeValue, { value: number; count: number }>();

    activities.forEach((activity: { type: ActivityTypeValue; distance: number | null }) => {
      const type = activity.type;
      const existing = groupedData.get(type) || { value: 0, count: 0 };
      groupedData.set(type, {
        value: existing.value + (activity.distance ? activity.distance / 1000 : 0), // Convert to km
        count: existing.count + 1,
      });
    });

    // Format for response
    const result = Array.from(groupedData.entries()).map(([type, data]) => ({
      name: type,
      value: Math.round(data.value * 10) / 10,
      count: data.count,
    }));

    // Sort by value descending
    result.sort((a, b) => b.value - a.value);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching activity breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity breakdown data" },
      { status: 500 }
    );
  }
}
