import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { matchTrainingPlanEntries } from "@/lib/training/plan";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = request.nextUrl;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;

    const result = await matchTrainingPlanEntries(user.id, start, end);
    return NextResponse.json({ matched: result.matched });
  } catch (error) {
    console.error("Error matching training plan entries:", error);
    return NextResponse.json(
      { error: "Failed to match training plan entries" },
      { status: 500 }
    );
  }
}
