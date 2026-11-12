import type { CatalogData, CatalogItem } from "@/features/catalog/types";
export type TasteNote = {
  slug: string;
  title: string;
  summary: string;
  bannerDescription: string;
  illustrationKind: "tea" | "coffee";
  coverLines: [string, string];
  searchCategory: "tea" | "coffee";
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
    illustrationKind: "tea",
    coverLines: ["잠깐의 여유,", "차 한 잔의 계절"],
    searchCategory: "tea",
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

  {
    slug: "sweet-coffee",
    title: "달콤한 커피가 생각나는 날",
    illustrationKind: "coffee",
    coverLines: ["오늘의 작은 즐거움,", "달콤한 커피 한 잔"],
    searchCategory: "coffee",
    summary: "연유와 바닐라, 서로 다른 달콤함으로 고르는 아이스 커피 두 잔.",
    bannerDescription: "연유와 바닐라로 고르는 달콤한 한 잔",
    paragraphs: [
      {
        heading: "커피에도 달콤한 기분이 필요할 때",
        body: "익숙한 아메리카노 대신 조금 다른 한 잔이 당기는 날이 있어요. 오늘은 연유와 바닐라, 두 가지 이름을 따라 커피 메뉴를 골라봅니다.",
      },
      {
        heading: "이름보다 내 취향을 먼저",
        body: "같은 달콤한 커피라도 즐기는 방식은 저마다 달라요. 음료 상세에서 온도와 영양정보를 함께 보고, 오늘 마시고 싶은 한 잔을 선택해 보세요. 아래 메뉴는 모두 시원하게 즐기는 선택으로 소개해요.",
      },
    ],
    recommendations: [
      {
        slug: "ediya-3",
        temperature: "iced",
        heading: "연유가 당기는 날, 연유 콜드브루",
        body: "콜드브루에 연유를 더한 메뉴를 찾는다면 살펴볼 만한 한 잔이에요. 평소 마시던 커피와 다른 조합을 고르고 싶은 날에 제안해요.",
      },
      {
        slug: "paik-8",
        temperature: "iced",
        heading: "익숙한 선택, 바닐라라떼",
        body: "바닐라 이름을 보면 반가운 사람이라면 이번에는 아이스 바닐라라떼를 골라보세요. 브랜드와 제공량에 따라 영양 수치가 다르니 상세 정보도 함께 확인해 주세요.",
      },
    ],
  },
  {
    slug: "your-latte",
    title: "나에게 맞는 라떼 한 잔",
    illustrationKind: "coffee",
    coverLines: ["따뜻하게, 시원하게,", "내가 고르는 라떼"],
    searchCategory: "coffee",
    summary: "온도와 카페인 정보를 함께 살펴보며, 오늘의 라떼를 골라보세요.",
    bannerDescription: "온도부터 카페인까지, 내 취향으로 고르기",
    paragraphs: [
      {
        heading: "라떼를 고르는 나만의 기준",
        body: "우유가 들어간 커피를 좋아해도 오늘의 선택은 달라질 수 있어요. 따뜻한 컵을 쥐고 싶은 날인지, 얼음이 담긴 시원한 한 잔이 당기는 날인지부터 생각해 보세요.",
      },
      {
        heading: "카페인 수치도 함께 보기",
        body: "음료 이름에 디카페인이 들어가더라도 카페인 수치는 메뉴마다 달라요. 한컵의 상세 화면에서 공식 제공량 기준의 카페인 정보를 확인하고 선택해 보세요. 아래 두 메뉴는 온도가 다르므로 같은 조건의 맛 비교로 소개하는 것은 아니에요.",
      },
    ],
    recommendations: [
      {
        slug: "starbucks-1",
        temperature: "hot",
        heading: "따뜻하게 즐기는, 카페 라떼",
        body: "익숙한 카페 라떼를 따뜻한 온도로 즐기고 싶은 날의 선택이에요. 컵 용량과 영양 제공량을 확인하면 한 잔을 고르는 데 도움이 돼요.",
      },
      {
        slug: "starbucks-2",
        temperature: "iced",
        heading: "시원한 한 잔, 1/2디카페인 카페 라떼",
        body: "아이스 라떼를 고르면서 카페인 정보도 함께 보고 싶은 날 살펴보세요. 메뉴 이름만으로 판단하지 않고, 표시된 수치를 확인하는 걸 추천해요.",
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
