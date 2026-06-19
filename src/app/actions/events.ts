"use server";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";

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

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      couple_id: profile.couple_id,
      event_date: input.event_date,
      type: input.type,
      title: input.title || null,
      content: input.content || null,
    })
    .select("*")
    .single<CalendarEvent>();

  if (error || !data) {
    return { ok: false, error: "저장에 실패했어요." };
  }

  return { ok: true, event: data };
}
