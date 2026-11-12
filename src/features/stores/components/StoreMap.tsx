"use client";
import { useEffect, useRef, useState } from "react";
import type { Store } from "../types";
type Coord = object;
type KakaoMap = { setCenter: (p: Coord) => void };
type Kakao = {
  maps: {
    load: (fn: () => void) => void;
    LatLng: new (lat: number, lng: number) => Coord;
    Map: new (
      el: HTMLElement,
      options: { center: Coord; level: number },
    ) => KakaoMap;
    Marker: new (options: { position: Coord; map: KakaoMap }) => object;
  };
};
declare global {
  interface Window {
    kakao?: Kakao;
  }
}
let loader: Promise<void> | undefined;
function loadSdk(key: string) {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=" +
      encodeURIComponent(key);
    script.onload = () => window.kakao?.maps.load(resolve);
    script.onerror = () => {
      loader = undefined;
      reject(new Error("지도 연결 실패"));
    };
    document.head.append(script);
  });
  return loader;
}
export function StoreMap({ items }: { items: Store[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key || !items.length) return;
    loadSdk(key)
      .then(() => {
        if (!active || !ref.current || !window.kakao) return;
        const k = window.kakao.maps;
        const map = new k.Map(ref.current, {
          center: new k.LatLng(items[0].lat, items[0].lng),
          level: 5,
        });
        for (const s of items)
          new k.Marker({ position: new k.LatLng(s.lat, s.lng), map });
      })
      .catch(() => {
        if (active)
          setError("지도를 불러오지 못했어요. 아래 매장 목록을 이용해 주세요.");
      });
    return () => {
      active = false;
    };
  }, [items]);
  return (
    <div ref={ref} className="store-map" aria-label="주변 매장 지도">
      {error ||
        (!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
          ? "지도 연결을 준비하고 있어요."
          : !items.length
            ? "지역을 검색하면 가까운 매장이 표시돼요."
            : "")}
    </div>
  );
}
