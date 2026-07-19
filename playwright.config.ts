import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  forbidOnly: true,
  fullyParallel: false,
  outputDir: ".playwright-output",
  reporter: [["list"]],
  testDir: "./e2e",
  timeout: 120_000,
  use: {
    acceptDownloads: true,
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    viewport: {
      height: 900,
      width: 1280
    }
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    reuseExistingServer: false,
    timeout: 30_000,
    url: "http://127.0.0.1:5173"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
