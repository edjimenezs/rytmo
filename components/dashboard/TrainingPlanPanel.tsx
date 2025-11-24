'use client';

const samplePlan = [
  { day: "Lunes", session: "Rodaje suave", durationMin: 45, intensity: "Z2", notes: "Respira nasal, cadencia estable" },
  { day: "Martes", session: "Intervalos", durationMin: 60, intensity: "Z4", notes: "6x4' fuerte / 2' suave" },
  { day: "Miércoles", session: "Fuerza", durationMin: 40, intensity: "Gim", notes: "Full-body, 3x12" },
  { day: "Jueves", session: "Tempo", durationMin: 50, intensity: "Z3", notes: "20' continuos" },
  { day: "Viernes", session: "Swim técnica", durationMin: 35, intensity: "Z1", notes: "Técnica + drills" },
  { day: "Sábado", session: "Tirada larga", durationMin: 80, intensity: "Z2", notes: "Hidratación cada 20'" },
  { day: "Domingo", session: "Descanso", durationMin: 0, intensity: "Rest", notes: "Movilidad ligera" },
];

const getWeekLabel = () =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date());

export default function TrainingPlanPanel() {
  const weekLabel = getWeekLabel();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Training Plan</h3>
          <p className="text-sm text-slate-600">Semana en curso · {weekLabel}</p>
        </div>
        <div className="text-2xl">📅</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {samplePlan.map((item) => (
          <div key={item.day} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.day}</p>
              <p className="text-xs text-slate-600">{item.session}</p>
              <p className="text-xs text-slate-500">
                {item.durationMin ? `${item.durationMin} min` : "Descanso"} · {item.intensity} · {item.notes}
              </p>
            </div>
            <button className="text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100">
              Ajustar
            </button>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-600">
        Próximo paso: sincronizar plan con el coach y marcar sesiones completadas para ajustar carga.
      </div>
    </div>
  );
}
