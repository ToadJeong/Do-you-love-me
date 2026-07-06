"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Disconnect from the couple (커플 연결 해제). The couple space and its data
 * remain with the partner; this user starts fresh.
 */
export async function disconnectCouple(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { error } = await supabase
    .from("users")
    .update({ couple_id: null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "해제에 실패했어요." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Permanently delete the account (Google Play user-data policy requirement).
 * - If the partner has already left (or never joined), the whole couple row is
 *   deleted, cascading all shared data (events, photos rows, messages, …).
 * - Otherwise the couple space is left intact for the partner.
 * - Finally the auth user is removed via the service-role admin API, which
 *   cascades the public.users row and personal data (push subs, notes).
 */
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 필요해요. 관리자에게 문의해 주세요.",
    };
  }

  // Is a partner still in my couple?
  const { data: me } = await admin
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();

  if (me?.couple_id) {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", me.couple_id)
      .neq("id", user.id);
    if (!count) {
      // Last member — remove the couple, cascading every shared record.
      await admin.from("couples").delete().eq("id", me.couple_id);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "계정 삭제에 실패했어요." };

  await supabase.auth.signOut();
  redirect("/login");
}
