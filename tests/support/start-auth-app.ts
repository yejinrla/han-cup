import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const config = JSON.parse(await readFile(".env.auth-test", "utf8"));
const child = spawn(
  "node",
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--port",
    "3001",
    "--hostname",
    "0.0.0.0",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      HANCUP_AUTH_TEST: "1",
      NEXT_PUBLIC_SUPABASE_URL: config.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.anonKey,
      SUPABASE_SERVICE_ROLE_KEY: config.serviceKey,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
