import { createClient } from "@/lib/supabase/server";
import type { GalleryPhoto } from "@/lib/types";

/** Fetch the couple's gallery photos, newest first (RLS-scoped). */
export async function getPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("uploaded_at", { ascending: false });
  return (data as GalleryPhoto[] | null) ?? [];
}
