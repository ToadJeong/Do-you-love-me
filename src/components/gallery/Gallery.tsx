"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useGalleryStore, type GalleryItem } from "@/store/useGalleryStore";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import { addPhoto } from "@/app/actions/photos";
import type { GalleryPhoto } from "@/lib/types";
import { PhotoCarousel } from "./PhotoCarousel";

interface Props {
  initialPhotos: GalleryPhoto[];
}

/**
 * Masonry photo gallery with optimistic, direct-to-R2 multi-upload.
 *
 * Layout: a single vertical column on mobile, filling out to a Pinterest-style
 * masonry grid on wider screens via CSS multi-columns.
 */
export function Gallery({ initialPhotos }: Props) {
  const setPhotos = useGalleryStore((s) => s.setPhotos);
  useState(() => setPhotos(initialPhotos));

  const photos = useGalleryStore((s) => s.photos);
  const addOptimistic = useGalleryStore((s) => s.addOptimistic);
  const reconcile = useGalleryStore((s) => s.reconcile);
  const remove = useGalleryStore((s) => s.remove);

  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      const tempId = `temp-${crypto.randomUUID()}`;
      const localPreview = URL.createObjectURL(file);

      // Show the photo instantly with its local preview.
      const optimistic: GalleryItem = {
        id: tempId,
        couple_id: "",
        r2_image_url: localPreview,
        uploaded_at: new Date().toISOString(),
        pending: true,
        localPreview,
      };
      addOptimistic(optimistic);

      startUpload(async () => {
        try {
          const publicUrl = await uploadPhotoToR2(file);
          const res = await addPhoto(publicUrl);
          if (res.ok) {
            reconcile(tempId, res.photo);
          } else {
            remove(tempId);
            setError(res.error);
          }
        } catch {
          remove(tempId);
          setError("업로드에 실패했어요. 다시 시도해 주세요.");
        } finally {
          URL.revokeObjectURL(localPreview);
        }
      });
    }
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">우리의 갤러리</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-love px-4 py-2 text-sm font-medium text-white transition hover:bg-love-dark active:scale-[0.98]"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          사진 올리기
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

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {photos.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">
          아직 사진이 없어요. 첫 추억을 올려보세요 📷
        </p>
      ) : (
        <div className="columns-2 gap-2 sm:columns-3 lg:columns-4 [&>*]:mb-2">
          {photos.map((p, i) => {
            const src = p.localPreview ?? p.r2_image_url;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setViewerIndex(i)}
                className="block w-full break-inside-avoid overflow-hidden rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className={`w-full object-cover transition ${
                    p.pending ? "opacity-60" : "hover:opacity-90"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoCarousel
          photos={photos}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </section>
  );
}
