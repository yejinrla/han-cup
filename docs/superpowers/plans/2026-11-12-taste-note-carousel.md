# Taste-note carousel

User requests a taller home editorial banner and swipeable access to other articles. Preserve existing article routes and app frame.

- [x] Add failing browser regression: three slides, height>=230px, next/previous/dot navigation and direct horizontal scroll track active index, second article opens,320/1440px no page overflow.
- [x] Implement native scroll-snap carousel with240px cards, position dots and accessible buttons; no autoplay or dependency. Respect reduced motion. Content: existing autumn tea plus original sweet coffee and latte notes, each linked to actual catalog recommendations.
- [ ] Run unit/DB, browser, lint/build; inspect mobile screenshot and proportional review. Commit/push and verify live markup/routes.

Validation: lint, typecheck, production build, 47 unit/DB tests and 24 browser tests pass. Mobile screenshot inspected at 390px; browser checks cover 320px and 1440px overflow. PR #1 was reviewed and merged first (749edf8); carousel work restored without conflicts.
