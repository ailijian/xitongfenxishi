import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Question } from "../../src/domain/content-schema";
const questions = JSON.parse(
  readFileSync(
    new URL("../../src/data/questions.json", import.meta.url),
    "utf8",
  ),
) as Question[];
test("章节75题跨模块抽样，原文答案解析、收藏和二刷入口可用", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const n of [1, 8, 13, 20, 35, 42, 50, 58, 69, 75]) {
    const q = questions[n - 1];
    await page.goto(`/practice?question=${q.id}`);
    await expect(
      page.getByRole("heading", { name: q.stem, exact: true }),
    ).toBeVisible();
    const incorrect = q.answer === "A" ? "B" : "A";
    await page
      .getByRole("button", {
        name: `${incorrect} ${q.options[incorrect]}`,
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "提交答案", exact: true }).click();
    await expect(page.getByText("已加入错题本", { exact: true })).toBeVisible();
    await expect(page.getByText(q.explanation, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "收藏本题", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "收藏 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "错题 10", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "错题重练", exact: true }),
  ).toBeVisible();
  await page.getByLabel("按模块练习").selectOption(questions[0].module);
  await expect(
    page.getByRole("heading", { name: "错题重练", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".question .subtle")).toHaveText(
    questions[0].module,
  );
});
test("每日配套只包含可信章节关联，独立模考题不混入", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T02:00:00Z") });
  await page.clock.setFixedTime(new Date("2026-10-11T02:00:00Z"));
  await page.goto("/");
  await page.getByRole("link", { name: "配套章节练习" }).click();
  await expect(
    page.getByRole("heading", { name: "D1配套章节练习" }),
  ).toBeVisible();
  await expect(page.getByLabel("跳至题号")).toBeVisible();
  const optionIds = await page
    .getByLabel("跳至题号")
    .locator("option")
    .allTextContents();
  expect(optionIds.length).toBeGreaterThan(0);
  expect(optionIds.every((id) => Number(id.replace("RK", "")) <= 75)).toBe(
    true,
  );
  await page.getByLabel("跳至题号").selectOption("0");
  await expect(
    page.getByRole("button", { name: "收藏本题", exact: true }),
  ).toBeEnabled();
});
