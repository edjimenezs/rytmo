# Phase 1: Core Loop — Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** PROJECT.md + REQUIREMENTS.md + ROADMAP.md

---

<domain>

## Phase Boundary

**Goal:** El motor recibe datos reales del check-in y produce un plan confiable sin ambiguedad sobre que sistema lo genero

**What this phase delivers:**
- Check-in form que captures training + state en <60 segundos, mobile-friendly
- Nutrition engine que recibe check-in y produce recomendaciones basadas en dayType (rest/low/moderate/high)
- Expanded food catalog (~40-80 items) con coverage completa de moment × focus combinations
- Single nutrition engine active (legacy `/api/agents/nutrition-plan` removed)
- Founder profile seeded con valores reales antes de first execution

**In scope:**
- Refactoring existing check-in form → simplified (5 core fields, presets)
- Connecting check-in data flow to `buildNutritionPlan()`
- Expanding catalog.ts from 12 → ~40 items (Chilean foods)
- Removing legacy `/api/agents/nutrition-plan` endpoint
- Seeding profile data (weight, FTP, timezone)

**Out of scope:**
- AI phrasing (Phase 2)
- UI rendering of plans (Phase 2)
- Feedback form (Phase 2)
- Mobile app — web responsive sufficient
- Testing framework setup (minimal, inline tests only)

</domain>

---

<decisions>

## Implementation Decisions

**Locked by PROJECT.md + REQUIREMENTS.md:**

### Architecture
- Single engine pattern: `buildNutritionPlan()` in `lib/nutrition/engine.ts` is the source of truth
- Check-in → engine → DB storage (no in-memory plans)
- Catalog is TypeScript array, not DB-backed (simpler, type-safe for MVP)
- Legacy `/api/agents/nutrition-plan` must be completely removed

### Data Flow
- `DailyCheckin` model captures: training type, duration, intensity, time of day, sleep hours, fatigue (1-5)
- Check-in data flows through to `buildNutritionPlan()` — fatigue/sleep modulates dayType
- `buildNutritionPlan()` returns structured data (moment → foods array), not prose
- AI phrasing happens in Phase 2

### Food Catalog
- ~40-80 items covering: carb_fast, carb_main, protein, dairy, fruit, drink, intra_fuel, snack
- Every (moment, focus) combination has >=4 options (no empty fallbacks)
- Chilean-first foods (marraqueta, charquicán, arroz, pollo, etc.)
- Each food: macros, portion, moment tags, focus tags

### Simplification (vs current streho)
- Simplify check-in from 11 fields to 5 core fields (training type, duration, intensity, sleep, fatigue)
- Remove `trainingType` free text → enum (consistency)
- Remove unused DB fields in `DailyRecommendation` (keep: preWorkout, intraWorkout, postWorkout, dinner + summary)
- Remove `NutritionPanel` temporary features (like the agent UI panel)

### Tech Constraints
- Next.js API routes (existing)
- Prisma schema updates minimal (new fields only if needed)
- No new dependencies
- All code TypeScript, existing patterns

### Success Metrics (Phase 1 only)
1. Check-in completes <60s on mobile (no lag)
2. High load day → different foods than rest day (logic working)
3. Catalog has >=4 options per moment × focus (no fallbacks)
4. Legacy engine deleted from codebase
5. Profile seeded correctly before first use

### Claude's Discretion

**Task decomposition:** How to split Phase 1 into implementable tasks:
1. **Task A:** Simplify + fix check-in form (5 fields, presets, mobile UX)
2. **Task B:** Wire check-in data through to `buildNutritionPlan()` (currently disconnected)
3. **Task C:** Expand food catalog (write 30-40 new items, validate coverage)
4. **Task D:** Remove legacy nutrition engine endpoint (`/api/agents/nutrition-plan`)
5. **Task E:** Seed founder profile with real data (weight, FTP, timezone, location)
6. **Task F:** Verify end-to-end flow (check-in → engine → plan stored)

**Wave structure:** A, B, D can run in parallel (independent files). C sequential after A starts. E, F are final validation.

**Testing approach:** Inline assertions in functions, no test framework. Verify via manual check-in + inspect DB.

</decisions>

---

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, tech stack locked
- `.planning/ROADMAP.md` — Phase goals, success criteria
- `.planning/REQUIREMENTS.md` — v1 requirements (12 requirements map to Phase 1)

### Research Findings
- `.planning/research/SUMMARY.md` — Key findings, MVP strategy, critical path
- `.planning/research/PITFALLS.md` — What to avoid, phase assignments
- `.planning/codebase/ARCHITECTURE.md` — Current system design, data flows
- `.planning/codebase/CONCERNS.md` — Tech debt, bugs, fragile areas

### Existing Code References
- `lib/nutrition/engine.ts` — Core recommendation logic (needs wire-in from check-in)
- `lib/nutrition/catalog.ts` — Food items (needs expansion 12 → 40)
- `components/nutrition/CheckinForm.tsx` — Current form (needs simplification)
- `app/api/daily-plan/route.ts` — Correct engine endpoint (use this)
- `app/api/agents/nutrition-plan/route.ts` — Legacy endpoint (DELETE)
- `prisma/schema.prisma` — Data models (DailyCheckin, DailyRecommendation, DailyFeedback)
- `lib/strava/client.ts` — Strava integration (verify TSS thresholds)

</canonical_refs>

---

<specifics>

## Specific Implementation Details

### Check-in Form Simplification
**5 core fields (target <60s mobile):**
1. Training type (enum: bike, run, swim, tri, rest) — tap/dropdown
2. Duration (minutes) — slider or number
3. Intensity (Low/Moderate/High) — buttons
4. Sleep quality (hours) — slider 4-12
5. Fatigue (1-5 scale) — buttons

**Remove:** notes field, hunger scale, stress scale, time of day (infer from now)

### Food Catalog Structure
Each food item:
```typescript
{
  name: string
  category: 'carb_fast' | 'carb_main' | 'protein' | 'dairy' | 'fruit' | 'drink' | 'intra_fuel' | 'snack'
  carbs: number
  protein: number
  fat: number
  kcal: number
  portion: string
  moment: ('pre' | 'intra' | 'post' | 'snack' | 'dinner')[]
  focus: ('energy availability' | 'performance + recovery' | 'maintenance' | 'recovery')[]
}
```

**Catalog distribution (~40-50 items):**
- Pre-workout: 6-8 items (light, quick carbs + protein)
- Intra-workout: 4-6 items (gels, drinks, bars)
- Post-workout: 6-8 items (carbs + protein, recovery focus)
- Snack: 6-8 items (energy, digestion-friendly)
- Dinner: 6-8 items (complete meals, recovery focus)
- Breakfast: 4-6 items (filling, morning-friendly)

**Coverage rule:** Every (moment, focus) pair must have >=4 options.

### Profile Seeding
Before first execution, founder profile must have:
```
{
  weight: 66 (kg)
  ftp: 280 (watts)
  timezone: 'America/Santiago'
  location: 'Santiago, Chile'
  sport: 'Triathlon'
}
```

### Engine Integration Point
`buildNutritionPlan()` call signature should be:
```typescript
buildNutritionPlan({
  checkin: DailyCheckin,           // NEW: pass actual check-in
  loads: { atl, ctl, acwr },       // existing
  profile: UserProfile             // NEW: pass profile
})
```

Returns:
```typescript
{
  dayType: 'rest' | 'low_load' | 'moderate_load' | 'high_load',
  focus: string,
  preWorkout: FoodOption[],
  intraWorkout: FoodOption[],
  postWorkout: FoodOption[],
  dinner: FoodOption[],
  reasoning: string  // for Phase 2 AI phrasing
}
```

### Legacy Endpoint Removal
Delete entirely:
- `app/api/agents/nutrition-plan/route.ts`
- Any imports of `/agents/nutrition-plan` in frontend
- Any references in documentation

Verify no other code path calls it (grep entire codebase).

</specifics>

---

<deferred>

## Deferred (Phase 2+)

- AI phrasing layer
- Plan UI rendering
- Feedback form
- Trend analysis
- Historical planning
- Plan regeneration
- Multi-user support

</deferred>

---

*Phase: 1 — Core Loop*
*Context gathered: 2026-03-22 from PROJECT.md + REQUIREMENTS.md*
