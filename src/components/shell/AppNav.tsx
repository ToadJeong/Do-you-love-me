"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Images,
  MessageCircle,
  Settings,
  Heart,
} from "lucide-react";

const ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/gallery", label: "갤러리", icon: Images },
  { href: "/chat", label: "채팅", icon: MessageCircle },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Responsive primary navigation:
 *  - mobile: fixed bottom tab bar (md:hidden)
 *  - desktop: fixed left sidebar (hidden md:flex)
 * One component renders both; Tailwind breakpoints decide which is visible.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-neutral-200 bg-white px-4 py-6 md:flex dark:border-neutral-800 dark:bg-neutral-900">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <Heart size={20} className="fill-love text-love" />
          <span className="font-serif text-lg font-semibold text-plum dark:text-rose">
            럽노트
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blush text-love dark:bg-love/20"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* mobile bottom tab */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-love" : "text-neutral-400"
              }`}
            >
              <Icon size={21} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
