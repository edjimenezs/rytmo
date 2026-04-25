# Strava Integration - Complete Implementation Guide

## Overview

This document describes the complete Strava integration implementation for the RytMo athlete performance tracking application. The integration allows athletes to connect their Strava accounts and automatically sync their training activities.

## Features Implemented

1. OAuth2 authentication flow with Strava
2. Automatic token refresh when access tokens expire
3. Activity syncing from Strava to local database
4. Manual sync trigger
5. Disconnect/deauthorize functionality
6. Real-time connection status display
7. Activity list with detailed metrics

## Files Created/Modified

### Backend Files

#### 1. Environment Configuration
- **File**: `.env.example`
- **Purpose**: Template for required environment variables
- **Variables**:
  - `STRAVA_CLIENT_ID`: Your Strava API application client ID
  - `STRAVA_CLIENT_SECRET`: Your Strava API application client secret
  - `STRAVA_REDIRECT_URI`: OAuth callback URL (default: http://localhost:3000/api/strava/callback)

#### 2. Type Definitions
- **File**: `lib/strava/types.ts`
- **Purpose**: TypeScript interfaces for Strava API responses
- **Includes**:
  - StravaTokenResponse
  - StravaAthlete
  - StravaActivity
  - StravaRefreshTokenResponse

#### 3. Strava API Client
- **File**: `lib/strava/client.ts`
- **Purpose**: Core Strava API client with methods for all Strava operations
- **Methods**:
  - `getAuthorizationUrl()`: Generate OAuth authorization URL
  - `exchangeToken()`: Exchange authorization code for access token
  - `refreshToken()`: Refresh expired access token
  - `getActivities()`: Fetch athlete activities with pagination
  - `getActivity()`: Fetch single activity details
  - `deauthorize()`: Revoke application access

#### 4. Strava Utilities
- **File**: `lib/strava/utils.ts`
- **Purpose**: Helper functions for token management and activity syncing
- **Functions**:
  - `getValidAccessToken()`: Get valid access token, auto-refresh if expired
  - `mapStravaActivityTypeToLocal()`: Map Strava activity types to local enum
  - `syncStravaActivity()`: Sync single activity to database
  - `syncRecentStravaActivities()`: Sync multiple activities from specified date range

#### 5. API Routes

##### a. Auth Initiation
- **File**: `app/api/strava/auth/route.ts`
- **Endpoint**: `GET /api/strava/auth`
- **Purpose**: Initiates OAuth flow by redirecting to Strava authorization page
- **Authentication**: Required (NextAuth session)

##### b. OAuth Callback
- **File**: `app/api/strava/callback/route.ts`
- **Endpoint**: `GET /api/strava/callback`
- **Purpose**: Handles OAuth callback, exchanges code for tokens, stores in database
- **Features**:
  - Saves tokens to StravaIntegration table
  - Automatically syncs last 30 days of activities
  - Redirects to dashboard with success/error status

##### c. Activity Sync
- **File**: `app/api/strava/sync/route.ts`
- **Endpoint**: `POST /api/strava/sync`
- **Purpose**: Manually trigger activity sync
- **Request Body**: `{ daysBack?: number }` (default: 30)
- **Authentication**: Required (NextAuth session)

##### d. Disconnect
- **File**: `app/api/strava/disconnect/route.ts`
- **Endpoint**: `POST /api/strava/disconnect`
- **Purpose**: Disconnect Strava integration and revoke access
- **Authentication**: Required (NextAuth session)

##### e. Connection Status
- **File**: `app/api/strava/status/route.ts`
- **Endpoint**: `GET /api/strava/status`
- **Purpose**: Check if user has connected Strava account
- **Authentication**: Required (NextAuth session)

##### f. Activities List
- **File**: `app/api/activities/route.ts`
- **Endpoint**: `GET /api/activities`
- **Purpose**: Fetch user activities with optional filtering
- **Query Parameters**:
  - `source`: Filter by activity source (e.g., STRAVA)
  - `limit`: Number of activities to return (default: 20)

### Frontend Files

#### 6. React Components

##### a. Strava Connection Status
- **File**: `components/strava/StravaConnectionStatus.tsx`
- **Purpose**: Display connection status and provide connect/disconnect buttons
- **Features**:
  - Shows connection status (connected/not connected)
  - Displays last sync time
  - Manual sync button
  - Disconnect button with confirmation
  - Loading states
  - Real-time status updates

##### b. Strava Activities List
- **File**: `components/strava/StravaActivitiesList.tsx`
- **Purpose**: Display list of synced Strava activities
- **Features**:
  - Shows recent activities with detailed metrics
  - Activity type icons
  - Distance, duration, elevation, heart rate
  - Formatted dates and times
  - Empty state message
  - Loading skeleton

##### c. Updated Athlete Dashboard
- **File**: `components/dashboard/AthleteDashboard.tsx`
- **Purpose**: Main athlete dashboard with Strava integration
- **Changes**:
  - Added StravaConnectionStatus component at top
  - Replaced generic activity feed with StravaActivitiesList
  - Removed "Connect Strava" button from Quick Actions (now in status component)

## Database Schema

The Prisma schema already included the necessary models:

### StravaIntegration Model
```prisma
model StravaIntegration {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stravaUserId    String
  accessToken     String
  refreshToken    String
  expiresAt       DateTime
  scope           String
  lastSyncAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### TrainingActivity Model
```prisma
model TrainingActivity {
  id              String         @id @default(cuid())
  userId          String
  name            String
  type            ActivityType
  source          ActivitySource @default(MANUAL)
  externalId      String?        // Strava activity ID
  distance        Float?         // meters
  duration        Int?           // seconds
  elevation       Float?         // meters
  calories        Int?
  averageHeartRate Int?
  maxHeartRate    Int?
  averagePace     Float?         // min/km
  startDate       DateTime
  endDate         DateTime?
  description     String?
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

## Setup Instructions

### 1. Create Strava API Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application:
   - **Application Name**: RytMo (or your app name)
   - **Category**: Choose appropriate category
   - **Club**: Leave blank if not applicable
   - **Website**: Your application URL
   - **Authorization Callback Domain**: 
     - For development: `localhost`
     - For production: `your-domain.com`
3. After creation, you'll receive:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this (keep it secure!)

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Strava credentials:
   ```env
   STRAVA_CLIENT_ID="your-actual-client-id"
   STRAVA_CLIENT_SECRET="your-actual-client-secret"
   STRAVA_REDIRECT_URI="http://localhost:3000/api/strava/callback"
   ```

3. For production, update the redirect URI:
   ```env
   STRAVA_REDIRECT_URI="https://your-domain.com/api/strava/callback"
   ```

### 3. Database Migration

The schema already includes the necessary models. If you need to sync the database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Install Dependencies

All necessary dependencies are already in package.json. If needed:

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## Testing the Integration

### Test OAuth Flow

1. **Login** to your application as an athlete
2. Navigate to the **Dashboard**
3. You should see the "Strava Integration" card
4. Click **"Connect Strava"** button
5. You'll be redirected to Strava's authorization page
6. Click **"Authorize"** on Strava
7. You'll be redirected back to the dashboard
8. The Strava Integration card should now show "Strava Connected"

### Test Activity Sync

1. After connecting Strava, activities from the last 30 days are automatically synced
2. To manually sync:
   - Click the **"Sync Now"** button in the Strava Integration card
   - Wait for the sync to complete
   - You should see an alert with the number of activities synced
   - The page will reload to show updated activities

### Test Activity Display

1. Scroll down to the "Recent Strava Activities" section
2. You should see a list of your synced activities with:
   - Activity name and type icon
   - Date and relative time
   - Distance (if available)
   - Duration (if available)
   - Elevation gain (if available)
   - Average heart rate (if available)
   - Strava logo indicator

### Test Disconnect

1. In the Strava Integration card, click **"Disconnect"**
2. Confirm the action in the dialog
3. The integration should be removed
4. The card should revert to showing the "Connect Strava" button
5. Note: Synced activities remain in the database

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/strava/auth` | GET | Initiate OAuth flow | Yes |
| `/api/strava/callback` | GET | OAuth callback handler | No |
| `/api/strava/sync` | POST | Manually sync activities | Yes |
| `/api/strava/disconnect` | POST | Disconnect Strava | Yes |
| `/api/strava/status` | GET | Get connection status | Yes |
| `/api/activities` | GET | Get user activities | Yes |

## Security Features

1. **Token Encryption**: Tokens are stored in the database. Consider encrypting them at rest for production.
2. **Session Validation**: All API routes validate NextAuth session before processing
3. **Automatic Token Refresh**: Expired tokens are automatically refreshed before API calls
4. **Secure OAuth Flow**: Uses state parameter for CSRF protection
5. **Scoped Access**: Only requests necessary Strava permissions (read, activity:read_all, profile:read_all)

## Error Handling

The integration includes comprehensive error handling:

1. **Connection Errors**: User-friendly messages for failed connections
2. **Token Refresh Failures**: Automatic retry and graceful degradation
3. **API Rate Limits**: Proper error messages (add rate limiting in production)
4. **Network Errors**: Try-catch blocks with console logging
5. **Database Errors**: Transaction rollback and error responses

## Production Considerations

### 1. Token Encryption
For production, consider encrypting tokens in the database:
```typescript
// Add encryption before storing
import crypto from 'crypto';

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. Rate Limiting
Strava has rate limits (100 requests per 15 minutes, 1000 per day per application):
- Implement rate limiting on sync endpoint
- Add queue system for bulk syncing
- Cache frequently accessed data

### 3. Webhook Support
For real-time updates, implement Strava webhooks:
- Create webhook subscription endpoint
- Handle webhook events for new/updated/deleted activities
- Verify webhook signatures

### 4. Background Jobs
Implement background job processing for:
- Automatic periodic syncs
- Bulk activity imports
- Historical data backfill

### 5. Monitoring
Add monitoring for:
- Failed token refreshes
- API errors
- Sync failures
- Connection drop-offs

## Troubleshooting

### Issue: "Failed to initiate Strava authorization"
- Check that environment variables are set correctly
- Verify STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET are correct
- Ensure STRAVA_REDIRECT_URI matches your Strava app settings

### Issue: "Callback fails with error"
- Verify callback domain in Strava app settings matches your domain
- Check that the authorization code hasn't expired
- Review server logs for detailed error messages

### Issue: "No activities syncing"
- Verify Strava account has activities in the date range
- Check that activities are not private
- Review sync logs for API errors
- Ensure token has correct scopes

### Issue: "Token refresh fails"
- Verify refresh token is valid
- Check that Strava app credentials are correct
- Ensure user hasn't revoked access in Strava settings

## Activity Type Mapping

The integration maps Strava activity types to local types:

| Strava Type | Local Type |
|-------------|------------|
| Run | RUNNING |
| Ride | CYCLING |
| Swim | SWIMMING |
| Walk | WALKING |
| Hike | WALKING |
| WeightTraining | WEIGHTLIFTING |
| Yoga | YOGA |
| VirtualRun | RUNNING |
| VirtualRide | CYCLING |
| Other | OTHER |

## Future Enhancements

1. **Strava Segments**: Sync and display segment efforts
2. **Activity Details Page**: Show full activity details with map
3. **Achievements/PRs**: Track personal records from Strava
4. **Goals Integration**: Compare Strava activities against athlete goals
5. **Social Features**: Show kudos and comments from Strava
6. **Activity Export**: Export activities back to Strava
7. **Gear Tracking**: Sync gear/equipment data
8. **Route Library**: Save and share routes from Strava
9. **Training Plans**: Integrate with Strava training plans
10. **Advanced Analytics**: Power metrics, training load, fitness trends

## Support and Resources

- [Strava API Documentation](https://developers.strava.com/docs/)
- [Strava API Playground](https://developers.strava.com/playground/)
- [OAuth 2.0 Flow](https://developers.strava.com/docs/authentication/)
- [Activity Types](https://developers.strava.com/docs/reference/#api-models-ActivityType)
- [Rate Limits](https://developers.strava.com/docs/rate-limits/)

## License

This integration follows the Strava API Agreement and Terms of Service.
