import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { questions, records } from "./helpers";
const screenshots = process.env.AUDIT_SCREENSHOTS || "docs/audit/screenshots";

for (const width of [320, 375, 390, 430]) {
  test(`${width}px：长题干换行、点击热区、底部导航和缩小视口输入滚动`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const targetIssues: unknown[] = [];
    for (const route of ["/", "/learn/K075", "/practice?question=RK011", "/cases/C09", "/essays/E10", "/progress", "/mock"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      const issues = await page.locator("button, .bottom-nav > a, .check-row").evaluateAll((elements) => elements.flatMap((el) => {
        const r = el.getBoundingClientRect();
        return r.width && r.height && (r.height < 44 || r.width < 44) ? [{ text: el.textContent?.trim(), width: r.width, height: r.height }] : [];
      }));
      targetIssues.push(...issues.map((issue) => ({ route, ...issue })));
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bounds = await page.evaluate(() => ({ footer: document.querySelector(".site-footer")!.getBoundingClientRect().bottom, nav: document.querySelector(".bottom-nav")!.getBoundingClientRect().top }));
      expect(bounds.footer, `${route}: footer clears bottom navigation`).toBeLessThanOrEqual(bounds.nav + 1);
      if (route === "/" && width === 375) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `${screenshots}/today-375.png` });
      }
      if (route === "/learn/K075" && width === 390) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `${screenshots}/knowledge-390.png` });
      }
    }
    await info.attach(`touch-targets-${width}`, { body: JSON.stringify(targetIssues, null, 2), contentType: "application/json" });
    expect(targetIssues).toEqual([]);
    await page.goto("/practice?question=RK011");
    await expect(page.locator(".option-button")).toHaveCount(4);
    expect(await page.locator(".option-button").evaluateAll((buttons) => buttons.every((el) => {
      const bounds = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) if (rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1) return false;
      }
      return true;
    }))).toBe(true);
    await page.goto("/essays/E10");
    const editor = page.getByRole("textbox", { name: "我的论文正文" });
    await editor.focus();
    await page.setViewportSize({ width, height: 500 });
    await editor.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await editor.fill("缩小视口后的输入滚动验收");
    await expect.poll(async () => (await records(page, "essayDrafts"))[0]?.body).toBe("缩小视口后的输入滚动验收");
    const editorBounds = await editor.boundingBox();
    expect(editorBounds!.y).toBeLessThan(420);
    expect(editorBounds!.y + editorBounds!.height).toBeGreaterThan(0);
  });
}

test("首次联网缓存后，断网关页重开可学习、答题、案例自评、论文保存与创建模考", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cache = await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((name) => name.includes("workbox-precache"))!;
    return (await (await caches.open(name)).keys()).map((r) => r.url);
  });
  // Workbox's build log counts duplicate includeAssets entries; verify unique URLs.
  const expected = [...new Set([...readFileSync("dist/sw.js", "utf8").matchAll(/url:"([^" ]+)"/g)].map((m) => `/${m[1]}`))];
  expect(cache.map((url) => new URL(url).pathname).sort()).toEqual(expected.sort());
  expect(cache.some((url) => /content-.*\.js/.test(url))).toBe(true);
  await context.setOffline(true);
  await page.close();
  const offline = await context.newPage();
  for (const id of ["K001", "K014", "K075", "K076"]) {
    await offline.goto(`/learn/${id}`);
    await expect(offline.locator("main h1")).toBeVisible();
  }
  await offline.goto("/practice?question=RK057");
  await expect(offline.getByText(/EV=80、AC=100、PV=90/)).toBeVisible();
  await offline.getByRole("button", { name: /A.*0.89/ }).click();
  await offline.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(offline.getByText(/正确答案 A/)).toBeVisible();
  await offline.goto("/cases/C09");
  await expect(offline.getByRole("textbox")).toHaveCount(3);
  for (const textbox of await offline.getByRole("textbox").all()) await textbox.fill("离线独立回答保存验收");
  await offline.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  await expect(offline.getByRole("heading", { name: "参考答案", exact: true })).toHaveCount(3);
  await offline.goto("/essays/E10");
  await offline.getByRole("textbox", { name: "我的论文正文" }).fill("离线保存后重开草稿恢复");
  await expect.poll(async () => (await records(offline, "essayDrafts"))[0]?.body).toBe("离线保存后重开草稿恢复");
  await offline.close();
  const reopened = await context.newPage();
  await reopened.goto("/essays/E10");
  await expect(reopened.getByRole("textbox", { name: "我的论文正文" })).toHaveValue("离线保存后重开草稿恢复");
  await reopened.goto("/mock");
  await reopened.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(reopened.getByText("第 1 / 75 题 · RK076 · 原创模拟")).toBeVisible();
  const q = questions.find((q) => q.id === "RK076")!;
  await reopened.getByRole("button", { name: `${q.answer} ${q.options[q.answer]}`, exact: true }).click();
  await expect(reopened.getByRole("heading", { name: "选择卷 · 已答 1 / 75题" })).toBeVisible();
  await reopened.reload();
  await expect(reopened.getByRole("heading", { name: "选择卷 · 已答 1 / 75题" })).toBeVisible();
  await expect(reopened.getByText("离线模式", { exact: true })).toBeVisible();
});

test("线上资源版本与当前构建文件逐字节一致", async ({ request, baseURL }, info) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const html = await res.text();
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  const paths = new Set([...html.matchAll(/(?:src|href)="(\/(?:assets\/[^" ]+|manifest\.webmanifest))"/g)].map((match) => match[1]));
  for (const match of (await sw.text()).matchAll(/url:"([^" ]+)"/g)) if (!match[1].includes("http")) paths.add(`/${match[1]}`);
  paths.add("/sw.js");
  const workbox = (await sw.text()).match(/define\(\["\.\/(workbox-[^"]+)"/);
  expect(workbox).toBeTruthy();
  paths.add(`/${workbox![1]}.js`);
  const compared: string[] = [];
  for (const path of paths) {
    const local = `dist${path}`;
    const remote = await request.get(path);
    expect(remote.status(), path).toBe(200);
    expect(await remote.body(), path).toEqual(readFileSync(local));
    compared.push(path);
  }
  expect(compared).toHaveLength(58);
  expect(compared.filter((path) => path.startsWith("/lesson-diagrams/"))).toHaveLength(41);
  await info.attach("served-artifacts", { body: JSON.stringify({ baseURL, compared }, null, 2), contentType: "application/json" });
  if (baseURL?.startsWith("https:")) writeFileSync(`${process.env.AUDIT_EVIDENCE_DIR || "docs/audit/final"}/served-artifacts.json`, JSON.stringify({ baseURL, compared }, null, 2));
});
