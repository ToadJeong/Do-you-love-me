/** Shared photo filters (CSS filter strings — applied via ctx.filter on export). */
export const FILTERS = [
  { id: "none", label: "원본", css: "" },
  { id: "bright", label: "화사", css: "brightness(1.12) saturate(1.08)" },
  { id: "warm", label: "따뜻", css: "sepia(0.25) saturate(1.15) brightness(1.05)" },
  { id: "cool", label: "차분", css: "saturate(0.9) hue-rotate(12deg) brightness(1.03)" },
  { id: "mono", label: "흑백", css: "grayscale(1) contrast(1.08)" },
  { id: "sepia", label: "세피아", css: "sepia(0.6)" },
  { id: "vintage", label: "빈티지", css: "sepia(0.35) contrast(0.92) brightness(1.05) saturate(0.85)" },
  { id: "crisp", label: "선명", css: "contrast(1.15) saturate(1.2)" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];

export function filterCss(id: FilterId): string {
  return FILTERS.find((f) => f.id === id)?.css ?? "";
}

/** Combine a named filter with manual adjustments into one CSS filter string. */
export function combinedFilter(
  id: FilterId,
  adjust?: { brightness?: number; contrast?: number; saturate?: number },
): string {
  const parts = [filterCss(id)];
  if (adjust) {
    if (adjust.brightness && adjust.brightness !== 1)
      parts.push(`brightness(${adjust.brightness})`);
    if (adjust.contrast && adjust.contrast !== 1)
      parts.push(`contrast(${adjust.contrast})`);
    if (adjust.saturate && adjust.saturate !== 1)
      parts.push(`saturate(${adjust.saturate})`);
  }
  return parts.filter(Boolean).join(" ");
}
