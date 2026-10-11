# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: training.spec.ts >> 案例按原文自评，历史与论文项目素材重启仍保存
- Location: tests/e2e/training.spec.ts:36:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: 'C01-Q1 我的独立回答' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "跳到主要内容" [ref=e3] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - link "软考冲刺 系统分析师" [ref=e6] [cursor=pointer]:
        - /url: /
        - generic [aria-hidden] [ref=e7]: 析
        - generic [ref=e8]:
          - text: 软考冲刺
          - generic [ref=e9]: 系统分析师
      - generic [ref=e10]: 2026 · 原创资料
    - main [ref=e11]:
      - link "← 案例训练" [ref=e12] [cursor=pointer]:
        - /url: /cases
      - generic [ref=e13]:
        - text: C01 / 原创模拟 / 25分
        - heading "AI线索平台用例与顺序图" [level=1] [ref=e14]
        - paragraph [ref=e15]: 需求/UML
      - generic [ref=e16]:
        - heading "题干" [level=2] [ref=e17]
        - paragraph [ref=e18]: 某企业建设线索管理平台。访客提交咨询表单形成线索；系统先去重，再按地区和客户经理负荷自动分派。客户经理登录查看分配结果，跟进后将线索状态从“待跟进”变成“已联系/已成交”。若线索重复或客户已拉黑，则拒绝入库。
        - paragraph [ref=e19]: 来源：05｜案例分析专项 > C01｜AI线索平台用例与顺序图（需求/UML / A）
      - generic [ref=e20]:
        - group [ref=e21]:
          - generic "识别3个参与者、5个关键用例；说明“线索入库”和“线索去重”应采用何种用例关系。 · 8分" [ref=e22] [cursor=pointer]
          - generic [ref=e23]:
            - text: C01-Q1 我的独立回答
            - textbox "C01-Q1 我的独立回答" [ref=e24]
        - group [ref=e25]:
          - generic "写出“提交表单→去重→分派→通知”的顺序图文字消息序列，说明失败分支。 · 9分" [ref=e26] [cursor=pointer]
          - generic [ref=e27]:
            - text: C01-Q2 我的独立回答
            - textbox "C01-Q2 我的独立回答" [ref=e28]
        - group [ref=e29]:
          - generic "提出4条可测量的非功能需求并说明如何建立需求追踪。 · 8分" [ref=e30] [cursor=pointer]
          - generic [ref=e31]:
            - text: C01-Q3 我的独立回答
            - textbox "C01-Q3 我的独立回答" [ref=e32]
      - button "作答完成，揭示参考答案" [ref=e33] [cursor=pointer]
      - generic [ref=e34]:
        - heading "训练历史 · 0次" [level=2] [ref=e35]
        - paragraph [ref=e36]: 草稿自动保存在本设备，保存训练记录后仍可继续修改草稿。
        - paragraph [ref=e37]: 草稿已保存：20:24:23
    - region "离线学习状态" [ref=e38]:
      - paragraph [ref=e39]:
        - strong [ref=e40]: 已联网
        - text: · 开发预览；离线缓存需构建版本
      - button "请求浏览器持久保存本设备数据" [ref=e41] [cursor=pointer]
    - contentinfo [ref=e42]: 软考冲刺 · 系统分析师知识点掌握驱动 · 原创模拟训练
  - navigation "主导航" [ref=e43]:
    - link "今日" [ref=e44] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=e45]: ⌂
      - text: 今日
    - link "知识" [ref=e46] [cursor=pointer]:
      - /url: /learn
      - generic [aria-hidden] [ref=e47]: ▤
      - text: 知识
    - link "刷题" [ref=e48] [cursor=pointer]:
      - /url: /practice
      - generic [aria-hidden] [ref=e49]: ✓
      - text: 刷题
    - link "实战" [ref=e50] [cursor=pointer]:
      - /url: /cases
      - generic [aria-hidden] [ref=e51]: ◇
      - text: 实战
    - link "我的" [ref=e52] [cursor=pointer]:
      - /url: /progress
      - generic [aria-hidden] [ref=e53]: ◎
      - text: 我的
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { readFileSync } from "node:fs";
  3   | import type { Content } from "../../src/domain/content-schema";
  4   | const content = {
  5   |   questions: JSON.parse(
  6   |     readFileSync(
  7   |       new URL("../../src/data/questions.json", import.meta.url),
  8   |       "utf8",
  9   |     ),
  10  |   ),
  11  |   cases: JSON.parse(
  12  |     readFileSync(new URL("../../src/data/cases.json", import.meta.url), "utf8"),
  13  |   ),
  14  | } as Pick<Content, "questions" | "cases">;
  15  | async function answerCase(page: import("@playwright/test").Page, id: string) {
  16  |   const c = content.cases.find((c) => c.id === id)!;
  17  |   for (const q of c.questions)
  18  |     await page
  19  |       .getByRole("textbox", { name: `${q.id} 我的独立回答` })
> 20  |       .fill("自动化验收输入：这是独立作答草稿，仅用于验证保存和自评交互。");
      |        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  21  |   await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  22  |   await expect(
  23  |     page.getByRole("heading", { name: "参考答案", exact: true }),
  24  |   ).toHaveCount(3);
  25  |   const boxes = page.getByRole("checkbox");
  26  |   await expect(boxes).toHaveCount(
  27  |     c.questions.flatMap((q) => q.scoringRubric).length,
  28  |   );
  29  |   for (const box of await boxes.all()) await box.check();
  30  |   await expect(
  31  |     page.getByRole("heading", { name: "本次自评 25 / 25 分" }),
  32  |   ).toBeVisible();
  33  |   await page.getByRole("button", { name: "保存本次案例训练" }).click();
  34  |   await expect(page.getByRole("status")).toContainText("训练记录已保存");
  35  | }
  36  | test("案例按原文自评，历史与论文项目素材重启仍保存", async ({ page }) => {
  37  |   await page.goto("/cases/C01");
  38  |   await expect(
  39  |     page.getByRole("heading", { name: "参考答案", exact: true }),
  40  |   ).toHaveCount(0);
  41  |   await answerCase(page, "C01");
  42  |   await page
  43  |     .getByRole("heading", { name: "本次自评 25 / 25 分" })
  44  |     .scrollIntoViewIfNeeded();
  45  |   await page.screenshot({ path: "docs/screenshots/final-case.png" });
  46  |   await page.reload();
  47  |   await expect(
  48  |     page.getByRole("heading", { name: "训练历史 · 1次" }),
  49  |   ).toBeVisible();
  50  |   await page.goto("/essays/E01");
  51  |   await page.getByRole("button", { name: "新建项目素材" }).click();
  52  |   await page
  53  |     .getByRole("textbox", { name: "项目名称", exact: true })
  54  |     .fill("验收测试项目");
  55  |   await page
  56  |     .getByRole("textbox", { name: "本人真实职责" })
  57  |     .fill("测试输入：只用于浏览器验收，不作为学习示范经历。");
  58  |   await page
  59  |     .getByRole("textbox", { name: "我的论文提纲" })
  60  |     .fill("问题→分析→方案取舍→实施与验证→反思");
  61  |   await page
  62  |     .getByRole("textbox", { name: "我的论文正文" })
  63  |     .fill("自动化验收草稿，验证浏览器重新载入后正文保留。");
  64  |   await expect(page.locator(".word-count")).toContainText("正文 23 字");
  65  |   await page.goto("/progress");
  66  |   await page.goto("/essays/E01");
  67  |   await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(
  68  |     "自动化验收草稿，验证浏览器重新载入后正文保留。",
  69  |   );
  70  |   await expect(
  71  |     page.getByRole("textbox", { name: "项目名称", exact: true }),
  72  |   ).toHaveValue("验收测试项目");
  73  |   await page
  74  |     .getByRole("heading", { name: "正文草稿" })
  75  |     .scrollIntoViewIfNeeded();
  76  |   await page
  77  |     .getByRole("heading", { name: "正文草稿" })
  78  |     .evaluate((el) =>
  79  |       window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24),
  80  |     );
  81  |   await page.screenshot({ path: "docs/screenshots/final-essay.png" });
  82  |   const download = page.waitForEvent("download");
  83  |   await page.getByRole("button", { name: "导出 TXT" }).click();
  84  |   expect((await download).suggestedFilename()).toBe("E01-论文.txt");
  85  | });
  86  | test("75题整卷不泄漏答案，可跳题退出继续，三案例及论文完成一场", async ({
  87  |   page,
  88  | }) => {
  89  |   test.setTimeout(180000);
  90  |   await page.goto("/mock");
  91  |   await page.getByRole("button", { name: "开始本场完整模考" }).click();
  92  |   await expect(
  93  |     page.getByRole("heading", { name: "本场综合模考" }),
  94  |   ).toBeVisible();
  95  |   const runUrl = page.url();
  96  |   const questions = content.questions.filter((q) => q.set === "mock");
  97  |   for (let i = 0; i < questions.length; i++) {
  98  |     const q = questions[i];
  99  |     await expect(
  100 |       page.getByText(`第 ${i + 1} / 75 题 · ${q.id} · 原创模拟`),
  101 |     ).toBeVisible();
  102 |     await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
  103 |     if (i === 0)
  104 |       expect(
  105 |         await page.locator(".option-button").evaluateAll((buttons) =>
  106 |           buttons.every((button) => {
  107 |             const bounds = button.getBoundingClientRect(),
  108 |               walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  109 |             let node;
  110 |             while ((node = walker.nextNode())) {
  111 |               if (!node.textContent?.trim()) continue;
  112 |               const range = document.createRange();
  113 |               range.selectNodeContents(node);
  114 |               const rect = range.getBoundingClientRect();
  115 |               if (
  116 |                 rect.bottom > bounds.bottom + 1 ||
  117 |                 rect.right > bounds.right + 1 ||
  118 |                 rect.left < bounds.left - 1
  119 |               )
  120 |                 return false;
```