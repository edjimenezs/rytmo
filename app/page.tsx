import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
    key: "garmin",
    title: "Garmin Connect",
    description: "Sueño, body battery y frecuencia cardíaca en reposo completan el contexto del día.",
    icon: "⌚",
    helper: "Conecta tu cuenta Garmin para ajustar la nutrición según tu recuperación real.",
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

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <div className="bg-[#0d1117]">
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              RytMo · nutrición inteligente
            </p>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight text-[#e6edf3] sm:text-5xl">
                Convierte tu entrenamiento en decisiones de alimentación simples para hoy.
              </h1>
              <p className="text-lg leading-relaxed text-[#8b949e]">
                RytMo lee tus actividades en Strava y Garmin para sugerir comidas prácticas antes,
                durante y después del entrenamiento. No necesitas calcular macros: nosotros lo
                hacemos por ti.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Ver plan diario
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#e6edf3] transition hover:bg-white/5"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#161b22] border border-white/[0.08] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#e6edf3]">Tu plan del día</p>
              <span className="rounded-full bg-orange-900/40 px-2.5 py-0.5 text-xs font-medium text-orange-400">Carga alta</span>
            </div>
            <p className="text-xs text-[#8b949e]">🚴 ROUVY Rodillo 75min · 187 W · 148 bpm</p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <p className="text-xs font-medium text-[#8b949e] mb-1">Desayuno</p>
                <p className="text-sm text-[#e6edf3]">Avena con plátano y miel · café con leche</p>
              </div>
              <div className="rounded-2xl bg-orange-900/30 px-4 py-3 border border-orange-500/20">
                <p className="text-xs font-medium text-orange-400 mb-1">Pre-entreno · 30 min antes</p>
                <p className="text-sm text-[#e6edf3]">1 tostada con mermelada · agua con sal</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <p className="text-xs font-medium text-[#8b949e] mb-1">Post-entreno</p>
                <p className="text-sm text-[#e6edf3]">Yogurt griego + fruta · arroz con pollo</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              Integraciones
            </p>
            <h2 className="text-3xl font-semibold text-[#e6edf3]">Conecta tus plataformas favoritas</h2>
            <p className="max-w-2xl text-[#8b949e]">
              RytMo consume Strava y Garmin para mantener la nutrición alineada con cada sesión.
              Conecta y sincroniza en segundos.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              Qué hace diferente a RytMo
            </p>
            <h2 className="text-3xl font-semibold text-[#e6edf3]">Nutrición basada en tu entrenamiento real</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-sm font-semibold text-[#e6edf3]">{highlight.title}</p>
                <p className="mt-3 text-sm text-[#8b949e]">{highlight.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
