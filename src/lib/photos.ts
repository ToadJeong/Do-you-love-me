import { createClient } from "@/lib/supabase/server";
import type { GalleryPhoto } from "@/lib/types";

/** Fetch the couple's gallery photos, newest first (RLS-scoped). */
export async function getPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    // Prefer the EXIF capture date; fall back to upload time.
    .order("taken_at", { ascending: false, nullsFirst: false })
    .order("uploaded_at", { ascending: false });
  return (data as GalleryPhoto[] | null) ?? [];
}
