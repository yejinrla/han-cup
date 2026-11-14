# Article Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation.

**Goal:** Add drink/article subnavigation and persistent private article favorites.
**Architecture:** RLS-protected `article_favorites` table keyed by user and published article slug; server repository/actions and a client like button; shared ArticleCard and SSR tab routes.
**Tech Stack:** Next.js, TypeScript, Supabase/PostgreSQL, existing CSS and Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-article-favorites-design.md

## Global Constraints
Keep default drinks URL and five bottom tabs. Use owner-scoped authenticated access, no public counts, no new dependencies, no secret values in Git/chat. Preserve anonymous article reading when migration is missing.

## Review Focus
Cross-user reads/writes; unknown article slugs; migration missing or rerun; anonymous intended save; drinks and articles remain independent; deletion and reload state.

### Task 1: Private storage and save/remove flow
Files: `supabase/migrations/008_article_favorites.sql`; `tests/integration/database.test.ts`; `tests/support/start-auth-stack.ts`; new `src/features/favorites/articles.ts`, `article-service.ts`, `components/ArticleFavoriteButton.tsx`; article detail.
- [x] Observe missing-table regression; implement additive rerunnable migration with RLS and limited grants, current-user repository and validated save action, article-detail button.
- [x] Validate migration twice, owner isolation/forgery/unlike/cascade and missing-table behavior.

### Task 2: Saved article collection
Files: new `src/features/notes/ArticleCard.tsx`; magazine page, favorites page, app CSS/navigation label; authenticated and anonymous browser tests; operations instructions.
- [x] Observe missing article subnav regression; implement default drinks and article link tabs, save confirmation, most-recent-first article cards with remove action and empty state.
- [x] Run unit/DB, both browser suites, lint/build/type; inspect mobile screenshot; independent review.
- [x] Prepare and commit/push tested implementation with production migration instructions.
- [ ] User applies migration 008 to production; verify persistence after setup. Production credentials are not available in this execution environment.

Verification: missing-table and missing-tab regressions observed RED before implementation. Unit/DB 62/62, public browser 26/26, authenticated browser 8/8 pass. Lint, production build, typecheck and whitespace checks pass. Saved-article screenshot inspected. Fresh reviewer found no blockers. Migration was applied twice locally and RLS, forgery prevention, owner deletion and account cascade tested. One dev stream cancellation message appeared during rapid authenticated navigation; all visible save/reload/unlike checks passed.
