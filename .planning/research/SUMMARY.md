# Research Summary — RytMo Fueling Engine

**Project:** RytMo
**Domain:** Daily sports-nutrition recommendation engine for endurance athletes
**Researched:** 2026-03-22
**Confidence:** HIGH (brownfield — all findings grounded in direct codebase analysis)

---

## Executive Summary

RytMo es un motor de recomendaciones de alimentación para atletas de resistencia, no un tracker de macros. La arquitectura correcta es: reglas deterministas deciden qué comer, IA solo redacta el texto. Esta separación ya existe parcialmente en el código —`lib/nutrition/engine.ts` tiene la lógica, `lib/ai/llm.ts` tiene el phraser— pero las piezas no están conectadas entre sí ni con el check-in diario. El MVP no requiere construir desde cero; requiere unir lo que ya existe, eliminar lo que contamina, y expandir el catálogo de alimentos.

El stack está en excelente estado para el propósito: Next.js + Prisma + PostgreSQL es el canal correcto para un motor que computa en servidor y persiste resultados estructurados. El único problema técnico bloqueante identificado es el endpoint de OpenAI apuntando a `/v1/responses` en lugar de `/v1/chat/completions` — si la cuenta no tiene acceso a Responses API, todas las llamadas a IA retornan null silenciosamente. Todo lo demás (auth, Strava sync, modelos Prisma, load calculator) está funcionando.

El riesgo principal no es técnico: es UX y coherencia del sistema. Hay dos motores de nutrición en paralelo produciendo outputs distintos, el check-in no alimenta al motor, y el catálogo de 12 items genera fallbacks constantes. Si un atleta llena el check-in y recibe un plan que ignora su estado, deja de usar la app en 3 días. La secuencia correcta del MVP es: limpiar, conectar, completar catálogo, validar con uso real — en ese orden.

---

## Key Findings

### Stack (Ver detalle: STACK.md)

Stack completamente bloqueado y apropiado. No se necesitan dependencias nuevas para el MVP.

**Tecnologías core:**
- **Next.js 16 API Routes:** Mecanismo correcto — computar en servidor, persistir en DB, retornar JSON. No necesita streaming ni edge functions.
- **Prisma 6 + PostgreSQL 16 (Neon en prod):** Schema tiene todos los modelos necesarios (`DailyCheckin`, `DailyRecommendation`, `DailyFeedback`, `TrainingPlanEntry`, `TrainingActivity`). `FoodItem` model existe pero es dead code — el catálogo vive como TypeScript array.
- **Zod 4 + TypeScript 5:** Ya instalados. Falta aplicar Zod en el boundary del check-in POST y en el output del phraser IA.
- **`lib/ai/llm.ts` con raw fetch:** Patrón correcto — sin SDK, soporta OpenAI y Anthropic con fallback a null. Bug: endpoint `/v1/responses` puede no tener acceso — verificar antes de asumir que IA funciona.
- **Catálogo como TypeScript array:** Correcto para 40-80 items. No migrar a DB. Tipo `FoodOption` + array estático = zero latency, type-safe, deploy sin migrations.

**NO usar:** USDA FoodData Central, Open Food Facts, Nutritionix, openai SDK, Redis, WebSockets, BullMQ. Ninguno aporta valor para un MVP de un solo usuario.

---

### Features (Ver detalle: FEATURES.md)

RytMo gana por hacer lo que ningún competidor hace: output en alimentos concretos (no macros) + localización LatAm + loop de feedback subjetivo. Fuelin da targets de CHO en gramos. RytMo da "marraqueta + palta + huevo". Esa diferencia es el producto.

**Obligatorias (sin estas, no hay producto):**
- Check-in diario — entrenamiento, duración, intensidad, calidad de sueño (5 campos, sub-60s)
- Carb targeting por carga de entrenamiento — reglas: día alto / moderado / descanso
- Output por momento — Pre / Intra / Post / Cena, alimentos concretos del catálogo
- Catálogo curado 40-80 alimentos chilenos — internamente mapeado a macros, pero UI muestra nombres
- AI phrasing — plan estructurado → texto español conversacional (GPT-4o-mini)
- Formulario de feedback — Energía, Hambre, GI, Rendimiento. 4 preguntas post-sesión

**Diferenciadores a incluir en v1:**
- Estado subjetivo como input (fatiga, sueño) modulando recomendaciones — es el wedge contra Fuelin
- Alimentos chilenos/LatAm como primera clase — marraqueta, cazuela, lúcuma, mote, merkén
- Output food-first, macros ocultos — posicionamiento explícito contra MFP
- AI redactando en español informal — "hoy tu cuerpo necesita..." no "150g CHO"

**Diferir a v2:**
- Selección de fase de entrenamiento (base/build/race/taper)
- Auto-pull de Strava para pre-llenar check-in
- Tracking de adherencia multi-semana
- Planes específicos para día de carrera
- Guía de hidratación/electrolitos

**Nunca construir:**
- Barcode scanner, macro dashboard, features sociales, portal coach/nutricionista, base USDA completa, tracking de peso, app nativa iOS/Android, subscription/pagos en v1.

---

### Architecture (Ver detalle: ARCHITECTURE.md)

El patrón correcto ya está implementado parcialmente. El principio central: **IA no elige alimentos. IA solo redacta.** Toda la lógica de decisión es TypeScript determinista.

```
Training context → Rule engine → Food catalog → AI phrasing → Output
    (facts)           (logic)       (options)      (language)    (plan)
```

**Componentes y estado actual:**

| Componente | Responsabilidad | Estado |
|------------|-----------------|--------|
| CheckinCapture | `POST /api/checkin` — persiste estado diario | Existe, funciona, 11 campos (demasiados) |
| TrainingContextResolver | Resuelve `TrainingPlanEntry` + `matchedActivity` | Existe en `lib/training/plan.ts` |
| LoadCalculator | ATL/CTL/ACWR desde 60 días de actividades | Existe en `lib/training/load.ts` |
| FuelingEngine | `dayType → focus → food selection` | Existe en `lib/nutrition/engine.ts`, pero NO recibe check-in |
| FoodCatalog | 40-80 alimentos chilenos por momento + focus | Existe, solo 12 items — necesita expansión |
| AIPhraser | Plan estructurado → prosa española | Falta wrapper `lib/nutrition/phraser.ts` |
| PlanStore | Upsert `DailyRecommendation` | Existe vía Prisma |
| FeedbackCollector | `POST /api/feedback` | Existe, funciona |

**Gap crítico:** `buildNutritionPlan` nunca recibe `DailyCheckin`. Check-in y motor están desconectados. Esto es el problema #1 a resolver.

**Gap secundario:** `app/api/agents/nutrition-plan/route.ts` es un segundo motor paralelo que usa IA para calcular macros — exactamente el anti-patrón. Debe eliminarse antes de construir cualquier cosa nueva.

---

### Pitfalls (Ver detalle: PITFALLS.md)

Todos los pitfalls críticos están **ya presentes en el código**, no son riesgos futuros.

**Top 6 críticos (todos con evidencia en codebase):**

1. **Dos motores de nutrición en paralelo** — `/api/agents/nutrition-plan` y `/api/daily-plan` coexisten y producen outputs distintos. El primero llama a IA para calcular macros; el segundo usa reglas para seleccionar alimentos. La UI puede servir cualquiera de los dos. Solución: eliminar el route de agents, consolidar en `daily-plan` + `engine.ts`.

2. **Check-in desconectado del motor** — `buildNutritionPlan` nunca recibe `DailyCheckin`. Un atleta que marca fatiga 5/5 y sueño 4h recibe el mismo plan que si estuviese fresco. El loop completo check-in → plan → feedback está roto en el primer eslabón. Solución: pasar checkin a `buildNutritionPlan`, añadir modificador de fatiga/sueño.

3. **Catálogo de 12 items produce fallbacks constantes** — `pickFoods()` filtra por `moment × focus` (5×4 = 20 combinaciones). Con 12 items hay celdas vacías; el fallback ignora el focus. Solución: expandir a ~40 items antes de cualquier uso real.

4. **Output en macros como dato primario** — `agents/nutrition-plan` retorna `{ calories, protein, carbs, fat }` como respuesta principal. Si cualquier componente renderiza esto, el producto destruye su propia propuesta de valor. Solución: eliminar la ruta; nunca mostrar macros como headline.

5. **Check-in con 11 campos — imposible en sub-60s** — El `CheckinForm.tsx` tiene 11 campos incluyendo texto libre para `trainingType`. En móvil, 3-4 minutos mínimo. El objetivo es sub-60s. Solución: reducir a 5 campos, reemplazar texto libre por 5 presets (tap-not-type).

6. **Strava sync fallando silenciosamente** — `tokenRefresh` retorna null con solo `console.error`. Si el sync falló hace 3 días, el motor calcula ATL/CTL con datos incompletos y recomienda "día de descanso" a alguien que entró fuerte ayer. Solución: añadir `staleSync` flag en response de `daily-plan` + banner en UI.

---

## RytMo MVP Strategy (Derived from Research)

La investigación converge en una estrategia clara: **el código ya tiene las piezas correctas, pero están desconectadas o contaminadas por código incorrecto.**

El MVP válido no necesita construir features nuevas en Phase 1. Necesita:
1. **Eliminar** el motor incorrecto (agents endpoint)
2. **Conectar** los sistemas existentes (check-in → engine)
3. **Completar** el catálogo para que el motor tenga cobertura real
4. Solo entonces: **validar** con uso personal real (3-5 días)

La secuencia de features correcta según las dependencias identificadas:

```
Personalization baseline (Profile: peso, FCmax, FCreposo)
  → Carb targets calibrados para el atleta real
    → Catálogo expandido (40 items, cobertura 5×4)
      → Engine recibe check-in (fatiga/sueño modulan dayType)
        → AI phrasing layer (prosa, no lógica)
          → UI PlanView (summary + moment cards)
            → Feedback form visible y vinculado al plan
              → [v2] Feedback que modifica recomendaciones futuras
```

La integración de Strava ya existe parcialmente. Funciona como fuente de `TrainingActivity` para load calculation — no necesita más trabajo en Phase 1. El auto-fill del check-in desde Strava es mejora de UX para Phase 2.

---

## Critical Path (First 3 Phases)

### Phase 1 — Limpieza y Conexión del Core Loop

**Rationale:** No se puede validar nada si el sistema produce outputs inconsistentes o ignora los inputs del usuario. Esta fase no construye features: elimina contaminación y cierra el loop fundamental.

**Entrega:** Un motor que recibe check-in real → produce plan basado en estado del atleta → persiste resultado consistente. Sin ambigüedad sobre qué sistema generó el plan.

**Tareas derivadas de research:**
- Eliminar `/api/agents/nutrition-plan` y `NutritionAgentPanel.tsx` (Pitfall 1)
- Wire `DailyCheckin` en `buildNutritionPlan` — fatigue/sleep modifica dayType (Pitfall 6 / Architecture gap)
- Expandir `lib/nutrition/catalog.ts` de 12 a ~40 items con cobertura de todas las celdas `moment × focus` (Pitfall 7)
- Seed `Profile` con valores reales del founder: FCmax, FCreposo, peso (Pitfall 8)
- Reducir `CheckinForm` a 5 campos, tipo entrenamiento como presets, no texto libre (Pitfall 3)
- Verificar timezone handling — `normalizeDate()` usa UTC midnight, Santiago es UTC-3/4 (Pitfall 10)
- Fijar enum de intensidad en español: `baja/moderada/alta` en lugar de `Low/Moderate/High` (Pitfall 11)
- Route guards en dashboards de Coach/Nutritionist/Medical (Pitfall 13)

**Pitfalls evitados:** 1, 3, 6, 7, 8, 10, 11, 13

---

### Phase 2 — AI Phrasing + Plan UI + Feedback Loop

**Rationale:** Con el motor core funcionando y produciendo output confiable, se añade la capa de lenguaje natural y la UI que el atleta realmente ve. El feedback loop cierra el ciclo de validación.

**Entrega:** App usable end-to-end. El atleta hace check-in, ve plan en lenguaje conversacional (no JSON, no macros), puede dar feedback. El founder puede hacer 3-5 días de uso real y evaluar calidad de recomendaciones.

**Tareas derivadas de research:**
- Crear `lib/nutrition/phraser.ts` — wrapper de `askLLM` que recibe plan estructurado y retorna prosa española por momento (Architecture: AIPhraser component)
- Verificar/fijar endpoint OpenAI: `/v1/responses` → `/v1/chat/completions` si es necesario (STACK: AI Layer bug)
- Fallback a texto determinista si AI call retorna null — plan siempre visible (Architecture: Pitfall 5)
- Añadir Zod validation en `POST /api/checkin` — gate de inputs malformados (STACK: Missing gap #1)
- Añadir Zod parse en output de AIPhraser (STACK: Missing gap #2)
- Construir `PlanView` component — summary card + moment cards + food chips + AI prose (Architecture: Level 4)
- Añadir `staleSync` flag en `/api/daily-plan` response + banner en UI cuando Strava > 2 días sin sync (Pitfall 5)
- Verificar `FeedbackForm` → `DailyFeedback` está funcionando end-to-end

**Pitfalls evitados:** 2, 4, 5, 9 (parcial)

---

### Phase 3 — Validación Personal y Ajuste

**Rationale:** Uso real durante 5-7 días expone gaps que el código no puede revelar: qué alimentos del catálogo faltan, qué thresholds de TSS están mal calibrados para el perfil del founder, si el plan cambia entre morning/evening due al Pitfall 12.

**Entrega:** Datos de uso real. Refinamiento del catálogo basado en lo que el atleta realmente come. Thresholds ajustados. Decisión informada sobre qué construir en v2.

**Tareas derivadas de research:**
- Uso personal diario: check-in → plan → feedback durante mínimo 5 días
- Añadir plan generation-once-per-day (no regenerar en cada GET sin intención explícita) (Pitfall 12)
- Revisar feedback de energía de los 5 días: si 2 días consecutivos con energía <= 2, flag "energía persistentemente baja" en contexto del plan siguiente (Pitfall 9)
- Validar thresholds TSS: TSS >= 150 = alto, 60-149 = moderado, < 60 = descanso — ajustar si necesario contra datos reales de Strava (STACK: Open Question #3)
- Expandir catálogo con items que surgieron del uso real pero no estaban
- Decisión informada: ¿Strava auto-fill del check-in aporta suficiente para mover a v2? ¿Training phase selection?

**Requiere investigación adicional:** Los thresholds de TSS para el perfil específico del founder (triatlón) pueden necesitar calibración manual.

---

## Open Questions for Planning

Aspectos que la investigación no puede resolver sin validación en runtime o uso real:

1. **¿Funciona el endpoint `/v1/responses` de OpenAI con la cuenta actual?**
   Si no tiene acceso a Responses API, todas las llamadas retornan null sin error visible. El agents route parsea `data.output_text` — si cambia a `/v1/chat/completions`, el parser debe usar `data.choices[0].message.content`. Requiere test en runtime antes de asumir que AI funciona.

2. **¿Son correctos los thresholds de TSS para triatlón?**
   TSS >= 150 = día alto fue definido sin validar contra datos reales. Un triatleta haciendo 90min en Z2 produce ~TSS 70 (moderado), que es correcto. Pero un brick workout podría producir TSS 130 que caería en "moderado" cuando debería ser "alto". Los 3-5 días de validación personal revelarán si los thresholds necesitan ajuste.

3. **¿Cuántos alimentos del catálogo cubren el 90% del uso real?**
   La hipótesis es que 40-80 items chilenos cubiertos cubre el 90% de lo que el founder come. Esto no ha sido validado. Puede ser que 20 items bien elegidos sean suficientes, o que haya gaps importantes (snacks de entrenamiento, comida de race day).

4. **¿Es sub-60s alcanzable con 5 campos en móvil?**
   El objetivo está definido pero no medido. El rediseño del check-in a presets tipo tap puede lograr sub-30s. Solo uso real confirma esto.

5. **¿Qué hace Strava con actividades manuales vs automáticas?**
   Si el founder tiene actividades importadas manualmente (sin HR data), `estimarTssDesdeFc()` puede retornar valores erráticos. No hay manejo de este edge case en `load.ts`.

6. **¿La integración Strava cubre el fetch de actividades históricas o solo forward?**
   Para que el load calculator tenga 60 días de datos desde el primer día, el sync inicial necesita traer histórico. La implementación actual en `lib/strava/client.ts` no fue auditada en profundidad para este caso.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Inspección directa del codebase — código funcionando, no conjeturas |
| Features | HIGH | Combinación de domain knowledge (Burke, Jeukendrup) + PROJECT.md decisions + análisis competitivo con caveat de datos a Aug 2025 |
| Architecture | HIGH | Todos los componentes identificados existen en el código — gaps son concretos y localizables |
| Pitfalls | HIGH | Cada pitfall crítico incluye línea de código como evidencia — no especulación |

**Overall confidence:** HIGH

### Gaps a resolver durante implementación

- **Endpoint OpenAI:** Test en runtime, no resolvible en research. Si `/v1/responses` no funciona, el fix es 5 líneas en `lib/ai/llm.ts`.
- **Thresholds TSS:** Solo validables con datos reales del founder. Ajuste manual posible durante Phase 3.
- **Cobertura real del catálogo:** Hipótesis a validar con uso — el research dice "40-80", pero el número correcto emerge del uso.
- **Fuelin feature set actual:** WebSearch no disponible durante research. Recomendado: verificar fuelin.com manualmente antes de definir posicionamiento final para comunicación externa.

---

## Sources

### Primary — HIGH confidence (codebase directo)
- `lib/nutrition/engine.ts` — lógica del fueling engine
- `lib/nutrition/catalog.ts` — catálogo actual (12 items)
- `lib/training/load.ts` — calculador ATL/CTL/ACWR
- `lib/training/plan.ts` — resolver de plan entries
- `lib/ai/llm.ts` — AI integration layer
- `app/api/checkin/route.ts`, `app/api/daily-plan/route.ts`, `app/api/feedback/route.ts`
- `app/api/agents/nutrition-plan/route.ts` — ruta legacy a eliminar
- `prisma/schema.prisma` — modelos de datos
- `.planning/PROJECT.md` — decisiones de producto ya validadas
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`

### Secondary — MEDIUM confidence (domain knowledge + training data)
- Sports nutrition literature: Burke (2011), Jeukendrup (2014), Thomas et al. ISSN Position Stand 2016
- Fuelin product description (pre-Aug 2025, no live verification)
- Garmin Connect nutrition features (pre-Aug 2025)
- TrainingPeaks methodology — TSS, ATL/CTL (bien documentado, alta confianza)

### Tertiary — LOW confidence (sin verificación en vivo)
- Fuelin pricing ($20-30/month) — no confirmado contra fuelin.com actual
- TrainingPeaks NutriTiming — posiblemente discontinuado
- Supersapiens, Lumen — productos de nicho, documentación escasa

---

*Research completed: 2026-03-22*
*Ready for roadmap: yes*
