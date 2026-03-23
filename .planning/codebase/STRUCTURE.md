# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
streho/
├── app/                          # Next.js App Router pages and API routes
│   ├── page.tsx                  # Landing page (/)
│   ├── layout.tsx                # Root layout with SessionProvider
│   ├── globals.css               # Tailwind + custom styles
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   │   └── page.tsx          # Login form
│   │   └── register/
│   │       └── page.tsx          # Registration form
│   ├── dashboard/                # Role-based dashboard pages
│   │   ├── page.tsx              # Main dashboard routing (redirects by role)
│   │   ├── activities/
│   │   │   └── page.tsx          # Activities list page
│   │   ├── analytics/
│   │   │   └── page.tsx          # Analytics dashboard
│   │   ├── medical/
│   │   │   ├── page.tsx          # Medical data dashboard
│   │   │   └── upload/
│   │   │       └── page.tsx      # Medical document upload
│   │   ├── nutrition-plan/
│   │   │   └── page.tsx          # Nutrition plan view
│   │   ├── training-plan/
│   │   │   └── page.tsx          # Training plan view
│   │   ├── training-load/
│   │   │   └── page.tsx          # Training load analysis
│   │   ├── feedback/
│   │   │   └── page.tsx          # Feedback submission
│   │   ├── plan/
│   │   │   └── page.tsx          # Action plan canvas
│   │   └── checkin/
│   │       └── page.tsx          # Daily checkin form
│   ├── plan/                     # Public plan view
│   │   └── page.tsx              # Daily plan snapshot
│   ├── feedback/                 # Public feedback view
│   │   └── page.tsx              # Feedback submission
│   └── api/                      # 82 RESTful API routes
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.ts      # User registration (POST)
│       │   └── [...nextauth]/
│       │       └── route.ts      # NextAuth.js OAuth handler
│       ├── activities/
│       │   └── route.ts          # List activities with filtering (GET)
│       ├── strava/               # Strava OAuth + sync
│       │   ├── auth/
│       │   │   └── route.ts      # Initiate Strava OAuth
│       │   ├── callback/
│       │   │   └── route.ts      # Strava OAuth callback
│       │   ├── sync/
│       │   │   └── route.ts      # Sync Strava activities
│       │   ├── status/
│       │   │   └── route.ts      # Check Strava connection status
│       │   └── disconnect/
│       │       └── route.ts      # Disconnect Strava account
│       ├── trainingpeaks/        # TrainingPeaks OAuth + sync
│       │   ├── auth/
│       │   ├── callback/
│       │   ├── sync/
│       │   ├── status/
│       │   └── (same pattern as strava)
│       ├── garmin/               # Garmin OAuth + sync
│       │   ├── auth/
│       │   ├── callback/
│       │   ├── sync/
│       │   ├── status/
│       │   └── (same pattern as strava)
│       ├── medical/              # Medical document processing
│       │   ├── upload/
│       │   │   └── route.ts      # Upload PDF/image (POST)
│       │   ├── analysis/
│       │   │   └── route.ts      # AI analysis of document (POST)
│       │   ├── process/
│       │   │   └── route.ts      # Extract lab values (POST)
│       │   ├── values/
│       │   │   └── route.ts      # List extracted lab values (GET)
│       │   └── route.ts          # List medical documents (GET)
│       ├── analytics/            # Data visualization endpoints
│       │   ├── activity-breakdown/
│       │   │   └── route.ts      # Activity distribution (GET)
│       │   ├── calendar-heatmap/
│       │   │   └── route.ts      # Calendar view of activities (GET)
│       │   ├── heart-rate-zones/
│       │   │   └── route.ts      # HR zone distribution (GET)
│       │   ├── performance-trends/
│       │   │   └── route.ts      # Performance over time (GET)
│       │   ├── training-volume/
│       │   │   └── route.ts      # Training hours by activity (GET)
│       │   └── physical-analysis/
│       │       └── route.ts      # Body metrics analysis (GET)
│       ├── agents/               # AI-powered endpoints
│       │   ├── nutrition-plan/
│       │   │   └── route.ts      # Generate daily nutrition plan (GET)
│       │   └── training-plan/
│       │       └── route.ts      # Generate training plan (GET)
│       ├── training/             # Training data endpoints
│       │   ├── plan/
│       │   │   └── route.ts      # Training plan operations
│       │   └── profile/
│       │       └── route.ts      # User training profile
│       ├── nutrition/            # Nutrition endpoints
│       ├── checkin/              # Daily checkin endpoints
│       ├── feedback/             # Feedback endpoints
│       ├── action-plan/          # Action plan endpoints
│       └── daily-plan/           # Daily plan endpoints
├── components/                   # React components (client + server)
│   ├── providers/
│   │   └── SessionProvider.tsx   # NextAuth.js session wrapper
│   ├── auth/
│   │   ├── LoginForm.tsx         # Client component: login form
│   │   └── RegisterForm.tsx      # Client component: registration form
│   ├── dashboard/
│   │   ├── AthleteDashboard.tsx  # Athlete role landing
│   │   ├── CoachDashboard.tsx    # Coach role landing
│   │   ├── NutritionistDashboard.tsx # Nutritionist role landing
│   │   ├── DashboardNav.tsx      # Navigation sidebar
│   │   ├── ActivitiesPage.tsx    # Activities list view
│   │   ├── MedicalDataPage.tsx   # Medical documents list
│   │   ├── TrainingPlanPanel.tsx # Training plan display
│   │   ├── NutritionPanel.tsx    # Nutrition recommendation display
│   │   ├── NutritionAgentPanel.tsx # AI-generated nutrition suggestions
│   │   ├── TrainingPlanAgentPanel.tsx # AI-generated training suggestions
│   │   ├── PhysicalAnalysisPanel.tsx # Body metrics visualization
│   │   ├── LabResultsComparison.tsx # Medical lab value comparison
│   │   ├── UploadMedicalDocument.tsx # File upload form
│   │   ├── MedicalAgentPanel.tsx # AI medical analysis
│   │   ├── MedicalDocumentsCount.tsx # Count badge
│   │   └── ActionCanvas.tsx      # Action plan builder (NEW)
│   ├── charts/                   # Recharts visualizations
│   │   ├── ActivityBreakdownChart.tsx # Pie/bar of activity types
│   │   ├── CalendarHeatmap.tsx   # Activity calendar
│   │   ├── HeartRateZonesChart.tsx # HR zone distribution
│   │   ├── PerformanceTrendsChart.tsx # Line chart over time
│   │   ├── TrainingVolumeChart.tsx # Training hours by type
│   │   ├── StatCard.tsx          # Metric display card
│   │   └── DateRangeSelector.tsx # Date filter control
│   ├── strava/                   # Strava-specific components
│   │   ├── StravaConnectionStatus.tsx # Auth status indicator
│   │   └── StravaActivitiesList.tsx # Activity list from Strava
│   ├── training-load/            # Training load analysis components
│   │   ├── TrainingLoadPage.tsx  # Main training load page
│   │   ├── ListaSesiones.tsx     # Session list view
│   │   ├── GraficoCargas.tsx     # Load chart visualization
│   │   ├── PerfilAtleta.tsx      # Athlete profile section
│   │   ├── GlosarioCarga.tsx     # Load terminology glossary
│   │   ├── PanelRecomendaciones.tsx # Training recommendations
│   │   ├── FormularioSesion.tsx  # Manual session form
│   │   ├── PlanUpload.tsx        # Plan file upload
│   │   ├── PlanMatchList.tsx     # Plan-to-activity matching
│   │   ├── CalendarioEntrenamiento.tsx # Training calendar
│   │   └── LoadContext.tsx       # Context for load data sharing
│   ├── nutrition/                # Nutrition-specific components
│   │   ├── CheckinForm.tsx       # Daily checkin form (client)
│   │   ├── FeedbackForm.tsx      # Daily feedback form (client)
│   │   └── PlanForm.tsx          # Nutrition plan editor
│   ├── integrations/             # Integration UI components
│   │   └── IntegrationCard.tsx   # Service connection card
│   └── (other)                   # Utility components as needed
├── lib/                          # Shared utilities, services, business logic
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth/
│   │   ├── config.ts             # NextAuth.js configuration
│   │   └── utils.ts              # Authentication helpers (requireAuth, getCurrentUser)
│   ├── strava/                   # Strava integration
│   │   ├── client.ts             # StravaClient class (OAuth + API)
│   │   ├── types.ts              # TypeScript types for Strava DTOs
│   │   └── utils.ts              # Helper functions (token refresh, etc.)
│   ├── trainingpeaks/            # TrainingPeaks integration
│   │   ├── client.ts             # TrainingPeaksClient class
│   │   ├── types.ts              # TrainingPeaks DTOs
│   │   └── utils.ts              # Helpers
│   ├── garmin/                   # Garmin integration
│   │   ├── client.ts             # GarminClient class
│   │   ├── types.ts              # Garmin DTOs
│   │   └── utils.ts              # Helpers
│   ├── medical/                  # Medical document processing
│   │   ├── pdfExtractor.ts       # Extract text from PDF using pdf-parse
│   │   ├── medicalAgent.ts       # AI agent for medical document analysis
│   │   └── labParser.ts          # Parse lab values from extracted text
│   ├── training/                 # Training calculations
│   │   ├── load.ts               # TSS/TRIMP/ATL/CTL/ACWR calculations
│   │   └── plan.ts               # Training plan operations
│   ├── nutrition/                # Nutrition engine
│   │   ├── engine.ts             # NutritionEngine class (rule-based + LLM)
│   │   └── catalog.ts            # Food item database and matching
│   ├── action-plan/              # Action plan generation
│   │   └── plan.ts               # Action plan builder
│   ├── ai/                       # LLM integration
│   │   └── llm.ts                # askLLM function (OpenAI or similar)
│   └── utils/                    # Generic utilities
│       └── range.ts              # Range generation helpers
├── prisma/                       # Database schema and seeding
│   ├── schema.prisma             # Prisma data model (15+ models)
│   ├── seed.ts                   # Database seeding script
│   ├── seed/
│   │   └── trainingData.ts       # Training data fixtures
│   └── migrations/               # Auto-generated Prisma migrations
│       ├── 20260321232902_add_nutrition_models/
│       ├── 20260322135059_add_training_plan_entries/
│       └── 20260322233641_ensure_training_plan_metadata/
├── types/                        # Global TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth.js type augmentation (adds role to session)
├── public/                       # Static assets
│   └── training-plans/           # Training plan PDFs
├── .env                          # Environment variables (not committed; secrets here)
├── .env.example                  # Example env template (safe for VCS)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration with path aliases
├── tailwind.config.js            # Tailwind CSS configuration
├── docker-compose.yml            # PostgreSQL dev environment
├── Dockerfile                    # Docker image for deployment
└── README.md                     # Project documentation
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages and API handlers
- Contains: Page components (server-side by default), API route handlers (POST/GET/etc)
- Key files: `layout.tsx` (root wrapper), `page.tsx` (home page), API routes for all features

**components/:**
- Purpose: Reusable React components (client and server)
- Contains: UI building blocks, page sections, integration cards
- Key files: Dashboard routing components, chart components, form components

**lib/:**
- Purpose: Business logic, external service clients, utilities
- Contains: Prisma setup, auth helpers, API clients (Strava/TP/Garmin), domain logic
- Key files: `prisma.ts`, `auth/config.ts`, service clients, calculation engines

**prisma/:**
- Purpose: Database schema definition and migrations
- Contains: Prisma schema with all models, relationships, indexes
- Key files: `schema.prisma` (source of truth for data model)

**types/:**
- Purpose: Global TypeScript type definitions
- Contains: Type augmentation for external libraries (NextAuth.js)
- Key files: `next-auth.d.ts` (extends session with role)

**public/:**
- Purpose: Static assets served directly
- Contains: Images, training plan PDFs, downloadable files
- Key files: None critical; mostly user-uploaded content

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML structure with SessionProvider
- `app/page.tsx`: Landing page with integration highlights
- `app/dashboard/page.tsx`: Dashboard router (redirects by role)
- `app/api/[...nextauth]/route.ts`: NextAuth.js OAuth handler

**Configuration:**
- `lib/auth/config.ts`: NextAuth.js configuration, JWT callbacks
- `lib/strava/client.ts`: Strava API client with OAuth methods
- `lib/trainingpeaks/client.ts`: TrainingPeaks API client
- `lib/garmin/client.ts`: Garmin API client
- `prisma/schema.prisma`: Complete data model with 15+ models
- `package.json`: Dependencies (next, react, prisma, recharts, zod, etc)
- `.env`: Runtime secrets (NEXTAUTH_SECRET, DATABASE_URL, STRAVA_CLIENT_ID, etc)

**Core Logic:**
- `lib/training/load.ts`: Training stress calculations (TSS, TRIMP, ATL, CTL, ACWR)
- `lib/nutrition/engine.ts`: Nutrition plan generation rules + LLM integration
- `lib/nutrition/catalog.ts`: Food database and matching logic
- `lib/medical/medicalAgent.ts`: AI document analysis
- `lib/medical/pdfExtractor.ts`: PDF text extraction (pdf-parse)
- `lib/ai/llm.ts`: LLM integration (generic askLLM function)

**Dashboard Components:**
- `components/dashboard/AthleteDashboard.tsx`: Athlete home page
- `components/dashboard/CoachDashboard.tsx`: Coach home page
- `components/dashboard/NutritionistDashboard.tsx`: Nutritionist home page
- `components/charts/ActivityBreakdownChart.tsx`: Activity type distribution
- `components/training-load/TrainingLoadPage.tsx`: Load analysis page

**Testing:**
- None detected (no .test.ts or .spec.ts files found)

## Naming Conventions

**Files:**
- Page files: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase (e.g., `AthleteDashboard.tsx`)
- Utilities/services: camelCase (e.g., `pdfExtractor.ts`)
- Types: PascalCase or camelCase depending on context (e.g., `types.ts`, `config.ts`)

**Directories:**
- Feature directories: kebab-case (e.g., `training-load/`, `action-plan/`)
- Pages: kebab-case (e.g., `/training-load`, `/nutrition-plan`)
- API routes: Follow feature hierarchy (e.g., `/api/strava/auth`)

**Functions/Classes:**
- Class names: PascalCase (e.g., `StravaClient`, `NutritionEngine`)
- Function names: camelCase (e.g., `estimarTssDesdeFc`, `requireAuth`)
- React components: PascalCase (e.g., `LoginForm`, `ActivityBreakdownChart`)
- Hooks: camelCase with `use` prefix (not seen extensively; mostly direct imports)

**Type Names:**
- TypeScript types: PascalCase (e.g., `ActivitySourceValue`, `NutritionPlanResponse`)
- Enum values: UPPER_SNAKE_CASE (e.g., `UserRole.ATHLETE`, `ActivityType.RUNNING`)
- Database enums: PascalCase in schema; values UPPER_SNAKE_CASE

## Where to Add New Code

**New Feature (e.g., new training module):**
- Primary code: Create feature directory under `lib/` (e.g., `lib/periodization/`) with domain logic
- API endpoint: Add route under `app/api/` (e.g., `app/api/periodization/route.ts`)
- Component: Add under `components/` grouped by feature (e.g., `components/training/PeriodizationPanel.tsx`)
- Types: Declare in same directory or in `types/` if shared
- Database model: Add to `prisma/schema.prisma` and run `prisma migrate dev` to generate migration

**New Component/Module:**
- Location: Create in `components/` with PascalCase filename
- If client-side interactivity: Add `"use client"` directive at top
- If server component: No directive needed (default behavior)
- Imports: Use path aliases from `tsconfig.json` (e.g., `@/components/...`)

**Utilities/Helpers:**
- Shared helpers: `lib/utils/` (e.g., date formatting, range generation)
- Service-specific: Under corresponding `lib/{service}/` (e.g., `lib/strava/utils.ts`)

**API Handlers:**
- Location: `app/api/{feature}/{action}/route.ts`
- Structure: Import `requireAuth()`, use try-catch, return `NextResponse`
- Auth check: First line should be `const user = await requireAuth();`
- Validation: Add type guards at route start (e.g., checking query params)

**Database Changes:**
- Schema edit: Modify `prisma/schema.prisma` directly
- Run migration: `npx prisma migrate dev --name {description}`
- Test changes: `npm run dev` and check seed data

## Special Directories

**prisma/migrations/:**
- Purpose: Auto-generated migration files tracking schema changes
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes (essential for reproducible deployments)
- Changes: Never edit manually; regenerate via Prisma CLI

**public/training-plans/:**
- Purpose: Store user-uploaded training plan PDFs
- Generated: No (uploaded by users via UI)
- Committed: No (add to .gitignore)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No

---

*Structure analysis: 2026-03-22*
