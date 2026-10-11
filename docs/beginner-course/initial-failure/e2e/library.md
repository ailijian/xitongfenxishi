# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: library.spec.ts >> RK057补齐前置情形，案例和论文原文可访问
- Location: tests/e2e/library.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:4173/cases/C09", waiting until "load"

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
      - generic [ref=e12]:
        - text: PRACTICE / 原创模拟
        - heading "章节练习" [level=1] [ref=e13]
        - paragraph [ref=e14]: 答题自动保存，提交后可看解析。错题保留历史，二刷答对后移出待复习列表。
      - generic [ref=e15]:
        - link "章节75题" [ref=e16] [cursor=pointer]:
          - /url: /practice
        - link "错题 0" [ref=e17] [cursor=pointer]:
          - /url: /practice?mode=wrong
      - generic [ref=e18]:
        - link "收藏 0" [ref=e19] [cursor=pointer]:
          - /url: /practice?mode=favorites
        - link "独立完整模考75题 →" [ref=e20] [cursor=pointer]:
          - /url: /mock
      - generic [ref=e21]:
        - text: 按模块练习
        - combobox "按模块练习" [ref=e22]:
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
      - generic [ref=e23]:
        - generic [ref=e24]: RK057
        - generic [ref=e25]: 57 / 75
        - combobox "跳至题号" [ref=e26]:
          - option "RK001"
          - option "RK002"
          - option "RK003"
          - option "RK004"
          - option "RK005"
          - option "RK006"
          - option "RK007"
          - option "RK008"
          - option "RK009"
          - option "RK010"
          - option "RK011"
          - option "RK012"
          - option "RK013"
          - option "RK014"
          - option "RK015"
          - option "RK016"
          - option "RK017"
          - option "RK018"
          - option "RK019"
          - option "RK020"
          - option "RK021"
          - option "RK022"
          - option "RK023"
          - option "RK024"
          - option "RK025"
          - option "RK026"
          - option "RK027"
          - option "RK028"
          - option "RK029"
          - option "RK030"
          - option "RK031"
          - option "RK032"
          - option "RK033"
          - option "RK034"
          - option "RK035"
          - option "RK036"
          - option "RK037"
          - option "RK038"
          - option "RK039"
          - option "RK040"
          - option "RK041"
          - option "RK042"
          - option "RK043"
          - option "RK044"
          - option "RK045"
          - option "RK046"
          - option "RK047"
          - option "RK048"
          - option "RK049"
          - option "RK050"
          - option "RK051"
          - option "RK052"
          - option "RK053"
          - option "RK054"
          - option "RK055"
          - option "RK056"
          - option "RK057" [selected]
          - option "RK058"
          - option "RK059"
          - option "RK060"
          - option "RK061"
          - option "RK062"
          - option "RK063"
          - option "RK064"
          - option "RK065"
          - option "RK066"
          - option "RK067"
          - option "RK068"
          - option "RK069"
          - option "RK070"
          - option "RK071"
          - option "RK072"
          - option "RK073"
          - option "RK074"
          - option "RK075"
      - generic [ref=e27]:
        - paragraph [ref=e28]: 工程数学与项目管理
        - complementary [ref=e29]:
          - strong [ref=e30]: 前置情形（RK046 原题干）
          - paragraph [ref=e31]: 挣值管理中，EV=80、AC=100、PV=90（万元），成本偏差CV是多少？
        - heading "同一情形下进度绩效指数SPI约为？" [level=2] [ref=e32]
        - button "A 0.89" [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: A
          - text: "0.89"
        - button "B 1.25" [ref=e35] [cursor=pointer]:
          - generic [ref=e36]: B
          - text: "1.25"
        - button "C 1.11" [ref=e37] [cursor=pointer]:
          - generic [ref=e38]: C
          - text: "1.11"
        - button "D 0.80" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: D
          - text: "0.80"
        - button "提交答案" [disabled] [ref=e41]
        - button "收藏本题" [ref=e42] [cursor=pointer]
        - paragraph [ref=e43]: 来源：章节训练75 · 第 61 行
      - generic [ref=e44]:
        - button "上一题" [ref=e45] [cursor=pointer]
        - button "下一题 →" [ref=e46] [cursor=pointer]
      - paragraph [ref=e47]: 本轮已答 0 / 75。退出可继续；需要二刷时重开本轮。
      - button "重开本轮练习" [ref=e48] [cursor=pointer]
    - region "离线学习状态" [ref=e49]:
      - paragraph [ref=e50]:
        - strong [ref=e51]: 已联网
        - text: · 开发预览；离线缓存需构建版本
      - button "请求浏览器持久保存本设备数据" [ref=e52] [cursor=pointer]
    - contentinfo [ref=e53]: 软考冲刺 · 系统分析师知识点掌握驱动 · 原创模拟训练
  - navigation "主导航" [ref=e54]:
    - link "今日" [ref=e55] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=e56]: ⌂
      - text: 今日
    - link "知识" [ref=e57] [cursor=pointer]:
      - /url: /learn
      - generic [aria-hidden] [ref=e58]: ▤
      - text: 知识
    - link "刷题" [ref=e59] [cursor=pointer]:
      - /url: /practice
      - generic [aria-hidden] [ref=e60]: ✓
      - text: 刷题
    - link "实战" [ref=e61] [cursor=pointer]:
      - /url: /cases
      - generic [aria-hidden] [ref=e62]: ◇
      - text: 实战
    - link "我的" [ref=e63] [cursor=pointer]:
      - /url: /progress
      - generic [aria-hidden] [ref=e64]: ◎
      - text: 我的
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("RK057补齐前置情形，案例和论文原文可访问", async ({ page }) => {
  4  |   await page.goto("/practice?question=RK057");
  5  |   await expect(page.getByText(/EV=80、AC=100、PV=90/)).toBeVisible();
> 6  |   await page.goto("/cases/C09");
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  7  |   await expect(page.getByText(/编造产品价格/)).toBeVisible();
  8  |   await expect(page.getByRole("textbox")).toHaveCount(3);
  9  |   for (const box of await page.getByRole("textbox").all())
  10 |     await box.fill("自动化验收独立答案");
  11 |   await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  12 |   await expect(page.getByText(/提示注入→不可信文本隔离/)).toBeVisible();
  13 |   await expect(
  14 |     page.getByRole("checkbox", { name: /风险及措施/ }),
  15 |   ).toBeVisible();
  16 |   await page.goto("/essays/E10");
  17 |   await expect(
  18 |     page.getByRole("heading", { name: "企业信息系统集成与AI Agent" }),
  19 |   ).toBeVisible();
  20 |   await expect(page.getByText("准备Agent调用链和人工审批设计")).toBeVisible();
  21 | });
  22 | 
  23 | for (const width of [320, 375, 390, 430])
  24 |   test(`${width}px关键页面无整页横向滚动`, async ({ page }) => {
  25 |     await page.setViewportSize({ width, height: 850 });
  26 |     for (const route of [
  27 |       "/",
  28 |       "/learn",
  29 |       "/learn/K075",
  30 |       "/practice?question=RK057",
  31 |       "/cases/C03",
  32 |       "/essays/E10",
  33 |       "/progress",
  34 |       "/mock",
  35 |     ]) {
  36 |       await page.goto(route);
  37 |       await expect(page.locator("main h1")).toBeVisible();
  38 |       expect(
  39 |         await page.evaluate(
  40 |           () => document.documentElement.scrollWidth <= window.innerWidth,
  41 |         ),
  42 |         route,
  43 |       ).toBe(true);
  44 |     }
  45 |   });
  46 | 
  47 | test("深色模式与最终首页截图", async ({ page }) => {
  48 |   await page.emulateMedia({ colorScheme: "dark" });
  49 |   await page.goto("/learn/K001");
  50 |   await expect(
  51 |     page.getByRole("heading", { name: "需求类型", exact: true }),
  52 |   ).toBeVisible();
  53 |   await page.emulateMedia({ colorScheme: "light" });
  54 |   await page.goto("/");
  55 |   await expect(page.getByText("首轮通过 / 76")).toBeVisible();
  56 |   await page.screenshot({ path: "docs/screenshots/final-today.png" });
  57 | });
  58 | 
```