import Link from 'next/link';
import { buildActionPlan, type ActionPlanResponse } from '@/lib/action-plan/plan';

type Props = {
  userId: string;
};

const priorityClasses: Record<NonNullable<ActionPlanResponse['tasks']>[number]['priority'], string> = {
  high: 'bg-rose-500/10 text-rose-600 border border-rose-100',
  medium: 'bg-amber-500/10 text-amber-600 border border-amber-100',
  low: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const dueLabels: Record<NonNullable<ActionPlanResponse['tasks']>[number]['due'], string> = {
  before: 'Antes',
  during: 'Durante',
  after: 'Después',
  anytime: 'Ahora',
};

const typeLabels: Record<NonNullable<ActionPlanResponse['tasks']>[number]['type'], string> = {
  training: 'Entrenamiento',
  nutrition: 'Nutrición',
  recovery: 'Recuperación',
};

const integrationLabels = {
  strava: 'Strava',
  trainingPeaks: 'TrainingPeaks',
  garmin: 'Garmin',
} as const;

const formatNumber = (value?: number | null) => (value !== null && value !== undefined ? value.toFixed(1) : '-');

export default async function ActionCanvas({ userId }: Props) {
  const actionPlan = await buildActionPlan(userId);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Qué hago y cómo como ahora</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {actionPlan.planEntry ? `${actionPlan.planEntry.sessionType} · ${actionPlan.planEntry.title}` : 'Día de mantenimiento'}
          </h2>
          <p className="text-sm text-slate-500">{actionPlan.summary}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">CTL</p>
            <p className="text-lg font-semibold text-slate-900">{formatNumber(actionPlan.metrics.ctl)}</p>
            <p className="text-xs text-slate-500">carga base</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">ATL</p>
            <p className="text-lg font-semibold text-slate-900">{formatNumber(actionPlan.metrics.atl)}</p>
            <p className="text-xs text-slate-500">fatiga reciente</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">ACWR</p>
            <p className="text-lg font-semibold text-slate-900">{formatNumber(actionPlan.metrics.acwr)}</p>
            <p className="text-xs text-slate-500">balance ATL/CTL</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
          <span>
            <strong className="text-slate-900">CTL</strong> = carga acumulada de las últimas 6 semanas. Si baja, estás recuperando.
          </span>
          <span>
            <strong className="text-slate-900">ATL</strong> = fatiga de los últimos 7 días. Alto = moderá intensidad y enfocate en recuperación.
          </span>
          <span>
            <strong className="text-slate-900">ACWR</strong> = relación ATL/CTL. Entre 0.8 y 1.3 es estable; muy alto o muy bajo pide ajuste.
          </span>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Integraciones</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(actionPlan.integrations).map(([key, data]) => (
            <div
              key={key}
              className="flex-1 min-w-[160px] rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{integrationLabels[key as keyof typeof integrationLabels]}</p>
              <p className="text-sm font-semibold text-slate-900">
                {data.connected ? 'Conectado' : 'Sin conexión'}
              </p>
              <p className="text-xs text-slate-500">Última: {data.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString() : 'Pendiente'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Acciones del día</p>
            <p className="text-xs text-slate-500">Prioritiza entrenamiento, nutrición y recuperación.</p>
          </div>
          <p className="text-xs text-slate-400">{new Date(actionPlan.date).toLocaleDateString()}</p>
        </div>
        <p className="text-xs text-slate-500">
          Cada comida recomienda ingredientes chilenos concretos (palta, marraqueta, charquicán) para platear en tu cocina.
        </p>
        <div className="space-y-4">
          {actionPlan.tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <span className="text-slate-900 font-semibold">{typeLabels[task.type]}</span>
                  <span>{dueLabels[task.due]}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${priorityClasses[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-base font-semibold text-slate-900">{task.text}</p>
              {task.meta?.tss && (
                <p className="text-xs text-slate-500">TSS estimado: {Math.round(task.meta.tss)}</p>
              )}
              {task.foods && task.foods.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {task.foods.map((food) => (
                    <div key={food.name} className="rounded-xl border border-slate-200 bg-white p-2">
                      <p className="text-sm font-semibold text-slate-900">{food.name}</p>
                      <p className="text-[11px] text-slate-500">{food.portion}</p>
                    </div>
                  ))}
                </div>
              )}
              {task.link && (
                <Link
                  href={task.link.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                >
                  {task.link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Otras vistas</p>
          <p className="text-xs text-slate-400">Explora más secciones</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/training-plan"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Plan de entrenamiento
          </Link>
          <Link
            href="/dashboard/nutrition-plan"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Plan nutricional completo
          </Link>
          <Link
            href="/dashboard/training-load"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cargas y gráficos
          </Link>
          <Link
            href="/checkin"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Registrar check-in
          </Link>
        </div>
      </div>
    </div>
  );
}
