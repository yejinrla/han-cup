# Journal Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Show the member's drink journal as a monthly calendar with selected-day reviews.
**Architecture:** Server-render calendar links using a validated date query, query user-owned monthly date markers and selected-day paginated reviews separately. Reuse existing forms and mutation invalidation.
**Tech Stack:** Existing Next.js, TypeScript, Supabase, CSS, Vitest.
**Spec:** docs/superpowers/specs/2026-11-12-journal-calendar-design.md

## Global Constraints
- Default to today in Asia/Seoul; group by consumed_on.
- Preserve writing/editing/deletion and private/public visibility; no database changes or dependencies.
- Sunday-first calendar, month navigation, today reset and day markers; responsive and accessible.

## Review Focus
- Malformed/repeated query dates fall back to today, not a runtime error.
- January/year changes and leap days use UTC-only calendar arithmetic.
- More than 20 monthly reviews must not truncate markers; paginate month date reads.
- Pagination/editing preserves selected date; switching days resets cursor.
- Empty day and deletion of the last review leave a usable calendar and correct empty state.

### Task 1: Calendar dates and links
Files: src/features/reviews/calendar.ts, tests/unit/calendar.test.ts.
Interfaces: resolveJournalDate(value: unknown, today: string): string; monthDays(date: string): (string|null)[]; shiftMonth(date: string, delta: number): string; monthRange(date: string): {start:string,end:string}; journalHref(date: string, extra?: Record<string,string>): string.
- [x] Write failing tests for Korea midnight fallback, invalid date arrays, February leap day, Sunday alignment, month-end clamping, year transitions, and encoded query links.
- [x] Run npx vitest run tests/unit/calendar.test.ts and confirm failure, implement helpers, rerun to PASS.

### Task 2: Calendar and filtered journal
Files: src/features/reviews/components/JournalCalendar.tsx, src/app/me/records/page.tsx, src/app/globals.css.
Interfaces: JournalCalendar({selectedDate,today,recordDates}: {selectedDate:string,today:string,recordDates:string[]}); uses Task 1 helpers.
- [x] Read installed Next.js page/searchParams/link docs before editing product code.
- [x] Render semantic date links with aria-current=date for today and selected state; month links clamp day; reset link selects today.
- [x] Query selected-day rows with eq consumed_on and stable created_at/id ordering, preserving 20-row pages. Separately paginate monthly consumed_on reads with deterministic order, retaining user_id filters.
- [x] Preserve date in pagination and edit links; default edited record to its date if no date provided. Keep forms and mutations intact. Use selected-day empty state and scope counts to page.
- [x] Add responsive seven-column styling with distinct selected/today indicators and visible marker legend.
- [x] Run unit suite, lint, typecheck and build. Inspect rendered calendar on desktop/mobile; run existing anonymous browser suite if browser runtime available. Document unavailable authenticated integration prerequisites rather than claiming passes.
- [x] Review changes against spec, commit only calendar implementation, spec, plan and tests. Push existing feature branch for Vercel deployment.

## Verification and review

31 unit/database tests, 11 anonymous browser tests and 4 real-session browser tests passed. Production build, typecheck and lint passed. Desktop/mobile screenshots were inspected. Fresh independent review found two issues: the last pagination page could misleadingly claim a whole day was empty after deletion, and the marker fixture did not prove fetching beyond 500 rows. Both were covered by failing regression checks and corrected in one pass; no deferred findings. Generated next-env.d.ts changes and unrelated setup SQL are excluded from this commit. Existing feat/hancup-mvp checkout and deployment branch are retained; no new worktree or integration branch is introduced.
