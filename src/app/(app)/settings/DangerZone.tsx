"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { disconnectCouple, deleteAccount } from "@/app/actions/account";

/** 커플 연결 해제 + 계정 삭제 (Play user-data policy: in-app deletion). */
export function DangerZone() {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"none" | "disconnect" | "delete">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(kind: "disconnect" | "delete") {
    setError(null);
    start(async () => {
      if (kind === "disconnect") {
        const res = await disconnectCouple();
        if (res.ok) router.push("/onboarding");
        else setError(res.error ?? "실패했어요.");
      } else {
        const res = await deleteAccount(); // redirects on success
        if (res && !res.ok) setError(res.error ?? "실패했어요.");
      }
      setConfirm("none");
    });
  }

  const btn =
    "w-full rounded-xl border py-3 text-sm font-medium transition active:scale-[0.99]";

  return (
    <section className="mt-10 rounded-2xl border border-red-200 p-4 dark:border-red-900/50">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-red-500">
        <AlertTriangle size={15} /> 위험 구역
      </p>

      {confirm === "none" && (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setConfirm("disconnect")}
            className={`${btn} border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300`}>
            커플 연결 해제
          </button>
          <button type="button" onClick={() => setConfirm("delete")}
            className={`${btn} border-red-300 text-red-500 dark:border-red-900`}>
            계정 삭제
          </button>
        </div>
      )}

      {confirm !== "none" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {confirm === "disconnect"
              ? "커플 연결을 해제할까요? 상대방의 공간과 기록은 유지되고, 나는 새로 시작하게 돼요."
              : "정말 계정을 삭제할까요? 되돌릴 수 없어요. 상대가 이미 떠난 커플의 공유 기록(일정·사진·채팅)도 함께 삭제됩니다."}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirm("none")}
              className={`${btn} border-neutral-300 text-neutral-500 dark:border-neutral-700`}>
              취소
            </button>
            <button type="button" disabled={pending} onClick={() => run(confirm)}
              className={`${btn} border-red-400 bg-red-500 text-white disabled:opacity-50`}>
              {pending ? <Loader2 size={15} className="mx-auto animate-spin" /> :
                confirm === "disconnect" ? "해제할게요" : "영구 삭제"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  );
}
