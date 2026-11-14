import { test, expect, type BrowserContext } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { publishCatalog } from "../../scripts/catalog/import";
import { validateCatalog } from "../../scripts/catalog/schema";
const conf = JSON.parse(await readFile(".env.auth-test", "utf8"));
const admin = createClient(conf.url, conf.serviceKey, {
  auth: { persistSession: false },
});
const ids: string[] = [];
let session: Session;
let slug: string;
let drinkId: string;
test.beforeAll(async () => {
  const data = JSON.parse(await readFile("data/catalog/initial.json", "utf8"));
  const db = new Client({
    connectionString:
      "postgres://postgres:hancup_local_test@127.0.0.1:55432/hancup_auth",
  });
  await db.connect();
  const has = await db.query("select count(*) from drinks");
  if (Number(has.rows[0].count) === 0) {
    const batch = validateCatalog({
      schemaVersion: 1,
      reviewer: "disposable integration fixture",
      reviewedAt: "2026-11-12",
      changes: data.drinks.map((d: Record<string, unknown>) => ({
        ...d,
        expectedRevision: 0,
        variants: data.variants.filter(
          (v: { drinkId: string }) => v.drinkId === d.id,
        ),
      })),
    });
    if (!batch.ok) throw new Error(batch.errors.join(","));
    await publishCatalog(batch.batch, db);
  }
  await db.end();
  slug = data.drinks[0].slug;
  drinkId = data.drinks[0].id;
  const email = "hancup-" + Date.now() + "@local.test";
  const password = "local-test-only-password-921!";
  const r = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    role: "authenticated",
  });
  if (r.error || !r.data.user) throw new Error("local user setup failed");
  ids.push(r.data.user.id);
  const auth = createClient(conf.url, conf.anonKey, {
    auth: { persistSession: false },
  });
  const login = await auth.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session) throw new Error("local login failed");
  session = login.data.session;
});
test.afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});
async function authenticate(context: BrowserContext) {
  let jar: { name: string; value: string; options: Record<string, unknown> }[] =
    [];
  const client = createServerClient(conf.url, conf.anonKey, {
    cookies: {
      getAll: () => jar,
      setAll: (items) => {
        jar = items;
      },
    },
  });
  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  await context.addCookies(
    jar.map((c) => ({
      name: c.name,
      value: c.value,
      url: "http://localhost:3001",
      sameSite: "Lax",
    })),
  );
}
test("real sessions persist favorites and repeat records without leaking private reviews", async ({
  page,
  context,
  browser,
}) => {
  await authenticate(context);
  await page.goto("/drinks/" + slug);
  await page.getByRole("button", { name: "음료 찜하기" }).click();
  await expect(
    page.getByRole("button", { name: "음료 찜 해제" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/me/favorites");
  await expect(page.getByRole("link", { name: /상세 보기$/ })).toHaveCount(1);
  await page.goto("/drinks/" + slug);
  await page.getByRole("link", { name: "한 잔 기록하기" }).click();
  await page.getByLabel("별점").selectOption("4");
  await page.getByLabel("한 잔의 기억").fill("나만 아는 첫 한 잔");
  await page
    .getByRole("button", { name: "한 잔 기록하기", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("한 잔을 기록했어요.");
  const viewer = await browser.newContext();
  const publicPage = await viewer.newPage();
  await publicPage.goto("/drinks/" + slug);
  await expect(publicPage.getByText("나만 아는 첫 한 잔")).toHaveCount(0);
  await page.getByLabel("공개 범위").selectOption("public");
  await page.getByLabel("별점").selectOption("2");
  await page.getByLabel("한 잔의 기억").fill("공개로 남긴 두 번째 한 잔");
  await page
    .getByRole("button", { name: "한 잔 기록하기", exact: true })
    .click();
  await expect(
    page.getByText("공개로 남긴 두 번째 한 잔", { exact: true }),
  ).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByText("공개로 남긴 두 번째 한 잔", { exact: true }),
  ).toBeVisible();
  await expect(publicPage.getByText("★ 2 / 5 · 1명의 공개 별점")).toBeVisible();
  const firstEdit = page
    .getByRole("link", { name: "수정 / 공개 범위 변경" })
    .first();
  await firstEdit.click();
  await expect(page).toHaveURL(/edit=/);
  await expect(
    page.getByRole("button", { name: "기록 수정하기" }),
  ).toBeVisible();
  await expect(page.getByLabel("공개 범위")).toHaveValue("public");
  await page.getByLabel("공개 범위").selectOption("private");
  const updated = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("/me/records"),
  );
  await page.getByRole("button", { name: "기록 수정하기" }).click();
  await updated;
  const stored = await admin
    .from("reviews")
    .select("visibility")
    .eq("user_id", session.user.id)
    .eq("body", "공개로 남긴 두 번째 한 잔")
    .single();
  expect(stored.data?.visibility).toBe("private");
  await expect(page.getByRole("status")).toContainText("기록을 수정했어요.");
  await publicPage.reload();
  await expect(
    publicPage.getByText("공개로 남긴 두 번째 한 잔", { exact: true }),
  ).toHaveCount(0);
  const anonymous = createClient(conf.url, conf.anonKey, {
    auth: { persistSession: false },
  });
  const rows = await anonymous.rpc("public_reviews", {
    product: drinkId,
    offset_rows: 0,
  });
  expect(rows.data).toEqual([]);
  await viewer.close();
});
test("saved favorite shows selected state after reopening detail", async ({
  page,
  context,
}) => {
  await admin
    .from("favorites")
    .upsert({ user_id: session.user.id, drink_id: drinkId });
  await authenticate(context);
  await page.goto("/drinks/" + slug);
  await expect(
    page.getByRole("button", { name: "음료 찜 해제" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("review fix: history restoration never shows a withdrawn cached review while fresh read waits", async ({
  browser,
}) => {
  const writer = createClient(conf.url, conf.anonKey, {
    auth: { persistSession: false },
  });
  await writer.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  const body = "브라우저 이력에서 사라져야 하는 후기";
  const inserted = await writer
    .from("reviews")
    .insert({
      user_id: session.user.id,
      drink_id: drinkId,
      rating: 5,
      body,
      consumed_on: "2026-11-12",
      visibility: "public",
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  const viewer = await browser.newContext();
  const p = await viewer.newPage();
  let block = false;
  let release = () => {};
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await p.route("**/api/drinks/*/reviews*", async (route) => {
    if (block) await gate;
    await route.continue();
  });
  try {
    const html = await p.request.get("/drinks/" + slug);
    expect(await html.text()).not.toContain(body);
    await p.goto("/drinks/" + slug);
    await expect(p.getByText(body, { exact: true })).toBeVisible();
    const hidden = await writer
      .from("reviews")
      .update({ visibility: "private" })
      .eq("id", inserted.data.id);
    expect(hidden.error).toBeNull();
    await p.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(p.getByText(body, { exact: true })).toHaveCount(0);
    await writer
      .from("reviews")
      .update({ visibility: "public" })
      .eq("id", inserted.data.id);
    await p.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(p.getByText(body, { exact: true })).toBeVisible();
    await p.getByRole("link", { name: "음료 도감", exact: true }).click();
    await expect(p).toHaveURL("http://localhost:3001/search");
    await expect(p.getByRole("heading", { name: "음료 검색" })).toBeVisible();
    const changed = await writer
      .from("reviews")
      .update({ visibility: "private" })
      .eq("id", inserted.data.id);
    expect(changed.error).toBeNull();
    block = true;
    await p.goBack();
    await expect(p).toHaveURL(new RegExp("/drinks/" + slug));
    await expect(p.getByText(body, { exact: true })).toHaveCount(0);
    release();
    await expect(
      p.getByText("아직 공개 평가가 없어요. 첫 한 잔을 기록해 보세요."),
    ).toBeVisible();
  } finally {
    release();
    await viewer.close();
  }
});

test("journal calendar defaults to today, filters dates, paginates and refreshes markers after edits and deletion", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const make = (date: string, body: string) => ({
    user_id: session.user.id,
    drink_id: drinkId,
    consumed_on: date,
    body,
    rating: 4,
    visibility: "private",
  });
  const inserted = await admin
    .from("reviews")
    .insert([
      ...Array.from({ length: 501 }, (_, i) => ({
        ...make("2024-02-10", `달력 많은 기록 ${i}`),
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      })),
      ...Array.from({ length: 21 }, (_, i) => ({
        ...make("2024-02-29", `윤년 기록 ${i}`),
        id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      })),
      {
        ...make("2024-02-11", "다른 날의 한 잔"),
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
    ])
    .select("id");
  if (inserted.error) throw inserted.error;
  try {
    await page.goto("/me/records");
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await expect(page.locator(".journal-day.is-selected")).toHaveAttribute(
      "href",
      "/me/records?date=" + today,
    );
    await page.goto("/me/records?date=2024-02-29");
    await expect(
      page.getByRole("heading", { name: "2024년 2월" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "2024년 2월 10일, 기록 있음",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "2024년 2월 11일, 기록 있음",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("article.record")).toHaveCount(20);
    await expect(
      page.getByText("다른 날의 한 잔", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "다음 기록 보기 →" }).click();
    await expect(page).toHaveURL(/date=2024-02-29&cursor=20/);
    await expect(page.locator("article.record")).toHaveCount(1);
    await page.getByRole("button", { name: "기록 삭제" }).click();
    await expect(
      page.getByRole("heading", { name: "이 페이지에는 기록이 없어요" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "← 이전 기록 보기" }).click();
    await expect(page.locator("article.record")).toHaveCount(20);

    await page
      .getByRole("link", { name: "수정 / 공개 범위 변경" })
      .first()
      .click();
    await expect(page).toHaveURL(/date=2024-02-29&edit=/);
    await page.getByLabel("마신 날짜").fill("2024-02-28");
    await page.getByRole("button", { name: "기록 수정하기" }).click();
    await expect(page.getByRole("status")).toContainText("기록을 수정했어요.");
    await expect(page.locator(".journal-day.is-selected")).toHaveAttribute(
      "href",
      "/me/records?date=2024-02-28",
    );
    await expect(page.locator("article.record")).toHaveCount(1);
    await page.getByRole("button", { name: "기록 삭제" }).click();
    await expect(
      page.getByRole("heading", { name: "이날은 아직 기록이 없어요" }),
    ).toBeVisible();
    await expect(
      page.locator(".journal-day.is-selected .has-record"),
    ).toHaveCount(0);
    await page.screenshot({
      path: "/tmp/hancup-calendar-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".journal-calendar")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "/tmp/hancup-calendar-mobile.png",
      fullPage: true,
    });
    await page.getByRole("link", { name: "다음 달", exact: true }).click();
    await expect(page).toHaveURL(/date=2024-03-28/);
    await page.getByRole("link", { name: "오늘", exact: true }).click();
    await expect(page.locator(".journal-day.is-selected")).toHaveAttribute(
      "href",
      "/me/records?date=" + today,
    );
    await page.goto("/me/records?date=2024-02-30&date=bad");
    await expect(page.locator(".journal-day.is-selected")).toHaveAttribute(
      "href",
      "/me/records?date=" + today,
    );
  } finally {
    await admin
      .from("reviews")
      .delete()
      .in(
        "id",
        inserted.data.map((r) => r.id),
      );
  }
});

test("anonymous popularity includes private records but returns no private content or identity", async ({
  browser,
}) => {
  const viewer = await browser.newContext();
  const before = await (
    await viewer.request.get("http://localhost:3001/api/discovery/popular")
  ).json();
  expect(before.available).toBe(true);
  const baseline =
    before.items.find((r: { drinkId: string }) => r.drinkId === drinkId)
      ?.recorders ?? 0;
  const created = await admin.auth.admin.createUser({
    email: `ranking-${Date.now()}@local.test`,
    email_confirm: true,
  });
  if (created.error || !created.data.user)
    throw new Error("fixture user failed");
  const id = created.data.user.id;
  const body = "PRIVATE POPULARITY MUST NOT LEAK";
  try {
    const inserted = await admin.from("reviews").insert({
      user_id: id,
      drink_id: drinkId,
      rating: 2,
      body,
      consumed_on: "2026-11-12",
      visibility: "private",
    });
    expect(inserted.error).toBeNull();
    const response = await viewer.request.get(
      "http://localhost:3001/api/discovery/popular",
    );
    const snapshot = await response.json();
    expect(
      snapshot.items.find((r: { drinkId: string }) => r.drinkId === drinkId)
        ?.recorders,
    ).toBe(baseline + 1);
    expect(Object.keys(snapshot.items[0]).sort()).toEqual([
      "drinkId",
      "recorders",
    ]);
    expect(JSON.stringify(snapshot)).not.toContain(body);
    expect(JSON.stringify(snapshot)).not.toContain(id);
    const anonymous = createClient(conf.url, conf.anonKey, {
      auth: { persistSession: false },
    });
    const raw = await anonymous.from("reviews").select("*").eq("user_id", id);
    expect(raw.data).toEqual([]);
    const p = await viewer.newPage();
    await p.goto("/");
    await expect(
      p.getByRole("heading", { name: "실시간 인기 메뉴", exact: true }),
    ).toBeVisible();
    await expect(
      p
        .getByRole("region", { name: "실시간 인기 메뉴" })
        .locator("[data-drink-card]"),
    ).toHaveCount(1);
    await expect(p.getByText(body, { exact: true })).toHaveCount(0);
    await admin.auth.admin.deleteUser(id);
    const removed = await (
      await viewer.request.get("http://localhost:3001/api/discovery/popular")
    ).json();
    expect(
      removed.items.find((r: { drinkId: string }) => r.drinkId === drinkId)
        ?.recorders ?? 0,
    ).toBe(baseline);
  } finally {
    await admin.auth.admin.deleteUser(id);
    await viewer.close();
  }
});

test("record editing stays inside its card, cancels without losing the page and follows a changed date", async ({
  page,
  context,
}) => {
  await authenticate(context);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const date = "2024-05-10";
  const inserted = await admin
    .from("reviews")
    .insert(
      Array.from({ length: 22 }, (_, i) => ({
        user_id: session.user.id,
        drink_id: drinkId,
        consumed_on: date,
        body: `수정 흐름 확인 ${i}`,
        rating: 3,
        visibility: "private",
      })),
    )
    .select("id");
  if (inserted.error) throw inserted.error;
  try {
    await page.goto(`/me/records?date=${date}&cursor=20`);
    await expect(page.locator("article.record")).toHaveCount(2);
    const card = page.locator("article.record").last();
    await card.getByRole("link", { name: "수정 / 공개 범위 변경" }).click();
    await expect(card.getByLabel("한 잔의 기억")).toBeVisible();
    await expect(page).toHaveURL(/cursor=20/);
    await card.getByLabel("한 잔의 기억").fill("취소할 내용");
    await card.getByRole("link", { name: "수정 취소", exact: true }).click();
    await expect(page).not.toHaveURL(/edit=/);
    await expect(page).toHaveURL(/cursor=20/);
    await expect(page.getByLabel("한 잔의 기억")).toHaveCount(0);
    await expect(page.getByText("취소할 내용", { exact: true })).toHaveCount(0);
    await card.getByRole("link", { name: "수정 / 공개 범위 변경" }).click();
    await card.getByLabel("한 잔의 기억").fill("같은 날짜의 수정 기록");
    await page.screenshot({
      path: "/tmp/hancup-inline-edit-mobile.png",
      fullPage: true,
    });
    await card
      .getByRole("button", { name: "기록 수정하기", exact: true })
      .click();
    await expect(page).toHaveURL(/cursor=20/);
    await expect(page).not.toHaveURL(/edit=/);
    await expect(
      card.getByText("같은 날짜의 수정 기록", { exact: true }),
    ).toBeVisible();
    await card.getByRole("link", { name: "수정 / 공개 범위 변경" }).click();
    await card.getByLabel("한 잔의 기억").fill("날짜를 바꾼 기록");
    await card.getByLabel("마신 날짜").fill("2024-05-09");
    await card
      .getByRole("button", { name: "기록 수정하기", exact: true })
      .click();
    await expect(page).toHaveURL(/date=2024-05-09/);
    await expect(page).not.toHaveURL(/edit=|cursor=20/);
    await expect(page.getByRole("status")).toContainText("기록을 수정했어요.");
    await expect(page.locator("article.record")).toHaveCount(1);
    await expect(
      page.getByText("날짜를 바꾼 기록", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("한 잔의 기억")).toHaveCount(0);
  } finally {
    await admin
      .from("reviews")
      .delete()
      .in(
        "id",
        inserted.data.map((r) => r.id),
      );
  }
});

test("article likes persist separately from drinks and can be removed", async ({
  page,
  context,
}) => {
  await authenticate(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/me/favorites?tab=articles");
  const tabs = page.getByRole("navigation", { name: "좋아요 종류" });
  await expect(
    tabs.getByRole("link", { name: "아티클", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "아직 좋아요한 아티클이 없어요" }),
  ).toBeVisible();
  await page.goto("/notes/autumn-tea");
  await page
    .getByRole("button", { name: "아티클 좋아요하기", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "아티클 좋아요 해제", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "아티클 좋아요 해제", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/me/favorites?tab=articles");
  await expect(page.locator(".magazine-card")).toHaveCount(1);
  await page.locator(".magazine-card").click();
  await expect(page).toHaveURL(/\/notes\/autumn-tea$/);
  await page.goto("/me/favorites?tab=articles");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "/tmp/hancup-saved-articles.png",
    fullPage: true,
  });
  await tabs.getByRole("link", { name: "음료", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3001/me/favorites");
  await expect(page.locator(".magazine-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "좋아요한 음료", exact: true }),
  ).toBeVisible();
  await tabs.getByRole("link", { name: "아티클", exact: true }).click();
  await page
    .getByRole("button", { name: "아티클 좋아요 해제", exact: true })
    .click();
  await expect(page.locator(".magazine-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "아직 좋아요한 아티클이 없어요" }),
  ).toBeVisible();
  await page.goto("/notes/autumn-tea");
  await expect(
    page.getByRole("button", { name: "아티클 좋아요하기", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("five tabs separate records, likes and My with settings and logout", async ({
  page,
  context,
}) => {
  await authenticate(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/me");
  await expect(
    page.getByRole("heading", { name: "마이페이지", exact: true }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  await expect(nav.getByRole("link")).toHaveCount(5);
  const active = nav.locator('[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAccessibleName("마이페이지");
  await expect(
    page.getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/hancup-my-mobile.png", fullPage: true });
  await page
    .getByRole("link", { name: "프로필·계정 설정", exact: true })
    .click();
  await expect(page).toHaveURL(/\/me\/settings$/);
  await expect(active).toHaveAccessibleName("마이페이지");
  await page.getByRole("link", { name: "마이페이지로", exact: true }).click();
  await expect(page).toHaveURL(/\/me$/);
  await nav.getByRole("link", { name: "음료 기록", exact: true }).click();
  await expect(page.locator(".journal-calendar")).toBeVisible();
  await expect(active).toHaveAccessibleName("음료 기록");
  await expect(page.locator(".personal-tabs")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "좋아요", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "좋아요한 음료", exact: true }),
  ).toBeVisible();
  await expect(active).toHaveAccessibleName("좋아요");
  await expect(page.locator(".personal-tabs")).toHaveCount(0);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const tab of await nav.getByRole("link").all()) {
      await expect(tab).toBeInViewport();
      expect((await tab.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    }
  }
  await nav.getByRole("link", { name: "마이페이지", exact: true }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3001/");
  await nav.getByRole("link", { name: "마이페이지", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
});
