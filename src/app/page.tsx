import { redirect } from "next/navigation";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { getCouple, getEventsInRange } from "@/lib/couples";
import { Dday } from "@/components/home/Dday";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { signout } from "./(auth)/actions";

/**
 * Main home: D-Day dashboard + shared monthly calendar.
 * Unconnected users are sent to onboarding first.
 */
export default async function Home() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const couple = await getCouple();
  if (!couple) {
    redirect("/onboarding");
  }

  // Fetch the events covering the current month's visible grid.
  const now = new Date();
  const from = format(startOfWeek(startOfMonth(now)), "yyyy-MM-dd");
  const to = format(endOfWeek(endOfMonth(now)), "yyyy-MM-dd");
  const events = await getEventsInRange(from, to);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 py-10">
      <Dday startDate={couple.start_date} />

      <MonthCalendar initialEvents={events} />

      <section className="rounded-2xl bg-neutral-50 p-4 text-sm">
        <p className="font-medium text-neutral-700">파트너 초대 코드</p>
        <p className="mt-1 break-all font-mono text-xs text-neutral-500">
          {couple.id}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          이 코드를 파트너에게 공유하면 같은 커플로 연결돼요.
        </p>
      </section>

      <form action={signout}>
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium transition active:scale-[0.99]"
        >
          로그아웃
        </button>
      </form>
    </main>
  );
}
