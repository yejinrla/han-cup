"use client";
import { useEffect, useRef, useState } from "react";
import type { Store } from "../types";
import { createKakaoMapsLoader, type ScriptLike } from "../map-sdk";
type Coord = object;
type KakaoMap = { setCenter: (p: Coord) => void; panTo: (p: Coord) => void };
type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  setZIndex: (z: number) => void;
  setImage: (image: object) => void;
};
type KakaoMaps = {
  load: (fn: () => void) => void;
  LatLng: new (lat: number, lng: number) => Coord;
  Map: new (
    el: HTMLElement,
    options: { center: Coord; level: number },
  ) => KakaoMap;
  Marker: new (options: {
    position: Coord;
    map: KakaoMap;
    title: string;
    image: object;
    zIndex: number;
  }) => KakaoMarker;
  MarkerImage: new (
    src: string,
    size: object,
    options: { offset: object },
  ) => object;
  Size: new (w: number, h: number) => object;
  Point: new (x: number, y: number) => object;
  event: {
    addListener: (target: KakaoMarker, type: "click", fn: () => void) => void;
  };
};
declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}
let loader: ReturnType<typeof createKakaoMapsLoader<KakaoMaps>> | undefined;
function getLoader() {
  loader ??= createKakaoMapsLoader<KakaoMaps>({
    document: {
      createElement: () =>
        document.createElement("script") as unknown as ScriptLike,
      head: {
        append: (el) => document.head.append(el as unknown as HTMLElement),
      },
    },
    window,
  });
  return loader;
}
// Own pin artwork in the HanCup green; the selected pin is larger and filled.
function pin(selected: boolean) {
  const [w, h] = selected ? [30, 40] : [22, 30];
  const svg = selected
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 40"><path d="M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25Z" fill="#335b43" stroke="#fafbf7" stroke-width="2"/><circle cx="15" cy="14" r="5" fill="#fafbf7"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 22 30"><path d="M11 29S1.5 17.5 1.5 10.5a9.5 9.5 0 0 1 19 0C20.5 17.5 11 29 11 29Z" fill="#fafbf7" stroke="#335b43" stroke-width="2"/><circle cx="11" cy="10.5" r="3.5" fill="#335b43"/></svg>`;
  return { src: "data:image/svg+xml," + encodeURIComponent(svg), w, h };
}
export function StoreMap({
  items,
  searchId,
  selectedId,
  panRequest,
  onSelect,
}: {
  items: Store[];
  searchId: number;
  selectedId: string | null;
  panRequest: number;
  onSelect: (id: string) => void;
}) {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const canvas = useRef<HTMLDivElement>(null);
  const map = useRef<KakaoMap | null>(null);
  const markers = useRef(new Map<string, KakaoMarker>());
  const select = useRef(onSelect);
  const focusMapOnLoad = useRef(false);
  const [kakao, setKakao] = useState<KakaoMaps | null>(null);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const hasItems = items.length > 0;
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!key || !hasItems || kakao) return;
    let active = true;
    getLoader()
      .load(key)
      .then((maps) => {
        if (!active) return;
        setKakao(maps);
        setFailed(false);
        setRetrying(false);
        // The focused retry button disappears on success; hand focus to the map.
        if (focusMapOnLoad.current) canvas.current?.focus();
        focusMapOnLoad.current = false;
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setRetrying(false);
        focusMapOnLoad.current = false;
      });
    return () => {
      active = false;
    };
  }, [key, hasItems, kakao, attempt]);
  useEffect(() => {
    if (!kakao || !canvas.current) return;
    for (const m of markers.current.values()) m.setMap(null);
    markers.current.clear();
    if (!items.length) return;
    map.current ??= new kakao.Map(canvas.current, {
      center: new kakao.LatLng(items[0].lat, items[0].lng),
      level: 5,
    });
    for (const s of items) {
      const marker = new kakao.Marker({
        position: new kakao.LatLng(s.lat, s.lng),
        map: map.current,
        title: s.name,
        image: markerImage(kakao, false),
        zIndex: 0,
      });
      kakao.event.addListener(marker, "click", () => select.current(s.id));
      markers.current.set(s.id, marker);
    }
  }, [kakao, items]);
  useEffect(() => {
    if (!kakao) return;
    for (const [id, marker] of markers.current) {
      marker.setImage(markerImage(kakao, id === selectedId));
      marker.setZIndex(id === selectedId ? 10 : 0);
    }
  }, [kakao, items, selectedId]);
  // A new search recenters on the nearest store; appended pages keep the view.
  const first = items[0];
  useEffect(() => {
    if (kakao && map.current && first)
      map.current.setCenter(new kakao.LatLng(first.lat, first.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on new searches
  }, [kakao, searchId]);
  const selected = items.find((s) => s.id === selectedId);
  useEffect(() => {
    if (kakao && map.current && selected)
      map.current.panTo(new kakao.LatLng(selected.lat, selected.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a new selection or pan request
  }, [kakao, selectedId, panRequest]);
  // With no results there is nothing to map, so a search hint replaces retry.
  const status = !key
    ? "지도 연결을 준비하고 있어요."
    : !hasItems
      ? "지역을 검색하면 가까운 매장이 표시돼요."
      : failed
        ? retrying
          ? "지도를 다시 불러오고 있어요."
          : "지도를 불러오지 못했어요. 아래 매장 목록을 이용해 주세요."
        : "";
  return (
    <div className="store-map">
      <div
        ref={canvas}
        className="store-map-canvas"
        role="region"
        aria-label="주변 매장 지도"
        tabIndex={-1}
      />
      {status && (
        <div className="store-map-status">
          <p>{status}</p>
          {failed && hasItems && (
            <button
              type="button"
              className="apply-button"
              // Stays mounted while retrying so keyboard focus is not lost.
              aria-disabled={retrying}
              onClick={() => {
                if (retrying) return;
                setRetrying(true);
                focusMapOnLoad.current = true;
                setAttempt((n) => n + 1);
              }}
            >
              지도 다시 불러오기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
function markerImage(kakao: KakaoMaps, selected: boolean) {
  const p = pin(selected);
  return new kakao.MarkerImage(p.src, new kakao.Size(p.w, p.h), {
    offset: new kakao.Point(p.w / 2, p.h),
  });
}
