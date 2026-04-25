import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { format, subDays } from "date-fns";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getStartDateFromRange } from "@/lib/utils/range";

type VolumeActivity = Prisma.TrainingActivityGetPayload<{
  select: {
    startDate: true;
    duration: true;
    distance: true;
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(request.url);

    const startDate = getStartDateFromRange(searchParams.get("range"));
    const daysToSubtract = Math.round((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const activities: VolumeActivity[] = await prisma.trainingActivity.findMany({
      where: {
        userId,
        startDate: { gte: startDate },
      },
      orderBy: {
        startDate: "asc",
      },
      select: {
        startDate: true,
        duration: true,
        distance: true,
      },
    });

    const groupedData = new Map<string, { duration: number; distance: number }>();

    activities.forEach((activity) => {
      const dateKey = format(new Date(activity.startDate), "yyyy-MM-dd");
      const existing = groupedData.get(dateKey) || { duration: 0, distance: 0 };
      groupedData.set(dateKey, {
        duration: existing.duration + (activity.duration ? activity.duration / 60 : 0),
        distance: existing.distance + (activity.distance ? activity.distance / 1000 : 0),
      });
    });

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
