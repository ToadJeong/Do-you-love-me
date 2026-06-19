"use client";

import { useActionState, useState } from "react";
import { Heart, Link2 } from "lucide-react";
import {
  createCouple,
  joinCouple,
  type ConnectActionState,
} from "./actions";

const initial: ConnectActionState = { error: null };

type Tab = "create" | "join";

export function OnboardingForms() {
  const [tab, setTab] = useState<Tab>("create");
  const [createState, createAction, creating] = useActionState(
    createCouple,
    initial,
  );
  const [joinState, joinAction, joining] = useActionState(joinCouple, initial);

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            tab === "create" ? "bg-white shadow-sm" : "text-neutral-500"
          }`}
        >
          <Heart size={16} /> 커플 만들기
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            tab === "join" ? "bg-white shadow-sm" : "text-neutral-500"
          }`}
        >
          <Link2 size={16} /> 코드로 연결
        </button>
      </div>

      {tab === "create" ? (
        <form action={createAction} className="flex flex-col gap-4">
          <label className="text-sm text-neutral-600">
            우리가 처음 만난 날
            <input
              name="start_date"
              type="date"
              required
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
            />
          </label>
          {createState.error && (
            <p className="text-sm text-red-600">{createState.error}</p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-love py-3 text-base font-medium text-white transition hover:bg-love-dark active:scale-[0.99] disabled:opacity-50"
          >
            {creating ? "만드는 중…" : "커플 시작하기"}
          </button>
          <p className="text-center text-xs text-neutral-400">
            만든 뒤 설정에서 초대 코드를 파트너에게 공유하면 연결돼요.
          </p>
        </form>
      ) : (
        <form action={joinAction} className="flex flex-col gap-4">
          <label className="text-sm text-neutral-600">
            파트너의 초대 코드
            <input
              name="code"
              type="text"
              required
              placeholder="예: 3f1c8e2a-…"
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
            />
          </label>
          {joinState.error && (
            <p className="text-sm text-red-600">{joinState.error}</p>
          )}
          <button
            type="submit"
            disabled={joining}
            className="rounded-xl bg-love py-3 text-base font-medium text-white transition hover:bg-love-dark active:scale-[0.99] disabled:opacity-50"
          >
            {joining ? "연결 중…" : "커플 연결하기"}
          </button>
        </form>
      )}
    </div>
  );
}
