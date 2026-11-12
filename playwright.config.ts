import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_USE_BUNDLED_BROWSER
        ? undefined
        : "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    // Non-secret placeholder so the stores map path runs against the fake SDK.
    env: { NEXT_PUBLIC_KAKAO_MAP_KEY: "e2e-placeholder-map-key" },
  },
  reporter: "list",
});
