# Search Result Rows Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Search results show drinks as compact rows (small cup, meta, name, three nutrition values, compare and favorite) so more drinks fit on a phone screen; every other screen keeps the image card.
**Architecture:** `DrinkCard` gains `layout: "card" | "row"` (default card) so both share the meta, nutrition and button logic; only the search results page passes `row`. Row styles are appended to `globals.css` with existing tokens. The search loading skeleton follows. No data, URL or DB changes.
**Tech Stack:** Existing Next.js, Playwright.
**Spec:** docs/superpowers/specs/2026-11-17-search-result-rows-design.md

## Test seams (to confirm before writing tests)
1. **Rows on the results screen (Playwright, 390×844)** — `/search?all=1` shows at least three complete rows above the tab bar; a row carries the meta line, name link, three nutrition values, "비교 담기" and the favorite button; rating "평가 없음" is not shown in a row. Replaces the card-height check in `compact-card.spec.ts`. Catches: the point of the change and lost controls. Misses: visual polish.
2. **Other screens unchanged (Playwright)** — home arrivals still render image cards (`.drink-visual` present at card size). Catches: the row layout leaking to other screens.
3. **Readability and narrow screens (existing Playwright suite)** — extend the 320px/fallback-font nutrition fit test and the ≥11px text check to rows. Catches: clipped figures and small text. Misses: nothing new.

### Task 1: Row layout
- [x] RED → GREEN on seam 1, then seam 2.

### Task 2: Readability and skeleton
- [x] Seam 3 on rows; search skeleton as rows (no change: the pulled search landing already replaced the card-grid skeleton).

### Task 3: Verification
- [x] Lint, typecheck, unit/DB, browser suite, build; screens at 320/390 (with and without the compare tray). Independent review (time-boxed), one fix pass. Commit, push.

## Verification and review

Seam 1 went RED first (0 complete rows above the tab bar, then 2 after the first row styles; the row was tightened to 72px with 44px touch areas kept). Seam 2 passed as a guard, and putting rows on the home fails it. Seam 3: the 320px fit test now covers rows and home cards, and the readability screens include `/search?all=1`. It caught the row figures at 13px (fixed to 14px), and dropping row labels to 10px fails it. The first-screen test removes the local-catalog notice, which production does not render. Lint, typecheck, unit/DB (86), the browser suite (78) and the build pass. At 390px rows are 72px and three fit above the tab bar. At 320px a row is about 126px (meta and name wrap) with no horizontal overflow. The compare tray does not cover the last row.

Search skeleton: no change. The pulled search landing had already replaced the card-grid skeleton.

Also fixed: `home-arrivals.spec.ts` counted cards before they rendered (flaky). It now waits for three cards.

Independent review: no Critical. Fixed Important: rating and price move to their own row line, and the compare limit message wraps in a fixed 100px action column instead of squeezing the name (test-first: the name width was 0 at 320px). The compare button gets a 44px touch area. Fixed Minor: the cup sizing applies only to the illustration, so photos keep their contain fit; a clamped name shows the full name as a title; the row test checks every row and finds the tab bar by its name. Not covered: rows with a rating or price, because the local data has neither.
