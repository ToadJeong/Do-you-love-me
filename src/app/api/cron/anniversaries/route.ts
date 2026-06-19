import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUpcomingAnniversaries } from "@/lib/dday";
import { sendPush } from "@/lib/webpush";

export const dynamic = "force-dynamic";

// Notify when an anniversary is this many days away.
const REMIND_AT = new Set([0, 1, 3]);

/**
 * Daily cron (see vercel.json): for every couple, find anniversaries that are
 * today / tomorrow / in 3 days and push a reminder to both partners' devices.
 * Secured by CRON_SECRET (Vercel sends it as a Bearer token).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: couples } = await supabase
    .from("couples")
    .select("id, start_date");
  if (!couples) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;

  for (const couple of couples as { id: string; start_date: string }[]) {
    const due = getUpcomingAnniversaries(couple.start_date, 8).filter((a) =>
      REMIND_AT.has(a.daysUntil),
    );
    if (due.length === 0) continue;

    const a = due[0];
    const when = format(a.date, "yyyy.MM.dd");
    const payload =
      a.daysUntil === 0
        ? { title: "오늘은 기념일이에요 🎉", body: `${a.label} · ${when}`, url: "/" }
        : {
            title: "기념일이 다가와요 💕",
            body: `${a.label}까지 D-${a.daysUntil} (${when})`,
            url: "/",
          };

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("couple_id", couple.id);

    for (const sub of (subs ?? []) as {
      endpoint: string;
      p256dh: string;
      auth: string;
    }[]) {
      const status = await sendPush(sub, payload);
      if (status === 404 || status === 410) {
        // Subscription expired — clean it up.
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      } else if (status >= 200 && status < 300) {
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
