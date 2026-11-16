# Search Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline work.

**Goal:** Search-first landing with real personal history, editorial suggestions and authentic aggregate rising terms.
**Architecture:** SSR landing/results gate; client history/landing UI; client mounted result/detail recorders; narrow server API and service-only write/aggregate-read SQL010.
**Tech Stack:** Existing Next.js/TypeScript, Supabase/PostgreSQL, CSS, Playwright/Vitest.
**Spec:** docs/superpowers/specs/2026-11-16-search-discovery-design.md

## Global Constraints
Preserve filter URLs and five tabs. Explicit all=1 browse mode. Local history private to browser, bounded/validated and erasable. Never publish arbitrary search strings or fake ranking. No production DB secret available; no new dependencies or paid service.

## Review Focus
Malformed storage and disabled storage; filtered empty-query links; prefetch/reload counting; unknown keyword or forged identity; absent migration and transient failures; catalog changes/removed drinks; threshold and day-boundary dedup semantics.

### Task 1: Personal history and landing/results switch
Files: new `src/features/search/history.ts`, `discovery.ts`, `SearchLanding.tsx`, `ActivityRecorders.tsx`; search/detail routes and CatalogFilters; CSS and existing/new browser tests.
Interfaces: `isSearchResults(URLSearchParams):boolean`; history parsers/push functions produce bounded serialized entries; recommendations consume current CatalogData; SearchLanding receives only current public drink catalog.
- [x] Observe bare-search landing regression RED; add pure history/gate tests then implement validated recent history, suggestions, view tracking and result routing.
- [x] Update existing catalog-oriented browser cases to `/search?all=1`, keep bare landing and legacy filtered links covered.

### Task 2: Real rising-term signals
Files: SQL010, `src/app/api/search/activity/route.ts`, integration/unit tests, privacy/operations docs.
Interfaces: POST eligible term produces no private output; GET returns `{available,items:[{term,recent,previous,growth}],updatedAt}`. SQL writer service-only and read aggregate only.
- [x] Observe missing ranking SQL; implement validated server terms, daily anonymous dedup, cap, retention and minimum-signal rising aggregation; safe missing-migration handling.
- [x] Test all grant/privacy/ranking boundaries and integrate honest states in landing.

### Task 3: Finish
- [x] Run complete unit/DB, public and session checks, lint/build/types; inspect mobile. Fresh independent review; fix substantive findings.
- [ ] Commit/push, verify deployment. Provide exact SQL010 as the final manual setup step; production rising data remains unverified until user applies it.

Verification: unit/DB 86 passed; public suite 71 passed with two contrast failures corrected and all 31 readability/search checks passing on rerun; authenticated session suite 8 passed. Fresh independent review found personal-history prefetch issue, fixed on both link types. Mobile screenshot inspected. SQL010 production application remains pending user SQL Editor access.
