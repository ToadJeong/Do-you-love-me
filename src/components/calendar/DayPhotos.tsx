"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import type { GalleryItem } from "@/store/useGalleryStore";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import { readTakenAt } from "@/lib/exif";
import {
  addPhoto,
  deletePhoto,
  listPhotosForDate,
} from "@/app/actions/photos";
import { PhotoCarousel } from "@/components/gallery/PhotoCarousel";

/**
 * Photos attached to a single calendar day. Lets the couple attach photos to a
 * diary entry; photos uploaded in the main gallery with an EXIF capture date
 * also surface here automatically (event_date is set from EXIF on upload).
 */
export function DayPhotos({ dateISO }: { dateISO: string }) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listPhotosForDate(dateISO)
      .then((rows) => {
        if (active) setPhotos(rows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dateISO]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const tempId = `temp-${crypto.randomUUID()}`;
      const localPreview = URL.createObjectURL(file);
      const optimistic: GalleryItem = {
        id: tempId,
        couple_id: "",
        r2_image_url: localPreview,
        taken_at: null,
        event_date: dateISO,
        uploaded_at: new Date().toISOString(),
        pending: true,
        localPreview,
      };
      setPhotos((prev) => [...prev, optimistic]);

      startUpload(async () => {
        try {
          const takenAt = await readTakenAt(file);
          const publicUrl = await uploadPhotoToR2(file);
          const res = await addPhoto(publicUrl, takenAt, dateISO);
          if (res.ok) {
            setPhotos((prev) =>
              prev.map((p) => (p.id === tempId ? res.photo : p)),
            );
          } else {
            setPhotos((prev) => prev.filter((p) => p.id !== tempId));
          }
        } catch {
          setPhotos((prev) => prev.filter((p) => p.id !== tempId));
        } finally {
          URL.revokeObjectURL(localPreview);
        }
      });
    }
  }

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">사진</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs font-medium text-love"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImagePlus size={14} />
          )}
          추가
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewerIndex(i)}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.localPreview ?? p.r2_image_url}
                alt=""
                className={`h-full w-full object-cover ${
                  p.pending ? "opacity-60" : ""
                }`}
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">이 날의 사진이 없어요.</p>
      )}

      {viewerIndex !== null && (
        <PhotoCarousel
          photos={photos}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onDelete={(photo) => {
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            startUpload(async () => {
              await deletePhoto(photo.id);
            });
          }}
        />
      )}
    </div>
  );
}
