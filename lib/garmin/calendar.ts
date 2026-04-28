import { createGarminClient } from './client';

export type ScheduledWorkout = {
  id: number;
  workoutId?: number;
  title: string;
  date: string;
  durationSeconds?: number;
  activityTypeKey?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCalendarItems(raw: any, targetDate: string): ScheduledWorkout[] {
  const items: unknown[] = Array.isArray(raw?.calendarItems) ? raw.calendarItems : [];
  const results: ScheduledWorkout[] = [];

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const i = item as any;
    if (i.itemType !== 'workout' && i.itemType !== 'training') continue;
    const itemDate: string = i.date ?? i.startTimestampLocal?.slice(0, 10) ?? '';
    if (itemDate !== targetDate) continue;

    results.push({
      id: i.id,
      workoutId: i.workoutId ?? undefined,
      title: i.title ?? i.workoutName ?? 'Entreno programado',
      date: itemDate,
      durationSeconds: i.duration ?? i.durationInSeconds ?? undefined,
      activityTypeKey: i.activityType?.typeKey ?? i.activityTypeKey ?? undefined,
    });
  }

  return results;
}

export async function getTodayScheduledWorkouts(userId: string, date?: string): Promise<ScheduledWorkout[]> {
  const targetDate = date ?? new Date().toISOString().split('T')[0]!;
  const [year, monthStr] = targetDate.split('-');
  const month = parseInt(monthStr!, 10);

  const client = await createGarminClient(userId);
  const raw = await client.getCalendarMonth(parseInt(year!, 10), month);
  return parseCalendarItems(raw, targetDate);
}
