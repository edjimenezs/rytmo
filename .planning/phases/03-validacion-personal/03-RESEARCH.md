# Phase 3: Validacion Personal - Research

**Researched:** 2026-03-24
**Domain:** Feedback trends visualization, TSS calibration scripting, catalog gap capture, closure documentation
**Confidence:** HIGH (codebase leido directamente; recharts ya instalado y en uso; patrones establecidos en fases previas)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Mini grafico en /plan debajo del plan del dia mostrando energia + performance de los ultimos dias
- Solo 2 lineas (energia, performance) — sin hambre ni digestion visible
- Nuevo endpoint `/api/feedback/trends` (hoy feedback es atomico por dia)
- Script de calibracion CLI que cruza feedback (energia/performance) con datos de Strava (TSS real via HR)
- Senales de threshold incorrecto: (1) dayType no calza con realidad, (2) feedback bajo a pesar de seguir el plan
- Datos de Strava confiables: founder siempre entrena con pulsometro. TSS via FC es calculable
- Thresholds actuales: FC_REPOSO=50, FC_MAX=185, tau ATL=7, CTL=42 (en lib/training/load.ts)
- Output del script: reporte con sugerencias de ajuste a constantes
- Captura de gaps via notas de feedback — campo existente en FeedbackForm, sin UI nueva
- Iteracion mixta: gaps obvios se agregan al vuelo a catalog.ts, el resto se lista al cierre
- Doc de cierre en .planning/ con: que funciono, que no, thresholds ajustados, backlog priorizado para v2
- v2 backlog se prioriza en el doc de cierre, no en Notion

### Claude's Discretion
- Diseno visual del mini grafico de tendencias (Chart.js, recharts, SVG custom)
- Threshold minimo de datos para mostrar el grafico
- Formato exacto del script de calibracion (Node.js CLI, Python, etc.)
- Estructura del doc de cierre de validacion

### Deferred Ideas (OUT OF SCOPE)
- Trend analysis semanal completo (4 metricas, graficos detallados) — v2 (ADV-01)
- Auto-calibracion de thresholds sin script manual — v2 (ADV-03)
- Notificaciones push de recordatorio de check-in — v2
- Export de datos a CSV/sheets — v2
</user_constraints>

---

## Summary

Phase 3 no construye nueva infraestructura — instrumenta lo existente para capturar senales de calibracion durante 5-7 dias de uso real. El trabajo tecnico es puntual: un endpoint de agregacion, un mini grafico de tendencias, y un script CLI de calibracion. El 90% del valor es la observacion activa del founder durante los dias de uso.

**Recharts 3.3.0 ya esta instalado y en uso.** El proyecto tiene 5 chart components bajo `components/charts/` con patron identico: `"use client"` + `ResponsiveContainer` + `LineChart`. El mini grafico de tendencias debe seguir exactamente ese patron — no introducir nueva dependencia. El threshold para mostrar el grafico es 3 dias: con menos datos la linea es ruido, no senal.

El script de calibracion debe correr como Node.js CLI (no Python) porque toda la logica de TSS ya esta en `lib/training/load.ts` en TypeScript. El patron es `ts-node` que ya esta en `devDependencies`. El script lee DailyFeedback + TrainingActivity directamente via Prisma y compara dayType del engine contra TSS real de Strava.

**Recomendacion primaria:** Usar recharts `LineChart` con `ResponsiveContainer` height=120 para el mini grafico (no h-80 como los charts de analytics). Script CLI Node.js/ts-node. Mostrar grafico cuando `feedback.length >= 3`.

---

## Standard Stack

### Core (ya instalado)
| Library | Version | Purpose | Por que usar |
|---------|---------|---------|--------------|
| recharts | 3.3.0 | Mini grafico tendencias | Ya instalado, patron establecido en 5 charts |
| prisma | 6.18.0 | Aggregation query para trends | Ya en uso, patron findMany + groupBy manual |
| date-fns | 4.1.0 | Date formatting en API | Ya en uso en analytics routes |
| ts-node | 10.9.2 | Script CLI de calibracion | Ya en devDependencies |

### No instalar nada nuevo
Phase 3 no requiere dependencias adicionales. Todo el stack ya existe:
- Chart: recharts (no Chart.js, no Visx, no D3 custom)
- Date utilities: date-fns (no dayjs, no moment)
- Script runner: ts-node (no tsx, no Python)
- Auth en API: requireAuth() de lib/auth/utils

---

## Architecture Patterns

### Patron API de Trends (derivado de analytics existentes)

El patron establecido en `/api/analytics/performance-trends/route.ts` y `/api/analytics/training-volume/route.ts` es:

```typescript
// Source: app/api/analytics/performance-trends/route.ts (patron establecido)
export async function GET(request: NextRequest) {
  const user = await requireAuth();
  const userId = user.id;

  // 1. Query con rango de fechas
  const feedbacks = await prisma.dailyFeedback.findMany({
    where: {
      userId,
      date: { gte: startDate },
      // Solo dias donde hay datos relevantes
      energy: { not: null },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      energy: true,
      performance: true,
    },
  });

  // 2. Formatear para recharts (no groupBy porque ya es 1 por dia)
  const result = feedbacks.map((f) => ({
    date: format(new Date(f.date), 'MMM dd', { locale: es }),
    energia: f.energy,
    performance: f.performance,
  }));

  return NextResponse.json({ trends: result, count: result.length });
}
```

**Nota critica:** DailyFeedback ya tiene constraint `@@unique([userId, date])` — un registro por dia. NO es necesario groupBy. El query es un `findMany` con filtro de rango, sin agregacion adicional.

### Patron Mini Grafico (derivado de PerformanceTrendsChart)

```typescript
// Source: components/charts/PerformanceTrendsChart.tsx (patron establecido)
"use client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// Diferencias respecto a charts de analytics:
// - height={120} no h-80 — es mini grafico de contexto, no analytics
// - Sin CartesianGrid — mas limpio en espacio reducido
// - Sin Legend — solo 2 lineas con colores claros (azul=energia, verde=performance)
// - dot={{ r: 3 }} — puntos pequenos para no saturar 7 dias
// - Sin YAxis label ni tick si el espacio es muy reducido
```

**Donde insertarlo en DailyPlanView:** Debajo del bloque de momentos (acordeones), antes del boton "Como te fue?". Solo renderizar si `trends.length >= 3`.

### Patron Script CLI ts-node

```typescript
// scripts/calibrate-thresholds.ts
// Correr con: npx ts-node -e "require('./scripts/calibrate-thresholds')"
// o: npx ts-node scripts/calibrate-thresholds.ts

import { prisma } from '../lib/prisma';
import { estimarTssDesdeFc } from '../lib/training/load';

// Logica: para cada dia con feedback, buscar actividad Strava y calcular TSS real
// Comparar con dayType guardado en DailyRecommendation
// Imprimir: "Dia X: engine dijo 'low_load' pero TSS=180 → sugiero subir threshold high_load"
```

**Por que Node.js y no Python:** `estimarTssDesdeFc` y `calcularAtlCtlAcwr` ya estan implementados en TypeScript en `lib/training/load.ts`. Reimplementar en Python seria duplicacion. ts-node ya esta en devDependencies.

**Por que on-demand y no automatico:** 5-7 dias de datos es una sola ejecucion al cierre. No tiene sentido un proceso continuo para MVP v1.

### Estructura del directorio scripts/

```
scripts/
└── calibrate-thresholds.ts   # Script de calibracion unico
```

No crear subdirectorios. Un solo archivo, simple.

### Patron de fetch en DailyPlanView para trends

DailyPlanView ya tiene un patron dual-fetch (checkin → plan). El fetch de trends se agrega como tercer fetch paralelo o secuencial. Preferir fetch independiente para no bloquear el plan si trends falla:

```typescript
// En useEffect de DailyPlanView, fetch adicional no-bloqueante:
fetch('/api/feedback/trends?days=7')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (data?.trends?.length >= 3) setTrends(data.trends);
  })
  .catch(() => {}); // silencioso — trends es complementario, no critico
```

### Anti-Patrones a Evitar
- **No usar Prisma groupBy para DailyFeedback:** El modelo ya garantiza un record por dia. groupBy es innecesario y mas complejo.
- **No crear nuevo componente Chart separado para este uso:** El mini grafico es ~40 lineas inline en DailyPlanView o como componente simple en `components/nutrition/FeedbackTrendsChart.tsx`.
- **No mostrar el grafico si hay menos de 3 dias:** Con 1-2 puntos la linea no da informacion — solo confunde.
- **No bloquear el render del plan si trends falla:** El fetch de trends debe ser independiente. Si falla, simplemente no se muestra.
- **No correr el script con `npx prisma db pull` primero:** El schema ya esta en sync con la DB.

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por que |
|----------|-------------|---------------|---------|
| Formateo de fechas en grafico | Funcion custom de fecha | `date-fns/format` (ya instalado) | Edge cases de timezone |
| Calculo de TSS en script | Reimplementacion Python | `estimarTssDesdeFc` de lib/training/load.ts | Ya testeado, mismos parametros |
| Grafico SVG custom | D3 o SVG manual | recharts LineChart | Ya instalado, ya funciona, consistente |
| Auth en nuevo endpoint | Middleware custom | `requireAuth()` de lib/auth/utils | Patron establecido en todas las rutas |

---

## Common Pitfalls

### Pitfall 1: Timezone en queries de feedback

**Que va mal:** DailyFeedback.date se guarda con `setUTCHours(0,0,0,0)` (ver `normalizeDate` en `/api/feedback/route.ts`). Si el script de calibracion usa `new Date()` sin normalizar, puede haber desfase de un dia.

**Por que pasa:** El founder esta en America/Santiago (UTC-3/-4). `new Date()` en Node.js puede dar la fecha "equivocada" segun si se ejecuta de manana o tarde.

**Como evitar:** En el script, normalizar todas las fechas con el mismo patron:
```typescript
const normalizeDate = (d: Date) => {
  const n = new Date(d);
  n.setUTCHours(0, 0, 0, 0);
  return n;
};
```

**Senales de alerta:** Script reporta "0 dias con feedback" cuando hay datos en la DB.

### Pitfall 2: DailyRecommendation.dayType puede ser null

**Que va mal:** El campo `dayType` en `DailyRecommendation` es `String?` (nullable). Si el script cruza feedback con recomendaciones y asume que dayType siempre existe, puede fallar silenciosamente.

**Por que pasa:** Los primeros dias de uso quizas el plan no se guardo correctamente o el AI fallo y cayó al fallback.

**Como evitar:** El script debe manejar `dayType ?? 'unknown'` y reportar esos dias como "sin datos de engine para comparar".

### Pitfall 3: TrainingActivity.averageHeartRate puede ser null

**Que va mal:** `estimarTssDesdeFc` recibe `fcMedia` como `number | null`. Si la actividad no tiene HR (entrenamiento de fuerza, etc.), retorna un TSS basado en ratio 0.7 (fallback). El script puede confundir TSS estimado con TSS real.

**Por que pasa:** Aunque el founder siempre entrena con pulsometro para cycling/running, puede haber actividades de otro tipo sin HR.

**Como evitar:** El script debe filtrar o marcar actividades donde `averageHeartRate IS NULL` y reportar "TSS estimado (sin HR)" para diferenciarlas.

### Pitfall 4: recharts en Next.js 16 — SSR incompatibility

**Que va mal:** recharts usa `window` internamente. Si el componente no tiene `"use client"`, Next.js intentara hacer SSR y fallara con `ReferenceError: window is not defined`.

**Por que pasa:** Next.js 16 (App Router) hace SSR por defecto.

**Como evitar:** El FeedbackTrendsChart (o el bloque inline) DEBE tener `"use client"` como primera linea. DailyPlanView ya lo tiene — si se inline, hereda el directive.

### Pitfall 5: prisma.$disconnect() en scripts CLI

**Que va mal:** ts-node scripts que usan prisma pueden colgarse al terminar si no se llama `prisma.$disconnect()`.

**Por que pasa:** El Prisma Client mantiene el connection pool abierto.

**Como evitar:** El script siempre debe terminar con:
```typescript
await prisma.$disconnect();
process.exit(0);
```

---

## Code Examples

### Endpoint /api/feedback/trends

```typescript
// Source: patron de app/api/analytics/performance-trends/route.ts
// app/api/feedback/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/utils';
import { subDays, startOfDay, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const daysParam = req.nextUrl.searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam ?? '7', 10), 3), 14);
    const since = startOfDay(subDays(new Date(), days));

    const feedbacks = await prisma.dailyFeedback.findMany({
      where: {
        userId: user.id,
        date: { gte: since },
        energy: { not: null },
      },
      orderBy: { date: 'asc' },
      select: { date: true, energy: true, performance: true },
    });

    const trends = feedbacks.map((f) => ({
      date: format(new Date(f.date), 'EEE d'),
      energia: f.energy,
      performance: f.performance,
    }));

    return NextResponse.json({ trends, count: trends.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

### FeedbackTrendsChart (mini grafico)

```typescript
// Source: patron de components/charts/PerformanceTrendsChart.tsx
// components/nutrition/FeedbackTrendsChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type TrendPoint = { date: string; energia: number | null; performance: number | null };

export default function FeedbackTrendsChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 3) return null;

  return (
    <div className="w-full h-28 mt-2">
      <p className="text-xs text-gray-400 mb-1">Tus ultimos dias</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="#9CA3AF" style={{ fontSize: '10px' }} />
          <Tooltip
            contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
            formatter={(val: number, name: string) => [val, name === 'energia' ? 'Energia' : 'Performance']}
          />
          <Line
            type="monotone" dataKey="energia"
            stroke="#3B82F6" strokeWidth={2}
            dot={{ r: 3 }} connectNulls={false}
            name="energia"
          />
          <Line
            type="monotone" dataKey="performance"
            stroke="#10B981" strokeWidth={2}
            dot={{ r: 3 }} connectNulls={false}
            name="performance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Script de Calibracion CLI

```typescript
// scripts/calibrate-thresholds.ts
// Ejecutar: npx ts-node scripts/calibrate-thresholds.ts
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { estimarTssDesdeFc } from '../lib/training/load';
import { subDays, startOfDay, format } from 'date-fns';

async function main() {
  const since = startOfDay(subDays(new Date(), 14));

  // 1. Fetch feedback con recomendacion asociada
  const feedbacks = await prisma.dailyFeedback.findMany({
    where: {
      userId: process.env.FOUNDER_USER_ID!,
      date: { gte: since },
    },
    include: {
      recommendation: {
        select: { dayType: true, atl: true, ctl: true, acwr: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  // 2. Para cada dia, buscar actividad Strava y calcular TSS real
  for (const fb of feedbacks) {
    const dateStr = format(new Date(fb.date), 'yyyy-MM-dd');
    const nextDay = new Date(fb.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const activities = await prisma.trainingActivity.findMany({
      where: {
        userId: process.env.FOUNDER_USER_ID!,
        startDate: { gte: fb.date, lt: nextDay },
        source: 'STRAVA',
      },
      select: { duration: true, averageHeartRate: true, name: true },
    });

    const tssTotal = activities.reduce((sum, a) =>
      sum + estimarTssDesdeFc(a.duration, a.averageHeartRate), 0
    );

    const engineDayType = fb.recommendation?.dayType ?? 'unknown';
    const energiaScore = fb.energy ?? 'n/a';
    const performanceScore = fb.performance ?? 'n/a';
    const hasHR = activities.some(a => a.averageHeartRate != null);

    // 3. Clasificar discrepancias
    let alerta = '';
    if (tssTotal > 100 && engineDayType === 'rest') {
      alerta = '⚠ ENGINE DIJO rest PERO TSS ALTO → subir threshold high_load?';
    } else if (tssTotal > 60 && engineDayType === 'low') {
      alerta = '⚠ ENGINE DIJO low_load PERO TSS MODERADO-ALTO';
    } else if ((energiaScore as number) <= 2 && engineDayType === 'high') {
      alerta = '⚠ FEEDBACK BAJO con plan high_load → fueling no alcanzo?';
    }

    console.log(
      `${dateStr} | engine:${engineDayType.padEnd(10)} | TSS:${Math.round(tssTotal).toString().padStart(4)} ${hasHR ? '(HR)' : '(est)'} | energia:${energiaScore} perf:${performanceScore} ${alerta}`
    );
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

### Insercion en DailyPlanView (fetch trends)

```typescript
// Dentro del useEffect existente en DailyPlanView.tsx
// Fetch adicional, no bloqueante, despues de obtener el plan
const [trends, setTrends] = useState<TrendPoint[]>([]);

// En load(), despues de setPlan(data.plan):
fetch('/api/feedback/trends?days=7')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (active && data?.count >= 3) setTrends(data.trends);
  })
  .catch(() => {});

// En el return JSX, entre los acordeones y el boton "Como te fue?":
{trends.length >= 3 && <FeedbackTrendsChart data={trends} />}
```

---

## State of the Art

| Approach anterior | Approach actual | Relevancia para Phase 3 |
|-------------------|-----------------|------------------------|
| Chart.js (pre-2023 standard) | recharts para React | Ya decidido — recharts en uso |
| Python scripts para data analysis | ts-node para scripting en repos TS | Preferir ts-node: reutiliza lib/ |
| Prisma groupBy para agregacion | findMany + Map en JS | DailyFeedback ya es 1/dia — no necesita groupBy |

**Recharts 3.x vs 2.x:** recharts 3.0 fue lanzado en 2024 con React 18/19 support mejorado. La API de `LineChart` / `ResponsiveContainer` no cambio en interfaz publica — los imports existentes en los 5 chart components del proyecto son compatibles con 3.3.0.

---

## Open Questions

1. **FOUNDER_USER_ID en el script**
   - Lo que sabemos: el script necesita el userId del founder para filtrar datos
   - Lo que no esta claro: si el userId esta en una env var o si debe buscarse por email
   - Recomendacion: aceptar `--email` como argumento CLI, hacer lookup por email en la DB. Evita hardcodear IDs.

2. **Locale de date-fns en el grafico**
   - Lo que sabemos: `format(date, 'EEE d')` con date-fns 4.x devuelve en ingles por default
   - Lo que no esta claro: si el founder prefiere "lun 24" vs "Mon 24" en el mini grafico
   - Recomendacion: importar `es` locale de `date-fns/locale/es` y pasar `{ locale: es }` al format. Consistent con el resto de la UI en espanol.

3. **TSS thresholds de clasificacion en el script**
   - Lo que sabemos: dayType en engine.ts viene de `TrainingPlanEntry.dayType` ("rest"/"low"/"moderate"/"high") que se setea al crear la entrada
   - Lo que no esta claro: los cutoffs de TSS que el engine usa para clasificar
   - Recomendacion: el script debe inferirlos empiricamente de los datos de los 7 dias. Output: "TSS promedio para dias 'high': X.X" — esto da los thresholds actuales implcitos.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Ninguno detectado en el proyecto |
| Config file | No existe (jest.config.*, vitest.config.*, pytest.ini) |
| Quick run command | N/A — no hay test runner configurado |
| Full suite command | N/A |

### Phase Requirements → Test Map

Phase 3 no tiene IDs de requirements propios — valida Phase 1+2 en condiciones reales. Los criterios de exito son observacionales:

| Criterio | Tipo de validacion | Como verificar |
|----------|--------------------|---------------|
| 5 dias consecutivos de uso sin intervencion tecnica | Observacional (uso real) | Manual — el founder lo documenta |
| >= 3 dias con energia >= 3/5 | Datos en DB | Query: `SELECT COUNT(*) FROM DailyFeedback WHERE energy >= 3` |
| Thresholds revisados contra Strava | Script output | `npx ts-node scripts/calibrate-thresholds.ts` |
| Decision v2 tomada | Doc de cierre | `.planning/phases/03-validacion-personal/CLOSURE.md` existe |

### Wave 0 Gaps
- [ ] `scripts/calibrate-thresholds.ts` — crear en Wave 1 (es el script principal de calibracion)
- [ ] `app/api/feedback/trends/route.ts` — nuevo endpoint (Wave 1)
- [ ] `components/nutrition/FeedbackTrendsChart.tsx` — nuevo componente (Wave 1)

*(No hay framework de tests que instalar — Phase 3 es validacion manual + script output)*

---

## Doc de Cierre: Estructura Recomendada

El doc de cierre va en `.planning/phases/03-validacion-personal/CLOSURE.md` al final de los 7 dias. Estructura:

```markdown
# Phase 3 Closure: Validacion Personal

**Periodo:** [fecha inicio] → [fecha fin]
**Dias completados:** X/7

## La pregunta central
> "Puedo seguir usando esta app todos los dias?" → SI / NO / SI con estos cambios

## Metricas de uso
| Dia | Checkin | Feedback | Energia | Performance | Notas |
|-----|---------|----------|---------|-------------|-------|

## Thresholds calibrados
| Constante | Valor actual | Valor sugerido | Evidencia |
|-----------|-------------|----------------|-----------|
| DEFAULT_FC_REPOSO | 50 | X | Dias analizados |
| DEFAULT_FC_MAX | 185 | X | Dias analizados |
| tau ATL | 7 | X | ACWR patterns |
| tau CTL | 42 | X | ACWR patterns |

## Gaps del catalogo detectados
| Item faltante | Frecuencia en notas | Prioridad v2 |

## Que funciono
- [lista]

## Que no funciono
- [lista]

## Backlog priorizado para v2
| # | Feature | Por que | Req |
```

---

## Sources

### Primary (HIGH confidence)
- Codebase directo — `lib/training/load.ts`, `lib/nutrition/engine.ts`, `lib/nutrition/catalog.ts`
- Codebase directo — `components/charts/PerformanceTrendsChart.tsx`, patron recharts establecido
- Codebase directo — `app/api/analytics/performance-trends/route.ts`, patron de aggregation establecido
- Codebase directo — `app/api/feedback/route.ts`, `prisma/schema.prisma`
- `package.json` — recharts@3.3.0 instalado, date-fns@4.1.0, ts-node@10.9.2

### Secondary (MEDIUM confidence)
- recharts docs (version 3.x): LineChart + ResponsiveContainer API estable, compatible con React 19
- date-fns 4.x: API de format/subDays no cambio en breaking way desde 3.x

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts ya instalado y en uso activo en 5 components; ts-node en devDependencies
- Architecture patterns: HIGH — leidos directamente del codebase, no inferidos
- Pitfalls: HIGH — todos derivados del codigo existente (normalizeDate, nullable fields, SSR)
- Script de calibracion: MEDIUM — estructura clara pero FOUNDER_USER_ID y TSS cutoffs requieren decision al implementar

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stack estable; recharts API no cambia rapido)
