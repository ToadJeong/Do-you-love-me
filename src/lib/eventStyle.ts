import type { CalendarEventType } from "@/lib/types";

interface Style {
  label: string;
  dot: string; // bg color class for the calendar dot
  chip: string; // chip classes
}

export const EVENT_STYLES: Record<CalendarEventType, Style> = {
  schedule: {
    label: "일정",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700",
  },
  diary: {
    label: "일기",
    dot: "bg-pink-500",
    chip: "bg-pink-50 text-pink-700",
  },
  todo: {
    label: "할 일",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
  },
  anniversary: {
    label: "기념일",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700",
  },
};

export const EVENT_TYPE_ORDER: CalendarEventType[] = [
  "schedule",
  "diary",
  "todo",
  "anniversary",
];
