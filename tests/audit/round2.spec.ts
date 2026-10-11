import { test, expect } from "@playwright/test";
import { records, selfTest } from "./helpers";

const evidence = process.env.ROUND2_SCREENSHOTS || "docs/round2/screenshots";
const reviewCount = (page: import("@playwright/test").Page) => page.locator(".metric").filter({ hasText: "到期与失败待复习" }).locator("strong");

test("复习精确24h到期：首页无数据库变更仍刷新，且不会自动升级掌握", async ({ page }) => {
  const first = Date.parse("2026-10-11T02:00:00Z");
  await page.clock.install({ time: new Date(first) });
  await page.clock.setFixedTime(new Date(first));
  await page.goto("/learn/K001");
  await selfTest(page);
  const saved = await records(page, "cards");
  await page.goto("/");
  await page.clock.setFixedTime(new Date(first + 86_400_000 - 1));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(reviewCount(page)).toHaveText("0");
  await page.clock.setFixedTime(new Date(first + 86_400_000));
  await page.clock.runFor(1);
  await expect(reviewCount(page)).toHaveText("1");
  await expect(page.locator(".hero .primary")).toContainText("继续复习：需求类型");
  expect(await records(page, "cards")).toEqual(saved);
  await page.screenshot({ path: `${evidence}/after-review-due-390.png` });
});

test("后台恢复、窗口focus和pageshow都立即重算日期，无需等待周期或写库", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/");
  await expect(page.locator(".page-title")).toContainText("DAY 1 / 7");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
  await page.clock.setFixedTime(new Date("2026-10-13T02:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".page-title")).toContainText("DAY 3 / 7");
  await page.clock.setFixedTime(new Date("2026-10-14T02:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.locator(".page-title")).toContainText("DAY 4 / 7");
  expect(await records(page, "cards")).toEqual([]);
});

test("跨标签创建同卷：已打开的收藏解析及历史卷同步锁定，交本场后恢复", async ({ page, context }) => {
  await page.goto("/mock");
  await page.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(page.locator(".notice")).toContainText(["首次独立模考 · 原创模拟训练"]);
  const oldRun = page.url();
  await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  await expect(page.getByText(/正确答案 D/)).toBeVisible();
  await page.goto("/practice?mode=favorites");
  await page.getByRole("button", { name: /D.*输入输出数据流平衡/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByText(/正确答案 D/)).toBeVisible();
  const before = await records(page, "questionAttempts");
  const next = await context.newPage();
  await next.goto("/mock");
  await next.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(next.getByText(/同卷复练：沿用/)).toBeVisible();
  await expect(page.getByText(/模考收藏题在整卷交卷后开放/)).toBeVisible();
  await expect(page.locator(".answer")).toHaveCount(0);
  expect(await records(page, "questionAttempts")).toEqual(before);
  await page.screenshot({ path: `${evidence}/after-repeat-gate-390.png` });
  await page.goto(oldRun);
  await expect(page.getByText(/历史试卷解析暂时锁定/)).toBeVisible();
  await expect(page.locator(".answer")).toHaveCount(0);
  await next.getByRole("button", { name: "交整卷，查看成绩" }).click();
  await next.getByRole("button", { name: "确认交卷", exact: true }).click();
  await expect(page.locator(".answer")).toBeVisible();
  await page.goto("/practice?mode=favorites");
  await expect(page.getByText(/正确答案 D/)).toBeVisible();
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(layout.scroll, `unlocked mock review at ${width}px`).toBeLessThanOrEqual(layout.width);
  }
  await next.screenshot({ path: `${evidence}/after-repeat-kind-390.png` });
});
