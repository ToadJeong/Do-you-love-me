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
