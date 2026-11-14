import { expect, test } from "vitest";
import { groupArrivals } from "@/features/discovery/curation";

const arrival = (
  id: string,
  brandId: string,
  releasedOn: string,
  sourceUrl: string,
) => ({
  item: { id, brandId },
  releasedOn,
  sourceUrl,
});

test("arrivals group by release date and official source, keeping first-seen order", () => {
  const groups = groupArrivals(
    [
      arrival("a", "mega", "2026-10-29", "https://mega.example/notice"),
      arrival("b", "ediya", "2026-11-01", "https://ediya.example/notice"),
      arrival("c", "mega", "2026-10-29", "https://mega.example/notice"),
      arrival("d", "mega", "2026-11-01", "https://mega.example/other"),
    ],
    (brandId) => ({ mega: "메가MGC커피", ediya: "이디야" })[brandId] ?? brandId,
  );
  expect(
    groups.map((g) => [g.releasedOn, g.brandNames, g.items.map((i) => i.id)]),
  ).toEqual([
    ["2026-10-29", "메가MGC커피", ["a", "c"]],
    ["2026-11-01", "이디야", ["b"]],
    ["2026-11-01", "메가MGC커피", ["d"]],
  ]);
});

test("one source shared by two brands lists both names once", () => {
  const groups = groupArrivals(
    [
      arrival("a", "mega", "2026-10-29", "https://x.example/n"),
      arrival("b", "paik", "2026-10-29", "https://x.example/n"),
      arrival("c", "mega", "2026-10-29", "https://x.example/n"),
    ],
    (brandId) => ({ mega: "메가MGC커피", paik: "빽다방" })[brandId] ?? brandId,
  );
  expect(groups).toHaveLength(1);
  expect(groups[0].brandNames).toBe("메가MGC커피, 빽다방");
});
