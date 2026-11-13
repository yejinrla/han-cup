import { afterEach, expect, test, vi } from "vitest";
const { user, db } = vi.hoisted(() => ({ user: vi.fn(), db: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ currentUser: user }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: db }));
import { getArticleFavorites } from "@/features/favorites/articles";
afterEach(() => vi.clearAllMocks());
function result(value: unknown) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };
  query.order.mockReturnValueOnce(query).mockResolvedValueOnce(value);
  db.mockResolvedValue({ from: () => query });
}
test("anonymous article reading does not require a favorites table", async () => {
  user.mockResolvedValue(null);
  expect(await getArticleFavorites()).toEqual({ slugs: [], available: true });
  expect(db).not.toHaveBeenCalled();
});
test("missing migration degrades article controls without breaking reading", async () => {
  result({ data: null, error: { code: "PGRST205" } });
  expect(await getArticleFavorites("owner")).toEqual({
    slugs: [],
    available: false,
  });
});
test("permission errors do not become a fake empty collection", async () => {
  result({ data: null, error: { code: "42501" } });
  await expect(getArticleFavorites("owner")).rejects.toThrow(
    "아티클 좋아요를 불러오지 못했어요.",
  );
});
test("unpublished slugs are omitted while database ordering is retained", async () => {
  result({
    data: [
      { article_slug: "your-latte" },
      { article_slug: "not-published" },
      { article_slug: "autumn-tea" },
    ],
    error: null,
  });
  expect((await getArticleFavorites("owner")).slugs).toEqual([
    "your-latte",
    "autumn-tea",
  ]);
});
