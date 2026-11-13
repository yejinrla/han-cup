import { getFavoriteIds } from "@/features/favorites/repository";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getCatalog } from "@/features/catalog/repository";
import { getNutrition, fmt } from "@/features/catalog/nutrition";
import { brands, type Basis } from "@/features/catalog/types";
import { DrinkImage } from "@/components/DrinkImage";
import { CompareButton } from "@/features/compare/components/CompareControls";
import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import { PublicReviews } from "@/features/reviews/components/PublicReviews";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { drinks } = await getCatalog();
  return {
    title: drinks.find((x) => x.slug === slug)?.name ?? "음료를 찾을 수 없어요",
  };
}
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; basis?: string; reviews?: string }>;
}) {
  const { slug } = await params;
  const p = await searchParams;
  const data = await getCatalog();
  const drink = data.drinks.find((x) => x.slug === slug);
  if (!drink) notFound();
  const variants = data.variants.filter((v) => v.drinkId === drink.id);
  const v =
    variants.find((x) => x.id === p.variant) ??
    variants.find((x) => x.id === drink.defaultVariantId) ??
    variants[0];
  if (!v) notFound();
  const basis: Basis = p.basis === "100ml" ? "100ml" : "serving";
  const n = getNutrition(v, basis);
  const favorites = await getFavoriteIds();
  return (
    <main id="main" className="page-wrap">
      <div className="breadcrumb">
        <Link href="/search">
          <ArrowLeft size={14} /> 음료 도감
        </Link>
        <span>/</span>
        {brands[drink.brandId]}
        <span>/</span>
        {drink.name}
      </div>
      <div className="detail-grid">
        <div className="detail-visual">
          <DrinkImage
            src={v.imagePath}
            name={drink.name}
            kind={drink.category}
            temperature={v.temperature}
            cupMl={v.cupMl}
            large
          />
          {!v.imagePath && (
            <span className="illustration-note">
              제품 사진 대신 컵 높이로 용량, 색으로 분류를 나타낸 공통 일러스트
            </span>
          )}
        </div>
        <div>
          <p className="detail-brand">{brands[drink.brandId]}</p>
          <h1 className="detail-title">{drink.name}</h1>
          {drink.status === "discontinued" && (
            <p className="status-box">
              판매가 종료된 음료입니다. 남긴 기록은 계속 확인할 수 있어요.
            </p>
          )}
          <div className="variant-options">
            {variants.map((x) => (
              <Link
                className={x.id === v.id ? "active" : ""}
                key={x.id}
                href={`?variant=${x.id}&basis=${basis}`}
              >
                {x.temperature.toUpperCase()} · {x.sizeLabel}
              </Link>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            컵 용량 {fmt(v.cupMl, "ml")}　·　가격 {fmt(v.priceKrw, "원")}
          </p>
          <div className="detail-actions">
            <CompareButton id={v.id} />
            <div style={{ position: "relative", width: 38, height: 32 }}>
              <FavoriteButton
                key={drink.id + String(favorites.includes(drink.id))}
                drinkId={drink.id}
                initial={favorites.includes(drink.id)}
              />
            </div>
            <Link
              className="text-button"
              href={"/stores?brand=" + drink.brandId}
            >
              <MapPin size={14} />
              주변 매장 찾기
            </Link>
          </div>
          <div className="basis-toggle" style={{ width: "max-content" }}>
            {(["serving", "100ml"] as const).map((b) => (
              <Link
                className={basis === b ? "active" : ""}
                key={b}
                href={`?variant=${v.id}&basis=${b}`}
              >
                {b === "serving" ? "한 잔 기준" : "100ml 기준"}
              </Link>
            ))}
          </div>
          <div className="detail-nutrients">
            {[
              ["칼로리", n.caloriesKcal, "kcal"],
              ["당류", n.sugarG, "g"],
              ["카페인", n.caffeineMg, "mg"],
            ].map(([label, num, unit]) => (
              <div key={label as string}>
                <small>{label}</small>
                <b>{fmt(num as number | null)}</b>
                <span className="muted"> {num === null ? "" : unit}</span>
              </div>
            ))}
          </div>
          {basis === "100ml" && (
            <p className="muted">
              공식 영양 제공량이 확인된 경우에만 계산값을 표시합니다.
            </p>
          )}
          {v.extraNutrition &&
            Object.entries(v.extraNutrition).map(([key, value]) => (
              <p className="muted" key={key}>
                {key}: {value}
              </p>
            ))}
          <p className="source-note">
            <a href={v.source.url} target="_blank" rel="noreferrer">
              공식 영양정보 확인 <ArrowUpRight size={11} />
            </a>
            　·　확인일 {v.source.checkedAt}
          </p>
          <p className="source-note">
            가격은 매장에 따라 달라질 수 있으며, 확인하지 못한 값은 미제공으로
            표시합니다.
          </p>
        </div>
      </div>
      <PublicReviews
        drinkId={drink.id}
        variantId={v.id}
        offset={
          /^\d+$/.test(p.reviews ?? "") ? Math.min(Number(p.reviews), 10000) : 0
        }
      />
    </main>
  );
}
