import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

/**
 * Server-side helper: returns the current auth user id and their profile row
 * (including couple_id) from public.users, or nulls if not signed in.
 *
 * Use this in Server Components / layouts to seed the client Zustand store.
 */
export async function getCurrentUser(): Promise<{
  userId: string | null;
  profile: AppUser | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AppUser>();

  return { userId: user.id, profile: profile ?? null };
}
