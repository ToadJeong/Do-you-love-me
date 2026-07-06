"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Heart } from "lucide-react";
import {
  getDayCount,
  getUpcomingAnniversaries,
  type Anniversary,
} from "@/lib/dday";
import { syncDdayToWidget } from "@/lib/widgetSync";
import { StatusPicker } from "./StatusPicker";
import type { AppUser } from "@/lib/types";

interface HeroProps {
  startDate: string;
  bgUrl: string | null;
  members: AppUser[];
  myId: string;
  customAnniversaries: { label: string; dateISO: string }[];
}

function Avatar({ user, fallback }: { user?: AppUser; fallback: string }) {
  if (user?.profile_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profile_image_url}
        alt={user.nickname ?? ""}
        className="h-16 w-16 rounded-full border-2 border-white/80 object-cover shadow-lg"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-white/20 text-xl font-medium text-white backdrop-blur-sm">
      {fallback}
    </div>
  );
}

function StatusChip({
  user,
  onClick,
}: {
  user?: AppUser;
  onClick?: () => void;
}) {
  const has = user?.status_emoji || user?.status_text;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`max-w-[130px] truncate rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${
        has ? "bg-white/25 text-white" : "bg-white/15 text-white/70"
      } ${onClick ? "active:scale-95" : ""}`}
    >
      {has
        ? `${user?.status_emoji ?? ""} ${user?.status_text ?? ""}`.trim()
        : onClick
          ? "+ 상태 설정"
          : "상태 없음"}
    </button>
  );
}

/**
 * Lovedays-style main screen: full-bleed couple background with a darkening
 * gradient for legibility, a profile-heart header, the big D+N headline, and a
 * glassmorphism card of upcoming anniversaries.
 */
export function Hero({
  startDate,
  bgUrl,
  members,
  myId,
  customAnniversaries,
}: HeroProps) {
  const now = new Date();
  const dayCount = getDayCount(startDate, now);

  // Merge auto milestones (100-day / yearly) with the couple's own anniversary
  // events, nearest first.
  const custom: Anniversary[] = customAnniversaries.map((c) => ({
    label: c.label,
    date: parseISO(c.dateISO),
    daysUntil: differenceInCalendarDays(parseISO(c.dateISO), now),
  }));
  const anniversaries = [...getUpcomingAnniversaries(startDate, 4, now), ...custom]
    .filter((a) => a.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4);

  const me = members.find((m) => m.id === myId);
  const partner = members.find((m) => m.id !== myId);
  const [statusOpen, setStatusOpen] = useState(false);

  // Mirror the D-Day into native storage for the Android home-screen widget
  // (no-op on plain web).
  useEffect(() => {
    syncDdayToWidget(startDate, dayCount);
  }, [startDate, dayCount]);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden">
      {/* background */}
      <div className="absolute inset-0">
        {bgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#EF8F9B] via-[#D98994] to-[#C8546B]" />
        )}
        {/* gradient overlay for white-text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/65" />
      </div>

      {/* content */}
      <div className="relative flex min-h-dvh flex-col px-6 pb-12 pt-12 text-white">
        {/* profile heart header */}
        <header className="flex items-center justify-center gap-5">
          <Avatar user={me} fallback="나" />
          <Heart size={26} className="fill-white text-white drop-shadow" />
          {partner ? (
            <Avatar user={partner} fallback="너" />
          ) : (
            <Link
              href="/settings"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/70 text-sm text-white/90"
            >
              초대
            </Link>
          )}
        </header>

        {/* mood/status chips */}
        <div className="mt-3 flex items-center justify-center gap-8">
          <StatusChip user={me} onClick={() => setStatusOpen(true)} />
          {partner && <StatusChip user={partner} />}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {/* D-day */}
          <div className="text-center">
            <p className="text-sm tracking-wide text-white/80">우리가 만난 지</p>
            <p
              suppressHydrationWarning
              className="mt-2 font-serif text-7xl font-semibold tracking-tight tabular-nums drop-shadow-lg"
            >
              D+{dayCount}
            </p>
            <p className="mt-2 text-xs text-white/70">
              since {format(new Date(startDate), "yyyy.MM.dd")}
            </p>
          </div>

          {/* anniversaries glass card */}
          {anniversaries.length > 0 && (
            <div
              suppressHydrationWarning
              className="mt-10 rounded-3xl border border-white/25 bg-white/15 p-4 backdrop-blur-md"
            >
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-widest text-white/75">
                다가오는 기념일
              </p>
              <ul className="divide-y divide-white/15">
                {anniversaries.map((a) => (
                  <li
                    key={a.label}
                    className="flex items-center justify-between px-1 py-2.5 text-sm"
                  >
                    <span className="font-medium">{a.label}</span>
                    <span className="flex items-center gap-2 text-white/80">
                      <span>{format(a.date, "yyyy.MM.dd")}</span>
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-love tabular-nums">
                        {a.daysUntil === 0 ? "오늘" : `D-${a.daysUntil}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {statusOpen && <StatusPicker onClose={() => setStatusOpen(false)} />}
    </div>
  );
}
