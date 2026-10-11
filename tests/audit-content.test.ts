import { it, expect } from "vitest";
import { content } from "../src/data/content";
import review from "../scripts/audit-link-review.json";

it("审计样本直接对应原文概念且在双向章节关联中，不以模块名代替语义", () => {
  expect(review.samples.length).toBeGreaterThanOrEqual(20);
  for (const sample of review.samples) {
    const k = content.knowledge.find((k) => k.id === sample.knowledgeId)!;
    const q = content.questions.find((q) => q.id === sample.questionId)!;
    expect(k.essentials, `${k.id}原文概念`).toContain(sample.cardConcept);
    expect(`${q.stem} ${q.options[q.answer]} ${q.explanation}`, `${q.id}考查内容`).toContain(sample.questionConcept);
    expect(k.relatedQuestionIds, `${k.id} -> ${q.id}`).toContain(q.id);
    expect(q.relatedKnowledgeIds, `${q.id} -> ${k.id}`).toContain(k.id);
    expect(q.set).toBe("chapter");
  }
});

it("不以敏捷宣言、OAuth等宽泛同主题题目验证更窄的知识要点", () => {
  for (const rejected of review.rejected) {
    expect(content.questions.find((q) => q.id === rejected.questionId)!.relatedKnowledgeIds, rejected.rationale).not.toContain(rejected.knowledgeId);
    expect(content.knowledge.find((k) => k.id === rejected.knowledgeId)!.relatedQuestionIds).not.toContain(rejected.questionId);
  }
});
