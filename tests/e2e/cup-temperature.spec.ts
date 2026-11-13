import { test, expect } from "@playwright/test";

// The shared cup illustration draws verified data: shape from the variant's
// temperature, height from its cup volume and fill from the drink category.
test("detail illustrations describe temperature, volume and category", async ({
  page,
}) => {
  await page.goto("/drinks/mega-green-plum-quince-tea");
  await expect(
    page.getByRole("img", {
      name: "매실 모과차, 따뜻한 음료, 591ml, 티 분류 공통 일러스트",
    }),
  ).toBeVisible();
  await page.goto("/drinks/mega-11");
  await expect(
    page.getByRole("img", {
      name: "상큼 리치티, 차가운 음료, 710ml, 티 분류 공통 일러스트",
    }),
  ).toBeVisible();
});

test("catalog cards and comparison draw hot drinks as hot", async ({
  page,
}) => {
  await page.goto("/search?q=" + encodeURIComponent("매실"));
  await expect(
    page.getByRole("img", {
      name: "매실 모과차, 따뜻한 음료, 591ml, 티 분류 공통 일러스트",
    }),
  ).toBeVisible();
  await page.goto(
    "/compare?ids=cc6db3cb-79fb-561b-b001-82c3e3592556,7c0b1e36-03dd-5898-8593-b6f7292e1c8b",
  );
  await expect(
    page.getByRole("img", {
      name: "카페 라떼, 따뜻한 음료, 355ml, 커피 분류 공통 일러스트",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "1/2디카페인 카페 라떼, 차가운 음료, 355ml, 커피 분류 공통 일러스트",
    }),
  ).toBeVisible();
});

test("cup height follows the verified cup volume", async ({ page }) => {
  // 청도홍시주스 L (520ml) and EX (670ml), both iced smoothies.
  await page.goto(
    "/compare?ids=1ca2ff55-559b-54be-83c2-e3a619eea066,c07146ee-387f-5964-9820-3aba34f6f479",
  );
  const small = page.getByRole("img", {
    name: "청도홍시주스, 차가운 음료, 520ml, 스무디 분류 공통 일러스트",
  });
  const large = page.getByRole("img", {
    name: "청도홍시주스, 차가운 음료, 670ml, 스무디 분류 공통 일러스트",
  });
  const bodyHeight = async (cup: typeof small) =>
    (await cup.locator("[data-cup-body]").boundingBox())!.height;
  const ratio = (await bodyHeight(small)) / (await bodyHeight(large));
  expect(ratio).toBeGreaterThan((520 / 670) * 0.97);
  expect(ratio).toBeLessThan((520 / 670) * 1.03);
});
