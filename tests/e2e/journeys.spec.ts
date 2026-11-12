import { test, expect } from "@playwright/test";
test("anonymous detail and personal-write gate work without pretending login success", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /상세 보기$/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "이 한 잔, 어땠나요?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "한 잔 기록하기" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(
    page.getByRole("button", { name: "카카오로 시작하기" }),
  ).toBeDisabled();
});
test("invalid comparison and unknown product recover with useful UI", async ({
  page,
}) => {
  await page.goto("/compare?ids=garbage,missing");
  await expect(
    page.getByRole("heading", { name: "비교할 음료를 더 담아주세요" }),
  ).toBeVisible();
  await page.goto("/drinks/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "이 한 잔을 찾지 못했어요" }),
  ).toBeVisible();
});
test("verified basis conversion does not make up missing price", async ({
  page,
}) => {
  await page.goto("/drinks/starbucks-1?basis=100ml");
  await expect(page.getByText("50.7", { exact: true })).toBeVisible();
  await expect(page.getByText(/가격 미제공/).first()).toBeVisible();
});
test("mobile detail, compare and stores keep page within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    "/drinks/starbucks-1",
    "/compare?ids=bad",
    "/stores",
    "/login",
  ]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("repeated URL parameters recover without a server exception", async ({
  page,
}) => {
  await page.goto("/compare?ids=a&ids=b");
  await expect(
    page.getByRole("heading", { name: "비교할 음료를 더 담아주세요" }),
  ).toBeVisible();
  await page.goto("/login?next=a&next=b");
  await expect(
    page.getByRole("heading", { name: "나의 한 잔을 모으는 곳" }),
  ).toBeVisible();
});
