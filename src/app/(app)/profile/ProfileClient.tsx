"use client";

import { useState, useTransition } from "react";
import { Lock, Pencil, Trash2, Loader2, StickyNote } from "lucide-react";
import { updateLifeProfile } from "@/app/actions/settings";
import { addPartnerNote, deletePartnerNote } from "@/app/actions/notes";
import { getZodiac } from "@/lib/zodiac";
import type { AppUser, PartnerNote } from "@/lib/types";

const MBTI = [
  "ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP",
  "ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ",
];
const BLOOD = ["A", "B", "O", "AB"];

const inputCls =
  "w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-neutral-400">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function ProfileCard({ user, title }: { user: AppUser | null; title: string }) {
  return (
    <div className="rounded-2xl border border-beige bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="mb-2 text-sm font-semibold text-love">{title}</p>
      {user ? (
        <>
          <InfoRow label="닉네임" value={user.nickname} />
          <InfoRow label="MBTI" value={user.mbti} />
          <InfoRow label="혈액형" value={user.blood_type ? `${user.blood_type}형` : null} />
          <InfoRow label="생일" value={user.birth_date} />
          <InfoRow label="태어난 시간" value={user.birth_time} />
          <InfoRow label="별자리" value={getZodiac(user.birth_date)} />
          <InfoRow label="고향" value={user.hometown} />
          <InfoRow label="초등학교" value={user.school_elementary} />
          <InfoRow label="중학교" value={user.school_middle} />
          <InfoRow label="고등학교" value={user.school_high} />
        </>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-400">
          아직 연결되지 않았어요
        </p>
      )}
    </div>
  );
}

export function ProfileClient({
  me,
  partner,
  myId,
  initialNotes,
}: {
  me: AppUser;
  partner: AppUser | null;
  myId: string;
  initialNotes: PartnerNote[];
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    mbti: me.mbti ?? "",
    blood_type: me.blood_type ?? "",
    hometown: me.hometown ?? "",
    birth_date: me.birth_date ?? "",
    birth_time: me.birth_time ?? "",
    school_elementary: me.school_elementary ?? "",
    school_middle: me.school_middle ?? "",
    school_high: me.school_high ?? "",
  });
  const [notes, setNotes] = useState(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function saveProfile() {
    setMsg(null);
    start(async () => {
      const res = await updateLifeProfile(form);
      setMsg(res.ok ? "저장되었어요." : res.error);
      if (res.ok) setEditing(false);
    });
  }

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    setNoteText("");
    start(async () => {
      const res = await addPartnerNote(text, notePrivate);
      if (res.ok) setNotes((prev) => [res.note, ...prev]);
    });
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    start(async () => {
      await deletePartnerNote(id);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* life info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileCard user={me} title="나" />
        <ProfileCard user={partner} title={partner?.nickname || "파트너"} />
      </div>

      {/* edit my info */}
      <section className="rounded-2xl border border-beige bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-love"
        >
          <Pencil size={15} /> 내 정보 {editing ? "닫기" : "수정하기"}
        </button>

        {editing && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs text-neutral-500">
              MBTI
              <select
                value={form.mbti}
                onChange={(e) => set("mbti", e.target.value)}
                className={`mt-1 ${inputCls}`}
              >
                <option value="">선택</option>
                {MBTI.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-500">
              혈액형
              <select
                value={form.blood_type}
                onChange={(e) => set("blood_type", e.target.value)}
                className={`mt-1 ${inputCls}`}
              >
                <option value="">선택</option>
                {BLOOD.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-500">
              생일
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="text-xs text-neutral-500">
              태어난 시간
              <input
                type="time"
                value={form.birth_time}
                onChange={(e) => set("birth_time", e.target.value)}
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="col-span-2 text-xs text-neutral-500">
              고향
              <input
                value={form.hometown}
                onChange={(e) => set("hometown", e.target.value)}
                placeholder="예: 부산 해운대"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            {(
              [
                ["school_elementary", "초등학교"],
                ["school_middle", "중학교"],
                ["school_high", "고등학교"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="col-span-2 text-xs text-neutral-500">
                {label}
                <input
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
            ))}
            <button
              type="button"
              onClick={saveProfile}
              disabled={pending}
              className="col-span-2 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-50"
            >
              {pending ? "저장 중…" : "저장"}
            </button>
            {msg && <p className="col-span-2 text-xs text-neutral-500">{msg}</p>}
          </div>
        )}
      </section>

      {/* partner notes */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <StickyNote size={18} className="text-love" /> 서로에 대한 메모
        </h2>

        <form onSubmit={addNote} className="mb-3 flex flex-col gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="상대방의 특징, 취향, 기억할 것들…"
            className={inputCls + " resize-none"}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              <input
                type="checkbox"
                checked={notePrivate}
                onChange={(e) => setNotePrivate(e.target.checked)}
                className="accent-[#c25e75]"
              />
              <Lock size={12} /> 나만 보기
            </label>
            <button
              type="submit"
              className="rounded-xl bg-love px-4 py-2 text-sm font-medium text-white transition hover:bg-love-dark"
            >
              추가
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            첫 메모를 남겨보세요 📝
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-2 rounded-xl border border-beige bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap">{n.content}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    {n.author_id === myId ? "나" : "상대"}
                    {n.is_private && (
                      <span className="inline-flex items-center gap-0.5 text-love">
                        <Lock size={10} /> 비공개
                      </span>
                    )}
                  </p>
                </div>
                {n.author_id === myId && (
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => removeNote(n.id)}
                    className="text-neutral-300 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {pending && (
          <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
            <Loader2 size={12} className="animate-spin" /> 처리 중…
          </p>
        )}
      </section>
    </div>
  );
}
