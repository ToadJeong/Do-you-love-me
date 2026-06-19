"use server";

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";

/**
 * Fetches the events covering a month's visible grid (the weeks shown for that
 * month). `monthISO` is any date within the desired month. RLS scopes the rows
 * to the caller's couple, so no couple_id is needed here.
 */
export async function fetchMonthEvents(
  monthISO: string,
): Promise<CalendarEvent[]> {
  const month = new Date(monthISO);
  const from = format(startOfWeek(startOfMonth(month)), "yyyy-MM-dd");
  const to = format(endOfWeek(endOfMonth(month)), "yyyy-MM-dd");

  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true });

  return (data as CalendarEvent[] | null) ?? [];
}

export interface AddEventInput {
  event_date: string; // ISO date (YYYY-MM-DD)
  type: CalendarEventType;
  title: string;
  content?: string;
}

export type AddEventResult =
  | { ok: true; event: CalendarEvent }
  | { ok: false; error: string };

/**
 * Inserts a calendar event for the current user's couple.
 * couple_id is derived server-side from the session (never trusted from the
 * client) and the RLS policy independently enforces the same constraint.
 */
export async function addEvent(input: AddEventInput): Promise<AddEventResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { data: profile } = await supabase
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();

  if (!profile?.couple_id) {
    return { ok: false, error: "커플 연결이 필요해요." };
  }

  // Append after the day's existing events.
  const { data: last } = await supabase
    .from("calendar_events")
    .select("sort_index")
    .eq("couple_id", profile.couple_id)
    .eq("event_date", input.event_date)
    .order("sort_index", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_index: number }>();
  const nextIndex = (last?.sort_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      couple_id: profile.couple_id,
      event_date: input.event_date,
      type: input.type,
      title: input.title || null,
      content: input.content || null,
      sort_index: nextIndex,
    })
    .select("*")
    .single<CalendarEvent>();

  if (error || !data) {
    return { ok: false, error: "저장에 실패했어요." };
  }

  return { ok: true, event: data };
}

/** Update an event's editable fields. RLS keeps this scoped to the couple. */
export async function updateEvent(
  id: string,
  patch: { title?: string; content?: string; type?: CalendarEventType },
): Promise<AddEventResult> {
  const supabase = await createClient();
  const fields: Record<string, string | null> = {};
  if (patch.title !== undefined) fields.title = patch.title || null;
  if (patch.content !== undefined) fields.content = patch.content || null;
  if (patch.type !== undefined) fields.type = patch.type;

  const { data, error } = await supabase
    .from("calendar_events")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single<CalendarEvent>();

  if (error || !data) return { ok: false, error: "수정에 실패했어요." };
  return { ok: true, event: data };
}

/** Toggle the done flag of a todo item. */
export async function setEventDone(
  id: string,
  done: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({ done })
    .eq("id", id);
  return { ok: !error };
}

/** Delete an event. */
export async function deleteEvent(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  return { ok: !error };
}

/**
 * Persists a new manual ordering for a set of events (drag & drop).
 * `orderedIds` is the events in their new top-to-bottom order; each row's
 * sort_index is set to its position. RLS keeps this scoped to the couple.
 */
export async function reorderEvents(
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("calendar_events").update({ sort_index: index }).eq("id", id),
    ),
  );
  return { ok: results.every((r) => !r.error) };
}
