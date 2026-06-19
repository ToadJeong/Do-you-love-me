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

  addOptimistic: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  reconcile: (tempId, real) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === tempId ? real : e)),
    })),

  remove: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
