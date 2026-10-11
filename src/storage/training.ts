import { db, recordId, submitQuestion, type PracticeSession } from "./db";
import { content } from "../data/content";
import {
  caseScore,
  mockScore,
  type CaseDraft,
  type EssayDraft,
  type ProjectFacts,
} from "../domain/training";
const now = () => new Date().toISOString();
export async function ensureCase(caseId: string) {
  await db.transaction("rw", db.caseDrafts, async () => {
    if (!(await db.caseDrafts.get(caseId)))
      await db.caseDrafts.add({
        caseId,
        id: recordId(),
        answers: {},
        checks: {},
        revealed: false,
        updatedAt: now(),
      });
  });
}
export async function patchCase(
  caseId: string,
  group: "answers" | "checks",
  key: string,
  value: string | boolean,
) {
  await db.transaction("rw", db.caseDrafts, async () => {
    const d = await db.caseDrafts.get(caseId);
    if (!d) throw new Error("草稿尚未载入");
    await db.caseDrafts.put({
      ...d,
      [group]: { ...d[group], [key]: value },
      updatedAt: now(),
    });
  });
}
export async function revealCase(caseId: string) {
  await db.transaction("rw", db.caseDrafts, async () => {
    const d = await db.caseDrafts.get(caseId),
      c = content.cases.find((c) => c.id === caseId)!;
    if (!d || !c.questions.every((q) => d.answers[q.id]?.trim()))
      throw new Error("请先独立回答全部三个分问。");
    await db.caseDrafts.put({ ...d, revealed: true, updatedAt: now() });
  });
}
export async function saveCase(caseId: string, examId?: string) {
  return db.transaction(
    "rw",
    db.caseDrafts,
    db.caseAttempts,
    db.exams,
    db.sessions,
    async () => {
      const d = await db.caseDrafts.get(caseId),
        c = content.cases.find((c) => c.id === caseId)!;
      if (!d?.revealed || !c.questions.every((q) => d.answers[q.id]?.trim()))
        throw new Error("请完成作答与采分自评。");
      const attempt = {
        ...d,
        contentVersion: content.contentVersion,
        id: recordId(),
        selfScore: caseScore(caseId, d.checks),
        createdAt: now(),
      };
      await db.caseAttempts.add(attempt);
      if (examId) {
        const exam = await db.exams.get(examId);
        if (!exam || !exam.caseIds.includes(caseId))
          throw new Error("本场模考不包含该案例");
        if (exam.essaySubmittedAt)
          throw new Error(
            "本场模考已完成，请独立训练或新建模考，完成记录保留。",
          );
        const session = await db.sessions.get(exam.sessionId);
        if (!session?.submittedAt) throw new Error("请先提交模考选择卷");
        await db.exams.put({
          ...exam,
          caseAttemptIds: { ...exam.caseAttemptIds, [caseId]: attempt.id },
        });
      }
      return attempt;
    },
  );
}
export async function ensureEssay(essayId: string) {
  await db.transaction("rw", db.essayDrafts, async () => {
    if (!(await db.essayDrafts.get(essayId)))
      await db.essayDrafts.add({
        essayId,
        outline: "",
        body: "",
        checks: {},
        updatedAt: now(),
      });
  });
}
export async function patchEssay(essayId: string, patch: Partial<EssayDraft>) {
  await db.transaction("rw", db.essayDrafts, async () => {
    const d = await db.essayDrafts.get(essayId);
    if (!d) throw new Error("论文草稿尚未载入");
    await db.essayDrafts.put({ ...d, ...patch, essayId, updatedAt: now() });
  });
}
export async function checkEssay(essayId: string, key: string, value: boolean) {
  await db.transaction("rw", db.essayDrafts, async () => {
    const d = await db.essayDrafts.get(essayId);
    if (!d) throw new Error("论文草稿尚未载入");
    await db.essayDrafts.put({
      ...d,
      checks: { ...d.checks, [key]: value },
      updatedAt: now(),
    });
  });
}
export async function patchProject(id: string, patch: Partial<ProjectFacts>) {
  await db.transaction("rw", db.projects, async () => {
    const p = await db.projects.get(id);
    if (!p) throw new Error("项目素材不存在");
    await db.projects.put({ ...p, ...patch, id, updatedAt: now() });
  });
}
export async function startExam(
  caseIds: string[],
  essayId: string,
  timed: boolean,
) {
  if (
    caseIds.length !== 3 ||
    new Set(caseIds).size !== 3 ||
    !caseIds.every((id) => content.cases.some((c) => c.id === id))
  )
    throw new Error("请选择三套不同案例");
  if (!content.essays.some((e) => e.id === essayId))
    throw new Error("请选择论文专题");
  const id = recordId(),
    sessionId = `mock:${id}`;
  const s: PracticeSession = {
    contentVersion: content.contentVersion,
    id: sessionId,
    set: "mock",
    questionIds: content.questions
      .filter((q) => q.set === "mock")
      .map((q) => q.id),
    answers: {},
    submittedQuestionIds: [],
    index: 0,
    createdAt: now(),
    startedAt: now(),
    timed,
  };
  await db.transaction("rw", db.sessions, db.exams, async () => {
    await db.sessions.add(s);
    await db.exams.add({
      id,
      sessionId,
      caseIds,
      essayId,
      caseAttemptIds: {},
      createdAt: now(),
    });
  });
  return id;
}
export async function chooseMock(
  sessionId: string,
  questionId: string,
  option: string,
) {
  await db.transaction("rw", db.sessions, async () => {
    const s = await db.sessions.get(sessionId);
    if (
      !s ||
      s.set !== "mock" ||
      s.submittedAt ||
      !s.questionIds.includes(questionId) ||
      !["A", "B", "C", "D"].includes(option)
    )
      throw new Error("试卷已提交或选项无效");
    await db.sessions.put({
      ...s,
      answers: { ...s.answers, [questionId]: option },
    });
  });
}
export async function submitMock(sessionId: string) {
  return db.transaction(
    "rw",
    db.sessions,
    db.questionAttempts,
    db.cards,
    async () => {
      const s = await db.sessions.get(sessionId);
      if (!s || s.set !== "mock" || s.questionIds.length !== 75)
        throw new Error("试卷无效");
      if (s.submittedAt) return s;
      const result = {
        ...s,
        contentVersion: content.contentVersion,
        submittedAt: now(),
        submittedQuestionIds: s.questionIds,
        correctCount: mockScore(s.answers),
      };
      await db.sessions.put(result);
      for (const id of s.questionIds) {
        const q = content.questions.find((q) => q.id === id)!;
        if (s.answers[id]) await submitQuestion(q, s.answers[id]);
      }
      return result;
    },
  );
}
export async function submitExamEssay(examId: string) {
  await db.transaction(
    "rw",
    db.exams,
    db.essayDrafts,
    db.sessions,
    async () => {
      const e = await db.exams.get(examId);
      if (!e) throw new Error("模考记录不存在");
      if (e.essaySubmittedAt) return;
      if (
        !(await db.sessions.get(e.sessionId))?.submittedAt ||
        e.caseIds.some((id) => !e.caseAttemptIds[id])
      )
        throw new Error("请先交选择卷并完成三套案例自评");
      const d = await db.essayDrafts.get(e.essayId);
      if (
        !d?.body.trim() ||
        !d.outline.trim() ||
        !content.essayGuide.selfChecks.every((c) => d.checks[c.dimension])
      )
        throw new Error("请填写提纲和正文，并完成六项写作自查后提交。");
      await db.exams.put({
        ...e,
        essaySubmittedAt: now(),
        essaySnapshot: structuredClone(d),
      });
    },
  );
}
