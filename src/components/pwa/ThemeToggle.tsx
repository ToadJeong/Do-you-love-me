"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/** Light/dark theme switch, persisted to localStorage. */
export function ThemeToggle() {
  // Initialise from the class the no-flash script already applied to <html>.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  return (
    <section>
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        테마
      </label>
      <button
        type="button"
        onClick={toggle}
        suppressHydrationWarning
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition dark:border-neutral-700 dark:text-neutral-200"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        {theme === "dark" ? "라이트 모드" : "다크 모드"}
      </button>
    </section>
  );
}
