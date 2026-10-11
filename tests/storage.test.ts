import "fake-indexeddb/auto";
import { afterEach, describe, it, expect } from "vitest";
import {
  db,
  beginCard,
  patchLearningDraft,
  submitQuestion,
  validateCard,
  unresolvedWrong,
} from "../src/storage/db";
import { content } from "../src/data/content";
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
describe("IndexedDB持久化与错题", () => {
  it("打开卡片只记录学习中，不产生首轮通过", async () => {
    await beginCard("K001");
    expect(await db.cards.get("K001")).toMatchObject({ status: "learning" });
    expect((await db.cards.get("K001"))?.firstPassAt).toBeUndefined();
  });
  it("错误入错题本，正确二刷保留尝试并移出待复习", async () => {
    const q = content.questions[0];
    await submitQuestion(q, "B");
    expect(unresolvedWrong(await db.questionAttempts.toArray())).toEqual([
      "RK001",
    ]);
    await submitQuestion(q, "A");
    expect(await db.questionAttempts.count()).toBe(2);
    expect(unresolvedWrong(await db.questionAttempts.toArray())).toEqual([]);
  });
  it("相关选择题答错，已掌握知识变为需复习", async () => {
    await db.cards.put({
      cardId: "K002",
      status: "consolidated",
      firstPassAt: "2026-10-01T00:00:00Z",
      consolidatedAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
    });
    await submitQuestion(content.questions[0], "B");
    expect(await db.cards.get("K002")).toMatchObject({
      status: "needs-review",
      consolidatedAt: undefined,
    });
  });
  it("OAuth错题不会误将RBAC/ABAC知识改成需复习，直接RBAC错题仍会", async () => {
    await db.cards.put({
      cardId: "K052", status: "consolidated",
      firstPassAt: "2026-10-01T00:00:00Z", consolidatedAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
    });
    const oauth = content.questions.find((q) => q.id === "RK119")!;
    await db.sessions.put({
      id: "submitted-mock", set: "mock", questionIds: content.questions.filter((q) => q.set === "mock").map((q) => q.id),
      answers: {}, submittedQuestionIds: [], index: 0, createdAt: "2026-10-01T00:00:00Z", submittedAt: "2026-10-02T00:00:00Z",
    });
    await submitQuestion(oauth, oauth.answer === "A" ? "B" : "A");
    expect((await db.cards.get("K052"))?.status).toBe("consolidated");
    const rbac = content.questions.find((q) => q.id === "RK044")!;
    await submitQuestion(rbac, rbac.answer === "A" ? "B" : "A");
    expect((await db.cards.get("K052"))?.status).toBe("needs-review");
  });
  it("闭卷自检与当前可信题答案同时通过才保存首轮和尝试", async () => {
    const q = content.questions.find((q) => q.id === "RK025")!;
    const a = await submitQuestion(q, "C");
    await patchLearningDraft("K001", {
      phase: "check",
      recall: "功能做什么；非功能质量约束",
      checks: [true, true],
      questionId: q.id,
      questionAttemptId: a.id,
    });
    expect((await validateCard("K001")).passed).toBe(true);
    expect((await db.cards.get("K001"))?.status).toBe("initial");
    expect(await db.cardAttempts.count()).toBe(1);
    expect(await db.learningDrafts.get("K001")).toBeUndefined();
  });
  it("不能用无关题的正确答案冒充知识验证", async () => {
    const a = await submitQuestion(content.questions[0], "A");
    await patchLearningDraft("K001", {
      phase: "check",
      recall: "功能与非功能",
      checks: [true, true],
      questionId: "RK001",
      questionAttemptId: a.id,
    });
    expect((await validateCard("K001")).passed).toBe(false);
  });
  it("数据库重开后草稿与未提交选项仍存在", async () => {
    await patchLearningDraft("K001", {
      phase: "recall",
      recall: "我的闭卷回答",
    });
    await db.sessions.put({
      id: "practice:chapter:",
      set: "chapter",
      questionIds: ["RK001"],
      answers: { RK001: "B" },
      submittedQuestionIds: [],
      index: 0,
      createdAt: new Date().toISOString(),
    });
    db.close();
    await db.open();
    expect((await db.learningDrafts.get("K001"))?.recall).toBe("我的闭卷回答");
    expect((await db.sessions.get("practice:chapter:"))?.answers).toEqual({
      RK001: "B",
    });
  });
});
