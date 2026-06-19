"use server";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { getR2Client, getR2Config } from "@/lib/r2";
import type { GalleryPhoto } from "@/lib/types";

export type AddPhotoResult =
  | { ok: true; photo: GalleryPhoto }
  | { ok: false; error: string };

/**
 * Persists the final R2 URL of an already-uploaded photo into gallery_photos.
 * The heavy bytes live in R2; Supabase only stores the lightweight link.
 * couple_id is taken from the session, and RLS enforces the same scope.
 */
export async function addPhoto(
  r2ImageUrl: string,
  takenAt?: string | null,
  eventDate?: string | null,
): Promise<AddPhotoResult> {
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
    .insert({
      couple_id: profile.couple_id,
      r2_image_url: r2ImageUrl,
      taken_at: takenAt ?? null,
      event_date: eventDate ?? null,
    })
    .select("*")
    .single<GalleryPhoto>();

  if (error || !data) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true, photo: data };
}

/** Lists photos attached to a given calendar day (for the day detail view). */
export async function listPhotosForDate(
  dateISO: string,
): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("event_date", dateISO)
    .order("taken_at", { ascending: true, nullsFirst: false });
  return (data as GalleryPhoto[] | null) ?? [];
}

/**
 * Deletes a gallery photo: removes the DB row (RLS-scoped to the couple) and
 * best-effort deletes the underlying R2 object so storage doesn't leak.
 */
export async function deletePhoto(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();

  // Fetch first so we know the R2 key (and RLS confirms ownership).
  const { data: photo } = await supabase
    .from("gallery_photos")
    .select("r2_image_url")
    .eq("id", id)
    .maybeSingle<{ r2_image_url: string }>();

  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) return { ok: false };

  // Best-effort R2 cleanup — failure here must not fail the delete.
  if (photo?.r2_image_url) {
    try {
      const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");
      if (base && photo.r2_image_url.startsWith(base)) {
        const key = photo.r2_image_url.slice(base.length + 1);
        const { bucket } = getR2Config();
        await getR2Client().send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
      }
    } catch {
      // ignore — orphaned object can be reaped later
    }
  }

  return { ok: true };
}
