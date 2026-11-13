"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rankPopularity } from "../ranking";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import type { CatalogItem } from "@/features/catalog/types";
import { popularitySchema, type PopularitySnapshot } from "../popularity";

export function PopularDrinks({
  initial,
  items,
  favoriteIds,
}: {
  initial: PopularitySnapshot;
  items: CatalogItem[];
  favoriteIds: string[];
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initial),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    async function refresh() {
      if (document.visibilityState === "hidden" || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch("/api/discovery/popular", {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) throw new Error("unavailable");
        const next = popularitySchema.parse(await response.json());
        if (!stopped) {
          setSnapshot(next);
          if (rankPopularity(items, next.items).missing) router.refresh();
          setFailed(false);
        }
      } catch {
        if (!stopped && !request.signal.aborted) setFailed(true);
      } finally {
        if (controller === request) controller = null;
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        controller?.abort();
        controller = null;
      } else void refresh();
    };
    const timer = setInterval(() => void refresh(), 300000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      stopped = true;
      clearInterval(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [items, router]);
  const { ranked, missing } = rankPopularity(items, snapshot.items);
  return (
    <>
      <p className="discovery-refresh" aria-live="polite">
        {snapshot.available
          ? `${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul", hour12: false }).format(new Date(snapshot.updatedAt))} 기준 · 5분마다 갱신`
          : "인기 집계를 준비하고 있어요."}
      </p>
      {failed && (
        <p className="status-box" role="status">
          업데이트가 지연되고 있어요. 잠시 후 다시 확인할게요.
        </p>
      )}
      {missing && (
        <p className="status-box" role="status">
          최신 음료 정보를 불러오고 있어요. 준비된 음료부터 표시합니다.
        </p>
      )}
      {ranked.length ? (
        <div className="drink-grid">
          {ranked.map(({ item, recorders, rank }) => (
            <div key={item.id}>
              <p className="discovery-rank">
                <b>{rank}위</b>
                <span>{recorders}명이 기록</span>
              </p>
              <DrinkCard
                item={item}
                basis="serving"
                isFavorite={favoriteIds.includes(item.id)}
              />
            </div>
          ))}
        </div>
      ) : missing ? null : (
        <div className="discovery-empty">
          <p>
            {snapshot.available
              ? "아직 최근 24시간의 음료 기록이 없어요."
              : "기록이 모이면 지금 많이 기록하는 음료를 보여드릴게요."}
          </p>
          <Link href="/search" className="text-button">
            음료를 찾아 첫 한 잔 남기기 →
          </Link>
        </div>
      )}
    </>
  );
}
