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
- [x] RED → GREEN, one behavior at a time: keep chosen options, default empty, reject unknown, reject more than five, reject duplicates, reject opposite pairs.

### Task 2: Storage
- [x] RED → GREEN: migration 009 constraint and `public_reviews` options (seam 2); service saves options.

### Task 3: Form and display
- [x] Option chips in the form, chips on journal and public feed, nutrition note; readability rules. Verification per seam 3 decision.

### Task 4: Verification and release
- [ ] (merge waits for production 009) Lint, typecheck, unit/DB, anonymous browser suite, build. Independent review, one fix pass. Add 009 to production-db.md with its check query. PR; merge only after the user applies 009 in production.

## Verification and review

Seam decision (user, 2026-11-14): seams 1 and 2 only; the logged-in form and lists (seam 3) are not browser-verified because the local auth stack needs Docker, which this environment lacks.

Each rule went RED before GREEN: keep chosen options (failed with options dropped), default none (the existing test required it), unknown option, more than five, duplicates, opposite pairs, option-specific error messages. Database (real PostgreSQL, migration applied twice): the CHECK refuses bad sets with the app bypassed, `public_reviews` returns options for public records only, records without options read back empty.

Independent review: no Critical; privacy boundary, recreated `public_reviews`, migration rerunnability, column grants and the deploy-before-009 failure mode confirmed. Fixed Important — the picker is now uncontrolled so a form reset after saving cannot desync it (logic not browser-verified); option rule failures show their own messages instead of the rating/text hint (test-first); the database test now iterates the app's option list, opposite groups and limit so app/DB drift fails a test, and the schema uses the shared limit. Fixed Minor — owner edit of options (column UPDATE grant) is tested; mutation checks confirm removing the grant or adding an app-only option fails the test. Documented — `setup.sql` stops at 006; production-db.md lists 007/008/009 for new projects. Not covered — the service FormData mapping, the edit path keeping options and the picker behaviour (seam 3).

Release order: the user applies 009 in production and confirms with the check query in production-db.md; only then is the PR merged.
