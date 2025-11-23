import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { askLLM } from "@/lib/ai/llm";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    const activities = await prisma.trainingActivity.findMany({
      where: { userId, startDate: { gte: subDays(new Date(), 14) } },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        type: true,
        distance: true,
        duration: true,
        averageHeartRate: true,
        startDate: true,
      },
    });

    const totalDuration = activities.reduce((sum: number, a: { duration: number | null }) => sum + (a.duration ?? 0), 0);
    const hours = totalDuration / 3600;

    // Heurística simple para macros (placeholder, a ajustar con nutriólogo + IA)
    const baseCalories = 2000;
    const calories = Math.round(baseCalories + hours * 180);
    const protein = Math.round(1.8 * 70); // 70kg estimado
    const carbs = Math.round(3.5 * 70 + hours * 50);
    const fat = Math.round((calories * 0.3) / 9);

    let suggestions = [
      {
        title: "Post-entreno",
        body: "Incluye 20-30g de proteína y 0.8-1g/kg de CH en la primera hora tras sesiones intensas.",
      },
      {
        title: "Días de carga alta",
        body: "Sube CH 10-20% en días con intervalos o tirada larga; prioriza comidas de fácil digestión.",
      },
      {
        title: "Hidratación y micronutrientes",
        body: "Añade electrolitos en sesiones >60' y al menos 3 porciones de frutas/verduras al día.",
      },
    ];

    // Base summary before IA adjustments
    let summary = {
      calories,
      protein,
      carbs,
      fat,
      trainingHours: Number(hours.toFixed(1)),
    };

    const prompt = `
Eres un nutriólogo deportivo. Con estos datos ${JSON.stringify({
      summary,
      activities: activities.slice(0, 5),
    })} sugiere macros ajustados y 3 recomendaciones prácticas.
Devuelve solo JSON:
{ "summary": { "calories": number, "protein": number, "carbs": number, "fat": number }, "suggestions":[{ "title": "...", "body": "..." }] }
No agregues texto adicional.
`;

    const aiText = await askLLM(prompt, {
      system: "Nutriólogo deportivo, devuelve JSON válido.",
    });
    if (aiText) {
      try {
        const aiJson = JSON.parse(aiText);
        if (aiJson?.summary) {
          summary = {
            calories: aiJson.summary.calories ?? summary.calories,
            protein: aiJson.summary.protein ?? summary.protein,
            carbs: aiJson.summary.carbs ?? summary.carbs,
            fat: aiJson.summary.fat ?? summary.fat,
            trainingHours: summary.trainingHours,
          };
        }
        if (Array.isArray(aiJson?.suggestions)) {
          suggestions = aiJson.suggestions.slice(0, 4);
        }
      } catch {
        // fallback to defaults
      }
    }

    return NextResponse.json({
      summary,
      suggestions,
      activities: activities.slice(0, 5),
    });
  } catch (error) {
    console.error("Error in nutrition plan agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition plan agent data" },
      { status: 500 }
    );
  }
}
