import { test, expect } from "@playwright/test";

test("静态服务健康、深层路由和PWA入口正确，缺失资源返回404", async ({ request }) => {
  const health = await request.get("/healthz");
  expect(health.status()).toBe(200);
  expect(await health.text()).toBe("ok");
  for (const route of ["/", "/learn/K075", "/cases/C09", "/essays/E10", "/mock", "/progress"]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    expect(response.headers()["content-type"], route).toContain("text/html");
    expect(response.headers()["cache-control"], route).toBe("no-cache");
    expect(await response.text(), route).toContain('<div id="root"></div>');
  }
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.headers()["cache-control"]).toBe("no-cache");
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.icons).toHaveLength(3);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["content-type"]).toMatch(/javascript/);
  expect(sw.headers()["cache-control"]).toBe("no-cache");
  for (const route of ["/assets/missing.js", "/missing.js", "/icons/missing.png", "/_headers", "/_redirects"]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
    expect(await response.text(), route).not.toContain('<div id="root"></div>');
  }
});

test("构建JS和CSS可访问、MIME正确、使用长期不可变缓存", async ({ request }) => {
  const index = await (await request.get("/")).text();
  const assets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"\s]+\.(?:js|css))"/g)].map((match) => match[1]);
  expect(assets.length).toBeGreaterThanOrEqual(2);
  for (const asset of assets) {
    const response = await request.get(asset);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()["cache-control"], asset).toBe("public, max-age=31536000, immutable");
    expect(response.headers()["content-type"], asset).toMatch(asset.endsWith(".js") ? /javascript/ : /text\/css/);
  }
});

test("手机端线上页面加载正常，无脚本异常并留存截图", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今天，掌握一个再向前。" })).toBeVisible();
  expect(await page.evaluate(() => window.isSecureContext || location.hostname === "127.0.0.1")).toBe(true);
  await page.screenshot({ path: "docs/screenshots/staging-today.png", fullPage: true });
  await page.goto("/learn/K001");
  await expect(page.getByRole("heading", { name: "需求类型", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "开始闭卷自测" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/staging-knowledge.png", fullPage: true });
  expect(errors).toEqual([]);
});
