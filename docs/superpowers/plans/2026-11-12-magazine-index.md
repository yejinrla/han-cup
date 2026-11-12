# Magazine Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Expose the three existing articles through a public magazine card list.
**Architecture:** Server-render `/notes` from `tasteNotes`; reuse CupArt. Link home carousel and article detail to the list; keep four bottom tabs.
**Tech Stack:** Next.js App Router, TypeScript, existing CSS and Playwright.
**Spec:** docs/superpowers/specs/2026-11-12-magazine-index-design.md

## Global Constraints
480px centered frame, single-column cards, no login, existing array order, no invented publication dates or new dependencies.

## Review Focus
- Direct entry to `/notes` must work without authentication.
- Every card must open its matching article.
- Narrow widths and long titles must not overflow.
- Listing must retain Home as the active bottom tab.
- Detail must preserve Home access and offer return to magazine.

### Task 1: Public list and navigation
**Files:** Create `src/app/notes/page.tsx`; modify `src/features/notes/TasteNoteBanner.tsx`, `src/app/notes/[slug]/page.tsx`, `src/components/AppNavigation.tsx`, `src/app/sitemap.ts`, `src/app/globals.css`; test `tests/e2e/magazine.spec.ts`.
**Interfaces:** Consume existing `tasteNotes: TasteNote[]` and `CupArt({kind,name})`; expose `/notes` as a public server page.
- [x] Add browser journey: home ‘매거진 전체 보기’ → heading ‘한컵 매거진’, three cards → each matching detail → list; Home remains active; 320/1440px no overflow; direct list loads without login.
- [x] Run `CI=1 npx playwright test tests/e2e/magazine.spec.ts`; expect missing-link failure.
- [x] Implement metadata, list, heading/intro, decorative thumbnails and links; add magazine link beside home banner heading and on article detail, exact `/notes` Home match and sitemap entry.
- [x] Run browser suite, `npm test`, lint, build then typecheck sequentially relative to dev server; expect green.
- [x] Review and prepare commit/push. Verify deployment and live `/notes` after push.

## Verification record
RED: missing home magazine link caused the new browser journey to fail before implementation. GREEN: all 25 browser tests and 47 unit/DB tests pass; lint, production build and typecheck pass. Inspected mobile list/home screenshots. Fresh read-only reviewer found no blockers; dev-generated next-env changes cleared by production build. Existing current-title coverage is sufficient for current curated content; unusually long synthetic titles are not separately tested.
