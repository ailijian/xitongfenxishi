# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: study.spec.ts >> 知识首轮到24小时巩固，浏览不增加掌握
- Location: tests/e2e/study.spec.ts:16:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:4173/", waiting until "load"

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
      - link "← 知识通关" [ref=e12] [cursor=pointer]:
        - /url: /learn
      - generic [ref=e13]:
        - text: K001 / A 级 / 学习中
        - heading "需求类型" [level=1] [ref=e14]
        - paragraph [ref=e15]: 需求/UML/建模
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: 零基础课程版 · 第 1 / 15 课
          - heading "这一课要解决什么" [level=2] [ref=e19]
          - paragraph [ref=e20]: 功能需求管“要做什么”，非功能需求管“做到什么标准”。
          - generic [ref=e21]:
            - heading "业务场景 · 社区医院预约系统" [level=3] [ref=e22]
            - paragraph [ref=e23]: 医院要做手机预约：患者希望预约和取消；医院希望预约时系统速度快、病历不能被别人看。
          - group [ref=e24]:
            - generic "为什么要学这一课" [ref=e25] [cursor=pointer]
          - link "已理解，跳到闭卷自述 ↓" [ref=e26] [cursor=pointer]:
            - /url: "#closed-book"
        - region [ref=e27]:
          - heading "循序讲解" [level=2] [ref=e28]
          - paragraph [ref=e29]: 第 1 / 4 步 · 阅读不会自动计入掌握
          - generic [ref=e30]:
            - heading "先理解“需求”" [level=3] [ref=e31]
            - paragraph [ref=e32]: 需求是利益相关方对系统提出的需要或限制。不是程序员想做的按钮，而是业务方、患者、医生等真正需要实现的目标。
          - generic [ref=e33]:
            - button "懂了，下一步" [ref=e34] [cursor=pointer]
            - button "看全部" [ref=e35] [cursor=pointer]
        - region [ref=e36]:
          - heading "一步步做示例" [level=2] [ref=e37]
          - heading "把医院的四句愿望分类" [level=3] [ref=e38]
          - list [ref=e39]:
            - listitem [ref=e40]: “患者可取消预约”→功能：描述业务动作。
            - listitem [ref=e41]: “预约请求在2秒内返回结果”→非功能：规定性能，但最好说明统计口径与比例。
            - listitem [ref=e42]: “系统提供权限配置页面”→功能：规定系统要有的操作能力。
            - listitem [ref=e43]: “患者不能访问其他人的病历”→非功能：规定保密性/授权约束；实现中也会衍生具体权限功能。
        - generic [ref=e44]:
          - heading "容易混淆" [level=2] [ref=e45]
          - paragraph [ref=e46]: 常混淆：功能需求=“系统会做什么”；非功能需求=“功能做得怎么样/受哪些限制”。性能要求需带负载、比例和测量方式，单写“很快”无法验收。
          - heading "在考试中怎么用" [level=3] [ref=e47]
          - paragraph [ref=e48]: 综合知识会考分类；案例分析会要求发现需求缺陷并写成可验证描述。
          - heading "记忆线索" [level=3] [ref=e49]
          - paragraph [ref=e50]: 做什么→功能；做到什么程度→非功能。
        - region [ref=e51]:
          - heading "原创课后理解练习" [level=2] [ref=e52]
          - paragraph [ref=e53]: 原创教学题 · 非官方真题 · 不进入原 150 道题库，不计客观掌握。作答只保留在当前页面，重做会收起答案。
          - article [ref=e54]:
            - heading "理解题 1 · 需求类型识别" [level=3] [ref=e55]
            - paragraph [ref=e56]: 以下哪项主要属于非功能需求？
            - generic "理解题 1 选项" [ref=e57]:
              - button "A 患者能取消预约" [ref=e58] [cursor=pointer]:
                - generic [ref=e59]: A
                - text: 患者能取消预约
              - button "B 医生能修改排班" [ref=e60] [cursor=pointer]:
                - generic [ref=e61]: B
                - text: 医生能修改排班
              - button "C 95%的预约查询在2秒内响应" [ref=e62] [cursor=pointer]:
                - generic [ref=e63]: C
                - text: 95%的预约查询在2秒内响应
              - button "D 管理员能维护医生资料" [ref=e64] [cursor=pointer]:
                - generic [ref=e65]: D
                - text: 管理员能维护医生资料
            - button "提交理解题 1" [disabled] [ref=e66]
          - article [ref=e67]:
            - heading "理解题 2 · 不可验证需求改写" [level=3] [ref=e68]
            - paragraph [ref=e69]: 需求“预约系统要很快”不够可验收。下列哪种改写最合理？
            - generic "理解题 2 选项" [ref=e70]:
              - button "A 让测试人员上线后自行决定合格阈值" [ref=e71] [cursor=pointer]:
                - generic [ref=e72]: A
                - text: 让测试人员上线后自行决定合格阈值
              - button "B 只写“平均响应不超过2秒”，不定义测试时的用户量" [ref=e73] [cursor=pointer]:
                - generic [ref=e74]: B
                - text: 只写“平均响应不超过2秒”，不定义测试时的用户量
              - button "C 在指定并发负载下，规定95%请求的响应时间阈值和测量方法" [ref=e75] [cursor=pointer]:
                - generic [ref=e76]: C
                - text: 在指定并发负载下，规定95%请求的响应时间阈值和测量方法
              - button "D 先采购高配置服务器，再决定是否写性能指标" [ref=e77] [cursor=pointer]:
                - generic [ref=e78]: D
                - text: 先采购高配置服务器，再决定是否写性能指标
            - button "提交理解题 2" [disabled] [ref=e79]
        - generic [ref=e80]:
          - heading "闭卷自述" [level=2] [ref=e81]
          - paragraph [ref=e82]: 离开讲解，试着用自己的话回答。进入自测后会隐藏课程资料，沿用原知识卡的验收规则。
          - list [ref=e83]:
            - listitem [ref=e84]: 不看资料，举出预约系统2个功能需求、2个非功能需求。
            - listitem [ref=e85]: 把“系统必须好用”改写成至少一个可检查的要求。
          - button "开始闭卷自测 →" [ref=e86] [cursor=pointer]
        - generic [ref=e87]:
          - paragraph [ref=e88]: 下一张 K002 学习：什么叫“写得好、能验收”的需求。
          - link "继续零基础课程 · K002 →" [ref=e89] [cursor=pointer]:
            - /url: /learn/K002
          - paragraph [ref=e90]: 课程讲解、业务示例与理解题均为原创教学内容。
        - group [ref=e91]:
          - generic "考前速记 · 原始必背概念" [ref=e92] [cursor=pointer]
      - generic [ref=e93]:
        - heading "掌握记录" [level=2] [ref=e94]
        - paragraph [ref=e95]: 0 次闭卷尝试。有客观关联题验证。
      - link "下一知识：好需求6项 →" [ref=e96] [cursor=pointer]:
        - /url: /learn/K002
    - region "离线学习状态" [ref=e97]:
      - paragraph [ref=e98]:
        - strong [ref=e99]: 已联网
        - text: · 开发预览；离线缓存需构建版本
      - button "请求浏览器持久保存本设备数据" [ref=e100] [cursor=pointer]
    - contentinfo [ref=e101]: 软考冲刺 · 系统分析师知识点掌握驱动 · 原创模拟训练
  - navigation "主导航" [ref=e102]:
    - link "今日" [ref=e103] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=e104]: ⌂
      - text: 今日
    - link "知识" [ref=e105] [cursor=pointer]:
      - /url: /learn
      - generic [aria-hidden] [ref=e106]: ▤
      - text: 知识
    - link "刷题" [ref=e107] [cursor=pointer]:
      - /url: /practice
      - generic [aria-hidden] [ref=e108]: ✓
      - text: 刷题
    - link "实战" [ref=e109] [cursor=pointer]:
      - /url: /cases
      - generic [aria-hidden] [ref=e110]: ◇
      - text: 实战
    - link "我的" [ref=e111] [cursor=pointer]:
      - /url: /progress
      - generic [aria-hidden] [ref=e112]: ◎
      - text: 我的
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | async function selfTest(page: import("@playwright/test").Page) {
  4  |   await page.getByRole("button", { name: "开始闭卷自测" }).click();
  5  |   await page
  6  |     .getByRole("textbox", { name: "闭卷回答" })
  7  |     .fill("功能描述做什么；非功能描述性能、安全、可用性等质量约束。");
  8  |   await page.getByRole("button", { name: "揭示对照要点" }).click();
  9  |   await expect(page.getByRole("checkbox")).toHaveCount(2);
  10 |   for (const box of await page.getByRole("checkbox").all()) await box.check();
  11 |   await page.getByRole("button", { name: /性能类非功能需求/ }).click();
  12 |   await page.getByRole("button", { name: "提交关联答案" }).click();
  13 |   await expect(page.getByText("回答正确 · 答案 C")).toBeVisible();
  14 |   await page.getByRole("button", { name: "提交本次自测" }).click();
  15 | }
  16 | test("知识首轮到24小时巩固，浏览不增加掌握", async ({ page }) => {
  17 |   await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  18 |   await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  19 |   await page.goto("/learn/K001");
  20 |   await expect(page.getByText(/K001 \/ A 级 \/ 学习中/)).toBeVisible();
> 21 |   await page.goto("/");
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  22 |   await expect(page.getByText("首轮通过 / 76")).toBeVisible();
  23 |   await expect(page.getByText("原计划 15 个")).toBeVisible();
  24 |   await page.goto("/learn/K001");
  25 |   await selfTest(page);
  26 |   await expect(page.getByRole("status")).toContainText("首轮验收通过");
  27 |   await page.evaluate(() => window.scrollTo(0, 0));
  28 |   await page.screenshot({ path: "docs/screenshots/final-knowledge.png" });
  29 |   await page.reload();
  30 |   await expect(page.getByText(/初步掌握/)).toBeVisible();
  31 |   await page.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  32 |   await page.reload();
  33 |   await selfTest(page);
  34 |   await expect(page.getByRole("status")).toContainText("巩固掌握");
  35 | });
  36 | test("错题二刷、未提交答案与页面退出继续", async ({ page }) => {
  37 |   await page.goto("/practice?question=RK001");
  38 |   await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  39 |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  40 |   await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
  41 |   await page.getByRole("link", { name: "错题 1" }).click();
  42 |   await page.getByRole("button", { name: /A.*无法直接验证是否满足/ }).click();
  43 |   await page.getByRole("button", { name: "提交答案", exact: true }).click();
  44 |   await expect(page.getByRole("link", { name: "错题 0" })).toBeVisible();
  45 |   await page.goto("/practice?question=RK002");
  46 |   await page.getByRole("button", { name: /B.*净现值NPV/ }).click();
  47 |   // The selected state is rendered from the committed IndexedDB session.
  48 |   await expect(page.getByRole("button", { name: /B.*净现值NPV/ })).toHaveClass(
  49 |     /selected/,
  50 |   );
  51 |   await page.reload();
  52 |   await expect(page.getByRole("button", { name: /B.*净现值NPV/ })).toHaveClass(
  53 |     /selected/,
  54 |   );
  55 |   await expect(
  56 |     page.getByRole("button", { name: "提交答案", exact: true }),
  57 |   ).toBeEnabled();
  58 | });
  59 | test("仅自评卡可通关，修改启动日保留记录", async ({ page }) => {
  60 |   await page.goto("/learn/K004");
  61 |   await page.getByRole("button", { name: "开始闭卷自测" }).click();
  62 |   await page
  63 |     .getByRole("textbox", { name: "闭卷回答" })
  64 |     .fill("提交请求，影响分析，评审批准，更新基线和测试，通知各方。");
  65 |   await page.getByRole("button", { name: "揭示对照要点" }).click();
  66 |   await page.getByRole("checkbox").check();
  67 |   await page.getByRole("button", { name: "提交本次自测" }).click();
  68 |   await expect(page.getByRole("status")).toContainText("仅自评验证");
  69 |   await page.goto("/progress");
  70 |   await page.getByLabel("学习启动日期").fill("2026-10-10");
  71 |   await page.getByRole("button", { name: "保存启动日" }).click();
  72 |   await expect(page.getByRole("status")).toContainText("已有学习记录全部保留");
  73 |   await page.goto("/learn/K004");
  74 |   await expect(page.getByText(/初步掌握/)).toBeVisible();
  75 | });
  76 | 
```