import { test, expect, chromium } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { records, selfTest } from "./helpers";

test("K001：阅读、首轮、24h前边界、24h巩固、失败复测及刷新", async ({ page, context }) => {
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/learn/K001");
  await expect(page.getByText(/K001 \/ A 级 \/ 学习中/)).toBeVisible();
  await page.reload();
  let cards = await records(page, "cards");
  expect(cards[0].status).toBe("learning");
  expect(cards[0].firstPassAt).toBeUndefined();
  await selfTest(page);
  cards = await records(page, "cards");
  expect(cards[0].status).toBe("initial");
  const firstPass = cards[0].firstPassAt;
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/learn/K001");
  await expect(reopened.getByText(/K001 \/ A 级 \/ 初步掌握/)).toBeVisible();
  await reopened.clock.setFixedTime(new Date("2026-10-12T01:59:59.999Z"));
  await selfTest(reopened);
  expect((await records(reopened, "cards"))[0].status).toBe("initial");
  await reopened.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  await selfTest(reopened);
  expect((await records(reopened, "cards"))[0].status).toBe("consolidated");
  await reopened.clock.setFixedTime(new Date("2026-10-13T02:00:00Z"));
  await selfTest(reopened, "K001", false);
  await reopened.reload();
  const p = (await records(reopened, "cards"))[0];
  expect(p.status).toBe("needs-review");
  expect(p.firstPassAt).toBe(firstPass);
  expect(p.consolidatedAt).toBeUndefined();
  expect(await records(reopened, "cardAttempts")).toHaveLength(4);
  await expect(reopened.getByText(/K001 \/ A 级 \/ 需复习/)).toBeVisible();
});

test("跨日欠账、超前完成和修改启动日保留全部学习记录", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/");
  await expect(page.locator(".day-strip strong")).toHaveText(["15", "15", "15", "15", "16", "模考", "复习"]);
  await page.goto("/learn/K015");
  await selfTest(page, "K015");
  await page.goto("/");
  await expect(page.locator(".day-strip strong")).toHaveText(["15", "14", "15", "15", "16", "模考", "复习"]);
  await page.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  await page.reload();
  await expect(page.locator(".hero")).toContainText("待新增 14 个 · 历史欠账 15 个");
  const beforeCards = await records(page, "cards"), beforeAttempts = await records(page, "cardAttempts");
  await page.goto("/progress");
  await page.getByLabel("学习启动日期").fill("2026-10-10");
  await page.getByRole("button", { name: "保存启动日" }).click();
  await expect(page.getByRole("status")).toContainText("已有学习记录全部保留");
  await page.reload();
  expect(await records(page, "cards")).toEqual(beforeCards);
  expect(await records(page, "cardAttempts")).toEqual(beforeAttempts);
  await page.goto("/");
  await expect(page.locator(".page-title")).toContainText("DAY 3 / 7");
  await expect(page.locator(".hero")).toContainText("历史欠账 29 个");
});

test("亚洲上海午夜：刷新后进入D2并携带15条欠账", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
  await page.goto("/");
  await expect(page.locator(".page-title")).toContainText("DAY 1 / 7");
  await page.clock.setFixedTime(new Date("2026-10-11T16:00:00Z"));
  await page.reload();
  await expect(page.locator(".page-title")).toContainText("DAY 2 / 7");
  await expect(page.locator(".hero")).toContainText("历史欠账 15 个");
});

test("亚洲上海午夜：停留首页时任务自动更新", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T15:59:59Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T15:59:59Z"));
  await page.goto("/");
  await expect(page.locator(".page-title")).toContainText("DAY 1 / 7");
  await page.clock.setFixedTime(new Date("2026-10-11T16:00:01Z"));
  await page.clock.runFor(2000);
  await expect(page.locator(".page-title")).toContainText("DAY 2 / 7", { timeout: 2000 });
});

test("K014的客观通关题直接验证Scrum职责，而非仅敏捷模块", async ({ page }) => {
  await page.goto("/learn/K014");
  await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  await page.getByRole("textbox", { name: "闭卷回答" }).fill("PO管理待办优先级；Scrum Master促进流程；团队交付增量。");
  await page.getByRole("button", { name: "揭示对照要点" }).click();
  await expect(page.locator(".answer h2")).toContainText("RK039");
  await expect(page.locator(".answer")).toContainText("负责管理产品待办列表优先级");
});

test("真实关闭并重启Chromium：论文及案例逐字输入后仍可恢复", async ({ baseURL }) => {
  const profile = mkdtempSync(join(tmpdir(), "ruankao-audit-"));
  let context = await chromium.launchPersistentContext(profile, { baseURL, headless: true, viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai" });
  const body = "persistent-draft-".repeat(30), answer = "case-answer-".repeat(20);
  try {
    const page = await context.newPage();
    await page.goto("/essays/E02");
    await page.getByRole("textbox", { name: "我的论文正文" }).pressSequentially(body);
    await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe(body);
    await page.goto("/cases/C02");
    await page.getByRole("textbox", { name: "C02-Q1 我的独立回答" }).pressSequentially(answer);
    await expect.poll(async () => (await records(page, "caseDrafts"))[0]?.answers["C02-Q1"]).toBe(answer);
    await context.close();
    context = await chromium.launchPersistentContext(profile, { baseURL, headless: true, viewport: { width: 390, height: 844 }, timezoneId: "Asia/Shanghai" });
    const reopened = await context.newPage();
    await reopened.goto("/essays/E02");
    await expect(reopened.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(body);
    await reopened.goto("/cases/C02");
    await expect(reopened.getByRole("textbox", { name: "C02-Q1 我的独立回答" })).toHaveValue(answer);
  } finally { await context.close(); rmSync(profile, { recursive: true, force: true }); }
});
