import type { PracticeSession } from "../storage/db";

/** The same rule is used by UI reads and transactional single-question writes. */
export function mockQuestionAccess(sessions: readonly PracticeSession[], questionId: string) {
  const containing = sessions.filter((s) => s.set === "mock" && s.questionIds.includes(questionId));
  if (containing.some((s) => !s.submittedAt)) return "active-paper" as const;
  return containing.some((s) => !!s.submittedAt) ? "review" as const : "not-submitted" as const;
}

export function mockKindLabel(session: PracticeSession | undefined) {
  return session?.mockKind === "first-independent" ? "首次独立模考"
    : session?.mockKind === "same-paper-practice" ? "同卷复练"
    : "历史训练 · 验证类型未记录";
}
