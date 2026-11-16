# Honest Catalog Signals Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New arrivals expire 30 days after release under a "최근 신메뉴" heading; the search header counts brands that actually have drinks and marks the rest "(준비 중)"; the price sort appears only when some price is known.
**Architecture:** `selectNewArrivals` gains the 30-day window (today is already injected). The search page derives the brand count and price availability from the active catalog and passes them to `CatalogFilters`/`SortControl`. No DB or URL changes.
**Tech Stack:** Existing Next.js, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-16-honest-catalog-signals-design.md

## Test seams (to confirm before writing tests)
1. **New-arrival window (Vitest unit)** — `selectNewArrivals(data, curated, today)`: an arrival released exactly 30 days before today is kept, 31 days before is dropped, future stays dropped. Catches: the boundary and timezone-free date arithmetic. Misses: the heading text.
2. **Search signals (Playwright)** — with the current catalog the header reads "4개 브랜드 탐색", the brand select labels 투썸플레이스/컴포즈커피 with "(준비 중)" (still selectable), and the sort select has no "가격 낮은 순". Catches: wiring and honesty of what the page claims. Misses: the case where prices exist (no priced data to show it).
3. **Home heading (existing Playwright tests)** — rename the region "이번주 신메뉴" to "최근 신메뉴" in the existing discovery and home-arrivals tests; the arrivals released 2026-10-29 still show on 2026-11-16 (18 days). Misses: nothing new.

### Task 1: New-arrival window
- [ ] RED → GREEN on seam 1; rename the heading with seam 3.

### Task 2: Search signals
- [ ] RED → GREEN on seam 2 (brand count, "(준비 중)", price sort).

### Task 3: Verification
- [ ] Lint, typecheck, unit/DB, browser suite, build; screens at 320/390. Independent review (time-boxed), one fix pass. Commit, push.
