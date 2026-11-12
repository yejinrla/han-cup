export function CupArt({
  kind = "coffee",
  name,
  large = false,
}: {
  kind?: string;
  name: string;
  large?: boolean;
}) {
  const color =
    kind === "tea"
      ? "#d49a59"
      : kind === "smoothie"
        ? "#dd8550"
        : kind === "other"
          ? "#755241"
          : "#c6a182";
  return (
    <svg
      className={`cup-art ${large ? "large" : ""}`}
      viewBox="0 0 200 240"
      role="img"
      aria-label={`${name} 공통 음료 일러스트`}
    >
      <ellipse cx="102" cy="220" rx="58" ry="9" fill="#4d6046" opacity=".09" />
      <path d="M47 57 60 207 Q101 222 142 207 L155 57Z" fill={color} />
      <path d="M48 57 51 86 Q99 96 152 86 L155 57Z" fill="#f6e9d4" />
      <g fill="#fff" opacity=".26">
        <rect
          x="64"
          y="83"
          width="30"
          height="25"
          rx="6"
          transform="rotate(15 64 83)"
        />
        <rect
          x="109"
          y="75"
          width="28"
          height="29"
          rx="6"
          transform="rotate(-13 109 75)"
        />
      </g>
      <path
        d="M47 57 60 207 Q101 222 142 207 L155 57Z"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        opacity=".55"
      />
      <path
        d="M62 104 70 194"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        opacity=".26"
      />
      <ellipse
        cx="101"
        cy="57"
        rx="56"
        ry="10"
        fill="#f7f5e9"
        stroke="#deded2"
        strokeWidth="2"
      />
      <path d="m114 56 12-47" stroke="#608461" strokeWidth="7" />
      <path d="m114 56 12-47" stroke="#97ab82" strokeWidth="2" />
      <circle cx="101" cy="151" r="24" fill="none" stroke="#fff" opacity=".6" />
      <text
        x="101"
        y="154"
        fontSize="12"
        fill="#fff"
        textAnchor="middle"
        fontFamily="serif"
      >
        한컵
      </text>
      <text
        x="101"
        y="178"
        fontSize="6"
        fill="#fff"
        textAnchor="middle"
        letterSpacing="2"
      >
        A LITTLE DISCOVERY
      </text>
    </svg>
  );
}
