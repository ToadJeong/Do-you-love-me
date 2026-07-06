import { create } from "zustand";
import type { ExternalEvent } from "@/lib/types";

/**
 * Read-only external calendar events (Google Calendar overlay) for the
 * currently viewed month. Replaced wholesale whenever the month changes.
 */
interface ExternalState {
  events: ExternalEvent[];
  setEvents: (events: ExternalEvent[]) => void;
}

export const useExternalStore = create<ExternalState>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
}));
