"use server";

import { createClient } from "@/lib/supabase/server";
import type { BucketItem } from "@/lib/types";

async function coupleId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, coupleId: null as string | null };
  const { data } = await supabase
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();
  return { supabase, coupleId: data?.couple_id ?? null };
}

export type AddBucketResult =
  | { ok: true; item: BucketItem }
  | { ok: false; error: string };

/** Add a bucket-list goal. */
export async function addBucketItem(title: string): Promise<AddBucketResult> {
  const text = title.trim();
  if (!text) return { ok: false, error: "내용을 입력해 주세요." };

  const { supabase, coupleId: cid } = await coupleId();
  if (!cid) return { ok: false, error: "커플 연결이 필요해요." };

  const { data, error } = await supabase
    .from("bucket_items")
    .insert({ couple_id: cid, title: text })
    .select("*")
    .single<BucketItem>();

  if (error || !data) return { ok: false, error: "저장에 실패했어요." };
  return { ok: true, item: data };
}

/** Toggle a goal's done state. */
export async function toggleBucketItem(
  id: string,
  done: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bucket_items")
    .update({ done })
    .eq("id", id);
  return { ok: !error };
}

/** Delete a goal. */
export async function deleteBucketItem(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bucket_items").delete().eq("id", id);
  return { ok: !error };
}
