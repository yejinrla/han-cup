import { z } from "zod";
import type { CatalogData, CatalogItem } from "@/features/catalog/types";
const officialDomains = {
  starbucks: "starbucks.co.kr",
  twosome: "twosome.co.kr",
  ediya: "ediya.com",
  mega: "mega-mgccoffee.com",
  compose: "composecoffee.com",
  paik: "paikdabang.com",
};
const entrySchema = z.object({
  drinkId: z.uuid(),
  releasedOn: z.iso.date(),
  sourceUrl: z.url(),
});
export function selectNewArrivals(
  data: CatalogData,
  input: unknown,
  today: string,
) {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input
    .flatMap((entry) => {
      const parsed = entrySchema.safeParse(entry);
      if (!parsed.success || parsed.data.releasedOn > today) return [];
      const { drinkId, releasedOn, sourceUrl } = parsed.data;
      const drink = data.drinks.find(
        (d) => d.id === drinkId && d.status === "active",
      );
      const variant =
        drink &&
        data.variants.find(
          (v) => v.id === drink.defaultVariantId && v.drinkId === drink.id,
        );
      if (!drink || !variant) return [];
      const url = new URL(sourceUrl),
        domain = officialDomains[drink.brandId];
      if (
        url.protocol !== "https:" ||
        (url.hostname !== domain && !url.hostname.endsWith("." + domain))
      )
        return [];
      const item: CatalogItem = {
        ...drink,
        variant,
        rating: { average: null, count: 0 },
      };
      return [{ item, releasedOn, sourceUrl }];
    })
    .sort(
      (a, b) =>
        b.releasedOn.localeCompare(a.releasedOn) ||
        a.item.id.localeCompare(b.item.id),
    )
    .filter((entry) => {
      if (seen.has(entry.item.id)) return false;
      seen.add(entry.item.id);
      return true;
    })
    .slice(0, 6);
}
const catalogKeys = new Set([
  "q",
  "brand",
  "category",
  "temperature",
  "basis",
  "sort",
  "cursor",
  "maxCalories",
  "maxSugar",
  "maxCaffeine",
]);
export function legacySearchUrl(
  params: Record<string, string | string[] | undefined>,
) {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!catalogKeys.has(key) || value === undefined) continue;
    for (const part of Array.isArray(value) ? value : [value])
      p.append(key, part);
  }
  return p.size ? "/search?" + p : null;
}

/**
 * Arrivals released together from one official source share one heading.
 * Groups and the items inside them keep the order of `arrivals`.
 */
export function groupArrivals<
  T extends {
    item: { brandId: string };
    releasedOn: string;
    sourceUrl: string;
  },
>(arrivals: T[], brandName: (brandId: string) => string) {
  const groups = new Map<
    string,
    { key: string; releasedOn: string; sourceUrl: string; arrivals: T[] }
  >();
  for (const a of arrivals) {
    const key = `${a.releasedOn}|${a.sourceUrl}`;
    if (!groups.has(key))
      groups.set(key, {
        key,
        releasedOn: a.releasedOn,
        sourceUrl: a.sourceUrl,
        arrivals: [],
      });
    groups.get(key)!.arrivals.push(a);
  }
  return [...groups.values()].map((g) => ({
    key: g.key,
    releasedOn: g.releasedOn,
    sourceUrl: g.sourceUrl,
    brandNames: [
      ...new Set(g.arrivals.map((a) => brandName(a.item.brandId))),
    ].join(", "),
    items: g.arrivals.map((a): T["item"] => a.item),
  }));
}
