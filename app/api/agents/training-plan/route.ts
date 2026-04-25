import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { askLLM } from "@/lib/ai/llm";

type TrainingActivitySummary = Prisma.TrainingActivityGetPayload<{
  select: {
    id: true;
    name: true;
    type: true;
    distance: true;
    duration: true;
    averageHeartRate: true;
    startDate: true;
  };
}>;

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    // Últimos entrenos para dar contexto al agente
    const activities: TrainingActivitySummary[] = await prisma.trainingActivity.findMany({
      where: { userId, startDate: { gte: subDays(new Date(), 21) } },
      orderBy: { startDate: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        type: true,
        distance: true,
        duration: true,
        averageHeartRate: true,
        startDate: true,
      },
    });

    const totalDistance =
      activities.reduce((sum: number, a: { distance: number | null }) => sum + (a.distance ?? 0), 0) / 1000;
    const totalDuration = activities.reduce(
      (sum: number, a: { duration: number | null }) => sum + (a.duration ?? 0),
      0
    );
    const avgHR =
      activities.reduce((sum: number, a: { averageHeartRate: number | null }) => sum + (a.averageHeartRate ?? 0), 0) /
      (activities.filter((a: { averageHeartRate: number | null }) => a.averageHeartRate).length || 1);

    let suggestions = [
      {
        title: "Distribución semanal",
        body:
          "Combina 2 días Z1-Z2, 2 días Z3 (tempo) y 1 día Z4 (intervalos). Ajusta volumen si aparece fatiga.",
      },
      {
        title: "Intervalos personalizados",
        body:
          "Usa bloques de 6x3'-4' en Z4 con 2' suaves. Revisa FC media previa (" +
          (isFinite(avgHR) ? Math.round(avgHR) : "—") +
          " bpm) para decidir intensidad.",
      },
      {
        title: "Carga progresiva",
        body:
          "Mantén incrementos semanales <10-12%. Volumen reciente: " +
          totalDistance.toFixed(1) +
          " km y " +
          Math.round(totalDuration / 60) +
          " min.",
      },
    ];

    // Optional: Enhance suggestions via LLM if API key present
    const prompt = `
Eres un coach de endurance. Genera 3 sugerencias concisas para el plan semanal.
Datos recientes: ${JSON.stringify({
      totalDistanceKm: Number(totalDistance.toFixed(1)),
      totalDurationMin: Math.round(totalDuration / 60),
      avgHeartRate: isFinite(avgHR) ? Math.round(avgHR) : null,
      activities,
    })}

Devuelve solo JSON con la forma:
{ "suggestions":[ { "title": "...", "body": "..." }, ... ] }
No incluyas texto fuera del JSON.
`;
    const aiText = await askLLM(prompt, {
      system: "Coach experto en periodización. Devuelve JSON válido.",
    });
    if (aiText) {
      try {
        const aiJson = JSON.parse(aiText);
        if (Array.isArray(aiJson?.suggestions)) {
          suggestions = aiJson.suggestions.slice(0, 4);
        }
      } catch {
        // ignore parse errors, fallback to defaults
      }
    }

    return NextResponse.json({
      summary: {
        totalDistanceKm: Number(totalDistance.toFixed(1)),
        totalDurationMin: Math.round(totalDuration / 60),
        avgHeartRate: isFinite(avgHR) ? Math.round(avgHR) : null,
      },
      activities,
      suggestions,
    });
  } catch (error) {
    console.error("Error in training plan agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch training plan agent data" },
      { status: 500 }
    );
  }
}
