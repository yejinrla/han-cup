import { test, expect } from "@playwright/test";

// New arrivals released together share one source line and one horizontal rail.
for (const width of [320, 390]) {
  test(`same-release arrivals share one source line and one rail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const region = page.getByRole("region", { name: "이번주 신메뉴" });
    await expect(
      region.getByRole("link", { name: "공식 출시 정보" }),
    ).toHaveCount(1);
    await expect(region.locator(".arrival-group-head")).toHaveText(
      "메가MGC커피 · 2026-10-29 출시 · 공식 출시 정보",
    );
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
