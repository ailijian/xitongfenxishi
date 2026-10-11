import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "production/**/*.spec.ts", "staging/**/*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.STAGING_BASE_URL || "https://ruankao.staging.haaboo.com",
    viewport: { width: 375, height: 812 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "test-results/staging-results.json" }]],
});
