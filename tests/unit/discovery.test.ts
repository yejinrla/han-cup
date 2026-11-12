import { test, expect } from "vitest";
import {
  selectNewArrivals,
  legacySearchUrl,
} from "../../src/features/discovery/curation";
import catalog from "../../data/catalog/initial.json";
import type { CatalogData } from "../../src/features/catalog/types";
const data = catalog as CatalogData;
test("new arrivals require verified brand source and valid release date; active products sort newest first", () => {
  const a = data.drinks[0],
    b = data.drinks[1];
  const selected = selectNewArrivals(
    data,
    [
      {
        drinkId: a.id,
        releasedOn: "2026-11-01",
        sourceUrl: "https://www.ediya.com/contents/drink.html",
      },
      {
        drinkId: b.id,
        releasedOn: "2026-11-10",
        sourceUrl: "https://www.ediya.com/contents/drink.html",
      },
    ],
    "2026-11-12",
  );
  expect(selected.map((x) => x.item.id)).toEqual([b.id, a.id]);
  expect(
    selectNewArrivals(
      data,
      [
        {
          drinkId: a.id,
          releasedOn: "2026-11-13",
          sourceUrl: "https://www.ediya.com/menu",
        },
      ],
      "2026-11-12",
    ),
  ).toEqual([]);
  expect(
    selectNewArrivals(
      {
        ...data,
        drinks: data.drinks.map((d) => ({ ...d, status: "discontinued" })),
      },
      [
        {
          drinkId: a.id,
          releasedOn: "2026-11-10",
          sourceUrl: "https://www.ediya.com/menu",
        },
      ],
      "2026-11-12",
    ),
  ).toEqual([]);
  expect(
    selectNewArrivals(
      data,
      [
        {
          drinkId: a.id,
          releasedOn: "2026-11-10",
          sourceUrl: "https://evil.example/menu",
        },
      ],
      "2026-11-12",
    ),
  ).toEqual([]);
  expect(
    selectNewArrivals(
      data,
      [
        {
          drinkId: a.id,
          releasedOn: "2026-02-30",
          sourceUrl: "https://www.ediya.com/menu",
        },
      ],
      "2026-11-12",
    ),
  ).toEqual([]);
  expect(selectNewArrivals(data, [], "2026-11-12")).toEqual([]);
});
test("legacy home searches retain supported repeated parameters and ignore unrelated campaign fields", () => {
  expect(
    legacySearchUrl({
      q: "라떼",
      brand: ["ediya", "mega"],
      basis: "100ml",
      cursor: "20",
    }),
  ).toBe(
    "/search?q=%EB%9D%BC%EB%96%BC&brand=ediya&brand=mega&basis=100ml&cursor=20",
  );
  expect(legacySearchUrl({ utm_source: "share" })).toBeNull();
});
