"use client";

import { format } from "date-fns";
import { getDayCount, getUpcomingAnniversaries } from "@/lib/dday";

interface DdayProps {
  startDate: string;
}

/**
 * D+N headline plus the three nearest upcoming anniversaries.
 *
 * Derived from the current date at render time. The date-dependent nodes use
 * suppressHydrationWarning because the server and client clocks can differ by
 * a day at midnight; after hydration the client value is authoritative.
 */
export function Dday({ startDate }: DdayProps) {
  const now = new Date();
  const dayCount = getDayCount(startDate, now);
  const anniversaries = getUpcomingAnniversaries(startDate, 3, now);

  return (
    <section className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-neutral-500">우리가 만난 지</p>
        <p
          suppressHydrationWarning
          className="mt-1 font-serif text-6xl font-semibold tracking-tight tabular-nums"
        >
          D+{dayCount}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          since {format(new Date(startDate), "yyyy.MM.dd")}
        </p>
      </div>

      {anniversaries.length > 0 && (
        <ul
          suppressHydrationWarning
          className="w-full divide-y divide-neutral-100 rounded-2xl border border-neutral-200"
        >
          {anniversaries.map((a) => (
            <li
              key={a.label}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-medium">{a.label}</span>
              <span className="flex items-center gap-2 text-neutral-500">
                <span>{format(a.date, "yyyy.MM.dd")}</span>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white tabular-nums">
                  {a.daysUntil === 0 ? "오늘" : `D-${a.daysUntil}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
