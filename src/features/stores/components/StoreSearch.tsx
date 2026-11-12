"use client";
import { useState, useRef, useCallback } from "react";
import { MapPin, ArrowUpRight, Navigation, Check } from "lucide-react";
import { brands, type BrandId } from "@/features/catalog/types";
import type { Store } from "../types";
import { StoreMap } from "./StoreMap";
export function StoreSearch({ initialBrand }: { initialBrand: BrandId }) {
  const [brand, setBrand] = useState(initialBrand),
    [region, setRegion] = useState(""),
    [items, setItems] = useState<Store[]>([]),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false),
    [hasNext, setHasNext] = useState(false),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [searchId, setSearchId] = useState(0),
    [panRequest, setPanRequest] = useState(0);
  const last = useRef<URLSearchParams | null>(null),
    requestId = useRef(0),
    list = useRef<HTMLDivElement>(null);
  // A pin tap brings its card into view; the card button keeps focus in place.
  const selectFromMap = useCallback((id: string) => {
    setSelectedId(id);
    list.current
      ?.querySelector(`[data-store-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, []);
  const external =
    "https://map.kakao.com/?q=" +
    encodeURIComponent((region ? region + " " : "") + brands[brand]);
  async function search(params: URLSearchParams, append = false) {
    const id = ++requestId.current;
    setPending(true);
    setMessage("");
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: params.get("brand"),
          region: params.get("region") || undefined,
          lat: params.has("lat") ? Number(params.get("lat")) : undefined,
          lng: params.has("lng") ? Number(params.get("lng")) : undefined,
          page: params.has("page") ? Number(params.get("page")) : undefined,
        }),
        cache: "no-store",
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(data.error ?? "검색을 완료하지 못했어요.");
      setItems((old) =>
        append
          ? [
              ...old,
              ...data.items.filter(
                (s: Store) => !old.some((x) => x.id === s.id),
              ),
            ]
          : data.items,
      );
      setHasNext(data.hasNext);
      if (!append) {
        setSelectedId(null);
        setSearchId((n) => n + 1);
      }
      last.current = params;
      if (!data.items.length)
        setMessage(
          "이 지역에서 확인된 매장이 없어요. 다른 지역을 검색해 보세요.",
        );
    } catch (e) {
      if (id === requestId.current) {
        setItems([]);
        setSelectedId(null);
        setMessage(
          e instanceof Error ? e.message : "매장 검색을 잠시 이용할 수 없어요.",
        );
        setHasNext(false);
      }
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setMessage("현재 위치를 확인할 수 없어요. 지역명으로 검색해 주세요.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegion("");
        void search(
          new URLSearchParams({
            brand,
            lat: String(pos.coords.latitude),
            lng: String(pos.coords.longitude),
          }),
        );
      },
      () => {
        setPending(false);
        setMessage(
          "위치 권한이 없거나 위치를 확인하지 못했어요. 지역명으로 검색해 주세요.",
        );
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }
  return (
    <>
      <form
        className="store-controls"
        onSubmit={(e) => {
          e.preventDefault();
          void search(new URLSearchParams({ brand, region }));
        }}
      >
        <label className="sr-only" htmlFor="store-brand">
          매장 브랜드
        </label>
        <select
          id="store-brand"
          value={brand}
          onChange={(e) => {
            requestId.current++;
            setPending(false);
            setBrand(e.target.value as BrandId);
            setItems([]);
            setSelectedId(null);
            setHasNext(false);
            setMessage("지역명이나 현재 위치로 다시 검색해 주세요.");
          }}
        >
          {Object.entries(brands).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="store-region">
          지역명
        </label>
        <input
          id="store-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="예: 서울 성수동, 부산 해운대구"
          maxLength={100}
          required
        />
        <button className="primary-button" disabled={pending}>
          {pending ? "찾는 중…" : "매장 찾기"}
        </button>
        <button
          className="apply-button"
          type="button"
          onClick={locate}
          disabled={pending}
        >
          <Navigation size={13} /> 현재 위치로 찾기
        </button>
      </form>
      <p className="muted">
        선택한 브랜드의 주변 매장을 안내합니다. 해당 음료의 실제 판매 여부는
        매장에 확인해 주세요.
      </p>
      {message && (
        <p role="status" className="status-box">
          {message}
        </p>
      )}
      <div className="store-grid" style={{ marginTop: 24 }}>
        <StoreMap
          items={items}
          searchId={searchId}
          selectedId={selectedId}
          panRequest={panRequest}
          onSelect={selectFromMap}
        />
        <div className="store-list" ref={list}>
          {items.map((s) => (
            <article
              className={
                s.id === selectedId ? "store-item is-selected" : "store-item"
              }
              key={s.id}
              data-store-id={s.id}
            >
              <h3>
                <MapPin size={13} /> {s.name}
              </h3>
              {s.id === selectedId && (
                <p className="store-selected">
                  <Check size={12} aria-hidden="true" /> 선택됨
                </p>
              )}
              <p>{s.address}</p>
              {s.phone && <p>{s.phone}</p>}
              {s.distanceM !== null && (
                <p>
                  검색 기준 위치에서{" "}
                  {s.distanceM >= 1000
                    ? (s.distanceM / 1000).toFixed(1) + "km"
                    : s.distanceM + "m"}
                </p>
              )}
              <div className="store-item-actions">
                <button
                  type="button"
                  aria-pressed={s.id === selectedId}
                  onClick={() => {
                    setSelectedId(s.id);
                    // Every press re-centres, even on the already selected store.
                    setPanRequest((n) => n + 1);
                  }}
                >
                  <MapPin size={12} aria-hidden="true" /> 지도에서 보기
                </button>
                <a
                  href={`https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  카카오맵 길찾기 <ArrowUpRight size={13} />
                </a>
              </div>
            </article>
          ))}
          {hasNext && (
            <button
              className="apply-button"
              onClick={() => {
                if (last.current) {
                  const p = new URLSearchParams(last.current);
                  p.set("page", String(Number(p.get("page") ?? 1) + 1));
                  void search(p, true);
                }
              }}
              disabled={pending}
            >
              매장 더 보기
            </button>
          )}
          {!items.length && (
            <div className="empty-state">
              <MapPin size={27} />
              <h3>가까운 한 잔을 찾아보세요</h3>
              <p>지역명으로 검색하거나 현재 위치를 사용해 주세요.</p>
            </div>
          )}
        </div>
      </div>
      <a
        className="primary-button"
        href={external}
        target="_blank"
        rel="noreferrer"
        style={{ marginTop: 25 }}
      >
        카카오맵에서 바로 찾기 <ArrowUpRight size={15} />
      </a>
    </>
  );
}
