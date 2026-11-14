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

test("a full comparison message sits below the actions without breaking the row", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "hancup.compare.v1",
      JSON.stringify([
        "1ca2ff55-559b-54be-83c2-e3a619eea066",
        "c07146ee-387f-5964-9820-3aba34f6f479",
        "f44dd04c-4dec-5455-a5a5-bf64e46e0f03",
      ]),
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/drinks/mega-11");
  const compare = page.getByRole("button", { name: "비교 담기", exact: true });
  await compare.click();
  const message = page.locator(".detail-actions .inline-error");
  await expect(message).toContainText("최대 3개까지");
  const tops = await Promise.all(
    [
      compare,
      page.getByRole("button", { name: "음료 찜하기" }),
      page.getByRole("link", { name: "주변 매장 찾기" }),
    ].map(async (c) => Math.round((await c.boundingBox())!.y)),
  );
  expect(new Set(tops).size).toBe(1);
  const row = (await page.locator(".detail-actions").boundingBox())!;
  const box = (await message.boundingBox())!;
  expect(box.width).toBeGreaterThan(row.width * 0.9);
  expect(box.y).toBeGreaterThan(tops[0]);
});
