"use server";

import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

export type SendMessageResult =
  | { ok: true; message: Message }
  | { ok: false; error: string };

/**
 * Sends a chat message. couple_id and sender_id are derived from the session;
 * RLS independently enforces that the sender belongs to the couple.
 */
export async function sendMessage(content: string): Promise<SendMessageResult> {
  const text = content.trim();
  if (!text) return { ok: false, error: "내용을 입력해 주세요." };
  if (text.length > 2000) return { ok: false, error: "메시지가 너무 길어요." };

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
    .from("messages")
    .insert({
      couple_id: profile.couple_id,
      sender_id: user.id,
      content: text,
    })
    .select("*")
    .single<Message>();

  if (error || !data) return { ok: false, error: "전송에 실패했어요." };
  return { ok: true, message: data };
}
