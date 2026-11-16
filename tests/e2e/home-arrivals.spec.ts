import { test, expect } from "@playwright/test";

// Arrival cards remain in one horizontal rail without release metadata.
for (const width of [320, 390]) {
  test(`arrivals hide release metadata and keep one rail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const region = page.getByRole("region", { name: "최근 신메뉴" });
    await expect(
      region.getByRole("link", { name: "공식 출시 정보" }),
    ).toHaveCount(0);
    const tops = await region
      .locator("[data-drink-card]")
      .evaluateAll((cards) =>
        cards.map((c) => Math.round(c.getBoundingClientRect().top)),
      );
    expect(tops).toHaveLength(3);
    expect(new Set(tops).size).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
