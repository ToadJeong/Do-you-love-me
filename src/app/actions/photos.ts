"use server";

import { createClient } from "@/lib/supabase/server";
import type { GalleryPhoto } from "@/lib/types";

export type AddPhotoResult =
  | { ok: true; photo: GalleryPhoto }
  | { ok: false; error: string };

/**
 * Persists the final R2 URL of an already-uploaded photo into gallery_photos.
 * The heavy bytes live in R2; Supabase only stores the lightweight link.
 * couple_id is taken from the session, and RLS enforces the same scope.
 */
export async function addPhoto(r2ImageUrl: string): Promise<AddPhotoResult> {
  if (!r2ImageUrl) return { ok: false, error: "missing url" };

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
    .from("gallery_photos")
    .insert({ couple_id: profile.couple_id, r2_image_url: r2ImageUrl })
    .select("*")
    .single<GalleryPhoto>();

  if (error || !data) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true, photo: data };
}
