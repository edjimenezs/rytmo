import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { UserRole } from "@prisma/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import NutritionPanel from "@/components/dashboard/NutritionPanel";
import TrainingPlanPanel from "@/components/dashboard/TrainingPlanPanel";
import NutritionAgentPanel from "@/components/dashboard/NutritionAgentPanel";

export default async function NutritionPlanPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = (user as any).role as UserRole;

  if (userRole !== UserRole.ATHLETE) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.name} userRole="ATHLETE" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nutrition Plan</h1>
            <p className="text-sm text-gray-600">Macros objetivo, menú diario y asistencia con IA/nutriólogo.</p>
          </div>

          <NutritionPanel />

          <NutritionAgentPanel />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Asistencia del nutriólogo</h3>
            <p className="text-sm text-slate-600 mb-3">
              Solicita ajustes de macros, sustituciones o un menú acorde a tus sesiones y preferencias.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                Pedir ajuste de macros
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                Solicitar menú personalizado
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-dashed border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-600">
              Tip: coordina con tu plan de entrenamiento; más carga = más CH. Consulta al coach o nutriólogo para sinergias.
            </p>
          </div>

          {/* Vista rápida del plan de entrenamiento para alinear nutrición */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Plan de entrenamiento de referencia</h2>
            <TrainingPlanPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
