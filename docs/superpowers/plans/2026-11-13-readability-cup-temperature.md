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
- [ ] RED: scan fails on current pages.
- [ ] GREEN: secondary text token, sub-11px sizes raised, low-contrast literals replaced, per page until the scan passes at both widths.

### Task 2: Decoration
Files: src/app/page.tsx, src/app/search/page.tsx, src/app/compare/page.tsx, src/app/stores/page.tsx, src/app/notes/[slug]/page.tsx, src/app/me/*/page.tsx, src/app/about/page.tsx, src/app/privacy/page.tsx, src/app/drinks/[slug]/page.tsx, src/features/catalog/components/DrinkCard.tsx.
- [ ] Remove English eyebrows, card numbering and headline accent; keep the detail brand line as plain secondary text.

### Task 3: Cup temperature
Files: src/components/CupArt.tsx, src/components/DrinkImage.tsx, DrinkCard.tsx, src/app/drinks/[slug]/page.tsx, src/app/compare/page.tsx, tests/e2e/catalog.spec.ts or a new spec.
- [ ] RED: HOT drink illustration name lacks "따뜻한".
- [ ] GREEN: temperature prop, hot drawing, callers pass the shown variant.

### Task 4: Verification
- [ ] Lint, typecheck, unit/DB, full anonymous browser suite, build. agent-browser screens at 320/390/1440 including /me pages as reachable. Independent review, one fix pass. Update plan checkboxes and implementation-status. Commit and push.
