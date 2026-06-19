"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { EVENT_STYLES } from "@/lib/eventStyle";
import { fetchMonthEvents } from "@/app/actions/events";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";
import { EventBottomSheet } from "./EventBottomSheet";
import { DayEditor } from "./DayEditor";

interface Props {
  initialEvents: CalendarEvent[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthCalendar({ initialEvents }: Props) {
  // Seed the store once with the server-fetched (current month) events.
  const setEvents = useCalendarStore((s) => s.setEvents);
  const mergeRange = useCalendarStore((s) => s.mergeRange);
  useState(() => setEvents(initialEvents));

  const events = useCalendarStore((s) => s.events);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [loading, startLoad] = useTransition();

  // Track which months have been fetched so we only hit the server once each.
  const loadedMonths = useRef<Set<string>>(
    new Set([format(new Date(), "yyyy-MM")]),
  );

  function goToMonth(next: Date) {
    setCursor(next);
    const key = format(next, "yyyy-MM");
    if (loadedMonths.current.has(key)) return;
    loadedMonths.current.add(key);
    startLoad(async () => {
      const fetched = await fetchMonthEvents(format(next, "yyyy-MM-dd"));
      const from = format(startOfWeek(startOfMonth(next)), "yyyy-MM-dd");
      const to = format(endOfWeek(endOfMonth(next)), "yyyy-MM-dd");
      mergeRange(from, to, fetched);
    });
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Map "yyyy-MM-dd" -> set of event types present that day (for dots).
  const typesByDate = useMemo(() => {
    const map = new Map<string, Set<CalendarEventType>>();
    for (const ev of events) {
      const set = map.get(ev.event_date) ?? new Set<CalendarEventType>();
      set.add(ev.type);
      map.set(ev.event_date, set);
    }
    return map;
  }, [events]);

  return (
    <section className="w-full md:flex md:items-start md:gap-8">
      {/* calendar */}
      <div className="md:flex-1">
        <header className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => goToMonth(subMonths(cursor, 1))}
            className="rounded-full p-1.5 hover:bg-neutral-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {format(cursor, "yyyy년 M월")}
            {loading && (
              <Loader2 size={15} className="animate-spin text-neutral-400" />
            )}
          </h2>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => goToMonth(addMonths(cursor, 1))}
            className="rounded-full p-1.5 hover:bg-neutral-100"
          >
            <ChevronRight size={20} />
          </button>
        </header>

        <div className="grid grid-cols-7 text-center text-xs text-neutral-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, cursor);
            const types = typesByDate.get(key);
            const isSel = selected && isSameDay(day, selected);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-lg py-1.5 text-sm transition hover:bg-neutral-100 md:aspect-auto md:min-h-16 ${
                  inMonth ? "text-neutral-900" : "text-neutral-300"
                } ${isSel ? "bg-blush" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full tabular-nums ${
                    isToday(day) ? "bg-love text-white" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {types &&
                    [...types].map((t) => (
                      <span
                        key={t}
                        className={`h-1.5 w-1.5 rounded-full ${EVENT_STYLES[t].dot}`}
                      />
                    ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* desktop split-view side panel */}
      <aside className="hidden md:block md:w-80 md:shrink-0 md:rounded-2xl md:border md:border-neutral-200 md:p-5">
        {selected ? (
          <DayEditor date={selected} />
        ) : (
          <p className="py-16 text-center text-sm text-neutral-400">
            날짜를 선택하면 일정과 일기를 볼 수 있어요.
          </p>
        )}
      </aside>

      {/* mobile bottom sheet (hidden on desktop) */}
      {selected && (
        <EventBottomSheet date={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
