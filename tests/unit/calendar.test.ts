import { describe, it, expect } from "vitest";
import {
  resolveJournalDate,
  monthDays,
  shiftMonth,
  monthRange,
  journalHref,
} from "../../src/features/reviews/calendar";
import { koreanDate } from "../../src/features/reviews/schema";
describe("journal calendar", () => {
  it("defaults invalid and repeated dates to Korean today at the UTC day boundary", () => {
    const today = koreanDate(new Date("2026-11-11T15:01:00Z"));
    expect(today).toBe("2026-11-12");
    for (const value of [
      undefined,
      "2026-02-30",
      "bad",
      ["2026-01-01"],
      "2026-1-2",
      "0000-01-01",
    ])
      expect(resolveJournalDate(value, today)).toBe("2026-11-12");
    expect(resolveJournalDate("2024-02-29", today)).toBe("2024-02-29");
  });
  it("builds a Sunday-first leap month with complete weeks", () => {
    const days = monthDays("2024-02-12");
    expect(days.slice(0, 5)).toEqual([null, null, null, null, "2024-02-01"]);
    expect(days[32]).toBe("2024-02-29");
    expect(days).toHaveLength(35);
    expect(days.slice(-2)).toEqual([null, null]);
    expect(monthDays("2026-11-12")[0]).toBe("2026-11-01");
  });
  it("clamps month ends and crosses years", () => {
    expect(shiftMonth("2024-01-31", 1)).toBe("2024-02-29");
    expect(shiftMonth("2026-03-31", -1)).toBe("2026-02-28");
    expect(shiftMonth("2026-12-12", 1)).toBe("2027-01-12");
    expect(shiftMonth("2026-01-12", -1)).toBe("2025-12-12");
  });
  it("provides inclusive month range without timezone rollover", () => {
    expect(monthRange("2024-02-29")).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
  it("preserves the selected date in edit and pagination URLs", () => {
    expect(journalHref("2026-11-12", { edit: "record-id", cursor: "20" })).toBe(
      "/me/records?date=2026-11-12&edit=record-id&cursor=20",
    );
    expect(journalHref("2026-11-13")).toBe("/me/records?date=2026-11-13");
  });
});
