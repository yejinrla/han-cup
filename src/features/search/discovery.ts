import type { CatalogData } from "@/features/catalog/types";
import { brands } from "@/features/catalog/types";
export const searchKeywords = [
  "아메리카노",
  "라떼",
  "디카페인",
  "말차",
  "밀크티",
  "콜드브루",
  "초코",
  "리치티",
];
export function normalizeTerm(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 100);
}
export function isSearchResults(p: URLSearchParams) {
  return (
    p.get("all") === "1" ||
    [
      "q",
      "brand",
      "category",
      "temperature",
      "maxCalories",
      "maxSugar",
      "maxCaffeine",
      "sort",
      "basis",
      "cursor",
    ].some((key) => Boolean(p.get(key)?.trim()))
  );
}
export function recommendedTerms(data: CatalogData) {
  const names = data.drinks
    .filter((d) => d.status === "active")
    .map((d) => d.name);
  return searchKeywords
    .filter((term) => names.some((name) => name.includes(term)))
    .slice(0, 6);
}
export function eligibleSearchTerm(
  value: string,
  data: CatalogData,
): string | null {
  const term = normalizeTerm(value).toLocaleLowerCase("ko");
  const drinks = data.drinks.filter((d) => d.status === "active");
  const candidates = [
    ...drinks.map((d) => d.name),
    ...drinks.map((d) => brands[d.brandId]),
    ...searchKeywords.filter((term) =>
      drinks.some((drink) => drink.name.includes(term)),
    ),
  ];
  return (
    candidates.find(
      (candidate) =>
        candidate && normalizeTerm(candidate).toLocaleLowerCase("ko") === term,
    ) ?? null
  );
}
