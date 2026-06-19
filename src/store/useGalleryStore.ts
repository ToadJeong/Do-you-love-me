import { create } from "zustand";
import type { GalleryPhoto } from "@/lib/types";

/**
 * Client-side gallery state with optimistic uploads: a local preview (object
 * URL) appears the instant a file is chosen, then the entry is reconciled with
 * the persisted row once the R2 upload + DB insert complete (or removed on
 * failure).
 */
export interface GalleryItem extends GalleryPhoto {
  /** True while the R2 upload / DB insert is still in flight. */
  pending?: boolean;
  /** Local object URL used for instant preview before the R2 URL is live. */
  localPreview?: string;
}

interface GalleryState {
  photos: GalleryItem[];
  setPhotos: (photos: GalleryPhoto[]) => void;
  addOptimistic: (item: GalleryItem) => void;
  reconcile: (tempId: string, real: GalleryPhoto) => void;
  remove: (id: string) => void;
  /** Insert-or-replace by id (used by realtime INSERT/UPDATE events). */
  upsert: (photo: GalleryPhoto) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  photos: [],

  setPhotos: (photos) => set({ photos }),

  addOptimistic: (item) => set((s) => ({ photos: [item, ...s.photos] })),

  reconcile: (tempId, real) =>
    set((s) => {
      // Dedupe against a realtime echo that may have already inserted the row.
      const realExists = s.photos.some((p) => p.id === real.id);
      return {
        photos: realExists
          ? s.photos.filter((p) => p.id !== tempId)
          : s.photos.map((p) => (p.id === tempId ? { ...real } : p)),
      };
    }),

  remove: (id) =>
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),

  upsert: (photo) =>
    set((s) => {
      const exists = s.photos.some((p) => p.id === photo.id);
      return {
        photos: exists
          ? s.photos.map((p) => (p.id === photo.id ? { ...photo } : p))
          : [{ ...photo }, ...s.photos],
      };
    }),
}));
