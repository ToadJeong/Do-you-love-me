import { redirect } from "next/navigation";
import Link from "next/link";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEventsInRange } from "@/lib/couples";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";

export default async function CalendarPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const now = new Date();
  const from = format(startOfWeek(startOfMonth(now)), "yyyy-MM-dd");
  const to = format(endOfWeek(endOfMonth(now)), "yyyy-MM-dd");
  const events = await getEventsInRange(from, to);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-2xl">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500"
      >
        <ChevronLeft size={16} /> 홈으로
      </Link>
      <MonthCalendar initialEvents={events} />
    </main>
  );
}
