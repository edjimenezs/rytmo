import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    // Get last 12 weeks (84 days)
    const startDate = startOfDay(subDays(new Date(), 84));

    // Fetch activities
    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: {
          gte: startDate,
        },
      },
      select: {
        startDate: true,
        duration: true,
      },
    });

    // Group by date
    const groupedData = new Map<string, { count: number; duration: number }>();

    activities.forEach((activity: { startDate: Date; duration: number | null }) => {
      const dateKey = format(new Date(activity.startDate), "yyyy-MM-dd");
      const existing = groupedData.get(dateKey) || { count: 0, duration: 0 };

      groupedData.set(dateKey, {
        count: existing.count + 1,
        duration: existing.duration + (activity.duration ? activity.duration / 60 : 0), // Convert to minutes
      });
    });

    // Format for response
    const result = Array.from(groupedData.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      duration: Math.round(data.duration),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching calendar heatmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar heatmap data" },
      { status: 500 }
    );
  }
}
