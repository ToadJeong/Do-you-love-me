"use server";

import { createClient } from "@/lib/supabase/server";
import type { MapRegion } from "@/lib/types";

export type MarkRegionResult =
  | { ok: true; region: MapRegion }
  | { ok: false; error: string };

/** Mark a 시군구 as visited (idempotent per couple+region), optionally with a photo. */
export async function markRegion(input: {
  region_code: string;
  region_name: string;
  photo_url?: string | null;
  visited_at?: string | null;
}): Promise<MarkRegionResult> {
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
  if (!profile?.couple_id) return { ok: false, error: "커플 연결이 필요해요." };

  const { data, error } = await supabase
    .from("map_regions")
    .upsert(
      {
        couple_id: profile.couple_id,
        region_code: input.region_code,
        region_name: input.region_name,
        photo_url: input.photo_url ?? null,
        visited_at: input.visited_at ?? null,
      },
      { onConflict: "couple_id,region_code" },
    )
    .select("*")
    .single<MapRegion>();

  if (error || !data) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true, region: data };
}

/** Update just the photo of an already-marked region. */
export async function setRegionPhoto(
  regionCode: string,
  photoUrl: string | null,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("map_regions")
    .update({ photo_url: photoUrl })
    .eq("region_code", regionCode);
  return { ok: !error };
}

/** Un-mark a region (RLS scopes to the couple). */
export async function unmarkRegion(
  regionCode: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("map_regions")
    .delete()
    .eq("region_code", regionCode);
  return { ok: !error };
}

/** All of the couple's visited regions. */
export async function listRegions(): Promise<MapRegion[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("map_regions").select("*");
  return (data as MapRegion[] | null) ?? [];
}
