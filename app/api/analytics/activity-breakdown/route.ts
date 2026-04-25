import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getStartDateFromRange } from "@/lib/utils/range";

type ActivityTypeValue =
  | "RUNNING"
  | "CYCLING"
  | "SWIMMING"
  | "WALKING"
  | "WEIGHTLIFTING"
  | "YOGA"
  | "OTHER";

type ActivityDistance = Prisma.TrainingActivityGetPayload<{
  select: {
    type: true;
    distance: true;
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(request.url);

    const startDate = getStartDateFromRange(searchParams.get("range"));

    const where: Prisma.TrainingActivityWhereInput = {
      userId,
      startDate: { gte: startDate },
    };

    const activities: ActivityDistance[] = await prisma.trainingActivity.findMany({
      where,
      select: {
        type: true,
        distance: true,
      },
    });

    const groupedData = new Map<ActivityTypeValue, { value: number; count: number }>();

    activities.forEach((activity) => {
      const type = activity.type;
      const existing = groupedData.get(type) || { value: 0, count: 0 };
      groupedData.set(type, {
        value: existing.value + (activity.distance ? activity.distance / 1000 : 0),
        count: existing.count + 1,
      });
    });

    const result = Array.from(groupedData.entries()).map(([type, data]) => ({
      name: type,
      value: Math.round(data.value * 10) / 10,
      count: data.count,
    }));

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
