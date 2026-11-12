import type { CatalogItem } from "@/features/catalog/types";
export function rankPopularity(
  items: CatalogItem[],
  rows: { drinkId: string; recorders: number }[],
) {
  const ranked = rows.flatMap((row, index) => {
    const item = items.find(
      (item) => item.id === row.drinkId && item.status === "active",
    );
    return item ? [{ item, recorders: row.recorders, rank: index + 1 }] : [];
  });
  return { ranked, missing: ranked.length !== rows.length };
}
