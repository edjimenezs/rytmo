import { prisma } from '@/lib/prisma';
import { createGarminClient } from './client';
import { ActivityType } from '@prisma/client';

const SOURCE = 'GARMIN' as const;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildActivityPayload(activity: any) {
  const startDate = new Date(activity.startTimeGMT ?? activity.startTimeGmt ?? activity.startTimeLocal);
  const duration = activity.duration ?? activity.durationInSeconds ?? 0;
  const endDate = new Date(startDate.getTime() + duration * 1000);
  const activityType = activity.activityType?.typeKey ?? activity.activityType ?? 'OTHER';
  const averagePace =
    activity.averageSpeed && activity.averageSpeed > 0
      ? 1000 / activity.averageSpeed / 60
      : null;

  return {
    name: activity.activityName ?? 'Garmin Activity',
    type: mapGarminTypeToActivityType(activityType),
    source: SOURCE,
    externalId: String(activity.activityId),
    distance: activity.distance ?? activity.distanceInMeters ?? null,
    duration: Math.round(duration),
    elevation: activity.elevationGain ?? activity.elevationGainInMeters ?? null,
    calories: activity.calories ?? activity.caloriesBurned ?? null,
    averageHeartRate: activity.averageHR ?? activity.averageHeartRate ?? null,
    maxHeartRate: activity.maxHR ?? activity.maxHeartRate ?? null,
    averagePace,
    startDate,
    endDate,
    updatedAt: new Date(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncGarminActivity(userId: string, activity: any) {
  const payload = buildActivityPayload(activity);
  const existing = await prisma.trainingActivity.findFirst({
    where: { userId, externalId: String(activity.activityId), source: SOURCE },
  });

  if (existing) {
    await prisma.trainingActivity.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.trainingActivity.create({ data: { userId, ...payload } });
  }
}

export async function syncRecentGarminActivities(userId: string, daysBack = 30): Promise<number> {
  const client = await createGarminClient(userId);

  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]!;
  const endDate = new Date().toISOString().split('T')[0]!;

  const activities = await client.getActivitiesByDate(startDate, endDate);

  for (const activity of activities) {
    await syncGarminActivity(userId, activity);
  }

  await prisma.garminIntegration.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return activities.length;
}
