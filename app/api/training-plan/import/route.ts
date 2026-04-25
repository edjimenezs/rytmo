import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import {
  matchTrainingPlanEntries,
  parseTrainingPlanCsv,
  storeTrainingPlanEntries,
} from "@/lib/training/plan";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("plan");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Plan file is required" }, { status: 400 });
    }

    const contents = await file.text();
    const rows = parseTrainingPlanCsv(contents);
    if (!rows.length) {
      return NextResponse.json({ error: "No valid rows found" }, { status: 400 });
    }

    const result = await storeTrainingPlanEntries(user.id, rows);
    const match = await matchTrainingPlanEntries(user.id);

    return NextResponse.json({
      imported: rows.length,
      created: result.created,
      matched: match.matched,
    });
  } catch (error) {
    console.error("Training plan import failed:", error);
    return NextResponse.json(
      { error: "Failed to import training plan" },
      { status: 500 }
    );
  }
}
