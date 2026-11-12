export const brands = {
  starbucks: "스타벅스",
  twosome: "투썸플레이스",
  ediya: "이디야",
  mega: "메가MGC커피",
  compose: "컴포즈커피",
  paik: "빽다방",
} as const;
export type BrandId = keyof typeof brands;
export type Basis = "serving" | "100ml";
export type Nutrition = {
  caloriesKcal: number | null;
  sugarG: number | null;
  caffeineMg: number | null;
};
export type Source = { url: string; checkedAt: string };
export type DrinkVariant = {
  id: string;
  drinkId: string;
  temperature: "hot" | "iced" | "ambient";
  sizeLabel: string;
  cupMl: number | null;
  nutritionBasisMl: number | null;
  nutrition: Nutrition;
  priceKrw: number | null;
  source: Source;
  priceSourceUrl?: string | null;
  imagePath: string | null;
  extraNutrition?: Record<string, string | number>;
};
export type Drink = {
  id: string;
  slug: string;
  brandId: BrandId;
  name: string;
  category: "coffee" | "tea" | "ade" | "smoothie" | "other";
  status: "active" | "discontinued";
  defaultVariantId: string | null;
};
export type RatingSummary = { average: number | null; count: number };
export type CatalogItem = Drink & {
  variant: DrinkVariant;
  rating: RatingSummary;
};
export type CatalogData = { drinks: Drink[]; variants: DrinkVariant[] };
