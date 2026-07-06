"use client";

import { useEffect, useState } from "react";
import { RotateCw, X, Check } from "lucide-react";
import { FILTERS, combinedFilter, type FilterId } from "@/lib/filters";

interface Props {
  file: File;
  onDone: (edited: File) => void;
  onClose: () => void;
}

/**
 * Basic photo editor: preset filters, brightness/contrast/saturation sliders,
 * 90° rotation. Preview is CSS (WYSIWYG); export renders through a canvas
 * with the same filter so the saved file matches the preview.
 */
export function PhotoEditor({ file, onDone, onClose }: Props) {
  // The modal is mounted per file, so a lazy initializer is sufficient.
  const [url] = useState<string>(() => URL.createObjectURL(file));
  const [filter, setFilter] = useState<FilterId>("none");
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturate, setSaturate] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const css = combinedFilter(filter, { brightness, contrast, saturate });

  async function exportFile() {
    setBusy(true);
    try {
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const rot = ((rotate % 360) + 360) % 360;
      const swap = rot === 90 || rot === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swap ? img.height : img.width;
      canvas.height = swap ? img.width : img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = css || "none";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const blob: Blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b!), "image/jpeg", 0.92),
      );
      onDone(new File([blob], file.name.replace(/\.\w+$/, "") + "-edit.jpg", { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  const slider =
    "w-full accent-[#c25e75]";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button type="button" onClick={onClose} aria-label="닫기">
          <X size={22} />
        </button>
        <span className="text-sm font-medium">사진 편집</span>
        <button
          type="button"
          onClick={exportFile}
          disabled={busy}
          aria-label="완료"
          className="text-love"
        >
          <Check size={24} />
        </button>
      </div>

      {/* preview */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          style={{ filter: css, transform: `rotate(${rotate}deg)` }}
          className="max-h-full max-w-full object-contain transition-transform"
        />
      </div>

      {/* controls */}
      <div className="bg-white p-4 dark:bg-neutral-900">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f.id
                  ? "bg-love text-white"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRotate((r) => r + 90)}
            className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800"
          >
            <RotateCw size={13} className="inline" /> 회전
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[11px] text-neutral-500">
          <label>
            밝기
            <input type="range" min="0.6" max="1.4" step="0.02" value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))} className={slider} />
          </label>
          <label>
            대비
            <input type="range" min="0.6" max="1.4" step="0.02" value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))} className={slider} />
          </label>
          <label>
            채도
            <input type="range" min="0" max="2" step="0.05" value={saturate}
              onChange={(e) => setSaturate(Number(e.target.value))} className={slider} />
          </label>
        </div>
      </div>
    </div>
  );
}
