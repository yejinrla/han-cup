# Discovery Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate discovery home and catalog search, with curated new arrivals and recording-based popularity.
**Architecture:** Move existing catalog UI to /search; root renders curated arrivals and a refreshing popular section. A restricted SQL RPC returns product IDs and distinct recorder counts only; both public/private eligible records count. Keep all personal data uncached and unchanged.
**Tech Stack:** Existing Next.js/TypeScript/Supabase, PostgreSQL, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-12-discovery-home-design.md

## Constraints
480px shared app shell; five bottom tabs. Current filters/compare/favorites preserved. Last24h based on immutable created_at, unique user/product, exclude hidden and discontinued. Refresh popularity every5min. No invented new menu dates or popular ranks. Existing deployment has no DB credentials available to agent; prepare additive, rerunnable SQL and graceful missing-function UI.

## Review focus
- Private content/identity never appears in RPC/API, though aggregate includes private records.
- Duplicate records, old/future timestamps, hidden records and discontinued products do not inflate rankings.
- Ranking refresh preserves last good state or communicates failure; hidden/unmounted polling cleans up.
- Search links/actions and old root query links retain all filters, duplicate handling, cursor and basis.
- Five tabs remain visible at320px; absent catalog/new arrivals/rankings get honest empty states.

### Task 1: Ranking and curated data
Files: supabase/migrations/007_home_popularity.sql, tests/integration/database.test.ts, src/features/discovery/curation.ts, data/catalog/new-arrivals.json, tests/unit/discovery.test.ts.
- [x] Add real PostgreSQL regression for distinct private/public counts, last24h boundaries, hidden/sales status, aggregate-only columns and anon raw private denial. Observe missing RPC RED.
- [x] Implement rerunnable security-definer no-argument RPC public.popular_drinks() returns(drink_id uuid,recorders bigint); fixed top6, stable tie ordering, fully qualified names, explicit execute grants and minimal output; add partial time/product/user index.
- [x] Test curation and legacy-root-query mapping RED→GREEN; validate official brand source, real dates, no future/inactive/unrecognized products, newest-first top6. Start curated file empty; do not publish unverified items.

### Task 2: Search and discovery UI
Files: src/app/search/page.tsx, src/app/page.tsx, CatalogFilters.tsx, AppNavigation.tsx, discovery repository/components, src/app/api/discovery/popular/route.ts, links to catalog, privacy and ReviewForm.
- [x] Add browser tests for discovery sections, absent fake rankings, five tabs/search navigation and old query preservation. Update old catalog tests to enter /search, preserving test intent. Observe RED.
- [x] Move catalog to /search and route all search actions/filters/pagination there; load independent catalog/summary/favorite reads concurrently. Redirect known root search queries to /search and retain values.
- [x] Build home with short search CTA, curated cards and popularity component. RPC fetch errors/missing function cannot break entire home. API exposes only aggregate DTO with no-store and no caller-specified filters.
- [x] Refresh client popularity every300000ms plus visible/focus return; abort in-flight requests on unmount and avoid overlapping stale replies. Never invent fillers or report a sales ranking.
- [x] Add privacy/statistics note to record form and policy, keeping public star average rule unchanged. Five nav tabs: home/search/stores/likes/journal. Detail/compare catalog parents point to search.
- [x] Extend actual-session browser test to demonstrate private record affects anonymous popularity while raw body remains absent. Apply new SQL to disposable auth DB only; no hosted DB writes.

### Task 3: Verification and release
- [x] Run unit/DB, anonymous and actual-session browser suites, lint/typecheck/build. Inspect home/search at320/390/1440 and error/empty states. Fresh independent review; one material-fix pass.
- [x] Document new-menu review registration and SQL migration instructions. Commit/push; verify live home/search and graceful pre-migration ranking state. Ask user to run supplied SQL Editor file to enable hosted popularity.

## Usage-limit recovery checkpoint

Current product code is preserved, not considered fully complete. Fresh lint, typecheck, all35 unit/DB tests and production build passed. Previously all5 real-session tests passed. The popularity five-minute virtual-clock browser regression remains unresolved; its last failure was absence of the expected refreshed ranking. Independent review stopped on the reviewer usage limit and did not complete. Hosted migration007 and reviewed real new-menu registration are also outstanding. See docs/operations/discovery-checkpoint.md for continuation steps.

## Completion of recovery work

The virtual-clock failure was isolated: production interval/fetch/card updates work; Playwright clock jumps needed resume() so asynchronous React rendering could commit. The same regression now passes. Independent review completed; fixed unresolved ranked products by refreshing catalog props without compressing ranks or showing false empty states. Also fixed duplicate-card favorite state with ephemeral same-window notifications and server refresh. Both findings have RED→GREEN unit coverage and browser behavior coverage. No deferred review findings.

User explicitly approved the official-source Mega winter three-drink review on2026-11-12. Approved batch and curation are registered; local fallback now16 products/17 variants. Combined enable-discovery.sql adds the popularity RPC and these products, and passed two consecutive executions in a fresh disposable DB. Hosted DB execution remains a user-side setup action; source credentials are unavailable to this environment.
