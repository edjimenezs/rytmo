# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Strava API:**
- What: Syncs athletic activities (running, cycling, etc.) from Strava
- Scope: read, activity:read_all, profile:read_all
- SDK/Client: Custom client class at `lib/strava/client.ts`
- Auth: OAuth 2.0 with token refresh
- Env vars:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_REDIRECT_URI` - Callback endpoint
- Endpoints:
  - Auth: `https://www.strava.com/oauth/authorize`
  - Token: `https://www.strava.com/oauth/token`
  - API Base: `https://www.strava.com/api/v3`
- Implementation: `lib/strava/client.ts` - StravaClient class
- Storage: `StravaIntegration` model in Prisma schema stores tokens and sync metadata
- API Route: `/app/api/strava/auth`, `/app/api/strava/sync`, `/app/api/strava/status`, `/app/api/strava/disconnect`

**Garmin API:**
- What: Syncs training activities from Garmin devices/Garmin Connect
- Scope: wellness:activity:read
- SDK/Client: Custom client class at `lib/garmin/client.ts`
- Auth: OAuth 2.0 with token refresh
- Env vars:
  - `GARMIN_CLIENT_ID`
  - `GARMIN_CLIENT_SECRET`
  - `GARMIN_REDIRECT_URI` - Callback endpoint
  - `GARMIN_AUTH_URL` (optional, defaults to Garmin's auth endpoint)
  - `GARMIN_TOKEN_URL` (optional, defaults to Garmin's token endpoint)
  - `GARMIN_API_BASE_URL` (optional, defaults to wellness API)
- Endpoints:
  - Auth: `https://connect.garmin.com/oauth-service/oauth/authorize`
  - Token: `https://connect.garmin.com/oauth-service/oauth/access_token`
  - API Base: `https://apis.garmin.com/wellness-api/rest`
- Implementation: `lib/garmin/client.ts` - GarminClient class
- Storage: `GarminIntegration` model in Prisma schema stores tokens and sync metadata
- API Route: `/app/api/garmin/*` (routes present but not visible in structure scan)

**TrainingPeaks API:**
- What: Syncs training plans and workout data from TrainingPeaks
- Scope: activity:read_all
- SDK/Client: Custom client class at `lib/trainingpeaks/client.ts`
- Auth: OAuth 2.0 with token refresh
- Env vars:
  - `TRAINING_PEAKS_CLIENT_ID`
  - `TRAINING_PEAKS_CLIENT_SECRET`
  - `TRAINING_PEAKS_REDIRECT_URI` - Callback endpoint
  - `TRAINING_PEAKS_AUTH_URL` (optional, defaults to TrainingPeaks auth)
  - `TRAINING_PEAKS_TOKEN_URL` (optional, defaults to TrainingPeaks token)
  - `TRAINING_PEAKS_API_BASE_URL` (optional, defaults to TrainingPeaks API)
- Endpoints:
  - Auth: `https://tpapi.trainingpeaks.com/oauth2/authorize`
  - Token: `https://tpapi.trainingpeaks.com/oauth2/token`
  - API Base: `https://tpapi.trainingpeaks.com`
- Implementation: `lib/trainingpeaks/client.ts` - TrainingPeaksClient class
- Storage: `TrainingPeaksIntegration` model in Prisma schema stores tokens and sync metadata
- API Route: `/app/api/trainingpeaks/*` (routes present but not visible in structure scan)

## Data Storage

**Databases:**
- PostgreSQL 16 (via Docker)
  - Connection string: `DATABASE_URL=postgresql://streho_user:streho_password@postgres:5432/streho_db`
  - Client: Prisma ORM at `lib/prisma.ts`
  - Initialization: `PrismaAdapter` from @auth/prisma-adapter for NextAuth integration
  - Models: User, Profile, Account, Session, MedicalDocument, LabValue, TrainingActivity, TrainingPlanEntry, ManualTrainingEntry, StravaIntegration, GarminIntegration, TrainingPeaksIntegration, CoachAthlete, CoachNote, NutritionistClient, NutritionNote, FoodItem, DailyCheckin, DailyRecommendation, DailyFeedback

**File Storage:**
- Local filesystem only
  - Medical documents stored at: `public/uploads/medical/`
  - File management in: `app/api/medical/upload/route.ts`
  - Implementation: fs module (Node.js native)
  - No cloud storage integration (S3, GCS, etc.) configured
  - TODO: Implement file deletion from storage (noted in `app/api/medical/route.ts`)

**Caching:**
- None detected - No Redis, Memcached, or other caching layer

## Authentication & Identity

**Auth Provider:**
- Custom with NextAuth.js
  - Implementation: `lib/auth/config.ts`
  - Strategy: JWT session tokens
  - Adapter: Prisma-based (stores sessions in PostgreSQL)
  - Provider: CredentialsProvider (email/password login)
  - Callback: Custom JWT and session callbacks to attach user role to tokens
  - Password hashing: bcrypt (6.0.0)
  - Session configuration:
    - Strategy: jwt
    - SignIn page: `/auth/login`
    - Secret: `NEXTAUTH_SECRET` env var

**External OAuth Integrations:**
- Strava OAuth (activity sync)
- Garmin OAuth (activity sync)
- TrainingPeaks OAuth (training plan sync)
- All use Account model in Prisma to store OAuth credentials

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or similar integration

**Logs:**
- Standard console logging (console.error, console.warn, console.log)
- No structured logging framework detected
- Examples: PDF extraction errors logged in `lib/medical/pdfExtractor.ts`

## CI/CD & Deployment

**Hosting:**
- Docker containerized deployment
  - Dockerfile present with multi-stage build (deps → builder → runner)
  - Docker Compose orchestration at `docker-compose.yml`
  - Base image: node:20-alpine
  - Exposes port 3000

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar configured

**Environment:**
- Docker Compose manages local/staging environment
- PostgreSQL 16 container dependency
- Network: Services communicate internally (app to postgres at `postgres:5432`)

## Environment Configuration

**Required env vars:**
```
# Core
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET           # JWT signing secret
NEXTAUTH_URL              # App URL for auth callbacks

# OAuth Providers
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
STRAVA_REDIRECT_URI

GARMIN_CLIENT_ID
GARMIN_CLIENT_SECRET
GARMIN_REDIRECT_URI

TRAINING_PEAKS_CLIENT_ID
TRAINING_PEAKS_CLIENT_SECRET
TRAINING_PEAKS_REDIRECT_URI

# LLM Providers (at least one required for AI agents)
OPENAI_API_KEY
ANTHROPIC_API_KEY
```

**Optional env vars:**
```
GARMIN_AUTH_URL           # Defaults to Garmin's endpoint
GARMIN_TOKEN_URL          # Defaults to Garmin's endpoint
GARMIN_API_BASE_URL       # Defaults to Garmin wellness API

TRAINING_PEAKS_AUTH_URL   # Defaults to TrainingPeaks endpoint
TRAINING_PEAKS_TOKEN_URL  # Defaults to TrainingPeaks endpoint
TRAINING_PEAKS_API_BASE_URL # Defaults to TrainingPeaks API
```

**Secrets location:**
- Development: `.env` file (local, not committed)
- `.env.example` provided for reference
- Docker: Loaded via `env_file: - .env` in docker-compose.yml

## AI/LLM Integration

**AI Providers:**
- OpenAI - GPT-4o-mini model (default)
  - API: `https://api.openai.com/v1/responses`
  - Auth: Bearer token via `OPENAI_API_KEY`
  - Use: Training plan and nutrition plan agents

- Anthropic - Claude 3.5 Sonnet (fallback)
  - API: `https://api.anthropic.com/v1/messages`
  - Auth: x-api-key header via `ANTHROPIC_API_KEY`
  - Version: 2023-06-01
  - Use: Training plan and nutrition plan agents

**Implementation:**
- Unified interface at `lib/ai/llm.ts` with `askLLM()` function
- Provider selection via options parameter (defaults to OpenAI)
- Max output tokens: 800
- Graceful fallback if API keys not configured

**Usage:**
- Training plan generation agent at `/app/api/agents/training-plan/route.ts`
- Nutrition plan generation agent at `/app/api/agents/nutrition-plan/route.ts`

## Medical Document Processing

**PDF Extraction:**
- Library: pdf-parse 1.1.1
- Implementation: `lib/medical/pdfExtractor.ts`
- Supports: PDF files only
- Not yet implemented: OCR for images (TODO noted in code)
- Extracted text stored in `MedicalDocument.extractedText` field

**Lab Value Parsing:**
- Custom parser at `lib/medical/labParser.ts`
- Extracts structured lab values from unstructured text
- Creates `LabValue` records linked to `MedicalDocument`

**Document Management:**
- Upload endpoint: `/app/api/medical/upload/route.ts`
- Query endpoint: `/app/api/medical/route.ts`
- Analysis endpoint: `/app/api/medical/analysis/route.ts`
- Supported types: LAB_RESULT, IMAGING, PRESCRIPTION, MEDICAL_REPORT, OTHER

## Webhooks & Callbacks

**Incoming:**
- Strava callback: `/api/strava/auth` - OAuth callback
- Garmin callback: `/api/garmin/*` - OAuth callback (path inferred)
- TrainingPeaks callback: `/api/trainingpeaks/*` - OAuth callback (path inferred)
- NextAuth callback: `/api/auth/*` - Built-in NextAuth routes

**Outgoing:**
- Strava deauthorization: POST to `https://www.strava.com/api/v3/oauth/deauthorize`
- Garmin revocation: POST to Garmin token revocation endpoint
- TrainingPeaks revocation: POST to TrainingPeaks token revocation endpoint
- No outgoing webhooks to external systems detected

## Data Models & Relationships

**Key Integrations Reflected in Prisma:**
- `StravaIntegration` - Stores OAuth tokens for synced Strava activities
- `GarminIntegration` - Stores OAuth tokens for synced Garmin activities
- `TrainingPeaksIntegration` - Stores OAuth tokens for synced TrainingPeaks data
- `TrainingActivity` - Unified model for activities from all sources (Strava, Garmin, TrainingPeaks, manual)
  - `source: ActivitySource` enum tracks origin (STRAVA, TRAINING_PEAKS, GARMIN, MANUAL, OTHER_APP)
  - `externalId` stores external service activity ID for deduplication

---

*Integration audit: 2026-03-22*
