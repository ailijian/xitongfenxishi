import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("构建版PWA缓存全部核心资料，断网关闭再打开仍可读、答题和保存论文", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "今天，掌握一个再向前。" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const response = await page.request.get("/manifest.webmanifest"),
    manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  await context.setOffline(true);
  await page.close();
  const offline = await context.newPage();
  await offline.goto("/learn/K075");
  await expect(
    offline.getByRole("heading", { name: "BPR/价值链" }),
  ).toBeVisible();
  await offline.goto("/practice?question=RK057");
  await expect(offline.getByText(/EV=80、AC=100、PV=90/)).toBeVisible();
  await offline.getByRole("button", { name: /A.*0.89/ }).click();
  await offline.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(offline.getByText(/正确答案 A/)).toBeVisible();
  await offline.goto("/cases/C09");
  await expect(offline.getByText(/编造产品价格/)).toBeVisible();
  await offline.goto("/essays/E10");
  await offline
    .getByRole("textbox", { name: "我的论文正文" })
    .fill("断网写作验收草稿");
  await expect(offline.locator(".word-count")).toContainText("正文 8 字");
  await offline.close();
  const reopened = await context.newPage();
  await reopened.goto("/essays/E10");
  await expect(
    reopened.getByRole("textbox", { name: "我的论文正文" }),
  ).toHaveValue("断网写作验收草稿");
  await reopened.goto("/mock");
  await expect(
    reopened.getByRole("button", { name: "开始本场完整模考" }),
  ).toBeEnabled();
  await expect(reopened.getByText("离线模式", { exact: true })).toBeVisible();
});
test("JSON导出、二次确认清空、校验预览与二次恢复，草稿和错题完全保留", async ({
  page,
}) => {
  await page.goto("/practice?question=RK001");
  await page.getByRole("button", { name: /B.*包含过多接口细节/ }).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.getByRole("link", { name: "错题 1" })).toBeVisible();
  await page.goto("/essays/E01");
  await page
    .getByRole("textbox", { name: "我的论文提纲" })
    .fill("保留真实项目提纲");
  await page
    .getByRole("textbox", { name: "我的论文正文" })
    .fill("备份验收草稿");
  await expect(page.locator(".word-count")).toContainText("正文 6 字");
  await page.goto("/progress");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出完整 JSON 备份" }).click();
  const download = await downloading,
    path = await download.path();
  expect(path).toBeTruthy();
  const backup = JSON.parse(readFileSync(path!, "utf8"));
  expect(backup.data.essayDrafts[0].body).toBe("备份验收草稿");
  expect(backup.data.questionAttempts).toHaveLength(1);
  await page.getByRole("button", { name: "重置学习数据…" }).click();
  await expect(page.getByRole("link", { name: /待复习错题 1/ })).toBeVisible();
  await page
    .getByRole("button", { name: "再次确认，清空全部学习数据" })
    .click();
  await expect(page.getByRole("link", { name: /待复习错题 0/ })).toBeVisible();
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "校验通过 · 恢复预览" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /待复习错题 0/ })).toBeVisible();
  await page.getByRole("button", { name: "准备恢复此备份" }).click();
  await page.getByRole("button", { name: "确认替换并恢复" }).click();
  await expect(page.getByRole("link", { name: /待复习错题 1/ })).toBeVisible();
  await page.goto("/essays/E01");
  await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(
    "备份验收草稿",
  );
  await page.goto("/progress");
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles({
    name: "damaged.json",
    mimeType: "application/json",
    buffer: Buffer.from("{damaged"),
  });
  await expect(page.getByRole("alert")).toContainText("原数据未改动");
  await expect(page.getByRole("link", { name: /待复习错题 1/ })).toBeVisible();
});
