# Home Arrivals, Three-Way Compare and Detail Actions Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group new arrivals by release with one source line and a horizontal card rail; fit three comparison columns at 390px and mark the lowest known values in text; lift "한 잔 기록하기" and give the detail page three equal secondary actions.
**Architecture:** Home groups the existing curated arrivals by (releasedOn, sourceUrl) in the page component. A small pure helper computes the lowest-value index per comparison row (unit-tested), used by the compare page. The record link moves from `PublicReviews` into the detail page; `FavoriteButton` gains an optional visible label.
**Tech Stack:** Existing Next.js/React/CSS, Vitest, Playwright. No dependencies, API or DB changes.
**Spec:** docs/superpowers/specs/2026-11-14-home-compare-detail-design.md

## Test seams (to confirm before writing tests)
1. **Lowest-value rule (Vitest)** — a pure function over a row's numbers (null = unknown) returns the index to mark or none: unique minimum marked; ties, any null or fewer than two values give none. Catches: the honesty rules (no marking with missing data, no arbitrary pick on ties). Misses: rendering.
2. **Compare page (Playwright)** — at 390px the table fits its container (no horizontal scroll) and "가장 낮음" sits on the expected cells for a real three-drink comparison and is absent where values tie. Catches: layout regression and wiring. Misses: other basis combinations beyond one check.
3. **Home arrivals (Playwright)** — one source line for the same-release group, three cards in one horizontal rail, no page overflow at 320/390px. Catches: grouping and layout. Misses: multi-group rendering (only one group exists in data; covered by a unit-level grouping check inside seam 1's file if trivial, otherwise noted).
4. **Detail actions (Playwright)** — exactly one "한 잔 기록하기" link, positioned above the nutrition block; compare/favorite/stores controls share a height of at least 44px; the anonymous login gate still works (existing journey test).

The stage 1 readability scan keeps guarding size and contrast.

### Task 1: Compare
- [x] RED (unit, then browser) → GREEN: lowest-value helper, compare layout and marks.

### Task 2: Home arrivals
- [x] RED → GREEN: grouping, source line once, rail.

### Task 3: Detail actions
- [x] RED → GREEN: move record link, equal action buttons, favorite label.

### Task 4: Verification
- [x] Lint, typecheck, unit/DB, full browser suite, build; agent-browser 320/390. Independent review (time-boxed), one fix pass. Docs, commit, push.

## Verification and review

Seams were confirmed by the user before tests were written; each new test went RED for the intended reason first. Unit: `lowestIndex` (unique minimum, ties, unknown values, too few values) and, after review, `groupArrivals` (two sources, interleaved order, one source shared by two brands). Browser: compare fits three columns at 390px with marks on 244kcal and 41g only (caffeine tie and all-unknown price unmarked); home shows one source line and three cards in one rail with no page overflow at 320/390px; detail has a single record link above the nutrition block and three equal 44px actions.

Found while checking screens and fixed test-first: the card meta dot separated from its text in the 150px rail cards; "주변 매장 찾기" overflowed its button at 320px (word-level wrap, icon hidden under 360px). A flaky compare test read table cells before the first render (evaluateAll does not wait); it now waits for the row.

Independent review: no Critical. Fixed Important — the full-comparison message took a grid cell and pushed the stores button to a second row (now a full-width line under the buttons, test-first). Fixed Minor — grouping moved into a unit-tested pure helper; the compare cup-size selector scoped to the comparison table. Decided, not changed — the price mark stays on the per-cup price under the 100ml basis (recorded in the spec). Known limit — the home browser test depends on today's curated arrivals, like the existing discovery test.

Final run: lint, typecheck, prettier, unit/DB 51, anonymous browser 61, production build passed. Screens checked with agent-browser at 320/390px (1440 relies on the shared 480px frame and the readability scan).
