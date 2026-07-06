"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Pin, Loader2, Smile, Gamepad2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { updateCoupleMemo } from "@/app/actions/settings";
import { EmoticonPicker, GameMenu, MessageBody } from "./ChatExtras";
import type { Message } from "@/lib/types";

interface Props {
  initialMessages: Message[];
  initialMemo: string | null;
  myId: string;
  coupleId: string;
}

export function ChatRoom({ initialMessages, initialMemo, myId, coupleId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<"none" | "emoji" | "game">("none");
  const [, startSend] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- pinned memo ---
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [savedMemo, setSavedMemo] = useState(initialMemo ?? "");
  const [savingMemo, startMemo] = useTransition();

  function addMessage(m: Message) {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  // realtime: append messages from the partner (and our own echo, deduped).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => addMessage(payload.new as Message),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  // keep scrolled to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendContent(content: string) {
    if (!content.trim()) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    addMessage({
      id: tempId,
      couple_id: coupleId,
      sender_id: myId,
      content,
      created_at: new Date().toISOString(),
    });

    startSend(async () => {
      const res = await sendMessage(content);
      setMessages((prev) => {
        if (!res.ok) return prev.filter((m) => m.id !== tempId);
        // swap temp for the real row, deduping against a realtime echo
        const exists = prev.some((m) => m.id === res.message.id);
        return exists
          ? prev.filter((m) => m.id !== tempId)
          : prev.map((m) => (m.id === tempId ? res.message : m));
      });
    });
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    sendContent(content);
  }

  function saveMemo() {
    setSavedMemo(memo);
    startMemo(async () => {
      const res = await updateCoupleMemo(memo);
      if (!res.ok) setSavedMemo(savedMemo); // revert marker on failure
    });
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-dvh">
      {/* pinned memo */}
      <div className="border-b border-neutral-200 bg-blush/60 px-4 py-3 dark:border-neutral-800 dark:bg-love/10">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-love">
          <Pin size={13} /> 공유 메모
        </div>
        <div className="flex items-start gap-2">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="둘이 함께 볼 메모 (장보기, 약속 등)"
            className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {memo !== savedMemo && (
            <button
              type="button"
              onClick={saveMemo}
              className="shrink-0 rounded-lg bg-love px-3 py-2 text-xs font-medium text-white"
            >
              {savingMemo ? <Loader2 size={14} className="animate-spin" /> : "저장"}
            </button>
          )}
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            첫 메시지를 보내보세요 💬
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <MessageBody
                message={m}
                myId={myId}
                all={messages}
                onSend={sendContent}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* emoticon / game panels */}
      {panel === "emoji" && (
        <EmoticonPicker
          onPick={(content) => {
            sendContent(content);
            setPanel("none");
          }}
        />
      )}
      {panel === "game" && (
        <GameMenu
          onSend={(content) => {
            sendContent(content);
            setPanel("none");
          }}
        />
      )}

      {/* composer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
      >
        <button
          type="button"
          aria-label="이모티콘"
          onClick={() => setPanel((p) => (p === "emoji" ? "none" : "emoji"))}
          className={`shrink-0 rounded-full p-2 transition ${
            panel === "emoji" ? "bg-blush text-love" : "text-neutral-400"
          }`}
        >
          <Smile size={22} />
        </button>
        <button
          type="button"
          aria-label="게임"
          onClick={() => setPanel((p) => (p === "game" ? "none" : "game"))}
          className={`shrink-0 rounded-full p-2 transition ${
            panel === "game" ? "bg-blush text-love" : "text-neutral-400"
          }`}
        >
          <Gamepad2 size={22} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지 입력…"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="submit"
          aria-label="보내기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-love text-white transition hover:bg-love-dark active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
