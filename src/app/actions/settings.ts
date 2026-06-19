"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Update the current user's own profile (nickname / avatar). */
export async function updateProfile(input: {
  nickname?: string;
  profile_image_url?: string;
}): Promise<SettingsResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const patch: Record<string, string> = {};
  if (input.nickname !== undefined) patch.nickname = input.nickname;
  if (input.profile_image_url !== undefined)
    patch.profile_image_url = input.profile_image_url;

  const { error } = await supabase.from("users").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: "저장에 실패했어요." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Update the couple's shared pinned memo. */
export async function updateCoupleMemo(memo: string): Promise<SettingsResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { data: profile } = await supabase
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();
  if (!profile?.couple_id) return { ok: false, error: "커플 연결이 필요해요." };

  const { error } = await supabase
    .from("couples")
    .update({ memo: memo.trim() || null })
    .eq("id", profile.couple_id);
  if (error) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true };
}

/** Update the couple's full-screen background image. */
export async function updateCoupleBackground(
  mainBgUrl: string,
): Promise<SettingsResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { data: profile } = await supabase
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();
  if (!profile?.couple_id) return { ok: false, error: "커플 연결이 필요해요." };

  const { error } = await supabase
    .from("couples")
    .update({ main_bg_url: mainBgUrl })
    .eq("id", profile.couple_id);
  if (error) return { ok: false, error: "저장에 실패했어요." };

  revalidatePath("/", "layout");
  return { ok: true };
}
