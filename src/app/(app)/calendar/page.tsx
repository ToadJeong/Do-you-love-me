import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { fetchMonthEvents } from "@/app/actions/events";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";

export default async function CalendarPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const events = await fetchMonthEvents(format(new Date(), "yyyy-MM-dd"));

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-5xl md:px-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">캘린더</h1>
      <MonthCalendar initialEvents={events} />
    </main>
  );
}
