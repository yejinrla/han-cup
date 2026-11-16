// Custom order options a record can carry (approved list, 2026-11-14 spec).
export const reviewOptionIds = [
  "shot_extra",
  "shot_light",
  "syrup_extra",
  "syrup_less",
  "syrup_none",
  "milk_change",
  "decaf",
  "ice_less",
  "ice_extra",
  "whip_extra",
  "whip_none",
] as const;
export type ReviewOptionId = (typeof reviewOptionIds)[number];
// Options in one group contradict each other; a record picks at most one.
export const exclusiveOptionGroups: readonly (readonly ReviewOptionId[])[] = [
  ["shot_extra", "shot_light"],
  ["syrup_extra", "syrup_less", "syrup_none"],
  ["ice_less", "ice_extra"],
  ["whip_extra", "whip_none"],
];
export function hasOppositeOptions(options: readonly string[]) {
  return exclusiveOptionGroups.some(
    (group) => group.filter((id) => options.includes(id)).length > 1,
  );
}
export const reviewOptionLabels: Record<ReviewOptionId, string> = {
  shot_extra: "샷 추가",
  shot_light: "연하게",
  syrup_extra: "시럽 추가",
  syrup_less: "시럽 적게",
  syrup_none: "시럽 빼기",
  milk_change: "우유 변경",
  decaf: "디카페인으로 변경",
  ice_less: "얼음 적게",
  ice_extra: "얼음 많이",
  whip_extra: "휘핑 추가",
  whip_none: "휘핑 빼기",
};
// Display groups for the record form, in the spec's order.
export const reviewOptionSections: readonly {
  title: string;
  ids: readonly ReviewOptionId[];
}[] = [
  { title: "샷", ids: ["shot_extra", "shot_light"] },
  { title: "단맛", ids: ["syrup_extra", "syrup_less", "syrup_none"] },
  { title: "우유", ids: ["milk_change"] },
  { title: "카페인", ids: ["decaf"] },
  { title: "얼음", ids: ["ice_less", "ice_extra"] },
  { title: "토핑", ids: ["whip_extra", "whip_none"] },
];
export const maxReviewOptions = 5;
export const optionNutritionNote = "커스텀 옵션은 영양정보에 반영되지 않아요.";
