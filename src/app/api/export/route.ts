import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exports the couple's data as a downloadable JSON backup (events, photo links,
 * profiles, couple meta). RLS scopes every query to the caller's couple.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [couple, members, events, photos] = await Promise.all([
    supabase.from("couples").select("*").maybeSingle(),
    supabase.from("users").select("id, nickname, profile_image_url, couple_id"),
    supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true }),
    supabase
      .from("gallery_photos")
      .select("*")
      .order("uploaded_at", { ascending: true }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    couple: couple.data ?? null,
    members: members.data ?? [],
    calendar_events: events.data ?? [],
    gallery_photos: photos.data ?? [],
  };

  const filename = `do-you-love-me-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
