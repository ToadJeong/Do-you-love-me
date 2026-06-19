"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import type { AppUser } from "@/lib/types";

interface AuthProviderProps {
  userId: string | null;
  profile: AppUser | null;
  children: React.ReactNode;
}

/**
 * Hydrates the global Zustand user store with the server-resolved session.
 *
 * Rendered high in the tree (root layout) with values fetched in a Server
 * Component, so `coupleId` is available synchronously on the client from the
 * first paint — no auth flicker, no extra round-trip.
 */
export function AuthProvider({ userId, profile, children }: AuthProviderProps) {
  const setUser = useUserStore((s) => s.setUser);

  // Seed synchronously on first render so children never see a null flash.
  // useState's initializer runs exactly once, which is the React-sanctioned
  // place for this one-time hydration.
  useState(() => {
    useUserStore.setState({
      userId,
      profile,
      coupleId: profile?.couple_id ?? null,
      isHydrated: true,
    });
  });

  // Keep in sync if the server values change across navigations.
  useEffect(() => {
    setUser(userId, profile);
  }, [userId, profile, setUser]);

  return <>{children}</>;
}
