"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/store/useGalleryStore";

interface Props {
  photos: GalleryItem[];
  startIndex: number;
  onClose: () => void;
}

/** Fullscreen swipeable carousel for viewing high-res photos. */
export function PhotoCarousel({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const current = photos[index];
  if (!current) return null;
  const src = current.localPreview ?? current.r2_image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10"
      >
        <X size={24} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="이전"
            onClick={() => go(-1)}
            className="absolute left-2 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 md:left-6"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            type="button"
            aria-label="다음"
            onClick={() => go(1)}
            className="absolute right-2 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 md:right-6"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          setTouchStartX(null);
        }}
        className="max-h-[88dvh] max-w-[92vw] select-none object-contain"
      />

      <div className="absolute bottom-5 left-0 w-full text-center text-sm text-white/70 tabular-nums">
        {index + 1} / {photos.length}
      </div>
    </div>
  );
}
