import { test, expect } from "vitest";
import { searchStores, validateStoreInput } from "@/features/stores/search";
test("rejects arbitrary brands and invalid coordinates", () => {
  expect(() => validateStoreInput({ brandId: "unknown" })).toThrow();
  expect(() =>
    validateStoreInput({ brandId: "mega", lat: 100, lng: 127 }),
  ).toThrow();
  expect(() =>
    validateStoreInput({ brandId: "mega", region: "가".repeat(101) }),
  ).toThrow();
});
test("filters unrelated names and sanitizes external URLs", async () => {
  const r = await searchStores(
    { brandId: "mega", lat: 37.5, lng: 127 },
    async () =>
      new Response(
        JSON.stringify({
          documents: [
            {
              id: "1",
              place_name: "메가MGC커피 강남점",
              road_address_name: "서울 강남",
              address_name: "서울",
              phone: "",
              x: "127",
              y: "37.5",
              distance: "12",
              place_url: "http://place.map.kakao.com/1",
              category_group_code: "CE7",
            },
            {
              id: "2",
              place_name: "메가마트",
              category_group_code: "MT1",
              x: "127",
              y: "37.5",
              place_url: "https://evil.example",
            },
          ],
          meta: { is_end: true },
        }),
      ),
    "test-key",
  );
  expect(r.items).toHaveLength(1);
  expect(r.items[0].placeUrl).toBe("https://place.map.kakao.com/1");
});
test("quota failures are recoverable without leaking upstream detail", async () => {
  await expect(
    searchStores(
      { brandId: "ediya", lat: 37, lng: 127 },
      async () => new Response("secret-upstream", { status: 429 }),
      "test-key",
    ),
  ).rejects.toThrow("매장 검색을 잠시 이용할 수 없어요.");
});
