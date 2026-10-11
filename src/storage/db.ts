import Dexie, { type Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { content } from "../data/content";
import {
  defaultSettings,
  evaluateMastery,
  type CardProgress,
  type Settings,
} from "../domain/study";
import type { Question } from "../domain/content-schema";
import type {
  CaseDraft,
  CaseAttempt,
  EssayDraft,
  ProjectFacts,
  ExamRun,
} from "../domain/training";
export type QuestionAttempt = {
  contentVersion?: string;
  id: string;
  questionId: string;
  set: "chapter" | "mock";
  selectedOption: string;
  correct: boolean;
  submittedAt: string;
  order: number;
};
export type CardAttempt = {
  contentVersion?: string;
  id: string;
  cardId: string;
  recall: string;
  checks: boolean[];
  questionAttemptId?: string;
  passed: boolean;
  createdAt: string;
  kind: "first" | "review";
  order: number;
};
export type LearningDraft = {
  contentVersion?: string;
  cardId: string;
  phase: "read" | "recall" | "check";
  recall: string;
  checks: boolean[];
  questionId?: string;
  selectedOption?: string;
  questionAttemptId?: string;
  updatedAt: string;
};
export type PracticeSession = {
  contentVersion?: string;
  id: string;
  set: "chapter" | "mock";
  questionIds: string[];
  answers: Record<string, string>;
  submittedQuestionIds: string[];
  index: number;
  createdAt: string;
  submittedAt?: string;
  correctCount?: number;
  timed?: boolean;
  startedAt?: string;
};
export type Bookmark = { questionId: string; createdAt: string };
export class StudyDB extends Dexie {
  settings!: Table<Settings, string>;
  cards!: Table<CardProgress, string>;
  cardAttempts!: Table<CardAttempt, string>;
  questionAttempts!: Table<QuestionAttempt, string>;
  learningDrafts!: Table<LearningDraft, string>;
  sessions!: Table<PracticeSession, string>;
  bookmarks!: Table<Bookmark, string>;
  caseDrafts!: Table<CaseDraft, string>;
  caseAttempts!: Table<CaseAttempt, string>;
  essayDrafts!: Table<EssayDraft, string>;
  projects!: Table<ProjectFacts, string>;
  exams!: Table<ExamRun, string>;
  constructor(name = "ruankao-system-analyst") {
    super(name);
    this.version(1).stores({
      settings: "id",
      cards: "cardId,status,reviewDueAt",
      cardAttempts: "id,cardId,createdAt,order",
      questionAttempts: "id,questionId,set,submittedAt,order",
      learningDrafts: "cardId",
      sessions: "id,set",
      bookmarks: "questionId",
    });
    this.version(2).stores({
      caseDrafts: "caseId",
      caseAttempts: "id,caseId,createdAt",
      essayDrafts: "essayId",
      projects: "id",
      exams: "id,createdAt",
    });
  }
}
export const db = new StudyDB();
export function useStudyData() {
  return useLiveQuery(async () => {
    const [
      settings,
      cards,
      cardAttempts,
      questionAttempts,
      sessions,
      bookmarks,
    ] = await Promise.all([
      db.settings.get("settings"),
      db.cards.toArray(),
      db.cardAttempts.toArray(),
      db.questionAttempts.toArray(),
      db.sessions.toArray(),
      db.bookmarks.toArray(),
    ]);
    return {
      settings: settings ?? defaultSettings,
      cards,
      cardAttempts,
      questionAttempts,
      sessions,
      bookmarks,
    };
  }, []);
}
export async function beginCard(cardId: string) {
  await db.transaction("rw", db.cards, async () => {
    if (!(await db.cards.get(cardId)))
      await db.cards.put({
        cardId,
        status: "learning",
        updatedAt: new Date().toISOString(),
      });
  });
}
export async function patchLearningDraft(
  cardId: string,
  patch: Partial<LearningDraft>,
) {
  return db.transaction("rw", db.learningDrafts, async () => {
    const old = await db.learningDrafts.get(cardId);
    await db.learningDrafts.put({
      phase: "read",
      recall: "",
      checks: [],
      ...old,
      ...patch,
      cardId,
      contentVersion:
        patch.contentVersion ??
        old?.contentVersion ??
        (!old ? content.contentVersion : undefined),
      updatedAt: new Date().toISOString(),
    });
  });
}
export async function toggleRecallCheck(
  cardId: string,
  index: number,
  checked: boolean,
) {
  await db.transaction("rw", db.learningDrafts, async () => {
    const d = await db.learningDrafts.get(cardId);
    if (!d) return;
    const checks = [...d.checks];
    checks[index] = checked;
    await db.learningDrafts.put({
      ...d,
      checks,
      updatedAt: new Date().toISOString(),
    });
  });
}
export function recordId() {
  return (
    globalThis.crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Array.from(
      globalThis.crypto.getRandomValues(new Uint32Array(4)),
    )
      .map((n) => n.toString(16))
      .join("-")}`
  );
}
export async function submitQuestion(
  q: Question,
  selectedOption: string,
): Promise<QuestionAttempt> {
  if (!["A", "B", "C", "D"].includes(selectedOption))
    throw new Error("请选择一个选项");
  const attempt: QuestionAttempt = {
    contentVersion: content.contentVersion,
    id: recordId(),
    questionId: q.id,
    set: q.set,
    selectedOption,
    correct: selectedOption === q.answer,
    submittedAt: new Date().toISOString(),
    order: 0,
  };
  await db.transaction(
    "rw",
    db.questionAttempts,
    db.cards,
    db.sessions,
    async () => {
      if (
        q.set === "mock" &&
        !(await db.sessions
          .where("set")
          .equals("mock")
          .filter((s) => !!s.submittedAt && s.questionIds.includes(q.id))
          .first())
      )
        throw new Error("模考题须整卷交卷后才能单题重练。");
      attempt.order =
        ((await db.questionAttempts.orderBy("order").last())?.order ?? 0) + 1;
      await db.questionAttempts.add(attempt);
      if (!attempt.correct)
        for (const cardId of q.relatedKnowledgeIds) {
          const p = await db.cards.get(cardId);
          if (p?.firstPassAt)
            await db.cards.put({
              ...p,
              status: "needs-review",
              consolidatedAt: undefined,
              reviewDueAt: attempt.submittedAt,
              updatedAt: attempt.submittedAt,
            });
        }
    },
  );
  return attempt;
}
export async function validateCard(cardId: string) {
  const card = content.knowledge.find((k) => k.id === cardId);
  if (!card) throw new Error("知识点不存在");
  return db.transaction(
    "rw",
    db.cards,
    db.cardAttempts,
    db.learningDrafts,
    db.questionAttempts,
    async () => {
      const draft = await db.learningDrafts.get(cardId);
      if (!draft || draft.phase !== "check")
        throw new Error("请先完成闭卷回答并揭示关键点");
      if (
        draft.contentVersion &&
        draft.contentVersion !== content.contentVersion
      )
        throw new Error(
          "资料版本已更新，请返回概念并重新进行本次闭卷自测；掌握历史保留。",
        );
      const previous = await db.cards.get(cardId),
        question = draft.questionAttemptId
          ? await db.questionAttempts.get(draft.questionAttemptId)
          : undefined;
      const questionCorrect =
        !!question?.correct &&
        card.relatedQuestionIds.includes(question.questionId) &&
        !!draft.questionId &&
        question.questionId === draft.questionId;
      const progress = evaluateMastery(card, previous, {
        recall: draft.recall,
        checks: draft.checks,
        questionCorrect,
      });
      const passed =
        progress.status === "initial" || progress.status === "consolidated";
      await db.cards.put(progress);
      await db.cardAttempts.add({
        contentVersion: content.contentVersion,
        id: recordId(),
        cardId,
        recall: draft.recall,
        checks: draft.checks,
        questionAttemptId: draft.questionAttemptId,
        passed,
        createdAt: new Date().toISOString(),
        kind: previous?.firstPassAt ? "review" : "first",
        order:
          ((await db.cardAttempts.orderBy("order").last())?.order ?? 0) + 1,
      });
      await db.learningDrafts.delete(cardId);
      return { progress, passed };
    },
  );
}
export function unresolvedWrong(attempts: QuestionAttempt[]) {
  const sorted = [...attempts].sort((a, b) => a.order - b.order);
  const wrong = new Map<string, QuestionAttempt>();
  for (const a of sorted) {
    if (!a.correct) wrong.set(a.questionId, a);
    else wrong.delete(a.questionId);
  }
  return [...wrong.keys()];
}
