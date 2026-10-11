import { defineConfig } from "@playwright/test";
const remote=process.env.FULL_COURSE_BASE_URL;
const evidence=process.env.FULL_COURSE_EVIDENCE || "tmp/full-course";
export default defineConfig({testDir:"./tests/full-course",workers:1,timeout:120000,
 outputDir:`${evidence}/artifacts`,use:{baseURL:remote||"http://127.0.0.1:4178",viewport:{width:390,height:844},
 locale:"zh-CN",timezoneId:"Asia/Shanghai",trace:"retain-on-failure",screenshot:"only-on-failure"},
 ...(!remote&&{webServer:{command:"npm run preview -- --port 4178 --strictPort",url:"http://127.0.0.1:4178",reuseExistingServer:false}}),
 reporter:[["list"],["json",{outputFile:`${evidence}/browser-results.json`}]],
});
