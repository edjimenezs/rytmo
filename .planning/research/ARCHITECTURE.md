# Architecture Patterns: RytMo Fueling Recommendation Engine

**Domain:** Daily sports-nutrition recommendation for endurance athletes
**Researched:** 2026-03-22
**Confidence:** HIGH (based on direct codebase analysis; no guesswork)

---

## Recommended Architecture

The recommendation engine sits as a deterministic rule layer between the training data
layer and the AI phrasing layer. The division of labor is:

```
Training context  →  Rule engine  →  Food catalog  →  AI phrasing  →  Output
    (facts)           (logic)         (options)         (language)     (plan)
```

This is NOT AI driving food selection. AI is only a language formatter. All
decision logic is deterministic TypeScript. This is the key architectural principle
for RytMo v1.

---

## Component Boundaries

| Component | Responsibility | Location (existing or proposed) |
|-----------|---------------|----------------------------------|
| **CheckinCapture** | Persist daily state: fatigue, sleep, training intent | `app/api/checkin/route.ts` (exists, working) |
| **TrainingContextResolver** | Pull today's training plan entry + matched Strava activity | `lib/training/plan.ts` (exists) |
| **LoadCalculator** | ATL/CTL/ACWR from rolling 60-day activity history | `lib/training/load.ts` (exists) |
| **FuelingEngine** | Map context + load → dayType → food moment selection | `lib/nutrition/engine.ts` (exists, extend) |
| **FoodCatalog** | Static curated list: 40-80 Chilean foods tagged by moment + focus | `lib/nutrition/catalog.ts` (exists, extend) |
| **AIPhraser** | Render structured plan into natural language (Spanish) | `lib/ai/llm.ts` (exists); new wrapper needed |
| **PlanStore** | Persist daily recommendation for retrieval + history | `DailyRecommendation` Prisma model (exists) |
| **FeedbackCollector** | Post-session energy/hunger/digestion capture | `app/api/feedback/route.ts` (exists, working) |

---

## Data Flow: Check-in to Plan

```
[User opens app — morning]
        |
        v
[CheckinForm] ── POST /api/checkin ──> DailyCheckin (upsert)
   - sleepQuality (1-5)
   - fatigue (1-5)
   - trainingType (string)
   - durationMin (int)
   - intensity ("low"|"medium"|"high")
        |
        v
[GET /api/daily-plan?date=today]
        |
        +──> findTrainingPlanEntryForDate(userId, date)
        |         └── TrainingPlanEntry with matchedActivity (from Strava)
        |
        +──> getDailyLoads(userId, 60 days)
        |         └── calcularAtlCtlAcwr() → { atl, ctl, acwr }
        |
        +──> [FuelingEngine.buildNutritionPlan(planEntry, loads, checkin)]
        |         |
        |         +── canonicalDayType(planEntry) → "rest"|"moderate"|"high"
        |         |     (from planEntry.dayType or TSS thresholds)
        |         |
        |         +── deriveFocus(dayType, checkin) → "energy availability"|
        |         |   "performance + recovery"|"maintenance"|"recovery"
        |         |
        |         +── pickFoods(moment, focus) for each moment:
        |         |     preWorkout / intraWorkout / postWorkout / snack / dinner
        |         |     └── filter FoodCatalog by moment + focus tag
        |         |
        |         └── returns: NutritionPlanResponse (structured, no prose)
        |
        +──> [AIPhraser.render(plan, checkin)] (async, non-blocking)
        |         └── prompt: structured plan → Spanish conversational text
        |         └── output: plan.moments[x].text (natural language)
        |         └── fallback: deterministic text if LLM unavailable
        |
        v
[DailyRecommendation.upsert()] → stored to DB
        |
        v
[PlanView] rendered to user
   - summary card (day type, focus label)
   - moment cards: pre / intra / post / snack / dinner
   - food chips per moment (name + portion)
   - AI prose text under each moment (if available)
```

---

## Data Flow: Feedback Loop

```
[User after session — afternoon/evening]
        |
        v
[FeedbackForm] ── POST /api/feedback ──> DailyFeedback (upsert)
   - energy (1-5)
   - hunger (1-5)
   - performance (1-5)
   - digestion (1-5)
   - notes (string)

[No automated adjustment in v1 — feedback is stored for later analysis]
[Manual review by founder to tune catalog tags or dayType thresholds]
```

The feedback loop in v1 is storage-only. Adapting the engine based on feedback
is v2 work. Do not build auto-adjustment logic for MVP.

---

## FuelingEngine Internal Logic

This is where training load → fueling decision happens. The existing implementation
in `lib/nutrition/engine.ts` is already correct structurally. The mapping is:

```
TrainingPlanEntry.dayType (stored at import time in lib/training/plan.ts):
  TSS >= 150           → "high"     → focus: "energy availability"
  TSS 60–149          → "moderate" → focus: "performance + recovery"
  TSS < 60 / no entry → "rest"     → focus: "recovery" or "maintenance"

requiresIntraFuel:
  TSS >= 120 OR durationMinutes >= 90 → true
  Otherwise                           → false

ACWR from LoadCalculator:
  acwr > 1.3  → athlete is overreaching (should influence "recovery" weight)
  acwr < 0.8  → undertrained / deload week
  [v1: ACWR informs context but does not override planEntry.dayType]

DailyCheckin inputs (currently NOT wired into engine — v1 gap):
  fatigue + sleepQuality should modulate dayType:
    fatigue >= 4 AND sleepQuality <= 2 → downgrade dayType one level
    e.g., "high" → "moderate" when athlete is exhausted
```

The checkin-to-engine wire is the biggest architectural gap in the current build.
`buildNutritionPlan` in `lib/nutrition/engine.ts` does not receive checkin data.
This must be added before MVP is valid.

---

## AI Integration: Where It Fits

AI has exactly ONE job in RytMo: turn a structured `NutritionPlanResponse` into
readable Spanish prose. AI does NOT:
- Choose foods
- Decide dayType or focus
- Override catalog selections
- Calculate macros

Current problem: `app/api/agents/nutrition-plan/route.ts` has AI driving macro
calculation (heuristics + LLM = inconsistent output). This is the wrong approach
and should be abandoned. That route is superseded by `app/api/daily-plan/route.ts`
+ `lib/nutrition/engine.ts`.

Correct AI call contract:

```typescript
// Input to AIPhraser
type PhraseInput = {
  dayType: "rest" | "moderate" | "high";
  focus: string;
  moments: Record<NutritionMoment, { foods: FoodOption[] }>;
  checkin: { fatigue: number; sleepQuality: number };
  acwr: number | null;
};

// Output from AIPhraser
type PhraseOutput = {
  summary: string;          // 1 sentence context
  moments: Record<NutritionMoment, string>; // prose per moment
};
```

The LLM receives a JSON blob of the plan and returns only prose strings. It never
returns food selections or JSON structures with nutritional data.

Fallback: if `askLLM` returns null (no API key, timeout, error), the engine's
deterministic text from `describeFoods()` is used directly. The plan is always
displayable without AI.

---

## Persistent State: DB vs Computed On-Demand

| Data | Storage | Rationale |
|------|---------|-----------|
| `DailyCheckin` | DB (persisted) | User input — never recomputable |
| `TrainingActivity` | DB (synced from Strava) | Source of truth for load calc |
| `TrainingPlanEntry` | DB (uploaded via CSV) | Plan intent for the day |
| `DailyRecommendation` | DB (upserted on GET) | Cache + history for display |
| `DailyFeedback` | DB (persisted) | User input — never recomputable |
| ATL/CTL/ACWR | Computed on-demand | 60-day rolling calc; cheap enough |
| Food catalog | In-memory (TypeScript array) | Static; no DB needed for v1 |
| AI prose text | DB (stored in `DailyRecommendation.moments`) | Avoid re-calling LLM on reload |

`DailyRecommendation` acts as both the generated plan AND the cache. The GET
handler always recomputes and upserts — this is idempotent and correct.

The `FoodItem` Prisma model currently exists but is unused and diverges from
the TypeScript `FoodOption` type in `catalog.ts`. Do NOT attempt to migrate
catalog to DB in v1. Keep it as a typed static array.

---

## Integration Points with Existing System

### Strava Integration
- Point of contact: `lib/strava/client.ts` → `TrainingActivity` table
- How engine uses it: `getDailyLoads()` reads `TrainingActivity` for TSS estimation;
  `findTrainingPlanEntryForDate()` reads `matchedActivity` joined from Strava
- What must already work: Strava OAuth + sync (`/api/strava/sync`)
- Gap: If Strava is not connected, engine falls back to manual plan entries only.
  This is acceptable for v1 (founder use case).

### OpenAI Integration
- Point of contact: `lib/ai/llm.ts` → `askLLM()`
- How engine uses it: Optional prose rendering, non-blocking
- Current model: `gpt-4o-mini` (correct choice — cheap, fast, sufficient for prose)
- Fallback: deterministic text always available
- What to avoid: Do NOT use LLM for food selection or macro calculations

### NextAuth / Session
- Point of contact: `lib/auth/utils.ts` → `requireAuth()`
- All API routes already use this — no changes needed
- Single-user MVP: always founder's userId, no multi-tenant logic needed

---

## Suggested Build Order

The recommendation engine has these dependency levels:

```
Level 0 (foundation — already exists, verify working):
  - requireAuth() pattern in all relevant routes
  - Strava sync → TrainingActivity populated
  - TrainingPlanEntry upload (CSV) → entries stored with dayType/focus/requiresIntraFuel

Level 1 (engine core — must build first):
  1. Extend FoodCatalog to 40-80 items covering all moments and focus tags
     File: lib/nutrition/catalog.ts
     Prerequisite: nothing
     Risk: catalog coverage gaps cause empty recommendations

  2. Wire DailyCheckin into FuelingEngine
     Add checkin param to buildNutritionPlan()
     Logic: fatigue/sleepQuality modulate dayType before food selection
     File: lib/nutrition/engine.ts
     Prerequisite: catalog expansion

Level 2 (API surface — connects pieces):
  3. Clean up /api/daily-plan GET to pass checkin to engine
     Fetch today's checkin inside the handler
     File: app/api/daily-plan/route.ts
     Prerequisite: Level 1 complete

Level 3 (AI layer — progressive enhancement):
  4. Create AIPhraser wrapper around askLLM
     Input: structured NutritionPlanResponse + checkin context
     Output: prose per moment in Spanish
     File: lib/nutrition/phraser.ts (new)
     Prerequisite: Level 2; AI is additive, not blocking

Level 4 (UI):
  5. Build PlanView component
     Shows summary, moment cards, food chips, AI prose
     File: components/dashboard/PlanView.tsx
     Prerequisite: Level 2 (Level 3 optional)

Level 5 (feedback close):
  6. Verify FeedbackForm submits to /api/feedback
     Confirm DailyFeedback storage
     No engine changes needed
     Prerequisite: Level 4
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: AI Driving Food Selection
**What goes wrong:** LLM returns different foods on every call; no consistency;
no catalog adherence; Chilean food context lost.
**Current example:** `app/api/agents/nutrition-plan/route.ts` (macro calculation via LLM).
**Instead:** Rule engine selects foods from catalog. AI only writes the sentence.

### Anti-Pattern 2: Re-computing ATL/CTL Per Request Without Caching
**What goes wrong:** 60-day load calculation is already fast (pure math, no extra
queries beyond the initial activities fetch). Do NOT add a separate ATL/CTL DB cache.
Keep it computed on-demand from `TrainingActivity`.
**Exception:** If activity count grows > 500, revisit.

### Anti-Pattern 3: Migrating Food Catalog to Database
**What goes wrong:** Adds schema migration, seeding pipeline, and admin CRUD surface
for a 40-80 item list that changes via code deploys anyway.
**Instead:** TypeScript array in `lib/nutrition/catalog.ts`. Version-controlled.
Fast to edit. Zero query overhead.

### Anti-Pattern 4: Two Nutrition APIs in Parallel
**What goes wrong:** `app/api/agents/nutrition-plan` and `app/api/daily-plan` both
exist and diverge. UI using wrong endpoint gets stale/incorrect data.
**Instead:** Delete or stub-out `agents/nutrition-plan` as a deprecated route once
`daily-plan` covers its use case. Single source of truth.

### Anti-Pattern 5: Blocking Plan on LLM Response
**What goes wrong:** LLM call adds 1-3 seconds. User sees spinner instead of plan.
**Instead:** Return structured plan immediately. AI prose is either pre-fetched
async or streamed as a secondary render. Deterministic text is the default.

---

## Scalability Notes (for founder-only v1 context)

Not a concern. Single user. Simple keep-it-working principles:

- One DB query for activities (60 days, indexed on `userId + startDate`)
- One DB query for today's plan entry
- One DB query for today's checkin
- One optional LLM call (async, fallback exists)
- One upsert to `DailyRecommendation`

Total: ~4 DB operations + 1 optional external call per page load. Trivially fast.

---

## Sources

- Direct codebase analysis: `lib/nutrition/engine.ts`, `lib/nutrition/catalog.ts`,
  `lib/training/load.ts`, `lib/training/plan.ts`, `lib/ai/llm.ts`
- API surface: `app/api/checkin/route.ts`, `app/api/daily-plan/route.ts`,
  `app/api/feedback/route.ts`, `app/api/agents/nutrition-plan/route.ts`
- Schema: `prisma/schema.prisma`
- Project context: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`
- Confidence: HIGH for all claims — derived from actual code, not training data
