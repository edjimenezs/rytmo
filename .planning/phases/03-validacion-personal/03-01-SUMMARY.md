---
phase: 03-validacion-personal
plan: 01
subsystem: ui, api
tags: [recharts, date-fns, feedback, trends, nutrition]

# Dependency graph
requires:
  - phase: 02-app-usable
    provides: DailyPlanView component with accordion moments and feedback link
provides:
  - GET /api/feedback/trends — aggregated energy + performance data for last N days
  - FeedbackTrendsChart — compact mini recharts LineChart (h-28, 2 lines)
  - DailyPlanView with integrated trends chart below moments
affects: [03-validacion-personal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Non-blocking secondary fetch inside primary load() function
    - Mini chart guard (data.length < 3 returns null) to suppress noise
    - date-fns format with Spanish locale for user-facing labels

key-files:
  created:
    - app/api/feedback/trends/route.ts
    - components/nutrition/FeedbackTrendsChart.tsx
  modified:
    - components/nutrition/DailyPlanView.tsx

key-decisions:
  - "Trends fetch is non-blocking — plan renders even if /api/feedback/trends fails (silent .catch)"
  - "3-point minimum guard on chart — fewer points is noise, not signal"
  - "date-fns/locale/es imported directly from subpath (date-fns v4 compatible)"

patterns-established:
  - "Non-blocking secondary fetch: fetch after primary state is set, .catch(() => {}), active flag before setState"
  - "Mini chart: h-28, margin left: -24, no CartesianGrid/Legend, domain [1,5] ticks [1,3,5]"

requirements-completed: [VALIDATION-TRENDS]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 3 Plan 01: Feedback Trends Mini Chart Summary

**Recharts mini 2-line chart (energia + performance) wired into DailyPlanView via non-blocking /api/feedback/trends endpoint with Spanish locale date labels**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-24T12:43:31Z
- **Completed:** 2026-03-24T12:45:09Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- New GET /api/feedback/trends endpoint queries DailyFeedback with energy filter, formats dates in Spanish locale
- FeedbackTrendsChart renders compact 2-line chart (blue=energia, green=performance) with domain [1,5], returns null when fewer than 3 points
- DailyPlanView fetches trends non-blockingly inside existing load() function, renders chart between moments and feedback link

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /api/feedback/trends endpoint** - `b8c8c5a` (feat)
2. **Task 2: Create FeedbackTrendsChart component** - `32d845b` (feat)
3. **Task 3: Wire trends fetch + chart into DailyPlanView** - `46090a7` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `app/api/feedback/trends/route.ts` - GET endpoint returning {trends, count} with Spanish locale date labels
- `components/nutrition/FeedbackTrendsChart.tsx` - Mini recharts LineChart, 2 lines, h-28, null guard at <3 points
- `components/nutrition/DailyPlanView.tsx` - Import + state + non-blocking fetch + conditional render

## Decisions Made
- Trends fetch is non-blocking: it runs inside load() after setPlan(), with .catch(() => {}) so plan always renders
- 3-point minimum guard on chart renders prevents noisy single-day or 2-day "lines" from appearing
- date-fns/locale/es imported via direct subpath (compatible with date-fns v4)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Feedback trends chart ready for validation period (5-7 days of feedback will populate it)
- /api/feedback/trends endpoint available for other consumers if needed
- Chart design intentionally minimal — no CartesianGrid or Legend to keep compact in mobile plan view

## Self-Check: PASSED

- FOUND: app/api/feedback/trends/route.ts
- FOUND: components/nutrition/FeedbackTrendsChart.tsx
- FOUND: components/nutrition/DailyPlanView.tsx (modified)
- FOUND: .planning/phases/03-validacion-personal/03-01-SUMMARY.md
- Commit b8c8c5a: feat(03-01): add /api/feedback/trends endpoint
- Commit 32d845b: feat(03-01): add FeedbackTrendsChart mini component
- Commit 46090a7: feat(03-01): wire trends fetch + chart into DailyPlanView

---
*Phase: 03-validacion-personal*
*Completed: 2026-03-24*
