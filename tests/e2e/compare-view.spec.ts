import { test, expect } from "@playwright/test";

// Three drinks fit side by side on a phone, and the lowest value is named in
// text only where every value is known and one is clearly lowest.
const ids = [
  "1ca2ff55-559b-54be-83c2-e3a619eea066", // 청도홍시주스 L: 244kcal 46g 0mg
  "c07146ee-387f-5964-9820-3aba34f6f479", // 청도홍시주스 EX: 319kcal 60g 0mg
  "f44dd04c-4dec-5455-a5a5-bf64e46e0f03", // 연유 콜드브루 L: 313kcal 41g 181mg
].join(",");

test("three drinks fit at 390px and only clear lowest values are marked", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/compare?ids=" + ids);
  const scroller = page.locator(".comparison-scroll");
  const { scroll, client } = await scroller.evaluate((e) => ({
    scroll: e.scrollWidth,
    client: e.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);

  // evaluateAll does not wait, so wait for each row before reading its cells.
  const marks = async (label: string) => {
    const row = page.getByRole("row", { name: new RegExp("^" + label) });
    await expect(row.locator("td")).toHaveCount(3);
    return row
      .locator("td")
      .evaluateAll((cells) =>
        cells.map((c) => (c.textContent ?? "").includes("가장 낮음")),
      );
  };
  expect(await marks("칼로리")).toEqual([true, false, false]);
  expect(await marks("당류")).toEqual([false, false, true]);
  expect(await marks("카페인")).toEqual([false, false, false]);
  expect(await marks("가격")).toEqual([false, false, false]);
  expect(await marks("컵 용량")).toEqual([false, false, false]);
});
