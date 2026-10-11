# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: state.spec.ts >> K014的客观通关题直接验证Scrum职责，而非仅敏捷模块
- Location: tests/audit/state.spec.ts:87:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.answer h2')
Expected substring: "RK039"
Received string:    "关联选择题 · RK027"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('.answer h2') with timeout 5000ms
  - waiting for locator('.answer h2')
    14 × locator resolved to <h2>关联选择题 · RK027</h2>
       - unexpected value "关联选择题 · RK027"

```

```yaml
- heading "关联选择题 · RK027" [level=2]
```

# Test source

```ts
  1   | import { test, expect, chromium } from "@playwright/test";
  2   | import { mkdtempSync, rmSync } from "node:fs";
  3   | import { tmpdir } from "node:os";
  4   | import { join } from "node:path";
  5   | import { records, selfTest } from "./helpers";
  6   | 
  7   | test("K001：阅读、首轮、24h前边界、24h巩固、失败复测及刷新", async ({ page, context }) => {
  8   |   await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  9   |   await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  10  |   await page.goto("/learn/K001");
  11  |   await expect(page.getByText(/K001 \/ A 级 \/ 学习中/)).toBeVisible();
  12  |   await page.reload();
  13  |   let cards = await records(page, "cards");
  14  |   expect(cards[0].status).toBe("learning");
  15  |   expect(cards[0].firstPassAt).toBeUndefined();
  16  |   await selfTest(page);
  17  |   cards = await records(page, "cards");
  18  |   expect(cards[0].status).toBe("initial");
  19  |   const firstPass = cards[0].firstPassAt;
  20  |   await page.close();
  21  |   const reopened = await context.newPage();
  22  |   await reopened.goto("/learn/K001");
  23  |   await expect(reopened.getByText(/K001 \/ A 级 \/ 初步掌握/)).toBeVisible();
  24  |   await reopened.clock.setFixedTime(new Date("2026-10-12T01:59:59.999Z"));
  25  |   await selfTest(reopened);
  26  |   expect((await records(reopened, "cards"))[0].status).toBe("initial");
  27  |   await reopened.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  28  |   await selfTest(reopened);
  29  |   expect((await records(reopened, "cards"))[0].status).toBe("consolidated");
  30  |   await reopened.clock.setFixedTime(new Date("2026-10-13T02:00:00Z"));
  31  |   await selfTest(reopened, "K001", false);
  32  |   await reopened.reload();
  33  |   const p = (await records(reopened, "cards"))[0];
  34  |   expect(p.status).toBe("needs-review");
  35  |   expect(p.firstPassAt).toBe(firstPass);
  36  |   expect(p.consolidatedAt).toBeUndefined();
  37  |   expect(await records(reopened, "cardAttempts")).toHaveLength(4);
  38  |   await expect(reopened.getByText(/K001 \/ A 级 \/ 需复习/)).toBeVisible();
  39  | });
  40  | 
  41  | test("跨日欠账、超前完成和修改启动日保留全部学习记录", async ({ page }) => {
  42  |   await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  43  |   await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  44  |   await page.goto("/");
  45  |   await expect(page.locator(".day-strip strong")).toHaveText(["15", "15", "15", "15", "16", "模考", "复习"]);
  46  |   await page.goto("/learn/K015");
  47  |   await selfTest(page, "K015");
  48  |   await page.goto("/");
  49  |   await expect(page.locator(".day-strip strong")).toHaveText(["15", "14", "15", "15", "16", "模考", "复习"]);
  50  |   await page.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  51  |   await page.reload();
  52  |   await expect(page.locator(".hero")).toContainText("待新增 14 个 · 历史欠账 15 个");
  53  |   const beforeCards = await records(page, "cards"), beforeAttempts = await records(page, "cardAttempts");
  54  |   await page.goto("/progress");
  55  |   await page.getByLabel("学习启动日期").fill("2026-10-10");
  56  |   await page.getByRole("button", { name: "保存启动日" }).click();
  57  |   await expect(page.getByRole("status")).toContainText("已有学习记录全部保留");
  58  |   await page.reload();
  59  |   expect(await records(page, "cards")).toEqual(beforeCards);
  60  |   expect(await records(page, "cardAttempts")).toEqual(beforeAttempts);
  61  |   await page.goto("/");
  62  |   await expect(page.locator(".page-title")).toContainText("DAY 3 / 7");
  63  |   await expect(page.locator(".hero")).toContainText("历史欠账 29 个");
  64  | });
  65  | 
  66  | test("亚洲上海午夜：刷新后进入D2并携带15条欠账", async ({ page }) => {
  67  |   await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
  68  |   await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
  69  |   await page.goto("/");
  70  |   await expect(page.locator(".page-title")).toContainText("DAY 1 / 7");
  71  |   await page.clock.setFixedTime(new Date("2026-10-11T16:00:00Z"));
  72  |   await page.reload();
  73  |   await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
  74  |   await expect(page.locator(".hero")).toContainText("历史欠账 15 个");
  75  | });
  76  | 
  77  | test("亚洲上海午夜：停留首页时任务自动更新", async ({ page }) => {
  78  |   await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
  79  |   await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
  80  |   await page.goto("/");
  81  |   await expect(page.locator(".page-title")).toContainText("DAY 1 / 7");
  82  |   await page.clock.setFixedTime(new Date("2026-10-11T16:00:01Z"));
  83  |   await page.clock.runFor(2000);
  84  |   await expect(page.locator(".page-title")).toContainText("DAY 2 / 7", { timeout: 2000 });
  85  | });
  86  | 
  87  | test("K014的客观通关题直接验证Scrum职责，而非仅敏捷模块", async ({ page }) => {
  88  |   await page.goto("/learn/K014");
  89  |   await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  90  |   await page.getByRole("textbox", { name: "闭卷回答" }).fill("PO管理待办优先级；Scrum Master促进流程；团队交付增量。");
  91  |   await page.getByRole("button", { name: "揭示对照要点" }).click();
> 92  |   await expect(page.locator(".answer h2")).toContainText("RK039");
      |                                            ^ Error: expect(locator).toContainText(expected) failed
  93  |   await expect(page.locator(".answer")).toContainText("负责管理产品待办列表优先级");
  94  | });
  95  | 
  96  | test("真实关闭并重启Chromium：论文及案例逐字输入后仍可恢复", async ({ baseURL }) => {
  97  |   const profile = mkdtempSync(join(tmpdir(), "ruankao-audit-"));
  98  |   let context = await chromium.launchPersistentContext(profile, { baseURL, headless: true, viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai" });
  99  |   const body = "persistent-draft-".repeat(30), answer = "case-answer-".repeat(20);
  100 |   try {
  101 |     const page = await context.newPage();
  102 |     await page.goto("/essays/E02");
  103 |     await page.getByRole("textbox", { name: "我的论文正文" }).pressSequentially(body);
  104 |     await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(body);
  105 |     await page.goto("/cases/C02");
  106 |     await page.getByRole("textbox", { name: "C02-Q1 我的独立回答" }).pressSequentially(answer);
  107 |     await expect.poll(async () => (await records(page, "caseDrafts"))[0]?.answers["C02-Q1"]).toBe(answer);
  108 |     await context.close();
  109 |     context = await chromium.launchPersistentContext(profile, { baseURL, headless: true, viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai" });
  110 |     const reopened = await context.newPage();
  111 |     await reopened.goto("/essays/E02");
  112 |     await expect(reopened.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(body);
  113 |     await reopened.goto("/cases/C02");
  114 |     await expect(reopened.getByRole("textbox", { name: "C02-Q1 我的独立回答" })).toHaveValue(answer);
  115 |   } finally { await context.close(); rmSync(profile, { recursive: true, force: true }); }
  116 | });
  117 | 
```