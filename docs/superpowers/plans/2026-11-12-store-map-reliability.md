# Store Map Reliability Implementation Plan

> **For agentic workers:** Execute task-by-task with red → green vertical slices (tdd skill). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kakao map SDK loading always settles (timeout/error/missing global) with a manual retry, and map pins and store cards share one selection.
**Architecture:** Extract the SDK loader into `src/features/stores/map-sdk.ts` with injectable document/window/timer so it can be unit-tested without a browser. `StoreMap` creates the map once, redraws markers on result changes, and reports pin clicks; `StoreSearch` owns the selected store id and passes it to map and list.
**Tech Stack:** Existing Next.js/React/TypeScript/CSS, Vitest, Playwright. No new dependencies, API or DB changes.
**Spec:** docs/superpowers/specs/2026-11-12-store-map-reliability-design.md

## Test seams (confirmed before writing tests)
1. **SDK loader module** `loadKakaoMaps(key, deps)` — Vitest with fake timers and a fake document/window. Catches: timeout, script error, loaded-without-global, retry creating a fresh script after failure, success reuse. Misses: React wiring and real Kakao SDK behavior.
2. **Stores page in the browser** — Playwright with a fake Kakao SDK served by `page.route` for `dapi.kakao.com` (external boundary only; app code unmocked). Catches: failure message + retry button, pin click ↔ card selection, "지도에서 보기" → map center, selection reset on new search and kept on "매장 더 보기", map not recreated on append. Misses: real Kakao SDK/keys (remains a release gate).

## Constraints
- No automatic retry loop; retry only by user action. Late results after unmount do not set state.
- Location/Kakao data storage rules, C-style UI and 480px shell unchanged. Selection never shown by color alone.
- The e2e dev server gets a non-secret placeholder `NEXT_PUBLIC_KAKAO_MAP_KEY`; every test that produces store results routes the SDK URL so no test reaches the real Kakao host.

### Task 1: SDK loader
Files: src/features/stores/map-sdk.ts, tests/unit/map-sdk.test.ts, src/features/stores/components/StoreMap.tsx.
- [x] RED→GREEN per behavior: timeout rejects; script error rejects; loaded without `kakao.maps` rejects; after a failure the next call appends a new script and can resolve; a successful load is reused without a new script.
- [x] Use the loader from StoreMap; show retry button on failure.

### Task 2: Map/list selection
Files: StoreMap.tsx, StoreSearch.tsx, globals.css, playwright.config.ts, tests/e2e/stores.spec.ts.
- [x] RED: browser test for SDK failure → retry → map shown.
- [x] RED: browser test for pin click selecting card, "지도에서 보기" centering, reset on new search, kept on more, single map instance.
- [x] GREEN: single map instance with marker redraw, selection state, card button with `aria-pressed` and "선택됨" text, selected-pin distinction, scroll into view. UI per frontend-design within existing tokens.

### Task 3: Verification
- [x] Lint, typecheck, unit/DB, full anonymous browser suite, build. Screens at 320/390/1440 via agent-browser. Independent review, one fix pass. Update implementation-status.md (remove the two deferred Minors) and plan checkboxes. Commit and push.

## Verification and review

Seams were confirmed by the user before tests were written. Each slice went RED for the intended reason before GREEN. Loader: 8 unit tests (timeout, script error, missing global, `maps.load` never calling back, success reuse, retry with failed-script removal, stale attempt isolation). Browser: 3 new stores tests with a scoped fake SDK; the SDK host is aborted by default. Mutation checks: recreating the map and recentering on append are both caught; the first append assertion was too weak (selected store equal to the first store) and was strengthened before acceptance. Handler detachment and the attempt guard are redundant defences; removing both is caught.

Full run: lint, typecheck, prettier, unit/DB 46, anonymous browser 23, production build passed. agent-browser screens at 320/390/1440: no horizontal overflow, selected card and pins in sync; failure state checked at 390 (retry button restyled for contrast on the map tint). Real-session browser suite was not rerun (no stores coverage there).

Independent review: no Critical. Fixed Important — pressing "지도에서 보기" on the already selected store did not recenter (pan request counter). Fixed Minor — retry offered with an empty list after a brand change (search hint now precedes failure), focus dropped after a successful retry (focus moves to the map region), missing `maps.load` timeout coverage. Unmount-during-load is handled by the effect's active flag and was not given a dedicated test. Real Kakao rendering of the SVG data-URI marker image is unverified and added to the release gate.
