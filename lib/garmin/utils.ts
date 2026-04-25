import { prisma } from '@/lib/prisma';
import { garminClient } from './client';
import { ActivityType } from '@prisma/client';
import { GarminActivity } from './types';

const SOURCE = 'GARMIN' as const;

export async function getGarminAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.garminIntegration.findUnique({ where: { userId } });
  if (!integration) return null;

  const now = new Date();
  if (now >= integration.expiresAt) {
    try {
      const refreshed = await garminClient.refreshToken(integration.refreshToken);
      const expiresAt = new Date(now.getTime() + refreshed.expires_in * 1000);
      await prisma.garminIntegration.update({
        where: { userId },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt,
        },
      });
      return refreshed.access_token;
    } catch (error) {
      console.error('Failed to refresh Garmin token:', error);
      return null;
    }
  }

  return integration.accessToken;
}

function mapGarminTypeToActivityType(type: string): ActivityType {
  const map: Record<string, ActivityType> = {
    RUNNING: ActivityType.RUNNING,
    CYCLING: ActivityType.CYCLING,
    WALKING: ActivityType.WALKING,
    HIIT: ActivityType.WEIGHTLIFTING,
    STRENGTH: ActivityType.WEIGHTLIFTING,
    YOGA: ActivityType.YOGA,
    SWIMMING: ActivityType.SWIMMING,
  };
  return map[type.toUpperCase()] || ActivityType.OTHER;
}

function buildActivityPayload(activity: GarminActivity) {
  const startDate = new Date(activity.startTimeGmt);
  const endDate = new Date(startDate.getTime() + activity.durationInSeconds * 1000);
  const averagePace =
    activity.averagePaceInSecondsPerKilometer && activity.averagePaceInSecondsPerKilometer > 0
      ? activity.averagePaceInSecondsPerKilometer / 60
      : null;

  return {
    name: activity.activityName,
    type: mapGarminTypeToActivityType(activity.activityType),
    source: SOURCE,
    externalId: activity.activityId,
    distance: activity.distanceInMeters ?? null,
    duration: activity.durationInSeconds,
    elevation: activity.elevationGainInMeters ?? null,
    calories: activity.caloriesBurned ?? null,
    averageHeartRate: activity.averageHeartRate ?? null,
    maxHeartRate: activity.maxHeartRate ?? null,
    averagePace,
    startDate,
    endDate,
    updatedAt: new Date(),
  };
}

export async function syncGarminActivity(userId: string, activity: GarminActivity) {
  const payload = buildActivityPayload(activity);
  const existing = await prisma.trainingActivity.findFirst({
    where: {
      userId,
      externalId: activity.activityId,
      source: SOURCE,
    },
  });

  if (existing) {
    await prisma.trainingActivity.update({
      where: { id: existing.id },
      data: payload,
    });
    return;
  }

  await prisma.trainingActivity.create({
    data: {
      userId,
      ...payload,
    },
  });
}

export async function syncRecentGarminActivities(userId: string, daysBack = 30) {
  const accessToken = await getGarminAccessToken(userId);
  if (!accessToken) throw new Error('No valid Garmin access token found');

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const nowDate = new Date();
  const activities = await garminClient.getActivities(
    accessToken,
    startDate.toISOString(),
    nowDate.toISOString(),
    1,
    100
  );

  for (const activity of activities) {
    await syncGarminActivity(userId, activity);
  }

  await prisma.garminIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return activities.length;
}
