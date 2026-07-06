import { redirect } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, GalleryPhoto } from "@/lib/types";
import { DiaryComposer } from "./DiaryComposer";

/** Lovedays-style diary feed: all diary entries, newest first, with photos. */
export default async function DiaryPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("type", "diary")
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const diaries = (entries as CalendarEvent[] | null) ?? [];

  // Photos for the diary dates, grouped by day.
  const dates = [...new Set(diaries.map((d) => d.event_date))];
  const photosByDate = new Map<string, GalleryPhoto[]>();
  if (dates.length > 0) {
    const { data: photos } = await supabase
      .from("gallery_photos")
      .select("*")
      .in("event_date", dates);
    for (const p of (photos as GalleryPhoto[] | null) ?? []) {
      if (!p.event_date) continue;
      const list = photosByDate.get(p.event_date) ?? [];
      list.push(p);
      photosByDate.set(p.event_date, list);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-2xl md:px-8">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">다이어리</h1>

      <DiaryComposer />

      {diaries.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">
          아직 일기가 없어요. 오늘의 첫 기록을 남겨보세요 ✍️
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {diaries.map((d) => {
            const photos = photosByDate.get(d.event_date) ?? [];
            return (
              <article
                key={d.id}
                className="rounded-2xl border border-beige bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Link
                  href="/calendar"
                  className="text-xs font-medium text-love"
                >
                  {format(parseISO(d.event_date), "yyyy년 M월 d일 (EEE)", {
                    locale: ko,
                  })}
                </Link>
                {d.title && (
                  <h2 className="mt-1 text-base font-semibold">{d.title}</h2>
                )}
                {d.content && (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {d.content}
                  </p>
                )}
                {photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={p.r2_image_url}
                        alt=""
                        loading="lazy"
                        className="h-24 w-24 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
