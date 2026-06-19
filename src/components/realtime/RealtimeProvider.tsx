"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGalleryStore } from "@/store/useGalleryStore";
import type { CalendarEvent, GalleryPhoto } from "@/lib/types";

/**
 * Subscribes to Supabase Realtime changes for the current couple so both
 * partners' screens stay in sync: a calendar event or photo added on one
 * device appears on the other without a refresh.
 *
 * Mounted once in the authenticated app shell. Updates the global zustand
 * stores, which the calendar/gallery views read from. Inserts dedupe by id,
 * so a device receiving the echo of its own optimistic write is a no-op.
 */
export function RealtimeProvider() {
  const coupleId = useUserStore((s) => s.coupleId);

  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    const upsertEvent = useCalendarStore.getState().upsert;
    const removeEvent = useCalendarStore.getState().remove;
    const upsertPhoto = useGalleryStore.getState().upsert;
    const removePhoto = useGalleryStore.getState().remove;

    const channel = supabase
      .channel(`couple:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeEvent((payload.old as { id: string }).id);
          } else {
            upsertEvent(payload.new as CalendarEvent);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gallery_photos",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removePhoto((payload.old as { id: string }).id);
          } else {
            upsertPhoto(payload.new as GalleryPhoto);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  return null;
}
