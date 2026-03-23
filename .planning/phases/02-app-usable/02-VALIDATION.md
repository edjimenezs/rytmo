---
phase: 02
slug: app-usable
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc) + manual browser verification |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | REC-01, REC-02, REC-03 | compile + manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| TBD | 01 | 1 | FEEDBACK-01, FEEDBACK-02 | compile + manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| TBD | 01 | 1 | UI-01, UI-02, UI-03, UI-04 | compile + manual | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — TypeScript compiler catches type errors, manual browser verification for UI/UX criteria.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plan readable in <20s | REC-01 | UX timing | Load /plan, time how long to scan 4 moments |
| AI text is conversational Spanish | REC-03 | Subjective quality | Read AI output, verify tone matches "coach cercano" |
| 3 consecutive check-ins without UI errors | UI-04 | E2E flow | Complete check-in 3 times, verify no silent failures |
| Feedback accessible from plan | FEEDBACK-01 | UX flow | View plan, tap feedback button, verify form opens |
| Mobile layout not broken | UI-03 | Visual | Open on phone browser, verify no overflow/broken layout |
| Bottom tabs navigable | UI-01 | UX | Tap all 4 tabs, verify correct page loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
