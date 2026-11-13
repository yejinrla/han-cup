# Five Personal Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation.

**Goal:** Separate journal and account while keeping likes in five bottom tabs.
**Architecture:** Existing protected routes plus server-rendered `/me` profile landing. Reuse existing profile query, signOut action, app CSS and skeleton.
**Tech Stack:** Next.js App Router, TypeScript, CSS, Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-personal-tabs-design.md

## Global Constraints
Tab order 홈 · 주변 매장 · 좋아요 · 기록 · 마이. Preserve data, private authentication gates, existing routes, 480px centered frame and reduced-motion loading support.

## Review Focus
Anonymous My gate must return to `/me`; settings must activate My only; records and likes must activate their own tabs; all five links fit 320px; logout belongs on My and removes the session.

### Task 1: Independent destinations and navigation
Files: AppNavigation, global CSS, records/favorites/settings pages, new `/me/page.tsx` and `/me/loading.tsx`, PageSkeleton; public app-shell/discovery tests and authenticated records tests.
- [x] Write failing five-tab count and authenticated My/settings/journal/likes/logout journey; observe failure before implementation.
- [x] Add five-column navigation and exact match rules, public-safe private My page metadata and existing nickname query, settings/back/logout; remove old personal tabs. Add account skeleton.
- [x] Run full browser, authenticated browser and unit/DB suites, lint, build/typecheck; inspect mobile screenshot and review diff.
- [x] Commit/push and confirm deployment and public five-tab markup.

Validation: five-tab regression observed RED (4 links instead of 5), then full public browser suite 25/25, authenticated suite 7/7, unit/DB suite 56/56 passed. Lint, production build, typecheck and whitespace checks pass. Mobile profile screenshot inspected; fresh read-only reviewer found no blockers. Deployment and public markup verification follow push.
