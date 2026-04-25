import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import TrainingPlanPanel from "@/components/dashboard/TrainingPlanPanel";
import NutritionPanel from "@/components/dashboard/NutritionPanel";
import TrainingPlanAgentPanel from "@/components/dashboard/TrainingPlanAgentPanel";

export default async function TrainingPlanPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.role ?? UserRole.ATHLETE;

  if (userRole !== UserRole.ATHLETE) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Plan</h1>
            <p className="text-sm text-gray-600">Detalle de tu semana, ajustes y asistencia del coach.</p>
          </div>

          <TrainingPlanPanel />

          <TrainingPlanAgentPanel />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Asistencia del coach</h3>
            <p className="text-sm text-slate-600 mb-3">
              Pide ayuda para ajustar cargas, ritmos o replanificar sesiones según fatiga o disponibilidad.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                Pedir ajuste al coach
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                Solicitar sesión alternativa
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-dashed border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-600">
              Tip: marca sesiones completadas desde Activities para que el agente ajuste carga y recomendaciones.
            </p>
          </div>

          {/* Vista rápida de nutrición para coordinar con el plan */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nutrición sugerida</h2>
            <NutritionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
