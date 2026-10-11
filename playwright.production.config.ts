import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/production",
  use: {
    baseURL: "http://127.0.0.1:4174",
    viewport: { width: 375, height: 812 },
  },
  webServer: {
    command: "npm run preview -- --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
  reporter: "list",
});
