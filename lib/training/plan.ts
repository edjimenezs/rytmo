import { Prisma, TrainingActivity } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TrainingPlanRow = {
  date: string;
  sessionType: string;
  title: string;
  durationMinutes?: number;
  distanceKm?: number;
  tss?: number;
  notes?: string;
};

export type TrainingPlanEntryResponse = {
  id: string;
  date: string;
  sessionType: string;
  title: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  tss?: number | null;
  notes?: string | null;
  matchedActivity?: {
    id: string;
    name: string;
    type: TrainingActivity["type"];
    source: TrainingActivity["source"];
    startDate: string;
    duration?: number | null;
  } | null;
};

const EXPECTED_COLUMNS: Record<string, keyof TrainingPlanRow> = {
  date: "date",
  session_type: "sessionType",
  sessiontype: "sessionType",
  title: "title",
  duration_minutes: "durationMinutes",
  durationmin: "durationMinutes",
  distance_km: "distanceKm",
  distance: "distanceKm",
  tss: "tss",
  notes: "notes",
};

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

type DayType = "rest" | "moderate" | "high";

function deriveDayType(row: TrainingPlanRow): DayType {
  const tss = row.tss ?? 0;
  if (tss >= 150) return "high";
  if (tss >= 60) return "moderate";
  return "rest";
}

function computeFocus(dayType: DayType): string {
  if (dayType === "high") return "energy availability";
  if (dayType === "moderate") return "performance + recovery";
  return "recovery";
}

function needsIntraFuel(row: TrainingPlanRow): boolean {
  const duration = row.durationMinutes ?? 0;
  return (row.tss ?? 0) >= 120 || duration >= 90;
}

export function parseTrainingPlanCsv(contents: string): TrainingPlanRow[] {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) {
    return [];
  }

  const header = lines.shift()!;
  const columns = header
    .split(",")
    .map((col) => col.trim().toLowerCase().replace(/\s+/g, "_"));

  const rows: TrainingPlanRow[] = [];
  lines.forEach((line) => {
    const values = splitCsvLine(line);
    if (values.length === 0) return;
    const row: Partial<TrainingPlanRow> = {};
    columns.forEach((column, index) => {
      const key = EXPECTED_COLUMNS[column];
      if (!key) return;
      const raw = values[index]?.trim() ?? "";
      if (raw === "") return;
      if (key === "durationMinutes" || key === "distanceKm" || key === "tss") {
        const num = Number(raw);
        if (!Number.isNaN(num)) {
          row[key] = num;
        }
        return;
      }
      row[key] = raw;
    });

    if (!row.date || !row.title) return;

    const normalizedDate = new Date(row.date);
    if (Number.isNaN(normalizedDate.getTime())) return;
    row.date = normalizedDate.toISOString().slice(0, 10);
    rows.push(row as TrainingPlanRow);
  });

  return rows;
}

export async function storeTrainingPlanEntries(
  userId: string,
  rows: TrainingPlanRow[]
) {
  if (!rows.length) return { created: 0 };

  const uniqueDates = Array.from(new Set(rows.map((row) => row.date)));
  const uniqueDateMap = uniqueDates.map((iso) => new Date(`${iso}T00:00:00Z`));
  await prisma.trainingPlanEntry.deleteMany({
    where: {
      userId,
      date: {
        in: uniqueDateMap,
      },
    },
  });

  const prepared = rows.map((row) => {
    const dayType = deriveDayType(row);
    const focus = computeFocus(dayType);
    const requiresIntraFuel = needsIntraFuel(row);
    return {
      userId,
      date: new Date(`${row.date}T00:00:00Z`),
      sessionType: row.sessionType || row.title,
      title: row.title,
      durationMinutes: row.durationMinutes ?? null,
      distanceKm: row.distanceKm ?? null,
      tss: row.tss ?? null,
      notes: row.notes ?? null,
      dayType,
      focus,
      requiresIntraFuel,
    };
  });

  const payload = await prisma.trainingPlanEntry.createMany({
    data: prepared,
    skipDuplicates: true,
  });

  return { created: payload.count };
}

export async function getTrainingPlanEntries(
  userId: string,
  start?: Date,
  end?: Date
): Promise<TrainingPlanEntryResponse[]> {
  const where: Prisma.TrainingPlanEntryWhereInput = {
    userId,
    ...(start && { date: { gte: start } }),
    ...(end && { date: { lte: end } }),
  };
  const entries = await prisma.trainingPlanEntry.findMany({
    where,
    include: {
      matchedActivity: {
        select: {
          id: true,
          name: true,
          type: true,
          source: true,
          startDate: true,
          duration: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString(),
    sessionType: entry.sessionType,
    title: entry.title,
    durationMinutes: entry.durationMinutes,
    distanceKm: entry.distanceKm,
    tss: entry.tss,
    notes: entry.notes,
    matchedActivity: entry.matchedActivity
      ? {
          id: entry.matchedActivity.id,
          name: entry.matchedActivity.name,
          type: entry.matchedActivity.type,
          source: entry.matchedActivity.source,
          startDate: entry.matchedActivity.startDate.toISOString(),
          duration: entry.matchedActivity.duration,
        }
      : null,
  }));
}

export async function matchTrainingPlanEntries(
  userId: string,
  start?: Date,
  end?: Date
): Promise<{ matched: number }> {
  const where: Prisma.TrainingPlanEntryWhereInput = {
    userId,
    ...(start && { date: { gte: start } }),
    ...(end && { date: { lte: end } }),
  };
  const entries = await prisma.trainingPlanEntry.findMany({
    where,
    select: {
      id: true,
      date: true,
      matchedActivityId: true,
    },
  });

  let matched = 0;
  const updates: Promise<void>[] = [];

  for (const entry of entries) {
    const dayStart = new Date(entry.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const activity = await prisma.trainingActivity.findFirst({
      where: {
        userId,
        startDate: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
      },
    });

    const matchedActivityId = activity?.id ?? null;
    if (matchedActivityId && matchedActivityId !== entry.matchedActivityId) {
      updates.push(
        prisma.trainingPlanEntry.update({
          where: { id: entry.id },
          data: { matchedActivityId },
        }).then(() => {
          matched += 1;
        })
      );
    } else if (!matchedActivityId && entry.matchedActivityId) {
      updates.push(
        prisma.trainingPlanEntry.update({
          where: { id: entry.id },
          data: { matchedActivityId: null },
        }).then(() => {
          matched += 1;
        })
      );
    } else if (matchedActivityId) {
      matched += 1;
    }
  }

  await Promise.all(updates);
  return { matched };
}

export async function findTrainingPlanEntryForDate(userId: string, date: Date) {
  return prisma.trainingPlanEntry.findFirst({
    where: { userId, date },
    include: {
      matchedActivity: {
        select: {
          id: true,
          name: true,
          type: true,
          source: true,
          startDate: true,
          duration: true,
        },
      },
    },
  });
}
