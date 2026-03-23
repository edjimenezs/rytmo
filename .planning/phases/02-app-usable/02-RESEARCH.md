# Phase 02: App Usable - Research

**Researched:** 2026-03-23
**Domain:** Next.js 16 UI, Anthropic Claude API, Prisma schema migration, mobile-first Tailwind layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hora de entrenamiento y mapeo de momentos**
- Hora de entrenamiento configurable en perfil como default (mañana/mediodía/tarde-noche)
- Check-in permite override puntual si el día es distinto al default (campo opcional, pre-llenado con el default del perfil)
- El engine mantiene momentos abstractos (preWorkout/intraWorkout/postWorkout/dinner)
- El AI phrasing mapea momentos abstractos a comidas reales según hora de entrenamiento:
  - Entreno mañana → pre=desayuno, post=snack media mañana, dinner=cena
  - Entreno mediodía → pre=snack media mañana, post=almuerzo, dinner=cena
  - Entreno tarde-noche → pre=snack de tarde, post=cena, dinner=(se fusiona con post o se omite)
- Los acordeones del plan muestran el nombre real de la comida ("Almuerzo" no "Post-workout") adaptado a la hora
- Profile schema necesita campo `defaultTrainingTime` (enum: morning/midday/evening)
- DailyCheckin ya tiene columna `timeOfDay` (nullable) — reutilizar como override

**Tono y formato AI**
- Tono: coach cercano, español chileno informal con tuteo
- Justificación por comida: resumen por momento — un párrafo de 1-2 frases al inicio de cada momento
- Headline del día: sí — una frase tipo estado general arriba del plan
- Largo del texto AI: 1-2 frases por momento, no más
- Proveedor: Claude (Anthropic) via lib/ai/llm.ts existente
- Cache: generar texto AI una vez al día, guardar en DB. Requests siguientes leen de cache
- Fallback si AI falla: texto determinista legible con template fijo. Nunca JSON crudo

**Vista del plan diario**
- Layout: acordeones colapsables por momento (pre/intra/post/cena)
- Info por alimento: nombre + porción. Sin macros
- Cantidad: 2-3 opciones por momento
- Ubicación: página dedicada /plan, mobile-first. Dashboard muestra resumen con link
- Estado vacío: si no hay check-in del día, mostrar CTA a check-in desde /plan

**Feedback post-sesión**
- Acceso: botón al final del plan ("¿Cómo te fue?") que abre form inline o modal, vinculado al plan del día
- Campos: mantener los 4 (energía, hambre, digestión, performance) — tap-buttons 1-5
- Notas: sí, opcional — campo de texto libre
- FeedbackForm.tsx ya existe con los 4 campos + notas, reutilizar y adaptar al nuevo layout

**Home y navegación**
- Home: estado del día + CTA grande
- Navegación: tabs fijos abajo tipo app móvil (Home | Check-in | Plan | Feedback). Sin sidebar complejo
- Limpieza: ocultar pero no borrar secciones no-MVP (Medical, Analytics, Training Plan, Activities)
- DashboardNav actual se reemplaza por bottom tabs en mobile

### Claude's Discretion
- Diseño visual exacto de los acordeones (colores, iconos por momento)
- Animación de apertura/cierre de acordeones
- Diseño del bottom tab bar (iconos específicos)
- Skeleton loading mientras se carga el plan
- Exact prompt engineering para Claude API (system prompt, temperature)

### Deferred Ideas (OUT OF SCOPE)
- Trend analysis de feedback semana a semana — Phase 3 o v2
- Plan regeneration mid-day si cambia la sesión — v2 (ADV-02)
- Strava auto-sync awareness (staleSync flag) — no blocking para Phase 2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REC-01 | Daily recommendation output includes: day summary, 4 moment-specific food suggestions, brief reasoning | API `/api/daily-plan` ya devuelve esto; agregar campo `aiText` cacheado por momento y headline |
| REC-02 | Recommendations show concrete food, not macros | NutritionPanel.tsx actualmente muestra macros — eliminar del render, dejar solo `food.name + food.portion` |
| REC-03 | AI phrasing layer (natural language wrapper, not logic layer) | `lib/ai/llm.ts` ya soporta Anthropic; agregar función `generateMomentPhrasing()` con fallback determinista |
| FEEDBACK-01 | Post-session feedback captures energy, hunger, digestion, performance (1-5 scale) | FeedbackForm.tsx existe con 4 campos; migrar de `<select>` a tap-buttons 1-5 |
| FEEDBACK-02 | Feedback stored, linked to day's recommendation, available for founder review | DailyFeedback model en Prisma no tiene FK a DailyRecommendation — requiere migración para agregar `recommendationId` |
| UI-01 | Home page shows today's status + quick link to check-in | AthleteDashboard + ActionCanvas actuales son demasiado densos; reemplazar por HomeCard simple |
| UI-02 | Daily plan page readable in <20 seconds | /plan/page.tsx usa PlanForm obsoleto; reescribir con acordeones y texto AI |
| UI-03 | Responsive design works on phone browser | DashboardNav es horizontal top-nav — reemplazar por BottomNav con `fixed bottom-0` |
| UI-04 | Error states handled gracefully (no silent failures) | Fetch pattern con try/catch ya existe; agregar estados de error visibles en cada componente |
</phase_requirements>

---

## Summary

Esta fase convierte la app de un prototipo funcional (datos correctos, UI técnica) en una experiencia usable por el founder. El engine de nutrición de Phase 1 ya produce los datos correctos — el trabajo de Phase 2 es 100% capa de presentación y UX.

El proyecto usa Next.js 16 con React 19, Tailwind 4, Prisma 6 + PostgreSQL, y next-auth 4. Todos estos ya están instalados y funcionando. No se agrega ninguna dependencia nueva — todo se construye sobre el stack existente.

El riesgo principal es el cache de AI text: `DailyRecommendation` en Prisma no tiene columnas para `aiHeadline` ni `aiMomentTexts` — se necesita una migración. El segundo riesgo es la navegación: reemplazar `DashboardNav` por `BottomNav` afecta `app/layout.tsx` y todos los dashboards.

**Recomendación primaria:** Ejecutar en este orden — (1) migración Prisma para `aiHeadline`/`aiMomentTexts` en `DailyRecommendation` + `recommendationId` en `DailyFeedback`, (2) función `generateMomentPhrasing()` con fallback, (3) reescritura de `/plan` con acordeones, (4) HomeCard simple en dashboard, (5) BottomNav.

---

## Standard Stack

### Core (ya instalado — no instalar nada nuevo)

| Library | Version | Purpose | Por qué es estándar |
|---------|---------|---------|----------------------|
| Next.js | 16.0.1 | Framework full-stack, App Router | Ya en producción en este proyecto |
| React | 19.2.0 | UI | Ya en producción |
| Tailwind CSS | 4.x | Estilos mobile-first | Ya configurado con slate palette + rounded-2xl cards |
| Prisma | 6.18.0 | ORM + migraciones | Ya en producción con PostgreSQL |
| next-auth | 4.24.13 | Autenticación | Ya funcionando, `requireAuth()` en todas las rutas |
| Anthropic API | — (HTTP directo) | AI phrasing via `askLLM()` | Ya soportado en `lib/ai/llm.ts` |

### No agregar dependencias nuevas
El proyecto no necesita librerías de UI adicionales (no Radix, no shadcn, no Headless UI). Los acordeones se implementan con estado local React + Tailwind. Los tap-buttons son `<button>` con clases condicionales — patrón ya usado en `CheckinForm.tsx`.

**Verificación de versiones (confirmadas del package.json del proyecto):**
- next: 16.0.1
- react: 19.2.0
- tailwindcss: ^4
- prisma: ^6.18.0
- next-auth: ^4.24.13

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
app/
├── dashboard/page.tsx          # Simplificar — HomeCard + CTA
├── plan/page.tsx               # Reescribir — DailyPlanPage con acordeones
├── checkin/page.tsx            # Agregar campo timeOfDay override (ya existe)
├── feedback/page.tsx           # Ya existe — integrar FeedbackForm adaptado
components/
├── layout/
│   └── BottomNav.tsx           # NUEVO — tabs fijos abajo, 4 ítems
├── nutrition/
│   ├── CheckinForm.tsx         # ADAPTAR — agregar timeOfDay opcional
│   ├── FeedbackForm.tsx        # ADAPTAR — tap-buttons + inline/modal
│   ├── DailyPlanView.tsx       # NUEVO — acordeones + AI text
│   └── MomentAccordion.tsx     # NUEVO — acordeón individual por momento
├── dashboard/
│   └── HomeCard.tsx            # NUEVO — estado del día + CTA
lib/
├── ai/
│   ├── llm.ts                  # ADAPTAR — modelo actualizado a claude-sonnet-4-5
│   └── phrasing.ts             # NUEVO — generateMomentPhrasing() + fallback
prisma/
└── schema.prisma               # MIGRAR — aiHeadline, aiMomentTexts en DailyRecommendation
                                #          recommendationId en DailyFeedback
                                #          defaultTrainingTime en Profile
```

### Pattern 1: Accordion con estado local (sin librería)

**Qué:** `useState<string | null>` para rastrear qué acordeón está abierto. Animate con `max-height` o `grid-rows`.
**Cuándo usar:** Plan diario — 4 momentos, uno abierto a la vez (o todos abiertos)

```typescript
// Patrón usado en CheckinForm.tsx (tap-buttons) — extender para acordeones
const [open, setOpen] = useState<string | null>('preWorkout');

const toggle = (key: string) => setOpen(prev => prev === key ? null : key);
```

### Pattern 2: AI phrasing con cache en DB

**Qué:** Generar texto AI una sola vez por día, guardar en `DailyRecommendation.aiMomentTexts` (JSON), leer en requests siguientes.
**Cuándo usar:** En `GET /api/daily-plan` — si `aiMomentTexts` es null, generar y persistir; si existe, retornar directo.

```typescript
// lib/ai/phrasing.ts — esquema conceptual
export async function generateMomentPhrasing(
  plan: NutritionPlanResponse,
  checkin: CheckinInput | null,
  trainingTime: 'morning' | 'midday' | 'evening'
): Promise<{ headline: string; moments: Record<NutritionMoment, string> } | null> {
  // 1. Intentar Claude via askLLM()
  // 2. Si falla → retornar null (caller usa fallback determinista)
}

export function deterministicFallback(
  plan: NutritionPlanResponse,
  trainingTime: 'morning' | 'midday' | 'evening'
): { headline: string; moments: Record<NutritionMoment, string> } {
  // Template fijo — NUNCA retorna JSON crudo
}
```

### Pattern 3: Bottom Navigation (mobile-first)

**Qué:** `fixed bottom-0 left-0 right-0` con 4 items, z-index alto, safe-area padding para iOS.
**Cuándo usar:** Reemplaza `DashboardNav` en mobile. El top-nav se oculta o elimina.

```typescript
// components/layout/BottomNav.tsx
// "use client" — necesita usePathname() para estado activo
const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: HomeIcon },
  { href: '/checkin', label: 'Check-in', icon: ClipboardIcon },
  { href: '/plan', label: 'Plan', icon: CalendarIcon },
  { href: '/feedback', label: 'Feedback', icon: StarIcon },
];
// Iconos: SVG inline o emoji unicode — sin librería de iconos
```

### Pattern 4: Mapeo de momentos abstractos a nombres reales

**Qué:** Función pura `mapMomentToMealName(moment, trainingTime)` que traduce `preWorkout` → "Desayuno" o "Snack de media mañana".
**Cuándo usar:** En `DailyPlanView.tsx` para títulos de acordeones.

```typescript
// Tabla de mapeo — verificada contra CONTEXT.md
const MOMENT_MEAL_NAMES: Record<
  NutritionMoment,
  Record<'morning' | 'midday' | 'evening', string>
> = {
  preWorkout:   { morning: 'Desayuno',            midday: 'Snack media mañana', evening: 'Snack de tarde' },
  intraWorkout: { morning: 'Durante el entreno',  midday: 'Durante el entreno', evening: 'Durante el entreno' },
  postWorkout:  { morning: 'Snack post-entreno',  midday: 'Almuerzo',           evening: 'Cena post-entreno' },
  dinner:       { morning: 'Cena',                midday: 'Cena',               evening: '(incluido en cena)' },
  snack:        { morning: 'Snack tarde',         midday: 'Snack tarde',        evening: 'Snack tarde' },
};
```

### Anti-Patterns a Evitar

- **Mostrar macros en /plan:** La decisión está bloqueada — sin gramos de carbs/proteína/grasa en la vista del plan. `NutritionPanel.tsx` los muestra actualmente — esa lógica se elimina.
- **Retornar null o JSON crudo si AI falla:** El fallback determinista SIEMPRE debe producir texto legible. Nunca `plan.moments.preWorkout.text` raw si contiene "Sugiero: [object Object]".
- **Server Components con estado:** `DailyPlanView` necesita `"use client"` porque maneja el estado de acordeones. `app/plan/page.tsx` puede ser Server Component solo si delega el interactivo a un client component.
- **Lógica de AI en el componente React:** `generateMomentPhrasing()` va en una API route o en la Server Action — nunca llamar a Anthropic desde el cliente (expone API key).
- **Sidebar complejo en mobile:** El `DashboardNav` actual tiene `hidden sm:flex` para items — en mobile ya muestra solo el logo. Pero el BottomNav debe reemplazarlo completamente para dar espacio vertical.

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|---------|-------------|----------------|---------|
| Cache de AI text | Sistema de cache en memoria | Campo JSON en `DailyRecommendation` (Prisma upsert) | Persiste entre requests, gratis, ya tenemos el modelo |
| Acordeones | Librería de UI (Radix, Headless) | `useState` + Tailwind | El proyecto ya tiene el patrón en CheckinForm; overhead cero |
| Iconos | `lucide-react`, `heroicons` | SVG inline o emoji | No agregar deps para 4 iconos; SVG inline es 5 líneas |
| Formateo de fecha | `moment.js`, `dayjs` | `date-fns` (ya instalado) o `Date.toLocaleDateString()` | date-fns ya está en package.json |
| Validación de form | Construcción manual | `react-hook-form` + `zod` (ya instalados) | Ya en package.json, usar para CheckinForm si se refactoriza |

---

## Common Pitfalls

### Pitfall 1: DailyRecommendation no tiene columnas de AI text

**Qué sale mal:** El plan GET genera texto AI en cada request → latencia ~1-2s en cada carga, posible exceso de tokens, sin cache.
**Por qué pasa:** El schema actual de `DailyRecommendation` tiene `preWorkout String?`, `postWorkout String?`, etc. como texto determinista. No hay `aiHeadline` ni `aiMomentTexts`.
**Cómo evitar:** Migración Prisma en Wave 0 agrega:
  - `aiHeadline String? @db.Text` — frase del día generada por AI
  - `aiMomentTexts Json?` — objeto `{ preWorkout, intraWorkout, postWorkout, dinner }` con texto AI por momento
**Señales de alerta:** Si el GET de daily-plan demora >500ms consistentemente o si los textos cambian entre recargas.

### Pitfall 2: Modelo de Anthropic desactualizado en llm.ts

**Qué sale mal:** `lib/ai/llm.ts` usa `claude-3-5-sonnet-20240620` — modelo de 2024. Puede retornar error 404 si el endpoint cambia.
**Por qué pasa:** String hardcodeado en el default del provider Anthropic.
**Cómo evitar:** Cambiar a `claude-sonnet-4-5-20250514` (modelo disponible en Anthropic API según CONTEXT.md). La firma de `askLLM()` ya acepta `model` como opción — pasar explícitamente.
**Señales de alerta:** `res.ok === false` silencioso en el bloque Anthropic → `askLLM()` retorna null → cae al fallback (que es correcto, pero sin logging se ve como "AI no genera texto").

### Pitfall 3: DailyFeedback no vincula a DailyRecommendation

**Qué sale mal:** FEEDBACK-02 requiere que el feedback esté vinculado a la recomendación del día para revisión futura. Sin FK, la vinculación es solo por `userId + date` — frágil si se regenera el plan.
**Por qué pasa:** `DailyFeedback` en schema actual no tiene `recommendationId String?`.
**Cómo evitar:** Agregar FK opcional en la migración. El POST `/api/feedback` recibe `recommendationId` opcional desde el cliente (el plan page ya tiene el `plan.id`).

### Pitfall 4: BottomNav consume espacio vertical del contenido

**Qué sale mal:** `fixed bottom-0` de 64px hace que el último elemento de la página quede tapado en mobile.
**Por qué pasa:** El contenido no sabe que existe el nav fijo.
**Cómo evitar:** Agregar `pb-20` (padding-bottom: 5rem) al contenedor principal de cada página donde está el BottomNav. O usar `pb-safe` si se agrega el plugin de safe-area.

### Pitfall 5: timeOfDay override en check-in no llega al phrasing

**Qué sale mal:** El founder pone "entreno al mediodía" en el check-in, pero el AI phrasing usa el default del perfil (evening) porque el override no fluye hasta `generateMomentPhrasing()`.
**Por qué pasa:** `DailyCheckin.timeOfDay` ya existe en el schema, pero `GET /api/daily-plan` no lo incluye en el `checkin` select, y `buildNutritionPlan()` no lo pasa al phrasing.
**Cómo evitar:** El `checkin` select en `daily-plan/route.ts` debe incluir `timeOfDay`. La función de phrasing recibe `trainingTime` resuelto: `checkin.timeOfDay ?? profile.defaultTrainingTime ?? 'morning'`.

### Pitfall 6: OpenAI endpoint /v1/responses retorna null silencioso

**Qué sale mal (conocido de Phase 1 STATE.md):** `/v1/responses` retorna null si la cuenta no tiene acceso a Responses API. El plan cae al fallback sin logging.
**Cómo evitar:** En Phase 2 solo se usa el provider Anthropic — nunca OpenAI para phrasing. Usar `provider: 'anthropic'` explícitamente en todas las llamadas a `askLLM()`.

---

## Code Examples

Verificados contra el código real del proyecto:

### Llamada correcta a askLLM con Anthropic

```typescript
// lib/ai/phrasing.ts
// Source: lib/ai/llm.ts (leído directamente)
import { askLLM } from '@/lib/ai/llm';

const result = await askLLM(prompt, {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250514', // pin explícito
  system: PHRASING_SYSTEM_PROMPT,
});
// result es string | null — si null, usar deterministicFallback()
```

### Fallback determinista (patrón requerido)

```typescript
// Nunca retornar JSON crudo ni string vacío
export function deterministicFallback(
  dayType: string,
  moment: NutritionMoment,
  foods: FoodOption[],
  mealName: string
): string {
  const foodList = foods.map(f => `${f.name} (${f.portion})`).join(' o ');
  const dayLabels: Record<string, string> = {
    high: 'alta carga', moderate: 'carga moderada', rest: 'descanso', low: 'carga baja'
  };
  return `${mealName}: día de ${dayLabels[dayType] ?? dayType}. Opciones: ${foodList}.`;
}
```

### Acordeón con estado local (patrón de CheckinForm extendido)

```typescript
// components/nutrition/DailyPlanView.tsx
'use client';
import { useState } from 'react';

// El primer momento abierto por default
const [openMoment, setOpenMoment] = useState<string>('preWorkout');

// Toggle — uno a la vez
const toggle = (key: string) =>
  setOpenMoment(prev => prev === key ? '' : key);
```

### Tap-buttons 1-5 (reemplaza selects en FeedbackForm)

```typescript
// Patrón ya usado en CheckinForm.tsx para fatigue
{[1, 2, 3, 4, 5].map((n) => (
  <button
    key={n}
    type="button"
    onClick={() => setForm(prev => ({ ...prev, energy: n }))}
    className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold transition-colors ${
      form.energy === n
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {n}
  </button>
))}
```

### Migración Prisma requerida

```prisma
// prisma/schema.prisma — cambios a agregar

model Profile {
  // ... campos existentes ...
  defaultTrainingTime String? // 'morning' | 'midday' | 'evening'
}

model DailyRecommendation {
  // ... campos existentes ...
  aiHeadline    String?  @db.Text  // "Hoy es día de alta carga..."
  aiMomentTexts Json?              // { preWorkout: "...", postWorkout: "...", ... }
}

model DailyFeedback {
  // ... campos existentes ...
  recommendationId String?
  recommendation   DailyRecommendation? @relation(fields: [recommendationId], references: [id])
}
```

### Resolución de trainingTime con fallback chain

```typescript
// En GET /api/daily-plan — resolver trainingTime antes de phrasing
const profile = await prisma.profile.findUnique({
  where: { userId },
  select: { defaultTrainingTime: true }
});
const trainingTime =
  (checkin?.timeOfDay as 'morning' | 'midday' | 'evening' | null) ??
  (profile?.defaultTrainingTime as 'morning' | 'midday' | 'evening' | null) ??
  'morning'; // fallback hardcoded si no hay nada
```

---

## State of the Art

| Enfoque viejo | Enfoque actual | Cuándo cambió | Impacto |
|---------------|----------------|---------------|---------|
| NutritionPanel con macros visibles | Plan sin macros, solo nombre+porción | Phase 2 | UX simplificada, foco en "qué comer" |
| DashboardNav horizontal top | BottomNav fijo abajo | Phase 2 | Mobile-first real, patrón de apps nativas |
| Texto determinista tipo "Sugiero: X o Y" | Texto AI conversacional con fallback | Phase 2 | Experiencia de coach real |
| FeedbackForm con `<select>` | Tap-buttons 1-5 | Phase 2 | Mobile UX, mismo tiempo de completado |
| /plan usa PlanForm (legacy) | DailyPlanView con acordeones | Phase 2 | Legible en <20s |

**Deprecated/Outdated en este proyecto:**
- `components/dashboard/NutritionPanel.tsx`: Muestra macros y CTL/ATL en el panel. Se reemplaza por DailyPlanView o se oculta del flujo principal.
- `app/plan/page.tsx` → `PlanForm` component: UI de formulario, no de visualización. Reescribir completo.
- `DashboardNav` como navegación principal: Reemplazar por BottomNav para el flujo ATHLETE.

---

## Open Questions

1. **¿Dónde vive el BottomNav en el layout?**
   - Lo que sabemos: `app/layout.tsx` solo tiene `SessionProvider`. Cada página tiene su propio wrapper.
   - Lo que está poco claro: si el BottomNav va en `app/layout.tsx` (global para todos) o dentro del layout de dashboard solamente.
   - Recomendación: Crear `app/(app)/layout.tsx` como route group con BottomNav. Rutas dentro: `/dashboard`, `/plan`, `/checkin`, `/feedback`. Evita mostrar BottomNav en `/auth/login` o `/`.

2. **¿La relación DailyFeedback → DailyRecommendation requiere cascade?**
   - Lo que sabemos: DailyFeedback tiene `@@unique([userId, date])`. Si se regenera el plan (nuevo DailyRecommendation con mismo userId+date via upsert), el id cambia.
   - Lo que está poco claro: ¿puede DailyRecommendation hacer upsert cambiando su id? En Prisma, upsert actualiza el registro existente sin cambiar el id — el `@@unique([userId, date])` garantiza unicidad. La FK es segura.
   - Recomendación: Agregar `recommendationId String?` (nullable), sin cascade delete, con `@relation` `onDelete: SetNull`.

3. **¿Qué modelo exacto de Claude usar en llm.ts?**
   - Lo que sabemos: CONTEXT.md menciona `claude-sonnet-4-5-20250514`. El modelo actual en llm.ts es `claude-3-5-sonnet-20240620`.
   - Lo que está poco claro: La disponibilidad exacta del modelo en la cuenta del proyecto.
   - Recomendación: Usar `claude-sonnet-4-5-20250514`. Si falla (404), el fallback determinista cubre. Loggear el error explícitamente para visibilidad.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No hay framework de tests configurado actualmente |
| Config file | Ninguno detectado (no jest.config.*, no vitest.config.*) |
| Quick run command | N/A — Wave 0 establece framework |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REC-01 | daily-plan GET retorna aiHeadline + aiMomentTexts | manual-only | verificar en navegador | No aplica |
| REC-02 | Plan view no muestra macros | manual-only | verificar visualmente | No aplica |
| REC-03 | AI falla → fallback determinista legible (no JSON) | unit | `npx tsx lib/ai/phrasing.test.ts` | ❌ Wave 0 |
| FEEDBACK-01 | Tap-buttons 1-5 funcionan en mobile | manual-only | test en browser móvil | No aplica |
| FEEDBACK-02 | POST /feedback guarda con recommendationId | manual-only | verificar en DB | No aplica |
| UI-01 | Home muestra estado + CTA | manual-only | verificar en navegador | No aplica |
| UI-02 | Plan legible en <20s (sin macros, acordeones) | manual-only | cronómetro manual | No aplica |
| UI-03 | BottomNav visible en viewport 390px | manual-only | DevTools mobile simulation | No aplica |
| UI-04 | Error states visibles (no spinner infinito) | manual-only | desconectar network, recargar | No aplica |

**Nota:** La mayoría de los requerimientos de esta fase son verificables manualmente en menos de 5 minutos. El único candidato a test unitario es el fallback determinista de `phrasing.ts` — función pura, sin dependencias externas.

### Sampling Rate
- **Por tarea:** Verificación manual en browser (mobile DevTools 390px)
- **Por wave:** Completar 3 check-ins consecutivos sin error de UI (criterio de éxito del founder)
- **Phase gate:** Los 5 success criteria del CONTEXT.md deben ser TRUE antes de `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/ai/phrasing.test.ts` — cubre REC-03 (fallback determinista no retorna JSON)
- [ ] Framework: `npm install --save-dev jest @types/jest ts-jest` — si se requiere automatización

*(Si no se instala framework: "None — all reqs verified manually as specified in success criteria")*

---

## Sources

### Primary (HIGH confidence)
- Código fuente del proyecto (leído directamente): `lib/ai/llm.ts`, `lib/nutrition/engine.ts`, `components/nutrition/FeedbackForm.tsx`, `components/nutrition/CheckinForm.tsx`, `components/dashboard/NutritionPanel.tsx`, `prisma/schema.prisma`, `app/api/daily-plan/route.ts`, `app/api/feedback/route.ts`, `app/api/checkin/route.ts`
- `package.json` — versiones verificadas del stack
- `.planning/phases/02-app-usable/02-CONTEXT.md` — decisiones bloqueadas del founder

### Secondary (MEDIUM confidence)
- Patrones de Next.js App Router Route Groups (`app/(group)/layout.tsx`) — documentación oficial Next.js
- Prisma upsert con @@unique constraint — documentación oficial Prisma
- Anthropic Messages API (`/v1/messages`) — estructura verificada en llm.ts existente

### Tertiary (LOW confidence)
- Disponibilidad de `claude-sonnet-4-5-20250514` en la cuenta específica del proyecto — no verificable sin credenciales

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todas las versiones verificadas del package.json del proyecto
- Architecture: HIGH — patrones verificados contra el código existente; no asunciones
- Pitfalls: HIGH — identificados directamente del código (NutritionPanel con macros, schema sin aiHeadline, modelo de Claude desactualizado)
- AI phrasing: MEDIUM — `askLLM()` funciona para Anthropic, pero disponibilidad del modelo específico no confirmada

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (stack estable, 30 días)
