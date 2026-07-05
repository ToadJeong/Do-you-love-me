/**
 * Shared domain types mirroring the Supabase schema (supabase_schema.sql).
 * Kept hand-written for now; can be replaced by `supabase gen types` output later.
 */

export type CalendarEventType = "schedule" | "diary" | "todo" | "anniversary";

export interface Couple {
  id: string;
  start_date: string; // ISO date (YYYY-MM-DD)
  main_bg_url: string | null;
  memo: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface BucketItem {
  id: string;
  couple_id: string;
  title: string;
  done: boolean;
  sort_index: number;
  created_at: string;
}

export interface AppUser {
  id: string;
  couple_id: string | null;
  nickname: string | null;
  profile_image_url: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  couple_id: string;
  event_date: string; // ISO date
  type: CalendarEventType;
  title: string | null;
  content: string | null;
  sort_index: number;
  done: boolean;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  couple_id: string;
  r2_image_url: string;
  taken_at: string | null;
  event_date: string | null;
  uploaded_at: string;
}
