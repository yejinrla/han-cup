import "server-only";
import local from "../../../data/catalog/initial.json";
import type { CatalogData, CatalogItem, Drink, DrinkVariant } from "./types";
import { configured, serverClient } from "@/lib/supabase/server";
import { parseCatalogQuery, queryCatalog, type CatalogQuery } from "./query";
export async function getCatalog(): Promise<CatalogData> {
  if (!configured()) return local as CatalogData;
  const db = await serverClient();
  const [d, v] = await Promise.all([
    db.from("drinks").select("*"),
    db.from("drink_variants").select("*"),
  ]);
  if (d.error || v.error)
    throw new Error(
      "음료 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  return {
    drinks: d.data.map(
      (x) =>
        ({
          id: x.id,
          slug: x.slug,
          brandId: x.brand_id,
          name: x.name,
          category: x.category,
          status: x.status,
          defaultVariantId: x.default_variant_id,
        }) as Drink,
    ),
    variants: v.data.map(
      (x) =>
        ({
          id: x.id,
          drinkId: x.drink_id,
          temperature: x.temperature,
          sizeLabel: x.size_label,
          cupMl: x.cup_ml === null ? null : Number(x.cup_ml),
          nutritionBasisMl:
            x.nutrition_basis_ml === null ? null : Number(x.nutrition_basis_ml),
          nutrition: {
            caloriesKcal:
              x.calories_kcal === null ? null : Number(x.calories_kcal),
            sugarG: x.sugar_g === null ? null : Number(x.sugar_g),
            caffeineMg: x.caffeine_mg === null ? null : Number(x.caffeine_mg),
          },
          priceKrw: x.price_krw,
          source: { url: x.source_url, checkedAt: x.checked_at },
          priceSourceUrl: x.price_source_url,
          imagePath: x.image_path,
          extraNutrition: x.extra_nutrition,
        }) as DrinkVariant,
    ),
  };
}
export function joinCatalog(
  data: CatalogData,
  temperature?: string,
): CatalogItem[] {
  return data.drinks.flatMap((d) => {
    const v = temperature
      ? data.variants.find(
          (v) => v.drinkId === d.id && v.temperature === temperature,
        )
      : data.variants.find((v) => v.id === d.defaultVariantId);
    return v ? [{ ...d, variant: v, rating: { average: null, count: 0 } }] : [];
  });
}
export async function listDrinks(q: CatalogQuery) {
  return queryCatalog(joinCatalog(await getCatalog(), q.temperature), q);
}
export async function resolveComparison(ids: string[]) {
  const data = await getCatalog();
  const items: CatalogItem[] = [];
  const unavailableIds: string[] = [];
  for (const id of [...new Set(ids)].slice(0, 3)) {
    const v = data.variants.find((v) => v.id === id),
      d = data.drinks.find((d) => d.id === v?.drinkId);
    if (v && d)
      items.push({ ...d, variant: v, rating: { average: null, count: 0 } });
    else unavailableIds.push(id);
  }
  return { items, unavailableIds };
}
export { parseCatalogQuery };
