import Link from "next/link";
import { Star } from "lucide-react";
import { DrinkImage } from "@/components/DrinkImage";
import { CompareButton } from "@/features/compare/components/CompareControls";
import { brands, type Basis, type CatalogItem } from "../types";
import { fmt, getNutrition } from "../nutrition";
import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
// A missing price takes no room on the card; the detail page says it is missing.
const temperatureLabel = { hot: "HOT", iced: "ICE", ambient: "상온" } as const;
export function DrinkCard({
  item,
  basis,
  isFavorite = false,
}: {
  item: CatalogItem;
  basis: Basis;
  isFavorite?: boolean;
}) {
  const n = getNutrition(item.variant, basis);
  return (
    <article data-drink-card className="drink-card">
      <div className={`drink-visual ${item.category}`}>
        <FavoriteButton
          key={item.id + String(isFavorite)}
          drinkId={item.id}
          initial={isFavorite}
        />
        <Link
          href={"/drinks/" + item.slug}
          className="drink-image-link"
          aria-label={item.name + " 상세 보기"}
        >
          <DrinkImage
            src={item.variant.imagePath}
            name={item.name}
            kind={item.category}
            temperature={item.variant.temperature}
            cupMl={item.variant.cupMl}
          />
        </Link>
      </div>
      <div className="drink-info">
        <p className="drink-meta">
          <i className={"brand-dot " + item.brandId} />
          {[
            brands[item.brandId],
            temperatureLabel[item.variant.temperature],
            // "기본" only says the brand has one size; the volume carries the fact.
            item.variant.sizeLabel === "기본" ? null : item.variant.sizeLabel,
            item.variant.cupMl === null
              ? "용량 미제공"
              : fmt(item.variant.cupMl, "ml"),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <Link href={"/drinks/" + item.slug} className="drink-title">
          {item.name}
        </Link>
        <div className="nutrition-strip">
          <div>
            <small>칼로리</small>
            <b>
              {fmt(n.caloriesKcal)}
              <em>{n.caloriesKcal === null ? "" : "kcal"}</em>
            </b>
          </div>
          <div>
            <small>당류</small>
            <b>
              {fmt(n.sugarG)}
              <em>{n.sugarG === null ? "" : "g"}</em>
            </b>
          </div>
          <div>
            <small>카페인</small>
            <b>
              {fmt(n.caffeineMg)}
              <em>{n.caffeineMg === null ? "" : "mg"}</em>
            </b>
          </div>
        </div>
        <div className="card-bottom">
          <span className="rating">
            <Star size={12} />
            {item.rating.average ?? "평가 없음"}
            {item.rating.count > 0 && <small>({item.rating.count})</small>}
          </span>
          {item.variant.priceKrw !== null && (
            <span className="card-price">
              {fmt(item.variant.priceKrw, "원")}
            </span>
          )}
          <CompareButton id={item.variant.id} />
        </div>
      </div>
    </article>
  );
}
