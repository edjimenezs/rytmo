---
phase: 02-app-usable
plan: 02
subsystem: ui
tags: [react, tailwind, nextjs, mobile-first, accordion, bottom-nav]

# Dependency graph
requires:
  - phase: 02-app-usable-01
    provides: AI phrasing API (aiHeadline, aiMomentTexts, momentMealNames) from /api/daily-plan
provides:
  - MomentAccordion component (collapsible, AI text + food list, no macros)
  - DailyPlanView component (fetches /api/daily-plan, skeleton/error/empty/plan states)
  - HomeCard component (day status with conditional CTA)
  - BottomNav component (fixed bottom tabs, 4 items, active state)
  - Updated layout.tsx with BottomNav + bg-indigo-50 + pb-16
  - Updated /dashboard page with HomeCard (simplified, no role routing)
  - Updated /plan page with DailyPlanView (replaces PlanForm)
  - Updated /checkin and /feedback pages with max-w-[480px] layout
affects: [02-app-usable-03, future UI phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "usePathname for active tab detection in BottomNav"
    - "Controlled accordion: single open moment via string state, toggle pattern"
    - "Dual fetch pattern: checkin check first, then plan fetch — avoids showing empty-state on error"
    - "max-h-[500px] with transition-all for CSS accordion animation (no JS animation library)"
    - "max-w-[480px] mx-auto px-4 py-6 as standard mobile page container"

key-files:
  created:
    - components/nutrition/MomentAccordion.tsx
    - components/nutrition/DailyPlanView.tsx
    - components/dashboard/HomeCard.tsx
    - components/layout/BottomNav.tsx
  modified:
    - app/layout.tsx
    - app/dashboard/page.tsx
    - app/plan/page.tsx
    - app/checkin/page.tsx
    - app/feedback/page.tsx

key-decisions:
  - "BottomNav uses pb-[env(safe-area-inset-bottom,0px)] for iOS safe area with 0px fallback — avoids double padding on non-iOS"
  - "DailyPlanView checks /api/checkin first before /api/daily-plan — correct empty state vs error state distinction"
  - "MomentAccordion uses max-h CSS trick instead of grid-rows for simpler cross-browser accordion"
  - "Dashboard page simplified to athlete-only — role-based routing removed from active pages (not deleted from codebase)"

patterns-established:
  - "Mobile page wrapper: max-w-[480px] mx-auto px-4 py-6"
  - "Card pattern: rounded-2xl bg-white shadow-sm p-5"
  - "CTA primary: w-full min-h-[52px] leading-[52px] rounded-2xl bg-blue-600 text-white"
  - "Food display: name in font-semibold gray-900 + portion in text-gray-500 separated by middle dot"

requirements-completed: [UI-01, UI-02, UI-03]

# Metrics
duration: 15min
completed: 2026-03-23
---

# Phase 2 Plan 02: UI Shell Summary

**Mobile-first UI shell with bottom tab navigation, collapsible meal accordions showing AI text and food items, and context-aware home page — replacing JSON/macro views with a coach-like plan experience.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-23T20:18:00Z
- **Completed:** 2026-03-23T20:30:00Z
- **Tasks:** 3 of 3 (all complete, checkpoint approved by founder)
- **Files modified:** 9

## Accomplishments

- BottomNav with 4 tabs (Inicio, Check-in, Plan, Feedback), fixed bottom-0, active state via usePathname, iOS safe area padding
- DailyPlanView: skeleton loading, empty state (no check-in CTA), error state, full plan with headline + 4 accordions + feedback CTA
- MomentAccordion: collapsible with icon, meal name, AI text, food name+portion format, no macros anywhere
- HomeCard: shows "Hacer check-in" or "Ver tu plan" based on today's check-in status
- All 4 pages updated to max-w-[480px] mobile layout; layout.tsx uses bg-indigo-50 and pb-16

## Task Commits

1. **Task 1: MomentAccordion, DailyPlanView, HomeCard, BottomNav** - `26cae1c` (feat)
2. **Task 2: Layout + page wrappers** - `c331927` (feat)
3. **Task 3: Human verification checkpoint** - approved by founder
4. **Fix: console.error in daily-plan GET** - `51e36dd` (fix) — debug logging added after Prisma Client issue discovered (prisma generate not run post-migration)

## Files Created/Modified

- `components/nutrition/MomentAccordion.tsx` - Collapsible card, SVG icon per moment, AI text + food list, no macros
- `components/nutrition/DailyPlanView.tsx` - Full plan view with 3 states (loading/error/empty) + accordion plan render
- `components/dashboard/HomeCard.tsx` - Day status card, fetches checkin + plan, shows conditional CTA
- `components/layout/BottomNav.tsx` - Fixed bottom navigation with 4 tabs and usePathname active detection
- `app/layout.tsx` - Added BottomNav, bg-indigo-50, pb-16 body padding
- `app/dashboard/page.tsx` - Simplified to HomeCard wrapper, removed role routing
- `app/plan/page.tsx` - DailyPlanView wrapper, removed PlanForm
- `app/checkin/page.tsx` - max-w-[480px] layout wrapper
- `app/feedback/page.tsx` - max-w-[480px] layout wrapper

## Decisions Made

- BottomNav uses CSS env() for safe area instead of Tailwind pb-safe (not available without plugin)
- DailyPlanView performs dual fetch: checkin first to distinguish empty-state from error-state
- Accordion animation via max-h transition (simple, no library needed)
- Role-based routing removed from dashboard page but AthleteDashboard/CoachDashboard components untouched

## Deviations from Plan

**1. [Rule 1 - Bug] Added console.error logging to daily-plan GET handler**
- **Found during:** Task 3 (verification)
- **Issue:** Prisma Client threw an error because `npx prisma generate` had not been run after the last migration. The error was silently swallowed, making debugging impossible.
- **Fix:** Added `console.error('[daily-plan] GET error:', error)` before the error message extraction.
- **Files modified:** `app/api/daily-plan/route.ts`
- **Commit:** `51e36dd`

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

- `components/nutrition/MomentAccordion.tsx` - exists
- `components/nutrition/DailyPlanView.tsx` - exists
- `components/dashboard/HomeCard.tsx` - exists
- `components/layout/BottomNav.tsx` - exists
- Task commits verified: 26cae1c, c331927, 51e36dd

## Next Phase Readiness

- Checkpoint approved by founder — all UI-01/UI-02/UI-03 requirements satisfied
- Phase 02 plans 01, 02, 03 all complete

---
*Phase: 02-app-usable*
*Completed: 2026-03-23*
