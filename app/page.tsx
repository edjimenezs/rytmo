import Link from "next/link";
import IntegrationCard from "@/components/integrations/IntegrationCard";

const integrationHighlights = [
  {
    key: "strava",
    title: "Strava",
    description: "Fueling decisions alimentadas con el histórico de Strava y tus zonas de esfuerzo.",
    icon: "🏃",
    helper: "Historias públicas de métricas y segmentos están disponibles tras conectar.",
    ctaHref: "/auth/login",
  },
  {
    key: "trainingpeaks",
    title: "TrainingPeaks",
    description: "Tus sesiones planificadas alimentan los objetivos diarios y la carga de entrenamiento.",
    icon: "📅",
    helper: "Sincroniza bloques y fases para ver qué comer antes, durante y después.",
    ctaHref: "/auth/login",
  },
  {
    key: "garmin",
    title: "Garmin",
    description: "Dispositivos, ritmos y frecuencia cardíaca que completan el contexto del día.",
    icon: "⌚",
    helper: "Combine sensores y planes en un solo panel de decisiones.",
    ctaHref: "/auth/login",
  },
];

const highlights = [
  {
    title: "Datos + decisión",
    detail: "Cada recomendación combina cargas recientes con tu check-in y objetivos del día.",
  },
  {
    title: "Comidas accionables",
    detail: "Olvida los gramos. Recibe combinaciones reales: yogurt, avena, gel o arroz + pollo.",
  },
  {
    title: "Salida AI controlada",
    detail: "Las reglas solo sugieren comida; tú sigues el plan y entregas feedback al final del día.",
  },
];

export default function Home() {
  return (
    <div className="bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              RytMo · nutrición inteligente
            </p>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Convierte tu entrenamiento en decisiones de alimentación simples para hoy.
              </h1>
              <p className="text-lg leading-relaxed text-slate-600">
                RytMo lee tus actividades en Strava, TrainingPeaks y Garmin para sugerir comidas
                prácticas antes, durante y después del entrenamiento. No necesitas calcular macros:
                nosotros lo hacemos por ti.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Ver plan diario
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Panel modular del día</h3>
            <p className="text-sm text-slate-500">
              Remote un vistazo rápido de la carga, el enfoque nutricional y el estado del plan.
            </p>
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Carga</p>
                <p className="text-2xl font-semibold text-slate-900">72</p>
                <p className="text-xs text-slate-500">CTL 64 · ATL 57</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Objetivo</p>
                <p className="text-2xl font-semibold text-slate-900">Recuperación activa</p>
                <p className="text-xs text-slate-500">Foco en carbohidratos fáciles + proteína</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tiempo</p>
                <p className="text-2xl font-semibold text-slate-900">Poco más de 24 hrs</p>
                <p className="text-xs text-slate-500">Haz check-in y ajusta la recomendación de cena</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
              Integraciones
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">Conecta tus plataformas favoritas</h2>
            <p className="max-w-2xl text-slate-600">
              RytMo consume Strava, TrainingPeaks y Garmin para mantener la nutrición alineada con
              cada sesión. Conecta y sincroniza en segundos.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {integrationHighlights.map((integration) => (
              <IntegrationCard
                key={integration.key}
                title={integration.title}
                description={integration.description}
                icon={integration.icon}
                helperText={integration.helper}
                ctaHref={integration.ctaHref}
              />
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
              Qué hace diferente a RytMo
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">Panel modular, decisiones rápidas</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur"
              >
                <p className="text-sm font-semibold text-slate-900">{highlight.title}</p>
                <p className="mt-3 text-sm text-slate-600">{highlight.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
