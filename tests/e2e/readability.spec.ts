import { test, expect, type Page } from "@playwright/test";

// Public screens must stay readable on a phone: every visible text is at least
// 11px and meets WCAG AA contrast against the background it actually sits on.
const compareIds = [
  "1ca2ff55-559b-54be-83c2-e3a619eea066",
  "c07146ee-387f-5964-9820-3aba34f6f479",
  "f44dd04c-4dec-5455-a5a5-bf64e46e0f03",
].join(",");
const screens = [
  "/",
  "/search",
  "/drinks/mega-11",
  "/drinks/mega-green-plum-quince-tea",
  `/compare?ids=${compareIds}`,
  "/stores",
  "/notes/autumn-tea",
  "/login",
  "/about",
  "/privacy",
];

type Problem = { text: string; where: string; detail: string };

async function readabilityProblems(page: Page): Promise<Problem[]> {
  return page.evaluate(() => {
    const luminance = (color: string) => {
      const [r, g, b] = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map((v) => {
          const c = Number(v) / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const opaque = (color: string) => {
      const parts = color.match(/[\d.]+/g)!;
      return parts.length < 4 || Number(parts[3]) > 0.5;
    };
    const backgroundOf = (element: Element) => {
      for (let e: Element | null = element; e; e = e.parentElement) {
        const color = getComputedStyle(e).backgroundColor;
        if (opaque(color)) return color;
      }
      return "rgb(255, 255, 255)";
    };
    const problems: { text: string; where: string; detail: string }[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const element = node.parentElement;
      if (!text || !element) continue;
      // Illustration artwork, the wordmark logo, hidden and disabled UI are
      // outside the text rules (WCAG 1.4.3 exceptions).
      if (
        element.closest(
          "svg, script, style, nextjs-portal, .sr-only, .wordmark, [aria-hidden='true'], [disabled], [aria-disabled='true']",
        )
      )
        continue;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (!box.width || !box.height || style.visibility === "hidden") continue;
      const size = parseFloat(style.fontSize);
      const where = `${element.tagName.toLowerCase()}${[...element.classList].map((c) => "." + c).join("")}`;
      if (size < 11)
        problems.push({ text: text.slice(0, 24), where, detail: `${size}px` });
      const a = luminance(style.color),
        b = luminance(backgroundOf(element));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const large =
        size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5))
        problems.push({
          text: text.slice(0, 24),
          where,
          detail: `contrast ${ratio.toFixed(2)}:1`,
        });
    }
    return problems;
  });
}

for (const width of [390, 1440]) {
  test.describe(`readable public screens at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of screens) {
      test(`${path.split("?")[0]} has no tiny or low-contrast text`, async ({
        page,
      }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await readabilityProblems(page)).toEqual([]);
      });
    }
  });
}

test("search category row fits a 390px screen after the larger type", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search");
  const row = page.locator(".category-tabs");
  const { scroll, client } = await row.evaluate((e) => ({
    scroll: e.scrollWidth,
    client: e.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
  await expect(row.getByRole("link", { name: "조건 초기화" })).toBeInViewport({
    ratio: 1,
  });
});

test("search basis and sort controls keep their labels on one line at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/search");
  const controls = [
    page.getByRole("link", { name: "한 잔 기준" }),
    page.getByRole("link", { name: "100ml 기준" }),
    page.locator("form.sort-control").getByRole("button", { name: "적용" }),
  ];
  for (const control of controls) {
    const lines = await control.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        [...range.getClientRects()].map((rect) => Math.round(rect.top)),
      ).size;
    });
    expect(lines).toBe(1);
  }
});
