import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  db,
  beginCard,
  patchLearningDraft,
  submitQuestion,
  validateCard,
} from "../src/storage/db";
import { content } from "../src/data/content";
import { defaultSettings } from "../src/domain/study";
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
  checkEssay,
  submitExamEssay,
} from "../src/storage/training";
import {
  exportBackup,
  restoreBackup,
  clearUserData,
  validateBackup,
} from "../src/storage/backup";
beforeEach(async () => {
  await db.open();
  await clearUserData();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});
async function seed() {
  await db.settings.put({ ...defaultSettings, dayOverrides: { K002: 3 } });
  await beginCard("K001");
  const q = content.questions.find((q) => q.id === "RK025")!,
    a = await submitQuestion(q, q.answer);
  await patchLearningDraft("K001", {
    phase: "check",
    recall: "功能与非功能质量约束",
    checks: [true, true],
    questionId: q.id,
    questionAttemptId: a.id,
  });
  await validateCard("K001");
  await patchLearningDraft("K002", {
    phase: "recall",
    recall: "尚未提交的回答",
    checks: [false],
  });
  await db.bookmarks.put({
    questionId: "RK001",
    createdAt: new Date().toISOString(),
  });
  await submitQuestion(content.questions[0], "B");
  const eid = await startExam(["C01", "C04", "C06"], "E01", false),
    e = (await db.exams.get(eid))!;
  await chooseMock(e.sessionId, "RK076", "A");
  await submitMock(e.sessionId);
  for (const cid of e.caseIds) {
    const c = content.cases.find((c) => c.id === cid)!;
    await ensureCase(cid);
    for (const q of c.questions)
      await patchCase(cid, "answers", q.id, "本人的案例作答");
    await revealCase(cid);
    await patchCase(cid, "checks", c.questions[0].scoringRubric[0].id, true);
    await saveCase(cid, eid);
  }
  await db.projects.put({
    id: "project-1",
    name: "真实素材（测试）",
    background: "背景",
    role: "职责",
    decisions: "决策",
    problems: "难点",
    results: "验证",
    reflection: "反思",
    updatedAt: new Date().toISOString(),
  });
  await ensureEssay("E01");
  await patchEssay("E01", {
    projectId: "project-1",
    outline: "提纲",
    body: "测试正文",
  });
  for (const c of content.essayGuide.selfChecks)
    await checkEssay("E01", c.dimension, true);
  await submitExamEssay(eid);
}
it("导出→清空→JSON恢复全部12类数据、尝试、草稿和模考快照一致", async () => {
  await seed();
  const before = await exportBackup();
  const json = JSON.stringify(before);
  await clearUserData();
  expect(await db.cards.count()).toBe(0);
  expect(await db.exams.count()).toBe(0);
  await restoreBackup(JSON.parse(json));
  const after = await exportBackup();
  expect(JSON.parse(JSON.stringify(after.data))).toEqual(JSON.parse(json).data);
});
it("损坏JSON、未来版本、重复ID和错误引用均不改动现有记录", async () => {
  await seed();
  const b = await exportBackup(),
    baseline = JSON.stringify(b.data);
  for (const alter of [
    (x: any) => (x.schemaVersion = 99),
    (x: any) => x.data.cards.push(x.data.cards[0]),
    (x: any) => (x.data.essayDrafts[0].projectId = "missing"),
    (x: any) =>
      (x.data.questionAttempts[0].correct =
        !x.data.questionAttempts[0].correct),
    (x: any) => (x.data.exams[0].caseAttemptIds.C01 = "missing"),
  ]) {
    const bad = JSON.parse(JSON.stringify(b));
    alter(bad);
    await expect(restoreBackup(bad)).rejects.toThrow();
    expect(JSON.stringify((await exportBackup()).data)).toBe(baseline);
  }
  expect(() => validateBackup({})).toThrow("原数据未改动");
});
it("恢复写入中途失败时整个事务回滚，不留下半套数据", async () => {
  await seed();
  const before = await exportBackup();
  const empty = JSON.parse(JSON.stringify(before));
  for (const key of Object.keys(empty.data)) empty.data[key] = [];
  const table = db.table("essayDrafts");
  vi.spyOn(table, "bulkPut").mockRejectedValueOnce(
    new Error("模拟磁盘写入失败"),
  );
  await expect(restoreBackup(empty)).rejects.toThrow("模拟磁盘");
  vi.restoreAllMocks();
  expect(JSON.stringify((await exportBackup()).data)).toBe(
    JSON.stringify(before.data),
  );
});
it("可恢复已有内容版本但稳定ID必须仍存在，案例分数不允许篡改", async () => {
  await seed();
  const b = await exportBackup();
  b.contentVersion = "earlier-content";
  expect(validateBackup(b).contentVersion).toBe("earlier-content");
  b.data.questionAttempts[0].contentVersion = "earlier-content";
  b.data.questionAttempts[0].correct = !b.data.questionAttempts[0].correct;
  expect(validateBackup(b).data.questionAttempts[0].correct).toBe(
    b.data.questionAttempts[0].correct,
  );
  b.data.caseAttempts[0].selfScore = 25;
  expect(() => validateBackup(b)).toThrow("案例自评分");
});
it("资料更新保留历史判分、自检与试卷成绩，不用新文字重判旧尝试", async () => {
  await seed();
  const b = await exportBackup();
  for (const a of b.data.questionAttempts) {
    const q = content.questions.find((q) => q.id === a.questionId)!;
    a.contentVersion = "older-version";
    a.selectedOption = a.correct ? (q.answer === "A" ? "B" : "A") : q.answer;
  }
  b.data.cardAttempts[0].contentVersion = "older-version";
  b.data.cardAttempts[0].checks = [true, true, true];
  b.data.sessions[0].contentVersion = "older-version";
  b.data.sessions[0].correctCount = 1;
  b.data.caseAttempts[0].contentVersion = "older-version";
  b.data.caseAttempts[0].selfScore = 1;
  await restoreBackup(b);
  const restored = await exportBackup();
  expect(restored.data.questionAttempts).toEqual(b.data.questionAttempts);
  expect(restored.data.sessions[0].correctCount).toBe(1);
  expect(restored.data.caseAttempts[0].selfScore).toBe(1);
  expect(restored.data.cardAttempts[0].checks).toHaveLength(3);
});
