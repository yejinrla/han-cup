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
  await expect(page.getByRole("status")).toContainText("한 잔을 기록했어요.");
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
