---
phase: 03-validacion-personal
plan: 02
subsystem: calibration-tooling
tags: [cli-script, calibration, closure-doc, validation]
dependency_graph:
  requires: [lib/training/load.ts, prisma/schema.prisma]
  provides: [scripts/calibrate-thresholds.ts, CLOSURE-TEMPLATE.md]
  affects: []
tech_stack:
  added: [tsconfig.scripts.json]
  patterns: [CLI ts-node with tsconfig-paths, local PrismaClient for scripts]
key_files:
  created:
    - scripts/calibrate-thresholds.ts
    - .planning/phases/03-validacion-personal/CLOSURE-TEMPLATE.md
    - tsconfig.scripts.json
  modified:
    - scripts/calibrate-thresholds.ts (added run comment after fix)
decisions:
  - "Use local new PrismaClient() in CLI scripts instead of globalThis singleton from lib/prisma"
  - "Add tsconfig.scripts.json with commonjs + node moduleResolution so ts-node can resolve @/* aliases via tsconfig-paths"
  - "Script detects 4 discrepancy types: high TSS + rest/low dayType, medium TSS + low dayType, low energy + high_load plan, low TSS + high/moderate dayType"
metrics:
  duration: 3 min
  completed_date: 2026-03-24
  tasks_completed: 2
  files_created: 3
---

# Phase 03 Plan 02: Calibration Script and Closure Template Summary

CLI calibration tool + Phase 3 closure doc template for end-of-validation analysis — script queries DB for 5-7 days of Strava TSS vs engine predictions, detects threshold mismatches, and prints a per-day comparison report with summary stats.

## What Was Built

### Task 1: Calibration Script (`scripts/calibrate-thresholds.ts`)

Node.js CLI tool that cross-references engine predictions (DailyRecommendation.dayType) against Strava reality (TSS computed from TrainingActivity HR data) with founder feedback (energy + performance scores).

- Accepts `--email=` and `--days=` CLI args
- Queries DailyFeedback with linked DailyRecommendation (dayType, ATL, CTL, ACWR)
- Fetches STRAVA activities per day, computes TSS via `estimarTssDesdeFc`
- Detects 4 discrepancy types with labeled alerts
- Prints per-day table + summary (avg energy/performance, discrepancy count)
- Uses `normalizeDate` with UTC midnight for consistent date ranges
- Creates its own `PrismaClient` (no globalThis singleton)

Run command:
```
npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/calibrate-thresholds.ts --email=founder@example.com --days=14
```

### Task 2: Closure Doc Template (`.planning/phases/03-validacion-personal/CLOSURE-TEMPLATE.md`)

Ready-to-fill skeleton for Phase 3 closure document. Central question: "Puedo seguir usando esta app todos los dias?" Includes:
- Usage metrics table (7 rows: dia, fecha, checkin, feedback, energia, performance, notas)
- Thresholds calibration section with script output placeholder and 4 constants table
- Catalog gaps capture table
- What worked / what didn't checklists
- V2 backlog table referencing ADV-01 through ADV-05 and FOOD-04, FOOD-05
- Post-MVP decision section (sigue as-is / iterar / pivotar)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ts-node cannot resolve @/* path aliases with Next.js tsconfig**
- **Found during:** Task 1 verification
- **Issue:** `tsconfig.json` uses `"module": "esnext"` and `"moduleResolution": "bundler"` (Next.js config). `lib/training/load.ts` internally imports `@/lib/prisma` using the path alias. Plain `ts-node` fails with `ERR_MODULE_NOT_FOUND` for `@/lib/prisma`.
- **Fix:** Created `tsconfig.scripts.json` that extends base config but overrides to `"module": "commonjs"`, `"moduleResolution": "node"`, adds `baseUrl: "."` to enable `tsconfig-paths/register`. Added run comment to script header.
- **Files modified:** `scripts/calibrate-thresholds.ts` (comment), `tsconfig.scripts.json` (new)
- **Commit:** 85ccc09

## Self-Check: PASSED

All created files verified on disk. All commits verified in git history.
