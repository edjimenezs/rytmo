---
phase: 01-core-loop
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/nutrition/CheckinForm.tsx
  - lib/nutrition/catalog.ts
  - app/api/agents/nutrition-plan/route.ts
  - components/dashboard/NutritionAgentPanel.tsx
  - app/dashboard/nutrition-plan/page.tsx
  - prisma/schema.prisma
  - prisma/seed.ts
  - lib/nutrition/engine.ts
  - app/api/daily-plan/route.ts
  - lib/action-plan/plan.ts
autonomous: false
requirements:
  - ENGINE-01
  - ENGINE-02
  - ENGINE-03
  - ENGINE-04
  - FOOD-01
  - FOOD-02
  - FOOD-03
  - CHECKIN-01
  - CHECKIN-02
  - DATA-01
  - DATA-02
  - DATA-03
must_haves:
  truths:
    - "Check-in form has exactly 5 fields: trainingType (enum), durationMin, intensity, sleepHours, fatigue"
    - "buildNutritionPlan() receives checkin data and produces different dayType for high fatigue vs low fatigue"
    - "Food catalog has >=4 options for every (moment x focus) combination — no silent fallbacks"
    - "/api/agents/nutrition-plan endpoint does not exist in codebase"
    - "NutritionAgentPanel component does not exist in codebase"
    - "Profile for founder has weight=66, ftp=280, timezone=America/Santiago"
    - "GET /api/daily-plan reads DailyCheckin from DB before calling engine"
    - "buildActionPlan passes checkin to buildNutritionPlan"
  artifacts:
    - path: "components/nutrition/CheckinForm.tsx"
      provides: "Simplified 5-field check-in form"
    - path: "lib/nutrition/catalog.ts"
      provides: "45+ food items with full moment x focus coverage"
    - path: "lib/nutrition/engine.ts"
      provides: "Engine with checkin parameter and resolveCheckinModifiers"
    - path: "app/api/daily-plan/route.ts"
      provides: "Daily plan endpoint that reads checkin before calling engine"
    - path: "lib/action-plan/plan.ts"
      provides: "Action plan that passes checkin to engine"
    - path: "prisma/schema.prisma"
      provides: "Profile model with ftp and timezone fields"
    - path: "prisma/seed.ts"
      provides: "Seed script that creates founder profile with real values"
  key_links:
    - from: "app/api/daily-plan/route.ts"
      to: "lib/nutrition/engine.ts"
      via: "buildNutritionPlan({ checkin })"
      pattern: "buildNutritionPlan.*checkin"
    - from: "lib/action-plan/plan.ts"
      to: "lib/nutrition/engine.ts"
      via: "buildNutritionPlan({ checkin })"
      pattern: "buildNutritionPlan.*checkin"
    - from: "lib/nutrition/engine.ts"
      to: "lib/nutrition/catalog.ts"
      via: "pickFoods filters by moment + focus"
      pattern: "foodCatalog\\.filter"
---

<objective>
Complete the core loop: check-in feeds the engine, engine uses expanded catalog, legacy endpoint removed, founder profile seeded.

Purpose: This is the entire Phase 1. After execution, the founder can do a check-in that flows through to the nutrition engine and produces real food recommendations that vary by day type and fatigue state.

Output: Working check-in → engine → recommendation pipeline with 45+ food items, no legacy code, founder profile ready.
</objective>

<execution_context>
@.planning/phases/01-core-loop/01-CONTEXT.md
@.planning/phases/01-core-loop/RESEARCH.md
@.planning/phases/01-core-loop/RESEARCH-CATALOG.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

Key existing interfaces the executor needs:

From lib/nutrition/engine.ts:
```typescript
export function buildNutritionPlan(params: {
  planEntry?: NutritionPlanEntry;
  loads: { atl: number | null; ctl: number | null; acwr: number | null };
}): NutritionPlanResponse
```

From lib/nutrition/catalog.ts:
```typescript
export type FoodMoment = 'preWorkout' | 'intraWorkout' | 'postWorkout' | 'snack' | 'dinner';
export type FoodOption = {
  name: string; description: string; moment: FoodMoment; focus: string[];
  carbs: number; protein: number; fat: number; kcal: number; portion: string;
};
export const foodCatalog: FoodOption[];
```

From lib/action-plan/plan.ts:
```typescript
// Line 73: checkin is already fetched via Promise.all
// Line 81-84: buildNutritionPlan called WITHOUT checkin
```

From app/api/daily-plan/route.ts:
```typescript
// Line 41-44: buildNutritionPlan called WITHOUT checkin
// No prisma.dailyCheckin.findUnique before engine call
```

From prisma/schema.prisma:
```prisma
model Profile {
  // Has: weight, height, sportType, experienceLevel, goals
  // MISSING: ftp, timezone, location
}
model DailyCheckin {
  // Has: sleepHours, fatigue, trainingType, durationMin, intensity
  // Also has (to be removed from form only): sleepQuality, hunger, stress, timeOfDay, notes
}
```
</context>

<tasks>

<!-- ============================================================ -->
<!-- WAVE 1: Independent tasks — can execute in parallel           -->
<!-- ============================================================ -->

<task type="auto">
  <name>Task 1: Simplify check-in form to 5 fields (CHECKIN-01, CHECKIN-02)</name>
  <files>components/nutrition/CheckinForm.tsx</files>
  <read_first>
    - components/nutrition/CheckinForm.tsx (full file — 257 lines)
    - app/api/checkin/route.ts (POST handler — understand accepted payload)
  </read_first>
  <action>
Rewrite `CheckinForm.tsx` to show exactly 5 fields, mobile-first, completable in <60 seconds:

1. **trainingType** — Buttons (not dropdown, not free text) for: Bici, Correr, Nadar, Tri, Descanso. Map to values: `bike`, `run`, `swim`, `tri`, `rest`. When `rest` selected, hide durationMin and intensity fields.

2. **durationMin** — Slider with preset taps: 30, 60, 90, 120+ (custom). Range 0-240. Show current value as label.

3. **intensity** — Three tap-buttons: Baja, Moderada, Alta. Map to `Low`, `Moderate`, `High`. Visually highlight selected.

4. **sleepHours** — Slider 4-12 with 0.5 step. Show hours as label (e.g. "7.5 h").

5. **fatigue** — Five tap-buttons: 1 2 3 4 5. Visually highlight selected. Label "Fatiga (1=fresh, 5=destruido)".

**Remove entirely from the form UI:** sleepQuality, hunger, stress, timeOfDay, notes fields. Do NOT remove these from the POST payload type in the API — the DB columns stay nullable, the form just stops sending them.

**Keep:** date field (auto-set to today, hidden unless user needs to change). The existing GET to load previous check-in data. The POST submission logic (same endpoint, same basic flow).

**Submit payload:** Only send the 5 fields + date. The API already handles nullable fields — omitted fields become null in DB.

**Mobile UX:**
- Use large tap targets (min 44px height per button)
- Single column layout on mobile
- No scrolling needed to see all 5 fields
- Submit button at bottom, full-width on mobile
- Use `rounded-2xl` cards for each field group (match existing design system)

**Do NOT:** Add new dependencies. Do NOT change the API endpoint. Do NOT modify the Prisma schema.
  </action>
  <acceptance_criteria>
    - grep -c "sleepQuality\|hunger\|stress\|timeOfDay\|notes" components/nutrition/CheckinForm.tsx returns 0 (removed from form render)
    - grep "bike.*run.*swim.*tri.*rest" components/nutrition/CheckinForm.tsx matches (training type enum present)
    - grep "Low.*Moderate.*High" components/nutrition/CheckinForm.tsx matches (intensity buttons present)
    - The form has exactly 5 interactive input groups (trainingType, durationMin, intensity, sleepHours, fatigue)
    - npx tsc --noEmit passes without errors on this file
  </acceptance_criteria>
  <done>Check-in form renders 5 fields with tap-friendly buttons, no text inputs except duration slider. Mobile-first layout. Compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Expand food catalog to 45 items with full coverage (FOOD-01, FOOD-02, FOOD-03)</name>
  <files>lib/nutrition/catalog.ts</files>
  <read_first>
    - lib/nutrition/catalog.ts (full file — current 12 items)
    - .planning/phases/01-core-loop/RESEARCH-CATALOG.md (expansion strategy, gap analysis, macro sources)
  </read_first>
  <action>
Expand `catalog.ts` from 12 to 45 items. Keep the existing `FoodOption` type and `buildFood` helper unchanged. Keep ALL existing 12 items unchanged.

**Coverage target:** Every (moment, focus) pair must have >=4 items. The 5 moments are: preWorkout, intraWorkout, postWorkout, snack, dinner. The 4 focus types are: `energy availability`, `performance + recovery`, `maintenance`, `recovery`.

**Distribution of 33 new items:**
- preWorkout: +7 items (fill recovery, boost performance+recovery and maintenance to >=4)
- intraWorkout: +6 items (fill performance+recovery, maintenance, recovery — intra items are lighter/simpler)
- postWorkout: +7 items (fill energy availability, boost all other focus types to >=4)
- snack: +7 items (fill energy availability, performance+recovery, boost maintenance/recovery to >=4)
- dinner: +6 items (fill energy availability, performance+recovery, maintenance, boost recovery to >=4)

**Food selection criteria — Chilean-first:**
Use real Chilean foods and preparations. Examples by category:
- **Carbs fast:** marraqueta, pan amasado, arroz blanco, fideos, papa cocida, mote, sopaipilla
- **Protein:** pollo, pavo, carne, huevo, atun, tofu, legumbres (porotos, lentejas, garbanzos)
- **Dairy:** yogurt, leche, quesillo, queso fresco
- **Fruit:** platano, manzana, naranja, lucuma, chirimoya, berries chilenos
- **Intra fuel:** geles, maltodextrina, platano, datiles, bebida isotonica, pan con miel
- **Complete meals (dinner/post):** cazuela, charquican, pastel de choclo, porotos granados, carbonada, estofado de lentejas

**Macro accuracy:**
- Use realistic macros per portion (reference INTA Chile tables and USDA for base ingredients)
- Each item must have: name (Spanish), description (1 line), moment, focus (array of 1-2 tags), carbs, protein, fat, kcal, portion
- Use the `buildFood()` helper for each item

**Focus tag assignment criteria:**
- `energy availability`: carbs >35g, easy digestion, fast energy
- `performance + recovery`: CHO:PRO ratio 3:1 to 4:1, protein >20g, moderate-high carbs
- `maintenance`: balanced macros without extremes (carbs 20-40g, protein 10-20g)
- `recovery`: protein >20g, anti-inflammatory, moderate carbs

**Multi-tag strategy:** Items that qualify for 2 focus types should have both tags (e.g., cazuela = `['recovery', 'maintenance']`). This maximizes coverage efficiently.

**After adding all items, add an inline validation block at the end of the file:**
```typescript
// Coverage validation (development only)
if (process.env.NODE_ENV === 'development') {
  const moments: FoodMoment[] = ['preWorkout', 'intraWorkout', 'postWorkout', 'snack', 'dinner'];
  const focuses = ['energy availability', 'performance + recovery', 'maintenance', 'recovery'];
  for (const m of moments) {
    for (const f of focuses) {
      const count = foodCatalog.filter(item => item.moment === m && item.focus.includes(f)).length;
      if (count < 4) {
        console.warn(`[catalog] COVERAGE GAP: ${m} × ${f} has ${count} items (need >=4)`);
      }
    }
  }
}
```

**Do NOT:** Change the FoodOption type. Change existing 12 items. Add a `category` field (CONTEXT.md mentions it but the type doesn't have it — keep current type). Change moment from singular string to array.
  </action>
  <acceptance_criteria>
    - node -e "const c = require('./lib/nutrition/catalog'); console.log(c.foodCatalog.length)" prints >=45
    - Coverage validation script reports 0 gaps when run in development mode
    - npx tsc --noEmit passes without errors
    - All 12 original items still present (grep for "Marraqueta" and "Charquicán" and "Cazuela de vacuno")
    - Every new item has all required fields (name, description, moment, focus, carbs, protein, fat, kcal, portion)
  </acceptance_criteria>
  <done>Catalog has 45+ items. Every (moment x focus) pair has >=4 options. No silent fallbacks possible in pickFoods. All Chilean foods with realistic macros.</done>
</task>

<task type="auto">
  <name>Task 3: Remove legacy nutrition endpoint atomically (DATA-03)</name>
  <files>
    app/api/agents/nutrition-plan/route.ts
    components/dashboard/NutritionAgentPanel.tsx
    app/dashboard/nutrition-plan/page.tsx
  </files>
  <read_first>
    - app/dashboard/nutrition-plan/page.tsx (line 7: import, line 34: usage)
    - components/dashboard/NutritionAgentPanel.tsx (full file — to confirm it's only used here)
    - app/api/agents/nutrition-plan/route.ts (full file — to confirm it's the legacy LLM endpoint)
  </read_first>
  <action>
**All three changes in a single commit. This is atomic — do NOT delete the endpoint without also updating the page.**

1. **Delete** `app/api/agents/nutrition-plan/route.ts` entirely (the whole file)
2. **Delete** `components/dashboard/NutritionAgentPanel.tsx` entirely (the whole file)
3. **Edit** `app/dashboard/nutrition-plan/page.tsx`:
   - Remove line 7: `import NutritionAgentPanel from "@/components/dashboard/NutritionAgentPanel";`
   - Remove line 34: `<NutritionAgentPanel />`
   - Keep everything else in the page intact (NutritionPanel, TrainingPlanPanel, the tip section, etc.)

**Before deleting, verify no other file imports NutritionAgentPanel:**
```bash
grep -r "NutritionAgentPanel" --include="*.tsx" --include="*.ts" app/ components/ lib/
```
Expected: only `app/dashboard/nutrition-plan/page.tsx` and the component itself.

**Before deleting, verify no other file calls `/api/agents/nutrition-plan`:**
```bash
grep -r "agents/nutrition-plan" --include="*.tsx" --include="*.ts" app/ components/ lib/
```
Expected: only `components/dashboard/NutritionAgentPanel.tsx` and the route itself.

**Do NOT:** Delete `/api/agents/training-plan` (that's a different endpoint). Remove NutritionPanel (that's the correct panel that stays). Touch any other files.
  </action>
  <acceptance_criteria>
    - test ! -f app/api/agents/nutrition-plan/route.ts (file does not exist)
    - test ! -f components/dashboard/NutritionAgentPanel.tsx (file does not exist)
    - grep -c "NutritionAgentPanel" app/dashboard/nutrition-plan/page.tsx returns 0
    - grep -c "agents/nutrition-plan" app/dashboard/nutrition-plan/page.tsx returns 0
    - npx tsc --noEmit passes without errors (no broken imports)
    - app/dashboard/nutrition-plan/page.tsx still imports and renders NutritionPanel (the correct one)
  </acceptance_criteria>
  <done>Legacy LLM-based nutrition endpoint completely removed. No file references it. The nutrition-plan page renders without error using only the rule-based NutritionPanel.</done>
</task>

<task type="auto">
  <name>Task 4: Add ftp/timezone to Profile schema and seed founder data (DATA-02)</name>
  <files>
    prisma/schema.prisma
    prisma/seed.ts
  </files>
  <read_first>
    - prisma/schema.prisma (lines 68-89 — Profile model)
    - prisma/seed.ts (current seed script)
  </read_first>
  <action>
**Part A — Schema migration:**

Add 3 new fields to the `Profile` model in `prisma/schema.prisma`:
```prisma
model Profile {
  // ... existing fields ...
  ftp         Int?       // Functional Threshold Power (watts)
  timezone    String?    // IANA timezone (e.g., "America/Santiago")
  location    String?    // Free-text location
  // ... rest of model ...
}
```

Run migration:
```bash
npx prisma migrate dev --name add_profile_ftp_timezone
```

**Part B — Seed founder profile:**

Rewrite `prisma/seed.ts` to upsert the founder's profile. The seed should:

1. Find the first user in the DB (the founder — this is a single-user MVP)
2. Upsert Profile with these values:
   - `weight`: 66
   - `ftp`: 280
   - `timezone`: "America/Santiago"
   - `location`: "Santiago, Chile"
   - `sportType`: "Triathlon"
   - `experienceLevel`: "Advanced"

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding founder profile...");

  const founder = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!founder) {
    console.log("No user found. Create an account first, then re-run seed.");
    return;
  }

  const profile = await prisma.profile.upsert({
    where: { userId: founder.id },
    update: {
      weight: 66,
      ftp: 280,
      timezone: "America/Santiago",
      location: "Santiago, Chile",
      sportType: "Triathlon",
      experienceLevel: "Advanced",
    },
    create: {
      userId: founder.id,
      weight: 66,
      ftp: 280,
      timezone: "America/Santiago",
      location: "Santiago, Chile",
      sportType: "Triathlon",
      experienceLevel: "Advanced",
    },
  });

  console.log(`Profile seeded for ${founder.email}: weight=${profile.weight}kg, ftp=${profile.ftp}W, tz=${profile.timezone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Do NOT:** Remove any existing Profile fields. Change the User model. Add required (non-nullable) fields (all new fields are optional to avoid migration issues).
  </action>
  <acceptance_criteria>
    - grep "ftp" prisma/schema.prisma finds the field in Profile model
    - grep "timezone" prisma/schema.prisma finds the field in Profile model
    - A new migration directory exists under prisma/migrations/ with "add_profile_ftp_timezone" in the name
    - npx prisma validate passes
    - npx prisma db seed runs without error (or provides clear "no user" message)
  </acceptance_criteria>
  <done>Profile model has ftp, timezone, location fields. Migration applied. Seed script ready to populate founder's profile with weight=66, ftp=280, timezone=America/Santiago.</done>
</task>

<!-- ============================================================ -->
<!-- WAVE 2: Depends on Wave 1 (needs expanded catalog + engine)  -->
<!-- ============================================================ -->

<task type="auto">
  <name>Task 5: Wire check-in data into buildNutritionPlan and both callers (ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, DATA-01)</name>
  <files>
    lib/nutrition/engine.ts
    app/api/daily-plan/route.ts
    lib/action-plan/plan.ts
  </files>
  <read_first>
    - lib/nutrition/engine.ts (full file — current buildNutritionPlan signature and logic)
    - app/api/daily-plan/route.ts (lines 31-44 — GET handler, where checkin should be fetched)
    - lib/action-plan/plan.ts (lines 69-84 — buildActionPlan, checkin already in scope but not passed)
    - .planning/phases/01-core-loop/RESEARCH.md (API contract changes section — exact code to add)
  </read_first>
  <action>
**Step 1 — Extend `buildNutritionPlan()` in `lib/nutrition/engine.ts`:**

Add a `CheckinInput` type and `resolveCheckinModifiers` function. Add `checkin?: CheckinInput` to the params object.

```typescript
type CheckinInput = {
  fatigue?: number | null;
  sleepHours?: number | null;
  intensity?: string | null;
  trainingType?: string | null;
  durationMin?: number | null;
};

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

  // High fatigue: downgrade perceived intensity
  if (checkin.fatigue != null && checkin.fatigue >= 4) {
    if (dayType === 'high') dayType = 'moderate';
    requiresIntraFuel = false;
  }

  // Poor sleep: force recovery focus on dinner
  const recoveryFocus = checkin.sleepHours != null && checkin.sleepHours < 6;

  return { dayType, requiresIntraFuel, recoveryFocus };
}
```

Update `buildNutritionPlan` params type to include `checkin?: CheckinInput`.

Inside the function body, after computing `baseDayType` and `baseRequiresIntra`, call `resolveCheckinModifiers` and use the returned values instead:

```typescript
const baseDayType = canonicalDayType(planEntry);
const baseFocus = planEntry?.focus ?? (baseDayType === "rest" ? "maintenance" : null);
const baseRequiresIntra = !!planEntry?.requiresIntraFuel || baseDayType === "high";

const { dayType, requiresIntraFuel: requiresIntra, recoveryFocus } = resolveCheckinModifiers(
  baseDayType, baseRequiresIntra, params.checkin
);
const focus = recoveryFocus ? "recovery" : baseFocus;
```

The rest of the function stays the same — it uses `dayType`, `requiresIntra`, and `focus` which are already the variable names in scope.

**Step 2 — Update `/api/daily-plan` GET in `app/api/daily-plan/route.ts`:**

Before the `buildNutritionPlan` call (around line 40), add:

```typescript
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
```

Then pass it to the engine call:

```typescript
const planResponse = buildNutritionPlan({
  planEntry: planEntry ?? undefined,
  loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
  checkin: checkin ?? undefined,
});
```

**Step 3 — Update `buildActionPlan` in `lib/action-plan/plan.ts`:**

The checkin is already fetched at line 73 via `Promise.all`. Change lines 81-84 to pass it:

```typescript
const nutritionPlan = buildNutritionPlan({
  planEntry: planEntry ?? undefined,
  loads: { atl, ctl, acwr: Number.isFinite(acwr) ? acwr : null },
  checkin: checkin ? {
    fatigue: checkin.fatigue,
    sleepHours: checkin.sleepHours,
    intensity: checkin.intensity,
    trainingType: checkin.trainingType,
    durationMin: checkin.durationMin,
  } : undefined,
});
```

Also fix the fatigue threshold bug at line 150: change `checkin.fatigue >= 7` to `checkin.fatigue >= 4` (the scale is 1-5, not 1-10).

**Do NOT:** Change the return type of buildNutritionPlan (NutritionPlanResponse stays the same). Change the API response structure of /api/daily-plan. Add any new dependencies. Change the POST handler of /api/daily-plan.
  </action>
  <acceptance_criteria>
    - grep "checkin" lib/nutrition/engine.ts finds CheckinInput type and checkin parameter
    - grep "resolveCheckinModifiers" lib/nutrition/engine.ts finds the function
    - grep "dailyCheckin.findUnique" app/api/daily-plan/route.ts confirms check-in is fetched
    - grep "checkin:" app/api/daily-plan/route.ts confirms checkin is passed to engine
    - grep "checkin:" lib/action-plan/plan.ts confirms checkin is passed to engine
    - grep "fatigue >= 4" lib/action-plan/plan.ts confirms threshold is corrected (was >= 7)
    - npx tsc --noEmit passes without errors on all three files
  </acceptance_criteria>
  <done>Engine receives check-in data from both callers. High fatigue (>=4) downgrades dayType from high to moderate. Poor sleep (<6h) forces recovery focus on dinner. Backward compatible — works with or without check-in data.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 6: Verify end-to-end check-in to engine flow</name>
  <what-built>
Complete core loop: simplified check-in form (5 fields) → data saved to DB → engine reads check-in → produces different recommendations based on fatigue/sleep → food catalog covers all combinations → legacy endpoint removed → founder profile seeded.
  </what-built>
  <how-to-verify>
**Pre-check (run in terminal):**
1. `npx tsc --noEmit` — should compile without errors
2. `npm run dev` — should start without errors
3. Verify legacy endpoint is gone:
   - `curl http://localhost:3000/api/agents/nutrition-plan` should return 404
4. Verify catalog coverage:
   - Open browser console on any page and check no `[catalog] COVERAGE GAP` warnings

**Functional test — Scenario A (high fatigue, rest day):**
1. Go to check-in page in browser (mobile view)
2. Select: Descanso, Fatiga 5, Sleep 4h
3. Submit — should save in <2 seconds
4. Go to `/api/daily-plan` (or the nutrition plan page)
5. Verify: dayType should be "rest", focus should be "recovery", intraWorkout foods should be empty

**Functional test — Scenario B (low fatigue, training day):**
1. Go to check-in page
2. Select: Bici, 90 min, Alta, Sleep 8h, Fatiga 1
3. Submit
4. Go to `/api/daily-plan`
5. Verify: dayType should reflect training load, intraWorkout foods should have items, foods should differ from Scenario A

**Functional test — Scenario C (high fatigue overrides high load):**
1. Go to check-in page
2. Select: Bici, 120 min, Alta, Sleep 5h, Fatiga 4
3. Submit
4. Go to `/api/daily-plan`
5. Verify: dayType should be downgraded (moderate instead of high), dinner focus should be "recovery"

**Visual check:**
- Check-in form should have exactly 5 interactive inputs
- All buttons should be large and tappable (mobile-friendly)
- No mention of "Hambre", "Estres", "Momento del dia", or "Notas" in the form
- Nutrition plan page should NOT show the "Agente de Nutricion" macro panel

**Profile check:**
- Run `npx prisma db seed` and verify it reports the founder's profile values
  </how-to-verify>
  <resume-signal>Type "approved" if all scenarios work, or describe what's broken.</resume-signal>
</task>

</tasks>

<verification>
After all tasks complete:

1. **Compilation:** `npx tsc --noEmit` passes
2. **Legacy gone:** `grep -r "agents/nutrition-plan" --include="*.ts" --include="*.tsx" app/ components/ lib/` returns nothing
3. **Catalog coverage:** All 20 (moment x focus) cells have >=4 items
4. **Engine wiring:** Both callers pass checkin to buildNutritionPlan
5. **Form simplified:** CheckinForm has 5 fields, no sleepQuality/hunger/stress/timeOfDay/notes
6. **Profile ready:** Schema has ftp/timezone, seed script populates real values
7. **Different outputs:** High fatigue check-in produces different dayType/foods than low fatigue
</verification>

<success_criteria>
1. Founder completes check-in in <60 seconds on mobile (5 fields, tap-not-type)
2. Engine produces different recommendations for high_load vs rest day (dayType changes foods)
3. Catalog covers all moment x focus combinations with >=4 options each (no fallbacks)
4. Only one nutrition endpoint active — /api/agents/nutrition-plan does not exist
5. Founder profile seeded with weight=66, FTP=280, timezone=America/Santiago
</success_criteria>

<output>
After completion, create `.planning/phases/01-core-loop/01-01-SUMMARY.md`
</output>
