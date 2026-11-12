import { test, expect } from "@playwright/test";
test("browse, filter, compare and preserve anonymous selection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "취향을 발견하고, 한 잔을 기록해요." }),
  ).toBeVisible();
  expect(await page.locator("[data-drink-card]").count()).toBeGreaterThan(2);
  await page.getByLabel("당류 상한").fill("10");
  await page.getByRole("button", { name: "필터 적용" }).click();
  await expect(page.locator("[data-drink-card]")).toHaveCount(2);
  await page.getByRole("link", { name: "조건 초기화" }).click();
  const buttons = page.getByRole("button", { name: "비교 담기", exact: true });
  await buttons.nth(0).click();
  await buttons.nth(1).click();
  await expect(
    page.getByRole("link", { name: "2개 음료 비교하기" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("hancup.compare.v1") ?? "[]").length,
    ),
  ).toBe(2);
  await page.reload();
  await page.getByRole("link", { name: "2개 음료 비교하기" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(3);
});
test("mobile catalog does not overflow and missing brand has honest empty state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?brand=compose");
  await expect(page.getByText("조건에 맞는 음료가 없어요")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("users can choose calorie sorting from the catalog controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("음료 정렬").selectOption("calories");
  await page.getByRole("button", { name: "정렬 적용" }).click();
  await expect(
    page
      .locator("[data-drink-card]")
      .first()
      .getByRole("link", { name: "헛개리카노 상세 보기" }),
  ).toBeVisible();
});
test("removing one shared comparison preserves the remaining URL selections", async ({
  page,
}) => {
  const catalog = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile("data/catalog/initial.json", "utf8"),
  );
  const ids = catalog.variants.slice(0, 3).map((x: { id: string }) => x.id);
  await page.goto("/compare?ids=" + ids.join(","));
  await expect(page.getByRole("columnheader")).toHaveCount(4);
  await page.getByRole("button", { name: "빼기", exact: true }).first().click();
  await expect(page.getByRole("columnheader")).toHaveCount(3);
  expect(new URL(page.url()).searchParams.get("ids")?.split(",")).toEqual(
    ids.slice(1),
  );
});
