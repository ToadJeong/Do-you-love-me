"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
}

/** Email/password sign in. */
export async function login(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "로그인에 실패했어요. 이메일/비밀번호를 확인해 주세요." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Email/password sign up. Creates the auth user + a profile row in public.users. */
export async function signup(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: "회원가입에 실패했어요. 잠시 후 다시 시도해 주세요." };
  }

  // When email confirmation is disabled, a session exists immediately and we
  // can create the profile row now (RLS requires id = auth.uid()).
  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("users").insert({
      id: data.user.id,
      nickname: nickname || null,
    });
    // Ignore duplicate-row errors (e.g. re-submit); surface anything else.
    if (profileError && profileError.code !== "23505") {
      return { error: "프로필 생성 중 문제가 발생했어요." };
    }
    revalidatePath("/", "layout");
    redirect("/");
  }

  // Email confirmation is on: ask the user to verify before continuing.
  redirect("/login?verify=1");
}

/** Sign the current user out. */
export async function signout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
