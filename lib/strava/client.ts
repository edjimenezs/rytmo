import { StravaTokenResponse, StravaActivity, StravaRefreshTokenResponse } from './types';

const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export class StravaClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Strava environment variables are not configured');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all,profile:read_all',
    });

    if (state) {
      params.append('state', state);
    }

    return STRAVA_AUTH_URL + '?' + params.toString();
  }

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to exchange token: ' + error);
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<StravaRefreshTokenResponse> {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to refresh token: ' + error);
    }

    return response.json();
  }

  async getActivities(
    accessToken: string,
    page: number = 1,
    perPage: number = 30,
    after?: number,
    before?: number
  ): Promise<StravaActivity[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (after) {
      params.append('after', after.toString());
    }

    if (before) {
      params.append('before', before.toString());
    }

    const url = STRAVA_API_BASE_URL + '/athlete/activities?' + params.toString();
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to fetch activities: ' + error);
    }

    return response.json();
  }

  async getActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
    const url = STRAVA_API_BASE_URL + '/activities/' + activityId;
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to fetch activity: ' + error);
    }

    return response.json();
  }

  async deauthorize(accessToken: string): Promise<void> {
    const url = STRAVA_API_BASE_URL + '/oauth/deauthorize';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to deauthorize: ' + error);
    }
  }
}

export const stravaClient = new StravaClient();
