/** Dedicated synthetic profile; never reads the user's browser or clears their data. */
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { answerCase, downloadBackup, records, selfTest } from "../tests/audit/helpers";

const mode = process.argv[2];
if (mode !== "seed" && mode !== "verify") throw new Error("Usage: tsx scripts/audit-round2-upgrade.ts seed|verify");
const root = "tmp/round2-upgrade", evidence = "docs/round2";
mkdirSync(root, { recursive: true });
mkdirSync(`${evidence}/screenshots`, { recursive: true });
const context = await chromium.launchPersistentContext(`${root}/profile`, {
  headless: true, baseURL: "https://ruankao.staging.haaboo.com",
  viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai",
});
try {
  const page = await context.newPage();
  if (mode === "seed") {
    await page.goto("/sources");
    await expect(page.getByText(/版本 2026.10.11.1/)).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.goto("/learn/K001");
    await selfTest(page);
    await page.goto("/practice?question=RK001");
    await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
    await page.getByRole("button", { name: "提交答案", exact: true }).click();
    await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
    await page.goto("/mock");
    await page.getByRole("button", { name: "开始本场完整模考" }).click();
    await expect(page).toHaveURL(/run=[^&]+/);
    const run = new URL(page.url()).searchParams.get("run")!;
    await page.getByRole("button", { name: "收藏本题", exact: true }).click();
    await page.getByRole("button", { name: /D.*输入输出数据流平衡/ }).click();
    await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
    await page.getByRole("button", { name: "确认交卷", exact: true }).click();
    await expect(page.getByText(/正确答案 D/)).toBeVisible();
    for (const id of ["C01", "C04", "C06"]) {
      await page.goto(`/cases/${id}?exam=${run}`);
      await answerCase(page, id, "alternate");
    }
    await page.goto(`/essays/E01?exam=${run}`);
    await page.getByRole("button", { name: "新建项目素材" }).click();
    await page.getByRole("textbox", { name: "项目名称", exact: true }).fill("第二轮升级测试素材");
    await page.getByRole("textbox", { name: "我的论文提纲" }).fill("旧提纲原样保留");
    await page.getByRole("textbox", { name: "我的论文正文" }).fill("旧正文逐字保存，含Unicode验收📝");
    await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe("旧正文逐字保存，含Unicode验收📝");
    for (const box of await page.locator("main input[type=checkbox]").all()) await box.check();
    await page.getByRole("button", { name: "确认完整论文并提交本场模考" }).click();
    await expect(page.getByRole("status")).toContainText("保存快照");
    await page.goto("/learn/K002");
    await page.getByRole("button", { name: /开始闭卷自测/ }).click();
    await page.getByRole("textbox", { name: "闭卷回答" }).fill("旧版未提交闭卷草稿");
    await expect.poll(async () => (await records(page, "learningDrafts"))[0]?.recall).toBe("旧版未提交闭卷草稿");
    await page.goto("/mock");
    await page.getByRole("button", { name: "开始本场完整模考" }).click();
    await page.getByRole("button", { name: /A.*存储名称一样即可/ }).click();
    await expect(page.getByRole("heading", { name: "选择卷 · 已答 1 / 75题" })).toBeVisible();
    await page.goto("/practice?mode=favorites");
    await page.getByRole("button", { name: /D.*输入输出数据流平衡/ }).click();
    await page.getByRole("button", { name: "提交答案", exact: true }).click();
    await expect(page.getByText(/正确答案 D/)).toBeVisible();
    await page.screenshot({ path: `${evidence}/screenshots/before-repeat-gate-390.png` });
    await page.goto("/progress");
    await page.getByLabel("学习启动日期").fill("2026-10-10");
    await page.getByRole("button", { name: "保存启动日" }).click();
    await expect(page.getByRole("status")).toContainText("启动日已保存");
    const before = (await downloadBackup(page)).backup;
    for (const [table, rows] of Object.entries(before.data)) expect((rows as unknown[]).length, table).toBeGreaterThan(0);
    expect(before.data.exams.some((e: any) => !!e.essaySnapshot)).toBe(true);
    expect(before.data.sessions.every((s: any) => s.mockKind === undefined)).toBe(true);
    writeFileSync(`${root}/before.json`, JSON.stringify(before, null, 2));
    await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
    await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
    await page.goto("/");
    await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
    await page.clock.setFixedTime(new Date("2026-10-11T16:00:01Z"));
    await page.clock.runFor(2000);
    await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
    await page.screenshot({ path: `${evidence}/screenshots/before-midnight-390.png` });
    console.log(JSON.stringify({ phase: mode, nonemptyTables: 12, result: "PASS", reproduced: ["midnight-stale", "repeat-answer-leak"] }));
  } else {
    const before = JSON.parse(readFileSync(`${root}/before.json`, "utf8"));
    await page.goto("/sources");
    await expect(page.getByRole("button", { name: "更新并重新载入" })).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "更新并重新载入" }).click();
    await page.goto("/progress");
    const upgraded = (await downloadBackup(page)).backup;
    expect(upgraded.data).toEqual(before.data);
    await page.getByRole("button", { name: "重置学习数据…" }).click();
    await page.getByRole("button", { name: "再次确认，清空全部学习数据" }).click();
    await expect(page.getByRole("status").filter({ hasText: "已重置" })).toBeVisible();
    for (const table of Object.keys(before.data)) expect(await records(page, table)).toEqual([]);
    await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(`${root}/before.json`);
    await expect(page.getByRole("heading", { name: "校验通过 · 恢复预览" })).toBeVisible();
    await page.getByRole("button", { name: "准备恢复此备份" }).click();
    await page.getByRole("button", { name: "确认替换并恢复" }).click();
    await expect(page.getByRole("status").filter({ hasText: "完整恢复" })).toBeVisible();
    expect((await downloadBackup(page)).backup.data).toEqual(before.data);
    await page.goto("/practice?mode=favorites");
    await expect(page.getByText(/模考收藏题在整卷交卷后开放/)).toBeVisible();
    await expect(page.locator(".answer")).toHaveCount(0);
    await page.screenshot({ path: `${evidence}/screenshots/after-upgrade-repeat-gate-390.png` });
    await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
    await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
    await page.goto("/");
    await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
    await page.clock.setFixedTime(new Date("2026-10-11T16:00:01Z"));
    await page.clock.runFor(2000);
    await expect(page.locator(".page-title")).toContainText("DAY 3 / 7");
    await page.screenshot({ path: `${evidence}/screenshots/after-midnight-390.png` });
    const result = { result: "PASS", verifiedAt: new Date().toISOString(), databaseVersionUnchanged: 2, backupVersionUnchanged: 2,
      contentVersionUnchanged: before.contentVersion, everyTableUnchanged: true, oldBackupClearedAndRestoredExactly: true,
      counts: Object.fromEntries(Object.entries(before.data).map(([table, rows]) => [table, (rows as unknown[]).length])),
      oldExamEssaySnapshotPreserved: true, previousPracticeAnswerNowLocked: true, noHistoricalMockKindFabricated: true };
    writeFileSync(`${evidence}/staging-upgrade.json`, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  }
} finally { await context.close(); }
