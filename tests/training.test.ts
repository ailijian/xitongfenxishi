import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, StudyDB } from "../src/storage/db";
import { content } from "../src/data/content";
import { caseScore, characterCount, mockScore } from "../src/domain/training";
import {
  ensureCase,
  patchCase,
  revealCase,
  saveCase,
  ensureEssay,
  patchEssay,
  startExam,
  chooseMock,
  submitMock,
  submitExamEssay,
  checkEssay,
} from "../src/storage/training";
beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await db.delete();
});
describe("原文训练与整卷隔离", () => {
  it("九套案例仅按原文采分组，全部为25分，漏组扣除该组分值", () => {
    for (const c of content.cases) {
      const rubrics = c.questions.flatMap((q) => q.scoringRubric),
        checks = Object.fromEntries(rubrics.map((r) => [r.id, true]));
      expect(caseScore(c.id, checks)).toBe(25);
      checks[rubrics[0].id] = false;
      expect(caseScore(c.id, checks)).toBe(25 - rubrics[0].points);
    }
  });
  it("先独立回答三问才能揭示；多次训练与历史答案互不覆盖", async () => {
    const c = content.cases[0];
    await ensureCase(c.id);
    await expect(revealCase(c.id)).rejects.toThrow("全部三个");
    for (const q of c.questions)
      await patchCase(c.id, "answers", q.id, "独立回答测试");
    await revealCase(c.id);
    const a = await saveCase(c.id);
    expect(a.selfScore).toBe(0);
    const r = c.questions[0].scoringRubric[0];
    await patchCase(c.id, "checks", r.id, true);
    const b = await saveCase(c.id);
    expect(b.selfScore).toBe(r.points);
    expect(await db.caseAttempts.get(a.id)).toEqual(a);
    expect(await db.caseAttempts.count()).toBe(2);
  });
  it("模考未交卷不写作答成绩，选择原子保存，整卷后才进入错题和成绩", async () => {
    const id = await startExam(["C01", "C04", "C06"], "E01", false),
      e = (await db.exams.get(id))!,
      q = content.questions.find((q) => q.id === "RK076")!;
    await chooseMock(e.sessionId, q.id, q.answer === "A" ? "B" : "A");
    expect(await db.questionAttempts.count()).toBe(0);
    expect((await db.sessions.get(e.sessionId))?.correctCount).toBeUndefined();
    const s = await submitMock(e.sessionId);
    expect(s.correctCount).toBe(0);
    expect(await db.questionAttempts.count()).toBe(1);
    await expect(chooseMock(e.sessionId, q.id, q.answer)).rejects.toThrow();
    await submitMock(e.sessionId);
    expect(await db.questionAttempts.count()).toBe(1);
  });
  it("模考分数只计算75个独立题，未答计0分，不计章节题", () => {
    const answers = Object.fromEntries(
      content.questions.map((q) => [q.id, q.answer]),
    );
    expect(mockScore(answers)).toBe(75);
    delete answers.RK076;
    expect(mockScore(answers)).toBe(74);
    expect(mockScore({ RK001: "A" })).toBe(0);
  });
  it("论文提交需要本场三案例与自查，保留提交快照，后续修改不覆盖", async () => {
    const id = await startExam(["C01", "C04", "C06"], "E01", false),
      e = (await db.exams.get(id))!;
    await ensureEssay("E01");
    await patchEssay("E01", { outline: "本人的提纲", body: "本人完成的论文" });
    await expect(submitExamEssay(id)).rejects.toThrow("先交选择卷");
    await submitMock(e.sessionId);
    for (const cid of e.caseIds) {
      const c = content.cases.find((c) => c.id === cid)!;
      await ensureCase(cid);
      for (const q of c.questions)
        await patchCase(cid, "answers", q.id, "独立回答");
      await revealCase(cid);
      await saveCase(cid, id);
    }
    await expect(submitExamEssay(id)).rejects.toThrow("六项");
    for (const c of content.essayGuide.selfChecks)
      await checkEssay("E01", c.dimension, true);
    await submitExamEssay(id);
    await patchEssay("E01", { body: "后续修订" });
    expect((await db.exams.get(id))?.essaySnapshot?.body).toBe(
      "本人完成的论文",
    );
  });
  it("中文、换行、空白与Unicode字数按可说明口径计数", () => {
    expect(characterCount("中 文\nA🙂")).toBe(4);
  });
});
it("数据库v1升级到v2保留知识状态、题目尝试与日期", async () => {
  const name = "upgrade-test";
  const old = new Dexie(name);
  old.version(1).stores({
    settings: "id",
    cards: "cardId,status,reviewDueAt",
    cardAttempts: "id,cardId,createdAt,order",
    questionAttempts: "id,questionId,set,submittedAt,order",
    learningDrafts: "cardId",
    sessions: "id,set",
    bookmarks: "questionId",
  });
  await old.table("cards").put({
    cardId: "K001",
    status: "initial",
    firstPassAt: "2026-10-11T02:00:00Z",
    updatedAt: "2026-10-11T02:00:00Z",
  });
  await old.table("settings").put({
    id: "settings",
    studyStartDate: "2026-10-10",
    dayOverrides: { K002: 3 },
  });
  await old.table("questionAttempts").put({
    id: "old-attempt",
    questionId: "RK001",
    set: "chapter",
    selectedOption: "A",
    correct: true,
    order: 1,
    submittedAt: "2026-10-11T02:00:00Z",
  });
  old.close();
  const upgraded = new StudyDB(name);
  await upgraded.open();
  expect((await upgraded.cards.get("K001"))?.firstPassAt).toBe(
    "2026-10-11T02:00:00Z",
  );
  expect((await upgraded.settings.get("settings"))?.studyStartDate).toBe(
    "2026-10-10",
  );
  expect((await upgraded.questionAttempts.get("old-attempt"))?.correct).toBe(
    true,
  );
  expect(await upgraded.essayDrafts.count()).toBe(0);
  await upgraded.delete();
});
it("未交模考卷时收藏或单题入口不能提前判分；整卷后可以二刷", async () => {
  const { submitQuestion } = await import("../src/storage/db");
  const q = content.questions.find((q) => q.id === "RK076")!;
  await expect(submitQuestion(q, q.answer)).rejects.toThrow("整卷交卷");
  expect(await db.questionAttempts.count()).toBe(0);
  const id = await startExam(["C01", "C04", "C06"], "E01", false),
    e = (await db.exams.get(id))!;
  await submitMock(e.sessionId);
  await expect(submitQuestion(q, q.answer)).resolves.toMatchObject({
    correct: true,
  });
});
