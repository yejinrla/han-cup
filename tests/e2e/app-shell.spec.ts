import { test, expect } from "@playwright/test";

test("desktop and mobile share a centered app frame and persistent accessible tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const shell = page.locator(".app-shell");
  await expect(shell).toBeVisible();
  const frame = await shell.boundingBox();
  expect(frame!.width).toBe(480);
  expect(frame!.x).toBe(480);
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(
    nav.getByRole("link", { name: "홈", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const before = await nav.boundingBox();
  expect(before!.x).toBe(frame!.x);
  expect(before!.width).toBe(frame!.width);
  expect(before!.y + before!.height).toBeCloseTo(900, 0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const after = await nav.boundingBox();
  expect(after!.y).toBe(before!.y);
  await nav.getByRole("link", { name: "주변 매장", exact: true }).click();
  await expect(page).toHaveURL(/\/stores$/);
  await expect(
    nav.getByRole("link", { name: "주변 매장", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    nav.getByRole("link", { name: "홈", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const box = await nav.boundingBox();
    expect(box!.width).toBe(Math.min(width, 480));
    for (const link of await nav.getByRole("link").all())
      await expect(link).toBeInViewport();
  }
  await nav.getByRole("link", { name: "좋아요한 음료", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fme%2Ffavorites/);
});

test("comparison tray stays above app tabs and comparison scroll remains inside the frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/search");
  await page
    .getByRole("button", { name: "비교 담기", exact: true })
    .nth(0)
    .click();
  await page
    .getByRole("button", { name: "비교 담기", exact: true })
    .nth(1)
    .click();
  const tray = page.getByRole("complementary", { name: "비교할 음료" });
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const t = await tray.boundingBox(),
      n = await nav.boundingBox();
    expect(t!.y + t!.height).toBeLessThanOrEqual(n!.y);
    expect(t!.width).toBeLessThanOrEqual(Math.min(width, 480));
  }
  await page.getByRole("link", { name: "2개 음료 비교하기" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    nav.getByRole("link", { name: "홈", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("visible login label is included in its accessible name", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("header").getByRole("link", { name: /로그인/ }),
  ).toBeVisible();
});

test("inactive bottom tab text has readable contrast at rest and on hover", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  const tab = nav.getByRole("link", { name: "주변 매장", exact: true });
  for (const hover of [false, true]) {
    if (hover) await tab.hover();
    const colors = await tab.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        foreground: style.color,
        background:
          style.backgroundColor === "rgba(0, 0, 0, 0)"
            ? getComputedStyle(element.parentElement!).backgroundColor
            : style.backgroundColor,
      };
    });
    const luminance = (color: string) => {
      const values = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const a = luminance(colors.foreground),
      b = luminance(colors.background);
    expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  }
});
