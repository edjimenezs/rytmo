import { startOfDay, subDays } from "date-fns";

export type RangeOption = "7d" | "30d" | "90d" | "1y";

const RANGE_TO_DAYS: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export function parseRange(range?: string | null): RangeOption {
  if (range && range in RANGE_TO_DAYS) {
    return range as RangeOption;
  }
  return "30d";
}

export function getStartDateFromRange(range?: string | null): Date {
  const normalizedRange = parseRange(range);
  const days = RANGE_TO_DAYS[normalizedRange];
  return startOfDay(subDays(new Date(), days));
}
