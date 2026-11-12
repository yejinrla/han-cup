import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/auth-e2e",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_USE_BUNDLED_BROWSER
        ? undefined
        : "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npx tsx tests/support/start-auth-app.ts",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
