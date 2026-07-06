"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { STATUSES } from "@/data/statuses";
import { updateStatus } from "@/app/actions/settings";

/**
 * Bottom sheet for picking today's mood/status: 50 presets (ordered by how
 * commonly each is used, 평범 first) or a fully custom emoji + text.
 */
export function StatusPicker({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [customEmoji, setCustomEmoji] = useState("");
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(emoji: string, text: string) {
    setError(null);
    start(async () => {
      const res = await updateStatus(emoji, text);
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative max-h-[80dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 md:max-w-md md:rounded-3xl dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">지금 내 상태는?</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* custom status */}
        <div className="mb-4 flex gap-2">
          <input
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="🙂"
            className="w-14 rounded-xl border border-neutral-300 px-2 py-2.5 text-center text-lg outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900"
          />
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            maxLength={20}
            placeholder="직접 입력 (예: 시험 D-3)"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            disabled={pending || (!customEmoji.trim() && !customText.trim())}
            onClick={() => save(customEmoji || "💬", customText)}
            className="rounded-xl bg-love px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : "설정"}
          </button>
        </div>

        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

        {/* presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {STATUSES.map((st) => (
            <button
              key={st.label}
              type="button"
              disabled={pending}
              onClick={() => save(st.emoji, st.label)}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-cream px-1 py-2 transition active:scale-95 dark:bg-neutral-800"
            >
              <span className="text-xl">{st.emoji}</span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                {st.label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() => save("", "")}
          className="mt-4 w-full rounded-xl border border-neutral-300 py-2.5 text-sm text-neutral-500 dark:border-neutral-700"
        >
          상태 지우기
        </button>
      </div>
    </div>
  );
}
