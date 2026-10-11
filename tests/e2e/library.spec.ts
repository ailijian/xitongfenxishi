import { test, expect } from "@playwright/test";

test("RK057补齐前置情形，案例和论文原文可访问", async ({ page }) => {
  await page.goto("/practice?question=RK057");
  await expect(page.getByText(/EV=80、AC=100、PV=90/)).toBeVisible();
  await page.goto("/cases/C09");
  await expect(page.getByText(/编造产品价格/)).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(3);
  for (const box of await page.getByRole("textbox").all())
    await box.fill("自动化验收独立答案");
  await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  await expect(page.getByText(/提示注入→不可信文本隔离/)).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /风险及措施/ }),
  ).toBeVisible();
  await page.goto("/essays/E10");
  await expect(
    page.getByRole("heading", { name: "企业信息系统集成与AI Agent" }),
  ).toBeVisible();
  await expect(page.getByText("准备Agent调用链和人工审批设计")).toBeVisible();
});

for (const width of [320, 375, 390, 430])
  test(`${width}px关键页面无整页横向滚动`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    for (const route of [
      "/",
      "/learn",
      "/learn/K075",
      "/practice?question=RK057",
      "/cases/C03",
      "/essays/E10",
      "/progress",
      "/mock",
    ]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        route,
      ).toBe(true);
    }
  });

test("深色模式与最终首页截图", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/learn/K001");
  await expect(
    page.getByRole("heading", { name: "需求类型", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByText("首轮通过 / 76")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/final-today.png" });
});
