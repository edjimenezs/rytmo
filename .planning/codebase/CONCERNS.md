# Codebase Concerns

**Analysis Date:** 2026-03-22

## Tech Debt

### Incomplete Feature: Image OCR Support

**Issue:** Image file uploads are rejected with a placeholder error message, OCR functionality not implemented.

- **Files:** `lib/medical/pdfExtractor.ts` (lines 38-44)
- **Impact:** Users cannot upload medical images (scans, radiographs). Only PDF uploads work. Feature is partially implemented but blocked.
- **Fix approach:** Either implement Tesseract.js for client-side OCR or remove image upload option from UI. Currently creates confusion.

### Placeholder Profile Implementation

**Issue:** Training profile returns hardcoded defaults instead of reading from database Profile table.

- **Files:** `app/api/training/profile/route.ts` (lines 5-18)
- **Impact:** User FC (max heart rate), FTP (functional threshold power), and VT zones are not personalized. All athletes see same metrics.
- **Fix approach:** Schema has Profile model but fields are missing. Add `fcMax`, `fcReposo`, `ftp`, `vt1`, `vt2` to Profile schema, then read from database.

### Missing File Storage Implementation for Medical Document Deletion

**Issue:** DELETE endpoint deletes database record but doesn't remove actual file from storage.

- **Files:** `app/api/medical/route.ts` (lines 93-95)
- **Impact:** Deleted medical documents remain in storage (S3 or filesystem), consuming space. Only metadata is cleaned.
- **Fix approach:** Implement S3 deletion or filesystem cleanup before database deletion. Add error handling for orphaned files.

### Placeholder Nutrition Macros Logic

**Issue:** Simple heuristic used for calculating macro recommendations, marked as placeholder for nutritionist review.

- **Files:** `app/api/agents/nutrition-plan/route.ts` (line with comment)
- **Impact:** Nutrition recommendations use basic formula, not personalized. Needs validation from nutritionist.
- **Fix approach:** Review with domain expert and implement proper macro cycling based on training load, athlete profile.

## Component Complexity & Maintainability Issues

### Large Monolithic Components

**Issue:** Several UI components exceed 300 lines, mixing data fetching, state management, and rendering logic.

- **Files:**
  - `components/dashboard/PhysicalAnalysisPanel.tsx` (590 lines)
  - `components/dashboard/MedicalDataPage.tsx` (370 lines)
  - `components/dashboard/UploadMedicalDocument.tsx` (334 lines)
  - `components/training-load/LoadContext.tsx` (322 lines)
  - `components/dashboard/LabResultsComparison.tsx` (305 lines)
  - `components/dashboard/ActivitiesPage.tsx` (306 lines)

- **Impact:** Hard to test, difficult to reuse, prone to bugs during refactoring.
- **Fix approach:** Extract data fetching to custom hooks, split rendering into smaller components, separate business logic from UI.

## Type Safety Issues

### Widespread `any` Type Usage

**Issue:** 96 files use `any` type, bypassing TypeScript safety.

- **Files:** Nearly all API routes and components use `any` at some point
  - `app/api/agents/nutrition-plan/route.ts`
  - `app/api/agents/training-plan/route.ts`
  - `app/api/medical/analysis/route.ts`
  - `app/api/medical/values/route.ts`
  - `components/charts/ActivityBreakdownChart.tsx`
  - `components/charts/HeartRateZonesChart.tsx`
  - Many others

- **Impact:** Silent bugs from incorrect data types, autocomplete doesn't work, refactoring is dangerous.
- **Fix approach:** Create proper type definitions for API responses, chart props, and external data. Gradually replace `any` with concrete types.

### Unsafe Type Casting

**Issue:** Cast to `unknown` then to specific types without proper validation.

- **Files:**
  - `components/charts/ActivityBreakdownChart.tsx` (line 136): Cast to `ActivityPieLabelProps`
  - `lib/prisma.ts` (line 3): Cast globalThis to unknown

- **Impact:** Type safety is lost if cast is incorrect, can cause runtime errors.
- **Fix approach:** Use type guards or Zod validation instead of unsafe casts.

## Error Handling & Resilience

### Silent Token Refresh Failures

**Issue:** Integration token refresh functions catch errors and log them but return null silently, potentially breaking dependent features.

- **Files:**
  - `lib/strava/utils.ts` (lines 32-35): Returns null on refresh failure
  - `lib/trainingpeaks/utils.ts` (lines 26-29): Returns null on refresh failure
  - `lib/garmin/utils.ts` (lines 26-29): Returns null on refresh failure

- **Impact:** Failed token refresh causes sync operations to silently fail. User doesn't know their Strava/TrainingPeaks data is stale. No retry mechanism.
- **Fix approach:** Implement exponential backoff retry. Store refresh failure timestamp. Alert user if sync fails repeatedly.

### Incomplete Console Error Handling

**Issue:** Many catch blocks only log errors without re-throwing or handling appropriately.

- **Files:** 31+ files with `console.error` in catch blocks
  - `components/strava/StravaConnectionStatus.tsx` (multiple locations)
  - `components/nutrition/CheckinForm.tsx`
  - `components/dashboard/MedicalDataPage.tsx`
  - `components/dashboard/UploadMedicalDocument.tsx`

- **Impact:** Errors are logged but not propagated to UI. Users get no feedback that something failed.
- **Fix approach:** Use toast/notification system to inform users. Implement user-facing error messages with retry options.

### Absence of Input Validation in API Routes

**Issue:** API routes don't validate incoming data before processing.

- **Files:** 41 API route files
  - `app/api/medical/upload/route.ts` (minimal validation)
  - `app/api/medical/process/route.ts` (no validation)
  - `app/api/checkin/route.ts` (no validation)

- **Impact:** Malformed requests could cause crashes or data corruption. No rate limiting.
- **Fix approach:** Add Zod schemas to all endpoints. Validate before processing. Return clear 400 errors for bad input.

## Security Concerns

### Missing CORS Configuration

**Issue:** No explicit CORS configuration found in Next.js middleware.

- **Files:** API routes in `app/api/`
- **Impact:** Could be vulnerable to CSRF if default Next.js CORS isn't sufficient. External integrations might fail.
- **Fix approach:** Add explicit CORS middleware, whitelist specific origins.

### No Rate Limiting

**Issue:** No rate limiting on API endpoints, especially auth and integration endpoints.

- **Files:** All API routes, particularly:
  - `app/api/auth/*`
  - `app/api/strava/*`
  - `app/api/medical/upload/route.ts`

- **Impact:** Vulnerable to brute force attacks, token exhaustion, storage DoS (large file uploads).
- **Fix approach:** Implement rate limiting middleware (e.g., Redis-based), add upload size validation (already present), add auth attempt limiting.

### Unprotected Medical Document Storage

**Issue:** Medical documents stored by URL without confirmation of access control.

- **Files:** `components/dashboard/UploadMedicalDocument.tsx`, `app/api/medical/upload/route.ts`
- **Impact:** If using public storage, medical documents could be exposed via enumeration.
- **Fix approach:** Verify S3 bucket is private, implement presigned URLs with expiration, add HIPAA compliance audit.

### Credentials in Integration Config

**Issue:** OAuth tokens stored in database without encryption.

- **Files:** `prisma/schema.prisma` (lines 311-360):
  - `StravaIntegration.accessToken` (plain text field)
  - `StravaIntegration.refreshToken` (plain text field)
  - Similar for TrainingPeaksIntegration and GarminIntegration

- **Impact:** Database breach exposes user OAuth credentials to external services.
- **Fix approach:** Encrypt tokens at rest using database encryption or field-level encryption, use envelope encryption pattern.

## Performance & Scaling Issues

### Missing Database Indexes

**Issue:** MedicalDocument queries filter by `processed` but that index may not be used effectively during extraction.

- **Files:** `prisma/schema.prisma` (line 168)
- **Impact:** Scanning unprocessed documents could be slow as volume grows.
- **Fix approach:** Analyze query patterns, add composite indexes for common filter combinations (e.g., userId + processed).

### Lab Value Parsing is Greedy

**Issue:** Lab value extraction uses regex patterns that could match unintended numbers in large PDF text.

- **Files:** `lib/medical/labParser.ts` (lines 55-78)
- **Impact:** Incorrect lab values extracted from PDFs with large numbers (IDs, dates, lab report numbers).
- **Fix approach:** Improve regex specificity, add context-based validation (values near test names), implement confidence scoring.

### Activity Sync Has No Pagination Control

**Issue:** Sync operations fetch fixed 100 items without checking if more exist or implementing continuation tokens.

- **Files:**
  - `lib/strava/utils.ts` (line 119): Hardcoded 100 item limit
  - `lib/trainingpeaks/utils.ts` (line 108): Hardcoded 100 item limit
  - `lib/garmin/utils.ts` (lines 106-111): Uses ISO date range

- **Impact:** Athletes with >100 activities in sync window won't sync all data. Incomplete training history.
- **Fix approach:** Implement pagination with continuation tokens, add batch processing, consider scheduled sync instead of on-demand.

### No Query Result Caching

**Issue:** Analytics queries hit database repeatedly without caching intermediate results.

- **Files:** `app/api/analytics/*` routes
- **Impact:** Dashboard slowdowns under load, repeated database queries for same data.
- **Fix approach:** Add Redis caching for analytics queries with invalidation on activity sync.

## Data Integrity Issues

### Duplicate Activity Records Possible

**Issue:** Unique constraint on `(userId, externalId, source)` could be violated if same activity imported from multiple sources.

- **Files:** `prisma/schema.prisma` (line 257)
- **Impact:** Strava activity synced, then manually imported by user = duplicate in system.
- **Fix approach:** Change unique constraint to include date range, or implement deduplication logic in UI.

### Missing Cascading Deletes for Lab Values

**Issue:** MedicalDocument has cascading delete, but orphaned LabValue records could remain if document ID is null.

- **Files:** `prisma/schema.prisma` (lines 172-193)
- **Impact:** Orphaned lab values consume storage, cause query performance issues.
- **Fix approach:** Ensure `documentId` is NOT NULL, add database-level cascade constraints explicitly.

### No Validation of Lab Value Ranges

**Issue:** Lab values stored without verifying they're within reasonable ranges for humans.

- **Files:** `lib/medical/labParser.ts` (lines 55-78) validation exists but isn't used in all save paths
- **Impact:** Corrupted PDFs or parsing errors could store nonsensical values (e.g., hemoglobin = 50000).
- **Fix approach:** Enforce validation at API layer before saving, not just during parsing.

## Test Coverage Gaps

**Issue:** No test files found in codebase (`__tests__`, `__test__`, `tests/`, `test/` directories don't exist).

- **Impact:** No automated regression detection, refactoring is risky, integration changes are fragile.
- **Critical areas without tests:**
  - Lab value extraction from PDFs
  - Activity sync from external services (Strava, TrainingPeaks, Garmin)
  - Authentication and role-based access
  - Medical document upload and processing
  - Analytics calculations

- **Fix approach:** Add Jest + React Testing Library setup. Start with critical path tests:
  1. Lab value parsing (unit)
  2. Activity sync logic (integration with mocked APIs)
  3. Medical data page (component)
  4. Auth flows (end-to-end)

## Fragile Areas

### ActivityType Mapping Brittleness

**Issue:** External service activity types mapped to local enum using simple object lookups without fallback logging.

- **Files:**
  - `lib/strava/utils.ts` (lines 41-55)
  - `lib/trainingpeaks/utils.ts` (lines 35-49)
  - `lib/garmin/utils.ts` (lines 35-46)

- **Impact:** Unknown activity types silently map to `OTHER`, losing information. No audit trail of dropped types.
- **Fix approach:** Log unmapped types with count, implement telemetry to detect new activity types from APIs.

### Hardcoded Timezone Assumptions

**Issue:** Multiple files use `new Date()` without timezone handling, assuming UTC or system timezone.

- **Files:** Activity date parsing in `**/utils.ts` files, analytics calculations
- **Impact:** Athletes in different timezones see incorrect activity dates, training week calculations off by a day.
- **Fix approach:** Use date library with explicit timezone handling (date-fns already imported), standardize on UTC in database.

### Floating Point Precision in Pace Calculations

**Issue:** Pace calculations use floating point arithmetic without rounding, can produce invalid values.

- **Files:**
  - `components/dashboard/PhysicalAnalysisPanel.tsx` (lines 54-100)
  - `lib/strava/utils.ts` (line 78)
  - `lib/trainingpeaks/utils.ts` (lines 54-57)
  - `lib/garmin/utils.ts` (lines 51-54)

- **Impact:** Display shows pace like `3.9999999:59` instead of `4:00`, confuses users.
- **Fix approach:** Use `toFixed()` or rounding functions consistently before display.

## Abandoned/Incomplete Code Patterns

### Unused Dependencies

**Issue:** Some packages may not be actively used.

- **Files:** `package.json`
- **Risk:** Bloated bundle, security updates to unmaintained packages, unused code paths.
- **Fix approach:** Run `npm audit` regularly, remove unused dependencies, audit npm packages for maintenance status.

### API Consistency Issues

**Issue:** Different integration sync endpoints have slightly different implementations and error handling.

- **Files:**
  - `app/api/strava/sync/route.ts`
  - `app/api/trainingpeaks/sync/route.ts`
  - `app/api/garmin/sync/route.ts`

- **Impact:** Code duplication, bugs fixed in one don't propagate to others.
- **Fix approach:** Refactor to shared sync helper with provider-specific configuration.

## Missing Critical Features

### No Activity Source Conflict Detection

**Issue:** If user connects both Strava and Garmin, same activity could be synced from both services.

- **Impact:** User sees duplicate activities, double-counts training load.
- **Fix approach:** Implement source-aware deduplication using timestamp + duration similarity.

### No Graceful Degradation When Integrations Fail

**Issue:** If Strava connection dies, dashboard doesn't show cached activity data.

- **Impact:** Users lose access to historical data temporarily, confusing UX.
- **Fix approach:** Show stale data with "last synced X hours ago" warning, implement offline mode.

### No Data Export for Users

**Issue:** No ability to export personal training data, medical documents, or analysis in portable format.

- **Impact:** Vendor lock-in, regulatory concern (GDPR data portability), user can't easily switch platforms.
- **Fix approach:** Implement CSV/JSON export endpoints for activities, documents, check-ins.

## Dependencies at Risk

### pdf-parse Import Fallback

**Issue:** PDF parsing has a manual fallback from ESM to CommonJS, indicating potential module incompatibility.

- **Files:** `lib/medical/pdfExtractor.ts` (lines 11-18)
- **Impact:** Complex module resolution, potential for confusion during debugging, may fail in production if fallback isn't tested.
- **Fix approach:** Migrate to pure ESM solution or stable CommonJS version, remove the fallback logic.

### Heavy Dependency on Next.js 16

**Issue:** Using cutting-edge Next.js 16 without long-term support track record.

- **Files:** `package.json` (`next: 16.0.1`)
- **Impact:** Future breaking changes, limited community support for issues.
- **Fix approach:** Monitor Next.js releases, plan migration strategy, use LTS-aware versioning.

---

*Concerns audit: 2026-03-22*
