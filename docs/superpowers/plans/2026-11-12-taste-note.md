# Taste note implementation plan

Spec: docs/superpowers/specs/2026-11-12-taste-note-design.md. Approved compact change; execute inline.

- [x] Add failing browser test for card immediately after search CTA, navigation to article, body and real drink details, unknown slug404, mobile320/desktop1440 no overflow.
- [x] Add local note data, home banner component and dynamic article route with metadata/notFound. Filter recommendations by active catalog and valid owned default variant. Preserve favorite/compare cards and provide an honest partial-data fallback.
- [x] Add card/article CSS, active home route matching and sitemap entry. Reuse own SVG illustration, no third-party images.
- [x] Run targeted/full browser, unit/DB, lint/typecheck/build; inspect rendered screenshots. Review before committing and verify deployment.

Verification: browser test failed on missing banner before implementation; resolver unit failed on missing implementation, then both passed. Full unit/DB38 and anonymous browser20 passed; lint and production build passed. Screenshots inspected and root/article checked at320/390/1440px without overflow or browser errors. Independent read-only review found no material issues. No database migration required.
