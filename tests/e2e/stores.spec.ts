import { test, expect } from "@playwright/test";
// The e2e server has a placeholder map key; never let a test reach the real
// Kakao host. Tests that need a map override this with the fake SDK below.
test.beforeEach(async ({ page }) => {
  await page.route("**://dapi.kakao.com/**", (route) => route.abort());
});
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

// Test double for the external Kakao Maps SDK only. It renders each marker as a
// button labelled with its title so a pin click can be driven like a user tap.
// Wrapped so its constructors never replace page globals such as Map.
const fakeKakaoSdk = `(() => {
window.__kakaoFake = { maps: 0, centers: [] };
const fake = window.__kakaoFake;
function LatLng(lat, lng) { this.lat = lat; this.lng = lng; }
LatLng.prototype.getLat = function () { return this.lat; };
LatLng.prototype.getLng = function () { return this.lng; };
function Map(el, opts) {
  fake.maps += 1;
  this.el = el;
  fake.centers.push([opts.center.lat, opts.center.lng]);
}
Map.prototype.setCenter = function (p) { fake.centers.push([p.lat, p.lng]); };
Map.prototype.panTo = function (p) { fake.centers.push([p.lat, p.lng]); };
Map.prototype.relayout = function () {};
function Marker(opts) {
  this.button = document.createElement("button");
  this.button.type = "button";
  this.button.setAttribute("aria-label", "지도 핀 " + opts.title);
  this.button.dataset.z = String(opts.zIndex ?? 0);
  this.setMap(opts.map);
}
Marker.prototype.setMap = function (map) {
  if (map) map.el.append(this.button); else this.button.remove();
};
Marker.prototype.setZIndex = function (z) { this.button.dataset.z = String(z); };
Marker.prototype.setImage = function () {};
function Size(w, h) { this.w = w; this.h = h; }
function Point(x, y) { this.x = x; this.y = y; }
function MarkerImage(src, size, options) { this.src = src; }
window.kakao = { maps: {
  load: (fn) => fn(), LatLng, Map, Marker, Size, Point, MarkerImage,
  event: { addListener: (target, type, fn) => target.button.addEventListener(type, fn) },
} };
})();
`;

const store = (id: string, name: string, lat: number, lng: number) => ({
  id,
  name,
  address: "서울 성동구 " + name,
  phone: null,
  lat,
  lng,
  distanceM: 100,
  placeUrl: "https://place.map.kakao.com/" + id,
});

test("a failed map load explains itself and loads again on request", async ({
  page,
}) => {
  let sdkRequests = 0;
  await page.route("**://dapi.kakao.com/**", (route) => {
    sdkRequests += 1;
    return sdkRequests <= 2
      ? route.abort()
      : route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk });
  });
  await page.route("**/api/stores", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [store("a", "메가MGC커피 성수점", 37.54, 127.05)],
        hasNext: false,
      }),
    }),
  );
  await page.goto("/stores?brand=mega");
  await page.getByLabel("지역명").fill("서울 성수동");
  await page.getByRole("button", { name: "매장 찾기", exact: true }).click();
  await expect(page.getByText("지도를 불러오지 못했어요")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "메가MGC커피 성수점" }),
  ).toBeVisible();
  // A retry that fails again keeps keyboard focus on the retry control.
  const retry = page.getByRole("button", { name: "지도 다시 불러오기" });
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => sdkRequests).toBe(2);
  await expect(page.getByText("지도를 불러오지 못했어요")).toBeVisible();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "지도 핀 메가MGC커피 성수점" }),
  ).toBeVisible();
  await expect(page.getByText("지도를 불러오지 못했어요")).toBeHidden();
  expect(sdkRequests).toBe(3);
});

test("map pins and store cards share one selection across paging and new searches", async ({
  page,
}) => {
  await page.route("**://dapi.kakao.com/**", (route) =>
    route.fulfill({ contentType: "text/javascript", body: fakeKakaoSdk }),
  );
  await page.route("**/api/stores", (route) => {
    const body = route.request().postDataJSON();
    const items =
      body.page === 2
        ? [store("c", "메가MGC커피 서울숲점", 37.545, 127.04)]
        : [
            store("a", "메가MGC커피 성수점", 37.54, 127.05),
            store("b", "메가MGC커피 뚝섬점", 37.547, 127.047),
          ];
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items, hasNext: body.page !== 2 }),
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stores?brand=mega");
  await page.getByLabel("지역명").fill("서울 성수동");
  await page.getByRole("button", { name: "매장 찾기", exact: true }).click();

  const card = (name: string) =>
    page.locator("article.store-item").filter({ hasText: name });
  const showOnMap = (name: string) =>
    card(name).getByRole("button", { name: "지도에서 보기" });

  await page
    .getByRole("button", { name: "지도 핀 메가MGC커피 뚝섬점" })
    .click();
  await expect(card("메가MGC커피 뚝섬점")).toContainText("선택됨");
  await expect(showOnMap("메가MGC커피 뚝섬점")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(card("메가MGC커피 뚝섬점")).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "지도 핀 메가MGC커피 뚝섬점" }),
  ).toHaveAttribute("data-z", "10");

  await showOnMap("메가MGC커피 성수점").click();
  await expect(showOnMap("메가MGC커피 성수점")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(showOnMap("메가MGC커피 뚝섬점")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(card("메가MGC커피 뚝섬점")).not.toContainText("선택됨");
  expect(
    await page.evaluate(() =>
      (
        window as never as { __kakaoFake: { centers: number[][] } }
      ).__kakaoFake.centers.at(-1),
    ),
  ).toEqual([37.54, 127.05]);

  // Select a store other than the first so a recenter on append would show.
  await showOnMap("메가MGC커피 뚝섬점").click();
  await page.getByRole("button", { name: "매장 더 보기" }).click();
  await expect(card("메가MGC커피 서울숲점")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "지도 핀 메가MGC커피 서울숲점" }),
  ).toBeAttached();
  await expect(showOnMap("메가MGC커피 뚝섬점")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const afterMore = await page.evaluate(
    () =>
      (
        window as never as {
          __kakaoFake: { maps: number; centers: number[][] };
        }
      ).__kakaoFake,
  );
  expect(afterMore.maps).toBe(1);
  expect(afterMore.centers.at(-1)).toEqual([37.547, 127.047]);

  await showOnMap("메가MGC커피 서울숲점").click();
  await page.getByRole("button", { name: "매장 찾기", exact: true }).click();
  await expect(card("메가MGC커피 서울숲점")).toHaveCount(0);
  await expect(
    page.locator("article.store-item", { hasText: "선택됨" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^지도 핀 / })).toHaveCount(2);
  const afterSearch = await page.evaluate(
    () =>
      (
        window as never as {
          __kakaoFake: { maps: number; centers: number[][] };
        }
      ).__kakaoFake,
  );
  expect(afterSearch.maps).toBe(1);
  expect(afterSearch.centers.at(-1)).toEqual([37.54, 127.05]);
});
