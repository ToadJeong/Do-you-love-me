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
  google_ics_url: string | null;
  mbti: string | null;
  blood_type: string | null;
  hometown: string | null;
  birth_date: string | null;
  birth_time: string | null;
  school_elementary: string | null;
  school_middle: string | null;
  school_high: string | null;
  created_at: string;
}

export interface MapRegion {
  id: string;
  couple_id: string;
  region_code: string;
  region_name: string | null;
  photo_url: string | null;
  visited_at: string | null;
  created_at: string;
}

export interface PartnerNote {
  id: string;
  couple_id: string;
  author_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

export interface ExternalEvent {
  id: string;
  event_date: string; // ISO date
  title: string;
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
  /** null = couple event; a user id = that partner's personal event. */
  owner_id: string | null;
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
