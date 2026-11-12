import Link from "next/link";
import { resolveComparison } from "@/features/catalog/repository";
import { CupArt } from "@/components/CupArt";
import { getNutrition, fmt } from "@/features/catalog/nutrition";
import { brands, type Basis } from "@/features/catalog/types";
import { getSummaries } from "@/features/reviews/repository";
import { RemoveCompare } from "@/features/compare/components/CompareControls";
export const metadata = { title: "음료 비교" };
export default async function Compare({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; basis?: string }>;
}) {
  const p = await searchParams;
  const ids = (p.ids ?? "").split(",").filter(Boolean);
  const { items, unavailableIds } = await resolveComparison(ids);
  const basis: Basis = p.basis === "100ml" ? "100ml" : "serving";
  const summaries = await getSummaries();
  return (
    <main id="main" className="page-wrap">
      <p className="eyebrow">SIDE BY SIDE</p>
      <h1 className="page-heading">나에게 맞는 한 잔은?</h1>
      <p className="page-intro">
        가격부터 영양정보까지, 최대 3개 음료를 한눈에 비교해 보세요.
      </p>
      <div className="basis-toggle" style={{ width: "max-content" }}>
        {(["serving", "100ml"] as const).map((b) => (
          <Link
            key={b}
            className={basis === b ? "active" : ""}
            href={
              "/compare?ids=" +
              items.map((x) => x.variant.id).join(",") +
              "&basis=" +
              b
            }
          >
            {b === "serving" ? "한 잔 기준" : "100ml 기준"}
          </Link>
        ))}
      </div>
      {unavailableIds.length > 0 && (
        <p className="status-box">일부 음료 정보가 없어 비교에서 제외했어요.</p>
      )}
      {items.length < 2 ? (
        <div className="empty-state">
          <h2>비교할 음료를 더 담아주세요</h2>
          <p>두 잔부터 나란히 비교할 수 있어요.</p>
          <Link className="primary-button" href="/">
            음료 둘러보기
          </Link>
        </div>
      ) : (
        <div className="comparison-scroll">
          <table>
            <caption className="sr-only">음료 가격과 영양정보 비교</caption>
            <thead>
              <tr>
                <th scope="col">음료</th>
                {items.map((x) => (
                  <th scope="col" key={x.variant.id}>
                    <CupArt name={x.name} kind={x.category} />
                    <small>{brands[x.brandId]}</small>
                    <Link
                      href={"/drinks/" + x.slug + "?variant=" + x.variant.id}
                    >
                      {x.name}
                    </Link>
                    <span className="muted">
                      {x.variant.temperature.toUpperCase()} ·{" "}
                      {x.variant.sizeLabel}
                    </span>
                    {x.status === "discontinued" && (
                      <p className="badge">판매 종료</p>
                    )}
                    <div>
                      <RemoveCompare id={x.variant.id} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["가격", items.map((x) => fmt(x.variant.priceKrw, "원"))],
                ["컵 용량", items.map((x) => fmt(x.variant.cupMl, "ml"))],
                [
                  "칼로리",
                  items.map((x) =>
                    fmt(getNutrition(x.variant, basis).caloriesKcal, "kcal"),
                  ),
                ],
                [
                  "당류",
                  items.map((x) =>
                    fmt(getNutrition(x.variant, basis).sugarG, "g"),
                  ),
                ],
                [
                  "카페인",
                  items.map((x) =>
                    fmt(getNutrition(x.variant, basis).caffeineMg, "mg"),
                  ),
                ],
                [
                  "공개 평점",
                  items.map((x) => {
                    const r = summaries[x.id];
                    return r?.count
                      ? `${r.average} / 5 (${r.count}명)`
                      : "평가 없음";
                  }),
                ],
              ].map(([label, values]) => (
                <tr key={label as string}>
                  <th scope="row">{label}</th>
                  {(values as string[]).map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="source-note">
        100ml 값은 확인된 영양 제공량으로 계산하며, 가격은 한 잔 가격을
        유지합니다.
      </p>
    </main>
  );
}
