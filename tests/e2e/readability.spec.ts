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
    // Colors as [r, g, b, a]; translucent layers are blended over what lies
    // behind them so text on a see-through panel is judged on what shows.
    const rgba = (color: string) => {
      const [r, g, b, a = 1] = color.match(/[\d.]+/g)!.map(Number);
      return [r, g, b, a];
    };
    const over = (top: number[], under: number[]) => [
      ...[0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])),
      1,
    ];
    const css = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    const backgroundOf = (element: Element) => {
      const layers: number[][] = [];
      for (let e: Element | null = element; e; e = e.parentElement) {
        const color = rgba(getComputedStyle(e).backgroundColor);
        if (color[3] > 0) layers.push(color);
        if (color[3] >= 1) break;
      }
      return layers.reduceRight(
        (under, top) => over(top, under),
        [255, 255, 255, 1],
      );
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
          "svg.cup-art, script, style, nextjs-portal, .sr-only, .wordmark, [aria-hidden='true'], [disabled], [aria-disabled='true']",
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
      const background = backgroundOf(element);
      const a = luminance(css(over(rgba(style.color), background))),
        b = luminance(css(background));
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

test("sentence-length secondary text is 13px and card nutrition numbers are 14px tabular figures", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/search", "/stores", "/compare", "/about"]) {
    await page.goto(path);
    const small = await page.evaluate(() => {
      const muted = getComputedStyle(document.documentElement)
        .getPropertyValue("--muted")
        .trim();
      const probe = document.createElement("i");
      probe.style.color = muted;
      document.body.append(probe);
      const mutedRgb = getComputedStyle(probe).color;
      probe.remove();
      // Short labels on cards (brand, release date) stay at the 11px floor.
      return [...document.querySelectorAll("main p")]
        .filter((p) => (p as HTMLElement).offsetParent)
        .filter((p) => !p.closest(".drink-card, .discovery-release"))
        .filter((p) => (p.textContent ?? "").trim().length > 15)
        .filter((p) => getComputedStyle(p).color === mutedRgb)
        .filter((p) => parseFloat(getComputedStyle(p).fontSize) < 13)
        .map((p) => `${p.className || "p"}: ${getComputedStyle(p).fontSize}`);
    });
    expect(small, path).toEqual([]);
  }
  for (const path of ["/", "/search"]) {
    await page.goto(path);
    const numbers = await page.evaluate(() => [
      ...new Set(
        [...document.querySelectorAll(".nutrition-strip b")].map(
          (b) =>
            `${getComputedStyle(b).fontSize} ${getComputedStyle(b).fontVariantNumeric}`,
        ),
      ),
    ]);
    expect(numbers, path).toEqual(["14px tabular-nums"]);
  }
});

test("card nutrition labels and figures fit two-column cards at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/search");
  // Measure with the real webfont: fallback fonts are narrower and hide overflow.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(() => {
    const lines = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
        .size;
    };
    return [...document.querySelectorAll(".nutrition-strip")].flatMap(
      (strip) => [
        ...(strip.scrollWidth > strip.clientWidth + 1
          ? ["strip overflows"]
          : []),
        ...[...strip.children]
          .filter((cell) => cell.scrollWidth > cell.clientWidth + 1)
          .map((cell) => `figure overflows: ${cell.textContent}`),
        ...[...strip.querySelectorAll("small")]
          .filter((label) => lines(label) > 1)
          .map((label) => `label wraps: ${label.textContent}`),
      ],
    );
  });
  expect(problems).toEqual([]);
});
