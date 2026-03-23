# Phase 1: Core Loop — Research (Wire-in Focus)

**Researched:** 2026-03-22
**Domain:** Check-in → Nutrition Engine wiring (Next.js API routes, Prisma, TypeScript)
**Confidence:** HIGH

---

## Summary

El check-in ya se guarda correctamente en DB (`DailyCheckin`). El endpoint `/api/daily-plan`
ya llama a `buildNutritionPlan()`. El problema es puntual: **`/api/daily-plan` no lee el
check-in del dia antes de llamar al engine**. La funcion recibe `planEntry` y `loads`
pero nunca `fatigue`, `sleepHours` ni `intensity` del atleta.

Hay un segundo caller: `lib/action-plan/plan.ts` (`buildActionPlan`), que si fetchea el
check-in (linea 73) pero tampoco lo pasa al engine (lineas 81-84). Ambos callers deben
actualizarse.

El endpoint legacy `/api/agents/nutrition-plan/route.ts` usa LLM (via `askLLM`), no el
engine. El componente `NutritionAgentPanel.tsx` lo consume directamente desde
`app/dashboard/nutrition-plan/page.tsx` (linea 34). Eliminar el endpoint sin eliminar el
componente rompe esa pagina.

**Recomendacion principal:** Agregar `checkin` como parametro opcional a
`buildNutritionPlan()`, leerlo en `/api/daily-plan` GET antes de llamar al engine,
actualizar `buildActionPlan` de la misma forma, luego eliminar legacy endpoint +
componente juntos como unidad atomica.

---

## Current Data Flow Analysis

### Flujo actual (check-in guardado, engine desconectado)

```
CheckinForm.tsx
  |
  | POST /api/checkin
  | payload: { sleepHours, sleepQuality, fatigue, hunger, stress,
  |            trainingType, durationMin, intensity, timeOfDay, notes }
  v
app/api/checkin/route.ts  [lineas 47-107]
  |
  | prisma.dailyCheckin.upsert(...)
  v
DB: DailyCheckin  <-- datos GUARDADOS CORRECTAMENTE

        [AQUI ROMPE EL WIRE — nadie lee DailyCheckin para el plan]

app/dashboard/nutrition-plan/page.tsx
  |
  | GET /api/daily-plan?date=...
  v
app/api/daily-plan/route.ts  [lineas 31-98]
  |
  | getDailyLoads(userId, 60)            [lib/training/load.ts]
  | calcularAtlCtlAcwr(loads)
  | findTrainingPlanEntryForDate(...)    [lib/training/plan.ts]
  |
  | buildNutritionPlan({
  |   planEntry: planEntry ?? undefined,
  |   loads: { atl, ctl, acwr },
  |   // checkin: NUNCA PASADO
  | })
  v
lib/nutrition/engine.ts  [buildNutritionPlan, linea 84]
  |
  | canonicalDayType(planEntry) --> usa planEntry.dayType, ignora fatiga real
  | pickFoods(moment, focus)    --> usa planEntry.focus, ignora sueño/estado
  v
DailyRecommendation (upsert en DB)
```

### Segundo caller con el mismo problema

```
lib/action-plan/plan.ts  [buildActionPlan, lineas 69-202]
  |
  | prisma.dailyCheckin.findUnique(...)  <-- SI lee el check-in [linea 73]
  | buildNutritionPlan({                <-- pero NO lo pasa al engine [linea 81-84]
  |   planEntry,
  |   loads
  |   // checkin: ausente
  | })
  |
  | El checkin se expone en la respuesta final [linea 194-199]
  | pero nunca modula el plan de nutricion
```

### Legacy endpoint (a eliminar)

```
app/dashboard/nutrition-plan/page.tsx  [linea 7, 34]
  |
  | import NutritionAgentPanel (linea 7)
  | <NutritionAgentPanel /> (linea 34)
  v
components/dashboard/NutritionAgentPanel.tsx  [linea 31]
  |
  | fetch("/api/agents/nutrition-plan")  [linea 31]
  v
app/api/agents/nutrition-plan/route.ts  [linea 19-116]
  |
  | prisma.trainingActivity.findMany(...)  -- ultimas 2 semanas
  | askLLM(prompt)                         -- llama LLM con heuristica hardcodeada
  v
JSON: { summary: {calories, protein, carbs, fat}, suggestions[] }
  -- NO usa buildNutritionPlan
  -- NO usa DailyCheckin
  -- Produce macros como dato primario (anti-patron)
```

---

## Proposed Wiring Diagram

```
CheckinForm (5 campos simplificados post-Task A)
  |
  POST /api/checkin
  |
  DailyCheckin (DB)
        |
        | prisma.dailyCheckin.findUnique()  <-- NUEVO en daily-plan GET
        |
/api/daily-plan GET
  |
  +-- getDailyLoads()
  +-- findTrainingPlanEntryForDate()
  +-- [NUEVO] prisma.dailyCheckin.findUnique({ userId, date })
  |
  buildNutritionPlan({
    planEntry,
    loads,
    checkin: checkin ?? undefined    <-- NUEVO
  })
  |
  engine.ts: resolveCheckinModifiers(checkin)
    fatigue >= 4  --> downgrade requiresIntraFuel, downgrade dayType si es "high"
    sleepHours < 6 --> forzar focus = "recovery" en dinner
    trainingType = 'rest' sin planEntry --> confirmar dayType = "rest"
  |
  DailyRecommendation (upsert, contrato de respuesta sin cambio externo)
```

---

## API Contract Changes

### `buildNutritionPlan()` — nueva firma

**Archivo:** `lib/nutrition/engine.ts` (linea 84-87)

**Firma actual:**
```typescript
export function buildNutritionPlan(params: {
  planEntry?: NutritionPlanEntry;
  loads: { atl: number | null; ctl: number | null; acwr: number | null };
})
```

**Firma propuesta:**
```typescript
type CheckinInput = {
  fatigue?: number | null;
  sleepHours?: number | null;
  intensity?: string | null;
  trainingType?: string | null;
  durationMin?: number | null;
};

export function buildNutritionPlan(params: {
  planEntry?: NutritionPlanEntry;
  loads: { atl: number | null; ctl: number | null; acwr: number | null };
  checkin?: CheckinInput;  // NUEVO: opcional para backward compat
})
```

El parametro es opcional. Los dos callers existentes siguen compilando sin cambio hasta
que se actualicen explicitamente.

### Logica de modulacion (nueva funcion dentro del engine)

```typescript
function resolveCheckinModifiers(
  baseDayType: string,
  baseRequiresIntra: boolean,
  checkin?: CheckinInput
): { dayType: string; requiresIntraFuel: boolean; recoveryFocus: boolean } {
  if (!checkin) {
    return { dayType: baseDayType, requiresIntraFuel: baseRequiresIntra, recoveryFocus: false };
  }

  let dayType = baseDayType;
  let requiresIntraFuel = baseRequiresIntra;

  // Fatiga alta: bajar intensidad percibida
  if (checkin.fatigue != null && checkin.fatigue >= 4) {
    if (dayType === 'high') dayType = 'moderate';
    requiresIntraFuel = false;
  }

  // Sueño bajo: forzar foco recovery en dinner
  const recoveryFocus = checkin.sleepHours != null && checkin.sleepHours < 6;

  return { dayType, requiresIntraFuel, recoveryFocus };
}
```

### `/api/daily-plan` GET — cambio minimo

**Archivo:** `app/api/daily-plan/route.ts` (linea 38-44)

Agregar fetch del check-in y pasarlo al engine:

```typescript
// NUEVO: leer check-in del dia (linea ~40, antes de buildNutritionPlan)
const checkin = await prisma.dailyCheckin.findUnique({
  where: { userId_date: { userId, date: normalizedDate } },
  select: {
    fatigue: true,
    sleepHours: true,
    intensity: true,
    trainingType: true,
    durationMin: true,
  },
});

// Linea 41 — agregar checkin al call existente
const planResponse = buildNutritionPlan({
  planEntry: planEntry ?? undefined,
  loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
  checkin: checkin ?? undefined,  // NUEVO
});
```

No hay cambio en el contrato de respuesta del endpoint. El JSON devuelto es identico en
estructura.

### `lib/action-plan/plan.ts` — cambio de una linea

**Archivo:** `lib/action-plan/plan.ts` (linea 81-84)

El checkin ya esta en scope (fetcheado en linea 73 via `Promise.all`). Solo falta
pasarlo:

```typescript
// Antes (linea 81-84):
const nutritionPlan = buildNutritionPlan({
  planEntry: planEntry ?? undefined,
  loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
});

// Despues:
const nutritionPlan = buildNutritionPlan({
  planEntry: planEntry ?? undefined,
  loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
  checkin: checkin ?? undefined,  // NUEVO: checkin ya esta en scope desde linea 73
});
```

---

## DB Schema Changes

### No se requieren migraciones para el wire-in core

El modelo `DailyCheckin` ya tiene todos los campos necesarios (schema.prisma lineas
465-485):
- `fatigue Int?` (linea 471)
- `sleepHours Float?` (linea 469)
- `intensity String?` (linea 476)
- `trainingType String?` (linea 474)
- `durationMin Int?` (linea 475)

El modelo `DailyRecommendation` ya almacena `dayType`, `focus`, `reasoning` (lineas
507-509). No necesita campo nuevo para reflejar influencia del check-in.

### Cambios de schema requeridos en Phase 1 (pero no para este wire-in)

**Task A — simplificar DailyCheckin (migration requerida):**
- Eliminar del form: `sleepQuality`, `hunger`, `stress`, `timeOfDay`, `notes`
- Cambiar `trainingType String?` a enum `TrainingType` (bike/run/swim/tri/rest)
- Los campos eliminados pueden quedar en DB como nullable sin migration

**Task E — Profile con FTP y timezone (migration requerida):**
El modelo `Profile` no tiene `ftp` ni `timezone` (solo `weight`, `height`, `sportType`,
schema lineas 68-89). Agregar estos campos requiere migration. No bloquea el wire-in.

---

## Step-by-Step Implementation

### Paso 1 — Extender `buildNutritionPlan()` con checkin opcional
**Archivo:** `lib/nutrition/engine.ts`

1. Definir tipo local `CheckinInput` antes de la funcion (5 campos)
2. Agregar `checkin?: CheckinInput` al objeto de params (linea 85-87)
3. Implementar `resolveCheckinModifiers()` como funcion helper
4. Reemplazar las llamadas a `canonicalDayType` y calculo de `requiresIntra` por
   el resultado de `resolveCheckinModifiers`
5. Tipo de retorno `NutritionPlanResponse` NO cambia

**Riesgo de rotura:** NINGUNO. Parametro opcional. Los dos callers existentes siguen
compilando sin modificacion.

### Paso 2 — Actualizar `/api/daily-plan` GET
**Archivo:** `app/api/daily-plan/route.ts`

1. Agregar `prisma.dailyCheckin.findUnique(...)` antes de `buildNutritionPlan` (~linea 40)
2. Pasar `checkin` al engine

**Riesgo de rotura:** BAJO. Un DB query adicional. El POST del endpoint no cambia.

### Paso 3 — Actualizar `buildActionPlan`
**Archivo:** `lib/action-plan/plan.ts`

1. El checkin ya esta en scope (linea 73)
2. Agregar `checkin: checkin ?? undefined` al call de `buildNutritionPlan` (linea 83)

**Riesgo de rotura:** NINGUNO.

### Paso 4 — Eliminar legacy endpoint + componente (unidad atomica)
**Archivos a eliminar:**
- `app/api/agents/nutrition-plan/route.ts`
- `components/dashboard/NutritionAgentPanel.tsx`

**Archivo a modificar:**
- `app/dashboard/nutrition-plan/page.tsx`: eliminar import (linea 7) y uso (linea 34)

**CRITICO:** Hacer los tres cambios en un solo commit. No eliminar el endpoint sin
modificar la pagina — Next.js compilara pero habra un error en runtime cuando el
componente haga el fetch.

### Paso 5 — Verificacion end-to-end
1. Hacer check-in con fatigue=5, sleepHours=4
2. GET /api/daily-plan
3. Verificar en DB que `DailyRecommendation.dayType` cambia vs sin check-in
4. Verificar que `DailyRecommendation.focus = 'recovery'` cuando sleepHours < 6

---

## Testing Strategy

Segun CONTEXT.md: testing inline, sin framework. Verificar via manual check-in +
inspeccion de DB.

### Escenarios de verificacion manual

**Escenario A — Fatiga alta, sin sesion planificada:**
```
POST /api/checkin { fatigue: 5, sleepHours: 4, trainingType: "rest" }
GET  /api/daily-plan?date=hoy
Expected: dayType="rest", focus="recovery", intraWorkout.foods=[]
```

**Escenario B — Dia de carga alta, fatiga baja:**
```
POST /api/checkin { fatigue: 2, sleepHours: 8, intensity: "High" }
GET  /api/daily-plan  (planEntry con tss>=150 en DB)
Expected: dayType="high", requiresIntraFuel=true, intraWorkout.foods.length > 0
```

**Escenario C — Fatiga alta con sesion high planificada:**
```
POST /api/checkin { fatigue: 4, sleepHours: 5 }
GET  /api/daily-plan  (planEntry con dayType="high")
Expected: dayType rebajado a "moderate", intraWorkout.foods=[]
```

**Escenario D — Sin check-in del dia (backward compat):**
```
GET  /api/daily-plan?date=mañana  (sin checkin registrado)
Expected: mismo comportamiento que antes del cambio (checkin=undefined)
```

### Log de debug sugerido (solo desarrollo)

```typescript
// Al inicio de buildNutritionPlan, si hay checkin:
if (process.env.NODE_ENV === 'development' && checkin) {
  console.log('[engine] checkin modifiers:', {
    fatigue: checkin.fatigue,
    sleepHours: checkin.sleepHours
  });
}
```

---

## Risk Assessment

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| Eliminar endpoint sin actualizar la pagina | ALTA si orden incorrecto | Pagina nutrition rompe en runtime | Eliminar componente + endpoint + import en un solo commit |
| `buildActionPlan` queda sin checkin | MEDIA (facil olvidar) | dashboard principal ignora check-in | Hacer Paso 3 en el mismo PR que Paso 2 |
| `pickFoods` sin cobertura para nuevos focus | MEDIA | foods=[] en algun momento | Task C (expansion catalogo) debe correr en paralelo o antes |
| Schema `DailyCheckin` simplificado (Task A) pero wire-in usa campos que seran eliminados | BAJA | sleepQuality/hunger/stress ya no se envian | El wire-in solo usa fatigue/sleepHours/intensity — todos se mantienen |
| Profile sin ftp/timezone | BAJA para wire | Engine no usa FTP todavia | Solo bloquea Task E (seed), no Tasks A-D |
| `buildActionPlan` umbral fatigue >= 7 inconsistente con escala 1-5 | MEDIA | Alerta de fatigue nunca se dispara si escala es 1-5 | Corregir umbral a >= 4 al hacer Paso 3 |

### Dependencia critica

`pickFoods` en `engine.ts` (linea 62-72) filtra por `option.focus.includes(focus)`.
Con el catalogo actual de 12 items, la cobertura para `focus="recovery"` en todos
los momentos es limitada. Si se activa el wire-in antes de expandir el catalogo (Task C),
algunos momentos pueden retornar `foods=[]` y caer al fallback de 2 items sin filtro.
Verificar cobertura antes de deployar en produccion.

---

## Open Questions

1. **Escala de `fatigue` en `buildActionPlan`**
   - El form actual captura fatigue 1-5 (escala de 5)
   - `buildActionPlan` usa umbral `>= 7` para la alerta de fatiga alta (linea 150)
   - Si la escala es 1-5, el umbral de 7 nunca se alcanza y la alerta nunca aparece
   - Recomendacion: confirmar la escala real y corregir el umbral al hacer Paso 3

2. **`Profile.ftp` y `Profile.timezone` no existen en schema**
   - El modelo `Profile` no los tiene (schema lineas 68-89)
   - Task E (seed) requiere migration para agregarlos
   - No bloquea Tasks A-D del wire-in

3. **`trainingType` enum vs string**
   - Schema actual: `String?`
   - CONTEXT.md pide enum (bike/run/swim/tri/rest)
   - Task A simplifica el form con enum en UI; el schema puede quedarse como String?
     o migrarse a un Prisma enum — decision de Task A, no de Task B

---

## Sources

### Primary (HIGH confidence — analisis directo del codebase)

- `lib/nutrition/engine.ts` — firma actual, logica completa de `buildNutritionPlan`
- `app/api/daily-plan/route.ts` — flujo GET lineas 38-44, confirma que checkin nunca se lee
- `app/api/checkin/route.ts` — confirma DailyCheckin se guarda correctamente
- `components/nutrition/CheckinForm.tsx` — 11 campos actuales, POST a /api/checkin
- `prisma/schema.prisma` — DailyCheckin (465-485), DailyRecommendation (487-521),
  Profile (68-89)
- `lib/action-plan/plan.ts` — segundo caller, checkin fetcheado pero no pasado al engine
- `app/api/agents/nutrition-plan/route.ts` — legacy, usa LLM, no el engine
- `components/dashboard/NutritionAgentPanel.tsx` — importado en nutrition-plan/page.tsx
- `app/dashboard/nutrition-plan/page.tsx` — confirma dependencia en lineas 7 y 34

### Secondary (MEDIUM confidence)

- `.planning/research/PITFALLS.md` — Pitfall 6: gap checkin/engine con referencias de codigo
- `.planning/research/ARCHITECTURE.md` — gap identificado en diagrama
- `.planning/research/SUMMARY.md` — "buildNutritionPlan nunca recibe DailyCheckin"

---

## Metadata

**Confidence breakdown:**
- Flujo actual y gap identificado: HIGH — verificado linea a linea
- Cambios de firma propuestos: HIGH — no requieren dependencias nuevas
- Logica de modulacion fatigue/sleep: MEDIUM — reglas razonables, no validadas con datos reales
- Schema: HIGH — sin migration requerida para wire-in core
- Riesgo legacy endpoint: HIGH — dependencia directa confirmada en page.tsx

**Research date:** 2026-03-22
**Valid until:** 2026-04-22
