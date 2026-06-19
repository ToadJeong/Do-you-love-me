"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X, GripVertical, Trash2, Pencil, Check } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCalendarStore } from "@/store/useCalendarStore";
import { EVENT_STYLES, EVENT_TYPE_ORDER } from "@/lib/eventStyle";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  setEventDone,
  reorderEvents,
} from "@/app/actions/events";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";

interface Props {
  date: Date;
  /** When provided, renders a close (X) button — used by the mobile sheet. */
  onClose?: () => void;
  /** Enable drag-to-reorder (desktop split view only). */
  enableDnd?: boolean;
}

function EventRow({
  ev,
  enableDnd,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  ev: CalendarEvent;
  enableDnd: boolean;
  onToggleDone: (ev: CalendarEvent) => void;
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (ev: CalendarEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ev.id, disabled: !enableDnd });
  const style = EVENT_STYLES[ev.type];
  const pending = ev.id.startsWith("temp-");
  const isTodo = ev.type === "todo";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 ${
        pending ? "opacity-60" : ""
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      {enableDnd && (
        <button
          type="button"
          aria-label="순서 변경"
          className="mt-0.5 cursor-grab touch-none text-neutral-300 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      )}

      {isTodo && (
        <button
          type="button"
          aria-label={ev.done ? "완료 취소" : "완료"}
          onClick={() => onToggleDone(ev)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            ev.done
              ? "border-love bg-love text-white"
              : "border-neutral-300 text-transparent"
          }`}
        >
          <Check size={13} />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.chip}`}
          >
            {style.label}
          </span>
          <span
            className={`text-sm font-medium ${
              ev.done ? "text-neutral-400 line-through" : ""
            }`}
          >
            {ev.title}
          </span>
        </div>
        {ev.content && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">
            {ev.content}
          </p>
        )}
      </div>

      {!pending && (
        <div className="flex shrink-0 gap-1 text-neutral-300">
          <button
            type="button"
            aria-label="수정"
            onClick={() => onEdit(ev)}
            className="rounded p-1 hover:text-neutral-600"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            aria-label="삭제"
            onClick={() => onDelete(ev)}
            className="rounded p-1 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * Day detail: lists a day's events (ordered by sort_index) and supports add,
 * edit, delete, todo completion, and PC drag-to-reorder — all optimistic.
 * Shared by the mobile bottom sheet and the desktop split-view side panel.
 */
export function DayEditor({ date, onClose, enableDnd = false }: Props) {
  const dateISO = format(date, "yyyy-MM-dd");
  const allEvents = useCalendarStore((s) => s.events);
  const addOptimistic = useCalendarStore((s) => s.addOptimistic);
  const reconcile = useCalendarStore((s) => s.reconcile);
  const remove = useCalendarStore((s) => s.remove);
  const upsert = useCalendarStore((s) => s.upsert);
  const reorder = useCalendarStore((s) => s.reorder);

  const events = useMemo(
    () =>
      allEvents
        .filter((e) => e.event_date === dateISO)
        .sort(
          (a, b) =>
            a.sort_index - b.sort_index ||
            a.created_at.localeCompare(b.created_at),
        ),
    [allEvents, dateISO],
  );

  const [type, setType] = useState<CalendarEventType>("schedule");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function resetForm() {
    setEditingId(null);
    setType("schedule");
    setTitle("");
    setContent("");
  }

  function startEdit(ev: CalendarEvent) {
    setEditingId(ev.id);
    setType(ev.type);
    setTitle(ev.title ?? "");
    setContent(ev.content ?? "");
    setError(null);
  }

  function handleDelete(ev: CalendarEvent) {
    remove(ev.id); // optimistic
    if (editingId === ev.id) resetForm();
    startTransition(async () => {
      const res = await deleteEvent(ev.id);
      if (!res.ok) {
        upsert(ev); // roll back
        setError("삭제에 실패했어요.");
      }
    });
  }

  function handleToggleDone(ev: CalendarEvent) {
    const next = { ...ev, done: !ev.done };
    upsert(next); // optimistic
    startTransition(async () => {
      const res = await setEventDone(ev.id, next.done);
      if (!res.ok) {
        upsert(ev); // roll back
        setError("저장에 실패했어요.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setError(null);
    const payload = { title: title.trim(), content: content.trim(), type };

    if (editingId) {
      const prev = events.find((ev) => ev.id === editingId);
      if (prev) {
        upsert({ ...prev, ...payload, content: payload.content || null }); // optimistic
      }
      const id = editingId;
      resetForm();
      startTransition(async () => {
        const res = await updateEvent(id, payload);
        if (res.ok) upsert(res.event);
        else {
          if (prev) upsert(prev);
          setError(res.error);
        }
      });
      return;
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: CalendarEvent = {
      id: tempId,
      couple_id: "",
      event_date: dateISO,
      type,
      title: payload.title,
      content: payload.content || null,
      sort_index: events.length,
      done: false,
      created_at: new Date().toISOString(),
    };
    addOptimistic(optimistic);
    resetForm();

    startTransition(async () => {
      const res = await addEvent({
        event_date: dateISO,
        type: payload.type,
        title: payload.title,
        content: payload.content,
      });
      if (res.ok) reconcile(tempId, res.event);
      else {
        remove(tempId);
        setError(res.error);
      }
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = events.map((ev) => ev.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newIds = arrayMove(ids, oldIndex, newIndex);
    reorder(newIds); // optimistic
    startTransition(async () => {
      await reorderEvents(newIds);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={events.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="mb-5 flex flex-col gap-2">
              {events.map((ev) => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  enableDnd={enableDnd}
                  onToggleDone={handleToggleDone}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="mb-5 text-sm text-neutral-400">아직 기록이 없어요.</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-love"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용 (선택)"
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-love"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-600"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="flex-1 rounded-xl bg-love py-3 text-base font-medium text-white transition hover:bg-love-dark active:scale-[0.99]"
          >
            {editingId ? "수정" : "저장"}
          </button>
        </div>
      </form>
    </>
  );
}
