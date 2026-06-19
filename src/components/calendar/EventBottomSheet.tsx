"use client";

import { DayEditor } from "./DayEditor";

interface Props {
  date: Date;
  onClose: () => void;
}

/**
 * Mobile bottom-sheet wrapper around DayEditor (slides up from the bottom).
 * On desktop the same DayEditor is shown in a side panel instead (split view).
 */
export function EventBottomSheet({ date, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5">
        <DayEditor date={date} onClose={onClose} />
      </div>
    </div>
  );
}
