# Roadmap: RytMo MVP Refactorizacion

## Overview

El codebase ya tiene las piezas correctas (motor, check-in, feedback, Strava, auth) pero estan desconectadas o contaminadas por codigo incorrecto. El MVP no construye desde cero: limpia, conecta y valida. Phase 1 cierra el core loop (check-in alimenta al motor, catalogo tiene cobertura real, solo un motor activo). Phase 2 hace la app usable para el founder (AI phrasing, UI legible, feedback end-to-end). Phase 3 es uso personal real — datos vivos reemplazan suposiciones sobre thresholds y catalogo.

## Phases

- [x] **Phase 1: Core Loop** - Eliminar motor legacy, conectar check-in al engine, expandir catalogo, seed profile
- [ ] **Phase 2: App Usable** - AI phrasing, PlanView UI, feedback end-to-end, validacion de inputs
- [x] **Phase 3: Validacion Personal** - 5-7 dias de uso real, calibrar thresholds, decidir v2 (completed 2026-03-24)

## Phase Details

### Phase 1: Core Loop
**Goal**: El motor recibe datos reales del check-in y produce un plan confiable sin ambiguedad sobre que sistema lo genero
**Depends on**: Nothing (first phase)
**Requirements**: ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, FOOD-01, FOOD-02, FOOD-03, CHECKIN-01, CHECKIN-02, DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Founder completa check-in en menos de 60 segundos en el telefono (5 campos, presets tap-not-type)
  2. Motor produce recomendaciones distintas para un dia de alta carga vs dia de descanso (dayType diferente → alimentos distintos)
  3. Catalogo cubre todas las combinaciones moment x focus sin fallbacks silenciosos (>=4 opciones por celda)
  4. Solo un endpoint de nutricion activo — `/api/agents/nutrition-plan` eliminado, no existe en codebase
  5. Profile del founder tiene peso, FTP y timezone correctos antes de primera ejecucion
**Plans:** 1 plan

Plans:
- [x] 01-PLAN.md — Core loop completo: form 5 campos, catalogo 45 items, wire engine, eliminar legacy, seed profile

### Phase 2: App Usable
**Goal**: El founder puede hacer check-in, ver el plan en lenguaje natural en espanol y dejar feedback — sin ver JSON ni macros en ningun momento
**Depends on**: Phase 1
**Requirements**: REC-01, REC-02, REC-03, FEEDBACK-01, FEEDBACK-02, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Plan diario se lee en menos de 20 segundos — muestra alimentos concretos por momento (pre/intra/post/cena), no gramos de macros
  2. AI phrasing produce texto conversacional en espanol informal ("hoy tu cuerpo necesita...") — si AI falla, cae a texto determinista legible, no a JSON crudo
  3. Founder completa 3 check-ins consecutivos sin errores de UI ni estados silenciosos
  4. Formulario de feedback accesible desde el plan del dia y datos persisten vinculados a la recomendacion
  5. App funciona en navegador movil sin layout roto
**Plans:** 1/3 plans executed

Plans:
- [ ] 02-01-PLAN.md — Prisma migration (AI cache, feedback FK, training time) + AI phrasing library + daily-plan API update
- [ ] 02-02-PLAN.md — DailyPlanView con acordeones, HomeCard, BottomNav, layout mobile-first
- [ ] 02-03-PLAN.md — FeedbackForm tap-buttons + recommendationId, CheckinForm timeOfDay, error states

### Phase 3: Validacion Personal
**Goal**: Datos de uso real (5-7 dias) confirman que el motor calibra bien para el perfil del founder y revelan gaps del catalogo que no eran visibles en codigo
**Depends on**: Phase 2
**Requirements**: (no new requirements — validates all of Phase 1 + 2 in real conditions)
**Success Criteria** (what must be TRUE):
  1. Founder usa la app 5 dias consecutivos sin necesidad de intervencion tecnica
  2. Al menos 3 dias con feedback de energia >= 3/5 (plan esta siendo util)
  3. Thresholds TSS revisados contra datos reales de Strava — ajustados si necesario y documentados en PROJECT.md
  4. Founder toma decision informada sobre que construir en v2 (backlog priorizado)
**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — Trends API + FeedbackTrendsChart + wire into DailyPlanView (mini grafico energia/performance)
- [ ] 03-02-PLAN.md — Script CLI de calibracion thresholds + closure doc template

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Loop | 1/1 | COMPLETE | 2026-03-23 |
| 2. App Usable | 1/3 | In Progress|  |
| 3. Validacion Personal | 2/2 | Complete   | 2026-03-24 |
