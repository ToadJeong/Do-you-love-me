import { create } from "zustand";
import type { CalendarEvent } from "@/lib/types";

/**
 * Holds the calendar events currently loaded on the client and supports
 * optimistic mutations: add a temporary event instantly, then reconcile with
 * the server result (or roll back on failure).
 */
interface CalendarState {
  events: CalendarEvent[];

  /** Replace the whole set (e.g. when the server provides the month's data). */
  setEvents: (events: CalendarEvent[]) => void;
  /**
   * Replace persisted events within [fromISO, toISO] with a freshly fetched
   * set (used when navigating to another month), while preserving optimistic
   * temp events and events outside the range.
   */
  mergeRange: (fromISO: string, toISO: string, fetched: CalendarEvent[]) => void;
  /** Insert an event immediately (optimistic). */
  addOptimistic: (event: CalendarEvent) => void;
  /** Swap a temporary event for the real persisted one. */
  reconcile: (tempId: string, real: CalendarEvent) => void;
  /** Remove an event (used to roll back a failed optimistic add). */
  remove: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],

  setEvents: (events) => set({ events }),

  mergeRange: (fromISO, toISO, fetched) =>
    set((s) => {
      const kept = s.events.filter(
        (e) =>
          e.id.startsWith("temp-") ||
          e.event_date < fromISO ||
          e.event_date > toISO,
      );
      // Avoid duplicating any temp event that already has a persisted twin.
      const fetchedIds = new Set(fetched.map((e) => e.id));
      return {
        events: [...kept.filter((e) => !fetchedIds.has(e.id)), ...fetched],
      };
    }),

  addOptimistic: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  reconcile: (tempId, real) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === tempId ? real : e)),
    })),

  remove: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
