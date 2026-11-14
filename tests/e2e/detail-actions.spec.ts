import { test, expect } from "@playwright/test";

// The detail page leads with one record action, then three equal secondary
// actions that are comfortable to tap.
test("detail page lifts the record action and evens out secondary actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/drinks/mega-11");
  const record = page.getByRole("link", { name: "한 잔 기록하기" });
  await expect(record).toHaveCount(1);
  const recordTop = (await record.boundingBox())!.y;
  const nutrientsTop = (await page.locator(".detail-nutrients").boundingBox())!
    .y;
  expect(recordTop).toBeLessThan(nutrientsTop);

  const favorite = page.getByRole("button", { name: "음료 찜하기" });
  await expect(favorite).toContainText("찜하기");
  const heights = await Promise.all(
    [
      page.getByRole("button", { name: "비교 담기", exact: true }),
      favorite,
      page.getByRole("link", { name: "주변 매장 찾기" }),
    ].map(async (control) => Math.round((await control.boundingBox())!.height)),
  );
  expect(new Set(heights).size).toBe(1);
  expect(heights[0]).toBeGreaterThanOrEqual(44);
});

test("detail secondary actions keep their labels inside at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/drinks/mega-11");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const overflowing = await page
    .locator(".detail-actions > button, .detail-actions > a")
    .evaluateAll((controls) =>
      controls
        .filter((c) => c.scrollWidth > c.clientWidth + 1)
        .map((c) => c.textContent),
    );
  expect(overflowing).toEqual([]);
});
