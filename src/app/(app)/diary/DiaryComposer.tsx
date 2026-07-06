"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PenLine } from "lucide-react";
import { addEvent } from "@/app/actions/events";

/** Inline composer: writes today's diary entry (calendar event, type diary). */
export function DiaryComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !title.trim()) {
      setError("내용을 입력해 주세요.");
      return;
    }
    start(async () => {
      const res = await addEvent({
        event_date: format(new Date(), "yyyy-MM-dd"),
        type: "diary",
        title: title.trim() || format(new Date(), "M월 d일의 일기"),
        content: content.trim(),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setOpen(false);
        setError(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-love py-3.5 text-sm font-medium text-white transition hover:bg-love-dark active:scale-[0.99]"
      >
        <PenLine size={16} /> 오늘의 일기 쓰기
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-beige bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택)"
        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="오늘 우리에겐 어떤 일이 있었나요?"
        className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-500 dark:border-neutral-700"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        사진은 저장 후 아래 일기의 날짜(캘린더)에서 붙일 수 있어요.
      </p>
    </form>
  );
}
