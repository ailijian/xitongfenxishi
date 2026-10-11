import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Content } from "../../src/domain/content-schema";
const content = {
  questions: JSON.parse(
    readFileSync(
      new URL("../../src/data/questions.json", import.meta.url),
      "utf8",
    ),
  ),
  cases: JSON.parse(
    readFileSync(new URL("../../src/data/cases.json", import.meta.url), "utf8"),
  ),
} as Pick<Content, "questions" | "cases">;
async function answerCase(page: import("@playwright/test").Page, id: string) {
  const c = content.cases.find((c) => c.id === id)!;
  for (const q of c.questions)
    await page
      .getByRole("textbox", { name: `${q.id} 我的独立回答` })
      .fill("自动化验收输入：这是独立作答草稿，仅用于验证保存和自评交互。");
  await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  await expect(
    page.getByRole("heading", { name: "参考答案", exact: true }),
  ).toHaveCount(3);
  const boxes = page.getByRole("checkbox");
  await expect(boxes).toHaveCount(
    c.questions.flatMap((q) => q.scoringRubric).length,
  );
  for (const box of await boxes.all()) await box.check();
  await expect(
    page.getByRole("heading", { name: "本次自评 25 / 25 分" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "保存本次案例训练" }).click();
  await expect(page.getByRole("status")).toContainText("训练记录已保存");
}
test("案例按原文自评，历史与论文项目素材重启仍保存", async ({ page }) => {
  await page.goto("/cases/C01");
  await expect(
    page.getByRole("heading", { name: "参考答案", exact: true }),
  ).toHaveCount(0);
  await answerCase(page, "C01");
  await page
    .getByRole("heading", { name: "本次自评 25 / 25 分" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/screenshots/final-case.png" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "训练历史 · 1次" }),
  ).toBeVisible();
  await page.goto("/essays/E01");
  await page.getByRole("button", { name: "新建项目素材" }).click();
  await page
    .getByRole("textbox", { name: "项目名称", exact: true })
    .fill("验收测试项目");
  await page
    .getByRole("textbox", { name: "本人真实职责" })
    .fill("测试输入：只用于浏览器验收，不作为学习示范经历。");
  await page
    .getByRole("textbox", { name: "我的论文提纲" })
    .fill("问题→分析→方案取舍→实施与验证→反思");
  await page
    .getByRole("textbox", { name: "我的论文正文" })
    .fill("自动化验收草稿，验证浏览器重新载入后正文保留。");
  await expect(page.locator(".word-count")).toContainText("正文 23 字");
  await page.goto("/progress");
  await page.goto("/essays/E01");
  await expect(page.getByRole("textbox", { name: "我的论文正文" })).toHaveValue(
    "自动化验收草稿，验证浏览器重新载入后正文保留。",
  );
  await expect(
    page.getByRole("textbox", { name: "项目名称", exact: true }),
  ).toHaveValue("验收测试项目");
  await page
    .getByRole("heading", { name: "正文草稿" })
    .scrollIntoViewIfNeeded();
  await page
    .getByRole("heading", { name: "正文草稿" })
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24),
    );
  await page.screenshot({ path: "docs/screenshots/final-essay.png" });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 TXT" }).click();
  expect((await download).suggestedFilename()).toBe("E01-论文.txt");
});
test("75题整卷不泄漏答案，可跳题退出继续，三案例及论文完成一场", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/mock");
  await page.getByRole("button", { name: "开始本场完整模考" }).click();
  await expect(
    page.getByRole("heading", { name: "本场综合模考" }),
  ).toBeVisible();
  const runUrl = page.url();
  const questions = content.questions.filter((q) => q.set === "mock");
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await expect(
      page.getByText(`第 ${i + 1} / 75 题 · ${q.id} · 原创模拟`),
    ).toBeVisible();
    await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
    if (i === 0)
      expect(
        await page.locator(".option-button").evaluateAll((buttons) =>
          buttons.every((button) => {
            const bounds = button.getBoundingClientRect(),
              walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (!node.textContent?.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              const rect = range.getBoundingClientRect();
              if (
                rect.bottom > bounds.bottom + 1 ||
                rect.right > bounds.right + 1 ||
                rect.left < bounds.left - 1
              )
                return false;
            }
            return true;
          }),
        ),
      ).toBe(true);
    const button = page.getByRole("button", {
      name: `${q.answer} ${q.options[q.answer]}`,
      exact: true,
    });
    await button.click();
    await expect(button).toHaveClass(/selected/);
    if (i === 0) {
      await page.goto("/");
      await page.goto(runUrl);
      await expect(button).toHaveClass(/selected/);
    }
    if (i < 74)
      await page.getByRole("button", { name: "下一题", exact: true }).click();
  }
  await page.getByRole("button", { name: "交整卷，查看成绩" }).click();
  await page.getByRole("button", { name: "确认交卷", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "选择卷 · 75 / 75分" }),
  ).toBeVisible();
  await page.getByText("题号导航 · 点击跳题", { exact: true }).click();
  await page.getByRole("button", { name: "1 ✓", exact: true }).click();
  await page.getByText("题号导航 · 点击跳题", { exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/final-mock.png" });
  for (const cid of ["C01", "C04", "C06"]) {
    await page.goto(
      runUrl.replace("/mock", "/cases/" + cid).replace("?run=", "?exam="),
    );
    await answerCase(page, cid);
  }
  await page.goto(runUrl);
  await expect(
    page.getByText("自评合计 75 / 75 分，来自原文采分组。"),
  ).toBeVisible();
  await page.getByRole("link", { name: "继续论文写作" }).click();
  await page.getByRole("textbox", { name: "我的论文提纲" }).fill("验收用提纲");
  await page
    .getByRole("textbox", { name: "我的论文正文" })
    .fill("验收用提交快照正文。");
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  for (const b of await page.getByRole("checkbox").all()) await b.check();
  await page
    .getByRole("button", { name: "确认完整论文并提交本场模考" })
    .click();
  await expect(page.getByRole("status")).toContainText("保存快照");
  await page.goto(runUrl);
  await expect(
    page.getByText("选择、案例与论文已完成，记录全部保留。"),
  ).toBeVisible();
});
test('收藏入口在整卷交卷前不泄漏模考判分，交卷后可以重练',async({page})=>{
 await page.goto('/mock');await page.getByRole('button',{name:'开始本场完整模考'}).click();await expect(page.getByRole('heading',{name:'本场综合模考'})).toBeVisible();const url=page.url(),q=content.questions.find(q=>q.id==='RK076')!;
 await page.getByRole('button',{name:'收藏本题',exact:true}).click();await expect(page.getByRole('button',{name:'取消收藏',exact:true})).toBeVisible();
 await page.goto('/practice?mode=favorites');await expect(page.getByText('模考收藏题在整卷交卷后开放单题练习。正在进行的同卷训练必须先交卷；历史成绩、错题和已提交的单题记录不会解锁本场答案。')).toBeVisible();await expect(page.getByRole('button',{name:'提交答案',exact:true})).toHaveCount(0);await expect(page.getByText(/正确答案 [ABCD]/)).toHaveCount(0);
 await page.goto(url);const option=page.getByRole('button',{name:`${q.answer} ${q.options[q.answer]}`,exact:true});await option.click();await expect(option).toHaveClass(/selected/);await page.getByRole('button',{name:'交整卷，查看成绩'}).click();await page.getByRole('button',{name:'确认交卷',exact:true}).click();await expect(page.getByRole('heading',{name:'选择卷 · 1 / 75分'})).toBeVisible();
 // The stored question list stays stable while locked; submission unlocks it reactively.
 await page.goto('/practice?mode=favorites');await expect(page.getByRole('heading',{name:q.stem,exact:true})).toBeVisible();await page.getByRole('button',{name:`${q.answer} ${q.options[q.answer]}`,exact:true}).click();await page.getByRole('button',{name:'提交答案',exact:true}).click();await expect(page.getByText('回答正确',{exact:true})).toBeVisible();
});
