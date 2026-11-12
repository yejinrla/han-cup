import { expect, test, vi } from "vitest";
import { rankPopularity } from "../../src/features/discovery/ranking";
import {
  publishFavoriteChange,
  subscribeFavoriteChange,
} from "../../src/features/favorites/events";
import catalog from "../../data/catalog/initial.json";
import type { CatalogItem } from "../../src/features/catalog/types";

test("unresolved ranked products retain original positions and resolve after catalog refresh", () => {
  const first = {
    ...catalog.drinks[0],
    variant: catalog.variants[0],
    rating: { average: null, count: 0 },
  } as CatalogItem;
  const second = { ...first, id: "10000000-0000-4000-8000-000000000001" };
  const snapshot = [
    { drinkId: second.id, recorders: 5 },
    { drinkId: first.id, recorders: 3 },
  ];
  const before = rankPopularity([first], snapshot);
  expect(before.missing).toBe(true);
  expect(before.ranked.map((x) => x.rank)).toEqual([2]);
  const after = rankPopularity([first, second], snapshot);
  expect(after.missing).toBe(false);
  expect(after.ranked.map((x) => x.rank)).toEqual([1, 2]);
});
test("favorite state changes synchronize duplicate cards without leaking state after unsubscription", () => {
  const target = new EventTarget();
  vi.stubGlobal("window", target);
  const a: boolean[] = [],
    b: boolean[] = [],
    other: boolean[] = [];
  const stopA = subscribeFavoriteChange("drink", (saved) => a.push(saved));
  const stopB = subscribeFavoriteChange("drink", (saved) => b.push(saved));
  const stopOther = subscribeFavoriteChange("other", (saved) =>
    other.push(saved),
  );
  try {
    publishFavoriteChange("drink", true);
    expect(a).toEqual([true]);
    expect(b).toEqual([true]);
    expect(other).toEqual([]);
    stopA();
    publishFavoriteChange("drink", false);
    expect(a).toEqual([true]);
    expect(b).toEqual([true, false]);
  } finally {
    stopA();
    stopB();
    stopOther();
    vi.unstubAllGlobals();
  }
});
