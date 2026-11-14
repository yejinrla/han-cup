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
