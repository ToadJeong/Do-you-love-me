"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { EVENT_STYLES, EVENT_TYPE_ORDER } from "@/lib/eventStyle";
import { addEvent } from "@/app/actions/events";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";

interface Props {
  date: Date;
  /** When provided, renders a close (X) button — used by the mobile sheet. */
  onClose?: () => void;
}

/**
 * Day detail: lists a day's events and adds a new one with an optimistic
 * update (appears instantly, reconciles with the server, rolls back on error).
 *
 * Shared by the mobile bottom sheet and the desktop split-view side panel.
 */
export function DayEditor({ date, onClose }: Props) {
  const dateISO = format(date, "yyyy-MM-dd");
  const events = useCalendarStore((s) =>
    s.events.filter((e) => e.event_date === dateISO),
  );
  const addOptimistic = useCalendarStore((s) => s.addOptimistic);
  const reconcile = useCalendarStore((s) => s.reconcile);
  const remove = useCalendarStore((s) => s.remove);

  const [type, setType] = useState<CalendarEventType>("schedule");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setError(null);

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: CalendarEvent = {
      id: tempId,
      couple_id: "",
      event_date: dateISO,
      type,
      title: title.trim(),
      content: content.trim() || null,
      created_at: new Date().toISOString(),
    };

    // Show it immediately, then reset the form.
    addOptimistic(optimistic);
    const payload = { title: title.trim(), content: content.trim(), type };
    setTitle("");
    setContent("");

    startTransition(async () => {
      const res = await addEvent({
        event_date: dateISO,
        type: payload.type,
        title: payload.title,
        content: payload.content,
      });
      if (res.ok) {
        reconcile(tempId, res.event);
      } else {
        remove(tempId);
        setError(res.error);
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {format(date, "M월 d일 (EEE)", { locale: ko })}
        </h2>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="닫기">
            <X size={20} className="text-neutral-400" />
          </button>
        )}
      </div>

      {events.length > 0 ? (
        <ul className="mb-5 flex flex-col gap-2">
          {events.map((ev) => {
            const style = EVENT_STYLES[ev.type];
            const pending = ev.id.startsWith("temp-");
            return (
              <li
                key={ev.id}
                className={`rounded-xl border border-neutral-200 p-3 ${
                  pending ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.chip}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm font-medium">{ev.title}</span>
                </div>
                {ev.content && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">
                    {ev.content}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-5 text-sm text-neutral-400">아직 기록이 없어요.</p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                type === t
                  ? EVENT_STYLES[t].chip + " ring-1 ring-inset ring-current"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {EVENT_STYLES[t].label}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[#C8546B]"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용 (선택)"
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[#C8546B]"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="rounded-xl bg-[#C8546B] py-3 text-base font-medium text-white transition active:scale-[0.99]"
        >
          저장
        </button>
      </form>
    </>
  );
}
