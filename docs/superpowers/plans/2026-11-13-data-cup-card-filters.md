# Data Cup, Compact Card and One-Row Filters Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The shared cup encodes verified volume, temperature and category; drink cards are shorter; search filters fit one row with nutrition limits in a collapsible panel. URL contract and behaviour unchanged.
**Architecture:** Rewrite `CupArt` as parametric SVG geometry (height from `cupMl`, shape from temperature, fill from category) with a `data-cup-body` hook on the body path. `DrinkImage`, `DrinkCard`, detail and compare pass `cupMl`. `DrinkCard` markup reorganised (brand meta line, footer row). `CatalogFilters` becomes search box + category chip links + brand/temperature selects + `details` nutrition panel with preset links built by `queryLink`; category travels as a hidden input.
**Tech Stack:** Existing Next.js server components, CSS, Playwright. No new dependencies, API or DB changes.
**Spec:** docs/superpowers/specs/2026-11-13-data-cup-card-filters-design.md

## Test seams (to confirm before writing tests)
1. **Cup encoding (Playwright)** — accessible name of card/detail/compare cups carries temperature, volume and category; on the compare page the drawn body heights of a 520ml and a 670ml cup keep the 520:670 ratio (±3%), measured on the `data-cup-body` path. Catches: wrong data wiring or scaling. Misses: aesthetic quality (screenshots).
2. **Compact card (Playwright)** — at 390px a card is at most 300px tall, its meta line shows temperature/size/volume, a card for a drink without a price shows no price text, and "비교 담기"/좋아요 still work (existing tests). Catches: layout bloat returning, price-0 or "미제공" noise. Misses: visual polish.
3. **One-row filters (Playwright)** — category chips, brand/temperature selects, nutrition panel (closed by default, opened with a count when a limit is set), preset links and "조건 초기화" produce the existing URL parameters and preserve the others. Existing tests open the panel before typing a limit. Catches: URL-contract regressions. Misses: nothing beyond what URL tests already miss.

The stage 1 readability scan keeps running as the regression guard for size and contrast.

### Task 1: Data cup
- [x] RED: name and height-ratio test fails.
- [x] GREEN: parametric CupArt, callers pass cupMl, detail illustration note.

### Task 2: Compact card
- [x] RED: card height / meta / price test fails.
- [x] GREEN: DrinkCard markup and CSS.

### Task 3: One-row filters
- [x] RED: filter tests fail; update existing tests to open the panel.
- [x] GREEN: CatalogFilters markup and CSS.

### Task 4: Verification
- [x] Lint, typecheck, unit/DB, full browser suite, build; agent-browser at 320/390 (1440 not checked separately in this stage: the app renders in the same 480px frame, and the readability scan runs at 1440). Independent review (time-boxed), one fix pass. Docs, commit, push.

## Verification and review

Seams were confirmed by the user before tests were written; every new test went RED for the intended reason first. Cup: names carry temperature, volume and category; the drawn 520ml:670ml body heights keep the volume ratio. Card: 281px at 390px for every card (was about 380px; 472px after stage 1 moved units below figures). Filters: chips, selects, panel, quick picks and reset keep the URL contract; two older tests gained only a panel-open step.

Decisions made while implementing (recorded in the spec): "기본" size omitted from the card meta line so it fits one line at 390px; the apply button stays outside the panel; the reset link sits next to the result count; decorative note cups use the new art drawn solid. A first CSS attempt with `display: contents` on `details` did not order the panel in Chromium and was replaced. Two test mistakes were caught and fixed: a helper that recursively called itself after a bulk replace, and a panel re-click that closed an already-open panel.

Independent review: no Critical; URL contract, details state, cup edge cases (0/null/NaN/over 710ml, unknown category) and price 0-versus-null confirmed. Fixed Important — decorative cups showed the dashed missing-volume outline (test-first). Fixed Minor — steam clipped above the viewBox for hot cups over about 650ml (clamped; no such hot drink in data to test), reset-link-in-viewport check restored at 390px, four dead CSS rules removed. Not testable with current data: a priced card (no variant has a price) and hot cups above 591ml.
