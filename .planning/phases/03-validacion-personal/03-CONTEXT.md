# Phase 3: Validacion Personal - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Datos de uso real (5-7 dias) confirman que el motor calibra bien para el perfil del founder y revelan gaps del catalogo que no eran visibles en codigo. Output: doc de cierre con backlog priorizado para v2.

</domain>

<decisions>
## Implementation Decisions

### Tendencias de feedback
- **Mini grafico en /plan** debajo del plan del dia mostrando energia + performance de los ultimos dias
- Solo 2 lineas (energia, performance) — sin hambre ni digestion visible. Menos ruido, mas foco
- Requiere nuevo endpoint de agregacion `/api/feedback/trends` (hoy feedback es atomico por dia)
- Cuando mostrar el grafico: **Claude's discretion** — decide cuando hay datos suficientes para que tenga sentido
- Metricas de exito de la validacion: energia + performance son los proxies principales

### Calibracion de thresholds
- **Script de calibracion CLI** que cruza feedback (energia/performance) con datos de Strava (TSS real via HR)
- Senales de threshold incorrecto: (1) dayType no calza con realidad (engine dice 'rest' en dia duro), (2) feedback bajo a pesar de seguir el plan. Ambas senales importan
- Datos de Strava confiables: founder siempre entrena con pulsometro. TSS via FC es calculable para todos los entrenos
- Frecuencia de ejecucion: **Claude's discretion** — on-demand CLI o una vez al final, lo que tenga mas sentido
- Thresholds actuales: FC_REPOSO=50, FC_MAX=185, tau ATL=7, CTL=42 (en lib/training/load.ts)
- Output del script: reporte con sugerencias de ajuste a constantes

### Gaps del catalogo
- **Captura via notas de feedback** — campo de notas existente en FeedbackForm. Sin UI nueva
- Ejemplos de gaps: "no tenia palta", "porcion de arroz muy grande", "no me gusta el atun"
- Iteracion **mixta**: gaps obvios (ej: falta avena) se agregan al vuelo a catalog.ts, el resto se lista y se revisa al cierre
- Catalogo actual: 45 items. Expansion esperada: +10-15 items basados en uso real

### Output final y decision v2
- **Doc de cierre en .planning/** con: que funciono, que no, thresholds ajustados, backlog priorizado para v2
- Post-MVP: **depende de resultados** — si los 7 dias van bien, app sigue usable as-is. Si no, iterar antes de v2
- v2 backlog se prioriza en el doc de cierre, no en Notion (mantener todo en .planning/ por ahora)

### Claude's Discretion
- Diseno visual del mini grafico de tendencias (Chart.js, recharts, SVG custom — lo que sea mas simple)
- Threshold minimo de datos para mostrar el grafico
- Formato exacto del script de calibracion (Node.js CLI, Python script, etc.)
- Estructura del doc de cierre de validacion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engine y thresholds
- `lib/nutrition/engine.ts` — buildNutritionPlan(), dayType classification logic, CheckinInput type
- `lib/training/load.ts` — TSS/TRIMP/ATL/CTL/ACWR calculations, DEFAULT_FC_REPOSO, DEFAULT_FC_MAX, tau constants
- `lib/nutrition/catalog.ts` — foodCatalog array (45 items), FoodOption type, coverage validation

### Feedback system
- `app/api/feedback/route.ts` — GET/POST feedback, composite key userId_date, upsert pattern
- `components/nutrition/FeedbackForm.tsx` — 4 campos + notas, tap-buttons 1-5
- `prisma/schema.prisma` — DailyFeedback model (energy, hunger, digestion, performance, notes, recommendationId FK)

### Plan view (Phase 2 outputs)
- `components/nutrition/DailyPlanView.tsx` — Acordeones por momento, donde iria el mini grafico
- `app/plan/page.tsx` — Pagina /plan donde se renderiza el plan diario
- `app/api/daily-plan/route.ts` — GET daily plan con AI phrasing

### Strava integration
- `lib/strava/client.ts` — Strava API client, activity fetch, token refresh
- `prisma/schema.prisma` — StravaToken, Activity models

### Prior context
- `.planning/phases/01-core-loop/01-CONTEXT.md` — Engine architecture, catalog structure, profile seeding
- `.planning/phases/02-app-usable/02-CONTEXT.md` — AI phrasing, training time mapping, feedback UX

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FeedbackForm.tsx`: Campo de notas existente — usarlo para capturar gaps de catalogo sin UI nueva
- `lib/training/load.ts`: Calculo completo de TSS/ATL/CTL/ACWR — base para script de calibracion
- `/api/analytics/*`: 6 endpoints de analytics existentes — patron de agregacion reutilizable para trends

### Established Patterns
- API routes: requireAuth() + try/catch + NextResponse.json()
- Fetch pattern en componentes: useState + useEffect
- Tailwind slate palette, rounded-2xl cards

### Integration Points
- DailyPlanView.tsx: punto de insercion para mini grafico de tendencias
- `/api/feedback/route.ts`: extender con endpoint GET /api/feedback/trends para agregacion 7 dias
- DailyFeedback → DailyRecommendation FK: permite cruzar feedback con datos del engine (dayType, ATL/CTL)

</code_context>

<specifics>
## Specific Ideas

- El mini grafico es para dar contexto rapido al founder, no para analytics profundo. Debe ser tan simple como "linea hacia arriba = bien, linea hacia abajo = algo no calza"
- Script de calibracion debe imprimir algo como: "Dia X: engine dijo 'low_load' pero Strava TSS=180 → sugiero subir threshold de high_load"
- Doc de cierre debe responder: "Puedo seguir usando esta app todos los dias? Si/No. Si no, que le falta?"

</specifics>

<deferred>
## Deferred Ideas

- Trend analysis semanal completo (4 metricas, graficos detallados) — v2 (ADV-01)
- Auto-calibracion de thresholds sin script manual — v2 (ADV-03)
- Notificaciones push de recordatorio de check-in — v2
- Export de datos a CSV/sheets — v2

</deferred>

---

*Phase: 03-validacion-personal*
*Context gathered: 2026-03-24*
