import { expect, test } from "@playwright/test";
import { downloadBackup, records } from "../audit/helpers";
import { aligned, controlsFit, courseSteps } from "./layout-helpers";
const screenshots = process.env.UI_SCREENSHOTS || "tmp/ui-polish/screenshots";

for (const width of [320, 375, 390, 430]) {
  test(`${width}px课程按钮在首步、中间步、末步及全部讲解中对齐`, async ({ page }) => {
    await courseSteps(page, width);
  });

  test(`${width}px全站操作区间距、换行、点击区域及确认取消`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/learn", "/learn/K015", "/practice", "/cases", "/essays", "/essays/E01", "/progress", "/mock"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      if (route === "/essays/E01") await expect(page.getByRole("button", { name: "导出 Markdown", exact: true })).toBeVisible();
      await controlsFit(page);
    }
    // Mock confirmation cancellation must preserve answers and their gate.
    await page.getByRole("button", { name: "开始本场完整模考" }).click();
    await page.locator(".option-button").first().click();
    await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
    const confirmation = page.getByRole("region", { name: "确认交卷" });
    await aligned(confirmation.locator(".button-row"));
    await page.getByRole("button", { name: "返回继续作答" }).click();
    await expect(confirmation).toHaveCount(0);
    await expect(page.locator(".answer")).toHaveCount(0);
    expect((await records(page, "sessions")).find((s) => s.set === "mock")?.submittedAt).toBeUndefined();
    await page.getByText("题号导航 · 点击跳题", { exact: true }).click();
    await expect(page.locator(".question-grid button")).toHaveCount(75);
    await controlsFit(page);

    // Case save/new and essay export groups use the same layout contract.
    await page.goto("/cases/C01");
    await expect(page.getByRole("textbox", { name: /我的独立回答/ })).toHaveCount(3);
    for (const answer of await page.getByRole("textbox", { name: /我的独立回答/ }).all()) {
      await answer.fill("按钮布局测试：独立回答各分问后再进入自评。");
    }
    await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
    await expect(page.getByRole("button", { name: "保存本次案例训练" })).toBeVisible();
    await controlsFit(page);

    await page.goto("/progress");
    const plan = page.locator("section").filter({ has: page.getByRole("heading", { name: "手动重排知识任务" }) });
    await aligned(plan.locator(".button-row"));
    if (width === 390) await plan.screenshot({ path: `${screenshots}/after-plan-390.png` });
    const before = await downloadBackup(page);
    await page.locator('input[type="file"]').setInputFiles(before.path);
    await page.getByRole("button", { name: "准备恢复此备份" }).click();
    await aligned(page.locator(".confirm-box .button-row"));
    await page.getByRole("button", { name: "取消恢复" }).click();
    await expect(page.getByRole("button", { name: "确认替换并恢复" })).toHaveCount(0);
    await page.getByRole("button", { name: "重置学习数据…" }).click();
    await aligned(page.locator(".confirm-box .button-row"));
    if (width === 390) await page.locator(".confirm-box").screenshot({ path: `${screenshots}/after-reset-390.png` });
    await page.getByRole("button", { name: "取消重置" }).click();
    const after = await downloadBackup(page);
    expect(after.backup.data).toEqual(before.backup.data);
    await controlsFit(page);
  });
}

test("暗色外观和桌面宽度保持按钮对齐及键盘焦点", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await courseSteps(page, 760);
  const all = page.getByRole("button", { name: "看全部", exact: true });
  await all.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(all).toBeFocused();
  expect(await all.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(page.locator(".lesson-step")).toHaveCount(4);
});

