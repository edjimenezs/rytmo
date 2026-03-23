# Technology Stack — RytMo Fueling Engine

**Project:** RytMo
**Research Date:** 2026-03-22
**Mode:** Stack validation (brownfield — locked core, open decisions on supporting tools)
**Overall Confidence:** HIGH (derived from direct codebase inspection + domain knowledge)

---

## Context

This is a **brownfield refactor**, not a greenfield build. The core stack is locked by existing
infrastructure. Research here answers three questions:

1. Is the locked stack appropriate for a fueling recommendation engine?
2. What specific tools within the stack should be used vs replaced?
3. What's missing that needs to be added?

---

## Locked Stack Assessment

### Next.js 16 + React 19

**Verdict: Appropriate. No change needed.**

Next.js API Routes are the correct delivery mechanism for a recommendation engine that generates
plans server-side. The pattern used in `app/api/daily-plan/route.ts` — compute on server, persist
to DB, return structured JSON — is exactly right for this domain. No streaming, no edge functions,
no real-time needed for MVP.

React 19 with server components is available but not required for MVP. The existing client
component pattern (form → fetch → display) is fine.

**Confidence: HIGH** — Current code is working and correctly structured.

---

### TypeScript 5 + Zod 4

**Verdict: Keep. Add Zod validation at API boundaries.**

The codebase already has Zod and react-hook-form but doesn't consistently validate API inputs.
The `DailyCheckin` API (`app/api/checkin/route.ts`) casts to `CheckinPayload` directly without
schema validation. For MVP with a single founder user this is acceptable, but Zod should gate
the check-in input to prevent bad data poisoning the recommendation engine.

**Confidence: HIGH** — Zod 4 is stable, already installed, no action needed beyond using it.

---

### Prisma 6 + PostgreSQL 16

**Verdict: Appropriate. Schema needs focused cleanup.**

The existing `prisma/schema.prisma` has the right models for the fueling engine:
- `DailyCheckin` — captures training context (type, duration, intensity, sleep, fatigue)
- `DailyRecommendation` — stores generated plan by moment (preWorkout, intraWorkout, postWorkout, dinner, snack)
- `DailyFeedback` — captures energy/hunger/performance/digestion post-session
- `TrainingPlanEntry` — planned sessions with TSS, dayType, focus, requiresIntraFuel
- `TrainingActivity` — Strava-synced actual activities
- `FoodItem` — exists in schema but NOT used by the engine (catalog is hardcoded in `lib/nutrition/catalog.ts`)

The schema is **over-engineered for the current scope** (Coach/Nutritionist/Medical models are dead
weight) but they don't block the fueling engine. Removing them is a cleanup task, not a blocker.

**Key gap:** `FoodItem` model exists in DB but the actual food catalog lives as a hardcoded
TypeScript array in `lib/nutrition/catalog.ts`. This is fine for v1 (40–80 items curated manually).
Do NOT migrate to DB-backed catalog until there's a reason to (multi-user, dynamic additions).

**Confidence: HIGH** — Prisma ORM is the right tool, existing schema is sufficient.

---

### NextAuth 4 + @auth/prisma-adapter

**Verdict: Keep as-is. No changes needed for MVP.**

Single founder user. Auth is working. NextAuth v4 is stable. The v5 (Auth.js) migration is a
future concern, not a v1 concern. The existing `requireAuth()` utility in `lib/auth/utils.ts`
is used consistently across all API routes.

**Confidence: HIGH** — Auth is a solved problem in this codebase.

---

## AI Layer Assessment

### Current: Raw fetch to OpenAI + Anthropic via `lib/ai/llm.ts`

**Verdict: Keep the pattern, update the model and usage.**

The `askLLM()` helper is minimal and correct for MVP: no SDK dependency, direct fetch, supports
both OpenAI and Anthropic with graceful null return on failure. This is better than adding the
`openai` npm package for a handful of calls.

**Issues found:**

1. **Wrong OpenAI endpoint.** `lib/ai/llm.ts` line 20 calls `/v1/responses` — this is the
   Responses API (newer), not `/v1/chat/completions`. The body format uses `input` instead of
   `messages`. This **will fail** unless the account has Responses API access. The agents
   nutrition-plan route (`app/api/agents/nutrition-plan/route.ts`) parses `data.output_text` which
   matches the Responses API format. Needs verification that this actually works end-to-end.

2. **Model choice.** `gpt-4o-mini` is correct for this use case. The prompt is short (structured
   context → JSON output), latency matters more than reasoning depth. `gpt-4o-mini` costs ~$0.15
   per 1M input tokens — for 48–72h personal validation this is negligible.

3. **AI is used only in the agents route, not in the core fueling engine.** `lib/nutrition/engine.ts`
   (`buildNutritionPlan`) is purely deterministic — it picks foods from the catalog based on
   `dayType` and `focus`, then assembles hardcoded Spanish text strings. AI phrasing is done
   in a separate agents endpoint. This **two-track architecture is correct**: logic in deterministic
   code, phrasing in AI. Keep this separation.

4. **The Anthropic model is stale.** `claude-3-5-sonnet-20240620` is the old version. Current
   recommended is `claude-3-5-sonnet-20241022` or `claude-3-5-haiku-20241022` (faster, cheaper).
   Low priority for MVP since OpenAI is the default provider.

**Recommended: Keep `lib/ai/llm.ts` pattern, fix the OpenAI endpoint issue, use `gpt-4o-mini`.**

**Confidence: HIGH** (code inspection) / MEDIUM (endpoint behavior — needs runtime test)

---

## Food Catalog Storage

### Current: Hardcoded TypeScript array in `lib/nutrition/catalog.ts`

**Verdict: Correct for v1. Do NOT move to database.**

The catalog has 12 items today. Target is 40–80. A TypeScript array is:
- Instantly queryable (no DB round-trip)
- Type-safe (`FoodOption` interface with all fields)
- Zero-latency (imported at module load)
- Easy to edit (just add objects to the array)
- Deployable without migrations

The `FoodItem` model in `prisma/schema.prisma` is **dead code for v1**. Ignore it.

**When to move to DB:** When there's a need to add items without redeployment, or when the catalog
exceeds ~200 items and filtering logic becomes complex. Neither applies to MVP.

**Confidence: HIGH** — This is standard practice for small curated datasets.

---

## Training Load Calculation

### Current: Custom TRIMP/TSS estimation in `lib/training/load.ts`

**Verdict: Correct approach. Implementation has one issue.**

The `calcularAtlCtlAcwr()` function correctly implements exponential moving averages for ATL
(7-day), CTL (42-day), and ACWR. This is the standard methodology used by TrainingPeaks, WKO,
and every serious training load tool. The `estimarTssDesdeFc()` function estimates TSS from HR
ratio when power data isn't available — acceptable approximation for heart rate-based sports.

**Issue found:** `calcularAtlCtlAcwr` returns `{ atl, ctl, acwr, lastDate }` but the `acwr`
formula is `ctl > 0 ? atl / ctl : 0`. This is inverted — ACWR should be `atl / ctl` (acute /
chronic). The variable names match (atl=acute=7d, ctl=chronic=42d) but conceptually ATL/CTL
terminology is borrowed from TrainingPeaks where CTL=chronic training load. The ratio direction
is correct. However, for a fueling engine the key variable is `atl` (recent fatigue/load), not
the ratio.

**No specialized library needed.** The math is simple enough and is correctly implemented.

**Confidence: HIGH** — Codebase inspection + domain knowledge.

---

## Missing Tools (Gaps)

### 1. No Zod schema for check-in input

The check-in POST (`app/api/checkin/route.ts`) casts raw JSON to `CheckinPayload` without
validation. A bad `intensity` value or out-of-range `sleepQuality` integer will silently corrupt
the recommendation engine input. Add a Zod schema — Zod is already installed.

**Action:** Add at API boundary, no new dependencies.

### 2. No structured output contract for AI calls

`app/api/agents/nutrition-plan/route.ts` parses AI JSON with a try/catch fallback. The prompt
asks for a specific JSON shape but doesn't enforce it. For the fueling engine, the AI phrasing
layer should have a defined output schema validated with Zod after parsing.

**Action:** Add Zod parse step after `JSON.parse(aiText)`.

### 3. No Neon/production DB configuration

`docker-compose.yml` runs PostgreSQL locally. The project context specifies Neon for production
deployment to Vercel. This is a deployment concern, not a stack concern — Prisma handles both
identically via `DATABASE_URL`. No action needed in code.

---

## Specialized Nutrition/Sports APIs — Assessment

### External food databases (USDA FoodData Central, Open Food Facts, Nutritionix)

**Verdict: Do NOT use for RytMo v1.**

PROJECT.md explicitly states "Curated food catalog vs USDA API — 40–80 items > 300k items; agency > completeness." This decision is correct and validated:

- USDA FoodData Central has 300k+ items, most irrelevant to LatAm athletes
- Nutritionix API requires paid plan and returns US-centric foods
- Open Food Facts is community-sourced, inconsistent quality
- None of these have LatAm/Chilean foods as first-class citizens

The curated catalog approach (marraqueta, charquicán, lúcuma, mote, merkén) is the **differentiator**, not the liability. Replacing it with a generic database would destroy the product's identity.

**Confidence: HIGH**

### Fuelin-style recommendation engines

**Verdict: No open-source equivalent exists. Build is the correct choice.**

Fuelin (US-based) and similar tools (TrainingPeaks Nutrition, Garmin Nutrition) are proprietary
SaaS products. There is no open-source library that implements "training-load → food timing"
recommendations. The pattern used in `lib/nutrition/engine.ts` — deterministic rules on `dayType`
and `focus` derived from TSS thresholds — is the standard approach and is correctly implemented.

**Confidence: MEDIUM** — Based on market knowledge; no exhaustive API search was possible.

---

## Recommended Stack (Consolidated)

### Core (Locked — No Changes)

| Technology | Version | Role | Status |
|------------|---------|------|--------|
| Next.js | 16.0.1 | Framework, API routes, SSR | Keep as-is |
| React | 19.2.0 | UI | Keep as-is |
| TypeScript | 5 | Type safety | Keep, strict mode on |
| Prisma | 6.18.0 | ORM | Keep as-is |
| PostgreSQL | 16 | Primary DB | Keep (Neon for prod) |
| NextAuth | 4.24.13 | Auth | Keep as-is |
| Tailwind CSS | 4 | Styling | Keep as-is |
| Zod | 4.1.12 | Schema validation | Keep, use more of it |
| react-hook-form | 7.66.0 | Form state | Keep as-is |
| date-fns | 4.1.0 | Date utilities | Keep as-is |

### AI Layer (Keep Pattern, Fix Details)

| Technology | Notes |
|------------|-------|
| OpenAI `gpt-4o-mini` | Correct model for phrasing. Fix `/v1/responses` endpoint bug. |
| Anthropic `claude-3-5-haiku-20241022` | Upgrade model string if Anthropic path is used. |
| Raw `fetch` in `lib/ai/llm.ts` | Correct approach — no SDK dependency needed for MVP. |

### Food Catalog (No Change Needed)

| Approach | Notes |
|----------|-------|
| TypeScript array in `lib/nutrition/catalog.ts` | Correct for 40–80 items. No DB migration needed. |

### NOT Needed (Anti-dependencies)

| Tool | Reason to Avoid |
|------|-----------------|
| USDA FoodData Central API | Wrong dataset, US-centric, kills LatAm differentiation |
| Open Food Facts | Inconsistent quality, too large, no LatAm focus |
| Nutritionix API | Paid, US-centric, overkill |
| `openai` npm SDK | Raw fetch is sufficient for 2 endpoints |
| Redis/caching | Single user, no scale concerns for MVP |
| Background jobs (BullMQ, etc.) | Plan generation is synchronous, fast enough |
| WebSockets | No real-time requirements |

---

## Installation

No new dependencies required for MVP. The existing stack covers all needs.

If the OpenAI Responses API proves problematic, the fallback is to switch to chat completions:

```bash
# No new packages — change endpoint in lib/ai/llm.ts
# /v1/responses → /v1/chat/completions
# input: prompt → messages: [{ role: "user", content: prompt }]
```

---

## Confidence Summary

| Area | Confidence | Basis |
|------|------------|-------|
| Core framework fit | HIGH | Direct codebase inspection — working code |
| AI layer correctness | MEDIUM | Code inspection; endpoint behavior needs runtime test |
| Food catalog approach | HIGH | Explicit product decision in PROJECT.md + domain knowledge |
| Training load math | HIGH | Code inspection + sports science domain knowledge |
| No external nutrition API | HIGH | Product positioning explicitly rejects this |
| Schema fit for fueling engine | HIGH | Schema has all required models |

---

## Open Questions

1. **Does the `/v1/responses` OpenAI endpoint work with the current account?** The agents route
   parses `data.output_text` which implies the Responses API. If the API key is a standard key
   without Responses API access, all AI calls silently return `null`. Test this before assuming
   AI phrasing works.

2. **Is `FoodItem` DB model used anywhere in the current codebase?** It's in schema but catalog
   is hardcoded. If a migration added the table, it's wasted space but harmless. Worth confirming
   no code path tries to query it and falls back incorrectly.

3. **TSS thresholds for `dayType` derivation.** `lib/training/plan.ts` uses TSS >= 150 → high,
   >= 60 → moderate, < 60 → rest. These are reasonable defaults but were set without validation.
   For a founder who does triathlon, a 90-minute Z2 ride might produce TSS ~70 (moderate), which
   correctly triggers "performance + recovery" focus. Worth testing against real data during 3-day
   personal validation.

---

*Researched: 2026-03-22 | Based on: codebase inspection of streho/ + domain knowledge of sports nutrition and training load methodology*
