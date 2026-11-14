import { expect, test } from "vitest";
import {
  tasteNotes,
  resolveNoteRecommendations,
} from "../../src/features/notes/content";
import local from "../../data/catalog/initial.json";
import type { CatalogData } from "../../src/features/catalog/types";
const data = local as CatalogData;
test("editorial recommendations resolve only existing active drinks in the recommended temperature", () => {
  const note = tasteNotes[0];
  expect(
    resolveNoteRecommendations(note, data).map((x) => [
      x.item.slug,
      x.item.variant.temperature,
    ]),
  ).toEqual([
    ["mega-green-plum-quince-tea", "hot"],
    ["mega-11", "iced"],
  ]);
  const withoutHot = {
    ...data,
    variants: data.variants.filter((v) => v.temperature !== "hot"),
  };
  expect(
    resolveNoteRecommendations(note, withoutHot).map((x) => x.item.slug),
  ).toEqual(["mega-11"]);
  const ended = {
    ...data,
    drinks: data.drinks.map((d) =>
      d.slug === "mega-green-plum-quince-tea"
        ? { ...d, status: "discontinued" as const }
        : d,
    ),
  };
  expect(
    resolveNoteRecommendations(note, ended).map((x) => x.item.slug),
  ).toEqual(["mega-11"]);
});

test("each published carousel article links two resolvable catalog drinks", () => {
  expect(
    tasteNotes.map((note) =>
      resolveNoteRecommendations(note, data).map((pick) => pick.item.slug),
    ),
  ).toEqual([
    ["mega-green-plum-quince-tea", "mega-11"],
    ["ediya-3", "paik-8"],
    ["starbucks-1", "starbucks-2"],
  ]);
});
