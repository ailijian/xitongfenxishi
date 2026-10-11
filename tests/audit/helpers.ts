import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Content } from "../../src/domain/content-schema";

export const knowledge = JSON.parse(readFileSync(new URL("../../src/data/knowledge.json", import.meta.url), "utf8")) as Content["knowledge"];
export const questions = JSON.parse(readFileSync(new URL("../../src/data/questions.json", import.meta.url), "utf8")) as Content["questions"];
export const cases = JSON.parse(readFileSync(new URL("../../src/data/cases.json", import.meta.url), "utf8")) as Content["cases"];
export const essays = JSON.parse(readFileSync(new URL("../../src/data/essays.json", import.meta.url), "utf8")) as Content["essays"];

// Read committed browser data without importing application code or changing records.
export async function records(page: Page, table: string) {
  return page.evaluate(async (table) => {
    const request = indexedDB.open("ruankao-system-analyst");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const tx = db.transaction(table, "readonly");
      const get = tx.objectStore(table).getAll();
      return await new Promise<any[]>((resolve, reject) => {
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      });
    } finally { db.close(); }
  }, table);
}

export async function selfTest(page: Page, id = "K001", correct = true) {
  const card = knowledge.find((k) => k.id === id)!;
  await page.getByRole("button", { name: /开始闭卷自测/ }).click();
  await page.getByRole("textbox", { name: "闭卷回答" }).fill(`测试输入：${card.essentials}`);
  await page.getByRole("button", { name: "揭示对照要点" }).click();
  await expect(page.locator("main input[type=checkbox]")).toHaveCount(card.essentials.split(/[；;]/).filter((s) => s.trim()).length);
  for (const checkbox of await page.locator("main input[type=checkbox]").all()) await checkbox.check();
  if (card.relatedQuestionIds.length) {
    const questionText = await page.locator(".answer h2").textContent();
    const q = questions.find((q) => questionText!.includes(q.id))!;
    const option = correct ? q.answer : (q.answer === "A" ? "B" : "A");
    await page.getByRole("button", { name: `${option} ${q.options[option]}`, exact: true }).click();
    await page.getByRole("button", { name: "提交关联答案" }).click();
    await expect(page.getByText(correct ? /回答正确 · 答案/ : /回答错误，已加入错题本/)).toBeVisible();
  }
  await page.getByRole("button", { name: "提交本次自测" }).click();
  await expect(page.getByRole("status")).toContainText(correct ? /首轮验收通过|巩固掌握/ : "本次未通过");
}

export async function answerCase(page: Page, id: string, selected = "all") {
  const c = cases.find((c) => c.id === id)!;
  for (const q of c.questions) await page.getByRole("textbox", { name: `${q.id} 我的独立回答` }).fill(`审计输入 ${q.id}：独立回答草稿`);
  await page.getByRole("button", { name: "作答完成，揭示参考答案" }).click();
  await expect(page.getByRole("heading", { name: "参考答案", exact: true })).toHaveCount(3);
  const rubrics = c.questions.flatMap((q) => q.scoringRubric);
  const boxes = page.locator("main input[type=checkbox]");
  await expect(boxes).toHaveCount(rubrics.length);
  let score = 0;
  for (let i = 0; i < rubrics.length; i++) {
    if (selected === "all" || i % 2 === 0) { await boxes.nth(i).check(); score += rubrics[i].points; }
  }
  await expect(page.getByRole("heading", { name: `本次自评 ${score} / 25 分` })).toBeVisible();
  await page.getByRole("button", { name: "保存本次案例训练" }).click();
  await expect(page.getByRole("status")).toContainText(`自评 ${score} / 25 分`);
  return score;
}

export async function downloadBackup(page: Page) {
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出完整 JSON 备份" }).click();
  const path = await (await event).path();
  return { path: path!, backup: JSON.parse(readFileSync(path!, "utf8")) };
}
