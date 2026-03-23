# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- PascalCase for components: `LoginForm.tsx`, `AthleteDashboard.tsx`
- camelCase for utilities and services: `strava/client.ts`, `auth/utils.ts`
- PascalCase for types files: `types.ts` (stores interfaces)
- lowercase with hyphens for route directories: `app/api/strava/auth/`, `app/dashboard/training-load/`

**Functions:**
- camelCase for all functions: `getCurrentUser()`, `requireAuth()`, `calcularRatioReserva()`
- Private class methods start with underscore: `_ensureConfigured()` (though project uses `ensureConfigured()`)
- Exported function names describe action: `exchangeToken()`, `getActivities()`, `matchTrainingPlanEntries()`

**Variables:**
- camelCase for all variables: `userId`, `searchParams`, `isLoading`, `email`, `password`
- SCREAMING_SNAKE_CASE for constants: `DEFAULT_FC_REPOSO`, `DEFAULT_FC_MAX`, `STRAVA_API_BASE_URL`
- Descriptive variable names, no single letters except in short loops: `activities.map((a) => ...)` is acceptable for short iterations

**Types:**
- PascalCase for all types/interfaces: `StravaTokenResponse`, `AuthenticatedUser`, `TrainingPlanRow`
- Use `Type` suffix for exported types: `ActivitySourceValue` (when it's a discriminated type)
- Interface names match their purpose: `PerformanceTrendsChartProps` for React component props

## Code Style

**Formatting:**
- 2-space indentation (consistent with Next.js defaults)
- Line length: no strict limit, but files are readable
- Semicolons: Required at end of statements
- Trailing commas: Used in multiline objects/arrays

**Linting:**
- ESLint 9 configured via `eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom prettier config detected (uses ESLint formatting)
- Runs via `npm run lint`

**Key ESLint Rules Applied:**
- Next.js core web vitals compliance
- TypeScript strict mode rules
- React 19 patterns

## Import Organization

**Order:**
1. External packages: `import { NextResponse } from 'next/server';`
2. Third-party libraries: `import { signIn } from "next-auth/react";`
3. Type imports: `import type { Session } from 'next-auth';`
4. Local absolute imports using `@/` alias: `import { requireAuth } from "@/lib/auth/utils";`
5. No relative imports detected - all use `@/` path alias

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used consistently across all files: `@/lib/`, `@/components/`, `@/app/`, `@/types/`

## Error Handling

**Patterns:**
- try/catch blocks in async functions with logging
- Error console logging: `console.error('Error description:', error);`
- API routes return JSON error responses with HTTP status codes:
  ```typescript
  return NextResponse.json(
    { error: 'Failed to fetch activities' },
    { status: 500 }
  );
  ```
- Server utils throw Error for auth failures: `throw new Error("Unauthorized");`
- Client-side error messages stored in state: `const [error, setError] = useState("");`
- Error messages are user-friendly, not technical

**No custom error classes** detected - uses native `Error` type

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- Used primarily in catch blocks: `console.error('Error description:', error);`
- No debug logging for normal operation
- Errors include context: `console.error("Error initiating Strava auth:", error);`
- Not used in production code paths for tracing

## Comments

**When to Comment:**
- Spanish comments used in business logic: `// No lanzar aquí para permitir que la app arranque aun sin configurar Strava.`
- Sparse commenting - code is self-documenting
- Comments explain "why", not "what"
- Configuration sections have comment headers: `// ============================================`

**JSDoc/TSDoc:**
- Not consistently used
- Component props documented via TypeScript interfaces instead:
  ```typescript
  interface PerformanceTrendsChartProps {
    data: PerformanceData[];
    metric?: PerformanceMetric;
    loading?: boolean;
  }
  ```

## Function Design

**Size:**
- Small functions preferred (most < 50 lines)
- Utility functions are pure and single-purpose
- API route handlers include type safety and parameter validation

**Parameters:**
- Destructure object parameters for React components:
  ```typescript
  export default function AthleteDashboard({ user }: AthleteDashboardProps) {}
  ```
- Optional parameters use `?`: `async getActivities(accessToken: string, page: number = 1, perPage: number = 30, after?: number)`
- Query parameters extracted from request: `const searchParams = request.nextUrl.searchParams;`

**Return Values:**
- Functions return typed values (no implicit `any`)
- API routes return `NextResponse.json()` with data or error
- Database queries return Promise of typed data
- Async functions always return Promise

## Module Design

**Exports:**
- Default exports for React components: `export default function LoginForm() {}`
- Named exports for utilities and clients: `export const stravaClient = new StravaClient();`
- Type-only imports where appropriate: `import type { Session } from 'next-auth';`

**Barrel Files:**
- No barrel export files detected
- Each file exports what it defines

## Class Design

**OOP in SDK clients:**
- Used for external integrations (Strava, Garmin, TrainingPeaks)
- Private properties for configuration: `private clientId?: string;`
- Configuration validation: `ensureConfigured()` called at method start
- Single instance exported as const: `export const stravaClient = new StravaClient();`

**Example Pattern from `StravaClient`:**
```typescript
export class StravaClient {
  private clientId?: string;

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID;
  }

  private ensureConfigured() {
    if (!this.clientId) throw new Error('Not configured');
  }

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    this.ensureConfigured();
    // implementation
  }
}

export const stravaClient = new StravaClient();
```

## Database Patterns

**Prisma ORM:**
- Strongly typed queries with Prisma types: `Prisma.TrainingActivityWhereInput`
- `select` used to minimize returned fields
- `include` for relations
- `findMany`, `findFirst`, `findUnique` for queries
- `createMany`, `updateMany` for batch operations

**Example Pattern:**
```typescript
const activities = await prisma.trainingActivity.findMany({
  where,
  orderBy: { startDate: "desc" },
  take: limit,
  select: {
    id: true,
    name: true,
    // only needed fields
  },
});
```

## API Route Patterns

**Structure in `app/api/*/route.ts`:**
1. Import dependencies
2. Define types/constants for this route
3. Helper functions (validation, calculation)
4. Handler function (GET/POST/etc)
5. Try/catch with logging and error response

**Example:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    // logic here
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "message" }, { status: 500 });
  }
}
```

## React Component Patterns

**Functional components:**
- All components are functional (no classes)
- Props typed via interfaces: `interface ComponentNameProps { ... }`
- Default exports for page components
- Use Client Components explicitly: `"use client";` at top

**State Management:**
- `useState` for local form state
- No global state library detected (Redux, Zustand, etc.)
- Props drilling for data passing between components

**Async/Server Components:**
- Page components in `app/` are Server Components by default
- Client-side components marked with `"use client";`
- No mixing of client/server logic in same component

---

*Convention analysis: 2026-03-22*
