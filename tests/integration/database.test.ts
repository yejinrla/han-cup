import { beforeAll, afterAll, test, expect } from "vitest";
import { Client } from "pg";
import { publishCatalog } from "../../scripts/catalog/import";
import { rollbackCatalog } from "../../scripts/catalog/rollback";
import { validateCatalog } from "../../scripts/catalog/schema";
import { readFile } from "node:fs/promises";
const db = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ??
    "postgres://postgres:hancup_local_test@localhost:55432/postgres",
});
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002",
  d = "10000000-0000-4000-8000-000000000001";
async function as(user: string | null, sql: string, values: unknown[] = []) {
  await db.query("begin");
  try {
    await db.query(`set local role ${user ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user ?? "",
    ]);
    const r = await db.query(sql, values);
    await db.query("commit");
    return r;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
beforeAll(async () => {
  await db.connect();
  await db.query(
    `drop schema public cascade; create schema public; create schema if not exists auth; do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$; create table if not exists auth.users(id uuid primary key); create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
  );
  await db.query(
    "alter default privileges in schema public grant all on tables to anon,authenticated",
  );
  await db.query(await readFile("supabase/migrations/001_core.sql", "utf8"));
  await db.query(await readFile("supabase/migrations/004_reviews.sql", "utf8"));
  await db.query(
    await readFile("supabase/migrations/005_map_budget.sql", "utf8"),
  );
  await db.query(
    await readFile("supabase/migrations/006_account_deletion.sql", "utf8"),
  );
  await db.query(
    `insert into auth.users values ($1),($2) on conflict do nothing`,
    [a, b],
  );
  await db.query(
    `insert into profiles(id,nickname) values($1,'사용자A'),($2,'사용자B') on conflict(id) do update set nickname=excluded.nickname`,
    [a, b],
  );
  await db.query(
    `insert into drinks(id,brand_id,slug,name,category) values($1,'starbucks','test-latte','테스트 라떼','coffee')`,
    [d],
  );
});
afterAll(async () => {
  await db.end();
});
test("private reviews cannot be read anonymously or by another user", async () => {
  await as(
    a,
    `insert into reviews(user_id,drink_id,rating,consumed_on) values($1,$2,4,current_date)`,
    [a, d],
  );
  expect((await as(null, "select * from reviews")).rows).toHaveLength(0);
  expect((await as(b, "select * from reviews")).rows).toHaveLength(0);
  expect((await as(a, "select * from reviews")).rows).toHaveLength(1);
});
test("ownership, rating and operator role cannot be forged", async () => {
  await expect(
    as(
      a,
      `insert into reviews(user_id,drink_id,rating,consumed_on) values($1,$2,4,current_date)`,
      [b, d],
    ),
  ).rejects.toThrow();
  for (const rating of [0, 6])
    await expect(
      as(
        a,
        `insert into reviews(user_id,drink_id,rating,consumed_on) values($1,$2,$3,current_date)`,
        [a, d, rating],
      ),
    ).rejects.toThrow();
  await expect(
    as(a, `insert into operator_roles(user_id) values($1)`, [a]),
  ).rejects.toThrow();
  await expect(as(null, `update drinks set name='forged'`)).rejects.toThrow();
});
test("favorites are private and unique", async () => {
  await as(a, `insert into favorites(user_id,drink_id) values($1,$2)`, [a, d]);
  await expect(
    as(a, `insert into favorites(user_id,drink_id) values($1,$2)`, [a, d]),
  ).rejects.toThrow();
  expect((await as(b, "select * from favorites")).rowCount).toBe(0);
});

test("latest visible public rating per user and privacy changes are reflected immediately", async () => {
  await db.query("delete from reviews");
  for (const [user, rating, visibility, at] of [
    [a, 2, "public", "2026-01-01"],
    [a, 4, "public", "2026-02-01"],
    [a, 1, "private", "2026-03-01"],
    [b, 2, "public", "2026-01-01"],
  ])
    await db.query(
      `insert into reviews(user_id,drink_id,rating,visibility,consumed_on,created_at) values($1,$2,$3,$4,current_date,$5)`,
      [user, d, rating, visibility, at],
    );
  let r = await as(null, "select * from rating_summaries()");
  expect(Number(r.rows[0].average)).toBe(3);
  expect(Number(r.rows[0].count)).toBe(2);
  const latest = await db.query(
    "select id from reviews where user_id=$1 and rating=4",
    [a],
  );
  await as(a, "update reviews set visibility='private' where id=$1", [
    latest.rows[0].id,
  ]);
  r = await as(null, "select * from rating_summaries()");
  expect(Number(r.rows[0].average)).toBe(2);
  expect(
    (await as(null, "select * from public_reviews($1,0)", [d])).rows,
  ).toHaveLength(2);
  await db.query(
    "update reviews set moderation_status='hidden' where user_id=$1 and visibility='public'",
    [a],
  );
  r = await as(null, "select * from rating_summaries()");
  expect(Number(r.rows[0].count)).toBe(1);
  await expect(
    as(a, "update reviews set moderation_status='visible' where user_id=$1", [
      a,
    ]),
  ).rejects.toThrow();
  await db.query("delete from auth.users where id=$1", [b]);
  r = await as(null, "select * from rating_summaries()");
  expect(r.rows).toHaveLength(0);
});

test("catalog releases preserve omitted products, reject stale changes atomically and restore values", async () => {
  const id = "30000000-0000-4000-8000-000000000001",
    vid = "40000000-0000-4000-8000-000000000001";
  const input = {
    schemaVersion: 1,
    reviewer: "local-test-operator",
    reviewedAt: "2026-11-12",
    changes: [
      {
        id,
        expectedRevision: 0,
        brandId: "starbucks",
        slug: "import-test",
        name: "발행 테스트",
        category: "coffee",
        status: "active",
        defaultVariantId: vid,
        variants: [
          {
            id: vid,
            temperature: "hot",
            sizeLabel: "톨",
            cupMl: 355,
            nutritionBasisMl: 355,
            nutrition: { caloriesKcal: 100, sugarG: 0, caffeineMg: null },
            priceKrw: null,
            source: {
              url: "https://www.starbucks.co.kr/menu/drink_list.do",
              checkedAt: "2026-11-12",
            },
            imagePath: null,
          },
        ],
      },
    ],
  };
  const parse = validateCatalog(input);
  if (!parse.ok) throw new Error(parse.errors.join(","));
  await publishCatalog(parse.batch, db);
  expect(
    (await db.query("select name from drinks where id=$1", [d])).rows[0].name,
  ).toBe("테스트 라떼");
  const change = structuredClone(parse.batch);
  change.changes[0].expectedRevision = 1;
  change.changes[0].name = "수정됨";
  change.changes[0].variants[0].nutrition.caloriesKcal = 80;
  const release = await publishCatalog(change, db);
  await expect(publishCatalog(change, db)).rejects.toThrow("검수 이후");
  await rollbackCatalog(release.releaseId, db);
  expect(
    (await db.query("select name from drinks where id=$1", [id])).rows[0].name,
  ).toBe("발행 테스트");
  expect(
    Number(
      (
        await db.query("select calories_kcal from drink_variants where id=$1", [
          vid,
        ])
      ).rows[0].calories_kcal,
    ),
  ).toBe(100);
});
test("map budget is shared and not callable by the public", async () => {
  const c = "a".repeat(64);
  expect(
    (await db.query("select reserve_map_request($1,2) allowed", [c])).rows[0]
      .allowed,
  ).toBe(true);
  expect(
    (await db.query("select reserve_map_request($1,2) allowed", [c])).rows[0]
      .allowed,
  ).toBe(true);
  expect(
    (await db.query("select reserve_map_request($1,2) allowed", [c])).rows[0]
      .allowed,
  ).toBe(false);
  await expect(
    as(null, "select reserve_map_request($1,2)", [c]),
  ).rejects.toThrow();
});

test("review fix: importer rejects another product variant and changed identity atomically", async () => {
  const owner = "30000000-0000-4000-8000-000000000001",
    foreign = "40000000-0000-4000-8000-000000000001";
  const id = "50000000-0000-4000-8000-000000000001",
    vid = "60000000-0000-4000-8000-000000000001";
  const v = {
    id: vid,
    temperature: "hot",
    sizeLabel: "톨",
    cupMl: 355,
    nutritionBasisMl: 355,
    nutrition: { caloriesKcal: 50, sugarG: 0, caffeineMg: null },
    priceKrw: null,
    source: {
      url: "https://www.starbucks.co.kr/menu/drink_list.do",
      checkedAt: "2026-11-12",
    },
    imagePath: null,
  };
  const input = {
    schemaVersion: 1,
    reviewer: "test",
    reviewedAt: "2026-11-12",
    changes: [
      {
        id,
        expectedRevision: 0,
        brandId: "starbucks",
        slug: "ownership-check",
        name: "소유권 테스트",
        category: "coffee",
        status: "active",
        defaultVariantId: vid,
        variants: [
          v,
          {
            ...v,
            id: foreign,
            sizeLabel: "큰 사이즈",
            nutrition: { ...v.nutrition, caloriesKcal: 999 },
          },
        ],
      },
    ],
  };
  const r = validateCatalog(input);
  if (!r.ok) throw new Error(r.errors.join(","));
  await expect(publishCatalog(r.batch, db)).rejects.toThrow();
  expect(
    Number(
      (
        await db.query("select calories_kcal from drink_variants where id=$1", [
          foreign,
        ])
      ).rows[0].calories_kcal,
    ),
  ).toBe(100);
  expect(
    (await db.query("select * from drinks where id=$1", [id])).rows,
  ).toHaveLength(0);
  const row = await db.query("select * from drinks where id=$1", [owner]);
  const identityChange = {
    ...r.batch,
    changes: [
      {
        ...r.batch.changes[0],
        id: owner,
        slug: "import-test",
        expectedRevision: row.rows[0].revision,
        defaultVariantId: foreign,
        variants: [{ ...v, id: foreign, temperature: "iced" as const }],
      },
    ],
  };
  await expect(publishCatalog(identityChange, db)).rejects.toThrow();
});

test("review fix: rollback rejects variant additions without claiming a completed restoration", async () => {
  const id = "30000000-0000-4000-8000-000000000001",
    oldId = "40000000-0000-4000-8000-000000000001",
    addedId = "70000000-0000-4000-8000-000000000001";
  const revision = (
    await db.query("select revision from drinks where id=$1", [id])
  ).rows[0].revision;
  const v = {
    id: oldId,
    temperature: "hot",
    sizeLabel: "톨",
    cupMl: 355,
    nutritionBasisMl: 355,
    nutrition: { caloriesKcal: 100, sugarG: 0, caffeineMg: null },
    priceKrw: null,
    source: {
      url: "https://www.starbucks.co.kr/menu/drink_list.do",
      checkedAt: "2026-11-12",
    },
    imagePath: null,
  };
  const r = validateCatalog({
    schemaVersion: 1,
    reviewer: "test",
    reviewedAt: "2026-11-12",
    changes: [
      {
        id,
        expectedRevision: revision,
        brandId: "starbucks",
        slug: "import-test",
        name: "발행 테스트",
        category: "coffee",
        status: "active",
        defaultVariantId: oldId,
        variants: [v, { ...v, id: addedId, sizeLabel: "그란데" }],
      },
    ],
  });
  if (!r.ok) throw new Error(r.errors.join(","));
  const release = await publishCatalog(r.batch, db);
  await expect(rollbackCatalog(release.releaseId, db)).rejects.toThrow(
    "새 변형",
  );
  expect(
    (
      await db.query("select reverted from catalog_releases where id=$1", [
        release.releaseId,
      ])
    ).rows[0].reverted,
  ).toBe(false);
});
