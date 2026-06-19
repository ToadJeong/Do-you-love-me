import { redirect } from "next/navigation";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
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
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-5xl md:px-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">캘린더</h1>
      <MonthCalendar initialEvents={events} />
    </main>
  );
}
