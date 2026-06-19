"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const verify = useSearchParams().get("verify");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Do you love me</h1>
        <p className="mt-2 text-sm text-neutral-500">우리 둘만의 기록 공간</p>
      </div>

      {verify && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          가입 확인 메일을 보냈어요. 메일 인증 후 로그인해 주세요.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="이메일"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="비밀번호"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-xl bg-love py-3 text-base font-medium text-white transition hover:bg-love-dark active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
