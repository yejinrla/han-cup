# Readability and Cup Temperature Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every visible text on public screens is at least 11px with WCAG AA contrast, uninformative decoration is removed, and the shared cup illustration matches the variant's temperature.
**Architecture:** Consolidate secondary text color into one token and raise sub-11px declarations in `globals.css` across all layers (base, mobile, app shell). Remove English eyebrows, card numbering and the home headline accent from pages/components. `CupArt` takes a `temperature` prop (drawn as paper cup when hot); `DrinkImage` and the compare page pass the shown variant's temperature.
**Tech Stack:** Existing Next.js/React/TypeScript/CSS, Playwright. No dependencies, API or DB changes.
**Spec:** docs/superpowers/specs/2026-11-13-readability-cup-temperature-design.md

## Test seams (to confirm before writing tests)
1. **Public screen readability scan** — Playwright opens 9 public pages at 390px and 1440px and walks visible text: computed font size ≥ 11px; contrast against the nearest opaque background ≥ 4.5:1 (3:1 for large text). Excludes SVG illustration text, the wordmark logo, disabled controls and aria-hidden text. Catches: regressions from any CSS layer on those pages. Misses: /me/* pages (login only), hover/focus states, text over images.
2. **Cup temperature** — Playwright checks the accessible name of the illustration on a HOT and an ICE drink (card and detail, and after switching variant where both exist). Catches: wrong or missing temperature wiring. Misses: the drawn shape itself (checked by screenshot).

Decoration removal (eyebrows, "NO. 001", headline accent) gets no dedicated test: existing browser tests guard the surrounding behaviour and screenshots confirm the result.

## Constraints
- Keep accessible names of buttons/links used by existing tests.
- Logo and disabled-control contrast follow WCAG exceptions.
- No layout restructuring (that is stage 2/3).

### Task 1: Readability
Files: tests/e2e/readability.spec.ts, src/app/globals.css.
- [x] RED: scan fails on current pages.
- [x] GREEN: secondary text token, sub-11px sizes raised, low-contrast literals replaced, per page until the scan passes at both widths.

### Task 2: Decoration
Files: src/app/page.tsx, src/app/search/page.tsx, src/app/compare/page.tsx, src/app/stores/page.tsx, src/app/notes/[slug]/page.tsx, src/app/me/*/page.tsx, src/app/about/page.tsx, src/app/privacy/page.tsx, src/app/drinks/[slug]/page.tsx, src/features/catalog/components/DrinkCard.tsx.
- [x] Remove English eyebrows, card numbering and headline accent; keep the detail brand line as plain secondary text.

### Task 3: Cup temperature
Files: src/components/CupArt.tsx, src/components/DrinkImage.tsx, DrinkCard.tsx, src/app/drinks/[slug]/page.tsx, src/app/compare/page.tsx, tests/e2e/catalog.spec.ts or a new spec.
- [x] RED: HOT drink illustration name lacks "따뜻한".
- [x] GREEN: temperature prop, hot drawing, callers pass the shown variant.

### Task 4: Verification
- [x] Lint, typecheck, unit/DB, full anonymous browser suite, build. agent-browser screens at 320/390/1440 including /me pages as reachable. Independent review, one fix pass. Update plan checkboxes and implementation-status. Commit and push.

## Verification and review

Seams were confirmed by the user before tests were written; each went RED for the intended reason first. The readability scan failed on all 20 page/width cases before the CSS sweep (67 text colors to the `--muted` token, 90 sub-11px sizes to 11px) and the decoration removal. Cup temperature tests failed on the missing temperature wording before `CupArt` gained a `temperature` prop (hot paper cup with steam; ambient clear cup without ice).

Regressions found by screenshots and fixed test-first: the search category row overflowed 390px after the larger type (gap 17px to 13px); basis toggle and sort button labels wrapped at 320px (nowrap).

Independent review: no Critical. Fixed Important — the spec's 13px sentence-length secondary text and 14px tabular card figures were not implemented; a final CSS block sets them and a test checks both. That exposed card nutrition labels wrapping and figures overflowing two-column cards at 320px: equal columns, nowrap labels, unit under the figure, and 13px figures with tighter padding below 360px. A flaky pass came from measuring before the webfont loaded; the test now waits for fonts. Fixed Minor — contrast check now blends translucent backgrounds and text colors; the SVG exclusion is narrowed to the cup illustration. Not fixed — no drink has both HOT and ICE variants, so the detail variant switch is untested with real data.

Final run: lint, typecheck, prettier, unit/DB 46, anonymous browser 49, production build passed. No horizontal page overflow on 9 public pages at 320px. /me pages share the CSS but were not scanned (login required).
