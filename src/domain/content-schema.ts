import { z } from "zod";

const text = z.string().trim().min(1);
const priority = z.enum(["A", "B"]);
const knowledgeId = z.string().regex(/^K\d{3}$/);
const questionId = z.string().regex(/^RK\d{3}$/);
export const sourceRefSchema = z
  .object({
    file: text,
    sheet: text.optional(),
    row: z.number().int().positive().optional(),
    section: text.optional(),
    textBlock: z.number().int().positive().optional(),
  })
  .strict();
export const knowledgeCardSchema = z
  .object({
    id: knowledgeId,
    module: text,
    title: text,
    essentials: text,
    pitfalls: text,
    priority,
    relatedQuestionIds: z.array(questionId),
    validationMethod: z.enum(["question-and-self-check", "self-check-only"]),
    sourceRef: sourceRefSchema,
    wordSourceRef: sourceRefSchema,
  })
  .strict();
export const questionSchema = z
  .object({
    id: questionId,
    set: z.enum(["chapter", "mock"]),
    module: text,
    priority,
    stem: text,
    options: z.object({ A: text, B: text, C: text, D: text }).strict(),
    answer: z.enum(["A", "B", "C", "D"]),
    explanation: text,
    origin: z.literal("原创模拟"),
    relatedKnowledgeIds: z.array(knowledgeId),
    sourceRef: sourceRefSchema,
    answerSourceRef: sourceRefSchema,
    contextQuestionId: questionId.optional(),
  })
  .strict();
export const caseSchema = z
  .object({
    id: z.string().regex(/^C\d{2}$/),
    title: text,
    domain: text,
    priority,
    capabilities: text,
    scenario: text,
    origin: z.literal("原创模拟"),
    totalPoints: z.literal(25),
    questions: z
      .array(
        z
          .object({
            id: text,
            text,
            points: z.number().int().positive(),
            referenceAnswer: text,
            scoringRubric: z
              .array(
                z
                  .object({
                    id: text,
                    text,
                    points: z.number().int().positive(),
                  })
                  .strict(),
              )
              .min(1),
            sourceRef: sourceRefSchema,
            answerSourceRef: sourceRefSchema,
          })
          .strict(),
      )
      .length(3),
    scoringText: text,
    reviewAdvice: text,
    sourceRef: sourceRefSchema,
    metadataSourceRef: sourceRefSchema,
  })
  .strict();
export const essaySchema = z
  .object({
    id: z.string().regex(/^E\d{2}$/),
    title: text,
    priority,
    outline: text,
    scenario: text,
    evidenceChecklist: text,
    writingGuidance: z.array(text).length(3),
    sourceRef: sourceRefSchema,
    wordSourceRef: sourceRefSchema,
  })
  .strict();
export const essayGuideSchema = z
  .object({
    notice: text,
    projectFactPrompts: z.array(text).length(6),
    structure: z.array(text).length(7),
    abstractTemplate: text,
    wordCountAdvice: text,
    selfChecks: z
      .array(
        z.object({ dimension: text, question: text, advice: text }).strict(),
      )
      .length(6),
    sourceRef: sourceRefSchema,
  })
  .strict();
export const sourceLinkSchema = z
  .object({
    id: text,
    priority: text,
    title: text,
    category: text,
    url: z
      .string()
      .url()
      .refine((v) => /^https?:\/\//.test(v), "只允许 HTTP(S) 资料链接"),
    notice: text,
    sourceRef: sourceRefSchema,
  })
  .strict();
export const dayPlanSchema = z
  .object({
    day: z.number().int().min(1).max(7),
    title: text,
    knowledgeIds: z.array(knowledgeId),
    caseIds: z.array(z.string().regex(/^C\d{2}$/)),
    essayGoal: text,
  })
  .strict();
export const contentSchema = z
  .object({
    contentVersion: text,
    knowledge: z.array(knowledgeCardSchema),
    questions: z.array(questionSchema),
    cases: z.array(caseSchema),
    essays: z.array(essaySchema),
    essayGuide: essayGuideSchema,
    sources: z.array(sourceLinkSchema),
    plan: z.array(dayPlanSchema),
  })
  .strict();
export type Content = z.infer<typeof contentSchema>;
export type KnowledgeCard = z.infer<typeof knowledgeCardSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Case = z.infer<typeof caseSchema>;
export type EssayTopic = z.infer<typeof essaySchema>;

/** Structural checks are deliberately separate from parsing and never invent missing content. */
export function validateContent(input: unknown): string[] {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success)
    return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  const c = parsed.data;
  const errors: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) errors.push(message);
  };
  const checkIds = (
    items: { id: string }[],
    prefix: string,
    count: number,
    width: number,
  ) => {
    check(
      items.length === count,
      `${prefix} 数量应为 ${count}，实为 ${items.length}`,
    );
    const ids = new Set(items.map((i) => i.id));
    check(ids.size === items.length, `${prefix} 存在重复 ID`);
    for (let n = 1; n <= count; n++)
      check(
        ids.has(prefix + String(n).padStart(width, "0")),
        `缺少 ${prefix}${String(n).padStart(width, "0")}`,
      );
  };
  checkIds(c.knowledge, "K", 76, 3);
  checkIds(c.questions, "RK", 150, 3);
  checkIds(c.cases, "C", 9, 2);
  checkIds(c.essays, "E", 10, 2);
  check(
    c.knowledge.filter((k) => k.priority === "A").length === 57,
    "知识 A 级应为 57",
  );
  check(
    c.knowledge.filter((k) => k.priority === "B").length === 19,
    "知识 B 级应为 19",
  );
  check(
    c.questions.filter((q) => q.set === "chapter").length === 75,
    "章节题应为 75",
  );
  check(
    c.questions.filter((q) => q.set === "mock").length === 75,
    "独立模考应为 75",
  );
  check(new Set(c.questions.map((q) => q.stem)).size === 150, "存在重复题干");
  const knowledge = new Map(c.knowledge.map((k) => [k.id, k]));
  const questions = new Map(c.questions.map((q) => [q.id, q]));
  for (const q of c.questions) {
    check(
      q.set === (Number(q.id.slice(2)) <= 75 ? "chapter" : "mock"),
      `${q.id} 试卷归属错误`,
    );
    if (q.contextQuestionId)
      check(
        q.contextQuestionId !== q.id &&
          questions.get(q.contextQuestionId)?.set === q.set,
        `${q.id} 前置题干引用无效`,
      );
    check(
      new Set(q.relatedKnowledgeIds).size === q.relatedKnowledgeIds.length,
      `${q.id} 关联重复`,
    );
    for (const id of q.relatedKnowledgeIds) {
      check(knowledge.has(id), `${q.id} 关联不存在的知识 ${id}`);
      if (q.set === "chapter")
        check(
          knowledge.get(id)?.relatedQuestionIds.includes(q.id) ?? false,
          `${q.id}/${id} 双向关联不一致`,
        );
    }
  }
  for (const k of c.knowledge) {
    check(
      new Set(k.relatedQuestionIds).size === k.relatedQuestionIds.length,
      `${k.id} 关联重复`,
    );
    check(
      k.validationMethod ===
        (k.relatedQuestionIds.length
          ? "question-and-self-check"
          : "self-check-only"),
      `${k.id} 自测方式错误`,
    );
    for (const id of k.relatedQuestionIds) {
      check(
        questions.get(id)?.set === "chapter",
        `${k.id} 不能把独立模考试题用作日常关联练习`,
      );
      check(
        questions.get(id)?.relatedKnowledgeIds.includes(k.id) ?? false,
        `${k.id}/${id} 双向关联不一致`,
      );
    }
  }
  for (const item of c.cases) {
    check(
      item.questions.reduce((s, q) => s + q.points, 0) === 25,
      `${item.id} 小问分数不是 25`,
    );
    const ids = item.questions.flatMap((q) => [
      q.id,
      ...q.scoringRubric.map((r) => r.id),
    ]);
    check(new Set(ids).size === ids.length, `${item.id} 小问/采分点 ID 重复`);
    for (const q of item.questions)
      check(
        q.scoringRubric.reduce((s, r) => s + r.points, 0) === q.points,
        `${q.id} 采分点与小问分值不符`,
      );
  }
  check(
    c.plan.length === 7 && new Set(c.plan.map((d) => d.day)).size === 7,
    "计划必须为 D1—D7",
  );
  for (const day of c.plan) {
    check(
      day.knowledgeIds.length === [15, 15, 15, 15, 16, 0, 0][day.day - 1],
      `D${day.day} 数量错误`,
    );
    for (const id of day.caseIds)
      check(
        c.cases.some((x) => x.id === id),
        `D${day.day} 未知案例 ${id}`,
      );
  }
  const planned = c.plan.flatMap((d) => d.knowledgeIds);
  check(
    planned.length === 76 &&
      new Set(planned).size === 76 &&
      planned.every((id) => knowledge.has(id)),
    "计划知识有重复或遗漏",
  );
  return errors;
}
