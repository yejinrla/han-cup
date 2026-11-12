import { getFavoriteIds } from "@/features/favorites/repository";
import Link from "next/link";
import { ArrowUpRight, Leaf, BookOpen } from "lucide-react";
import {
  CatalogFilters,
  BasisToggle,
  SortControl,
  queryLink,
} from "@/features/catalog/components/CatalogFilters";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import {
  getCatalog,
  joinCatalog,
  parseCatalogQuery,
} from "@/features/catalog/repository";
import { queryCatalog } from "@/features/catalog/query";
import { getSummaries } from "@/features/reviews/repository";
import { configured } from "@/lib/supabase/server";
export const metadata = { title: "음료 검색" };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const p = new URLSearchParams(
    Object.entries(params).filter(([, v]) => typeof v === "string") as [
      string,
      string,
    ][],
  );
  const q = parseCatalogQuery(p);
  const [data, summaries, favorites] = await Promise.all([
    getCatalog(),
    getSummaries(),
    getFavoriteIds(),
  ]);
  const result = queryCatalog(
    joinCatalog(data, q.temperature).map((x) => ({
      ...x,
      rating: summaries[x.id] ?? x.rating,
    })),
    q,
  );
  return (
    <main id="main" className="search-page">
      <section className="collection" id="collection">
        <div className="collection-heading">
          <div>
            <p className="eyebrow">THE DRINK COLLECTION</p>
            <h1 className="search-heading">음료 검색</h1>
          </div>
          <span className="collection-count">
            <BookOpen size={16} />
            6개 브랜드 탐색
          </span>
        </div>
        <CatalogFilters q={q} />
        <div className="results-bar">
          <p>
            총 <b>{result.total}</b>개의 음료{" "}
            <span>· 가격과 영양정보를 비교해 보세요</span>
          </p>
          <div>
            <BasisToggle q={q} />
            <SortControl q={q} />
          </div>
        </div>
        {!configured() && (
          <p className="data-notice">
            공식 자료를 확인한 초기 음료 {data.drinks.length}종을 미리 볼 수
            있어요. 나머지 브랜드·가격·제공량 기준은 확인 중이며, 제품 사진 대신
            공통 일러스트를 사용합니다.
          </p>
        )}
        {q.basis === "100ml" && (
          <p className="data-notice">
            100ml 수치는 공식 영양 제공량을 확인한 경우에만 계산합니다. 컵
            용량만 알려진 음료는 ‘미제공’으로 표시해요.
          </p>
        )}
        {result.items.length ? (
          <div className="drink-grid">
            {result.items.map((item, i) => (
              <DrinkCard
                key={item.id}
                item={item}
                isFavorite={favorites.includes(item.id)}
                index={q.offset + i}
                basis={q.basis}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Leaf size={32} />
            <h3>조건에 맞는 음료가 없어요</h3>
            <p>
              아직 공식 정보를 확인 중인 브랜드일 수 있어요.
              <br />
              조건을 줄여 다른 한 잔을 찾아보세요.
            </p>
            <Link className="primary-button" href="/search">
              조건 초기화
            </Link>
          </div>
        )}
        {result.nextCursor && (
          <Link
            className="load-more"
            href={queryLink(q, { cursor: result.nextCursor })}
          >
            다음 음료 보기 <ArrowUpRight size={15} />
          </Link>
        )}
        <div className="collection-footnote">
          <span>
            영양정보는 기본 레시피 기준이며, 실제 제공량에 따라 달라질 수
            있어요.
          </span>
          <Link href="/about">
            한컵의 데이터 이야기 <ArrowUpRight size={12} />
          </Link>
        </div>
      </section>
      <section className="journal-banner">
        <div>
          <p className="eyebrow">YOUR LITTLE CUP JOURNAL</p>
          <h2>오늘 마신 한 잔, 어땠나요?</h2>
          <p>
            좋았던 맛도, 다음엔 다른 걸 고르고 싶은 마음도.
            <br />
            나의 한컵에 차곡차곡 기록해 보세요.
          </p>
        </div>
        <Link href="/me/records" className="primary-button">
          나의 한컵 시작하기 <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
