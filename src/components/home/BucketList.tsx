"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Plus, Trash2, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import {
  addBucketItem,
  toggleBucketItem,
  deleteBucketItem,
} from "@/app/actions/bucket";
import type { BucketItem } from "@/lib/types";

/**
 * Shared couple bucket list — dateless goals both partners can check off.
 * Optimistic add/toggle/delete + Realtime so both screens stay in sync.
 */
export function BucketList({ initialItems }: { initialItems: BucketItem[] }) {
  const coupleId = useUserStore((s) => s.coupleId);
  const [items, setItems] = useState<BucketItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [, start] = useTransition();

  function upsert(item: BucketItem) {
    setItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item],
    );
  }
  function removeLocal(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`bucket:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bucket_items",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE")
            removeLocal((payload.old as { id: string }).id);
          else upsert(payload.new as BucketItem);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    upsert({
      id: tempId,
      couple_id: coupleId ?? "",
      title: text,
      done: false,
      sort_index: 0,
      created_at: new Date().toISOString(),
    });
    setTitle("");
    start(async () => {
      const res = await addBucketItem(text);
      setItems((prev) => {
        if (!res.ok) return prev.filter((i) => i.id !== tempId);
        const exists = prev.some((i) => i.id === res.item.id);
        return exists
          ? prev.filter((i) => i.id !== tempId)
          : prev.map((i) => (i.id === tempId ? res.item : i));
      });
    });
  }

  function toggle(item: BucketItem) {
    const next = { ...item, done: !item.done };
    upsert(next);
    start(async () => {
      const res = await toggleBucketItem(item.id, next.done);
      if (!res.ok) upsert(item);
    });
  }

  function remove(item: BucketItem) {
    removeLocal(item.id);
    start(async () => {
      const res = await deleteBucketItem(item.id);
      if (!res.ok) upsert(item);
    });
  }

  const sorted = [...items].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      a.created_at.localeCompare(b.created_at),
  );
  const doneCount = items.filter((i) => i.done).length;

  return (
    <section className="mx-auto w-full max-w-md px-6 py-10 md:max-w-lg">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks size={20} className="text-love" />
        <h2 className="text-lg font-semibold">우리의 버킷리스트</h2>
        {items.length > 0 && (
          <span className="ml-auto text-sm text-neutral-400 tabular-nums">
            {doneCount}/{items.length}
          </span>
        )}
      </div>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="같이 하고 싶은 것 (예: 제주도 여행)"
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="submit"
          aria-label="추가"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-love text-white transition hover:bg-love-dark active:scale-95"
        >
          <Plus size={20} />
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">
          함께 이루고 싶은 목록을 채워보세요 ✨
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <button
                type="button"
                aria-label={item.done ? "완료 취소" : "완료"}
                onClick={() => toggle(item)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  item.done
                    ? "border-love bg-love text-white"
                    : "border-neutral-300 text-transparent dark:border-neutral-600"
                }`}
              >
                <Check size={13} />
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.done ? "text-neutral-400 line-through" : ""
                }`}
              >
                {item.title}
              </span>
              <button
                type="button"
                aria-label="삭제"
                onClick={() => remove(item)}
                className="text-neutral-300 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
