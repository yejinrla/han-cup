import type { CatalogData, CatalogItem } from "@/features/catalog/types";
export type TasteNote = {
  slug: string;
  title: string;
  summary: string;
  bannerDescription: string;
  paragraphs: { heading: string; body: string }[];
  recommendations: {
    slug: string;
    temperature: "hot" | "iced";
    heading: string;
    body: string;
  }[];
};
export const tasteNotes: TasteNote[] = [
  {
    slug: "autumn-tea",
    title: "가을에 마시기 좋은 차 추천",
    summary:
      "따뜻하게 한 잔, 산뜻하게 한 잔. 가을의 기분에 맞춰 고르는 두 가지 차 이야기.",
    bannerDescription: "쌀쌀한 날, 향긋하게 즐기는 한 잔",
    paragraphs: [
      {
        heading: "따뜻한 차가 생각나는 순간",
        body: "아침저녁으로 바람이 서늘해지면 손에 쥘 따뜻한 한 잔이 생각나요. 창가에 앉아 잠시 쉬는 시간, 오늘은 익숙한 커피 대신 차 메뉴를 살펴보는 건 어떨까요?",
      },
      {
        heading: "가을에도, 취향은 각자의 온도로",
        body: "가을이라고 꼭 뜨거운 차만 마실 필요는 없어요. 따뜻하게 즐기고 싶은 날과 시원한 한 잔이 당기는 날, 두 가지 기분에 맞춰 골라보세요. 아래 추천은 한컵의 취향 제안이며, 음료의 온도와 영양정보는 상세 화면에서 확인할 수 있어요.",
      },
    ],
    recommendations: [
      {
        slug: "mega-green-plum-quince-tea",
        temperature: "hot",
        heading: "서늘한 날에는, 매실 모과차",
        body: "매실과 모과를 담은 따뜻한 차 메뉴예요. 가벼운 산책을 마치고 잠시 앉아 한 잔을 즐기고 싶은 날에 제안해요.",
      },
      {
        slug: "mega-11",
        temperature: "iced",
        heading: "산뜻한 한 잔이 당길 땐, 상큼 리치티",
        body: "시원한 차를 좋아한다면 리치티도 살펴보세요. 따뜻한 차와는 다른 기분으로, 가을 오후의 한 잔을 고를 수 있어요.",
      },
    ],
  },
];
export function resolveNoteRecommendations(note: TasteNote, data: CatalogData) {
  return note.recommendations.flatMap((pick) => {
    const drink = data.drinks.find(
      (d) => d.slug === pick.slug && d.status === "active",
    );
    if (!drink) return [];
    const candidates = data.variants.filter(
      (v) => v.drinkId === drink.id && v.temperature === pick.temperature,
    );
    const variant =
      candidates.find((v) => v.id === drink.defaultVariantId) ?? candidates[0];
    if (!variant) return [];
    const item: CatalogItem = {
      ...drink,
      variant,
      rating: { average: null, count: 0 },
    };
    return [{ pick, item }];
  });
}
