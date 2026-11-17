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
- [ ] Seam 3 on rows; search skeleton as rows.

### Task 3: Verification
- [ ] Lint, typecheck, unit/DB, browser suite, build; screens at 320/390 (with and without the compare tray). Independent review (time-boxed), one fix pass. Commit, push.
