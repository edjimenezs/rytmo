# Phase 2: App Usable - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

El founder puede hacer check-in, ver el plan diario en lenguaje natural en español y dejar feedback — sin ver JSON ni macros en ningún momento. La app se siente como un coach cercano que te dice qué comer y por qué.

</domain>

<decisions>
## Implementation Decisions

### Tono y formato AI
- Tono: **coach cercano**, español chileno informal con tuteo ("hoy dormiste poco, así que tu cuerpo necesita...")
- Justificación por comida: **resumen por momento** — un párrafo de 1-2 frases al inicio de cada momento explicando el "por qué" antes de listar alimentos
- Headline del día: sí — una frase tipo estado general arriba del plan ("Hoy es día de alta carga con fatiga acumulada — priorizamos recuperación activa")
- Largo del texto AI: 1-2 frases por momento, no más
- Proveedor: **Claude (Anthropic)** via lib/ai/llm.ts existente
- Cache: generar texto AI **una vez al día**, guardar en DB. Requests siguientes leen de cache
- Fallback si AI falla: texto determinista legible con template fijo ("Día de {dayType}. Pre-entrenamiento: {food}. Por qué: {focus tag traducido}"). Nunca JSON crudo

### Vista del plan diario
- Layout: **acordeones colapsables** por momento (pre/intra/post/cena). Cada acordeón muestra frase AI + lista de alimentos
- Info por alimento: **nombre + porción** ("Marraqueta con miel — 1 unidad"). Sin macros (anti-feature), sin descripción redundante
- Cantidad: **2-3 opciones** por momento
- Ubicación: **página dedicada /plan**, mobile-first. Dashboard muestra resumen con link al plan completo
- Estado vacío: si no hay check-in del día, mostrar CTA a check-in desde /plan

### Feedback post-sesión
- Acceso: **botón al final del plan** ("¿Cómo te fue?") que abre el form inline o modal, vinculado al plan del día
- Campos: **mantener los 4** (energía, hambre, digestión, performance) — tap-buttons 1-5
- Notas: **sí, opcional** — campo de texto libre para contexto adicional
- FeedbackForm.tsx ya existe con los 4 campos + notas, reutilizar y adaptar al nuevo layout

### Home y navegación
- Home: **estado del día + CTA grande** ("Hoy: no has hecho check-in" → botón "Hacer check-in"; o "Día de alta carga" → botón "Ver tu plan")
- Navegación: **tabs fijos abajo** tipo app móvil (Home | Check-in | Plan | Feedback). Sin sidebar complejo
- Limpieza: **ocultar pero no borrar** secciones no-MVP (Medical, Analytics, Training Plan, Activities). Solo 4 items visibles en nav
- DashboardNav actual se reemplaza por bottom tabs en mobile

### Claude's Discretion
- Diseño visual exacto de los acordeones (colores, iconos por momento)
- Animación de apertura/cierre de acordeones
- Diseño del bottom tab bar (iconos específicos)
- Skeleton loading mientras se carga el plan
- Exact prompt engineering para Claude API (system prompt, temperature)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engine y catálogo (Phase 1 outputs)
- `lib/nutrition/engine.ts` — buildNutritionPlan(), CheckinInput, resolveCheckinModifiers, NutritionPlanResponse type
- `lib/nutrition/catalog.ts` — FoodOption type, foodCatalog array, FoodMoment type
- `lib/ai/llm.ts` — askLLM() function, supports OpenAI + Anthropic providers

### Componentes existentes a reutilizar/adaptar
- `components/dashboard/NutritionPanel.tsx` — Panel actual que muestra plan con macros (reemplazar)
- `components/nutrition/FeedbackForm.tsx` — Form con 4 campos + notas (adaptar al nuevo layout)
- `components/nutrition/CheckinForm.tsx` — Check-in de 5 campos (Phase 1, ya simplificado)
- `components/dashboard/DashboardNav.tsx` — Nav actual a reemplazar por bottom tabs

### Páginas existentes
- `app/plan/page.tsx` — Ruta /plan existente (reescribir)
- `app/feedback/page.tsx` — Ruta /feedback existente
- `app/dashboard/page.tsx` — Dashboard principal (simplificar a estado del día)
- `app/checkin/page.tsx` — Ruta check-in (Phase 1)

### API endpoints
- `app/api/daily-plan/route.ts` — GET daily plan (Phase 1, ya lee check-in)
- `app/api/feedback/route.ts` — GET/POST feedback
- `app/api/checkin/route.ts` — POST check-in

### Schema
- `prisma/schema.prisma` — DailyCheckin, Profile, NutritionPlanEntry models

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FeedbackForm.tsx`: Form completo con 4 campos 1-5 + notas. Adaptar layout a tap-buttons y mover inline al plan
- `NutritionPanel.tsx`: Fetch de /api/daily-plan y render por momento. Reutilizar lógica de fetch, reescribir render (quitar macros, agregar AI text)
- `lib/ai/llm.ts`: askLLM() ya soporta Anthropic. Arreglar modelo a claude-sonnet-4-5-20250514 o similar
- `CheckinForm.tsx`: 5 campos mobile-first (Phase 1). No necesita cambios

### Established Patterns
- "use client" para componentes interactivos, server components por default
- Fetch pattern: useState + useEffect + try/catch (NutritionPanel, FeedbackForm)
- API routes: requireAuth() + try/catch + NextResponse.json()
- Tailwind con rounded-2xl cards, slate color palette
- @/ path aliases para todos los imports

### Integration Points
- `/api/daily-plan` GET retorna NutritionPlanResponse — agregar campo de AI text cacheado
- Prisma schema necesita campo para cachear AI phrasing (ej: aiSummary en NutritionPlanEntry o nueva tabla)
- DashboardNav necesita ser reemplazado por BottomNav para mobile
- app/layout.tsx contiene SessionProvider wrapper

</code_context>

<specifics>
## Specific Ideas

- Founder dijo: "las comidas son muy estructuradas y rígidas, sin ver el detalle del aporte y la justificación de por qué" — el AI phrasing DEBE explicar el razonamiento, no solo listar comidas
- El "por qué" conecta: check-in del día (fatiga, sueño, tipo de entrenamiento) → decisión del engine → alimento concreto
- Ejemplo de buen output: "Pre-entrenamiento: sesión larga de bici hoy, necesitás carbos rápidos sin peso digestivo. Opciones: Marraqueta con miel — 1 unidad, Plátano — 1 grande"
- Ejemplo de mal output: "Pre: Marraqueta con miel (45g C, 8g P, 2g G)"

</specifics>

<deferred>
## Deferred Ideas

- Trend analysis de feedback semana a semana — Phase 3 o v2
- Plan regeneration mid-day si cambia la sesión — v2 (ADV-02)
- Strava auto-sync awareness (staleSync flag) — no blocking para Phase 2, se puede agregar después

</deferred>

---

*Phase: 02-app-usable*
*Context gathered: 2026-03-23*
