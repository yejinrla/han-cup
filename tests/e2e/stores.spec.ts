import { test, expect } from "@playwright/test";
test("location denial and quota failure offer district search and Kakao fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_ok: unknown, fail: (e: object) => void) =>
          fail({ code: 1 }),
      },
    });
  });
  await page.goto("/stores?brand=mega");
  await page.getByRole("button", { name: "현재 위치로 찾기" }).click();
  await expect(page.getByRole("status")).toContainText("지역명으로 검색");
  await page.route("**/api/stores", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "오늘의 무료 검색 한도에 도달했어요." }),
    }),
  );
  await page.getByLabel("지역명").fill("서울 성수동");
  await page.getByRole("button", { name: "매장 찾기", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("무료 검색 한도");
  await expect(
    page.getByRole("link", { name: "카카오맵에서 바로 찾기" }),
  ).toHaveAttribute("href", /map.kakao.com/);
});
test("store result text cannot inject HTML and route uses destination only", async ({
  page,
}) => {
  await page.route("**/api/stores", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "1",
            name: "메가MGC커피 <script>안전</script>",
            address: "서울 성수동",
            phone: null,
            lat: 37.54,
            lng: 127.05,
            distanceM: 120,
            placeUrl: "https://place.map.kakao.com/1",
          },
        ],
        hasNext: false,
      }),
    }),
  );
  await page.goto("/stores?brand=mega");
  await page.getByLabel("지역명").fill("서울 성수동");
  await page.getByRole("button", { name: "매장 찾기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "메가MGC커피 <script>안전</script>" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "카카오맵 길찾기" }),
  ).toHaveAttribute("href", /37.54,127.05$/);
});
