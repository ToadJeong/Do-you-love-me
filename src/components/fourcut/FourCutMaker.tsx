"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Download, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { getDayCount } from "@/lib/dday";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import { addPhoto } from "@/app/actions/photos";

const FRAMES = [
  { id: "pink", label: "연핑크", bg: "#f6cfd9", text: "#a94b61" },
  { id: "beige", label: "연베이지", bg: "#f1e7d7", text: "#8a6f58" },
  { id: "black", label: "블랙", bg: "#222222", text: "#ffffff" },
  { id: "white", label: "화이트", bg: "#ffffff", text: "#c25e75" },
] as const;

// canvas geometry (final strip ≈ 640×1930, classic 4-cut ratio)
const CW = 640;
const PAD = 28;
const CELL_W = CW - PAD * 2;
const CELL_H = 438; // 4:3-ish
const GAP = 22;
const FOOTER = 130;
const CH = PAD + (CELL_H + GAP) * 4 - GAP + FOOTER + PAD;

/** Draw an image covering the cell (center-crop). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 인생네컷: pick 4 photos, compose a branded 4-cut strip on a canvas,
 * then download it and/or save it to the couple gallery.
 */
export function FourCutMaker({ startDate }: { startDate: string }) {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [frame, setFrame] = useState<(typeof FRAMES)[number]>(FRAMES[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const ready = files.every(Boolean);

  function pickSlot(i: number) {
    slotRef.current = i;
    inputRef.current?.click();
  }

  function onFile(list: FileList | null) {
    if (!list) return;
    setResultUrl(null);
    setFiles((prev) => {
      const next = [...prev];
      let slot = slotRef.current;
      // multi-select fills the following empty slots too
      for (const f of Array.from(list).slice(0, 4)) {
        while (slot < 4 && next[slot]) slot++;
        if (slot >= 4) {
          next[slotRef.current] = f; // replace the tapped slot
          break;
        }
        next[slot] = f;
      }
      return next;
    });
  }

  async function compose(): Promise<string | null> {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, 0, CW, CH);

    for (let i = 0; i < 4; i++) {
      const img = await loadImage(files[i]!);
      const y = PAD + i * (CELL_H + GAP);
      drawCover(ctx, img, PAD, y, CELL_W, CELL_H);
    }

    // footer branding
    const fy = PAD + (CELL_H + GAP) * 4 - GAP + FOOTER / 2 + 8;
    ctx.fillStyle = frame.text;
    ctx.textAlign = "center";
    ctx.font = "bold 40px Georgia, serif";
    ctx.fillText("LuvNote", CW / 2, fy);
    ctx.font = "22px sans-serif";
    ctx.fillText(
      `D+${getDayCount(startDate)} · ${format(new Date(), "yyyy.MM.dd")}`,
      CW / 2,
      fy + 36,
    );

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  function makeStrip() {
    setMsg(null);
    startBusy(async () => {
      try {
        const url = await compose();
        setResultUrl(url);
        if (!url) setMsg("사진 4장을 모두 선택해 주세요.");
      } catch {
        setMsg("이미지 합성에 실패했어요.");
      }
    });
  }

  function saveToGallery() {
    if (!resultUrl) return;
    setMsg(null);
    startBusy(async () => {
      try {
        const blob = await (await fetch(resultUrl)).blob();
        const file = new File([blob], "fourcut.jpg", { type: "image/jpeg" });
        const publicUrl = await uploadPhotoToR2(file);
        const res = await addPhoto(publicUrl, new Date().toISOString());
        setMsg(res.ok ? "갤러리에 저장했어요! 💕" : res.error);
      } catch {
        setMsg("업로드에 실패했어요. (R2 설정 확인)");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* photo slots */}
      <div className="grid grid-cols-4 gap-2">
        {files.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pickSlot(i)}
            className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-rose bg-white dark:bg-neutral-900"
          >
            {f ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus size={20} className="text-rose" />
            )}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onFile(e.target.files)}
      />

      {/* frame colors */}
      <div className="flex gap-3">
        {FRAMES.map((fr) => (
          <button
            key={fr.id}
            type="button"
            onClick={() => {
              setFrame(fr);
              setResultUrl(null);
            }}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`h-8 w-8 rounded-full border ${
                frame.id === fr.id ? "ring-2 ring-love ring-offset-2" : "border-neutral-200"
              }`}
              style={{ background: fr.bg }}
            />
            <span className="text-[11px] text-neutral-500">{fr.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={makeStrip}
        disabled={!ready || busy}
        className="rounded-xl bg-love py-3 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-40"
      >
        {busy ? "만드는 중…" : "네컷 만들기 📸"}
      </button>

      {msg && <p className="text-sm text-neutral-500">{msg}</p>}

      {/* result */}
      {resultUrl && (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="인생네컷 결과"
            className="w-56 rounded-xl shadow-lg"
          />
          <div className="flex w-full gap-2">
            <a
              href={resultUrl}
              download={`luvnote-fourcut-${format(new Date(), "yyyyMMdd")}.jpg`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-love py-2.5 text-sm font-medium text-love"
            >
              <Download size={15} /> 저장
            </a>
            <button
              type="button"
              onClick={saveToGallery}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UploadCloud size={15} />
              )}
              갤러리에 올리기
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} width={CW} height={CH} hidden />
    </div>
  );
}
