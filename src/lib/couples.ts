import { createClient } from "@/lib/supabase/server";
import type { Couple, CalendarEvent, AppUser } from "@/lib/types";

/** Fetch the current user's couple (start_date, background, …) or null. */
export async function getCouple(): Promise<Couple | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("couples")
    .select("*")
    .maybeSingle<Couple>(); // RLS limits visibility to the user's own couple.
  return data ?? null;
}

/**
 * Fetch upcoming user-created anniversaries (calendar events of type
 * 'anniversary' dated today or later) so they can appear as countdowns on the
 * home screen alongside the auto-computed milestones.
 */
export async function getUpcomingCustomAnniversaries(
  todayISO: string,
): Promise<{ label: string; dateISO: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("event_date, title")
    .eq("type", "anniversary")
    .gte("event_date", todayISO)
    .order("event_date", { ascending: true })
    .limit(10);
  return ((data as { event_date: string; title: string | null }[] | null) ?? [])
    .filter((e) => e.title)
    .map((e) => ({ label: e.title as string, dateISO: e.event_date }));
}

/** Fetch both members of the current user's couple (self + partner). */
export async function getCoupleMembers(coupleId: string): Promise<AppUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true });
  return (data as AppUser[] | null) ?? [];
}

/** Fetch calendar events for the couple within an inclusive date range. */
export async function getEventsInRange(
  fromISO: string,
  toISO: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", fromISO)
    .lte("event_date", toISO)
    .order("event_date", { ascending: true });
  return (data as CalendarEvent[] | null) ?? [];
}
