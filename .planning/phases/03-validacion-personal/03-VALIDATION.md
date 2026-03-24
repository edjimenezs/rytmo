---
phase: 3
slug: validacion-personal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation + ts-node scripts |
| **Config file** | tsconfig.json (existing) |
| **Quick run command** | `curl -s http://localhost:3000/api/feedback/trends | jq .` |
| **Full suite command** | `npx ts-node scripts/calibrate.ts --email founder@rytmo.cl` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `curl -s http://localhost:3000/api/feedback/trends | jq .`
- **After every plan wave:** Run full calibration script
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | Feedback trends API | endpoint | `curl localhost:3000/api/feedback/trends` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | Mini chart component | visual | Manual browser check | N/A | ⬜ pending |
| 03-01-03 | 01 | 2 | Calibration script | script | `npx ts-node scripts/calibrate.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 2 | Closure doc | doc | File existence check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/api/feedback/trends/route.ts` — trends endpoint stub
- [ ] `scripts/calibrate.ts` — calibration script entry point

*Existing infrastructure covers chart rendering (recharts installed) and ts-node (in devDependencies).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mini chart renders correctly | Trend visibility | Visual rendering | Open /plan with 3+ days of feedback, verify 2 lines visible |
| Calibration report is readable | Threshold calibration | Human judgment | Run script, verify output makes sense for training data |
| Closure doc answers "can I keep using this?" | v2 decision | Subjective | Read doc, confirm go/no-go decision is clear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
