import { prisma } from '@/lib/prisma';
import { GarminAuth, type OAuth1Token, type OAuth2Token, type GarminProfile } from './auth';
import {
  CALENDAR_MONTH_ENDPOINT,
  ACTIVITIES_SEARCH_ENDPOINT,
  ACTIVITY_ENDPOINT,
  ACTIVITY_DETAILS_SUBPATH,
  ACTIVITY_SPLITS_SUBPATH,
  ACTIVITY_HR_ZONES_SUBPATH,
  HEART_RATE_ENDPOINT,
  USER_SUMMARY_ENDPOINT,
  DAILY_STRESS_ENDPOINT,
  BODY_BATTERY_ENDPOINT,
  SLEEP_DAILY_ENDPOINT,
  HRV_ENDPOINT,
  DAILY_RESPIRATION_ENDPOINT,
  DAILY_SPO2_ENDPOINT,
  STEPS_CHART_ENDPOINT,
  FLOORS_CHART_ENDPOINT,
  DAILY_INTENSITY_MINUTES_ENDPOINT,
  VO2_MAX_ENDPOINT,
  TRAINING_READINESS_ENDPOINT,
  TRAINING_STATUS_ENDPOINT,
  PERSONAL_RECORD_ENDPOINT,
  RACE_PREDICTIONS_ENDPOINT,
  RHR_ENDPOINT,
  RHR_METRIC_ID,
  SLEEP_NON_SLEEP_BUFFER_MINUTES,
  DEFAULT_ACTIVITIES_LIMIT,
  DEFAULT_ACTIVITIES_BY_DATE_LIMIT,
  ACTIVITY_DETAILS_MAX_CHART_SIZE,
  ACTIVITY_DETAILS_MAX_POLYLINE_SIZE,
} from './endpoints';

function todayString(): string {
  return new Date().toISOString().split('T')[0]!;
}

export class GarminClient {
  private auth: GarminAuth;

  constructor(auth: GarminAuth) {
    this.auth = auth;
  }

  private get displayName(): string {
    return this.auth.displayName;
  }

  async getActivities(start = 0, limit = DEFAULT_ACTIVITIES_LIMIT, activityType?: string): Promise<unknown> {
    const params = new URLSearchParams({ start: String(start), limit: String(limit) });
    if (activityType) params.set('activityType', activityType);
    return this.auth.request(`${ACTIVITIES_SEARCH_ENDPOINT}?${params}`);
  }

  async getActivitiesByDate(startDate: string, endDate: string, activityType?: string): Promise<unknown[]> {
    const allActivities: unknown[] = [];
    let start = 0;

    while (true) {
      const params = new URLSearchParams({
        startDate,
        endDate,
        start: String(start),
        limit: String(DEFAULT_ACTIVITIES_BY_DATE_LIMIT),
      });
      if (activityType) params.set('activityType', activityType);

      const page = await this.auth.request<unknown[]>(`${ACTIVITIES_SEARCH_ENDPOINT}?${params}`);
      if (!Array.isArray(page) || page.length === 0) break;

      allActivities.push(...page);
      if (page.length < DEFAULT_ACTIVITIES_BY_DATE_LIMIT) break;
      start += DEFAULT_ACTIVITIES_BY_DATE_LIMIT;
    }

    return allActivities;
  }

  async getActivity(activityId: string | number): Promise<unknown> {
    return this.auth.request(`${ACTIVITY_ENDPOINT}/${activityId}`);
  }

  async getActivityDetails(activityId: string | number): Promise<unknown> {
    return this.auth.request(
      `${ACTIVITY_ENDPOINT}/${activityId}/${ACTIVITY_DETAILS_SUBPATH}?maxChartSize=${ACTIVITY_DETAILS_MAX_CHART_SIZE}&maxPolylineSize=${ACTIVITY_DETAILS_MAX_POLYLINE_SIZE}`,
    );
  }

  async getActivitySplits(activityId: string | number): Promise<unknown> {
    return this.auth.request(`${ACTIVITY_ENDPOINT}/${activityId}/${ACTIVITY_SPLITS_SUBPATH}`);
  }

  async getActivityHrZones(activityId: string | number): Promise<unknown> {
    return this.auth.request(`${ACTIVITY_ENDPOINT}/${activityId}/${ACTIVITY_HR_ZONES_SUBPATH}`);
  }

  async getDailySummary(date?: string): Promise<unknown> {
    const d = date ?? todayString();
    return this.auth.request(`${USER_SUMMARY_ENDPOINT}/${this.displayName}?calendarDate=${d}`);
  }

  async getHeartRate(date?: string): Promise<unknown> {
    const d = date ?? todayString();
    return this.auth.request(`${HEART_RATE_ENDPOINT}/${this.displayName}?date=${d}`);
  }

  async getRestingHeartRate(date?: string): Promise<unknown> {
    const d = date ?? todayString();
    return this.auth.request(
      `${RHR_ENDPOINT}/${this.displayName}?fromDate=${d}&untilDate=${d}&metricId=${RHR_METRIC_ID}`,
    );
  }

  async getStress(date?: string): Promise<unknown> {
    return this.auth.request(`${DAILY_STRESS_ENDPOINT}/${date ?? todayString()}`);
  }

  async getBodyBattery(startDate: string, endDate: string): Promise<unknown> {
    return this.auth.request(`${BODY_BATTERY_ENDPOINT}?startDate=${startDate}&endDate=${endDate}`);
  }

  async getRespiration(date?: string): Promise<unknown> {
    return this.auth.request(`${DAILY_RESPIRATION_ENDPOINT}/${date ?? todayString()}`);
  }

  async getSpO2(date?: string): Promise<unknown> {
    return this.auth.request(`${DAILY_SPO2_ENDPOINT}/${date ?? todayString()}`);
  }

  async getIntensityMinutes(date?: string): Promise<unknown> {
    return this.auth.request(`${DAILY_INTENSITY_MINUTES_ENDPOINT}/${date ?? todayString()}`);
  }

  async getStepsChart(date?: string): Promise<unknown> {
    return this.auth.request(`${STEPS_CHART_ENDPOINT}/${this.displayName}?date=${date ?? todayString()}`);
  }

  async getFloors(date?: string): Promise<unknown> {
    return this.auth.request(`${FLOORS_CHART_ENDPOINT}/${date ?? todayString()}`);
  }

  async getSleepData(date?: string): Promise<unknown> {
    const d = date ?? todayString();
    return this.auth.request(
      `${SLEEP_DAILY_ENDPOINT}/${this.displayName}?date=${d}&nonSleepBufferMinutes=${SLEEP_NON_SLEEP_BUFFER_MINUTES}`,
    );
  }

  async getHRV(date?: string): Promise<unknown> {
    return this.auth.request(`${HRV_ENDPOINT}/${date ?? todayString()}`);
  }

  async getVO2Max(date?: string): Promise<unknown> {
    const d = date ?? todayString();
    return this.auth.request(`${VO2_MAX_ENDPOINT}/${d}/${d}`);
  }

  async getTrainingReadiness(date?: string): Promise<unknown> {
    return this.auth.request(`${TRAINING_READINESS_ENDPOINT}/${date ?? todayString()}`);
  }

  async getTrainingStatus(date?: string): Promise<unknown> {
    return this.auth.request(`${TRAINING_STATUS_ENDPOINT}/${date ?? todayString()}`);
  }

  async getPersonalRecords(): Promise<unknown> {
    return this.auth.request(`${PERSONAL_RECORD_ENDPOINT}/${this.displayName}`);
  }

  async getRacePredictions(): Promise<unknown> {
    return this.auth.request(`${RACE_PREDICTIONS_ENDPOINT}/latest/${this.displayName}`);
  }

  async getCalendarMonth(year: number, month: number): Promise<unknown> {
    // month is 1-indexed (January = 1)
    return this.auth.request(`${CALENDAR_MONTH_ENDPOINT}/${year}/month/${month}`);
  }

  async getDailyHealthSnapshot(date?: string): Promise<Record<string, unknown>> {
    const d = date ?? todayString();
    const [summary, heartRate, stress, bodyBattery, sleep, hrv, respiration, spo2, steps, intensityMinutes] =
      await Promise.all([
        this.getDailySummary(d).catch(() => null),
        this.getHeartRate(d).catch(() => null),
        this.getStress(d).catch(() => null),
        this.getBodyBattery(d, d).catch(() => null),
        this.getSleepData(d).catch(() => null),
        this.getHRV(d).catch(() => null),
        this.getRespiration(d).catch(() => null),
        this.getSpO2(d).catch(() => null),
        this.getStepsChart(d).catch(() => null),
        this.getIntensityMinutes(d).catch(() => null),
      ]);

    return { date: d, summary, heartRate, stress, bodyBattery, sleep, hrv, respiration, spo2, steps, intensityMinutes };
  }
}

export async function createGarminClient(userId: string): Promise<GarminClient> {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('GARMIN_EMAIL and GARMIN_PASSWORD environment variables are required');
  }

  const integration = await prisma.garminIntegration.findUnique({ where: { userId } });

  const initialTokens = integration
    ? {
        oauth1Token: integration.oauth1Token as OAuth1Token,
        oauth2Token: integration.oauth2Token as OAuth2Token,
        profile: { displayName: integration.displayName, profileId: integration.profileId } as GarminProfile,
      }
    : null;

  const auth = new GarminAuth(email, password, initialTokens, async (data) => {
    await prisma.garminIntegration.upsert({
      where: { userId },
      create: {
        userId,
        displayName: data.profile.displayName,
        profileId: data.profile.profileId,
        oauth1Token: data.oauth1Token,
        oauth2Token: data.oauth2Token,
      },
      update: {
        displayName: data.profile.displayName,
        profileId: data.profile.profileId,
        oauth1Token: data.oauth1Token,
        oauth2Token: data.oauth2Token,
      },
    });
  });

  return new GarminClient(auth);
}
