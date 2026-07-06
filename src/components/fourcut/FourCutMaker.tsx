"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Download,
  ImagePlus,
  Loader2,
  Send,
  Share2,
  UploadCloud,
} from "lucide-react";
import { getDayCount } from "@/lib/dday";
import { FILTERS, filterCss, type FilterId } from "@/lib/filters";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import { addPhoto } from "@/app/actions/photos";
import { sendMessage } from "@/app/actions/chat";

/* ------------------------------ layouts ------------------------------ */
// Real photo-booth style variations (cols × rows), each with its own cell size.
const LAYOUTS = [
  { id: "strip4", label: "세로 4컷", cols: 1, rows: 4, cellW: 584, cellH: 438 },
  { id: "grid4", label: "2×2", cols: 2, rows: 2, cellW: 470, cellH: 580 },
  { id: "strip3", label: "세로 3컷", cols: 1, rows: 3, cellW: 584, cellH: 540 },
  { id: "six", label: "6컷", cols: 2, rows: 3, cellW: 470, cellH: 430 },
] as const;
type Layout = (typeof LAYOUTS)[number];

const PAD = 28;
const GAP = 22;
const FOOTER = 130;
const dims = (l: Layout) => ({
  w: PAD * 2 + l.cols * l.cellW + (l.cols - 1) * GAP,
  h: PAD * 2 + l.rows * l.cellH + (l.rows - 1) * GAP + FOOTER,
});

/* ------------------------------- frames ------------------------------ */
type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
const solid = (c: string): Paint => (ctx, w, h) => {
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, w, h);
};
const gradient = (a: string, b: string): Paint => (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};
const hearts = (bg: string, fg: string): Paint => (ctx, w, h) => {
  solid(bg)(ctx, w, h);
  ctx.fillStyle = fg;
  for (let y = 20; y < h; y += 64) {
    for (let x = 20 + ((y / 64) % 2) * 32; x < w; x += 64) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.5, 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-14, 0, -8, -14, 0, -6);
      ctx.bezierCurveTo(8, -14, 14, 0, 0, 12);
      ctx.fill();
      ctx.restore();
    }
  }
};
const dots = (bg: string, fg: string): Paint => (ctx, w, h) => {
  solid(bg)(ctx, w, h);
  ctx.fillStyle = fg;
  for (let y = 18; y < h; y += 46) {
    for (let x = 18 + ((y / 46) % 2) * 23; x < w; x += 46) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const FRAMES = [
  { id: "pink", label: "연핑크", text: "#a94b61", swatch: "#f6cfd9", paint: solid("#f6cfd9") },
  { id: "beige", label: "연베이지", text: "#8a6f58", swatch: "#f1e7d7", paint: solid("#f1e7d7") },
  { id: "white", label: "화이트", text: "#c25e75", swatch: "#ffffff", paint: solid("#ffffff") },
  { id: "black", label: "블랙", text: "#ffffff", swatch: "#222222", paint: solid("#222222") },
  { id: "lavender", label: "라벤더", text: "#6d5a96", swatch: "#e6ddf6", paint: solid("#e6ddf6") },
  { id: "mint", label: "민트", text: "#3f7d64", swatch: "#dcf0e6", paint: solid("#dcf0e6") },
  { id: "sunset", label: "선셋", text: "#b0455c", swatch: "linear-gradient(#fde2c8,#f6cfd9)", paint: gradient("#fde2c8", "#f6cfd9") },
  { id: "rose-grad", label: "로즈", text: "#8d2f47", swatch: "linear-gradient(#f6cfd9,#ef9db2)", paint: gradient("#f6cfd9", "#ef9db2") },
  { id: "hearts", label: "하트패턴", text: "#a94b61", swatch: "#fbe7eb", paint: hearts("#fbe7eb", "#f4b4c4") },
  { id: "dots", label: "도트", text: "#8a6f58", swatch: "#f7f0e3", paint: dots("#f7f0e3", "#e6d2b8") },
] as const;
type Frame = (typeof FRAMES)[number];

/* ------------------------------- cells ------------------------------- */
interface Cell {
  file: File;
  url: string;
  img: HTMLImageElement;
  zoom: number; // 1..3
  ox: number; // pan -1..1
  oy: number;
  filter: FilterId;
}

function loadCell(file: File): Promise<Cell> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ file, url, img, zoom: 1, ox: 0, oy: 0, filter: "none" });
    img.onerror = reject;
    img.src = url;
  });
}

/** Draw a cell image with cover-fit + pan/zoom + filter. */
function drawCell(
  ctx: CanvasRenderingContext2D,
  c: Cell,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const s = Math.max(w / c.img.width, h / c.img.height) * c.zoom;
  const sw = w / s;
  const sh = h / s;
  const maxX = (c.img.width - sw) / 2;
  const maxY = (c.img.height - sh) / 2;
  const sx = maxX + c.ox * maxX;
  const sy = maxY + c.oy * maxY;
  ctx.save();
  ctx.filter = filterCss(c.filter) || "none";
  ctx.drawImage(c.img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

/* ============================== component ============================= */

export function FourCutMaker({ startDate }: { startDate: string }) {
  const [layout, setLayout] = useState<Layout>(LAYOUTS[0]);
  const [frame, setFrame] = useState<Frame>(FRAMES[0]);
  const [cells, setCells] = useState<(Cell | null)[]>(Array(4).fill(null));
  const [sel, setSel] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [fmt, setFmt] = useState<"jpg" | "png">("jpg");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const count = layout.cols * layout.rows;
  const ready = cells.slice(0, count).every(Boolean);
  const selCell = cells[sel];

  function switchLayout(l: Layout) {
    setLayout(l);
    setResultUrl(null);
    setSel(0);
    setCells((prev) => {
      const next = [...prev];
      while (next.length < l.cols * l.rows) next.push(null);
      return next;
    });
  }

  function updateCell(i: number, patch: Partial<Cell>) {
    setResultUrl(null);
    setCells((prev) =>
      prev.map((c, idx) => (idx === i && c ? { ...c, ...patch } : c)),
    );
  }

  async function onFiles(list: FileList | null) {
    if (!list) return;
    setResultUrl(null);
    const loaded = await Promise.all(Array.from(list, loadCell));
    setCells((prev) => {
      const next = [...prev];
      let slot = sel;
      for (const cell of loaded) {
        while (slot < count && next[slot]) slot++;
        if (slot >= count) {
          next[sel] = cell; // replace tapped slot when everything is full
          break;
        }
        next[slot] = cell;
      }
      return next;
    });
  }

  // drag-to-pan inside the selected slot
  function panStart(e: React.PointerEvent, i: number) {
    setSel(i);
    if (!cells[i]) return;
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function panMove(e: React.PointerEvent, i: number) {
    if (!drag.current || !cells[i]) return;
    const dx = (e.clientX - drag.current.x) / 60;
    const dy = (e.clientY - drag.current.y) / 60;
    drag.current = { x: e.clientX, y: e.clientY };
    const c = cells[i]!;
    updateCell(i, {
      ox: Math.max(-1, Math.min(1, c.ox - dx)),
      oy: Math.max(-1, Math.min(1, c.oy - dy)),
    });
  }

  async function compose(): Promise<string | null> {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return null;
    const { w, h } = dims(layout);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    frame.paint(ctx, w, h);

    for (let i = 0; i < count; i++) {
      const col = i % layout.cols;
      const row = Math.floor(i / layout.cols);
      drawCell(
        ctx,
        cells[i]!,
        PAD + col * (layout.cellW + GAP),
        PAD + row * (layout.cellH + GAP),
        layout.cellW,
        layout.cellH,
      );
    }

    const fy = h - FOOTER / 2 - PAD / 2 + 8;
    ctx.fillStyle = frame.text;
    ctx.textAlign = "center";
    ctx.font = "bold 40px Georgia, serif";
    ctx.fillText("LuvNote", w / 2, fy);
    ctx.font = "22px sans-serif";
    ctx.fillText(
      `D+${getDayCount(startDate)} · ${format(new Date(), "yyyy.MM.dd")}`,
      w / 2,
      fy + 36,
    );

    return fmt === "png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.92);
  }

  function makeStrip() {
    setMsg(null);
    startBusy(async () => {
      try {
        setResultUrl(await compose());
      } catch {
        setMsg("이미지 합성에 실패했어요.");
      }
    });
  }

  async function resultFile(): Promise<File> {
    const blob = await (await fetch(resultUrl!)).blob();
    return new File([blob], `luvnote-fourcut.${fmt}`, {
      type: fmt === "png" ? "image/png" : "image/jpeg",
    });
  }

  function saveToGallery() {
    startBusy(async () => {
      try {
        const publicUrl = await uploadPhotoToR2(await resultFile());
        const res = await addPhoto(publicUrl, new Date().toISOString());
        setMsg(res.ok ? "갤러리에 저장했어요! 💕" : res.error);
      } catch {
        setMsg("업로드에 실패했어요. (R2 설정 확인)");
      }
    });
  }

  function sendToPartner() {
    startBusy(async () => {
      try {
        const publicUrl = await uploadPhotoToR2(await resultFile());
        const res = await sendMessage(`[[img:${publicUrl}]]`);
        setMsg(res.ok ? "채팅으로 보냈어요! 💌" : res.error);
      } catch {
        setMsg("전송에 실패했어요. (R2 설정 확인)");
      }
    });
  }

  function shareExternal() {
    startBusy(async () => {
      try {
        const file = await resultFile();
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "LuvNote 인생네컷" });
        } else {
          setMsg("이 기기는 파일 공유를 지원하지 않아요. '저장'을 이용해 주세요.");
        }
      } catch {
        /* user cancelled */
      }
    });
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-love text-white"
        : "bg-white text-neutral-500 border border-beige dark:bg-neutral-900 dark:border-neutral-700"
    }`;

  return (
    <div className="flex flex-col gap-4">
      {/* layout + frame pickers */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LAYOUTS.map((l) => (
          <button key={l.id} type="button" onClick={() => switchLayout(l)} className={chip(layout.id === l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {FRAMES.map((fr) => (
          <button
            key={fr.id}
            type="button"
            onClick={() => {
              setFrame(fr);
              setResultUrl(null);
            }}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <span
              className={`h-9 w-9 rounded-full border border-neutral-200 ${
                frame.id === fr.id ? "ring-2 ring-love ring-offset-2" : ""
              }`}
              style={{ background: fr.swatch }}
            />
            <span className="text-[10px] text-neutral-500">{fr.label}</span>
          </button>
        ))}
      </div>

      {/* slots */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${layout.cols === 1 ? Math.min(count, 4) : layout.cols}, 1fr)` }}
      >
        {cells.slice(0, count).map((c, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => setSel(i)}
            onPointerDown={(e) => panStart(e, i)}
            onPointerMove={(e) => panMove(e, i)}
            onPointerUp={() => (drag.current = null)}
            className={`relative aspect-[3/4] touch-none overflow-hidden rounded-xl border-2 bg-white dark:bg-neutral-900 ${
              sel === i ? "border-love" : "border-dashed border-rose"
            }`}
          >
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.url}
                alt=""
                draggable={false}
                style={{
                  filter: filterCss(c.filter),
                  transform: `scale(${c.zoom}) translate(${-c.ox * 15}%, ${-c.oy * 15}%)`,
                }}
                className="h-full w-full select-none object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center">
                <ImagePlus size={20} className="text-rose" />
              </span>
            )}
            <span className="absolute left-1 top-1 rounded-full bg-black/40 px-1.5 text-[10px] text-white">
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-xl border border-love py-2.5 text-sm font-medium text-love"
        >
          {selCell ? `${sel + 1}번 사진 바꾸기` : `${sel + 1}번 사진 선택 (여러 장 가능)`}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => onFiles(e.target.files)} />

      {/* selected-cell editor */}
      {selCell && (
        <div className="rounded-2xl border border-beige bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="mb-2 text-xs font-medium text-neutral-500">
            {sel + 1}번 컷 편집 — 썸네일을 드래그해 위치 조절
          </p>
          <label className="mb-2 block text-[11px] text-neutral-500">
            확대 {selCell.zoom.toFixed(1)}×
            <input
              type="range" min="1" max="3" step="0.05" value={selCell.zoom}
              onChange={(e) => updateCell(sel, { zoom: Number(e.target.value) })}
              className="w-full accent-[#c25e75]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f.id} type="button"
                onClick={() => updateCell(sel, { filter: f.id })}
                className={chip(selCell.filter === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* format + make */}
      <div className="flex items-center gap-2">
        {(["jpg", "png"] as const).map((f) => (
          <button key={f} type="button" onClick={() => { setFmt(f); setResultUrl(null); }}
            className={chip(fmt === f)}>
            {f.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          onClick={makeStrip}
          disabled={!ready || busy}
          className="flex-1 rounded-xl bg-love py-3 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-40"
        >
          {busy ? "만드는 중…" : "네컷 만들기 📸"}
        </button>
      </div>

      {msg && <p className="text-sm text-neutral-500">{msg}</p>}

      {/* result */}
      {resultUrl && (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="인생네컷 결과" className="w-60 rounded-xl shadow-lg" />
          <div className="grid w-full grid-cols-2 gap-2">
            <a
              href={resultUrl}
              download={`luvnote-fourcut-${format(new Date(), "yyyyMMdd")}.${fmt}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-love py-2.5 text-sm font-medium text-love"
            >
              <Download size={15} /> {fmt.toUpperCase()} 저장
            </a>
            <button type="button" onClick={shareExternal} disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-love py-2.5 text-sm font-medium text-love disabled:opacity-50">
              <Share2 size={15} /> 공유
            </button>
            <button type="button" onClick={sendToPartner} disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              상대에게 보내기
            </button>
            <button type="button" onClick={saveToGallery} disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark disabled:opacity-50">
              <UploadCloud size={15} /> 갤러리 저장
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} hidden />
    </div>
  );
}
