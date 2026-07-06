"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  MapPin,
  ImagePlus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import koreaMap from "@/data/korea-map.json";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { uploadPhotoToR2 } from "@/lib/uploadPhoto";
import { markRegion, setRegionPhoto, unmarkRegion } from "@/app/actions/map";
import type { MapRegion } from "@/lib/types";

interface RegionShape {
  code: string;
  name: string;
  sido: string;
  d: string;
  cx: number;
  cy: number;
}

const { width: W, height: H, regions } = koreaMap as {
  width: number;
  height: number;
  regions: RegionShape[];
};

const MIN_W = W / 40; // deep zoom (Seoul districts)
const MAX_W = W * 1.2;

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Scratch-art travel map of Korea (250 시군구, Seoul at 구 level).
 * Zoom (buttons / wheel / pinch) + pan (drag). Visited regions fill with the
 * couple's travel photo via SVG patterns; visited-without-photo fills rose.
 */
export function TravelMap({ initialRegions }: { initialRegions: MapRegion[] }) {
  const coupleId = useUserStore((s) => s.coupleId);
  const [visited, setVisited] = useState<Map<string, MapRegion>>(
    () => new Map(initialRegions.map((r) => [r.region_code, r])),
  );
  const [vb, setVb] = useState<ViewBox>({ x: 0, y: 0, w: W, h: H });
  const [selected, setSelected] = useState<RegionShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist = useRef<number | null>(null);
  const moved = useRef(false);

  function upsertLocal(r: MapRegion) {
    setVisited((prev) => new Map(prev).set(r.region_code, r));
  }
  function removeLocal(code: string) {
    setVisited((prev) => {
      const next = new Map(prev);
      next.delete(code);
      return next;
    });
  }

  // Live-sync scratches between partners.
  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`map:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_regions",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { region_code?: string };
            if (old.region_code) removeLocal(old.region_code);
          } else {
            upsertLocal(payload.new as MapRegion);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  /** client pixel -> svg coords */
  function toSvg(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: vb.x + ((clientX - rect.left) / rect.width) * vb.w,
      y: vb.y + ((clientY - rect.top) / rect.height) * vb.h,
    };
  }

  function zoomAt(cx: number, cy: number, factor: number) {
    setVb((v) => {
      const w = Math.min(MAX_W, Math.max(MIN_W, v.w * factor));
      const h = w * (H / W);
      const kx = (cx - v.x) / v.w;
      const ky = (cy - v.y) / v.h;
      return { x: cx - kx * w, y: cy - ky * h, w, h };
    });
  }

  function zoomCenter(factor: number) {
    zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, factor);
  }

  function zoomToSeoul() {
    const seoul = regions.filter((r) => r.sido === "11");
    const xs = seoul.map((r) => r.cx);
    const ys = seoul.map((r) => r.cy);
    const pad = 22;
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    const w = Math.max(...xs) - x + pad * 2;
    setVb({ x, y, w, h: w * (H / W) });
  }

  // --- pointer interactions (pan + pinch) ---
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pts = pointers.current;
    if (pts.size === 2) {
      // pinch zoom
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current != null && dist > 0) {
        const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomAt(mid.x, mid.y, pinchDist.current / dist);
      }
      pinchDist.current = dist;
      moved.current = true;
      return;
    }
    // drag pan
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - prev.x) / rect.width) * vb.w;
    const dy = ((e.clientY - prev.y) / rect.height) * vb.h;
    if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 3) {
      moved.current = true;
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setVb((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    const pt = toSvg(e.clientX, e.clientY);
    zoomAt(pt.x, pt.y, e.deltaY > 0 ? 1.18 : 1 / 1.18);
  }

  function handleRegionClick(r: RegionShape) {
    if (moved.current) return; // it was a drag, not a tap
    setSelected(r);
    setError(null);
  }

  // --- mutations (optimistic) ---
  function doMark(r: RegionShape, photoUrl?: string | null) {
    const optimistic: MapRegion = {
      id: `temp-${r.code}`,
      couple_id: coupleId ?? "",
      region_code: r.code,
      region_name: r.name,
      photo_url: photoUrl ?? visited.get(r.code)?.photo_url ?? null,
      visited_at: null,
      created_at: new Date().toISOString(),
    };
    upsertLocal(optimistic);
    startBusy(async () => {
      const res = await markRegion({
        region_code: r.code,
        region_name: r.name,
        photo_url: optimistic.photo_url,
      });
      if (res.ok) upsertLocal(res.region);
      else {
        removeLocal(r.code);
        setError(res.error);
      }
    });
  }

  function doUnmark(r: RegionShape) {
    const prev = visited.get(r.code);
    removeLocal(r.code);
    startBusy(async () => {
      const res = await unmarkRegion(r.code);
      if (!res.ok && prev) upsertLocal(prev);
    });
  }

  function handlePhoto(file: File) {
    if (!selected) return;
    const r = selected;
    setError(null);
    startBusy(async () => {
      try {
        const url = await uploadPhotoToR2(file);
        if (visited.has(r.code)) {
          const cur = visited.get(r.code)!;
          upsertLocal({ ...cur, photo_url: url });
          await setRegionPhoto(r.code, url);
        } else {
          doMark(r, url);
        }
      } catch {
        setError("사진 업로드에 실패했어요. (R2 설정 확인)");
      }
    });
  }

  const photoRegions = useMemo(
    () => [...visited.values()].filter((v) => v.photo_url),
    [visited],
  );
  const sel = selected ? visited.get(selected.code) : undefined;

  return (
    <div className="relative">
      {/* stats + controls */}
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin size={15} className="text-love" />
          <span className="font-semibold text-love tabular-nums">
            {visited.size}
          </span>
          / {regions.length} 지역
        </p>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => zoomCenter(1 / 1.4)} aria-label="확대"
            className="rounded-lg border border-beige bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            <ZoomIn size={16} />
          </button>
          <button type="button" onClick={() => zoomCenter(1.4)} aria-label="축소"
            className="rounded-lg border border-beige bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            <ZoomOut size={16} />
          </button>
          <button type="button" onClick={() => setVb({ x: 0, y: 0, w: W, h: H })} aria-label="전체 보기"
            className="rounded-lg border border-beige bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            <Maximize size={16} />
          </button>
          <button type="button" onClick={zoomToSeoul}
            className="rounded-lg border border-beige bg-white px-3 py-2 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-900">
            서울
          </button>
        </div>
      </div>

      {/* map */}
      <div className="overflow-hidden rounded-2xl border border-beige bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="h-[62dvh] w-full touch-none select-none md:h-[70dvh]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <defs>
            {photoRegions.map((v) => (
              <pattern
                key={v.region_code}
                id={`ph-${v.region_code}`}
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image
                  href={v.photo_url!}
                  width="1"
                  height="1"
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            ))}
          </defs>
          {regions.map((r) => {
            const v = visited.get(r.code);
            const fill = v?.photo_url
              ? `url(#ph-${r.code})`
              : v
                ? "#f2b8c6"
                : "#f1e7d7";
            return (
              <path
                key={r.code}
                d={r.d}
                fill={fill}
                stroke={selected?.code === r.code ? "#c25e75" : "#ffffff"}
                strokeWidth={selected?.code === r.code ? vb.w / 400 : vb.w / 900}
                onClick={() => handleRegionClick(r)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
      </div>

      {/* region panel */}
      {selected && (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md rounded-t-3xl border border-beige bg-white p-5 shadow-2xl md:bottom-6 md:rounded-3xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {selected.name}
              {sel && <span className="ml-2 text-xs font-medium text-love">방문 완료</span>}
            </h3>
            <button type="button" aria-label="닫기" onClick={() => setSelected(null)}>
              <X size={18} className="text-neutral-400" />
            </button>
          </div>

          {sel?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sel.photo_url} alt="" className="mb-3 h-28 w-full rounded-xl object-cover" />
          )}
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            {!sel ? (
              <button
                type="button"
                onClick={() => doMark(selected)}
                className="flex-1 rounded-xl bg-love py-2.5 text-sm font-medium text-white transition hover:bg-love-dark"
              >
                다녀왔어요 ✔
              </button>
            ) : (
              <button
                type="button"
                onClick={() => doUnmark(selected)}
                className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-500 dark:border-neutral-700"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-love py-2.5 text-sm font-medium text-love"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              사진으로 채우기
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}
