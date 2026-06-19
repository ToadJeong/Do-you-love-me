import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

/** Fetch the most recent messages for the couple (oldest-first for display). */
export async function getRecentMessages(limit = 100): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data as Message[] | null) ?? [];
  return rows.reverse();
}
