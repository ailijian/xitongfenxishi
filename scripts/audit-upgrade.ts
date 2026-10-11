/** Isolated synthetic browser profile for before/after staging release checks. */
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { answerCase, downloadBackup, records, selfTest } from "../tests/audit/helpers";

const mode = process.argv[2];
if (mode !== "seed" && mode !== "verify") throw new Error("Usage: tsx scripts/audit-upgrade.ts seed|verify");
const root = "tmp/audit-upgrade";
mkdirSync(root, { recursive: true });
const context = await chromium.launchPersistentContext(`${root}/profile`, {
  headless: true, baseURL: "https://ruankao.staging.haaboo.com",
  viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai",
});
try {
  const page = await context.newPage();
  if (mode === "seed") {
    await page.goto("/sources");
    await expect(page.getByText(/版本 2026.10.10.1/)).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.goto("/learn/K014");
    await selfTest(page, "K014");
    await page.goto("/practice?question=RK001");
    await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
    await page.getByRole("button", { name: "提交答案", exact: true }).click();
    await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
    await page.goto("/cases/C01");
    await answerCase(page, "C01", "alternate");
    await page.goto("/essays/E01");
    await page.getByRole("button", { name: "新建项目素材" }).click();
    await page.getByRole("textbox", { name: "项目名称", exact: true }).fill("发布升级审计的测试素材");
    await page.getByRole("textbox", { name: "我的论文提纲" }).fill("旧版本提纲应原样保留");
    await page.getByRole("textbox", { name: "我的论文正文" }).fill("旧版本正文和真实输入时间戳应原样保留");
    await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe("旧版本正文和真实输入时间戳应原样保留");
    await page.goto("/learn/K002");
    await page.getByRole("button", { name: /开始闭卷自测/ }).click();
    await page.getByRole("textbox", { name: "闭卷回答" }).fill("旧版本未提交闭卷草稿");
    await expect.poll(async () => (await records(page, "learningDrafts"))[0]?.recall).toBe("旧版本未提交闭卷草稿");
    await page.goto("/mock");
    await page.getByRole("button", { name: "开始本场完整模考" }).click();
    await page.getByRole("button", { name: "收藏本题", exact: true }).click();
    await page.getByRole("button", { name: /D.*输入输出数据流平衡/ }).click();
    await expect(page.getByRole("heading", { name: "选择卷 · 已答 1 / 75题" })).toBeVisible();
    await page.goto("/progress");
    await page.getByLabel("学习启动日期").fill("2026-10-10");
    await page.getByRole("button", { name: "保存启动日" }).click();
    await expect(page.getByRole("status")).toContainText("启动日已保存");
    const before = (await downloadBackup(page)).backup;
    for (const [table, rows] of Object.entries(before.data)) expect((rows as unknown[]).length, table).toBeGreaterThan(0);
    expect(before.data.cardAttempts[0].questionAttemptId).toBe(before.data.questionAttempts.find((a: any) => a.questionId === "RK027").id);
    writeFileSync(`${root}/before.json`, JSON.stringify(before, null, 2));
    console.log(JSON.stringify({ phase: mode, contentVersion: before.contentVersion, nonemptyTables: Object.keys(before.data).length, result: "PASS" }));
  } else {
    const before = JSON.parse(readFileSync(`${root}/before.json`, "utf8"));
    await page.goto("/sources");
    await expect(page.getByRole("button", { name: "更新并重新载入" })).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "更新并重新载入" }).click();
    await expect(page.getByText(/版本 2026.10.11.1/)).toBeVisible({ timeout: 15000 });
    await page.goto("/progress");
    const after = (await downloadBackup(page)).backup;
    expect(after.data).toEqual(before.data);
    await page.goto("/learn/K014");
    await expect(page.getByText(/K014 \/ A 级 \/ 初步掌握/)).toBeVisible();
    await page.getByRole("button", { name: /开始闭卷自测/ }).click();
    await page.getByRole("textbox", { name: "闭卷回答" }).fill("PO管理待办优先级；Scrum Master促进流程；团队交付增量。");
    await page.getByRole("button", { name: "揭示对照要点" }).click();
    await expect(page.locator(".answer h2")).toContainText("RK039");
    const result = {
      result: "PASS", verifiedAt: new Date().toISOString(), oldContentVersion: before.contentVersion,
      newContentVersion: after.contentVersion, everyTableUnchanged: true,
      counts: Object.fromEntries(Object.entries(after.data).map(([table, rows]) => [table, (rows as unknown[]).length])),
      previousKnowledgeAttemptPreserved: "K014 / RK027", nextValidationQuestion: "RK039",
    };
    writeFileSync("docs/audit/final/staging-upgrade.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  }
} finally { await context.close(); }
