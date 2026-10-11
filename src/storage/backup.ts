import { z } from "zod";
import { db } from "./db";
import { content } from "../data/content";
import { dateOrdinal, recallPoints } from "../domain/study";
import { caseScore, mockScore } from "../domain/training";
const stamp = z.string().datetime({ offset: true });
const kid = z
  .string()
  .refine((id) => content.knowledge.some((k) => k.id === id));
const qid = z
  .string()
  .refine((id) => content.questions.some((q) => q.id === id));
const cid = z.string().refine((id) => content.cases.some((c) => c.id === id));
const eid = z.string().refine((id) => content.essays.some((e) => e.id === id));
const rid = z.string().min(1).max(200);
const option = z.enum(["A", "B", "C", "D"]);
const strings = z.record(z.string(), z.string());
const checks = z.record(z.string(), z.boolean());
const card = z
  .object({
    cardId: kid,
    status: z.enum(["learning", "initial", "consolidated", "needs-review"]),
    firstPassAt: stamp.optional(),
    consolidatedAt: stamp.optional(),
    reviewDueAt: stamp.optional(),
    validationMethod: z
      .enum(["question-and-self-check", "self-check-only"])
      .optional(),
    updatedAt: stamp,
  })
  .strict();
const questionAttempt = z
  .object({
    contentVersion: z.string().min(1).optional(),
    id: rid,
    questionId: qid,
    set: z.enum(["chapter", "mock"]),
    selectedOption: option,
    correct: z.boolean(),
    submittedAt: stamp,
    order: z.number().int().positive(),
  })
  .strict();
const cardAttempt = z
  .object({
    contentVersion: z.string().min(1).optional(),
    id: rid,
    cardId: kid,
    recall: z.string().min(1),
    checks: z.array(z.boolean()),
    questionAttemptId: rid.optional(),
    passed: z.boolean(),
    createdAt: stamp,
    kind: z.enum(["first", "review"]),
    order: z.number().int().positive(),
  })
  .strict();
const learningDraft = z
  .object({
    contentVersion: z.string().min(1).optional(),
    cardId: kid,
    phase: z.enum(["read", "recall", "check"]),
    recall: z.string(),
    checks: z.array(z.boolean()),
    questionId: qid.optional(),
    selectedOption: option.optional(),
    questionAttemptId: rid.optional(),
    updatedAt: stamp,
  })
  .strict();
const session = z
  .object({
    contentVersion: z.string().min(1).optional(),
    id: rid,
    set: z.enum(["chapter", "mock"]),
    questionIds: z.array(qid),
    answers: z.record(qid, option),
    submittedQuestionIds: z.array(qid),
    index: z.number().int().nonnegative(),
    createdAt: stamp,
    submittedAt: stamp.optional(),
    correctCount: z.number().int().min(0).max(75).optional(),
    timed: z.boolean().optional(),
    startedAt: stamp.optional(),
  })
  .strict();
const caseDraft = z
  .object({
    caseId: cid,
    id: rid,
    answers: strings,
    checks,
    revealed: z.boolean(),
    updatedAt: stamp,
  })
  .strict();
const essay = z
  .object({
    essayId: eid,
    projectId: rid.optional(),
    outline: z.string(),
    body: z.string(),
    checks,
    updatedAt: stamp,
  })
  .strict();
const project = z
  .object({
    id: rid,
    name: z.string(),
    background: z.string(),
    role: z.string(),
    decisions: z.string(),
    problems: z.string(),
    results: z.string(),
    reflection: z.string(),
    updatedAt: stamp,
  })
  .strict();
const settings = z
  .object({
    id: z.literal("settings"),
    studyStartDate: z.string().refine((s) => {
      try {
        dateOrdinal(s);
        return true;
      } catch {
        return false;
      }
    }),
    dayOverrides: z.record(kid, z.number().int().min(1).max(7)),
  })
  .strict();
const schema = z
  .object({
    app: z.literal("ruankao-system-analyst"),
    schemaVersion: z.literal(2),
    contentVersion: z.string().min(1),
    exportedAt: stamp,
    data: z
      .object({
        settings: z.array(settings).max(1),
        cards: z.array(card),
        cardAttempts: z.array(cardAttempt),
        questionAttempts: z.array(questionAttempt),
        learningDrafts: z.array(learningDraft),
        sessions: z.array(session),
        bookmarks: z.array(
          z.object({ questionId: qid, createdAt: stamp }).strict(),
        ),
        caseDrafts: z.array(caseDraft),
        caseAttempts: z.array(
          caseDraft
            .extend({
              contentVersion: z.string().min(1).optional(),
              selfScore: z.number().int().min(0).max(25),
              createdAt: stamp,
            })
            .strict(),
        ),
        essayDrafts: z.array(essay),
        projects: z.array(project),
        exams: z.array(
          z
            .object({
              id: rid,
              sessionId: rid,
              caseIds: z.array(cid).length(3),
              essayId: eid,
              caseAttemptIds: z.record(cid, rid),
              essaySubmittedAt: stamp.optional(),
              essaySnapshot: essay.optional(),
              createdAt: stamp,
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();
export type Backup = z.infer<typeof schema>;
export const tableNames = [
  "settings",
  "cards",
  "cardAttempts",
  "questionAttempts",
  "learningDrafts",
  "sessions",
  "bookmarks",
  "caseDrafts",
  "caseAttempts",
  "essayDrafts",
  "projects",
  "exams",
] as const;
function requireValid(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`备份校验失败：${message}，原数据未改动。`);
}
export function validateBackup(input: unknown): Backup {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new Error(
      "备份格式、版本或字段无效，请选择本应用导出的 schemaVersion 2 JSON；原数据未改动。",
    );
  const b = result.data,
    d = b.data;
  for (const name of tableNames) {
    const key =
      name === "settings"
        ? "id"
        : name === "cards" || name === "learningDrafts"
          ? "cardId"
          : name === "bookmarks"
            ? "questionId"
            : name === "caseDrafts"
              ? "caseId"
              : name === "essayDrafts"
                ? "essayId"
                : "id";
    const rows = d[name] as unknown as Record<string, unknown>[];
    requireValid(
      new Set(rows.map((r) => r[key])).size === rows.length,
      `${name} 存在重复ID`,
    );
  }
  for (const rows of [d.cardAttempts, d.questionAttempts])
    requireValid(
      new Set(rows.map((r) => r.order)).size === rows.length,
      "尝试提交序号重复",
    );
  const qa = new Map(d.questionAttempts.map((a) => [a.id, a])),
    projects = new Set(d.projects.map((p) => p.id));
  for (const a of d.questionAttempts) {
    const q = content.questions.find((q) => q.id === a.questionId)!;
    requireValid(
      a.set === q.set &&
        (a.contentVersion !== content.contentVersion ||
          a.correct === (a.selectedOption === q.answer)),
      "试题归属或成绩不一致",
    );
  }
  for (const p of d.cards) {
    requireValid(
      p.status === "learning" || p.firstPassAt,
      "掌握状态缺少首轮记录",
    );
    if (p.status === "consolidated")
      requireValid(
        p.firstPassAt &&
          p.consolidatedAt &&
          Date.parse(p.consolidatedAt) - Date.parse(p.firstPassAt) >= 86400000,
        "巩固掌握不足24小时",
      );
    else requireValid(!p.consolidatedAt, "非巩固状态包含巩固时间");
  }
  for (const a of [...d.cardAttempts, ...d.learningDrafts]) {
    const k = content.knowledge.find((k) => k.id === a.cardId)!;
    requireValid(
      a.contentVersion !== content.contentVersion ||
        a.checks.length === 0 ||
        a.checks.length === recallPoints(k).length,
      "自检要点数量异常",
    );
    if (a.questionAttemptId) {
      const q = qa.get(a.questionAttemptId);
      requireValid(
        q &&
          (a.contentVersion !== content.contentVersion ||
            k.relatedQuestionIds.includes(q.questionId)),
        "知识尝试引用不可信或缺失题目记录",
      );
    }
  }
  for (const s of d.sessions) {
    requireValid(
      new Set(s.questionIds).size === s.questionIds.length,
      "试卷题号重复",
    );
    requireValid(
      new Set(s.submittedQuestionIds).size === s.submittedQuestionIds.length,
      "重复交卷题号",
    );
    requireValid(
      s.index < Math.max(1, s.questionIds.length),
      "试卷导航超出题目范围",
    );
    requireValid(
      Object.keys(s.answers).every((id) => s.questionIds.includes(id)) &&
        s.submittedQuestionIds.every((id) => s.questionIds.includes(id)),
      "答案引用试卷外题目",
    );
    if (s.set === "mock") {
      requireValid(
        s.questionIds.length === 75 &&
          s.questionIds.every(
            (id) => content.questions.find((q) => q.id === id)?.set === "mock",
          ),
        "模考混入章节题或题目不全",
      );
      requireValid(
        s.submittedAt
          ? (s.contentVersion !== content.contentVersion
              ? typeof s.correctCount === "number"
              : s.correctCount === mockScore(s.answers)) &&
              s.submittedQuestionIds.length === 75
          : s.correctCount === undefined && s.submittedQuestionIds.length === 0,
        "模考交卷与成绩状态异常",
      );
    }
  }
  for (const a of [...d.caseDrafts, ...d.caseAttempts]) {
    const c = content.cases.find((c) => c.id === a.caseId)!;
    requireValid(
      Object.keys(a.answers).every((id) =>
        c.questions.some((q) => q.id === id),
      ) &&
        Object.keys(a.checks).every((id) =>
          c.questions.some((q) => q.scoringRubric.some((r) => r.id === id)),
        ),
      "案例答案或采分点引用错误",
    );
    if ("selfScore" in a)
      requireValid(
        a.revealed &&
          c.questions.every((q) => a.answers[q.id]?.trim()) &&
          (!("contentVersion" in a) ||
            a.contentVersion !== content.contentVersion ||
            a.selfScore === caseScore(a.caseId, a.checks)),
        "案例自评分与原文不一致",
      );
  }
  for (const e of [
    ...d.essayDrafts,
    ...d.exams.flatMap((e) => (e.essaySnapshot ? [e.essaySnapshot] : [])),
  ]) {
    requireValid(
      !e.projectId || projects.has(e.projectId),
      "论文引用的项目素材缺失",
    );
    requireValid(
      Object.keys(e.checks).every((id) =>
        content.essayGuide.selfChecks.some((c) => c.dimension === id),
      ),
      "论文自查字段异常",
    );
  }
  for (const e of d.exams) {
    const s = d.sessions.find((s) => s.id === e.sessionId);
    requireValid(
      s && s.set === "mock" && new Set(e.caseIds).size === 3,
      "模考试卷或案例引用异常",
    );
    for (const [cid, aid] of Object.entries(e.caseAttemptIds))
      requireValid(
        s.submittedAt &&
          e.caseIds.includes(cid) &&
          d.caseAttempts.some((a) => a.id === aid && a.caseId === cid),
        "模考案例记录引用异常",
      );
    requireValid(
      !!e.essaySubmittedAt === !!e.essaySnapshot,
      "模考论文快照缺失",
    );
    if (e.essaySnapshot)
      requireValid(
        e.essaySnapshot.essayId === e.essayId &&
          e.essaySnapshot.body.trim() &&
          e.essaySnapshot.outline.trim() &&
          e.caseIds.every((cid) => e.caseAttemptIds[cid]) &&
          content.essayGuide.selfChecks.every(
            (c) => e.essaySnapshot!.checks[c.dimension],
          ),
        "模考论文未完成前序训练或自查",
      );
  }
  return b;
}
export async function exportBackup(): Promise<Backup> {
  const data = await db.transaction("r", db.tables, async () =>
    Object.fromEntries(
      await Promise.all(
        tableNames.map(async (name) => [name, await db.table(name).toArray()]),
      ),
    ),
  );
  return validateBackup({
    app: "ruankao-system-analyst",
    schemaVersion: 2,
    contentVersion: content.contentVersion,
    exportedAt: new Date().toISOString(),
    data,
  });
}
export async function restoreBackup(input: unknown) {
  const backup = validateBackup(input);
  await db.transaction("rw", db.tables, async () => {
    for (const name of tableNames) {
      await db.table(name).clear();
      await db.table(name).bulkPut(backup.data[name]);
    }
  });
}
export async function clearUserData() {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}
