"use client";

import { useState } from "react";

const PRESETS = [
  { id: "", label: "러브 레드", swatch: "#c8546b" },
  { id: "theme-ocean", label: "오션", swatch: "#2f7fb5" },
  { id: "theme-forest", label: "포레스트", swatch: "#3f9d6e" },
  { id: "theme-grape", label: "그레이프", swatch: "#8a5cc4" },
] as const;

const CLASSES = PRESETS.map((p) => p.id).filter(Boolean);

/** Accent-color preset picker; recolors brand tokens app-wide (persisted). */
export function AccentPicker() {
  const [active, setActive] = useState<string>(() => {
    if (typeof document === "undefined") return "";
    return CLASSES.find((c) => document.documentElement.classList.contains(c)) ?? "";
  });

  function apply(id: string) {
    const root = document.documentElement;
    CLASSES.forEach((c) => root.classList.remove(c));
    if (id) root.classList.add(id);
    setActive(id);
    try {
      localStorage.setItem("accent", id);
    } catch {
      // ignore storage failures
    }
  }

  return (
    <section>
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        포인트 컬러
      </label>
      <div className="mt-2 flex gap-3" suppressHydrationWarning>
        {PRESETS.map((p) => (
          <button
            key={p.id || "default"}
            type="button"
            onClick={() => apply(p.id)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-neutral-900 ${
                active === p.id ? "ring-neutral-900 dark:ring-white" : "ring-transparent"
              }`}
              style={{ background: p.swatch }}
            />
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
