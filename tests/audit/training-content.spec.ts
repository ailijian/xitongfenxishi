import { test, expect } from "@playwright/test";
import { answerCase, cases, essays, records } from "./helpers";

test("论文专题的30段Word提示与元数据一致，并能在正常页面读取", async ({ page }) => {
  for (const essay of essays) {
    await page.goto(`/essays/${essay.id}`);
    const displayed = [essay.outline, essay.scenario, essay.evidenceChecklist];
    for (let i = 0; i < essay.writingGuidance.length; i++) {
      // Word and Excel contain the same text; the UI presents prefixes as headings.
      const text = essay.writingGuidance[i].replace(/^(写作主线|模拟情境|必须准备)：/, "");
      expect(text).toBe(displayed[i]);
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  }
});

test("全部9套案例：三问作答、采分自评、刷新和多次训练历史互不覆盖", async ({ page }) => {
  test.setTimeout(120000);
  for (const c of cases) {
    await page.goto(`/cases/${c.id}`);
    await expect(page.getByRole("heading", { name: c.title, exact: true })).toBeVisible();
    const firstScore = await answerCase(page, c.id, "alternate");
    const first = (await records(page, "caseAttempts")).find((a) => a.caseId === c.id)!;
    expect(first.selfScore).toBe(firstScore);
    await page.reload();
    await expect(page.getByRole("heading", { name: "训练历史 · 1次" })).toBeVisible();
    await page.getByRole("button", { name: "开始新一次作答" }).click();
    await expect(page.getByRole("textbox").first()).toHaveValue("");
    await answerCase(page, c.id);
    const history = (await records(page, "caseAttempts")).filter((a) => a.caseId === c.id);
    expect(history).toHaveLength(2);
    expect(history.find((a) => a.id === first.id)).toEqual(first);
    expect(history.find((a) => a.id !== first.id).selfScore).toBe(25);
    await expect(page.getByRole("heading", { name: "训练历史 · 2次" })).toBeVisible();
  }
});

test("全部10个论文专题：草稿分别保存，刷新及重开无串题", async ({ page, context }) => {
  test.setTimeout(90000);
  for (let n = 1; n <= 10; n++) {
    const id = `E${String(n).padStart(2, "0")}`;
    await page.goto(`/essays/${id}`);
    await page.getByRole("textbox", { name: "我的论文提纲" }).fill(`${id}的独立提纲`);
    await page.getByRole("textbox", { name: "我的论文正文" }).fill(`${id}的独立正文，Unicode验收📝`);
    await expect.poll(async () => (await records(page, "essayDrafts")).find((d) => d.essayId === id)?.body).toBe(`${id}的独立正文，Unicode验收📝`);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "我的论文提纲" })).toHaveValue(`${id}的独立提纲`);
    await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(`${id}的独立正文，Unicode验收📝`);
  }
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/essays/E01");
  expect(await records(reopened, "essayDrafts")).toHaveLength(10);
  for (let n = 1; n <= 10; n++) {
    const id = `E${String(n).padStart(2, "0")}`;
    await reopened.goto(`/essays/${id}`);
    await expect(reopened.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(`${id}的独立正文，Unicode验收📝`);
  }
});
