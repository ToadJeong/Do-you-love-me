import type { ExternalEvent } from "@/lib/types";

/** Unescape ICS TEXT values (RFC 5545). */
function unescapeText(v: string): string {
  return v
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Minimal iCalendar (.ics) parser for overlaying a Google Calendar.
 *
 * Extracts each VEVENT's start date (DTSTART, date part) and SUMMARY, keeping
 * only those within [fromISO, toISO]. Recurring events are not expanded (only
 * the first occurrence is shown) — sufficient for a read-only overlay.
 */
export function parseIcs(
  text: string,
  fromISO: string,
  toISO: string,
): ExternalEvent[] {
  // Unfold folded lines (continuation lines start with a space or tab).
  const unfolded = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  const lines = unfolded.split("\n");

  const events: ExternalEvent[] = [];
  let date: string | null = null;
  let title: string | null = null;
  let inEvent = false;
  let i = 0;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      date = null;
      title = null;
    } else if (line === "END:VEVENT") {
      if (date && title && date >= fromISO && date <= toISO) {
        events.push({ id: `ics-${i}-${date}`, event_date: date, title });
        i++;
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith("DTSTART")) {
        const m = line.match(/(\d{4})(\d{2})(\d{2})/);
        if (m) date = `${m[1]}-${m[2]}-${m[3]}`;
      } else if (line.startsWith("SUMMARY")) {
        const idx = line.indexOf(":");
        if (idx >= 0) title = unescapeText(line.slice(idx + 1));
      }
    }
  }

  return events;
}
