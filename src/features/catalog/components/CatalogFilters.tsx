import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { brands, type Basis } from "../types";
import type { CatalogQuery } from "../query";
export function CatalogFilters({ q }: { q: CatalogQuery }) {
  return (
    <>
      <form className="catalog-form" action="/search" id="catalog-search">
        <div className="search-box">
          <Search size={20} />
          <input
            name="q"
            aria-label="음료명 또는 브랜드 검색"
            defaultValue={q.q}
            placeholder="어떤 한 잔을 찾으세요? 음료명, 브랜드로 검색해 보세요"
          />
          <button type="submit" aria-label="검색">
            <ArrowUpRight size={21} />
          </button>
        </div>
        <div className="filter-main">
          <label>
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
          <label>
            <span className="sr-only">음료 종류</span>
            <select name="category" defaultValue={q.category}>
              <option value="">모든 음료</option>
              <option value="coffee">커피</option>
              <option value="tea">티</option>
              <option value="ade">에이드</option>
              <option value="smoothie">스무디</option>
              <option value="other">기타 음료</option>
            </select>
          </label>
          <label>
            <span className="sr-only">음료 온도</span>
            <select name="temperature" defaultValue={q.temperature}>
              <option value="">HOT / ICE</option>
              <option value="iced">ICE</option>
              <option value="hot">HOT</option>
            </select>
          </label>
          <span className="filter-separator" />
          {[
            ["maxCalories", "칼로리", "kcal", q.maxCalories],
            ["maxSugar", "당류", "g", q.maxSugar],
            ["maxCaffeine", "카페인", "mg", q.maxCaffeine],
          ].map(([name, label, unit, value]) => (
            <label className="number-filter" key={name}>
              <span>{label}</span>
              <input
                aria-label={`${label} 상한`}
                name={name as string}
                type="number"
                min="0"
                step="any"
                defaultValue={value ?? ""}
                placeholder="전체"
              />
              <small>{unit} 이하</small>
            </label>
          ))}
          <input type="hidden" name="basis" value={q.basis} />
          <input type="hidden" name="sort" value={q.sort} />
          <button className="apply-button" type="submit">
            필터 적용
          </button>
        </div>
      </form>
      <div className="category-tabs">
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
            href={queryLink(q, { category: id, cursor: "" })}
          >
            {label}
          </Link>
        ))}
        <Link className="reset-link" href="/search">
          조건 초기화
        </Link>
      </div>
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
