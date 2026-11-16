# Search discovery landing

User requested recent searches, rising searches, recommended keywords and recently viewed drinks instead of an immediate catalog list. Confirmed search/keyword selection should lead to existing results; user asked to proceed without more design questions.

## Experience
- Bare `/search` is a search landing: input, recent searches, rising terms, curated recommended chips and recently viewed drinks. No results grid, filters or result count before a search.
- Search query or a recognized filter keeps existing results behavior. `/search?all=1` explicitly browses all drinks; a landing link exposes it. Existing category/brand/nutrition/sort links stay valid. Results have a search-home link; clearing filters remains in all-drink results.
- Recent queries (10) and viewed drinks (12) live only in this browser for 30 days, newest first, deduplicated. Search chips have individual removal and clear all; viewed history can be cleared. No private history is sent to the server or rendered in shared HTML. Handle denied storage and corrupt data without breaking search.
- Recommended keywords are clearly editorial, filtered to terms with actual active catalog results. Recent drink cards resolve saved slug/variant IDs against current catalog data; omit removed/inactive records.
- Rising terms are actual recent-24-hour counts minus preceding-24-hour counts, minimum 3 recent signals and positive growth, maximum 5. No seed/fake rankings. Show unavailable/insufficient-data states honestly.

## Search signal privacy and budget
Only known full drink/brand names and a short fixed list of useful catalog terms are eligible, validated on server and again in SQL. Never aggregate arbitrary free-text input. POST body contains only an eligible public keyword. Server uses a daily HMAC of the platform-supplied client address (service key is never stored/exposed); no raw IP, user ID or precise timestamp is returned. One eligible term per address/day, at most 30 terms per daily hash. Keep signals up to 48h; expired data is pruned on subsequent writes, and reads exclude it. Aggregate RPC is public; raw table and writer RPC are service-role only. Supabase setup is additive rerunnable migration010, requiring user application because production credentials are unavailable. Search/local history work before migration. No paid service or added dependency.

## Implementation choices
Use current Next/TS/CSS and local catalog fallback. Query params are navigation state, browser localStorage is personal history, database contains anonymous eligible keyword signals only. Prefer this over account history (unnecessary login/deletion complexity) or fabricated trends (misleading). Retain five bottom tabs, likes, comparison and existing result filter logic.

## Validation
Bare landing versus explicit/filtered results; recent search reorder/delete/reload; actual detail view record; denied/corrupt storage; actual recommendation matches; mobile overflow; migration rerun, grants, threshold, dedupe, rate limit and rising math; malformed input, unknown terms and absent migration. Existing catalog tests target explicit browse mode. Review before deploy; do not claim production trends ready before SQL application.
