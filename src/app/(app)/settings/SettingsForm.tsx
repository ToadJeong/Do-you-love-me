"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Copy, Check } from "lucide-react";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import {
  updateProfile,
  updateCoupleBackground,
  updateCoupleStartDate,
  updateGoogleIcsUrl,
} from "@/app/actions/settings";
import type { AppUser, Couple } from "@/lib/types";

interface Props {
  profile: AppUser;
  couple: Couple;
}

export function SettingsForm({ profile, couple }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [icsUrl, setIcsUrl] = useState(profile.google_ics_url ?? "");
  const [startDate, setStartDate] = useState(couple.start_date);
  const [avatar, setAvatar] = useState(profile.profile_image_url);
  const [bg, setBg] = useState(couple.main_bg_url);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  async function shareCode() {
    const text = `우리 커플로 연결해요 💕\n초대 코드: ${couple.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Do you love me", text });
      } else {
        await navigator.clipboard.writeText(couple.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // user cancelled share — ignore
    }
  }

  const avatarInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);

  function uploadAvatar(file: File) {
    setMsg(null);
    start(async () => {
      try {
        const url = await uploadPhotoToR2(file);
        const res = await updateProfile({ profile_image_url: url });
        if (res.ok) {
          setAvatar(url);
          router.refresh();
        } else setMsg(res.error);
      } catch {
        setMsg("업로드에 실패했어요.");
      }
    });
  }

  function uploadBg(file: File) {
    setMsg(null);
    start(async () => {
      try {
        const url = await uploadPhotoToR2(file);
        const res = await updateCoupleBackground(url);
        if (res.ok) {
          setBg(url);
          router.refresh();
        } else setMsg(res.error);
      } catch {
        setMsg("업로드에 실패했어요.");
      }
    });
  }

  function saveNickname() {
    setMsg(null);
    start(async () => {
      const res = await updateProfile({ nickname });
      setMsg(res.ok ? "저장되었어요." : res.error);
      if (res.ok) router.refresh();
    });
  }

  function saveStartDate() {
    setMsg(null);
    start(async () => {
      const res = await updateCoupleStartDate(startDate);
      setMsg(res.ok ? "저장되었어요." : res.error);
      if (res.ok) router.refresh();
    });
  }

  function saveIcsUrl() {
    setMsg(null);
    start(async () => {
      const res = await updateGoogleIcsUrl(icsUrl);
      setMsg(res.ok ? "구글 캘린더를 연결했어요." : res.error);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* profile image */}
      <section className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-300">
              나
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            <Upload size={15} /> 프로필 사진 변경
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
      </section>

      {/* nickname */}
      <section>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">닉네임</label>
        <div className="mt-2 flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={saveNickname}
            className="rounded-xl bg-love px-4 text-sm font-medium text-white transition hover:bg-love-dark"
          >
            저장
          </button>
        </div>
      </section>

      {/* start date */}
      <section>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          사귄 날 (D-Day 기준)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-base outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={saveStartDate}
            className="rounded-xl bg-love px-4 text-sm font-medium text-white transition hover:bg-love-dark"
          >
            저장
          </button>
        </div>
      </section>

      {/* background image */}
      <section>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          메인 배경 사진
        </label>
        <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="relative h-40 w-full bg-neutral-100 dark:bg-neutral-800">
            {bg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bg} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EF8F9B] to-[#C8546B] text-sm text-white">
                기본 배경
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => bgInput.current?.click()}
            className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium"
          >
            <Upload size={15} /> 배경 사진 변경
          </button>
          <input
            ref={bgInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadBg(e.target.files[0])}
          />
        </div>
      </section>

      {/* google calendar */}
      <section>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          구글 캘린더 연결 (읽기 전용 오버레이)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            placeholder="https://calendar.google.com/…/basic.ics"
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-love dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={saveIcsUrl}
            className="rounded-xl bg-love px-4 text-sm font-medium text-white transition hover:bg-love-dark"
          >
            저장
          </button>
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          구글 캘린더 → 설정 → 내 캘린더 → 캘린더 통합 → &quot;iCal 형식의 비공개
          주소&quot;를 복사해 붙여넣으면 캘린더에 파란 점으로 표시됩니다. (비워두면
          연결 해제)
        </p>
      </section>

      {/* invite code */}
      <section className="rounded-2xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-neutral-700 dark:text-neutral-200">파트너 초대 코드</p>
          <button
            type="button"
            onClick={shareCode}
            className="inline-flex items-center gap-1.5 rounded-full bg-love px-3 py-1.5 text-xs font-medium text-white transition hover:bg-love-dark"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "복사됨" : "공유"}
          </button>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-neutral-500">
          {couple.id}
        </p>
      </section>

      {(pending || msg) && (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          {pending && <Loader2 size={15} className="animate-spin" />}
          {pending ? "처리 중…" : msg}
        </p>
      )}
    </div>
  );
}
