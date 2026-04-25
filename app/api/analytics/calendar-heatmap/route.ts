import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getStartDateFromRange } from "@/lib/utils/range";

type ActivityHeatmap = Prisma.TrainingActivityGetPayload<{
  select: {
    startDate: true;
    duration: true;
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(request.url);

    const startDate = getStartDateFromRange(searchParams.get("range") ?? "90d");

    const activities: ActivityHeatmap[] = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: { gte: startDate },
      },
      select: {
        startDate: true,
        duration: true,
      },
    });

    const groupedData = new Map<string, { count: number; duration: number }>();

    activities.forEach((activity) => {
      const dateKey = format(new Date(activity.startDate), "yyyy-MM-dd");
      const existing = groupedData.get(dateKey) || { count: 0, duration: 0 };

      groupedData.set(dateKey, {
        count: existing.count + 1,
        duration: existing.duration + (activity.duration ? activity.duration / 60 : 0),
      });
    });

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
