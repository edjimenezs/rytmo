---
phase: 02-app-usable
plan: 01
subsystem: ai-phrasing
tags: [prisma, ai, anthropic, nutrition, cache]
dependency_graph:
  requires: [01-01]
  provides: [ai-phrasing-cache, daily-plan-api-v2]
  affects: [app/api/daily-plan, lib/ai/phrasing, prisma/schema]
tech_stack:
  added: []
  patterns: [ai-with-deterministic-fallback, db-cache-per-day, training-time-resolution-chain]
key_files:
  created:
    - lib/ai/phrasing.ts
    - prisma/migrations/20260323200949_add_ai_cache_feedback_fk_training_time/migration.sql
  modified:
    - prisma/schema.prisma
    - prisma/seed.ts
    - lib/ai/llm.ts
    - app/api/daily-plan/route.ts
decisions:
  - "Use deterministicFallback when AI call fails — never return null or raw JSON to client"
  - "Pin Anthropic model to claude-sonnet-4-5-20250514 in both llm.ts default and explicit phrasing call"
  - "Cache AI text in DailyRecommendation per day — generate once, read from DB on subsequent requests"
  - "trainingTime resolution: checkin.timeOfDay > profile.defaultTrainingTime > 'morning'"
metrics:
  duration: 12 min
  completed: 2026-03-23
  tasks_completed: 3
  files_changed: 6
---

# Phase 2 Plan 1: AI Phrasing Foundation Summary

**One-liner:** Prisma migration for AI cache + feedback FK + profile training time, plus phrasing library with Anthropic Claude and deterministic fallback, integrated into the daily-plan API with per-day caching.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Prisma migration: AI cache columns, feedback FK, profile training time | 3c6611d | prisma/schema.prisma, prisma/seed.ts, migration SQL |
| 2 | AI phrasing library: generateMomentPhrasing + fallback + meal mapping | 98fc7c7 | lib/ai/phrasing.ts, lib/ai/llm.ts |
| 3 | Update daily-plan API to generate, cache, return AI phrasing | 071ad2b | app/api/daily-plan/route.ts |

## What Was Built

### Prisma Migration (Task 1)

Three schema changes applied in a single migration (`20260323200949_add_ai_cache_feedback_fk_training_time`):

- `DailyRecommendation`: added `aiHeadline String? @db.Text` and `aiMomentTexts Json?`, plus `feedbacks DailyFeedback[]` relation
- `DailyFeedback`: added `recommendationId String?` FK with `onDelete: SetNull`
- `Profile`: added `defaultTrainingTime String?` (`'morning' | 'midday' | 'evening'`)
- Seed updated with `defaultTrainingTime: 'morning'`

### AI Phrasing Library (Task 2)

`lib/ai/phrasing.ts` exports:

- `MOMENT_MEAL_NAMES` — maps 5 abstract NutritionMoment x 3 trainingTime values to Spanish meal names ("Desayuno", "Almuerzo", "Cena", etc.)
- `mapMomentToMealName(moment, trainingTime)` — pure function returning from the table
- `deterministicFallback(plan, trainingTime)` — produces readable Spanish headline + per-moment text from food data, no AI dependency
- `generateMomentPhrasing(plan, checkin, trainingTime)` — calls Anthropic with explicit model pin, parses JSON response, returns null on any failure (caller uses fallback)

`lib/ai/llm.ts` default Anthropic model updated from `claude-3-5-sonnet-20240620` to `claude-sonnet-4-5-20250514`.

### Daily Plan API Update (Task 3)

`GET /api/daily-plan` now:
1. Selects `timeOfDay` from the checkin record
2. Fetches `profile.defaultTrainingTime`
3. Resolves `trainingTime = checkin.timeOfDay ?? profile.defaultTrainingTime ?? 'morning'`
4. After upsert, checks if `aiHeadline` is already cached in the DB record
5. If not cached: calls `generateMomentPhrasing` → falls back to `deterministicFallback` if AI returns null → persists both fields via `prisma.dailyRecommendation.update`
6. Returns `aiHeadline`, `aiMomentTexts`, `trainingTime`, and `momentMealNames` in the response JSON

## Decisions Made

1. **Deterministic fallback as the safety net:** AI failures (null return, parse errors, network errors) are caught and logged; the fallback always produces readable text. The API never returns null or raw JSON strings.
2. **Claude model pinned explicitly:** `claude-sonnet-4-5-20250514` passed as explicit option to `askLLM()` AND set as the new default in `llm.ts`. Belt-and-suspenders.
3. **DB cache per day:** AI text generated once per `userId + date`, stored in `DailyRecommendation`. Subsequent requests read from DB, avoiding repeated Anthropic calls. Cache invalidation is implicit (a new day = new upsert = new `aiHeadline: null`).
4. **trainingTime resolution chain:** `checkin.timeOfDay` overrides `profile.defaultTrainingTime`, which overrides `'morning'`. This lets the founder set a daily override without changing their profile.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx prisma validate` — exits 0
- `npx tsc --noEmit` — exits 0 (no TypeScript errors)
- Migration directory `20260323200949_add_ai_cache_feedback_fk_training_time` exists under `prisma/migrations/`
- `prisma/schema.prisma` contains `aiHeadline`, `aiMomentTexts`, `recommendationId`, `onDelete: SetNull`, `defaultTrainingTime`, `feedbacks DailyFeedback[]`

## Self-Check: PASSED

- [x] `lib/ai/phrasing.ts` exists — FOUND
- [x] `prisma/migrations/20260323200949_add_ai_cache_feedback_fk_training_time/migration.sql` exists — FOUND
- [x] Commit 3c6611d exists — FOUND
- [x] Commit 98fc7c7 exists — FOUND
- [x] Commit 071ad2b exists — FOUND
- [x] `npx prisma validate` exits 0 — PASSED
- [x] `npx tsc --noEmit` exits 0 — PASSED
