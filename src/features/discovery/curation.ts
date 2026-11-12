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
