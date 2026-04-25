import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { getTrainingPlanEntries } from "@/lib/training/plan";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = request.nextUrl;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;

    const entries = await getTrainingPlanEntries(user.id, start, end);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching training plan entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch training plan entries" },
      { status: 500 }
    );
  }
}
