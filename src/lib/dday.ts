import {
  addDays,
  addYears,
  differenceInCalendarDays,
  parseISO,
} from "date-fns";

/**
 * Day count where the day the couple met counts as day 1 (Korean convention).
 * e.g. on the start date itself it returns 1.
 */
export function getDayCount(startDate: string, today: Date = new Date()): number {
  return differenceInCalendarDays(today, parseISO(startDate)) + 1;
}

export interface Anniversary {
  /** Human label, e.g. "100일", "1주년". */
  label: string;
  /** The calendar date of the anniversary. */
  date: Date;
  /** Days from `today` until the anniversary (0 = today). */
  daysUntil: number;
}

/**
 * Computes upcoming anniversaries from a start date — 100-day milestones and
 * yearly milestones — returning the nearest `count` that are today or later.
 *
 * Day milestones use the "met day = day 1" convention, so the 100-day mark is
 * start + 99 days.
 */
export function getUpcomingAnniversaries(
  startDate: string,
  count = 3,
  today: Date = new Date(),
): Anniversary[] {
  const start = parseISO(startDate);
  const all: Anniversary[] = [];

  // 100-day milestones up to ~27 years.
  for (let n = 100; n <= 10000; n += 100) {
    all.push({
      label: `${n}일`,
      date: addDays(start, n - 1),
      daysUntil: 0,
    });
  }

  // Yearly milestones.
  for (let y = 1; y <= 50; y++) {
    all.push({
      label: `${y}주년`,
      date: addYears(start, y),
      daysUntil: 0,
    });
  }

  return all
    .map((a) => ({ ...a, daysUntil: differenceInCalendarDays(a.date, today) }))
    .filter((a) => a.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, count);
}
