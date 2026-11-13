import { StoreSearch } from "@/features/stores/components/StoreSearch";
import { brands, type BrandId } from "@/features/catalog/types";
export const metadata = { title: "주변 매장 찾기" };
export default async function Stores({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const p = await searchParams;
  const brand: BrandId =
    p.brand && p.brand in brands ? (p.brand as BrandId) : "starbucks";
  return (
    <main id="main" className="page-wrap">
      <h1 className="page-heading">내 주변의 한 잔</h1>
      <p className="page-intro">
        발견한 음료를 만나러 갈 가까운 카페를 찾아보세요.
      </p>
      <StoreSearch initialBrand={brand} />
    </main>
  );
}
