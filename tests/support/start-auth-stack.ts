// Disposable LOCAL test services only. Never point this script at a hosted DB.
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { createHmac } from "node:crypto";
import { writeFile, readFile } from "node:fs/promises";
const secret = "hancup-local-integration-only-secret-2026";
function jwt(role: string) {
  const enc = (x: unknown) =>
    Buffer.from(JSON.stringify(x)).toString("base64url");
  const head = enc({ alg: "HS256", typ: "JWT" }),
    body = enc({
      role,
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    });
  return (
    head +
    "." +
    body +
    "." +
    createHmac("sha256", secret)
      .update(head + "." + body)
      .digest("base64url")
  );
}
const docker = (...args: string[]) =>
  execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
    stdio: "pipe",
  }).toString();
const db = new Client({
  connectionString:
    "postgres://postgres:hancup_local_test@127.0.0.1:55432/postgres",
});
await db.connect();
const exists = await db.query(
  "select 1 from pg_database where datname='hancup_auth'",
);
if (!exists.rowCount) await db.query("create database hancup_auth");
await db.query(
  `do $$begin create role service_role nologin bypassrls; exception when duplicate_object then null;end$$;do $$begin create role authenticator login password 'hancup_test_authenticator'; exception when duplicate_object then null;end$$;grant anon,authenticated,service_role to authenticator;`,
);
await db.end();
const schemaDb = new Client({
  connectionString:
    "postgres://postgres:hancup_local_test@127.0.0.1:55432/hancup_auth",
});
await schemaDb.connect();
await schemaDb.query(
  "create schema if not exists auth;create schema if not exists extensions",
);
await schemaDb.end();
try {
  docker("network", "create", "hancup-test-net");
} catch {}
try {
  docker("network", "connect", "hancup-test-net", "hancup-db");
} catch {}
for (const name of ["hancup-gotrue", "hancup-postgrest"]) {
  try {
    docker("rm", "-f", name);
  } catch {}
}
docker(
  "run",
  "-d",
  "--name",
  "hancup-gotrue",
  "--network",
  "hancup-test-net",
  "-p",
  "127.0.0.1:55435:9999",
  "-e",
  "GOTRUE_API_HOST=0.0.0.0",
  "-e",
  "GOTRUE_API_PORT=9999",
  "-e",
  "API_EXTERNAL_URL=http://127.0.0.1:55434",
  "-e",
  "GOTRUE_SITE_URL=http://localhost:3001",
  "-e",
  "GOTRUE_DB_DRIVER=postgres",
  "-e",
  "GOTRUE_DB_DATABASE_URL=postgres://postgres:hancup_local_test@hancup-db:5432/hancup_auth?search_path=auth",
  "-e",
  "GOTRUE_DB_NAMESPACE=auth",
  "-e",
  "GOTRUE_JWT_SECRET=" + secret,
  "-e",
  "GOTRUE_JWT_ADMIN_ROLES=service_role",
  "-e",
  "GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated",
  "-e",
  "GOTRUE_JWT_AUD=authenticated",
  "-e",
  "GOTRUE_EXTERNAL_EMAIL_ENABLED=true",
  "-e",
  "GOTRUE_MAILER_AUTOCONFIRM=true",
  "public.ecr.aws/supabase/gotrue:v2.197.0",
);
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch("http://127.0.0.1:55435/health");
    if (res.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
if (!ready)
  throw new Error("Local GoTrue not ready. Inspect hancup-gotrue logs.");
const appDb = new Client({
  connectionString:
    "postgres://postgres:hancup_local_test@127.0.0.1:55432/hancup_auth",
});
await appDb.connect();
const has = await appDb.query(
  "select 1 from information_schema.tables where table_schema='public' and table_name='drinks'",
);
if (!has.rowCount) {
  await appDb.query(
    `create or replace function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub'))::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`,
  );
  for (const file of [
    "001_core.sql",
    "004_reviews.sql",
    "005_map_budget.sql",
    "006_account_deletion.sql",
  ])
    await appDb.query(await readFile("supabase/migrations/" + file, "utf8"));
}
await appDb.query(
  await readFile("supabase/migrations/007_home_popularity.sql", "utf8"),
);
await appDb.end();
docker(
  "run",
  "-d",
  "--name",
  "hancup-postgrest",
  "--network",
  "hancup-test-net",
  "-p",
  "127.0.0.1:55436:3000",
  "-e",
  "PGRST_DB_URI=postgres://authenticator:hancup_test_authenticator@hancup-db:5432/hancup_auth",
  "-e",
  "PGRST_DB_SCHEMAS=public",
  "-e",
  "PGRST_DB_ANON_ROLE=anon",
  "-e",
  "PGRST_JWT_SECRET=" + secret,
  "public.ecr.aws/supabase/postgrest:v16.5",
);
await writeFile(
  ".env.auth-test",
  JSON.stringify({
    url: "http://127.0.0.1:55434",
    anonKey: jwt("anon"),
    serviceKey: jwt("service_role"),
  }),
  { mode: 0o600 },
);
console.log(
  "Disposable local auth and REST services ready. Credentials saved to ignored .env.auth-test.",
);
