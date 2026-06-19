"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">회원가입</h1>
        <p className="mt-2 text-sm text-neutral-500">
          가입 후 파트너와 커플을 연결할 수 있어요
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="닉네임 (선택)"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="이메일"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-base font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "가입 중…" : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
