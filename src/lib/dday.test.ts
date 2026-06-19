import { describe, it, expect } from "vitest";
import { getDayCount, getUpcomingAnniversaries } from "./dday";

describe("getDayCount", () => {
  it("counts the start date itself as day 1 (Korean convention)", () => {
    expect(getDayCount("2026-01-01", new Date("2026-01-01"))).toBe(1);
  });

  it("counts subsequent days inclusively", () => {
    expect(getDayCount("2026-01-01", new Date("2026-01-10"))).toBe(10);
  });

  it("is calendar-day based (ignores time of day)", () => {
    expect(getDayCount("2026-01-01", new Date("2026-01-02T23:30:00"))).toBe(2);
  });
});

describe("getUpcomingAnniversaries", () => {
  const start = "2026-01-01";

  it("returns the requested count, nearest first, all in the future", () => {
    const today = new Date("2026-01-02");
    const result = getUpcomingAnniversaries(start, 3, today);

    expect(result).toHaveLength(3);
    result.forEach((a) => expect(a.daysUntil).toBeGreaterThanOrEqual(0));
    // sorted ascending by daysUntil
    expect(result[0].daysUntil).toBeLessThanOrEqual(result[1].daysUntil);
    expect(result[1].daysUntil).toBeLessThanOrEqual(result[2].daysUntil);
  });

  it("computes the 100-day milestone as start + 99 days", () => {
    const today = new Date("2026-01-02");
    const result = getUpcomingAnniversaries(start, 10, today);
    const hundred = result.find((a) => a.label === "100일");
    expect(hundred).toBeDefined();
    // 2026-01-01 + 99 days = 2026-04-10
    expect(hundred!.date.toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("includes the 1주년 (one year) milestone", () => {
    const today = new Date("2026-06-01");
    const result = getUpcomingAnniversaries(start, 5, today);
    const oneYear = result.find((a) => a.label === "1주년");
    expect(oneYear).toBeDefined();
    expect(oneYear!.date.toISOString().slice(0, 10)).toBe("2027-01-01");
  });

  it("marks an anniversary that falls on today with daysUntil 0", () => {
    // 100-day mark is 2026-04-10
    const onMark = getUpcomingAnniversaries(start, 1, new Date("2026-04-10"));
    expect(onMark[0].daysUntil).toBe(0);
  });
});
