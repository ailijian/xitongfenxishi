import { content } from "../data/content";
export type CaseDraft = {
  caseId: string;
  id: string;
  answers: Record<string, string>;
  checks: Record<string, boolean>;
  revealed: boolean;
  updatedAt: string;
};
export type CaseAttempt = CaseDraft & {
  contentVersion?: string;
  selfScore: number;
  createdAt: string;
};
export type ProjectFacts = {
  id: string;
  name: string;
  background: string;
  role: string;
  decisions: string;
  problems: string;
  results: string;
  reflection: string;
  updatedAt: string;
};
export type EssayDraft = {
  essayId: string;
  projectId?: string;
  outline: string;
  body: string;
  checks: Record<string, boolean>;
  updatedAt: string;
};
export type ExamRun = {
  id: string;
  sessionId: string;
  caseIds: string[];
  essayId: string;
  caseAttemptIds: Record<string, string>;
  essaySubmittedAt?: string;
  essaySnapshot?: EssayDraft;
  createdAt: string;
};
export function caseScore(caseId: string, checks: Record<string, boolean>) {
  const c = content.cases.find((c) => c.id === caseId);
  if (!c) throw new Error("案例不存在");
  return c.questions
    .flatMap((q) => q.scoringRubric)
    .reduce((sum, r) => sum + (checks[r.id] ? r.points : 0), 0);
}
export function characterCount(text: string) {
  return Array.from(text.replace(/\s/g, "")).length;
}
export function mockScore(answers: Record<string, string>) {
  return content.questions.filter(
    (q) => q.set === "mock" && answers[q.id] === q.answer,
  ).length;
}
export function essayText(draft: EssayDraft, markdown = false) {
  const e = content.essays.find((e) => e.id === draft.essayId)!;
  return `${markdown ? "# " : ""}${e.title}\n\n${markdown ? "## " : ""}提纲\n${draft.outline}\n\n${markdown ? "## " : ""}正文\n${draft.body}\n`;
}
