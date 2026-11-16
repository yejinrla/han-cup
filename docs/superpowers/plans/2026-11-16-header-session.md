# Header session label correction

User reports that the header still says 로그인 after signing in. Root cause: Header renders an unconditional login Link and never reads session state.

- [x] Extend the real-session browser journey to require header logout while authenticated, use it to sign out, then require login and no logout. Observe RED.
- [x] Keep static header branding; render the session control in a Suspense boundary with a neutral fixed-size placeholder. Read currentUser on the server and reuse the existing logout action. Use React cache only per server render so header and protected content share one session check, never a persistent auth cache.
- [x] Keep My-page logout available; account navigation and session protection unchanged. Bring local auth fixture migrations through 009 to match current production code.
- [x] Run session/public browser tests, unit/DB suite, lint/build/typecheck; review and deploy after checks.

Verification: logged-in missing-header-logout test observed RED before code. After implementation, unit/DB 76/76, targeted public browser 6/6 and full local-session browser 8/8 pass; lint, build, typecheck and whitespace checks pass. Two old session assertions were ambiguous after OptionPicker added a second status region; scoped them to the expected success message, then reran all eight successfully. Screenshot inspected, independent review found no blockers. Auth fixture migration009 added for current review schema; no production migration is required for this header change.
