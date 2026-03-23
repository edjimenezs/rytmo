# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript ^5 - Used throughout the codebase for all source files (`.ts`, `.tsx`)
- JavaScript - React components and Next.js configuration

**Secondary:**
- SQL - Prisma schema and PostgreSQL queries
- Bash - Docker and deployment scripts

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Specified in Dockerfile and package.json configuration
- Next.js 16.0.1 - Full-stack React framework with server-side rendering

**Package Manager:**
- npm - Used with `npm ci` in Docker for production builds
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.0.1 - API routes, SSR, deployment target
- React 19.2.0 - UI components and state management
- React DOM 19.2.0 - React rendering

**Authentication:**
- next-auth 4.24.13 - Session management and authentication
- @auth/prisma-adapter 2.11.1 - NextAuth database adapter for Prisma

**Database:**
- Prisma 6.18.0 - ORM for PostgreSQL database operations
- @prisma/client 6.18.0 - Runtime client for database queries

**Testing:**
- None detected in dependencies

**Build/Dev:**
- TypeScript 5 - Type checking and compilation
- ESLint 9 - Code linting with Next.js config
- eslint-config-next 16.0.1 - Next.js-specific linting rules
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind

## Key Dependencies

**Critical:**
- bcrypt 6.0.0 - Password hashing for authentication
- date-fns 4.1.0 - Date manipulation and formatting
- react-hook-form 7.66.0 - Form state management
- @hookform/resolvers 5.2.2 - Form validation resolvers
- zod 4.1.12 - TypeScript-first schema validation
- recharts 3.3.0 - React charting library for analytics
- pdf-parse 1.1.1 - PDF text extraction for medical documents
- dotenv 17.2.3 - Environment variable loading

**Infrastructure:**
- None (no Redis, message queues, or external caching in dependencies)

## Configuration

**Environment:**
- Configuration via `.env` file (referenced in docker-compose.yml)
- Environment variables for:
  - Database connection (`DATABASE_URL`)
  - Authentication (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
  - External OAuth providers (Strava, Garmin, TrainingPeaks)
  - LLM providers (OpenAI, Anthropic)
- `.env.example` present for documentation of required variables

**Build:**
- Next.js webpack build via `npm run build`
- Prisma client generation on postinstall (`prisma generate`)
- TypeScript compilation with strict mode enabled
- Path aliases configured: `@/*` maps to project root

**TypeScript Configuration:**
- Target: ES2017
- Module: esnext with bundler resolution
- Strict mode enabled
- JSX: react-jsx
- Incremental compilation enabled
- Next.js plugin for type generation

## Platform Requirements

**Development:**
- Node.js 20+
- npm or npx
- TypeScript knowledge
- PostgreSQL (local or containerized)

**Production:**
- Docker (Alpine Linux base)
- PostgreSQL 16 (via docker-compose)
- Exposed ports: 3000 (app), 5433 (database)
- Environment file configuration required

## Database

**Primary:**
- PostgreSQL 16 (Alpine) - Relational database via docker-compose
- Connection: `postgresql://streho_user:streho_password@postgres:5432/streho_db`
- Prisma ORM manages schema and migrations
- Migrations stored in `prisma/migrations/`

## Dev Dependencies Details

**Type Definitions:**
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- @types/bcrypt 6.0.0 - Bcrypt type definitions
- @types/date-fns 2.5.3 - date-fns type definitions

**Tooling:**
- ts-node 10.9.2 - TypeScript execution in Node.js (for scripts)

## Feature Flags & Optional Integrations

**Configured but Optional:**
- Strava API integration (conditional on `STRAVA_CLIENT_ID` presence)
- Garmin API integration (conditional on `GARMIN_CLIENT_ID` presence)
- TrainingPeaks API integration (conditional on `TRAINING_PEAKS_CLIENT_ID` presence)
- OpenAI integration (conditional on `OPENAI_API_KEY` presence)
- Anthropic integration (conditional on `ANTHROPIC_API_KEY` presence)

All integrations gracefully degrade if environment variables are not configured.

---

*Stack analysis: 2026-03-22*
