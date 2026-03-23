# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Next.js Full-Stack MVC with Role-Based Dashboards

**Key Characteristics:**
- Multi-tenant athlete/coach/nutritionist platform
- Server-side authentication (NextAuth.js) with role-based access control
- API route handlers (Next.js App Router) for data operations
- React Server Components with Client Components for interactivity
- Integration-driven architecture: Strava, TrainingPeaks, Garmin
- AI-powered nutrition and training recommendations (LLM-based)
- Prisma ORM with PostgreSQL as single source of truth

## Layers

**Presentation Layer:**
- Purpose: Render user interfaces with role-specific dashboards
- Location: `components/dashboard/` (AthleteDashboard, CoachDashboard, NutritionistDashboard)
- Contains: React Server Components and Client Components, charts, forms
- Depends on: API routes, auth layer, utilities
- Used by: Next.js pages in `app/dashboard/`

**API/Route Layer:**
- Purpose: RESTful endpoints for data access, integrations, AI operations
- Location: `app/api/` (82 route handlers)
- Contains: GET/POST handlers, auth guards, business logic
- Depends on: Prisma (database), external services (Strava, TrainingPeaks, Garmin), LLM
- Used by: Frontend components, external webhooks

**Service/Integration Layer:**
- Purpose: Encapsulate external service communication and domain logic
- Location: `lib/strava/`, `lib/trainingpeaks/`, `lib/garmin/`, `lib/nutrition/`, `lib/training/`, `lib/ai/`
- Contains: API clients, data transformations, business calculations
- Depends on: Environment configuration, fetch API, Prisma
- Used by: API routes and internal services

**Data/Persistence Layer:**
- Purpose: Abstract database interactions and data schema
- Location: `prisma/schema.prisma`, `lib/prisma.ts`
- Contains: Models (User, TrainingActivity, DailyRecommendation, etc.), relationships, indexes
- Depends on: PostgreSQL
- Used by: All API routes and services

**Authentication Layer:**
- Purpose: Handle user identity and session management
- Location: `lib/auth/config.ts`, `lib/auth/utils.ts`
- Contains: NextAuth.js configuration, JWT strategy, role extraction
- Depends on: Prisma (User model), bcrypt
- Used by: Middleware guard functions, API routes, layout providers

## Data Flow

**User Authentication Flow:**

1. User submits credentials on `/auth/login` (LoginForm component)
2. NextAuth.js CredentialsProvider validates email/password against `User.password` (bcrypted)
3. JWT token created with user ID and role
4. Session stored in cookies; role appended to session.user
5. Client-side SessionProvider wraps app with context
6. Protected routes call `requireAuth()` → validates JWT and returns user object

**Activity Sync Flow:**

1. User initiates Strava auth → redirected to `/api/strava/auth`
2. Handler calls `stravaClient.getAuthorizationUrl()` → OAuth redirect to Strava
3. User approves → redirected to `/api/strava/callback`
4. Callback exchanges auth code for tokens via `stravaClient.exchangeToken()`
5. Tokens stored in `StravaIntegration` model
6. User triggers sync via `/api/strava/sync` endpoint
7. Sync fetches activities via `stravaClient.getActivities()` with refreshed token
8. Activities normalized and upserted into `TrainingActivity` model

**Nutrition Recommendation Flow:**

1. Daily scheduled job or user navigates to nutrition dashboard
2. `/api/agents/nutrition-plan` handler executes
3. Fetches user's recent activities (14-day window) from `TrainingActivity`
4. Fetches today's `TrainingPlanEntry` if exists
5. Calculates training load metrics (ATL/CTL/ACWR) via `lib/training/load.ts`
6. Sends prompt to LLM with activity summary, plan, and loads
7. LLM returns JSON with calorie estimates and food suggestions
8. Response saved to `DailyRecommendation` model with breakdown by meal timing
9. Frontend renders recommendation with food catalog options

**Training Load Calculation:**

1. Activities retrieved with `startDate`, `duration`, `averageHeartRate`
2. Estimated TSS calculated via heart rate reserve formula
3. Daily loads aggregated by date (sum of all activities per day)
4. Exponential moving averages applied: ATL (7-day), CTL (42-day)
5. ACWR (Acute:Chronic Workload Ratio) = ATL / CTL
6. Metrics used in nutrition plan generation and training analysis

**State Management:**

- **User session state:** NextAuth.js session provider (client-side context)
- **Activity data:** Cached in database only; fetched on-demand via API
- **Training load metrics:** Calculated dynamically when needed (expensive calculation)
- **Daily recommendations:** Stored in `DailyRecommendation`; retrieved and displayed
- **Form state:** React Hook Form (CheckinForm, FeedbackForm, PlanForm)

## Key Abstractions

**StravaClient:**
- Purpose: Encapsulate Strava OAuth2 and API communication
- Examples: `lib/strava/client.ts`
- Pattern: Singleton instance with lazy initialization; environment variable checks prevent crashes if unconfigured
- Methods: `getAuthorizationUrl()`, `exchangeToken()`, `refreshToken()`, `getActivities()`, `deauthorize()`

**TrainingLoadCalculator:**
- Purpose: Domain logic for training stress estimation and load accumulation
- Examples: `lib/training/load.ts`
- Pattern: Pure functions (estimarTssDesdeFc, estimarTrimpBannister) + async data aggregation
- Uses: Heart rate reserve formulas, exponential moving averages

**NutritionEngine:**
- Purpose: Generate personalized meal plans based on training context
- Examples: `lib/nutrition/engine.ts`, `lib/nutrition/catalog.ts`
- Pattern: Rule-based with LLM augmentation; rules determine meal timing/macros, LLM refines
- Inputs: TrainingPlanEntry, TrainingActivity, daily loads, checkin data
- Outputs: NutritionPlanResponse with moment-based meal suggestions

**ActivityResolver:**
- Purpose: Normalize activities from multiple sources (Strava, TrainingPeaks, Garmin, manual)
- Examples: `app/api/activities/route.ts`
- Pattern: Filter by source; calculate derived metrics (TSS, TRIMP, efficiency)
- Ensures: Single source of truth via unique constraint `[userId, externalId, source]`

**AuthGuard:**
- Purpose: Ensure only authenticated, authorized users access endpoints
- Examples: `lib/auth/utils.ts` (requireAuth, getCurrentUser)
- Pattern: Extract JWT from cookies, validate, return user with role
- Throws: Error if not authenticated; called at start of each API handler

## Entry Points

**Web (Next.js App Router):**
- Location: `app/page.tsx`
- Triggers: Browser navigation to root
- Responsibilities: Landing page with integration highlights and CTA buttons

**Dashboard:**
- Location: `app/dashboard/page.tsx`
- Triggers: Authenticated user navigation to `/dashboard`
- Responsibilities: Role-based routing (ATHLETE → AthleteDashboard, COACH → CoachDashboard, NUTRITIONIST → NutritionistDashboard)

**API Routes (82 total, grouped by domain):**
- Auth: `/api/auth/register`, `/api/auth/[...nextauth]`
- Activities: `/api/activities` (GET with filtering by source)
- Strava: `/api/strava/auth`, `/api/strava/callback`, `/api/strava/sync`, `/api/strava/status`, `/api/strava/disconnect`
- TrainingPeaks: `/api/trainingpeaks/auth`, `/api/trainingpeaks/callback`, `/api/trainingpeaks/sync`, `/api/trainingpeaks/status`
- Garmin: `/api/garmin/auth`, `/api/garmin/callback`, `/api/garmin/sync`, `/api/garmin/status`
- Medical: `/api/medical/upload`, `/api/medical/analysis`, `/api/medical/process`, `/api/medical/values`
- Analytics: `/api/analytics/activity-breakdown`, `/api/analytics/heart-rate-zones`, `/api/analytics/performance-trends`, `/api/analytics/training-volume`, `/api/analytics/calendar-heatmap`, `/api/analytics/physical-analysis`
- Agents: `/api/agents/nutrition-plan`, `/api/agents/training-plan`

## Error Handling

**Strategy:** Try-catch at route handler level; console.error for logging; NextResponse with 500 status on failure

**Patterns:**

- **Auth errors:** Throw error in provider → Redirect to `/auth/login`
- **External service errors:** Catch fetch failures → Return 500 with user-friendly message
- **Validation errors:** Type guard checks (e.g., `isActivitySourceValue()`) → Return 400 if invalid
- **Not found:** Query returns null → Return 404 response
- **LLM failures:** Fallback to default suggestions/values (nutrition-plan route shows this pattern)

## Cross-Cutting Concerns

**Logging:**
- Console.error at route handlers for exceptions
- No structured logging service (basic console-based)

**Validation:**
- Type guards at API boundaries (e.g., ActivitySourceValue union validation)
- Zod for form validation (react-hook-form integration in components)

**Authentication:**
- `requireAuth()` call required in every protected route
- Session provider wraps entire app in layout
- JWT tokens stored in secure httpOnly cookies by NextAuth.js

**Authorization:**
- Role checked in dashboard routing (athlete/coach/nutritionist)
- No explicit permission checks per endpoint (auth + role sufficient for MVP)

**External Service Integration:**
- Clients initialized with environment variables checked at runtime
- Tokens stored in database (StravaIntegration, TrainingPeaksIntegration, GarminIntegration)
- Refresh tokens handled per client (Strava has explicit refresh method)

---

*Architecture analysis: 2026-03-22*
