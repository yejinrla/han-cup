# Article favorites inside Likes

User requests internal tabs for drink and article likes while preserving the five bottom tabs. Default `/me/favorites` remains drinks; `/me/favorites?tab=articles` shows saved articles in a single-column card list, most recently saved first. Navigation uses links styled as tabs, with current-page semantics and a clear empty state.

Article detail receives a like/unlike button. Anonymous users return through login to an explicit article-save confirmation, preserving the intended article. Use existing nickname/session authentication and public static article slugs. Never store likes only in localStorage.

Architecture choice: separate `article_favorites(user_id,article_slug,created_at)` table. Extending drink favorites with polymorphic nullable IDs would weaken existing drink foreign-key rules; profile JSON would complicate private querying. Composite primary key prevents duplicate saves, RLS restricts reads/inserts/deletes to the owner, no UPDATE grant, and profile deletion cascades. Server actions additionally reject unpublished/unknown slugs. No public article-like counts or CMS.

Reuse article-card presentation between magazine and saved articles; no nested buttons inside links. Missing DB migration must not break reading existing articles or drink favorites: article controls show unavailable until setup. Other DB errors remain errors. Add rerunnable migration and explicit production SQL setup instructions; this environment has no production DB credentials.

Verify actual local session save/reload/list/open/unlike, drink list independence, anonymous confirmation routing, 320px layout, database ownership/forgery/delete cascade and rerun safety. Implementer chooses existing green visual styling and concise labels.
