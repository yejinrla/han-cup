import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, ArrowUpRight } from "lucide-react";
import { getCatalog, joinCatalog } from "@/features/catalog/repository";
import { getSummaries } from "@/features/reviews/repository";
import { getFavoriteIds } from "@/features/favorites/repository";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import { koreanDate } from "@/features/reviews/schema";
import {
  legacySearchUrl,
  selectNewArrivals,
} from "@/features/discovery/curation";
import { getPopularity } from "@/features/discovery/repository";
import { unavailablePopularity } from "@/features/discovery/popularity";
import { PopularDrinks } from "@/features/discovery/components/PopularDrinks";
import { TasteNoteBanner } from "@/features/notes/TasteNoteBanner";
import curated from "../../data/catalog/new-arrivals.json";
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const legacy = legacySearchUrl(await searchParams);
  if (legacy) redirect(legacy);
  const [data, summaries, favorites, popularity] = await Promise.all([
    getCatalog(),
    getSummaries(),
    getFavoriteIds(),
    getPopularity().catch(() => unavailablePopularity()),
  ]);
  const arrivals = selectNewArrivals(data, curated, koreanDate());
  const items = joinCatalog(data).map((item) => ({
    ...item,
    rating: summaries[item.id] ?? item.rating,
  }));
  return (
    <main id="main" className="discovery-home">
      <section className="discovery-welcome">
        <h1>
          오늘은 어떤 한 잔을
          <br />
          발견해 볼까요?
        </h1>
        <p>새로운 맛부터 지금 많이 기록하는 음료까지.</p>
        <Link href="/search" className="discovery-search">
          <Search size={19} aria-hidden="true" />
          <span>음료명이나 브랜드로 찾아보세요</span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <TasteNoteBanner />
      </section>
      <section className="discovery-section" aria-labelledby="new-drinks-title">
        <div className="discovery-section-head">
          <div>
            <h2 id="new-drinks-title">이번주 신메뉴</h2>
          </div>
          <Link href="/search">
            전체 음료 <ArrowUpRight size={13} />
          </Link>
        </div>
        {arrivals.length ? (
          <div className="drink-grid">
            {arrivals.map(({ item, releasedOn, sourceUrl }) => (
              <div key={item.id}>
                <p className="discovery-release">
                  {releasedOn} 출시 ·{" "}
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    공식 출시 정보
                  </a>
                </p>
                <DrinkCard
                  item={{ ...item, rating: summaries[item.id] ?? item.rating }}
                  basis="serving"
                  isFavorite={favorites.includes(item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="discovery-empty">
            <p>공식 출시 정보를 확인한 신메뉴를 준비하고 있어요.</p>
            <Link href="/search" className="text-button">
              전체 음료 둘러보기 →
            </Link>
          </div>
        )}
      </section>
      <section
        className="discovery-section"
        aria-labelledby="popular-drinks-title"
      >
        <div className="discovery-section-head">
          <div>
            <h2 id="popular-drinks-title">실시간 인기 메뉴</h2>
          </div>
        </div>
        <p className="discovery-section-note">
          최근 24시간 · 공개·나만 보기 기록 포함 · 음료별 1인 1회 집계
        </p>
        <PopularDrinks
          initial={popularity}
          items={items}
          favoriteIds={favorites}
        />
      </section>
      <Link href="/me/records" className="discovery-journal">
        <span>
          오늘 마신 한 잔도
          <br />
          <b>나의 한컵에 남겨보세요.</b>
        </span>
        <ArrowUpRight size={20} />
      </Link>
    </main>
  );
}
