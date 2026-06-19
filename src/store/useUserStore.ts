import { create } from "zustand";
import type { AppUser } from "@/lib/types";

/**
 * Global auth/profile state.
 *
 * `coupleId` is the single most important value in the app: almost every
 * read/write is scoped by it (and enforced by RLS server-side). It is
 * hydrated once on the client from server-fetched data (see AuthProvider)
 * and then read anywhere via `useUserStore`.
 */
interface UserState {
  /** The authenticated user's id (auth.users.id), or null when logged out. */
  userId: string | null;
  /** The user's profile row from public.users. */
  profile: AppUser | null;
  /** Convenience accessor — the couple this user belongs to. */
  coupleId: string | null;
  /** True once hydration from the server has been attempted. */
  isHydrated: boolean;

  setUser: (userId: string | null, profile: AppUser | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  profile: null,
  coupleId: null,
  isHydrated: false,

  setUser: (userId, profile) =>
    set({
      userId,
      profile,
      coupleId: profile?.couple_id ?? null,
      isHydrated: true,
    }),

  clear: () =>
    set({
      userId: null,
      profile: null,
      coupleId: null,
      isHydrated: true,
    }),
}));
