/** Separate synthetic profile: never opens or clears the user's browser data. */
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { answerCase, downloadBackup, records, selfTest } from "../tests/audit/helpers";
const mode=process.argv[2];
if(mode!=="seed"&&mode!=="verify") throw new Error("Usage: tsx scripts/audit-beginner-upgrade.ts seed|verify");
const root="tmp/full-course-upgrade", evidence="docs/full-course";
mkdirSync(root,{recursive:true});
const context=await chromium.launchPersistentContext(`${root}/profile`,{
  headless:true,baseURL:"https://ruankao.staging.haaboo.com",viewport:{width:390,height:844},timezoneId:"Asia/Shanghai",
});
try {
  const page=await context.newPage();
  if(mode==="seed") {
    await page.goto("/sources");await expect(page.getByText(/版本 2026.10.11.1/)).toBeVisible();
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await page.goto("/learn/K001");await expect(page.locator(".beginner-course")).toBeVisible();await selfTest(page);
    await page.goto("/practice?question=RK001");await page.getByRole("button",{name:/B.*包含过多接口细节/}).click();
    await page.getByRole("button",{name:"提交答案",exact:true}).click();await expect(page.getByText("已加入错题本",{exact:true})).toBeVisible();
    await page.goto("/cases/C01");await answerCase(page,"C01","alternate");
    await page.goto("/essays/E01");await page.getByRole("button",{name:"新建项目素材"}).click();
    await page.getByRole("textbox",{name:"项目名称",exact:true}).fill("课程上线前的测试项目素材");
    await page.getByRole("textbox",{name:"我的论文提纲"}).fill("上线前提纲不改写");
    await page.getByRole("textbox",{name:"我的论文正文"}).fill("上线前正文📝保持Unicode和原时间戳");
    await expect.poll(async()=> (await records(page,"essayDrafts"))[0]?.body).toBe("上线前正文📝保持Unicode和原时间戳");
    await page.goto("/learn/K002");await page.getByRole("button",{name:/开始闭卷自测/}).click();
    await page.getByRole("textbox",{name:"闭卷回答"}).fill("旧版尚未提交的闭卷草稿");
    await expect.poll(async()=> (await records(page,"learningDrafts")).find(d=>d.cardId==='K002')?.recall).toBe("旧版尚未提交的闭卷草稿");
    await page.goto("/mock");await page.getByRole("button",{name:"开始本场完整模考"}).click();
    await page.getByRole("button",{name:"收藏本题",exact:true}).click();await page.getByRole("button",{name:/D.*输入输出数据流平衡/}).click();
    await expect(page.getByRole("heading",{name:"选择卷 · 已答 1 / 75题"})).toBeVisible();
    await page.goto("/progress");await page.getByLabel("学习启动日期").fill("2026-10-10");await page.getByRole("button",{name:"保存启动日"}).click();
    await expect(page.getByRole("status")).toContainText("启动日已保存");
    const before=(await downloadBackup(page)).backup;
    expect(Object.keys(before.data)).toHaveLength(12);
    for(const [name,rows] of Object.entries(before.data)) expect((rows as unknown[]).length,name).toBeGreaterThan(0);
    writeFileSync(`${root}/before.json`,JSON.stringify(before,null,2));
    writeFileSync(`${evidence}/pre-release-backup.json`,JSON.stringify(before,null,2));
    console.log(JSON.stringify({phase:mode,result:"PASS",nonemptyTables:12,oldVersion:"2026.10.11.1",syntheticProfile:true}));
  } else {
    const before=JSON.parse(readFileSync(`${root}/before.json`,"utf8"));
    await page.goto("/sources");
    await expect(page.getByRole("button",{name:"更新并重新载入"})).toBeVisible({timeout:45000});
    await page.getByRole("button",{name:"更新并重新载入"}).click();
    await page.goto("/progress");expect((await downloadBackup(page)).backup.data).toEqual(before.data);
    await page.goto("/learn/K001");await expect(page.locator(".beginner-course")).toBeVisible();
    await page.reload();await expect(page.locator(".beginner-course")).toBeVisible();
    await page.goto("/learn/K002");await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("旧版尚未提交的闭卷草稿");
    await page.goto("/progress");expect((await downloadBackup(page)).backup.data).toEqual(before.data);
    await page.getByRole("button",{name:"重置学习数据…"}).click();await page.getByRole("button",{name:"再次确认，清空全部学习数据"}).click();
    await expect(page.getByRole("status").filter({hasText:"已重置"})).toBeVisible();
    for(const table of Object.keys(before.data)) expect(await records(page,table)).toEqual([]);
    await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(`${root}/before.json`);
    await expect(page.getByRole("heading",{name:"校验通过 · 恢复预览"})).toBeVisible();
    await page.getByRole("button",{name:"准备恢复此备份"}).click();await page.getByRole("button",{name:"确认替换并恢复"}).click();
    await expect(page.getByRole("status").filter({hasText:"完整恢复"})).toBeVisible();
    expect((await downloadBackup(page)).backup.data).toEqual(before.data);
    await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles({name:"broken.json",mimeType:"application/json",buffer:Buffer.from('{invalid')});
    await expect(page.getByRole("alert")).toContainText("原数据未改动");expect((await downloadBackup(page)).backup.data).toEqual(before.data);
    const result={result:"PASS",verifiedAt:new Date().toISOString(),databaseVersion:2,backupVersion:2,contentVersion:before.contentVersion,
      all12TablesFieldIdenticalAfterServiceWorkerUpgrade:true,all12TablesFieldIdenticalAfterRestore:true,failedImportUnchanged:true,
      oldRecallDraftResumed:true,oldHistoricalEvidenceUnchanged:true,
      counts:Object.fromEntries(Object.entries(before.data).map(([name,rows])=>[name,(rows as unknown[]).length])),syntheticProfile:true};
    writeFileSync(`${evidence}/staging-upgrade.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  }
} finally {await context.close();}
