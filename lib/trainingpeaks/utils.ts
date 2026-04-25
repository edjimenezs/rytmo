import { prisma } from '@/lib/prisma';
import { trainingPeaksClient } from './client';
import { ActivityType } from '@prisma/client';
import { TrainingPeaksActivity } from './types';

const SOURCE = 'TRAINING_PEAKS' as const;

export async function getTrainingPeaksAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.trainingPeaksIntegration.findUnique({ where: { userId } });
  if (!integration) return null;

  const now = new Date();
  if (now >= integration.expiresAt) {
    try {
      const refreshed = await trainingPeaksClient.refreshToken(integration.refreshToken);
      const expiresAt = new Date(now.getTime() + refreshed.expires_in * 1000);
      await prisma.trainingPeaksIntegration.update({
        where: { userId },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt,
        },
      });
      return refreshed.access_token;
    } catch (error) {
      console.error('Failed to refresh TrainingPeaks token:', error);
      return null;
    }
  }

  return integration.accessToken;
}

function mapSportToActivityType(sport: string): ActivityType {
  const map: Record<string, ActivityType> = {
    Run: ActivityType.RUNNING,
    Ride: ActivityType.CYCLING,
    Bike: ActivityType.CYCLING,
    Cycling: ActivityType.CYCLING,
    Swim: ActivityType.SWIMMING,
    Strength: ActivityType.WEIGHTLIFTING,
    BikeRun: ActivityType.RUNNING,
    Yoga: ActivityType.YOGA,
    Walk: ActivityType.WALKING,
    Hike: ActivityType.WALKING,
  };
  return map[sport] || ActivityType.OTHER;
}

function buildActivityPayload(activity: TrainingPeaksActivity) {
  const startDate = new Date(activity.start_time);
  const endDate = new Date(startDate.getTime() + (activity.duration_sec * 1000));
  const averagePace =
    activity.average_speed_mps && activity.average_speed_mps > 0
      ? (1000 / 60) / activity.average_speed_mps
      : null;

  return {
    name: activity.title,
    type: mapSportToActivityType(activity.sport),
    source: SOURCE,
    externalId: activity.id,
    distance: activity.distance_meters ?? null,
    duration: activity.duration_sec,
    elevation: activity.elevation_gain ?? null,
    calories: activity.calories ?? null,
    averageHeartRate: activity.average_heartrate ?? null,
    maxHeartRate: activity.max_heartrate ?? null,
    averagePace,
    startDate,
    endDate,
    updatedAt: new Date(),
  };
}

export async function syncTrainingPeaksActivity(userId: string, activity: TrainingPeaksActivity) {
  const payload = buildActivityPayload(activity);
  const existing = await prisma.trainingActivity.findFirst({
    where: {
      userId,
      externalId: activity.id,
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

export async function syncRecentTrainingPeaksActivities(userId: string, daysBack = 30) {
  const accessToken = await getTrainingPeaksAccessToken(userId);
  if (!accessToken) throw new Error('No valid TrainingPeaks access token found');

  const after = Math.floor((Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000);
  const activities = await trainingPeaksClient.getActivities(accessToken, 1, 100, after);

  for (const activity of activities) {
    await syncTrainingPeaksActivity(userId, activity);
  }

  await prisma.trainingPeaksIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return activities.length;
}
