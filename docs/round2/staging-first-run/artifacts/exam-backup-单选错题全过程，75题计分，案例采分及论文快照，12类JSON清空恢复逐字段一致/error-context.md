# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exam-backup.spec.ts >> 单选错题全过程，75题计分，案例采分及论文快照，12类JSON清空恢复逐字段一致
- Location: tests/audit/exam-backup.spec.ts:31:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/模考收藏题在整卷交卷后开放/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/模考收藏题在整卷交卷后开放/) with timeout 5000ms
  - waiting for getByText(/模考收藏题在整卷交卷后开放/)

```

```yaml
- link "跳到主要内容":
  - /url: "#main"
- banner:
  - link "软考冲刺 系统分析师":
    - /url: /
  - text: 2026 · 原创资料
- main:
  - text: PRACTICE / 原创模拟
  - heading "收藏练习" [level=1]
  - paragraph: 答题自动保存，提交后可看解析。错题保留历史，二刷答对后移出待复习列表。
  - link "章节75题":
    - /url: /practice
  - link "错题 0":
    - /url: /practice?mode=wrong
  - link "收藏 0":
    - /url: /practice?mode=favorites
  - link "独立完整模考75题 →":
    - /url: /mock
  - text: 按模块练习
  - combobox "按模块练习":
    - option "全部模块" [selected]
    - option "需求工程与UML"
    - option "系统规划与企业信息化"
    - option "软件工程与开发方法"
    - option "架构与设计模式"
    - option "数据库与数据建模"
    - option "软件测试与质量"
    - option "网络分布式与高可用"
    - option "安全合规与标准"
    - option "计算机系统与操作系统"
    - option "工程数学与项目管理"
    - option "云原生微服务与AI"
    - option "系统实施运维与英语"
  - heading "暂无可练习题目" [level=2]
  - button "刷新本轮题目"
- region "离线学习状态":
  - paragraph:
    - strong: 已联网
    - text: · 全部核心资料已缓存，可离线学习
  - button "请求浏览器持久保存本设备数据"
- contentinfo: 软考冲刺 · 系统分析师 知识点掌握驱动 · 原创模拟训练
- navigation "主导航":
  - link "今日":
    - /url: /
  - link "知识":
    - /url: /learn
  - link "刷题":
    - /url: /practice
  - link "实战":
    - /url: /cases
  - link "我的":
    - /url: /progress
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { answerCase, downloadBackup, questions, records, selfTest } from "./helpers";
  3   | const screenshots = process.env.AUDIT_SCREENSHOTS || "docs/audit/screenshots";
  4   | 
  5   | test("重复模考时，正常收藏入口不能在本场交卷前打开同卷答案", async ({ page }) => {
  6   |   await page.goto("/mock");
  7   |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  8   |   await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  9   |   await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  10  |   await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  11  |   await expect(page.getByText(/正确答案 D/)).toBeVisible();
  12  |   await page.goto("/mock");
  13  |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  14  |   await expect(page.getByRole("heading", { name: "选择卷 · 已答 0 / 75题" })).toBeVisible();
  15  |   await page.goto("/practice?mode=favorites");
  16  |   // A previous submitted run must not unlock this active run's answer through practice.
  17  |   const gate = page.getByText(/模考收藏题在整卷交卷后开放/);
  18  |   const q = questions.find((q) => q.id === "RK076")!;
  19  |   const option = page.getByRole("button", { name: `${q.answer} ${q.options[q.answer]}`, exact: true });
  20  |   await expect(gate.or(option)).toBeVisible();
  21  |   if (await gate.isVisible()) {
  22  |     await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  23  |     return;
  24  |   }
  25  |   await option.click();
  26  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  27  |   await expect(page.locator(".answer")).toBeVisible();
  28  |   await expect(page.getByText(/正确答案 D/)).toHaveCount(0, { timeout: 2000 });
  29  | });
  30  | 
  31  | test("单选错题全过程，75题计分，案例采分及论文快照，12类JSON清空恢复逐字段一致", async ({ page }) => {
  32  |   test.setTimeout(240000);
  33  |   await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  34  |   await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  35  |   await page.goto("/learn/K001");
  36  |   await selfTest(page);
  37  |   await page.goto("/practice?question=RK001");
  38  |   await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  39  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  40  |   await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
  41  |   await expect(page.getByText(/正确答案 A/)).toBeVisible();
  42  |   await page.getByRole("link", { name: "错题 1", exact: true }).click();
  43  |   await page.getByRole("button", { name: /A.*无法直接验证是否满足/ }).click();
  44  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  45  |   await expect(page.getByRole("link", { name: "错题 0", exact: true })).toBeVisible();
  46  |   const history = await records(page, "questionAttempts");
  47  |   expect(history.filter((a) => a.questionId === "RK001").sort((a, b) => a.order - b.order).map((a) => a.correct)).toEqual([false, true]);
  48  | 
  49  |   await page.goto("/mock");
  50  |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  51  |   await expect(page.getByRole("heading", { name: "本场综合模考" })).toBeVisible();
  52  |   const runURL = page.url();
  53  |   const run = new URL(runURL).searchParams.get("run")!;
  54  |   await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  55  |   await page.goto("/practice?mode=favorites");
> 56  |   await expect(page.getByText(/模考收藏题在整卷交卷后开放/)).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  57  |   await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  58  |   await page.goto(runURL);
  59  |   const mock = questions.filter((q) => q.set === "mock");
  60  |   expect(mock).toHaveLength(75);
  61  |   for (let i = 0; i < mock.length; i++) {
  62  |     const q = mock[i];
  63  |     await expect(page.getByText(`第 ${i + 1} / 75 题 · ${q.id} · 原创模拟`)).toBeVisible();
  64  |     await expect(page.locator(".answer")).toHaveCount(0);
  65  |     const selected = i < 50 ? q.answer : (q.answer === "A" ? "B" : "A");
  66  |     const option = page.getByRole("button", { name: `${selected} ${q.options[selected]}`, exact: true });
  67  |     await option.click();
  68  |     await expect(option).toHaveClass(/selected/);
  69  |     if (i === 34) {
  70  |       await page.reload();
  71  |       await expect(option).toHaveClass(/selected/);
  72  |     }
  73  |     if (i < 74) await page.getByRole("button", { name: "下一题", exact: true }).click();
  74  |   }
  75  |   await expect(page.getByRole("heading", { name: "选择卷 · 已答 75 / 75题" })).toBeVisible();
  76  |   await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  77  |   await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  78  |   await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  79  |   await expect(page.getByRole("heading", { name: "选择卷 · 50 / 75分" })).toBeVisible();
  80  |   await expect(page.getByText(/正确答案 [ABCD]/)).toBeVisible();
  81  |   const attempts = await records(page, "questionAttempts");
  82  |   expect(attempts.filter((a) => a.set === "mock")).toHaveLength(75);
  83  |   expect(attempts.filter((a) => a.set === "mock" && a.correct)).toHaveLength(50);
  84  |   await page.evaluate(() => window.scrollTo(0, 0));
  85  |   await page.screenshot({ path: `${screenshots}/mock-390.png` });
  86  | 
  87  |   for (const id of ["C01", "C04", "C06"]) {
  88  |     await page.goto(`/cases/${id}?exam=${run}`);
  89  |     const score = await answerCase(page, id, "alternate");
  90  |     await page.reload();
  91  |     await expect(page.getByRole("heading", { name: "训练历史 · 1次" })).toBeVisible();
  92  |     const record = (await records(page, "caseAttempts")).find((a) => a.caseId === id)!;
  93  |     expect(record.selfScore).toBe(score);
  94  |     if (id === "C01") {
  95  |       await page.getByRole("heading", { name: `本次自评 ${score} / 25 分` }).scrollIntoViewIfNeeded();
  96  |       await page.screenshot({ path: `${screenshots}/case-390.png` });
  97  |     }
  98  |   }
  99  |   await page.goto(`/essays/E01?exam=${run}`);
  100 |   await page.getByRole("button", { name: "新建项目素材" }).click();
  101 |   await page.getByRole("textbox", { name: "项目名称", exact: true }).fill("审计项目素材（非学习范文）");
  102 |   await page.getByRole("textbox", { name: "本人真实职责" }).fill("用于验证本地持久化的测试输入");
  103 |   await page.getByRole("textbox", { name: "我的论文提纲" }).fill("审计提纲：背景、约束、权衡、验证与反思");
  104 |   const body = "审计正文：用于验证逐次保存、刷新恢复及提交快照。";
  105 |   await page.getByRole("textbox", { name: "我的论文正文" }).fill(body);
  106 |   await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(body);
  107 |   await page.reload();
  108 |   await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(body);
  109 |   for (const box of await page.locator("main input[type=checkbox]").all()) await box.check();
  110 |   await page.getByRole("button", { name: "确认完整论文并提交本场模考" }).click();
  111 |   await expect(page.getByRole("status")).toContainText("保存快照");
  112 |   await page.getByRole("textbox", { name: "我的论文正文" }).fill(`${body}提交后编辑保留。`);
  113 |   await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(`${body}提交后编辑保留。`);
  114 |   expect((await records(page, "exams"))[0].essaySnapshot.body).toBe(body);
  115 |   await page.getByRole("heading", { name: "正文草稿" }).scrollIntoViewIfNeeded();
  116 |   await page.screenshot({ path: `${screenshots}/essay-390.png` });
  117 |   await page.goto("/learn/K002");
  118 |   await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  119 |   await page.getByRole("textbox", { name: "闭卷回答" }).fill("未提交闭卷回答也应随备份恢复");
  120 |   await expect.poll(async () => (await records(page, "learningDrafts"))[0]?.recall).toBe("未提交闭卷回答也应随备份恢复");
  121 |   await page.goto("/progress");
  122 |   await page.getByLabel("学习启动日期").fill("2026-10-10");
  123 |   await page.getByRole("button", { name: "保存启动日" }).click();
  124 |   await expect(page.getByRole("status")).toContainText("启动日已保存");
  125 |   const before = await downloadBackup(page);
  126 |   for (const [table, rows] of Object.entries(before.backup.data)) expect((rows as any[]).length, table).toBeGreaterThan(0);
  127 |   expect(Object.keys(before.backup.data)).toHaveLength(12);
  128 |   await page.getByRole("button", { name: "重置学习数据…" }).click();
  129 |   expect((await records(page, "exams")).length).toBe(1);
  130 |   await page.getByRole("button", { name: "再次确认，清空全部学习数据" }).click();
  131 |   await expect(page.getByRole("status").filter({ hasText: "已重置" })).toBeVisible();
  132 |   for (const table of Object.keys(before.backup.data)) expect(await records(page, table), table).toEqual([]);
  133 |   await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(before.path);
  134 |   await expect(page.getByRole("heading", { name: "校验通过 · 恢复预览" })).toBeVisible();
  135 |   expect(await records(page, "cards")).toEqual([]);
  136 |   await page.getByRole("button", { name: "准备恢复此备份" }).click();
  137 |   expect(await records(page, "cards")).toEqual([]);
  138 |   await page.getByRole("button", { name: "确认替换并恢复" }).click();
  139 |   await expect(page.getByRole("status").filter({ hasText: "完整恢复" })).toBeVisible();
  140 |   const after = await downloadBackup(page);
  141 |   expect(after.backup.data).toEqual(before.backup.data);
  142 |   await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles({ name: "damaged.json", mimeType: "application/json", buffer: Buffer.from("{invalid") });
  143 |   await expect(page.getByRole("alert")).toContainText("原数据未改动");
  144 |   expect((await downloadBackup(page)).backup.data).toEqual(before.backup.data);
  145 |   await page.screenshot({ path: `${screenshots}/progress-390.png` });
  146 | });
  147 | 
```