import { test, expect } from "@playwright/test";

// The shared cup illustration must match the variant shown: a HOT drink is
// never drawn (or described) as an iced cup.
test("detail illustrations describe the shown variant's temperature", async ({
  page,
}) => {
  await page.goto("/drinks/mega-green-plum-quince-tea");
  await expect(
    page.getByRole("img", { name: "매실 모과차 따뜻한 음료 공통 일러스트" }),
  ).toBeVisible();
  await page.goto("/drinks/mega-11");
  await expect(
    page.getByRole("img", { name: "상큼 리치티 차가운 음료 공통 일러스트" }),
  ).toBeVisible();
});

test("catalog cards and comparison draw hot drinks as hot", async ({
  page,
}) => {
  await page.goto("/search?q=" + encodeURIComponent("매실"));
  await expect(
    page.getByRole("img", { name: "매실 모과차 따뜻한 음료 공통 일러스트" }),
  ).toBeVisible();
  await page.goto(
    "/compare?ids=cc6db3cb-79fb-561b-b001-82c3e3592556,7c0b1e36-03dd-5898-8593-b6f7292e1c8b",
  );
  await expect(
    page.getByRole("img", { name: "카페 라떼 따뜻한 음료 공통 일러스트" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "1/2디카페인 카페 라떼 차가운 음료 공통 일러스트",
    }),
  ).toBeVisible();
});
