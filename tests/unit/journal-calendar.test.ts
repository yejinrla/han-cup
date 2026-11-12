import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { JournalCalendar } from "../../src/features/reviews/components/JournalCalendar";
test("calendar exposes selected date, today and recorded dates independently", () => {
  const html = renderToStaticMarkup(
    createElement(JournalCalendar, {
      selectedDate: "2026-11-11",
      today: "2026-11-12",
      recordDates: ["2026-11-10", "2026-11-11"],
    }),
  );
  expect(html).toContain('aria-label="2026년 11월 11일, 선택됨, 기록 있음"');
  expect(html).toContain('aria-label="2026년 11월 12일, 오늘"');
  expect(html).toContain('aria-current="date"');
  expect(html).toContain('href="/me/records?date=2026-10-11"');
  expect(html).toContain('href="/me/records?date=2026-12-11"');
  expect(html).toContain('href="/me/records?date=2026-11-12"');
  expect(html).not.toContain("cursor=");
});
