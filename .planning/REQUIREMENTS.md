# Requirements: RytMo MVP

**Defined:** 2026-03-22
**Core Value:** Turn training load + daily state into simple, actionable food recommendations

---

## v1 Requirements

Scope para el MVP validado personalmente. Todos están en la refactorización de streho.

### Core Engine

- [ ] **ENGINE-01**: Nutrition engine receives daily check-in data (sleep, fatigue, training) and routes it to decision logic
- [ ] **ENGINE-02**: Day classification logic (rest / low_load / moderate_load / high_load) based on training duration + intensity
- [ ] **ENGINE-03**: Fueling strategy deterministic (pre/intra/post/dinner moments based on day type + training context)
- [ ] **ENGINE-04**: Food selection from curated catalog by moment + nutritional focus (no randomness)

### Food Catalog

- [ ] **FOOD-01**: Curated catalog of 40–80 Chilean foods with macros, portions, moment tags, focus tags
- [ ] **FOOD-02**: Every moment (pre/intra/post/snack/dinner) has at least 4 options per focus type
- [ ] **FOOD-03**: No silent fallbacks — engine guarantees valid recommendation or explicit error

### Recommendation Output

- [ ] **REC-01**: Daily recommendation output includes: day summary, 4 moment-specific food suggestions, brief reasoning
- [ ] **REC-02**: Recommendations show **concrete food, not macros** (e.g., "banana + yogurt", not "23g carbs + 10g protein")
- [ ] **REC-03**: AI phrasing layer (natural language wrapper, not logic layer)

### Check-in & Feedback

- [ ] **CHECKIN-01**: Daily check-in captures training (type, duration, intensity, time) + state (sleep hours, fatigue 1-5)
- [ ] **CHECKIN-02**: Check-in completes in under 60 seconds, mobile-friendly
- [ ] **FEEDBACK-01**: Post-session feedback captures energy, hunger, digestion, performance (1-5 scale)
- [ ] **FEEDBACK-02**: Feedback stored, linked to day's recommendation, available for founder review

### Data Integrity

- [ ] **DATA-01**: Check-in data flows through to recommendation engine (not ignored)
- [ ] **DATA-02**: Profile data (athlete weight, FTP, timezone) seeded correctly for founder
- [ ] **DATA-03**: Only one nutrition engine active (legacy `/api/agents/nutrition-plan` removed)

### UI & UX

- [ ] **UI-01**: Home page shows today's status + quick link to check-in
- [ ] **UI-02**: Daily plan page readable in <20 seconds
- [ ] **UI-03**: Responsive design works on phone browser
- [ ] **UI-04**: Error states handled gracefully (no silent failures)

---

## v2 Requirements

Deferred to post-validation MVP. Tracked but not in current roadmap.

### Advanced Features

- [ ] **ADV-01**: Trend analysis (how recommendations are landing week-over-week)
- [ ] **ADV-02**: Plan regeneration mid-day (if schedule changes)
- [ ] **ADV-03**: Personalized thresholds (TSS cutoffs per athlete type)
- [ ] **ADV-04**: OAuth integrations (Garmin direct pull instead of Strava only)
- [ ] **ADV-05**: Multi-athlete (friends, team context)

### Expanded Catalog

- [ ] **FOOD-04**: Regional expansion (Argentina, Peru, Colombia foods)
- [ ] **FOOD-05**: Dietary restrictions (vegetarian, gluten-free variants)

### Social & Coaching

- [ ] **SOCIAL-01**: Share recommendations with nutritionist (async review + feedback)
- [ ] **COACHING-01**: Coach notes on athlete fueling performance

---

## Out of Scope (v1)

Explicitly excluded to avoid scope creep.

| Feature | Reason |
|---------|--------|
| Barcode scanner | Too complex; manual food selection sufficient for MVP |
| Photo-based meal recognition | Infrastructure heavy; catalog covers typical meals |
| Native mobile app | Responsive web app sufficient; PWA later if needed |
| Wearable HR zones | Strava + manual intensity sufficient for v1 |
| Detailed food logging | Logging is anti-feature; we recommend, not track |
| Macro-first UI | Positioning is "eat this", not "track your macros" |
| Community/social | Solo athlete focus; v2 after founder validates |
| Medical claim integration | Out of scope; recommendation is nutritional, not clinical |

---

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENGINE-01 | Phase 1 | Pending |
| ENGINE-02 | Phase 1 | Pending |
| ENGINE-03 | Phase 1 | Pending |
| ENGINE-04 | Phase 1 | Pending |
| FOOD-01 | Phase 1 | Pending |
| FOOD-02 | Phase 1 | Pending |
| FOOD-03 | Phase 1 | Pending |
| REC-01 | Phase 2 | Pending |
| REC-02 | Phase 2 | Pending |
| REC-03 | Phase 2 | Pending |
| CHECKIN-01 | Phase 1 | Pending |
| CHECKIN-02 | Phase 1 | Pending |
| FEEDBACK-01 | Phase 2 | Pending |
| FEEDBACK-02 | Phase 2 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---

*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after research synthesis*
