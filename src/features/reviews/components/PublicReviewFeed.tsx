"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { PublicReviewPayload } from "../types";
import { ReportForm } from "./ReviewForm";

// Review bodies never enter Next's server-component route cache. Clear them
// before departure and require a fresh authorized response on restoration.
export function PublicReviewFeed({
  drinkId,
  variantId,
  offset,
  enabled,
}: {
  drinkId: string;
  variantId: string;
  offset: number;
  enabled: boolean;
}) {
  const [payload, setPayload] = useState<PublicReviewPayload | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let active = true,
      departing = false,
      controller: AbortController | undefined;
    const path = location.pathname,
      search = location.search;
    const current = () =>
      location.pathname === path && location.search === search;
    const clear = () => {
      controller?.abort();
      flushSync(() => {
        setPayload(null);
        setError("");
      });
    };
    const load = async () => {
      await Promise.resolve();
      if (
        !active ||
        departing ||
        !current() ||
        document.visibilityState !== "visible"
      )
        return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setPayload(null);
      setError("");
      try {
        const res = await fetch(
          `/api/drinks/${drinkId}/reviews?offset=${offset}`,
          { cache: "no-store", signal: request.signal },
        );
        if (!res.ok) throw new Error("공개 후기를 불러오지 못했어요.");
        const result: PublicReviewPayload = await res.json();
        if (
          active &&
          !request.signal.aborted &&
          !departing &&
          current() &&
          document.visibilityState === "visible"
        )
          setPayload(result);
      } catch (e) {
        if (active && !request.signal.aborted)
          setError(
            e instanceof Error ? e.message : "공개 후기를 불러오지 못했어요.",
          );
      }
    };
    const restore = () => {
      clear();
      departing = false;
      if (current()) void load();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        departing = true;
        clear();
      } else restore();
    };
    const leave = () => {
      departing = true;
      clear();
    };
    const navigate = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank")
        return;
      const url = new URL(anchor.href);
      if (
        url.origin === location.origin &&
        (url.pathname !== path || url.search !== search)
      )
        leave();
    };
    document.addEventListener("click", navigate, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", restore);
    window.addEventListener("popstate", restore);
    window.addEventListener("pageshow", restore);
    window.addEventListener("pagehide", leave);
    void load();
    return () => {
      active = false;
      controller?.abort();
      document.removeEventListener("click", navigate, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", restore);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("pagehide", leave);
    };
  }, [drinkId, variantId, offset, enabled]);
  if (error)
    return (
      <p className="status-box" role="status">
        {error} 페이지를 새로고침해 다시 시도해 주세요.
      </p>
    );
  if (enabled && !payload)
    return (
      <p className="muted" role="status">
        최신 공개 후기를 확인하고 있어요…
      </p>
    );
  const data = payload ?? { items: [], summary: { average: null, count: 0 } };
  return (
    <>
      <p className="muted">
        {data.summary.count
          ? `★ ${data.summary.average} / 5 · ${data.summary.count}명의 공개 별점`
          : "아직 공개 평가가 없어요. 첫 한 잔을 기록해 보세요."}
      </p>
      {data.items.map((r) => (
        <article className="record" key={r.id}>
          <div className="record-head">
            <span>
              {r.nickname} · {"★".repeat(r.rating)}
            </span>
            <span>{r.consumed_on}</span>
          </div>
          <p className="record-body">{r.body || "별점으로 남긴 한 잔"}</p>
          <ReportForm reviewId={r.id} />
        </article>
      ))}
      {data.items.length === 20 && (
        <Link
          className="text-button"
          href={`?variant=${variantId}&reviews=${offset + 20}`}
        >
          다음 후기 보기 →
        </Link>
      )}
    </>
  );
}
