import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseIcs } from "@/lib/ics";
import type { ExternalEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Returns the couple's Google Calendar events (both partners' connected iCal
 * feeds) within [from, to], for overlaying on the shared calendar. Read-only.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ events: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "missing range" }, { status: 400 });
  }

  // Both members' ICS URLs (RLS lets a user read their partner's row).
  const { data: members } = await supabase
    .from("users")
    .select("google_ics_url")
    .not("google_ics_url", "is", null);

  const urls = ((members as { google_ics_url: string | null }[] | null) ?? [])
    .map((m) => m.google_ics_url)
    .filter((u): u is string => !!u);

  const all: ExternalEvent[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const text = await res.text();
        all.push(...parseIcs(text, from, to));
      } catch {
        // ignore a single failing feed
      }
    }),
  );

  return NextResponse.json({ events: all });
}
