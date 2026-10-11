import { defineConfig } from "@playwright/test";
const remote=process.env.BEGINNER_BASE_URL;
const evidence=process.env.BEGINNER_EVIDENCE_DIR || "docs/beginner-course/local";
export default defineConfig({
  testDir:"./tests/beginner",workers:1,timeout:120000,
  outputDir:`${evidence}/artifacts`,
  use:{baseURL:remote||"http://127.0.0.1:4176",viewport:{width:390,height:844},
    locale:"zh-CN",timezoneId:"Asia/Shanghai",trace:"retain-on-failure",screenshot:"only-on-failure"},
  ...(!remote && {webServer:{command:"npm run preview -- --port 4176 --strictPort",url:"http://127.0.0.1:4176",reuseExistingServer:false}}),
  reporter:[["list"],["json",{outputFile:`${evidence}/browser-results.json`}]],
});
