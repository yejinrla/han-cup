# Custom Drink Options Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A review can carry up to five custom order options from a fixed list, shown on the owner's journal and on public reviews, without changing nutrition, ratings or popularity.
**Architecture:** The option list and its rules live in one module (`src/features/reviews/options.ts`) used by the zod review schema, the form and the display. Migration 009 adds `reviews.options text[]` with matching DB constraints and returns options from `public_reviews` for public rows only. The review service saves the validated options.
**Tech Stack:** Existing Next.js, zod, Supabase/PostgreSQL, Vitest. No new dependencies.
**Spec:** docs/superpowers/specs/2026-11-14-custom-options-design.md

## Test seams (to confirm before writing tests)
1. **Review validation (Vitest unit)** — `validateReview` accepts allowed options, defaults to none, rejects unknown options, more than five, duplicates and opposite pairs. Catches: the rules users and the DB depend on. Misses: storage and display. Runs here.
2. **Database (Vitest integration, real PostgreSQL)** — after migration 009, the `reviews.options` constraint rejects invalid arrays even when the app is bypassed, and `public_reviews` returns options for public rows while private rows stay hidden. Catches: the privacy boundary and constraint drift from the app rules. Misses: UI. Runs here (local PostgreSQL 16; CI uses 17).
3. **Logged-in form and display (Playwright auth-e2e)** — choose options in the record form, see them on the journal and on the public feed with the "not reflected in nutrition" note. Catches: wiring end to end. Misses: Kakao itself. **Cannot run in this environment** (the local auth stack needs Docker); it would be written but only verifiable where Docker exists, and CI does not run auth-e2e today.

First failing test: seam 1, "a record keeps the custom options the user chose".

### Task 1: Option rules
- [ ] RED → GREEN, one behavior at a time: keep chosen options, default empty, reject unknown, reject more than five, reject duplicates, reject opposite pairs.

### Task 2: Storage
- [ ] RED → GREEN: migration 009 constraint and `public_reviews` options (seam 2); service saves options.

### Task 3: Form and display
- [ ] Option chips in the form, chips on journal and public feed, nutrition note; readability rules. Verification per seam 3 decision.

### Task 4: Verification and release
- [ ] Lint, typecheck, unit/DB, anonymous browser suite, build. Independent review, one fix pass. Add 009 to production-db.md with its check query. PR; merge only after the user applies 009 in production.
