"use client";
import { useEffect } from "react";
import {
  historySnapshot,
  pushRecent,
  RECENT_DRINKS,
  RECENT_QUERIES,
  writeHistory,
} from "./history";
export function SearchRecorder({
  query,
  keyword,
}: {
  query: string;
  keyword: string | null;
}) {
  useEffect(() => {
    if (!query.trim()) return;
    writeHistory(
      RECENT_QUERIES,
      pushRecent(historySnapshot(RECENT_QUERIES), query),
    );
    // Only a catalog-validated public term leaves the browser, never raw input.
    if (keyword)
      void fetch("/api/search/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: keyword }),
        keepalive: true,
      }).catch(() => {});
  }, [query, keyword]);
  return null;
}
export function ViewedDrinkRecorder({
  slug,
  variant,
}: {
  slug: string;
  variant: string;
}) {
  useEffect(() => {
    writeHistory(
      RECENT_DRINKS,
      pushRecent(historySnapshot(RECENT_DRINKS), slug, Date.now(), 12, variant),
    );
  }, [slug, variant]);
  return null;
}
