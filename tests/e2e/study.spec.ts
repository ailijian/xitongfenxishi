import { test, expect } from "@playwright/test";

async function selfTest(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "开始闭卷自测" }).click();
  await page
    .getByRole("textbox", { name: "闭卷回答" })
    .fill("功能描述做什么；非功能描述性能、安全、可用性等质量约束。");
  await page.getByRole("button", { name: "揭示对照要点" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: /性能类非功能需求/ }).click();
  await page.getByRole("button", { name: "提交关联答案" }).click();
  await expect(page.getByText("回答正确 · 答案 C")).toBeVisible();
  await page.getByRole("button", { name: "提交本次自测" }).click();
}
test("知识首轮到24小时巩固，浏览不增加掌握", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/learn/K001");
  await expect(page.getByText(/K001 \/ A 级 \/ 学习中/)).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("首轮通过 / 76")).toBeVisible();
  await expect(page.getByText("原计划 15 个")).toBeVisible();
  await page.goto("/learn/K001");
  await selfTest(page);
  await expect(page.getByRole("status")).toContainText("首轮验收通过");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/final-knowledge.png" });
  await page.reload();
  await expect(page.getByText(/初步掌握/)).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-10-12T02:00:00Z"));
  await page.reload();
  await selfTest(page);
  await expect(page.getByRole("status")).toContainText("巩固掌握");
});
test("错题二刷、未提交答案与页面退出继续", async ({ page }) => {
  await page.goto("/practice?question=RK001");
  await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "错题 1" }).click();
  await page.getByRole("button", { name: /A.*无法直接验证是否满足/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByRole("link", { name: "错题 0" })).toBeVisible();
  await page.goto("/practice?question=RK002");
  await page.getByRole("button", { name: /B.*净现值NPV/ }).click();
  // The selected state is rendered from the committed IndexedDB session.
  await expect(page.getByRole("button", { name: /B.*净现值NPV/ })).toHaveClass(
    /selected/,
  );
  await page.reload();
  await expect(page.getByRole("button", { name: /B.*净现值NPV/ })).toHaveClass(
    /selected/,
  );
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeEnabled();
});
test("仅自评卡可通关，修改启动日保留记录", async ({ page }) => {
  await page.goto("/learn/K004");
  await page.getByRole("button", { name: "开始闭卷自测" }).click();
  await page
    .getByRole("textbox", { name: "闭卷回答" })
    .fill("提交请求，影响分析，评审批准，更新基线和测试，通知各方。");
  await page.getByRole("button", { name: "揭示对照要点" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "提交本次自测" }).click();
  await expect(page.getByRole("status")).toContainText("仅自评验证");
  await page.goto("/progress");
  await page.getByLabel("学习启动日期").fill("2026-10-10");
  await page.getByRole("button", { name: "保存启动日" }).click();
  await expect(page.getByRole("status")).toContainText("已有学习记录全部保留");
  await page.goto("/learn/K004");
  await expect(page.getByText(/初步掌握/)).toBeVisible();
});
