"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ConnectActionState {
  error: string | null;
}

/** Create a brand new couple anchored at `start_date` and link the user. */
export async function createCouple(
  _prev: ConnectActionState,
  formData: FormData,
): Promise<ConnectActionState> {
  const startDate = String(formData.get("start_date") ?? "").trim();
  if (!startDate) {
    return { error: "처음 만난 날짜를 선택해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_couple", {
    p_start_date: startDate,
  });

  if (error) {
    if (error.message.includes("already in a couple")) {
      return { error: "이미 커플에 연결되어 있어요." };
    }
    return { error: "커플 생성에 실패했어요. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Join the partner's existing couple using the shared invite code (couple id). */
export async function joinCouple(
  _prev: ConnectActionState,
  formData: FormData,
): Promise<ConnectActionState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "초대 코드를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple", { p_couple_id: code });

  if (error) {
    if (error.message.includes("not found") || error.code === "22P02") {
      return { error: "유효하지 않은 초대 코드예요." };
    }
    if (error.message.includes("full")) {
      return { error: "이미 두 명이 연결된 커플이에요." };
    }
    return { error: "연결에 실패했어요. 코드를 확인해 주세요." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
