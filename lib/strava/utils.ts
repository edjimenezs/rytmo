import { prisma } from '@/lib/prisma';
import { stravaClient } from './client';
import { ActivityType, ActivitySource } from '@prisma/client';
import { StravaActivity } from './types';

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.stravaIntegration.findUnique({
    where: { userId },
  });

  if (!integration) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(integration.expiresAt);

  if (now >= expiresAt) {
    try {
      const refreshed = await stravaClient.refreshToken(integration.refreshToken);
      
      await prisma.stravaIntegration.update({
        where: { userId },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: new Date(refreshed.expires_at * 1000),
        },
      });

      return refreshed.access_token;
    } catch (error) {
      console.error('Failed to refresh Strava token:', error);
      return null;
    }
  }

  return integration.accessToken;
}

export function mapStravaActivityTypeToLocal(stravaType: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    'Run': ActivityType.RUNNING,
    'Ride': ActivityType.CYCLING,
    'Swim': ActivityType.SWIMMING,
    'Walk': ActivityType.WALKING,
    'Hike': ActivityType.WALKING,
    'WeightTraining': ActivityType.WEIGHTLIFTING,
    'Yoga': ActivityType.YOGA,
    'VirtualRun': ActivityType.RUNNING,
    'VirtualRide': ActivityType.CYCLING,
  };

  return typeMap[stravaType] || ActivityType.OTHER;
}

export async function syncStravaActivity(userId: string, stravaActivity: StravaActivity) {
  const existingActivity = await prisma.trainingActivity.findFirst({
    where: {
      userId,
      externalId: stravaActivity.id.toString(),
      source: ActivitySource.STRAVA,
    },
  });

  if (existingActivity) {
    await prisma.trainingActivity.update({
      where: { id: existingActivity.id },
      data: {
        name: stravaActivity.name,
        type: mapStravaActivityTypeToLocal(stravaActivity.type),
        distance: stravaActivity.distance,
        duration: stravaActivity.moving_time,
        elevation: stravaActivity.total_elevation_gain,
        calories: stravaActivity.calories || null,
        averageHeartRate: stravaActivity.average_heartrate || null,
        maxHeartRate: stravaActivity.max_heartrate || null,
        averagePace: stravaActivity.average_speed > 0 
          ? (1000 / 60) / stravaActivity.average_speed 
          : null,
        startDate: new Date(stravaActivity.start_date),
        endDate: new Date(new Date(stravaActivity.start_date).getTime() + stravaActivity.elapsed_time * 1000),
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.trainingActivity.create({
      data: {
        userId,
        name: stravaActivity.name,
        type: mapStravaActivityTypeToLocal(stravaActivity.type),
        source: ActivitySource.STRAVA,
        externalId: stravaActivity.id.toString(),
        distance: stravaActivity.distance,
        duration: stravaActivity.moving_time,
        elevation: stravaActivity.total_elevation_gain,
        calories: stravaActivity.calories || null,
        averageHeartRate: stravaActivity.average_heartrate || null,
        maxHeartRate: stravaActivity.max_heartrate || null,
        averagePace: stravaActivity.average_speed > 0 
          ? (1000 / 60) / stravaActivity.average_speed 
          : null,
        startDate: new Date(stravaActivity.start_date),
        endDate: new Date(new Date(stravaActivity.start_date).getTime() + stravaActivity.elapsed_time * 1000),
      },
    });
  }
}

export async function syncRecentStravaActivities(userId: string, daysBack: number = 30) {
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    throw new Error('No valid Strava access token found');
  }

  const afterTimestamp = Math.floor((Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000);
  
  const activities = await stravaClient.getActivities(accessToken, 1, 100, afterTimestamp);
  
  for (const activity of activities) {
    await syncStravaActivity(userId, activity);
  }

  await prisma.stravaIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return activities.length;
}
