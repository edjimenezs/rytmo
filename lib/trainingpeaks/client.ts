import { TrainingPeaksTokenResponse, TrainingPeaksActivity } from './types';

const DEFAULT_AUTH_URL = 'https://tpapi.trainingpeaks.com/oauth2/authorize';
const DEFAULT_TOKEN_URL = 'https://tpapi.trainingpeaks.com/oauth2/token';
const DEFAULT_API_BASE_URL = 'https://tpapi.trainingpeaks.com';

export class TrainingPeaksClient {
  private clientId?: string;
  private clientSecret?: string;
  private redirectUri?: string;
  private authUrl: string;
  private tokenUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.clientId = process.env.TRAINING_PEAKS_CLIENT_ID;
    this.clientSecret = process.env.TRAINING_PEAKS_CLIENT_SECRET;
    this.redirectUri = process.env.TRAINING_PEAKS_REDIRECT_URI;
    this.authUrl = process.env.TRAINING_PEAKS_AUTH_URL ?? DEFAULT_AUTH_URL;
    this.tokenUrl = process.env.TRAINING_PEAKS_TOKEN_URL ?? DEFAULT_TOKEN_URL;
    this.apiBaseUrl = process.env.TRAINING_PEAKS_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  }

  private ensureConfigured() {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('TrainingPeaks environment variables are not configured');
    }
  }

  getAuthorizationUrl(state?: string) {
    this.ensureConfigured();
    const params = new URLSearchParams({
      client_id: this.clientId!,
      response_type: 'code',
      redirect_uri: this.redirectUri!,
      scope: 'activity:read_all',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<TrainingPeaksTokenResponse> {
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
      const errorText = await response.text();
      throw new Error('TrainingPeaks token exchange failed: ' + errorText);
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<TrainingPeaksTokenResponse> {
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
      const errorText = await response.text();
      throw new Error('TrainingPeaks token refresh failed: ' + errorText);
    }

    return response.json();
  }

  async getActivities(
    accessToken: string,
    page: number = 1,
    perPage: number = 30,
    after?: number,
    before?: number
  ): Promise<TrainingPeaksActivity[]> {
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

    const url = `${this.apiBaseUrl}/v2/athlete/training_events?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('TrainingPeaks fetch activities failed: ' + errorText);
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
      const errorText = await response.text();
      throw new Error('TrainingPeaks revoke failed: ' + errorText);
    }
  }
}

export const trainingPeaksClient = new TrainingPeaksClient();
