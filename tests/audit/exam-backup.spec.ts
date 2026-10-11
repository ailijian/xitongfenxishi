import { test, expect } from "@playwright/test";
import { answerCase, downloadBackup, questions, records, selfTest } from "./helpers";
const screenshots = process.env.AUDIT_SCREENSHOTS || "docs/audit/screenshots";

test("重复模考时，正常收藏入口不能在本场交卷前打开同卷答案", async ({ page }) => {
  await page.goto("/mock");
  await page.getByRole("button", { name: "开始本场完整模考" }).click();
  await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  await expect(page.getByRole("button", { name: "取消收藏", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  await expect(page.getByText(/正确答案 D/)).toBeVisible();
  await page.goto("/mock");
  await page.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(page.getByRole("heading", { name: "选择卷 · 已答 0 / 75题" })).toBeVisible();
  await page.goto("/practice?mode=favorites");
  // A previous submitted run must not unlock this active run's answer through practice.
  const gate = page.getByText(/模考收藏题在整卷交卷后开放/);
  const q = questions.find((q) => q.id === "RK076")!;
  const option = page.getByRole("button", { name: `${q.answer} ${q.options[q.answer]}`, exact: true });
  await expect(gate.or(option)).toBeVisible();
  if (await gate.isVisible()) {
    await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
    return;
  }
  await option.click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".answer")).toBeVisible();
  await expect(page.getByText(/正确答案 D/)).toHaveCount(0, { timeout: 2000 });
});

test("单选错题全过程，75题计分，案例采分及论文快照，12类JSON清空恢复逐字段一致", async ({ page }) => {
  test.setTimeout(240000);
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/learn/K001");
  await selfTest(page);
  await page.goto("/practice?question=RK001");
  await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
  await expect(page.getByText(/正确答案 A/)).toBeVisible();
  await page.getByRole("link", { name: "错题 1", exact: true }).click();
  await page.getByRole("button", { name: /A.*无法直接验证是否满足/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByRole("link", { name: "错题 0", exact: true })).toBeVisible();
  const history = await records(page, "questionAttempts");
  expect(history.filter((a) => a.questionId === "RK001").sort((a, b) => a.order - b.order).map((a) => a.correct)).toEqual([false, true]);

  await page.goto("/mock");
  await page.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(page.getByRole("heading", { name: "本场综合模考" })).toBeVisible();
  const runURL = page.url();
  const run = new URL(runURL).searchParams.get("run")!;
  await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  await expect(page.getByRole("button", { name: "取消收藏", exact: true })).toBeVisible();
  await page.goto("/practice?mode=favorites");
  await expect(page.getByText(/模考收藏题在整卷交卷后开放/)).toBeVisible();
  await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  await page.goto(runURL);
  const mock = questions.filter((q) => q.set === "mock");
  expect(mock).toHaveLength(75);
  for (let i = 0; i < mock.length; i++) {
    const q = mock[i];
    await expect(page.getByText(`第 ${i + 1} / 75 题 · ${q.id} · 原创模拟`)).toBeVisible();
    await expect(page.locator(".answer")).toHaveCount(0);
    const selected = i < 50 ? q.answer : (q.answer === "A" ? "B" : "A");
    const option = page.getByRole("button", { name: `${selected} ${q.options[selected]}`, exact: true });
    await option.click();
    await expect(option).toHaveClass(/selected/);
    if (i === 34) {
      await page.reload();
      await expect(option).toHaveClass(/selected/);
    }
    if (i < 74) await page.getByRole("button", { name: "下一题", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "选择卷 · 已答 75 / 75题" })).toBeVisible();
  await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  await expect(page.getByRole("heading", { name: "选择卷 · 50 / 75分" })).toBeVisible();
  await expect(page.getByText(/正确答案 [ABCD]/)).toBeVisible();
  const attempts = await records(page, "questionAttempts");
  expect(attempts.filter((a) => a.set === "mock")).toHaveLength(75);
  expect(attempts.filter((a) => a.set === "mock" && a.correct)).toHaveLength(50);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${screenshots}/mock-390.png` });

  for (const id of ["C01", "C04", "C06"]) {
    await page.goto(`/cases/${id}?exam=${run}`);
    const score = await answerCase(page, id, "alternate");
    await page.reload();
    await expect(page.getByRole("heading", { name: "训练历史 · 1次" })).toBeVisible();
    const record = (await records(page, "caseAttempts")).find((a) => a.caseId === id)!;
    expect(record.selfScore).toBe(score);
    if (id === "C01") {
      await page.getByRole("heading", { name: `本次自评 ${score} / 25 分` }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${screenshots}/case-390.png` });
    }
  }
  await page.goto(`/essays/E01?exam=${run}`);
  await page.getByRole("button", { name: "新建项目素材" }).click();
  await page.getByRole("textbox", { name: "项目名称", exact: true }).fill("审计项目素材（非学习范文）");
  await page.getByRole("textbox", { name: "本人真实职责" }).fill("用于验证本地持久化的测试输入");
  await page.getByRole("textbox", { name: "我的论文提纲" }).fill("审计提纲：背景、约束、权衡、验证与反思");
  const body = "审计正文：用于验证逐次保存、刷新恢复及提交快照。";
  await page.getByRole("textbox", { name: "我的论文正文" }).fill(body);
  await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(body);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(body);
  for (const box of await page.locator("main input[type=checkbox]").all()) await box.check();
  await page.getByRole("button", { name: "确认完整论文并提交本场模考" }).click();
  await expect(page.getByRole("status")).toContainText("保存快照");
  await page.getByRole("textbox", { name: "我的论文正文" }).fill(`${body}提交后编辑保留。`);
  await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(`${body}提交后编辑保留。`);
  expect((await records(page, "exams"))[0].essaySnapshot.body).toBe(body);
  await page.getByRole("heading", { name: "正文草稿" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${screenshots}/essay-390.png` });
  await page.goto("/learn/K002");
  await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  await page.getByRole("textbox", { name: "闭卷回答" }).fill("未提交闭卷回答也应随备份恢复");
  await expect.poll(async () => (await records(page, "learningDrafts"))[0]?.recall).toBe("未提交闭卷回答也应随备份恢复");
  await page.goto("/progress");
  await page.getByLabel("学习启动日期").fill("2026-10-10");
  await page.getByRole("button", { name: "保存启动日" }).click();
  await expect(page.getByRole("status")).toContainText("启动日已保存");
  const before = await downloadBackup(page);
  for (const [table, rows] of Object.entries(before.backup.data)) expect((rows as any[]).length, table).toBeGreaterThan(0);
  expect(Object.keys(before.backup.data)).toHaveLength(12);
  await page.getByRole("button", { name: "重置学习数据…" }).click();
  expect((await records(page, "exams")).length).toBe(1);
  await page.getByRole("button", { name: "再次确认，清空全部学习数据" }).click();
  await expect(page.getByRole("status").filter({ hasText: "已重置" })).toBeVisible();
  for (const table of Object.keys(before.backup.data)) expect(await records(page, table), table).toEqual([]);
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(before.path);
  await expect(page.getByRole("heading", { name: "校验通过 · 恢复预览" })).toBeVisible();
  expect(await records(page, "cards")).toEqual([]);
  await page.getByRole("button", { name: "准备恢复此备份" }).click();
  expect(await records(page, "cards")).toEqual([]);
  await page.getByRole("button", { name: "确认替换并恢复" }).click();
  await expect(page.getByRole("status").filter({ hasText: "完整恢复" })).toBeVisible();
  const after = await downloadBackup(page);
  expect(after.backup.data).toEqual(before.backup.data);
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles({ name: "damaged.json", mimeType: "application/json", buffer: Buffer.from("{invalid") });
  await expect(page.getByRole("alert")).toContainText("原数据未改动");
  expect((await downloadBackup(page)).backup.data).toEqual(before.backup.data);
  await page.screenshot({ path: `${screenshots}/progress-390.png` });
});
