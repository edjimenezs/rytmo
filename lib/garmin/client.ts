import { GarminTokenResponse, GarminActivity } from './types';

const DEFAULT_AUTH_URL = 'https://connect.garmin.com/oauth-service/oauth/authorize';
const DEFAULT_TOKEN_URL = 'https://connect.garmin.com/oauth-service/oauth/access_token';
const DEFAULT_API_BASE_URL = 'https://apis.garmin.com/wellness-api/rest';

export class GarminClient {
  private clientId?: string;
  private clientSecret?: string;
  private redirectUri?: string;
  private authUrl: string;
  private tokenUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.clientId = process.env.GARMIN_CLIENT_ID;
    this.clientSecret = process.env.GARMIN_CLIENT_SECRET;
    this.redirectUri = process.env.GARMIN_REDIRECT_URI;
    this.authUrl = process.env.GARMIN_AUTH_URL ?? DEFAULT_AUTH_URL;
    this.tokenUrl = process.env.GARMIN_TOKEN_URL ?? DEFAULT_TOKEN_URL;
    this.apiBaseUrl = process.env.GARMIN_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  }

  private ensureConfigured() {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Garmin environment variables are not configured');
    }
  }

  getAuthorizationUrl(state?: string) {
    this.ensureConfigured();
    const params = new URLSearchParams({
      client_id: this.clientId!,
      response_type: 'code',
      redirect_uri: this.redirectUri!,
      scope: 'wellness:activity:read',
    });
    if (state) {
      params.append('state', state);
    }
    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<GarminTokenResponse> {
    this.ensureConfigured();
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri!,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error('Garmin token exchange failed: ' + error);
    }
    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<GarminTokenResponse> {
    this.ensureConfigured();
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error('Garmin token refresh failed: ' + error);
    }
    return response.json();
  }

  async getActivities(
    accessToken: string,
    start?: string,
    end?: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<GarminActivity[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: perPage.toString(),
    });
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);
    const url = `${this.apiBaseUrl}/activity?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error('Garmin fetch activities failed: ' + error);
    }
    return response.json();
  }

  async deauthorize(accessToken: string) {
    const url = `${this.apiBaseUrl}/oauth2/revoke`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: accessToken }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error('Garmin revoke failed: ' + error);
    }
  }
}

export const garminClient = new GarminClient();
