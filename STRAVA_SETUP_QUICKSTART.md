# Strava Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Create Strava API App (2 minutes)

1. Visit: https://www.strava.com/settings/api
2. Click "Create App" or use existing app
3. Fill in:
   - App Name: `RytMo` (or your name)
   - Website: `http://localhost:3000`
   - Authorization Callback Domain: `localhost`
4. Save and copy:
   - Client ID
   - Client Secret

### Step 2: Configure Environment (1 minute)

1. Create `.env` file (or update existing):
   ```bash
   cp .env.example .env
   ```

2. Add your Strava credentials to `.env`:
   ```env
   STRAVA_CLIENT_ID="12345"
   STRAVA_CLIENT_SECRET="abcdef123456789"
   STRAVA_REDIRECT_URI="http://localhost:3000/api/strava/callback"
   ```

### Step 3: Start the App (1 minute)

```bash
npm run dev
```

### Step 4: Test It (1 minute)

1. Open: http://localhost:3000
2. Login to your app
3. Go to Dashboard
4. Click "Connect Strava" button
5. Authorize on Strava
6. Done! Activities will sync automatically

## What You Get

- Automatic OAuth2 authentication
- Activity syncing (last 30 days on connect)
- Manual sync button
- Activity list with metrics:
  - Distance, duration, elevation
  - Heart rate data
  - Activity type icons
- Disconnect functionality
- Token auto-refresh

## File Structure

```
lib/strava/
  ├── types.ts          # TypeScript interfaces
  ├── client.ts         # Strava API client
  └── utils.ts          # Helper functions

app/api/strava/
  ├── auth/route.ts     # Initiate OAuth
  ├── callback/route.ts # OAuth callback
  ├── sync/route.ts     # Manual sync
  ├── disconnect/route.ts # Disconnect
  └── status/route.ts   # Connection status

components/strava/
  ├── StravaConnectionStatus.tsx  # Status card
  └── StravaActivitiesList.tsx    # Activity list
```

## Troubleshooting

**Issue**: Can't connect to Strava
- Check Client ID/Secret in `.env`
- Verify callback domain in Strava app: `localhost`

**Issue**: No activities showing
- Click "Sync Now" button
- Check if you have activities in last 30 days on Strava
- Make sure activities aren't private

**Issue**: "Environment variables not configured"
- Restart dev server after updating `.env`
- Verify all three STRAVA_* variables are set

## Production Deployment

1. Update Strava app callback domain: `your-domain.com`
2. Update `.env`:
   ```env
   STRAVA_REDIRECT_URI="https://your-domain.com/api/strava/callback"
   ```
3. Deploy!

## Need Help?

See full documentation: `STRAVA_INTEGRATION.md`
