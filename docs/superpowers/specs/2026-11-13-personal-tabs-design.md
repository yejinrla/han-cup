# Separate records and account navigation

Approved by the user: five persistent bottom tabs in order 홈 · 주변 매장 · 좋아요 · 기록 · 마이. Likes remain a first-class tab. Records contain calendar and record creation/editing; My contains profile, account-settings access and an easy-to-find logout.

Approaches considered: keep combined personal area (logout difficult to find); move likes under My (user rejected); five independent tabs (chosen). Retain current framework and 480px app frame.

Implementer choices: keep existing `/me/records`, `/me/favorites` and `/me/settings`; add authenticated `/me` profile landing page. Settings belongs to My. Remove repeated personal subnavigation from records, likes and settings; settings gets an explicit back link to My. Logout lives on My. Keep authentication, stored likes/records and existing deep links. My has matching skeleton; no database migration or new dependency. Profile shows existing nickname with a generic user icon.

Verify five tabs on 320/390/1440px, one active tab per destination, independent records/likes/account journeys, settings return, logout and anonymous login return-to. No new analytics, counters, uploads or account behavior.
