# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Status:** Not detected

**No test framework is configured in this project.**

The `package.json` contains no testing dependencies:
- No `jest`, `vitest`, `mocha`, or other test runners
- No assertion libraries like `chai`, `expect.js`, or `@testing-library`
- No test configuration files (`jest.config.js`, `vitest.config.ts`, etc.)

**Test Run Commands:** Not available

No test scripts defined in `package.json`. Available scripts are:
```bash
npm run dev        # next dev -p 3001
npm run build      # next build --webpack
npm run start      # next start -p 3001
npm run lint       # eslint
npm run postinstall # prisma generate
```

## Test File Organization

**Location:** No test files exist

No test files detected in the codebase (`.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx`).

**Search Results:**
- 0 co-located tests (same directory as source)
- 0 separate test directories
- 0 test fixtures or factories

## Test Structure

**Not applicable** - No tests present

## Mocking

**Not applicable** - No testing framework configured

## Fixtures and Factories

**Not applicable** - No test infrastructure in place

## Coverage

**Requirements:** No coverage enforcement detected

No coverage configuration found. Coverage tools would require a test framework to be installed first.

## Test Types

### Unit Tests
**Not present**

No isolated unit tests for:
- Utility functions (`lib/auth/utils.ts`, `lib/strava/client.ts`)
- Helper functions (`lib/training/plan.ts`)
- Type guards (`app/api/activities/route.ts`)

Examples of functions that should have unit tests but don't:
```typescript
// lib/training/plan.ts - CSV parsing
function parseTrainingPlanCsv(contents: string): TrainingPlanRow[]

// app/api/activities/route.ts - calculations
function calcularRatioReserva(fcMedia?: number | null, ...)
function estimarTrimpBannister(duracionSeg?: number | null, ...)

// lib/auth/utils.ts - auth utilities
async function requireAuth(): Promise<AuthenticatedUser>
```

### Integration Tests
**Not present**

No tests for:
- API route handlers and their database interactions
- Prisma client operations
- External API integrations (Strava, Garmin, TrainingPeaks)
- Auth flow (login, registration, token refresh)

### E2E Tests
**Not present** - Framework not configured

No end-to-end tests for user workflows.

## Why Testing is Missing

**Likely Factors:**
1. **Early stage project** - Focus on rapid feature development
2. **No test infrastructure** - Would need to install jest/vitest and dependencies
3. **Existing coverage gaps** - Critical paths not covered:
   - Authentication and authorization
   - CSV parsing for training plans
   - External API token exchanges
   - Database transactions

## Testing Recommendations

**Priority 1 - Add Test Framework:**
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

Choose `vitest` because:
- Faster than Jest
- Better TypeScript support
- ESM native (matches project setup)
- Simpler config for Next.js 16

**Priority 2 - Critical Test Coverage Areas:**

1. **Auth utilities** (`lib/auth/utils.ts`)
   - `getCurrentUser()` - returns session or null
   - `requireAuth()` - throws on missing session
   - `requireRole()` - checks user role

2. **Type guards and validation** (`app/api/activities/route.ts`)
   - `isActivitySourceValue()` - validates enum
   - `parseLimit()` - bounds checking
   - Heart rate zone calculations

3. **CSV parsing** (`lib/training/plan.ts`)
   - `parseTrainingPlanCsv()` - handles edge cases
   - `splitCsvLine()` - quote handling
   - Date normalization

4. **API route handlers**
   - GET `/api/activities` with/without auth
   - GET `/api/strava/auth`
   - POST token refresh flows

**Priority 3 - Component Testing:**
- Form submission (LoginForm, RegisterForm)
- Chart rendering with empty/full data states
- Conditional rendering based on user role

## Example Test Structure (if implemented)

**File placement:**
```
lib/auth/utils.ts          → lib/auth/__tests__/utils.test.ts
lib/training/plan.ts       → lib/training/__tests__/plan.test.ts
app/api/activities/route.ts → app/api/activities/__tests__/route.test.ts
components/auth/LoginForm.tsx → components/auth/__tests__/LoginForm.test.tsx
```

**Potential test pattern using vitest:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth } from '@/lib/auth/utils';
import { getServerSession } from 'next-auth';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Auth Utils', () => {
  describe('requireAuth', () => {
    it('returns user when session exists', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'ATHLETE' };
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: mockUser,
      });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
    });

    it('throws error when no session', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });
});
```

## Current State

**Test Coverage:** 0%

**No tests exist for:**
- Server-side business logic
- API routes
- React components
- Utility functions
- Database operations

**Risk:** High priority functionality lacks automated testing safeguards.

---

*Testing analysis: 2026-03-22*
