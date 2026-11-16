"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Search,
  ArrowUpRight,
  X,
  Clock3,
  TrendingUp,
  Sparkles,
  History,
} from "lucide-react";
import { DrinkImage } from "@/components/DrinkImage";
import { brands, type CatalogData } from "@/features/catalog/types";
import {
  readRecent,
  historySnapshot,
  writeHistory,
  subscribeHistory,
  RECENT_QUERIES,
  RECENT_DRINKS,
} from "./history";
export const searchHref = (term: string) =>
  "/search?" + new URLSearchParams({ q: term });
type Trend = { term: string; recent: number; previous: number; growth: number };
function RisingSearches() {
  const [result, setResult] = useState<{
    available: boolean;
    items: Trend[];
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/search/activity", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error("unavailable");
        return response.json();
      })
      .then((data) => {
        setResult(data);
        setFailed(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section
      className="search-discovery-section"
      aria-labelledby="rising-title"
    >
      <h2 id="rising-title">
        <TrendingUp size={18} aria-hidden="true" />
        급상승 검색어
      </h2>
      <p className="search-section-caption">
        최근 24시간 · 직전 24시간 대비 검색 증가
      </p>
      {failed ? (
        <div className="search-history-empty" role="status">
          <p>급상승 검색어를 불러오지 못했어요.</p>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setFailed(false);
              setResult(null);
              setAttempt((n) => n + 1);
            }}
          >
            다시 불러오기
          </button>
        </div>
      ) : result === null ? (
        <p className="search-history-empty" role="status">
          검색 흐름을 확인하고 있어요.
        </p>
      ) : result.items.length ? (
        <ol className="rising-searches">
          {result.items.map((item, index) => (
            <li key={item.term}>
              <span className="rising-rank">{index + 1}</span>
              <Link href={searchHref(item.term)}>
                {item.term}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <span
                className="rising-change"
                aria-label={`이전보다 ${item.growth}회 증가`}
              >
                +{item.growth}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="search-history-empty">
          {result.available
            ? "검색이 쌓이면 급상승 검색어를 알려드릴게요."
            : "급상승 검색어를 준비하고 있어요."}
        </p>
      )}
    </section>
  );
}
export function SearchLanding({
  data,
  recommendations,
}: {
  data: CatalogData;
  recommendations: string[];
}) {
  const searchesRaw = useSyncExternalStore(
    subscribeHistory,
    () => historySnapshot(RECENT_QUERIES),
    () => null,
  );
  const viewedRaw = useSyncExternalStore(
    subscribeHistory,
    () => historySnapshot(RECENT_DRINKS),
    () => null,
  );
  const searches = readRecent(searchesRaw).slice(0, 10);
  const viewed = readRecent(viewedRaw).flatMap((entry) => {
    const drink = data.drinks.find(
      (d) => d.slug === entry.value && d.status === "active",
    );
    if (!drink) return [];
    const variant = data.variants.find(
      (v) =>
        v.drinkId === drink.id &&
        v.id === (entry.variant ?? drink.defaultVariantId),
    );
    return variant ? [{ drink, variant }] : [];
  });
  return (
    <main id="main" className="page-wrap search-discovery">
      <div className="search-discovery-heading">
        <h1 className="page-heading">음료 검색</h1>
        <Link href="/search?all=1">
          전체 음료 보기 <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <form
        action="/search"
        className="search-discovery-form"
        onSubmit={(event) => {
          const term = new FormData(event.currentTarget).get("q");
          if (typeof term !== "string" || !term.trim()) event.preventDefault();
        }}
      >
        <div className="search-box">
          <Search size={20} aria-hidden="true" />
          <input
            name="q"
            aria-label="음료명 또는 브랜드 검색"
            placeholder="음료명이나 브랜드를 검색해 보세요"
            maxLength={100}
            autoComplete="off"
            autoFocus
            required
          />
          <button type="submit" aria-label="검색">
            <ArrowUpRight size={21} aria-hidden="true" />
          </button>
        </div>
      </form>
      <section
        className="search-discovery-section"
        aria-labelledby="recent-search-title"
      >
        <div className="search-section-head">
          <h2 id="recent-search-title">
            <Clock3 size={18} aria-hidden="true" />
            최근 검색어
          </h2>
          {searches.length > 0 && (
            <button
              type="button"
              onClick={() => writeHistory(RECENT_QUERIES, null)}
              aria-label="최근 검색어 전체 삭제"
            >
              전체 삭제
            </button>
          )}
        </div>
        {searches.length ? (
          <ul className="recent-searches">
            {searches.map((entry) => (
              <li key={entry.value}>
                <Link prefetch={false} href={searchHref(entry.value)}>
                  {entry.value}
                </Link>
                <button
                  type="button"
                  aria-label={`${entry.value} 최근 검색어 삭제`}
                  onClick={() =>
                    writeHistory(
                      RECENT_QUERIES,
                      JSON.stringify(
                        searches.filter((row) => row.value !== entry.value),
                      ),
                    )
                  }
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-history-empty">최근 검색어가 없어요.</p>
        )}
        <p className="search-section-caption">이 기기에만 저장돼요.</p>
      </section>
      <RisingSearches />
      <section
        className="search-discovery-section"
        aria-labelledby="recommended-title"
      >
        <h2 id="recommended-title">
          <Sparkles size={18} aria-hidden="true" />
          추천 검색어
        </h2>
        <p className="search-section-caption">
          어떤 음료를 찾을지 고민될 때, 한컵의 추천
        </p>
        <div className="recommended-searches">
          {recommendations.map((term) => (
            <Link href={searchHref(term)} key={term}>
              #{term}
            </Link>
          ))}
        </div>
      </section>
      <section
        className="search-discovery-section"
        aria-labelledby="viewed-title"
      >
        <div className="search-section-head">
          <h2 id="viewed-title">
            <History size={18} aria-hidden="true" />
            최근 본 음료
          </h2>
          {viewed.length > 0 && (
            <button
              type="button"
              aria-label="최근 본 음료 전체 삭제"
              onClick={() => writeHistory(RECENT_DRINKS, null)}
            >
              전체 삭제
            </button>
          )}
        </div>
        {viewed.length ? (
          <ul className="recent-drink-rail">
            {viewed.map(({ drink, variant }) => (
              <li key={drink.slug}>
                <Link
                  prefetch={false}
                  href={`/drinks/${drink.slug}?variant=${variant.id}`}
                >
                  <div className={`recent-drink-visual ${drink.category}`}>
                    <DrinkImage
                      src={variant.imagePath}
                      name={drink.name}
                      kind={drink.category}
                      temperature={variant.temperature}
                      cupMl={variant.cupMl}
                    />
                  </div>
                  <span className="recent-drink-brand">
                    {brands[drink.brandId]}
                  </span>
                  <span className="recent-drink-name">{drink.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-history-empty">
            관심 있는 음료를 눌러보세요. 최근 본 음료를 여기서 다시 찾을 수
            있어요.
          </p>
        )}
      </section>
    </main>
  );
}
