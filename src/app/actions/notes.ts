"use server";

import { createClient } from "@/lib/supabase/server";
import type { PartnerNote } from "@/lib/types";

export type AddNoteResult =
  | { ok: true; note: PartnerNote }
  | { ok: false; error: string };

/** Add a note about your partner. Private notes are visible only to you (RLS). */
export async function addPartnerNote(
  content: string,
  isPrivate: boolean,
): Promise<AddNoteResult> {
  const text = content.trim();
  if (!text) return { ok: false, error: "내용을 입력해 주세요." };

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
    .from("partner_notes")
    .insert({
      couple_id: profile.couple_id,
      author_id: user.id,
      content: text,
      is_private: isPrivate,
    })
    .select("*")
    .single<PartnerNote>();

  if (error || !data) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true, note: data };
}

/** Delete one of your own notes. */
export async function deletePartnerNote(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("partner_notes").delete().eq("id", id);
  return { ok: !error };
}

/** Fetch notes visible to the caller (own private + couple shared). */
export async function listPartnerNotes(): Promise<PartnerNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_notes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as PartnerNote[] | null) ?? [];
}
