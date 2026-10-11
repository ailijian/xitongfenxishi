# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exam-backup.spec.ts >> 重复模考时，正常收藏入口不能在本场交卷前打开同卷答案
- Location: tests/audit/exam-backup.spec.ts:4:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByText(/正确答案 D/)
Expected: 0
Received: 1
Timeout:  2000ms

Call log:
  - Expect "toHaveCount" getByText(/正确答案 D/) with timeout 2000ms
  - waiting for getByText(/正确答案 D/)
    21 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - link "跳到主要内容" [ref=f2e3] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f2e4]:
    - banner [ref=f2e5]:
      - link "软考冲刺 系统分析师" [ref=f2e6] [cursor=pointer]:
        - /url: /
        - generic [aria-hidden] [ref=f2e7]: 析
        - generic [ref=f2e8]:
          - text: 软考冲刺
          - generic [ref=f2e9]: 系统分析师
      - generic [ref=f2e10]: 2026 · 原创资料
    - main [ref=f2e11]:
      - generic [ref=f2e12]:
        - text: PRACTICE / 原创模拟
        - heading "收藏练习" [level=1] [ref=f2e13]
        - paragraph [ref=f2e14]: 答题自动保存，提交后可看解析。错题保留历史，二刷答对后移出待复习列表。
      - generic [ref=f2e15]:
        - link "章节75题" [ref=f2e16] [cursor=pointer]:
          - /url: /practice
        - link "错题 0" [ref=f2e17] [cursor=pointer]:
          - /url: /practice?mode=wrong
      - generic [ref=f2e18]:
        - link "收藏 1" [ref=f2e19] [cursor=pointer]:
          - /url: /practice?mode=favorites
        - link "独立完整模考75题 →" [ref=f2e20] [cursor=pointer]:
          - /url: /mock
      - generic [ref=f2e21]:
        - text: 按模块练习
        - combobox "按模块练习" [ref=f2e22]:
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
      - generic [ref=f2e23]:
        - generic [ref=f2e24]: RK076
        - generic [ref=f2e25]: 1 / 1
        - combobox "跳至题号" [ref=f2e26]:
          - option "RK076 · 已选" [selected]
      - generic [ref=f2e27]:
        - paragraph [ref=f2e28]: 需求工程与UML
        - heading "在结构化分析中，0层DFD与其下一层分解图的关系应满足？" [level=2] [ref=f2e29]
        - button "A 存储名称一样即可" [disabled] [ref=f2e30]:
          - generic [ref=f2e31]: A
          - text: 存储名称一样即可
        - button "B 所有加工数相同" [disabled] [ref=f2e32]:
          - generic [ref=f2e33]: B
          - text: 所有加工数相同
        - button "C 图形布局一致" [disabled] [ref=f2e34]:
          - generic [ref=f2e35]: C
          - text: 图形布局一致
        - button "D 输入输出数据流平衡" [disabled] [ref=f2e36]:
          - generic [ref=f2e37]: D
          - text: 输入输出数据流平衡
        - button "已提交答案" [disabled] [ref=f2e38]
        - generic [ref=f2e39]:
          - generic [ref=f2e40]: 回答正确
          - strong [ref=f2e41]: 正确答案 D
          - paragraph [ref=f2e42]: 父加工对外输入输出与子图整体对外输入输出应保持平衡。
          - paragraph [ref=f2e43]: 来源：答案与解析 · 第 80 行
        - button "取消收藏" [ref=f2e44] [cursor=pointer]
        - paragraph [ref=f2e45]: 来源：综合模考75 · 第 5 行
      - generic [ref=f2e46]:
        - button "上一题" [disabled] [ref=f2e47]
        - button "下一题 →" [disabled] [ref=f2e48]
      - paragraph [ref=f2e49]: 本轮已答 1 / 1。退出可继续；需要二刷时重开本轮。
      - button "重开本轮练习" [ref=f2e50] [cursor=pointer]
    - region "离线学习状态" [ref=f2e51]:
      - paragraph [ref=f2e52]:
        - strong [ref=f2e53]: 已联网
        - text: · 全部核心资料已缓存，可离线学习
      - button "请求浏览器持久保存本设备数据" [ref=f2e54] [cursor=pointer]
    - contentinfo [ref=f2e55]: 软考冲刺 · 系统分析师知识点掌握驱动 · 原创模拟训练
  - navigation "主导航" [ref=f2e56]:
    - link "今日" [ref=f2e57] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=f2e58]: ⌂
      - text: 今日
    - link "知识" [ref=f2e59] [cursor=pointer]:
      - /url: /learn
      - generic [aria-hidden] [ref=f2e60]: ▤
      - text: 知识
    - link "刷题" [ref=f2e61] [cursor=pointer]:
      - /url: /practice
      - generic [aria-hidden] [ref=f2e62]: ✓
      - text: 刷题
    - link "实战" [ref=f2e63] [cursor=pointer]:
      - /url: /cases
      - generic [aria-hidden] [ref=f2e64]: ◇
      - text: 实战
    - link "我的" [ref=f2e65] [cursor=pointer]:
      - /url: /progress
      - generic [aria-hidden] [ref=f2e66]: ◎
      - text: 我的
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { answerCase, downloadBackup, questions, records, selfTest } from "./helpers";
  3   | 
  4   | test("重复模考时，正常收藏入口不能在本场交卷前打开同卷答案", async ({ page }) => {
  5   |   await page.goto("/mock");
  6   |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  7   |   await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  8   |   await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  9   |   await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  10  |   await expect(page.getByText(/正确答案 D/)).toBeVisible();
  11  |   await page.goto("/mock");
  12  |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  13  |   await expect(page.getByRole("heading", { name: "选择卷 · 已答 0 / 75题" })).toBeVisible();
  14  |   await page.goto("/practice?mode=favorites");
  15  |   // A previous submitted run must not unlock this active run's answer through practice.
  16  |   const gate = page.getByText(/模考收藏题在整卷交卷后开放/);
  17  |   const q = questions.find((q) => q.id === "RK076")!;
  18  |   const option = page.getByRole("button", { name: `${q.answer} ${q.options[q.answer]}`, exact: true });
  19  |   await expect(gate.or(option)).toBeVisible();
  20  |   if (await gate.isVisible()) {
  21  |     await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  22  |     return;
  23  |   }
  24  |   await option.click();
  25  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  26  |   await expect(page.locator(".answer")).toBeVisible();
> 27  |   await expect(page.getByText(/正确答案 D/)).toHaveCount(0, { timeout: 2000 });
      |                                          ^ Error: expect(locator).toHaveCount(expected) failed
  28  | });
  29  | 
  30  | test("单选错题全过程，75题计分，案例采分及论文快照，12类JSON清空恢复逐字段一致", async ({ page }) => {
  31  |   test.setTimeout(240000);
  32  |   await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  33  |   await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  34  |   await page.goto("/learn/K001");
  35  |   await selfTest(page);
  36  |   await page.goto("/practice?question=RK001");
  37  |   await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  38  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  39  |   await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
  40  |   await expect(page.getByText(/正确答案 A/)).toBeVisible();
  41  |   await page.getByRole("link", { name: "错题 1", exact: true }).click();
  42  |   await page.getByRole("button", { name: /A.*无法直接验证是否满足/ }).click();
  43  |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  44  |   await expect(page.getByRole("link", { name: "错题 0", exact: true })).toBeVisible();
  45  |   const history = await records(page, "questionAttempts");
  46  |   expect(history.filter((a) => a.questionId === "RK001").sort((a, b) => a.order - b.order).map((a) => a.correct)).toEqual([false, true]);
  47  | 
  48  |   await page.goto("/mock");
  49  |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  50  |   await expect(page.getByRole("heading", { name: "本场综合模考" })).toBeVisible();
  51  |   const runURL = page.url();
  52  |   const run = new URL(runURL).searchParams.get("run")!;
  53  |   await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  54  |   await page.goto("/practice?mode=favorites");
  55  |   await expect(page.getByText(/模考收藏题在整卷交卷后开放/)).toBeVisible();
  56  |   await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  57  |   await page.goto(runURL);
  58  |   const mock = questions.filter((q) => q.set === "mock");
  59  |   expect(mock).toHaveLength(75);
  60  |   for (let i = 0; i < mock.length; i++) {
  61  |     const q = mock[i];
  62  |     await expect(page.getByText(`第 ${i + 1} / 75 题 · ${q.id} · 原创模拟`)).toBeVisible();
  63  |     await expect(page.locator(".answer")).toHaveCount(0);
  64  |     const selected = i < 50 ? q.answer : (q.answer === "A" ? "B" : "A");
  65  |     const option = page.getByRole("button", { name: `${selected} ${q.options[selected]}`, exact: true });
  66  |     await option.click();
  67  |     await expect(option).toHaveClass(/selected/);
  68  |     if (i === 34) {
  69  |       await page.reload();
  70  |       await expect(option).toHaveClass(/selected/);
  71  |     }
  72  |     if (i < 74) await page.getByRole("button", { name: "下一题", exact: true }).click();
  73  |   }
  74  |   await expect(page.getByRole("heading", { name: "选择卷 · 已答 75 / 75题" })).toBeVisible();
  75  |   await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  76  |   await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  77  |   await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  78  |   await expect(page.getByRole("heading", { name: "选择卷 · 50 / 75分" })).toBeVisible();
  79  |   await expect(page.getByText(/正确答案 [ABCD]/)).toBeVisible();
  80  |   const attempts = await records(page, "questionAttempts");
  81  |   expect(attempts.filter((a) => a.set === "mock")).toHaveLength(75);
  82  |   expect(attempts.filter((a) => a.set === "mock" && a.correct)).toHaveLength(50);
  83  |   await page.evaluate(() => window.scrollTo(0, 0));
  84  |   await page.screenshot({ path: "docs/audit/screenshots/mock-390.png" });
  85  | 
  86  |   for (const id of ["C01", "C04", "C06"]) {
  87  |     await page.goto(`/cases/${id}?exam=${run}`);
  88  |     const score = await answerCase(page, id, "alternate");
  89  |     await page.reload();
  90  |     await expect(page.getByRole("heading", { name: "训练历史 · 1次" })).toBeVisible();
  91  |     const record = (await records(page, "caseAttempts")).find((a) => a.caseId === id)!;
  92  |     expect(record.selfScore).toBe(score);
  93  |     if (id === "C01") {
  94  |       await page.getByRole("heading", { name: `本次自评 ${score} / 25 分` }).scrollIntoViewIfNeeded();
  95  |       await page.screenshot({ path: "docs/audit/screenshots/case-390.png" });
  96  |     }
  97  |   }
  98  |   await page.goto(`/essays/E01?exam=${run}`);
  99  |   await page.getByRole("button", { name: "新建项目素材" }).click();
  100 |   await page.getByRole("textbox", { name: "项目名称", exact: true }).fill("审计项目素材（非学习范文）");
  101 |   await page.getByRole("textbox", { name: "本人真实职责" }).fill("用于验证本地持久化的测试输入");
  102 |   await page.getByRole("textbox", { name: "我的论文提纲" }).fill("审计提纲：背景、约束、权衡、验证与反思");
  103 |   const body = "审计正文：用于验证逐次保存、刷新恢复及提交快照。";
  104 |   await page.getByRole("textbox", { name: "我的论文正文" }).fill(body);
  105 |   await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(body);
  106 |   await page.reload();
  107 |   await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(body);
  108 |   for (const box of await page.locator("main input[type=checkbox]").all()) await box.check();
  109 |   await page.getByRole("button", { name: "确认完整论文并提交本场模考" }).click();
  110 |   await expect(page.getByRole("status")).toContainText("保存快照");
  111 |   await page.getByRole("textbox", { name: "我的论文正文" }).fill(`${body}提交后编辑保留。`);
  112 |   await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(`${body}提交后编辑保留。`);
  113 |   expect((await records(page, "exams"))[0].essaySnapshot.body).toBe(body);
  114 |   await page.getByRole("heading", { name: "正文草稿" }).scrollIntoViewIfNeeded();
  115 |   await page.screenshot({ path: "docs/audit/screenshots/essay-390.png" });
  116 |   await page.goto("/learn/K002");
  117 |   await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  118 |   await page.getByRole("textbox", { name: "闭卷回答" }).fill("未提交闭卷回答也应随备份恢复");
  119 |   await expect.poll(async () => (await records(page, "learningDrafts"))[0]?.recall).toBe("未提交闭卷回答也应随备份恢复");
  120 |   await page.goto("/progress");
  121 |   await page.getByLabel("学习启动日期").fill("2026-10-10");
  122 |   await page.getByRole("button", { name: "保存启动日" }).click();
  123 |   await expect(page.getByRole("status")).toContainText("启动日已保存");
  124 |   const before = await downloadBackup(page);
  125 |   for (const [table, rows] of Object.entries(before.backup.data)) expect((rows as any[]).length, table).toBeGreaterThan(0);
  126 |   expect(Object.keys(before.backup.data)).toHaveLength(12);
  127 |   await page.getByRole("button", { name: "重置学习数据…" }).click();
```