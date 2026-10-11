import { defineConfig } from "@playwright/test";

const remote = process.env.AUDIT_BASE_URL;
const evidence = process.env.AUDIT_EVIDENCE_DIR || "docs/audit/final";
export default defineConfig({
  testDir: "./tests/audit",
  workers: 1,
  timeout: 60000,
  outputDir: `${evidence}/artifacts`,
  use: {
    baseURL: remote || "http://127.0.0.1:4175",
    viewport: { width: 390, height: 844 },
    timezoneId: "Asia/Shanghai",
    locale: "zh-CN",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  ...(!remote && {
    webServer: {
      command: "npm run preview -- --port 4175 --strictPort",
      url: "http://127.0.0.1:4175",
      reuseExistingServer: false,
    },
  }),
  reporter: [["list"], ["json", { outputFile: `${evidence}/browser-results.json` }]],
});
