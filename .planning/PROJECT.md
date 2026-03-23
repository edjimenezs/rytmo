# RytMo — Refactored MVP

## What This Is

RytMo es un **motor diario de recomendaciones de fueling para atletas de resistencia**. No es tracker de calorías. No es macro logger. Es **una herramienta que traduce entrenamiento + fatiga + contexto en decisiones alimenticias concretas**: qué comer, cuándo, por qué.

Input: check-in rápido (tipo de entrenamiento, duración, intensidad, calidad de sueño).
Output: recomendaciones prácticas de comida por momento del día (pre, intra, post, cena).

## Core Value

> Turn training load + daily state into simple, actionable food recommendations that athletes can actually use.

No existe entre Garmin (tracking pesado) y Fuelin (que es US-only y caro). RytMo gana siendo:
- Simple en UX (1 minuto check-in)
- Accionable (comida real, no macros)
- LatAm-friendly (alimentos locales chilenos en v1)

## Requirements

### Validated

- ✓ Next.js stack (existing)
- ✓ Prisma + PostgreSQL (existing)
- ✓ NextAuth authentication (existing)
- ✓ Strava & TrainingPeaks integrations (existing, partial)
- ✓ Daily check-in form (exists, needs cleanup)
- ✓ Daily plan generation (exists, redundant)
- ✓ Feedback collection (exists)

### Active

- [ ] **Core MVP:** Daily fueling engine with training-aware logic
- [ ] **Catalog:** 40-80 curated Chilean foods with macros
- [ ] **Check-in UX:** Sub-60s daily capture
- [ ] **Plan output:** Concrete food by moment (not macros first)
- [ ] **AI integration:** Translate structured logic to natural language recommendations
- [ ] **Feedback loop:** Capture post-session energy, hunger, digestion, performance
- [ ] **Personal use validation:** Use for 3+ days, iterate based on real feedback

### Out of Scope (v1)

- Barcode scanner — Too complex, logging not core
- Photo-based meal recognition — Infrastructure heavy
- Native mobile app — Web responsive enough
- Deep wearable integrations — Strava sufficient for v1
- Community/social features — Solo athlete focus
- Detailed food database — Curated catalog better than USDA bloat
- Macro tracking dashboard — Anti-feature; we hide macros
- Multiple user profiles — Founder only, v2 multi-user

## Context

**Existing codebase state** (from CODEBASE.md):
- Stack: Next.js 14, TypeScript, Prisma, PostgreSQL
- Integrations: Strava, OpenAI API, NextAuth
- Architecture: API routes + React components, decent separation
- Issues: Scope creep (coaches, nutritionists, medical data), duplicate nutrition APIs, hardcoded heuristics, incomplete IA integration

**Product positioning:**
Not trying to out-track Garmin. Positioning on **"training → fueling decision"** wedge.

**User:** Founder (endurance athlete triathlon/cycling), validates MVP personally

**Timeline:** Weekend MVP (48–72h), not production-grade, quick iteration

## Constraints

- **Stack Lock**: Next.js, Prisma, PostgreSQL fixed (existing infrastructure)
- **Scope**: Founder-only, single athlete, no multi-tenancy
- **Food source**: Curated internal catalog (40–80 items), LatAm-friendly in v1
- **Data**: Use existing Strava + manual training context only
- **Deployment**: Vercel + Neon/existing DB (no new infra)
- **Language**: Spanish-first UX (Lalo es chileno)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Refactor streho vs fresh start | Preserve auth, DB, Strava integration already working | ✓ Faster |
| Curated food catalog vs USDA API | 40–80 items > 300k items; agency > completeness | — Pending |
| Hide macros from UI | Signal: this is about decisions, not logs | — Pending |
| AI for phrasing, not logic | Structure decides foods; AI makes it readable | — Pending |
| Founder validation only (v1) | Quick iteration; user interviews later | ✓ Simpler |

---

*Last updated: 2026-03-22 after initialization*
