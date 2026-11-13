import type { DrinkVariant } from "@/features/catalog/types";

// Shared stand-in for product photos. It draws only verified data:
// height follows the cup volume (710ml is the full height), the shape follows
// the variant's temperature and the fill follows the drink category.
const FULL_ML = 710;
const FULL_HEIGHT = 170;
const BASE_Y = 212;
const CX = 100;
const TOP_HALF = 54;
const BOTTOM_HALF = 40;

const categoryColor: Record<string, string> = {
  coffee: "#a87652",
  tea: "#c99245",
  smoothie: "#c4664f",
  ade: "#d9a03a",
  other: "#6e4a38",
};
const categoryLabel: Record<string, string> = {
  coffee: "커피",
  tea: "티",
  smoothie: "스무디",
  ade: "에이드",
  other: "기타 음료",
};
const temperatureLabel = {
  hot: "따뜻한",
  iced: "차가운",
  ambient: "상온",
} as const;

export function CupArt({
  kind = "coffee",
  name,
  temperature,
  cupMl,
  large = false,
}: {
  kind?: string;
  name: string;
  /** Temperature of the variant shown. Omitted only for decorative, non-drink cups. */
  temperature?: DrinkVariant["temperature"];
  /** Verified cup volume; null draws a dashed default-height cup. */
  cupMl?: number | null;
  large?: boolean;
}) {
  const color = categoryColor[kind] ?? categoryColor.other;
  const known = typeof cupMl === "number" && cupMl > 0;
  const height =
    (FULL_HEIGHT * (known ? Math.min(cupMl, FULL_ML) : 591)) / FULL_ML;
  const top = BASE_Y - height;
  const label = temperature
    ? `${name}, ${temperatureLabel[temperature]} 음료, ${
        known ? `${cupMl}ml` : "용량 미제공"
      }, ${categoryLabel[kind] ?? "기타 음료"} 분류 공통 일러스트`
    : `${name} 공통 음료 일러스트`;
  const body = `M${CX - TOP_HALF} ${top} L${CX + TOP_HALF} ${top} L${CX + BOTTOM_HALF} ${BASE_Y} Q${CX} ${BASE_Y + 8} ${CX - BOTTOM_HALF} ${BASE_Y} Z`;
  // Half width of the tapered cup at a given y.
  const half = (y: number) =>
    TOP_HALF - (TOP_HALF - BOTTOM_HALF) * ((y - top) / height);
  const outline = {
    strokeWidth: 2,
    strokeDasharray: known ? undefined : "7 6",
  };
  return (
    <svg
      className={`cup-art ${large ? "large" : ""}`}
      viewBox="0 0 200 240"
      role="img"
      aria-label={label}
    >
      <ellipse
        cx={CX}
        cy={BASE_Y + 9}
        rx={BOTTOM_HALF + 16}
        ry="8"
        fill="#4d6046"
        opacity=".1"
      />
      {temperature === "hot" ? (
        <>
          <g
            fill="none"
            stroke="#b4c0aa"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".85"
          >
            <path d={`M${CX - 14} ${top - 26}q-8-7 0-14t0-14`} />
            <path d={`M${CX + 14} ${top - 26}q-8-7 0-14t0-14`} />
          </g>
          <path
            data-cup-body
            d={body}
            fill="#f6f1e7"
            stroke="#d8cdb9"
            {...outline}
          />
          <Band
            from={top + height * 0.36}
            to={top + height * 0.66}
            half={half}
            fill={color}
          />
          <circle
            cx={CX}
            cy={top + height * 0.51}
            r={Math.min(12, height * 0.1)}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            opacity=".75"
          />
          <rect
            x={CX - TOP_HALF - 4}
            y={top - 12}
            width={(TOP_HALF + 4) * 2}
            height="14"
            rx="6"
            fill="#e9e1d2"
          />
          <rect
            x={CX - 38}
            y={top - 20}
            width="76"
            height="10"
            rx="4"
            fill="#ddd2bf"
          />
        </>
      ) : (
        <>
          <path
            data-cup-body
            d={body}
            fill="#ffffff"
            fillOpacity=".6"
            stroke="#c9d3c1"
            {...outline}
          />
          <Band
            from={top + 10}
            to={BASE_Y - 2}
            half={(y) => half(y) - 4}
            fill={color}
            rounded
          />
          {temperature !== "ambient" && (
            <g fill="#fff" opacity=".45">
              <rect
                x={CX - 30}
                y={top + 18}
                width="24"
                height="20"
                rx="5"
                transform={`rotate(12 ${CX - 18} ${top + 28})`}
              />
              <rect
                x={CX + 4}
                y={top + 14}
                width="22"
                height="22"
                rx="5"
                transform={`rotate(-10 ${CX + 15} ${top + 25})`}
              />
            </g>
          )}
          <path
            d={`M${CX + 22} ${top - 30} L${CX + 10} ${top + height * 0.55}`}
            stroke="#5f8a4f"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

// A horizontal slice of the cup between two y positions (sleeve or liquid).
function Band({
  from,
  to,
  half,
  fill,
  rounded = false,
}: {
  from: number;
  to: number;
  half: (y: number) => number;
  fill: string;
  rounded?: boolean;
}) {
  const bottom = rounded
    ? `Q${CX} ${to + 6} ${CX - half(to)} ${to}`
    : `L${CX - half(to)} ${to}`;
  return (
    <path
      d={`M${CX - half(from)} ${from} L${CX + half(from)} ${from} L${CX + half(to)} ${to} ${bottom} Z`}
      fill={fill}
    />
  );
}
