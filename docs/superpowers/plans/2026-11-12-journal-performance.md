# Journal navigation performance fix

Problem: each calendar request serially awaits the public catalog, selected-day reviews, and monthly date markers. Production headers identify iad1 while user confirms Supabase in Singapore.

Approved behavior stays the same. Preserve authentication validation, private per-user filters, uncached reviews, monthly pagination and all edit/delete flows. No shared private-data caching.

- [x] Add a failing real-HTTP test using Supabase SDK that holds catalog/day/month replies until all three reads start; enforce user/date filters at the HTTP boundary and verify returned records and markers.
- [x] Extract journal loader and execute independent reads via Promise.all, preserving marker pagination and errors. Use it in records page after authentication and optional edit lookup.
- [x] Configure a single Vercel function region sin1, matching user-confirmed Singapore DB. Verify official configuration and build.
- [x] Run all unit/DB tests, authenticated browser tests, lint/typecheck/build, independent code review. Commit and push, then inspect deployed region headers.

Verification: serial implementation failed the gated real-HTTP regression; concurrent implementation passed. Full unit/DB suite 32/32, real-session browser suite 4/4 (including >500 monthly markers and page-2 deletion), lint, typecheck and production build passed. Independent review found no actionable issues. No authentication or caching changes were made. Deployment region confirmation follows push.
Official region configuration: https://vercel.com/docs/project-configuration/vercel-json#regions
