# Feature Landscape — Sports Nutrition / Fueling Apps

**Domain:** Daily fueling recommendations for endurance athletes
**Product:** RytMo
**Researched:** 2026-03-22
**Research mode:** Ecosystem (competitive analysis)

**Confidence note:** WebSearch and WebFetch were unavailable during this session.
All competitor claims are based on training data (cutoff Aug 2025) + PROJECT.md context.
Confidence per section is marked explicitly.

---

## Competitive Snapshot

### Fuelin
**Confidence:** MEDIUM (training data, widely documented pre-Aug 2025)

Fuelin is the closest direct competitor. Key characteristics:
- Connects to Garmin/TrainingPeaks to pull planned training load
- Generates daily carbohydrate targets based on training periodization
- Output is macro targets (CHO grams) per meal moment, not food items
- Uses a sports dietitian-backed methodology (high/mod/low carb days)
- Subscription model, US-centric, ~$20-30/month
- Interface is guided: user doesn't log food, gets targets and follows them
- No food catalog browsing — user interprets targets with own knowledge
- Periodization-aware: rest days vs hard days get different targets
- No feedback loop from user on how recommendations felt

**Fuelin gap for RytMo:** Output is still macro-numbers, not concrete food. No localization. No subjective state input (sleep, fatigue, mood).

---

### Garmin Connect — Nutrition
**Confidence:** MEDIUM (training data)

- Tracks calories in vs calories out (TDEE model)
- Manual food logging from large database (MyFitnessPal-style)
- Hydration tracking
- Estimated sweat rate post-activity
- NO periodization-aware recommendations — pure CICO tracking
- Training load visible but not linked to nutrition advice
- Barcode scanner for food logging
- Very heavy UX — nutrition is a side feature, not core

**Garmin gap:** Nutrition is bolted on, not native. No "what should I eat today given my training" logic.

---

### MyFitnessPal
**Confidence:** HIGH (widely known)

- Barcode scanner + food database (300M+ items)
- Macro and calorie tracking
- Goal setting (weight loss/gain/maintenance)
- Streak gamification
- Premium AI coaching features (as of 2024-2025)
- Social/sharing features (food diary, friends)
- Integrates with Strava/Garmin for calorie burns
- No sport-specific fueling logic — everything is calorie math
- Overwhelming for endurance athletes who don't care about weight, care about performance

**MFP gap:** Not built for performance. CICO model is wrong model for endurance athletes who need periodized carb intake, not a deficit.

---

### TrainingPeaks Nutrition (NutriTiming)
**Confidence:** LOW (less documented, possibly discontinued or niche)

- Calorie and carb targets based on TSS/training stress
- Links directly to TP workout data
- Sparse UI, not consumer-facing
- Very much a "coach tool" not athlete tool

---

### Other context: Supersapiens, Lumen, Supersports nutrition apps
**Confidence:** LOW

- Supersapiens: CGM-based, real-time glucose for athletes — hardware dependency, niche
- Lumen: Metabolic testing device, generates daily carb recommendations — hardware-dependent
- Fast Talk Labs / Training Bible: Educational content, not app-driven recommendations
- Most "sports nutrition" apps are either macro trackers or coach-facing tools, not athlete-facing daily fueling engines

---

## Table Stakes

Features users expect. Missing or broken = users don't trust or use the app.

| Feature | Why Expected | Complexity | Confidence | Notes |
|---------|--------------|------------|------------|-------|
| Daily check-in (training input) | Core interaction pattern; athletes expect to input their day | Low | HIGH | Already exists in codebase, needs cleanup |
| Training-aware recommendations | The entire reason to use over MFP | Medium | HIGH | Core differentiator must also be table stakes for this positioning |
| Pre/intra/post meal moments | Endurance athletes think in training windows, not breakfast/lunch/dinner | Low | HIGH | Standard sports nutrition framing (Burke, Jeukendrup) |
| Carbohydrate targeting by training load | High-carb on hard days, low on rest — this is the core fueling logic | Medium | HIGH | Fuelin does this; athletes familiar with the concept |
| Simple, fast UX | Athletes won't use it if check-in takes > 2 min | Low | HIGH | Sub-60s is correct target per PROJECT.md |
| Mobile-responsive web | Athletes are on phone pre/post training | Low | HIGH | Web-responsive is sufficient; no native app needed |
| Personalization baseline | At minimum: body weight, sport type, training phase | Low | HIGH | Needed to calculate any meaningful carb/calorie targets |
| Authentication + data persistence | Users need their history to exist | Low | HIGH | Already working |
| Concrete food output (not just macros) | Athletes don't want to translate "150g CHO" into a meal — they want "arroz + plátano" | Medium | HIGH | This is RytMo's core wedge vs Fuelin |

---

## Differentiators

Features that create competitive advantage. Not expected by most users, but valued when present.

| Feature | Value Proposition | Complexity | Confidence | Notes |
|---------|-------------------|------------|------------|-------|
| Subjective state as input (sleep quality, fatigue, stress) | Training load + feeling = better recommendations than load alone | Low input, Medium logic | HIGH | Sleep and HRV impact fueling needs; underused in apps |
| Post-session feedback loop | Closes the loop: how did the fueling feel? → system learns | Medium | HIGH | Energy, hunger, GI issues, performance — 4 questions max |
| Local food catalog (LatAm/Chilean foods) | Geo-relevant food items: arroz, marraqueta, plátano, legumbres | Low | HIGH | No competitor does this; massive UX improvement for LatAm athletes |
| Hiding macros / food-first output | "Eat a banana + yogurt" vs "45g CHO + 10g PRO" — decision vs data | Low | HIGH | Position against MFP paradigm explicitly |
| Strava integration for auto-pull | Pre-fills training input from real activity data; reduces friction | Medium | HIGH | Already partially implemented |
| Training phase awareness (base/build/race/taper) | Fueling strategy changes with periodization; week context matters | Medium | MEDIUM | Requires user to set current phase; adds value for serious athletes |
| Race-day / long effort specific plans | Century ride or Half Ironman nutrition plan is a distinct need | Medium | MEDIUM | Intra-race nutrition is complex and specific |
| Hydration + electrolyte guidance | Sweat rate varies by climate and effort; heat is Chile-relevant | Low | MEDIUM | Simple guidelines suffice for MVP; advanced with sweat testing |
| AI-phrased natural language output | Recommendations feel like a coach talking, not a spreadsheet | Low (if logic is pre-built) | HIGH | Already in scope per PROJECT.md — use AI for phrasing only |
| Multi-week adherence tracking | Did athlete follow recommendations? Trend view | Medium | LOW | Nice to have post-MVP; requires consistent use first |

---

## Anti-Features

Things to explicitly NOT build. Build time is finite; these dilute focus or add complexity without core value.

| Anti-Feature | Why Avoid | What to Do Instead | Confidence |
|--------------|-----------|-------------------|------------|
| Barcode scanner / food logging | Wrong product paradigm — logging is the job we're replacing | Curated catalog of 40-80 items; users pick from list | HIGH |
| Full macro dashboard (calories in/out) | Signals this is another MFP clone; attracts wrong user | Show macros only if user explicitly asks (progressive disclosure) | HIGH |
| Social features (sharing, friends, leaderboards) | Adds scope without core value; founder-only MVP | Cut entirely for v1 | HIGH |
| Photo-based meal recognition | Infrastructure and ML cost disproportionate to value | Text-based selection from catalog | HIGH |
| Native iOS/Android app | 3-6 months of platform work; web-responsive is good enough | Responsive PWA; revisit post product-market fit | HIGH |
| Full USDA / Open Food Facts database | 300k items creates choice paralysis; wrong UX | 40-80 curated Chilean foods covers 90% of use cases | HIGH |
| Weight/body composition tracking | Different product; attracts performance-negative mindset | Out of scope entirely | HIGH |
| Coach / nutritionist portal | B2B complexity; wrong user; scope creep already exists in codebase | Remove existing coach/nutritionist components | HIGH |
| Subscription + payment in v1 | Monetization before validation is distraction | Free for founder; add paywall at v2 multi-user | HIGH |
| Deep wearable integrations (HRV, CGM, power meter) | API complexity, data noise; Strava is sufficient signal | Strava only; ask user to input subjective state instead | HIGH |
| Meal history log / food diary | Full logging is what athletes are trying to escape | Show today's plan + last 7 days summary only | MEDIUM |
| Calorie counting / deficit tracking | Wrong model for performance athletes | Carb targeting by training load — different mental model | HIGH |

---

## Feature Dependencies

```
Personalization baseline (weight, sport, phase)
  → Carbohydrate targets per day
    → Meal moment breakdown (pre/intra/post)
      → Concrete food selection from catalog
        → AI-phrased output (natural language)
          → Feedback loop (post-session)
            → Longitudinal learning (v2)

Daily check-in (training input)
  → Training-aware adjustment (today's load)
    → Override or confirm baseline plan

Strava integration
  → Auto-fill training input
    → Reduce check-in friction
```

Dependencies mean: catalog and carb logic must exist before AI phrasing is useful. Check-in must be functional before Strava auto-fill adds value.

---

## MVP Recommendation

### Build now (v1 founder validation):

1. **Daily check-in** — training type, duration, intensity, sleep quality (4-5 fields, sub-60s)
2. **Carb targeting logic** — structured rules: hard day / moderate / rest → CHO gram targets
3. **Meal moment output** — Pre / Intra / Post / Dinner, concrete food from catalog
4. **Curated food catalog** — 40-80 Chilean foods, mapped to macros internally
5. **AI-phrased output** — Pass structured plan to OpenAI, return readable Spanish text
6. **Feedback form** — Energy, hunger, GI, performance. 4 questions, post-session

### Defer to v2:

| Feature | Reason to Defer |
|---------|----------------|
| Training phase selection (base/build/race/taper) | Adds value but not blocking for single-athlete use |
| Strava auto-pull for check-in | Manual check-in sufficient for validation; Strava already partial |
| Multi-week adherence tracking | Need 2+ weeks of data to show trends |
| Race-day specific plans | Edge case; add after base daily fueling works |
| Hydration / electrolyte guidance | Add-on to core fueling; low priority vs carbs |

### Never build (for this product):

Barcode scanner, macro dashboard, social features, coach portal, full food database, weight tracking, native app.

---

## Endurance Athlete Mental Model

Understanding how the target user thinks shapes feature priority.

**What endurance athletes actually care about:**
- "Will I bonk on tomorrow's 4-hour ride?" — energy availability for training
- "Am I recovered enough to train hard again?" — recovery nutrition
- "What do I eat during the race?" — intra-event fueling
- "Why am I always tired/heavy/slow?" — chronic under-fueling detection

**What endurance athletes do NOT care about:**
- Calorie counting (unless cutting for a goal weight — different use case)
- Social sharing of food diaries
- Logging every meal precisely
- Generic nutrition advice disconnected from their training

**Mental model mismatches to avoid:**
- Do not frame output as "your macros today are..." — athletes disengage
- Do not require daily food logging — violates promise of simplicity
- Do not conflate rest day with "eat less" — recovery nutrition is still important
- Do not assume athletes know sports nutrition science — explain why briefly

---

## Sources

**HIGH confidence:** Domain knowledge from sports nutrition literature (Burke, Jeukendrup, Thomas et al. ISSN Position Stand 2016, IOC Consensus 2011+), PROJECT.md product decisions already validated.

**MEDIUM confidence:** Fuelin and Garmin feature descriptions from training data (pre-Aug 2025). Competitor features may have changed.

**LOW confidence:** TrainingPeaks NutriTiming, Supersapiens, Lumen — smaller niche products, less coverage in training data.

**Not verified:** WebSearch and WebFetch were unavailable. Fuelin pricing, current feature set, Garmin Connect nutrition UI changes post-2024 not confirmed against live sources. Recommend a manual check of fuelin.com before finalizing competitive positioning.

---

*Generated: 2026-03-22*
*Product: RytMo — daily fueling engine for endurance athletes*
