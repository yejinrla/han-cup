import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { brands, type Basis } from "../types";
import type { CatalogQuery } from "../query";
export function CatalogFilters({ q }: { q: CatalogQuery }) {
  const limits = [
    ["maxCalories", "칼로리", "kcal", q.maxCalories],
    ["maxSugar", "당류", "g", q.maxSugar],
    ["maxCaffeine", "카페인", "mg", q.maxCaffeine],
  ] as const;
  const activeLimits = limits.filter(([, , , value]) => value !== null).length;
  const per100 = q.basis === "100ml" ? "100ml당 " : "";
  const quickPicks = [
    [`${per100}당류 10g 이하`, { maxSugar: "10" }],
    [`${per100}카페인 10mg 이하`, { maxCaffeine: "10" }],
  ] as const;
  return (
    <>
      <form className="catalog-form" action="/search" id="catalog-search">
        <div className="search-box">
          <Search size={20} />
          <input
            name="q"
            aria-label="음료명 또는 브랜드 검색"
            defaultValue={q.q}
            placeholder="음료명이나 브랜드"
          />
          <button type="submit" aria-label="검색">
            <ArrowUpRight size={21} />
          </button>
        </div>
        <div className="category-tabs" aria-label="음료 분류">
          {[
            ["", "전체"],
            ["coffee", "커피"],
            ["tea", "티"],
            ["ade", "에이드"],
            ["smoothie", "스무디"],
            ["other", "기타 음료"],
          ].map(([id, label]) => (
            <Link
              key={id}
              className={q.category === id ? "active" : ""}
              aria-current={q.category === id ? "page" : undefined}
              href={queryLink(q, { category: id, cursor: "" })}
            >
              {label}
            </Link>
          ))}
        </div>
        {/* The chips choose the category; the form keeps it when applying filters. */}
        <input type="hidden" name="category" value={q.category} />
        <div className="filter-row">
          <label className="filter-chip">
            <SlidersHorizontal size={15} />
            <span className="sr-only">브랜드</span>
            <select name="brand" defaultValue={q.brandIds[0] ?? ""}>
              <option value="">전체 브랜드</option>
              {Object.entries(brands).map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-chip">
            <span className="sr-only">음료 온도</span>
            <select name="temperature" defaultValue={q.temperature}>
              <option value="">HOT · ICE</option>
              <option value="iced">ICE</option>
              <option value="hot">HOT</option>
            </select>
          </label>
          <details className="nutrition-panel" open={activeLimits > 0}>
            <summary
              className={activeLimits ? "filter-chip set" : "filter-chip"}
            >
              {activeLimits ? `영양 조건 ${activeLimits}` : "영양 조건"}
            </summary>
            <div className="nutrition-panel-body">
              <div className="quick-picks">
                {quickPicks.map(([label, change]) => (
                  <Link
                    key={label}
                    href={queryLink(q, { ...change, cursor: "" })}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              {limits.map(([name, label, unit, value]) => (
                <label className="number-filter" key={name}>
                  <span>{label}</span>
                  <input
                    aria-label={`${label} 상한`}
                    name={name}
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={value ?? ""}
                    placeholder="제한 없음"
                  />
                  <small>
                    {per100}
                    {unit} 이하
                  </small>
                </label>
              ))}
              <Link
                className="clear-limits"
                href={queryLink(q, {
                  maxCalories: "",
                  maxSugar: "",
                  maxCaffeine: "",
                  cursor: "",
                })}
              >
                영양 조건 지우기
              </Link>
            </div>
          </details>
          <input type="hidden" name="basis" value={q.basis} />
          <input type="hidden" name="sort" value={q.sort} />
          <button className="apply-button" type="submit">
            필터 적용
          </button>
        </div>
      </form>
    </>
  );
}
export function queryLink(q: CatalogQuery, changes: Record<string, string>) {
  const p = new URLSearchParams({
    q: q.q,
    brand: q.brandIds.join(","),
    category: q.category,
    temperature: q.temperature,
    basis: q.basis,
    sort: q.sort,
    ...Object.fromEntries(
      [
        ["maxCalories", q.maxCalories],
        ["maxSugar", q.maxSugar],
        ["maxCaffeine", q.maxCaffeine],
      ]
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, String(v)]),
    ),
    ...changes,
  });
  for (const [k, v] of p) if (!v) p.delete(k);
  return "/search?" + p;
}
export function BasisToggle({ q }: { q: CatalogQuery }) {
  return (
    <div className="basis-toggle" aria-label="영양정보 기준">
      {(["serving", "100ml"] as Basis[]).map((b) => (
        <Link
          key={b}
          className={q.basis === b ? "active" : ""}
          href={queryLink(q, {
            basis: b,
            maxCalories: "",
            maxSugar: "",
            maxCaffeine: "",
            cursor: "",
          })}
        >
          {b === "serving" ? "한 잔 기준" : "100ml 기준"}
        </Link>
      ))}
    </div>
  );
}
export function SortControl({ q }: { q: CatalogQuery }) {
  const p = new URLSearchParams(queryLink(q, {}).split("?")[1]);
  return (
    <form action="/search" className="sort-control">
      {[...p.entries()]
        .filter(([k]) => k !== "sort" && k !== "cursor")
        .map(([name, value]) => (
          <input type="hidden" name={name} value={value} key={name} />
        ))}
      <label className="sr-only" htmlFor="catalog-sort">
        음료 정렬
      </label>
      <select id="catalog-sort" name="sort" defaultValue={q.sort}>
        <option value="name">이름순</option>
        <option value="price">가격 낮은 순</option>
        <option value="calories">칼로리 낮은 순</option>
        <option value="sugar">당류 낮은 순</option>
        <option value="caffeine">카페인 낮은 순</option>
      </select>
      <button aria-label="정렬 적용" type="submit">
        적용
      </button>
    </form>
  );
}
